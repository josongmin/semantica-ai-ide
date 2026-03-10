import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

// ─── Types ────────────────────────────────────────────────

export type OverviewSection =
  | "architecture"
  | "modules"
  | "entry-points"
  | "flows"
  | "conventions"
  | "risks";

export type ScanPhase = "scanning" | "analyzing" | "generating" | "done";

export interface ArchNode {
  id: string;
  label: string;
  description: string;
  tech: string[];
}

export interface ArchEdge {
  from: string;
  to: string;
  label: string;
}

export interface ModuleInfo {
  name: string;
  description: string;
  fileCount: number;
  path: string;
}

export interface EntryPoint {
  name: string;
  description: string;
  filePath: string;
  children: { name: string; filePath: string }[];
}

export interface CriticalFlow {
  name: string;
  steps: { label: string; filePath?: string }[];
  description: string;
}

export interface Convention {
  label: string;
  value: string;
}

export interface RiskItem {
  severity: "warning" | "info";
  title: string;
  description: string;
}

export interface RepoOverview {
  projectName: string;
  tagline: string;
  architecture: { nodes: ArchNode[]; edges: ArchEdge[] };
  modules: ModuleInfo[];
  entryPoints: EntryPoint[];
  criticalFlows: CriticalFlow[];
  conventions: Convention[];
  risks: RiskItem[];
}

// ─── Atoms ────────────────────────────────────────────────

export const repoOverviewAtom = atom<RepoOverview | null>(null);
export const repoScanPhaseAtom = atom<ScanPhase>("scanning");
export const repoSectionsLoadedAtom = atom<Set<OverviewSection>>(new Set<OverviewSection>());

// ─── Write atoms ──────────────────────────────────────────

const SECTION_ORDER: OverviewSection[] = [
  "architecture",
  "modules",
  "entry-points",
  "flows",
  "conventions",
  "risks",
];

const PHASE_SCHEDULE: { phase: ScanPhase; delay: number }[] = [
  { phase: "scanning", delay: 0 },
  { phase: "analyzing", delay: 600 },
  { phase: "generating", delay: 1200 },
  { phase: "done", delay: 1800 },
];

const SECTION_DELAYS: number[] = [400, 800, 1200, 1600, 2000, 2400];

/**
 * Progressively loads sections with staggered delays to simulate
 * an AI scanning + analysis pipeline.
 */
export const generateRepoOverviewAtom = atom(null, (_get, set, data: RepoOverview) => {
  set(repoOverviewAtom, data);
  set(repoScanPhaseAtom, "scanning");
  set(repoSectionsLoadedAtom, new Set<OverviewSection>());

  // Phase transitions
  for (const { phase, delay } of PHASE_SCHEDULE) {
    setTimeout(() => set(repoScanPhaseAtom, phase), delay);
  }

  // Section reveals
  SECTION_ORDER.forEach((section, i) => {
    setTimeout(() => {
      set(repoSectionsLoadedAtom, (prev: Set<OverviewSection>) => new Set([...prev, section]));
    }, SECTION_DELAYS[i]);
  });
});

/** Reset all repo-explain state. */
export const clearRepoOverviewAtom = atom(null, (_get, set) => {
  set(repoOverviewAtom, null);
  set(repoScanPhaseAtom, "scanning");
  set(repoSectionsLoadedAtom, new Set<OverviewSection>());
});

registerResetAtom(clearRepoOverviewAtom);
