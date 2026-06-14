package main

import (
    "gatherly/backend/db"
    "gatherly/backend/models"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "log"
    "github.com/gin-gonic/gin/cors"
)

func main() {

    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    db.Connect()

    // Auto create tables
    db.DB.AutoMigrate(&models.User{})

    func withCORS(next http.Handler) http.Handler {
	allowedOrigins := splitCSV(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && contains(allowedOrigins, origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

    r := gin.Default()
    r.Use(cors.Default())
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "Gatherly API running"})
    })

    r.Run(":8080")


}