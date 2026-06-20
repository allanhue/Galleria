package models

import "time"

type Follow struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	FollowerID  uint      `json:"follower_id"`  // who is following
	FollowingID uint      `json:"following_id"` // who is being followed
	CreatedAt   time.Time `json:"created_at"`
}