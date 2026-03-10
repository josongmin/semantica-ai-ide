import { extractDirPath, extractFileName } from "../pathUtils";

describe("extractFileName", () => {
  it("extracts file name from Unix path", () => {
    expect(extractFileName("/home/user/project/file.ts")).toBe("file.ts");
  });

  it("extracts file name from Windows path", () => {
    expect(extractFileName("C:\\Users\\user\\project\\file.ts")).toBe("file.ts");
  });

  it("extracts file name from mixed separators", () => {
    expect(extractFileName("C:\\Users/project\\src/file.ts")).toBe("file.ts");
  });

  it("returns file name for bare name (no path separator)", () => {
    expect(extractFileName("file.ts")).toBe("file.ts");
  });

  it("handles trailing slash (empty last segment)", () => {
    // "".pop() returns "" which is falsy, so it falls back to the original path
    expect(extractFileName("/home/user/project/")).toBe("/home/user/project/");
  });

  it("handles root Unix path", () => {
    expect(extractFileName("/")).toBe("/");
  });

  it("handles deeply nested path", () => {
    expect(extractFileName("/a/b/c/d/e/f/g.txt")).toBe("g.txt");
  });

  it("handles file with multiple dots", () => {
    expect(extractFileName("/path/to/file.test.spec.ts")).toBe("file.test.spec.ts");
  });

  it("handles path with spaces", () => {
    expect(extractFileName("/path/to my/file name.ts")).toBe("file name.ts");
  });
});

describe("extractDirPath", () => {
  it("extracts directory from Unix path", () => {
    expect(extractDirPath("/home/user/project/file.ts")).toBe("/home/user/project");
  });

  it("extracts directory from Windows path", () => {
    expect(extractDirPath("C:\\Users\\user\\project\\file.ts")).toBe("C:/Users/user/project");
  });

  it("extracts directory from mixed separators", () => {
    expect(extractDirPath("C:\\Users/project\\src/file.ts")).toBe("C:/Users/project/src");
  });

  it("returns empty string for bare file name", () => {
    expect(extractDirPath("file.ts")).toBe("");
  });

  it("returns root for root-level file", () => {
    expect(extractDirPath("/file.ts")).toBe("");
  });

  it("handles deeply nested path", () => {
    expect(extractDirPath("/a/b/c/d/e/f/g.txt")).toBe("/a/b/c/d/e/f");
  });

  it("handles trailing slash", () => {
    expect(extractDirPath("/home/user/project/")).toBe("/home/user/project");
  });
});
