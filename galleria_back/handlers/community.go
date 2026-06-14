package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetPosts(c *gin.Context) {
	var posts []models.CommunityPost
	db.DB.Preload("User").Order("votes desc").Find(&posts)
	c.JSON(http.StatusOK, posts)
}

func CreatePost(c *gin.Context) {
	var input struct {
		Title string `json:"title" binding:"required"`
		Body  string `json:"body"  binding:"required"`
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

	post := models.CommunityPost{
		Title:  input.Title,
		Body:   input.Body,
		UserID: userID.(uint),
	}

	if err := db.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func VotePost(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Direction string `json:"direction" binding:"required"`
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

	// Check already voted
	var existing models.Vote
	if err := db.DB.Where("user_id = ? AND post_id = ?", userID, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already voted"})
		return
	}

	// Save vote
	vote := models.Vote{
		UserID:    userID.(uint),
		PostID:    uint(0),
		Direction: input.Direction,
	}
	db.DB.Create(&vote)

	// Update vote count
	if input.Direction == "up" {
		db.DB.Model(&models.CommunityPost{}).Where("id = ?", id).UpdateColumn("votes", db.DB.Raw("votes + 1"))
	} else {
		db.DB.Model(&models.CommunityPost{}).Where("id = ?", id).UpdateColumn("votes", db.DB.Raw("votes - 1"))
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote recorded"})
}