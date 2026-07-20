package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galleria</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .email-header {
            background: linear-gradient(135deg, #3730A9 0%, #5B5AC7 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-bottom: 4px solid #2F2A8C;
        }
        
        .email-header h1 {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0;
        }
        
        .email-body {
            padding: 40px 30px;
        }
        
        .email-body h1 {
            font-size: 24px;
            color: #14131F;
            margin-bottom: 20px;
            font-weight: 700;
        }
        
        .email-body h2 {
            font-size: 20px;
            color: #3730A9;
            margin-top: 25px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .email-body p {
            font-size: 14px;
            color: #555;
            margin-bottom: 15px;
            line-height: 1.8;
        }
        
        .email-body b, .email-body strong {
            color: #3730A9;
            font-weight: 600;
        }
        
        .code-block {
            background-color: #f5f5f5;
            border-left: 4px solid #3730A9;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 18px;
            letter-spacing: 4px;
            text-align: center;
            color: #14131F;
            font-weight: 600;
            border-radius: 4px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3730A9 0%, #5B5AC7 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .divider {
            border: none;
            border-top: 1px solid #E4E1D8;
            margin: 30px 0;
        }
        
        .highlight {
            background-color: #FFF7E6;
            padding: 15px;
            border-left: 4px solid #F59E0B;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 13px;
            color: #92400E;
        }
        
        .success-box {
            background-color: #F0FDF4;
            border: 1px solid #86EFAC;
            border-left: 4px solid #22C55E;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
            color: #15803D;
        }
        
        .email-footer {
            background-color: #FAF9F6;
            border-top: 1px solid #E4E1D8;
            padding: 30px;
            text-align: center;
            color: #999;
            font-size: 12px;
            line-height: 1.8;
        }
        
        .email-footer p {
            margin-bottom: 8px;
        }
        
        .email-footer a {
            color: #3730A9;
            text-decoration: none;
            font-weight: 600;
        }
        
        .email-footer a:hover {
            text-decoration: underline;
        }
        
        .social-links {
            margin-top: 15px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #3730A9;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
        }
        
        @media (max-width: 600px) {
            .email-body {
                padding: 25px 15px;
            }
            
            .email-body h1 {
                font-size: 20px;
            }
            
            .code-block {
                font-size: 14px;
                letter-spacing: 2px;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>GALLERIA</h1>
        </div>
        
        <div class="email-body">
            %s
        </div>
        
        <div class="email-footer">
            <p><strong>Galleria</strong> — Discover and Book Events</p>
            <p>© 2026 Galleria. All rights reserved.</p>
            <div class="social-links">
                <a href="https://galleria-flame-ten.vercel.app">Visit Galleria</a>
            </div>
            <p style="margin-top: 15px; font-size: 11px; color: #ccc;">
                You received this email because you have an account with Galleria.
            </p>
        </div>
    </div>
</body>
</html>
    `, content)
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
