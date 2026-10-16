// The link reader (lib/link-event.ts) on real pages, offline: `npx vitest run tests/unit`.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cleanUrl, parseEventPage, safeGet } from "../../lib/link-event";

const billetto = readFileSync(new URL("./fixtures/billetto-requiem.html", import.meta.url), "utf8");
const URL_IN = "https://billetto.se/e/w-a-mozart-requiem-biljetter-1984010?bref=eyJzIjoiYmlsbGV0dG8gYWR2ZXJ0aXNpbmciLCJtIjoiYmlsbGV0dG8iLCJjIjoiaG9t#tickets";

describe("cleanUrl", () => {
  it("drops tracking parameters and the fragment, keeps the rest", () => {
    expect(cleanUrl(URL_IN)).toBe("https://billetto.se/e/w-a-mozart-requiem-biljetter-1984010");
    expect(cleanUrl("https://Example.com/e?id=4&utm_source=x&fbclid=y")).toBe("https://example.com/e?id=4");
  });
  it("refuses what isn't a web link", () => {
    expect(() => cleanUrl("not a link")).toThrow();
    expect(() => cleanUrl("javascript:alert(1)")).toThrow();
    expect(() => cleanUrl("file:///etc/passwd")).toThrow();
  });
});

describe("safeGet", () => {
  it("never fetches inside a network", async () => {
    for (const u of ["http://localhost/", "http://127.0.0.1/", "http://10.0.0.5/", "http://192.168.1.1/", "http://169.254.169.254/latest", "http://[::1]/", "http://example.com:8080/"]) {
      await expect(safeGet(u, { maxBytes: 1000 })).rejects.toMatchObject({ code: "bad_url" });
    }
  });
});

describe("parseEventPage", () => {
  const d = parseEventPage(billetto, cleanUrl(URL_IN));

  it("reads a Billetto event: when, where, who, price, picture", () => {
    expect(d.title).toBe("W A Mozart: Requiem");
    expect(d.startsOn).toBe("2026-10-17");
    expect(d.startTime).toBe("18:00");
    expect(d.endsOn).toBeNull(); // same day
    expect(d.endTime).toBe("19:00");
    expect(d.timezone).toBe("Europe/Stockholm");
    expect(d.city).toBe("Hägersten");
    expect(d.region).toBe("Stockholm");
    expect(d.country).toBe("SE");
    expect(d.venue).toMatchObject({ name: "Uppenbarelsekyrkan", street: "Bäckvägen 34", postalCode: "126 47", lat: 59.304, lng: 18.0017 });
    expect(d.hostName).toBe("Svenska kyrkan Hägersten");
    expect(d.organizerUrl).toBe("https://billetto.se/users/svenska-kyrkan-hagersten");
    expect(d.access).toEqual({ model: "ticket", currency: "SEK", tiers: [{ name: "W A Mozart: Requiem", price: 150 }] });
    expect(d.imageUrl).toMatch(/^https:\/\/billetto\.imgix\.net\//);
    expect(d.description).toMatch(/^Lördag 17 oktober kl\. 18\.00 Uppenbarelsekyrkan/);
    expect(d.site).toBe("billetto.se");
    expect(d.online).toBe(false);
    expect(d.found).toEqual(expect.arrayContaining(["title", "startsOn", "startTime", "city", "venue", "hostName", "imageUrl", "access"]));
  });

  it("falls back to og: tags on a page with no event block", () => {
    const html = `<html><head><title>Ignored</title>
      <meta property="og:title" content="Sauna &amp; swim">
      <meta property="og:description" content="Bring a towel.">
      <meta property="og:image" content="/pics/sauna.jpg">
      <meta property="og:site_name" content="Ridge Collective"></head></html>`;
    const p = parseEventPage(html, "https://ridge.example/sauna");
    expect(p).toMatchObject({ title: "Sauna & swim", description: "Bring a towel.", imageUrl: "https://ridge.example/pics/sauna.jpg", hostName: "Ridge Collective", startsOn: null });
    expect(p.found).not.toContain("startsOn");
  });

  it("finds an event inside @graph, with a UTC time moved to the venue's zone", () => {
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage" }, {
      "@type": ["MusicEvent"], name: "Night on the ridge", startDate: "2026-11-20T21:00:00Z", endDate: "2026-11-21T03:00:00Z",
      location: { "@type": "Place", name: "Lado", address: { addressLocality: "Prague", addressCountry: { name: "Czechia" } } },
      offers: [{ price: 0, priceCurrency: "CZK" }], organizer: [{ name: "Ridge Crew" }] }] };
    const p = parseEventPage(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`, "https://x.example/e");
    expect(p).toMatchObject({ startsOn: "2026-11-20", startTime: "22:00", endsOn: "2026-11-21", endTime: "04:00", timezone: "Europe/Prague",
      country: "CZ", city: "Prague", hostName: "Ridge Crew", access: { model: "free" } });
  });
});
