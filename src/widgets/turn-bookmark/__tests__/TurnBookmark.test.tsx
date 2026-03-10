import { createStore } from "jotai";

import { turnAtomFamily } from "~entities/message/turns";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import {
  bookmarkDrawerOpenAtom,
  bookmarkedTurnIdsAtom,
  bookmarkFilterAtom,
  bookmarkLabelsAtom,
  toggleBookmarkAtom,
} from "../../../features/turn-bookmark";
import { createBookmarkedTurn, createTurn, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";

// ─── Mocks ─────────────────────────────────────────────────
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

// ─── Tests ─────────────────────────────────────────────────
describe("Turn Bookmark", () => {
  describe("bookmark atoms", () => {
    it("toggleBookmarkAtom adds a bookmark", () => {
      const store = createStore();
      const turnId = "turn_1" as TurnId;

      store.set(toggleBookmarkAtom, {
        turn_id: turnId,
        bookmarked: true,
        bookmark_label: "decision",
      });

      expect(store.get(bookmarkedTurnIdsAtom).has(turnId)).toBe(true);
      expect(store.get(bookmarkLabelsAtom).get(turnId)).toBe("decision");
    });

    it("toggleBookmarkAtom removes a bookmark", () => {
      const store = createStore();
      const turnId = "turn_1" as TurnId;

      // Add then remove
      store.set(toggleBookmarkAtom, {
        turn_id: turnId,
        bookmarked: true,
        bookmark_label: "fix",
      });
      store.set(toggleBookmarkAtom, {
        turn_id: turnId,
        bookmarked: false,
      });

      expect(store.get(bookmarkedTurnIdsAtom).has(turnId)).toBe(false);
      expect(store.get(bookmarkLabelsAtom).has(turnId)).toBe(false);
    });

    it("supports multiple bookmarks with different labels", () => {
      const store = createStore();
      const turn1 = "turn_1" as TurnId;
      const turn2 = "turn_2" as TurnId;
      const turn3 = "turn_3" as TurnId;

      store.set(toggleBookmarkAtom, {
        turn_id: turn1,
        bookmarked: true,
        bookmark_label: "decision",
      });
      store.set(toggleBookmarkAtom, { turn_id: turn2, bookmarked: true, bookmark_label: "fix" });
      store.set(toggleBookmarkAtom, { turn_id: turn3, bookmarked: true, bookmark_label: "risk" });

      expect(store.get(bookmarkedTurnIdsAtom).size).toBe(3);
      expect(store.get(bookmarkLabelsAtom).get(turn1)).toBe("decision");
      expect(store.get(bookmarkLabelsAtom).get(turn2)).toBe("fix");
      expect(store.get(bookmarkLabelsAtom).get(turn3)).toBe("risk");
    });

    it("bookmark filter defaults to all", () => {
      const store = createStore();
      expect(store.get(bookmarkFilterAtom)).toBe("all");
    });

    it("bookmark drawer defaults to closed", () => {
      const store = createStore();
      expect(store.get(bookmarkDrawerOpenAtom)).toBe(false);
    });
  });

  describe("TOGGLE_TURN_BOOKMARK serverEvent", () => {
    it("adds bookmark via serverEvent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const turn = createTurn({ id: "turn_1" as TurnId });

      dispatch({ t: "UPSERT_TURN", turn });
      dispatch({
        t: "TOGGLE_TURN_BOOKMARK",
        turn_id: "turn_1" as TurnId,
        bookmarked: true,
        bookmark_label: "decision",
      });

      // Turn entity updated
      const updatedTurn = store.get(turnAtomFamily("turn_1" as TurnId));
      expect(updatedTurn?.bookmarked).toBe(true);
      expect(updatedTurn?.bookmark_label).toBe("decision");

      // Bookmark tracking updated
      expect(store.get(bookmarkedTurnIdsAtom).has("turn_1" as TurnId)).toBe(true);
    });

    it("removes bookmark via serverEvent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const turn = createTurn({ id: "turn_1" as TurnId });

      dispatch({ t: "UPSERT_TURN", turn });
      dispatch({
        t: "TOGGLE_TURN_BOOKMARK",
        turn_id: "turn_1" as TurnId,
        bookmarked: true,
        bookmark_label: "fix",
      });
      dispatch({
        t: "TOGGLE_TURN_BOOKMARK",
        turn_id: "turn_1" as TurnId,
        bookmarked: false,
      });

      const updatedTurn = store.get(turnAtomFamily("turn_1" as TurnId));
      expect(updatedTurn?.bookmarked).toBe(false);
      expect(store.get(bookmarkedTurnIdsAtom).has("turn_1" as TurnId)).toBe(false);
    });
  });

  describe("factory helpers", () => {
    it("createBookmarkedTurn creates turn with bookmark fields", () => {
      const turn = createBookmarkedTurn("decision");
      expect(turn.bookmarked).toBe(true);
      expect(turn.bookmark_label).toBe("decision");
    });

    it("createBookmarkedTurn supports overrides", () => {
      const turn = createBookmarkedTurn("risk", { status: "success" });
      expect(turn.bookmarked).toBe(true);
      expect(turn.bookmark_label).toBe("risk");
      expect(turn.status).toBe("success");
    });
  });
});
