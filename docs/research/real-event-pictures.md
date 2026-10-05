# Real events' pictures — where each one comes from

Compiled **2026-10-05** for the owner's note: "For all the real events fetched I would like to have profile pictures
for them — you need to fetch them from their sites." Each real event in `data/real-events.json` names its picture
(`picture`), a 512 × 512 JPEG in `data/pictures/`. A next edition (Burning Man 2027, The Borderland 2027 …) wears its
past edition's picture.

**Rule used.** From the event's own site: a real logo or emblem first (site icon, apple-touch-icon, header logo) at
192 px or more; otherwise its og:image or hero, centre-cropped to a square. Rejected: generic letters, text cards,
stock-like art, anything whose text a square would cut. Every result was looked at before it went in.

**Processing.** sharp 0.34 (a scratch tool, not a dependency of the app): Lanczos to 512, JPEG quality 84 (mozjpeg),
transparency flattened onto the ground named below. 8–67 KB each, 412 KB together.

## Provenance

| Event | Site checked | Picture taken from | Treatment |
|---|---|---|---|
| Burning Man 2026 / 2027 | burningman.org | https://burningman.org/wp-content/themes/firebird-master/assets/images/favicon.svg — the Man, the site's own SVG icon | rendered at 512, black on white, 10 % margin |
| The Borderland 2026 / 2027 | theborderland.se (redirects to talk.theborderland.se/main) | the site's og:image, the Borderland logo: https://talk.theborderland.se/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbDRDIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--41840c8abf7950930f3702e05578652f9b597f90/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdDRG9MWm05eWJXRjBTU0lJY0c1bkJqb0dSVlE2RkhKbGMybDZaVjkwYjE5c2FXMXBkRnNIYVFJQUFta0NBQUk2Q25OaGRtVnlld2M2REhGMVlXeHBkSGxwVlRvS2MzUnlhWEJVIiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--59b314e7434420eeefd34f7dedb674c8f7730dda/300px-Borderland-logo-2019.png (300 px) | on white, 6 % margin |
| AfrikaBurn 2026 / 2027 | afrikaburn.org | https://www.afrikaburn.org/wp-content/uploads/2025/10/cropped-squaresb-1.png — the site icon at full size (512) | as is |
| Burning Nest 2026 / 2027 | burningnest.co.uk | https://burningnest.co.uk/wp-content/uploads/2025/11/BN-favicon.png — the apple-touch-icon (288 px), the egg emblem | on white, 5 % margin |
| Elsewhere 2026 / 2027 | nobodies.team | https://nobodies.team/images/hero-1.jpg — the og:image, a photo of the event (1920 × 1280) | centre square |
| Schönburn 2026 | burners.at/event/schoenburn-2026 | https://www.burners.at/wp-content/uploads/2026/04/SSB-Facebook-header-2026.png — the event's own header with the Schönburn wordmark (1920 × 1005) | the middle 1240 px (the whole wordmark), its top and bottom rows run on to make the square |
| Vårlys 2026 | frostlys.no | https://images.squarespace-cdn.com/content/v1/63e20c2f2e705e49d8bb7b25/27778b59-0c21-42ab-adbc-1e3222f40123/Va%CC%8Arlys2026-Logo.png — the Vårlys 2026 logo (1024) | on the site's own mint (#8cd6c8), 2 % margin |
| Zurich Decompression 2026 | the ticket page in the data (eventfrog.ch) and the organisers' link page linktr.ee/zurich.decom | https://ugc.production.linktr.ee/d145fbf6-6fe5-4b5a-b4ce-420462713776_WhatsApp-Image-2026-08-18-at-23.08.23.jpeg — @zurich.decom's profile picture: the concierge of this year's "Grand Hotel for Peculiar Burners" (761 square) | resized |
| SF Bay Area Decompression 2026 | here.burningman.org/event/decompression2026 and the Partiful page in the event's sources | https://partiful.imgix.net/external/user/3ZkiNf5HCK4YSrgfcoCS/BleUd9CKnMiobZEn7MY41?w=1000&h=1000&fit=clip — the square version of the poster on the official page | resized |
| London Decompression 2026 | londondecom.org | https://londondecom.org/wp-content/uploads/2022/11/london-decom-sg-logo.png — the og:image, the London Decom logo (400 square) | resized |
| Boulder Burner Meet-up | junkyardsocialclub.org/drop-in-event/burner/ | https://junkyardsocialclub.org/wp-content/uploads/2024/10/Junkyard-Circle-Logo-01-1024x1024.png — the host's (Junkyard Social Club) round logo | on white, 4 % margin |

## Without a picture

- **Čarodění 2026** — no site of its own. Its listing is Burning Man's Czech regional page, whose only images are
  Burning Man's general ones (wrong event); the Czech burners' Facebook pages can't be fetched. It keeps its glyph.

## Looked at and rejected

- Burning Man's og:image: a "Burning Man Project" text card, not the event.
- Elsewhere's site icon: a plain letter N.
- Zurich's eventfrog poster: landscape, any square cuts "The Grand Hotel" title.
- SF's here.burningman.org header: the same poster in landscape (its text would be cut); the square version was used.
- Boulder's event page og:image (`Burner.jpg`): a moody stock-like artwork, not the meet-up; the host's logo is what
  identifies it.
- Burners.at's own logo for Schönburn: white line art made for a dark ground, and the association's, not the event's.
- The Borderland's newer 200 px site icon: smaller than the logo the site itself shares as its og:image.

## Where they live

Offline (the fixtures, `?offline=1`, the regression suite) the page shows `data/pictures/<name>.jpg` itself. Online a
look may only carry a picture in its branch's `images` bucket (`is_look`), so `scripts/real-pictures.sh <branch>`
uploads the same files as `real-events/<name>-<sha8>.jpg` and points the looks at them. See
`docs/decisions-pending/v5-pictures.md`.
