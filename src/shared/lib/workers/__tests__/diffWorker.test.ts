/**
 * Tests for the diff worker's core algorithm.
 * We import computeDiff directly (module mode) rather than testing as a worker.
 */
import { computeDiff } from "../diffWorker";

describe("computeDiff", () => {
  it("returns all context lines for identical strings", () => {
    const text = "line1\nline2\nline3";
    const result = computeDiff(text, text);

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.unchanged).toBe(3);
    expect(result.lines.every((l) => l.kind === "context")).toBe(true);
  });

  it("handles empty before string (all additions)", () => {
    const result = computeDiff("", "line1\nline2");

    expect(result.additions).toBe(2);
    expect(result.deletions).toBe(0);
    expect(result.unchanged).toBe(0);
    expect(result.lines.every((l) => l.kind === "add")).toBe(true);
  });

  it("handles empty after string (all deletions)", () => {
    const result = computeDiff("line1\nline2", "");

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(2);
    expect(result.unchanged).toBe(0);
    expect(result.lines.every((l) => l.kind === "remove")).toBe(true);
  });

  it("detects a single line addition", () => {
    const before = "line1\nline3";
    const after = "line1\nline2\nline3";
    const result = computeDiff(before, after);

    expect(result.additions).toBe(1);
    expect(result.deletions).toBe(0);
    expect(result.unchanged).toBe(2);

    const addedLines = result.lines.filter((l) => l.kind === "add");
    expect(addedLines).toHaveLength(1);
    expect(addedLines[0]?.content).toBe("line2");
  });

  it("detects a single line removal", () => {
    const before = "line1\nline2\nline3";
    const after = "line1\nline3";
    const result = computeDiff(before, after);

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(1);
    expect(result.unchanged).toBe(2);

    const removedLines = result.lines.filter((l) => l.kind === "remove");
    expect(removedLines).toHaveLength(1);
    expect(removedLines[0]?.content).toBe("line2");
  });

  it("detects a line modification as remove + add", () => {
    const before = "line1\nold_line\nline3";
    const after = "line1\nnew_line\nline3";
    const result = computeDiff(before, after);

    expect(result.additions).toBe(1);
    expect(result.deletions).toBe(1);
    expect(result.unchanged).toBe(2);
  });

  it("assigns correct line numbers to context lines", () => {
    const before = "a\nb\nc";
    const after = "a\nb\nc";
    const result = computeDiff(before, after);

    expect(result.lines[0]).toEqual({
      kind: "context",
      content: "a",
      oldLineNumber: 1,
      newLineNumber: 1,
    });
    expect(result.lines[1]).toEqual({
      kind: "context",
      content: "b",
      oldLineNumber: 2,
      newLineNumber: 2,
    });
    expect(result.lines[2]).toEqual({
      kind: "context",
      content: "c",
      oldLineNumber: 3,
      newLineNumber: 3,
    });
  });

  it("assigns null oldLineNumber for additions", () => {
    const result = computeDiff("a", "a\nb");
    const added = result.lines.find((l) => l.kind === "add");
    expect(added?.oldLineNumber).toBeNull();
    expect(added?.newLineNumber).toBeGreaterThan(0);
  });

  it("assigns null newLineNumber for removals", () => {
    const result = computeDiff("a\nb", "a");
    const removed = result.lines.find((l) => l.kind === "remove");
    expect(removed?.newLineNumber).toBeNull();
    expect(removed?.oldLineNumber).toBeGreaterThan(0);
  });

  it("handles multi-line additions and removals", () => {
    const before = "header\nold1\nold2\nfooter";
    const after = "header\nnew1\nnew2\nnew3\nfooter";
    const result = computeDiff(before, after);

    expect(result.deletions).toBe(2);
    expect(result.additions).toBe(3);
    expect(result.unchanged).toBe(2); // header + footer
  });

  it("handles completely different content", () => {
    const before = "alpha\nbeta\ngamma";
    const after = "delta\nepsilon\nzeta";
    const result = computeDiff(before, after);

    // All lines should be additions or removals (no context)
    expect(result.unchanged).toBe(0);
    expect(result.additions).toBe(3);
    expect(result.deletions).toBe(3);
  });

  it("total lines in result equals additions + deletions + unchanged", () => {
    const before = "a\nb\nc\nd";
    const after = "a\nx\nc\ny\nz";
    const result = computeDiff(before, after);

    expect(result.lines.length).toBe(result.additions + result.deletions + result.unchanged);
  });

  it("handles single-line strings", () => {
    const result = computeDiff("hello", "world");

    expect(result.additions).toBe(1);
    expect(result.deletions).toBe(1);
    expect(result.unchanged).toBe(0);
  });

  it("preserves line content exactly", () => {
    const before = "  indented\ttab\ntrailing  ";
    const after = "  indented\ttab\ntrailing  \nnew line";
    const result = computeDiff(before, after);

    const contextLines = result.lines.filter((l) => l.kind === "context");
    expect(contextLines[0]?.content).toBe("  indented\ttab");
    expect(contextLines[1]?.content).toBe("trailing  ");
  });
});
