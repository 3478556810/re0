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
	Image string `json:"image,omitempty"` // 新增：Base64 图片
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
	fmt.Printf("📸 收到图片长度: %d\n", len(req.Image))
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("❌ JSON解析失败: %v\n", err) // 加这行
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}
	fmt.Printf("📸 收到消息: %s, 图片长度: %d\n", req.Message, len(req.Image)) // 加这行

	// 构造 system prompt（JWT 验证、切歌信息、长期记忆）
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

	// 处理图片分析（如果用户上传了图片）
	if req.Image != "" {
		// 移除可能存在的 data:image/... 前缀
		imageData := req.Image
		if idx := strings.Index(imageData, "base64,"); idx != -1 {
			imageData = imageData[idx+7:] // 去掉 "base64," 之前的所有内容
		}
		fmt.Printf("📸 图片Base64长度: %d, 前50字符: %s\n", len(imageData), imageData[:min(50, len(imageData))])

		description, err := AnalyzeImage(imageData, req.Message)
		if err != nil {
			fmt.Printf("❌ 图片分析失败: %v\n", err)
		} else if description == "" {
			fmt.Println("⚠️ 图片分析返回空结果")
		} else {
			fmt.Printf("✅ 图片分析成功: %s\n", description[:min(100, len(description))])
			systemPrompt += fmt.Sprintf("\n主人上传了一张图片，内容描述如下：\n%s\n请基于这个描述回答主人的问题。", description)
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

	// ===== 处理写博客指令 =====
	var blogContent string
	var blogPublished bool
	if strings.HasPrefix(action, "write_blog:") {
		topic := strings.TrimPrefix(action, "write_blog:")
		blogContent = generateBlogPost(topic)
		blogPublished = blogContent != ""
	}

	// ===== 处理联网搜索指令（必须在 c.JSON 之前） =====
	if strings.HasPrefix(action, "web_search:") {
		query := strings.TrimPrefix(action, "web_search:")
		fmt.Printf("🔍 触发联网搜索，关键词: %s\n", query)
		searchResult, err := WebSearch(query)
		if err != nil {
			fmt.Printf("❌ 联网搜索失败: %v\n", err)
			// 搜索失败时，返回原本的回复
			c.JSON(http.StatusOK, ChatResponse{
				Reply:   cleanReply,
				Emotion: emotion,
			})
			return
		}
		if searchResult == "" {
			c.JSON(http.StatusOK, ChatResponse{
				Reply:   cleanReply,
				Emotion: emotion,
			})
			return
		}

		fmt.Printf("✅ 联网搜索成功，返回长度: %d\n", len(searchResult))

		// 将搜索结果追加到会话历史
		sessionStore.Append(req.SessionID, DSMessage{Role: "user", Content: req.Message})
		sessionStore.Append(req.SessionID, DSMessage{
			Role:    "assistant",
			Content: fmt.Sprintf("主人，我查到了以下信息：\n%s\n请用自然、简洁的语言把结果告诉主人。", searchResult),
		})

		// 重新构造 messages，让杉汐基于搜索结果回复
		history := sessionStore.Get(req.SessionID)
		var newMessages []DSMessage
		newMessages = append(newMessages, DSMessage{Role: "system", Content: systemPrompt})
		newMessages = append(newMessages, history...)
		newMessages = append(newMessages, DSMessage{
			Role:    "user",
			Content: "请把上面的搜索结果用一句话告诉主人。",
		})

		finalReply := askDeepSeekWithMessages(newMessages)
		fmt.Printf("📩 搜索后的最终回复: %s\n", finalReply)

		// 重新提取情绪和动作（如果有）
		finalClean, finalEmotion := parseEmotion(finalReply)
		finalClean, _ = parseAction(finalClean)
		finalClean = cleanInvalidChars(finalClean)

		c.JSON(http.StatusOK, ChatResponse{
			Reply:         finalClean,
			Emotion:       finalEmotion,
			Blog:          blogContent,
			BlogPublished: blogPublished,
		})
		return
	}

	// ===== 处理记忆清理指令 =====
	if action == "clean_memories" {
		if memoryStore != nil {
			go memoryStore.CleanMemories() // 异步执行，不阻塞回复
		}
	}

	// ===== 没有搜索指令时，返回原本的回复 =====
	c.JSON(http.StatusOK, ChatResponse{
		Reply:         cleanReply,
		Emotion:       emotion,
		Action:        action,
		Blog:          blogContent,
		BlogPublished: blogPublished,
	})
}
