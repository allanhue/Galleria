package models

import "time"

type UserSettings struct {
	ID     uint `json:"id" gorm:"primaryKey"`
	UserID uint `json:"user_id" gorm:"uniqueIndex"`

	// Notification preferences
	NotifyComments  bool `json:"notify_comments"  gorm:"default:true"`
	NotifyVotes     bool `json:"notify_votes"     gorm:"default:true"`
	NotifySaves     bool `json:"notify_saves"     gorm:"default:true"`
	NotifyReposts   bool `json:"notify_reposts"   gorm:"default:true"`
	NotifyFollows   bool `json:"notify_follows"   gorm:"default:true"`
	NotifyMessages  bool `json:"notify_messages"  gorm:"default:true"`
	NotifyBookings  bool `json:"notify_bookings"  gorm:"default:true"`

	// Privacy preferences
	AllowMessages  string `json:"allow_messages"  gorm:"default:following"` // "everyone", "following", "none"
	AllowFollows   string `json:"allow_follows"   gorm:"default:everyone"`  // "everyone", "none"
	ProfileVisible bool   `json:"profile_visible" gorm:"default:true"`

	// Appearance
	Theme    string `json:"theme"    gorm:"default:light"` // "light", "dark", "system"
	Language string `json:"language" gorm:"default:en"`

	UpdatedAt time.Time `json:"updated_at"`
}