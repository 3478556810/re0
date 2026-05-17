// backend/internal/handler/deepseek.go
package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
)

// askDeepSeekWithMessages 调用 DeepSeek API 处理完整消息数组
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

	return cleanInvalidChars(dsResp.Choices[0].Message.Content)
}

// askDeepSeekSimple 调用 DeepSeek API 处理单轮简单请求
func askDeepSeekSimple(prompt string) string {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	model := os.Getenv("DEEPSEEK_MODEL")
	if apiKey == "" || model == "" {
		return ""
	}
	reqBody := DSReq{
		Model: model,
		Messages: []DSMessage{
			{Role: "user", Content: prompt},
		},
	}
	reqBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewBuffer(reqBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	resp, err := new(http.Client).Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	var dsResp DSResp
	json.NewDecoder(resp.Body).Decode(&dsResp)
	if len(dsResp.Choices) == 0 {
		return ""
	}
	return dsResp.Choices[0].Message.Content
}
