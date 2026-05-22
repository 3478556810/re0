package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	bookList   []BookEntry
	bookListMu sync.Mutex
)

func InitBookList() {
	booksDir := GetBooksDir()
	indexPath := filepath.Join(booksDir, "index.json")
	data, err := os.ReadFile(indexPath)
	if err != nil {
		bookList = []BookEntry{}
		return
	}
	var index BookIndex
	if json.Unmarshal(data, &index) != nil {
		bookList = []BookEntry{}
		return
	}
	bookList = index.Books
	if bookList == nil {
		bookList = []BookEntry{}
	}
}

func ListBooks(c *gin.Context) {
	booksDir := GetBooksDir()
	indexPath := filepath.Join(booksDir, "index.json")
	data, err := os.ReadFile(indexPath)
	if err != nil {
		c.JSON(http.StatusOK, BookIndex{Books: []BookEntry{}})
		return
	}
	var index BookIndex
	if json.Unmarshal(data, &index) != nil {
		index.Books = []BookEntry{}
	}
	if index.Books == nil {
		index.Books = []BookEntry{}
	}
	c.JSON(http.StatusOK, index)
}

func GetBookContent(c *gin.Context) {
	bookID := c.Query("bookId")
	if bookID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 bookId"})
		return
	}

	// 尝试从 Redis 读取
	if redisEnabled {
		cacheKey := "book_content:" + bookID
		ctx := context.Background()
		if val, err := redisClient.Get(ctx, cacheKey).Result(); err == nil {
			c.String(http.StatusOK, val)
			return
		}
	}

	booksDir := GetBooksDir()
	filePath := filepath.Join(booksDir, bookID+".txt")
	data, err := os.ReadFile(filePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "书籍文件未找到"})
		return
	}
	text := string(data) // 文件已经是 UTF-8，直接使用

	// 异步写入 Redis（24 小时过期）
	if redisEnabled {
		go func() {
			ctx := context.Background()
			cacheKey := "book_content:" + bookID
			if err := redisClient.Set(ctx, cacheKey, text, 24*time.Hour).Err(); err != nil {
				fmt.Printf("[WARN] 缓存书籍内容失败: %v\n", err)
			}
		}()
	}

	c.String(http.StatusOK, text)
}
func UploadCover(c *gin.Context) {
	bookID := c.PostForm("bookId")
	file, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未上传封面"})
		return
	}
	coverDir := filepath.Join(GetBooksDir(), "covers")
	os.MkdirAll(coverDir, 0755)
	ext := filepath.Ext(file.Filename)
	coverPath := filepath.Join(coverDir, bookID+ext)
	if err := c.SaveUploadedFile(file, coverPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存失败"})
		return
	}
	coverURL := "/books/covers/" + bookID + ext

	// 更新索引
	indexMutex.Lock()
	defer indexMutex.Unlock()
	updateBookCoverInIndex(bookID, coverURL)

	c.JSON(http.StatusOK, gin.H{"cover": coverURL})
}

// 在 handler/book.go 中添加
func updateBookCoverInIndex(bookID, coverURL string) {
	indexPath := filepath.Join(GetBooksDir(), "index.json")
	data, err := os.ReadFile(indexPath)
	if err != nil {
		return
	}
	var index BookIndex
	if json.Unmarshal(data, &index) != nil {
		return
	}
	for i, b := range index.Books {
		if b.ID == bookID {
			index.Books[i].Cover = coverURL
			break
		}
	}
	idxData, _ := json.MarshalIndent(index, "", "  ")
	os.WriteFile(indexPath, idxData, 0644)
}
func DeleteBook(c *gin.Context) {
	bookID := c.Query("bookId")
	if bookID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 bookId"})
		return
	}

	booksDir := GetBooksDir()
	filePath := filepath.Join(booksDir, bookID+".txt")

	// 删除文件
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件失败"})
		return
	}

	// 更新索引
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

	newBooks := []BookEntry{}
	for _, b := range index.Books {
		if b.ID != bookID {
			newBooks = append(newBooks, b)
		}
	}
	index.Books = newBooks

	idxData, _ := json.MarshalIndent(index, "", "  ")
	os.WriteFile(indexPath, idxData, 0644)

	// ★ 清除 Redis 中该书的所有缓存（分页索引、书籍内容等）
	if redisEnabled {
		ctx := context.Background()
		// 删除匹配 book_indices:* 和 book_content:* 的 key
		keys, err := redisClient.Keys(ctx, fmt.Sprintf("*%s*", bookID)).Result()
		if err == nil && len(keys) > 0 {
			redisClient.Del(ctx, keys...)
			fmt.Printf("[INFO] 已清除 Redis 缓存 %d 条\n", len(keys))
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "已删除"})
}
