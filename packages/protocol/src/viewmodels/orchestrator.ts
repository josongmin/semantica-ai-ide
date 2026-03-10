import type { OrchestratorRun, TaskNode, CandidateArtifact } from "../models/orchestrator.js";
import type { AgentUnit } from "../models/agent.js";

export interface MultiAgentOrchestratorViewModel {
  readonly orchestrator: OrchestratorRunView;
  readonly tasks: TaskNodeView[];
  readonly agents: AgentUnitView[];
  readonly candidates: CandidateArtifactView[];
  readonly approvals: ApprovalItemView[];
  readonly convergence?: ConvergenceView;
}

export interface OrchestratorRunView extends OrchestratorRun {
  readonly elapsedMs: number;
  readonly taskCount: number;
  readonly agentCount: number;
}

export interface TaskNodeView extends TaskNode {
  readonly agentName?: string;
  readonly elapsedMs?: number;
  readonly isBlocked: boolean;
  readonly blockedBy: string[];
}

export interface AgentUnitView extends AgentUnit {
  readonly taskTitle?: string;
  readonly elapsedMs?: number;
}

export interface CandidateArtifactView extends CandidateArtifact {
  readonly agentName: string;
  readonly taskTitle: string;
}

export interface ApprovalItemView {
  readonly id: string;
  readonly actionId: string;
  readonly description: string;
  readonly riskLevel: "low" | "medium" | "high" | "critical";
  readonly createdAt: number;
  readonly status: "pending" | "approved" | "rejected" | "timeout";
}

export interface ConvergenceView {
  readonly mode: "single_candidate" | "multi_candidate_compare" | "repair_loop";
  readonly selectedCandidateId?: string;
  readonly candidateScores: CandidateScore[];
}

export interface CandidateScore {
  readonly candidateId: string;
  readonly score: number;
  readonly reasons: string[];
}
