/**
 * Data / config language specs: SQL, YAML, TOML
 *
 * NOTE: JSON and XML are handled natively or externally.
 */

import type { LanguageSpec } from "../languageSpecs";

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "INTO",
  "UPDATE",
  "DELETE",
  "SET",
  "CREATE",
  "DROP",
  "ALTER",
  "TABLE",
  "INDEX",
  "VIEW",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "OUTER",
  "FULL",
  "ON",
  "AND",
  "OR",
  "NOT",
  "IN",
  "IS",
  "NULL",
  "AS",
  "ORDER",
  "BY",
  "GROUP",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "ALL",
  "DISTINCT",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "VALUES",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "CONSTRAINT",
  "DEFAULT",
  "CHECK",
  "UNIQUE",
]) as ReadonlySet<string>;

const SQL_BUILTINS = new Set([
  "COUNT",
  "SUM",
  "AVG",
  "MAX",
  "MIN",
  "COALESCE",
  "NULLIF",
  "CAST",
  "CONVERT",
  "CONCAT",
  "SUBSTRING",
  "TRIM",
  "UPPER",
  "LOWER",
  "LENGTH",
  "REPLACE",
  "NOW",
  "CURRENT_TIMESTAMP",
  "DATE",
  "ROUND",
  "ABS",
  "IF",
  "IFNULL",
  "ROW_NUMBER",
  "RANK",
  "DENSE_RANK",
]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// YAML
// ---------------------------------------------------------------------------

const YAML_KEYWORDS = new Set([
  "true",
  "false",
  "null",
  "yes",
  "no",
  "on",
  "off",
]) as ReadonlySet<string>;

const YAML_BUILTINS = new Set([]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// TOML
// ---------------------------------------------------------------------------

const TOML_KEYWORDS = new Set(["true", "false"]) as ReadonlySet<string>;

const TOML_BUILTINS = new Set([]) as ReadonlySet<string>;

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const dataLanguages: Record<string, LanguageSpec> = {
  sql: {
    keywords: SQL_KEYWORDS,
    builtins: SQL_BUILTINS,
    lineComment: "--",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  yaml: {
    keywords: YAML_KEYWORDS,
    builtins: YAML_BUILTINS,
    lineComment: "#",
  },
  toml: {
    keywords: TOML_KEYWORDS,
    builtins: TOML_BUILTINS,
    lineComment: "#",
  },
};

export const dataExtensions: Record<string, string> = {
  sql: "sql",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
};
