import { fuzzyScore } from "../fuzzyScore";

describe("fuzzyScore", () => {
  it("returns null for non-matching query", () => {
    expect(fuzzyScore("xyz", "hello world")).toBeNull();
  });

  it("returns high score for exact prefix", () => {
    const result = fuzzyScore("hel", "hello");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(103);
  });

  it("returns indices for exact prefix", () => {
    const result = fuzzyScore("hel", "hello");
    expect(result).not.toBeNull();
    expect(result!.indices).toEqual([0, 1, 2]);
  });

  it("matches subsequence", () => {
    const result = fuzzyScore("hlo", "hello");
    expect(result).not.toBeNull();
    expect(result!.indices).toHaveLength(3);
  });

  it("returns null when query chars not all found", () => {
    expect(fuzzyScore("abc", "ab")).toBeNull();
  });

  it("gives word boundary bonus", () => {
    const withBoundary = fuzzyScore("fb", "foo-bar");
    const withoutBoundary = fuzzyScore("fb", "foobar");
    expect(withBoundary).not.toBeNull();
    expect(withBoundary!.score).toBeGreaterThan(withoutBoundary?.score ?? 0);
  });

  it("gives consecutive bonus", () => {
    const consecutive = fuzzyScore("he", "hello");
    const nonConsecutive = fuzzyScore("ho", "hello");
    expect(consecutive).not.toBeNull();
    expect(nonConsecutive).not.toBeNull();
    expect(consecutive!.score).toBeGreaterThan(nonConsecutive!.score);
  });

  it("case insensitive matching", () => {
    const result = fuzzyScore("HEL", "hello");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(103);
  });

  it("handles empty query", () => {
    const result = fuzzyScore("", "hello");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
  });

  it("handles single char", () => {
    const result = fuzzyScore("h", "hello");
    expect(result).not.toBeNull();
    expect(result!.indices).toEqual([0]);
  });
});
