// Hypernet — event detail records. Load AFTER hypernet-data.js.
//
// Shape: the Hypernet event schema proposed in docs/research/burn-event-data.md
// (section 4) — `scale` (burn | gathering | meetup) picks the page layout, and
// optional blocks (access, principles, theme, volunteering, blocks, burn.*) add
// sections. index.html renders only the blocks a record has.
//
// These are SAMPLE records for the mock events in hypernet-data.js, keyed by
// their ids. Real events live in data/real-events.json (same schema). At boot
// index.html fetches that file and merges it in: a real record replaces the
// sample for the same event (matched by id, then by title), and events the
// fixtures don't have are added. Samples are marked illustrative:true.
//
// hostName on a sample overrides the fixture's host. The generated fixtures
// credit every filler event to "You"; here they get hosts from the cast, and
// "You" is kept only for the events the demo account itself hosts.

window.HYPERNET_DETAILS = { records: {

  "evt-deep-listening": {
    "illustrative": true, "kind": "meetup", "scale": "meetup",
    "startTime": "19:00", "endTime": "23:00", "timezone": "Europe/Stockholm",
    "venueKind": "physical", "city": "Stockholm", "country": "SE",
    "venue": { "name": "A basement in Södermalm", "addressVisibility": "on_rsvp" },
    "description": "Quiet rooms, long tones, and a Stockholm basement. Two hours of listening, then tea.",
    "access": { "model": "pay_what_you_can", "note": "Pay at the door. Nobody is turned away." },
    "whatToBring": [ "Warm socks", "A cushion" ],
    "volunteering": { "expectation": "encouraged", "how": "Two people per hour keep the door and the kettle." },
    "openCalls": [ "quiet instruments" ],
    "ownerGroupIds": [ "g-baltic" ]
  },

  "evt-world-hyperstition-2026": {
    "illustrative": true, "kind": "burn", "scale": "gathering",
    "date": "2026-06-12", "endDate": "2026-06-14", "timezone": "Europe/Stockholm",
    "venueKind": "physical", "region": "Stockholm county", "country": "SE",
    "venue": { "name": "Hyperstition camp", "addressVisibility": "ticket_holders" },
    "description": "The fourth and last Hyperstition: a camp inside a regional burn that turned into a four-year art project.",
    "theme": { "name": "EXIT", "blurb": "What do we carry out of the field?" },
    "access": { "model": "invite", "note": "Camp members and their guests. Entry to the wider burn needs its own membership." },
    "principles": { "base": "10 Principles", "additions": [ "Consent", "Co-creation" ] },
    "blocks": [ { "label": "build", "date": "2026-06-10" }, { "label": "event", "date": "2026-06-12", "startTime": "16:00" }, { "label": "strike", "date": "2026-06-14", "startTime": "14:00" } ],
    "volunteering": { "expectation": "expected", "teams": [ "Build", "Exit rituals", "Strike crew" ] }
  },

  "evt-world-camp-dinner": {
    "illustrative": true, "kind": "meetup", "scale": "meetup",
    "startTime": "19:00", "endTime": "22:00",
    "venue": { "name": "The camp kitchen", "addressVisibility": "ticket_holders" },
    "description": "Dinner for everyone who helped build the camp. Friends of participants welcome.",
    "access": { "model": "invite" },
    "whatToBring": [ "A bowl and a spoon", "Something to share" ],
    "volunteering": { "expectation": "encouraged", "how": "Prep 16–19, service 19–21, wash-up until it's done." }
  },

  "evt-world-warehouse": {
    "illustrative": true, "kind": "burn_night", "scale": "meetup",
    "startTime": "21:00", "endTime": "04:00",
    "venue": { "name": "A warehouse", "addressVisibility": "secret" },
    "description": "A one-night session for the people on the roster.",
    "access": { "model": "invite", "note": "Participants only." }
  },

  "evt-fill-0":  { "illustrative": true, "hostName": "Sasha Reed", "kind": "meetup", "scale": "meetup", "startTime": "06:40", "endTime": "07:10",
                   "description": "Twenty minutes of stretching on the ridge as the sun comes up.", "access": { "model": "free" },
                   "whatToBring": [ "A mat, or borrow one" ] },
  "evt-fill-1":  { "illustrative": true, "hostName": "Kai Okonkwo", "kind": "volunteer_day", "scale": "meetup", "startTime": "21:00", "endTime": "01:00",
                   "description": "The late kitchen line for the build crew: chopping from nine, serving from eleven.",
                   "access": { "model": "free" }, "volunteering": { "expectation": "required", "how": "Everyone on the line signs up for one shift." },
                   "whatToBring": [ "Apron", "Closed shoes" ] },
  "evt-fill-2":  { "illustrative": true, "hostName": "You", "kind": "build", "scale": "meetup", "startTime": "10:00", "endTime": "17:00",
                   "description": "Build shade that packs flat and survives wind. Frames, tarps and a lot of ratchet straps.",
                   "access": { "model": "free" }, "whatToBring": [ "Work gloves", "PPE" ] },
  "evt-fill-3":  { "illustrative": true, "hostName": "Mira Chen", "kind": "meetup", "scale": "meetup", "startTime": "20:00", "endTime": "22:00",
                   "description": "A slow walk through the woods with LED pieces hung in the trees. No torches.",
                   "access": { "model": "donation", "note": "Donations go to batteries." } },
  "evt-fill-4":  { "illustrative": true, "hostName": "Sasha Reed", "kind": "workshop", "scale": "meetup", "startTime": "18:00", "endTime": "19:00",
                   "description": "Briefing for this season's dust patrol: routes, the MOOP log, and what goes in which bin.",
                   "access": { "model": "free" } },
  "evt-fill-5":  { "illustrative": true, "hostName": "Jon Hale", "kind": "volunteer_day", "scale": "meetup",
                   "description": "Shifts at the temple build: sanding, carrying, and keeping the space for people who come to write.",
                   "access": { "model": "free" },
                   "blocks": [ { "label": "Shift 1", "date": "2026-10-09", "startTime": "10:00", "endTime": "14:00" },
                               { "label": "Shift 2", "date": "2026-10-09", "startTime": "14:00", "endTime": "18:00" },
                               { "label": "Shift 3", "date": "2026-10-09", "startTime": "18:00", "endTime": "22:00" } ],
                   "volunteering": { "expectation": "required", "how": "Pick a shift with Going, then confirm it in the camp chat." } },
  "evt-fill-6":  { "illustrative": true, "hostName": "Anna Vale", "kind": "meetup", "scale": "meetup", "startTime": "20:00", "endTime": "21:00",
                   "description": "One hour on the camp radio. Requests, lost and found, and whoever turns up with a record.",
                   "access": { "model": "free" } },
  "evt-fill-7":  { "illustrative": true, "hostName": "Kai Okonkwo", "kind": "meetup", "scale": "meetup", "startTime": "06:30", "endTime": "07:30",
                   "description": "Tea at sunrise. One cup, no talking, until the light lands on the field.",
                   "access": { "model": "free" }, "whatToBring": [ "Your own cup" ] },
  "evt-fill-8":  { "illustrative": true, "hostName": "Jon Hale", "kind": "town_hall", "scale": "meetup", "startTime": "19:00", "endTime": "20:30",
                   "description": "The camps agree quiet hours for generators so the sleeping side of the field can sleep.",
                   "access": { "model": "free" } },
  "evt-fill-9":  { "illustrative": true, "hostName": "Rio Moss", "kind": "meetup", "scale": "meetup", "startTime": "21:00",
                   "description": "Mutant vehicles dock for the night. Check-in, lights check, then a slow parade.",
                   "access": { "model": "free" }, "dressCode": "Lights on everything" },
  "evt-fill-10": { "illustrative": true, "hostName": "Sasha Reed", "kind": "workshop", "scale": "meetup", "startTime": "10:00", "endTime": "16:00",
                   "description": "A day of first aid for rangers, medics and camp leads before the winter builds.",
                   "access": { "model": "free", "note": "For rangers, medics and camp leads." } },
  "evt-fill-11": { "illustrative": true, "hostName": "You", "kind": "build", "scale": "meetup", "startTime": "15:00", "endTime": "19:00",
                   "description": "Soundcheck on the west stage before the weekend. If it feeds back we start again.",
                   "access": { "model": "free" }, "openCalls": [ "DJs", "sound engineers" ] }
} };
