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
    db.DB.Preload("Event").Where("user_id = ?", userID).Find(&bookings)

    c.JSON(http.StatusOK, bookings)
}