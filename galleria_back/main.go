package main

import (
	"galleria_back/db"
	"galleria_back/handlers"
	"galleria_back/middleware"
	"galleria_back/models"
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
	)

	db.SeedEvents()

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
	r.POST("/auth/login",    handlers.Login)
	r.GET("/events",         handlers.GetAllEvents)
	r.GET("/events/:id",     handlers.GetEvent)
	r.GET("/events/cities", handlers.GetCities)

	// Protected routes
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.POST("/events",              handlers.CreateEvent)
		protected.POST("/events/:id/book",     handlers.BookEvent)
		protected.GET("/community",            handlers.GetPosts)
		protected.GET("/bookings/my",         handlers.GetMyBookings)  

		protected.POST("/community",           handlers.CreatePost)
		protected.POST("/community/:id/vote",  handlers.VotePost)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}