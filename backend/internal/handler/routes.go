package handler

import (
	"backend/internal/middleware"
	"log"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, memoryStore *MemoryStore) {

	// 需要登录才能使用的功能
	authGroup := r.Group("/api", middleware.AuthRequired())
	{
		authGroup.POST("/tts", func(c *gin.Context) {
			var req struct {
				Text string `json:"text"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			audio, err := SynthesizeSpeech(req.Text)
			if err != nil {
				log.Printf("❌ TTS合成失败: %v\n", err)       // 添加这行
				c.JSON(500, gin.H{"error": err.Error()}) // 返回具体错误信息
				return
			}
			c.Data(200, "audio/wav", audio)
		})
		authGroup.POST("/chat/image", func(c *gin.Context) { /* ... */ })
	}

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
