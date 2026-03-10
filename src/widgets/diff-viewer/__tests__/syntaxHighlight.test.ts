import { detectLanguage, tokenClass, tokenizeLine } from "../syntaxHighlight";

describe("detectLanguage", () => {
  it("detects TypeScript", () => {
    expect(detectLanguage("src/app.ts")).toBe("ts");
    expect(detectLanguage("src/App.tsx")).toBe("tsx");
  });

  it("detects JavaScript", () => {
    expect(detectLanguage("index.js")).toBe("js");
    expect(detectLanguage("App.jsx")).toBe("jsx");
  });

  it("detects Python", () => {
    expect(detectLanguage("main.py")).toBe("py");
  });

  it("detects Rust", () => {
    expect(detectLanguage("lib.rs")).toBe("rs");
  });

  it("detects Go", () => {
    expect(detectLanguage("main.go")).toBe("go");
  });

  it("detects Java", () => {
    expect(detectLanguage("Main.java")).toBe("java");
  });

  it("detects C", () => {
    expect(detectLanguage("main.c")).toBe("c");
  });

  it("detects C++", () => {
    expect(detectLanguage("main.cpp")).toBe("cpp");
    expect(detectLanguage("header.hpp")).toBe("cpp");
  });

  it("detects C#", () => {
    expect(detectLanguage("Program.cs")).toBe("cs");
  });

  it("detects Ruby", () => {
    expect(detectLanguage("app.rb")).toBe("ruby");
  });

  it("detects PHP", () => {
    expect(detectLanguage("index.php")).toBe("php");
  });

  it("detects Kotlin", () => {
    expect(detectLanguage("Main.kt")).toBe("kotlin");
  });

  it("detects Swift", () => {
    expect(detectLanguage("App.swift")).toBe("swift");
  });

  it("detects Shell", () => {
    expect(detectLanguage("build.sh")).toBe("shell");
  });

  it("detects SQL", () => {
    expect(detectLanguage("query.sql")).toBe("sql");
  });

  it("detects YAML", () => {
    expect(detectLanguage("config.yaml")).toBe("yaml");
    expect(detectLanguage("ci.yml")).toBe("yaml");
  });

  it("detects HTML", () => {
    expect(detectLanguage("index.html")).toBe("html");
  });

  it("detects CSS", () => {
    expect(detectLanguage("style.css")).toBe("css");
  });

  it("detects Dockerfile", () => {
    expect(detectLanguage("Dockerfile")).toBe("dockerfile");
  });

  it("now detects markdown", () => {
    expect(detectLanguage("README.md")).toBe("markdown");
  });

  it("returns null for unknown extensions", () => {
    expect(detectLanguage("file.unknown")).toBeNull();
    expect(detectLanguage("noext")).toBeNull();
  });
});

describe("tokenizeLine", () => {
  it("highlights TypeScript keywords", () => {
    const tokens = tokenizeLine("const x = 5;", "ts");
    expect(tokens[0]).toEqual({ text: "const", type: "keyword" });
  });

  it("highlights strings", () => {
    const tokens = tokenizeLine('const s = "hello"', "ts");
    const strToken = tokens.find((t) => t.type === "string");
    expect(strToken?.text).toBe('"hello"');
  });

  it("highlights numbers", () => {
    const tokens = tokenizeLine("const n = 42", "ts");
    const numToken = tokens.find((t) => t.type === "number");
    expect(numToken?.text).toBe("42");
  });

  it("highlights line comments", () => {
    const tokens = tokenizeLine("x = 1 // comment", "ts");
    const commentToken = tokens.find((t) => t.type === "comment");
    expect(commentToken?.text).toBe("// comment");
  });

  it("highlights Python comments", () => {
    const tokens = tokenizeLine("x = 1 # comment", "py");
    const commentToken = tokens.find((t) => t.type === "comment");
    expect(commentToken?.text).toBe("# comment");
  });

  it("highlights builtins", () => {
    const tokens = tokenizeLine("console.log(Math.PI)", "ts");
    const builtinTokens = tokens.filter((t) => t.type === "builtin");
    expect(builtinTokens.map((t) => t.text)).toContain("console");
    expect(builtinTokens.map((t) => t.text)).toContain("Math");
  });

  it("returns plain text for unknown language", () => {
    const tokens = tokenizeLine("const x = 5", "unknown");
    expect(tokens).toEqual([{ text: "const x = 5", type: null }]);
  });

  it("handles empty string", () => {
    const tokens = tokenizeLine("", "ts");
    expect(tokens).toEqual([]);
  });

  it("handles escaped strings", () => {
    const tokens = tokenizeLine('const s = "he\\"llo"', "ts");
    const strToken = tokens.find((t) => t.type === "string");
    expect(strToken?.text).toBe('"he\\"llo"');
  });

  it("highlights block comments (/* */)", () => {
    const tokens = tokenizeLine("x = 1 /* comment */ + 2", "java");
    const commentToken = tokens.find((t) => t.type === "comment");
    expect(commentToken?.text).toBe("/* comment */");
  });

  it("highlights block comments (<!-- -->)", () => {
    const tokens = tokenizeLine("<!-- comment -->", "html");
    const commentToken = tokens.find((t) => t.type === "comment");
    expect(commentToken?.text).toBe("<!-- comment -->");
  });

  it("treats unclosed block comment as comment to end of line", () => {
    const tokens = tokenizeLine("x /* start", "java");
    const commentToken = tokens.find((t) => t.type === "comment");
    expect(commentToken?.text).toBe("/* start");
  });

  it("highlights Java keywords", () => {
    const tokens = tokenizeLine("public class Main", "java");
    const keywordTokens = tokens.filter((t) => t.type === "keyword");
    expect(keywordTokens.map((t) => t.text)).toContain("public");
    expect(keywordTokens.map((t) => t.text)).toContain("class");
  });

  it("highlights SQL keywords (case-sensitive)", () => {
    const tokens = tokenizeLine("SELECT * FROM users", "sql");
    const keywordTokens = tokens.filter((t) => t.type === "keyword");
    expect(keywordTokens.map((t) => t.text)).toContain("SELECT");
    expect(keywordTokens.map((t) => t.text)).toContain("FROM");
  });
});

describe("tokenClass", () => {
  it("returns class for known types", () => {
    expect(tokenClass("keyword")).toBe("text-vsc-keyword");
    expect(tokenClass("string")).toBe("text-vsc-string");
    expect(tokenClass("comment")).toBe("text-vsc-comment");
  });

  it("returns empty string for null", () => {
    expect(tokenClass(null)).toBe("");
  });
});
