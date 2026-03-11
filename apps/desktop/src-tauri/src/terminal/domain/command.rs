//! Command Tracker — Domain logic for command lifecycle state machine.
//!
//! Tracks command start/end via shell markers, associates output lines,
//! calculates duration. Pure state transitions, no I/O.

use super::types::{TerminalCommand, CommandStartMarker, CommandStatus, CommandProvenance, OutputLineRange, CommandEndMarker};
use std::sync::atomic::{AtomicU64, Ordering};

static CMD_COUNTER: AtomicU64 = AtomicU64::new(0);

fn generate_command_id() -> String {
    let seq = CMD_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("cmd_{seq:x}")
}

/// Tracks the currently active command and completed command history
/// for a single terminal session.
pub struct CommandTracker {
    session_id: String,
    active: Option<TerminalCommand>,
    history: Vec<TerminalCommand>,
    line_counter: usize,
}

impl CommandTracker {
    pub const fn new(session_id: String) -> Self {
        Self {
            session_id,
            active: None,
            history: Vec::new(),
            line_counter: 0,
        }
    }

    /// Called when a `CMD_START` marker is detected.
    /// Returns the newly created command.
    pub fn on_command_start(&mut self, marker: CommandStartMarker) -> TerminalCommand {
        // If there's an active command without an end marker, finalize it as unknown
        if let Some(mut prev) = self.active.take() {
            prev.status = CommandStatus::Unknown;
            prev.completed_at = Some(marker.timestamp);
            if let Some(started) = Some(prev.started_at) {
                prev.duration = Some(marker.timestamp.saturating_sub(started));
            }
            if let Some(ref mut range) = prev.output_line_range {
                range.end = self.line_counter;
            }
            self.history.push(prev);
        }

        let cmd = TerminalCommand {
            command_id: generate_command_id(),
            session_id: self.session_id.clone(),
            command: marker.command,
            cwd: marker.cwd,
            started_at: marker.timestamp,
            completed_at: None,
            exit_code: None,
            status: CommandStatus::Running,
            duration: None,
            provenance: CommandProvenance::User,
            output_line_range: Some(OutputLineRange {
                start: self.line_counter,
                end: self.line_counter,
            }),
        };

        self.active = Some(cmd.clone());
        cmd
    }

    /// Called when a `CMD_END` marker is detected.
    /// Returns the completed command, or None if no active command.
    pub fn on_command_end(&mut self, marker: &CommandEndMarker) -> Option<TerminalCommand> {
        let mut cmd = self.active.take()?;

        cmd.exit_code = Some(marker.exit_code);
        cmd.completed_at = Some(marker.timestamp);
        cmd.duration = Some(marker.timestamp.saturating_sub(cmd.started_at));
        cmd.status = if marker.exit_code == 0 {
            CommandStatus::Succeeded
        } else {
            CommandStatus::Failed
        };
        if let Some(ref mut range) = cmd.output_line_range {
            range.end = self.line_counter;
        }

        self.history.push(cmd.clone());
        Some(cmd)
    }

    /// Increment the output line counter (called for each output line).
    pub const fn count_line(&mut self) {
        self.line_counter += 1;
    }

    pub const fn active_command(&self) -> Option<&TerminalCommand> {
        self.active.as_ref()
    }

    pub fn all_commands(&self) -> Vec<TerminalCommand> {
        let mut all = Vec::with_capacity(self.history.len() + usize::from(self.active.is_some()));
        all.extend_from_slice(&self.history);
        if let Some(ref active) = self.active {
            all.push(active.clone());
        }
        all
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tracks_command_lifecycle() {
        let mut tracker = CommandTracker::new("ses_1".into());

        let started = tracker.on_command_start(CommandStartMarker {
            command: "npm test".into(),
            cwd: "/project".into(),
            timestamp: 1000,
        });
        assert_eq!(started.status, CommandStatus::Running);
        assert!(tracker.active_command().is_some());

        tracker.count_line();
        tracker.count_line();

        let completed = tracker.on_command_end(&CommandEndMarker {
            exit_code: 0,
            timestamp: 5000,
        });
        assert!(completed.is_some());
        let cmd = completed.unwrap();
        assert_eq!(cmd.status, CommandStatus::Succeeded);
        assert_eq!(cmd.duration, Some(4000));
        assert_eq!(cmd.exit_code, Some(0));
        assert!(tracker.active_command().is_none());
        assert_eq!(tracker.all_commands().len(), 1);
    }

    #[test]
    fn orphan_command_finalized_on_next_start() {
        let mut tracker = CommandTracker::new("ses_1".into());

        tracker.on_command_start(CommandStartMarker {
            command: "cmd1".into(),
            cwd: "/".into(),
            timestamp: 1000,
        });

        // Start another command without ending the first
        tracker.on_command_start(CommandStartMarker {
            command: "cmd2".into(),
            cwd: "/".into(),
            timestamp: 3000,
        });

        // First command should be in history with Unknown status, plus active = 2 total
        let all = tracker.all_commands();
        assert_eq!(all.len(), 2);
        assert_eq!(all[0].status, CommandStatus::Unknown);
        assert!(tracker.active_command().is_some());
    }
}
