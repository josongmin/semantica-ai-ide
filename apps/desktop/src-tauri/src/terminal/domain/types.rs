//! Terminal Domain Types — RFC-TERMINAL-013 SSOT
//!
//! Pure value objects with zero infrastructure dependencies.
//! Only `serde` is allowed (Rust ecosystem primitive).

use serde::{Deserialize, Serialize};

// ─── Shell ───────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ShellType {
    Zsh,
    Bash,
    Fish,
    Pwsh,
    Unknown,
}

impl ShellType {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::Zsh => "zsh",
            Self::Bash => "bash",
            Self::Fish => "fish",
            Self::Pwsh => "pwsh",
            Self::Unknown => "unknown",
        }
    }
}

impl std::fmt::Display for ShellType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

// ─── Session ─────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "source", rename_all = "camelCase")]
pub enum SessionProvenance {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "agent")]
    Agent {
        #[serde(rename = "agentId")]
        agent_id: String,
        #[serde(rename = "taskId", skip_serializing_if = "Option::is_none")]
        task_id: Option<String>,
    },
    #[serde(rename = "task")]
    Task {
        #[serde(rename = "taskId")]
        task_id: String,
    },
    #[serde(rename = "system")]
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalSessionMeta {
    pub session_id: String,
    pub title: String,
    pub shell_type: String,
    pub pid: u32,
    pub cwd: String,
    pub created_at: u64,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_code: Option<i32>,
    pub provenance: SessionProvenance,
    pub mode: String,
    pub marker_support: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub purpose: Option<String>,
}

// ─── Command ─────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CommandStatus {
    Running,
    Succeeded,
    Failed,
    Cancelled,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "source", rename_all = "camelCase")]
pub enum CommandProvenance {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "agent")]
    Agent {
        #[serde(rename = "agentId")]
        agent_id: String,
        #[serde(rename = "requestId")]
        request_id: String,
    },
    #[serde(rename = "rerun")]
    Rerun {
        #[serde(rename = "originalCommandId")]
        original_command_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutputLineRange {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalCommand {
    pub command_id: String,
    pub session_id: String,
    pub command: String,
    pub cwd: String,
    pub started_at: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_code: Option<i32>,
    pub status: CommandStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u64>,
    pub provenance: CommandProvenance,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_line_range: Option<OutputLineRange>,
}

// ─── Shell Markers ───────────────────────────────────────

#[derive(Debug, Clone)]
pub struct CommandStartMarker {
    pub command: String,
    pub cwd: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone)]
pub struct CommandEndMarker {
    pub exit_code: i32,
    pub timestamp: u64,
}

#[derive(Debug, Clone)]
pub enum ShellMarker {
    CommandStart(CommandStartMarker),
    CommandEnd(CommandEndMarker),
    CwdChanged { cwd: String },
}

// ─── Parsed Events ───────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ParsedEventKind {
    Diagnostic,
    TestResult,
    FileLink,
    Url,
    PortBinding,
    Progress,
    TaskLifecycle,
    Summary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticEvent {
    pub severity: String,
    pub file: String,
    pub line: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<usize>,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestResultEvent {
    pub test_name: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileLinkEvent {
    pub file: String,
    pub line: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<usize>,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UrlEvent {
    pub url: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortBindingEvent {
    pub port: u16,
    pub host: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protocol: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub current: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub percentage: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskLifecycleEvent {
    pub task_type: String,
    pub phase: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SummaryEvent {
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub counts: Option<SummaryCounts>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SummaryCounts {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub passed: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failed: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skipped: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", untagged)]
pub enum ParsedEventData {
    Diagnostic(DiagnosticEvent),
    TestResult(TestResultEvent),
    FileLink(FileLinkEvent),
    Url(UrlEvent),
    PortBinding(PortBindingEvent),
    Progress(ProgressEvent),
    TaskLifecycle(TaskLifecycleEvent),
    Summary(SummaryEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedTerminalEvent {
    pub event_id: String,
    pub command_id: String,
    pub session_id: String,
    pub kind: ParsedEventKind,
    pub timestamp: u64,
    pub data: ParsedEventData,
}

// ─── Task State ──────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalTaskState {
    pub session_id: String,
    pub command_id: String,
    pub task_type: String,
    pub phase: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub progress: Option<TaskProgress>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskProgress {
    pub current: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub percentage: Option<f64>,
}

// ─── Compatibility ───────────────────────────────────────

#[allow(clippy::struct_excessive_bools)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityFlags {
    pub alt_screen: bool,
    pub mouse_capture: bool,
    pub fullscreen_tui: bool,
    pub unknown_control_burst: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityState {
    pub session_id: String,
    #[serde(flatten)]
    pub flags: CompatibilityFlags,
    pub effective_mode: String,
    pub overlay_enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

// ─── Policy ──────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PolicyDecision {
    Allow,
    RequireApproval { reason: String },
    Deny { reason: String },
}

// ─── Agent Bridge ────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentExecTrigger {
    pub agent_run_id: String,
    #[serde(rename = "toolCallId", skip_serializing_if = "Option::is_none")]
    pub tool_call: Option<String>,
    #[serde(rename = "stepId", skip_serializing_if = "Option::is_none")]
    pub step: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentTerminalExecRequest {
    pub request_id: String,
    pub agent_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    pub command: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cwd: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<std::collections::HashMap<String, String>>,
    pub session_mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub purpose: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger: Option<AgentExecTrigger>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    pub reveal_policy: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub approval_required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentTerminalExecutionResult {
    pub request_id: String,
    pub session_id: String,
    pub command_id: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_code: Option<i32>,
    pub duration: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parsed_errors: Option<Vec<DiagnosticEvent>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_preview: Option<String>,
    pub output_line_count: u32,
}

// ─── IPC Request DTOs ────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionRequest {
    #[serde(rename = "shellType")]
    pub _shell_type: Option<String>,
    pub cwd: Option<String>,
    pub provenance: SessionProvenance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutputChunk {
    pub session_id: String,
    pub data: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionExitedPayload {
    pub session_id: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionCwdChangedPayload {
    pub session_id: String,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalRequiredPayload {
    pub request_id: String,
    pub agent_id: String,
    pub command: String,
    pub reason: String,
    pub session_id: String,
}

// ─── Execution Lifecycle ─────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ExecutionState {
    Pending,
    AwaitingApproval,
    Approved,
    Executing,
    Completed,
    Failed,
    TimedOut,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayModeChangedPayload {
    pub session_id: String,
    pub mode: String,
    pub overlay_enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionModeChangedPayload {
    pub session_id: String,
    pub mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FallbackTriggeredPayload {
    pub session_id: String,
    pub reason: String,
    pub previous_mode: String,
    pub new_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentTerminalExecResponse {
    pub execution_id: String,
    pub session_id: String,
    pub command_id: String,
    pub created_session: bool,
    pub revealed: bool,
    pub focused: bool,
    pub approval_state: String,
}
