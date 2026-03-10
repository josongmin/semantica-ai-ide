import { createStore } from "jotai";

import {
  exportDialogOpenAtom,
  exportFormatAtom,
  exportOptionsAtom,
  exportProgressAtom,
} from "../model/exportAtoms";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

describe("useExport (unit-level atom integration)", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("export options default to all enabled", () => {
    const store = createStore();
    const options = store.get(exportOptionsAtom);

    expect(options.include_diffs).toBe(true);
    expect(options.include_tool_calls).toBe(true);
    expect(options.include_timestamps).toBe(true);
  });

  it("format defaults to html", () => {
    const store = createStore();
    expect(store.get(exportFormatAtom)).toBe("html");
  });

  it("dialog open atom toggles correctly", () => {
    const store = createStore();

    expect(store.get(exportDialogOpenAtom)).toBe(false);
    store.set(exportDialogOpenAtom, true);
    expect(store.get(exportDialogOpenAtom)).toBe(true);
    store.set(exportDialogOpenAtom, false);
    expect(store.get(exportDialogOpenAtom)).toBe(false);
  });

  it("progress transitions through all states", () => {
    const store = createStore();

    expect(store.get(exportProgressAtom)).toBe("idle");
    store.set(exportProgressAtom, "exporting");
    expect(store.get(exportProgressAtom)).toBe("exporting");
    store.set(exportProgressAtom, "done");
    expect(store.get(exportProgressAtom)).toBe("done");
    store.set(exportProgressAtom, "error");
    expect(store.get(exportProgressAtom)).toBe("error");
  });
});
