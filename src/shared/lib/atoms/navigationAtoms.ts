import { atom } from "jotai";

// ─── Settings Page ──────────────────────────────────────

/** Settings page active tab (allows external navigation to a specific tab) */
export type SettingsTab =
  | "appearance"
  | "account"
  | "model"
  | "pipeline"
  | "permissions"
  | "mcp"
  | "rules"
  | "hooks"
  | "audit";
export const settingsTabAtom = atom<SettingsTab>("account");
