import { atom } from "jotai";

import { fileChangeSummaryByTurnAtom } from "~entities/diff";
import { turnOrderAtom } from "~entities/message/turns";
import { toolCallAtomFamily, toolCallIdsByTurnAtom } from "~entities/tool-call";
import type { FileChangeStatus } from "~shared/protocol";

// ─── Types ────────────────────────────────────────────────

export type WorkspaceFileAction = "created" | "modified" | "deleted" | "read";

export interface WorkspaceFileEntry {
  readonly file_path: string;
  readonly action: WorkspaceFileAction;
  readonly turn_id: string;
  readonly language?: string;
}

export interface WorkspaceFileGroup {
  readonly action: WorkspaceFileAction;
  readonly files: readonly WorkspaceFileEntry[];
  readonly count: number;
}

// ─── File Extension to Language Mapping ───────────────────

const EXT_TO_LANGUAGE: Readonly<Record<string, string>> = {
  ts: "typescript",
  tsx: "typescriptreact",
  js: "javascript",
  jsx: "javascriptreact",
  py: "python",
  rs: "rust",
  go: "go",
  java: "java",
  rb: "ruby",
  css: "css",
  html: "html",
  json: "json",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
  sh: "shellscript",
  sql: "sql",
};

export function inferLanguage(filePath: string): string | undefined {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext ? EXT_TO_LANGUAGE[ext] : undefined;
}

// ─── Status → Action mapping ─────────────────────────────

const STATUS_TO_ACTION: Readonly<Record<FileChangeStatus, WorkspaceFileAction>> = {
  added: "created",
  modified: "modified",
  deleted: "deleted",
  renamed: "modified",
};

// ─── Derived: All file changes across all turns ──────────

export const allWorkspaceFileChangesAtom = atom<readonly WorkspaceFileEntry[]>((get) => {
  const turnIds = get(turnOrderAtom);
  const seen = new Set<string>();
  const entries: WorkspaceFileEntry[] = [];

  // Process in reverse so latest turn wins dedup
  for (let i = turnIds.length - 1; i >= 0; i--) {
    const turnId = turnIds[i];
    if (turnId === undefined) continue;
    const summary = get(fileChangeSummaryByTurnAtom(turnId));
    for (const fc of summary.files) {
      if (!seen.has(fc.file_path)) {
        seen.add(fc.file_path);
        entries.push({
          file_path: fc.file_path,
          action: STATUS_TO_ACTION[fc.status],
          turn_id: fc.turn_id,
          language: inferLanguage(fc.file_path),
        });
      }
    }
  }

  return entries;
});

// ─── Derived: Files read by the agent (from tool calls) ──

const READ_TOOL_NAMES = new Set([
  "read_file",
  "Read",
  "cat",
  "head",
  "tail",
  "view_file",
  "read",
  "file_read",
  "ReadFile",
]);

export const allWorkspaceReadFilesAtom = atom<readonly WorkspaceFileEntry[]>((get) => {
  const toolCallsByTurn = get(toolCallIdsByTurnAtom);
  const seen = new Set<string>();
  const entries: WorkspaceFileEntry[] = [];

  for (const [turnId, ids] of Object.entries(toolCallsByTurn)) {
    for (const id of ids) {
      const tc = get(toolCallAtomFamily(id));
      if (!tc) continue;
      if (tc.category !== "read" && !READ_TOOL_NAMES.has(tc.tool_name)) continue;

      const filePath = tc.args_summary.trim();
      if (!filePath || seen.has(filePath)) continue;
      seen.add(filePath);

      entries.push({
        file_path: filePath,
        action: "read",
        turn_id: turnId,
        language: inferLanguage(filePath),
      });
    }
  }

  return entries;
});

// ─── Derived: Grouped workspace files by action ──────────

const ACTION_ORDER: readonly WorkspaceFileAction[] = ["created", "modified", "read", "deleted"];

export const workspaceFileGroupsAtom = atom<readonly WorkspaceFileGroup[]>((get) => {
  const changes = get(allWorkspaceFileChangesAtom);
  const reads = get(allWorkspaceReadFilesAtom);

  // Combine, excluding reads that overlap with changes
  const changePathSet = new Set(changes.map((e) => e.file_path));
  const allEntries = [...changes, ...reads.filter((r) => !changePathSet.has(r.file_path))];

  const grouped = new Map<WorkspaceFileAction, WorkspaceFileEntry[]>();
  for (const entry of allEntries) {
    const group = grouped.get(entry.action) ?? [];
    group.push(entry);
    grouped.set(entry.action, group);
  }

  const result: WorkspaceFileGroup[] = [];
  for (const action of ACTION_ORDER) {
    const files = grouped.get(action);
    if (files) {
      files.sort((a, b) => a.file_path.localeCompare(b.file_path));
      result.push({ action, files, count: files.length });
    }
  }
  return result;
});

// ─── Derived: Total file count ───────────────────────────

export const workspaceFileTotalCountAtom = atom<number>((get) => {
  const groups = get(workspaceFileGroupsAtom);
  return groups.reduce((sum, g) => sum + g.count, 0);
});

// ─── Turn Filter ────────────────────────────────────────

/** Turn ID filter for workspace panel (null = show all turns) */
export const workspaceTurnFilterAtom = atom<string | null>(null);

/** Derived: unique turn IDs from all workspace entries */
export const workspaceTurnIdsAtom = atom<readonly string[]>((get) => {
  const changes = get(allWorkspaceFileChangesAtom);
  const reads = get(allWorkspaceReadFilesAtom);
  const turnSet = new Set<string>();
  for (const e of changes) turnSet.add(e.turn_id);
  for (const e of reads) turnSet.add(e.turn_id);
  return [...turnSet];
});

/** Derived: grouped workspace files filtered by selected turn */
export const filteredWorkspaceFileGroupsAtom = atom<readonly WorkspaceFileGroup[]>((get) => {
  const turnFilter = get(workspaceTurnFilterAtom);
  if (turnFilter === null) return get(workspaceFileGroupsAtom);

  const changes = get(allWorkspaceFileChangesAtom).filter((e) => e.turn_id === turnFilter);
  const reads = get(allWorkspaceReadFilesAtom).filter((e) => e.turn_id === turnFilter);

  const changePathSet = new Set(changes.map((e) => e.file_path));
  const allEntries = [...changes, ...reads.filter((r) => !changePathSet.has(r.file_path))];

  const grouped = new Map<WorkspaceFileAction, WorkspaceFileEntry[]>();
  for (const entry of allEntries) {
    const group = grouped.get(entry.action) ?? [];
    group.push(entry);
    grouped.set(entry.action, group);
  }

  const result: WorkspaceFileGroup[] = [];
  for (const action of ACTION_ORDER) {
    const files = grouped.get(action);
    if (files) {
      files.sort((a, b) => a.file_path.localeCompare(b.file_path));
      result.push({ action, files, count: files.length });
    }
  }
  return result;
});
