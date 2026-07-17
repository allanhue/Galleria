package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CheckInAttendee(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Also accept token from query param as fallback
	token := input.Token
	if token == "" {
		token = c.Query("token")
	}

	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	var booking models.Booking
	if err := db.DB.Preload("User").Preload("Event").
		Where("qr_token = ?", token).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid QR code"})
		return
	}

	if booking.Event.OrganizerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the event organizer can check in attendees"})
		return
	}

	if booking.CheckedIn {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Already checked in",
			"booking": booking,
		})
		return
	}

	db.DB.Model(&booking).Update("checked_in", true)
	booking.CheckedIn = true

	c.JSON(http.StatusOK, gin.H{
		"message": "Checked in successfully",
		"booking": booking,
	})
}

func GetCheckinStats(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	if event.OrganizerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your event"})
		return
	}

	var total, checkedIn int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND status = ?", id, "confirmed").Count(&total)
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND checked_in = ?", id, true).Count(&checkedIn)

	c.JSON(http.StatusOK, gin.H{
		"total":      total,
		"checked_in": checkedIn,
		"remaining":  total - checkedIn,
	})
}