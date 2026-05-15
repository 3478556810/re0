package handler

import (
	"backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, memoryStore *MemoryStore) {
	r.GET("/api/posts", GetPosts)
	r.POST("/api/posts", CreatePost)
	r.POST("/api/chat", HandleChat)

	// 登录接口（无需认证）
	r.POST("/api/login", Login)

	// 记忆接口（需要认证）
	auth := r.Group("/api/memory").Use(middleware.AuthRequired())
	{
		auth.POST("/save", memoryStore.SaveMemoryHandler)
		auth.GET("/recall", memoryStore.RecallMemoryHandler)
		auth.GET("/welcome", memoryStore.WelcomeHandler) // 新增
	}
}
