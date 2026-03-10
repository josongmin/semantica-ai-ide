/**
 * Web language specs: HTML, CSS, SCSS
 *
 * NOTE: JS/TS/JSX/TSX specs live in syntaxHighlight.ts (core languages).
 * This module only covers the extended web languages.
 */

import type { LanguageSpec } from "../languageSpecs";

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const HTML_KEYWORDS = new Set(["doctype"]) as ReadonlySet<string>;

const HTML_BUILTINS = new Set([
  "html",
  "head",
  "body",
  "div",
  "span",
  "p",
  "a",
  "img",
  "ul",
  "ol",
  "li",
  "table",
  "tr",
  "td",
  "th",
  "form",
  "input",
  "button",
  "select",
  "option",
  "textarea",
  "label",
  "section",
  "article",
  "header",
  "footer",
  "nav",
  "main",
  "aside",
  "script",
  "style",
  "link",
  "meta",
  "title",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS_KEYWORDS = new Set([
  "important",
  "inherit",
  "initial",
  "unset",
  "revert",
]) as ReadonlySet<string>;

const CSS_BUILTINS = new Set([
  "@media",
  "@import",
  "@keyframes",
  "@font-face",
  "@supports",
  "@layer",
  "@container",
  "@property",
  "var",
  "calc",
  "min",
  "max",
  "clamp",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "url",
  "linear-gradient",
  "radial-gradient",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// SCSS
// ---------------------------------------------------------------------------

const SCSS_KEYWORDS = new Set([
  "important",
  "inherit",
  "initial",
  "unset",
  "revert",
  "mixin",
  "include",
  "extend",
  "if",
  "else",
  "for",
  "each",
  "while",
  "function",
  "return",
  "use",
  "forward",
]) as ReadonlySet<string>;

const SCSS_BUILTINS = new Set([
  "@media",
  "@import",
  "@keyframes",
  "@font-face",
  "@supports",
  "@mixin",
  "@include",
  "@extend",
  "@if",
  "@else",
  "@for",
  "@each",
  "@while",
  "@function",
  "@return",
  "@use",
  "@forward",
  "@at-root",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const webLanguages: Record<string, LanguageSpec> = {
  html: {
    keywords: HTML_KEYWORDS,
    builtins: HTML_BUILTINS,
    lineComment: "",
    blockCommentStart: "<!--",
    blockCommentEnd: "-->",
  },
  css: {
    keywords: CSS_KEYWORDS,
    builtins: CSS_BUILTINS,
    lineComment: "",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  scss: {
    keywords: SCSS_KEYWORDS,
    builtins: SCSS_BUILTINS,
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
};

export const webExtensions: Record<string, string> = {
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
};
