// Agent domain models (RFC-008 canonical)

export type AgentRole = "planner" | "search" | "impact" | "patch" | "test" | "review" | "repair";
export type AgentStatus = "idle" | "assigned" | "running" | "waiting" | "blocked" | "failed" | "completed";

export interface AgentUnit {
  readonly id: string;
  readonly role: AgentRole;
  readonly name: string;
  readonly status: AgentStatus;
  readonly currentTaskId?: string;
  readonly currentStep?: string;
  readonly progress?: number;
}

export interface AgentStep {
  readonly stepId: string;
  readonly agentId: string;
  readonly action: string;
  readonly status: "pending" | "running" | "completed" | "failed";
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly output?: string;
}
