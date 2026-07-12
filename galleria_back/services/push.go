package services

import (
	"encoding/json"
	"log"
	"os"

	webpush "github.com/SherClockHolmes/webpush-go"
)

type PushPayload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	URL   string `json:"url"`
}

func SendPush(endpoint, p256dh, auth string, payload PushPayload) error {
	body, _ := json.Marshal(payload)

	resp, err := webpush.SendNotification(body, &webpush.Subscription{
		Endpoint: endpoint,
		Keys: webpush.Keys{
			P256dh: p256dh,
			Auth:   auth,
		},
	}, &webpush.Options{
		VAPIDPublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
		VAPIDPrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
		VAPIDEmail:      os.Getenv("VAPID_EMAIL"),
		TTL:             30,
	})
	if err != nil {
		log.Printf("Push error: %v", err)
		return err
	}
	defer resp.Body.Close()
	return nil
}