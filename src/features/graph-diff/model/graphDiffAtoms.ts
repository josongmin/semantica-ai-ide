import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import { MOCK_GRAPH_DIFF_DATA } from "./mockGraphDiffData";

// ─── Types ──────────────────────────────────────────────

export type GraphDiffMode = "off" | "diff" | "flow-trace";

export type NodeChangeType = "changed" | "affected" | "unchanged";

export type EdgeChangeType = "normal" | "impacted" | "new" | "removed";

export interface DiffNode {
  id: string;
  label: string;
  filePath: string;
  line?: number;
  changeType: NodeChangeType;
  /** e.g. ["+ added: rateLimit check", "~ modified: return type"] */
  changes?: string[];
  directCallers: number;
  transitiveDeps: number;
}

export interface DiffEdge {
  source: string;
  target: string;
  changeType: EdgeChangeType;
}

export interface DiffGraphData {
  nodes: DiffNode[];
  edges: DiffEdge[];
  summary: { changed: number; affected: number; total: number };
}

// ─── Primitive atoms ────────────────────────────────────

export const graphDiffModeAtom = atom<GraphDiffMode>("off");

export const graphDiffDataAtom = atom<DiffGraphData | null>(null);

export const graphDiffHoveredNodeAtom = atom<string | null>(null);

export const graphDiffSelectedNodeAtom = atom<string | null>(null);

// ─── Derived / write atoms ──────────────────────────────

const DIFF_MODE_CYCLE: GraphDiffMode[] = ["off", "diff", "flow-trace"];

/** Cycles: off -> diff -> flow-trace -> off */
export const toggleGraphDiffAtom = atom(null, (get, set) => {
  const current = get(graphDiffModeAtom);
  const idx = DIFF_MODE_CYCLE.indexOf(current);
  const nextIdx = (idx + 1) % DIFF_MODE_CYCLE.length;
  const next = DIFF_MODE_CYCLE[nextIdx] ?? "off";
  set(graphDiffModeAtom, next);

  // Auto-load data when entering a diff mode, clear when turning off
  if (next === "off") {
    set(graphDiffDataAtom, null);
    set(graphDiffHoveredNodeAtom, null);
    set(graphDiffSelectedNodeAtom, null);
  } else if (!get(graphDiffDataAtom)) {
    set(graphDiffDataAtom, MOCK_GRAPH_DIFF_DATA);
  }
});

/** Explicitly loads mock diff data into the store. */
export const loadGraphDiffAtom = atom(null, (_get, set) => {
  set(graphDiffDataAtom, MOCK_GRAPH_DIFF_DATA);
});

// ─── Reset ──────────────────────────────────────────────

export const resetGraphDiffStoreAtom = atom(null, (_get, set) => {
  set(graphDiffModeAtom, "off");
  set(graphDiffDataAtom, null);
  set(graphDiffHoveredNodeAtom, null);
  set(graphDiffSelectedNodeAtom, null);
});
registerResetAtom(resetGraphDiffStoreAtom);
