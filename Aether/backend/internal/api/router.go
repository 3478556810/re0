package api

import (
	"database/sql"
	"net/http"

	"aether/internal/cache"
	"aether/internal/embedding"
)

// Router sets up HTTP routes for the Aether API.
type Router struct {
	mux *http.ServeMux
}

// NewRouter creates a new Router with all routes registered.
func NewRouter(db *sql.DB, embedder *embedding.Embedder, c *cache.Cache, alpha float64) *Router {
	r := &Router{mux: http.NewServeMux()}

	// Document upload handler
	docHandler := NewDocumentHandler(db, embedder)

	// Search handler
	searchHandler := NewSearchHandler(db, embedder, c, alpha)

	// ---- 核心修改：为 /api/search 创建一个分发器 ----
	// 根据 HTTP 方法决定调用哪个 handler
	r.mux.HandleFunc("/api/search", func(w http.ResponseWriter, req *http.Request) {
		if req.Method == http.MethodGet {
			searchHandler.HandleSearchParams(w, req)
		} else if req.Method == http.MethodPost {
			searchHandler.HandleSearch(w, req)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	// 可选：保留 /search 作为别名（同样分发）
	r.mux.HandleFunc("/search", func(w http.ResponseWriter, req *http.Request) {
		if req.Method == http.MethodGet {
			searchHandler.HandleSearchParams(w, req)
		} else if req.Method == http.MethodPost {
			searchHandler.HandleSearch(w, req)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	// 文档上传（只需要 POST）
	r.mux.HandleFunc("/document/upload", docHandler.HandleUpload)
	r.mux.HandleFunc("/api/document/upload", docHandler.HandleUpload)

	// 健康检查
	r.mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"aether"}`))
	})
	r.mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"aether"}`))
	})

	return r
}

// ServeHTTP implements the http.Handler interface.
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	// Enable CORS for frontend requests
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	r.mux.ServeHTTP(w, req)
}
