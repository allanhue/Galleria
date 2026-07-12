package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"
    "galleria_back/services"

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
	db.DB.Where("user_id = ?", userID).Find(&subs)

	for _, sub := range subs {
		go services.SendPush(sub.Endpoint, sub.P256dh, sub.Auth, services.PushPayload{
			Title: title,
			Body:  body,
			URL:   url,
		})
	}
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