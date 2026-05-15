package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type MemoryRecord struct {
	Timestamp time.Time `json:"timestamp"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
}

type MemoryStore struct {
	filePath string
	records  []MemoryRecord
}

func NewMemoryStore(path string) *MemoryStore {
	store := &MemoryStore{filePath: path}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		panic("无法创建记忆数据目录: " + err.Error())
	}
	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, &store.records)
	}
	fmt.Printf("📂 记忆文件路径: %s\n", path)
	return store
}

func (m *MemoryStore) Append(role, content string) error {
	m.records = append(m.records, MemoryRecord{
		Timestamp: time.Now(),
		Role:      role,
		Content:   content,
	})
	data, err := json.MarshalIndent(m.records, "", "  ")
	if err != nil {
		return err
	}
	fmt.Printf("✅ 记忆已保存到: %s\n", m.filePath)
	return os.WriteFile(m.filePath, data, 0644)
}

func (m *MemoryStore) GetRecent(limit int) []MemoryRecord {
	if len(m.records) <= limit {
		return m.records
	}
	return m.records[len(m.records)-limit:]
}

// ---------- HTTP Handler ----------

func (m *MemoryStore) SaveMemoryHandler(c *gin.Context) {
	var req struct {
		Role    string `json:"role" binding:"required"`
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := m.Append(req.Role, req.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (m *MemoryStore) RecallMemoryHandler(c *gin.Context) {
	limit := 20
	records := m.GetRecent(limit)
	c.JSON(http.StatusOK, records)
}
