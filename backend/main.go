// backend/main.go
package main

import (
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    // 注册新API
    r.GET("/api/posts", getPosts)
    r.POST("/api/posts", createPost)
    
    // 保留你原来的AI顾问路由（假设它有独立的处理逻辑）
    // ...
    
    r.Run(":8080")
}