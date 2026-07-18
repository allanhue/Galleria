package handlers

import (
	"fmt"
	"galleria_back/db"
	"galleria_back/models"
	"galleria_back/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func JoinWaitlist(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	var event models.Event
	if err := db.DB.First(&event, eventID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// check not already booked
	var booking models.Booking
	if db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&booking).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a booking"})
		return
	}

	// check not already on waitlist
	var existing models.Waitlist
	if db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&existing).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already on waitlist"})
		return
	}

	db.DB.Create(&models.Waitlist{
		UserID:  userID.(uint),
		EventID: event.ID,
	})

	c.JSON(http.StatusCreated, gin.H{"message": "Added to waitlist"})
}

func LeaveWaitlist(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).Delete(&models.Waitlist{})
	c.JSON(http.StatusOK, gin.H{"message": "Removed from waitlist"})
}

func GetWaitlistStatus(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	var entry models.Waitlist
	onList := db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&entry).Error == nil

	var position int64
	if onList {
		db.DB.Model(&models.Waitlist{}).
			Where("event_id = ? AND created_at <= ?", eventID, entry.CreatedAt).
			Count(&position)
	}

	c.JSON(http.StatusOK, gin.H{
		"on_waitlist": onList,
		"position":    position,
	})
}

// Called when a booking is cancelled — notify next person on waitlist
func NotifyWaitlist(eventID uint) {
	var next models.Waitlist
	if err := db.DB.Preload("User").Preload("Event").
		Where("event_id = ? AND notified = ?", eventID, false).
		Order("created_at asc").
		First(&next).Error; err != nil {
		return
	}

	db.DB.Model(&next).Update("notified", true)

	services.SendMail(
		next.User.Email,
		next.User.Name,
		"A spot opened up — "+next.Event.Title,
		fmt.Sprintf(`
			<h2>Good news!</h2>
			<p>A spot just opened up for <b>%s</b> on %s.</p>
			<p>Book now before it fills up again.</p>
			<a href="https://galleria-flame-ten.vercel.app/events/%d">Book my spot</a>
		`, next.Event.Title, next.Event.Date, next.Event.ID),
	)

	createNotification(next.UserID, 0, "waitlist",
		"A spot opened up for "+next.Event.Title+"! Book now.", nil, &eventID)
}