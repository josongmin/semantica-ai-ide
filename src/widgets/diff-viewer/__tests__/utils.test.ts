import { extractDirPath, extractFileName } from "../utils";

describe("extractFileName", () => {
  it("extracts the file name from a Unix path", () => {
    expect(extractFileName("src/foo/bar.tsx")).toBe("bar.tsx");
  });

  it("returns the name as-is when there is no directory", () => {
    expect(extractFileName("bar.tsx")).toBe("bar.tsx");
  });

  it("returns the original string for an empty path", () => {
    expect(extractFileName("")).toBe("");
  });

  it("handles Windows-style backslash paths", () => {
    expect(extractFileName("src\\foo\\bar.tsx")).toBe("bar.tsx");
  });

  it("handles deeply nested paths", () => {
    expect(extractFileName("a/b/c/d/e/file.ts")).toBe("file.ts");
  });
});

describe("extractDirPath", () => {
  it("extracts the directory from a Unix path", () => {
    expect(extractDirPath("src/foo/bar.tsx")).toBe("src/foo");
  });

  it("returns an empty string when the path has no directory", () => {
    expect(extractDirPath("bar.tsx")).toBe("");
  });

  it("returns an empty string for an empty path", () => {
    expect(extractDirPath("")).toBe("");
  });

  it("handles Windows-style backslash paths", () => {
    expect(extractDirPath("src\\foo\\bar.tsx")).toBe("src/foo");
  });

  it("handles a single-level directory", () => {
    expect(extractDirPath("src/file.ts")).toBe("src");
  });

  it("handles deeply nested paths", () => {
    expect(extractDirPath("a/b/c/d/e/file.ts")).toBe("a/b/c/d/e");
  });
});
