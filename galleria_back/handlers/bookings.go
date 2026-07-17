package handlers

import (
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