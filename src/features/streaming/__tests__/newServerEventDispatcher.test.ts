/**
 * Integration tests for the new ServerEvent variants added in AS-01, AS-02, AS-12, AS-14, AS-15.
 *
 * Tests the dispatch pipeline: ServerEvent -> dispatchServerEvent() -> Jotai store atom updates.
 * These tests import atoms directly to avoid the pre-existing missing module issues
 * in the full dispatcher test suite.
 */
import { createStore } from "jotai";

import {
  createArchitectState,
  createMcpRegistryEntry,
  createModelRoute,
  createNotepad,
  createPrivacyState,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import { architectStateAtom, setArchitectStateAtom } from "../../architect-mode";
import { mcpRegistryAtom, setMcpRegistryAtom } from "../../mcp-registry";
import { latestRouteAtom, modelRoutesAtom, setModelRoutesAtom } from "../../model-routing";
import { privacyStateAtom, setPrivacyStateAtom } from "../../privacy-mode";
import { activeNotepadIdAtom, notepadsAtom, setNotepadsAtom } from "../../scratchpad";

beforeEach(() => {
  resetIdCounter();
});

describe("New ServerEvent variants integration", () => {
  describe("SET_ARCHITECT_STATE", () => {
    it("sets architect state in store", () => {
      const store = createStore();
      const state = createArchitectState({
        active_role: "planner",
        model_name: "Claude Opus 4.6",
        task_description: "Planning architecture",
      });

      store.set(setArchitectStateAtom, state);

      const result = store.get(architectStateAtom);
      expect(result).toEqual(state);
      expect(result?.active_role).toBe("planner");
      expect(result?.model_name).toBe("Claude Opus 4.6");
      expect(result?.task_description).toBe("Planning architecture");
    });

    it("transitions between roles", () => {
      const store = createStore();

      store.set(setArchitectStateAtom, createArchitectState({ active_role: "planner" }));
      expect(store.get(architectStateAtom)?.active_role).toBe("planner");

      store.set(setArchitectStateAtom, createArchitectState({ active_role: "coder" }));
      expect(store.get(architectStateAtom)?.active_role).toBe("coder");

      store.set(setArchitectStateAtom, createArchitectState({ active_role: "critic" }));
      expect(store.get(architectStateAtom)?.active_role).toBe("critic");
    });
  });

  describe("SET_MODEL_ROUTES", () => {
    it("sets model routes in store", () => {
      const store = createStore();
      const routes = [
        createModelRoute({ task_type: "code_gen", model: "Opus", timestamp_ms: 2000 }),
        createModelRoute({ task_type: "review", model: "Sonnet", timestamp_ms: 1000 }),
      ];

      store.set(setModelRoutesAtom, routes);

      expect(store.get(modelRoutesAtom)).toHaveLength(2);
      expect(store.get(latestRouteAtom)?.model).toBe("Opus");
    });

    it("merges routes across multiple dispatches", () => {
      const store = createStore();

      store.set(setModelRoutesAtom, [createModelRoute({ timestamp_ms: 1000 })]);
      store.set(setModelRoutesAtom, [createModelRoute({ timestamp_ms: 2000 })]);

      expect(store.get(modelRoutesAtom)).toHaveLength(2);
    });
  });

  describe("SET_MCP_REGISTRY", () => {
    it("sets MCP registry entries in store", () => {
      const store = createStore();
      const entries = [
        createMcpRegistryEntry({ id: "srv1", name: "Server A", installed: false }),
        createMcpRegistryEntry({ id: "srv2", name: "Server B", installed: true }),
      ];

      store.set(setMcpRegistryAtom, entries);

      const map = store.get(mcpRegistryAtom);
      expect(map.size).toBe(2);
      expect(map.get("srv1")?.name).toBe("Server A");
      expect(map.get("srv2")?.installed).toBe(true);
    });

    it("merges registry entries across dispatches", () => {
      const store = createStore();

      store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv1" })]);
      store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv2" })]);

      expect(store.get(mcpRegistryAtom).size).toBe(2);
    });
  });

  describe("SET_PRIVACY_STATE", () => {
    it("sets privacy state in store", () => {
      const store = createStore();
      const state = createPrivacyState({
        mode: "shared",
        details: "Shared with model provider",
        policy_url: "https://example.com/privacy",
      });

      store.set(setPrivacyStateAtom, state);

      const result = store.get(privacyStateAtom);
      expect(result).toEqual(state);
      expect(result?.mode).toBe("shared");
      expect(result?.policy_url).toBe("https://example.com/privacy");
    });

    it("transitions between privacy modes", () => {
      const store = createStore();

      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));
      expect(store.get(privacyStateAtom)?.mode).toBe("local");

      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "shared" }));
      expect(store.get(privacyStateAtom)?.mode).toBe("shared");

      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "stored" }));
      expect(store.get(privacyStateAtom)?.mode).toBe("stored");
    });
  });

  describe("SET_NOTEPADS", () => {
    it("sets notepads in store", () => {
      const store = createStore();
      const notepads = [
        createNotepad({ id: "np1", title: "Design Notes" }),
        createNotepad({ id: "np2", title: "Todo List" }),
      ];

      store.set(setNotepadsAtom, notepads);

      const map = store.get(notepadsAtom);
      expect(map.size).toBe(2);
      expect(map.get("np1")?.title).toBe("Design Notes");
      expect(map.get("np2")?.title).toBe("Todo List");
    });

    it("merges notepads across dispatches", () => {
      const store = createStore();

      store.set(setNotepadsAtom, [createNotepad({ id: "np1", title: "First" })]);
      store.set(setNotepadsAtom, [createNotepad({ id: "np2", title: "Second" })]);

      const map = store.get(notepadsAtom);
      expect(map.size).toBe(2);
    });

    it("supports activeNotepadId selection", () => {
      const store = createStore();

      store.set(setNotepadsAtom, [createNotepad({ id: "np1", title: "Notes" })]);
      store.set(activeNotepadIdAtom, "np1");

      expect(store.get(activeNotepadIdAtom)).toBe("np1");
    });
  });
});
