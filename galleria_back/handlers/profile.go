package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMyProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	db.DB.First(&user, userID)

	// My posted ideas
	var myPosts []models.CommunityPost
	db.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&myPosts)

	// Saved posts
	var saved []models.SavedPost
	db.DB.Where("user_id = ?", userID).Find(&saved)
	var savedPostIDs []uint
	for _, s := range saved {
		savedPostIDs = append(savedPostIDs, s.PostID)
	}
	var savedPosts []models.CommunityPost
	if len(savedPostIDs) > 0 {
		db.DB.Preload("User").Where("id IN ?", savedPostIDs).Find(&savedPosts)
	}

	// Reposted posts
	var reposts []models.Repost
	db.DB.Where("user_id = ?", userID).Find(&reposts)
	var repostedPostIDs []uint
	for _, r := range reposts {
		repostedPostIDs = append(repostedPostIDs, r.PostID)
	}
	var repostedPosts []models.CommunityPost
	if len(repostedPostIDs) > 0 {
		db.DB.Preload("User").Where("id IN ?", repostedPostIDs).Find(&repostedPosts)
	}

	// Bookings count
	var bookingsCount int64
	db.DB.Model(&models.Booking{}).Where("user_id = ?", userID).Count(&bookingsCount)

	c.JSON(http.StatusOK, gin.H{
		"user":           user,
		"my_posts":       myPosts,
		"saved_posts":    savedPosts,
		"reposted_posts": repostedPosts,
		"stats": gin.H{
			"posts":    len(myPosts),
			"saved":    len(savedPosts),
			"reposts":  len(repostedPosts),
			"bookings": bookingsCount,
		},
	})
}
func UpdateAvatar(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		AvatarURL string `json:"avatar_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", input.AvatarURL)
	c.JSON(http.StatusOK, gin.H{"message": "Avatar updated"})
}