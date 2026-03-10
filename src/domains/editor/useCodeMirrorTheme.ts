import { useMemo } from "react";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useAtomValue } from "jotai";

import {
  LIGHT_THEME_IDS,
  THEME_PRESETS,
  type ThemeId,
  themeIdAtom,
} from "~shared/lib/theme";

// ─── Helpers ─────────────────────────────────────────────

/**
 * Get preset colors directly from THEME_PRESETS — no CSS variable reads.
 * This ensures editor themes update synchronously with themeIdAtom changes,
 * without waiting for useEffect to apply CSS vars to :root.
 */
function getPresetColors(themeId: ThemeId): Record<string, string> {
  const preset = THEME_PRESETS.find((p) => p.id === themeId);
  const fallbackPreset = THEME_PRESETS[0];
  return preset?.colors ?? fallbackPreset?.colors ?? {};
}

// ─── Build CodeMirror theme extension ────────────────────

/**
 * Builds a CodeMirror theme that includes both the editor chrome styles AND
 * syntax-token colors via `.tok-*` class selectors (used by classHighlighter).
 *
 * This avoids HighlightStyle.define + syntaxHighlighting which relies on
 * StyleModule CSS injection — that can be blocked/overridden by Tailwind v4's
 * @tailwindcss/vite plugin or CSS cascade layer ordering.
 */
function buildCodeMirrorTheme(themeId: ThemeId): Extension {
  const isLight = LIGHT_THEME_IDS.has(themeId);
  const colors = getPresetColors(themeId);
  const c = (v: string) => colors[v] ?? "#000";

  const bg = c("--color-vsc-bg");
  const fg = c("--color-vsc-fg");
  const border = c("--color-vsc-border");
  const surface1 = c("--color-vsc-surface-1");
  const surface2 = c("--color-vsc-surface-2");
  const surface3 = c("--color-vsc-surface-3");
  const selection = c("--color-vsc-selection");
  const accent = c("--color-vsc-accent");
  const textGhost = c("--color-vsc-text-ghost");
  const textSecondary = c("--color-vsc-text-secondary");

  const keyword = c("--color-vsc-keyword");
  const string = c("--color-vsc-string");
  const comment = c("--color-vsc-comment");
  const number = c("--color-vsc-number");
  const fn = c("--color-vsc-function");
  const property = c("--color-vsc-property");

  return EditorView.theme(
    {
      // ── Editor chrome ──────────────────────────────────
      "&": {
        color: fg,
        backgroundColor: bg,
        fontSize: "12px",
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
      },
      ".cm-content": {
        caretColor: fg,
        fontFamily: "inherit",
        lineHeight: "20px",
        padding: "8px 0",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: fg,
        borderLeftWidth: "2px",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: accent,
      },
      ".cm-activeLine": {
        backgroundColor: surface2,
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: selection,
      },
      ".cm-selectionMatch": {
        backgroundColor: `${accent}26`,
      },
      ".cm-gutters": {
        backgroundColor: bg,
        color: textGhost,
        border: "none",
        paddingRight: "8px",
      },
      ".cm-activeLineGutter": {
        backgroundColor: surface2,
        color: textSecondary,
      },
      ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 8px 0 16px",
        minWidth: "3ch",
      },
      ".cm-foldGutter .cm-gutterElement": {
        padding: "0 4px",
      },
      ".cm-foldPlaceholder": {
        backgroundColor: surface3,
        border: `1px solid ${border}`,
        color: textGhost,
        borderRadius: "3px",
        padding: "0 6px",
        margin: "0 4px",
      },
      // Matching brackets
      "&.cm-focused .cm-matchingBracket": {
        backgroundColor: `${accent}33`,
        outline: `1px solid ${textGhost}`,
      },
      "&.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: `${c("--color-vsc-error")}33`,
      },
      // Panels (search, etc.)
      ".cm-panels": {
        backgroundColor: surface1,
        color: fg,
        borderBottom: `1px solid ${border}`,
      },
      ".cm-panels.cm-panels-top": {
        borderBottom: `1px solid ${border}`,
      },
      ".cm-panels.cm-panels-bottom": {
        borderTop: `1px solid ${border}`,
      },
      // Search
      ".cm-searchMatch": {
        backgroundColor: `${accent}33`,
        outline: `1px solid ${accent}66`,
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: `${accent}55`,
      },
      // Tooltips & autocomplete
      ".cm-tooltip": {
        backgroundColor: surface1,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      },
      ".cm-tooltip.cm-tooltip-autocomplete": {
        "& > ul > li": {
          padding: "2px 8px",
        },
        "& > ul > li[aria-selected]": {
          backgroundColor: surface2,
          color: fg,
        },
      },
      ".cm-tooltip-hover": {
        backgroundColor: surface1,
        border: `1px solid ${border}`,
      },
      // Scrollbar — thin, visible only while scrolling
      "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
        width: "6px",
        height: "6px",
      },
      "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
        backgroundColor: "transparent",
        borderRadius: "3px",
        transition: "background-color 0.3s ease",
      },
      "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
        backgroundColor: "transparent",
      },
      "&:hover::-webkit-scrollbar-thumb, & *:hover::-webkit-scrollbar-thumb": {
        backgroundColor: surface3,
      },
      // Indent guides via background
      ".cm-indent-markers > span::before": {
        borderColor: surface3,
      },

      // ── Syntax token colors (classHighlighter .tok-* classes) ──
      ".tok-keyword": { color: keyword },
      ".tok-operator": { color: textSecondary },
      ".tok-number": { color: number },
      ".tok-string": { color: string },
      ".tok-string2": { color: string },
      ".tok-comment": { color: comment, fontStyle: "italic" },
      ".tok-variableName": { color: fg },
      ".tok-variableName2": { color: fn },
      ".tok-definition": { color: fn },
      ".tok-punctuation": { color: textSecondary },
      ".tok-propertyName": { color: property },
      ".tok-typeName": { color: accent },
      ".tok-className": { color: accent },
      ".tok-namespace": { color: accent },
      ".tok-macroName": { color: fn },
      ".tok-literal": { color: number },
      ".tok-bool": { color: number },
      ".tok-atom": { color: number },
      ".tok-separator": { color: textSecondary },
      ".tok-labelName": { color: fn },
      ".tok-attributeName": { color: accent },
      ".tok-attributeValue": { color: string },
      ".tok-heading": { color: keyword, fontWeight: "bold" },
      ".tok-link": { color: c("--color-vsc-link"), textDecoration: "underline" },
      ".tok-emphasis": { fontStyle: "italic" },
      ".tok-strong": { fontWeight: "bold" },
      ".tok-invalid": { color: c("--color-vsc-error") },
      ".tok-meta": { color: textGhost },
    },
    { dark: !isLight },
  );
}

// ─── Hook ────────────────────────────────────────────────

export function useCodeMirrorTheme(): Extension {
  const themeId = useAtomValue(themeIdAtom);
  return useMemo(() => buildCodeMirrorTheme(themeId), [themeId]);
}
