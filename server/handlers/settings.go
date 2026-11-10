package handlers

import (
	"server/db"
	"server/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func GetSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var settings models.UserSettings
	err := db.DB.Where("user_id = ?", userID).First(&settings).Error
	if err == gorm.ErrRecordNotFound {
		settings = models.UserSettings{UserID: userID.(uint)}
		if err := db.DB.Create(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize settings"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load settings"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func UpdateSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		NotifyComments            *bool   `json:"notify_comments"`
		NotifyVotes               *bool   `json:"notify_votes"`
		NotifySaves               *bool   `json:"notify_saves"`
		NotifyReposts             *bool   `json:"notify_reposts"`
		NotifyFollows             *bool   `json:"notify_follows"`
		NotifyMessages            *bool   `json:"notify_messages"`
		EmailMessageNotifications *bool   `json:"email_message_notifications"`
		NotifyBookings            *bool   `json:"notify_bookings"`
		AllowMessages             *string `json:"allow_messages"`
		AllowFollows              *string `json:"allow_follows"`
		ProfileVisible            *bool   `json:"profile_visible"`
		Theme                     *string `json:"theme"`
		Language                  *string `json:"language"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.NotifyComments != nil {
		updates["notify_comments"] = *input.NotifyComments
	}
	if input.NotifyVotes != nil {
		updates["notify_votes"] = *input.NotifyVotes
	}
	if input.NotifySaves != nil {
		updates["notify_saves"] = *input.NotifySaves
	}
	if input.NotifyReposts != nil {
		updates["notify_reposts"] = *input.NotifyReposts
	}
	if input.NotifyFollows != nil {
		updates["notify_follows"] = *input.NotifyFollows
	}
	if input.NotifyMessages != nil {
		updates["notify_messages"] = *input.NotifyMessages
	}
	if input.EmailMessageNotifications != nil {
		updates["email_message_notifications"] = *input.EmailMessageNotifications
	}
	if input.NotifyBookings != nil {
		updates["notify_bookings"] = *input.NotifyBookings
	}
	if input.AllowMessages != nil {
		updates["allow_messages"] = *input.AllowMessages
	}
	if input.AllowFollows != nil {
		updates["allow_follows"] = *input.AllowFollows
	}
	if input.ProfileVisible != nil {
		updates["profile_visible"] = *input.ProfileVisible
	}
	if input.Theme != nil {
		updates["theme"] = *input.Theme
	}
	if input.Language != nil {
		updates["language"] = *input.Language
	}

	var settings models.UserSettings
	err := db.DB.Where("user_id = ?", userID).First(&settings).Error
	if err == gorm.ErrRecordNotFound {
		settings = models.UserSettings{UserID: userID.(uint)}
		if err := db.DB.Create(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize settings"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load settings"})
		return
	}

	if len(updates) > 0 {
		if err := db.DB.Model(&settings).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
			return
		}
	}
	if err := db.DB.First(&settings, settings.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load updated settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func UpdateAccountInfo(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Email != "" {
		// check email not taken
		var existing models.User
		if db.DB.Where("email = ? AND id != ?", input.Email, userID).First(&existing).Error == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
		updates["email"] = input.Email
	}

	db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates)

	var user models.User
	db.DB.First(&user, userID)
	c.JSON(http.StatusOK, user)
}

func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password"     binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	db.DB.First(&user, userID)

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.CurrentPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), 12)
	db.DB.Model(&user).Update("password_hash", string(hash))
	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
