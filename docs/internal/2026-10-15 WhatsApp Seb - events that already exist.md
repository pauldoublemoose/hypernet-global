# 2026-10-15 · WhatsApp, Seb and Michal: events that already exist

Screenshot: [2026-10-15-whatsapp-seb-external-events.webp](2026-10-15-whatsapp-seb-external-events.webp).
Options for building it: [2026-10-16 External events - options.md](2026-10-16%20External%20events%20-%20options.md).

**Seb** 19:38
> Hey Michal!
>
> How hard is to implement a feature where you can just drop a URL and then the details (start time, location etc)
> of an event are automatically filled out?
>
> Im gonna give some people a task to create horizons so there is some starting material for people to explore.

**Michal** 20:14
> Hey, can you elaborate on the use case? To make it possible so that people can go to a link without having to log in
> and make a horizon?

**Seb** 20:15
> Use case is to allow people to curate lists of events that are already out there
>
> E.g concerts

**Michal** 20:16
> Oh and the point is so that you can choose from existing events
>
> Instead of having to create them
>
> We could just bulk import the events, are there some ready made lists somewhere?
>
> Otherwise the rest of horizon creation is already in place

**Seb** 20:18
> I guess bulk importing from existing ticket sellers could work. In that case there would need to be some kind of page
> where tou can explore events from publishers

**Seb** 20:19, sharing a link preview: *W A Mozart: Requiem · Lördag 17 oktober kl. 18.00 Uppenbarelsekyrkan Entré 150 kr.
Resterande biljetter säljs i entrén. W… · billetto.se*
> for example:
> https://billetto.se/e/w-a-mozart-requiem-biljetter-1984010 (the shared link also had a `?bref=…` tracking parameter)
>
> Everything from "Biletto"

**Michal** 20:20
> I'll look into it tomorrow to see what's possible

**Seb** 20:25
> There is something important about being able to easily get an event on the platform that isnt already there
>
> even if you are not the host

## 2026-10-16, the next day

**Michal** 12:15
> Importing all from Billeto would fill up the database with church events etc

**Seb** 12:15
> Yea I see that

**Michal** 12:15
> I propose while filling up the Event horizon you could enter a URL

**Seb** 12:16
> Yes, this is what I suggested

**Michal** 12:16
> Gotcha

**Seb** 12:16
> And then click a button for autofill
>
> of event details (time, host etc)

(The screenshot of this part was pasted into the session, but there's no file of it, so it's only transcribed here.)

## What was agreed (2026-10-16)

- No bulk import from Billetto: it would fill Hypernet with church concerts nobody picked.
- While filling an Event Horizon you can enter a URL, click **Autofill**, and the event details (time, host and so
  on) fill in.
- Michal's build choice: in a horizon's Add events you pick from existing events, create a new event, or add an
  external one from a link. Publishers grow out of the organisers of pasted events (option 4 in the options doc).

## What Seb is asking for

- Curators make Event Horizons out of events that already exist elsewhere (concerts, ticket-seller events), without
  being the host.
- The ask he started with: paste a URL, and the date, time, place and so on fill in.
- His follow-up idea: bulk import from ticket sellers ("everything from Billetto") plus a page to explore events by
  publisher.
- Why now: he is about to give people the task of making horizons, so the site has starting material to explore.
