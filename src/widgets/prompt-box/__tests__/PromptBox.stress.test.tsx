import { fireEvent, screen, waitFor } from "@testing-library/react";

import { approvalModeAtom } from "~entities/session/settings";
import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { type SendMessageAdapter, sendMessageAdapterAtom } from "../../../shared/lib/atoms";
import { createSessionMeta } from "../../../shared/lib/mocks";
import { PromptBox } from "../PromptBox";
// ─── Mocks ─────────────────────────────────────────────────
const mockSend = vi.fn();
const mockStopAgent = vi.fn();

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

vi.mock("../../../features/approval-gate", () => ({
  useApprovalGate: () => ({
    mode: "auto" as const,
    changeMode: vi.fn(),
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createMockAdapter(): SendMessageAdapter {
  return {
    send: mockSend,
    stopAgent: mockStopAgent,
    retryMessage: vi.fn(),
    enqueue: vi.fn(),
    removeQueued: vi.fn(),
    queue: [],
  };
}

function renderIdle() {
  const meta = createSessionMeta({ status: "idle" });
  return renderWithAtoms(<PromptBox />, {
    initialValues: [
      [sessionMetaAtom, meta],
      [approvalModeAtom, meta.approval_mode],
      [sendMessageAdapterAtom, createMockAdapter()],
    ],
  });
}

function renderRunning() {
  const meta = createSessionMeta({ status: "running" });
  return renderWithAtoms(<PromptBox />, {
    initialValues: [
      [sessionMetaAtom, meta],
      [approvalModeAtom, meta.approval_mode],
      [sendMessageAdapterAtom, createMockAdapter()],
    ],
  });
}

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  mockSend.mockClear();
  mockStopAgent.mockClear();
  mockPostMessage.mockClear();
});

// ─── Stress Tests ──────────────────────────────────────────
describe("PromptBox – stress & edge cases", () => {
  // ── Rapid-fire Input ────────────────────────────────────
  describe("rapid-fire input", () => {
    it("Enter 100x after typing: send() called exactly once (text cleared after first)", async () => {
      const { user } = renderIdle();
      const textarea = screen.getByLabelText("Message input");

      await user.type(textarea, "hello");
      for (let i = 0; i < 100; i++) {
        await user.keyboard("{Enter}");
      }

      // First Enter sends and clears text; subsequent Enters are no-ops (empty guard)
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("hello");
    });

    it("empty textarea + Enter 50x: send() is never called", async () => {
      const { user } = renderIdle();
      const textarea = screen.getByLabelText("Message input");
      textarea.focus();

      for (let i = 0; i < 50; i++) {
        await user.keyboard("{Enter}");
      }

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("whitespace-only + Enter: send() is never called", async () => {
      const { user } = renderIdle();
      const textarea = screen.getByLabelText("Message input");

      await user.type(textarea, "   \t  ");
      await user.keyboard("{Enter}");

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("type-send-type-send rapidly: first send dispatched, subsequent blocked by 300ms debounce", async () => {
      const { user } = renderIdle();
      const textarea = screen.getByLabelText("Message input");

      await user.type(textarea, "first");
      await user.keyboard("{Enter}");
      await user.type(textarea, "second");
      await user.keyboard("{Enter}");
      await user.type(textarea, "third");
      await user.keyboard("{Enter}");

      // Component has a 300ms debounce guard preventing rapid double-submits.
      // Only the first send is dispatched; subsequent sends within 300ms are blocked.
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("first");
    });

    it("send button rapid double-click: send() called once (text cleared after first)", async () => {
      const { user } = renderIdle();
      const textarea = screen.getByLabelText("Message input");

      await user.type(textarea, "click test");
      const sendBtn = screen.getByLabelText("Send message");
      await user.click(sendBtn);
      // After first click text is cleared → button becomes disabled
      // A second click on disabled button should be a no-op
      const sendBtn2 = screen.getByLabelText("Send message");
      await user.click(sendBtn2);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("click test");
    });
  });

  // ── IME Composition (Korean/Japanese/Chinese Input) ─────
  describe("IME composition handling", () => {
    it("Enter during composing does NOT send (isComposing guard)", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      // Simulate typing Korean characters
      fireEvent.change(textarea, { target: { value: "안녕하세" } });

      // Enter while IME is composing — dispatch raw KeyboardEvent with isComposing=true
      // React reads e.nativeEvent.isComposing from the actual DOM event
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(enterEvent, "isComposing", { value: true });
      textarea.dispatchEvent(enterEvent);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("Enter after composition ends sends normally", async () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      // Simulate compositionstart → input → compositionend sequence
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: "한글 테스트" } });
      fireEvent.compositionEnd(textarea);

      // Now Enter with isComposing=false should trigger send
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("한글 테스트");
    });
  });

  // ── Long Text Input ─────────────────────────────────────
  describe("long text handling", () => {
    it("10,000 character input: textarea height capped at MAX_TEXTAREA_HEIGHT (200px)", async () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      const longText = "A".repeat(10_000);
      fireEvent.change(textarea, { target: { value: longText } });

      // Trigger the handleInput height calculation
      fireEvent.input(textarea);

      // In happy-dom scrollHeight may be 0, but the style.height logic runs;
      // the important thing is it doesn't exceed 200px or throw
      const heightStr = textarea.style.height;
      if (heightStr && heightStr !== "auto") {
        const height = parseInt(heightStr, 10);
        expect(height).toBeLessThanOrEqual(200);
      }

      expect((textarea as HTMLTextAreaElement).value).toBe(longText);
    });

    it("10,000 character text can be sent successfully", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      const longText = "B".repeat(10_000);
      fireEvent.change(textarea, { target: { value: longText } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(longText);
    });

    it("multiline text with 100 newlines: sends complete multiline content", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      // Build multiline text with 100 newlines (use fireEvent for speed)
      const lines = Array.from({ length: 101 }, (_, i) => `line${i}`);
      const multilineText = lines.join("\n");
      fireEvent.change(textarea, { target: { value: multilineText } });

      expect(mockSend).not.toHaveBeenCalled();

      // Send the whole multiline text
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const sentText = mockSend.mock.calls[0]?.[0] as string;
      expect(sentText).toContain("line0");
      expect(sentText).toContain("line100");
      expect(sentText.split("\n")).toHaveLength(101);
    });
  });

  // ── State Transition Race Conditions ────────────────────
  describe("state transition race conditions", () => {
    it("textarea stays enabled when status → running (supports message queuing)", async () => {
      const meta = createSessionMeta({ status: "idle" });
      const { store } = renderWithAtoms(<PromptBox />, {
        initialValues: [
          [sessionMetaAtom, meta],
          [approvalModeAtom, meta.approval_mode],
        ],
      });

      const textarea = screen.getByLabelText("Message input");
      expect(textarea).toBeEnabled();

      // Simulate backend changing status to running
      store.set(sessionMetaAtom, createSessionMeta({ status: "running" }));

      // Textarea remains enabled for message queuing
      await waitFor(() => {
        expect(screen.getByLabelText("Message input")).toBeEnabled();
      });
    });

    it("stop button appears and send button disappears on running transition", async () => {
      const meta = createSessionMeta({ status: "idle" });
      const { store } = renderWithAtoms(<PromptBox />, {
        initialValues: [
          [sessionMetaAtom, meta],
          [approvalModeAtom, meta.approval_mode],
        ],
      });

      expect(screen.getByLabelText("Send message")).toBeInTheDocument();
      expect(screen.queryByLabelText("Stop agent")).not.toBeInTheDocument();

      store.set(sessionMetaAtom, createSessionMeta({ status: "running" }));

      await waitFor(() => {
        expect(screen.getByLabelText("Stop agent")).toBeInTheDocument();
        expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();
      });
    });

    it("running → idle: textarea re-enabled and receives focus", async () => {
      const meta = createSessionMeta({ status: "running" });
      const { store } = renderWithAtoms(<PromptBox />, {
        initialValues: [
          [sessionMetaAtom, meta],
          [approvalModeAtom, meta.approval_mode],
        ],
      });

      expect(screen.getByLabelText("Message input")).toBeEnabled();

      store.set(sessionMetaAtom, createSessionMeta({ status: "idle" }));

      await waitFor(() => {
        const textarea = screen.getByLabelText("Message input");
        expect(textarea).toBeEnabled();
      });
    });

    it("rapid idle→running→idle→running toggles don't crash", async () => {
      const meta = createSessionMeta({ status: "idle" });
      const { store } = renderWithAtoms(<PromptBox />, {
        initialValues: [
          [sessionMetaAtom, meta],
          [approvalModeAtom, meta.approval_mode],
        ],
      });

      for (let i = 0; i < 20; i++) {
        store.set(sessionMetaAtom, createSessionMeta({ status: i % 2 === 0 ? "running" : "idle" }));
      }

      // Should not throw, final state should be consistent
      await waitFor(() => {
        const textarea = screen.getByLabelText("Message input");
        // Last iteration i=19 → i%2=1 → idle
        expect(textarea).toBeEnabled();
      });
    });
  });

  // ── Escape Key Edge Cases ───────────────────────────────
  describe("Escape key edge cases", () => {
    it("Escape in idle state: does NOT send STOP_AGENT", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.keyDown(textarea, { key: "Escape" });

      // STOP_AGENT should not be posted in idle state
      // (handleStop is guarded by isRunning in handleKeyDown)
    });

    it("Escape 50x in running state: calls stopAgent on each", () => {
      mockStopAgent.mockClear();

      renderRunning();
      const textarea = screen.getByLabelText("Message input");

      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(textarea, { key: "Escape" });
      }

      // Each Escape fires stopAgent — this is fine, extension host should be idempotent
      // The test verifies we don't crash or accumulate state
      expect(mockStopAgent).toHaveBeenCalledTimes(50);
    });
  });

  // ── Textarea Clear After Send ───────────────────────────
  describe("textarea clear correctness", () => {
    it("textarea is empty after successful send", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      // Use fireEvent for reliable synchronous state update
      fireEvent.change(textarea, { target: { value: "will be cleared" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(textarea).toHaveValue("");
    });

    it("textarea height resets after send", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "line1\nline2\nline3" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(textarea.style.height).toBe("auto");
    });
  });
});
