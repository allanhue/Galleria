package models

import "time"

type Report struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	ReporterID  uint      `json:"reporter_id"`
	TargetType  string    `json:"target_type"` // "user", "post", "comment", "event"
	TargetID    uint      `json:"target_id"`
	Reason      string    `json:"reason"` // "spam", "harassment", "hate_speech", "scam", "other"
	Details     string    `json:"details"`
	Status      string    `json:"status" gorm:"default:pending"` // pending, reviewed, dismissed, actioned
	CreatedAt   time.Time `json:"created_at"`

	Reporter User `json:"reporter" gorm:"foreignKey:ReporterID"`
}