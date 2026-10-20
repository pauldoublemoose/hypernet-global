// node --test scripts/event-url-validation.test.mjs — event URL fields accept only absolute http(s).
import { test } from "node:test";
import assert from "node:assert/strict";
import { eventCreate, eventLink, eventPatch, linkRead } from "../lib/validation.ts";

const event = { title: "Sauna", startsOn: "2026-11-08" };
const link = { ...event, hostName: "Host" };

function rejected(result) {
  assert.equal(result.success, false);
  const msg = result.error.issues.map((i) => i.message).join(" ");
  assert.match(msg, /http/);
}

test("http and https event links are accepted", () => {
  assert.equal(eventCreate.safeParse({ ...event, access: { model: "ticket", url: "https://tickets.example/e" } }).success, true);
  assert.equal(eventCreate.safeParse({ ...event, access: { model: "ticket", url: "http://tickets.example/e" } }).success, true);
  assert.equal(eventLink.safeParse({ ...link, sourceUrl: "https://tickets.example/e" }).success, true);
  assert.equal(linkRead.safeParse({ url: "https://tickets.example/e" }).success, true);
  assert.equal(eventPatch.safeParse({ details: { externalUrl: "https://source.example/event" } }).success, true);
});

test("an empty or missing ticket link stays allowed", () => {
  assert.equal(eventCreate.safeParse(event).success, true);
  assert.equal(eventCreate.safeParse({ ...event, access: null }).success, true);
  assert.equal(eventCreate.safeParse({ ...event, access: { model: "ticket", url: "" } }).success, true);
  assert.equal(eventCreate.safeParse({ ...event, access: { model: "ticket", url: null } }).success, true);
  assert.equal(eventPatch.safeParse({ access: { url: "" } }).success, true);
});

for (const url of [
  "javascript:alert(1)",
  "JAVASCRIPT:alert(1)",
  " javascript:alert(1)",
  "data:text/html,hi",
  "vbscript:msg",
  "/tickets",
  "//tickets.example/e",
]) {
  test("rejects " + JSON.stringify(url), () => {
    rejected(eventCreate.safeParse({ ...event, access: { model: "ticket", url } }));
    rejected(eventPatch.safeParse({ access: { url } }));
    rejected(eventPatch.safeParse({ details: { externalUrl: url } }));
    rejected(eventPatch.safeParse({ details: { sources: [{ label: "Source", url }] } }));
    rejected(eventLink.safeParse({ ...link, sourceUrl: url }));
    rejected(linkRead.safeParse({ url }));
  });
}
