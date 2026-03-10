import { createStore } from "jotai";

import {
  filteredWorkspaceFileGroupsAtom,
  workspaceFileGroupsAtom,
  workspaceTurnFilterAtom,
} from "../model/workspaceAwarenessAtoms";

// We need to mock the upstream atoms since they depend on entity stores
vi.mock("../../../entities/diff", () => ({
  fileChangeSummaryByTurnAtom: () => ({ files: [] }),
}));
vi.mock("../../../entities/message", () => ({
  turnOrderAtom: { init: [], read: () => [] },
}));
vi.mock("../../../entities/tool-call", () => ({
  toolCallAtomFamily: () => null,
  toolCallIdsByTurnAtom: { init: {}, read: () => ({}) },
}));

describe("workspace turn filter atoms", () => {
  it("workspaceTurnFilterAtom defaults to null (show all)", () => {
    const store = createStore();
    expect(store.get(workspaceTurnFilterAtom)).toBeNull();
  });

  it("workspaceTurnFilterAtom can be set to a turn ID", () => {
    const store = createStore();
    store.set(workspaceTurnFilterAtom, "turn_1");
    expect(store.get(workspaceTurnFilterAtom)).toBe("turn_1");
  });

  it("workspaceTurnFilterAtom can be reset to null", () => {
    const store = createStore();
    store.set(workspaceTurnFilterAtom, "turn_1");
    store.set(workspaceTurnFilterAtom, null);
    expect(store.get(workspaceTurnFilterAtom)).toBeNull();
  });

  it("filteredWorkspaceFileGroupsAtom returns all groups when filter is null", () => {
    const store = createStore();
    // When filter is null, it delegates to workspaceFileGroupsAtom
    const filtered = store.get(filteredWorkspaceFileGroupsAtom);
    const all = store.get(workspaceFileGroupsAtom);
    expect(filtered).toEqual(all);
  });
});

describe("inferLanguage (via workspaceAwarenessAtoms)", () => {
  // Import the function directly
  it("is exported from the module", async () => {
    const mod = await import("../model/workspaceAwarenessAtoms");
    expect(mod.inferLanguage).toBeDefined();
  });

  it("infers TypeScript from .ts extension", async () => {
    const { inferLanguage } = await import("../model/workspaceAwarenessAtoms");
    expect(inferLanguage("src/utils.ts")).toBe("typescript");
  });

  it("infers Python from .py extension", async () => {
    const { inferLanguage } = await import("../model/workspaceAwarenessAtoms");
    expect(inferLanguage("main.py")).toBe("python");
  });

  it("returns undefined for unknown extensions", async () => {
    const { inferLanguage } = await import("../model/workspaceAwarenessAtoms");
    expect(inferLanguage("file.xyz")).toBeUndefined();
  });
});
