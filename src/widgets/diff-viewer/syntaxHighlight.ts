/**
 * Lightweight keyword-based syntax highlighter for diff lines.
 * Zero-dependency — no external grammar files or Shiki.
 * Maps language extensions to keyword sets, then wraps matched tokens in spans.
 *
 * Core languages (ts/tsx/js/jsx/py/rs/go) live here.
 * Extended languages (28 additional) live in languageSpecs.ts.
 */

import { EXTENSION_MAP, LANGUAGES as EXTENDED_LANGUAGES,type LanguageSpec } from "./languageSpecs";

type TokenType = "keyword" | "string" | "comment" | "number" | "builtin" | "operator";

const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword: "text-vsc-keyword",
  string: "text-vsc-string",
  comment: "text-vsc-comment",
  number: "text-vsc-number",
  builtin: "text-vsc-builtin",
  operator: "text-vsc-operator",
};

const TS_KEYWORDS = new Set([
  "abstract",
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "set",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

const TS_BUILTINS = new Set([
  "Array",
  "Boolean",
  "Date",
  "Error",
  "JSON",
  "Map",
  "Math",
  "Number",
  "Object",
  "Promise",
  "RegExp",
  "Set",
  "String",
  "Symbol",
  "console",
  "document",
  "window",
]);

const PY_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

const PY_BUILTINS = new Set([
  "dict",
  "int",
  "float",
  "list",
  "print",
  "range",
  "set",
  "str",
  "tuple",
  "type",
  "len",
  "enumerate",
  "zip",
  "map",
  "filter",
  "isinstance",
  "hasattr",
  "getattr",
  "open",
]);

const CORE_LANGUAGES: Record<string, LanguageSpec> = {
  ts: { keywords: TS_KEYWORDS, builtins: TS_BUILTINS, lineComment: "//" },
  tsx: { keywords: TS_KEYWORDS, builtins: TS_BUILTINS, lineComment: "//" },
  js: { keywords: TS_KEYWORDS, builtins: TS_BUILTINS, lineComment: "//" },
  jsx: { keywords: TS_KEYWORDS, builtins: TS_BUILTINS, lineComment: "//" },
  py: { keywords: PY_KEYWORDS, builtins: PY_BUILTINS, lineComment: "#" },
  rs: {
    keywords: new Set([
      "as",
      "async",
      "await",
      "break",
      "const",
      "continue",
      "crate",
      "dyn",
      "else",
      "enum",
      "extern",
      "false",
      "fn",
      "for",
      "if",
      "impl",
      "in",
      "let",
      "loop",
      "match",
      "mod",
      "move",
      "mut",
      "pub",
      "ref",
      "return",
      "self",
      "Self",
      "static",
      "struct",
      "super",
      "trait",
      "true",
      "type",
      "unsafe",
      "use",
      "where",
      "while",
    ]),
    builtins: new Set(["Box", "Option", "Result", "String", "Vec", "println", "eprintln"]),
    lineComment: "//",
  },
  go: {
    keywords: new Set([
      "break",
      "case",
      "chan",
      "const",
      "continue",
      "default",
      "defer",
      "else",
      "fallthrough",
      "for",
      "func",
      "go",
      "goto",
      "if",
      "import",
      "interface",
      "map",
      "package",
      "range",
      "return",
      "select",
      "struct",
      "switch",
      "type",
      "var",
    ]),
    builtins: new Set([
      "append",
      "cap",
      "close",
      "copy",
      "delete",
      "len",
      "make",
      "new",
      "panic",
      "print",
      "println",
    ]),
    lineComment: "//",
  },
};

/** Merged language specs: core (7) + extended (28) = 35 languages */
const LANGUAGES: Record<string, LanguageSpec> = { ...CORE_LANGUAGES, ...EXTENDED_LANGUAGES };

/** Detect language from file path extension (supports 55+ extensions) */
export function detectLanguage(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  // Check filename for Dockerfile (no extension)
  if (filePath.toLowerCase().endsWith("dockerfile")) return "dockerfile";
  const lang = EXTENSION_MAP[ext];
  return lang && LANGUAGES[lang] ? lang : null;
}

interface Token {
  text: string;
  type: TokenType | null;
}

/** Tokenize a single line of code (excluding the diff prefix +/-/space) */
export function tokenizeLine(code: string, lang: string): readonly Token[] {
  const spec = LANGUAGES[lang];
  if (!spec) return [{ text: code, type: null }];

  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Block comment
    if (spec.blockCommentStart && spec.blockCommentEnd && code.startsWith(spec.blockCommentStart, i)) {
      const endIdx = code.indexOf(spec.blockCommentEnd, i + spec.blockCommentStart.length);
      if (endIdx !== -1) {
        const end = endIdx + spec.blockCommentEnd.length;
        tokens.push({ text: code.slice(i, end), type: "comment" });
        i = end;
        continue;
      }
      // Unclosed block comment — treat rest of line as comment
      tokens.push({ text: code.slice(i), type: "comment" });
      break;
    }

    // Line comment
    if (spec.lineComment && code.startsWith(spec.lineComment, i)) {
      tokens.push({ text: code.slice(i), type: "comment" });
      break;
    }

    // Strings (single, double, backtick)
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i];
      let end = i + 1;
      while (end < code.length && code[end] !== quote) {
        if (code[end] === "\\") end++; // skip escaped
        end++;
      }
      end = Math.min(end + 1, code.length);
      tokens.push({ text: code.slice(i, end), type: "string" });
      i = end;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i] ?? "") && (i === 0 || /[\s,;(=+\-*/[\]{}<>!&|^~?:]/.test(code[i - 1] ?? ""))) {
      let end = i;
      while (end < code.length && /[\d.xXa-fA-FeE_]/.test(code[end] ?? "")) end++;
      tokens.push({ text: code.slice(i, end), type: "number" });
      i = end;
      continue;
    }

    // Word (keyword/builtin/identifier)
    if (/[a-zA-Z_$]/.test(code[i] ?? "")) {
      let end = i;
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end] ?? "")) end++;
      const word = code.slice(i, end);
      if (spec.keywords.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (spec.builtins.has(word)) {
        tokens.push({ text: word, type: "builtin" });
      } else {
        tokens.push({ text: word, type: null });
      }
      i = end;
      continue;
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(code[i] ?? "")) {
      let end = i;
      while (end < code.length && /[+\-*/%=<>!&|^~?:]/.test(code[end] ?? "")) end++;
      tokens.push({ text: code.slice(i, end), type: "operator" });
      i = end;
      continue;
    }

    // Whitespace and other
    tokens.push({ text: code[i] ?? "", type: null });
    i++;
  }

  return tokens;
}

/** Get the CSS class for a token type */
export function tokenClass(type: TokenType | null): string {
  return type ? TOKEN_CLASSES[type] : "";
}
