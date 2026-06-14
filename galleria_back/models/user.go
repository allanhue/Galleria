package models

import "time"

type User struct {
    ID           uint      `json:"id" gorm:"primaryKey"`
    Name         string    `json:"name"`
    Email        string    `json:"email" gorm:"unique"`
    PasswordHash string    `json:"-"`
    Role         string    `json:"role"` // organizer or attendee
    CreatedAt    time.Time `json:"created_at"`
}