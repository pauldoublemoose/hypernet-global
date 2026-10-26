// node --test scripts/map-link.test.mjs — map links, the short-link resolver, and the place hint.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { mapResolve, eventCreate } from "../lib/validation.ts";

const require = createRequire(import.meta.url);
const maps = require("../_shared/map-link.js");

const PLACE = "https://www.google.com/maps/place/Slussen/@59.3200,18.0700,17z/data=!3d59.3195!4d18.0712";
const AT = "https://www.google.com/maps/@59.3293,18.0686,17z";

function hop(status, location) {
  return {
    status,
    headers: { get: (name) => (String(name).toLowerCase() === "location" ? location || null : null) },
    body: { cancel() {} },
  };
}

test("a long Google link with @lat,lng fills coordinates", () => {
  const pin = maps.parseMapLink(AT);
  assert.equal(pin.provider, "google");
  assert.equal(pin.name, null);
  assert.equal(pin.lat, 59.3293);
  assert.equal(pin.lng, 18.0686);
  assert.equal(maps.classifyMapInput(AT).kind, "pin");
});

test("a Google /place/ link fills the name and prefers the pin over the camera", () => {
  const pin = maps.parseMapLink(PLACE);
  assert.equal(pin.name, "Slussen");
  assert.equal(pin.lat, 59.3195);
  assert.equal(pin.lng, 18.0712);
});

test("a short link is followed and then parsed, and a redirect off the map hosts is refused", async () => {
  const fetched = [];
  const url = await maps.followMapRedirects("https://maps.app.goo.gl/abc", {
    check: async () => {},
    fetch: async (target) => {
      fetched.push(String(target));
      if (String(target).includes("maps.app.goo.gl")) return hop(302, PLACE);
      return hop(200);
    },
  });
  assert.equal(maps.parseMapLink(url).name, "Slussen");
  assert.equal(fetched.length, 2);
  await assert.rejects(
    () => maps.followMapRedirects("https://maps.app.goo.gl/abc", {
      check: async () => {},
      fetch: async (target) => {
        if (String(target).includes("evil.example")) throw new Error("fetched a host that is not a map");
        return hop(302, "https://evil.example/phish");
      },
    }),
    (err) => err.status === 400,
  );
});

test("a non-map url stays plain text", () => {
  for (const raw of ["https://example.com/place/Foo", "Brno"]) {
    assert.equal(maps.classifyMapInput(raw).kind, "text");
    assert.equal(maps.parseMapLink(raw), null);
  }
});

test("javascript: and other unsafe schemes are rejected", () => {
  for (const raw of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,hi", "vbscript:msg"]) {
    assert.equal(maps.classifyMapInput(raw).kind, "unsafe");
    assert.equal(mapResolve.safeParse({ url: raw }).success, false);
  }
  assert.equal(eventCreate.safeParse({ title: "Sauna", startsOn: "2026-11-08", venue: { url: "javascript:alert(1)" } }).success, false);
  assert.equal(eventCreate.safeParse({ title: "Sauna", startsOn: "2026-11-08", venue: { name: "Slussen", url: PLACE, lat: 59.3195, lng: 18.0712 } }).success, true);
});

test("only a short https link may be resolved", () => {
  assert.equal(mapResolve.safeParse({ url: "https://maps.app.goo.gl/abc" }).success, true);
  assert.equal(mapResolve.safeParse({ url: "https://goo.gl/maps/abc" }).success, true);
  assert.equal(mapResolve.safeParse({ url: "https://maps.apple/p/abc" }).success, true);
  assert.equal(mapResolve.safeParse({ url: PLACE }).success, false);
  assert.equal(mapResolve.safeParse({ url: "https://example.com/place/Foo" }).success, false);
  assert.equal(mapResolve.safeParse({ url: "http://maps.app.goo.gl/abc" }).success, false);
  assert.equal(maps.classifyMapInput("https://goo.gl/not-maps").kind, "text");
});

test("Apple Maps ll, q, address and /place forms", () => {
  const ll = maps.parseMapLink("https://maps.apple.com/?ll=59.3293,18.0686&q=Slussen");
  assert.equal(ll.provider, "apple");
  assert.equal(ll.name, "Slussen");
  assert.equal(ll.lat, 59.3293);
  assert.equal(ll.lng, 18.0686);
  const addr = maps.parseMapLink("https://maps.apple.com/?address=Drottninggatan%201");
  assert.equal(addr.name, "Drottninggatan 1");
  assert.equal(addr.lat, null);
  const place = maps.parseMapLink("https://maps.apple.com/place?name=Slussen&coordinate=59.3293,18.0686");
  assert.equal(place.name, "Slussen");
  assert.equal(place.lat, 59.3293);
  assert.equal(place.lng, 18.0686);
  assert.equal(maps.classifyMapInput("https://maps.apple/abc").kind, "short");
});

test("OpenStreetMap #map and mlat/mlon", () => {
  const hash = maps.parseMapLink("https://www.openstreetmap.org/#map=17/59.3293/18.0686");
  assert.equal(hash.provider, "osm");
  assert.equal(hash.lat, 59.3293);
  assert.equal(hash.lng, 18.0686);
  assert.equal(hash.name, null);
  const q = maps.parseMapLink("https://www.openstreetmap.org/?mlat=59.3293&mlon=18.0686&query=Slussen");
  assert.equal(q.name, "Slussen");
  assert.equal(q.lat, 59.3293);
  assert.equal(q.lng, 18.0686);
});

test("the place hint is short and names no provider", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const hint = html.match(/id="where-hint"[^>]*>[^<]*/);
  assert.ok(hint, "where hint");
  assert.match(hint[0], /Place or maps link/);
  assert.doesNotMatch(hint[0], /Google|Apple|OpenStreetMap/i);
  assert.match(html, /'Place or maps link'/);
});

test("Fill from link stays on the hosted create route", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const take = html.slice(html.indexOf("function wizTakeFill"), html.indexOf("function wizFill"));
  assert.ok(take.length > 0);
  assert.doesNotMatch(take, /sourceUrl|addedBy|createLinkEvent/);
  assert.match(html, /data-act="wizfill"/);
  const act = html.slice(html.indexOf("function wizAct("), html.indexOf("/* Add past event"));
  assert.match(act, /HNAPI\.createEvent/);
  assert.doesNotMatch(act, /createLinkEvent/);
  const route = readFileSync(new URL("../app/api/events/route.ts", import.meta.url), "utf8");
  assert.match(route, /hostId: me\.id/);
  assert.match(route, /source: "user"/);
});
