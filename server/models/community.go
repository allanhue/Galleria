package models

import "time"

type CommunityPost struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Votes     int       `json:"votes" gorm:"default:0"`
	Saves     int       `json:"saves" gorm:"default:0"`
	Reposts   int       `json:"reposts" gorm:"default:0"`
	UserID    uint      `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`

	User     User              `json:"user" gorm:"foreignKey:UserID"`
	Comments []PostComment     `json:"comments" gorm:"foreignKey:PostID"`
}

type Vote struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	PostID    uint      `json:"post_id"`
	Direction string    `json:"direction"`
	CreatedAt time.Time `json:"created_at"`
}

type PostComment struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PostID    uint      `json:"post_id"`
	UserID    uint      `json:"user_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`

	User User `json:"user" gorm:"foreignKey:UserID"`
}

type SavedPost struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	PostID    uint      `json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Repost struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	PostID    uint      `json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
}