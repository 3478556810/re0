package main

import (
	"backend/internal/database"
	"backend/internal/handler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"log"
	"os"
	"path/filepath"
)

func main() {
	// 智能加载 .env 文件，兼容本地和服务器环境
	if err := godotenv.Load(); err != nil {
		// 如果相对路径加载失败，尝试绝对路径
		if err2 := godotenv.Load("C:\\Pro2026\\re0\\backend\\.env"); err2 != nil {
			log.Println("未找到 .env 文件，将从系统环境变量读取配置")
		}
	}

	database.InitDB()

	r := gin.Default()

	// CORS 配置：允许来自前端的跨域请求
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4321"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 初始化记忆存储（路径可通过环境变量配置）
	memoryPath := os.Getenv("MEMORY_FILE_PATH")
	if memoryPath == "" {
		// 使用 UserHomeDir 替代 HOME 环境变量
		homeDir, err := os.UserHomeDir()
		if err != nil {
			panic("无法获取用户目录: " + err.Error())
		}
		memoryPath = filepath.Join(homeDir, "shanxi_data", "memory.json")
	}
	memoryStore := handler.NewMemoryStore(memoryPath)

	handler.RegisterRoutes(r, memoryStore)
	r.Run(":8080")
}
