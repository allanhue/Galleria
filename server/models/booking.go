package models

import "time"

type Booking struct {
	ID                 uint      `json:"id" gorm:"primaryKey"`
	UserID             uint      `json:"user_id"`
	EventID            uint      `json:"event_id"`
	Status             string    `json:"status"`
	TicketType         string    `json:"ticket_type" gorm:"default:general"`
	NotifyEventUpdates bool      `json:"notify_event_updates" gorm:"not null;default:false"`
	QRToken            string    `json:"qr_token" gorm:"uniqueIndex"`
	CheckedIn          bool      `json:"checked_in" gorm:"default:false"`
	CreatedAt          time.Time `json:"created_at"`

	User  User  `json:"user"  gorm:"foreignKey:UserID"`
	Event Event `json:"event" gorm:"foreignKey:EventID"`
}