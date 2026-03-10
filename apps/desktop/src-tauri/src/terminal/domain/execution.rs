//! Execution Lifecycle — Domain state machine for agent command executions.
//!
//! Tracks the full lifecycle: Pending → Executing → Completed/Failed/TimedOut/Cancelled
//! Pure state transitions, no I/O.

use super::types::{AgentTerminalExecRequest, ExecutionState, DiagnosticEvent, AgentTerminalExecutionResult};

// ─── Constants ──────────────────────────────────────────

/// Maximum number of tail output lines retained per execution.
const MAX_TAIL_LINES: usize = 50;

// ─── Execution Record ───────────────────────────────────

/// Tracks the full lifecycle of an agent-initiated command execution.
#[derive(Debug, Clone)]
pub struct ExecutionRecord {
    pub _execution_id: String,
    pub session_id: String,
    pub command_id: String,
    pub request: AgentTerminalExecRequest,
    pub state: ExecutionState,
    pub _created_at: u64,
    pub started_at: Option<u64>,
    pub completed_at: Option<u64>,
    pub timeout_ms: Option<u64>,
    pub tail_output: Vec<String>,
    pub parsed_diagnostics: Vec<DiagnosticEvent>,
    pub output_line_count: u32,
    pub exit_code: Option<i32>,
}

impl ExecutionRecord {
    pub const fn new(
        execution_id: String,
        session_id: String,
        command_id: String,
        request: AgentTerminalExecRequest,
        created_at: u64,
    ) -> Self {
        let timeout_ms = request.timeout;

        Self {
            _execution_id: execution_id,
            session_id,
            command_id,
            request,
            state: ExecutionState::Pending,
            _created_at: created_at,
            started_at: None,
            completed_at: None,
            timeout_ms,
            tail_output: Vec::new(),
            parsed_diagnostics: Vec::new(),
            output_line_count: 0,
            exit_code: None,
        }
    }

    /// Attempt a state transition. Returns `Ok(())` if valid, `Err` with reason if not.
    pub fn transition_to(&mut self, new_state: ExecutionState) -> Result<(), String> {
        if self.is_terminal() {
            return Err(format!(
                "Cannot transition from terminal state {:?}",
                self.state
            ));
        }

        if !is_valid_transition(&self.state, &new_state) {
            return Err(format!(
                "Invalid transition: {:?} → {:?}",
                self.state, new_state
            ));
        }

        self.state = new_state;
        Ok(())
    }

    /// Transition to Executing and record start time.
    pub fn start_executing(&mut self, now: u64) -> Result<(), String> {
        self.transition_to(ExecutionState::Executing)?;
        self.started_at = Some(now);
        Ok(())
    }

    /// Transition to Completed with exit code and completion time.
    pub fn complete(&mut self, exit_code: i32, now: u64) -> Result<(), String> {
        self.transition_to(ExecutionState::Completed)?;
        self.exit_code = Some(exit_code);
        self.completed_at = Some(now);
        Ok(())
    }

    /// Transition to Failed with exit code and completion time.
    pub fn fail(&mut self, exit_code: i32, now: u64) -> Result<(), String> {
        self.transition_to(ExecutionState::Failed)?;
        self.exit_code = Some(exit_code);
        self.completed_at = Some(now);
        Ok(())
    }

    /// Transition to `TimedOut` with completion time.
    pub fn timeout(&mut self, now: u64) -> Result<(), String> {
        self.transition_to(ExecutionState::TimedOut)?;
        self.completed_at = Some(now);
        Ok(())
    }

    /// Transition to Cancelled with completion time.
    pub fn cancel(&mut self, now: u64) -> Result<(), String> {
        self.transition_to(ExecutionState::Cancelled)?;
        self.completed_at = Some(now);
        Ok(())
    }

    /// Append an output line, maintaining the tail buffer cap.
    pub fn append_output_line(&mut self, line: String) {
        self.output_line_count += 1;
        self.tail_output.push(line);
        if self.tail_output.len() > MAX_TAIL_LINES {
            self.tail_output.remove(0);
        }
    }

    /// Append a parsed diagnostic event.
    pub fn append_diagnostic(&mut self, diagnostic: DiagnosticEvent) {
        self.parsed_diagnostics.push(diagnostic);
    }

    /// Whether the execution is in a terminal (final) state.
    pub const fn is_terminal(&self) -> bool {
        matches!(
            self.state,
            ExecutionState::Completed
                | ExecutionState::Failed
                | ExecutionState::TimedOut
                | ExecutionState::Cancelled
        )
    }

    /// Compute elapsed duration in milliseconds, if started.
    pub fn duration_ms(&self) -> Option<u64> {
        let start = self.started_at?;
        let end = self.completed_at.unwrap_or(0);
        if end >= start {
            Some(end - start)
        } else {
            None
        }
    }

    /// Build the final result payload for returning to the agent bridge.
    pub fn build_result(&self) -> AgentTerminalExecutionResult {
        let status = match self.state {
            ExecutionState::Pending => "pending",
            ExecutionState::AwaitingApproval => "awaiting-approval",
            ExecutionState::Approved => "approved",
            ExecutionState::Executing => "executing",
            ExecutionState::Completed => "succeeded",
            ExecutionState::Failed => "failed",
            ExecutionState::TimedOut => "timed-out",
            ExecutionState::Cancelled => "cancelled",
        };

        let output_preview = if self.tail_output.is_empty() {
            None
        } else {
            Some(self.tail_output.join("\n"))
        };

        let parsed_errors = if self.parsed_diagnostics.is_empty() {
            None
        } else {
            Some(self.parsed_diagnostics.clone())
        };

        AgentTerminalExecutionResult {
            request_id: self.request.request_id.clone(),
            session_id: self.session_id.clone(),
            command_id: self.command_id.clone(),
            status: status.into(),
            exit_code: self.exit_code,
            duration: self.duration_ms().unwrap_or(0),
            parsed_errors,
            output_preview,
            output_line_count: self.output_line_count,
        }
    }
}

// ─── State Transition Validation ────────────────────────

const fn is_valid_transition(from: &ExecutionState, to: &ExecutionState) -> bool {
    matches!(
        (from, to),
        (ExecutionState::Pending, ExecutionState::AwaitingApproval
            | ExecutionState::Approved
            | ExecutionState::Executing
            | ExecutionState::Cancelled)
            | (ExecutionState::AwaitingApproval, ExecutionState::Approved
            | ExecutionState::Cancelled)
            | (ExecutionState::Approved, ExecutionState::Executing
            | ExecutionState::Cancelled)
            | (ExecutionState::Executing, ExecutionState::Completed
            | ExecutionState::Failed
            | ExecutionState::TimedOut
            | ExecutionState::Cancelled)
    )
}

// ─── ID Generation ──────────────────────────────────────

/// Generate a unique execution ID using timestamp + atomic counter.
pub fn generate_execution_id(now_ms: u64) -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    let seq = COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("exec_{now_ms:x}_{seq:x}")
}

// ─── Tests ──────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_request() -> AgentTerminalExecRequest {
        AgentTerminalExecRequest {
            request_id: "req_1".into(),
            agent_id: "agent_1".into(),
            task_id: None,
            command: "cargo test".into(),
            cwd: None,
            env: None,
            session_mode: "hybrid".into(),
            purpose: None,
            title: None,
            trigger: None,
            session_id: None,
            reveal_policy: "auto".into(),
            approval_required: None,
            timeout: Some(30000),
        }
    }

    fn make_record() -> ExecutionRecord {
        ExecutionRecord::new(
            "exec_1".into(),
            "ses_1".into(),
            "cmd_1".into(),
            make_request(),
            1000,
        )
    }

    // ─── State Transitions ──────────────────────────────

    #[test]
    fn new_record_starts_pending() {
        let rec = make_record();
        assert_eq!(rec.state, ExecutionState::Pending);
        assert!(!rec.is_terminal());
    }

    #[test]
    fn pending_to_executing() {
        let mut rec = make_record();
        assert!(rec.start_executing(2000).is_ok());
        assert_eq!(rec.state, ExecutionState::Executing);
        assert_eq!(rec.started_at, Some(2000));
    }

    #[test]
    fn pending_to_awaiting_approval() {
        let mut rec = make_record();
        assert!(rec
            .transition_to(ExecutionState::AwaitingApproval)
            .is_ok());
        assert_eq!(rec.state, ExecutionState::AwaitingApproval);
    }

    #[test]
    fn awaiting_approval_to_approved() {
        let mut rec = make_record();
        rec.transition_to(ExecutionState::AwaitingApproval).unwrap();
        assert!(rec.transition_to(ExecutionState::Approved).is_ok());
        assert_eq!(rec.state, ExecutionState::Approved);
    }

    #[test]
    fn approved_to_executing() {
        let mut rec = make_record();
        rec.transition_to(ExecutionState::AwaitingApproval).unwrap();
        rec.transition_to(ExecutionState::Approved).unwrap();
        assert!(rec.start_executing(2000).is_ok());
        assert_eq!(rec.state, ExecutionState::Executing);
    }

    #[test]
    fn executing_to_completed() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        assert!(rec.complete(0, 5000).is_ok());
        assert_eq!(rec.state, ExecutionState::Completed);
        assert_eq!(rec.exit_code, Some(0));
        assert!(rec.is_terminal());
    }

    #[test]
    fn executing_to_failed() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        assert!(rec.fail(1, 5000).is_ok());
        assert_eq!(rec.state, ExecutionState::Failed);
        assert_eq!(rec.exit_code, Some(1));
        assert!(rec.is_terminal());
    }

    #[test]
    fn executing_to_timed_out() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        assert!(rec.timeout(32000).is_ok());
        assert_eq!(rec.state, ExecutionState::TimedOut);
        assert!(rec.is_terminal());
    }

    #[test]
    fn executing_to_cancelled() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        assert!(rec.cancel(3000).is_ok());
        assert_eq!(rec.state, ExecutionState::Cancelled);
        assert!(rec.is_terminal());
    }

    #[test]
    fn cannot_transition_from_terminal_state() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        rec.complete(0, 5000).unwrap();
        assert!(rec.transition_to(ExecutionState::Executing).is_err());
    }

    #[test]
    fn invalid_transition_pending_to_completed() {
        let mut rec = make_record();
        assert!(rec.transition_to(ExecutionState::Completed).is_err());
    }

    #[test]
    fn invalid_transition_executing_to_pending() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        assert!(rec.transition_to(ExecutionState::Pending).is_err());
    }

    #[test]
    fn invalid_transition_awaiting_to_executing() {
        let mut rec = make_record();
        rec.transition_to(ExecutionState::AwaitingApproval).unwrap();
        // Must go through Approved first
        assert!(rec.transition_to(ExecutionState::Executing).is_err());
    }

    #[test]
    fn cancel_from_awaiting_approval() {
        let mut rec = make_record();
        rec.transition_to(ExecutionState::AwaitingApproval).unwrap();
        assert!(rec.cancel(3000).is_ok());
        assert_eq!(rec.state, ExecutionState::Cancelled);
    }

    // ─── Output Tracking ────────────────────────────────

    #[test]
    fn append_output_line_increments_count() {
        let mut rec = make_record();
        rec.append_output_line("line 1".into());
        rec.append_output_line("line 2".into());
        assert_eq!(rec.output_line_count, 2);
        assert_eq!(rec.tail_output.len(), 2);
    }

    #[test]
    fn tail_output_capped_at_max_lines() {
        let mut rec = make_record();
        for i in 0..60 {
            rec.append_output_line(format!("line {}", i));
        }
        assert_eq!(rec.output_line_count, 60);
        assert_eq!(rec.tail_output.len(), MAX_TAIL_LINES);
        // First line should be line 10 (lines 0-9 evicted)
        assert_eq!(rec.tail_output[0], "line 10");
    }

    #[test]
    fn append_diagnostic() {
        let mut rec = make_record();
        rec.append_diagnostic(DiagnosticEvent {
            severity: "error".into(),
            file: "main.rs".into(),
            line: 10,
            column: Some(5),
            message: "unused variable".into(),
            source: Some("rustc".into()),
        });
        assert_eq!(rec.parsed_diagnostics.len(), 1);
    }

    // ─── Duration ───────────────────────────────────────

    #[test]
    fn duration_ms_when_completed() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        rec.complete(0, 5000).unwrap();
        assert_eq!(rec.duration_ms(), Some(3000));
    }

    #[test]
    fn duration_ms_none_when_not_started() {
        let rec = make_record();
        assert_eq!(rec.duration_ms(), None);
    }

    // ─── Build Result ───────────────────────────────────

    #[test]
    fn build_result_completed() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        rec.append_output_line("test passed".into());
        rec.append_diagnostic(DiagnosticEvent {
            severity: "warning".into(),
            file: "lib.rs".into(),
            line: 5,
            column: None,
            message: "dead code".into(),
            source: None,
        });
        rec.complete(0, 5000).unwrap();

        let result = rec.build_result();
        assert_eq!(result.request_id, "req_1");
        assert_eq!(result.status, "succeeded");
        assert_eq!(result.exit_code, Some(0));
        assert_eq!(result.duration, 3000);
        assert_eq!(result.output_line_count, 1);
        assert!(result.output_preview.is_some());
        assert!(result.parsed_errors.is_some());
        assert_eq!(result.parsed_errors.unwrap().len(), 1);
    }

    #[test]
    fn build_result_no_output_or_diagnostics() {
        let mut rec = make_record();
        rec.start_executing(2000).unwrap();
        rec.complete(0, 3000).unwrap();

        let result = rec.build_result();
        assert!(result.output_preview.is_none());
        assert!(result.parsed_errors.is_none());
    }

    // ─── ID Generation ─────────────────────────────────

    #[test]
    fn execution_ids_are_unique() {
        let id1 = generate_execution_id(1000);
        let id2 = generate_execution_id(1000);
        assert_ne!(id1, id2);
        assert!(id1.starts_with("exec_"));
    }

}
