package models

import "time"

type CommunityPost struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Title     string    `json:"title"`
    Body      string    `json:"body"`
    Votes     int       `json:"votes" gorm:"default:0"`
    UserID    uint      `json:"user_id"`
    CreatedAt time.Time `json:"created_at"`

    User User `json:"user" gorm:"foreignKey:UserID"`
}

type Vote struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    UserID    uint      `json:"user_id"`
    PostID    uint      `json:"post_id"`
    Direction string    `json:"direction"` // "up" or "down"
    CreatedAt time.Time `json:"created_at"`
}