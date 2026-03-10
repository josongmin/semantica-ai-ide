import { createStore } from "jotai";

import {
  categoryPermissionsAtom,
  resetCategoryPermissionsAtom,
  setAllCategoryPermissionsAtom,
  setCategoryPermissionAtom,
} from "../model/atoms";
import { DEFAULT_PERMISSIONS } from "../model/types";

describe("permission-settings atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("initializes with DEFAULT_PERMISSIONS", () => {
    const perms = store.get(categoryPermissionsAtom);
    expect(perms.get("read")).toBe("auto");
    expect(perms.get("write")).toBe("ask");
    expect(perms.get("delete")).toBe("ask");
    expect(perms.get("analysis")).toBe("auto");
  });

  it("setCategoryPermissionAtom updates a single category", () => {
    store.set(setCategoryPermissionAtom, { category: "read", permission: "block" });
    const perms = store.get(categoryPermissionsAtom);
    expect(perms.get("read")).toBe("block");
    // Others unchanged
    expect(perms.get("write")).toBe("ask");
  });

  it("setAllCategoryPermissionsAtom replaces all permissions", () => {
    const allAsk = new Map(DEFAULT_PERMISSIONS);
    allAsk.set("read", "ask");
    allAsk.set("search", "ask");
    allAsk.set("analysis", "ask");

    store.set(setAllCategoryPermissionsAtom, allAsk);
    const perms = store.get(categoryPermissionsAtom);
    expect(perms.get("read")).toBe("ask");
    expect(perms.get("search")).toBe("ask");
    expect(perms.get("analysis")).toBe("ask");
  });

  it("resetCategoryPermissionsAtom restores defaults", () => {
    store.set(setCategoryPermissionAtom, { category: "read", permission: "block" });
    store.set(setCategoryPermissionAtom, { category: "write", permission: "auto" });

    store.set(resetCategoryPermissionsAtom);

    const perms = store.get(categoryPermissionsAtom);
    expect(perms.get("read")).toBe("auto");
    expect(perms.get("write")).toBe("ask");
  });
});
