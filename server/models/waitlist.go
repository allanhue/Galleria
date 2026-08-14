package models

import "time"

type Waitlist struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	EventID   uint      `json:"event_id"`
	Notified  bool      `json:"notified" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`

	User  User  `json:"user"  gorm:"foreignKey:UserID"`
	Event Event `json:"event" gorm:"foreignKey:EventID"`
}