package main

import (
	"backend/internal/database"
	"backend/internal/handler"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		if err2 := godotenv.Load("C:\\Pro2026\\re0\\backend\\.env"); err2 != nil {
			log.Println("未找到 .env 文件，将从系统环境变量读取配置")
		}
	}

	database.InitDB()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4321"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 初始化记忆存储路径
	memoryPath := os.Getenv("MEMORY_FILE_PATH")
	if memoryPath == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			panic("无法获取用户目录: " + err.Error())
		}
		memoryPath = filepath.Join(homeDir, "shanxi_data", "memory.json")
	}

	// 初始化记忆存储
	memoryStore := handler.NewMemoryStore(memoryPath)

	// 注册路由
	handler.RegisterRoutes(r, memoryStore)

	// 启动杉汐的记忆自动清理（每天20:00执行）
	//memoryStore.StartMemoryCleaner()

	// 手动触发记忆清理（管理员测试用）
	r.GET("/api/admin/clean-memories", func(c *gin.Context) {
		memoryStore.CleanMemories()
		c.JSON(200, gin.H{"status": "ok", "message": "记忆清理已触发，请查看控制台日志"})
	})

	r.Run(":8080")
}
