- **2026-10-05 · Your actions keep their time.** Owner: "The grouping is too aggressive, I did some activities before
  Sebastian joined in." What you did is no longer one line pinned above the bands and stamped with your newest row
  (often "now"): it is in the stream like everyone's, in its day band, where its time puts it. One "You: …" line is one
  **sitting** — your rows join it while each is within 30 minutes of the one after it (the web's usual session timeout)
  and nothing else is said between them. A morning and an afternoon are two lines; someone else's activity in between
  splits them (his case: "You: interested in Zurich Decompression 2026 and The Borderland 2027 · 2h ago" sits under
  "Sebastian Östlind posted a call out · 22m ago", and "You: posted 2 call outs, replied to …, followed Sebastian · 3m
  ago" above it). The line takes its newest row's time; it says "now" only when that row is under a minute old. The
  sentence is the same (newest first, four parts, then "and N more"), and your rows say what is true now as before.
  Your own rows are on Home for the whole three weeks, as the people you follow are (older own rows used to be dropped).
  Supersedes 2026-10-01 "You are one line" and the "older own rows are not on Home" half of it.
  - **Other people's grouped rows stay as they are** ("Anna, Rio and 2 others are going", within three hours of the
    line's newest row, same thing, same band). They group one thing many people did, not one person's day of different
    things; their sentence is about the event, and splitting them on anything in between would bring back the runs of
    "Anna is going", "Rio is going" grouping exists to end. 2026-10-01 "Grouping is honest" stands.
- **2026-10-05 · The network's own news.** Owner: "Add creative events in the feed like X new users joined the platform
  (don't show each user, but some clever grouping)." Home's stream carries two kinds of entry no one person did, each
  at most once per day band, at its newest row's time (so it also splits your sitting), in the B2 shape: a header line
  (a grey square with an icon at 32, the sentence, how long ago), then the thing in its hairline frame.
  - **People joined.** "Lena, Tom and 3 others joined Hypernet" — everyone (never you) whose account was made in the
    band, over the last three weeks. The ones near you come first and get a person card with Follow (at most two): the
    people you follow follow them ("Anna follows Lena"), your city ("In Brno, like you"), your skill ("Kitchen, like
    you"). The rest are faces at 32 (up to six, "+N"), each opening the person, and **See who's new**, which opens
    Explore → People. One or two people with nothing in common with you are cards with Follow, no faces. Joining is
    public: the network is everyone's list (bootstrap's `people`, `created_at`; no email ever leaves the database).
  - **An event picking up.** "4 people decided to go to The Borderland 2027 this week, 1 more is interested" — the one
    upcoming event the most people (never you) decided on in the band, from three people up, for Today, Yesterday and
    This week only (never "Earlier"). The event card (Interested / Going), their faces (the people you follow first) and
    **Who's going** (the everyone dialog). Not shown when one line in the stream already says it (all of them people
    Home shows, deciding within three hours). It counts the whole visible network, so following few people it tells you
    what is moving beyond them.
  - Considered and left for later: "3 new events announced in Brno this week" (imported real events have no honest
    announcement date — their created_at is the import), "12 people are going to events this weekend" (a state, not
    news: it has no time to sit at in a stream), "Season of burns got 4 new events" (already said by "added N events"),
    "a call out got its first answer", "N people you follow are going to the same event" (Coming up says it), "your
    event passed 10 going" (a milestone for hosts), "someone you follow joined an Event Horizon you follow".
- **2026-10-05 · Explore → People is newest first.** You stay at the top; then everyone by when they joined, newest
  first (online everyone has a join date; offline the fixture crew, who joined long before, keep their order at the
  end). Someone who joined in the last three weeks says so on their row ("joined 2h ago"). Home's See who's new lands
  here.
- **2026-10-05 · The prototype has newcomers.** Seven fixture people (Lena, Tomas, Oskar, Priya, Ines, Yuki, Emil) joined
  between two hours and twelve days before the app started (`joinedMinutesAgo` in `_shared/hypernet-data.js`); they do
  nothing yet, and a few already have a follower (Anna follows Lena, Kai Priya, Mira Ines). No fixture row says anyone
  did anything, or was followed, before they joined. Accounts made in a browser carry when they were made too, so to the
  other accounts there they are newcomers. `scripts/seed.mjs dev` gives the newcomers their `created_at`; the dev branch
  needs a re-seed to show them. No migration: `people.created_at` was already in the bootstrap.
