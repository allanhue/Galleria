package services

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

type BrevoMail struct {
    Sender     BrevoContact   `json:"sender"`
    To         []BrevoContact `json:"to"`
    Subject    string         `json:"subject"`
    HTMLContent string        `json:"htmlContent"`
}

type BrevoContact struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func SendMail(toEmail, toName, subject, htmlContent string) error {
    apiKey  := os.Getenv("BREVO_API_KEY")
    from    := os.Getenv("MAIL_FROM")
    fromName := os.Getenv("MAIL_FROM_NAME")

    mail := BrevoMail{
        Sender: BrevoContact{Name: fromName, Email: from},
        To:     []BrevoContact{{Name: toName, Email: toEmail}},
        Subject:     subject,
        HTMLContent: htmlContent,
    }

    body, _ := json.Marshal(mail)

    req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(body))
    if err != nil {
        return err
    }

    req.Header.Set("api-key", apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("brevo error: %s", resp.Status)
    }

    return nil
}