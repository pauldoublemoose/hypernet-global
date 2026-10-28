// Events added from a link (2026-10-16), against a running app on the DEV branch — how to run: tests/api/api.test.ts.
// Two throwaway people sign up with a password and join; they stay in dev as "Vitest link …".
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.HN_API ?? "http://localhost:3210";
const RUN = Date.now().toString(36);

type Res = { status: number; body: any };
class Client {
  cookies = new Map<string, string>();
  async call(method: string, path: string, body?: unknown): Promise<Res> {
    const headers: Record<string, string> = { Origin: BASE };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.cookies.size) headers.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    const r = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    for (const c of r.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      const k = kv.slice(0, i), v = kv.slice(i + 1);
      if (/max-age=0/i.test(c) || v === "") this.cookies.delete(k); else this.cookies.set(k, v);
    }
    const t = await r.text();
    let j: unknown = null;
    try { j = t ? JSON.parse(t) : null; } catch { j = t; }
    return { status: r.status, body: j };
  }
  get = (p: string) => this.call("GET", p);
  post = (p: string, b?: unknown) => this.call("POST", p, b ?? {});
  put = (p: string, b?: unknown) => this.call("PUT", p, b ?? {});
  patch = (p: string, b: unknown) => this.call("PATCH", p, b);
  del = (p: string) => this.call("DELETE", p);
}
const anon = new Client(), a = new Client(), b = new Client();
let aId = "";

async function join(c: Client, who: string) {
  const s = await c.post("/api/auth/sign-up/email", { email: `hn-vitest-link-${RUN}-${who}@example.com`, password: `vitest-${RUN}-${who}-pw`, name: `Vitest link ${who}` });
  expect(s.status, JSON.stringify(s.body)).toBe(200);
  const r = await c.post("/api/me", { handle: `vl${who}${RUN}`, displayName: `Vitest link ${who}` });
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  return r.body.person.id as string;
}

beforeAll(async () => {
  const h = await anon.get("/api/health");
  expect(h.body.branch, "these tests write data: run them against dev only").toBe("dev");
  aId = await join(a, "a");
  await join(b, "b");
}, 60_000);

const LINK = `https://example.com/hn-vitest-${RUN}`;
const id = randomUUID();
const body = { id, sourceUrl: `${LINK}?utm_source=whatsapp&bref=x#tickets`, hostName: "Svenska kyrkan Hägersten", title: `Vitest Requiem ${RUN}`,
  startsOn: "2030-10-17", startTime: "18:00", city: "Hägersten", country: "SE", timezone: "Europe/Stockholm",
  venue: { name: "Uppenbarelsekyrkan", addressVisibility: "public" }, access: { model: "ticket", currency: "SEK", tiers: [{ price: 150 }] } };

describe("autofill", () => {
  it("is for people who joined, and never reads inside a network", async () => {
    expect((await anon.post("/api/events/autofill", { url: "https://billetto.se/e/x" })).status).toBe(401);
    expect((await a.post("/api/events/autofill", { url: "not a link" })).status).toBe(400);
    for (const url of ["http://127.0.0.1:3210/api/health", "http://localhost/", "http://169.254.169.254/latest/meta-data"]) {
      expect((await a.post("/api/events/autofill", { url })).body.error, url).toBe("bad_url");
    }
  });
  it("reads a Billetto event: when, where, who", async () => {
    const r = await a.post("/api/events/autofill", { url: "https://billetto.se/e/w-a-mozart-requiem-biljetter-1984010?bref=abc" });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const d = r.body.draft ?? null, e = r.body.existing ?? null;
    expect(d || e, "a draft, or the event this link already is").toBeTruthy();
    if (d) {
      expect(d).toMatchObject({ sourceUrl: "https://billetto.se/e/w-a-mozart-requiem-biljetter-1984010", title: "W A Mozart: Requiem",
        startsOn: "2026-10-17", startTime: "18:00", hostName: "Svenska kyrkan Hägersten", city: "Hägersten", country: "SE" });
    }
  }, 20_000);
});

describe("adding an event from a link", () => {
  it("makes a public event nobody here hosts, credited to who added it, its link without tracking", async () => {
    const r = await a.post("/api/events/link", { ...body, privacy: "only_me" });
    expect(r.status, "privacy is not a choice: the page is public already").toBe(400);
    const ok = await a.post("/api/events/link", body);
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    expect(ok.body.event).toMatchObject({ id, source: "link", hostId: null, hostName: "Svenska kyrkan Hägersten", privacy: "everyone", addedBy: aId, sourceUrl: LINK });
    expect(ok.body.event.access.url).toBe(LINK);
    expect(ok.body.event.details.externalUrl).toBe(LINK);
  });
  it("one link is one event: the same link again answers with the first", async () => {
    const again = await b.post("/api/events/link", { ...body, id: randomUUID(), sourceUrl: LINK, title: "Someone else's copy" });
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ existing: true, event: { id } });
    const af = await b.post("/api/events/autofill", { url: `${LINK}?fbclid=1` });
    expect(af.body.existing?.id).toBe(id);
  });
  it("whoever added it corrects it; nobody else can", async () => {
    expect((await b.patch(`/api/events/${id}`, { title: "Hijacked" })).status).toBe(404);
    expect((await b.del(`/api/events/${id}`)).status).toBe(404);
    const r = await a.patch(`/api/events/${id}`, { title: `Vitest Requiem fixed ${RUN}`, hostName: "Hägerstens församling" });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.event).toMatchObject({ title: `Vitest Requiem fixed ${RUN}`, hostName: "Hägerstens församling", hostId: null });
    expect((await a.patch(`/api/events/${id}`, { privacy: "friends" })).status).toBe(400);
  });
  it("a hosted event's host name stays the host's", async () => {
    const own = randomUUID();
    expect((await a.post("/api/events", { id: own, title: `Vitest own ${RUN}`, startsOn: "2030-06-01", city: "Brno" })).status).toBe(201);
    const r = await a.patch(`/api/events/${own}`, { hostName: "Someone famous" });
    expect(r.body.event.hostName).toBe("Vitest link a");
    await a.del(`/api/events/${own}`);
  });
  it("goes on a horizon, and a logged-in person sees it", async () => {
    const hz = randomUUID();
    expect((await a.post("/api/horizons", { id: hz, name: `Vitest link horizon ${RUN}`, published: true, eventIds: [id] })).status).toBe(201);
    const boot = (await b.get("/api/bootstrap")).body;
    expect(boot.events.some((e: { id: string }) => e.id === id)).toBe(true);
    expect(boot.horizons.find((h: { id: string }) => h.id === hz).eventIds).toEqual([id]);
    expect(boot.activity.some((x: { verb: string; objId: string }) => x.verb === "added_to_horizon" && x.objId === hz)).toBe(true);
    const anonBoot = (await anon.get("/api/bootstrap")).body;
    expect(anonBoot.events).toEqual([]);
    expect(anonBoot.horizons).toEqual([]);
    expect(anonBoot.people).toEqual([]);
    expect(anonBoot.activity).toEqual([]);
    expect((await anon.get(`/api/horizons/${hz}`)).status).toBe(404);
    await a.del(`/api/horizons/${hz}`);
  });
  it("whoever added it may delete it", async () => {
    expect((await a.del(`/api/events/${id}`)).status).toBe(200);
    expect((await anon.get(`/api/events/${id}`)).status).toBe(404);
  });
});
