package models

import "time"

type Payment struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	UserID          uint      `json:"user_id"`
	EventID         *uint     `json:"event_id,omitempty"`
	Type            string    `json:"type"`            // "ticket", "subscription"
	Amount          int64     `json:"amount"`          // in kobo/cents
	Currency        string    `json:"currency" gorm:"default:KES"`
	Status          string    `json:"status" gorm:"default:pending"` // pending, success, failed
	Reference       string    `json:"reference" gorm:"uniqueIndex"`
	PaystackRef     string    `json:"paystack_ref"`
	SubscriptionPlan string   `json:"subscription_plan,omitempty"` // "pro_monthly", "pro_yearly"
	CreatedAt       time.Time `json:"created_at"`

	User  User   `json:"user"  gorm:"foreignKey:UserID"`
}

type OrganizerPlan struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	UserID            uint      `json:"user_id" gorm:"uniqueIndex"`
	Plan              string    `json:"plan" gorm:"default:free"` // "free", "pro"
	PaystackSubCode   string    `json:"paystack_sub_code"`
	CurrentPeriodEnd  time.Time `json:"current_period_end"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}