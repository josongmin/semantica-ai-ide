//! Terminal Ports — Hexagonal Architecture Trait Definitions
//!
//! All driven/driving port contracts live here.
//! NO infrastructure imports (no tauri, no portable-pty).

use super::types::{
    AgentTerminalExecRequest, AgentTerminalExecutionResult, ApprovalRequiredPayload,
    CompatibilityState, FallbackTriggeredPayload, OutputChunk, OverlayModeChangedPayload,
    ParsedTerminalEvent, SessionCwdChangedPayload, SessionExitedPayload,
    SessionModeChangedPayload, ShellType, TerminalCommand, TerminalSessionMeta,
    TerminalTaskState,
};

// ─── Driven Port: PTY Process Lifecycle ──────────────────

/// Factory for spawning PTY processes.
pub trait PtyRuntime: Send + Sync {
    fn spawn(
        &self,
        shell_path: &str,
        cwd: &str,
        cols: u16,
        rows: u16,
    ) -> Result<Box<dyn PtyHandle>, String>;
}

/// Handle to a single live PTY session.
/// Owned by the application layer per session.
pub trait PtyHandle: Send + Sync {
    fn pid(&self) -> u32;
    fn write_input(&self, data: &[u8]) -> Result<(), String>;
    fn resize(&self, cols: u16, rows: u16) -> Result<(), String>;
    fn kill(&self) -> Result<(), String>;
    fn try_exit_code(&self) -> Option<i32>;

    /// Start a background reader thread.
    /// `on_data` is called for each output chunk.
    /// `on_exit` is called once when the PTY closes.
    fn start_reader(
        &self,
        on_data: Box<dyn Fn(Vec<u8>) + Send>,
        on_exit: Box<dyn FnOnce(Option<i32>) + Send>,
    ) -> Result<(), String>;

    /// Signal the reader thread to stop.
    fn stop_reader(&self);
}

// ─── Driven Port: Event Emission ─────────────────────────

/// Emits structured events to the frontend.
#[allow(dead_code)]
pub trait EventEmitter: Send + Sync {
    fn emit_session_created(&self, meta: &TerminalSessionMeta);
    fn emit_session_exited(&self, payload: &SessionExitedPayload);
    fn emit_output(&self, chunk: &OutputChunk);
    fn emit_command_started(&self, command: &TerminalCommand);
    fn emit_command_completed(&self, command: &TerminalCommand);
    fn emit_parsed_event(&self, event: &ParsedTerminalEvent);
    fn emit_task_state(&self, state: &TerminalTaskState);
    fn emit_compatibility_state(&self, state: &CompatibilityState);
    fn emit_agent_exec_started(&self, request: &AgentTerminalExecRequest);
    fn emit_agent_exec_completed(&self, result: &AgentTerminalExecutionResult);
    fn emit_session_cwd_changed(&self, payload: &SessionCwdChangedPayload);
    fn emit_command_cancelled(&self, command: &TerminalCommand);
    fn emit_approval_required(&self, payload: &ApprovalRequiredPayload);
    fn emit_overlay_mode_changed(&self, payload: &OverlayModeChangedPayload);
    fn emit_session_mode_changed(&self, payload: &SessionModeChangedPayload);
    fn emit_fallback_triggered(&self, payload: &FallbackTriggeredPayload);
}

// ─── Driven Port: Shell Detection ────────────────────────

/// Detects the user's default shell.
pub trait ShellDetector: Send + Sync {
    /// Returns (`shell_type`, `shell_path`).
    fn detect(&self) -> (ShellType, String);
}

// ─── Driven Port: System Clock ───────────────────────────

/// Abstracts system time for testability.
pub trait Clock: Send + Sync {
    fn now_ms(&self) -> u64;
}

// ─── Driven Port: Shell Hook Installation (Phase 2) ──────

/// Installs shell integration hooks for command boundary markers.
pub trait ShellHookInstaller: Send + Sync {
    /// Attempts to install marker hooks into the user's shell config.
    /// Returns `true` if hooks were installed or already present.
    fn install_hooks(&self, shell_type: &ShellType, home_dir: &str) -> Result<bool, String>;
}

// ─── Driven Port: Output Parsing (Phase 3) ───────────────

/// Plugin trait for semantic output parsers.
#[allow(dead_code)]
pub trait OutputParser: Send + Sync {
    fn name(&self) -> &'static str;
    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent>;
    fn try_parse_block(&self, lines: &[&str]) -> Option<ParsedTerminalEvent>;
}
