import { createStore } from "jotai";

import { createCheckpoint, resetIdCounter } from "~shared/lib/mocks";
import type { SessionId } from "~shared/protocol";

import {
  addCheckpointAtom,
  approvalModeAtom,
  checkpointsAtom,
  sessionMetaAtom,
  updateSessionMetaAtom,
} from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("sessionMetaAtom", () => {
  it("has correct default values (idle, empty strings)", () => {
    const store = createStore();
    const meta = store.get(sessionMetaAtom);

    expect(meta.status).toBe("idle");
    expect(meta.session_id).toBe("");
    expect(meta.model_id).toBe("");
    expect(meta.model_label).toBe("");
    expect(meta.approval_mode).toBe("auto");
  });
});

describe("updateSessionMetaAtom", () => {
  it("partial merge preserves existing fields", () => {
    const store = createStore();

    store.set(updateSessionMetaAtom, {
      session_id: "sess_42" as SessionId,
      model_id: "claude-opus-4-6",
    });

    store.set(updateSessionMetaAtom, {
      status: "running",
    });

    const meta = store.get(sessionMetaAtom);
    expect(meta.session_id).toBe("sess_42");
    expect(meta.model_id).toBe("claude-opus-4-6");
    expect(meta.status).toBe("running");
    // Default fields that were not overridden remain
    expect(meta.approval_mode).toBe("auto");
  });
});

describe("approvalModeAtom", () => {
  it("read derives from sessionMeta", () => {
    const store = createStore();
    store.set(updateSessionMetaAtom, { approval_mode: "auto" });

    expect(store.get(approvalModeAtom)).toBe("auto");
  });

  it("write updates sessionMeta", () => {
    const store = createStore();
    store.set(approvalModeAtom, "turbo");

    expect(store.get(sessionMetaAtom).approval_mode).toBe("turbo");
  });
});

describe("addCheckpointAtom", () => {
  it("appends to checkpointsAtom", () => {
    const store = createStore();
    const cp1 = createCheckpoint({ id: "cp_1", label: "First checkpoint" });
    const cp2 = createCheckpoint({ id: "cp_2", label: "Second checkpoint" });

    store.set(addCheckpointAtom, cp1);
    store.set(addCheckpointAtom, cp2);

    const checkpoints = store.get(checkpointsAtom);
    expect(checkpoints).toHaveLength(2);
    expect(checkpoints[0]?.label).toBe("First checkpoint");
    expect(checkpoints[1]?.label).toBe("Second checkpoint");
  });
});
