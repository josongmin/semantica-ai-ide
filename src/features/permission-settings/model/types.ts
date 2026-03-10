import type { ToolCategory } from "../../../shared/protocol";

/** Per-category permission level */
export type CategoryPermission = "auto" | "ask" | "block";

/** Category permission entry */
export interface CategoryPermissionEntry {
  readonly category: ToolCategory;
  readonly permission: CategoryPermission;
}

/** Category metadata for the settings UI */
export interface CategorySettingsMeta {
  readonly category: ToolCategory;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

/** Preset name for quick configuration */
export type PermissionPreset = "conservative" | "balanced" | "turbo";

/** Category settings metadata for the settings UI */
export const CATEGORY_SETTINGS: readonly CategorySettingsMeta[] = [
  { category: "read", label: "Read Files", description: "Reading file contents", icon: "file" },
  { category: "search", label: "Search", description: "Searching code and files", icon: "search" },
  {
    category: "write",
    label: "Write Files",
    description: "Creating or editing files",
    icon: "edit",
  },
  {
    category: "delete",
    label: "Delete",
    description: "Deleting files or directories",
    icon: "trash",
  },
  {
    category: "terminal",
    label: "Terminal",
    description: "Running shell commands",
    icon: "terminal",
  },
  {
    category: "git",
    label: "Git",
    description: "Git operations (commit, push, etc.)",
    icon: "git-commit",
  },
  {
    category: "analysis",
    label: "Analysis",
    description: "Code analysis and diagnostics",
    icon: "lightbulb",
  },
  {
    category: "other",
    label: "Other",
    description: "Uncategorized operations",
    icon: "extensions",
  },
];

/** Default permissions per category */
export const DEFAULT_PERMISSIONS: ReadonlyMap<ToolCategory, CategoryPermission> = new Map([
  ["read", "auto"],
  ["search", "auto"],
  ["write", "ask"],
  ["delete", "ask"],
  ["terminal", "ask"],
  ["git", "ask"],
  ["analysis", "auto"],
  ["other", "ask"],
]);

/** Preset configurations */
export const PERMISSION_PRESETS: Record<
  PermissionPreset,
  ReadonlyMap<ToolCategory, CategoryPermission>
> = {
  conservative: new Map([
    ["read", "ask"],
    ["search", "ask"],
    ["write", "ask"],
    ["delete", "ask"],
    ["terminal", "ask"],
    ["git", "ask"],
    ["analysis", "ask"],
    ["other", "ask"],
  ]),
  balanced: new Map([
    ["read", "auto"],
    ["search", "auto"],
    ["write", "ask"],
    ["delete", "ask"],
    ["terminal", "ask"],
    ["git", "ask"],
    ["analysis", "auto"],
    ["other", "ask"],
  ]),
  turbo: new Map([
    ["read", "auto"],
    ["search", "auto"],
    ["write", "auto"],
    ["delete", "ask"],
    ["terminal", "auto"],
    ["git", "auto"],
    ["analysis", "auto"],
    ["other", "auto"],
  ]),
};
