import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { chatCards } from "../../lib/chat-cards";

const root = fileURLToPath(new URL("../..", import.meta.url));

function migrations() {
  const dir = join(root, "db/migrations");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") }));
}

function browserCardTypes() {
  const src = readFileSync(join(root, "_shared/chat-cards.js"), "utf8");
  const block = src.match(/var cards = \{([^}]+)\}/);
  if (!block) throw new Error("chat card registry is missing");
  return [...block[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((m) => m[1]);
}

describe("messages_card_type_check", () => {
  it("the last migration allows null and every card the registries store", () => {
    const files = migrations();
    const defining = files.filter((file) => /add\s+constraint\s+messages_card_type_check/i.test(file.sql));
    const last = defining[defining.length - 1];
    expect(last?.name).toBeTruthy();
    const names = files.map((file) => file.name);
    expect(names.indexOf(last.name)).toBeGreaterThan(names.indexOf("0007_horizon_collaborators.sql"));
    expect(names.indexOf(last.name)).toBeGreaterThan(names.indexOf("0012_message_card_chronicle.sql"));
    expect(last.sql).toMatch(/card_type\s+is\s+null\s+or\s+card_type\s+in\s*\(/i);
    const list = last.sql.match(/card_type\s+in\s*\(([^)]*)\)/i);
    const allowed = [...(list?.[1] ?? "").matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const needed = [
      "event",
      "horizon",
      "callout",
      "horizon_invite",
      "chronicle",
      ...Object.keys(chatCards),
      ...browserCardTypes(),
    ];
    for (const value of needed) expect(allowed).toContain(value);
  });
});
