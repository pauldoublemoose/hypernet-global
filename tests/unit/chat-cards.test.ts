import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { chatCard } from "../../lib/chat-cards";

type CardApi = { method: string; path: string };
type CardSpec = {
  kind: string;
  api: { accept: (id: string) => CardApi; decline: (id: string) => CardApi; undo: (id: string) => CardApi };
};
type Cards = {
  get: (type: string | null) => CardSpec | null;
  phrase: (m: Record<string, unknown>) => string | null;
  body: (m: Record<string, unknown>, me: boolean, cid: string) => string;
};
type CardContext = {
  window: CardContext;
  ChatCards: Cards;
  PEOPLE: Record<string, { displayName?: string }>;
  HNRel?: { openRequests?: (arg: { focus?: string | null }) => void };
  HorizonRequests?: {
    registered: () => boolean;
    idOf: (cid: string, m: Record<string, unknown>) => string;
  };
};

function load(): CardContext {
  const context = createContext({
    HORIZONS: {
      "horizon-quiet": { name: "Quiet Rooms" },
      "horizon-surface": { name: "Surfaces & Projections" },
    },
    PEOPLE: {},
  }) as unknown as CardContext;
  context.window = context;
  runInContext(readFileSync(new URL("../../_shared/chat-cards.js", import.meta.url), "utf8"), context);
  return context;
}

describe("chat cards", () => {
  it("resolves horizon_invite to the same phrase, horizon link, and invite route", () => {
    const cards = load().ChatCards;
    const quiet = {
      cardType: "horizon_invite",
      cardId: "horizon-quiet",
      cardName: "Quiet Rooms",
      invite: "pending",
      from: "p-anna",
      text: "Quiet Rooms",
    };
    const spec = cards.get("horizon_invite");
    const server = chatCard("horizon_invite");
    expect(spec).toBeTruthy();
    expect(spec!.kind).toBe("horizon");
    expect(server?.type).toBe("horizon_invite");
    expect(server?.kind).toBe("horizon");
    expect(server?.linkType).toBe("horizon");
    expect(cards.phrase(quiet)).toBe("Collaborate on horizon Quiet Rooms");
    const html = cards.body(quiet, false, "c-anna");
    expect(html).toContain("Collaborate on horizon ");
    expect(html).toContain(">Quiet Rooms</button>");
    expect(html).not.toMatch(/<button[^>]*>horizon/);
    expect(html).toContain('data-act="open"');
    expect(html).toContain('data-type="horizon"');
    expect(html).toContain('data-id="horizon-quiet"');
    expect(html).toContain(">Accept<");
    expect(html).toContain(">Decline<");
    expect(spec!.api.accept("hz-1")).toEqual({ method: "POST", path: "/api/horizons/hz-1/invites" });
    expect(spec!.api.decline("hz-1")).toEqual({ method: "DELETE", path: "/api/horizons/hz-1/invites" });
    expect({ method: server?.accept.method, path: server?.accept.path("hz-1") }).toEqual(spec!.api.accept("hz-1"));
    expect({ method: server?.decline.method, path: server?.decline.path("hz-1") }).toEqual(spec!.api.decline("hz-1"));
    const follow = { ...quiet, cardId: "horizon-surface", cardName: "Surfaces & Projections", invite: "pending follower" };
    expect(cards.phrase(follow)).toBe("Follow horizon Surfaces & Projections");
    const followHtml = cards.body(follow, false, "c-anna");
    expect(followHtml).toContain("Follow horizon ");
    expect(followHtml).toContain(">Surfaces &amp; Projections</button>");
    expect(followHtml).not.toMatch(/<button[^>]*>horizon/);
    expect(cards.body(follow, false, "c-anna")).toContain('data-id="horizon-surface"');
    expect(cards.body({ ...quiet, from: "self" }, true, "c-anna")).not.toContain(">Accept<");
    expect(cards.phrase({ ...quiet, invite: "accepted" })).toBe("Accepted Quiet Rooms");
    const accepted = cards.body({ ...quiet, invite: "accepted" }, false, "c-anna");
    expect(accepted).not.toContain(">Accept<");
    expect(accepted).toContain(">Undo<");
    expect(accepted).toContain('data-act="hzundo"');
    expect(cards.body({ ...quiet, invite: "declined" }, false, "c-anna")).toContain(">Undo<");
    expect(cards.body({ ...quiet, invite: "cancelled" }, false, "c-anna")).not.toContain(">Undo<");
    expect(cards.body({ ...quiet, invite: "accepted", from: "self" }, true, "c-anna")).not.toContain(">Undo<");
    expect(spec!.api.undo("hz-1")).toEqual({ method: "PATCH", path: "/api/horizons/hz-1/invites" });
    expect({ method: server?.undo.method, path: server?.undo.path("hz-1") }).toEqual(spec!.api.undo("hz-1"));
  });

  it("an unknown card type renders as a plain message with no buttons", () => {
    const cards = load().ChatCards;
    const m = { cardType: "nope", cardId: "x", text: "Hello <b>there</b>", invite: "pending", from: "p-anna" };
    expect(cards.get("nope")).toBeNull();
    expect(chatCard("nope")).toBeNull();
    const html = cards.body(m, false, "c-anna");
    expect(html).toBe("Hello &lt;b&gt;there&lt;/b&gt;");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Accept");
    expect(html).not.toContain("Decline");
  });

  it("links an incoming invite to the request list when that list is registered", () => {
    const context = load();
    const cards = context.ChatCards;
    context.PEOPLE["p-anna"] = {};
    context.PEOPLE["p-anna"].displayName = "Anna Vale";
    const seen: unknown[][] = [];
    context.window.HNRel = { openRequests: function () {} };
    context.window.HorizonRequests = {
      registered: function () { return true; },
      idOf: function (cid, m) { seen.push([cid, m]); return "inv-9"; },
    };
    const quiet = {
      cardType: "horizon_invite",
      cardId: "horizon-quiet",
      cardName: "Quiet Rooms",
      invite: "pending",
      from: "p-anna",
      text: "Quiet Rooms",
    };
    const request = '<span class="hzinv">Anna Vale sent you a <button type="button" class="hzreq" data-act="hzreq" data-id="inv-9">request</button></span>';
    const pending = cards.body(quiet, false, "c-anna");
    expect(pending).toBe(request);
    expect(pending.replace(/<[^>]+>/g, "")).toContain("sent you a request");
    expect(pending).toContain('data-act="hzreq"');
    expect(pending).toContain('data-id="inv-9"');
    expect(pending).not.toContain("Accept");
    expect(pending).not.toContain("Decline");
    expect(seen[0]).toEqual(["c-anna", quiet]);
    const accepted = cards.body({ ...quiet, invite: "accepted" }, false, "c-anna");
    expect(accepted).toBe(request);
    expect(accepted).toContain('data-act="hzreq"');
    expect(accepted).not.toContain("Undo");
    expect(cards.body({ ...quiet, from: "self" }, true, "c-anna")).not.toContain('data-act="hzreq"');
    context.window.HorizonRequests = {
      registered: function () { return false; },
      idOf: function () { return "inv-9"; },
    };
    expect(cards.body(quiet, false, "c-anna")).toContain("Accept");
    context.window.HorizonRequests = {
      registered: function () { return true; },
      idOf: function () { return "inv-9"; },
    };
    context.window.HNRel = {};
    const offline = cards.body(quiet, false, "c-anna");
    expect(offline).toContain("Accept");
    expect(offline).not.toContain('data-act="hzreq"');
  });
});
