// Package embedding provides mock embedding generation and random projection
// for dimensionality reduction (1536 -> 512).
package embedding

import (
	"math"
	"math/rand"
	"sync"
)

// Embedder handles embedding generation and dimensionality reduction.
// In production, replace MockEmbed with a local ONNX runtime calling
// sentence-transformers/all-MiniLM-L6-v2 or similar.
type Embedder struct {
	mu sync.RWMutex
	// randomProjection is a 1536x512 matrix for Gaussian random projection
	randomProjection [][]float64
	dimIn            int
	dimOut           int
}

// NewEmbedder creates a new Embedder with a random projection matrix (1536→512).
func NewEmbedder() *Embedder {
	dimIn := 1536
	dimOut := 512

	// seed for reproducibility
	rng := rand.New(rand.NewSource(42))
	proj := make([][]float64, dimOut)
	for i := range proj {
		proj[i] = make([]float64, dimIn)
		for j := range proj[i] {
			// Gaussian distribution with mean=0, std=1/sqrt(dimOut)
			proj[i][j] = rng.NormFloat64() * (1.0 / math.Sqrt(float64(dimOut)))
		}
	}

	return &Embedder{
		randomProjection: proj,
		dimIn:            dimIn,
		dimOut:           dimOut,
	}
}

// MockEmbed generates a mock 1536-dimensional vector from the input text.
// In a real implementation, replace this with ONNX inference or a remote API call.
func (e *Embedder) MockEmbed(text string) []float64 {
	// Simple hash-based mock: produce a deterministic 1536-d vector
	vec := make([]float64, e.dimIn)
	h := hashString(text)
	for i := 0; i < e.dimIn; i++ {
		// pseudo-random but deterministic
		val := float64((h*int64(i+1)+int64(i*31))%1000) / 1000.0
		vec[i] = val*2 - 1 // range [-1, 1)
	}
	return vec
}

// Reduce applies random projection to reduce a 1536-d vector to 512-d.
func (e *Embedder) Reduce(highDim []float64) []float64 {
	if len(highDim) != e.dimIn {
		// fallback: if dimension mismatch, pad/truncate
		padded := make([]float64, e.dimIn)
		for i := 0; i < len(highDim) && i < e.dimIn; i++ {
			padded[i] = highDim[i]
		}
		highDim = padded
	}

	e.mu.RLock()
	defer e.mu.RUnlock()

	lowDim := make([]float64, e.dimOut)
	for i := 0; i < e.dimOut; i++ {
		var sum float64
		for j := 0; j < e.dimIn; j++ {
			sum += e.randomProjection[i][j] * highDim[j]
		}
		lowDim[i] = sum
	}
	return lowDim
}

// EmbedAndReduce combines MockEmbed + Reduce in one call.
func (e *Embedder) EmbedAndReduce(text string) []float64 {
	high := e.MockEmbed(text)
	return e.Reduce(high)
}

// CosineSimilarity computes cosine similarity between two vectors.
func CosineSimilarity(a, b []float64) float64 {
	if len(a) != len(b) {
		return 0
	}
	var dot, normA, normB float64
	for i := 0; i < len(a); i++ {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

// CosineDistance returns 1 - cosine_similarity.
func CosineDistance(a, b []float64) float64 {
	return 1.0 - CosineSimilarity(a, b)
}

func hashString(s string) int64 {
	var h int64 = 5381
	for _, c := range s {
		h = ((h << 5) + h) + int64(c)
	}
	return h
}
