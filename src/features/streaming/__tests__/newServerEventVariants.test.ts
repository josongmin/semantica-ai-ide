import { createStore } from "jotai";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { elementMappingsAtom } from "../../../features/click-to-edit";
import { wikiPagesAtom } from "../../../features/deep-wiki";
import { previewStateAtom } from "../../../features/live-preview";
import { threeModelStateAtom } from "../../../features/three-model";
import {
  createElementMapping,
  createPreviewState,
  createThreeModelState,
  createWikiPage,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("New serverEvent variants (AS-03 through AS-06)", () => {
  // ─── AS-03: SET_THREE_MODEL_STATE ───────────────────────────

  it("SET_THREE_MODEL_STATE stores three-model state", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const state = createThreeModelState({
      planner: { model: "opus", status: "active", output: "Planning..." },
      coder: { model: "sonnet", status: "idle", output: "" },
      critic: { model: "haiku", status: "idle", output: "" },
    });

    dispatch({ t: "SET_THREE_MODEL_STATE", state });

    const result = store.get(threeModelStateAtom);
    expect(result.planner.model).toBe("opus");
    expect(result.planner.status).toBe("active");
    expect(result.planner.output).toBe("Planning...");
    expect(result.coder.status).toBe("idle");
    expect(result.critic.status).toBe("idle");
  });

  it("SET_THREE_MODEL_STATE replaces previous state entirely", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_THREE_MODEL_STATE",
      state: createThreeModelState({
        planner: { model: "opus", status: "active", output: "Step 1" },
      }),
    });

    dispatch({
      t: "SET_THREE_MODEL_STATE",
      state: createThreeModelState({
        planner: { model: "opus", status: "done", output: "Complete" },
        coder: { model: "sonnet", status: "active", output: "Coding..." },
      }),
    });

    const result = store.get(threeModelStateAtom);
    expect(result.planner.status).toBe("done");
    expect(result.coder.status).toBe("active");
    expect(result.coder.output).toBe("Coding...");
  });

  // ─── AS-04: SET_WIKI_PAGES ─────────────────────────────────

  it("SET_WIKI_PAGES stores wiki pages as a Map", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const pages = [
      createWikiPage({ id: "p1", title: "Getting Started" }),
      createWikiPage({ id: "p2", title: "API Reference" }),
    ];

    dispatch({ t: "SET_WIKI_PAGES", pages });

    const result = store.get(wikiPagesAtom);
    expect(result.size).toBe(2);
    expect(result.get("p1")?.title).toBe("Getting Started");
    expect(result.get("p2")?.title).toBe("API Reference");
  });

  it("SET_WIKI_PAGES replaces all existing pages", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_WIKI_PAGES",
      pages: [createWikiPage({ id: "p1", title: "Old Page" })],
    });

    dispatch({
      t: "SET_WIKI_PAGES",
      pages: [createWikiPage({ id: "p2", title: "New Page" })],
    });

    const result = store.get(wikiPagesAtom);
    expect(result.size).toBe(1);
    expect(result.has("p1")).toBe(false);
    expect(result.get("p2")?.title).toBe("New Page");
  });

  it("SET_WIKI_PAGES handles pages with parent_id (tree structure)", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const pages = [
      createWikiPage({ id: "root", title: "Root" }),
      createWikiPage({
        id: "child",
        title: "Child",
        parent_id: "root",
        source_turn_id: "turn_1" as TurnId,
      }),
    ];

    dispatch({ t: "SET_WIKI_PAGES", pages });

    const result = store.get(wikiPagesAtom);
    expect(result.get("child")?.parent_id).toBe("root");
    expect(result.get("child")?.source_turn_id).toBe("turn_1");
  });

  // ─── AS-05: SET_ELEMENT_MAPPINGS ───────────────────────────

  it("SET_ELEMENT_MAPPINGS stores element mappings", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const mappings = [
      createElementMapping({ selector: ".header", file_path: "src/Header.tsx", line: 10 }),
      createElementMapping({ selector: ".footer", file_path: "src/Footer.tsx", line: 5 }),
    ];

    dispatch({ t: "SET_ELEMENT_MAPPINGS", mappings });

    const result = store.get(elementMappingsAtom);
    expect(result).toHaveLength(2);
    expect(result[0]?.selector).toBe(".header");
    expect(result[1]?.file_path).toBe("src/Footer.tsx");
  });

  it("SET_ELEMENT_MAPPINGS replaces all existing mappings", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_ELEMENT_MAPPINGS",
      mappings: [createElementMapping({ selector: ".old" })],
    });

    dispatch({
      t: "SET_ELEMENT_MAPPINGS",
      mappings: [createElementMapping({ selector: ".new" })],
    });

    const result = store.get(elementMappingsAtom);
    expect(result).toHaveLength(1);
    expect(result[0]?.selector).toBe(".new");
  });

  // ─── AS-06: SET_PREVIEW_STATE ──────────────────────────────

  it("SET_PREVIEW_STATE stores preview state", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const state = createPreviewState({
      url: "http://localhost:5173",
      status: "connected",
      last_update_ms: 1700000000000,
    });

    dispatch({ t: "SET_PREVIEW_STATE", state });

    const result = store.get(previewStateAtom);
    expect(result.url).toBe("http://localhost:5173");
    expect(result.status).toBe("connected");
    expect(result.last_update_ms).toBe(1700000000000);
  });

  it("SET_PREVIEW_STATE transitions through status lifecycle", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Start disconnected
    dispatch({
      t: "SET_PREVIEW_STATE",
      state: createPreviewState({ status: "disconnected", url: "" }),
    });
    expect(store.get(previewStateAtom).status).toBe("disconnected");

    // Connect
    dispatch({
      t: "SET_PREVIEW_STATE",
      state: createPreviewState({ status: "connected", url: "http://localhost:3000" }),
    });
    expect(store.get(previewStateAtom).status).toBe("connected");

    // Updating (HMR)
    dispatch({
      t: "SET_PREVIEW_STATE",
      state: createPreviewState({ status: "updating", url: "http://localhost:3000" }),
    });
    expect(store.get(previewStateAtom).status).toBe("updating");

    // Back to connected
    dispatch({
      t: "SET_PREVIEW_STATE",
      state: createPreviewState({ status: "connected", url: "http://localhost:3000" }),
    });
    expect(store.get(previewStateAtom).status).toBe("connected");
  });

  // ─── RESET_STORES clears new feature state ────────────────

  it("RESET_STORES clears all new feature state", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Populate all stores
    dispatch({
      t: "SET_THREE_MODEL_STATE",
      state: createThreeModelState({
        planner: { model: "opus", status: "active", output: "Planning" },
      }),
    });
    dispatch({
      t: "SET_WIKI_PAGES",
      pages: [createWikiPage({ id: "p1" })],
    });
    dispatch({
      t: "SET_ELEMENT_MAPPINGS",
      mappings: [createElementMapping()],
    });
    dispatch({
      t: "SET_PREVIEW_STATE",
      state: createPreviewState({ url: "http://localhost:3000", status: "connected" }),
    });

    // Verify populated
    expect(store.get(threeModelStateAtom).planner.status).toBe("active");
    expect(store.get(wikiPagesAtom).size).toBe(1);
    expect(store.get(elementMappingsAtom)).toHaveLength(1);
    expect(store.get(previewStateAtom).status).toBe("connected");

    // Reset
    dispatch({ t: "RESET_STORES" });

    // Verify cleared
    expect(store.get(threeModelStateAtom).planner.status).toBe("idle");
    expect(store.get(threeModelStateAtom).planner.model).toBe("");
    expect(store.get(wikiPagesAtom).size).toBe(0);
    expect(store.get(elementMappingsAtom)).toHaveLength(0);
    expect(store.get(previewStateAtom).status).toBe("disconnected");
    expect(store.get(previewStateAtom).url).toBe("");
  });
});
