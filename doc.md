# Galleria Product Documentation

## Product overview

Galleria is an event discovery and community platform. It helps people find and book events, meet others with shared interests, and suggest ideas for future events. Event organizers can publish events, manage bookings, check in attendees, and review event performance.

The product is under development. Features described here reflect the current application and may change.

## Who Galleria is for

- **Attendees** discover events, reserve or purchase tickets, and participate in the community.
- **Organizers** create and manage events, set ticket options, and manage attendees.
- **Administrators** review community reports and take moderation actions.

Choose an attendee or organizer role when creating an account. Sign-in and registration currently use email and password.

## Product capabilities

### Discover events

- Browse events by category, including music, food and drink, art, sports, networking, tech, culture, and outdoors.
- Search event names, venues, and cities; filter by category and move through paginated results.
- See featured trending events and event listings sourced from the platform and external feeds.
- Open an event page for its description, date, location, availability, ticket options, reviews, and community reactions.
- Save, like, or dislike events, and share event links.

### Book tickets

- Select general admission, VIP, or an available flash-sale ticket where the organizer has configured that option.
- Book free events directly. Paid tickets use Paystack checkout and are priced in Kenyan shillings (KES).
- Join a waitlist when an event is sold out.
- View and cancel eligible bookings, download a ticket, and display its QR code at the event.
- Organizers can scan a ticket QR code to check in an attendee.

### Create and manage events

Organizers can create events with a title, description, date, location, category, capacity, and event photos. Ticket settings include free or paid general admission, optional VIP tickets, and time-bounded flash sales.

The organizer dashboard provides event management, attendee lists, check-in tools, and event analytics. The overview includes event and booking totals, revenue, and recent bookings. Per-event analytics include booking and check-in counts, capacity, waitlist, revenue, reactions, saves, reviews, fill rate, and booking activity over time.

### Share ideas and build community

Members can suggest event ideas, vote on and comment on suggestions, save them, and repost them. They can follow other members, discover suggested people with shared event interests, and message other users subject to account privacy settings.

Profiles show a member's ideas, saved and reposted posts, and booking activity. Members can report content or accounts and manage blocked accounts. Notifications cover supported community, follow, message, and booking activity.

### Account preferences and administration

Account settings include profile details, password changes, notification preferences, messaging and follow permissions, profile visibility, theme, and language.

Administrators have a reports queue for reviewing reports and marking them reviewed, actioned, or dismissed.

## Common user journeys

### Attendee: find and attend an event

1. Browse or search events, optionally choosing a category.
2. Open an event to review its details, availability, and ticket choices.
3. Sign in or create an attendee account if prompted.
4. Choose a ticket and complete the booking. For paid tickets, finish checkout with Paystack.
5. Open **Bookings** to view the ticket and QR code. Present the QR code at the event entrance.

### Organizer: publish an event

1. Create an account with the organizer role and sign in.
2. Open the organizer dashboard and choose **Create event**.
3. Add event information, ticket settings, and between two and five event photos.
4. Publish the event, then use the dashboard to edit it, view attendees, check in ticket holders, and review analytics.

### Community member: propose an event

1. Open **Community** and post an event idea with a title and description.
2. Vote on ideas, add comments, save or repost suggestions, and follow members.
3. Use suggested people or messages to connect with other members.

## Access and supported surfaces

The product is delivered as a responsive web application. The repository also contains Capacitor Android configuration for a native Android wrapper. Availability of a published mobile app depends on the current release; the project README describes Galleria as still under development.

Event browsing and event details are available without signing in. Booking, community participation, messaging, and account management require an account.

## Product boundaries and notes

- Event inventory, ticket availability, bookings, and account information are provided by the Galleria API.
- Event discovery can also show listings from external feeds; those links lead to the source site.
- Paid ticket checkout is handled by Paystack. Payment methods and availability are subject to the configured Paystack account and region.
- Social sign-in buttons may appear in the interface, but the current registration and sign-in implementation uses email and password.
- Features and integrations are under active development; this document is not a guarantee of service availability or a published release.

