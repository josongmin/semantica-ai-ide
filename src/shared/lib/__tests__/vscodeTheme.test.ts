import { detectVscodeTheme, getVscodeColor } from "../vscodeTheme";

describe("getVscodeColor", () => {
  it("reads a CSS variable from the document root", () => {
    document.documentElement.style.setProperty("--test-color", "#ff0000");
    expect(getVscodeColor("--test-color", "#000")).toBe("#ff0000");
    document.documentElement.style.removeProperty("--test-color");
  });

  it("returns fallback when CSS variable is not set", () => {
    expect(getVscodeColor("--nonexistent-var", "#abc123")).toBe("#abc123");
  });

  it("returns fallback when CSS variable is empty string", () => {
    document.documentElement.style.setProperty("--empty-var", "");
    expect(getVscodeColor("--empty-var", "#fallback")).toBe("#fallback");
    document.documentElement.style.removeProperty("--empty-var");
  });
});

describe("detectVscodeTheme", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--vscode-editor-background");
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--vscode-editor-background");
  });

  it("returns 'dark' for dark backgrounds", () => {
    document.documentElement.style.setProperty("--vscode-editor-background", "#1e1e1e");
    expect(detectVscodeTheme()).toBe("dark");
  });

  it("returns 'default' for light backgrounds", () => {
    document.documentElement.style.setProperty("--vscode-editor-background", "#ffffff");
    expect(detectVscodeTheme()).toBe("default");
  });

  it("returns 'dark' when CSS variable is not set (fallback #1e1e1e)", () => {
    expect(detectVscodeTheme()).toBe("dark");
  });

  it("returns 'default' for mid-light background", () => {
    // #909090 → luminance = 0.299*144 + 0.587*144 + 0.114*144 = 144 > 128
    document.documentElement.style.setProperty("--vscode-editor-background", "#909090");
    expect(detectVscodeTheme()).toBe("default");
  });

  it("returns 'dark' for just-below-threshold background", () => {
    // #7f7f7f → luminance = 0.299*127 + 0.587*127 + 0.114*127 = 127
    document.documentElement.style.setProperty("--vscode-editor-background", "#7f7f7f");
    expect(detectVscodeTheme()).toBe("dark");
  });
});
