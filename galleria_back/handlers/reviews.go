package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateReview(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	// must have booked the event
	var booking models.Booking
	if err := db.DB.Where("user_id = ? AND event_id = ? AND status = ?",
		userID, eventID, "confirmed").First(&booking).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You must attend this event to review it"})
		return
	}

	// one review per user per event
	var existing models.Review
	if err := db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already reviewed this event"})
		return
	}

	var input struct {
		Rating  int    `json:"rating"  binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review := models.Review{
		EventID: parseUint(eventID),
		UserID:  userID.(uint),
		Rating:  input.Rating,
		Comment: input.Comment,
	}
	db.DB.Create(&review)
	db.DB.Preload("User").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func GetEventReviews(c *gin.Context) {
	eventID := c.Param("id")

	reviews := []models.Review{}
	db.DB.Preload("User").Where("event_id = ?", eventID).
		Order("created_at desc").Find(&reviews)

	var avgRating float64
	if len(reviews) > 0 {
		total := 0
		for _, r := range reviews {
			total += r.Rating
		}
		avgRating = float64(total) / float64(len(reviews))
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews":    reviews,
		"count":      len(reviews),
		"avg_rating": avgRating,
	})
}