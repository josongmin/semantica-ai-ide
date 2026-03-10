import { createStore } from "jotai";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { createPromptTemplate, createTeamConfig, resetIdCounter } from "../../../shared/lib/mocks";
import { exportErrorMessageAtom,exportProgressAtom } from "../../export";
import { promptTemplatesAtom } from "../../prompt-templates";
import { teamConfigDiffCountAtom,teamConfigItemsAtom } from "../../team-config-sync";
function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("ServerEvent dispatcher - new features", () => {
  // ─── CS-03: Export ──────────────────────────────────────────

  describe("SET_EXPORT_PROGRESS", () => {
    it("sets export progress to exporting", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({ t: "SET_EXPORT_PROGRESS", progress: "exporting" });

      expect(store.get(exportProgressAtom)).toBe("exporting");
      expect(store.get(exportErrorMessageAtom)).toBeNull();
    });

    it("sets export progress to done", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({ t: "SET_EXPORT_PROGRESS", progress: "done" });

      expect(store.get(exportProgressAtom)).toBe("done");
    });

    it("sets export progress to error with message", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_EXPORT_PROGRESS",
        progress: "error",
        error_message: "Disk full",
      });

      expect(store.get(exportProgressAtom)).toBe("error");
      expect(store.get(exportErrorMessageAtom)).toBe("Disk full");
    });

    it("clears error message when transitioning from error to idle", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_EXPORT_PROGRESS",
        progress: "error",
        error_message: "Failed",
      });
      expect(store.get(exportErrorMessageAtom)).toBe("Failed");

      dispatch({ t: "SET_EXPORT_PROGRESS", progress: "idle" });
      expect(store.get(exportErrorMessageAtom)).toBeNull();
    });
  });

  // ─── CS-04: Team Config ──────────────────────────────────────

  describe("SET_TEAM_CONFIG", () => {
    it("populates team config items", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const items = [
        createTeamConfig({ key: "editor.fontSize", status: "different" }),
        createTeamConfig({ key: "editor.tabSize", status: "same" }),
      ];

      dispatch({ t: "SET_TEAM_CONFIG", items });

      expect(store.get(teamConfigItemsAtom)).toHaveLength(2);
      expect(store.get(teamConfigItemsAtom)[0]?.key).toBe("editor.fontSize");
    });

    it("replaces existing items on subsequent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_TEAM_CONFIG",
        items: [createTeamConfig({ key: "a" }), createTeamConfig({ key: "b" })],
      });
      expect(store.get(teamConfigItemsAtom)).toHaveLength(2);

      dispatch({
        t: "SET_TEAM_CONFIG",
        items: [createTeamConfig({ key: "c" })],
      });
      expect(store.get(teamConfigItemsAtom)).toHaveLength(1);
      expect(store.get(teamConfigItemsAtom)[0]?.key).toBe("c");
    });

    it("derived diff count reflects config differences", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_TEAM_CONFIG",
        items: [
          createTeamConfig({ key: "a", status: "different" }),
          createTeamConfig({ key: "b", status: "same" }),
          createTeamConfig({ key: "c", status: "local_only" }),
        ],
      });

      expect(store.get(teamConfigDiffCountAtom)).toBe(2);
    });
  });

  // ─── CS-06: Prompt Templates ────────────────────────────────

  describe("SET_PROMPT_TEMPLATES", () => {
    it("populates prompt templates", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const templates = [
        createPromptTemplate({ id: "tpl-1", scope: "personal" }),
        createPromptTemplate({ id: "tpl-2", scope: "team" }),
      ];

      dispatch({ t: "SET_PROMPT_TEMPLATES", templates });

      expect(store.get(promptTemplatesAtom)).toHaveLength(2);
    });

    it("replaces existing templates on subsequent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_PROMPT_TEMPLATES",
        templates: [createPromptTemplate({ id: "tpl-1" }), createPromptTemplate({ id: "tpl-2" })],
      });
      expect(store.get(promptTemplatesAtom)).toHaveLength(2);

      dispatch({
        t: "SET_PROMPT_TEMPLATES",
        templates: [createPromptTemplate({ id: "tpl-3" })],
      });
      expect(store.get(promptTemplatesAtom)).toHaveLength(1);
      expect(store.get(promptTemplatesAtom)[0]?.id).toBe("tpl-3");
    });
  });

  // ─── RESET_STORES clears new features ────────────────────────

  describe("RESET_STORES clears new feature state", () => {
    it("resets export, team config, and prompt template stores", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Populate all three
      dispatch({ t: "SET_EXPORT_PROGRESS", progress: "exporting" });
      dispatch({
        t: "SET_TEAM_CONFIG",
        items: [createTeamConfig({ key: "x" })],
      });
      dispatch({
        t: "SET_PROMPT_TEMPLATES",
        templates: [createPromptTemplate({ id: "tpl-x" })],
      });

      expect(store.get(exportProgressAtom)).toBe("exporting");
      expect(store.get(teamConfigItemsAtom)).toHaveLength(1);
      expect(store.get(promptTemplatesAtom)).toHaveLength(1);

      // Reset
      dispatch({ t: "RESET_STORES" });

      expect(store.get(exportProgressAtom)).toBe("idle");
      expect(store.get(teamConfigItemsAtom)).toEqual([]);
      expect(store.get(promptTemplatesAtom)).toEqual([]);
    });
  });
});
