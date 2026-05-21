package handler

import (
	"backend/internal/middleware"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, memoryStore *MemoryStore) {
	r.DELETE("/api/images", DeleteImage)
	r.POST("/api/upload", UploadToOSS)

	r.GET("/api/images", ListImages)
	r.GET("/api/images/view", ViewImage)
	r.POST("/api/images/tag", UpdateImageTag)

	r.GET("/api/tmp/img/:filename", func(c *gin.Context) {
		filename := c.Param("filename")
		c.File("/tmp/shanxi_uploads/" + filename)
	})
	// 管理员手动清理记忆
	r.GET("/api/admin/clean-memories", func(c *gin.Context) {
		memoryStore.CleanMemories()
		c.JSON(200, gin.H{"status": "ok", "message": "记忆清理已触发，请查看控制台日志"})
	})

	// 余额查询
	r.GET("/api/balance", GetBalance)

	// 状态查询
	r.GET("/api/shanxi/status", func(c *gin.Context) {
		hour := time.Now().Hour()
		var status string
		switch {
		case hour >= 0 && hour < 6:
			status = "正在休眠..."
		case hour >= 6 && hour < 9:
			status = "刚刚醒来，正在整理思绪..."
		case hour >= 9 && hour < 18:
			status = "活跃中，随时准备帮忙"
		case hour >= 18 && hour < 22:
			status = "晚间模式，陪你聊聊天"
		default:
			status = "深夜了，但还在线"
		}
		c.JSON(200, gin.H{"status": status})
	})

	// 语音合成（公开）
	r.POST("/api/tts", func(c *gin.Context) {
		var req struct {
			Text string `json:"text" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
			return
		}
		audio, err := SynthesizeSpeech(req.Text)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "语音合成失败"})
			return
		}
		c.Data(http.StatusOK, "audio/wav", audio)
	})

	// 聊天接口（限流）
	limiter := middleware.NewRateLimiter()
	r.POST("/api/chat", limiter.Limit(), func(c *gin.Context) {
		HandleChat(c, memoryStore)
	})

	// 博客接口
	r.GET("/api/posts", GetPosts)
	r.POST("/api/posts", CreatePost)

	// 登录接口
	r.POST("/api/login", Login)
	r.GET("/api/memory/welcome", memoryStore.WelcomeHandler)

	// 记忆接口（需要认证）
	auth := r.Group("/api/memory").Use(middleware.AuthRequired())
	{
		auth.POST("/save", memoryStore.SaveMemoryHandler)
		auth.GET("/recall", memoryStore.RecallMemoryHandler)
		//auth.GET("/welcome", memoryStore.WelcomeHandler) // 补回这一行
	}

	// 在函数体内，其他路由注册的后面添加：
	r.GET("/api/book/list", ListBooks)
	r.GET("/api/book/content", GetBookContent)
}
