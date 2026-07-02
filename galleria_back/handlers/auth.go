package handlers

import (
	"fmt"
	"math/rand"
	"time"
	"galleria_back/db"
	"galleria_back/models"
	"galleria_back/services"
	"net/http"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name"     binding:"required"`
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email exists
	var existing models.User
	if err := db.DB.Where("email = ?", input.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	role := input.Role
	if role == "" {
		role = "attendee"
	}

	user := models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
		Role:         role,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Send welcome email
	services.SendMail(
		user.Email,
		user.Name,
		"Welcome to Galleria",
		"<h1>Welcome to Galleria!</h1><p>Thanks for joining. Discover and book events happening around you.</p>",
	)

	c.JSON(http.StatusCreated, gin.H{"message": "Account created", "user": user})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  user,
	})
}
func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// don't reveal if email exists or not
		c.JSON(http.StatusOK, gin.H{"message": "If that email exists you will receive a reset link"})
		return
	}

	// generate a simple 6 digit code
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	expiresAt := time.Now().Add(15 * time.Minute)

	// store it
	db.DB.Create(&models.PasswordReset{
		UserID:    user.ID,
		Code:      code,
		ExpiresAt: expiresAt,
	})

	// send via Brevo
	services.SendMail(
		user.Email,
		user.Name,
		"Reset your Galleria password",
		fmt.Sprintf(`
			<h2>Password reset</h2>
			<p>Your reset code is:</p>
			<h1 style="letter-spacing:8px">%s</h1>
			<p>This code expires in 15 minutes.</p>
			<p>If you didn't request this, ignore this email.</p>
		`, code),
	)

	c.JSON(http.StatusOK, gin.H{"message": "If that email exists you will receive a reset link"})
}

func ResetPassword(c *gin.Context) {
	var input struct {
		Email    string `json:"email"    binding:"required,email"`
		Code     string `json:"code"     binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var reset models.PasswordReset
	if err := db.DB.Where("user_id = ? AND code = ? AND used = ?", user.ID, input.Code, false).
		First(&reset).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired code"})
		return
	}

	if time.Now().After(reset.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code has expired"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	db.DB.Model(&user).Update("password_hash", string(hash))
	db.DB.Model(&reset).Update("used", true)

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}