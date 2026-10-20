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
const s = new Client("s");
const ids = { pub: randomUUID(), fri: randomUUID(), me: randomUUID(), hz: randomUUID(), co: randomUUID(), re: randomUUID() };
let aId = "", bId = "", sId = "";

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
  await signUp(s, "s");
}, 90_000);

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
    const people = (await anon.get("/api/bootstrap")).body.people as Record<string, unknown>[];
    const pa = people.find((p) => p.id === aId);
    expect(pa).toBeDefined();
    expect(Date.parse(String(pa!.createdAt))).toBeGreaterThan(Date.now() - 3600_000);
    expect(people.every((p) => !("email" in p) && !("authUserId" in p))).toBe(true);
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
    expect(nobody).toContain(ids.pub);
    expect(nobody).not.toContain(ids.fri);
    // friends = the people the HOST follows (one way)
    expect((await b.put(`/api/people/${aId}/follow`)).status).toBe(200);
    expect(await seen(b)).not.toContain(ids.fri);
    expect((await a.put(`/api/people/${bId}/follow`)).status).toBe(200);
    expect(await seen(b)).toContain(ids.fri);
    expect(await seen(b)).not.toContain(ids.me);
    expect((await b.get(`/api/events/${ids.me}`)).status).toBe(404);
    expect((await b.get(`/api/events/not-a-uuid`)).status).toBe(404);
    expect(evIds(await anon.get("/api/events?limit=200"))).not.toContain(ids.fri);
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
    expect(actAnon.some((x: any) => x.objId === ids.fri || x.objId === ids.me)).toBe(false);
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
    expect((await anon.get(`/api/horizons/${ids.hz}`)).body.horizon.followers).toBe(1);
  });
  it("its owner reorders and removes; nobody else can", async () => {
    expect((await b.put(`/api/horizons/${ids.hz}/events`, { eventIds: [] })).status).toBe(404);
    const r = await a.put(`/api/horizons/${ids.hz}/events`, { eventIds: [ids.fri, ids.pub] });
    expect(r.body.horizon.eventIds).toEqual([ids.fri, ids.pub]);
    expect((await b.patch(`/api/horizons/${ids.hz}`, { name: "Hijack" })).status).toBe(404);
  });
});

describe("horizon collaborators", () => {
  const hzP = randomUUID();
  const eventId = randomUUID();
  const hzName = `Vitest private ${RUN}`;
  const idsOf = (body: { horizons: { id: string }[] }) => body.horizons.map((h) => h.id);
  async function invites(who: Client, otherId: string, hzId: string) {
    const chats = (await who.get("/api/chats")).body.chats as {
      personId: string;
      lastReadAt: string | null;
      messages: { body: string; cardType?: string; cardId?: string; cardName?: string | null }[];
    }[];
    const thread = chats.find((c) => c.personId === otherId);
    return { thread, messages: (thread?.messages ?? []).filter((m) => m.cardType === "horizon_invite" && m.cardId === hzId) };
  }

  beforeAll(async () => {
    const joined = await s.post("/api/me", { handle: `vs${RUN}`, displayName: "Vitest S" });
    expect(joined.status, JSON.stringify(joined.body)).toBe(201);
    sId = joined.body.person.id;
    const ev = await a.post("/api/events", { id: eventId, title: `Vitest collab ${RUN}`, startsOn: "2030-08-01", privacy: "everyone" });
    expect(ev.status, JSON.stringify(ev.body)).toBe(201);
    const hz = await a.post("/api/horizons", { id: hzP, name: hzName, description: "First", eventIds: [eventId] });
    expect(hz.status, JSON.stringify(hz.body)).toBe(201);
    expect(hz.body.horizon.publishedAt).toBeNull();
    expect(hz.body.horizon.collaboratorIds).toEqual([]);
    expect(hz.body.horizon.pendingCollaboratorIds).toEqual([]);
  });

  it("a private horizon stays hidden from a stranger and from a logged-out reader", async () => {
    expect((await s.get(`/api/horizons/${hzP}`)).status).toBe(404);
    expect((await anon.get(`/api/horizons/${hzP}`)).status).toBe(404);
    expect(idsOf((await s.get("/api/bootstrap")).body)).not.toContain(hzP);
    expect(idsOf((await anon.get("/api/bootstrap")).body)).not.toContain(hzP);
  });

  it("the owner cannot add themselves", async () => {
    const r = await a.post(`/api/horizons/${hzP}/collaborators`, { personId: aId });
    expect(r.status, JSON.stringify(r.body)).toBe(400);
    expect(r.body.message).toBe("The owner is already on this horizon.");
    const hz = (await a.get(`/api/horizons/${hzP}`)).body.horizon;
    expect(hz.collaboratorIds).toEqual([]);
    expect(hz.pendingCollaboratorIds).toEqual([]);
  });

  it("the owner invites someone, who still cannot see or follow the private horizon", async () => {
    const r = await a.post(`/api/horizons/${hzP}/collaborators`, { personId: bId });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.collaboratorIds).toEqual([]);
    expect(r.body.horizon.pendingCollaboratorIds).toEqual([bId]);
    const got = (await a.get(`/api/horizons/${hzP}`)).body.horizon;
    const mine = (await a.get("/api/bootstrap")).body.horizons.find((h: { id: string }) => h.id === hzP);
    expect(got.collaboratorIds).toEqual([]);
    expect(got.pendingCollaboratorIds).toEqual([bId]);
    expect(mine.collaboratorIds).toEqual(got.collaboratorIds);
    expect(mine.pendingCollaboratorIds).toEqual(got.pendingCollaboratorIds);
    expect((await b.get(`/api/horizons/${hzP}`)).status).toBe(404);
    expect(idsOf((await b.get("/api/bootstrap")).body)).not.toContain(hzP);
    expect((await s.put(`/api/horizons/${hzP}/follow`)).status).toBe(404);
    expect((await b.put(`/api/horizons/${hzP}/follow`)).status).toBe(404);
  });

  it("inviting the same person again stays pending and sends one message", async () => {
    const r = await a.post(`/api/horizons/${hzP}/collaborators`, { personId: bId });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.collaboratorIds).toEqual([]);
    expect(r.body.horizon.pendingCollaboratorIds).toEqual([bId]);
    const chat = await invites(b, aId, hzP);
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({ cardType: "horizon_invite", cardId: hzP, body: "pending", cardName: hzName });
    expect(chat.thread?.lastReadAt).toBeNull();
  });

  it("only the invited person can accept", async () => {
    const owner = await a.post(`/api/horizons/${hzP}/invites`);
    expect(owner.status, JSON.stringify(owner.body)).toBe(403);
    expect(owner.body.message).toBe("Only the invited person can answer this.");
    expect((await s.post(`/api/horizons/${hzP}/invites`)).status).toBe(404);
  });

  it("the invited person accepts, and then both see the message as accepted", async () => {
    const r = await b.post(`/api/horizons/${hzP}/invites`);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.collaboratorIds).toEqual([bId]);
    expect(r.body.horizon.pendingCollaboratorIds).toEqual([]);
    expect((await invites(a, bId, hzP)).messages.map((m) => m.body)).toEqual(["accepted"]);
    expect((await invites(b, aId, hzP)).messages.map((m) => m.body)).toEqual(["accepted"]);
  });

  it("a collaborator renames it and rewrites the description", async () => {
    const r = await b.patch(`/api/horizons/${hzP}`, { name: `Vitest renamed ${RUN}`, description: "Shared notes" });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon).toMatchObject({ name: `Vitest renamed ${RUN}`, description: "Shared notes" });
  });

  it("a collaborator cannot publish it", async () => {
    const r = await b.patch(`/api/horizons/${hzP}`, { published: true });
    expect(r.status, JSON.stringify(r.body)).toBe(403);
    expect(r.body.message).toBe("Only the owner can change who can see this, its look, or its cover.");
    expect((await a.get(`/api/horizons/${hzP}`)).body.horizon.publishedAt).toBeNull();
  });

  it("a collaborator cannot change its look", async () => {
    const r = await b.patch(`/api/horizons/${hzP}`, { look: { bg: "#000000", ink: "#ffffff", accent: "#ff2fd0" } });
    expect(r.status, JSON.stringify(r.body)).toBe(403);
    expect(r.body.message).toBe("Only the owner can change who can see this, its look, or its cover.");
    expect((await a.get(`/api/horizons/${hzP}`)).body.horizon.look).toBeNull();
  });

  it("a collaborator cannot set its cover", async () => {
    const r = await b.patch(`/api/horizons/${hzP}`, { coverEventId: eventId });
    expect(r.status, JSON.stringify(r.body)).toBe(403);
    expect(r.body.message).toBe("Only the owner can change who can see this, its look, or its cover.");
    expect((await a.get(`/api/horizons/${hzP}`)).body.horizon.coverEventId).toBeNull();
  });

  it("a collaborator sets the event list, in that order", async () => {
    const other = randomUUID();
    const ev = await a.post("/api/events", { id: other, title: `Vitest collab two ${RUN}`, startsOn: "2030-08-02", privacy: "everyone" });
    expect(ev.status, JSON.stringify(ev.body)).toBe(201);
    const r = await b.put(`/api/horizons/${hzP}/events`, { eventIds: [other, eventId] });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.eventIds).toEqual([other, eventId]);
  });

  it("a collaborator save keeps an event they cannot see", async () => {
    const secret = randomUUID();
    const pub = randomUUID();
    const id = randomUUID();
    const hidden = await a.post("/api/events", { id: secret, title: `Vitest secret ${RUN}`, startsOn: "2030-08-03", privacy: "only_me" });
    expect(hidden.status, JSON.stringify(hidden.body)).toBe(201);
    const shown = await a.post("/api/events", { id: pub, title: `Vitest shown ${RUN}`, startsOn: "2030-08-04", privacy: "everyone" });
    expect(shown.status, JSON.stringify(shown.body)).toBe(201);
    const created = await a.post("/api/horizons", { id, name: `Vitest keep ${RUN}`, eventIds: [pub, secret] });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect((await a.post(`/api/horizons/${id}/collaborators`, { personId: bId })).status).toBe(200);
    expect((await b.post(`/api/horizons/${id}/invites`)).status).toBe(200);
    const saved = await b.put(`/api/horizons/${id}/events`, { eventIds: [pub] });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.horizon.eventIds).toEqual([pub]);
    expect((await a.get(`/api/horizons/${id}`)).body.horizon.eventIds).toEqual([pub, secret]);
  });

  it("a collaborator cannot delete the horizon", async () => {
    const r = await b.del(`/api/horizons/${hzP}`);
    expect(r.status, JSON.stringify(r.body)).toBe(403);
    expect((await a.get(`/api/horizons/${hzP}`)).status).toBe(200);
  });

  it("a collaborator cannot add or remove someone else", async () => {
    expect((await b.post(`/api/horizons/${hzP}/collaborators`, { personId: sId })).status).toBe(403);
    expect((await b.del(`/api/horizons/${hzP}/collaborators?personId=${sId}`)).status).toBe(403);
    expect((await a.get(`/api/horizons/${hzP}`)).body.horizon.collaboratorIds).toEqual([bId]);
  });

  it("the owner has to name which collaborator to remove", async () => {
    const r = await a.del(`/api/horizons/${hzP}/collaborators`);
    expect(r.status, JSON.stringify(r.body)).toBe(400);
    expect(r.body.message).toBe("Say which collaborator to remove.");
    expect((await a.get(`/api/horizons/${hzP}`)).body.horizon.collaboratorIds).toEqual([bId]);
  });

  it("the owner removes an accepted collaborator", async () => {
    const id = randomUUID();
    const created = await a.post("/api/horizons", { id, name: `Vitest remove ${RUN}` });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect((await a.post(`/api/horizons/${id}/collaborators`, { personId: bId })).status).toBe(200);
    const accepted = await b.post(`/api/horizons/${id}/invites`);
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200);
    expect(accepted.body.horizon.collaboratorIds).toEqual([bId]);
    const r = await a.del(`/api/horizons/${id}/collaborators?personId=${bId}`);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.collaboratorIds).toEqual([]);
    expect((await b.get(`/api/horizons/${id}`)).status).toBe(404);
    expect((await invites(a, bId, id)).messages.map((m) => m.body)).toEqual(["accepted"]);
  });

  it("a collaborator sees the private horizon, and a stranger does not", async () => {
    expect((await b.get(`/api/horizons/${hzP}`)).status).toBe(200);
    expect(idsOf((await b.get("/api/bootstrap")).body)).toContain(hzP);
    expect((await s.get(`/api/horizons/${hzP}`)).status).toBe(404);
    expect(idsOf((await s.get("/api/bootstrap")).body)).not.toContain(hzP);
    expect((await anon.get(`/api/horizons/${hzP}`)).status).toBe(404);
  });

  it("a collaborator follows the private horizon, and a stranger does not", async () => {
    const followed = await b.put(`/api/horizons/${hzP}/follow`);
    expect(followed.status, JSON.stringify(followed.body)).toBe(200);
    expect(followed.body.following).toBe(true);
    expect((await s.put(`/api/horizons/${hzP}/follow`)).status).toBe(404);
  });

  it("inviting someone who already accepted does not open a second invite", async () => {
    const r = await a.post(`/api/horizons/${hzP}/collaborators`, { personId: bId });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.collaboratorIds).toEqual([bId]);
    expect(r.body.horizon.pendingCollaboratorIds).toEqual([]);
    expect((await invites(a, bId, hzP)).messages.map((m) => m.body)).toEqual(["accepted"]);
    expect((await invites(b, aId, hzP)).messages.map((m) => m.body)).toEqual(["accepted"]);
  });

  it("a collaborator leaves, and then the private horizon is gone for them", async () => {
    const r = await b.del(`/api/horizons/${hzP}/collaborators`);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.collaboratorIds).toEqual([]);
    expect((await b.get(`/api/horizons/${hzP}`)).status).toBe(404);
    expect(idsOf((await b.get("/api/bootstrap")).body)).not.toContain(hzP);
  });

  it("the invited person declines, and the private horizon stays hidden", async () => {
    const id = randomUUID();
    const created = await a.post("/api/horizons", { id, name: `Vitest decline ${RUN}` });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect((await a.post(`/api/horizons/${id}/collaborators`, { personId: bId })).status).toBe(200);
    const declined = await b.del(`/api/horizons/${id}/invites`);
    expect(declined.status, JSON.stringify(declined.body)).toBe(200);
    expect(declined.body.ok).toBe(true);
    expect((await b.get(`/api/horizons/${id}`)).status).toBe(404);
    expect((await a.get(`/api/horizons/${id}`)).body.horizon.collaboratorIds).toEqual([]);
    expect((await a.get(`/api/horizons/${id}`)).body.horizon.pendingCollaboratorIds).toEqual([]);
    expect((await invites(a, bId, id)).messages.map((m) => m.body)).toEqual(["declined"]);
    expect((await invites(b, aId, id)).messages.map((m) => m.body)).toEqual(["declined"]);
    const owner = await a.post(`/api/horizons/${id}/invites`);
    expect(owner.status, JSON.stringify(owner.body)).toBe(403);
    expect(owner.body.message).toBe("Only the invited person can answer this.");
    expect((await s.post(`/api/horizons/${id}/invites`)).status).toBe(404);
  });

  it("the owner cancels a pending invite", async () => {
    const id = randomUUID();
    const created = await a.post("/api/horizons", { id, name: `Vitest cancel ${RUN}` });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect((await a.post(`/api/horizons/${id}/collaborators`, { personId: bId })).status).toBe(200);
    const r = await a.del(`/api/horizons/${id}/collaborators?personId=${bId}`);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.horizon.pendingCollaboratorIds).toEqual([]);
    expect(r.body.horizon.collaboratorIds).toEqual([]);
    expect((await b.get(`/api/horizons/${id}`)).status).toBe(404);
    expect((await invites(a, bId, id)).messages.map((m) => m.body)).toEqual(["cancelled"]);
    expect((await invites(b, aId, id)).messages.map((m) => m.body)).toEqual(["cancelled"]);
    const again = await b.post(`/api/horizons/${id}/invites`);
    expect(again.status, JSON.stringify(again.body)).toBe(404);
    expect(again.body.message).toBe("No invite to answer.");
  });

  it("a personal list cannot have collaborators", async () => {
    const id = randomUUID();
    const created = await a.post("/api/horizons", { id, name: `Vitest personal ${RUN}`, isPersonalDefault: true });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body.horizon.collaboratorIds).toEqual([]);
    const r = await a.post(`/api/horizons/${id}/collaborators`, { personId: bId });
    expect(r.status, JSON.stringify(r.body)).toBe(400);
    expect(r.body.message).toBe("A personal list cannot have collaborators.");
    const after = (await a.get(`/api/horizons/${id}`)).body.horizon;
    expect(after.collaboratorIds).toEqual([]);
    expect(after.pendingCollaboratorIds).toEqual([]);
  });
});

describe("call outs and replies", () => {
  it("post, reply in public, delete replies, close", async () => {
    const c = await a.post("/api/callouts", { id: ids.co, title: "Vitest sound", eventId: ids.pub, skill: "SOUND/DJING", expiresOn: "2030-05-01" });
    expect(c.status, JSON.stringify(c.body)).toBe(201);
    const r = await b.post(`/api/callouts/${ids.co}/replies`, { id: ids.re, text: "I can do it" });
    expect(r.status).toBe(201);
    expect((await anon.get("/api/bootstrap")).body.replies).toContainEqual(expect.objectContaining({ id: ids.re, authorId: bId }));
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
    const earlier = (await a.get("/api/chats")).body.chats.find((c: any) => c.personId === bId);
    const prior = earlier ? earlier.messages.length : 0;
    const m = await b.post(`/api/chats/${aId}/messages`, { body: "Hi A" });
    expect(m.status, JSON.stringify(m.body)).toBe(201);
    const chatsA = (await a.get("/api/chats")).body.chats;
    const t = chatsA.find((c: any) => c.personId === bId);
    expect(t.messages.slice(prior).map((x: any) => x.body)).toEqual(["Hi A"]);
    expect(t.lastReadAt).toBeNull();
    await a.post(`/api/chats/${bId}/messages`, { body: "Hi B" });
    const t2 = (await b.get("/api/chats")).body.chats.find((c: any) => c.personId === aId);
    expect(t2.threadId).toBe(t.threadId);
    expect(t2.messages).toHaveLength(prior + 2);
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
