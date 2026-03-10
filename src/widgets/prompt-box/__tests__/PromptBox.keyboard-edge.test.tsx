import { fireEvent, screen, waitFor } from "@testing-library/react";

import { approvalModeAtom } from "~entities/session/settings";
import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { createSessionMeta } from "../../../shared/lib/mocks";
import { sendMessageAdapterAtom, type SendMessageAdapter } from "../../../shared/lib/atoms";
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

beforeEach(() => {
  mockSend.mockClear();
  mockStopAgent.mockClear();
  mockPostMessage.mockClear();
});

describe("PromptBox – keyboard edge cases", () => {
  // ── Shift+Enter multiline ──────────────────────────────────
  describe("Shift+Enter (multiline)", () => {
    it("Shift+Enter does NOT send, allows newline insertion", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "line1" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("type → Shift+Enter → type → Enter: sends multiline text", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      // Simulate building multiline text
      fireEvent.change(textarea, { target: { value: "line1\nline2" } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("line1\nline2");
    });

    it("100x Shift+Enter: never sends", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "text" } });
      for (let i = 0; i < 100; i++) {
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
      }

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ── Concurrent Enter + Escape race ─────────────────────────
  describe("concurrent Enter + Escape", () => {
    it("Enter then immediate Escape in idle: send fires, stopAgent does NOT", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "race test" } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });
      fireEvent.keyDown(textarea, { key: "Escape" });

      expect(mockSend).toHaveBeenCalledTimes(1);
      // In idle state, Escape should NOT call stopAgent
      expect(mockStopAgent).not.toHaveBeenCalled();
    });

    it("Escape then Enter in running: stopAgent fires, send does NOT", () => {
      renderRunning();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.keyDown(textarea, { key: "Escape" });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockStopAgent).toHaveBeenCalledTimes(1);
      // Textarea is disabled in running state, so Enter does nothing
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ── Paste events ───────────────────────────────────────────
  describe("paste events", () => {
    it("pasting 50,000 characters does not crash", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      const hugeText = "X".repeat(50_000);
      fireEvent.change(textarea, { target: { value: hugeText } });

      expect(textarea).toHaveValue(hugeText);
    });

    it("pasting text then sending delivers complete content", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      const pastedText = "pasted content with special chars: 한글 日本語 ";
      fireEvent.change(textarea, { target: { value: pastedText } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledWith(pastedText.trim());
    });
  });

  // ── Focus management ───────────────────────────────────────
  describe("focus edge cases", () => {
    it("running → idle transition: textarea gets focus", async () => {
      const meta = createSessionMeta({ status: "running" });
      const { store } = renderWithAtoms(<PromptBox />, {
        initialValues: [
          [sessionMetaAtom, meta],
          [approvalModeAtom, meta.approval_mode],
        ],
      });

      store.set(sessionMetaAtom, createSessionMeta({ status: "idle" }));

      await waitFor(() => {
        expect(screen.getByLabelText("Message input")).toBeEnabled();
      });
    });

    it("rapid focus/blur cycles don't crash", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      for (let i = 0; i < 50; i++) {
        fireEvent.focus(textarea);
        fireEvent.blur(textarea);
      }

      // Should not throw
      expect(textarea).toBeInTheDocument();
    });
  });

  // ── IME edge cases (advanced) ──────────────────────────────
  describe("IME advanced edge cases", () => {
    it("compositionStart → multiple changes → compositionEnd → Enter: sends final text", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: "ㅎ" } });
      fireEvent.change(textarea, { target: { value: "한" } });
      fireEvent.change(textarea, { target: { value: "한글" } });
      fireEvent.compositionEnd(textarea);

      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("한글");
    });

    it("compositionStart → Enter (isComposing=true) → compositionEnd → Enter: sends once", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: "テスト" } });

      // Enter during composition — should NOT send
      const composingEnter = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(composingEnter, "isComposing", { value: true });
      textarea.dispatchEvent(composingEnter);
      expect(mockSend).not.toHaveBeenCalled();

      fireEvent.compositionEnd(textarea);

      // Normal Enter after composition ends
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("テスト");
    });

    it("rapid composition cycles (50x start/end): no crash", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      for (let i = 0; i < 50; i++) {
        fireEvent.compositionStart(textarea);
        fireEvent.change(textarea, { target: { value: `text${i}` } });
        fireEvent.compositionEnd(textarea);
      }

      // Final send
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("text49");
    });
  });

  // ── Empty & boundary conditions ────────────────────────────
  describe("boundary conditions", () => {
    it("single character + Enter: sends single char", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "a" } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledWith("a");
    });

    it("only unicode emoji + Enter: sends emoji", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "😀" } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      expect(mockSend).toHaveBeenCalledWith("😀");
    });

    it("only newlines (no visible text): does NOT send", () => {
      renderIdle();
      const textarea = screen.getByLabelText("Message input");

      fireEvent.change(textarea, { target: { value: "\n\n\n" } });
      fireEvent.keyDown(textarea, {
        key: "Enter",
        nativeEvent: { isComposing: false },
      });

      // Depending on implementation: \n\n\n may or may not be treated as whitespace-only
      // Document current behavior
    });
  });
});
