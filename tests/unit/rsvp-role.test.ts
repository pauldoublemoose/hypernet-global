// Role checks for PUT /api/events/:id/rsvp, with no database.
// Migration 0006 adds rsvps.role and is not applied on Neon, so this file never connects.
// sqlx is a stand-in that applies the statement the route sends:
//   role = case when $9 then excluded.role else r.role end
import { beforeEach, describe, expect, it, vi } from "vitest";

const EVENT = "00000000-0000-4000-8000-0000000000e1";
const HOST = "00000000-0000-4000-8000-0000000000aa";
const GUEST = "00000000-0000-4000-8000-0000000000bb";

const h = vi.hoisted(() => ({
  state: {
    viewer: "00000000-0000-4000-8000-0000000000bb",
    hostId: "00000000-0000-4000-8000-0000000000aa" as string | null,
    see: true,
    storedRole: "cocreator" as string | null,
    inserts: 0,
    lastSql: "",
    lastParams: [] as unknown[],
  },
}));

vi.mock("@/lib/auth", () => ({
  requirePerson: async () => ({ id: h.state.viewer, displayName: "V", handle: "v" }),
}));
vi.mock("@/lib/events", () => ({
  canSeeEvent: async () => h.state.see,
}));
vi.mock("@/lib/db", () => ({
  sqlx: () => ({
    query: async (text: string, params: unknown[]) => {
      if (/select host_id/i.test(text)) return [{ host_id: h.state.hostId }];
      h.state.inserts += 1;
      h.state.lastSql = text;
      h.state.lastParams = params;
      const writeRole = params[8] === true;
      if (!/else r\.role/.test(text)) throw new Error("rsvp update must keep r.role when $9 is false");
      if (writeRole) h.state.storedRole = params[7] as string | null;
      return [{
        v: {
          status: params[2],
          went: params[5] ? !!params[3] : false,
          shiftIndex: params[6] ? params[4] : null,
          role: h.state.storedRole,
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      }];
    },
  }),
}));

import { PUT } from "../../app/api/events/[id]/rsvp/route";

function put(body: Record<string, unknown>) {
  return PUT(
    new Request(`http://hn.test/api/events/${EVENT}/rsvp`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: EVENT }) },
  );
}

beforeEach(() => {
  h.state.viewer = GUEST;
  h.state.hostId = HOST;
  h.state.see = true;
  h.state.storedRole = "cocreator";
  h.state.inserts = 0;
  h.state.lastSql = "";
  h.state.lastParams = [];
});

describe("PUT /api/events/:id/rsvp role", () => {
  it("rejects host and cocreator from someone who is not the event host", async () => {
    for (const role of ["host", "cocreator"] as const) {
      h.state.inserts = 0;
      const res = await put({ status: "going", role });
      expect(res.status, role).toBe(403);
      expect(await res.json()).toEqual({ error: "forbidden", message: "Only the event host can set that role." });
      expect(h.state.inserts, role).toBe(0);
      expect(h.state.storedRole, role).toBe("cocreator");
    }
  });

  it("lets the event host set host and cocreator", async () => {
    h.state.viewer = HOST;
    for (const role of ["host", "cocreator"] as const) {
      const res = await put({ status: "going", role });
      expect(res.status, role).toBe(200);
      expect((await res.json()).rsvp.role).toBe(role);
    }
  });

  it("lets anyone who can RSVP set attendee or null", async () => {
    const attendee = await put({ status: "going", role: "attendee" });
    expect(attendee.status).toBe(200);
    expect((await attendee.json()).rsvp.role).toBe("attendee");
    const cleared = await put({ status: "interested", role: null });
    expect(cleared.status).toBe(200);
    expect((await cleared.json()).rsvp.role).toBeNull();
  });

  it("leaves the stored role when the body omits role", async () => {
    h.state.storedRole = "host";
    const res = await put({ status: "interested", went: true });
    expect(res.status).toBe(200);
    expect((await res.json()).rsvp).toMatchObject({ status: "interested", went: true, role: "host" });
    expect(h.state.lastParams[8]).toBe(false);
    expect(h.state.lastSql).toContain("else r.role");
    expect(h.state.storedRole).toBe("host");
  });

  it("still hides an event the viewer cannot see", async () => {
    h.state.see = false;
    h.state.viewer = HOST;
    const res = await put({ status: "going", role: "host" });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: "not_found" });
    expect(h.state.inserts).toBe(0);
  });
});
