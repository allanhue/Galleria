package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")

	cutoff := time.Now().Add(-24 * time.Hour)

	// auto-delete anything older than 24h, keeps table clean
	db.DB.Where("created_at < ?", cutoff).Delete(&models.Notification{})

	notificationsList := []models.Notification{}
	db.DB.Preload("Actor").
		Where("user_id = ? AND created_at >= ?", userID, cutoff).
		Order("created_at desc").
		Limit(50).
		Find(&notificationsList)

	var unreadCount int64
	db.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ? AND created_at >= ?", userID, false, cutoff).
		Count(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notificationsList,
		"unread_count":  unreadCount,
	})
}

func MarkNotificationsRead(c *gin.Context) {
	userID, _ := c.Get("user_id")
	db.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Update("read", true)
	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

func DismissNotification(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var notif models.Notification
	if err := db.DB.First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}
	if notif.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your notification"})
		return
	}

	db.DB.Delete(&notif)
	c.JSON(http.StatusOK, gin.H{"message": "Dismissed"})
}

func createNotification(userID, actorID uint, notifType, message string, postID, eventID *uint) {
	if userID == actorID {
		return
	}
	db.DB.Create(&models.Notification{
		UserID:  userID,
		ActorID: actorID,
		Type:    notifType,
		PostID:  postID,
		EventID: eventID,
		Message: message,
	})
}