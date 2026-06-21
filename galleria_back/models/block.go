package models

import "time"

type Block struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	BlockerID uint      `json:"blocker_id"` // who did the blocking
	BlockedID uint      `json:"blocked_id"` // who got blocked
	CreatedAt time.Time `json:"created_at"`
}