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
    Sender     BrevoContact   `json:"sender"`
    To         []BrevoContact `json:"to"`
    Subject    string         `json:"subject"`
    HTMLContent string        `json:"htmlContent"`
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
		body { margin: 0; padding: 0; background: #f4f3ef; color: #20202a; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; }
		table { border-collapse: collapse; }
		.email-shell { width: 100%; background: #f4f3ef; padding: 32px 16px; }
		.email-card { width: 100%; max-width: 600px; background: #ffffff; }
		.email-content { padding: 42px 44px 40px; font-size: 15px; line-height: 1.7; color: #454550; }
		.email-content h1 { margin: 0 0 18px; color: #171722; font-size: 26px; line-height: 1.25; letter-spacing: -0.5px; }
		.email-content h2 { margin: 28px 0 12px; color: #252531; font-size: 18px; line-height: 1.35; }
		.email-content p { margin: 0 0 16px; }
		.email-content strong, .email-content b { color: #20202a; font-weight: 700; }
		.email-content a:not(.cta-button) { color: #3730a9; }
		.cta-button { display: inline-block; margin: 10px 0 4px; padding: 12px 20px; background: #3730a9; border: 1px solid #3730a9; border-radius: 4px; color: #ffffff !important; font-size: 14px; font-weight: 700; line-height: 1.3; text-decoration: none; }
		.code-block { margin: 22px 0; padding: 18px; background: #f5f5f7; border: 1px solid #e4e3e9; color: #171722; font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; letter-spacing: 4px; text-align: center; }
		.highlight { margin: 20px 0; padding: 14px 16px; background: #f7f6fb; border-left: 3px solid #3730a9; color: #343343; font-size: 14px; }
		.success-box { margin: 20px 0; padding: 14px 16px; background: #f3f8f4; border: 1px solid #d6e8d9; color: #285a35; font-size: 14px; }
		.divider { height: 1px; margin: 28px 0; border: 0; background: #e8e7e2; }
		.email-footer { padding: 22px 32px 26px; border-top: 1px solid #e8e7e2; color: #777782; font-size: 12px; line-height: 1.7; }
		.email-footer p { margin: 0 0 6px; }
		.email-footer a { color: #3730a9; font-weight: 700; text-decoration: none; }
		@media only screen and (max-width: 600px) {
			.email-shell { padding: 12px 8px !important; }
			.email-content { padding: 30px 22px !important; }
			.email-content h1 { font-size: 23px !important; }
			.email-footer { padding: 20px 22px !important; }
		}
	</style>
</head>
<body>
	<table role="presentation" class="email-shell" width="100%" cellpadding="0" cellspacing="0" border="0">
		<tr><td align="center">
			<table role="presentation" class="email-card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; border:1px solid #e8e7e2;">
				<tr>
					<td style="padding:24px 44px 20px; border-bottom:3px solid #3730a9;">
						<a href="https://galleria-flame-ten.vercel.app" style="color:#171722; font-size:18px; font-weight:800; letter-spacing:2px; text-decoration:none;">GALLERIA</a>
						<span style="display:block; margin-top:5px; color:#777782; font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase;">Events and community</span>
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
    apiKey  := os.Getenv("BREVO_API_KEY")
    from    := os.Getenv("MAIL_FROM")
    fromName := os.Getenv("MAIL_FROM_NAME")

    mail := BrevoMail{
        Sender: BrevoContact{Name: fromName, Email: from},
        To:     []BrevoContact{{Name: toName, Email: toEmail}},
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
        `<h1>New message</h1>
        <p><strong>%s</strong> sent you a message on Galleria:</p>
        <p style="white-space: pre-wrap; background: #f5f5f5; padding: 16px; border-radius: 4px;">%s</p>
        <p><a class="cta-button" href="https://galleria-flame-ten.vercel.app/messages/%d">Open your inbox</a></p>`,
        html.EscapeString(senderName),
        html.EscapeString(preview),
        conversationID,
    )

    return SendMail(toEmail, recipientName, "New message on Galleria", content)
}