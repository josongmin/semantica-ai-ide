/**
 * DevOps / Infrastructure Protocol Types
 *
 * Terminal streaming, tests, diagnostics, quota, notification, auth,
 * hooks, worktree, CI/CD, security, deploy, debug, sandbox, plugin,
 * agent wave, verifier, living spec, schedule, steer, and bugbot.
 */

import type { ReviewSeverity } from "./session";

// ─── Terminal Output (streaming) ─────────────────────────────
export type TerminalStreamType = "stdout" | "stderr";

export interface TerminalChunk {
  readonly tool_call_id: string;
  readonly stream: TerminalStreamType;
  readonly chunk: string;
  readonly timestamp_ms: number;
}

// ─── Test Results ────────────────────────────────────────────
export type TestStatus = "pass" | "fail" | "skip" | "error";
export type TestRunnerStatus = "idle" | "running" | "pass" | "fail";

export interface TestCase {
  readonly name: string;
  readonly suite?: string;
  readonly status: TestStatus;
  readonly duration_ms?: number;
  readonly error_message?: string;
  readonly file_path?: string;
  readonly line?: number;
}

export interface TestResults {
  readonly runner_status: TestRunnerStatus;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly duration_ms: number;
  readonly cases: readonly TestCase[];
  readonly command?: string;
  readonly turn_id?: string;
}

// ─── Diagnostics (Lint / Compiler) ───────────────────────────
export type DiagnosticSeverity = "error" | "warning" | "info" | "hint";
export type DiagnosticSource = "linter" | "compiler" | "type_checker" | "formatter" | "custom";

export interface Diagnostic {
  readonly id: string;
  readonly file_path: string;
  readonly line: number;
  readonly column?: number;
  readonly end_line?: number;
  readonly end_column?: number;
  readonly severity: DiagnosticSeverity;
  readonly source: DiagnosticSource;
  readonly code?: string;
  readonly message: string;
  readonly auto_fixable?: boolean;
}

// ─── Quota / Rate Limit ──────────────────────────────────────
export type QuotaAlertLevel = "normal" | "warning" | "critical" | "exceeded";

export interface QuotaStatus {
  readonly alert_level: QuotaAlertLevel;
  readonly budget_usd?: number;
  readonly spent_usd?: number;
  readonly remaining_usd?: number;
  readonly rate_limit_remaining?: number;
  readonly rate_limit_reset_ms?: number;
  readonly message?: string;
}

// ─── Notification ────────────────────────────────────────────
export type NotificationType =
  | "agent_complete"
  | "input_required"
  | "approval_required"
  | "error"
  | "warning"
  | "info"
  | "budget_alert";

export type NotificationUrgency = "low" | "normal" | "high" | "critical";

export interface AppNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly urgency: NotificationUrgency;
  readonly title: string;
  readonly message: string;
  readonly timestamp_ms: number;
  readonly action_url?: string;
  readonly auto_dismiss_ms?: number;
  readonly sound?: boolean;
}

// ─── Auth Status ─────────────────────────────────────────────
export type AuthState =
  | "authenticated"
  | "unauthenticated"
  | "expired"
  | "refreshing"
  | "error";

export interface AuthStatus {
  readonly state: AuthState;
  readonly provider?: string;
  readonly user_email?: string;
  readonly expires_at_ms?: number;
  readonly error_message?: string;
}

// ─── Hook Event ──────────────────────────────────────────────
export type HookEventPhase = "started" | "running" | "completed" | "failed" | "blocked";

export type HookEventName =
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "SessionStart"
  | "SessionEnd"
  | "UserPromptSubmit"
  | "PermissionRequest"
  | "SubagentStart"
  | "SubagentStop"
  | "Stop"
  | "PreCompact"
  | "ConfigChange";

export interface HookEvent {
  readonly id: string;
  readonly hook_name: HookEventName;
  readonly phase: HookEventPhase;
  readonly tool_name?: string;
  readonly decision?: "allow" | "deny" | "ask";
  readonly reason?: string;
  readonly duration_ms?: number;
  readonly timestamp_ms: number;
}

// ─── Worktree Status ─────────────────────────────────────────
export type WorktreePhase = "creating" | "active" | "merging" | "removing" | "error";

export interface WorktreeStatus {
  readonly id: string;
  readonly branch: string;
  readonly path: string;
  readonly phase: WorktreePhase;
  readonly agent_id?: string;
  readonly created_at_ms: number;
  readonly base_branch?: string;
}

// ─── External File Change ────────────────────────────────────
export type ExternalChangeType = "modified" | "created" | "deleted" | "ai_comment";

export interface ExternalFileChange {
  readonly file_path: string;
  readonly change_type: ExternalChangeType;
  readonly timestamp_ms: number;
  readonly detail?: string;
}

// ─── CI/CD Status ────────────────────────────────────────────
export type CiCdPhase = "queued" | "running" | "pass" | "fail" | "cancelled";

export interface CiCdPipeline {
  readonly id: string;
  readonly name: string;
  readonly phase: CiCdPhase;
  readonly url?: string;
  readonly branch?: string;
  readonly commit_sha?: string;
  readonly started_at_ms?: number;
  readonly finished_at_ms?: number;
  readonly steps?: readonly {
    readonly name: string;
    readonly phase: CiCdPhase;
    readonly duration_ms?: number;
  }[];
}

// ─── Security Scan ───────────────────────────────────────────
export type SecurityFindingSeverity = "critical" | "high" | "medium" | "low" | "info";
export type SecurityScanType = "code" | "secret" | "dependency" | "license";

export interface SecurityFinding {
  readonly id: string;
  readonly scan_type: SecurityScanType;
  readonly severity: SecurityFindingSeverity;
  readonly title: string;
  readonly description: string;
  readonly file_path?: string;
  readonly line?: number;
  readonly cwe?: string;
  readonly cve?: string;
  readonly remediation?: string;
}

export interface SecurityScan {
  readonly scan_id: string;
  readonly status: "running" | "completed" | "error";
  readonly findings: readonly SecurityFinding[];
  readonly summary: {
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
  };
  readonly timestamp_ms: number;
}

// ─── Deploy Status ───────────────────────────────────────────
export type DeployPhase = "preparing" | "deploying" | "verifying" | "live" | "failed" | "rolled_back";
export type DeployTarget = "staging" | "preview" | "production" | "custom";

export interface DeployStatus {
  readonly id: string;
  readonly target: DeployTarget;
  readonly phase: DeployPhase;
  readonly url?: string;
  readonly health_check_passed?: boolean;
  readonly started_at_ms: number;
  readonly finished_at_ms?: number;
  readonly error_message?: string;
}

// ─── Debug State ─────────────────────────────────────────────
export type DebugPhase = "idle" | "hypothesizing" | "instrumenting" | "reproducing" | "verifying" | "resolved";

export interface DebugHypothesis {
  readonly id: string;
  readonly description: string;
  readonly status: "open" | "confirmed" | "refuted";
  readonly confidence: number;
  readonly evidence?: string;
}

export interface DebugState {
  readonly phase: DebugPhase;
  readonly hypotheses: readonly DebugHypothesis[];
  readonly current_hypothesis_id?: string;
  readonly reproduction_command?: string;
  readonly requires_user_verification?: boolean;
}

// ─── Sandbox Status ──────────────────────────────────────────
export type SandboxViolationType = "network" | "filesystem" | "process" | "env";

export interface SandboxStatus {
  readonly enabled: boolean;
  readonly network_policy: "block_all" | "allowlist" | "allow_all";
  readonly allowed_hosts: readonly string[];
  readonly denied_hosts: readonly string[];
  readonly violations: readonly {
    readonly type: SandboxViolationType;
    readonly target: string;
    readonly blocked: boolean;
    readonly timestamp_ms: number;
  }[];
}

// ─── Plugin Status ───────────────────────────────────────────
export type PluginPhase = "available" | "installing" | "installed" | "updating" | "error" | "uninstalling";

export interface PluginInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly phase: PluginPhase;
  readonly author?: string;
  readonly error_message?: string;
}

// ─── Agent Wave (Coordinator -> Specialist) ───────────────────
export type AgentWavePhase = "planning" | "dispatching" | "executing" | "merging" | "completed";

export interface AgentWave {
  readonly wave_id: string;
  readonly wave_number: number;
  readonly phase: AgentWavePhase;
  readonly agent_ids: readonly string[];
  readonly completed_count: number;
  readonly total_count: number;
  readonly started_at_ms: number;
}

// ─── Verifier Result ─────────────────────────────────────────
export type VerifierOutcome = "pass" | "fail" | "partial" | "skipped";

export interface VerifierResult {
  readonly id: string;
  readonly spec_section: string;
  readonly outcome: VerifierOutcome;
  readonly message: string;
  readonly inconsistencies: readonly string[];
  readonly timestamp_ms: number;
}

// ─── Living Spec ─────────────────────────────────────────────
export interface LivingSpec {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly version: number;
  readonly last_updated_ms: number;
  readonly sections_completed: number;
  readonly sections_total: number;
}

// ─── Session Schedule ────────────────────────────────────────
export type ScheduleFrequency = "once" | "hourly" | "daily" | "weekly" | "cron";

export interface SessionSchedule {
  readonly id: string;
  readonly label: string;
  readonly frequency: ScheduleFrequency;
  readonly cron_expression?: string;
  readonly next_run_ms: number;
  readonly last_run_ms?: number;
  readonly enabled: boolean;
  readonly prompt: string;
  readonly repository?: string;
}

// ─── Agent Steer ─────────────────────────────────────────────
export type SteerAction = "pause" | "resume" | "redirect" | "restart" | "stop";

export interface AgentSteer {
  readonly agent_id: string;
  readonly action: SteerAction;
  readonly reason?: string;
  readonly redirect_prompt?: string;
  readonly timestamp_ms: number;
}

// ─── Bugbot Status ───────────────────────────────────────────
export type BugbotPhase = "scanning" | "issues_found" | "fixing" | "fix_proposed" | "merged" | "idle";

export interface BugbotIssue {
  readonly id: string;
  readonly title: string;
  readonly file_path: string;
  readonly line?: number;
  readonly severity: ReviewSeverity;
  readonly auto_fixable: boolean;
  readonly fix_pr_url?: string;
}

export interface BugbotStatus {
  readonly phase: BugbotPhase;
  readonly pr_url?: string;
  readonly issues: readonly BugbotIssue[];
  readonly fix_merge_rate?: number;
  readonly last_scan_ms?: number;
}
