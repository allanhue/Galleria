package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"os"
	"strings"
	"time"
)

type BrevoMail struct {
	Sender      BrevoContact   `json:"sender"`
	To          []BrevoContact `json:"to"`
	Subject     string         `json:"subject"`
	HTMLContent string         `json:"htmlContent"`
}

type BrevoContact struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// EmailTemplate wraps content in a professional HTML email template
func EmailTemplate(content string) string {
	return strings.Replace(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="light">
	<title>Galleria</title>
	<style>
		body { margin: 0; padding: 0; background: #f2f1f7; color: #25243a; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; }
		table { border-collapse: collapse; }
		.email-shell { width: 100%; background: #f3f4f6; padding: 36px 16px; }
		.email-card { width: 100%; max-width: 600px; background: #ffffff; border: 1px solid #e4e6eb; border-radius: 8px; overflow: hidden; }
		.email-preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
		.email-content { padding: 34px 42px 36px; font-size: 14px; line-height: 1.7; color: #505564; }
		.email-content h1 { margin: 0 0 15px; color: #202734; font-size: 25px; line-height: 1.3; letter-spacing: -0.4px; }
		.email-content h2 { margin: 26px 0 12px; color: #252d3b; font-size: 18px; line-height: 1.35; }
		.email-content p { margin: 0 0 16px; }
		.email-content strong, .email-content b { color: #252d3b; font-weight: 700; }
		.email-content a:not(.cta-button) { color: #3730a9; }
		.eyebrow { margin-bottom: 9px !important; color: #6861a7; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; line-height: 1.4; text-transform: uppercase; }
		.cta-button { display: inline-block; margin: 8px 0 4px; padding: 13px 22px; background: #3730a9; border: 1px solid #3730a9; border-radius: 5px; color: #ffffff !important; font-size: 14px; font-weight: 700; line-height: 1.3; text-decoration: none; }
		.code-block { margin: 22px 0; padding: 18px; background: #f6f7f9; border: 1px solid #e4e6eb; border-radius: 5px; color: #202734; font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700; letter-spacing: 5px; text-align: center; }
		.highlight { margin: 22px 0; padding: 15px 18px; background: #f6f7fa; border-left: 3px solid #6b63b9; color: #4b5360; font-size: 14px; }
		.success-box { margin: 22px 0; padding: 15px 18px; background: #f2f8f4; border: 1px solid #d8e9dc; border-radius: 5px; color: #315e3d; font-size: 14px; }
		.detail-card { margin: 22px 0; padding: 18px 20px; background: #f8f9fb; border: 1px solid #e7e9ed; border-radius: 5px; }
		.detail-card p { margin: 0 0 7px; }
		.detail-card p:last-child { margin-bottom: 0; }
		.divider { height: 1px; margin: 28px 0; border: 0; background: #e9e8ef; }
		.email-footer { padding: 20px 42px 24px; border-top: 1px solid #eceef1; background: #fbfbfc; color: #747b86; font-size: 12px; line-height: 1.7; }
		.email-footer p { margin: 0 0 6px; }
		.email-footer a { color: #3730a9; font-weight: 700; text-decoration: none; }
		@media only screen and (max-width: 600px) {
			.email-shell { padding: 16px 8px !important; }
			.email-content { padding: 30px 22px !important; }
			.email-content h1 { font-size: 24px !important; }
			.email-footer { padding: 20px 22px !important; }
		}
	</style>
</head>
<body>
	<div class="email-preheader">A quick update from Galleria.</div>
	<table role="presentation" class="email-shell" width="100%" cellpadding="0" cellspacing="0" border="0">
		<tr><td align="center">
			<table role="presentation" class="email-card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
				<tr>
					<td style="padding:20px 42px; background:#ffffff; border-bottom:1px solid #eceef1;">
						<span style="display:inline-block; width:27px; height:27px; margin-right:9px; border-radius:5px; background:#3730a9; color:#ffffff; font-size:16px; font-weight:700; line-height:27px; text-align:center; vertical-align:middle;">G</span>
						<a href="https://galleria-flame-ten.vercel.app" style="color:#252d3b; font-size:14px; font-weight:800; letter-spacing:1.5px; text-decoration:none; vertical-align:middle;">GALLERIA</a>
						<span style="display:block; margin:9px 0 0 36px; color:#858b95; font-size:9px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;">Account notification</span>
					</td>
				</tr>
				<tr><td class="email-content">{{EMAIL_CONTENT}}</td></tr>
				<tr>
					<td class="email-footer">
						<p><strong>Galleria</strong> &middot; Discover events worth showing up for.</p>
						<p><a href="https://galleria-flame-ten.vercel.app">Visit Galleria</a></p>
						<p style="margin-top:14px; color:#8a8991; font-size:11px;">You received this email because you have a Galleria account.</p>
					</td>
				</tr>
			</table>
		</td></tr>
	</table>
</body>
</html>
	`, "{{EMAIL_CONTENT}}", content, 1)
}

func SendMail(toEmail, toName, subject, htmlContent string) error {
	apiKey := os.Getenv("BREVO_API_KEY")
	from := os.Getenv("MAIL_FROM")
	fromName := os.Getenv("MAIL_FROM_NAME")

	mail := BrevoMail{
		Sender:      BrevoContact{Name: fromName, Email: from},
		To:          []BrevoContact{{Name: toName, Email: toEmail}},
		Subject:     subject,
		HTMLContent: EmailTemplate(htmlContent),
	}

	body, _ := json.Marshal(mail)

	req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("api-key", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
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

func SendMessageNotification(toEmail, recipientName, senderName, message string, conversationID uint) error {
	if senderName == "" {
		senderName = "Someone"
	}

	preview := strings.TrimSpace(message)
	if runes := []rune(preview); len(runes) > 240 {
		preview = string(runes[:240]) + "..."
	}

	content := fmt.Sprintf(
		`<p class="eyebrow">Your inbox</p>
        <h1>You have a new message</h1>
        <p><strong>%s</strong> sent you a message on Galleria:</p>
        <div class="highlight" style="white-space:pre-wrap;">%s</div>
        <p><a class="cta-button" href="https://galleria-flame-ten.vercel.app/messages/%d">Open your inbox</a></p>`,
		html.EscapeString(senderName),
		html.EscapeString(preview),
		conversationID,
	)

	return SendMail(toEmail, recipientName, "New message on Galleria", content)
}
