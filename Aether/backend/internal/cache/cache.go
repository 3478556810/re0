// Package cache implements an LRU query cache with vector approximate matching.
// Cache key: first 64 bits of the reduced vector hash.
// When a query vector has cosine similarity > 0.98 with any cached vector, it's
// considered a cache hit.
package cache

import (
	"container/list"
	"math"
	"sync"
)

// cacheEntry holds the cached vector and its corresponding search results.
type cacheEntry struct {
	key     uint64
	vector  []float64
	results []SearchResult
}

// SearchResult represents a single search result item.
type SearchResult struct {
	ChunkID    int     `json:"chunk_id"`
	DocumentID int     `json:"document_id"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Score      float64 `json:"score"`
}

// Cache provides an LRU cache with vector approximate matching.
type Cache struct {
	mu                  sync.RWMutex
	capacity            int
	ll                  *list.List               // LRU list
	items               map[uint64]*list.Element // key -> list element
	similarityThreshold float64                  // cosine similarity threshold for approximate match
}

// NewCache creates a new LRU cache with the given capacity.
// similarityThreshold defaults to 0.98 if <= 0.
func NewCache(capacity int, similarityThreshold float64) *Cache {
	if capacity <= 0 {
		capacity = 1000
	}
	if similarityThreshold <= 0 {
		similarityThreshold = 0.98
	}
	return &Cache{
		capacity:            capacity,
		ll:                  list.New(),
		items:               make(map[uint64]*list.Element),
		similarityThreshold: similarityThreshold,
	}
}

// hashVector produces a uint64 hash from a float64 slice (first 64 bits).
func hashVector(vec []float64) uint64 {
	var h uint64 = 14695981039346656037
	for _, v := range vec {
		b := math.Float64bits(v)
		h ^= b
		h *= 1099511628211
	}
	return h
}

// cosineSimilarity computes cosine similarity between two vectors.
func cosineSimilarity(a, b []float64) float64 {
	if len(a) != len(b) || len(a) == 0 {
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

// Get checks the cache for a matching query vector. Returns results and true if
// a match is found (exact key match or approximate similarity > threshold).
func (c *Cache) Get(queryVec []float64) ([]SearchResult, bool) {
	c.mu.RLock()
	key := hashVector(queryVec)

	// 1. Exact key match
	if elem, ok := c.items[key]; ok {
		entry := elem.Value.(*cacheEntry)
		c.mu.RUnlock()
		c.mu.Lock()
		c.ll.MoveToFront(elem) // promote to front
		c.mu.Unlock()
		return entry.results, true
	}

	// 2. Approximate match: scan all entries (capacity capped at 1000)
	for _, elem := range c.items {
		entry := elem.Value.(*cacheEntry)
		sim := cosineSimilarity(queryVec, entry.vector)
		if sim > c.similarityThreshold {
			c.mu.RUnlock()
			c.mu.Lock()
			c.ll.MoveToFront(elem) // promote to front
			c.mu.Unlock()
			return entry.results, true
		}
	}

	c.mu.RUnlock()
	return nil, false
}

// Set inserts a new entry into the cache. Evicts LRU if at capacity.
func (c *Cache) Set(queryVec []float64, results []SearchResult) {
	c.mu.Lock()
	defer c.mu.Unlock()

	key := hashVector(queryVec)

	// If key already exists, update and move to front
	if elem, ok := c.items[key]; ok {
		entry := elem.Value.(*cacheEntry)
		entry.vector = queryVec
		entry.results = results
		c.ll.MoveToFront(elem)
		return
	}

	// Evict if at capacity
	if c.ll.Len() >= c.capacity {
		back := c.ll.Back()
		if back != nil {
			entry := back.Value.(*cacheEntry)
			delete(c.items, entry.key)
			c.ll.Remove(back)
		}
	}

	// Insert new entry
	entry := &cacheEntry{
		key:     key,
		vector:  queryVec,
		results: results,
	}
	elem := c.ll.PushFront(entry)
	c.items[key] = elem
}

// Len returns the current number of cached entries.
func (c *Cache) Len() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.ll.Len()
}

// Clear empties the cache.
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.ll = list.New()
	c.items = make(map[uint64]*list.Element)
}
