package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetFeedEvents(c *gin.Context) {
	region := c.Query("region") // kenya, africa, global

	var items []models.FeedEvent
	query := db.DB.Order("fetched_at desc").Limit(60)

	if region != "" {
		query = query.Where("region = ?", region)
	}

	query.Find(&items)
	c.JSON(http.StatusOK, items)
}