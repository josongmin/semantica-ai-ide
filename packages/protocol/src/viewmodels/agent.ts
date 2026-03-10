import type { AgentUnit, AgentStep } from "../models/agent.js";

export interface AgentRunViewModel {
  readonly agents: AgentUnitView[];
  readonly activeCount: number;
  readonly completedCount: number;
  readonly failedCount: number;
}

export interface AgentUnitView extends AgentUnit {
  readonly steps: AgentStep[];
  readonly elapsedMs?: number;
}
