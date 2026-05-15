package handler

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.Engine, memoryStore *MemoryStore) {
	r.GET("/api/posts", GetPosts)
	r.POST("/api/posts", CreatePost)
	r.POST("/api/chat", HandleChat)

	// 记忆接口
	r.POST("/api/memory/save", memoryStore.SaveMemoryHandler)
	r.GET("/api/memory/recall", memoryStore.RecallMemoryHandler)
}
