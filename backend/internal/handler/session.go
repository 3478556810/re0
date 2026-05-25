package handler

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// SessionStore 用内存 map 维护所有会话的对话历史
type SessionStore struct {
	mu       sync.Mutex
	sessions map[string][]DSMessage
	filePath string // 新增：持久化文件路径
}

func NewSessionStore(filePath string) *SessionStore {
	store := &SessionStore{
		sessions: make(map[string][]DSMessage),
		filePath: filePath,
	}
	// 确保目录存在
	dir := filepath.Dir(filePath)
	os.MkdirAll(dir, 0755)
	// 启动时加载已有会话
	store.LoadFromFile(filePath)
	return store
}

func (s *SessionStore) Append(sessionID string, msg DSMessage) {
	s.mu.Lock()
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}
	s.sessions[sessionID] = append(s.sessions[sessionID], msg)
	s.mu.Unlock() // 立即释放锁

	// 异步持久化，避免阻塞请求
	go func() {
		if err := s.SaveToFile(s.filePath); err != nil {
			log.Printf("保存会话失败: %v", err)
		}
	}()
}

// Get 获取指定会话的完整历史
func (s *SessionStore) Get(sessionID string) []DSMessage {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.sessions[sessionID]
}

type SessionInfo struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"` // 用第一条用户消息做标题
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *SessionStore) List() []SessionInfo {
	s.mu.Lock()
	defer s.mu.Unlock()
	var infos []SessionInfo
	for id, msgs := range s.sessions {
		title := "新对话"
		for _, m := range msgs {
			if m.Role == "user" {
				title = m.Content
				break
			}
		}
		infos = append(infos, SessionInfo{
			ID:        id,
			Title:     title,
			UpdatedAt: msgs[len(msgs)-1].Timestamp,
		})
	}
	return infos
}

// SaveToFile 将会话数据持久化到 JSON 文件
func (s *SessionStore) SaveToFile(path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.Marshal(s.sessions)
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// LoadFromFile 从 JSON 文件恢复会话数据到内存
func (s *SessionStore) LoadFromFile(path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(path)
	if err != nil {
		// 文件不存在是正常情况（首次启动），返回 nil
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	return json.Unmarshal(data, &s.sessions)
}
