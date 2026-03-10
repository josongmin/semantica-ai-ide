//! Exec Service — Agent command execution orchestration.
//!
//! Handles the full agent execution lifecycle:
//! 1. Policy check (allow / require approval / deny)
//! 2. Session resolution (reuse / dedicated / detached)
//! 3. Command injection into PTY
//! 4. Completion tracking (via `ExecutionTracker`)
//! 5. Result aggregation
//!
//! NO infrastructure imports. Uses domain types and ports only.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::terminal::application::execution_tracker::ExecutionTracker;
use crate::terminal::domain::execution::generate_execution_id;
use crate::terminal::domain::policy::PolicyGuard;
use crate::terminal::domain::ports::{EventEmitter, Clock};
use crate::terminal::domain::types::{AgentTerminalExecRequest, PolicyDecision, ApprovalRequiredPayload, AgentTerminalExecutionResult};

/// Result returned when an agent execution is successfully started.
#[derive(Debug)]
pub struct ExecStartResult {
    pub execution_id: String,
    pub command_id: String,
}

/// Pending approval request.
struct PendingApproval {
    request: AgentTerminalExecRequest,
}

/// Agent execution orchestrator.
pub struct ExecService {
    policy_guard: PolicyGuard,
    event_emitter: Arc<dyn EventEmitter>,
    clock: Arc<dyn Clock>,
    execution_tracker: Arc<ExecutionTracker>,
    pending_approvals: Mutex<HashMap<String, PendingApproval>>,
}

impl ExecService {
    pub fn new(
        event_emitter: Arc<dyn EventEmitter>,
        clock: Arc<dyn Clock>,
        execution_tracker: Arc<ExecutionTracker>,
    ) -> Self {
        Self {
            policy_guard: PolicyGuard::new(),
            event_emitter,
            clock,
            execution_tracker,
            pending_approvals: Mutex::new(HashMap::new()),
        }
    }

    /// Execute an agent command request.
    /// Returns an `ExecStartResult` with both `execution_id` and `command_id`,
    /// or an error if the command was denied or approval is required.
    pub fn exec(
        &self,
        request: &AgentTerminalExecRequest,
        write_fn: &dyn Fn(&str, &str) -> Result<(), String>,
        session_id: &str,
    ) -> Result<ExecStartResult, String> {
        // 1. Policy check
        let decision = self
            .policy_guard
            .check(&request.command, &format!("agent:{}", request.agent_id));

        match decision {
            PolicyDecision::Deny { reason } => {
                return Err(format!("Command denied: {reason}"));
            }
            PolicyDecision::RequireApproval { reason } => {
                if request.approval_required == Some(true) {
                    // Already approved — proceed
                } else {
                    // Queue for approval
                    self.queue_approval(request.clone(), &reason);
                    return Err(format!("Approval required: {reason}"));
                }
            }
            PolicyDecision::Allow => {}
        }

        // 2. Emit exec started
        self.event_emitter.emit_agent_exec_started(request);

        // 3. Write command to PTY (with newline to execute)
        let command_with_newline = format!("{}\n", request.command);
        write_fn(session_id, &command_with_newline)?;

        // 4. Generate command ID
        let command_id = format!("acmd_{}_{:x}", request.request_id, self.clock.now_ms());

        // 5. Generate execution ID and register with tracker
        let execution_id = generate_execution_id(self.clock.now_ms());
        self.execution_tracker
            .register_execution(execution_id.clone(), request, session_id, &command_id);

        Ok(ExecStartResult {
            execution_id,
            command_id,
        })
    }

    /// Queue a command for approval and emit event to frontend.
    fn queue_approval(&self, request: AgentTerminalExecRequest, reason: &str) {
        let payload = ApprovalRequiredPayload {
            request_id: request.request_id.clone(),
            agent_id: request.agent_id.clone(),
            command: request.command.clone(),
            reason: reason.into(),
            session_id: request
                .session_id
                .clone()
                .unwrap_or_else(|| "default".into()),
        };

        if let Ok(mut approvals) = self.pending_approvals.lock() {
            let request_id = request.request_id.clone();
            approvals.insert(request_id, PendingApproval { request });
        }

        self.event_emitter.emit_approval_required(&payload);
    }

    /// Approve a pending command.
    pub fn approve(&self, request_id: &str) -> Option<AgentTerminalExecRequest> {
        let mut approvals = self.pending_approvals.lock().ok()?;
        let pending = approvals.remove(request_id)?;
        drop(approvals);
        Some(pending.request)
    }

    /// Deny/cancel a pending command.
    pub fn deny(&self, request_id: &str) -> bool {
        self.pending_approvals
            .lock()
            .ok()
            .is_some_and(|mut approvals| approvals.remove(request_id).is_some())
    }

    /// Cancel an ongoing agent execution.
    /// Tries the execution tracker first, then falls back to pending approvals.
    pub fn cancel(&self, request_id: &str) -> AgentTerminalExecutionResult {
        // 1. Try cancelling via execution tracker (for active executions)
        if let Some(result) = self.execution_tracker.cancel_execution(request_id) {
            self.event_emitter.emit_agent_exec_completed(&result);
            return result;
        }

        // 2. Fall back: remove from pending approvals and build a synthetic result
        let pending_session_id = self
            .pending_approvals
            .lock()
            .ok()
            .and_then(|mut approvals| approvals.remove(request_id).and_then(|p| p.request.session_id));

        let result = AgentTerminalExecutionResult {
            request_id: request_id.into(),
            session_id: pending_session_id.unwrap_or_else(|| "unknown".into()),
            command_id: format!("acmd_{request_id}_cancelled"),
            status: "cancelled".into(),
            exit_code: None,
            duration: 0,
            parsed_errors: None,
            output_preview: None,
            output_line_count: 0,
        };

        self.event_emitter.emit_agent_exec_completed(&result);
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::terminal::application::execution_tracker::ExecutionTracker;
    use crate::terminal::domain::types::{
        CompatibilityState, FallbackTriggeredPayload, OutputChunk, OverlayModeChangedPayload,
        ParsedTerminalEvent, SessionCwdChangedPayload, SessionExitedPayload,
        SessionModeChangedPayload, TerminalCommand, TerminalSessionMeta, TerminalTaskState,
    };
    use std::sync::Mutex as StdMutex;

    struct MockEmitter {
        events: StdMutex<Vec<String>>,
    }

    impl MockEmitter {
        fn new() -> Self {
            Self {
                events: StdMutex::new(Vec::new()),
            }
        }
    }

    impl EventEmitter for MockEmitter {
        fn emit_session_created(&self, _: &TerminalSessionMeta) {}
        fn emit_session_exited(&self, _: &SessionExitedPayload) {}
        fn emit_output(&self, _: &OutputChunk) {}
        fn emit_command_started(&self, _: &TerminalCommand) {}
        fn emit_command_completed(&self, _: &TerminalCommand) {}
        fn emit_command_cancelled(&self, _: &TerminalCommand) {}
        fn emit_parsed_event(&self, _: &ParsedTerminalEvent) {}
        fn emit_task_state(&self, _: &TerminalTaskState) {}
        fn emit_compatibility_state(&self, _: &CompatibilityState) {}
        fn emit_agent_exec_started(&self, _: &AgentTerminalExecRequest) {
            self.events.lock().unwrap().push("exec_started".into());
        }
        fn emit_agent_exec_completed(&self, _: &AgentTerminalExecutionResult) {
            self.events.lock().unwrap().push("exec_completed".into());
        }
        fn emit_session_cwd_changed(&self, _: &SessionCwdChangedPayload) {}
        fn emit_approval_required(&self, _: &ApprovalRequiredPayload) {
            self.events.lock().unwrap().push("approval_required".into());
        }
        fn emit_overlay_mode_changed(&self, _: &OverlayModeChangedPayload) {}
        fn emit_session_mode_changed(&self, _: &SessionModeChangedPayload) {}
        fn emit_fallback_triggered(&self, _: &FallbackTriggeredPayload) {}
    }

    struct MockClock;
    impl Clock for MockClock {
        fn now_ms(&self) -> u64 { 1000 }
    }

    fn make_request(cmd: &str) -> AgentTerminalExecRequest {
        AgentTerminalExecRequest {
            request_id: "req_1".into(),
            agent_id: "agent_1".into(),
            task_id: None,
            command: cmd.into(),
            cwd: None,
            env: None,
            session_mode: "dedicated".into(),
            purpose: None,
            title: None,
            trigger: None,
            session_id: None,
            reveal_policy: "on-failure".into(),
            approval_required: None,
            timeout: None,
        }
    }

    fn make_tracker() -> Arc<ExecutionTracker> {
        Arc::new(ExecutionTracker::new(Arc::new(MockClock)))
    }

    #[test]
    fn allows_safe_agent_command() {
        let emitter = Arc::new(MockEmitter::new());
        let tracker = make_tracker();
        let service = ExecService::new(emitter, Arc::new(MockClock), tracker);

        let written = StdMutex::new(Vec::new());
        let write_fn = |_sid: &str, data: &str| -> Result<(), String> {
            written.lock().unwrap().push(data.to_string());
            Ok(())
        };

        let req = make_request("npm test");
        let result = service.exec(&req, &write_fn, "ses_1");
        assert!(result.is_ok());
        let start_result = result.unwrap();
        assert!(!start_result.command_id.is_empty());
        assert!(!start_result.execution_id.is_empty());
    }

    #[test]
    fn denies_destructive_command() {
        let emitter = Arc::new(MockEmitter::new());
        let tracker = make_tracker();
        let service = ExecService::new(emitter, Arc::new(MockClock), tracker);

        let write_fn = |_: &str, _: &str| -> Result<(), String> { Ok(()) };

        let req = make_request("rm -rf /");
        let result = service.exec(&req, &write_fn, "ses_1");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("denied"));
    }

    #[test]
    fn cancel_emits_completed() {
        let emitter = Arc::new(MockEmitter::new());
        let tracker = make_tracker();
        let service = ExecService::new(emitter.clone(), Arc::new(MockClock), tracker);

        let result = service.cancel("req_1");
        assert_eq!(result.status, "cancelled");
        assert!(emitter.events.lock().unwrap().contains(&"exec_completed".to_string()));
    }
}
