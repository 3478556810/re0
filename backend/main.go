// backend/main.go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()

    // 注册博客 API
    r.GET("/api/posts", getPosts)
    r.POST("/api/posts", createPost)

    // 注册 AI 顾问路由（现在类型匹配了）
    r.POST("/api/chat", handleChat)

    r.Run(":8080")
}