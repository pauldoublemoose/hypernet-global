// Hypernet — event detail records. Load AFTER hypernet-data.js.
//
// The fixtures in hypernet-data.js only carry title / date / host / one line of
// description. A real participatory event page (a regional burn, Borderland,
// Burning Man) carries much more: a date RANGE with gate times, a site, a
// ticketing or membership model, principles, a theme, ways to take part (theme
// camps, volunteer shifts, art grants / dreams), arrival + departure rules,
// Leave No Trace, care and safety, and links.
//
// This file is the SAMPLE layer for that shape. index.html renders whatever is
// here, section by section, and skips sections that are empty. When real data
// lands in data/real-events.json, index.html fetches it at boot and merges it
// over these records (matched by id, then by title); real records win.
//
// Every value may be a string, a list of strings, a list of {title, body}
// objects, or a plain {key: value} object. The renderer handles all four, so a
// real-data file does not have to match this layout exactly.
//
// Records here are marked source:"sample". Facts about Burning Man that are
// public and stable (location, the Ten Principles, ticket programme names,
// departments) are real; everything else is plausible filler.

window.HYPERNET_DETAILS = {
  "_schema": {
    "dates":       "{ start, end, gates, notes }  ISO dates; gates = free text",
    "edition":     "string — '2026', 'Year 14'",
    "theme":       "string or { title, body }",
    "location":    "{ site, region, country, travel }",
    "organiser":   "{ name, url }",
    "size":        "string — '≈ 4,000 members'",
    "tickets":     "{ model: membership|ticket|free|invite|donation, summary, price, sales:[{title, body}], notes:[] }",
    "principles":  "[string]",
    "participate": "[{ kind: camps|volunteer|grants|art|workshop, title, body, deadline }]",
    "arrival":     "[{ title, body }]",
    "lnt":         "[string]",
    "care":        "[string]",
    "bring":       "[string]",
    "links":       "[{ label, url }]",
    "source":      "sample | real",
    "sourceUrl":   "string"
  },

  "records": {

    "evt-world-burning-man-2026": {
      "source": "sample",
      "description": "A temporary city in the Nevada desert, built by the people who come to it and taken down again without a trace.",
      "edition": "2026",
      "dates": { "start": "2026-08-30", "end": "2026-09-07", "gates": "Gate opens Sunday; Exodus from Monday",
                 "notes": "Build crews can come earlier on an Early Arrival pass. Strike and clean-up run for weeks after." },
      "location": { "site": "Black Rock City", "region": "Black Rock Desert, Nevada", "country": "USA",
                    "travel": "Nearest airport Reno (RNO), then about 3 hours by road. The Burner Express bus runs from Reno and San Francisco." },
      "organiser": { "name": "Burning Man Project", "url": "https://burningman.org" },
      "tickets": {
        "model": "ticket",
        "summary": "Tickets sold in timed sales; a vehicle pass is separate.",
        "sales": [
          { "title": "Main Sale", "body": "The general sale, held in spring." },
          { "title": "Low Income Ticket Program", "body": "Reduced-price tickets by application." },
          { "title": "Directed Group Sale", "body": "Allocated to theme camps, art projects and mutant vehicles that the city depends on." },
          { "title": "FOMO Sale", "body": "Returned and unsold tickets, late summer." }
        ],
        "notes": [ "Tickets are named; resale only through the official exchange.", "Every vehicle entering needs a vehicle pass." ]
      },
      "principles": [ "Radical Inclusion", "Gifting", "Decommodification", "Radical Self-reliance", "Radical Self-expression",
                      "Communal Effort", "Civic Responsibility", "Leaving No Trace", "Participation", "Immediacy" ],
      "participate": [
        { "kind": "camps", "title": "Theme camps", "body": "Register a camp for placement in the city. Placed camps are expected to offer something interactive to everyone." },
        { "kind": "grants", "title": "Art honoraria", "body": "Black Rock City art grants for installations on the open playa." },
        { "kind": "volunteer", "title": "Volunteer departments", "body": "Black Rock Rangers, Gate / Perimeter / Exodus, Lamplighters, Temple crew, DPW for build and strike." }
      ],
      "arrival": [
        { "title": "Arrival", "body": "Expect long queues at Gate. Bring everything you need for a week in the desert: there is nothing to buy except ice and coffee." },
        { "title": "Departure", "body": "Exodus can take many hours. Leave with everything you brought, including your grey water." }
      ],
      "lnt": [ "Pack it in, pack it out — there are no bins.", "MOOP (matter out of place) is swept camp by camp after the event.",
               "Burn only on raised burn platforms; no burn scars.", "Grey water is evaporated or taken home, never dumped." ],
      "care": [ "Black Rock Rangers mediate and keep people safe.", "Emergency Services run medical stations across the city.",
                "Zendo offers psychedelic harm reduction.", "Consent is the norm in every camp." ],
      "bring": [ "Water: 1.5 gallons (≈ 6 litres) per person per day", "Shade that survives wind", "Goggles and a dust mask", "Lights for yourself and your bike" ],
      "links": [ { "label": "burningman.org", "url": "https://burningman.org" } ]
    },

    "evt-world-borderland-2026": {
      "source": "sample",
      "description": "A week-long participatory gathering in the Nordics. There are no spectators: members build the camps, the art and the programme.",
      "edition": "2026",
      "theme": { "title": "The Membrane", "body": "What keeps a community together, and what lets it breathe." },
      "dates": { "start": "2026-07-20", "end": "2026-07-26", "gates": "Gates open Monday 12:00; quiet exodus Sunday",
                 "notes": "Build week before, strike the day after." },
      "location": { "site": "A field in southern Sweden", "country": "Sweden",
                    "travel": "Train to the nearest town, then the shuttle. Car-pooling is arranged in the members' forum." },
      "organiser": { "name": "The Borderland (a membership association)" },
      "size": "≈ 4,000 members",
      "tickets": {
        "model": "membership",
        "summary": "You buy a membership, not a ticket. Memberships are allocated by lottery.",
        "price": "Tiered — lower tier by self-declaration",
        "sales": [
          { "title": "Lottery", "body": "Register in spring. Winners get a window to buy a membership." },
          { "title": "Transfers", "body": "Memberships move between people only through the official transfer, at face value." }
        ],
        "notes": [ "Children come free with a member.", "Every member is expected to take at least one shift." ]
      },
      "principles": [ "Participation", "Communal effort", "Gifting", "Decommodification", "Radical self-expression",
                      "Radical self-reliance", "Leaving no trace", "Consent", "Immediacy", "Co-creation" ],
      "participate": [
        { "kind": "grants", "title": "Dreams", "body": "Anyone can post a dream — an artwork, a stage, a sauna. Members co-fund dreams with grant tokens.", "deadline": "2026-06-01" },
        { "kind": "camps", "title": "Camps and barrios", "body": "Register a camp to get placed on the map. Barrios group camps that share power and noise levels." },
        { "kind": "volunteer", "title": "Shifts", "body": "Welcome gate, Nightwatch, sanctuary, kitchen for the build crew, clean-up after." }
      ],
      "arrival": [
        { "title": "Arrival", "body": "Bring your membership and ID. Cars are parked outside the site; you walk or cart your gear in." },
        { "title": "Departure", "body": "Clean your camp before you leave. The field goes back to the farmer the week after." }
      ],
      "lnt": [ "No glitter, no confetti, no feathers.", "Separate waste into the site's streams.", "Fires only in approved burn barrels." ],
      "care": [ "Sanctuary for anyone having a hard time.", "Nightwatch walks the site after dark.", "First aid tent open around the clock." ],
      "bring": [ "Rain gear — it is Scandinavia", "Your own cup, plate and cutlery", "Earplugs" ],
      "links": []
    },

    "evt-world-hyperstition-2026": {
      "source": "sample",
      "edition": "Year 4 — EXIT",
      "theme": { "title": "EXIT", "body": "The last Hyperstition. What do we carry out of the field?" },
      "dates": { "start": "2026-06-12", "end": "2026-06-14", "gates": "Friday 16:00 to Sunday 14:00" },
      "location": { "site": "Hyperstition camp, inside a regional burn", "region": "Stockholm county", "country": "Sweden" },
      "organiser": { "name": "Hyperstition collective" },
      "tickets": { "model": "invite", "summary": "Camp members and their guests. Entry to the wider burn needs its own membership." },
      "principles": [ "Participation", "Co-creation", "Leaving no trace" ],
      "participate": [
        { "kind": "art", "title": "Exit rituals", "body": "Propose a closing ritual for the final night." },
        { "kind": "volunteer", "title": "Strike crew", "body": "Sunday afternoon. Four hours, then a swim." }
      ],
      "lnt": [ "The camp leaves no mark: every stake, every screw." ]
    },

    "evt-world-camp-dinner": {
      "source": "sample",
      "dates": { "start": "2026-07-22", "gates": "19:00, food at 20:00" },
      "location": { "site": "The camp kitchen", "region": "On site", "country": "Sweden" },
      "tickets": { "model": "invite", "summary": "Friends of participants. Bring a bowl." },
      "participate": [ { "kind": "volunteer", "title": "Kitchen shifts", "body": "Prep 16:00–19:00, service 19:00–21:00, wash-up 21:00–22:00." } ],
      "bring": [ "A bowl and a spoon", "Something to share" ]
    },

    "evt-world-warehouse": {
      "source": "sample",
      "dates": { "start": "2026-09-04", "gates": "Doors 21:00, until late" },
      "location": { "site": "A warehouse — address sent to participants", "country": "Sweden" },
      "tickets": { "model": "invite", "summary": "Participants only. You are on the roster." },
      "care": [ "Sober space by the loading dock." ]
    },

    "evt-deep-listening": {
      "source": "sample",
      "dates": { "start": "2026-10-04", "gates": "Doors 19:00, first tone 19:30, done by 23:00" },
      "location": { "site": "A basement in Södermalm", "region": "Stockholm", "country": "Sweden",
                    "travel": "Five minutes from Medborgarplatsen. The exact door is sent the day before." },
      "organiser": { "name": "Baltic Circuit" },
      "size": "40 people",
      "tickets": { "model": "donation", "summary": "Pay what you can at the door. Nobody is turned away." },
      "principles": [ "Participation", "Immediacy", "Consent" ],
      "participate": [
        { "kind": "volunteer", "title": "Door and tea", "body": "Two people per hour keep the door and the kettle." },
        { "kind": "workshop", "title": "Bring a tone", "body": "Instruments welcome if they can play quietly." }
      ],
      "care": [ "No phones in the listening room.", "A quiet room next door if it gets too much." ],
      "bring": [ "Warm socks", "A cushion" ]
    },

    "evt-fill-5": {
      "source": "sample",
      "dates": { "start": "2026-10-09", "gates": "Three shifts: 10–14, 14–18, 18–22" },
      "location": { "site": "Temple build yard" },
      "tickets": { "model": "free", "summary": "Free. Sign up for a shift with Going." },
      "participate": [
        { "kind": "volunteer", "title": "Shifts", "body": "Sanding, carrying, and holding space for people who come to write on the walls." }
      ],
      "care": [ "Temple guardians are briefed at the start of every shift." ]
    },

    "evt-fill-4": {
      "source": "sample",
      "dates": { "start": "2026-10-05", "gates": "18:00 sharp, one hour" },
      "tickets": { "model": "free", "summary": "Free. For anyone joining the dust patrol this season." },
      "participate": [ { "kind": "volunteer", "title": "Dust patrol", "body": "Walk the site in pairs, pick up MOOP, log what you find." } ],
      "lnt": [ "Everything found goes in the MOOP log, then in the right bin." ]
    },

    "evt-fill-10": {
      "source": "sample",
      "description": "A day of first aid for rangers, medics and camp leads before the winter builds.",
      "dates": { "start": "2026-11-03", "gates": "10:00–16:00" },
      "tickets": { "model": "free", "summary": "Free for rangers, medics and camp leads." },
      "care": [ "Certificates renewed on the day." ]
    }
  }
};

// The generated fixtures describe the twelve filler events as "Camp / crew overflow
// for SEARCH feed." Give them believable one-liners without touching the generated file.
(function(){
  var R = window.HYPERNET_DETAILS.records;
  var D = {
    "evt-fill-0":  "Twenty minutes of stretching on the ridge as the sun comes up. Bring a mat or borrow one.",
    "evt-fill-1":  "The late kitchen line for the build crew: chopping from nine, serving from eleven, washing up until it's done.",
    "evt-fill-2":  "Build shade that packs flat and survives wind. Frames, tarps and a lot of ratchet straps.",
    "evt-fill-3":  "A slow walk through the woods with LED pieces hung in the trees. No torches, let your eyes adjust.",
    "evt-fill-4":  "Briefing for this season's dust patrol: routes, the MOOP log, and what goes in which bin.",
    "evt-fill-5":  "Shifts at the temple build: sanding, carrying, and keeping the space for people who come to write.",
    "evt-fill-6":  "One hour on the camp radio. Requests, lost and found, and whoever turns up with a record.",
    "evt-fill-7":  "Tea at sunrise. One cup, no talking, until the light lands on the field.",
    "evt-fill-8":  "The camps agree quiet hours for generators so the sleeping side of the field can sleep.",
    "evt-fill-9":  "Mutant vehicles dock for the night. Check-in, lights check, then a slow parade.",
    "evt-fill-10": "A day of first aid for rangers, medics and camp leads before the winter builds.",
    "evt-fill-11": "Soundcheck on the west stage before the weekend. If it feeds back we start again."
  };
  Object.keys(D).forEach(function(id){ R[id] = R[id] || { source:"sample" }; if (!R[id].description) R[id].description = D[id]; });
})();
