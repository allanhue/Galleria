package models

import "time"

type Event struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Date        string    `json:"date"`
    Location    string    `json:"location"`
    Category    string    `json:"category"`
    Capacity    int       `json:"capacity"`
    OrganizerID uint      `json:"organizer_id"`
    Source      string    `json:"source"` // "own", "rss", "seed"
    ImageURL    string    `json:"image_url"`
    CreatedAt   time.Time `json:"created_at"`
}