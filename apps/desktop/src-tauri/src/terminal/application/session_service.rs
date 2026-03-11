//! Session Service — Application layer orchestration.
//!
//! Coordinates domain objects + ports for session CRUD use cases.
//! Integrates `OutputPipeline` for semantic processing.
//! NO infrastructure imports (no tauri, no portable-pty).

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::terminal::application::execution_tracker::ExecutionTracker;
use crate::terminal::application::output_pipeline::OutputPipeline;
use crate::terminal::domain::ports::{PtyHandle, PtyRuntime, EventEmitter, ShellDetector, Clock, ShellHookInstaller};
use crate::terminal::domain::session::generate_session_id;
use crate::terminal::domain::types::{TerminalSessionMeta, CreateSessionRequest, SessionExitedPayload, TerminalCommand};

/// Internal bookkeeping per managed session.
struct ManagedSession {
    meta: TerminalSessionMeta,
    handle: Box<dyn PtyHandle>,
    pipeline: Arc<Mutex<OutputPipeline>>,
}

/// Central orchestrator for terminal session lifecycle.
/// Holds trait-object ports — fully testable with mocks.
pub struct SessionService {
    sessions: Mutex<HashMap<String, ManagedSession>>,
    pty_runtime: Box<dyn PtyRuntime>,
    event_emitter: Arc<dyn EventEmitter>,
    shell_detector: Box<dyn ShellDetector>,
    clock: Arc<dyn Clock>,
    hook_installer: Option<Box<dyn ShellHookInstaller>>,
    execution_tracker: Option<Arc<ExecutionTracker>>,
}

impl SessionService {
    pub fn new(
        pty_runtime: Box<dyn PtyRuntime>,
        event_emitter: Arc<dyn EventEmitter>,
        shell_detector: Box<dyn ShellDetector>,
        clock: Arc<dyn Clock>,
    ) -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            pty_runtime,
            event_emitter,
            shell_detector,
            clock,
            hook_installer: None,
            execution_tracker: None,
        }
    }

    /// Set the execution tracker for forwarding output/diagnostics to agent executions.
    pub fn with_execution_tracker(mut self, tracker: Arc<ExecutionTracker>) -> Self {
        self.execution_tracker = Some(tracker);
        self
    }

    /// Set the shell hook installer for automatic marker integration.
    pub fn with_hook_installer(mut self, installer: Box<dyn ShellHookInstaller>) -> Self {
        self.hook_installer = Some(installer);
        self
    }

    pub fn create_session(
        &self,
        req: CreateSessionRequest,
    ) -> Result<TerminalSessionMeta, String> {
        // 1. Detect shell
        let (shell_type, shell_path) = self.shell_detector.detect();

        // 1b. Attempt shell hook installation (best-effort, non-blocking)
        if let Some(ref installer) = self.hook_installer {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/".into());
            let _ = installer.install_hooks(&shell_type, &home);
        }

        // 2. Resolve cwd
        let cwd = req
            .cwd
            .unwrap_or_else(|| std::env::var("HOME").unwrap_or_else(|_| "/".into()));

        // 3. Spawn PTY via port
        let handle = self.pty_runtime.spawn(&shell_path, &cwd, 80, 24)?;
        let pid = handle.pid();

        // 4. Build domain object
        let now = self.clock.now_ms();
        let session_id = generate_session_id(now);
        let meta = TerminalSessionMeta::new(
            session_id.clone(),
            &shell_type,
            pid,
            cwd,
            now,
            req.provenance,
        );

        // 5. Create output pipeline for semantic processing
        let pipeline = Arc::new(Mutex::new(OutputPipeline::new(
            session_id.clone(),
            "hybrid".into(),
            self.event_emitter.clone(),
            self.clock.clone(),
            self.execution_tracker.clone(),
        )));

        // 6. Start reader → wire through output pipeline
        let pipeline_clone = pipeline.clone();
        let sid_exit = session_id.clone();
        let emitter_exit = self.event_emitter.clone();

        handle.start_reader(
            Box::new(move |data| {
                if let Ok(mut pipe) = pipeline_clone.lock() {
                    pipe.process_chunk(&data);
                }
            }),
            Box::new(move |exit_code| {
                emitter_exit.emit_session_exited(&SessionExitedPayload {
                    session_id: sid_exit,
                    status: "exited".into(),
                    exit_code,
                });
            }),
        )?;

        // 7. Emit session-created event
        self.event_emitter.emit_session_created(&meta);

        // 8. Store session
        {
            let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
            sessions.insert(
                session_id,
                ManagedSession {
                    meta: meta.clone(),
                    handle,
                    pipeline,
                },
            );
        }

        Ok(meta)
    }

    pub fn kill_session(&self, session_id: &str) -> Result<(), String> {
        let session = {
            let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
            sessions
                .remove(session_id)
                .ok_or_else(|| format!("Session not found: {session_id}"))?
        };

        let exit_code = session.handle.try_exit_code();
        session.handle.stop_reader();
        let _ = session.handle.kill();

        self.event_emitter
            .emit_session_exited(&SessionExitedPayload {
                session_id: session_id.into(),
                status: "exited".into(),
                exit_code,
            });

        Ok(())
    }

    pub fn write_input(&self, session_id: &str, data: &str) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| format!("Session not found: {session_id}"))?;
        let result = session.handle.write_input(data.as_bytes());
        drop(sessions);
        result
    }

    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| format!("Session not found: {session_id}"))?;
        let result = session.handle.resize(cols, rows);
        drop(sessions);
        result
    }

    pub fn list_sessions(&self) -> Result<Vec<TerminalSessionMeta>, String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        Ok(sessions.values().map(|s| s.meta.clone()).collect())
    }

    /// Get tracked commands for a session.
    pub fn get_commands(&self, session_id: &str) -> Result<Vec<TerminalCommand>, String> {
        let pipeline = {
            let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
            let session = sessions
                .get(session_id)
                .ok_or_else(|| format!("Session not found: {session_id}"))?;
            session.pipeline.clone() // Arc clone — release sessions lock first
        };
        let pipeline = pipeline.lock().map_err(|e| e.to_string())?;
        Ok(pipeline.get_commands())
    }

    /// Execute a command in a session (used by `ExecService`).
    pub fn write_command(&self, session_id: &str, command: &str) -> Result<(), String> {
        self.write_input(session_id, command)
    }
}

impl Drop for SessionService {
    fn drop(&mut self) {
        if let Ok(mut sessions) = self.sessions.lock() {
            for (_, session) in sessions.drain() {
                session.handle.stop_reader();
                let _ = session.handle.kill();
            }
        }
    }
}
