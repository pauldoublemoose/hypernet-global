import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { chatCard } from "../../lib/chat-cards";

type CardApi = { method: string; path: string };
type CardSpec = {
  api: { accept: (id: string) => CardApi; decline: (id: string) => CardApi };
};
type Cards = {
  get: (type: string | null) => CardSpec | null;
  phrase: (m: Record<string, unknown>) => string | null;
  body: (m: Record<string, unknown>, me: boolean, cid: string) => string;
};

function load(): Cards {
  const context = createContext({
    HORIZONS: {
      "horizon-quiet": { name: "Quiet Rooms" },
      "horizon-surface": { name: "Surfaces & Projections" },
    },
  });
  runInContext(readFileSync(new URL("../../_shared/chat-cards.js", import.meta.url), "utf8"), context);
  return (context as { ChatCards: Cards }).ChatCards;
}

describe("chat cards", () => {
  it("resolves horizon_invite to the same phrase, horizon link, and invite route", () => {
    const cards = load();
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
    expect(server?.type).toBe("horizon_invite");
    expect(server?.linkType).toBe("horizon");
    expect(cards.phrase(quiet)).toBe("Collaborate on Quiet Rooms");
    const html = cards.body(quiet, false, "c-anna");
    expect(html).toContain("Collaborate on ");
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
    expect(cards.phrase(follow)).toBe("Follow Surfaces & Projections");
    expect(cards.body(follow, false, "c-anna")).toContain('data-id="horizon-surface"');
    expect(cards.body({ ...quiet, from: "self" }, true, "c-anna")).not.toContain(">Accept<");
    expect(cards.phrase({ ...quiet, invite: "accepted" })).toBe("Accepted Quiet Rooms");
    expect(cards.body({ ...quiet, invite: "accepted" }, false, "c-anna")).not.toContain(">Accept<");
  });

  it("an unknown card type renders as a plain message with no buttons", () => {
    const cards = load();
    const m = { cardType: "nope", cardId: "x", text: "Hello <b>there</b>", invite: "pending", from: "p-anna" };
    expect(cards.get("nope")).toBeNull();
    expect(chatCard("nope")).toBeNull();
    const html = cards.body(m, false, "c-anna");
    expect(html).toBe("Hello &lt;b&gt;there&lt;/b&gt;");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Accept");
    expect(html).not.toContain("Decline");
  });
});
