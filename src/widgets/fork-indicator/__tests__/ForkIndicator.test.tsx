import { createStore } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import {
  createForkedSessionMeta,
  createSessionMeta,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { SessionId, TurnId } from "../../../shared/protocol";

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
describe("Session Fork", () => {
  describe("FORK_SESSION serverEvent", () => {
    it("sets forked_from on session meta", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Set initial session
      dispatch({ t: "SET_SESSION_META", meta: { status: "running", model_label: "Opus" } });

      dispatch({
        t: "FORK_SESSION",
        source_session_id: "session_old" as SessionId,
        source_turn_id: "turn_5" as TurnId,
        new_session_id: "session_new" as SessionId,
      });

      const meta = store.get(sessionMetaAtom);
      expect(meta.forked_from).toEqual({
        session_id: "session_old",
        turn_id: "turn_5",
      });
    });

    it("preserves other meta fields when forking", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_SESSION_META",
        meta: { status: "running", model_label: "Opus", cost_usd: 0.5 },
      });

      dispatch({
        t: "FORK_SESSION",
        source_session_id: "session_old" as SessionId,
        source_turn_id: "turn_3" as TurnId,
        new_session_id: "session_new" as SessionId,
      });

      const meta = store.get(sessionMetaAtom);
      expect(meta.model_label).toBe("Opus");
      expect(meta.cost_usd).toBe(0.5);
      expect(meta.forked_from?.session_id).toBe("session_old");
    });
  });

  describe("SessionMeta forked_from field", () => {
    it("SessionMeta can have forked_from", () => {
      const meta = createForkedSessionMeta("source_session" as SessionId, "source_turn" as TurnId);

      expect(meta.forked_from).toEqual({
        session_id: "source_session",
        turn_id: "source_turn",
      });
    });

    it("forked_from is optional", () => {
      const meta = createSessionMeta();
      expect(meta.forked_from).toBeUndefined();
    });
  });

  describe("factory helpers", () => {
    it("createForkedSessionMeta creates meta with fork info", () => {
      const meta = createForkedSessionMeta("src_session" as SessionId, "src_turn" as TurnId, {
        model_label: "Custom Model",
      });

      expect(meta.forked_from?.session_id).toBe("src_session");
      expect(meta.forked_from?.turn_id).toBe("src_turn");
      expect(meta.model_label).toBe("Custom Model");
    });
  });
});
