/**
 * Infrastructure & DevOps Types
 *
 * Terminal, Test Results, Diagnostics, Quota, Notification, Auth,
 * Hook Events, Worktree, External File Changes, CI/CD, Security,
 * Deploy, Sandbox, Plugin.
 */

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
