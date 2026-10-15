package models

import (
	"time"

	"github.com/lib/pq"
)

type Event struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	Title             string         `json:"title"`
	Description       string         `json:"description"`
	Date              string         `json:"date"`
	Location          string         `json:"location"`
	City              string         `json:"city"`
	Country           string         `json:"country"`
	Category          string         `json:"category"`
	Capacity          int            `json:"capacity"`
	OrganizerID       uint           `json:"organizer_id"`
	Source            string         `json:"source"`
	PhotoURLs         pq.StringArray `json:"photo_urls" gorm:"type:text[]"`
	IsFree            bool           `json:"is_free" gorm:"default:true"`
	Price             int64          `json:"price"` // in KES, 0 if free
	VIPPrice          int64          `json:"vip_price"`
	VIPCapacity       int            `json:"vip_capacity"`
	FlashSalePrice    int64          `json:"flash_sale_price"`
	FlashSaleCapacity int            `json:"flash_sale_capacity"`
	FlashSaleStartsAt *time.Time     `json:"flash_sale_starts_at"`
	FlashSaleEndsAt   *time.Time     `json:"flash_sale_ends_at"`
	CreatedAt         time.Time      `json:"created_at"`
}