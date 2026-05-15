package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"backend/internal/ai"
)

type ChatRequest struct {
	Message   string `json:"message"`
	SessionID string `json:"sessionId"`
	NextSong  *struct {
		Name string `json:"name"`
		Src  string `json:"src"`
	} `json:"nextSong,omitempty"`
}
type ChatResponse struct {
	Reply   string `json:"reply"`
	Emotion string `json:"emotion,omitempty"`
	Action  string `json:"action,omitempty"` // 新增
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

func parseEmotion(reply string) (string, string) {
	re := regexp.MustCompile(`\[emotion:(\w+)\]`)
	matches := re.FindStringSubmatch(reply)
	if len(matches) >= 2 {
		emotion := matches[1]
		cleanReply := re.ReplaceAllString(reply, "")
		return strings.TrimSpace(cleanReply), emotion
	}
	return reply, "calm"
}

// 解析控制指令
func parseAction(reply string) (string, string) {
	re := regexp.MustCompile(`\[action:([^\]]+)\]`)
	matches := re.FindStringSubmatch(reply)
	if len(matches) >= 2 {
		action := matches[1]
		cleanReply := re.ReplaceAllString(reply, "")
		return strings.TrimSpace(cleanReply), action
	}
	return reply, ""
}

func HandleChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	// 动态 System Prompt（JWT 验证）
	systemPrompt := ai.DeepSeekPrompt
	if req.NextSong != nil && req.NextSong.Name != "" {
		systemPrompt += fmt.Sprintf("\n主人想要切歌，下一首歌是《%s》。请在你回复主人时，自然地评论一下这首歌，表达你对这首歌的感受。", req.NextSong.Name)
	}
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

	cleanReply, emotion := parseEmotion(reply)
	cleanReply, action := parseAction(cleanReply) // 追加这行
	c.JSON(http.StatusOK, ChatResponse{Reply: cleanReply, Emotion: emotion, Action: action})
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
