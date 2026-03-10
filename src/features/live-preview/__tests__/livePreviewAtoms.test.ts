import { createStore } from "jotai";

import type { PreviewState } from "../../../shared/protocol";
import {
  previewPanelVisibleAtom,
  previewStateAtom,
  resetLivePreviewStoreAtom,
  setPreviewStateAtom,
} from "../model/livePreviewAtoms";

describe("livePreviewAtoms", () => {
  it("starts with disconnected state and empty URL", () => {
    const store = createStore();

    const state = store.get(previewStateAtom);
    expect(state.url).toBe("");
    expect(state.status).toBe("disconnected");
    expect(state.last_update_ms).toBeUndefined();
  });

  it("starts with panel hidden", () => {
    const store = createStore();
    expect(store.get(previewPanelVisibleAtom)).toBe(false);
  });

  it("setPreviewStateAtom replaces entire preview state", () => {
    const store = createStore();

    const state: PreviewState = {
      url: "http://localhost:5173",
      status: "connected",
      last_update_ms: 1700000000000,
    };

    store.set(setPreviewStateAtom, state);

    const result = store.get(previewStateAtom);
    expect(result.url).toBe("http://localhost:5173");
    expect(result.status).toBe("connected");
    expect(result.last_update_ms).toBe(1700000000000);
  });

  it("setPreviewStateAtom handles all status values", () => {
    const store = createStore();

    const statuses: PreviewState["status"][] = ["disconnected", "connected", "updating", "error"];

    for (const status of statuses) {
      store.set(setPreviewStateAtom, {
        url: "http://localhost:3000",
        status,
      });

      expect(store.get(previewStateAtom).status).toBe(status);
    }
  });

  it("previewPanelVisibleAtom can be toggled", () => {
    const store = createStore();

    store.set(previewPanelVisibleAtom, true);
    expect(store.get(previewPanelVisibleAtom)).toBe(true);

    store.set(previewPanelVisibleAtom, false);
    expect(store.get(previewPanelVisibleAtom)).toBe(false);
  });

  it("resetLivePreviewStoreAtom restores defaults", () => {
    const store = createStore();

    store.set(setPreviewStateAtom, {
      url: "http://localhost:3000",
      status: "connected",
      last_update_ms: 1700000000000,
    });
    store.set(previewPanelVisibleAtom, true);

    store.set(resetLivePreviewStoreAtom);

    const state = store.get(previewStateAtom);
    expect(state.url).toBe("");
    expect(state.status).toBe("disconnected");
    expect(state.last_update_ms).toBeUndefined();
    expect(store.get(previewPanelVisibleAtom)).toBe(false);
  });
});
