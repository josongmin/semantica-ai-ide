/**
 * Workflow Panel constants — extracted from WorkflowPanel.tsx
 *
 * Category icon/color maps and tab definitions used across
 * multiple workflow sub-components.
 */

// ─── Types ──────────────────────────────────────────────────

export type PanelTab = "templates" | "running" | "history";

// ─── Constants ──────────────────────────────────────────────

export const CATEGORY_ICONS: Record<string, string> = {
  build: "tools",
  test: "beaker",
  deploy: "cloud-upload",
  git: "git-branch",
  dev: "code",
  custom: "extensions",
};

export const CATEGORY_COLORS: Record<string, string> = {
  build: "text-vsc-warning",
  test: "text-vsc-success",
  deploy: "text-vsc-info",
  git: "text-vsc-warning",
  dev: "text-vsc-accent",
  custom: "text-vsc-text-secondary",
};

export const TAB_ITEMS: { id: PanelTab; label: string; icon: string }[] = [
  { id: "templates", label: "Templates", icon: "library" },
  { id: "running", label: "Running", icon: "play" },
  { id: "history", label: "History", icon: "history" },
];

// ─── Helpers ────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}m ${remSec}s`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
