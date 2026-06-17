package services

import (
	"fmt"
	"galleria_back/db"
	"galleria_back/models"
	"time"
)

func StartFeedScheduler() {
	// Run once immediately on startup
	refreshFeeds()

	// Then every 30 minutes
	ticker := time.NewTicker(30 * time.Minute)
	go func() {
		for range ticker.C {
			refreshFeeds()
		}
	}()
}

func refreshFeeds() {
	fmt.Println("Refreshing RSS feeds...")
	items := FetchAllFeeds()

	saved := 0
	for _, item := range items {
		if item.Link == "" {
			continue
		}

		feedEvent := models.FeedEvent{
			Title:       item.Title,
			Description: item.Description,
			Link:        item.Link,
			PubDate:     item.PubDate,
			SourceName:  item.SourceName,
			Region:      item.Region,
			FetchedAt:   time.Now(),
		}

		// Unique on Link, skip if already exists
		result := db.DB.Where("link = ?", item.Link).FirstOrCreate(&feedEvent)
		if result.RowsAffected > 0 {
			saved++
		}
	}

	fmt.Printf("Feed refresh done. %d new items saved.\n", saved)
}