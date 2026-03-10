/**
 * Workflow Templates — RFC-TERMINAL-018 §6
 * Parameterized, reusable command sequences for terminal execution.
 */

/** Parameter definition for a workflow template */
export interface WorkflowParam {
  readonly name: string;
  readonly label: string;
  readonly type: "string" | "select" | "boolean" | "number";
  readonly default?: string | number | boolean;
  readonly options?: readonly string[]; // for "select" type
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly description?: string;
}

/** A single step in a workflow */
export interface WorkflowStep {
  readonly id: string;
  readonly label: string;
  /** Command template with {{param}} placeholders */
  readonly command: string;
  /** Condition expression — step runs only if truthy. Supports "{{param}}" == "value" checks */
  readonly condition?: string;
  /** Whether to continue on failure (default: false — stops workflow on error) */
  readonly continueOnError?: boolean;
  /** Working directory override (supports {{param}} substitution) */
  readonly cwd?: string;
  /** Expected exit code (default: 0). Use null to skip exit code check */
  readonly expectedExitCode?: number | null;
}

/** Status of a step during workflow execution */
export type WorkflowStepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";

/** Runtime state of a step */
export interface WorkflowStepState {
  readonly stepId: string;
  readonly status: WorkflowStepStatus;
  readonly exitCode?: number;
  readonly duration?: number;
  readonly output?: string;
  readonly error?: string;
}

/** A complete workflow template */
export interface WorkflowTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string; // codicon name
  readonly category: "build" | "test" | "deploy" | "git" | "dev" | "custom";
  readonly params: readonly WorkflowParam[];
  readonly steps: readonly WorkflowStep[];
  readonly tags?: readonly string[];
  /** Author info (for shared/marketplace workflows) */
  readonly author?: string;
  readonly version?: string;
}

/** Execution state of a running workflow */
export type WorkflowExecutionStatus = "idle" | "running" | "completed" | "failed" | "cancelled";

export interface WorkflowExecution {
  readonly executionId: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly status: WorkflowExecutionStatus;
  readonly params: Record<string, string | number | boolean>;
  readonly stepStates: readonly WorkflowStepState[];
  readonly currentStepIndex: number;
  readonly startedAt: number;
  readonly completedAt?: number;
}
