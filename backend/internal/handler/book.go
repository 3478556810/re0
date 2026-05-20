package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// 内置书单：public/books/ 目录下的所有 .txt 文件
func ListBooks(c *gin.Context) {
	booksDir := "public/books"
	entries, err := os.ReadDir(booksDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取书库"})
		return
	}

	type BookItem struct {
		ID     string `json:"id"`
		Title  string `json:"title"`
		Author string `json:"author"`
	}

	books := []BookItem{}
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".txt") {
			continue
		}
		name := strings.TrimSuffix(entry.Name(), ".txt")
		books = append(books, BookItem{
			ID:    entry.Name(),
			Title: name,
		})
	}

	c.JSON(http.StatusOK, gin.H{"books": books})
}

// 获取指定书籍的全文内容
func GetBookContent(c *gin.Context) {
	filename := c.Query("file")
	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少文件名"})
		return
	}

	// 安全检查：防止路径穿越
	filename = filepath.Base(filename)
	filePath := filepath.Join("public/books", filename)

	content, err := os.ReadFile(filePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "书籍不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"title":   strings.TrimSuffix(filename, ".txt"),
		"content": string(content),
	})
}
