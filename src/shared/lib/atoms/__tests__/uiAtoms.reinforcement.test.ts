import { createStore } from "jotai";

import type { ToolCategory } from "../../../protocol";
import { dismissToastAtom, pushToastAtom, type ToastData, toastStackAtom } from "../toastAtoms";
import {
  diffViewModeAtom,
  fileViewModeAtom,
  resetUiStoreAtom,
  toolCategoryFilterAtom,
} from "../uiAtoms";
// ─── Helpers ──────────────────────────────────────────────

const makeToast = (n: number): ToastData => ({
  id: `toast-${n}`,
  message: `Message ${n}`,
  variant: "info",
});

// ─── pushToastAtom ────────────────────────────────────────

describe("pushToastAtom", () => {
  it("adds a single toast to an empty stack", () => {
    const store = createStore();
    store.set(pushToastAtom, makeToast(1));
    const stack = store.get(toastStackAtom);
    expect(stack).toHaveLength(1);
  });

  it("stores correct id, message, and variant on the pushed toast", () => {
    const store = createStore();
    const toast: ToastData = { id: "abc", message: "Hello world", variant: "success" };
    store.set(pushToastAtom, toast);
    const [stored] = store.get(toastStackAtom);
    if (stored === undefined) throw new Error("expected stored toast");
    expect(stored.id).toBe("abc");
    expect(stored.message).toBe("Hello world");
    expect(stored.variant).toBe("success");
  });

  it("caps the stack at MAX_TOASTS (5) when 6 toasts are pushed", () => {
    const store = createStore();
    for (let i = 1; i <= 6; i++) {
      store.set(pushToastAtom, makeToast(i));
    }
    const stack = store.get(toastStackAtom);
    expect(stack).toHaveLength(5);
  });

  it("drops the oldest toast when the cap is exceeded", () => {
    const store = createStore();
    for (let i = 1; i <= 6; i++) {
      store.set(pushToastAtom, makeToast(i));
    }
    const stack = store.get(toastStackAtom);
    // toast-1 (the oldest) should have been dropped; toast-2 is now first
    expect(stack[0]?.id).toBe("toast-2");
    // toast-6 (the newest) should be last
    expect(stack[stack.length - 1]?.id).toBe("toast-6");
  });

  it("retains all toasts when exactly MAX_TOASTS (5) are pushed", () => {
    const store = createStore();
    for (let i = 1; i <= 5; i++) {
      store.set(pushToastAtom, makeToast(i));
    }
    const stack = store.get(toastStackAtom);
    expect(stack).toHaveLength(5);
    expect(stack[0]?.id).toBe("toast-1");
    expect(stack[4]?.id).toBe("toast-5");
  });
});

// ─── dismissToastAtom ─────────────────────────────────────

describe("dismissToastAtom", () => {
  it("removes only the toast with the given id", () => {
    const store = createStore();
    store.set(pushToastAtom, makeToast(1));
    store.set(pushToastAtom, makeToast(2));
    store.set(pushToastAtom, makeToast(3));

    store.set(dismissToastAtom, "toast-2");

    const stack = store.get(toastStackAtom);
    expect(stack).toHaveLength(2);
    expect(stack.map((t) => t.id)).toEqual(["toast-1", "toast-3"]);
  });

  it("is a no-op when the id does not exist in the stack", () => {
    const store = createStore();
    store.set(pushToastAtom, makeToast(1));
    store.set(pushToastAtom, makeToast(2));

    store.set(dismissToastAtom, "nonexistent-id");

    const stack = store.get(toastStackAtom);
    expect(stack).toHaveLength(2);
    expect(stack.map((t) => t.id)).toEqual(["toast-1", "toast-2"]);
  });

  it("results in an empty stack when the only toast is dismissed", () => {
    const store = createStore();
    store.set(pushToastAtom, makeToast(1));
    store.set(dismissToastAtom, "toast-1");
    expect(store.get(toastStackAtom)).toHaveLength(0);
  });

  it("is a no-op on an already-empty stack", () => {
    const store = createStore();
    store.set(dismissToastAtom, "any-id");
    expect(store.get(toastStackAtom)).toHaveLength(0);
  });
});

// ─── diffViewModeAtom ─────────────────────────────────────

describe("diffViewModeAtom", () => {
  it('defaults to "inline"', () => {
    const store = createStore();
    expect(store.get(diffViewModeAtom)).toBe("inline");
  });

  it('can be set to "side-by-side"', () => {
    const store = createStore();
    store.set(diffViewModeAtom, "side-by-side");
    expect(store.get(diffViewModeAtom)).toBe("side-by-side");
  });

  it('can be switched back to "inline" after being changed', () => {
    const store = createStore();
    store.set(diffViewModeAtom, "side-by-side");
    store.set(diffViewModeAtom, "inline");
    expect(store.get(diffViewModeAtom)).toBe("inline");
  });
});

// ─── fileViewModeAtom ─────────────────────────────────────

describe("fileViewModeAtom", () => {
  it('defaults to "list"', () => {
    const store = createStore();
    expect(store.get(fileViewModeAtom)).toBe("list");
  });

  it('can be set to "tree"', () => {
    const store = createStore();
    store.set(fileViewModeAtom, "tree");
    expect(store.get(fileViewModeAtom)).toBe("tree");
  });

  it('can be switched back to "list" after being changed', () => {
    const store = createStore();
    store.set(fileViewModeAtom, "tree");
    store.set(fileViewModeAtom, "list");
    expect(store.get(fileViewModeAtom)).toBe("list");
  });
});

// ─── toolCategoryFilterAtom ───────────────────────────────

describe("toolCategoryFilterAtom", () => {
  it("defaults to an empty Set", () => {
    const store = createStore();
    const filter = store.get(toolCategoryFilterAtom);
    expect(filter).toBeInstanceOf(Set);
    expect(filter.size).toBe(0);
  });

  it("can be set to a populated Set of categories", () => {
    const store = createStore();
    store.set(toolCategoryFilterAtom, new Set<ToolCategory>(["read", "write"]));
    const filter = store.get(toolCategoryFilterAtom);
    expect(filter.size).toBe(2);
    expect(filter.has("read" as const)).toBe(true);
    expect(filter.has("write" as const)).toBe(true);
  });

  it("can be reset back to an empty Set", () => {
    const store = createStore();
    store.set(toolCategoryFilterAtom, new Set<ToolCategory>(["read"]));
    store.set(toolCategoryFilterAtom, new Set());
    expect(store.get(toolCategoryFilterAtom).size).toBe(0);
  });
});

// ─── resetUiStoreAtom ─────────────────────────────────────

describe("resetUiStoreAtom", () => {
  it("resets toastStackAtom to an empty array", () => {
    const store = createStore();
    store.set(pushToastAtom, makeToast(1));
    store.set(pushToastAtom, makeToast(2));

    store.set(resetUiStoreAtom);

    expect(store.get(toastStackAtom)).toHaveLength(0);
  });

  it('resets diffViewModeAtom to "inline"', () => {
    const store = createStore();
    store.set(diffViewModeAtom, "side-by-side");

    store.set(resetUiStoreAtom);

    expect(store.get(diffViewModeAtom)).toBe("inline");
  });

  it('resets fileViewModeAtom to "list"', () => {
    const store = createStore();
    store.set(fileViewModeAtom, "tree");

    store.set(resetUiStoreAtom);

    expect(store.get(fileViewModeAtom)).toBe("list");
  });

  it("resets toolCategoryFilterAtom to an empty Set", () => {
    const store = createStore();
    store.set(toolCategoryFilterAtom, new Set<ToolCategory>(["read"]));

    store.set(resetUiStoreAtom);

    expect(store.get(toolCategoryFilterAtom).size).toBe(0);
  });

  it("resets all modified atoms back to their defaults in a single call", () => {
    const store = createStore();

    // Dirty several atoms
    store.set(pushToastAtom, makeToast(1));
    store.set(pushToastAtom, makeToast(2));
    store.set(diffViewModeAtom, "side-by-side");
    store.set(fileViewModeAtom, "tree");
    store.set(toolCategoryFilterAtom, new Set<ToolCategory>(["read"]));

    // Single reset
    store.set(resetUiStoreAtom);

    expect(store.get(toastStackAtom)).toHaveLength(0);
    expect(store.get(diffViewModeAtom)).toBe("inline");
    expect(store.get(fileViewModeAtom)).toBe("list");
    expect(store.get(toolCategoryFilterAtom).size).toBe(0);
  });
});
