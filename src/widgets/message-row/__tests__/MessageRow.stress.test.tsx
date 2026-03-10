/**
 * MessageRow Stress & Edge-Case Tests
 *
 * Tests:
 * - Rapid copy button clicks: state transitions (idle→copied→idle)
 * - Clipboard failure handling (failed state)
 * - Copy timer cleanup on unmount (no memory leak)
 * - Retry button with postMessage
 * - Status transitions: streaming→final→error→streaming
 * - Empty text edge cases
 * - Diff preview rendering
 */
import { act, fireEvent, screen } from "@testing-library/react";

import { messageAtomFamily } from "~entities/message/core";

import { renderWithAtoms } from "../../../../tests/utils";
import { createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import { sendMessageAdapterAtom, type SendMessageAdapter } from "../../../shared/lib/atoms";
import type { MessageId } from "../../../shared/protocol";
import { MessageRow } from "../MessageRow";

// Mock getVscodeApi
const mockPostMessage = vi.fn();

function createMockSendAdapter(): SendMessageAdapter {
  return {
    send: vi.fn(),
    stopAgent: vi.fn(),
    retryMessage: (messageId: string) => mockPostMessage({ type: "RETRY_MESSAGE", messageId }),
    enqueue: vi.fn(),
    removeQueued: vi.fn(),
    queue: [],
  };
}
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// Mock MarkdownContent for simplicity
vi.mock("../../markdown-content", () => ({
  MarkdownContent: ({ text }: { text: string }) => <div data-testid="markdown">{text}</div>,
}));

// ─── Clipboard mock ───────────────────────────────────────────
// happy-dom's navigator.clipboard is not reliably overridable via
// Object.defineProperty. Instead, mock the clipboard module directly.
const { mockWriteToClipboard } = vi.hoisted(() => ({
  mockWriteToClipboard: vi.fn<(text: string) => Promise<void>>(() => Promise.resolve()),
}));

vi.mock("../../../shared/lib/clipboard", () => ({
  writeToClipboard: mockWriteToClipboard,
}));

beforeEach(() => {
  resetIdCounter();
  mockPostMessage.mockClear();
  mockWriteToClipboard.mockClear();
  mockWriteToClipboard.mockImplementation(() => Promise.resolve());
});

function renderMessage(overrides: Partial<Parameters<typeof createMessage>[0]> = {}) {
  const id = (overrides.id ?? "msg_1") as MessageId;
  const msg = createMessage({
    id,
    role: "assistant",
    text: "Test message content",
    status: "final",
    created_at_ms: Date.now(),
    ...overrides,
  });

  return renderWithAtoms(<MessageRow messageId={id} />, {
    initialValues: [
      [messageAtomFamily(id), msg],
      [sendMessageAdapterAtom, createMockSendAdapter()],
    ],
  });
}

describe("MessageRow – stress & edge cases", () => {
  // ── Copy button state transitions ───────────────────────
  describe("copy button state transitions", () => {
    it("successful copy: title changes to Copied!", async () => {
      renderMessage();
      const copyBtn = screen.getByLabelText("Copy message");

      await act(async () => {
        fireEvent.click(copyBtn);
        await Promise.resolve();
      });

      expect(copyBtn).toHaveAttribute("title", "Copied!");
    });

    it("clipboard failure: title shows Copy failed", async () => {
      mockWriteToClipboard.mockImplementation(() => Promise.reject(new Error("denied")));

      renderMessage();
      const copyBtn = screen.getByLabelText("Copy message");

      await act(async () => {
        fireEvent.click(copyBtn);
        // Rejection path needs extra microtick flushes
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(copyBtn).toHaveAttribute("title", "Copy failed");
    });

    it("rapid copy 10x: no crash, clipboard called each time", async () => {
      renderMessage();
      const copyBtn = screen.getByLabelText("Copy message");

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.click(copyBtn);
          await Promise.resolve();
          await Promise.resolve();
        });
      }

      expect(mockWriteToClipboard).toHaveBeenCalledTimes(10);
      expect(mockWriteToClipboard).toHaveBeenCalledWith("Test message content");
    });

    it("copy timer resets on rapid clicks (no stale state)", async () => {
      vi.useFakeTimers();

      renderMessage();
      const copyBtn = screen.getByLabelText("Copy message");

      // First click
      await act(async () => {
        fireEvent.click(copyBtn);
        await Promise.resolve();
      });
      expect(copyBtn).toHaveAttribute("title", "Copied!");

      // Advance 1s (less than 2s timer)
      act(() => vi.advanceTimersByTime(1000));
      expect(copyBtn).toHaveAttribute("title", "Copied!");

      // Second click resets timer
      await act(async () => {
        fireEvent.click(copyBtn);
        await Promise.resolve();
      });
      expect(copyBtn).toHaveAttribute("title", "Copied!");

      // Advance 1.5s from reset
      act(() => vi.advanceTimersByTime(1500));
      expect(copyBtn).toHaveAttribute("title", "Copied!");

      // Advance remaining 0.5s → timer expired
      act(() => vi.advanceTimersByTime(500));
      expect(copyBtn).toHaveAttribute("title", "Copy");

      vi.useRealTimers();
    });
  });

  // ── Copy timer cleanup on unmount ───────────────────────
  describe("copy timer cleanup on unmount", () => {
    it("unmount during copied state: no setState after unmount", async () => {
      vi.useFakeTimers();

      const { unmount } = renderMessage();
      const copyBtn = screen.getByLabelText("Copy message");

      await act(async () => {
        fireEvent.click(copyBtn);
        await Promise.resolve();
      });

      unmount();
      expect(() => act(() => vi.advanceTimersByTime(3000))).not.toThrow();

      vi.useRealTimers();
    });
  });

  // ── Retry button ────────────────────────────────────────
  describe("retry button", () => {
    it("error state: retry button sends RETRY_MESSAGE", () => {
      renderMessage({
        id: "msg_err" as MessageId,
        status: "error",
        error_detail: "Context exceeded",
      });

      const retryBtn = screen.getByLabelText("Retry");
      fireEvent.click(retryBtn);

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "RETRY_MESSAGE",
        messageId: "msg_err",
      });
    });

    it("rapid retry clicks: postMessage called each time", () => {
      renderMessage({
        id: "msg_err" as MessageId,
        status: "error",
        error_detail: "Error",
      });

      const retryBtn = screen.getByLabelText("Retry");
      for (let i = 0; i < 20; i++) {
        fireEvent.click(retryBtn);
      }

      expect(mockPostMessage).toHaveBeenCalledTimes(20);
    });
  });

  // ── Message role rendering ──────────────────────────────
  describe("message role rendering", () => {
    it("user message: right-aligned, no copy button, no retry", () => {
      renderMessage({ role: "user", text: "Hello" });

      const article = screen.getByLabelText("Your message");
      expect(article).toHaveClass("items-end");
      expect(screen.queryByLabelText("Copy message")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Retry")).not.toBeInTheDocument();
    });

    it("system message: shows 'System' label", () => {
      renderMessage({ role: "system", text: "System notice" });

      expect(screen.getByLabelText("System message")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();
    });

    it("assistant message: shows 'Agent' label", () => {
      renderMessage({ role: "assistant", text: "Response" });

      expect(screen.getByLabelText("Agent message")).toBeInTheDocument();
      expect(screen.getByText("Agent")).toBeInTheDocument();
    });
  });

  // ── Streaming state ─────────────────────────────────────
  describe("streaming state", () => {
    it("streaming with text: shows markdown + no copy button", () => {
      renderMessage({ status: "streaming", text: "Partial..." });

      const article = screen.getByLabelText("Agent message");
      expect(article).toHaveAttribute("aria-busy", "true");
      expect(screen.getByTestId("markdown")).toHaveTextContent("Partial...");
      expect(screen.queryByLabelText("Copy message")).not.toBeInTheDocument();
    });

    it("streaming without text: shows ThinkingIndicator", () => {
      renderMessage({ status: "streaming", text: "" });

      const article = screen.getByLabelText("Agent message");
      expect(article).toHaveAttribute("aria-busy", "true");
      expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    });

    it("streaming message has animate class", () => {
      renderMessage({ status: "streaming", text: "data" });
      const article = screen.getByLabelText("Agent message");
      expect(article.className).toMatch(/animate-/);
    });
  });

  // ── Error state ─────────────────────────────────────────
  describe("error state", () => {
    it("error with detail: shows error detail box", () => {
      renderMessage({ status: "error", error_detail: "Token limit exceeded" });
      expect(screen.getByText("Token limit exceeded")).toBeInTheDocument();
    });

    it("error without detail: no detail box", () => {
      renderMessage({ status: "error", error_detail: undefined });
      const article = screen.getByLabelText("Agent message");
      const errorDetail = article.querySelector("[class*='bg-vsc-error/5']");
      expect(errorDetail).toBeNull();
    });

    it("error state renders error detail box", () => {
      renderMessage({ status: "error", text: "error", error_detail: "err" });
      const article = screen.getByLabelText("Agent message");
      // Right indicator bar is only shown during streaming, not error state
      expect(article.querySelector("[class*='bg-vsc-error']")).not.toBeNull();
    });
  });

  // ── Null message (atom not found) ───────────────────────
  describe("null message", () => {
    it("non-existent messageId: renders nothing", () => {
      const { container } = renderWithAtoms(<MessageRow messageId={"nonexistent" as MessageId} />, {
        initialValues: [],
      });
      expect(container.querySelector("article")).toBeNull();
    });
  });

  // ── Empty text agent message ────────────────────────────
  describe("empty text edge cases", () => {
    it("final status with empty text: no copy button shown", () => {
      renderMessage({ status: "final", text: "" });
      expect(screen.queryByLabelText("Copy message")).not.toBeInTheDocument();
    });
  });
});
