// backend/internal/service/post.go
package service

import (
	"backend/internal/database"
	"backend/internal/model"
	"time"
)

func GetAllPosts() ([]model.Post, error) {
	rows, err := database.DB.Query("SELECT id, title, slug, content, created_at FROM posts ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []model.Post
	for rows.Next() {
		var p model.Post
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Content, &p.CreatedAt); err != nil {
			continue
		}
		posts = append(posts, p)
	}
	return posts, nil
}

func CreateNewPost(p *model.Post) error {
	p.Slug = time.Now().Format("2006-01-02-150405")
	_, err := database.DB.Exec("INSERT INTO posts (title, slug, content) VALUES (?, ?, ?)",
		p.Title, p.Slug, p.Content)
	return err
}
