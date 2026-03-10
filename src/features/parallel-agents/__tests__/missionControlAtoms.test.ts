import { createStore } from "jotai";

import { createMissionControlAgent, resetIdCounter } from "../../../shared/lib/mocks";
import type { AgentInstanceId } from "../../../shared/protocol";
import {
  agentGridLayoutAtom,
  missionControlAgentsListAtom,
  missionControlAgentsMapAtom,
  missionControlStatusCountsAtom,
  missionControlVisibleAtom,
  resetMissionControlStoreAtom,
  setMissionControlAgentsAtom,
} from "../model/missionControlAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("missionControlAtoms", () => {
  it("starts with empty agents map and grid layout", () => {
    const store = createStore();
    expect(store.get(missionControlAgentsMapAtom).size).toBe(0);
    expect(store.get(agentGridLayoutAtom)).toBe("grid");
    expect(store.get(missionControlVisibleAtom)).toBe(false);
  });

  it("setMissionControlAgentsAtom populates the map", () => {
    const store = createStore();
    const agent1 = createMissionControlAgent({
      id: "agent-1" as unknown as AgentInstanceId,
      name: "Alpha",
    });
    const agent2 = createMissionControlAgent({
      id: "agent-2" as unknown as AgentInstanceId,
      name: "Beta",
    });

    store.set(setMissionControlAgentsAtom, [agent1, agent2]);

    const map = store.get(missionControlAgentsMapAtom);
    expect(map.size).toBe(2);
    expect(map.get("agent-1" as unknown as AgentInstanceId)).toEqual(agent1);
    expect(map.get("agent-2" as unknown as AgentInstanceId)).toEqual(agent2);
  });

  it("missionControlAgentsListAtom returns sorted list", () => {
    const store = createStore();
    store.set(setMissionControlAgentsAtom, [
      createMissionControlAgent({
        id: "a2" as unknown as AgentInstanceId,
        name: "Zeta",
      }),
      createMissionControlAgent({
        id: "a1" as unknown as AgentInstanceId,
        name: "Alpha",
      }),
    ]);

    const list = store.get(missionControlAgentsListAtom);
    expect(list).toHaveLength(2);
    expect(list[0]?.name).toBe("Alpha");
    expect(list[1]?.name).toBe("Zeta");
  });

  it("missionControlStatusCountsAtom computes correct counts", () => {
    const store = createStore();
    store.set(setMissionControlAgentsAtom, [
      createMissionControlAgent({
        id: "a1" as unknown as AgentInstanceId,
        status: "running",
      }),
      createMissionControlAgent({
        id: "a2" as unknown as AgentInstanceId,
        status: "running",
      }),
      createMissionControlAgent({
        id: "a3" as unknown as AgentInstanceId,
        status: "idle",
      }),
      createMissionControlAgent({
        id: "a4" as unknown as AgentInstanceId,
        status: "error",
      }),
    ]);

    const counts = store.get(missionControlStatusCountsAtom);
    expect(counts.running).toBe(2);
    expect(counts.idle).toBe(1);
    expect(counts.error).toBe(1);
    expect(counts.total).toBe(4);
  });

  it("resetMissionControlStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setMissionControlAgentsAtom, [
      createMissionControlAgent({
        id: "a1" as unknown as AgentInstanceId,
      }),
    ]);
    store.set(missionControlVisibleAtom, true);
    store.set(agentGridLayoutAtom, "list");

    store.set(resetMissionControlStoreAtom);

    expect(store.get(missionControlAgentsMapAtom).size).toBe(0);
    expect(store.get(missionControlVisibleAtom)).toBe(false);
    expect(store.get(agentGridLayoutAtom)).toBe("grid");
  });

  it("replacing agents updates the map entirely", () => {
    const store = createStore();

    // Set initial agents
    store.set(setMissionControlAgentsAtom, [
      createMissionControlAgent({
        id: "a1" as unknown as AgentInstanceId,
        name: "First",
      }),
    ]);
    expect(store.get(missionControlAgentsMapAtom).size).toBe(1);

    // Replace with new set (additive since setBoomerangTasksAtom merges, but
    // setMissionControlAgentsAtom replaces)
    store.set(setMissionControlAgentsAtom, [
      createMissionControlAgent({
        id: "a2" as unknown as AgentInstanceId,
        name: "Second",
      }),
    ]);
    const map = store.get(missionControlAgentsMapAtom);
    expect(map.size).toBe(1);
    expect(map.has("a2" as unknown as AgentInstanceId)).toBe(true);
  });
});
