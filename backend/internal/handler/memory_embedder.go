// internal/handler/memory_embedder.go
package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strings"
	"time"
)

type EmbeddingRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
}

type EmbeddingResponse struct {
	Data []struct {
		Embedding []float64 `json:"embedding"`
	} `json:"data"`
}

func getEmbedding(text string) ([]float64, error) {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")

	// 修正模型名和请求体格式
	reqBody := EmbeddingRequest{
		Model: "deepseek-embedding", // DeepSeek 官方 Embedding 模型名
		Input: text,
	}
	reqBytes, _ := json.Marshal(reqBody)

	// 修正 URL
	req, _ := http.NewRequest("POST", "https://api.deepseek.com/v1/embeddings", bytes.NewBuffer(reqBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API返回非200: %d, body: %s", resp.StatusCode, string(body))
	}

	var embResp EmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&embResp); err != nil {
		return nil, fmt.Errorf("解析失败: %v", err)
	}
	if len(embResp.Data) == 0 {
		return nil, fmt.Errorf("空向量")
	}
	return embResp.Data[0].Embedding, nil
}

// cosineSimilarity 余弦相似度
func cosineSimilarity(a, b []float64) float64 {
	if len(a) != len(b) || len(a) == 0 {
		return 0
	}
	var dot, normA, normB float64
	for i := range a {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}
func (m *MemoryStore) SearchSimilar(query string, topK int) []MemoryRecord {
	if len(m.records) == 0 {
		return nil
	}

	// 关键词粗筛：遍历倒排索引，匹配用户消息中包含的关键词
	var candidates []MemoryRecord
	if m.index != nil && len(m.index.KeywordToID) > 0 {
		matchedIDs := make(map[string]bool)
		for kw, ids := range m.index.KeywordToID {
			if strings.Contains(query, kw) {
				for _, id := range ids {
					matchedIDs[id] = true
				}
			}
		}

		if len(matchedIDs) > 0 {
			for _, rec := range m.records {
				if matchedIDs[rec.ID] {
					candidates = append(candidates, rec)
				}
			}
		}
	}

	// 如果关键词没命中，回退到最近记忆
	if len(candidates) == 0 {
		return m.GetRecent(topK)
	}

	if len(candidates) <= topK {
		return candidates
	}
	return candidates[:topK]
}
