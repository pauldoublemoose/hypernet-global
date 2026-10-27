import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

type Item = { id: string; label: string; icon?: string; danger?: boolean; onClick: () => void };
type MountArg = {
  kind: string;
  id: string;
  title: string;
  audience: { include: string[]; exclude: string[] };
  canEdit: boolean;
  saveAudience: (audience: { include: string[]; exclude: string[] }) => void;
  items: Item[];
};
type Box = {
  window: Box;
  document: { querySelector: (sel: string) => { hidden: boolean } | null };
  HORIZONS: Record<string, { name: string; isPublished?: boolean; isPersonalDefault?: boolean; audience?: { include: string[]; exclude: string[] } }>;
  hzOwnedByMe: (id: string) => boolean;
  addCollabDialog: (id: string) => void;
  editHorizonDialog: (id: string) => void;
  deleteHorizonDialog: (id: string) => void;
  setHzPublished: (id: string, on: boolean) => void;
  schedulePersist: () => void;
  render: () => void;
  ONLINE: boolean;
  HNAPI: { saveHorizon: (id: string) => void };
  HNCog?: { mount: (el: unknown, props: MountArg) => (() => void) | void };
  HorizonCog: {
    mount: (id: string) => boolean;
    release: () => void;
    saveAudience: (id: string, audience: { include: string[]; exclude: string[] }) => void;
  };
  slot: { hidden: boolean };
  more: { hidden: boolean };
  calls: MountArg[];
  offs: number;
  invites: string[];
  renames: string[];
  deletes: string[];
  persists: number;
  renders: number;
  saves: string[];
};

function load(owned: boolean): Box {
  const box = createContext({
    HORIZONS: {
      "horizon-ridge": { name: "Ridge week", isPublished: true },
      "horizon-dust": { name: "Dust & Neon", isPublished: true },
    },
    ONLINE: false,
  }) as unknown as Box;
  box.window = box;
  box.slot = { hidden: true };
  box.more = { hidden: false };
  box.calls = [];
  box.offs = 0;
  box.invites = [];
  box.renames = [];
  box.deletes = [];
  box.persists = 0;
  box.renders = 0;
  box.saves = [];
  box.document = {
    querySelector(sel: string) {
      if (sel === "#dscroll [data-hzcog]") return box.slot;
      if (sel === '#dscroll [data-act="hzmore"]') return box.more;
      return null;
    },
  };
  box.hzOwnedByMe = (id) => owned && id === "horizon-ridge";
  box.addCollabDialog = (id) => { box.invites.push(id); };
  box.editHorizonDialog = (id) => { box.renames.push(id); };
  box.deleteHorizonDialog = (id) => { box.deletes.push(id); };
  box.setHzPublished = (id, on) => { box.HORIZONS[id].isPublished = on; };
  box.schedulePersist = () => { box.persists += 1; };
  box.render = () => { box.renders += 1; };
  box.HNAPI = { saveHorizon(id) { box.saves.push(id); } };
  runInContext(readFileSync(new URL("../../_shared/horizon-cog.js", import.meta.url), "utf8"), box);
  return box;
}

describe("horizon cog", () => {
  it("mounts the owner cog with invite, rename, and delete", () => {
    const box = load(true);
    const offs: string[] = [];
    box.HNCog = {
      mount(_el, props) {
        box.calls.push(props);
        return () => { offs.push(props.id); };
      },
    };
    expect(box.HorizonCog.mount("horizon-ridge")).toBe(true);
    expect(box.calls).toHaveLength(1);
    const props = box.calls[0];
    expect(props.kind).toBe("horizon");
    expect(props.id).toBe("horizon-ridge");
    expect(props.title).toBe("Ridge week");
    expect(props.canEdit).toBe(true);
    expect(props.audience).toEqual({ include: ["everyone"], exclude: [] });
    expect(props.items.map((item) => item.id)).toEqual(["invite", "rename", "delete"]);
    expect(props.items.map((item) => item.label)).toEqual(["Invite collaborators/followers", "Rename", "Delete"]);
    expect(props.items[2].danger).toBe(true);
    expect(props.items[0].danger).toBeUndefined();
    expect(box.more.hidden).toBe(true);
    expect(box.slot.hidden).toBe(false);
    props.items[0].onClick();
    props.items[1].onClick();
    props.items[2].onClick();
    expect(box.invites).toEqual(["horizon-ridge"]);
    expect(box.renames).toEqual(["horizon-ridge"]);
    expect(box.deletes).toEqual(["horizon-ridge"]);
    props.saveAudience({ include: ["friends"], exclude: ["list:1"] });
    expect(box.HORIZONS["horizon-ridge"].audience).toEqual({ include: ["friends"], exclude: ["list:1"] });
    expect(box.HORIZONS["horizon-ridge"].isPublished).toBe(false);
    expect(box.renders).toBe(1);
    expect(box.saves).toEqual([]);
    box.ONLINE = true;
    props.saveAudience({ include: ["everyone"], exclude: [] });
    expect(box.HORIZONS["horizon-ridge"].isPublished).toBe(true);
    expect(box.saves).toEqual(["horizon-ridge"]);
    box.HorizonCog.release();
    expect(offs).toEqual(["horizon-ridge"]);
  });

  it("does not mount for a collaborator", () => {
    const box = load(false);
    box.HNCog = { mount(_el, props) { box.calls.push(props); } };
    expect(box.HorizonCog.mount("horizon-dust")).toBe(false);
    expect(box.calls).toEqual([]);
    expect(box.more.hidden).toBe(false);
    expect(box.slot.hidden).toBe(true);
  });

  it("keeps the more menu when HNCog is absent", () => {
    const box = load(true);
    expect(box.HNCog).toBeUndefined();
    expect(box.HorizonCog.mount("horizon-ridge")).toBe(false);
    expect(box.more.hidden).toBe(false);
    expect(box.slot.hidden).toBe(true);
  });
});
