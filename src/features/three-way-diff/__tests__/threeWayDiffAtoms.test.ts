import { createStore } from "jotai";

import { createThreeWayDiffData, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import {
  pushThreeWayDiffAtom,
  resetThreeWayDiffStoreAtom,
  resolveThreeWayDiffAtom,
  threeWayDiffsByTurnFamily,
} from "../model/threeWayDiffAtoms";
const TURN = "turn_1" as TurnId;

beforeEach(() => {
  resetIdCounter();
});

describe("threeWayDiffAtoms (turn-scoped)", () => {
  it("threeWayDiffsByTurnFamily defaults to empty array", () => {
    const store = createStore();
    expect(store.get(threeWayDiffsByTurnFamily(TURN))).toEqual([]);
  });

  it("pushThreeWayDiffAtom adds diff to the correct turn", () => {
    const store = createStore();
    const data = createThreeWayDiffData({ turn_id: TURN, file_path: "src/a.ts" });

    store.set(pushThreeWayDiffAtom, data);

    const diffs = store.get(threeWayDiffsByTurnFamily(TURN));
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.file_path).toBe("src/a.ts");
    expect(diffs[0]?.status).toBe("pending");
  });

  it("resolveThreeWayDiffAtom updates status and resolution", () => {
    const store = createStore();
    const data = createThreeWayDiffData({ turn_id: TURN });
    store.set(pushThreeWayDiffAtom, data);

    store.set(resolveThreeWayDiffAtom, { id: data.id, resolution: "accept_agent" });

    const diffs = store.get(threeWayDiffsByTurnFamily(TURN));
    expect(diffs[0]?.status).toBe("resolved");
    expect(diffs[0]?.resolution).toBe("accept_agent");
  });

  it("resetThreeWayDiffStoreAtom clears all diffs", () => {
    const store = createStore();
    store.set(pushThreeWayDiffAtom, createThreeWayDiffData({ turn_id: TURN }));
    expect(store.get(threeWayDiffsByTurnFamily(TURN))).toHaveLength(1);

    store.set(resetThreeWayDiffStoreAtom);

    expect(store.get(threeWayDiffsByTurnFamily(TURN))).toHaveLength(0);
  });

  it("push then reset then push again works correctly", () => {
    const store = createStore();

    store.set(pushThreeWayDiffAtom, createThreeWayDiffData({ turn_id: TURN, file_path: "src/a.ts" }));
    expect(store.get(threeWayDiffsByTurnFamily(TURN))).toHaveLength(1);

    store.set(resetThreeWayDiffStoreAtom);
    expect(store.get(threeWayDiffsByTurnFamily(TURN))).toHaveLength(0);

    store.set(pushThreeWayDiffAtom, createThreeWayDiffData({ turn_id: TURN, file_path: "src/b.ts" }));
    const diffs = store.get(threeWayDiffsByTurnFamily(TURN));
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.file_path).toBe("src/b.ts");
  });

  it("stores conflict regions correctly", () => {
    const store = createStore();
    const data = createThreeWayDiffData({
      turn_id: TURN,
      conflicts: [
        { start_line: 5, end_line: 10 },
        { start_line: 20, end_line: 25 },
      ],
    });

    store.set(pushThreeWayDiffAtom, data);

    const diffs = store.get(threeWayDiffsByTurnFamily(TURN));
    expect(diffs[0]?.conflicts).toHaveLength(2);
    expect(diffs[0]?.conflicts[0]?.start_line).toBe(5);
    expect(diffs[0]?.conflicts[1]?.end_line).toBe(25);
  });
});
