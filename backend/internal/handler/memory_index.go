package handler

import (
	"encoding/json"
	"os"
	"sort"
	"sync"
)

// MemoryIndex 网状记忆索引
type MemoryIndex struct {
	mu       sync.Mutex
	filePath string
	// 关键词 → 记忆ID列表 的倒排索引
	KeywordToIDs map[string][]string `json:"keyword_to_ids"`
	// 记忆ID → 关键词列表
	IDToKeywords map[string][]string `json:"id_to_keywords"`
}

// NewMemoryIndex 创建或加载索引
func NewMemoryIndex(path string) *MemoryIndex {
	idx := &MemoryIndex{
		filePath:     path,
		KeywordToIDs: make(map[string][]string),
		IDToKeywords: make(map[string][]string),
	}

	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, idx)
	}
	return idx
}

// Add 向索引中添加记忆的关键词
func (idx *MemoryIndex) Add(memoryID string, keywords []string) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	idx.IDToKeywords[memoryID] = keywords
	for _, kw := range keywords {
		idx.KeywordToIDs[kw] = append(idx.KeywordToIDs[kw], memoryID)
	}
}

// Search 根据关键词检索记忆ID，返回按匹配度排序的记忆ID列表
func (idx *MemoryIndex) Search(keywords []string, limit int) []string {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	scores := make(map[string]int)
	for _, kw := range keywords {
		if ids, ok := idx.KeywordToIDs[kw]; ok {
			for _, id := range ids {
				scores[id]++
			}
		}
	}

	// 按匹配度排序
	type scored struct {
		id    string
		score int
	}
	var sorted []scored
	for id, score := range scores {
		sorted = append(sorted, scored{id, score})
	}
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].score > sorted[j].score
	})

	if len(sorted) > limit {
		sorted = sorted[:limit]
	}

	var result []string
	for _, s := range sorted {
		result = append(result, s.id)
	}
	return result
}

// Save 持久化索引
func (idx *MemoryIndex) Save() error {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	data, err := json.MarshalIndent(idx, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(idx.filePath, data, 0644)
}
