import { AgentFleetPane } from "./AgentFleetPane";
import { ApprovalPane } from "./ApprovalPane";
import { ConvergencePane } from "./ConvergencePane";
import { OrchestratorHeader } from "./OrchestratorHeader";
import { TaskDagPane } from "./TaskDagPane";

export function OrchestratorSurface() {
  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* Header */}
      <OrchestratorHeader />

      {/* Main Content: Task DAG + Agent Fleet side by side */}
      <div className="flex flex-1 min-h-0">
        <TaskDagPane />
        <AgentFleetPane />
      </div>

      {/* Convergence Pane */}
      <ConvergencePane />

      {/* Approval / Policy Pane */}
      <ApprovalPane />
    </div>
  );
}
