package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

var indexMutex sync.Mutex

type BookEntry struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type BookIndex struct {
	Books []BookEntry `json:"books"`
}

func UploadBook(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未上传文件"})
		return
	}

	if !strings.HasSuffix(strings.ToLower(file.Filename), ".txt") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "仅支持 TXT 文件"})
		return
	}

	// 生成安全的 bookID（保留中文，替换危险字符）
	bookID := strings.TrimSuffix(file.Filename, ".txt")
	bookID = strings.TrimSuffix(bookID, ".TXT")
	bookID = strings.Map(func(r rune) rune {
		switch r {
		case '/', '\\', ':', '*', '?', '"', '<', '>', '|':
			return '_'
		}
		return r
	}, bookID)

	booksDir := GetBooksDir()
	if err := os.MkdirAll(booksDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法创建书籍目录"})
		return
	}

	savePath := filepath.Join(booksDir, bookID+".txt")

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取文件失败"})
		return
	}
	defer src.Close()

	rawData, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取内容失败"})
		return
	}

	// ★ 强制 GBK → UTF-8 转换；如果本身就是 UTF-8，转换会失败，则使用原数据
	utf8Data, err := convertToUTF8(rawData)
	if err != nil {
		utf8Data = rawData
	}

	dst, err := os.Create(savePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文件失败"})
		return
	}
	defer dst.Close()

	if _, err := dst.Write(utf8Data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "写入文件失败"})
		return
	}

	// 更新书籍列表文件 index.json
	indexMutex.Lock()
	defer indexMutex.Unlock()

	indexPath := filepath.Join(booksDir, "index.json")
	var index BookIndex
	if data, err := os.ReadFile(indexPath); err == nil {
		json.Unmarshal(data, &index)
	}
	if index.Books == nil {
		index.Books = []BookEntry{}
	}

	found := false
	for i, b := range index.Books {
		if b.ID == bookID {
			index.Books[i].Title = bookID
			found = true
			break
		}
	}
	if !found {
		index.Books = append(index.Books, BookEntry{ID: bookID, Title: bookID})
	}

	idxData, _ := json.MarshalIndent(index, "", "  ")
	os.WriteFile(indexPath, idxData, 0644)

	c.JSON(http.StatusOK, gin.H{
		"bookId":   bookID,
		"fileName": file.Filename,
		"books":    index.Books,
		"message":  "上传成功",
	})
}
