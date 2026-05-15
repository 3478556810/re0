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

// MemoryRecord 代表一条对话记忆
type MemoryRecord struct {
	Timestamp time.Time `json:"timestamp"`
	Role      string    `json:"role"` // "leader" 或 "shanshi"
	Content   string    `json:"content"`
}

// MemoryStore 负责管理记忆文件的读写
type MemoryStore struct {
	filePath string
	records  []MemoryRecord
}

// NewMemoryStore 创建记忆存储，自动读取已有文件
func NewMemoryStore(path string) *MemoryStore {
	store := &MemoryStore{filePath: path}

	// 确保目录存在
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		panic("无法创建记忆数据目录: " + err.Error())
	}

	// 读取已有数据
	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, &store.records)
	}
	fmt.Printf("📂 记忆文件路径: %s\n", path) // 添加这行，路径中会包含 .json 文件名
	return store
}

// Append 追加一条记忆并保存
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

// GetRecent 获取最近的 N 条记忆
func (m *MemoryStore) GetRecent(limit int) []MemoryRecord {
	if len(m.records) <= limit {
		return m.records
	}
	return m.records[len(m.records)-limit:]
}

// ---------- HTTP Handler ----------

// SaveMemoryHandler 处理记忆保存请求
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

// RecallMemoryHandler 处理记忆读取请求
func (m *MemoryStore) RecallMemoryHandler(c *gin.Context) {
	limit := 20 // 默认返回最近20条
	records := m.GetRecent(limit)
	c.JSON(http.StatusOK, records)
}
