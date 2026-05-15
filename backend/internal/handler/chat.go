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
	Message   string `json:"message"`
	SessionID string `json:"sessionId"`
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

var sessionStore = NewSessionStore()

func HandleChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	// 动态 System Prompt（JWT 验证）
	systemPrompt := ai.DeepSeekPrompt
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			if claims["role"] == "admin" {
				systemPrompt = "当前对话对象是主人，你已经认出他了。" + systemPrompt
			}
		}
	}

	// 获取该会话的历史消息
	history := sessionStore.Get(req.SessionID)

	// 构造完整 messages：System Prompt + 历史消息 + 当前消息
	var messages []DSMessage
	messages = append(messages, DSMessage{Role: "system", Content: systemPrompt})
	messages = append(messages, history...)
	messages = append(messages, DSMessage{Role: "user", Content: req.Message})

	// 调用 DeepSeek
	reply := askDeepSeekWithMessages(messages)

	// 将本轮对话追加到会话历史
	sessionStore.Append(req.SessionID, DSMessage{Role: "user", Content: req.Message})
	sessionStore.Append(req.SessionID, DSMessage{Role: "assistant", Content: reply})

	c.JSON(http.StatusOK, ChatResponse{Reply: reply})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func askDeepSeekWithMessages(messages []DSMessage) string {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	model := os.Getenv("DEEPSEEK_MODEL")
	if apiKey == "" || model == "" {
		log.Println("缺少必要的环境变量")
		return "抱歉，顾问配置错误，请联系管理员。"
	}

	reqBody := DSReq{
		Model:    model,
		Messages: messages,
	}
	reqBytes, _ := json.Marshal(reqBody)

	client := &http.Client{}
	request, _ := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewBuffer(reqBytes))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(request)
	if err != nil {
		log.Println("请求DeepSeek失败:", err)
		return "抱歉，顾问暂时无法连接。"
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var dsResp DSResp
	json.Unmarshal(respBytes, &dsResp)
	if len(dsResp.Choices) == 0 {
		return "顾问暂时没有合适的回答。"
	}
	return dsResp.Choices[0].Message.Content
}
