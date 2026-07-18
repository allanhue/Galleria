package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetEventAnalytics(c *gin.Context) {
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

	// bookings over time — last 30 days
	type DailyBooking struct {
		Date  string `json:"date"`
		Count int64  `json:"count"`
	}

	var dailyBookings []DailyBooking
	db.DB.Raw(`
		SELECT DATE(created_at) as date, COUNT(*) as count
		FROM bookings
		WHERE event_id = ? AND status = 'confirmed'
		AND created_at >= NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`, id).Scan(&dailyBookings)

	// revenue
	var revenue int64
	db.DB.Raw(`
		SELECT COALESCE(SUM(amount), 0)
		FROM payments
		WHERE event_id = ? AND status = 'success'
	`, id).Scan(&revenue)

	// likes vs dislikes
	var likes, dislikes int64
	db.DB.Model(&models.EventLike{}).Where("event_id = ? AND direction = ?", id, "like").Count(&likes)
	db.DB.Model(&models.EventLike{}).Where("event_id = ? AND direction = ?", id, "dislike").Count(&dislikes)

	// saves
	var saves int64
	db.DB.Model(&models.EventSave{}).Where("event_id = ?", id).Count(&saves)

	// reviews avg
	var avgRating float64
	var reviewCount int64
	db.DB.Model(&models.Review{}).Where("event_id = ?", id).Count(&reviewCount)
	if reviewCount > 0 {
		db.DB.Raw(`SELECT AVG(rating) FROM reviews WHERE event_id = ?`, id).Scan(&avgRating)
	}

	// waitlist
	var waitlistCount int64
	db.DB.Model(&models.Waitlist{}).Where("event_id = ? AND notified = ?", id, false).Count(&waitlistCount)

	// capacity
	var booked int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND status = ?", id, "confirmed").Count(&booked)

	// checked in
	var checkedIn int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND checked_in = ?", id, true).Count(&checkedIn)

	c.JSON(http.StatusOK, gin.H{
		"event":          event,
		"booked":         booked,
		"capacity":       event.Capacity,
		"checked_in":     checkedIn,
		"waitlist":       waitlistCount,
		"revenue_kes":    revenue / 100,
		"likes":          likes,
		"dislikes":       dislikes,
		"saves":          saves,
		"avg_rating":     avgRating,
		"review_count":   reviewCount,
		"daily_bookings": dailyBookings,
		"fill_rate":      int(float64(booked) / float64(event.Capacity) * 100),
	})
}

func GetOrganizerOverview(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var totalEvents, totalBookings, totalRevenue int64
	var avgRating float64

	db.DB.Model(&models.Event{}).Where("organizer_id = ?", userID).Count(&totalEvents)

	var eventIDs []uint
	db.DB.Model(&models.Event{}).Where("organizer_id = ?", userID).Pluck("id", &eventIDs)

	if len(eventIDs) > 0 {
		db.DB.Model(&models.Booking{}).
			Where("event_id IN ? AND status = ?", eventIDs, "confirmed").
			Count(&totalBookings)

		db.DB.Raw(`SELECT COALESCE(SUM(amount)/100, 0) FROM payments WHERE event_id IN ? AND status = 'success'`, eventIDs).
			Scan(&totalRevenue)

		db.DB.Raw(`SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE event_id IN ?`, eventIDs).
			Scan(&avgRating)
	}

	// bookings this week
	var thisWeek int64
	weekAgo := time.Now().AddDate(0, 0, -7)
	if len(eventIDs) > 0 {
		db.DB.Model(&models.Booking{}).
			Where("event_id IN ? AND status = ? AND created_at >= ?", eventIDs, "confirmed", weekAgo).
			Count(&thisWeek)
	}

	c.JSON(http.StatusOK, gin.H{
		"total_events":   totalEvents,
		"total_bookings": totalBookings,
		"total_revenue":  totalRevenue,
		"avg_rating":     avgRating,
		"bookings_week":  thisWeek,
	})
}