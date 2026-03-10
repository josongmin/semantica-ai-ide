/**
 * Utilities for reading VSCode CSS custom properties (theme integration).
 */

/** Read a VSCode CSS variable value from the document root, with a fallback. */
export function getVscodeColor(prop: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || fallback;
}

/** Detect whether the current VSCode theme is dark or light based on editor background luminance. */
export function detectVscodeTheme(): "dark" | "default" {
  const bg = getVscodeColor("--vscode-editor-background", "#1e1e1e");
  if (!bg.startsWith("#") || bg.length < 7) return "dark";
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 128 ? "dark" : "default";
}
