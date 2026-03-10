//! Tauri Command Handlers — Inbound adapter (driving side).
//!
//! Thin wrappers that delegate to `SessionService`, `ExecService`, and `ExecutionTracker`.
//! This is the only file that uses `#[tauri::command]`.
//!
//! The `#[tauri::command]` macro requires owned `String` and `State<'_, T>` parameters —
//! references are not supported. This makes `needless_pass_by_value` a false positive here.
#![allow(clippy::needless_pass_by_value)]

use tauri::State;

use crate::terminal::domain::types::{
    AgentTerminalExecRequest, AgentTerminalExecResponse, AgentTerminalExecutionResult,
    CreateSessionRequest, TerminalCommand, TerminalSessionMeta,
};
use crate::terminal::state::TerminalAppState;

// ─── Session Commands ────────────────────────────────────

#[tauri::command]
pub fn terminal_create_session(
    state: State<'_, TerminalAppState>,
    args: CreateSessionRequest,
) -> Result<TerminalSessionMeta, String> {
    state.session_service().create_session(args)
}

#[tauri::command]
pub fn terminal_kill_session(
    state: State<'_, TerminalAppState>,
    session_id: String,
) -> Result<(), String> {
    state.session_service().kill_session(&session_id)
}

#[tauri::command]
pub fn terminal_write(
    state: State<'_, TerminalAppState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    state.session_service().write_input(&session_id, &data)
}

#[tauri::command]
pub fn terminal_resize(
    state: State<'_, TerminalAppState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state.session_service().resize(&session_id, cols, rows)
}

#[tauri::command]
pub fn terminal_get_sessions(
    state: State<'_, TerminalAppState>,
) -> Result<Vec<TerminalSessionMeta>, String> {
    state.session_service().list_sessions()
}

// ─── Command Query ───────────────────────────────────────

#[tauri::command]
pub fn terminal_get_commands(
    state: State<'_, TerminalAppState>,
    session_id: String,
) -> Result<Vec<TerminalCommand>, String> {
    state.session_service().get_commands(&session_id)
}

// ─── Agent Execution Commands ────────────────────────────

#[tauri::command]
pub fn terminal_exec(
    state: State<'_, TerminalAppState>,
    args: AgentTerminalExecRequest,
) -> Result<AgentTerminalExecResponse, String> {
    let session_id = args
        .session_id
        .clone()
        .unwrap_or_else(|| "default".into());

    let session_service = state.session_service();
    let write_fn = |sid: &str, data: &str| -> Result<(), String> {
        session_service.write_command(sid, data)
    };

    let result = state
        .exec_service()
        .exec(&args, &write_fn, &session_id)?;

    Ok(AgentTerminalExecResponse {
        execution_id: result.execution_id,
        session_id,
        command_id: result.command_id,
        created_session: false,
        revealed: false,
        focused: false,
        approval_state: "approved".into(),
    })
}

#[tauri::command]
pub fn terminal_cancel_exec(
    state: State<'_, TerminalAppState>,
    request_id: String,
) -> AgentTerminalExecutionResult {
    // Try the execution tracker first (for active tracked executions)
    if let Some(result) = state.execution_tracker().cancel_execution(&request_id) {
        return result;
    }

    // Fall back to exec_service cancel (for pending approvals, etc.)
    state.exec_service().cancel(&request_id)
}

#[tauri::command]
pub fn terminal_get_execution(
    state: State<'_, TerminalAppState>,
    execution_id: String,
) -> Option<AgentTerminalExecutionResult> {
    let record = state.execution_tracker().get_execution(&execution_id)?;
    Some(record.build_result())
}

#[tauri::command]
pub fn terminal_approve_command(
    state: State<'_, TerminalAppState>,
    request_id: String,
    approved: bool,
) -> Result<(), String> {
    if approved {
        let request = state
            .exec_service()
            .approve(&request_id)
            .ok_or_else(|| format!("No pending approval: {request_id}"))?;

        let session_id = request
            .session_id
            .clone()
            .unwrap_or_else(|| "default".into());

        let session_service = state.session_service();
        let write_fn = |sid: &str, data: &str| -> Result<(), String> {
            session_service.write_command(sid, data)
        };

        // Re-execute with approval flag
        let mut approved_request = request;
        approved_request.approval_required = Some(true);
        // exec() now registers with the execution tracker internally
        let _result = state
            .exec_service()
            .exec(&approved_request, &write_fn, &session_id)?;
    } else {
        state.exec_service().deny(&request_id);
    }

    Ok(())
}
