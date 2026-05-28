package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"aether/internal/api"
	"aether/internal/cache"
	"aether/internal/embedding"

	_ "github.com/lib/pq"
)

func main() {
	// Load configuration from environment variables
	cfg := loadConfig()

	// Connect to PostgreSQL
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to PostgreSQL successfully")

	// Initialize embedder (mock / random projection)
	embedder := embedding.NewEmbedder()

	// Initialize cache (LRU, 1000 entries, similarity threshold 0.98)
	c := cache.NewCache(1000, 0.98)

	// Create router
	router := api.NewRouter(db, embedder, c, cfg.Alpha)

	// Start HTTP server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Starting Aether API server on %s\n", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// Config holds application configuration.
type Config struct {
	Port       string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	Alpha      float64
}

func loadConfig() Config {
	alpha := 0.5
	if alphaStr := os.Getenv("ALPHA"); alphaStr != "" {
		if v, err := strconv.ParseFloat(alphaStr, 64); err == nil && v >= 0 && v <= 1 {
			alpha = v
		}
	}

	return Config{
		Port:       getEnv("PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "aether"),
		DBPassword: getEnv("DB_PASSWORD", "aether_secret"),
		DBName:     getEnv("DB_NAME", "aether"),
		Alpha:      alpha,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
