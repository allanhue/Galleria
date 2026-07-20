package handlers

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"galleria_back/db"
	"galleria_back/models"
	"galleria_back/services"
	"io"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func generateReference() string {
	return fmt.Sprintf("GAL-%d-%d", time.Now().UnixMilli(), rand.Intn(9999))
}

func InitiateTicketPayment(c *gin.Context) {
	eventID := c.Param("id")
	userID, _ := c.Get("user_id")

	var event models.Event
	if err := db.DB.First(&event, eventID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	if event.IsFree {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This event is free, use the regular booking endpoint"})
		return
	}

	var user models.User
	db.DB.First(&user, userID)

	var existing models.Booking
	if db.DB.Where("user_id = ? AND event_id = ?", userID, eventID).First(&existing).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already booked"})
		return
	}

	reference := generateReference()
	amountKobo := event.Price * 100

	eid := event.ID
	db.DB.Create(&models.Payment{
		UserID:    userID.(uint),
		EventID:   &eid,
		Type:      "ticket",
		Amount:    amountKobo,
		Currency:  "KES",
		Status:    "pending",
		Reference: reference,
	})

	callbackURL := fmt.Sprintf("%s/payments/verify?ref=%s",
		"https://galleria-b1yq.onrender.com", reference)

	result, err := services.PaystackInitialize(
		user.Email, amountKobo, reference, callbackURL,
		map[string]interface{}{"event_id": event.ID, "user_id": userID},
	)
	if err != nil || !result.Status {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Payment initialization failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"authorization_url": result.Data.AuthorizationURL,
		"reference":         reference,
		"amount":            event.Price,
	})
}

func VerifyPayment(c *gin.Context) {
	reference := c.Query("ref")
	if reference == "" {
		c.Redirect(http.StatusFound, "https://galleria-flame-ten.vercel.app/bookings?error=missing_ref")
		return
	}

	result, err := services.PaystackVerify(reference)
	if err != nil || result.Data.Status != "success" {
		c.Redirect(http.StatusFound, "https://galleria-flame-ten.vercel.app/bookings?error=payment_failed")
		return
	}

	var payment models.Payment
	if err := db.DB.Where("reference = ?", reference).First(&payment).Error; err != nil {
		c.Redirect(http.StatusFound, "https://galleria-flame-ten.vercel.app/bookings?error=not_found")
		return
	}

	if payment.Status == "success" {
		c.Redirect(http.StatusFound, "https://galleria-flame-ten.vercel.app/bookings?success=already_verified")
		return
	}

	db.DB.Model(&payment).Updates(map[string]interface{}{
		"status":       "success",
		"paystack_ref": result.Data.Reference,
	})

	if payment.EventID != nil {
		qrToken := fmt.Sprintf("%d-%d", payment.UserID, time.Now().UnixNano())
		booking := models.Booking{
			UserID:  payment.UserID,
			EventID: *payment.EventID,
			Status:  "confirmed",
			QRToken: qrToken,
		}
		db.DB.Create(&booking)

		var user models.User
		var event models.Event
		db.DB.First(&user, payment.UserID)
		db.DB.First(&event, *payment.EventID)

		services.SendMail(
			user.Email, user.Name,
			"Payment Confirmed — "+event.Title,
			fmt.Sprintf(`
				<h1>Payment successful!</h1>
				<p>You've paid KES %d for <b>%s</b></p>
				<p>Your check-in code: <b>%s</b></p>
			`, payment.Amount/100, event.Title, qrToken),
		)

		c.Redirect(http.StatusFound,
			fmt.Sprintf("https://galleria-flame-ten.vercel.app/bookings?success=booked&event=%d",
				*payment.EventID))
		return
	}

	if payment.Type == "subscription" {
		var plan models.OrganizerPlan
		db.DB.Where("user_id = ?", payment.UserID).
			FirstOrCreate(&plan, models.OrganizerPlan{UserID: payment.UserID})

		periodEnd := time.Now().AddDate(0, 1, 0)
		if payment.SubscriptionPlan == "pro_yearly" {
			periodEnd = time.Now().AddDate(1, 0, 0)
		}

		db.DB.Model(&plan).Updates(map[string]interface{}{
			"plan":               "pro",
			"current_period_end": periodEnd,
		})

		c.Redirect(http.StatusFound,
			"https://galleria-flame-ten.vercel.app/dashboard/billing?success=subscribed")
		return
	}

	c.Redirect(http.StatusFound,
		"https://galleria-flame-ten.vercel.app/bookings?success=payment_done")
}

func InitiateSubscription(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		Plan string `json:"plan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	amounts := map[string]int64{
		"pro_monthly": 199900,
		"pro_yearly":  1999000,
	}

	amount, ok := amounts[input.Plan]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan"})
		return
	}

	var user models.User
	db.DB.First(&user, userID)

	reference := generateReference()

	db.DB.Create(&models.Payment{
		UserID:           userID.(uint),
		Type:             "subscription",
		Amount:           amount,
		Currency:         "KES",
		Status:           "pending",
		Reference:        reference,
		SubscriptionPlan: input.Plan,
	})

	callbackURL := fmt.Sprintf("%s/payments/verify?ref=%s",
		"https://galleria-b1yq.onrender.com", reference)

	result, err := services.PaystackInitialize(
		user.Email, amount, reference, callbackURL,
		map[string]interface{}{"plan": input.Plan, "user_id": userID},
	)
	if err != nil || !result.Status {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Subscription initialization failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"authorization_url": result.Data.AuthorizationURL,
		"reference":         reference,
		"plan":              input.Plan,
	})
}

func PaystackWebhook(c *gin.Context) {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")

	body, _ := io.ReadAll(c.Request.Body)

	mac := hmac.New(sha512.New, []byte(secretKey))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	signature := c.GetHeader("x-paystack-signature")

	if signature != expected {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	var event map[string]interface{}
	json.Unmarshal(body, &event)

	eventType, _ := event["event"].(string)

	if eventType == "charge.success" {
		data, _ := event["data"].(map[string]interface{})
		reference, _ := data["reference"].(string)

		var payment models.Payment
		if db.DB.Where("reference = ?", reference).First(&payment).Error == nil {
			db.DB.Model(&payment).Update("status", "success")

			if payment.Type == "subscription" {
				var plan models.OrganizerPlan
				db.DB.Where("user_id = ?", payment.UserID).
					FirstOrCreate(&plan, models.OrganizerPlan{UserID: payment.UserID})

				periodEnd := time.Now().AddDate(0, 1, 0)
				if payment.SubscriptionPlan == "pro_yearly" {
					periodEnd = time.Now().AddDate(1, 0, 0)
				}

				db.DB.Model(&plan).Updates(map[string]interface{}{
					"plan":               "pro",
					"current_period_end": periodEnd,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func GetMyPayments(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var payments []models.Payment
	db.DB.Where("user_id = ? AND status = ?", userID, "success").
		Order("created_at desc").Find(&payments)

	c.JSON(http.StatusOK, payments)
}

func GetOrganizerPlan(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var plan models.OrganizerPlan
	err := db.DB.Where("user_id = ?", userID).First(&plan).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"plan": "free"})
		return
	}

	if plan.Plan == "pro" && time.Now().After(plan.CurrentPeriodEnd) {
		db.DB.Model(&plan).Update("plan", "free")
		c.JSON(http.StatusOK, gin.H{"plan": "free"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plan":               plan.Plan,
		"current_period_end": plan.CurrentPeriodEnd,
	})
}