import { createStore } from "jotai";

import {
  exportDialogOpenAtom,
  exportErrorMessageAtom,
  exportFormatAtom,
  exportOptionsAtom,
  exportProgressAtom,
  resetExportStoreAtom,
  setExportProgressAtom,
} from "../model/exportAtoms";

describe("exportAtoms", () => {
  it("has correct initial values", () => {
    const store = createStore();

    expect(store.get(exportDialogOpenAtom)).toBe(false);
    expect(store.get(exportProgressAtom)).toBe("idle");
    expect(store.get(exportErrorMessageAtom)).toBeNull();
    expect(store.get(exportFormatAtom)).toBe("html");
    expect(store.get(exportOptionsAtom)).toEqual({
      include_diffs: true,
      include_tool_calls: true,
      include_timestamps: true,
    });
  });

  it("setExportProgressAtom updates progress and error message", () => {
    const store = createStore();

    store.set(setExportProgressAtom, { progress: "exporting" });
    expect(store.get(exportProgressAtom)).toBe("exporting");
    expect(store.get(exportErrorMessageAtom)).toBeNull();

    store.set(setExportProgressAtom, {
      progress: "error",
      error_message: "File write failed",
    });
    expect(store.get(exportProgressAtom)).toBe("error");
    expect(store.get(exportErrorMessageAtom)).toBe("File write failed");

    store.set(setExportProgressAtom, { progress: "done" });
    expect(store.get(exportProgressAtom)).toBe("done");
    expect(store.get(exportErrorMessageAtom)).toBeNull();
  });

  it("resetExportStoreAtom resets all export state", () => {
    const store = createStore();

    // Mutate everything
    store.set(exportDialogOpenAtom, true);
    store.set(exportProgressAtom, "exporting");
    store.set(exportErrorMessageAtom, "some error");
    store.set(exportFormatAtom, "pdf");
    store.set(exportOptionsAtom, {
      include_diffs: false,
      include_tool_calls: false,
      include_timestamps: false,
    });

    // Reset
    store.set(resetExportStoreAtom);

    expect(store.get(exportDialogOpenAtom)).toBe(false);
    expect(store.get(exportProgressAtom)).toBe("idle");
    expect(store.get(exportErrorMessageAtom)).toBeNull();
    expect(store.get(exportFormatAtom)).toBe("html");
    expect(store.get(exportOptionsAtom)).toEqual({
      include_diffs: true,
      include_tool_calls: true,
      include_timestamps: true,
    });
  });
});
