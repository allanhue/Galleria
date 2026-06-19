package models

import "time"

type Notification struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"` // who receives it
	ActorID   uint      `json:"actor_id"` // who triggered it
	Type      string    `json:"type"` // "comment", "vote", "save", "repost", "booking"
	PostID    *uint     `json:"post_id,omitempty"`
	EventID   *uint     `json:"event_id,omitempty"`
	Message   string    `json:"message"`
	Read      bool      `json:"read" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`

	Actor User `json:"actor" gorm:"foreignKey:ActorID"`
}