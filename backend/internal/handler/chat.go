// backend/internal/handler/chat.go
package handler

import (
	"fmt"

	"net/http"
	"os"
	"strings"

	"backend/internal/ai"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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
	Reply         string `json:"reply"`
	Emotion       string `json:"emotion,omitempty"`
	Action        string `json:"action,omitempty"`
	Blog          string `json:"blog,omitempty"`
	BlogPublished bool   `json:"blog_published,omitempty"`
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

func HandleChat(c *gin.Context, memoryStore *MemoryStore) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

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

	history := sessionStore.Get(req.SessionID)

	if memoryStore != nil {
		related := memoryStore.SearchSimilar(req.Message, 3)
		if len(related) > 0 {
			var builder strings.Builder
			builder.WriteString("\n\n以下是主人过去的对话记忆，如果与当前问题相关，请自然地在对话中引用：\n")
			for i, rec := range related {
				builder.WriteString(fmt.Sprintf("%d. %s\n", i+1, rec.Content))
			}
			systemPrompt += builder.String()
		}
	}

	var messages []DSMessage
	messages = append(messages, DSMessage{Role: "system", Content: systemPrompt})
	messages = append(messages, history...)
	messages = append(messages, DSMessage{Role: "user", Content: req.Message})

	reply := askDeepSeekWithMessages(messages)

	sessionStore.Append(req.SessionID, DSMessage{Role: "user", Content: req.Message})
	sessionStore.Append(req.SessionID, DSMessage{Role: "assistant", Content: reply})

	cleanReply, emotion := parseEmotion(reply)
	cleanReply, action := parseAction(cleanReply)
	cleanReply = cleanInvalidChars(cleanReply)

	var blogContent string
	var blogPublished bool
	if strings.HasPrefix(action, "write_blog:") {
		topic := strings.TrimPrefix(action, "write_blog:")
		blogContent = generateBlogPost(topic)
		blogPublished = blogContent != ""
	}

	c.JSON(http.StatusOK, ChatResponse{
		Reply:         cleanReply,
		Emotion:       emotion,
		Action:        action,
		Blog:          blogContent,
		BlogPublished: blogPublished,
	})
}
