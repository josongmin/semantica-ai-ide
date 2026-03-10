import { createStore } from "jotai";

import { messageAtomFamily } from "~entities/message/core";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { clearPendingQuoteAtom, pendingQuoteAtom, setPendingQuoteAtom } from "../../../shared/lib";
import { createMessage, createQuotedMessage, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId } from "../../../shared/protocol";

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
describe("Quote Reply", () => {
  describe("pendingQuoteAtom", () => {
    it("defaults to null", () => {
      const store = createStore();
      expect(store.get(pendingQuoteAtom)).toBeNull();
    });

    it("setPendingQuoteAtom sets a quote", () => {
      const store = createStore();
      const msgId = "msg_1" as MessageId;

      store.set(setPendingQuoteAtom, { message_id: msgId, text: "Some quoted text" });

      const quote = store.get(pendingQuoteAtom);
      expect(quote).toEqual({ message_id: msgId, text: "Some quoted text" });
    });

    it("clearPendingQuoteAtom clears the quote", () => {
      const store = createStore();
      const msgId = "msg_1" as MessageId;

      store.set(setPendingQuoteAtom, { message_id: msgId, text: "Some text" });
      expect(store.get(pendingQuoteAtom)).not.toBeNull();

      store.set(clearPendingQuoteAtom);
      expect(store.get(pendingQuoteAtom)).toBeNull();
    });
  });

  describe("SET_QUOTE_CONTEXT serverEvent", () => {
    it("sets pending quote via serverEvent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_QUOTE_CONTEXT",
        message_id: "msg_1" as MessageId,
        quoted_text: "This is the quoted text",
      });

      const quote = store.get(pendingQuoteAtom);
      expect(quote).toEqual({
        message_id: "msg_1",
        text: "This is the quoted text",
      });
    });
  });

  describe("UiMessage with quote fields", () => {
    it("message can have quoted_message_id and quoted_text", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const originalMsg = createMessage({ id: "msg_1" as MessageId, text: "Original message" });
      const replyMsg = createQuotedMessage("msg_1" as MessageId, "Original message", {
        id: "msg_2" as MessageId,
        text: "My reply",
      });

      dispatch({ t: "UPSERT_MESSAGE", msg: originalMsg });
      dispatch({ t: "UPSERT_MESSAGE", msg: replyMsg });

      const stored = store.get(messageAtomFamily("msg_2" as MessageId));
      expect(stored?.quoted_message_id).toBe("msg_1");
      expect(stored?.quoted_text).toBe("Original message");
      expect(stored?.text).toBe("My reply");
    });
  });

  describe("factory helpers", () => {
    it("createQuotedMessage creates message with quote fields", () => {
      const msg = createQuotedMessage("msg_original" as MessageId, "Some quoted text", {
        text: "Reply text",
      });
      expect(msg.quoted_message_id).toBe("msg_original");
      expect(msg.quoted_text).toBe("Some quoted text");
      expect(msg.text).toBe("Reply text");
    });
  });
});
