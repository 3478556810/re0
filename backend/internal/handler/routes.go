package handler

import (
	"backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, memoryStore *MemoryStore) {

	// 创建一个速率限制器
	limiter := middleware.NewRateLimiter()

	// 公开路由：聊天接口对未登录用户限流
	r.POST("/api/chat", limiter.Limit(), func(c *gin.Context) {
		HandleChat(c, memoryStore)
	})

	r.GET("/api/posts", GetPosts)
	r.POST("/api/posts", CreatePost)

	// 登录接口（无需认证）
	r.POST("/api/login", Login)

	// 记忆接口（需要认证）
	auth := r.Group("/api/memory").Use(middleware.AuthRequired())
	{
		auth.POST("/save", memoryStore.SaveMemoryHandler)
		auth.GET("/recall", memoryStore.RecallMemoryHandler)
		auth.GET("/welcome", memoryStore.WelcomeHandler)
	}
}
