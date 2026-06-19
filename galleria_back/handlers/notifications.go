package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")

	notifications := []models.Notification{}
	db.DB.Preload("Actor").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(50).
		Find(&notifications)

	var unreadCount int64
	db.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Count(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
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

func createNotification(userID, actorID uint, notifType, message string, postID, eventID *uint) {
	if userID == actorID {
		return // don't notify yourself
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