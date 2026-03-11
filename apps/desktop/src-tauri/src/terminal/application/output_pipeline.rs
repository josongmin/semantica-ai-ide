//! Output Pipeline — Processes raw PTY output through the full semantic chain.
//!
//! Raw bytes → UTF-8 → marker extraction → command tracking →
//! output parsing → task detection → compatibility check → event emission.
//!
//! NO infrastructure imports. Uses domain types and ports only.

use std::sync::Arc;

use crate::terminal::application::execution_tracker::ExecutionTracker;
use crate::terminal::domain::command::CommandTracker;
use crate::terminal::domain::compatibility::CompatibilityDetector;
use crate::terminal::domain::output_parsers::registry::OutputParserRegistry;
use crate::terminal::domain::ports::{Clock, EventEmitter};
use crate::terminal::domain::shell_integration;
use crate::terminal::domain::task_detector;
use crate::terminal::domain::types::{
    CompatibilityState, DiagnosticEvent, FallbackTriggeredPayload, OutputChunk,
    OverlayModeChangedPayload, ParsedEventData, ParsedEventKind, SessionCwdChangedPayload,
    SessionModeChangedPayload, ShellMarker, TerminalCommand,
};

/// Per-session output processing pipeline.
pub struct OutputPipeline {
    session_id: String,
    command_tracker: CommandTracker,
    compat_detector: CompatibilityDetector,
    parser_registry: OutputParserRegistry,
    event_emitter: Arc<dyn EventEmitter>,
    clock: Arc<dyn Clock>,
    current_task_type: Option<String>,
    line_buffer: String,
    user_preferred_mode: String,
    effective_mode: String,
    overlay_enabled: bool,
    /// Collected diagnostics for the current command (for agent execution results).
    collected_diagnostics: Vec<DiagnosticEvent>,
    /// Optional execution tracker for forwarding output/diagnostics to agent executions.
    execution_tracker: Option<Arc<ExecutionTracker>>,
}

impl OutputPipeline {
    pub fn new(
        session_id: String,
        user_mode: String,
        event_emitter: Arc<dyn EventEmitter>,
        clock: Arc<dyn Clock>,
        execution_tracker: Option<Arc<ExecutionTracker>>,
    ) -> Self {
        let overlay_enabled = user_mode != "classic";
        Self {
            command_tracker: CommandTracker::new(session_id.clone()),
            compat_detector: CompatibilityDetector::new(session_id.clone(), user_mode.clone()),
            parser_registry: OutputParserRegistry::with_defaults(),
            session_id,
            event_emitter,
            clock,
            current_task_type: None,
            line_buffer: String::new(),
            effective_mode: user_mode.clone(),
            user_preferred_mode: user_mode,
            overlay_enabled,
            collected_diagnostics: Vec::new(),
            execution_tracker,
        }
    }

    /// Process a raw PTY output chunk through the full pipeline.
    /// This is the main entry point called by the reader thread callback.
    pub fn process_chunk(&mut self, raw_data: &[u8]) {
        let text = String::from_utf8_lossy(raw_data);
        let now = self.clock.now_ms();

        // 1. Emit raw output (always, regardless of mode)
        self.event_emitter.emit_output(&OutputChunk {
            session_id: self.session_id.clone(),
            data: text.to_string(),
        });

        // 2. Compatibility check — detect alt-screen, mouse capture
        let compat_change = self.compat_detector.process_chunk(&text);
        if let Some(ref compat_state) = compat_change {
            self.event_emitter.emit_compatibility_state(compat_state);
            self.apply_mode_change(compat_state);
        }

        // 3. If not overlay-safe, skip semantic processing
        if !self.compat_detector.is_overlay_safe() {
            return;
        }

        // 4. Accumulate partial lines and process complete lines
        self.line_buffer.push_str(&text);
        let lines = self.drain_complete_lines();

        for line in lines {
            self.process_line(&line, now);
        }
    }

    /// Process a single complete line through marker extraction, command tracking,
    /// output parsing, and task detection.
    fn process_line(&mut self, line: &str, now: u64) {
        // 4a. Extract shell markers
        let processed = shell_integration::process_output(line);

        for (marker, cleaned_line) in processed {
            match marker {
                Some(ShellMarker::CommandStart(start_marker)) => {
                    // Detect task type from command
                    self.current_task_type =
                        task_detector::detect_task_type_from_command(&start_marker.command);

                    let cmd = self.command_tracker.on_command_start(start_marker);
                    self.event_emitter.emit_command_started(&cmd);
                }
                Some(ShellMarker::CommandEnd(end_marker)) => {
                    if let Some(cmd) = self.command_tracker.on_command_end(&end_marker) {
                        self.event_emitter.emit_command_completed(&cmd);
                        // Notify execution tracker of command completion
                        if let Some(ref tracker) = self.execution_tracker {
                            if let Some(result) = tracker.on_command_completed(&cmd.command_id, cmd.exit_code) {
                                self.event_emitter.emit_agent_exec_completed(&result);
                            }
                        }
                    }
                    self.current_task_type = None;
                }
                Some(ShellMarker::CwdChanged { cwd }) => {
                    self.event_emitter
                        .emit_session_cwd_changed(&SessionCwdChangedPayload {
                            session_id: self.session_id.clone(),
                            cwd,
                        });
                }
                None => {
                    // Regular output line — run through parsers
                    self.command_tracker.count_line();
                    self.process_output_line(&cleaned_line, now);
                }
            }
        }
    }

    /// Run a cleaned output line through parsers and task detector.
    fn process_output_line(&mut self, line: &str, now: u64) {
        if line.trim().is_empty() {
            return;
        }

        let command_id = self
            .command_tracker
            .active_command()
            .map(|c| c.command_id.clone())
            .unwrap_or_default();

        // Run output parsers
        let events = self.parser_registry.parse_line(line);
        for mut event in events {
            event.session_id.clone_from(&self.session_id);
            event.command_id.clone_from(&command_id);
            event.timestamp = now;
            self.event_emitter.emit_parsed_event(&event);

            // Collect diagnostics for execution tracker
            if matches!(event.kind, ParsedEventKind::Diagnostic) {
                if let ParsedEventData::Diagnostic(ref diag) = event.data {
                    self.collected_diagnostics.push(diag.clone());
                    if let Some(ref tracker) = self.execution_tracker {
                        tracker.on_diagnostic(&command_id, diag);
                    }
                }
            }
        }

        // Forward output line to execution tracker for tail collection
        if let Some(ref tracker) = self.execution_tracker {
            let cmd_id = &command_id;
            if !cmd_id.is_empty() {
                tracker.on_output_line(cmd_id, line);
            }
        }

        // Run task detector
        if let Some(ref task_type) = self.current_task_type {
            if let Some(task_state) =
                task_detector::detect_from_output(&self.session_id, &command_id, task_type, line)
            {
                self.event_emitter.emit_task_state(&task_state);
            }
        }
    }

    /// Apply mode change based on compatibility state, emitting overlay-mode-changed,
    /// session-mode-changed, and fallback-triggered events as appropriate.
    fn apply_mode_change(&mut self, compat_state: &CompatibilityState) {
        let new_overlay_enabled = compat_state.overlay_enabled;
        let new_effective_mode = if new_overlay_enabled {
            self.user_preferred_mode.clone()
        } else {
            "classic".to_string()
        };

        if new_overlay_enabled == self.overlay_enabled && new_effective_mode == self.effective_mode {
            return;
        }

        let previous_mode = self.effective_mode.clone();
        self.overlay_enabled = new_overlay_enabled;
        self.effective_mode.clone_from(&new_effective_mode);

        // Emit overlay mode changed
        self.event_emitter.emit_overlay_mode_changed(&OverlayModeChangedPayload {
            session_id: self.session_id.clone(),
            mode: new_effective_mode.clone(),
            overlay_enabled: new_overlay_enabled,
            reason: compat_state.reason.clone(),
        });

        // Emit session mode changed
        self.event_emitter.emit_session_mode_changed(&SessionModeChangedPayload {
            session_id: self.session_id.clone(),
            mode: new_effective_mode.clone(),
            reason: compat_state.reason.clone(),
        });

        // If falling back from preferred mode, emit fallback event
        if !new_overlay_enabled && previous_mode != "classic" {
            self.event_emitter.emit_fallback_triggered(&FallbackTriggeredPayload {
                session_id: self.session_id.clone(),
                reason: compat_state.reason.clone().unwrap_or_else(|| "compatibility".into()),
                previous_mode,
                new_mode: new_effective_mode,
            });
        }
    }

    /// Drain complete lines from the line buffer, leaving any partial last line.
    fn drain_complete_lines(&mut self) -> Vec<String> {
        let Some(last_newline) = self.line_buffer.rfind('\n') else {
            return Vec::new();
        };

        // Take ownership of buffer, split in-place — avoids 2 extra allocations
        let mut complete = std::mem::take(&mut self.line_buffer);
        self.line_buffer = complete.split_off(last_newline + 1);

        complete.lines()
            .filter(|l| !l.is_empty())
            .map(|l| l.to_string())
            .collect()
    }

    /// Get all tracked commands for this session.
    pub fn get_commands(&self) -> Vec<TerminalCommand> {
        self.command_tracker.all_commands()
    }

    /// Get current compatibility state.
    #[allow(dead_code)]
    pub fn compatibility_state(&self) -> CompatibilityState {
        self.compat_detector.current_state()
    }

    /// Drain collected diagnostics (called by execution tracker on command completion).
    #[allow(dead_code)]
    pub fn drain_diagnostics(&mut self) -> Vec<DiagnosticEvent> {
        std::mem::take(&mut self.collected_diagnostics)
    }
}
