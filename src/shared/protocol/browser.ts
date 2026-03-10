/**
 * Browser Types
 */

// ─── Browser ───────────────────────────────────────────────
export type BrowserConsoleLevel = "log" | "info" | "warn" | "error";
export interface BrowserConsoleEntry {
  readonly id: string;
  readonly timestamp_ms: number;
  readonly level: BrowserConsoleLevel;
  readonly message: string;
  readonly source?: string;
}
export interface BrowserState {
  readonly url: string;
  readonly loading: boolean;
  readonly title?: string;
  readonly screenshot_data_url?: string;
  readonly error?: string;
}

// ─── Browser Action ────────────────────────────────────────
export type BrowserActionType = "click" | "type" | "navigate" | "screenshot" | "scroll";

export interface BrowserAction {
  readonly id: string;
  readonly type: BrowserActionType;
  readonly target?: string;
  readonly value?: string;
  readonly timestamp_ms: number;
  readonly screenshot_url?: string;
}
