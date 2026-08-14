package models

import "time"

type EventLike struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	EventID   uint      `json:"event_id"`
	Direction string    `json:"direction"` // "like" or "dislike"
	CreatedAt time.Time `json:"created_at"`
}

type EventSave struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	EventID   uint      `json:"event_id"`
	CreatedAt time.Time `json:"created_at"`
}