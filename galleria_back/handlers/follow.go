package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func FollowUser(c *gin.Context) {
	targetID := c.Param("userId")
	userID, _ := c.Get("user_id")

	if targetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user"})
		return
	}

	target := parseUint(targetID)
	if target == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot follow yourself"})
		return
	}

	var existing models.Follow
	if err := db.DB.Where("follower_id = ? AND following_id = ?", userID, target).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already following"})
		return
	}

	db.DB.Create(&models.Follow{
		FollowerID:  userID.(uint),
		FollowingID: target,
	})

	createNotification(target, userID.(uint), "follow", "Someone started following you", nil, nil)

	c.JSON(http.StatusOK, gin.H{"message": "Followed"})
}

func UnfollowUser(c *gin.Context) {
	targetID := c.Param("userId")
	userID, _ := c.Get("user_id")
	target := parseUint(targetID)

	db.DB.Where("follower_id = ? AND following_id = ?", userID, target).Delete(&models.Follow{})
	c.JSON(http.StatusOK, gin.H{"message": "Unfollowed"})
}

func GetFollowStatus(c *gin.Context) {
	targetID := c.Param("userId")
	userID, _ := c.Get("user_id")
	target := parseUint(targetID)

	var following models.Follow
	isFollowing := db.DB.Where("follower_id = ? AND following_id = ?", userID, target).First(&following).Error == nil

	var followedBy models.Follow
	isFollowedBy := db.DB.Where("follower_id = ? AND following_id = ?", target, userID).First(&followedBy).Error == nil

	c.JSON(http.StatusOK, gin.H{
		"is_following":   isFollowing,
		"is_followed_by": isFollowedBy,
	})
}

func GetMyFollowing(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var follows []models.Follow
	db.DB.Where("follower_id = ?", userID).Find(&follows)

	var ids []uint
	for _, f := range follows {
		ids = append(ids, f.FollowingID)
	}

	users := []models.User{}
	if len(ids) > 0 {
		db.DB.Where("id IN ?", ids).Find(&users)
	}

	c.JSON(http.StatusOK, users)
}