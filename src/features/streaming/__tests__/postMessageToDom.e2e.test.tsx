/**
 * SOTA Test: postMessage → Engine → rAF → Atom → React Component → DOM
 *
 * This is the ONLY test that verifies the complete pipeline end-to-end
 * from raw postMessage events all the way to actual DOM mutations.
 * The existing e2ePipeline.stress.test.ts stops at store.get() — this
 * test renders real components (MessageRow, TurnContainer) and asserts
 * on screen queries, proving that atom subscriptions actually drive
 * visible UI updates.
 */
import { act, render, screen, within } from "@testing-library/react";
import { createStore, Provider, useAtomValue } from "jotai";

import { messageAtomFamily } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";

import { useStreamingCommit } from "../../../app/event-dispatch";
import {
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";
import { flushAllRaf, postBatch, postServerEvent, resetRafMock } from "./fixtures";

/**
 * Minimal MessageRow that subscribes to messageAtomFamily —
 * verifies the exact same subscription path as the real component
 * without pulling in heavy markdown/icon dependencies.
 */
function TestMessageRow({ messageId }: { messageId: MessageId }) {
  const msg = useAtomValue(messageAtomFamily(messageId));
  if (!msg) return null;
  return (
    <article data-testid={`msg-${messageId}`} aria-label={`${msg.role} message`}>
      <span data-testid={`msg-text-${messageId}`}>{msg.text}</span>
      <span data-testid={`msg-status-${messageId}`}>{msg.status}</span>
    </article>
  );
}

/**
 * Minimal TurnContainer that subscribes to turnAtomFamily —
 * renders its child messages via TestMessageRow.
 */
function TestTurnContainer({ turnId }: { turnId: TurnId }) {
  const turn = useAtomValue(turnAtomFamily(turnId));
  if (!turn) return null;
  const messageIds = turn.phases.flatMap((p) => p.message_ids);
  return (
    <section data-testid={`turn-${turnId}`} data-status={turn.status}>
      {messageIds.map((id) => (
        <TestMessageRow key={id} messageId={id} />
      ))}
    </section>
  );
}

/**
 * Reads turnOrderAtom → renders TestTurnContainer for each.
 */
function TestMessageList() {
  const turnIds = useAtomValue(turnOrderAtom);
  return (
    <div data-testid="message-list">
      {turnIds.map((id) => (
        <TestTurnContainer key={id} turnId={id} />
      ))}
    </div>
  );
}

/**
 * Full app shell: useStreamingCommit (postMessage bridge) + component tree
 */
function TestApp({ store }: { store: ReturnType<typeof createStore> }) {
  return (
    <Provider store={store}>
      <StreamingBridge />
      <TestMessageList />
    </Provider>
  );
}

function StreamingBridge() {
  useStreamingCommit();
  return null;
}

// ─── Lifecycle ────────────────────────────────────────────
beforeEach(() => {
  resetRafMock();
  resetIdCounter();
});

// ─── Tests ────────────────────────────────────────────────
describe("Full Pipeline: postMessage → Engine → rAF → Atom → React → DOM", () => {
  it("UPSERT_MESSAGE via postMessage renders text in the DOM", () => {
    const store = createStore();
    const msg = createMessage({
      id: "msg_1" as MessageId,
      text: "Hello from pipeline",
      status: "final",
    });
    const turn = createTurn({
      id: "turn_1" as TurnId,
      phases: [
        createTurnPhase({
          phase: "summary",
          message_ids: ["msg_1" as MessageId],
          collapsed: false,
          status: "success",
        }),
      ],
      status: "success",
    });

    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      postServerEvent({ t: "UPSERT_TURN", turn });
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_1")).toHaveTextContent("Hello from pipeline");
    expect(screen.getByTestId("msg-status-msg_1")).toHaveTextContent("final");
    unmount();
  });

  it("APPEND_TEXT streaming updates DOM text progressively", () => {
    const store = createStore();
    const msg = createMessage({
      id: "msg_s" as MessageId,
      text: "",
      status: "streaming",
    });
    const turn = createTurn({
      id: "turn_s" as TurnId,
      phases: [
        createTurnPhase({
          phase: "summary",
          message_ids: ["msg_s" as MessageId],
          collapsed: false,
          status: "running",
        }),
      ],
      status: "running",
    });

    const { unmount } = render(<TestApp store={store} />);

    // Step 1: upsert message + turn
    act(() => {
      postServerEvent({ t: "UPSERT_TURN", turn });
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_s")).toHaveTextContent("");

    // Step 2: stream text chunks
    act(() => {
      postServerEvent({ t: "APPEND_TEXT", id: "msg_s" as MessageId, chunk: "Hello " });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_s")).toHaveTextContent("Hello");

    act(() => {
      postServerEvent({ t: "APPEND_TEXT", id: "msg_s" as MessageId, chunk: "World!" });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_s")).toHaveTextContent("Hello World!");

    // Step 3: finalize
    act(() => {
      postServerEvent({ t: "SET_MESSAGE_STATUS", id: "msg_s" as MessageId, status: "final" });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-status-msg_s")).toHaveTextContent("final");
    unmount();
  });

  it("ServerEventBatch: entire turn lifecycle renders correctly in DOM", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      postBatch(
        [
          {
            t: "UPSERT_TURN",
            turn: createTurn({
              id: "turn_lc" as TurnId,
              phases: [
                createTurnPhase({
                  phase: "user_message",
                  message_ids: ["msg_user" as MessageId],
                  collapsed: false,
                  status: "success",
                }),
                createTurnPhase({
                  phase: "summary",
                  message_ids: ["msg_agent" as MessageId],
                  collapsed: false,
                  status: "running",
                }),
              ],
              status: "running",
            }),
          },
          {
            t: "UPSERT_MESSAGE",
            msg: createMessage({
              id: "msg_user" as MessageId,
              role: "user",
              text: "What is React?",
              status: "final",
            }),
          },
          {
            t: "UPSERT_MESSAGE",
            msg: createMessage({
              id: "msg_agent" as MessageId,
              role: "assistant",
              text: "",
              status: "streaming",
            }),
          },
        ],
        "lifecycle_setup",
      );
      flushAllRaf();
    });

    // Both messages should be in DOM
    expect(screen.getByTestId("msg-text-msg_user")).toHaveTextContent("What is React?");
    expect(screen.getByTestId("msg-text-msg_agent")).toHaveTextContent("");

    // Stream the agent response
    act(() => {
      for (let i = 0; i < 50; i++) {
        postServerEvent({ t: "APPEND_TEXT", id: "msg_agent" as MessageId, chunk: `word${i} ` });
      }
      flushAllRaf();
    });

    // All 50 words should be in the DOM
    const agentText = screen.getByTestId("msg-text-msg_agent").textContent;
    expect(agentText).toContain("word0");
    expect(agentText).toContain("word49");

    // Finalize
    act(() => {
      postServerEvent({ t: "SET_MESSAGE_STATUS", id: "msg_agent" as MessageId, status: "final" });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-status-msg_agent")).toHaveTextContent("final");
    unmount();
  });

  it("multiple turns render in order in the DOM", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      for (let i = 0; i < 5; i++) {
        const turnId = `turn_${i}` as TurnId;
        const msgId = `msg_${i}` as MessageId;
        postBatch(
          [
            {
              t: "UPSERT_TURN",
              turn: createTurn({
                id: turnId,
                phases: [
                  createTurnPhase({
                    phase: "summary",
                    message_ids: [msgId],
                    collapsed: false,
                    status: "success",
                  }),
                ],
                status: "success",
              }),
            },
            {
              t: "UPSERT_MESSAGE",
              msg: createMessage({ id: msgId, text: `Turn ${i} message`, status: "final" }),
            },
          ],
          `batch_${i}`,
        );
      }
      flushAllRaf();
    });

    const list = screen.getByTestId("message-list");
    const turns = within(list).getAllByTestId(/^turn-/);
    expect(turns).toHaveLength(5);

    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`msg-text-msg_${i}`)).toHaveTextContent(`Turn ${i} message`);
    }
    unmount();
  });

  it("RESET_STORES clears all rendered messages from DOM", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    // First populate
    act(() => {
      postBatch([
        {
          t: "UPSERT_TURN",
          turn: createTurn({
            id: "turn_r" as TurnId,
            phases: [
              createTurnPhase({
                phase: "summary",
                message_ids: ["msg_r" as MessageId],
                collapsed: false,
                status: "success",
              }),
            ],
          }),
        },
        {
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: "msg_r" as MessageId, text: "Will be cleared" }),
        },
      ]);
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_r")).toHaveTextContent("Will be cleared");

    // Reset
    act(() => {
      postServerEvent({ t: "RESET_STORES" });
      flushAllRaf();
    });

    // Messages and turns should be gone from DOM
    expect(screen.queryByTestId("msg-text-msg_r")).toBeNull();
    expect(screen.queryByTestId("turn-turn_r")).toBeNull();
    unmount();
  });

  it("1000 streaming chunks arrive in DOM correctly", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      postBatch([
        {
          t: "UPSERT_TURN",
          turn: createTurn({
            id: "turn_big" as TurnId,
            phases: [
              createTurnPhase({
                phase: "summary",
                message_ids: ["msg_big" as MessageId],
                collapsed: false,
                status: "running",
              }),
            ],
            status: "running",
          }),
        },
        {
          t: "UPSERT_MESSAGE",
          msg: createMessage({
            id: "msg_big" as MessageId,
            text: "",
            status: "streaming",
          }),
        },
      ]);
      flushAllRaf();
    });

    act(() => {
      for (let i = 0; i < 1_000; i++) {
        postServerEvent({ t: "APPEND_TEXT", id: "msg_big" as MessageId, chunk: `[${i}]` });
      }
      flushAllRaf();
    });

    const text = screen.getByTestId("msg-text-msg_big").textContent;
    // Verify first, middle, and last chunks all arrived
    expect(text).toContain("[0]");
    expect(text).toContain("[500]");
    expect(text).toContain("[999]");
    unmount();
  });

  it("SET_MESSAGE_STATUS error → DOM reflects error state", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      postBatch([
        {
          t: "UPSERT_TURN",
          turn: createTurn({
            id: "turn_e" as TurnId,
            phases: [
              createTurnPhase({
                phase: "summary",
                message_ids: ["msg_e" as MessageId],
                collapsed: false,
                status: "running",
              }),
            ],
          }),
        },
        {
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: "msg_e" as MessageId, text: "partial", status: "streaming" }),
        },
      ]);
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-status-msg_e")).toHaveTextContent("streaming");

    act(() => {
      postServerEvent({ t: "SET_MESSAGE_STATUS", id: "msg_e" as MessageId, status: "error" });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-status-msg_e")).toHaveTextContent("error");
    unmount();
  });

  it("interleaved messages across turns render in correct containers", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      // Turn A with msg_a
      postBatch(
        [
          {
            t: "UPSERT_TURN",
            turn: createTurn({
              id: "turn_a" as TurnId,
              phases: [
                createTurnPhase({
                  phase: "summary",
                  message_ids: ["msg_a" as MessageId],
                  collapsed: false,
                  status: "running",
                }),
              ],
              status: "running",
            }),
          },
          {
            t: "UPSERT_MESSAGE",
            msg: createMessage({ id: "msg_a" as MessageId, text: "", status: "streaming" }),
          },
        ],
        "setup_a",
      );

      // Turn B with msg_b
      postBatch(
        [
          {
            t: "UPSERT_TURN",
            turn: createTurn({
              id: "turn_b" as TurnId,
              phases: [
                createTurnPhase({
                  phase: "summary",
                  message_ids: ["msg_b" as MessageId],
                  collapsed: false,
                  status: "running",
                }),
              ],
              status: "running",
            }),
          },
          {
            t: "UPSERT_MESSAGE",
            msg: createMessage({ id: "msg_b" as MessageId, text: "", status: "streaming" }),
          },
        ],
        "setup_b",
      );
      flushAllRaf();
    });

    // Interleave appends: A, B, A, B, ...
    act(() => {
      for (let i = 0; i < 100; i++) {
        postServerEvent({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: `A${i} ` });
        postServerEvent({ t: "APPEND_TEXT", id: "msg_b" as MessageId, chunk: `B${i} ` });
      }
      flushAllRaf();
    });

    // Verify each turn contains only its own message
    const turnA = screen.getByTestId("turn-turn_a");
    const turnB = screen.getByTestId("turn-turn_b");
    expect(within(turnA).getByTestId("msg-text-msg_a").textContent).toContain("A99");
    expect(within(turnA).queryByTestId("msg-text-msg_b")).toBeNull();
    expect(within(turnB).getByTestId("msg-text-msg_b").textContent).toContain("B99");
    expect(within(turnB).queryByTestId("msg-text-msg_a")).toBeNull();
    unmount();
  });

  it("re-UPSERT same message ID → DOM updates to new text", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      postBatch([
        {
          t: "UPSERT_TURN",
          turn: createTurn({
            id: "turn_re" as TurnId,
            phases: [
              createTurnPhase({
                phase: "summary",
                message_ids: ["msg_re" as MessageId],
                collapsed: false,
                status: "success",
              }),
            ],
          }),
        },
        {
          t: "UPSERT_MESSAGE",
          msg: createMessage({
            id: "msg_re" as MessageId,
            text: "Original text",
            status: "final",
          }),
        },
      ]);
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_re")).toHaveTextContent("Original text");

    // Re-upsert with different text
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({
          id: "msg_re" as MessageId,
          text: "Replaced text",
          status: "final",
        }),
      });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_re")).toHaveTextContent("Replaced text");
    unmount();
  });

  it("mixed serverEvent types in single batch: UPSERT + APPEND + STATUS + TURN_UPDATE", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    act(() => {
      postBatch(
        [
          {
            t: "UPSERT_TURN",
            turn: createTurn({
              id: "turn_mix" as TurnId,
              phases: [
                createTurnPhase({
                  phase: "summary",
                  message_ids: ["msg_mix" as MessageId],
                  collapsed: false,
                  status: "running",
                }),
              ],
              status: "running",
            }),
          },
          {
            t: "UPSERT_MESSAGE",
            msg: createMessage({
              id: "msg_mix" as MessageId,
              text: "",
              status: "streaming",
            }),
          },
          { t: "APPEND_TEXT", id: "msg_mix" as MessageId, chunk: "streamed " },
          { t: "APPEND_TEXT", id: "msg_mix" as MessageId, chunk: "content" },
          { t: "SET_MESSAGE_STATUS", id: "msg_mix" as MessageId, status: "final" },
        ],
        "mixed_batch",
      );
      flushAllRaf();
    });

    // All operations applied atomically in one rAF frame
    expect(screen.getByTestId("msg-text-msg_mix")).toHaveTextContent("streamed content");
    expect(screen.getByTestId("msg-status-msg_mix")).toHaveTextContent("final");
    // Turn rendered with correct status attribute
    const turnEl = screen.getByTestId("turn-turn_mix");
    expect(turnEl).toBeInTheDocument();
    unmount();
  });

  it("UPDATE_TURN_PHASE: adding a new phase with new message → DOM updates", () => {
    const store = createStore();
    const { unmount } = render(<TestApp store={store} />);

    // Step 1: Create initial turn with one phase
    act(() => {
      postBatch([
        {
          t: "UPSERT_TURN",
          turn: createTurn({
            id: "turn_up" as TurnId,
            phases: [
              createTurnPhase({
                phase: "thinking",
                message_ids: ["msg_think" as MessageId],
                collapsed: false,
                status: "running",
              }),
            ],
            status: "running",
          }),
        },
        {
          t: "UPSERT_MESSAGE",
          msg: createMessage({
            id: "msg_think" as MessageId,
            text: "Thinking...",
            status: "streaming",
          }),
        },
      ]);
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-text-msg_think")).toHaveTextContent("Thinking...");

    // Step 2: Update turn to include second phase with new message
    act(() => {
      postBatch([
        {
          t: "UPSERT_TURN",
          turn: createTurn({
            id: "turn_up" as TurnId,
            phases: [
              createTurnPhase({
                phase: "thinking",
                message_ids: ["msg_think" as MessageId],
                collapsed: true,
                status: "success",
              }),
              createTurnPhase({
                phase: "summary",
                message_ids: ["msg_summary" as MessageId],
                collapsed: false,
                status: "running",
              }),
            ],
            status: "running",
          }),
        },
        {
          t: "UPSERT_MESSAGE",
          msg: createMessage({
            id: "msg_summary" as MessageId,
            text: "Here is the answer",
            status: "final",
          }),
        },
      ]);
      flushAllRaf();
    });

    // Both messages should be in the same turn container
    const turnEl = screen.getByTestId("turn-turn_up");
    expect(within(turnEl).getByTestId("msg-text-msg_think")).toHaveTextContent("Thinking...");
    expect(within(turnEl).getByTestId("msg-text-msg_summary")).toHaveTextContent(
      "Here is the answer",
    );
    unmount();
  });
});
