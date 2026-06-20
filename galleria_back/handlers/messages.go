package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetOrCreateConversation finds an existing conversation between two users
// or creates one, but only if a follow relationship exists.
func StartConversation(c *gin.Context) {
	targetID := c.Param("userId")
	userID, _ := c.Get("user_id")
	target := parseUint(targetID)

	// Must follow the target to start a conversation
	var follow models.Follow
	if err := db.DB.Where("follower_id = ? AND following_id = ?", userID, target).First(&follow).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Follow this user first to message them"})
		return
	}

	var convo models.Conversation
	err := db.DB.Where(
		"(user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)",
		userID, target, target, userID,
	).First(&convo).Error

	if err != nil {
		convo = models.Conversation{
			UserAID: userID.(uint),
			UserBID: target,
		}
		db.DB.Create(&convo)
	}

	db.DB.Preload("UserA").Preload("UserB").First(&convo, convo.ID)
	c.JSON(http.StatusOK, convo)
}

func GetConversations(c *gin.Context) {
	userID, _ := c.Get("user_id")

	conversations := []models.Conversation{}
	db.DB.Preload("UserA").Preload("UserB").
		Where("user_a_id = ? OR user_b_id = ?", userID, userID).
		Order("created_at desc").
		Find(&conversations)

	type ConvoWithLast struct {
		models.Conversation
		LastMessage *models.Message `json:"last_message"`
		UnreadCount int64           `json:"unread_count"`
	}

	result := []ConvoWithLast{}
	for _, convo := range conversations {
		var lastMsg models.Message
		hasMsg := db.DB.Where("conversation_id = ?", convo.ID).
			Order("created_at desc").First(&lastMsg).Error == nil

		var unread int64
		db.DB.Model(&models.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND read = ?", convo.ID, userID, false).
			Count(&unread)

		item := ConvoWithLast{Conversation: convo, UnreadCount: unread}
		if hasMsg {
			item.LastMessage = &lastMsg
		}
		result = append(result, item)
	}

	c.JSON(http.StatusOK, result)
}

func GetMessages(c *gin.Context) {
	convoID := c.Param("id")
	userID, _ := c.Get("user_id")

	// confirm user belongs to this conversation
	var convo models.Conversation
	if err := db.DB.First(&convo, convoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}
	if convo.UserAID != userID.(uint) && convo.UserBID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your conversation"})
		return
	}

	messages := []models.Message{}
	db.DB.Preload("Sender").
		Where("conversation_id = ?", convoID).
		Order("created_at asc").
		Find(&messages)

	// mark messages from the other person as read
	db.DB.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND read = ?", convoID, userID, false).
		Update("read", true)

	c.JSON(http.StatusOK, messages)
}

func SendMessage(c *gin.Context) {
	convoID := c.Param("id")
	userID, _ := c.Get("user_id")

	var convo models.Conversation
	if err := db.DB.First(&convo, convoID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}
	if convo.UserAID != userID.(uint) && convo.UserBID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your conversation"})
		return
	}

	var input struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := models.Message{
		ConversationID: parseUint(convoID),
		SenderID:       userID.(uint),
		Body:           input.Body,
	}
	db.DB.Create(&message)
	db.DB.Preload("Sender").First(&message, message.ID)

	// notify the other person
	otherID := convo.UserAID
	if otherID == userID.(uint) {
		otherID = convo.UserBID
	}
	createNotification(otherID, userID.(uint), "message", "You have a new message", nil, nil)

	c.JSON(http.StatusCreated, message)
}