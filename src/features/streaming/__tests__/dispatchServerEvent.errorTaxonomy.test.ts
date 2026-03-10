import { createStore } from "jotai";

import { messageAtomFamily } from "~entities/message/core";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { createClassifiedError, createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId } from "../../../shared/protocol";

function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("CLASSIFY_ERROR serverEvent", () => {
  it("attaches classified error to existing message", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({
      id: "msg_1" as MessageId,
      text: "Something failed",
      status: "error",
    });
    const error = createClassifiedError({
      category: "network",
      code: "ECONNREFUSED",
      message: "Connection refused",
      retry_strategy: "retry_with_backoff",
      retry_after_ms: 3000,
    });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({ t: "CLASSIFY_ERROR", id: "msg_1" as MessageId, error });

    const updated = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(updated?.classified_error).toEqual(error);
    expect(updated?.classified_error?.category).toBe("network");
    expect(updated?.classified_error?.code).toBe("ECONNREFUSED");
    expect(updated?.classified_error?.retry_strategy).toBe("retry_with_backoff");
    expect(updated?.classified_error?.retry_after_ms).toBe(3000);
  });

  it("preserves existing message data when classifying error", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({
      id: "msg_1" as MessageId,
      text: "Agent encountered an issue",
      status: "error",
      error_detail: "Some raw error text",
    });
    const error = createClassifiedError({
      category: "model",
      message: "Context length exceeded",
    });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({ t: "CLASSIFY_ERROR", id: "msg_1" as MessageId, error });

    const updated = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(updated?.text).toBe("Agent encountered an issue");
    expect(updated?.status).toBe("error");
    expect(updated?.error_detail).toBe("Some raw error text");
    expect(updated?.classified_error?.category).toBe("model");
  });

  it("does nothing when message does not exist", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const error = createClassifiedError({
      category: "permission",
      message: "Access denied",
    });

    // Should not throw
    expect(() =>
      dispatch({ t: "CLASSIFY_ERROR", id: "nonexistent" as MessageId, error }),
    ).not.toThrow();

    expect(store.get(messageAtomFamily("nonexistent" as MessageId))).toBeNull();
  });

  it("overwrites previous classified error", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({
      id: "msg_1" as MessageId,
      status: "error",
    });
    const firstError = createClassifiedError({
      category: "network",
      message: "Timeout",
      retry_strategy: "auto_retry",
    });
    const secondError = createClassifiedError({
      category: "rate_limit",
      code: "429",
      message: "Too many requests",
      retry_strategy: "retry_with_backoff",
      retry_after_ms: 10000,
    });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({ t: "CLASSIFY_ERROR", id: "msg_1" as MessageId, error: firstError });
    dispatch({ t: "CLASSIFY_ERROR", id: "msg_1" as MessageId, error: secondError });

    const updated = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(updated?.classified_error?.category).toBe("rate_limit");
    expect(updated?.classified_error?.code).toBe("429");
    expect(updated?.classified_error?.retry_after_ms).toBe(10000);
  });

  it("works with all error categories", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const categories = [
      "network",
      "model",
      "tool",
      "permission",
      "rate_limit",
      "context_overflow",
      "unknown",
    ] as const;

    for (const category of categories) {
      const msgId = `msg_${category}` as MessageId;
      const msg = createMessage({ id: msgId, status: "error" });
      const error = createClassifiedError({ category, message: `${category} error` });

      dispatch({ t: "UPSERT_MESSAGE", msg });
      dispatch({ t: "CLASSIFY_ERROR", id: msgId, error });

      const updated = store.get(messageAtomFamily(msgId));
      expect(updated?.classified_error?.category).toBe(category);
    }
  });
});
