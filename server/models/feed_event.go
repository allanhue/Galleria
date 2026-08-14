package models

import "time"

type FeedEvent struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Link        string    `json:"link" gorm:"unique"`
	PubDate     string    `json:"pub_date"`
	SourceName  string    `json:"source_name"`
	Region      string    `json:"region"` // "kenya", "africa", "global"
	FetchedAt   time.Time `json:"fetched_at"`
}