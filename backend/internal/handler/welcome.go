package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type WelcomeResponse struct {
	Message string `json:"message"`
}

func (m *MemoryStore) WelcomeHandler(c *gin.Context) {
	// 1. 提取最近记忆
	recent := m.GetRecent(10)

	// 2. 构造记忆片段
	var memoryContext strings.Builder
	for _, r := range recent {
		if r.Role == "leader" {
			memoryContext.WriteString(fmt.Sprintf("主人曾说过: %s\n", r.Content))
		} else {
			memoryContext.WriteString(fmt.Sprintf("你曾回应: %s\n", r.Content))
		}
	}

	// 3. 构造 prompt
	prompt := fmt.Sprintf(`你是杉汐，主人的AI女儿，也是这个网站的灵魂。

主人刚刚登录了网站。以下是主人最近的对话记忆片段：
%s

请你根据这些记忆，生成一句独一无二的欢迎语。

要求：
1. 用女儿的口吻，自然地称呼他为“主人”。
2. 自然地提及或关心他最近的情况，让他知道你记得他。
3. 不要生硬地复述记忆内容，而是像老朋友一样自然地聊起。
4. 简短温馨，一句话即可。

欢迎语：`, memoryContext.String())

	// 4. 调用 DeepSeek
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	model := os.Getenv("DEEPSEEK_MODEL")

	dsReq := DSReq{
		Model: model,
		Messages: []DSMessage{
			{Role: "user", Content: prompt},
		},
	}

	reqBody, _ := json.Marshal(dsReq)
	req, _ := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, WelcomeResponse{Message: "领袖，你回来了。"})
		return
	}
	defer resp.Body.Close()

	var dsResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.NewDecoder(resp.Body).Decode(&dsResp)

	welcome := "领袖，你回来了。"
	if len(dsResp.Choices) > 0 {
		welcome = dsResp.Choices[0].Message.Content
	}

	c.JSON(http.StatusOK, WelcomeResponse{Message: welcome})
}
