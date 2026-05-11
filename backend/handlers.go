// backend/handlers.go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

func getPosts(c *gin.Context) {
    rows, err := db.Query("SELECT id, title, slug, content, created_at FROM posts ORDER BY created_at DESC")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
        return
    }
    defer rows.Close()

    var posts []Post
    for rows.Next() {
        var p Post
        err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Content, &p.CreatedAt)
        if err != nil {
            continue
        }
        posts = append(posts, p)
    }
    c.JSON(http.StatusOK, posts)
}

func createPost(c *gin.Context) {
    var p Post
    if err := c.ShouldBindJSON(&p); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
        return
    }
    p.Slug = time.Now().Format("2006-01-02-150405")
    _, err := db.Exec("INSERT INTO posts (title, slug, content) VALUES (?, ?, ?)",
        p.Title, p.Slug, p.Content)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"message": "文章发布成功"})
}