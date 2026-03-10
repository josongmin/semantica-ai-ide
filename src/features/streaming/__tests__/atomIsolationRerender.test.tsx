/**
 * SOTA Test: Atom Isolation Re-render Counting
 *
 * Proves that Jotai's atomFamily isolation actually prevents unnecessary
 * React re-renders. When APPEND_TEXT fires for msg_5, components subscribed
 * to msg_1-4 should NOT re-render.
 *
 * Uses render count tracking via vi.fn() spy wrappers — this is the ONLY
 * test in the suite that measures actual React render counts to verify
 * performance characteristics at the component level.
 */
import React from "react";
import { act, render, screen } from "@testing-library/react";
import { createStore, Provider, useAtomValue } from "jotai";

import { appendTextAtom, messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnOrderAtom } from "~entities/message/turns";
import { resetMessageStoreAtom, upsertMessageAtom, upsertTurnAtom } from "~entities/message/writers";

import { createMessage, createTurn, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";

// ─── Render-counting test component ──────────────────────
function createCountedMessageRow(renderSpy: (id: string) => void) {
  return React.memo(function CountedMessageRow({ messageId }: { messageId: MessageId }) {
    const msg = useAtomValue(messageAtomFamily(messageId));
    renderSpy(messageId);
    if (!msg) return null;
    return <div data-testid={`msg-${messageId}`}>{msg.text}</div>;
  });
}

function createCountedTurnOrderList(renderSpy: (id: string) => void) {
  return function CountedTurnOrderList() {
    const ids = useAtomValue(turnOrderAtom);
    renderSpy("turn-order");
    return <div data-testid="turn-order">{ids.join(",")}</div>;
  };
}

function createCountedMessageOrderList(renderSpy: (id: string) => void) {
  return function CountedMessageOrderList() {
    const ids = useAtomValue(messageOrderAtom);
    renderSpy("message-order");
    return <div data-testid="message-order">{ids.join(",")}</div>;
  };
}

// ─── Lifecycle ────────────────────────────────────────────
beforeEach(() => {
  resetIdCounter();
});

// ─── Tests ────────────────────────────────────────────────
describe("Atom Isolation: Re-render Counting", () => {
  it("APPEND_TEXT to msg_5 does NOT re-render msg_1..msg_4 components", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageRow = createCountedMessageRow(renderSpy);

    // Seed 5 messages
    const msgIds = Array.from({ length: 5 }, (_, i) => `msg_${i + 1}` as MessageId);
    for (const id of msgIds) {
      store.set(
        upsertMessageAtom,
        createMessage({ id, text: `Initial ${id}`, status: "streaming" }),
      );
    }

    function TestApp() {
      return (
        <Provider store={store}>
          {msgIds.map((id) => (
            <CountedMessageRow key={id} messageId={id} />
          ))}
        </Provider>
      );
    }

    render(<TestApp />);

    // Clear initial renders (React may double-render during mount in some environments)
    renderSpy.mockClear();

    // Append text ONLY to msg_5
    act(() => {
      store.set(appendTextAtom, { id: "msg_5" as MessageId, chunk: " appended" });
    });

    // ONLY msg_5 should have re-rendered
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledWith("msg_5" as MessageId);

    // msg_1-4 text should be unchanged
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByTestId(`msg-msg_${i}`)).toHaveTextContent(`Initial msg_${i}`);
    }
    // msg_5 should have the appended text
    expect(screen.getByTestId("msg-msg_5")).toHaveTextContent("Initial msg_5 appended");
  });

  it("50 sequential APPEND_TEXT to same message → exactly 50 re-renders of that message, 0 for others", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageRow = createCountedMessageRow(renderSpy);

    const msgIds = Array.from({ length: 3 }, (_, i) => `msg_${i}` as MessageId);
    for (const id of msgIds) {
      store.set(upsertMessageAtom, createMessage({ id, text: "", status: "streaming" }));
    }

    function TestApp() {
      return (
        <Provider store={store}>
          {msgIds.map((id) => (
            <CountedMessageRow key={id} messageId={id} />
          ))}
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();

    // 50 appends to msg_1 only
    for (let i = 0; i < 50; i++) {
      act(() => {
        store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: `[${i}]` });
      });
    }

    // Count per message
    const renderCounts = new Map<string, number>();
    for (const call of renderSpy.mock.calls) {
      const id = call[0] as string;
      renderCounts.set(id, (renderCounts.get(id) ?? 0) + 1);
    }

    expect(renderCounts.get("msg_0")).toBeUndefined(); // never re-rendered
    expect(renderCounts.get("msg_1")).toBe(50); // 50 appends = 50 renders
    expect(renderCounts.get("msg_2")).toBeUndefined(); // never re-rendered
  });

  it("upsertMessage does NOT re-render existing message components", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageRow = createCountedMessageRow(renderSpy);

    // Start with msg_1
    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_1" as MessageId, text: "First", status: "final" }),
    );

    function TestApp() {
      return (
        <Provider store={store}>
          <CountedMessageRow messageId={"msg_1" as MessageId} />
          <CountedMessageRow messageId={"msg_2" as MessageId} />
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();

    // Upsert a DIFFERENT message (msg_2)
    act(() => {
      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_2" as MessageId, text: "Second", status: "final" }),
      );
    });

    // msg_2 renders because its atom value changed (null → message)
    // msg_1 should NOT re-render (its atom value didn't change)
    const msg1Renders = renderSpy.mock.calls.filter((c) => c[0] === "msg_1").length;
    const msg2Renders = renderSpy.mock.calls.filter((c) => c[0] === "msg_2").length;
    expect(msg1Renders).toBe(0);
    expect(msg2Renders).toBe(1);
  });

  it("turnOrderAtom does NOT fire when APPEND_TEXT modifies a message", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedTurnOrder = createCountedTurnOrderList(renderSpy);

    store.set(upsertTurnAtom, createTurn({ id: "turn_1" as TurnId, status: "running" }));
    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
    );

    function TestApp() {
      return (
        <Provider store={store}>
          <CountedTurnOrder />
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();

    // 100 APPEND_TEXT operations — none should trigger turnOrderAtom
    for (let i = 0; i < 100; i++) {
      act(() => {
        store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: `x` });
      });
    }

    expect(renderSpy).not.toHaveBeenCalled();
  });

  it("messageOrderAtom does NOT fire on APPEND_TEXT (only on upsert of new message)", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageOrder = createCountedMessageOrderList(renderSpy);

    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
    );

    function TestApp() {
      return (
        <Provider store={store}>
          <CountedMessageOrder />
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();

    // 100 appends — should NOT trigger messageOrderAtom
    for (let i = 0; i < 100; i++) {
      act(() => {
        store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: `y` });
      });
    }

    expect(renderSpy).not.toHaveBeenCalled();

    // But adding a NEW message SHOULD trigger it
    act(() => {
      store.set(upsertMessageAtom, createMessage({ id: "msg_2" as MessageId, text: "new" }));
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("interleaved APPEND_TEXT across 10 messages: each component re-renders exactly N times", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageRow = createCountedMessageRow(renderSpy);

    const msgIds = Array.from({ length: 10 }, (_, i) => `msg_${i}` as MessageId);
    for (const id of msgIds) {
      store.set(upsertMessageAtom, createMessage({ id, text: "", status: "streaming" }));
    }

    function TestApp() {
      return (
        <Provider store={store}>
          {msgIds.map((id) => (
            <CountedMessageRow key={id} messageId={id} />
          ))}
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();

    // Round-robin: 20 appends per message (200 total)
    for (let round = 0; round < 20; round++) {
      for (const id of msgIds) {
        act(() => {
          store.set(appendTextAtom, { id, chunk: `[${round}]` });
        });
      }
    }

    // Count renders per message
    const counts = new Map<string, number>();
    for (const call of renderSpy.mock.calls) {
      const id = call[0] as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    // Each of 10 messages got 20 appends → exactly 20 re-renders each
    for (const id of msgIds) {
      expect(counts.get(id)).toBe(20);
    }
    // Total: exactly 200 (10 * 20), no extra re-renders
    expect(renderSpy).toHaveBeenCalledTimes(200);
  });

  it("resetMessageStore → order atom subscribers re-render, orphaned family atom subscribers do NOT", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageOrder = createCountedMessageOrderList(renderSpy);

    // Seed 4 messages
    const msgIds = Array.from({ length: 4 }, (_, i) => `msg_${i}` as MessageId);
    for (const id of msgIds) {
      store.set(upsertMessageAtom, createMessage({ id, text: `text ${id}`, status: "final" }));
    }

    // Also mount message rows with separate spy to verify family atom behavior
    const familySpy = vi.fn();
    const CountedMessageRow = createCountedMessageRow(familySpy);

    function TestApp() {
      return (
        <Provider store={store}>
          <CountedMessageOrder />
          {msgIds.map((id) => (
            <CountedMessageRow key={id} messageId={id} />
          ))}
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();
    familySpy.mockClear();

    act(() => {
      store.set(resetMessageStoreAtom);
    });

    // messageOrderAtom changes from [msg_0..msg_3] → [] → subscriber re-renders
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledWith("message-order");

    // atomFamily.remove() orphans existing subscriptions — components do NOT re-render.
    // This is the correct Jotai behavior: the real cleanup path is via
    // turnOrderAtom → [] → turn containers unmount → message rows unmount.
    expect(familySpy).not.toHaveBeenCalled();

    // Order atom shows empty
    expect(screen.getByTestId("message-order")).toHaveTextContent("");
  });

  it("batch atom updates in single act() → only the affected component renders, DOM state correct", () => {
    const store = createStore();
    const renderSpy = vi.fn();
    const CountedMessageRow = createCountedMessageRow(renderSpy);

    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_batch" as MessageId, text: "", status: "streaming" }),
    );

    function TestApp() {
      return (
        <Provider store={store}>
          <CountedMessageRow messageId={"msg_batch" as MessageId} />
        </Provider>
      );
    }

    render(<TestApp />);
    renderSpy.mockClear();

    // Multiple appends in a single act() — React batches state updates
    act(() => {
      store.set(appendTextAtom, { id: "msg_batch" as MessageId, chunk: "A" });
      store.set(appendTextAtom, { id: "msg_batch" as MessageId, chunk: "B" });
      store.set(appendTextAtom, { id: "msg_batch" as MessageId, chunk: "C" });
    });

    // Jotai fires subscription per set, but React batches within act()
    // So component may render 1-3 times depending on React's batching
    // The critical assertion: final DOM state is correct
    expect(screen.getByTestId("msg-msg_batch")).toHaveTextContent("ABC");
    // And no OTHER components were affected (only msg_batch rendered)
    const uniqueIds = new Set(renderSpy.mock.calls.map((c) => c[0]));
    expect(uniqueIds.size).toBe(1);
    expect(uniqueIds.has("msg_batch")).toBe(true);
  });
});
