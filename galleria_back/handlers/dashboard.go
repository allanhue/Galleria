package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetOrganizerStats(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var events []models.Event
	db.DB.Where("organizer_id = ?", userID).Find(&events)

	var eventIDs []uint
	for _, e := range events {
		eventIDs = append(eventIDs, e.ID)
	}

	var totalBookings int64
	if len(eventIDs) > 0 {
		db.DB.Model(&models.Booking{}).
			Where("event_id IN ? AND status = ?", eventIDs, "confirmed").
			Count(&totalBookings)
	}

	type EventSummary struct {
		ID         uint   `json:"id"`
		Title      string `json:"title"`
		Date       string `json:"date"`
		Capacity   int    `json:"capacity"`
		Booked     int64  `json:"booked"`
		Percentage int    `json:"percentage"`
	}

	summaries := []EventSummary{}
	for _, e := range events {
		var booked int64
		db.DB.Model(&models.Booking{}).
			Where("event_id = ? AND status = ?", e.ID, "confirmed").
			Count(&booked)

		pct := 0
		if e.Capacity > 0 {
			pct = int(float64(booked) / float64(e.Capacity) * 100)
		}

		summaries = append(summaries, EventSummary{
			ID: e.ID, Title: e.Title, Date: e.Date,
			Capacity: e.Capacity, Booked: booked, Percentage: pct,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_events":   len(events),
		"total_bookings": totalBookings,
		"events":         summaries,
	})
}