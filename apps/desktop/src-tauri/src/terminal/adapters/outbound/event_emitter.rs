//! Tauri Event Emitter — implements `EventEmitter` port using `AppHandle`.
//!
//! This is the only file that imports `tauri::Emitter`.

use tauri::{AppHandle, Emitter};

use crate::terminal::domain::ports::EventEmitter;
use crate::terminal::domain::types::{
    AgentTerminalExecRequest, AgentTerminalExecutionResult, ApprovalRequiredPayload,
    CompatibilityState, FallbackTriggeredPayload, OutputChunk, OverlayModeChangedPayload,
    ParsedTerminalEvent, SessionCwdChangedPayload, SessionExitedPayload,
    SessionModeChangedPayload, TerminalCommand, TerminalSessionMeta, TerminalTaskState,
};

pub struct TauriEventEmitter {
    app: AppHandle,
}

impl TauriEventEmitter {
    pub const fn new(app: AppHandle) -> Self {
        Self { app }
    }

    /// Emit helper that logs failures instead of silently discarding.
    fn emit_event<S: serde::Serialize + Clone>(&self, event: &str, payload: &S) {
        if let Err(e) = self.app.emit(event, payload.clone()) {
            eprintln!("[TauriEventEmitter] Failed to emit {event}: {e}");
        }
    }
}

impl EventEmitter for TauriEventEmitter {
    fn emit_session_created(&self, meta: &TerminalSessionMeta) {
        self.emit_event("terminal://session-created", meta);
    }

    fn emit_session_exited(&self, payload: &SessionExitedPayload) {
        self.emit_event("terminal://session-exited", payload);
    }

    fn emit_output(&self, chunk: &OutputChunk) {
        self.emit_event("terminal://output", chunk);
    }

    fn emit_command_started(&self, command: &TerminalCommand) {
        self.emit_event("terminal://command-started", command);
    }

    fn emit_command_completed(&self, command: &TerminalCommand) {
        self.emit_event("terminal://command-completed", command);
    }

    fn emit_command_cancelled(&self, command: &TerminalCommand) {
        self.emit_event("terminal://command-cancelled", command);
    }

    fn emit_parsed_event(&self, event: &ParsedTerminalEvent) {
        self.emit_event("terminal://parsed-event", event);
    }

    fn emit_task_state(&self, state: &TerminalTaskState) {
        self.emit_event("terminal://task-state-changed", state);
    }

    fn emit_compatibility_state(&self, state: &CompatibilityState) {
        self.emit_event("terminal://compatibility-state", state);
    }

    fn emit_agent_exec_started(&self, request: &AgentTerminalExecRequest) {
        self.emit_event("terminal://agent-exec-started", request);
    }

    fn emit_agent_exec_completed(&self, result: &AgentTerminalExecutionResult) {
        self.emit_event("terminal://agent-exec-completed", result);
    }

    fn emit_session_cwd_changed(&self, payload: &SessionCwdChangedPayload) {
        self.emit_event("terminal://session-cwd-changed", payload);
    }

    fn emit_approval_required(&self, payload: &ApprovalRequiredPayload) {
        self.emit_event("terminal://agent-approval-required", payload);
    }

    fn emit_overlay_mode_changed(&self, payload: &OverlayModeChangedPayload) {
        self.emit_event("terminal://overlay-mode-changed", payload);
    }

    fn emit_session_mode_changed(&self, payload: &SessionModeChangedPayload) {
        self.emit_event("terminal://session-mode-changed", payload);
    }

    fn emit_fallback_triggered(&self, payload: &FallbackTriggeredPayload) {
        self.emit_event("terminal://fallback-triggered", payload);
    }
}
