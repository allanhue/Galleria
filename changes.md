# Changes

## 2026-10-15 - Event ticketing and Android release

### Event booking and notifications

- Added an attendee opt-in at booking for email notifications when the organizer updates event details.
- Save the opt-in with free bookings and paid ticket payments; event update emails go only to confirmed attendees who subscribed.
- Show the selected ticket type and email-update subscription in the attendee's booking and downloaded ticket.
- Route event-card booking actions to the event page so attendees can choose a ticket and notification preference first.

### Organizer ticket sales

- Added optional VIP ticket price and quantity configuration.
- Added flash-sale price, quantity, and scheduled start/end times.
- Validate ticket settings on the server, enforce the available tier inventory and flash-sale window, and charge the selected ticket price.
- Include ticket options in event update emails.

### Android launch fix and APK release

- Aligned the Capacitor app ID, Android application ID, namespace, launcher activity package, and custom URL scheme to `com.galleria.events`. This fixes the launch crash caused by Android looking for `com.galleria.events.MainActivity` while the activity was packaged as `com.galleria.app.MainActivity`.
- Increased the Android release version to version code `3` and version name `1.2`.
- Configured the Gradle release build to sign the APK using the existing `android/keystore.properties` signing configuration.
- Build and upload `android/app/build/outputs/apk/release/app-release.apk` to APKPure. Keep using the same signing key for updates to the existing Android app.