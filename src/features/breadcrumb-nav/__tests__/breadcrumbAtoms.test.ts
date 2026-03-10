import { createStore } from "jotai";

import type { TurnId } from "../../../shared/protocol";
import {
  breadcrumbContextAtom,
  clearBreadcrumbBelowAtom,
  resetBreadcrumbContextAtom,
  setBreadcrumbContextAtom,
} from "../model/breadcrumbAtoms";

describe("breadcrumbAtoms", () => {
  it("starts with empty context", () => {
    const store = createStore();
    expect(store.get(breadcrumbContextAtom)).toEqual({});
  });

  it("setBreadcrumbContextAtom merges partial updates", () => {
    const store = createStore();

    store.set(setBreadcrumbContextAtom, { session_name: "My Session" });
    expect(store.get(breadcrumbContextAtom)).toEqual({ session_name: "My Session" });

    store.set(setBreadcrumbContextAtom, { turn_id: "turn_1" as TurnId, turn_label: "Turn 1" });
    expect(store.get(breadcrumbContextAtom)).toEqual({
      session_name: "My Session",
      turn_id: "turn_1",
      turn_label: "Turn 1",
    });
  });

  it("setBreadcrumbContextAtom overwrites existing fields", () => {
    const store = createStore();

    store.set(setBreadcrumbContextAtom, { session_name: "First" });
    store.set(setBreadcrumbContextAtom, { session_name: "Second" });

    expect(store.get(breadcrumbContextAtom).session_name).toBe("Second");
  });

  it("clearBreadcrumbBelowAtom(session) keeps only session", () => {
    const store = createStore();
    store.set(setBreadcrumbContextAtom, {
      session_name: "Session",
      turn_id: "t1" as TurnId,
      turn_label: "Turn",
      file_path: "src/app.ts",
      symbol_name: "main",
    });

    store.set(clearBreadcrumbBelowAtom, "session");

    const ctx = store.get(breadcrumbContextAtom);
    expect(ctx.session_name).toBe("Session");
    expect(ctx.turn_id).toBeUndefined();
    expect(ctx.file_path).toBeUndefined();
    expect(ctx.symbol_name).toBeUndefined();
  });

  it("clearBreadcrumbBelowAtom(turn) keeps session + turn", () => {
    const store = createStore();
    store.set(setBreadcrumbContextAtom, {
      session_name: "Session",
      turn_id: "t1" as TurnId,
      turn_label: "Turn",
      file_path: "src/app.ts",
      symbol_name: "main",
    });

    store.set(clearBreadcrumbBelowAtom, "turn");

    const ctx = store.get(breadcrumbContextAtom);
    expect(ctx.session_name).toBe("Session");
    expect(ctx.turn_id).toBe("t1");
    expect(ctx.turn_label).toBe("Turn");
    expect(ctx.file_path).toBeUndefined();
    expect(ctx.symbol_name).toBeUndefined();
  });

  it("clearBreadcrumbBelowAtom(file) keeps session + turn + file", () => {
    const store = createStore();
    store.set(setBreadcrumbContextAtom, {
      session_name: "Session",
      turn_id: "t1" as TurnId,
      turn_label: "Turn",
      file_path: "src/app.ts",
      symbol_name: "main",
    });

    store.set(clearBreadcrumbBelowAtom, "file");

    const ctx = store.get(breadcrumbContextAtom);
    expect(ctx.session_name).toBe("Session");
    expect(ctx.turn_id).toBe("t1");
    expect(ctx.file_path).toBe("src/app.ts");
    expect(ctx.symbol_name).toBeUndefined();
  });

  it("clearBreadcrumbBelowAtom(symbol) keeps everything", () => {
    const store = createStore();
    store.set(setBreadcrumbContextAtom, {
      session_name: "Session",
      turn_id: "t1" as TurnId,
      turn_label: "Turn",
      file_path: "src/app.ts",
      symbol_name: "main",
    });

    store.set(clearBreadcrumbBelowAtom, "symbol");

    const ctx = store.get(breadcrumbContextAtom);
    expect(ctx.session_name).toBe("Session");
    expect(ctx.turn_id).toBe("t1");
    expect(ctx.file_path).toBe("src/app.ts");
    expect(ctx.symbol_name).toBe("main");
  });

  it("resetBreadcrumbContextAtom clears all fields", () => {
    const store = createStore();
    store.set(setBreadcrumbContextAtom, {
      session_name: "Session",
      turn_id: "t1" as TurnId,
      file_path: "src/app.ts",
    });

    store.set(resetBreadcrumbContextAtom);

    expect(store.get(breadcrumbContextAtom)).toEqual({});
  });
});
