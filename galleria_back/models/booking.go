package models

import "time"

type Booking struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    UserID    uint      `json:"user_id"`
    EventID   uint      `json:"event_id"`
    Status    string    `json:"status"` // "confirmed", "cancelled"
    CreatedAt time.Time `json:"created_at"`

    // Relationships
    User  User  `json:"user"  gorm:"foreignKey:UserID"`
    Event Event `json:"event" gorm:"foreignKey:EventID"`
}