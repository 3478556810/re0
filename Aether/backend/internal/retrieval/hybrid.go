// Package retrieval provides hybrid search (BM25 + vector cosine distance).
package retrieval

import (
	"database/sql"
	"fmt"
	"math"
	"strings"

	"aether/internal/cache"
	"aether/internal/embedding"
)

// HybridSearchConfig holds configuration for hybrid search.
type HybridSearchConfig struct {
	Alpha    float64 // weight for BM25 in final score (default 0.5)
	TopK     int     // number of results to return (default 10)
	EfSearch int     // HNSW ef_search parameter (default 40)
}

// DefaultHybridSearchConfig returns the default hybrid search config.
func DefaultHybridSearchConfig() HybridSearchConfig {
	return HybridSearchConfig{
		Alpha:    0.5,
		TopK:     10,
		EfSearch: 40,
	}
}

// HybridSearcher performs hybrid search combining BM25 keyword retrieval
// with pgvector cosine distance.
type HybridSearcher struct {
	db       *sql.DB
	embedder *embedding.Embedder
	cache    *cache.Cache
	cfg      HybridSearchConfig
}

// NewHybridSearcher creates a new HybridSearcher.
func NewHybridSearcher(db *sql.DB, embedder *embedding.Embedder, c *cache.Cache, cfg HybridSearchConfig) *HybridSearcher {
	return &HybridSearcher{
		db:       db,
		embedder: embedder,
		cache:    c,
		cfg:      cfg,
	}
}

// SearchResult represents a single search result from the hybrid search.
type SearchResult struct {
	ChunkID    int     `json:"chunk_id"`
	DocumentID int     `json:"document_id"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Score      float64 `json:"score"`
}

// Search performs a hybrid search: BM25 + vector cosine distance.
// Returns top-k results sorted by final_score = α * BM25_norm + (1-α) * (1 - cosine_distance).
func (s *HybridSearcher) Search(query string, topK int) ([]SearchResult, error) {
	if topK <= 0 {
		topK = s.cfg.TopK
	}

	// 1. Generate query vector and check cache
	queryVec := s.embedder.EmbedAndReduce(query)
	if cachedResults, ok := s.cache.Get(queryVec); ok {
		// Convert cache.SearchResult to retrieval.SearchResult
		results := make([]SearchResult, len(cachedResults))
		for i, cr := range cachedResults {
			results[i] = SearchResult{
				ChunkID:    cr.ChunkID,
				DocumentID: cr.DocumentID,
				Title:      cr.Title,
				Content:    cr.Content,
				Score:      cr.Score,
			}
		}
		if len(results) > topK {
			results = results[:topK]
		}
		return results, nil
	}

	// 2. Perform BM25 full-text search
	bm25Results, err := s.bm25Search(query, topK*2) // fetch more for fusion
	if err != nil {
		return nil, fmt.Errorf("BM25 search failed: %w", err)
	}

	// 3. Perform vector search
	vectorResults, err := s.vectorSearch(queryVec, topK*2) // fetch more for fusion
	if err != nil {
		return nil, fmt.Errorf("vector search failed: %w", err)
	}

	// 4. Fuse results using the alpha-weighted formula
	fused := s.fuseResults(bm25Results, vectorResults, topK)

	// 5. Store in cache (only if results exist)
	if len(fused) > 0 {
		cacheResults := make([]cache.SearchResult, len(fused))
		for i, r := range fused {
			cacheResults[i] = cache.SearchResult{
				ChunkID:    r.ChunkID,
				DocumentID: r.DocumentID,
				Title:      r.Title,
				Content:    r.Content,
				Score:      r.Score,
			}
		}
		s.cache.Set(queryVec, cacheResults)
	}

	return fused, nil
}

// bm25Search performs PostgreSQL full-text search (tsvector).
func (s *HybridSearcher) bm25Search(query string, limit int) ([]scoredResult, error) {
	sqlQuery := `
		SELECT c.id, c.document_id, d.title, c.content,
		       ts_rank(c.tsvector_content, plainto_tsquery('simple', $1)) AS rank
		FROM chunks c
		JOIN documents d ON d.id = c.document_id
		WHERE c.tsvector_content @@ plainto_tsquery('simple', $1)
		ORDER BY rank DESC
		LIMIT $2
	`

	rows, err := s.db.Query(sqlQuery, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []scoredResult
	for rows.Next() {
		var r scoredResult
		if err := rows.Scan(&r.ChunkID, &r.DocumentID, &r.Title, &r.Content, &r.Score); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

// vectorSearch performs vector cosine distance search via pgvector.
func (s *HybridSearcher) vectorSearch(queryVec []float64, limit int) ([]scoredResult, error) {
	// Convert vector to PostgreSQL format
	vecStr := vectorToPostgres(queryVec)

	// Set ef_search for this session
	if _, err := s.db.Exec(fmt.Sprintf("SET hnsw.ef_search = %d", s.cfg.EfSearch)); err != nil {
		return nil, err
	}

	sqlQuery := fmt.Sprintf(`
		SELECT c.id, c.document_id, d.title, c.content,
		       1 - (c.embedding <=> '%s'::vector) AS similarity
		FROM chunks c
		JOIN documents d ON d.id = c.document_id
		WHERE c.embedding IS NOT NULL
		ORDER BY c.embedding <=> '%s'::vector
		LIMIT $1
	`, vecStr, vecStr)

	rows, err := s.db.Query(sqlQuery, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []scoredResult
	for rows.Next() {
		var r scoredResult
		if err := rows.Scan(&r.ChunkID, &r.DocumentID, &r.Title, &r.Content, &r.Score); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

// scoredResult is an intermediate scored search result.
type scoredResult struct {
	ChunkID    int
	DocumentID int
	Title      string
	Content    string
	Score      float64
}

// scoredFusion holds a fusion entry with its computed final score.
type scoredFusion struct {
	chunkID     int
	documentID  int
	title       string
	content     string
	bm25Score   float64
	vectorScore float64
	final       float64
}

// fuseResults combines BM25 and vector results using the formula:
// final_score = α * BM25_norm + (1-α) * (1 - cosine_distance)
func (s *HybridSearcher) fuseResults(bm25Results, vectorResults []scoredResult, topK int) []SearchResult {
	// Normalize BM25 scores to [0, 1]
	bm25Norm := normalizeScores(bm25Results)
	vectorNorm := normalizeScores(vectorResults)

	// Build a map of chunkID -> normalized scores
	type fusionEntry struct {
		chunkID     int
		documentID  int
		title       string
		content     string
		bm25Score   float64
		vectorScore float64
	}

	fusionMap := make(map[int]*fusionEntry)

	for i, r := range bm25Results {
		fusionMap[r.ChunkID] = &fusionEntry{
			chunkID:     r.ChunkID,
			documentID:  r.DocumentID,
			title:       r.Title,
			content:     r.Content,
			bm25Score:   bm25Norm[i],
			vectorScore: 0,
		}
	}

	for i, r := range vectorResults {
		if entry, ok := fusionMap[r.ChunkID]; ok {
			entry.vectorScore = vectorNorm[i]
		} else {
			fusionMap[r.ChunkID] = &fusionEntry{
				chunkID:     r.ChunkID,
				documentID:  r.DocumentID,
				title:       r.Title,
				content:     r.Content,
				bm25Score:   0,
				vectorScore: vectorNorm[i],
			}
		}
	}

	// Compute final scores and sort
	var scoredList []scoredFusion
	for _, entry := range fusionMap {
		final := s.cfg.Alpha*entry.bm25Score + (1-s.cfg.Alpha)*entry.vectorScore
		scoredList = append(scoredList, scoredFusion{
			chunkID:     entry.chunkID,
			documentID:  entry.documentID,
			title:       entry.title,
			content:     entry.content,
			bm25Score:   entry.bm25Score,
			vectorScore: entry.vectorScore,
			final:       final,
		})
	}

	// Sort by final score descending
	sortByScore(scoredList)

	// Take topK
	if len(scoredList) > topK {
		scoredList = scoredList[:topK]
	}

	// Convert to SearchResult
	results := make([]SearchResult, len(scoredList))
	for i, sf := range scoredList {
		results[i] = SearchResult{
			ChunkID:    sf.chunkID,
			DocumentID: sf.documentID,
			Title:      sf.title,
			Content:    sf.content,
			Score:      math.Round(sf.final*10000) / 10000,
		}
	}

	return results
}

// normalizeScores normalizes scores to [0, 1] range.
// normalizeScores normalizes scores to [0, 1] range.
// If maxScore <= 0, all normalized scores are set to 0.
func normalizeScores(results []scoredResult) []float64 {
	if len(results) == 0 {
		return nil
	}

	// Find maximum score
	maxScore := results[0].Score
	for _, r := range results {
		if r.Score > maxScore {
			maxScore = r.Score
		}
	}

	// If maxScore is 0 or negative, we cannot scale positively.
	// Return all zeros because all scores are non-positive.
	if maxScore <= 0 {
		return make([]float64, len(results))
	}

	normalized := make([]float64, len(results))
	for i, r := range results {
		// Clamp negative scores to 0 before normalization
		s := r.Score
		if s < 0 {
			s = 0
		}
		normalized[i] = s / maxScore
	}
	return normalized
}

// sortByScore sorts scoredFusion entries by final score descending.
func sortByScore(list []scoredFusion) {
	n := len(list)
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			if list[j].final > list[i].final {
				list[i], list[j] = list[j], list[i]
			}
		}
	}
}

// vectorToPostgres converts a float64 slice to a PostgreSQL vector literal string.
func vectorToPostgres(vec []float64) string {
	parts := make([]string, len(vec))
	for i, v := range vec {
		parts[i] = fmt.Sprintf("%.8f", v)
	}
	return "[" + strings.Join(parts, ",") + "]"
}
