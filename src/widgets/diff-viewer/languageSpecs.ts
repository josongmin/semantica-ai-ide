/**
 * Extended language specifications for syntax highlighting.
 *
 * The core languages (ts, tsx, js, jsx, py, rs, go) live in syntaxHighlight.ts.
 * Language definitions have been decomposed into family packs under ./languages/.
 * This module re-exports everything for backward compatibility.
 */

export interface LanguageSpec {
  keywords: ReadonlySet<string>;
  builtins: ReadonlySet<string>;
  lineComment: string;
  blockCommentStart?: string;
  blockCommentEnd?: string;
}

export { EXTENSION_MAP,LANGUAGES } from "./languages/index";
