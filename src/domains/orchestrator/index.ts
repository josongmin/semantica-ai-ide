import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "orchestrator",
  label: "Orchestrator",
  icon: "server-process",
  persistence: "session",
  priority: 70,
  component: lazy(() =>
    import("./OrchestratorSurface").then((m) => ({
      default: m.OrchestratorSurface,
    })),
  ),
});

export { AgentFleetPane } from "./AgentFleetPane";
export { ApprovalPane } from "./ApprovalPane";
export { ConvergencePane } from "./ConvergencePane";
export type { OrchestratorPane } from "./orchestratorAtoms";
export {
  activePaneAtom,
  selectedCandidateIdAtom,
  selectedTaskIdAtom,
} from "./orchestratorAtoms";
export { OrchestratorHeader } from "./OrchestratorHeader";
export { OrchestratorSurface } from "./OrchestratorSurface";
export { TaskDagPane } from "./TaskDagPane";
