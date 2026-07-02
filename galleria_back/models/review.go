package models

import "time"

type Review struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	EventID   uint      `json:"event_id"`
	UserID    uint      `json:"user_id"`
	Rating    int       `json:"rating"` // 1-5
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`

	User User `json:"user" gorm:"foreignKey:UserID"`
}