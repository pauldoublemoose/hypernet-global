import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

type InviteMsg = {
  id?: string;
  from?: string;
  cardType?: string;
  cardId?: string;
  cardName?: string;
  invite?: string;
  ts?: string | number;
  text?: string;
};

type HzItem = {
  id: string;
  role: "collaborator" | "follower";
  from: { id: string; name: string; avatar: string | null };
  horizon: { id: string; name: string };
  createdAt: string | null;
  status: "pending" | "accepted" | "declined";
};

type Provider = {
  type: string;
  label: string;
  list: () => HzItem[];
  count: () => number;
  render: (item: HzItem) => string;
  accept: (item: HzItem) => Promise<void>;
  decline: (item: HzItem) => Promise<void>;
  undo: (item: HzItem) => Promise<void>;
};

type Respond = (cid: string, hzId: string, answer: string, mid: string | null) => void;

type Sandbox = {
  window: Sandbox;
  CHATS: Record<string, { messages: InviteMsg[] }>;
  PEOPLE: Record<string, { displayName?: string; avatar?: string | null }>;
  HORIZONS: Record<string, { name?: string; collaboratorIds?: string[]; pendingCollaboratorIds?: string[] }>;
  respondHzInvite?: Respond;
  HNRel?: {
    registerRequestProvider?: (provider: Provider) => (() => void) | void;
    requestsChanged?: () => void;
  };
  HorizonRequests: {
    idOf: (cid: string, m: InviteMsg) => string;
    registered: () => boolean;
    register: () => boolean;
    changed: () => void;
  };
};

const collabMsg: InviteMsg = {
  id: "inv-collab",
  from: "p-anna",
  cardType: "horizon_invite",
  cardId: "horizon-quiet",
  cardName: "Quiet Rooms",
  invite: "pending",
  ts: "2026-10-01T09:40:00.000Z",
};

const followMsg: InviteMsg = {
  id: "inv-follow",
  from: "p-mira",
  cardType: "horizon_invite",
  cardId: "horizon-surface",
  invite: "pending follower",
  ts: 1750000000000,
};

function seed(sandbox: Sandbox) {
  sandbox.CHATS = {
    "c-anna": {
      messages: [
        { ...collabMsg },
        { ...followMsg },
        {
          id: "inv-out",
          from: "self",
          cardType: "horizon_invite",
          cardId: "horizon-ridge",
          cardName: "Ridge week",
          invite: "pending",
          ts: "2026-10-01T09:55:00.000Z",
        },
        {
          id: "inv-cancel",
          from: "p-rio",
          cardType: "horizon_invite",
          cardId: "horizon-dust",
          cardName: "Dust & Neon",
          invite: "cancelled",
          ts: "2026-10-01T10:00:00.000Z",
        },
        { from: "p-anna", text: "not a card", invite: "pending" },
      ],
    },
  };
  sandbox.PEOPLE = {
    "p-anna": { displayName: "Anna Vale", avatar: "/default-avatars/anna.png" },
    "p-mira": { displayName: "Mira Chen" },
    "p-rio": { displayName: "Rio Moss", avatar: "/default-avatars/rio.png" },
  };
  sandbox.HORIZONS = {
    "horizon-quiet": {
      name: "Quiet Rooms (catalog)",
      collaboratorIds: ["p-other"],
      pendingCollaboratorIds: ["p-michal"],
    },
    "horizon-surface": { name: "Surfaces & Projections" },
  };
}

function expectedItems(): HzItem[] {
  return [
    {
      id: "inv-collab",
      role: "collaborator",
      from: { id: "p-anna", name: "Anna Vale", avatar: "/default-avatars/anna.png" },
      horizon: { id: "horizon-quiet", name: "Quiet Rooms" },
      createdAt: "2026-10-01T09:40:00.000Z",
      status: "pending",
    },
    {
      id: "inv-follow",
      role: "follower",
      from: { id: "p-mira", name: "Mira Chen", avatar: null },
      horizon: { id: "horizon-surface", name: "Surfaces & Projections" },
      createdAt: null,
      status: "pending",
    },
  ];
}

function load(prep?: (sandbox: Sandbox) => void): Sandbox {
  const sandbox = createContext({
    CHATS: {},
    PEOPLE: {},
    HORIZONS: {},
  }) as unknown as Sandbox;
  sandbox.window = sandbox;
  prep?.(sandbox);
  runInContext(readFileSync(new URL("../../_shared/horizon-requests.js", import.meta.url), "utf8"), sandbox);
  return sandbox;
}

describe("horizon invite requests", () => {
  it("returns false when the request hook is missing and still lists invites", () => {
    const box = load(seed);
    expect(box.HorizonRequests.register()).toBe(false);
    expect(box.HorizonRequests.registered()).toBe(false);

    let provider: Provider | undefined;
    box.HNRel = {
      registerRequestProvider(p) {
        provider = p;
        throw new Error("down");
      },
    };
    expect(box.HorizonRequests.register()).toBe(false);
    expect(box.HorizonRequests.registered()).toBe(false);
    expect(provider?.list()).toEqual(expectedItems());
  });

  it("registers one horizon_invite provider when the hook is a function", () => {
    const seen: Provider[] = [];
    const box = load((sandbox) => {
      sandbox.HNRel = {
        registerRequestProvider(p) { seen.push(p); return function () {}; },
      };
    });
    expect(box.HorizonRequests.register.name).toBe("registerHorizonRequests");
    expect(seen).toHaveLength(1);
    expect(seen[0].type).toBe("horizon_invite");
    expect(seen[0].label).toBe("Horizon invites");
    expect(Object.keys(seen[0])).toEqual(["type", "label", "list", "count", "render", "accept", "decline", "undo"]);
    expect(box.HorizonRequests.registered()).toBe(true);
    let n = 0;
    box.HNRel = { requestsChanged() { n += 1; } };
    box.HorizonRequests.changed();
    expect(n).toBe(1);
    box.HNRel = {};
    box.HorizonRequests.changed();
    expect(n).toBe(1);
  });

  it("stays unregistered when requests.register throws", () => {
    let calls = 0;
    const box = load((sandbox) => {
      sandbox.HNRel = {
        registerRequestProvider() {
          calls += 1;
          throw new Error("nope");
        },
      };
    });
    expect(calls).toBe(1);
    expect(box.HorizonRequests.registered()).toBe(false);
    expect(box.HorizonRequests.register()).toBe(false);
    expect(box.HorizonRequests.registered()).toBe(false);
    expect(calls).toBe(2);
  });

  it("lists one collaborator invite and one follower invite, and counts only pending", () => {
    let provider: Provider | undefined;
    const box = load((sandbox) => {
      seed(sandbox);
      sandbox.HNRel = { registerRequestProvider(p) { provider = p; } };
    });
    const items = provider!.list();
    expect(items).toEqual(expectedItems());
    expect(items.map((item) => item.id)).not.toContain("inv-out");
    expect(items.map((item) => item.id)).not.toContain("inv-cancel");
    expect(provider!.count()).toBe(2);
    expect(provider!.count()).toBe(items.filter((item) => item.status === "pending").length);
    const row = provider!.render(items[0]);
    expect(row).toContain("Anna Vale invited you to collaborate on ");
    expect(row).toContain('data-act="open"');
    expect(row).toContain('data-type="horizon"');
    expect(row).toContain('data-id="horizon-quiet"');
    expect(row).toContain("Quiet Rooms");
    expect(row).not.toContain("Accept");
    expect(row).not.toContain("Decline");
    expect(row).not.toContain("Undo");
    expect(provider!.render(items[1])).toContain("Mira Chen invited you to follow ");
    expect(provider!.render(items[1])).toContain("Surfaces &amp; Projections");
    expect(box.HorizonRequests.idOf("c-anna", collabMsg)).toBe("inv-collab");
    expect(box.HorizonRequests.idOf("c-anna", { id: "", cardId: "horizon-quiet" })).toBe("c-anna:horizon-quiet");
    expect(box.HorizonRequests.idOf("c-x", { cardId: "horizon-quiet" })).toBe("c-x:horizon-quiet");
    expect(items[0].id).toBe(box.HorizonRequests.idOf("c-anna", box.CHATS["c-anna"].messages[0]));
    expect(items[1].id).toBe(box.HorizonRequests.idOf("c-anna", box.CHATS["c-anna"].messages[1]));
  });

  it("accept drops the pending tally, and decline then undo restores it", () => {
    const calls: Array<[string, string, string, string | null]> = [];
    let provider: Provider | undefined;
    const box = load((sandbox) => {
      seed(sandbox);
      sandbox.respondHzInvite = (cid, hzId, answer, mid) => {
        calls.push([cid, hzId, answer, mid]);
        const msgs = sandbox.CHATS[cid].messages;
        const m = mid
          ? msgs.find((msg) => msg.id === mid)
          : [...msgs].reverse().find((msg) => msg.cardType === "horizon_invite" && msg.cardId === hzId && msg.from !== "self");
        if (!m) return;
        const follower = String(m.invite || "").indexOf("follower") >= 0;
        const next = answer === "accept" ? "accepted" : answer === "decline" ? "declined" : "pending";
        m.invite = follower ? `${next} follower` : next;
      };
      sandbox.HNRel = { registerRequestProvider(p) { provider = p; } };
    });
    const quiet = box.HORIZONS["horizon-quiet"];
    const membership = {
      collab: quiet.collaboratorIds?.slice(),
      pending: quiet.pendingCollaboratorIds?.slice(),
    };
    expect(provider!.count()).toBe(2);
    const collab = provider!.list().find((item) => item.id === "inv-collab")!;
    expect(typeof provider!.accept(collab).then).toBe("function");
    expect(calls[0]).toEqual(["c-anna", "horizon-quiet", "accept", "inv-collab"]);
    expect(box.CHATS["c-anna"].messages[0].invite).toBe("accepted");
    expect(provider!.list().find((item) => item.id === "inv-collab")?.status).toBe("accepted");
    expect(provider!.count()).toBe(1);
    expect(quiet.collaboratorIds).toEqual(membership.collab);
    expect(quiet.pendingCollaboratorIds).toEqual(membership.pending);

    const beforeDecline = provider!.count();
    const follow = provider!.list().find((item) => item.id === "inv-follow")!;
    provider!.decline(follow);
    expect(calls[1]).toEqual(["c-anna", "horizon-surface", "decline", "inv-follow"]);
    expect(box.CHATS["c-anna"].messages[1].invite).toBe("declined follower");
    expect(provider!.list().find((item) => item.id === "inv-follow")?.status).toBe("declined");
    expect(provider!.count()).toBe(beforeDecline - 1);

    provider!.undo(provider!.list().find((item) => item.id === "inv-follow")!);
    expect(calls[2]).toEqual(["c-anna", "horizon-surface", "undo", "inv-follow"]);
    expect(box.CHATS["c-anna"].messages[1].invite).toBe("pending follower");
    expect(provider!.list().find((item) => item.id === "inv-follow")?.status).toBe("pending");
    expect(provider!.count()).toBe(beforeDecline);

    expect(() => provider!.accept({ ...collab, id: "missing" })).not.toThrow();
    expect(calls).toHaveLength(3);
    box.respondHzInvite = undefined;
    expect(() => provider!.accept(collab)).not.toThrow();
    expect(calls).toHaveLength(3);
  });

  it("names an invite without a message id by chat and horizon, and passes null to the writer", () => {
    const calls: Array<[string, string, string, string | null]> = [];
    let provider: Provider | undefined;
    const box = load((sandbox) => {
      sandbox.CHATS = {
        "c-anna": {
          messages: [{
            from: "p-anna",
            cardType: "horizon_invite",
            cardId: "horizon-quiet",
            cardName: "Quiet Rooms",
            invite: "pending",
            ts: "2026-10-01T09:40:00.000Z",
          }],
        },
      };
      sandbox.PEOPLE = { "p-anna": { displayName: "Anna Vale", avatar: "/default-avatars/anna.png" } };
      sandbox.HORIZONS = { "horizon-quiet": { name: "Quiet Rooms" } };
      sandbox.respondHzInvite = (cid, hzId, answer, mid) => {
        calls.push([cid, hzId, answer, mid]);
        sandbox.CHATS[cid].messages[0].invite = "accepted";
      };
      sandbox.HNRel = { registerRequestProvider(p) { provider = p; } };
    });
    const msg = box.CHATS["c-anna"].messages[0];
    expect(provider!.list()[0].id).toBe("c-anna:horizon-quiet");
    expect(provider!.list()[0].id).toBe(box.HorizonRequests.idOf("c-anna", msg));
    provider!.accept(provider!.list()[0]);
    expect(calls).toEqual([["c-anna", "horizon-quiet", "accept", null]]);
    expect(provider!.list()[0].status).toBe("accepted");
    expect(provider!.count()).toBe(0);
  });
});
