package models

import "time"

type Conversation struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserAID   uint      `json:"user_a_id"`
	UserBID   uint      `json:"user_b_id"`
	CreatedAt time.Time `json:"created_at"`

	UserA User `json:"user_a" gorm:"foreignKey:UserAID"`
	UserB User `json:"user_b" gorm:"foreignKey:UserBID"`
}

type Message struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	ConversationID uint      `json:"conversation_id"`
	SenderID       uint      `json:"sender_id"`
	Body           string    `json:"body"`
	Read           bool      `json:"read" gorm:"default:false"`
	CreatedAt      time.Time `json:"created_at"`

	Sender User `json:"sender" gorm:"foreignKey:SenderID"`
}