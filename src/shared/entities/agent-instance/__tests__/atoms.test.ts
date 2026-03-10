import { createStore } from "jotai";

import { resetIdCounter } from "~shared/lib/mocks";
import type { AgentInstance, AgentInstanceId } from "~shared/protocol";

import {
  agentInstanceAtomFamily,
  agentInstanceIdsAtom,
  hasActiveAgentsAtom,
  removeAgentInstanceAtom,
  resetAgentStoreAtom,
  runningAgentsCountAtom,
  updateAgentStatusAtom,
  upsertAgentInstanceAtom,
} from "../model/atoms";

let instanceCounter = 0;

function createAgentInstance(overrides: Partial<AgentInstance> = {}): AgentInstance {
  return {
    id: `agent_${++instanceCounter}` as AgentInstanceId,
    label: "Test Agent",
    status: "queued",
    progress: 0,
    model_id: "claude-opus-4-6",
    created_at_ms: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  resetIdCounter();
  instanceCounter = 0;
});

describe("upsertAgentInstanceAtom", () => {
  it("saves agent instance to family and adds id to index", () => {
    const store = createStore();
    const instance = createAgentInstance({ id: "agent_1" as AgentInstanceId });

    store.set(upsertAgentInstanceAtom, instance);

    expect(store.get(agentInstanceAtomFamily("agent_1"))).toEqual(instance);
    expect(store.get(agentInstanceIdsAtom)).toEqual(["agent_1"]);
  });

  it("updates existing instance without creating duplicate in index", () => {
    const store = createStore();
    const instance = createAgentInstance({ id: "agent_1" as AgentInstanceId, progress: 0 });
    store.set(upsertAgentInstanceAtom, instance);

    const updated = { ...instance, progress: 50 };
    store.set(upsertAgentInstanceAtom, updated);

    expect(store.get(agentInstanceAtomFamily("agent_1"))?.progress).toBe(50);
    expect(store.get(agentInstanceIdsAtom)).toHaveLength(1);
  });

  it("indexes multiple instances in insertion order", () => {
    const store = createStore();
    store.set(upsertAgentInstanceAtom, createAgentInstance({ id: "agent_1" as AgentInstanceId }));
    store.set(upsertAgentInstanceAtom, createAgentInstance({ id: "agent_2" as AgentInstanceId }));
    store.set(upsertAgentInstanceAtom, createAgentInstance({ id: "agent_3" as AgentInstanceId }));

    expect(store.get(agentInstanceIdsAtom)).toEqual(["agent_1", "agent_2", "agent_3"]);
  });
});

describe("updateAgentStatusAtom", () => {
  it("updates status and optional progress/error_message", () => {
    const store = createStore();
    const instance = createAgentInstance({ id: "agent_1" as AgentInstanceId, status: "queued" });
    store.set(upsertAgentInstanceAtom, instance);

    store.set(updateAgentStatusAtom, {
      id: "agent_1" as AgentInstanceId,
      status: "running",
      progress: 42,
    });

    const result = store.get(agentInstanceAtomFamily("agent_1"));
    expect(result?.status).toBe("running");
    expect(result?.progress).toBe(42);
  });

  it("sets error_message on error status", () => {
    const store = createStore();
    const instance = createAgentInstance({ id: "agent_1" as AgentInstanceId, status: "running" });
    store.set(upsertAgentInstanceAtom, instance);

    store.set(updateAgentStatusAtom, {
      id: "agent_1" as AgentInstanceId,
      status: "error",
      error_message: "timeout exceeded",
    });

    const result = store.get(agentInstanceAtomFamily("agent_1"));
    expect(result?.status).toBe("error");
    expect(result?.error_message).toBe("timeout exceeded");
  });

  it("preserves existing fields when not provided in update", () => {
    const store = createStore();
    const instance = createAgentInstance({
      id: "agent_1" as AgentInstanceId,
      status: "running",
      progress: 75,
    });
    store.set(upsertAgentInstanceAtom, instance);

    store.set(updateAgentStatusAtom, {
      id: "agent_1" as AgentInstanceId,
      status: "success",
    });

    const result = store.get(agentInstanceAtomFamily("agent_1"));
    expect(result?.status).toBe("success");
    expect(result?.progress).toBe(75);
  });

  it("does nothing when id does not exist", () => {
    const store = createStore();

    store.set(updateAgentStatusAtom, {
      id: "nonexistent" as AgentInstanceId,
      status: "error",
    });

    expect(store.get(agentInstanceAtomFamily("nonexistent"))).toBeNull();
  });
});

describe("removeAgentInstanceAtom", () => {
  it("removes instance from family and index", () => {
    const store = createStore();
    const i1 = createAgentInstance({ id: "agent_1" as AgentInstanceId });
    const i2 = createAgentInstance({ id: "agent_2" as AgentInstanceId });
    store.set(upsertAgentInstanceAtom, i1);
    store.set(upsertAgentInstanceAtom, i2);

    store.set(removeAgentInstanceAtom, "agent_1" as AgentInstanceId);

    expect(store.get(agentInstanceIdsAtom)).toEqual(["agent_2"]);
  });

  it("is a no-op when id does not exist", () => {
    const store = createStore();
    const instance = createAgentInstance({ id: "agent_1" as AgentInstanceId });
    store.set(upsertAgentInstanceAtom, instance);

    store.set(removeAgentInstanceAtom, "nonexistent" as AgentInstanceId);

    expect(store.get(agentInstanceIdsAtom)).toEqual(["agent_1"]);
  });
});

describe("resetAgentStoreAtom", () => {
  it("clears all instances and index", () => {
    const store = createStore();
    store.set(upsertAgentInstanceAtom, createAgentInstance({ id: "agent_1" as AgentInstanceId }));
    store.set(upsertAgentInstanceAtom, createAgentInstance({ id: "agent_2" as AgentInstanceId }));

    store.set(resetAgentStoreAtom);

    expect(store.get(agentInstanceIdsAtom)).toEqual([]);
    const store2 = createStore();
    expect(store2.get(agentInstanceAtomFamily("agent_1"))).toBeNull();
    expect(store2.get(agentInstanceAtomFamily("agent_2"))).toBeNull();
  });
});

describe("runningAgentsCountAtom / hasActiveAgentsAtom", () => {
  it("counts only running instances", () => {
    const store = createStore();
    store.set(
      upsertAgentInstanceAtom,
      createAgentInstance({ id: "agent_1" as AgentInstanceId, status: "running" }),
    );
    store.set(
      upsertAgentInstanceAtom,
      createAgentInstance({ id: "agent_2" as AgentInstanceId, status: "running" }),
    );
    store.set(
      upsertAgentInstanceAtom,
      createAgentInstance({ id: "agent_3" as AgentInstanceId, status: "success" }),
    );

    expect(store.get(runningAgentsCountAtom)).toBe(2);
    expect(store.get(hasActiveAgentsAtom)).toBe(true);
  });

  it("returns 0 and false when no agents are running", () => {
    const store = createStore();
    store.set(
      upsertAgentInstanceAtom,
      createAgentInstance({ id: "agent_1" as AgentInstanceId, status: "success" }),
    );

    expect(store.get(runningAgentsCountAtom)).toBe(0);
    expect(store.get(hasActiveAgentsAtom)).toBe(false);
  });

  it("returns 0 and false when store is empty", () => {
    const store = createStore();

    expect(store.get(runningAgentsCountAtom)).toBe(0);
    expect(store.get(hasActiveAgentsAtom)).toBe(false);
  });
});
