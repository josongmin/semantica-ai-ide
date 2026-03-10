import { createStore } from "jotai";

import type { ThreeModelState } from "../../../shared/protocol";
import {
  resetThreeModelStoreAtom,
  setThreeModelStateAtom,
  threeModelStateAtom,
} from "../model/threeModelAtoms";

describe("threeModelAtoms", () => {
  it("has correct initial state (all idle, empty)", () => {
    const store = createStore();
    const state = store.get(threeModelStateAtom);

    expect(state.planner).toEqual({ model: "", status: "idle", output: "" });
    expect(state.coder).toEqual({ model: "", status: "idle", output: "" });
    expect(state.critic).toEqual({ model: "", status: "idle", output: "" });
  });

  it("setThreeModelStateAtom replaces entire state", () => {
    const store = createStore();

    const newState: ThreeModelState = {
      planner: { model: "opus", status: "active", output: "Analyzing..." },
      coder: { model: "sonnet", status: "idle", output: "" },
      critic: { model: "haiku", status: "idle", output: "" },
    };

    store.set(setThreeModelStateAtom, newState);

    const result = store.get(threeModelStateAtom);
    expect(result.planner.model).toBe("opus");
    expect(result.planner.status).toBe("active");
    expect(result.planner.output).toBe("Analyzing...");
  });

  it("resetThreeModelStoreAtom restores defaults", () => {
    const store = createStore();

    store.set(setThreeModelStateAtom, {
      planner: { model: "opus", status: "done", output: "Plan complete" },
      coder: { model: "sonnet", status: "active", output: "Coding" },
      critic: { model: "haiku", status: "active", output: "Reviewing" },
    });

    store.set(resetThreeModelStoreAtom);

    const state = store.get(threeModelStateAtom);
    expect(state.planner.status).toBe("idle");
    expect(state.planner.model).toBe("");
    expect(state.coder.status).toBe("idle");
    expect(state.critic.status).toBe("idle");
  });
});
