package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetPosts(c *gin.Context) {
	var posts []models.CommunityPost
	db.DB.Preload("User").Preload("Comments.User").Order("votes desc").Find(&posts)
	c.JSON(http.StatusOK, posts)
}

func CreatePost(c *gin.Context) {
	var input struct {
		Title string `json:"title" binding:"required"`
		Body  string `json:"body"  binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("user_id")

	post := models.CommunityPost{
		Title:  input.Title,
		Body:   input.Body,
		UserID: userID.(uint),
	}
	if err := db.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}
	db.DB.Preload("User").First(&post, post.ID)
	c.JSON(http.StatusCreated, post)
}

func VotePost(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Direction string `json:"direction" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("user_id")

	var existing models.Vote
	if err := db.DB.Where("user_id = ? AND post_id = ?", userID, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already voted"})
		return
	}

	db.DB.Create(&models.Vote{UserID: userID.(uint), PostID: parseUint(id), Direction: input.Direction})

	if input.Direction == "up" {
		db.DB.Model(&models.CommunityPost{}).Where("id = ?", id).Update("votes", gorm.Expr("votes + 1"))
	} else {
		db.DB.Model(&models.CommunityPost{}).Where("id = ?", id).Update("votes", gorm.Expr("votes - 1"))
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote recorded"})
}

func AddComment(c *gin.Context) {
	postID := c.Param("id")
	var input struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("user_id")

	comment := models.PostComment{
		PostID: parseUint(postID),
		UserID: userID.(uint),
		Body:   input.Body,
	}
	if err := db.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}
	db.DB.Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func GetComments(c *gin.Context) {
	postID := c.Param("id")
	var comments []models.PostComment
	db.DB.Preload("User").Where("post_id = ?", postID).Order("created_at asc").Find(&comments)
	c.JSON(http.StatusOK, comments)
}

func ToggleSave(c *gin.Context) {
	postID := c.Param("id")
	userID, _ := c.Get("user_id")

	var existing models.SavedPost
	err := db.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&existing).Error

	if err == nil {
		db.DB.Delete(&existing)
		db.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).Update("saves", gorm.Expr("saves - 1"))
		c.JSON(http.StatusOK, gin.H{"saved": false})
		return
	}

	db.DB.Create(&models.SavedPost{UserID: userID.(uint), PostID: parseUint(postID)})
	db.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).Update("saves", gorm.Expr("saves + 1"))
	c.JSON(http.StatusOK, gin.H{"saved": true})
}

func GetMySaved(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var saved []models.SavedPost
	db.DB.Where("user_id = ?", userID).Find(&saved)

	var postIDs []uint
	for _, s := range saved {
		postIDs = append(postIDs, s.PostID)
	}

	var posts []models.CommunityPost
	db.DB.Preload("User").Where("id IN ?", postIDs).Find(&posts)
	c.JSON(http.StatusOK, posts)
}

func RepostPost(c *gin.Context) {
	postID := c.Param("id")
	userID, _ := c.Get("user_id")

	var existing models.Repost
	if err := db.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already reposted"})
		return
	}

	db.DB.Create(&models.Repost{UserID: userID.(uint), PostID: parseUint(postID)})
	db.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).Update("reposts", gorm.Expr("reposts + 1"))
	c.JSON(http.StatusOK, gin.H{"message": "Reposted"})
}