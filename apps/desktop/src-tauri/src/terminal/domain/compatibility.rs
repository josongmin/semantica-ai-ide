//! Compatibility Detector — Alt-screen, mouse capture, TUI detection.
//!
//! Monitors ANSI escape sequences to detect when the terminal enters
//! a mode incompatible with semantic overlay (vim, tmux, less, fzf, etc.).
//!
//! Pure domain logic — no I/O.

use super::types::{CompatibilityFlags, CompatibilityState};

/// Internal boolean state tracking for the detector.
#[allow(clippy::struct_excessive_bools)]
#[derive(Debug, Clone, Default)]
struct DetectorFlags {
    alt_screen: bool,
    mouse_capture: bool,
    fullscreen_tui: bool,
    unknown_control_burst: bool,
}

// ─── ANSI Detection Constants ────────────────────────────

// Alt-screen enter/exit
const ALT_SCREEN_ENTER_1: &str = "\x1b[?1049h";
const ALT_SCREEN_ENTER_2: &str = "\x1b[?47h";
const ALT_SCREEN_EXIT_1: &str = "\x1b[?1049l";
const ALT_SCREEN_EXIT_2: &str = "\x1b[?47l";

// Mouse capture
const MOUSE_ENABLE_1: &str = "\x1b[?1000h"; // basic mouse
const MOUSE_ENABLE_2: &str = "\x1b[?1002h"; // button event
const MOUSE_ENABLE_3: &str = "\x1b[?1003h"; // any event
const MOUSE_DISABLE_1: &str = "\x1b[?1000l";
const MOUSE_DISABLE_2: &str = "\x1b[?1002l";
const MOUSE_DISABLE_3: &str = "\x1b[?1003l";

// Bracketed paste mode (indicates advanced terminal app)
const BRACKETED_PASTE_ENABLE: &str = "\x1b[?2004h";

// Control sequence burst threshold (per chunk)
const CONTROL_BURST_THRESHOLD: usize = 50;

// ─── Detector ────────────────────────────────────────────

/// Tracks compatibility state for a single terminal session.
pub struct CompatibilityDetector {
    session_id: String,
    flags: DetectorFlags,
    user_mode: String, // user's preferred mode
}

impl CompatibilityDetector {
    pub fn new(session_id: String, user_mode: String) -> Self {
        Self {
            session_id,
            flags: DetectorFlags::default(),
            user_mode,
        }
    }

    /// Process a raw PTY output chunk and update compatibility state.
    /// Returns `Some(state)` if the state changed, `None` if unchanged.
    pub fn process_chunk(&mut self, data: &str) -> Option<CompatibilityState> {
        let prev_alt = self.flags.alt_screen;
        let prev_mouse = self.flags.mouse_capture;
        let prev_tui = self.flags.fullscreen_tui;
        let prev_burst = self.flags.unknown_control_burst;

        // Alt-screen detection
        if data.contains(ALT_SCREEN_ENTER_1) || data.contains(ALT_SCREEN_ENTER_2) {
            self.flags.alt_screen = true;
            self.flags.fullscreen_tui = true;
        }
        if data.contains(ALT_SCREEN_EXIT_1) || data.contains(ALT_SCREEN_EXIT_2) {
            self.flags.alt_screen = false;
            self.flags.fullscreen_tui = false;
        }

        // Mouse capture detection
        if data.contains(MOUSE_ENABLE_1)
            || data.contains(MOUSE_ENABLE_2)
            || data.contains(MOUSE_ENABLE_3)
        {
            self.flags.mouse_capture = true;
        }
        if data.contains(MOUSE_DISABLE_1)
            || data.contains(MOUSE_DISABLE_2)
            || data.contains(MOUSE_DISABLE_3)
        {
            self.flags.mouse_capture = false;
        }

        // Bracketed paste indicates advanced TUI
        if data.contains(BRACKETED_PASTE_ENABLE) && self.flags.alt_screen {
            self.flags.fullscreen_tui = true;
        }

        // Control sequence burst detection
        let control_count = data.matches("\x1b[").count() + data.matches("\x1b]").count();
        self.flags.unknown_control_burst = control_count > CONTROL_BURST_THRESHOLD;

        // Check if state changed
        let changed = self.flags.alt_screen != prev_alt
            || self.flags.mouse_capture != prev_mouse
            || self.flags.fullscreen_tui != prev_tui
            || self.flags.unknown_control_burst != prev_burst;

        if changed {
            Some(self.current_state())
        } else {
            None
        }
    }

    /// Get the current compatibility state snapshot.
    pub fn current_state(&self) -> CompatibilityState {
        let (effective_mode, overlay_enabled, reason) = self.compute_effective_mode();

        CompatibilityState {
            session_id: self.session_id.clone(),
            flags: CompatibilityFlags {
                alt_screen: self.flags.alt_screen,
                mouse_capture: self.flags.mouse_capture,
                fullscreen_tui: self.flags.fullscreen_tui,
                unknown_control_burst: self.flags.unknown_control_burst,
            },
            effective_mode,
            overlay_enabled,
            reason,
        }
    }

    /// Compute effective mode based on compatibility state.
    /// Downgrades from user's preferred mode when incompatibilities detected.
    fn compute_effective_mode(&self) -> (String, bool, Option<String>) {
        // Alt-screen → force classic, no overlay
        if self.flags.alt_screen {
            return (
                "classic".into(),
                false,
                Some("Alt-screen active (vim/tmux/less)".into()),
            );
        }

        // Mouse capture without alt-screen → hybrid, no overlay
        if self.flags.mouse_capture {
            return (
                "classic".into(),
                false,
                Some("Mouse capture active (fzf/interactive TUI)".into()),
            );
        }

        // Control burst → keep mode but disable overlay temporarily
        if self.flags.unknown_control_burst {
            return (
                self.user_mode.clone(),
                false,
                Some("High control sequence burst detected".into()),
            );
        }

        // Normal operation — use user's preferred mode
        let overlay_enabled = self.user_mode != "classic";
        (self.user_mode.clone(), overlay_enabled, None)
    }

    pub const fn is_overlay_safe(&self) -> bool {
        !self.flags.alt_screen && !self.flags.mouse_capture && !self.flags.unknown_control_burst
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_detector() -> CompatibilityDetector {
        CompatibilityDetector::new("ses_1".into(), "hybrid".into())
    }

    #[test]
    fn detects_alt_screen_enter() {
        let mut det = make_detector();
        let state = det.process_chunk("\x1b[?1049h").unwrap();
        assert!(state.flags.alt_screen);
        assert_eq!(state.effective_mode, "classic");
        assert!(!state.overlay_enabled);
    }

    #[test]
    fn detects_alt_screen_exit() {
        let mut det = make_detector();
        det.process_chunk("\x1b[?1049h");
        let state = det.process_chunk("\x1b[?1049l").unwrap();
        assert!(!state.flags.alt_screen);
        assert_eq!(state.effective_mode, "hybrid");
        assert!(state.overlay_enabled);
    }

    #[test]
    fn detects_mouse_capture() {
        let mut det = make_detector();
        let state = det.process_chunk("\x1b[?1003h").unwrap();
        assert!(state.flags.mouse_capture);
        assert!(!state.overlay_enabled);
    }

    #[test]
    fn detects_mouse_release() {
        let mut det = make_detector();
        det.process_chunk("\x1b[?1003h");
        let state = det.process_chunk("\x1b[?1003l").unwrap();
        assert!(!state.flags.mouse_capture);
        assert!(state.overlay_enabled);
    }

    #[test]
    fn detects_control_burst() {
        let mut det = make_detector();
        let burst = "\x1b[0m".repeat(60);
        let state = det.process_chunk(&burst).unwrap();
        assert!(state.flags.unknown_control_burst);
        assert!(!state.overlay_enabled);
    }

    #[test]
    fn no_change_returns_none() {
        let mut det = make_detector();
        assert!(det.process_chunk("normal output").is_none());
    }

    #[test]
    fn is_overlay_safe_when_clean() {
        let det = make_detector();
        assert!(det.is_overlay_safe());
    }

    #[test]
    fn not_overlay_safe_in_alt_screen() {
        let mut det = make_detector();
        det.process_chunk("\x1b[?1049h");
        assert!(!det.is_overlay_safe());
    }

    #[test]
    fn alternative_alt_screen_sequence() {
        let mut det = make_detector();
        let state = det.process_chunk("\x1b[?47h").unwrap();
        assert!(state.flags.alt_screen);
    }
}
