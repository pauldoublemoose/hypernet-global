import { describe, expect, it } from "vitest";
import { mergeHorizonEventIds } from "../../lib/horizon-events";

describe("mergeHorizonEventIds", () => {
  const hidden = new Set(["P", "Q"]);

  it("puts the saver's list into the slots they can see, and leaves the rest in place", () => {
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(["P"]), ["B", "A"])).toEqual(["B", "P", "A"]);
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(["P"]), ["A"])).toEqual(["A", "P"]);
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(["P"]), ["B"])).toEqual(["B", "P"]);
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(["P"]), [])).toEqual(["P"]);
    expect(mergeHorizonEventIds(["P", "A"], new Set(["P"]), ["B"])).toEqual(["P", "B"]);
    expect(mergeHorizonEventIds(["A", "P"], new Set(["P"]), ["B", "A"])).toEqual(["B", "P", "A"]);
    expect(mergeHorizonEventIds(["A", "P", "B", "Q", "C"], hidden, ["C", "A"])).toEqual(["C", "P", "A", "Q"]);
  });

  it("a saver who can see every event gets exactly the list they sent", () => {
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(), ["B", "A"])).toEqual(["B", "A"]);
    expect(mergeHorizonEventIds(["pub", "fri", "me"], new Set(), ["fri", "pub"])).toEqual(["fri", "pub"]);
  });

  it("drops a duplicate and an unseen id from the submitted list", () => {
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(["P"]), ["B", "B", "P", "A"])).toEqual(["B", "P", "A"]);
  });

  it("appends an event that was not on the horizon", () => {
    expect(mergeHorizonEventIds(["A", "P", "B"], new Set(["P"]), ["B", "A", "D"])).toEqual(["B", "P", "A", "D"]);
  });
});
