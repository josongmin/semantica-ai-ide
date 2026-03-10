import { writeToClipboard } from "../clipboard";

// Mock navigator.clipboard
const mockWriteText = vi.fn(() => Promise.resolve());
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  mockWriteText.mockClear();
});

describe("writeToClipboard", () => {
  it("delegates to navigator.clipboard.writeText", async () => {
    await writeToClipboard("hello");
    expect(mockWriteText).toHaveBeenCalledWith("hello");
  });

  it("returns the promise from writeText", () => {
    const result = writeToClipboard("test");
    expect(result).toBeInstanceOf(Promise);
  });

  it("propagates rejection from clipboard API", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("denied"));
    await expect(writeToClipboard("fail")).rejects.toThrow("denied");
  });

  it("handles empty string", async () => {
    await writeToClipboard("");
    expect(mockWriteText).toHaveBeenCalledWith("");
  });
});
