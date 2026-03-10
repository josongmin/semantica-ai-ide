//! Session Mode — Domain logic for terminal mode switching and fallback.
//!
//! Handles classic/hybrid/semantic mode transitions and
//! automatic fallback when alt-screen/TUI apps are detected.
//!
//! Pure domain logic — no I/O.

use super::types::{CompatibilityState, OverlayModeChangedPayload};

// ─── Mode Manager ───────────────────────────────────────

/// Manages effective terminal mode for a session, applying automatic
/// fallback when incompatible terminal states are detected.
#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct TerminalModeManager {
    session_id: String,
    user_preferred_mode: String,
    effective_mode: String,
    overlay_enabled: bool,
    fallback_reason: Option<String>,
}

#[allow(dead_code)]
impl TerminalModeManager {
    pub fn new(session_id: String, user_preferred_mode: String) -> Self {
        let overlay_enabled = user_preferred_mode != "classic";
        Self {
            session_id,
            effective_mode: user_preferred_mode.clone(),
            user_preferred_mode,
            overlay_enabled,
            fallback_reason: None,
        }
    }

    /// Update effective mode based on compatibility state changes.
    /// Returns `Some(payload)` if the mode actually changed.
    pub fn update_from_compatibility(
        &mut self,
        compat: &CompatibilityState,
    ) -> Option<OverlayModeChangedPayload> {
        let prev_mode = self.effective_mode.clone();
        let prev_overlay = self.overlay_enabled;

        if compat.flags.alt_screen || compat.flags.fullscreen_tui {
            // Full fallback — force classic, no overlay
            self.effective_mode = "classic".into();
            self.overlay_enabled = false;
            self.fallback_reason = Some(
                if compat.flags.alt_screen {
                    "Alt-screen active (vim/tmux/less)"
                } else {
                    "Fullscreen TUI detected"
                }
                .into(),
            );
        } else if compat.flags.mouse_capture {
            // Partial fallback — overlay stays but interactions limited
            self.effective_mode = self.user_preferred_mode.clone();
            self.overlay_enabled = self.user_preferred_mode != "classic";
            self.fallback_reason = Some("Mouse capture active — interactions limited".into());
        } else {
            // Restore to user preference
            self.effective_mode = self.user_preferred_mode.clone();
            self.overlay_enabled = self.user_preferred_mode != "classic";
            self.fallback_reason = None;
        }

        // Only emit if something changed
        if self.effective_mode != prev_mode || self.overlay_enabled != prev_overlay {
            Some(OverlayModeChangedPayload {
                session_id: self.session_id.clone(),
                mode: self.effective_mode.clone(),
                overlay_enabled: self.overlay_enabled,
                reason: self.fallback_reason.clone(),
            })
        } else {
            None
        }
    }

    /// Explicitly set the user's preferred mode. Returns payload if mode changed.
    pub fn set_user_mode(&mut self, mode: &str) -> Option<OverlayModeChangedPayload> {
        let prev_mode = self.effective_mode.clone();
        let prev_overlay = self.overlay_enabled;

        self.user_preferred_mode = mode.into();

        // Only apply if not in fallback
        if self.fallback_reason.is_none() {
            self.effective_mode = mode.into();
            self.overlay_enabled = mode != "classic";
        }

        if self.effective_mode != prev_mode || self.overlay_enabled != prev_overlay {
            Some(OverlayModeChangedPayload {
                session_id: self.session_id.clone(),
                mode: self.effective_mode.clone(),
                overlay_enabled: self.overlay_enabled,
                reason: self.fallback_reason.clone(),
            })
        } else {
            None
        }
    }

    /// Current effective mode (may differ from user preference during fallback).
    pub fn effective_mode(&self) -> &str {
        &self.effective_mode
    }

    /// Whether the semantic overlay is currently enabled.
    pub const fn is_overlay_enabled(&self) -> bool {
        self.overlay_enabled
    }
}

// ─── Tests ──────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::terminal::domain::types::CompatibilityFlags;

    fn make_manager() -> TerminalModeManager {
        TerminalModeManager::new("ses_1".into(), "hybrid".into())
    }

    fn make_compat(
        alt_screen: bool,
        mouse_capture: bool,
        fullscreen_tui: bool,
    ) -> CompatibilityState {
        CompatibilityState {
            session_id: "ses_1".into(),
            flags: CompatibilityFlags {
                alt_screen,
                mouse_capture,
                fullscreen_tui,
                unknown_control_burst: false,
            },
            effective_mode: "hybrid".into(),
            overlay_enabled: true,
            reason: None,
        }
    }

    // ─── Initial State ──────────────────────────────────

    #[test]
    fn initial_state_hybrid() {
        let mgr = make_manager();
        assert_eq!(mgr.effective_mode(), "hybrid");
        assert!(mgr.is_overlay_enabled());
    }

    #[test]
    fn initial_state_classic() {
        let mgr = TerminalModeManager::new("ses_1".into(), "classic".into());
        assert_eq!(mgr.effective_mode(), "classic");
        assert!(!mgr.is_overlay_enabled());
    }

    #[test]
    fn initial_state_semantic() {
        let mgr = TerminalModeManager::new("ses_1".into(), "semantic".into());
        assert_eq!(mgr.effective_mode(), "semantic");
        assert!(mgr.is_overlay_enabled());
    }

    // ─── Alt-Screen Fallback ────────────────────────────

    #[test]
    fn alt_screen_forces_classic() {
        let mut mgr = make_manager();
        let compat = make_compat(true, false, false);
        let payload = mgr.update_from_compatibility(&compat);

        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "classic");
        assert!(!p.overlay_enabled);
        assert!(p.reason.is_some());
        assert_eq!(mgr.effective_mode(), "classic");
        assert!(!mgr.is_overlay_enabled());
    }

    #[test]
    fn fullscreen_tui_forces_classic() {
        let mut mgr = make_manager();
        let compat = make_compat(false, false, true);
        let payload = mgr.update_from_compatibility(&compat);

        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "classic");
        assert!(!p.overlay_enabled);
    }

    #[test]
    fn restore_after_alt_screen_exit() {
        let mut mgr = make_manager();
        mgr.update_from_compatibility(&make_compat(true, false, false));
        assert_eq!(mgr.effective_mode(), "classic");

        let payload = mgr.update_from_compatibility(&make_compat(false, false, false));
        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "hybrid");
        assert!(p.overlay_enabled);
        assert!(p.reason.is_none());
    }

    // ─── Mouse Capture ──────────────────────────────────

    #[test]
    fn mouse_capture_keeps_mode_with_limited_interactions() {
        let mut mgr = make_manager();
        let compat = make_compat(false, true, false);
        let payload = mgr.update_from_compatibility(&compat);

        // Mode stays hybrid, overlay stays enabled, but reason indicates limitation
        // No change in mode/overlay from initial state, but fallback_reason is set
        // Since effective_mode and overlay_enabled didn't change, no payload emitted
        assert!(payload.is_none());
        assert_eq!(mgr.effective_mode(), "hybrid");
        assert!(mgr.is_overlay_enabled());
    }

    #[test]
    fn mouse_capture_after_alt_screen_restores_with_reason() {
        let mut mgr = make_manager();
        // Enter alt-screen
        mgr.update_from_compatibility(&make_compat(true, false, false));
        assert_eq!(mgr.effective_mode(), "classic");

        // Exit alt-screen but mouse captured
        let payload = mgr.update_from_compatibility(&make_compat(false, true, false));
        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "hybrid");
        assert!(p.overlay_enabled);
        assert!(p.reason.is_some());
        assert!(p.reason.unwrap().contains("Mouse capture"));
    }

    // ─── User Mode Changes ──────────────────────────────

    #[test]
    fn set_user_mode_changes_effective() {
        let mut mgr = make_manager();
        let payload = mgr.set_user_mode("semantic");

        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "semantic");
        assert!(p.overlay_enabled);
        assert_eq!(mgr.effective_mode(), "semantic");
    }

    #[test]
    fn set_user_mode_to_classic() {
        let mut mgr = make_manager();
        let payload = mgr.set_user_mode("classic");

        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "classic");
        assert!(!p.overlay_enabled);
    }

    #[test]
    fn set_user_mode_during_fallback_does_not_change_effective() {
        let mut mgr = make_manager();
        // Enter alt-screen fallback
        mgr.update_from_compatibility(&make_compat(true, false, false));
        assert_eq!(mgr.effective_mode(), "classic");

        // User changes preference — effective stays classic during fallback
        let payload = mgr.set_user_mode("semantic");
        assert!(payload.is_none());
        assert_eq!(mgr.effective_mode(), "classic");

        // After alt-screen exits, new preference applies
        let payload = mgr.update_from_compatibility(&make_compat(false, false, false));
        assert!(payload.is_some());
        let p = payload.unwrap();
        assert_eq!(p.mode, "semantic");
        assert!(p.overlay_enabled);
    }

    #[test]
    fn set_same_mode_returns_none() {
        let mut mgr = make_manager();
        let payload = mgr.set_user_mode("hybrid");
        assert!(payload.is_none());
    }

    // ─── No-Change Returns None ─────────────────────────

    #[test]
    fn no_change_in_compat_returns_none() {
        let mut mgr = make_manager();
        let compat = make_compat(false, false, false);
        let payload = mgr.update_from_compatibility(&compat);
        assert!(payload.is_none());
    }

    #[test]
    fn repeated_alt_screen_returns_none() {
        let mut mgr = make_manager();
        mgr.update_from_compatibility(&make_compat(true, false, false));
        // Second call with same state — no change
        let payload = mgr.update_from_compatibility(&make_compat(true, false, false));
        assert!(payload.is_none());
    }
}
