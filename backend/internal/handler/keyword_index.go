// internal/handler/keyword_index.go
package handler

import (
	"encoding/json"
	"os"
	"sync"
)

// MemoryIndex 关键词倒排索引：keyword → memoryID[]
type MemoryIndex struct {
	mu          sync.Mutex
	filePath    string
	KeywordToID map[string][]string `json:"keyword_to_id"`
}

// NewMemoryIndex 创建或加载索引
func NewMemoryIndex(path string) *MemoryIndex {
	idx := &MemoryIndex{
		filePath:    path,
		KeywordToID: make(map[string][]string),
	}
	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, &idx.KeywordToID)
	}
	return idx
}

// Add 添加一条记忆的关键词映射
func (idx *MemoryIndex) Add(memoryID string, keywords []string) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	for _, kw := range keywords {
		if !contains(idx.KeywordToID[kw], memoryID) {
			idx.KeywordToID[kw] = append(idx.KeywordToID[kw], memoryID)
		}
	}
}

// Search 根据关键词返回匹配的记忆ID列表（去重）
func (idx *MemoryIndex) Search(keywords []string) []string {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	seen := make(map[string]bool)
	var results []string
	for _, kw := range keywords {
		if ids, ok := idx.KeywordToID[kw]; ok {
			for _, id := range ids {
				if !seen[id] {
					seen[id] = true
					results = append(results, id)
				}
			}
		}
	}
	return results
}

// Save 持久化索引
func (idx *MemoryIndex) Save() error {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	data, err := json.MarshalIndent(idx.KeywordToID, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(idx.filePath, data, 0644)
}

// 辅助函数
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// RemoveID 从索引中删除与指定记忆ID相关的所有关键词映射
func (idx *MemoryIndex) RemoveID(memoryID string) {
	idx.mu.Lock()
	defer idx.mu.Unlock()

	for kw, ids := range idx.KeywordToID {
		newIDs := make([]string, 0)
		for _, id := range ids {
			if id != memoryID {
				newIDs = append(newIDs, id)
			}
		}
		if len(newIDs) == 0 {
			delete(idx.KeywordToID, kw)
		} else {
			idx.KeywordToID[kw] = newIDs
		}
	}
}
