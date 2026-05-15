package handler

import (
	"sync"
)

// SessionStore 用内存 map 维护所有会话的对话历史
type SessionStore struct {
	mu       sync.Mutex
	sessions map[string][]DSMessage
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string][]DSMessage),
	}
}

// Get 获取指定会话的完整历史
func (s *SessionStore) Get(sessionID string) []DSMessage {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.sessions[sessionID]
}

// Append 向指定会话追加一条消息
func (s *SessionStore) Append(sessionID string, msg DSMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[sessionID] = append(s.sessions[sessionID], msg)
}
