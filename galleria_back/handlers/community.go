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



// inside ToggleSave, in the "create" branch (not delete):
db.DB.Create(&models.SavedPost{UserID: userID.(uint), PostID: parseUint(postID)})
db.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).Update("saves", gorm.Expr("saves + 1"))

var post models.CommunityPost
if db.DB.First(&post, postID).Error == nil {
	pid := post.ID
	createNotification(post.UserID, userID.(uint), "save", "Someone saved your idea: "+post.Title, &pid, nil)
}
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

	// inside RepostPost, after creating the repost:
db.DB.Create(&models.Repost{UserID: userID.(uint), PostID: parseUint(postID)})
db.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).Update("reposts", gorm.Expr("reposts + 1"))

var post models.CommunityPost
if db.DB.First(&post, postID).Error == nil {
	pid := post.ID
	createNotification(post.UserID, userID.(uint), "repost", "Someone reposted your idea: "+post.Title, &pid, nil)
}
c.JSON(http.StatusOK, gin.H{"message": "Reposted"})

}

func DeleteComment(c *gin.Context) {
	commentID := c.Param("commentId")
	userID, _ := c.Get("user_id")

	var comment models.PostComment
	if err := db.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if comment.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own comment"})
		return
	}

	db.DB.Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
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

	// notify post owner
	var post models.CommunityPost
	if db.DB.First(&post, id).Error == nil {
		pid := post.ID
		verb := "upvoted"
		if input.Direction == "down" { verb = "downvoted" }
		createNotification(post.UserID, userID.(uint), "vote", "Someone "+verb+" your idea: "+post.Title, &pid, nil)
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

	var post models.CommunityPost
	if db.DB.First(&post, postID).Error == nil {
		pid := post.ID
		createNotification(post.UserID, userID.(uint), "comment", "Someone commented on your idea: "+post.Title, &pid, nil)
	}

	c.JSON(http.StatusCreated, comment)
}

func DeletePost(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var post models.CommunityPost
	if err := db.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your post"})
		return
	}

	db.DB.Delete(&post)
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted"})
}