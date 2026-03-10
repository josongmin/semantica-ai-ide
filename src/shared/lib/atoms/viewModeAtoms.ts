import { atom } from "jotai";

import type { ToolCategory } from "../../protocol";

// ─── View Mode Atoms ──────────────────────────────────────

/** Diff viewer mode: inline (default) or side-by-side */
export type DiffViewMode = "inline" | "side-by-side";
export const diffViewModeAtom = atom<DiffViewMode>("inline");

/** File change view mode: list (default) or tree */
export type FileViewMode = "list" | "tree";
export const fileViewModeAtom = atom<FileViewMode>("list");

/** Tool category filter: empty set = show all */
export const toolCategoryFilterAtom = atom<ReadonlySet<ToolCategory>>(new Set<ToolCategory>());
