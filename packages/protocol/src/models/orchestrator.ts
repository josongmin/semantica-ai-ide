// Orchestrator domain models (RFC-008 canonical)

export type OrchestratorStatus = "planning" | "running" | "converging" | "awaiting_approval" | "completed" | "failed";
export type TaskType = "search" | "analysis" | "patch" | "test" | "review" | "repair";
export type TaskStatus = "queued" | "ready" | "running" | "blocked" | "completed" | "failed";
export type TaskPriority = "low" | "normal" | "high" | "critical";
export type CandidateKind = "patch" | "analysis_bundle" | "review_bundle" | "repair_proposal";
export type CandidateStatus = "draft" | "ready" | "selected" | "discarded";

export interface OrchestratorRun {
  readonly id: string;
  readonly intent: string;
  readonly status: OrchestratorStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly planId: string;
  readonly activeAgentIds: string[];
  readonly candidateIds: string[];
}

export interface TaskNode {
  readonly id: string;
  readonly title: string;
  readonly type: TaskType;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dependsOn: string[];
  readonly assignedAgentId?: string;
  readonly outputs?: string[];
}

export interface CandidateArtifact {
  readonly id: string;
  readonly kind: CandidateKind;
  readonly sourceAgentId: string;
  readonly relatedTaskId: string;
  readonly patchId?: string;
  readonly reviewEvidenceId?: string;
  readonly score?: number;
  readonly status: CandidateStatus;
}
