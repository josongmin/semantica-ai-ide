import { stripAnsi } from "../ansiStrip";

describe("stripAnsi", () => {
  it("returns plain text unchanged", () => {
    expect(stripAnsi("hello world")).toBe("hello world");
  });

  it("strips SGR color codes", () => {
    expect(stripAnsi("\x1B[31mred text\x1B[0m")).toBe("red text");
  });

  it("strips bold/underline codes", () => {
    expect(stripAnsi("\x1B[1mbold\x1B[22m \x1B[4munderline\x1B[24m")).toBe("bold underline");
  });

  it("strips 256-color codes", () => {
    expect(stripAnsi("\x1B[38;5;196mred256\x1B[0m")).toBe("red256");
  });

  it("strips true-color (24-bit) codes", () => {
    expect(stripAnsi("\x1B[38;2;255;0;0mtrue-red\x1B[0m")).toBe("true-red");
  });

  it("strips cursor movement codes", () => {
    expect(stripAnsi("\x1B[2Aup two\x1B[3Bdown three")).toBe("up twodown three");
  });

  it("strips erase codes", () => {
    expect(stripAnsi("\x1B[2Jclear screen")).toBe("clear screen");
  });

  it("handles empty string", () => {
    expect(stripAnsi("")).toBe("");
  });

  it("handles string with only ANSI codes", () => {
    expect(stripAnsi("\x1B[31m\x1B[0m")).toBe("");
  });

  it("handles mixed content with newlines", () => {
    const input = "\x1B[32m✓\x1B[0m test passed\n\x1B[31m✗\x1B[0m test failed";
    expect(stripAnsi(input)).toBe("✓ test passed\n✗ test failed");
  });
});
