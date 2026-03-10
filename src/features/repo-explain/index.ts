/**
 * Repo explain feature — public API.
 */
export { MOCK_REPO_OVERVIEW } from "./model/mockRepoData";
export type {
  ArchEdge,
  ArchNode,
  Convention,
  CriticalFlow,
  EntryPoint,
  ModuleInfo,
  OverviewSection,
  RepoOverview,
  RiskItem,
  ScanPhase,
} from "./model/repoExplainAtoms";
export {
  clearRepoOverviewAtom,
  generateRepoOverviewAtom,
  repoOverviewAtom,
  repoScanPhaseAtom,
  repoSectionsLoadedAtom,
} from "./model/repoExplainAtoms";
export type { ArchitectureInfo, DirectoryEntry } from "./ui/ArchitectureSection";
export { ArchitectureSection } from "./ui/ArchitectureSection";
export type { DataFlow, FlowStep } from "./ui/FlowsSection";
export { FlowsSection } from "./ui/FlowsSection";
export { ModulesSection } from "./ui/ModulesSection";
export type { RepoExplainData, RepoExplainPanelProps,RepoExplainTab } from "./ui/RepoExplainPanel";
export { RepoExplainPanel } from "./ui/RepoExplainPanel";
export type { RiskSeverity } from "./ui/RisksSection";
export { RisksSection } from "./ui/RisksSection";
