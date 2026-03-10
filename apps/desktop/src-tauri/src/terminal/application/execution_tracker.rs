//! Execution Tracker — Tracks active agent command executions.
//!
//! Manages the lifecycle of agent-initiated command executions using
//! the domain `ExecutionRecord` state machine:
//! - Tracks execution state (Pending → Executing → Completed/Failed/TimedOut/Cancelled)
//! - Collects tail output (last N lines) for agent context
//! - Accumulates parsed diagnostics per execution
//! - Enforces execution timeouts
//!
//! NO infrastructure imports. Uses domain types and ports only.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::terminal::domain::execution::ExecutionRecord;
use crate::terminal::domain::ports::Clock;
use crate::terminal::domain::types::{AgentTerminalExecRequest, DiagnosticEvent, AgentTerminalExecutionResult, ExecutionState};

// ─── Execution Tracker ───────────────────────────────────

/// Tracks active agent command executions across sessions.
pub struct ExecutionTracker {
    executions: Mutex<HashMap<String, ExecutionRecord>>,
    command_to_execution: Mutex<HashMap<String, String>>,
    clock: Arc<dyn Clock>,
}

impl ExecutionTracker {
    pub fn new(clock: Arc<dyn Clock>) -> Self {
        Self {
            executions: Mutex::new(HashMap::new()),
            command_to_execution: Mutex::new(HashMap::new()),
            clock,
        }
    }

    /// Register a new execution. Creates a domain `ExecutionRecord`,
    /// transitions it to Executing, and stores it.
    pub fn register_execution(
        &self,
        execution_id: String,
        request: &AgentTerminalExecRequest,
        session_id: &str,
        command_id: &str,
    ) {
        let now = self.clock.now_ms();

        let mut record = ExecutionRecord::new(
            execution_id.clone(),
            session_id.into(),
            command_id.into(),
            request.clone(),
            now,
        );

        // Transition Pending → Executing immediately (tracker only tracks active executions)
        let _ = record.start_executing(now);

        if let Ok(mut execs) = self.executions.lock() {
            execs.insert(execution_id.clone(), record);
        }

        if let Ok(mut mapping) = self.command_to_execution.lock() {
            mapping.insert(command_id.into(), execution_id);
        }
    }

    /// Append an output line to the execution's tail buffer.
    pub fn on_output_line(&self, command_id: &str, line: &str) {
        let Some(execution_id) = self.get_execution_by_command(command_id) else {
            return;
        };

        if let Ok(mut execs) = self.executions.lock() {
            if let Some(record) = execs.get_mut(&execution_id) {
                record.append_output_line(line.to_string());
            }
        }
    }

    /// Accumulate a parsed diagnostic for the execution.
    pub fn on_diagnostic(&self, command_id: &str, diagnostic: &DiagnosticEvent) {
        let Some(execution_id) = self.get_execution_by_command(command_id) else {
            return;
        };

        if let Ok(mut execs) = self.executions.lock() {
            if let Some(record) = execs.get_mut(&execution_id) {
                record.append_diagnostic(diagnostic.clone());
            }
        }
    }

    /// Handle command completion. Transitions to Completed or Failed,
    /// builds and returns the execution result.
    pub fn on_command_completed(
        &self,
        command_id: &str,
        exit_code: Option<i32>,
    ) -> Option<AgentTerminalExecutionResult> {
        let execution_id = self.get_execution_by_command(command_id)?;
        let now = self.clock.now_ms();

        let mut execs = self.executions.lock().ok()?;
        let record = execs.get_mut(&execution_id)?;

        // Only transition from Executing
        if record.state != ExecutionState::Executing {
            return None;
        }

        let code = exit_code.unwrap_or(-1);
        let _ = if code == 0 {
            record.complete(code, now)
        } else {
            record.fail(code, now)
        };

        let result = record.build_result();
        drop(execs);
        Some(result)
    }

    /// Cancel an execution. Transitions to Cancelled and returns the result.
    pub fn cancel_execution(
        &self,
        execution_id: &str,
    ) -> Option<AgentTerminalExecutionResult> {
        let now = self.clock.now_ms();

        let mut execs = self.executions.lock().ok()?;
        let record = execs.get_mut(execution_id)?;

        // Only cancel if still executing
        if record.state != ExecutionState::Executing {
            return None;
        }

        let _ = record.cancel(now);

        let result = record.build_result();
        drop(execs);
        Some(result)
    }

    /// Scan for timed-out executions and return results for any that exceeded `timeout_ms`.
    pub fn check_timeouts(&self) -> Vec<AgentTerminalExecutionResult> {
        let now = self.clock.now_ms();
        let mut results = Vec::new();

        if let Ok(mut execs) = self.executions.lock() {
            let timed_out_ids: Vec<String> = execs
                .iter()
                .filter(|(_, record)| {
                    record.state == ExecutionState::Executing
                        && record.timeout_ms.is_some()
                        && record.started_at.is_some()
                })
                .filter(|(_, record)| {
                    let elapsed = now.saturating_sub(record.started_at.unwrap());
                    elapsed >= record.timeout_ms.unwrap()
                })
                .map(|(id, _)| id.clone())
                .collect();

            for id in timed_out_ids {
                if let Some(record) = execs.get_mut(&id) {
                    let _ = record.timeout(now);
                    results.push(record.build_result());
                }
            }
        }

        results
    }

    /// Get a clone of an execution record.
    pub fn get_execution(&self, execution_id: &str) -> Option<ExecutionRecord> {
        let execs = self.executions.lock().ok()?;
        execs.get(execution_id).cloned()
    }

    /// Look up `execution_id` from `command_id`.
    pub fn get_execution_by_command(&self, command_id: &str) -> Option<String> {
        let mapping = self.command_to_execution.lock().ok()?;
        mapping.get(command_id).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Maximum tail lines — must match domain::execution::MAX_TAIL_LINES.
    const TAIL_OUTPUT_LIMIT: usize = 50;

    /// Mock clock that returns a fixed time, advanceable for timeout tests.
    struct MockClock {
        time: Mutex<u64>,
    }

    impl MockClock {
        fn new(time: u64) -> Self {
            Self {
                time: Mutex::new(time),
            }
        }

        fn set(&self, time: u64) {
            *self.time.lock().unwrap() = time;
        }
    }

    impl Clock for MockClock {
        fn now_ms(&self) -> u64 {
            *self.time.lock().unwrap()
        }
    }

    fn make_request(cmd: &str, timeout: Option<u64>) -> AgentTerminalExecRequest {
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
            timeout,
        }
    }

    fn make_diagnostic(msg: &str) -> DiagnosticEvent {
        DiagnosticEvent {
            severity: "error".into(),
            file: "src/main.rs".into(),
            line: 42,
            column: Some(5),
            message: msg.into(),
            source: Some("rustc".into()),
        }
    }

    #[test]
    fn register_and_complete_flow() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock.clone());

        let request = make_request("npm test", None);
        tracker.register_execution(
            "exec_1".into(),
            &request,
            "ses_1",
            "cmd_1",
        );

        // Verify record exists in Executing state
        let record = tracker.get_execution("exec_1").unwrap();
        assert_eq!(record.state, ExecutionState::Executing);
        assert_eq!(record.session_id, "ses_1");
        assert_eq!(record.command_id, "cmd_1");
        assert_eq!(record.request.request_id, "req_1");

        // Add some output
        tracker.on_output_line("cmd_1", "PASS src/app.test.ts");
        tracker.on_output_line("cmd_1", "Tests: 3 passed");

        // Complete with exit code 0
        clock.set(2000);
        let result = tracker.on_command_completed("cmd_1", Some(0)).unwrap();

        assert_eq!(result.status, "succeeded");
        assert_eq!(result.exit_code, Some(0));
        assert_eq!(result.duration, 1000);
        assert_eq!(result.output_line_count, 2);
        assert!(result.output_preview.unwrap().contains("Tests: 3 passed"));
    }

    #[test]
    fn diagnostic_accumulation() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock.clone());

        let request = make_request("cargo build", None);
        tracker.register_execution("exec_1".into(), &request, "ses_1", "cmd_1");

        // Accumulate diagnostics
        tracker.on_diagnostic("cmd_1", &make_diagnostic("unused variable"));
        tracker.on_diagnostic("cmd_1", &make_diagnostic("type mismatch"));

        // Complete with failure
        clock.set(3000);
        let result = tracker.on_command_completed("cmd_1", Some(1)).unwrap();

        assert_eq!(result.status, "failed");
        let errors = result.parsed_errors.unwrap();
        assert_eq!(errors.len(), 2);
        assert_eq!(errors[0].message, "unused variable");
        assert_eq!(errors[1].message, "type mismatch");
    }

    #[test]
    fn tail_output_capped_at_limit() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock);

        let request = make_request("long-running", None);
        tracker.register_execution("exec_1".into(), &request, "ses_1", "cmd_1");

        // Push 60 lines — should only keep last 50
        for i in 0..60 {
            tracker.on_output_line("cmd_1", &format!("line {i}"));
        }

        let record = tracker.get_execution("exec_1").unwrap();
        assert_eq!(record.tail_output.len(), TAIL_OUTPUT_LIMIT);
        assert_eq!(record.output_line_count, 60);
        // First retained line should be line 10 (60 - 50)
        assert_eq!(record.tail_output[0], "line 10");
        assert_eq!(record.tail_output[49], "line 59");
    }

    #[test]
    fn timeout_detection() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock.clone());

        // Register with 5-second timeout
        let request = make_request("sleep 100", Some(5000));
        tracker.register_execution("exec_1".into(), &request, "ses_1", "cmd_1");

        // Not yet timed out
        clock.set(4000);
        let timed_out = tracker.check_timeouts();
        assert!(timed_out.is_empty());

        // Now timed out
        clock.set(7000);
        let timed_out = tracker.check_timeouts();
        assert_eq!(timed_out.len(), 1);
        assert_eq!(timed_out[0].status, "timed-out");
        assert_eq!(timed_out[0].request_id, "req_1");
        assert_eq!(timed_out[0].duration, 6000); // 7000 - 1000

        // Should not time out again on subsequent check
        clock.set(10000);
        let timed_out = tracker.check_timeouts();
        assert!(timed_out.is_empty());
    }

    #[test]
    fn cancel_execution() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock.clone());

        let request = make_request("npm start", None);
        tracker.register_execution("exec_1".into(), &request, "ses_1", "cmd_1");

        tracker.on_output_line("cmd_1", "Starting server...");

        clock.set(2500);
        let result = tracker.cancel_execution("exec_1").unwrap();

        assert_eq!(result.status, "cancelled");
        assert_eq!(result.duration, 1500);
        assert_eq!(result.exit_code, None);
        assert_eq!(result.output_line_count, 1);

        // Cannot cancel again
        let result2 = tracker.cancel_execution("exec_1");
        assert!(result2.is_none());
    }

    #[test]
    fn get_execution_by_command_mapping() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock);

        let request = make_request("echo hi", None);
        tracker.register_execution("exec_1".into(), &request, "ses_1", "cmd_1");

        assert_eq!(
            tracker.get_execution_by_command("cmd_1"),
            Some("exec_1".into())
        );
        assert_eq!(tracker.get_execution_by_command("cmd_unknown"), None);
    }

    #[test]
    fn unknown_command_id_is_noop() {
        let clock = Arc::new(MockClock::new(1000));
        let tracker = ExecutionTracker::new(clock);

        // These should not panic
        tracker.on_output_line("nonexistent", "data");
        tracker.on_diagnostic("nonexistent", &make_diagnostic("err"));
        assert!(tracker.on_command_completed("nonexistent", Some(0)).is_none());
    }
}
