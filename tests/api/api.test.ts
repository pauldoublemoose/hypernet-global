// API tests against a running app on the DEV branch (never production):
//   with-secrets --dir . -- ./node_modules/.bin/next dev --port 3210      (one terminal)
//   HN_API=http://localhost:3210 npx vitest run tests/api                  (another)
// Two throwaway people sign up with a password (dev's Neon Auth allows it; the app itself only uses email codes)
// and walk through every write the app makes, checking privacy at each step. They stay in dev as "Vitest …".
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.HN_API ?? "http://localhost:3210";
const RUN = Date.now().toString(36);

type Res = { status: number; body: any };
class Client {
  cookies = new Map<string, string>();
  constructor(public name: string) {}
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

const anon = new Client("anon");
const a = new Client("a");
const b = new Client("b");
const ids = { pub: randomUUID(), fri: randomUUID(), me: randomUUID(), hz: randomUUID(), co: randomUUID(), re: randomUUID() };
let aId = "", bId = "";

async function signUp(c: Client, who: string) {
  const r = await c.post("/api/auth/sign-up/email", { email: `hn-vitest-${RUN}-${who}@example.com`, password: `vitest-${RUN}-${who}-pw`, name: `Vitest ${who}` });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
}
const evIds = (r: Res) => (r.body.events as { id: string }[]).map((e) => e.id);

beforeAll(async () => {
  const h = await anon.get("/api/health");
  expect(h.status).toBe(200);
  expect(h.body.branch, "these tests write data: run them against dev only").toBe("dev");
  await signUp(a, "a");
  await signUp(b, "b");
}, 60_000);

describe("login and join", () => {
  it("logged out is nobody, and cannot write", async () => {
    expect((await anon.get("/api/me")).body).toEqual({ user: null, person: null });
    expect((await anon.post("/api/events", { title: "x", startsOn: "2030-01-01" })).status).toBe(401);
    expect((await anon.put(`/api/events/${ids.pub}/rsvp`, { status: "going" })).status).toBe(401);
  });
  it("a new login has no profile until it joins; writes say join first", async () => {
    const me = await a.get("/api/me");
    expect(me.body.user.email).toMatch(/hn-vitest-.*-a@example.com/);
    expect(me.body.person).toBeNull();
    expect((await a.post("/api/events", { title: "x", startsOn: "2030-01-01" })).status).toBe(403);
  });
  it("joins with a handle, skills and cities; a taken handle is 409", async () => {
    const r = await a.post("/api/me", { handle: `va${RUN}`, displayName: "Vitest A", skills: ["SOUND/DJING"], cities: ["Brno"] });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    aId = r.body.person.id;
    expect(r.body.person).toMatchObject({ handle: `va${RUN}`, skills: ["SOUND/DJING"], cities: ["Brno"] });
    expect((await b.post("/api/me", { handle: `VA${RUN}`, displayName: "Clash" })).body.error).toBe("handle_taken");
    const rb = await b.post("/api/me", { handle: `vb${RUN}`, displayName: "Vitest B" });
    expect(rb.status).toBe(201);
    bId = rb.body.person.id;
    expect((await a.post("/api/me", { handle: `va2${RUN}`, displayName: "Again" })).status).toBe(409);
  });
  it("edits the profile; a look must be hex colours and our own pictures", async () => {
    expect((await a.patch("/api/me", { bio: "Builds shade" })).body.person.bio).toBe("Builds shade");
    expect((await a.patch("/api/me", { look: { bg: "#FFF", ink: "#000000", accent: "#123456" } })).body.person.look.bg).toBe("#ffffff");
    expect((await a.patch("/api/me", { look: { bg: "red", ink: "#000000", accent: "#123456" } })).status).toBe(400);
    expect((await a.patch("/api/me", { look: { bg: "#ffffff", ink: "#000000", accent: "#123456", image: "https://evil.example/x.png" } })).status).toBe(400);
    /* 2026-10-05: a look keeps the one to three colours it was picked from (page, accent or null, header or null) */
    const picked = await a.patch("/api/me", { look: { bg: "#000000", ink: "#f5f5f5", accent: "#ff2fd0", colors: ["#000000", null, "#FF2FD0"] } });
    expect(picked.body.person.look.colors).toEqual(["#000000", null, "#ff2fd0"]);
    expect((await a.patch("/api/me", { look: { bg: "#000000", ink: "#f5f5f5", accent: "#ff2fd0", colors: ["red"] } })).status).toBe(400);
    expect((await a.patch("/api/me", { look: { bg: "#000000", ink: "#f5f5f5", accent: "#ff2fd0", colors: [null, "#ffffff"] } })).status).toBe(400);
    expect((await a.patch("/api/me", { look: { bg: "#000000", ink: "#f5f5f5", accent: "#ff2fd0", colors: ["#000000", "#111111", "#222222", "#333333"] } })).status).toBe(400);
  });
});

describe("the network", () => {
  // 2026-10-05 (v5-feed): Home's "N people joined Hypernet" and Explore → People newest first read when an account was made
  it("says when people joined, and never their emails", async () => {
    const people = (await a.get("/api/bootstrap")).body.people as Record<string, unknown>[];
    const pa = people.find((p) => p.id === aId);
    expect(pa).toBeDefined();
    expect(Date.parse(String(pa!.createdAt))).toBeGreaterThan(Date.now() - 3600_000);
    expect(people.every((p) => !("email" in p) && !("authUserId" in p))).toBe(true);
    expect((await anon.get("/api/bootstrap")).body.people).toEqual([]);
  });
});

describe("events and privacy", () => {
  it("creates events with the browser's ids", async () => {
    for (const [id, privacy] of [[ids.pub, "everyone"], [ids.fri, "friends"], [ids.me, "only_me"]] as const) {
      const r = await a.post("/api/events", { id, title: `Vitest ${privacy} ${RUN}`, startsOn: "2030-06-01", privacy, city: "Brno",
        details: { venueKind: "physical" }, look: { bg: "#06080e", ink: "#e9e7e0", accent: "#6fd6c8", glyph: "☾" } });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
      expect(r.body.event).toMatchObject({ id, privacy, hostId: aId, startsOn: "2030-06-01" });
    }
    expect((await a.post("/api/events", { id: ids.pub, title: "dupe", startsOn: "2030-06-01" })).status).toBe(409);
    expect((await a.post("/api/events", { title: "bad", startsOn: "2030-06-02", endsOn: "2030-06-01" })).status).toBe(400);
  });
  it("everyone / friends / only me", async () => {
    const seen = async (c: Client) => (await c.get("/api/bootstrap")).body.events.map((e: { id: string }) => e.id) as string[];
    const host = await seen(a), stranger = await seen(b), nobody = await seen(anon);
    expect(host).toEqual(expect.arrayContaining([ids.pub, ids.fri, ids.me]));
    expect(stranger).toContain(ids.pub);
    expect(stranger).not.toContain(ids.fri);
    expect(stranger).not.toContain(ids.me);
    expect(nobody).not.toContain(ids.pub);
    expect(nobody).not.toContain(ids.fri);
    expect(nobody).not.toContain(ids.me);
    // a follow is not a friendship, and a pending request is not one either
    expect((await b.put(`/api/people/${aId}/follow`)).status).toBe(200);
    expect(await seen(b)).not.toContain(ids.fri);
    expect((await a.put(`/api/people/${bId}/friend`)).body.friendship.status).toBe("pending");
    expect(await seen(b)).not.toContain(ids.fri);
    expect((await b.put(`/api/people/${aId}/friend`)).body.friendship.status).toBe("accepted");
    expect(await seen(b)).toContain(ids.fri);
    expect(await seen(b)).not.toContain(ids.me);
    expect((await a.put(`/api/people/${bId}/follow`)).status).toBe(200);
    expect((await b.get(`/api/events/${ids.me}`)).status).toBe(404);
    expect((await b.get(`/api/events/not-a-uuid`)).status).toBe(404);
    expect((await anon.get(`/api/events/${ids.pub}`)).status).toBe(404);
    expect(evIds(await anon.get("/api/events?limit=200"))).not.toContain(ids.pub);
  });
  it("only the host edits; validation answers 400", async () => {
    expect((await b.patch(`/api/events/${ids.pub}`, { title: "Hijack" })).status).toBe(404);
    const r = await a.patch(`/api/events/${ids.pub}`, { title: `Vitest everyone edited ${RUN}`, endsOn: "2030-06-03" });
    expect(r.status).toBe(200);
    expect(r.body.event).toMatchObject({ endsOn: "2030-06-03" });
    expect((await a.patch(`/api/events/${ids.pub}`, { privacy: "public" })).status).toBe(400);
    expect((await a.patch(`/api/events/${ids.pub}`, {})).status).toBe(400);
  });
});

describe("RSVPs, promotions, follows, activity", () => {
  it("going, went, a shift; un-going keeps went", async () => {
    expect((await b.put(`/api/events/${ids.pub}/rsvp`, { status: "going", shiftIndex: 0 })).body.rsvp).toMatchObject({ status: "going", shiftIndex: 0 });
    const seenByA = (await a.get("/api/bootstrap")).body.rsvps.filter((r: any) => r.eventId === ids.pub);
    expect(seenByA).toEqual([expect.objectContaining({ personId: bId, status: "going" })]);
    expect((await b.put(`/api/events/${ids.pub}/rsvp`, { status: null, went: true })).body.rsvp).toMatchObject({ status: null, went: true, shiftIndex: 0 });
    expect((await b.put(`/api/events/${ids.me}/rsvp`, { status: "going" })).status).toBe(404);
  });
  it("promote and un-promote", async () => {
    expect((await b.put(`/api/events/${ids.pub}/promote`)).body.promoted).toBe(true);
    expect((await a.get("/api/bootstrap")).body.promotions).toContainEqual([bId, ids.pub]);
    expect((await b.del(`/api/events/${ids.pub}/promote`)).body.promoted).toBe(false);
  });
  it("activity is derived and respects privacy", async () => {
    await b.put(`/api/events/${ids.fri}/rsvp`, { status: "interested" });
    const actA = (await a.get("/api/bootstrap")).body.activity;
    expect(actA).toContainEqual(expect.objectContaining({ actor: bId, verb: "interested", objId: ids.fri }));
    expect(actA).toContainEqual(expect.objectContaining({ actor: aId, verb: "followed_person", objId: bId }));
    const actAnon = (await anon.get("/api/bootstrap")).body.activity;
    expect(actAnon).toEqual([]);
  });
  it("cannot follow yourself or nobody", async () => {
    expect((await a.put(`/api/people/${aId}/follow`)).status).toBe(400);
    expect((await a.put(`/api/people/${randomUUID()}/follow`)).status).toBe(404);
  });
});

describe("horizons", () => {
  it("a private horizon is its owner's only; published, others see and follow it", async () => {
    const r = await a.post("/api/horizons", { id: ids.hz, name: `Vitest horizon ${RUN}`, eventIds: [ids.pub, ids.fri, ids.me] });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    expect(r.body.horizon.eventIds).toEqual([ids.pub, ids.fri, ids.me]);
    expect((await b.get("/api/bootstrap")).body.horizons.map((h: any) => h.id)).not.toContain(ids.hz);
    expect((await b.put(`/api/horizons/${ids.hz}/follow`)).status).toBe(404);
    expect((await a.patch(`/api/horizons/${ids.hz}`, { published: true })).body.horizon.publishedAt).toBeTruthy();
    const hzB = (await b.get("/api/bootstrap")).body.horizons.find((h: any) => h.id === ids.hz);
    expect(hzB.eventIds).toEqual([ids.pub, ids.fri]); // only_me stays hidden inside a public horizon
    expect((await b.put(`/api/horizons/${ids.hz}/follow`)).status).toBe(200);
    expect((await anon.get(`/api/horizons/${ids.hz}`)).status).toBe(404);
    const hzB2 = (await b.get(`/api/horizons/${ids.hz}`)).body.horizon;
    expect(hzB2.followers).toBe(1);
    expect(hzB2.eventIds).toEqual([ids.pub, ids.fri]);
  });
  it("its owner reorders and removes; nobody else can", async () => {
    expect((await b.put(`/api/horizons/${ids.hz}/events`, { eventIds: [] })).status).toBe(404);
    const r = await a.put(`/api/horizons/${ids.hz}/events`, { eventIds: [ids.fri, ids.pub] });
    expect(r.body.horizon.eventIds).toEqual([ids.fri, ids.pub]);
    expect((await b.patch(`/api/horizons/${ids.hz}`, { name: "Hijack" })).status).toBe(404);
  });
});

describe("call outs and replies", () => {
  it("post, reply in public, delete replies, close", async () => {
    const c = await a.post("/api/callouts", { id: ids.co, title: "Vitest sound", eventId: ids.pub, skill: "SOUND/DJING", expiresOn: "2030-05-01" });
    expect(c.status, JSON.stringify(c.body)).toBe(201);
    const r = await b.post(`/api/callouts/${ids.co}/replies`, { id: ids.re, text: "I can do it" });
    expect(r.status).toBe(201);
    expect((await anon.get("/api/bootstrap")).body.replies.some((r: { id: string }) => r.id === ids.re)).toBe(false);
    expect((await b.del(`/api/replies/${ids.re}`)).status).toBe(200);
    const r2 = await b.post(`/api/callouts/${ids.co}/replies`, { text: "Again" });
    expect((await a.del(`/api/replies/${r2.body.reply.id}`)).status).toBe(200); // the call out's author may remove any
    expect((await b.patch(`/api/callouts/${ids.co}`, { closed: true })).status).toBe(404);
    expect((await a.patch(`/api/callouts/${ids.co}`, { closed: true })).body.callout.closedAt).toBeTruthy();
    expect((await b.post(`/api/callouts/${ids.co}/replies`, { text: "Too late" })).status).toBe(409);
  });
});

describe("direct messages", () => {
  it("one conversation per pair, unread until read", async () => {
    const m = await b.post(`/api/chats/${aId}/messages`, { body: "Hi A" });
    expect(m.status, JSON.stringify(m.body)).toBe(201);
    const chatsA = (await a.get("/api/chats")).body.chats;
    const t = chatsA.find((c: any) => c.personId === bId);
    expect(t.messages.map((x: any) => x.body)).toEqual(["Hi A"]);
    expect(t.lastReadAt).toBeNull();
    await a.post(`/api/chats/${bId}/messages`, { body: "Hi B" });
    const t2 = (await b.get("/api/chats")).body.chats.find((c: any) => c.personId === aId);
    expect(t2.threadId).toBe(t.threadId);
    expect(t2.messages).toHaveLength(2);
    expect((await a.put(`/api/chats/${bId}/read`)).status).toBe(200);
    expect((await anon.get("/api/chats")).status).toBe(401);
  });
});

describe("images", () => {
  it("signs an upload for image/* only, 10 MB at most; the picture is public; looks accept it", async () => {
    expect((await a.post("/api/images", { contentType: "image/svg+xml", bytes: 100 })).status).toBe(400);
    expect((await a.post("/api/images", { contentType: "image/webp", bytes: 11 * 1024 * 1024 })).status).toBe(400);
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const r = await a.post("/api/images", { contentType: "image/png", bytes: png.length });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    const up = await fetch(r.body.upload.url, { method: "PUT", headers: r.body.upload.headers, body: png });
    expect(up.status).toBe(200);
    const got = await fetch(r.body.url);
    expect(got.status).toBe(200);
    expect(Buffer.from(await got.arrayBuffer()).equals(png)).toBe(true);
    const lk = await a.patch("/api/me", { look: { bg: "#ffffff", ink: "#000000", accent: "#123456", image: r.body.url } });
    expect(lk.status).toBe(200);
    // a different size than signed is refused by storage
    const r3 = await a.post("/api/images", { contentType: "image/png", bytes: png.length + 5 });
    const bad = await fetch(r3.body.upload.url, { method: "PUT", headers: r3.body.upload.headers, body: png });
    expect(bad.ok).toBe(false);
  }, 30_000);
});

describe("friends and contact lists", () => {
  it("friendship does not follow, and a stranger or yourself cannot", async () => {
    const follows = (await a.get("/api/bootstrap")).body.follows as [string, string][];
    expect(follows.some((f) => f[0] === aId && f[1] === bId || f[0] === bId && f[1] === aId)).toBe(true);
    expect((await a.put(`/api/people/${aId}/friend`)).status).toBe(400);
    expect((await a.put(`/api/people/${randomUUID()}/friend`)).status).toBe(404);
    expect((await a.del(`/api/people/${randomUUID()}/friend`)).status).toBe(404);
    const boot = (await b.get("/api/bootstrap")).body;
    expect(boot.friendships).toEqual([expect.objectContaining({ status: "accepted" })]);
    expect(boot.follows.every((f: string[]) => f.includes(bId))).toBe(true);
    expect((await anon.get("/api/bootstrap")).body.follows).toEqual([]);
    expect((await anon.get("/api/bootstrap")).body.friendships).toEqual([]);
    const empty = (await anon.get("/api/bootstrap")).body;
    expect(empty.people).toEqual([]);
    expect(empty.horizons).toEqual([]);
    expect(empty.callouts).toEqual([]);
    expect(empty.activity).toEqual([]);
    expect(empty.events).toEqual([]);
    const ff = (await a.get("/api/bootstrap")).body.friendFollows as [string, string][];
    expect(ff).toContainEqual([bId, aId]);
    expect(ff.some((f) => f[0] === aId)).toBe(false);
    expect((await anon.get(`/api/people/${aId}/relations`)).status).toBe(404);
    const rel = await a.get(`/api/people/${aId}/relations`);
    expect(rel.status).toBe(200);
    expect(rel.body.friends.map((p: { id: string }) => p.id)).toContain(bId);
    expect((await b.get(`/api/people/${aId}/relations`)).body.friends).toBeNull();
    expect((await b.get(`/api/people/${aId}/relations`)).body.followers.map((p: { id: string }) => p.id)).toContain(bId);
  });
  it("lists are the owner's; a duplicate name is 409; exclude blocks delete", async () => {
    const created = await a.post("/api/lists", { name: `Crew ${RUN}` });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const listId = created.body.list.id as string;
    expect((await a.post("/api/lists", { name: `Crew ${RUN}` })).status).toBe(409);
    expect((await b.patch(`/api/lists/${listId}`, { name: "Nope" })).status).toBe(404);
    expect((await a.put(`/api/lists/${listId}/members/${bId}`)).body.member).toBe(true);
    expect((await a.put(`/api/lists/${listId}/members/${randomUUID()}`)).status).toBe(404);
    expect((await b.put(`/api/lists/${listId}/members/${aId}`)).status).toBe(404);
    const hidden = await a.post("/api/events", {
      title: `List only ${RUN}`, startsOn: "2030-07-01",
      audience: { include: [`list:${listId}`], exclude: [`list:${listId}`] },
    });
    expect(hidden.status, JSON.stringify(hidden.body)).toBe(201);
    expect(hidden.body.event.audience.include).toEqual([`list:${listId}`]);
    expect(hidden.body.event.privacy).toBe("friends");
    expect((await b.get(`/api/events/${hidden.body.event.id}`)).status).toBe(404);
    const blocked = await a.del(`/api/lists/${listId}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.events).toEqual([expect.objectContaining({ id: hidden.body.event.id })]);
    expect((await a.patch(`/api/events/${hidden.body.event.id}`, { audience: { include: ["friends"], exclude: [] } })).status).toBe(200);
    expect((await a.del(`/api/lists/${listId}`)).status).toBe(200);
    expect((await b.get("/api/bootstrap")).body.lists).toEqual([]);
    expect((await a.get("/api/bootstrap")).body.lists).toEqual([]);
  });
});

describe("deleting", () => {
  it("a deleted event leaves every list", async () => {
    expect((await b.del(`/api/events/${ids.pub}`)).status).toBe(404);
    expect((await a.del(`/api/events/${ids.pub}`)).status).toBe(200);
    const boot = (await a.get("/api/bootstrap")).body;
    expect(boot.events.map((e: any) => e.id)).not.toContain(ids.pub);
    expect(boot.horizons.find((h: any) => h.id === ids.hz).eventIds).toEqual([ids.fri]);
    expect(boot.activity.some((x: any) => x.objId === ids.pub)).toBe(false);
    expect((await a.del(`/api/horizons/${ids.hz}`)).status).toBe(200);
  });
  it("logging out ends the session", async () => {
    await b.post("/api/auth/sign-out", {});
    expect((await b.get("/api/me")).body.user).toBeNull();
  });
});
