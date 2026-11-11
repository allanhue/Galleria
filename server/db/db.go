package db

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func EnsureEventTicketColumns() error {
	statements := []string{
		`ALTER TABLE events ADD COLUMN IF NOT EXISTS vip_price BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE events ADD COLUMN IF NOT EXISTS vip_capacity INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE events ADD COLUMN IF NOT EXISTS flash_sale_price BIGINT NOT NULL DEFAULT 0`,
		`ALTER TABLE events ADD COLUMN IF NOT EXISTS flash_sale_capacity INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE events ADD COLUMN IF NOT EXISTS flash_sale_starts_at TIMESTAMPTZ`,
		`ALTER TABLE events ADD COLUMN IF NOT EXISTS flash_sale_ends_at TIMESTAMPTZ`,
	}

	for _, statement := range statements {
		if err := DB.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}

func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}

	database, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB = database
	fmt.Println("Database connected...")
}