//! Terminal App State — Tauri-managed container.
//!
//! Bridges the hexagonal internals to Tauri's `.manage()` system.
//! Constructed once during app setup (composition root).

use std::sync::Arc;

use crate::terminal::application::exec_service::ExecService;
use crate::terminal::application::execution_tracker::ExecutionTracker;
use crate::terminal::application::session_service::SessionService;

/// The Tauri-managed state object.
pub struct TerminalAppState {
    session_service: Arc<SessionService>,
    exec_service: Arc<ExecService>,
    execution_tracker: Arc<ExecutionTracker>,
}

impl TerminalAppState {
    pub const fn new(
        session_service: Arc<SessionService>,
        exec_service: Arc<ExecService>,
        execution_tracker: Arc<ExecutionTracker>,
    ) -> Self {
        Self {
            session_service,
            exec_service,
            execution_tracker,
        }
    }

    pub fn session_service(&self) -> &SessionService {
        &self.session_service
    }

    pub fn exec_service(&self) -> &ExecService {
        &self.exec_service
    }

    pub fn execution_tracker(&self) -> &ExecutionTracker {
        &self.execution_tracker
    }
}
