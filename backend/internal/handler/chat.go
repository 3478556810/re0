package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"backend/internal/ai"
)

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatResponse struct {
	Reply string `json:"reply"`
}

type DSMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DSReq struct {
	Model    string      `json:"model"`
	Messages []DSMessage `json:"messages"`
}

type DSResp struct {
	Choices []struct {
		Message DSMessage `json:"message"`
	} `json:"choices"`
}

func HandleChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	// 根据登录验证动态调整 System Prompt
	systemPrompt := ai.DeepSeekPrompt
	authHeader := c.GetHeader("Authorization")

	// 【新增调试日志1】检查是否收到 Token
	if authHeader != "" {
		log.Printf("🔑 收到Authorization头: %s", authHeader)
	} else {
		log.Println("❌ 未收到Authorization头，以访客身份处理")
	}

	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 【新增调试日志2】检查 JWT 密钥是否存在
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			log.Println("❌ JWT_SECRET 环境变量未设置！")
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		// 【新增调试日志3】检查 JWT 解析结果
		if err != nil {
			log.Printf("❌ JWT解析失败: %v", err)
		} else if !token.Valid {
			log.Println("❌ Token无效")
		} else {
			log.Println("✅ Token有效")
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// 【新增调试日志4】检查角色
			role, _ := claims["role"]
			log.Printf("👤 用户角色: %v", role)

			if claims["role"] == "admin" {
				systemPrompt = "【强制性指令】你现在的对话对象是你的主人（网站创建者）。你已经认出他了。从现在开始，你必须用最亲切、最撒娇的女儿口吻和他交流，称呼他为“主人”，绝对不要再问“你是谁”或表现出任何不确定。" + systemPrompt
				log.Println("✅ 已切换为主人模式")
			}
		}
	}

	// 【新增调试日志5】打印最终注入的 Prompt 前200字
	log.Printf("📝 注入的系统提示 (前200字): %s", systemPrompt[:min(200, len(systemPrompt))])

	aiReply := askDeepSeek(req.Message, systemPrompt)
	c.JSON(http.StatusOK, ChatResponse{Reply: aiReply})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func askDeepSeek(question string, systemPrompt string) string {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	model := os.Getenv("DEEPSEEK_MODEL")
	if apiKey == "" || model == "" {
		log.Println("缺少必要的环境变量: DEEPSEEK_API_KEY 或 DEEPSEEK_MODEL")
		return "抱歉，顾问配置错误，请联系管理员。"
	}

	reqBody := DSReq{
		Model: model,
		Messages: []DSMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: question},
		},
	}
	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		log.Println("JSON编码失败:", err)
		return "抱歉，顾问内部错误，请稍后再试。"
	}

	client := &http.Client{}
	request, err := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewBuffer(reqBytes))
	if err != nil {
		log.Println("创建请求失败:", err)
		return "抱歉，顾问内部错误，请稍后再试。"
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+apiKey)

	response, err := client.Do(request)
	if err != nil {
		log.Println("请求DeepSeek API失败:", err)
		return "抱歉，顾问暂时无法连接，请稍后再试。"
	}
	defer response.Body.Close()

	respBytes, err := io.ReadAll(response.Body)
	if err != nil {
		log.Println("读取响应失败:", err)
		return "抱歉，顾问读取数据失败。"
	}

	var dsResp DSResp
	if err := json.Unmarshal(respBytes, &dsResp); err != nil {
		log.Println("解析响应失败:", err)
		return "抱歉，顾问无法理解AI的回复。"
	}
	if len(dsResp.Choices) == 0 {
		return "顾问暂时没有合适的回答。"
	}
	return dsResp.Choices[0].Message.Content
}
