# Galleria — Android APK Build Documentation

> **Project:** Galleria — Event discovery and booking app for Nairobi  
> **Platform:** Android (via Capacitor + Next.js)  
> **Date:** June 2026  
> **Distribution target:** APKPure (free publishing)

---

## Overview

Galleria is a Next.js web application wrapped into a native Android APK using Capacitor. The live web app is hosted on Vercel. The Android APK loads the production Vercel URL inside a native WebView shell, providing an installable Android experience without requiring a Google Play Store account.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.9 (Turbopack) |
| Native wrapper | Capacitor |
| Web hosting | Vercel (`galleria-flame-ten.vercel.app`) |
| Android build | Gradle via Android Studio |
| Java runtime | Android Studio bundled JBR |
| Distribution | APKPure (free) |

---

## Prerequisites

The following tools must be installed before building:

- **Node.js** — for Next.js and Capacitor CLI
- **Android Studio** — includes Android SDK and bundled Java (JBR)
- **Android SDK** — Android 16 (installed via Android Studio SDK Manager)
- **Capacitor CLI** — installed as a project dependency (`@capacitor/cli`)

---

## Capacitor Configuration

File: `capacitor.config.ts`

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.galleria.app',
  appName: 'Galleria',
  webDir: 'out',
  server: {
    url: 'https://galleria-flame-ten.vercel.app',
    cleartext: false,
  },
}

export default config
```

> The `server.url` points to the live Vercel deployment. The APK loads this URL rather than bundling the static output, ensuring the app always reflects the latest deployed version.

---

## Build Process

### Step 1 — Production build

```bash
cd C:\Galleria
npm run build
```

Expected output:

```
✓ Compiled successfully in 16.9s
✓ Finished TypeScript in 11.8s
✓ Collecting page data using 3 workers in 15.5s
✓ Generating static pages using 3 workers (22/22)
✓ Finalizing page optimization
```

### Step 2 — Sync to Android

```bash
npx cap sync android
```

This copies the web build output into the `android/` directory and updates native dependencies.

### Step 3 — Set JAVA_HOME

Android Studio ships with its own Java runtime (JBR). Point Gradle to it before building:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

> This environment variable is session-scoped. It must be set each time you open a new PowerShell window before running Gradle commands.

To verify the JBR folder exists:

```powershell
dir "C:\Program Files\Android\Android Studio\jbr"
```

### Step 4 — Build the APK

```powershell
cd C:\Galleria\android
.\gradlew assembleDebug
```

First run takes 5–10 minutes as Gradle downloads dependencies. Subsequent builds are significantly faster due to caching.

**Output APK location:**

```
C:\Galleria\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## Building a Release APK (for store submission)

A release APK requires a signing keystore. To generate one:

### Create keystore

Inside Android Studio:

```
Build → Generate Signed Bundle / APK → APK → Next → Create new...
```

| Field | Value |
|---|---|
| Key store path | `C:\Galleria\galleria-key.jks` |
| Password | *(your chosen password)* |
| Key alias | `galleria` |
| Validity | 25 years |
| Country code | KE |

### Build signed release APK via terminal

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd C:\Galleria\android
.\gradlew assembleRelease
```

**Output location:**

```
C:\Galleria\android\app\build\outputs\apk\release\app-release.apk
```

> Keep `galleria-key.jks` and its password backed up securely. You need the same keystore to publish future updates to any store.

---

## Publishing to APKPure

APKPure allows free APK submission with no developer fee.

1. Go to [developer.apkpure.com](https://developer.apkpure.com)
2. Register a free account
3. Click **Submit App**
4. Fill in app details:

| Field | Value |
|---|---|
| App name | Galleria |
| Category | Entertainment → Events |
| Description | Discover, book and connect around events in Nairobi. Find music, food, art, tech and outdoor events happening around you. |

5. Upload `app-debug.apk` or `app-release.apk`
6. Add at least 3 screenshots (taken from `galleria-flame-ten.vercel.app`)
7. Submit for review

---

## Other Free Distribution Options

| Platform | Cost | Notes |
|---|---|---|
| APKPure | Free | Direct APK upload, no review fee |
| Amazon Appstore | Free | [developer.amazon.com/apps-and-games](https://developer.amazon.com/apps-and-games) |
| Samsung Galaxy Store | Free | [seller.samsungapps.com](https://seller.samsungapps.com) |
| PWA (Vercel URL) | Free | Users install via Chrome → "Add to Home Screen" |
| Google Play Store | $25 one-time | Recommended once the app has an established user base |

---

## Common Errors & Fixes

### `JAVA_HOME is not set`

Gradle cannot find Java. Fix:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

### `Generate App Bundles or APKs` greyed out in Android Studio

Gradle has not finished syncing. Fix:

```
File → Sync Project with Gradle Files
```

Wait for the bottom status bar to show `Gradle sync finished`.

### SDK not installed

Go to:

```
File → Settings → Appearance & Behavior → System Settings → Android SDK
```

Check **Android 14 (API 34)** or higher → click **Apply**.

---

## Project URLs

| Resource | URL |
|---|---|
| Live web app | https://galleria-flame-ten.vercel.app |
| APKPure developer portal | https://developer.apkpure.com |
| Amazon Appstore developer | https://developer.amazon.com/apps-and-games |

---

*Documentation generated June 2026