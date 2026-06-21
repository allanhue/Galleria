package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func BlockUser(c *gin.Context) {
	targetID := c.Param("userId")
	userID, _ := c.Get("user_id")
	target := parseUint(targetID)

	if target == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot block yourself"})
		return
	}

	var existing models.Block
	if err := db.DB.Where("blocker_id = ? AND blocked_id = ?", userID, target).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already blocked"})
		return
	}

	db.DB.Create(&models.Block{BlockerID: userID.(uint), BlockedID: target})

	// silently remove any follow relationship in both directions
	db.DB.Where("follower_id = ? AND following_id = ?", userID, target).Delete(&models.Follow{})
	db.DB.Where("follower_id = ? AND following_id = ?", target, userID).Delete(&models.Follow{})

	c.JSON(http.StatusOK, gin.H{"message": "Blocked"})
}

func UnblockUser(c *gin.Context) {
	targetID := c.Param("userId")
	userID, _ := c.Get("user_id")
	target := parseUint(targetID)

	db.DB.Where("blocker_id = ? AND blocked_id = ?", userID, target).Delete(&models.Block{})
	c.JSON(http.StatusOK, gin.H{"message": "Unblocked"})
}

func GetMyBlocked(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var blocks []models.Block
	db.DB.Where("blocker_id = ?", userID).Find(&blocks)

	var ids []uint
	for _, b := range blocks {
		ids = append(ids, b.BlockedID)
	}

	users := []models.User{}
	if len(ids) > 0 {
		db.DB.Where("id IN ?", ids).Find(&users)
	}

	c.JSON(http.StatusOK, users)
}

// IsBlocked checks either direction — used internally by other handlers
func isBlockedEitherWay(userA, userB uint) bool {
	var block models.Block
	err := db.DB.Where(
		"(blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)",
		userA, userB, userB, userA,
	).First(&block).Error
	return err == nil
}