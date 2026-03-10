import { useMemo } from "react";

import type { FileTreeNode as FileTreeNodeType } from "~shared/lib";

export interface AgentPresence {
  agentName: string;
  color: string;
  status: "queued" | "active" | "done";
}

export function useAgentPresence(): ReadonlyMap<string, AgentPresence[]> {
  return useMemo(() => {
    const m = new Map<string, AgentPresence[]>();
    // Mock data — in production this comes from kernel events
    return m;
  }, []);
}

export function deriveProjectName(files: readonly string[]): string {
  if (files.length === 0) return "Workspace";
  const first = files[0]?.replace(/\\/g, "/") ?? "";
  const top = first.split("/").find(Boolean);
  return top ?? "Workspace";
}

export function collectAllFolders(nodes: readonly FileTreeNodeType[], out: Set<string>) {
  for (const n of nodes) {
    if (n.isFolder) {
      out.add(n.path);
      collectAllFolders(n.children, out);
    }
  }
}

// ── Language detection from file extensions ──────────────

const EXT_LANG: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  go: "Go",
  java: "Java",
  rb: "Ruby",
  swift: "Swift",
  kt: "Kotlin",
  cs: "C#",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  h: "C++",
  hpp: "C++",
  c: "C",
  php: "PHP",
  dart: "Dart",
  vue: "Vue",
  svelte: "Svelte",
};

export interface ProjectStats {
  folders: number;
  files: number;
  primaryLang: string | null;
  langBreakdown: readonly { lang: string; count: number; pct: number }[];
}

export function deriveProjectStats(
  files: readonly string[],
  tree: readonly FileTreeNodeType[],
): ProjectStats {
  const { folders, files: fileCount } = countTree(tree);

  // Count by language
  const langCounts = new Map<string, number>();
  for (const f of files) {
    const ext = f.split(".").pop()?.toLowerCase() ?? "";
    const lang = EXT_LANG[ext];
    if (lang) langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1);
  }

  const sorted = [...langCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const sum = sorted.reduce((s, [, c]) => s + c, 0);
  const codeFiles = sum === 0 ? fileCount : sum;
  const langBreakdown = sorted.map(([lang, count]) => ({
    lang,
    count,
    pct: Math.round((count / codeFiles) * 100),
  }));

  return {
    folders,
    files: fileCount,
    primaryLang: sorted[0]?.[0] ?? null,
    langBreakdown,
  };
}

export function countTree(nodes: readonly FileTreeNodeType[]): { folders: number; files: number } {
  let folders = 0;
  let files = 0;
  for (const n of nodes) {
    if (n.isFolder) {
      folders++;
      const sub = countTree(n.children);
      folders += sub.folders;
      files += sub.files;
    } else {
      files++;
    }
  }
  return { folders, files };
}
