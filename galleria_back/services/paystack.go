package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type PaystackInitResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

type PaystackVerifyResponse struct {
	Status bool   `json:"status"`
	Data   struct {
		Status    string `json:"status"`
		Reference string `json:"reference"`
		Amount    int64  `json:"amount"`
		Customer  struct {
			Email string `json:"email"`
		} `json:"customer"`
	} `json:"data"`
}

func PaystackInitialize(email string, amountKobo int64, reference, callbackURL string, metadata map[string]interface{}) (*PaystackInitResponse, error) {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")

	payload := map[string]interface{}{
		"email":        email,
		"amount":       amountKobo,
		"reference":    reference,
		"callback_url": callbackURL,
		"metadata":     metadata,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.paystack.co/transaction/initialize", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+secretKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result PaystackInitResponse
	json.NewDecoder(resp.Body).Decode(&result)
	return &result, nil
}

func PaystackVerify(reference string) (*PaystackVerifyResponse, error) {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")

	req, _ := http.NewRequest("GET",
		fmt.Sprintf("https://api.paystack.co/transaction/verify/%s", reference),
		nil,
	)
	req.Header.Set("Authorization", "Bearer "+secretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result PaystackVerifyResponse
	json.NewDecoder(resp.Body).Decode(&result)
	return &result, nil
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

    services.SendMail(user.Email, user.Name,
      "Payment Confirmed — "+event.Title,
      fmt.Sprintf(`
        <h1>Payment successful!</h1>
        <p>You've paid KES %d for <b>%s</b></p>
        <p>Your check-in code: <b>%s</b></p>
      `, payment.Amount/100, event.Title, qrToken),
    )

    // redirect to bookings page with success
    c.Redirect(http.StatusFound,
      fmt.Sprintf("https://galleria-flame-ten.vercel.app/bookings?success=booked&event=%d", *payment.EventID))
    return
  }

  // subscription payment
  if payment.Type == "subscription" {
    var plan models.OrganizerPlan
    db.DB.Where("user_id = ?", payment.UserID).FirstOrCreate(&plan, models.OrganizerPlan{UserID: payment.UserID})

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

  c.Redirect(http.StatusFound, "https://galleria-flame-ten.vercel.app/bookings?success=payment_done")
}