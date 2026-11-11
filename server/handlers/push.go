package handlers

import (
	"fmt"
	"log"
	"net/http"
	"server/db"
	"server/models"
	"server/services"

	"github.com/gin-gonic/gin"
)

func SavePushSubscription(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		Endpoint string `json:"endpoint" binding:"required"`
		P256dh   string `json:"p256dh"  binding:"required"`
		Auth     string `json:"auth"     binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub := models.PushSubscription{
		UserID:   userID.(uint),
		Endpoint: input.Endpoint,
		P256dh:   input.P256dh,
		Auth:     input.Auth,
	}
	db.DB.Where("endpoint = ?", input.Endpoint).
		Assign(sub).FirstOrCreate(&sub)

	c.JSON(http.StatusOK, gin.H{"message": "Subscription saved"})
}



func sendPushToUser(userID uint, title, body, url string) {
	var subs []models.PushSubscription
	if err := db.DB.Where("user_id = ?", userID).Find(&subs).Error; err != nil {
		log.Printf("Could not load push subscriptions for user %d: %v", userID, err)
		return
	}

	for _, sub := range subs {
		go func(sub models.PushSubscription) {
			if err := services.SendPush(sub.Endpoint, sub.P256dh, sub.Auth, services.PushPayload{
				Title: title,
				Body:  body,
				URL:   url,
			}); err != nil {
				log.Printf("Could not send push notification to user %d: %v", userID, err)
			}
		}(sub)
	}
}

func createEventUpdateNotification(userID, organizerID uint, event models.Event) error {
	if userID == organizerID {
		return nil
	}

	message := fmt.Sprintf("%q has been updated. Review the latest event details.", event.Title)
	eventID := event.ID
	if err := db.DB.Create(&models.Notification{
		UserID:  userID,
		ActorID: organizerID,
		Type:    "event_update",
		EventID: &eventID,
		Message: message,
	}).Error; err != nil {
		return err
	}

	go sendPushToUser(
		userID,
		"Event updated",
		message,
		fmt.Sprintf("https://galleria-flame-ten.vercel.app/events/%d", event.ID),
	)
	return nil
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

	// send push notification
	go sendPushToUser(userID, "Galleria", message, "https://galleria-flame-ten.vercel.app/")
}