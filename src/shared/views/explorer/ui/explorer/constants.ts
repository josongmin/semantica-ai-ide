import type { FileChangeStatus } from "~shared/protocol";

export const INDENT_PX = 16;
export const ROW_HEIGHT = 24;

export const STATUS_COLOR: Readonly<Record<FileChangeStatus, string>> = {
  added: "text-vsc-success",
  modified: "text-vsc-warning",
  deleted: "text-vsc-error/60 line-through",
  renamed: "text-vsc-info",
};

export const STATUS_BG: Readonly<Record<FileChangeStatus, string>> = {
  added: "bg-vsc-success/5",
  modified: "bg-vsc-warning/5",
  deleted: "bg-vsc-error/5",
  renamed: "bg-vsc-info/5",
};

export const STATUS_LETTER: Readonly<Record<FileChangeStatus, string>> = {
  added: "A",
  modified: "M",
  deleted: "D",
  renamed: "R",
};

// Re-export from shared for SidebarRow
export { FILE_CHANGE_STATUS_COLOR as STATUS_LETTER_COLOR } from "~shared/ui";

const LANG_META: Readonly<Record<string, { icon: string; color: string }>> = {
  ts: { icon: "symbol-namespace", color: "text-vsc-info" },
  tsx: { icon: "symbol-namespace", color: "text-vsc-info" },
  js: { icon: "symbol-event", color: "text-vsc-warning" },
  jsx: { icon: "symbol-event", color: "text-vsc-warning" },
  py: { icon: "symbol-misc", color: "text-vsc-success" },
  rs: { icon: "gear", color: "text-vsc-warning" },
  go: { icon: "package", color: "text-vsc-info" },
  json: { icon: "json", color: "text-vsc-warning/70" },
  md: { icon: "markdown", color: "text-vsc-text-tertiary" },
  css: { icon: "symbol-color", color: "text-vsc-accent" },
  scss: { icon: "symbol-color", color: "text-vsc-error" },
  html: { icon: "code", color: "text-vsc-warning" },
  vue: { icon: "code", color: "text-vsc-success" },
  svelte: { icon: "code", color: "text-vsc-warning" },
  yaml: { icon: "settings-gear", color: "text-vsc-text-tertiary" },
  yml: { icon: "settings-gear", color: "text-vsc-text-tertiary" },
  toml: { icon: "settings-gear", color: "text-vsc-text-tertiary" },
  lock: { icon: "lock", color: "text-vsc-text-ghost" },
  sh: { icon: "terminal", color: "text-vsc-success" },
  bash: { icon: "terminal", color: "text-vsc-success" },
  zsh: { icon: "terminal", color: "text-vsc-success" },
  cjs: { icon: "symbol-event", color: "text-vsc-warning/70" },
  mjs: { icon: "symbol-event", color: "text-vsc-warning/70" },
};

export function fileMeta(name: string): { icon: string; color: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return LANG_META[ext] ?? { icon: "file", color: "text-vsc-text-tertiary" };
}
