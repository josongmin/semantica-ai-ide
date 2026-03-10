import type React from "react";

// ─── Platform Detection ─────────────────────────────────

export type PlatformKind = "tauri" | "vscode" | "browser";

export const IS_TAURI =
  typeof window !== "undefined" &&
  ("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

export const IS_MAC =
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- navigator.userAgentData is not widely supported yet
  typeof navigator !== "undefined" && navigator.platform.includes('Mac');

export const HAS_TRAFFIC_LIGHTS = IS_TAURI && IS_MAC;

export function detectPlatform(): PlatformKind {
  if (IS_TAURI) return "tauri";
  if (typeof acquireVsCodeApi === "function") return "vscode";
  return "browser";
}

declare function acquireVsCodeApi(): unknown;

// ─── Tauri Window Drag ──────────────────────────────────
// Lightning CSS (Tailwind v4) strips -webkit-app-region,
// so we handle drag programmatically via Tauri IPC.

const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, [role='tab']";

/**
 * `onMouseDown` handler that initiates Tauri window drag
 * when the user clicks on a non-interactive area.
 */
export function startTauriDrag(e: React.MouseEvent): void {
  if (!IS_TAURI) return;
  const target = e.target as HTMLElement;
  if (target.closest(INTERACTIVE_SELECTOR)) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Tauri internals are untyped at build time
  (window as any).__TAURI_INTERNALS__?.invoke("plugin:window|start_dragging");
}

/**
 * `onDoubleClick` handler that toggles Tauri window maximize/restore
 * when the user double-clicks on a non-interactive area.
 */
export function toggleTauriMaximize(e: React.MouseEvent): void {
  if (!IS_TAURI) return;
  const target = e.target as HTMLElement;
  if (target.closest(INTERACTIVE_SELECTOR)) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Tauri internals are untyped at build time
  (window as any).__TAURI_INTERNALS__?.invoke("plugin:window|toggle_maximize");
}
