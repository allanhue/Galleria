package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func LikeEvent(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	var input struct {
		Direction string `json:"direction" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Direction != "like" && input.Direction != "dislike" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Direction must be like or dislike"})
		return
	}

	var existing models.EventLike
	err := db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&existing).Error

	if err == nil {
		// already reacted — update direction or remove if same
		if existing.Direction == input.Direction {
			db.DB.Delete(&existing)
			c.JSON(http.StatusOK, gin.H{"message": "Removed", "action": "removed"})
			return
		}
		db.DB.Model(&existing).Update("direction", input.Direction)
		c.JSON(http.StatusOK, gin.H{"message": "Updated", "action": "updated"})
		return
	}

	db.DB.Create(&models.EventLike{
		UserID:    userID.(uint),
		EventID:   parseUint(eventID),
		Direction: input.Direction,
	})
	c.JSON(http.StatusOK, gin.H{"message": "Recorded", "action": "created"})
}

func GetEventLikes(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	var likes, dislikes int64
	db.DB.Model(&models.EventLike{}).Where("event_id = ? AND direction = ?", eventID, "like").Count(&likes)
	db.DB.Model(&models.EventLike{}).Where("event_id = ? AND direction = ?", eventID, "dislike").Count(&dislikes)

	var myLike models.EventLike
	myDirection := ""
	if db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&myLike).Error == nil {
		myDirection = myLike.Direction
	}

	c.JSON(http.StatusOK, gin.H{
		"likes":        likes,
		"dislikes":     dislikes,
		"my_direction": myDirection,
	})
}

func SaveEvent(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	var existing models.EventSave
	err := db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&existing).Error

	if err == nil {
		db.DB.Delete(&existing)
		c.JSON(http.StatusOK, gin.H{"saved": false})
		return
	}

	db.DB.Create(&models.EventSave{
		UserID:  userID.(uint),
		EventID: parseUint(eventID),
	})
	c.JSON(http.StatusOK, gin.H{"saved": true})
}

func GetMySavedEvents(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var saves []models.EventSave
	db.DB.Where("user_id = ?", userID).Find(&saves)

	var ids []uint
	for _, s := range saves {
		ids = append(ids, s.EventID)
	}

	events := []models.Event{}
	if len(ids) > 0 {
		db.DB.Where("id IN ?", ids).Find(&events)
	}

	c.JSON(http.StatusOK, events)
}