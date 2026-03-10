//! Session Aggregate — Domain logic for session lifecycle.
//!
//! Pure state transitions, no I/O.

use super::types::{SessionProvenance, ShellType, TerminalSessionMeta};

impl TerminalSessionMeta {
    pub fn new(
        session_id: String,
        shell_type: &ShellType,
        pid: u32,
        cwd: String,
        created_at: u64,
        provenance: SessionProvenance,
    ) -> Self {
        let title = format!(
            "{} \u{2014} {}",
            shell_type,
            cwd.split('/').next_back().unwrap_or("~")
        );

        Self {
            session_id,
            title,
            shell_type: shell_type.as_str().into(),
            pid,
            cwd,
            created_at,
            status: "running".into(),
            exit_code: None,
            provenance,
            mode: "hybrid".into(),
            marker_support: false,
            purpose: None,
        }
    }

    #[allow(dead_code)]
    pub fn mark_exited(&mut self, exit_code: Option<i32>) {
        self.status = "exited".into();
        self.exit_code = exit_code;
    }

    #[allow(dead_code)]
    pub fn is_running(&self) -> bool {
        self.status == "running" || self.status == "starting"
    }
}

/// Generate a unique session ID using timestamp + atomic counter.
pub fn generate_session_id(now_ms: u64) -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    let seq = COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("ses_{now_ms:x}_{seq:x}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_meta_title_uses_last_path_segment() {
        let meta = TerminalSessionMeta::new(
            "ses_1".into(),
            &ShellType::Zsh,
            42,
            "/Users/dev/project".into(),
            1000,
            SessionProvenance::User,
        );
        assert!(meta.title.contains("project"));
        assert!(meta.is_running());
    }

    #[test]
    fn mark_exited_transitions_status() {
        let mut meta = TerminalSessionMeta::new(
            "ses_2".into(),
            &ShellType::Bash,
            43,
            "/tmp".into(),
            2000,
            SessionProvenance::System,
        );
        meta.mark_exited(Some(0));
        assert_eq!(meta.status, "exited");
        assert_eq!(meta.exit_code, Some(0));
        assert!(!meta.is_running());
    }

    #[test]
    fn session_ids_are_unique() {
        let id1 = generate_session_id(1000);
        let id2 = generate_session_id(1000);
        assert_ne!(id1, id2);
    }
}
