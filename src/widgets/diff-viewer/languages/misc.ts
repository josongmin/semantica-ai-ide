/**
 * Miscellaneous language specs: Dockerfile, Groovy, Markdown
 */

import type { LanguageSpec } from "../languageSpecs";

// ---------------------------------------------------------------------------
// Dockerfile
// ---------------------------------------------------------------------------

const DOCKERFILE_KEYWORDS = new Set([
  "FROM",
  "RUN",
  "CMD",
  "LABEL",
  "MAINTAINER",
  "EXPOSE",
  "ENV",
  "ADD",
  "COPY",
  "ENTRYPOINT",
  "VOLUME",
  "USER",
  "WORKDIR",
  "ARG",
  "ONBUILD",
  "STOPSIGNAL",
  "HEALTHCHECK",
  "SHELL",
  "AS",
]) as ReadonlySet<string>;

const DOCKERFILE_BUILTINS = new Set([
  "apt-get",
  "yum",
  "apk",
  "pip",
  "npm",
  "yarn",
  "curl",
  "wget",
  "chmod",
  "chown",
  "mkdir",
  "rm",
  "cp",
  "mv",
  "ln",
  "cat",
  "echo",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// Groovy
// ---------------------------------------------------------------------------

const GROOVY_KEYWORDS = new Set([
  "abstract",
  "as",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "def",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "trait",
  "transient",
  "true",
  "try",
  "void",
  "volatile",
  "while",
]) as ReadonlySet<string>;

const GROOVY_BUILTINS = new Set([
  "println",
  "print",
  "sprintf",
  "String",
  "Integer",
  "Boolean",
  "List",
  "Map",
  "Set",
  "Closure",
  "GString",
  "BigDecimal",
  "BigInteger",
  "Binding",
  "GroovyShell",
  "JsonSlurper",
  "JsonOutput",
  "MarkupBuilder",
  "XmlSlurper",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

const MARKDOWN_KEYWORDS = new Set([]) as ReadonlySet<string>;

const MARKDOWN_BUILTINS = new Set([]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// Elixir
// ---------------------------------------------------------------------------

const ELIXIR_KEYWORDS = new Set([
  "after",
  "and",
  "case",
  "catch",
  "cond",
  "def",
  "defmodule",
  "defp",
  "defstruct",
  "defprotocol",
  "defimpl",
  "defmacro",
  "defguard",
  "do",
  "else",
  "end",
  "false",
  "fn",
  "for",
  "if",
  "import",
  "in",
  "nil",
  "not",
  "or",
  "quote",
  "raise",
  "receive",
  "require",
  "rescue",
  "return",
  "true",
  "try",
  "unless",
  "unquote",
  "use",
  "when",
  "with",
]) as ReadonlySet<string>;

const ELIXIR_BUILTINS = new Set([
  "Enum",
  "List",
  "Map",
  "String",
  "IO",
  "Kernel",
  "Agent",
  "Task",
  "GenServer",
  "Supervisor",
  "Application",
  "Logger",
  "inspect",
  "put_in",
  "get_in",
  "update_in",
  "hd",
  "tl",
  "length",
  "elem",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const miscLanguages: Record<string, LanguageSpec> = {
  dockerfile: {
    keywords: DOCKERFILE_KEYWORDS,
    builtins: DOCKERFILE_BUILTINS,
    lineComment: "#",
  },
  groovy: {
    keywords: GROOVY_KEYWORDS,
    builtins: GROOVY_BUILTINS,
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  markdown: {
    keywords: MARKDOWN_KEYWORDS,
    builtins: MARKDOWN_BUILTINS,
    lineComment: "",
  },
  elixir: {
    keywords: ELIXIR_KEYWORDS,
    builtins: ELIXIR_BUILTINS,
    lineComment: "#",
  },
};

export const miscExtensions: Record<string, string> = {
  dockerfile: "dockerfile",
  groovy: "groovy",
  gvy: "groovy",
  md: "markdown",
  ex: "elixir",
  exs: "elixir",
};
