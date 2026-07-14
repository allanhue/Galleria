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