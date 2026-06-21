package main

import (
	"galleria_back/db"
	"galleria_back/handlers"
	"galleria_back/middleware"
	"galleria_back/models"
	"galleria_back/services"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load() // silently ignore if no .env file

	db.Connect()

db.DB.AutoMigrate(
	&models.User{},
	&models.Event{},
	&models.Booking{},
	&models.CommunityPost{},
	&models.Vote{},
	&models.FeedEvent{},
	&models.PostComment{},
	&models.SavedPost{},
	&models.Repost{},
	&models.Notification{}, 
		&models.Follow{},       // new
	&models.Conversation{}, // new
	&models.Message{},      // new
)






	db.SeedEvents()
	services.StartFeedScheduler()

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://galleria-flame-ten.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes
	r.POST("/auth/register", handlers.Register)
	r.POST("/auth/login", handlers.Login)
	r.GET("/events", handlers.GetAllEvents)
	r.GET("/events/:id", handlers.GetEvent)
	r.GET("/events/cities", handlers.GetCities)
	r.GET("/events/feed", handlers.GetFeedEvents) 
	// Protected routes
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.POST("/events", handlers.CreateEvent)
		protected.POST("/events/:id/book", handlers.BookEvent)
		protected.GET("/community", handlers.GetPosts)
		protected.GET("/bookings/my", handlers.GetMyBookings)

		protected.POST("/community", handlers.CreatePost)
		protected.POST("/community/:id/vote", handlers.VotePost)
		// inside protected group
protected.POST("/community/:id/comment", handlers.AddComment)
protected.GET("/community/:id/comments", handlers.GetComments)
protected.POST("/community/:id/save",    handlers.ToggleSave)
protected.GET("/community/saved",        handlers.GetMySaved)
protected.POST("/community/:id/repost",  handlers.RepostPost)
protected.DELETE("/community/comment/:commentId", handlers.DeleteComment)
protected.GET("/profile/me", handlers.GetMyProfile)
protected.PUT("/profile/avatar", handlers.UpdateAvatar)
protected.GET("/notifications",       handlers.GetNotifications)
protected.PUT("/notifications/read",  handlers.MarkNotificationsRead)
protected.PUT("/events/:id",    handlers.UpdateEvent)
protected.DELETE("/events/:id", handlers.DeleteEvent)
protected.DELETE("/community/:id", handlers.DeletePost)

// inside protected group
protected.POST("/follow/:userId",        handlers.FollowUser)
protected.DELETE("/follow/:userId",      handlers.UnfollowUser)
protected.GET("/follow/:userId/status",  handlers.GetFollowStatus)

protected.POST("/messages/start/:userId", handlers.StartConversation)
protected.GET("/messages/conversations",  handlers.GetConversations)
protected.GET("/messages/:id",            handlers.GetMessages)
protected.POST("/messages/:id",           handlers.SendMessage)
protected.DELETE("/notifications/:id", handlers.DismissNotification)
protected.GET("/discover/people", handlers.GetSuggestedPeople)
protected.GET("/follow/following", handlers.GetMyFollowing)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
