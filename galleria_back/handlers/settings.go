package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var settings models.UserSettings
	err := db.DB.Where("user_id = ?", userID).First(&settings).Error
	if err != nil {
		// create defaults if none exist
		settings = models.UserSettings{UserID: userID.(uint)}
		db.DB.Create(&settings)
	}

	c.JSON(http.StatusOK, settings)
}

func UpdateSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input models.UserSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var settings models.UserSettings
	err := db.DB.Where("user_id = ?", userID).First(&settings).Error
	if err != nil {
		settings = models.UserSettings{UserID: userID.(uint)}
		db.DB.Create(&settings)
	}

	db.DB.Model(&settings).Updates(input)
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