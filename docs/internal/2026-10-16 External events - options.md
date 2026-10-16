# 2026-10-16 · External events in horizons: options

Source: [the WhatsApp chat with Seb](2026-10-15%20WhatsApp%20Seb%20-%20events%20that%20already%20exist.md).

**Decided 2026-10-16: option 4** (paste a link and Autofill now, publishers growing out of it). In a horizon's Add
events you pick from existing events, make a new one, or add one from a link. What was built is in
`docs/DECISIONS.md` (2026-10-16 · Events that already exist elsewhere come in from a link).

## What already exists

- **Hypernet already has events nobody here hosts.** The 17 real burns in `data/real-events.json` have `ownerIds: []`
  (`kind: 'real'`), and in Neon `events.host_id` is nullable, `host_name` is free text and `source` defaults to
  `"user"`. Their "Get tickets" button links out. So the model is already in place; what's missing is a way for a
  person to add one.
- **Making a horizon already works**, including the Add events picker with its filters (DECISIONS 2026-10-04).
- **Ticket pages describe themselves.** The Billetto link Seb sent has a schema.org `Event` block in its HTML
  (checked 2026-10-16): start and end with time zone, venue name, street, city, coordinates, organiser, price and
  currency, availability, description, plus an `og:image`. Eventbrite, Tickster, Resident Advisor and most ticket
  sites publish the same block because Google reads it.
- **But Billetto blocks plain bots.** A bare `curl` got a CloudFront 403; a real browser got the page. Whether a
  Vercel function gets through is not tested yet. **Facebook events** (where many decompressions and small burns
  live) need a login, so a link can't fill those in.

## How it fits the idea

A horizon is a playlist. On Spotify you don't record a song to put it on a playlist. Today a Hypernet curator can
only add events someone made here, which is like a playlist app where you have to record every song yourself.

The value Hypernet adds to an event that already exists is **who from your network is going**. Billetto can't show
"3 people you follow are going to the Requiem". Hypernet can. So an imported event should be a full event (Going,
Interested, calendars, shows on Home) and not just a bookmark.

One thing to watch: Hypernet is for co-creators, and the tagline is "boring and empty until you make it
otherwise". "Everything from Billetto" fills it with church concerts nobody here picked. Events that people add one
at a time keep the curation that makes horizons worth following.

## Options, simplest first

### 1. Link only (a bookmark on the horizon)

A horizon row can be a pasted link that shows the link preview's title, picture and date. Not an event: no Going,
not on calendars, not on Home.

- Cost: half a day.
- Against: loses the one thing Hypernet adds (who's going). It's a second kind of thing in a track list.

### 2. Paste a link, get an event (recommended)

In the horizon's Add events picker (and in New event), one more field: **"Paste a link to an event"**.

1. The server fetches the page and reads its schema.org `Event` block; if there isn't one, `og:` tags; if that
   isn't enough, an LLM reads the page text.
2. It shows the event card filled in (title, date and time, place, picture, price), where you can fix anything.
3. Add saves it as an event with no host: "by Svenska kyrkan Hägersten · from billetto.se", and **Get tickets**
   links to the original. It is always public (it is public already). Then it goes on the horizon.
4. The same link pasted again gives the same event (match on the canonical URL without `?bref=`), so two curators
   share one event and its Going list.
5. Home's activity says "Anna added *W A Mozart: Requiem* to *Stockholm autumn*".

- Cost: about 1–2 days with tests. Most of it is the fetcher and its fallbacks.
- Risks: bot blocking (fallbacks: a browser user agent, then Billetto's own API using the number in the URL, then a
  card you fill in yourself with the link saved); Facebook can't work; imported data goes stale (refresh from the
  source when someone opens the event, at most once a day).
- Open questions: who can edit an imported event (suggestion: whoever added it, until a host claims it)?

### 3. Publishers: a catalogue fed from ticket sellers

A cron pulls events from chosen sources (one Billetto organiser, a Billetto category in a city, an iCal feed) into
Explore → **Publishers**. Each publisher has a page of its upcoming events, and the Add events picker gets a
"From publishers" filter.

- Cost: several days, and ongoing: choosing sources, removing past and cancelled events, duplicates with pasted links.
- Against: needs Billetto API keys and terms; Seb's "everything from Billetto" floods Explore. Better done once we
  know which publishers curators actually use.

### 4. Option 2 now, publishers growing out of it

Build option 2. Every pasted event keeps its organiser, so publishers appear on their own: "2 more events from
Svenska kyrkan Hägersten", and an organiser page lists what people here have added. When one publisher keeps getting
pasted, switch on option 3's feed for that publisher only.

- Cost: option 2 plus about half a day for the organiser line and page.
- This answers both of Seb's ideas without importing anything nobody picked.

### Later, in any option: "This is my event"

The real host joins and claims the imported event: it becomes theirs to edit, keeps its Going list and horizons.
Needs groups (v2) for camps and organisations.

## Questions for Seb

- Which places will his curators paste from in the first week: Billetto, Facebook, burn websites, RA? (Decides
  whether option 2 covers enough.)
- Should an imported event show on Home and Explore for everyone, or only inside horizons?
- Is "everything from Billetto" a real want, or a way of saying "make adding easy"?
