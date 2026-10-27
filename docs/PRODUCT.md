# Product

A private app for two people in a long-distance relationship (San Francisco ↔ Los Angeles), who visit every few weeks, mostly by plane. It's for the time apart: seeing each other's world at a glance, looking forward to the next visit, and keeping memories of past ones.

People are shown by short codes (e.g. **MEL**, **YIC**), not names or profile photos.

## Tabs

### Home
- **City card**: each person's code, home city, current weather (Open-Meteo, from home lat/lng) and miles apart. Under it, each person's **current fave song**: a pasted YouTube Music link that shows title, artist and a small thumbnail and opens the song. (There's no API for "now playing", so this is manual.)
- **Status**: a dark banner with each person's **free-text** status (about 40 characters max) in pixel type. One current status per person, overwritten when updated.
- **Postcard**: a vertical photo with one camera button to send.
  - A postcard lasts **24 hours for now**; this will likely change, so the lifetime is a per-space setting, never hardcoded.
  - **Unlock rule**: you can see your partner's postcard only if you've sent one of your own that hasn't expired. Senders always see their own. The rule lives in one SQL function so it's easy to change.
  - "View my postcard" shows your own.

### Trips
- **Countdown banner**: "LANDING IN [0][9] DAYS" in pixel type with split-flap tiles, always pointing to the next upcoming trip.
- **Ticket**, built from a flight number + date via a flight-status API:
  - airline and date
  - big origin/destination codes with times
  - miles
  - passenger (who is flying)
  - **pickup info only**: landing time, arrival terminal, arrival gate. No boarding time, departure gate or seat; the ticket exists so the person on the ground knows where to pick up.
  - The arrival gate is often unknown until a few hours before landing; show "TBA".
- **Calendar**: month view with prev/next arrows. The selected trip is a lime band; other trips are pink bands.
- **Plans for this trip**: a collapsible checklist. Items come from Ideas or are typed in.
- **Past tickets**: a stack of full tickets showing only airline + date on the ones behind. Tapping one moves it into the main ticket spot (marked USED), jumps the calendar to its month, and swaps in its plans. "Back to next trip" returns.
- Upcoming vs past, and trip number, are derived from dates. Never stored.

### Plans (ideas)
- A list of things to do together.
- **One row of filters**:
  - a location dropdown chip: All / Bay / LA / SD / Anywhere, plus "within 5 / 15 / 50 mi"
  - type chips: All / Eat / Do / Go / Stay / Events
- **Rows**: the name wraps to multiple lines; the address shows below in small gray text when present; a link icon on the right appears only if a source URL (TikTok/Reel) was added.
- **Favorites**: a heart after the name, **pink for Melody, lime for him**. Each person favorites separately.
- **Add to trip**: the circle on the left adds the idea to the next trip, and added items pin to the top under "On your next trip".
- **Events / seasonal ideas**: these carry a date range or a season label, and show a chip saying "During [trip]" (lime) or "No trip booked".
- **New idea**: a pinned, filled button opens a sheet with name, note/link, and buttons for date, location, link, favorite and photo.

### Passport
- **Miles flown**: a large split-flap number.
- **Stats**: days together, visits, cities. All computed from trips.
- **Stamps**: 3 per row, newest first. One stamp per visit, so repeat cities get repeat stamps. **Each city always has the same color.** The image is a trip photo in halftone in that city's color.
- **Most visited**: bars per city.
- **Stamp page**: a scrapbook page with the trip photo full-bleed; a white bottom card with the stamp, city, dates, "Nth time together", days, plans done, photos and a note; back on the left, "Edit page" on the right.

## Decisions

- **Profiles**: codes, home city and airport, and home coordinates live on `space_members`. There's no separate profiles table.
- **Ideas replace cards** as a new table, filled by copying from `cards`. `cards` stays as the archive until the old screens are removed.
- **Postcards**:
  - A postcard's lifetime comes from `spaces.postcard_ttl_hours` (default 24) and is set by the database, never the client.
  - A partner's postcard disappears for you once *it* expires, even if you've unlocked it. Senders always see their own, even expired ones.
  - `has_locked_postcard()` gives Home its "send one to unlock" state.
  - The photos are gated by the same unlock rule, so a locked postcard's photo can't be fetched straight from storage.
- **Trip plans** always store a title. Items added from an idea copy its title, so they keep their name if the idea is deleted.
- **Dates**:
  - "Upcoming" means `visit_end` is today or later, using the device's local date. A visit you're currently on counts as the next trip.
  - Passport stats count visits that have started by today. Days together counts distinct days across visits, with both the first and last day included.
- **Sample data**: MEL is San Francisco (SFO), YIC is San Diego (SAN), and the trips are SFO ↔ LAX.
- **Navigation**: four tabs (Home, Trips, Plans, Passport) plus a stamp page at `/passport/stamps/:tripId` with no tab bar. Old memoryi URLs (`/cards`, `/shuffle`, …) redirect to Home.
- **Component gallery**: `/dev/ui` exists only in development (`npm run dev`). It isn't in the deployed app.
- **Status bar**: iOS's `default` style, with dark text on a status bar iOS draws above the page, rather than a translucent one over the content.
- **Trips countdown**:
  - "LANDING IN [NN] DAYS" counts to the start of the next visit that hasn't begun yet.
  - It says "LANDING TODAY" on the arrival day, "TOGETHER NOW" mid-visit (including the last day), and "NO TRIP BOOKED" when nothing is ahead.
  - It never follows a past ticket you've tapped.
- **Trips default ticket**: the visit you're on, or else the next one. If there's nothing ahead, the most recent past trip, marked USED.
- **Past-ticket stack**: as in Trips.html, the oldest is at the top as a strip and the most recent past trip is the full ticket at the front.
- **Flight times**: shown in the airport's time zone (West Coast airports are mapped; others use the phone's zone).
- **Trip plan labels**: "Event" for ideas with a date or season, otherwise Eat / Do / Go / Stay. Items typed in by hand have no label. The name follows the idea if it's renamed.
- **Fonts**: self-hosted and loaded only for the latin character set (English plus accented letters), so they work offline. Chinese text such as 做啥呢 uses the phone's system font.

## Out of scope for now
Card shuffle/swipe from the old app; home-screen widgets; automatic "now playing".