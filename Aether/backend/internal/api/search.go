package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"aether/internal/cache"
	"aether/internal/embedding"
	"aether/internal/retrieval"
)

// SearchHandler handles search requests.
type SearchHandler struct {
	searcher *retrieval.HybridSearcher
}

// NewSearchHandler creates a new SearchHandler.
func NewSearchHandler(db *sql.DB, embedder *embedding.Embedder, c *cache.Cache, alpha float64) *SearchHandler {
	cfg := retrieval.DefaultHybridSearchConfig()
	if alpha > 0 {
		cfg.Alpha = alpha
	}
	searcher := retrieval.NewHybridSearcher(db, embedder, c, cfg)
	return &SearchHandler{searcher: searcher}
}

// HandleSearch handles POST /search requests.
// Body: { "query": "...", "top_k": 10 }
func (h *SearchHandler) HandleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req struct {
		Query string `json:"query"`
		TopK  int    `json:"top_k"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"invalid JSON: %s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	if req.Query == "" {
		http.Error(w, `{"error":"query is required"}`, http.StatusBadRequest)
		return
	}

	if req.TopK <= 0 || req.TopK > 100 {
		req.TopK = 10
	}

	results, err := h.searcher.Search(req.Query, req.TopK)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []retrieval.SearchResult{}
	}

	resp := map[string]interface{}{
		"query":   req.Query,
		"top_k":   req.TopK,
		"results": results,
		"total":   len(results),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// HandleSearchParams handles GET /search?q=...&top_k=10 requests.
func (h *SearchHandler) HandleSearchParams(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		query = r.URL.Query().Get("query")
	}
	if query == "" {
		http.Error(w, `{"error":"query parameter 'q' or 'query' is required"}`, http.StatusBadRequest)
		return
	}

	topK := 10
	if topKStr := r.URL.Query().Get("top_k"); topKStr != "" {
		if v, err := strconv.Atoi(topKStr); err == nil && v > 0 && v <= 100 {
			topK = v
		}
	}

	results, err := h.searcher.Search(query, topK)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []retrieval.SearchResult{}
	}

	resp := map[string]interface{}{
		"query":   query,
		"top_k":   topK,
		"results": results,
		"total":   len(results),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
