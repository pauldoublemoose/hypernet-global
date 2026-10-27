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
  kind: "horizon_invite";
  role: "collaborator" | "follower";
  from: { id: string; name: string; avatar: string | null };
  target: { type: "horizon"; id: string; name: string };
  createdAt: string | null;
  status: "pending" | "accepted" | "declined";
};

type Provider = {
  kind: string;
  list: () => HzItem[];
  accept: (id: string) => void;
  decline: (id: string) => void;
  undo: (id: string) => void;
  pendingCount: () => number;
};

type Respond = (cid: string, hzId: string, answer: string, mid: string | null) => void;

type Sandbox = {
  window: Sandbox;
  CHATS: Record<string, { messages: InviteMsg[] }>;
  PEOPLE: Record<string, { displayName?: string; avatar?: string | null }>;
  HORIZONS: Record<string, { name?: string; collaboratorIds?: string[]; pendingCollaboratorIds?: string[] }>;
  respondHzInvite?: Respond;
  HNRel?: { requests?: { register: (provider: Provider) => void } };
  HorizonRequests: {
    idOf: (cid: string, m: InviteMsg) => string;
    registered: () => boolean;
    register: () => boolean;
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
      kind: "horizon_invite",
      role: "collaborator",
      from: { id: "p-anna", name: "Anna Vale", avatar: "/default-avatars/anna.png" },
      target: { type: "horizon", id: "horizon-quiet", name: "Quiet Rooms" },
      createdAt: "2026-10-01T09:40:00.000Z",
      status: "pending",
    },
    {
      id: "inv-follow",
      kind: "horizon_invite",
      role: "follower",
      from: { id: "p-mira", name: "Mira Chen", avatar: null },
      target: { type: "horizon", id: "horizon-surface", name: "Surfaces & Projections" },
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
      requests: {
        register(p) {
          provider = p;
          throw new Error("down");
        },
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
        requests: {
          register(p) { seen.push(p); },
        },
      };
    });
    expect(box.HorizonRequests.register.name).toBe("registerHorizonRequests");
    expect(seen).toHaveLength(1);
    expect(seen[0].kind).toBe("horizon_invite");
    expect(Object.keys(seen[0])).toEqual(["kind", "list", "accept", "decline", "undo", "pendingCount"]);
    expect(box.HorizonRequests.registered()).toBe(true);
  });

  it("stays unregistered when requests.register throws", () => {
    let calls = 0;
    const box = load((sandbox) => {
      sandbox.HNRel = {
        requests: {
          register() {
            calls += 1;
            throw new Error("nope");
          },
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
      sandbox.HNRel = { requests: { register(p) { provider = p; } } };
    });
    const items = provider!.list();
    expect(items).toEqual(expectedItems());
    expect(items.map((item) => item.id)).not.toContain("inv-out");
    expect(items.map((item) => item.id)).not.toContain("inv-cancel");
    expect(provider!.pendingCount()).toBe(2);
    expect(provider!.pendingCount()).toBe(items.filter((item) => item.status === "pending").length);
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
      sandbox.HNRel = { requests: { register(p) { provider = p; } } };
    });
    const quiet = box.HORIZONS["horizon-quiet"];
    const membership = {
      collab: quiet.collaboratorIds?.slice(),
      pending: quiet.pendingCollaboratorIds?.slice(),
    };
    expect(provider!.pendingCount()).toBe(2);
    provider!.accept("inv-collab");
    expect(calls[0]).toEqual(["c-anna", "horizon-quiet", "accept", "inv-collab"]);
    expect(box.CHATS["c-anna"].messages[0].invite).toBe("accepted");
    expect(provider!.list().find((item) => item.id === "inv-collab")?.status).toBe("accepted");
    expect(provider!.pendingCount()).toBe(1);
    expect(quiet.collaboratorIds).toEqual(membership.collab);
    expect(quiet.pendingCollaboratorIds).toEqual(membership.pending);

    const beforeDecline = provider!.pendingCount();
    provider!.decline("inv-follow");
    expect(calls[1]).toEqual(["c-anna", "horizon-surface", "decline", "inv-follow"]);
    expect(box.CHATS["c-anna"].messages[1].invite).toBe("declined follower");
    expect(provider!.list().find((item) => item.id === "inv-follow")?.status).toBe("declined");
    expect(provider!.pendingCount()).toBe(beforeDecline - 1);

    provider!.undo("inv-follow");
    expect(calls[2]).toEqual(["c-anna", "horizon-surface", "undo", "inv-follow"]);
    expect(box.CHATS["c-anna"].messages[1].invite).toBe("pending follower");
    expect(provider!.list().find((item) => item.id === "inv-follow")?.status).toBe("pending");
    expect(provider!.pendingCount()).toBe(beforeDecline);

    expect(() => provider!.accept("missing")).not.toThrow();
    expect(calls).toHaveLength(3);
    box.respondHzInvite = undefined;
    expect(() => provider!.accept("inv-collab")).not.toThrow();
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
      sandbox.HNRel = { requests: { register(p) { provider = p; } } };
    });
    const msg = box.CHATS["c-anna"].messages[0];
    expect(provider!.list()[0].id).toBe("c-anna:horizon-quiet");
    expect(provider!.list()[0].id).toBe(box.HorizonRequests.idOf("c-anna", msg));
    provider!.accept("c-anna:horizon-quiet");
    expect(calls).toEqual([["c-anna", "horizon-quiet", "accept", null]]);
    expect(provider!.list()[0].status).toBe("accepted");
    expect(provider!.pendingCount()).toBe(0);
  });
});
