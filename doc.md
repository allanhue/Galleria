Documentation 


Settings Feature??
Payment Feature ??



Organizer check-in scanner — app/dashboard/checkin/[id]/page.tsx

# Galleria — Full Project Documentation

> Community-driven events platform for discovering, booking, and discussing events.
> Built with Next.js 16, Go (Gin), PostgreSQL (Neon), Cloudinary, Brevo, Capacitor (Android).

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

- Browse and book events (local + global)
- Create and manage events as organizers
- Suggest event ideas and vote, comment, save, repost in a community forum
- Follow other users and send direct messages
- Receive real-time notifications for activity
- Discover people with shared event interests
- Report or block other users

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
│  Gin · GORM · JWT · Brevo · webpush-go              │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              PostgreSQL (Neon)                      │
│  Cloud-hosted, serverless, free tier                │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────▼──────────────┐
         │         Cloudinary           │
         │  Image storage (avatars,     │
         │  event photos)               │
         └──────────────────────────────┘
```

---

## 3. Repository Structure

```
Galleria/
├── app/                        ← Next.js app directory (frontend)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── events/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── client.tsx
│   ├── community/page.tsx
│   ├── bookings/page.tsx
│   ├── messages/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── profile/page.tsx
│   ├── discover/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   ├── edit/[id]/page.tsx
│   │   └── attendees/[id]/page.tsx
│   ├── admin/page.tsx
│   ├── components/
│   │   ├── navbar.tsx
│   │   ├── notification_bell.tsx
│   │   ├── spinner.tsx
│   │   ├── follow_button.tsx
│   │   ├── block_button.tsx
│   │   └── report_modal.tsx
│   ├── lib/
│   │   ├── api.ts              ← all API calls
│   │   └── upload.ts           ← Cloudinary upload helper
│   ├── layout.tsx
│   ├── page.tsx                ← homepage
│   ├── globals.css
│   └── middleware.ts           ← route protection
│
├── galleria_back/              ← Go backend
│   ├── main.go
│   ├── db/
│   │   ├── db.go
│   │   └── seed.go
│   ├── models/
│   │   ├── user.go
│   │   ├── event.go
│   │   ├── booking.go
│   │   ├── community.go
│   │   ├── notification.go
│   │   ├── follow.go
│   │   ├── message.go
│   │   ├── block.go
│   │   ├── report.go
│   │   ├── review.go
│   │   ├── feed_event.go
│   │   └── password_reset.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── events.go
│   │   ├── community.go
│   │   ├── notifications.go
│   │   ├── follow.go
│   │   ├── messages.go
│   │   ├── block.go
│   │   ├── report.go
│   │   ├── reviews.go
│   │   ├── profile.go
│   │   ├── discover.go
│   │   ├── dashboard.go
│   │   └── utils.go
│   ├── middleware/
│   │   └── auth.go             ← JWT middleware
│   └── services/
│       ├── mail.go             ← Brevo email
│       ├── rss.go              ← RSS feed fetcher
│       └── scheduler.go        ← background RSS refresh
│
├── android/                    ← Capacitor Android project
├── public/
│   └── manifest.json           ← PWA manifest
├── capacitor.config.ts
├── next.config.ts
└── tailwind.config.ts
```

---

## 4. Environment Variables

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=https://galleria-b1yq.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=galleria_uploads
```

### Backend — `.env` (Render environment variables)

```env
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
JWT_SECRET=your-jwt-secret
BREVO_API_KEY=your-brevo-key
MAIL_FROM=your@email.com
MAIL_FROM_NAME=Galleria
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

### Auth flow

1. `POST /auth/register` — hash password with bcrypt, create user, send welcome email
2. `POST /auth/login` — compare hash, return JWT (7 day expiry)
3. JWT middleware extracts `user_id` and `role` from token and sets them on Gin context
4. Protected routes use `c.Get("user_id")` to identify the caller

### RSS scheduler

On startup, `services.StartFeedScheduler()` fires immediately then every 30 minutes. It fetches from 10 RSS feeds across Kenya, Nigeria, South Africa, and global sources, deduplicating by URL and saving new items to `feed_events` table.

---

## 6. Frontend (Next.js)

### Running locally

```bash
cd C:\Galleria
npm run dev
```

### Key patterns

**API calls** — all live in `app/lib/api.ts` via a single Axios instance. JWT token is automatically attached to every request via an interceptor reading from cookies.

**Auth** — user object stored in a cookie (`js-cookie`). Middleware at `app/middleware.ts` protects `/dashboard` and `/profile` routes server-side.

**Image uploads** — `app/lib/upload.ts` uploads directly to Cloudinary from the browser using an unsigned upload preset. Returns a URL which is then saved to the backend.

**Polling** — messages and notifications use `setInterval` polling (7s for messages, 10s for notifications, 30s for RSS). No WebSocket dependency.

**Navigation** — Instagram-style: fixed top bar (logo + messages + notifications), fixed bottom bar on mobile (5 tabs), desktop horizontal nav in the top bar.

---

## 7. Mobile (Capacitor)

The app shell loads live from Vercel via `server.url` in `capacitor.config.ts`. No native code beyond the Capacitor wrapper.

### Build and release

```powershell
# 1. Bump version
(Get-Content "android\app\build.gradle") -replace 'versionCode X', 'versionCode Y' | Set-Content "android\app\build.gradle"
(Get-Content "android\app\build.gradle") -replace 'versionName "X.X"', 'versionName "Y.Y"' | Set-Content "android\app\build.gradle"

# 2. Build web
npm run build
npx cap sync android

# 3. Build APK
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew assembleRelease

# 4. Sign
& "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" sign `
  --ks "C:\Galleria\galleria-key.jks" `
  --ks-key-alias galleria `
  --ks-pass pass:galleria123 `
  --key-pass pass:galleria123 `
  --out "app\build\outputs\apk\release\app-release.apk" `
  "app\build\outputs\apk\release\app-release-unsigned.apk"
```

Upload `app-release.apk` to APKPure → Manage Versions → Upload.

> **Note:** For web-only changes (UI, API, pages), just push to GitHub. Vercel rebuilds automatically and all existing APK installs pick up the changes on next open. A new APK is only needed for native changes (app name, icon, permissions, `capacitor.config.ts`).

---

## 8. Database Schema

| Table | Key columns |
|---|---|
| `users` | id, name, email, password_hash, role, avatar_url |
| `events` | id, title, description, date, location, city, country, category, capacity, organizer_id, photo_urls, source |
| `bookings` | id, user_id, event_id, status |
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

---

## 9. API Reference

### Public routes

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/forgot-password` | Send reset code email |
| POST | `/auth/reset-password` | Reset with code |
| GET | `/events` | List events (search, filter, paginate) |
| GET | `/events/trending` | Top 6 events by bookings |
| GET | `/events/cities` | List distinct cities |
| GET | `/events/:id` | Single event + capacity stats |
| GET | `/events/:id/reviews` | Event reviews + avg rating |
| GET | `/events/feed` | RSS-sourced events by region |

### Protected routes (JWT required)

| Method | Path | Description |
|---|---|---|
| GET | `/profile/me` | Own profile + stats |
| PUT | `/profile/avatar` | Update avatar URL |
| POST | `/events` | Create event |
| PUT | `/events/:id` | Update own event |
| DELETE | `/events/:id` | Delete own event |
| POST | `/events/:id/book` | Book a spot |
| POST | `/events/:id/review` | Submit star review |
| GET | `/events/:id/attendees` | Attendee list (organizer only) |
| GET | `/bookings/my` | My bookings |
| GET | `/community` | List community posts |
| POST | `/community` | Create post |
| POST | `/community/:id/vote` | Vote up/down |
| POST | `/community/:id/comment` | Add comment |
| GET | `/community/:id/comments` | Get comments |
| DELETE | `/community/comment/:commentId` | Delete own comment |
| POST | `/community/:id/save` | Toggle save |
| POST | `/community/:id/repost` | Repost |
| DELETE | `/community/:id` | Delete own post |
| GET | `/notifications` | Get notifications (auto-expire 24h) |
| PUT | `/notifications/read` | Mark all read |
| DELETE | `/notifications/:id` | Dismiss notification |
| POST | `/follow/:userId` | Follow user |
| DELETE | `/follow/:userId` | Unfollow user |
| GET | `/follow/:userId/status` | Follow status |
| GET | `/follow/following` | List who I follow |
| POST | `/messages/start/:userId` | Start conversation |
| GET | `/messages/conversations` | List conversations |
| GET | `/messages/:id` | Get messages in conversation |
| POST | `/messages/:id` | Send message |
| GET | `/messages/unread` | Unread message count |
| POST | `/block/:userId` | Block user |
| DELETE | `/block/:userId` | Unblock user |
| GET | `/block/mine` | List blocked users |
| POST | `/report` | Submit report |
| GET | `/discover/people` | Suggested people |
| GET | `/dashboard/stats` | Organizer stats |
| GET | `/admin/reports` | Report queue (system_admin only) |
| PUT | `/admin/reports/:id` | Update report status |

---

## 10. Feature Reference

### Notifications
- Triggered by: comment, vote, save, repost, follow, new message
- Auto-expire after 24 hours (deleted on next fetch)
- Manual dismiss via DELETE `/notifications/:id`
- Bell icon in navbar polls every 10 seconds

### Follow system
- One-way follow (Twitter model)
- Following someone unlocks messaging them
- Block removes follow in both directions
- Follow triggers a notification to the target user

### Messaging
- Conversation created via `POST /messages/start/:userId`
- Requires follower relationship
- Messages polled every 7 seconds
- Unread count polled every 10 seconds, shown as badge in navbar

### RSS feeds
- Sources: Nation Africa, Pulse Kenya, Standard Media, The Star, Pulse Nigeria, Punch Nigeria, IOL, TimesLIVE, Eventbrite Blog, TimeOut
- Refreshed every 30 minutes in background
- Deduplicated by URL

### Event photos
- Uploaded directly to Cloudinary from browser
- Unsigned upload preset `galleria_uploads`
- Min 2, max 5 photos per event
- Stored as `text[]` array in Postgres

### Password reset
- 6-digit code sent via Brevo email
- 15 minute expiry
- Code marked as `used` after successful reset

---

## 11. Deployment

### Frontend — Vercel

- Auto-deploys on every push to `main`
- Environment variables set in Vercel dashboard
- URL: `https://galleria-flame-ten.vercel.app`

### Backend — Render

- Auto-deploys on every push to `main`
- Build command: `go build -o app .`
- Start command: `./app`
- Environment variables set in Render dashboard
- URL: `https://galleria-b1yq.onrender.com`

### Database — Neon

- PostgreSQL, serverless free tier
- Auto-migrated by GORM on every backend startup
- Connection string in `DATABASE_URL`

---

## 12. Releasing a New APK

When to release a new APK (vs just pushing to GitHub):

| Change type | New APK needed? |
|---|---|
| UI changes, new pages, API changes | ❌ No — push to GitHub, Vercel rebuilds |
| App icon, name, splash screen | ✅ Yes |
| New Capacitor plugins or permissions | ✅ Yes |
| `capacitor.config.ts` changes | ✅ Yes |

Version tracking in `android/app/build.gradle`:
```gradle
versionCode 2        ← increment by 1 each APK release
versionName "1.1"    ← semantic version shown to users
```

---

## 13. Roadmap

### In progress / next
- [ ] Share events (Web Share API + OG meta tags)
- [ ] QR code check-in for organizers
- [ ] Push notifications (Web Push API + VAPID)

### Planned
- [ ] Photo/video status on profiles (24h expiry, stories-style)
- [ ] Event waitlist (auto-notify when spot opens)
- [ ] Organizer following stats (who follows which organizers)
- [ ] Multi-language support (Swahili first)
- [ ] iOS PWA improvements

### Completed
- [x] Auth (register, login, password reset)
- [x] Events (CRUD, photos, search, filter, pagination, trending)
- [x] Bookings + capacity tracking + sold out state
- [x] Community (posts, votes, comments, save, repost, delete)
- [x] Follow system + notifications
- [x] Direct messaging with unread badge
- [x] Profile with avatar upload
- [x] People discovery (interest-based matching)
- [x] Block + report + admin queue
- [x] Organizer tools (attendee list, stats, check-in)
- [x] Star reviews on events
- [x] RSS feed aggregation (multi-region, background refresh)
- [x] Android APK on APKPure
- [x] Deployed on Vercel + Render + Neon