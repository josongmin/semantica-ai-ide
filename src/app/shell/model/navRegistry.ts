// ─── Navigation Registry (RFC-017) ─────────────────────────
//
// Category-based navigation for AI-native shell.
// Each NavCategory maps to a content mode (classic IDE or dashboard).

import { atom } from "jotai";

// ─── Types ──────────────────────────────────────────────

export type NavCategoryId =
  | "ide"
  | "agent"
  | "graph"
  | "intelligence"
  | "architecture"
  | "security"
  | "monitor";

export type NavToolId = "terminal" | "db" | "settings";

export interface NavCategory {
  readonly id: NavCategoryId;
  readonly label: string;
  readonly icon: string;
  readonly priority: number;
}

export interface NavTool {
  readonly id: NavToolId;
  readonly label: string;
  readonly icon: string;
}

// ─── Static Definitions ─────────────────────────────────

export const NAV_CATEGORIES: readonly NavCategory[] = [
  { id: "ide", label: "IDE", icon: "code", priority: 0 },
  { id: "agent", label: "Agent", icon: "hubot", priority: 10 },
  { id: "graph", label: "Graph", icon: "graph-line", priority: 20 },
  { id: "intelligence", label: "Intelligence", icon: "lightbulb", priority: 30 },
  { id: "architecture", label: "Architecture", icon: "symbol-structure", priority: 40 },
  { id: "security", label: "Security", icon: "shield", priority: 50 },
  { id: "monitor", label: "Monitor", icon: "dashboard", priority: 60 },
];

export const NAV_TOOLS: readonly NavTool[] = [
  { id: "terminal", label: "Terminal", icon: "terminal" },
  { id: "settings", label: "Settings", icon: "gear" },
];

/** Footer items (알림, 더보기, 테마, 단축키, 계정) — 스크린샷 스타일 */
export type NavFooterId = "notifications" | "more" | "theme" | "shortcuts" | "account";

export interface NavFooterItem {
  readonly id: NavFooterId;
  readonly label: string;
  readonly icon: string;
  /** "dot" = 알림 점, 그 외 = 텍스트 배지 (e.g. "SM") */
  readonly badge?: string;
}

export const NAV_FOOTER_ITEMS: readonly NavFooterItem[] = [
  { id: "notifications", label: "알림", icon: "bell", badge: "dot" },
  { id: "more", label: "더보기", icon: "ellipsis" },
  { id: "theme", label: "테마", icon: "color-mode" },
  { id: "shortcuts", label: "단축키", icon: "key" },
  { id: "account", label: "계정", icon: "account", badge: "SM" },
];

// ─── Section grouping (Render-style expanded sidebar) ─────

export type NavSectionId = "main" | "integrations" | "workspace";

export interface NavSection {
  readonly id: NavSectionId;
  readonly label: string;
  readonly categoryIds: readonly NavCategoryId[];
  readonly toolIds?: readonly NavToolId[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "main",
    label: "",
    categoryIds: ["ide", "agent", "graph"],
  },
  {
    id: "integrations",
    label: "INTEGRATIONS",
    categoryIds: ["intelligence", "architecture", "security"],
  },
  {
    id: "workspace",
    label: "WORKSPACE",
    categoryIds: ["monitor"],
    toolIds: ["terminal", "settings"],
  },
];

// ─── State ──────────────────────────────────────────────

export const activeNavCategoryAtom = atom<NavCategoryId>("ide");
