package models

import "time"


type Booking struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	EventID   uint      `json:"event_id"`
	Status    string    `json:"status"`
	QRToken   string    `json:"qr_token" gorm:"uniqueIndex"`
	CheckedIn bool      `json:"checked_in" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`

	User  User  `json:"user"  gorm:"foreignKey:UserID"`
	Event Event `json:"event" gorm:"foreignKey:EventID"`
}