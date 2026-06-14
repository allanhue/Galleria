package main

import (
    "galleria_back/db"
    "galleria_back/handlers"
    "galleria_back/models"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "log"
    "github.com/gin-contrib/cors"

)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Fatal("Error loading .env file")
    }

    db.Connect()

    // Auto migrate all models
    db.DB.AutoMigrate(
        &models.User{},
        &models.Event{},
        &models.Booking{},
        &models.CommunityPost{},
        &models.Vote{},
    )

    // Seed Nairobi events
    db.SeedEvents()

    r := gin.Default()

    // Auth
    r.POST("/auth/register", handlers.Register)
    r.POST("/auth/login",    handlers.Login)

    // Events
    r.GET("/events",             handlers.GetAllEvents)
    r.GET("/events/:id",         handlers.GetEvent)
    r.POST("/events",            handlers.CreateEvent)
    r.POST("/events/:id/book",   handlers.BookEvent)

    // Community
    r.GET("/community",              handlers.GetPosts)
    r.POST("/community",             handlers.CreatePost)
    r.POST("/community/:id/vote",    handlers.VotePost)

    r.Run(":8080")
}

// Add after gin.Default()
r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
}))