package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"galleria_back/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAllEvents(c *gin.Context) {
	category := c.Query("category")
	city := c.Query("city")
	country := c.Query("country")

	var dbEvents []models.Event
	query := db.DB

	if category != "" {
		query = query.Where("category = ?", category)
	}
	if city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if country != "" {
		query = query.Where("country ILIKE ?", "%"+country+"%")
	}

	query.Find(&dbEvents)

	rssItems, _ := services.FetchRSSEvents()

	c.JSON(http.StatusOK, gin.H{
		"events": dbEvents,
		"rss":    rssItems,
	})
}
func GetCities(c *gin.Context) {
	var cities []string
	db.DB.Model(&models.Event{}).Distinct().Pluck("city", &cities)
	c.JSON(http.StatusOK, cities)
}

func GetEvent(c *gin.Context) {
	id := c.Param("id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func CreateEvent(c *gin.Context) {
	var input struct {
		Title       string `json:"title"       binding:"required"`
		Description string `json:"description" binding:"required"`
		Date        string `json:"date"        binding:"required"`
		Location    string `json:"location"    binding:"required"`
		Category    string `json:"category"    binding:"required"`
		Capacity    int    `json:"capacity"    binding:"required"`
		ImageURL    string `json:"image_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := models.Event{
		Title:       input.Title,
		Description: input.Description,
		Date:        input.Date,
		Location:    input.Location,
		Category:    input.Category,
		Capacity:    input.Capacity,
		ImageURL:    input.ImageURL,
		Source:      "own",
	}

	if err := db.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func BookEvent(c *gin.Context) {
	id := c.Param("id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// Get user from context (set by auth middleware later)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Check already booked
	var existing models.Booking
	if err := db.DB.Where("user_id = ? AND event_id = ?", userID, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already booked"})
		return
	}

	booking := models.Booking{
		UserID:  userID.(uint),
		EventID: event.ID,
		Status:  "confirmed",
	}

	if err := db.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book"})
		return
	}

	// Send confirmation email
	var user models.User
	db.DB.First(&user, userID)
	services.SendMail(
		user.Email,
		user.Name,
		"Booking Confirmed — "+event.Title,
		"<h1>You're booked!</h1><p>Your spot at <b>"+event.Title+"</b> is confirmed.</p>",
	)

	c.JSON(http.StatusCreated, booking)
}