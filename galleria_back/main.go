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
	r.GET("/events/feed", handlers.GetFeedEvents) // ← new public route

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
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
