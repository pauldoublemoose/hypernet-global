# Backend options — making Hypernet real

Research date: **2026-09-23**. All prices are from official pricing pages fetched that day
(links in [Sources](#sources)). EUR at the ECB reference rate of that day, **1 EUR = 1.1411 USD**
(so 1 USD ≈ 0.876 EUR). Research only: nothing was provisioned.

The question (feedback round 1): *how do we make this a reality and fill it with real data?
Neon + Vercel, or something simpler? Users sign up, create events, create horizons. What is
sustainable and what does it cost to keep running?*

---

## TL;DR

- **Paul's upstream repo already has a backend, and it is Supabase.** `pauldoublemoose/hypernet`
  is **not Next.js**: it is a Vite + React 18 + TypeScript single-page app on Vercel
  (`hyperstition.cloud`), with `@supabase/supabase-js`, SQL migrations in `supabase/migrations/`,
  row-level security, passwordless **email one-time-code login** (`src/lib/auth.ts`), and one
  Vercel Function (`api/session.ts`) that keeps people logged in for a year. Horizons and
  clusters are still stored in the browser only (`horizonStore.ts`, `groupsStore.ts` say
  "localStorage MVP"). Paul's own plan (`docs/PROJECT_PLAN.md` §9) says: *"Continue Vite + React +
  Supabase"*.
- **Recommendation: stay on Supabase and finish what Paul started.** Move profiles, events,
  horizons, RSVPs and follows from localStorage into the Supabase tables, and use Supabase Realtime
  for chat later. Neon + Vercel would mean throwing away working auth and assembling 4–5 vendors,
  one of them only for chat.
- **Cost for the recommended stack:** about **$2/mo** for a prototype on the free tier, **about
  $27–47/mo** for a real community of 2,000 people, **about $100/mo** at 20,000 people.
- **Cheapest option that works:** Cloudflare (Workers + D1 + R2 + Durable Objects): **$2 / $7–27 /
  $27–37**. The catch is that someone has to hand-write auth, chat servers and the whole data
  layer, on SQLite instead of Postgres.
- **Money is not the biggest risk.** The biggest risk is **two people building two backends**:
  Michal's prototype in one repo and Paul's app in another. The second risk is **one
  maintainer**, which is why the least-code option matters more than the cheapest one.

---

## What the backend has to hold

This comes from `docs/reference/CONCEPT-BRIEF.md`, `_shared/hypernet-data.js`, and Paul's `PROJECT_PLAN.md`.

- **Users / nodes**: profile, skills, cities, avatar, privacy per section, follows between users
- **Events**: public/private, host (a person or a cluster), dates, external ticket link, cover
  image, **custom thumbnail square and row styling** (store as a small JSON "style" field)
- **Event horizons**: named, followable lists of events. Many-to-many: one event can sit on many
  horizons. They have admins, a contribution setting, and a private default horizon for each user
- **Clusters (groups/camps)**: admins and members
- **Call outs**: time-boxed requests ("need a sound engineer")
- **RSVP**: interested / going (with a role) / promote
- **Chats**: group chats and direct messages. These need to feel instant.
- **Email**: login codes/magic links, and later notification emails

The data is **relational**: lots of links between things (horizon↔event, user↔user, user↔event).
Postgres (Supabase, Neon) or SQLite (D1, PocketBase) fits naturally. Document databases
(Firebase, Convex to a lesser degree) need more care to model it.

---

## A plain-language map of the pieces

Think of it like opening a gallery:

- **Front end hosting** (Vercel, Cloudflare Pages) is the **building**: it hands visitors the
  HTML/JS/CSS. The Hypernet front end is a static site, so this part is nearly free anywhere.
- **Database** (Postgres/SQLite) is the **archive room** where every event, horizon and RSVP is
  filed.
- **Auth** is the **front desk** that checks who you are and gives you a wristband (a session).
- **Row-level security (RLS)** is the **rule sheet on the archive door**: "you can edit only your
  own events; private events are visible only to invitees". Supabase lets the browser talk to the
  database directly *because* these rules are enforced inside the database.
- **File storage** is the **storeroom for posters** (cover images, avatars). **Egress** is the
  cost of carrying posters out to visitors.
- **Realtime** is a **walkie-talkie line** kept open to each online person, so a chat message
  shows up without reloading the page. It is the hardest and most expensive part because every
  online person holds an open line.
- **Transactional email** is the **postman** for login links. Every stack needs a real email
  provider: free built-in senders are throttled to a few emails per hour.

---

## The stacks compared

### 1. Supabase (Postgres + Auth + Storage + Realtime) with the Vite SPA on Vercel. **Recommended**

- **Covers:** Postgres database, auth (email code/magic link, Google, Discord etc.), file storage
  with a CDN, realtime (Broadcast, Presence, Postgres Changes), edge functions, admin table UI,
  daily backups on Pro
- **Still add:** an email provider (Resend) plugged into Supabase Auth as custom SMTP; the domain
- **Chat:** built in. Clients subscribe to a chat channel. Supabase counts **1 message sent + 1 per
  receiving client**, or for database-change listeners **1 per listening client**. Free: 200
  concurrent connections / 2M messages (hard cap). Pro: 500 / 5M included, then **$10 per 1,000
  peak connections** and **$2.50 per million messages**.
- **Lock-in:** medium-low. It is plain Postgres, so tables and data can move to any Postgres (Neon,
  RDS). The sticky parts are the `auth.users` table and the `supabase-js` calls in the front end.
  The whole platform is open source and self-hostable as a last resort.
- **Ops burden for a non-backend person:** the lowest of the set. You write SQL tables and RLS
  rules; there are no servers to patch. RLS is the one real skill to learn, and getting it wrong
  leaks private events. Paul has already written working RLS policies.
- **Fit with Vercel front end:** already in production this way. `api/session.ts` is a Vercel
  Function.
- **Free tier traps:** the project **pauses after 1 week without activity**, has **no backups**,
  a 500 MB database, 1 GB storage and 5 GB egress, **image resizing is Pro-only**, and the built-in
  email sender sends **2 emails/hour and only to your own team**. That last limit is why custom
  SMTP is required even for the prototype.

### 2. Vercel + Neon Postgres + Neon Auth (Better Auth) + Vercel Blob + Ably

- **Covers:** Neon gives serverless Postgres that scales to zero. **Neon Auth** is now managed
  Better Auth that stores users in a `neon_auth` schema inside your database, free up to 60k MAU.
  Vercel runs the front end and all API code as functions. Vercel Blob or Cloudflare R2 stores
  images.
- **Still add:** an **API layer**. Unlike Supabase, the browser can't safely query the database
  directly unless you set up Neon's Data API plus RLS, so you normally write Vercel Functions for
  every read and write. You also need a **realtime provider for chat** (Ably, Pusher, Liveblocks)
  and an email provider.
- **Chat:** not included. Ably Free covers 6M messages and 200 concurrent connections. After that
  Ably Standard is **$29/mo + $2.50/M messages + $1/M connection-minutes**. Polling from Vercel
  Functions instead burns function invocations fast.
- **Lock-in:** low. It's Postgres plus open-source Better Auth. This is the most portable option.
- **Ops burden:** medium. Four or five dashboards and bills, and API code to write and secure. The
  free Neon compute **sleeps after 5 idle minutes**, so the first request after a pause waits for
  a cold start.
- **Fit:** good with Next.js, fine with Vite. But it **replaces Paul's working Supabase auth and
  migrations**, which is a rewrite, not a step forward.
- **When it's the right call:** if you were starting from zero with a Next.js codebase. Hypernet
  isn't.

### 3. Convex (reactive database + Convex Auth + file storage) with a static front end

- **Covers:** database, server functions, **live queries** (every screen updates itself, so chat
  is almost free to build), file storage, auth. The backend is open source (FSL→Apache 2.0) and
  self-hostable.
- **Still add:** an email provider. An image CDN is also wise, because the free tier includes only
  **1 GB/month of data egress**, which cover images would eat.
- **Chat:** the best developer experience of any option: a chat list is just a query that
  re-runs when a message is inserted. Cost is function calls: 1M/month free, then $2.20 per
  million on the pay-as-you-go Starter plan. Pro is $25 per developer per month with 25M calls and
  50 GB database included.
- **Lock-in:** high. The data model and all server code are Convex-specific TypeScript, not SQL.
- **Ops burden:** low (no servers, no RLS to write, because permissions live in TypeScript
  functions).
- **Fit:** works with any React front end, but again it means **rewriting Paul's data layer and
  auth**.

### 4. PocketBase on a small VPS (Hetzner CX23)

- **Covers:** one program that does everything: SQLite database, auth (email/password, OTP,
  OAuth2), realtime subscriptions, file storage on disk, an admin UI.
- **Still add:** the server itself (Hetzner CX23 at 2 vCPU / 4 GB is **€5.49/mo** after Hetzner's
  April 2026 price increase, per third-party trackers; the official page didn't render prices),
  HTTPS (Caddy), **backups you configure yourself**, SMTP, monitoring.
- **Chat:** built-in realtime (server-sent events). No per-message billing, and one small server
  handles thousands of connections.
- **Lock-in:** low (open source, SQLite file you own).
- **Ops burden:** **highest.** You are the sysadmin: OS security updates, disk full, backups,
  restarts, TLS. PocketBase is still **v0.40 (pre-1.0)**, so upgrades can break things. A
  "nobody touched it for 6 months" server is a security liability.
- **Fit:** fine as an API for a Vercel-hosted front end, but it's a rewrite and a server to babysit.
  Cheapest flat price, worst fit for a frontend/design owner.

### 5. Cloudflare Workers + D1 (SQLite) + R2 + Durable Objects + Better Auth

- **Covers:** static hosting (free, unlimited static requests, commercial use OK), serverless API
  (Workers), SQLite database (D1), image storage with **zero egress fees** (R2), and **Durable
  Objects** for WebSocket chat rooms.
- **Still add:** auth (Better Auth, an open-source library you run inside a Worker), email, and all
  the API code.
- **Chat:** one Durable Object per chat room holding WebSockets. Incoming WebSocket messages are
  billed at 20:1 (100 messages = 5 requests), outgoing messages are free, and hibernation means idle
  rooms cost nothing. This is the cheapest realtime at scale, but you write the chat server.
- **Lock-in:** medium (D1 and Durable Objects are Cloudflare-specific, though SQLite exports are
  easy).
- **Ops burden:** low to run, **high to build**. The most custom code of any option.
- **Fit:** would replace Vercel too. A strong option for a developer-heavy team; not for a solo
  designer-maintainer.

### Ruled out

- **Firebase:** a NoSQL document store is awkward for the many-to-many horizon↔event↔user graph,
  and **Cloud Storage for Firebase has required the paid Blaze plan since 3 Feb 2026**. Nothing
  here beats Supabase for this shape of data.
- **InstantDB:** its pricing page now carries the announcement that the team joined OpenAI:
  **new Instant Cloud signups are closed and cloud apps shut down 31 Aug 2027**. Not viable.
- **Clerk as the auth piece:** excellent product (50k retained users free, then $0.02/user), but
  it's an extra vendor on top of a database that already includes auth (Supabase, Neon Auth,
  Convex, PocketBase). Only worth it if you need polished org/role UI out of the box.

---

## Usage assumptions per scenario

- **(a) Prototype, 50 users:** under 1 GB of images, about 100 login emails/month, chat barely
  used
- **(b) Real community, 2,000 users:** about 800 monthly active, 300 events with covers plus
  avatars (about 0.5 GB), about 30 GB/month image traffic, about 150 people online at peak, about
  30k chat messages/month × about 8 recipients (about 0.3M realtime messages), about 1,500–3,000
  emails/month with launch-day spikes
- **(c) 20,000 users:** about 8,000 monthly active, about 5 GB images, about 300 GB/month traffic,
  about 1,500 online at peak, about 10M realtime messages/month, about 15k emails/month

Shared line items:

- **Domain:** `hyperstition.cloud` is already owned. `.cloud` renews at about $21/yr (Porkbun
  list price), so **≈ $1.76/mo**.
- **Email (Resend):** Free is 3,000/month with a **100/day cap**, which bites on launch days when
  hundreds sign up at once. Pro is $20/mo for 50k.
- **Front-end hosting (Vercel):** Hobby is $0 but **non-commercial only** (ticketing, ads or paid
  work make it commercial) and has hard monthly allotments (100 GB transfer, 1M function calls).
  Pro is $20/seat/mo. Cloudflare static hosting is a $0 alternative with no commercial
  restriction.

## Monthly cost per stack (USD, EUR in brackets)

| Stack | (a) 50 users | (b) 2,000 users | (c) 20,000 users |
|---|---|---|---|
| **1. Supabase + Vercel static** (recommended) | $2 (€2) free tier, *or $27 (€24) on Pro* | $27–47 (€24–41) | ~$100 (~€88) |
| 2. Vercel + Neon + Neon Auth + Blob + Ably | $2 (€2) | $33–53 (€29–46) | ~$160 (~€140) |
| 3. Convex + static front end + R2 images | $2 (€2) | $9–29 (€8–25) | $80–100 (€70–88) |
| 4. PocketBase on Hetzner VPS | ~$9 (€8) | $9–29 (€8–25) | ~$36 (~€32) |
| 5. Cloudflare Workers + D1 + R2 + DO | $2 (€2) | $7–27 (€6–24) | $27–37 (€24–32) |

The range in (b) is almost always **Resend free vs Resend Pro ($20)**.

How the recommended stack adds up:

- **(a)** Supabase Free $0 + Resend Free $0 + Vercel Hobby $0 + domain $1.76. **Move to Pro
  ($25) the day real people's data is in it**, because Free has no backups and pauses after 7 quiet
  days.
- **(b)** Supabase Pro **$25** (includes $10 compute credit = Micro instance; 100k MAU, 8 GB
  database, 250 GB egress, 100 GB storage, 500 realtime connections, 5M messages, daily backups),
  Resend $0–20, Vercel Hobby $0, domain $1.76. Resize images **in the browser before upload** to
  avoid Supabase's image transformations ($5 per 1,000 origin images beyond 100).
- **(c)** Supabase Pro $25 + Small compute +$5 + egress about 50 GB over × $0.09 = $4.50 +
  realtime about 1,000 connections over = $10 + about 5M messages over = $12.50 → **≈ $57**. Add
  Resend Pro $20 + Vercel Pro $20 (a 20k community probably sells tickets or takes sponsors, which
  counts as commercial) + domain → **≈ $99**. Use Cloudflare static hosting instead of Vercel Pro
  and it's about $79.

Other stacks' key drivers: Neon Launch at $0.106/CU-hour plus $0.35/GB-month (about $11 at (b),
about $40 at (c)); Ably Standard $29 plus usage at (c); Convex function calls; Cloudflare's flat
$5 Workers Paid plan.

---

## Chat, the hard part: how each stack handles it

- **Supabase:** client subscribes to `chat:<id>` via Realtime. Messages are rows in a `messages`
  table (history is just SQL) and are pushed to online members. Private chats are protected by
  Realtime Authorization (RLS on channels). Cost at 2,000 users: **$0** (inside Pro quota). At
  20,000: **about $22/mo** in overages.
- **Neon + Vercel:** Vercel Functions can't hold open connections cheaply, so chat needs **Ably or
  Pusher**. Free up to 200 connections; about $75/mo at (c).
- **Convex:** live queries. Easiest code. Cost scales with function calls (each delivered update
  re-runs a query).
- **PocketBase:** built-in subscriptions. $0 extra, but your one server is also your chat server.
- **Cloudflare:** Durable Object per room. Cheapest at scale (cents), but you write the WebSocket
  server.

Across all of them, chat also brings **moderation, blocking, reporting, unread counts and push
notifications**. Those are product work, not infrastructure. Paul's plan already puts in-app
messaging in "Future" and says external contact links are enough for MVP. That's a sound call.

---

## Recommendation: Supabase, continuing Paul's stack

**Why**

- **It's already there.** Auth with email codes, RLS, migrations and a year-long session cookie are
  written and deployed. Choosing anything else means rewriting work that exists.
- **One vendor covers all four needs** (database, auth, images, realtime chat). Neon + Vercel needs
  four or five vendors plus hand-written API code for the same result.
- **Postgres is the exit door.** If Supabase ever gets expensive or disappears, the data moves to
  Neon or any Postgres host with a standard dump. Only auth and client calls need rework.
- **Lowest ops for a design-led team.** No server to patch. The skill to learn is SQL tables and
  RLS rules, and there are working examples in the repo to copy.
- **Front end stays as is.** Vite SPA on Vercel. **No need for Next.js.** Keep Vercel Hobby while
  it's a non-commercial community project; go Pro or move static hosting to Cloudflare when money
  enters (tickets, sponsors, paid work).

**Sustainability: who maintains it**

- **Paul** owns the repo and schema. **Michal** contributes design and front end, and should
  contribute SQL migrations *into Paul's repo*, not a parallel backend.
- **Supabase (Pro)** handles database patching, daily backups, TLS and uptime.
- **Resend** needs the domain's DNS records (SPF/DKIM) set once.

**What breaks if nobody touches it for 6 months**

- On **Pro**: very little. It keeps running. Watch for: **card expiry** (Supabase, Vercel,
  Resend, domain), **domain auto-renew**, Supabase **scheduled Postgres upgrades** (announced by
  email), and **the Resend free-tier daily cap** if a big event suddenly drives signups. The
  static front end doesn't rot. Outdated npm packages only matter the next time someone deploys.
- On **Free**: the project **pauses after 7 days of no activity**, and there are no backups. That
  alone is the reason to pay $25 once real people's data is inside.
- Human risk: a **single maintainer**. Mitigate with migrations in git (already the case), a short
  "how to deploy / how to restore" note in the repo, and a second person with admin access to
  Supabase, Vercel, Resend and the registrar.

**Settings to turn on from day one**

- Supabase **spend cap** (on by default on Pro) so a spike can't create a surprise bill
- Region **eu-central-1 (Frankfurt)**, since most of the community is in Europe (GDPR, latency)
- Custom SMTP (Resend) on a subdomain such as `mail.hyperstition.cloud`

---

## Phased path

### Phase 1: sign-up, events, horizons, RSVP (the playlist-of-events core)

- Upgrade Paul's Supabase project to **Pro** ($25) once real users are in, and plug in **Resend**
  as custom SMTP.
- Extend the schema with migrations. `profiles` already exists. Add:
  - `profiles` fields: bio, skills (text[] + full-text index), cities, avatar path,
    privacy flags
  - `clusters` + `cluster_members` (with an admin role)
  - `events`: visibility, `host_type`/`host_id`, dates, external URL, cover path, and a `style`
    JSONB column for the custom thumbnail square and row
  - `horizons` (owner, visibility, contribution setting, `is_default`) + `horizon_events`
    (many-to-many) + `horizon_admins` + `horizon_follows`
  - `rsvps` (user, event, status `interested | going | promote`, role)
  - `follows` (user → user)
  - `callouts`
- Write RLS for each table (public rows readable by all; private rows by owner, admins and
  invitees; writes by owner or admins).
- Storage buckets `avatars` and `covers`. Resize to about 1600 px WebP in the browser before
  upload.
- Replace `horizonStore.ts` / `groupsStore.ts` localStorage with Supabase queries.
- Seed real data: the 18 events and the horizons in `_shared/hypernet-data.js` /
  `data/hypernet-mock-data-*.json`, plus the existing `signups` rows (Paul's `claim_signups`
  RPC already links them to accounts).
- Search: Postgres full-text search on events, horizons and skills (Paul's plan says the same).
- Cost: **$25–27/mo** plus Resend free.

### Phase 2: chats

- Tables: `chats` (group or DM, optional cluster/event link), `chat_members`, `messages`, and
  `read_receipts` or a last-read timestamp for unread counts.
- Realtime: private channels per chat with Realtime Authorization; insert messages via SQL and
  broadcast to members (Supabase's "broadcast from database" pattern).
- Product minimums: a New chat button (feedback round 1 asks for it), leave/mute, block and
  report, and email notification for unread DMs (batched, so Resend volume stays sane).
- Cost at 2,000 users: still inside Pro. Budget Resend Pro ($20) if notification emails grow.

### Phase 3: scale (5k–20k+ users)

- Watch the Supabase usage page for peak connections, realtime messages, egress and compute.
  Expected additions: Small compute (+$5) and realtime overages (about $20). Total about
  $100/mo at 20k.
- Move to Vercel Pro or Cloudflare static hosting once the project is commercial.
- Add web push notifications, a moderation queue, image caching headers, and database indexes on
  hot queries (feed, horizon pages).
- Revisit only if Realtime costs dominate: move chat alone to Cloudflare Durable Objects and keep
  Supabase for everything else.

---

## Sources

All fetched 2026-09-23.

- Upstream repo: `gh repo view pauldoublemoose/hypernet`, files `README.md`, `package.json`,
  `vercel.json`, `api/session.ts`, `src/lib/auth.ts`, `src/lib/horizonStore.ts`,
  `supabase/migrations/*`, `docs/PROJECT_PLAN.md` (last push 2026-09-13)
- Supabase pricing: https://supabase.com/pricing
- Supabase Realtime billing: https://supabase.com/docs/guides/realtime/pricing and
  https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages
- Supabase built-in SMTP limits: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase image transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
- Neon pricing: https://neon.com/pricing · Neon Auth: https://neon.com/docs/auth/overview
- Vercel pricing: https://vercel.com/pricing · Hobby allotments and commercial-use rule:
  https://vercel.com/docs/limits/fair-use-guidelines · https://vercel.com/docs/limits
- Clerk pricing: https://clerk.com/pricing
- Resend pricing: https://resend.com/pricing
- Convex pricing: https://www.convex.dev/pricing · limits: https://docs.convex.dev/production/state/limits
  · self-hosting: https://docs.convex.dev/self-hosting
- Cloudflare Workers: https://developers.cloudflare.com/workers/platform/pricing/ · D1:
  https://developers.cloudflare.com/d1/platform/pricing/ · R2:
  https://developers.cloudflare.com/r2/pricing/ · Durable Objects:
  https://developers.cloudflare.com/durable-objects/platform/pricing/
- Ably pricing: https://ably.com/pricing
- Firebase pricing: https://firebase.google.com/pricing · Storage Blaze requirement:
  https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- InstantDB (pricing URL now shows the shutdown notice): https://www.instantdb.com/pricing
- PocketBase: https://pocketbase.io/ · Hetzner CX23 €5.49 (official page didn't render prices;
  third-party tracker): https://bex.co/blog/2026/07/20/hetzner-2026-price-hikes-self-hosting-math
- `.cloud` renewal: https://porkbun.com/tld/cloud
- EUR/USD: ECB reference rate 1.1411 on 2026-09-23,
  https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html

**Estimates, not quotes:** usage per scenario, Neon compute hours, Convex function calls, Ably
usage at (c), and the Hetzner price (third-party source). Quotas were checked on the official
pages; the scenario totals are modelled from those quotas.
