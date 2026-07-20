
# Galleria — Full Project Documentation

> Community-driven events platform for discovering, booking, and discussing events.
> Built with Next.js 16, Go (Gin), PostgreSQL (Neon), Cloudinary, Brevo, Paystack, Capacitor (Android).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Backend (Go)](#5-backend-go)
6. [Frontend (Next.js)](#6-frontend-nextjs)
7. [Mobile (Capacitor)](#7-mobile-capacitor)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [Feature Reference](#10-feature-reference)
11. [Deployment](#11-deployment)
12. [Releasing a New APK](#12-releasing-a-new-apk)
13. [Roadmap](#13-roadmap)

---

## 1. Project Overview

Galleria is a full-stack social events platform. Users can:

- Browse and book events (local + global, free and paid)
- Create and manage events as organizers
- Suggest event ideas and vote, comment, save, repost in a community forum
- Follow other users and send direct messages
- Receive real-time notifications for activity
- Discover people with shared event interests
- Report or block other users
- Pay for tickets via Paystack (M-Pesa, card, bank transfer)
- Subscribe to Pro organizer plan for unlimited events

The app is distributed as:
- A web app at `https://galleria-flame-ten.vercel.app`
- An Android APK on APKPure (`com.galleria.events`)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Clients                         │
│  Next.js (Vercel)     Capacitor APK (APKPure)       │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS REST API
┌────────────────────────▼────────────────────────────┐
│              Go Backend (Render)                    │
│  Gin · GORM · JWT · Brevo · webpush-go · Paystack   │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              PostgreSQL (Neon)                      │
│  Cloud-hosted, serverless free tier                 │
└──────────────────┬──────────────────────────────────┘
                   │
     ┌─────────────▼──────────┐   ┌────────────────┐
     │      Cloudinary        │   │    Paystack     │
     │  Images (avatars,      │   │  Payments KES   │
     │  event photos)         │   │  M-Pesa, Cards  │
     └────────────────────────┘   └────────────────┘
```

---
```

---

## 4. Environment Variables

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=https://galleria-b1yq.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=galleria_uploads
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Backend — Render environment variables

```env
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
JWT_SECRET=your-jwt-secret
BREVO_API_KEY=your-brevo-key
MAIL_FROM=your@email.com
MAIL_FROM_NAME=Galleria
PAYSTACK_SECRET_KEY=sk_live_your_key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your@email.com
APP_URL=https://galleria-flame-ten.vercel.app
PORT=10000
APP_ENV=production
```

---

## 5. Backend (Go)

### Running locally

```bash
cd galleria_back
go mod tidy
go run main.go
```

### Key packages

| Package | Purpose |
|---|---|
| `github.com/gin-gonic/gin` | HTTP router |
| `gorm.io/gorm` | ORM |
| `gorm.io/driver/postgres` | Postgres driver |
| `github.com/golang-jwt/jwt/v5` | JWT tokens |
| `golang.org/x/crypto/bcrypt` | Password hashing |
| `github.com/joho/godotenv` | Env file loading |
| `github.com/gin-contrib/cors` | CORS middleware |
| `github.com/lib/pq` | Postgres array types |
| `github.com/google/uuid` | QR token generation |
| `github.com/SherClockHolmes/webpush-go` | Push notifications |
| `github.com/skip2/go-qr` | QR code generation |

### Auth flow

1. `POST /auth/register` — hash password with bcrypt, create user, send welcome email via Brevo
2. `POST /auth/login` — compare hash, return JWT (7 day expiry)
3. JWT middleware extracts `user_id` and `role` from token, sets on Gin context
4. Protected routes use `c.Get("user_id")` to identify the caller

### Password reset flow

1. `POST /auth/forgot-password` — generates 6-digit code, stores with 15min expiry, emails via Brevo
2. `POST /auth/reset-password` — validates code, hashes new password, marks code as used

### Payment flow

1. Attendee clicks "Pay KES X" on a paid event
2. Frontend calls `POST /events/:id/pay` → backend creates pending Payment record, calls Paystack API
3. Paystack returns `authorization_url` → frontend redirects user to Paystack checkout
4. User pays via M-Pesa, card, or bank transfer on Paystack's hosted page
5. Paystack redirects to `GET /payments/verify?ref=...` on the backend
6. Backend verifies with Paystack API, creates Booking, sends confirmation email, redirects to `/bookings?success=booked`
7. Paystack also sends webhook to `POST /payments/webhook` as a backup

### Organizer plan limits

- Free plan: max 3 events
- Pro plan: unlimited events, KES 1,999/month or KES 19,990/year
- Plan checked on every `POST /events` call

### RSS scheduler

On startup, `services.StartFeedScheduler()` fires immediately then every 30 minutes. Fetches from 10 RSS feeds across Kenya, Nigeria, South Africa, and global sources, deduplicates by URL, saves new items to `feed_events` table.

---

## 6. Frontend (Next.js)

### Running locally

```bash
cd C:\Galleria
npm run dev
```

### Key patterns

**API calls** — all live in `app/lib/api.ts` via a single Axios instance. JWT token automatically attached via interceptor reading from cookies.

**Auth** — user object stored in a cookie (`js-cookie`). Middleware at `app/middleware.ts` protects `/dashboard` and `/profile` routes.

**Image uploads** — `app/lib/upload.ts` uploads directly to Cloudinary from browser using unsigned upload preset. Returns URL saved to backend.

**Polling** — messages polled every 7s, notifications every 10s, unread count every 10s. No WebSocket dependency.

**Navigation** — Instagram-style: fixed top bar (logo + messages + notifications), fixed bottom bar on mobile (5 tabs), desktop horizontal nav in top bar. Settings and sign-out live on the Profile page, not in the navbar.

**Dark mode** — `app/lib/theme.ts` sets `data-theme="dark"` on `<html>` element. CSS variables in `globals.css` respond to the attribute. Theme persisted in localStorage.

**Push notifications** — `app/lib/push.ts` registers service worker at `/sw.js`, requests permission, subscribes user via Web Push API, sends subscription to backend.

---

## 7. Mobile (Capacitor)

App shell loads live from Vercel via `server.url` in `capacitor.config.ts`. No native code beyond Capacitor wrapper.

### Build and release

```powershell
# 1. Bump version in android/app/build.gradle
(Get-Content "android\app\build.gradle") -replace 'versionCode X', 'versionCode Y' | Set-Content "android\app\build.gradle"
(Get-Content "android\app\build.gradle") -replace 'versionName "X.X"', 'versionName "Y.Y"' | Set-Content "android\app\build.gradle"

# 2. Build web + sync
npm run build
npx cap sync android

# 3. Build release APK
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew assembleRelease

# 4. Sign APK
& "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" sign `
  --ks "C:\Galleria\galleria-key.jks" `
  --ks-key-alias galleria `
  --ks-pass pass:galleria123 `
  --key-pass pass:galleria123 `
  --out "app\build\outputs\apk\release\app-release.apk" `
  "app\build\outputs\apk\release\app-release-unsigned.apk"
```

Upload `app-release.apk` to APKPure → Manage Versions → Upload.

> For web-only changes (UI, API, pages): just push to GitHub. Vercel rebuilds automatically, all APK installs pick up changes on next open. New APK only needed for native changes (icon, name, permissions, `capacitor.config.ts`).

---

## 8. Database Schema

| Table | Key columns |
|---|---|
| `users` | id, name, email, password_hash, role, avatar_url |
| `user_settings` | id, user_id, notify_*, allow_messages, allow_follows, profile_visible, theme, language |
| `events` | id, title, description, date, location, city, country, category, capacity, organizer_id, photo_urls, source, is_free, price |
| `event_likes` | id, user_id, event_id, direction (like/dislike) |
| `event_saves` | id, user_id, event_id |
| `bookings` | id, user_id, event_id, status, qr_token, checked_in |
| `waitlists` | id, user_id, event_id, notified |
| `community_posts` | id, title, body, votes, saves, reposts, user_id |
| `post_comments` | id, post_id, user_id, body |
| `votes` | id, user_id, post_id, direction |
| `saved_posts` | id, user_id, post_id |
| `reposts` | id, user_id, post_id |
| `notifications` | id, user_id, actor_id, type, post_id, event_id, message, read |
| `follows` | id, follower_id, following_id |
| `conversations` | id, user_a_id, user_b_id |
| `messages` | id, conversation_id, sender_id, body, read |
| `blocks` | id, blocker_id, blocked_id |
| `reports` | id, reporter_id, target_type, target_id, reason, details, status |
| `reviews` | id, event_id, user_id, rating, comment |
| `feed_events` | id, title, description, link, pub_date, source_name, region |
| `password_resets` | id, user_id, code, expires_at, used |
| `payments` | id, user_id, event_id, type, amount, currency, status, reference, paystack_ref, subscription_plan |
| `organizer_plans` | id, user_id, plan, paystack_sub_code, current_period_end |
| `push_subscriptions` | id, user_id, endpoint, p256dh, auth |

---

## 9. API Reference

### Public routes

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account, sends welcome email |
| POST | `/auth/login` | Login, returns JWT + user |
| POST | `/auth/forgot-password` | Send 6-digit reset code via email |
| POST | `/auth/reset-password` | Reset password with code |
| GET | `/events` | List events (search, filter, paginate) |
| GET | `/events/trending` | Top 6 events by booking count |
| GET | `/events/cities` | Distinct city list |
| GET | `/events/:id` | Single event + capacity + sold-out state |
| GET | `/events/:id/reviews` | Reviews + average rating |
| GET | `/events/feed` | RSS-sourced events by region |
| GET | `/payments/verify` | Paystack callback — verify + create booking |
| POST | `/payments/webhook` | Paystack webhook (charge.success) |

### Protected routes (Bearer JWT required)

| Method | Path | Description |
|---|---|---|
| GET | `/profile/me` | Own profile + stats |
| PUT | `/profile/avatar` | Update avatar URL |
| GET | `/settings` | Get user settings |
| PUT | `/settings` | Update notification/privacy/appearance prefs |
| PUT | `/settings/account` | Update name and email |
| PUT | `/settings/password` | Change password |
| POST | `/events` | Create event (plan limits apply) |
| PUT | `/events/:id` | Update own event |
| DELETE | `/events/:id` | Delete own event |
| POST | `/events/:id/book` | Book free event |
| POST | `/events/:id/pay` | Initiate payment for paid event |
| POST | `/events/:id/review` | Submit star rating (bookers only) |
| POST | `/events/:id/like` | Like or dislike event |
| GET | `/events/:id/likes` | Get like/dislike counts |
| POST | `/events/:id/save` | Toggle save event |
| GET | `/events/saved` | List saved events |
| POST | `/events/:id/waitlist` | Join waitlist (sold out events) |
| DELETE | `/events/:id/waitlist` | Leave waitlist |
| GET | `/events/:id/waitlist/status` | Waitlist position |
| GET | `/events/:id/attendees` | Attendee list (organizer only) |
| GET | `/events/:id/checkin` | Check-in stats (organizer only) |
| POST | `/checkin` | Scan QR and check in attendee |
| GET | `/bookings/my` | My bookings with QR tokens |
| PUT | `/bookings/:id/cancel` | Cancel booking, notifies waitlist |
| GET | `/community` | List community posts |
| POST | `/community` | Create idea post |
| POST | `/community/:id/vote` | Vote up or down |
| POST | `/community/:id/comment` | Add comment |
| GET | `/community/:id/comments` | Get comments |
| DELETE | `/community/comment/:commentId` | Delete own comment |
| POST | `/community/:id/save` | Toggle save post |
| POST | `/community/:id/repost` | Repost |
| DELETE | `/community/:id` | Delete own post |
| GET | `/notifications` | Notifications (auto-expire 24h) |
| PUT | `/notifications/read` | Mark all read |
| DELETE | `/notifications/:id` | Dismiss notification |
| POST | `/follow/:userId` | Follow user |
| DELETE | `/follow/:userId` | Unfollow user |
| GET | `/follow/:userId/status` | Follow status |
| GET | `/follow/following` | List who I follow |
| POST | `/messages/start/:userId` | Start or get conversation |
| GET | `/messages/conversations` | Conversation list with unread counts |
| GET | `/messages/:id` | Messages in conversation (marks read) |
| POST | `/messages/:id` | Send message |
| GET | `/messages/unread` | Total unread count |
| POST | `/block/:userId` | Block user |
| DELETE | `/block/:userId` | Unblock user |
| GET | `/block/mine` | List blocked users |
| POST | `/report` | Submit content or user report |
| GET | `/discover/people` | Interest-based people suggestions |
| GET | `/analytics/overview` | Organizer overview stats |
| GET | `/analytics/events/:id` | Per-event analytics |
| GET | `/dashboard/stats` | Dashboard summary stats |
| POST | `/payments/subscribe` | Initiate organizer Pro subscription |
| GET | `/payments/my` | Payment history |
| GET | `/payments/plan` | Current organizer plan |
| POST | `/push/subscribe` | Save push notification subscription |
| GET | `/admin/reports` | Report queue (system_admin only) |
| PUT | `/admin/reports/:id` | Update report status |

---

## 10. Feature Reference

### Auth
- Register with name, email, password, role (attendee/organizer)
- JWT tokens, 7-day expiry
- Password reset via 6-digit email code, 15-minute expiry
- bcrypt password hashing

### Events
- CRUD with photo uploads (min 2, max 5 via Cloudinary)
- City, country, category filtering
- Keyword search across title, description, location
- Pagination (12 per page)
- Trending events (ranked by booking count)
- Free or paid (KES pricing via Paystack)
- Capacity tracking, sold-out state
- Waitlist with automatic email notification on cancellation
- Like/dislike (dislike count visible to organizer only)
- Save for personal reference
- Star ratings (1-5, bookers only, with comment)
- QR code per booking for physical check-in
- OG meta tags for rich link previews on WhatsApp/Twitter

### Payments (Paystack)
- M-Pesa, card, bank transfer, USSD via Paystack hosted checkout
- Ticket payment creates booking + sends QR confirmation email
- Organizer Pro plan: KES 1,999/month or KES 19,990/year
- Free plan limited to 3 events
- Pro plan: unlimited events + priority listing + analytics
- Webhook verification via HMAC-SHA512 signature

### Community
- Idea posts with title and description
- Upvote/downvote
- Comments with timestamps, delete own
- Save for later (shows in profile Saved tab)
- Repost (shows in profile Reposted tab)
- Report post via overflow menu
- Follow and message other users from post byline

### Follow system
- One-way follow (Twitter model), no approval
- Following someone unlocks DMs
- Block removes follows in both directions
- Follow triggers push notification + bell notification

### Messaging
- Start conversation requires following the target user
- Messages page shows scrollable people-you-follow row + conversations
- 7-second polling for new messages
- Unread badge in navbar, polled every 10 seconds
- Block and report available from chat header

### Notifications
- Triggered by: comment, vote, save, repost, follow, message, waitlist spot
- Auto-expire and delete after 24 hours
- Manual dismiss (X button, hover to reveal)
- Bell icon with unread badge, polled every 10 seconds

### Profile
- Avatar upload via Cloudinary
- Stats: ideas, saved, reposts, bookings
- Tabs: My ideas, Saved, Reposted
- Settings gear icon → `/settings`
- Sign out and organizer dashboard links at bottom

### Settings
- Account: update name, email, change password
- Notifications: toggle each notification type on/off
- Privacy: who can message me, who can follow me, public profile toggle
- Appearance: light/dark/system theme, language selection

### Organizer Tools
- Event management: create, edit, delete, photos
- Attendee list with check-in status and fill rate bar
- QR scanner page for physical check-in at door
- Manual token entry fallback for check-in
- Per-event analytics: bookings over time chart, revenue, likes/dislikes, saves, avg rating
- Overview dashboard: total events, bookings, revenue, bookings this week
- Billing page: current plan, upgrade, payment history

### Trust & Safety
- Block: silently removes follows both ways, prevents messaging and following
- Report: flag posts, comments, events, or users with reason
- Admin report queue at `/admin` (system_admin role only)
- Reports have status: pending, reviewed, actioned, dismissed

### Push Notifications
- Service worker registered at `/sw.js`
- VAPID key pair for server authentication
- Permission requested on login
- Notifications sent for: message, follow, waitlist spot
- Works on Android (Chrome), desktop Chrome/Firefox
- iOS requires PWA install to home screen

### RSS Feeds
- 10 sources: Nation Africa, Pulse Kenya, Standard Media, The Star, Pulse Nigeria, Punch Nigeria, IOL, TimesLIVE, Eventbrite Blog, TimeOut
- Background refresh every 30 minutes via scheduler goroutine
- Deduplicated by URL, stored in `feed_events` table
- Served via `GET /events/feed?region=kenya|africa|global`

---

## 11. Deployment

### Frontend — Vercel

- Repo: `github.com/allanhue/Galleria`
- Auto-deploys on push to `main`
- Framework: Next.js (auto-detected)
- URL: `https://galleria-flame-ten.vercel.app`

### Backend — Render

- Repo: same monorepo, root directory set to `galleria_back`
- Build command: `go build -o app .`
- Start command: `./app`
- Auto-deploys on push to `main`
- URL: `https://galleria-b1yq.onrender.com`

### Database — Neon

- PostgreSQL serverless, free tier
- Tables auto-migrated by GORM on every backend startup
- Connection via `DATABASE_URL` with `sslmode=require`

### Cloudinary

- Free tier (25GB storage)
- Unsigned upload preset: `galleria_uploads`
- Folder: `galleria`
- Images served via CDN automatically

### Paystack

- Test mode for development (`pk_test_`, `sk_test_`)
- Live mode for production (`pk_live_`, `sk_live_`)
- Webhook endpoint: `https://galleria-b1yq.onrender.com/payments/webhook`
- Webhook event: `charge.success`

---

## 12. Releasing a New APK

### When to release a new APK

| Change type | New APK needed? |
|---|---|
| UI, pages, API, bug fixes | No — push to GitHub only |
| App icon, name, splash screen | Yes |
| New Capacitor plugins | Yes |
| `capacitor.config.ts` changes | Yes |

### Version tracking

In `android/app/build.gradle`:
```gradle
versionCode 3        ← increment by 1 each APK release
versionName "1.2"    ← semantic version shown to users
```

### Upload to APKPure

1. Go to `developer.apkpure.com`
2. Open Galleria listing → Manage Versions
3. Drop `app-release.apk` into the upload zone
4. Add "What's New" release notes
5. Submit for review (usually approved within 24-48 hours)

---

## 13. Roadmap

### Remaining planned features

- [ ] Photo/video status on profiles (24h expiry, stories-style)
- [ ] Organizer follower stats
- [ ] Multi-language support (Swahili first)
- [ ] iOS PWA improvements (home screen install prompt)
- [ ] Event sharing with referral tracking
- [ ] Organizer verified badge (manual admin approval)
- [ ] Event recurring schedule (weekly/monthly events)
- [ ] Group events / invite-only events
- [ ] Affiliate/referral program for organizers

### Completed

- [x] Auth (register, login, password reset via email code)
- [x] Events (CRUD, photos, search, filter, pagination, trending)
- [x] Free and paid events (Paystack: M-Pesa, card, bank)
- [x] Organizer Pro subscription (monthly/yearly via Paystack)
- [x] Bookings + QR tickets + check-in scanner
- [x] Capacity tracking + waitlist + auto-notify on cancellation
- [x] Event likes/dislikes (dislike count organizer-only)
- [x] Save events for later
- [x] Star reviews on events (bookers only)
- [x] Community posts (votes, comments, save, repost, delete)
- [x] Follow system (one-way, Twitter model)
- [x] Direct messaging with unread badge + polling
- [x] Push notifications (Web Push API + VAPID)
- [x] Notifications (bell, badge, auto-expire 24h, dismiss)
- [x] Profile with avatar upload + stats + tabs
- [x] Settings (account, notifications, privacy, appearance)
- [x] Dark mode (light/dark/system)
- [x] People discovery (interest-based matching)
- [x] Block + report + admin queue
- [x] Organizer analytics (per-event + overview)
- [x] RSS feed aggregation (multi-region, 30-min refresh)
- [x] Share events (Web Share API + OG meta tags)
- [x] Payment history + downloadable tickets
- [x] Cancel booking + waitlist notification
- [x] Android APK published on APKPure
- [x] Deployed on Vercel + Render + Neon
