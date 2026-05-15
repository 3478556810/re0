package handler

import (
	"backend/internal/ai"
	"bytes"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"io"
	"log"
	"net/http"
	"os"
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

	aiReply := askDeepSeek(req.Message)
	c.JSON(http.StatusOK, ChatResponse{Reply: aiReply})
}

func askDeepSeek(question string) string {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	model := os.Getenv("DEEPSEEK_MODEL")
	if apiKey == "" || model == "" {
		log.Println("缺少必要的环境变量: DEEPSEEK_API_KEY 或 DEEPSEEK_MODEL")
		return "抱歉，顾问配置错误，请联系管理员。"
	}

	reqBody := DSReq{
		Model: model,
		Messages: []DSMessage{
			{Role: "system", Content: ai.DeepSeekPrompt},
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
