/**
 * Clipboard & Browser API Edge Case Tests
 *
 * Tests:
 * - writeToClipboard success path
 * - Clipboard API throws: graceful error
 * - Very large text (100KB)
 * - isServerEvent / isServerEventBatch type guards with edge cases
 * - postMessage origin validation logic
 */
import { isServerEvent, isServerEventBatch,type ServerEventBatch } from "../../protocol";
import { writeToClipboard } from "../clipboard";

// Use Object.defineProperty — happy-dom navigator.clipboard is getter-only
const mockWriteText = vi.fn(() => Promise.resolve());
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

beforeEach(() => mockWriteText.mockClear());

describe("Clipboard edge cases", () => {
  it("writeToClipboard calls navigator.clipboard.writeText", async () => {
    await writeToClipboard("Hello");
    expect(mockWriteText).toHaveBeenCalledWith("Hello");
  });

  it("clipboard API throws: error propagates", async () => {
    mockWriteText.mockRejectedValueOnce(new DOMException("NotAllowed"));
    await expect(writeToClipboard("text")).rejects.toThrow("NotAllowed");
  });

  it("large text (100KB): writeToClipboard handles without error", async () => {
    const largeText = "A".repeat(100_000);
    await writeToClipboard(largeText);
    expect(mockWriteText).toHaveBeenCalledWith(largeText);
  });
});

describe("isServerEvent / isServerEventBatch type guards – edge cases", () => {
  describe("isServerEvent", () => {
    it("valid UPSERT_MESSAGE: true", () => {
      expect(isServerEvent({ t: "UPSERT_MESSAGE", msg: { id: "msg_1", text: "hi" } })).toBe(true);
    });

    it("valid NOP: true", () => {
      expect(isServerEvent({ t: "NOP" })).toBe(true);
    });

    it("valid APPEND_TEXT: true", () => {
      expect(isServerEvent({ t: "APPEND_TEXT", id: "msg_1", chunk: "hello" })).toBe(true);
    });

    it("unknown type: false", () => {
      expect(isServerEvent({ t: "UNKNOWN_TYPE" })).toBe(false);
    });

    it("null: false", () => {
      expect(isServerEvent(null)).toBe(false);
    });

    it("undefined: false", () => {
      expect(isServerEvent(undefined)).toBe(false);
    });

    it("string: false", () => {
      expect(isServerEvent("hello")).toBe(false);
    });

    it("number: false", () => {
      expect(isServerEvent(42)).toBe(false);
    });

    it("empty object: false", () => {
      expect(isServerEvent({})).toBe(false);
    });

    it("UPSERT_MESSAGE without msg: false", () => {
      expect(isServerEvent({ t: "UPSERT_MESSAGE" })).toBe(false);
    });

    it("APPEND_TEXT without chunk: false", () => {
      expect(isServerEvent({ t: "APPEND_TEXT", id: "msg_1" })).toBe(false);
    });

    it("UPSERT_TURN without turn: false", () => {
      expect(isServerEvent({ t: "UPSERT_TURN" })).toBe(false);
    });
  });

  describe("isServerEventBatch", () => {
    it("valid batch: true", () => {
      const batch: ServerEventBatch = {
        type: "SERVER_EVENT_BATCH",
        batch_id: "b_1",
        created_at_ms: Date.now(),
        serverEvents: [{ t: "NOP" }],
      };
      expect(isServerEventBatch(batch)).toBe(true);
    });

    it("empty serverEvents array: true", () => {
      expect(
        isServerEventBatch({
          type: "SERVER_EVENT_BATCH",
          batch_id: "b_1",
          created_at_ms: 0,
          serverEvents: [],
        }),
      ).toBe(true);
    });

    it("missing type: false", () => {
      expect(isServerEventBatch({ batch_id: "b_1", created_at_ms: 0, serverEvents: [] })).toBe(false);
    });

    it("wrong type value: false", () => {
      expect(isServerEventBatch({ type: "WRONG", batch_id: "b_1", created_at_ms: 0, serverEvents: [] })).toBe(
        false,
      );
    });

    it("null: false", () => {
      expect(isServerEventBatch(null)).toBe(false);
    });

    it("missing batch_id: false", () => {
      expect(isServerEventBatch({ type: "SERVER_EVENT_BATCH", created_at_ms: 0, serverEvents: [] })).toBe(false);
    });

    it("missing created_at_ms: false", () => {
      expect(isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b_1", serverEvents: [] })).toBe(false);
    });

    it("serverEvents not array: false", () => {
      expect(
        isServerEventBatch({
          type: "SERVER_EVENT_BATCH",
          batch_id: "b_1",
          created_at_ms: 0,
          serverEvents: "not array",
        }),
      ).toBe(false);
    });
  });
});
