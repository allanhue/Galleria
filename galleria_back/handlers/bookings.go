package handlers

import (
	"fmt"
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMyBookings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var bookings []models.Booking
	db.DB.Preload("Event").
		Where("user_id = ?", userID).
		Find(&bookings)

	// backfill missing QR tokens
	for i, b := range bookings {
		if b.QRToken == "" {
			token := fmt.Sprintf("%d-%d", b.UserID, b.ID)
			db.DB.Model(&bookings[i]).Update("qr_token", token)
			bookings[i].QRToken = token
		}
	}

	c.JSON(http.StatusOK, bookings)
}


func CancelBooking(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var booking models.Booking
	if err := db.DB.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	if booking.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your booking"})
		return
	}

	db.DB.Model(&booking).Update("status", "cancelled")

	// notify next person on waitlist
	go NotifyWaitlist(booking.EventID)

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled"})
}