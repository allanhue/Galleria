package main

import (
    "gatherly/backend/db"
    "gatherly/backend/models"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "log"
)

func main() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    db.Connect()

    // Auto create tables
    db.DB.AutoMigrate(&models.User{})

    r := gin.Default()

    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "Gatherly API running"})
    })

    r.Run(":8080")
}