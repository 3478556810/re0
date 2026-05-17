// internal/handler/tfidf.go
package handler

import (
	"math"
	"sync"
)

type TFIDFAnalyzer struct {
	mu       sync.Mutex
	docCount int            // 已处理的记忆总数
	wordDocs map[string]int // 关键词 → 出现在多少条记忆里
}

func NewTFIDFAnalyzer() *TFIDFAnalyzer {
	return &TFIDFAnalyzer{
		wordDocs: make(map[string]int),
	}
}

// AddDocument 记录一条记忆的关键词统计
func (a *TFIDFAnalyzer) AddDocument(keywords []string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.docCount++
	seen := make(map[string]bool)
	for _, kw := range keywords {
		if !seen[kw] {
			seen[kw] = true
			a.wordDocs[kw]++
		}
	}
}

// FilterKeywords 返回高区分度的关键词（IDF > 阈值）
func (a *TFIDFAnalyzer) FilterKeywords(keywords []string) []string {
	a.mu.Lock()
	defer a.mu.Unlock()

	var filtered []string
	for _, kw := range keywords {
		df := a.wordDocs[kw]
		if df == 0 {
			filtered = append(filtered, kw)
			continue
		}
		idf := math.Log(float64(a.docCount+1) / float64(df+1))
		if idf > 1.5 { // IDF > 1.5 认为是有区分度的词
			filtered = append(filtered, kw)
		}
	}
	return filtered
}
