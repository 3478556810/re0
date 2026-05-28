// Package api provides HTTP handlers for document upload and search.
package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"aether/internal/embedding"
	"aether/internal/retrieval"

	_ "github.com/lib/pq"
)

// DocumentHandler handles document upload and processing.
type DocumentHandler struct {
	db       *sql.DB
	embedder *embedding.Embedder
	chunkCfg retrieval.ChunkConfig
}

// NewDocumentHandler creates a new DocumentHandler.
func NewDocumentHandler(db *sql.DB, embedder *embedding.Embedder) *DocumentHandler {
	return &DocumentHandler{
		db:       db,
		embedder: embedder,
		chunkCfg: retrieval.DefaultChunkConfig(),
	}
}

// UploadResponse is returned after a successful document upload.
type UploadResponse struct {
	DocumentID int    `json:"document_id"`
	Title      string `json:"title"`
	Chunks     int    `json:"chunks"`
	Message    string `json:"message"`
}

// HandleUpload processes a document upload (txt/md content).
// POST /document/upload
// Body: { "title": "...", "content": "..." }
// HandleUpload processes a document upload (multipart/form-data file).
// POST /document/upload
// Form field: "file" (the document file, .txt or .md)
func (h *DocumentHandler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// 1. Parse multipart form (max 32MB)
	err := r.ParseMultipartForm(32 << 20) // 32 MB
	if err != nil {
		sendJSONError(w, fmt.Sprintf("failed to parse form: %v", err), http.StatusBadRequest)
		return
	}

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		sendJSONError(w, "file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// 2. Read file content
	contentBytes, err := io.ReadAll(file)
	if err != nil {
		sendJSONError(w, fmt.Sprintf("failed to read file: %v", err), http.StatusBadRequest)
		return
	}
	content := string(contentBytes)

	// 3. Determine title: use file name without extension
	title := strings.TrimSuffix(fileHeader.Filename, ".md")
	title = strings.TrimSuffix(title, ".txt")
	if title == "" {
		title = "untitled"
	}

	// 4. Insert document
	var docID int
	err = h.db.QueryRow(
		`INSERT INTO documents (title, content, file_name) VALUES ($1, $2, $3) RETURNING id`,
		title, content, fileHeader.Filename,
	).Scan(&docID)
	if err != nil {
		sendJSONError(w, fmt.Sprintf("failed to insert document: %v", err), http.StatusInternalServerError)
		return
	}

	// 5. Chunk document
	chunks := retrieval.ChunkDocument(content, h.chunkCfg)

	// 6. Generate embeddings and insert chunks
	for _, chunk := range chunks {
		vec := h.embedder.EmbedAndReduce(chunk.Content)
		vecStr := vectorToPostgres(vec)

		_, err = h.db.Exec(
			`INSERT INTO chunks (document_id, chunk_index, content, embedding) VALUES ($1, $2, $3, $4::vector)`,
			docID, chunk.Index, chunk.Content, vecStr,
		)
		if err != nil {
			// Log error but continue with remaining chunks
			fmt.Printf("Warning: failed to insert chunk %d for document %d: %v\n", chunk.Index, docID, err)
		}
	}

	// 7. Return success response
	resp := UploadResponse{
		DocumentID: docID,
		Title:      title,
		Chunks:     len(chunks),
		Message:    fmt.Sprintf("Document processed: %d chunks created", len(chunks)),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// Helper: send JSON error response
func sendJSONError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// vectorToPostgresForSQL formats a float64 slice for PostgreSQL vector literal.
func vectorToPostgres(vec []float64) string {
	var sb strings.Builder
	sb.WriteByte('[')
	for i, v := range vec {
		if i > 0 {
			sb.WriteByte(',')
		}
		fmt.Fprintf(&sb, "%.8f", v)
	}
	sb.WriteByte(']')
	return sb.String()
}
