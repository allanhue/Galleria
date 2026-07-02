package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"galleria_back/services"
	"net/http"
    "math"
	"strconv"
	"github.com/gin-gonic/gin"
)


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

	var bookedCount int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND status = ?", id, "confirmed").Count(&bookedCount)

	c.JSON(http.StatusOK, gin.H{
		"id": event.ID, "title": event.Title, "description": event.Description,
		"date": event.Date, "location": event.Location, "city": event.City,
		"country": event.Country, "category": event.Category, "capacity": event.Capacity,
		"organizer_id": event.OrganizerID, "source": event.Source, "photo_urls": event.PhotoURLs,
		"created_at": event.CreatedAt,
		"spots_taken":     bookedCount,
		"spots_remaining": int64(event.Capacity) - bookedCount,
		"sold_out":        bookedCount >= int64(event.Capacity),
	})
}

func CreateEvent(c *gin.Context) {
	var input struct {
		Title       string   `json:"title"       binding:"required"`
		Description string   `json:"description" binding:"required"`
		Date        string   `json:"date"        binding:"required"`
		Location    string   `json:"location"    binding:"required"`
		Category    string   `json:"category"    binding:"required"`
		Capacity    int      `json:"capacity"    binding:"required"`
		PhotoURLs   []string `json:"photo_urls"`
		City        string   `json:"city"`
		Country     string   `json:"country"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	event := models.Event{
		Title:       input.Title,
		Description: input.Description,
		Date:        input.Date,
		Location:    input.Location,
		Category:    input.Category,
		Capacity:    input.Capacity,
		PhotoURLs:   input.PhotoURLs,
		City:        input.City,
		Country:     input.Country,
		Source:      "own",
		OrganizerID: userID.(uint),
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

	var bookedCount int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND status = ?", id, "confirmed").Count(&bookedCount)
	if bookedCount >= int64(event.Capacity) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event is sold out"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

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

	var user models.User
	db.DB.First(&user, userID)
	services.SendMail(user.Email, user.Name, "Booking Confirmed — "+event.Title,
		"<h1>You're booked!</h1><p>Your spot at <b>"+event.Title+"</b> is confirmed.</p>")

	c.JSON(http.StatusCreated, booking)
}


func UpdateEvent(c *gin.Context) {
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

	var input struct {
		Title       string   `json:"title"`
		Description string   `json:"description"`
		Date        string   `json:"date"`
		Location    string   `json:"location"`
		City        string   `json:"city"`
		Country     string   `json:"country"`
		Category    string   `json:"category"`
		Capacity    int      `json:"capacity"`
		PhotoURLs   []string `json:"photo_urls"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.DB.Model(&event).Updates(models.Event{
		Title: input.Title, Description: input.Description, Date: input.Date,
		Location: input.Location, City: input.City, Country: input.Country,
		Category: input.Category, Capacity: input.Capacity, PhotoURLs: input.PhotoURLs,
	})

	c.JSON(http.StatusOK, event)
}

func DeleteEvent(c *gin.Context) {
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

	db.DB.Delete(&event)
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted"})
}

func GetAllEvents(c *gin.Context) {
	category := c.Query("category")
	city     := c.Query("city")
	country  := c.Query("country")
	search   := c.Query("search")
	page     := 1
	limit    := 12

	if p := c.Query("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 {
			page = n
		}
	}
	offset := (page - 1) * limit

	query := db.DB.Model(&models.Event{})
	if category != "" { query = query.Where("category = ?", category) }
	if city     != "" { query = query.Where("city ILIKE ?",     "%"+city+"%") }
	if country  != "" { query = query.Where("country ILIKE ?",  "%"+country+"%") }
	if search   != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR location ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var dbEvents []models.Event
	query.Order("created_at desc").Limit(limit).Offset(offset).Find(&dbEvents)

	c.JSON(http.StatusOK, gin.H{
		"events":  dbEvents,
		"total":   total,
		"page":    page,
		"limit":   limit,
		"pages":   int(math.Ceil(float64(total) / float64(limit))),
	})
}



