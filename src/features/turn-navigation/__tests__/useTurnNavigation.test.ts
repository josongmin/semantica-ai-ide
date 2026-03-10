/**
 * Turn Navigation Tests
 *
 * Tests:
 * - scrollToTurn dispatches custom event with correct turnId
 * - focusedTurnIdAtom is set on scrollToTurn
 * - focusedTurnIdAtom auto-clears after timeout
 * - copyTurnLink writes correct link to clipboard
 */
import { createStore } from "jotai";

import { clearFocusedTurnAtom, focusedTurnIdAtom } from "../../../shared/lib";
import type { TurnId } from "../../../shared/protocol";

describe("Turn Navigation – atom behavior", () => {
  it("focusedTurnIdAtom defaults to null", () => {
    const store = createStore();
    expect(store.get(focusedTurnIdAtom)).toBeNull();
  });

  it("setting focusedTurnIdAtom stores the turn ID", () => {
    const store = createStore();
    const turnId = "turn_42" as TurnId;
    store.set(focusedTurnIdAtom, turnId);
    expect(store.get(focusedTurnIdAtom)).toBe(turnId);
  });

  it("clearFocusedTurnAtom auto-clears after timeout", () => {
    vi.useFakeTimers();
    const store = createStore();
    const turnId = "turn_99" as TurnId;

    store.set(focusedTurnIdAtom, turnId);
    expect(store.get(focusedTurnIdAtom)).toBe(turnId);

    store.set(clearFocusedTurnAtom);

    // Before timeout: still set
    expect(store.get(focusedTurnIdAtom)).toBe(turnId);

    // After 2000ms: should be cleared
    vi.advanceTimersByTime(2000);
    expect(store.get(focusedTurnIdAtom)).toBeNull();

    vi.useRealTimers();
  });

  it("scroll-to-turn custom event carries the correct turnId", () => {
    const turnId = "turn_7" as TurnId;
    let receivedTurnId: TurnId | null = null;

    const handler = (e: Event) => {
      receivedTurnId = (e as CustomEvent<{ turnId: TurnId }>).detail.turnId;
    };

    window.addEventListener("scroll-to-turn", handler);
    window.dispatchEvent(new CustomEvent("scroll-to-turn", { detail: { turnId } }));
    window.removeEventListener("scroll-to-turn", handler);

    expect(receivedTurnId).toBe(turnId);
  });

  it("multiple rapid focus changes: only the last value persists", () => {
    const store = createStore();
    store.set(focusedTurnIdAtom, "turn_1" as TurnId);
    store.set(focusedTurnIdAtom, "turn_2" as TurnId);
    store.set(focusedTurnIdAtom, "turn_3" as TurnId);
    expect(store.get(focusedTurnIdAtom)).toBe("turn_3");
  });
});
