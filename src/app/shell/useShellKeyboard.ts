import { useRef } from "react";
import { useSetAtom } from "jotai";

import { goBackAtom, goForwardAtom } from "../../shared/lib/atoms/navigationHistoryAtoms";
import { useKeyboardScope } from "../../shared/lib/keyboard";
import { shortcutOverlayVisibleAtom } from "./KeyboardShortcutOverlay";
import {
  activeSurfaceAtom,
  activeTrayViewAtom,
  toggleAgentPanelAtom,
  toggleFocusModeAtom,
  toggleSidebarAtom,
  toggleSplitAtom,
  toggleTrayAtom,
  toggleZenModeAtom,
  trayVisibleAtom,
  zoomInAtom,
  zoomOutAtom,
  zoomResetAtom,
} from "./model/shellAtoms";

// ─── Shell Keyboard Shortcuts ────────────────────────────
//
// Routes through the centralized keyboardScope dispatcher so that
// panel-level and overlay-level shortcuts can block these global
// bindings when appropriate. Chord system: Cmd+K opens "leader
// mode", then a second key triggers the action.

export function useShellKeyboard() {
  const setActiveSurface = useSetAtom(activeSurfaceAtom);
  const setTrayView = useSetAtom(activeTrayViewAtom);
  const setTrayVisible = useSetAtom(trayVisibleAtom);
  const toggleSidebar = useSetAtom(toggleSidebarAtom);
  const toggleAgent = useSetAtom(toggleAgentPanelAtom);
  const toggleTray = useSetAtom(toggleTrayAtom);
  const toggleFocus = useSetAtom(toggleFocusModeAtom);
  const toggleZen = useSetAtom(toggleZenModeAtom);
  const toggleSplit = useSetAtom(toggleSplitAtom);
  const setShortcutOverlay = useSetAtom(shortcutOverlayVisibleAtom);
  const goBack = useSetAtom(goBackAtom);
  const goForward = useSetAtom(goForwardAtom);
  const zoomIn = useSetAtom(zoomInAtom);
  const zoomOut = useSetAtom(zoomOutAtom);
  const zoomReset = useSetAtom(zoomResetAtom);

  const chordPending = useRef(false);
  const chordTimer = useRef<ReturnType<typeof setTimeout>>();

  // Register as "global" scope — lowest priority.
  // Panel-scoped and overlay-scoped handlers run first; if they
  // claim the event (return true), this handler never fires.
  useKeyboardScope("shell-global", "global", (e) => {
    const meta = e.metaKey || e.ctrlKey;
    const shift = e.shiftKey;
    const key = e.key.toLowerCase();

    // ── Zoom (works everywhere, even in inputs) ──
    if (meta && (key === "=" || key === "+")) {
      e.preventDefault();
      zoomIn();
      return true;
    }
    if (meta && key === "-") {
      e.preventDefault();
      zoomOut();
      return true;
    }
    if (meta && key === "0") {
      e.preventDefault();
      zoomReset();
      return true;
    }

    // Ignore when focused on input/textarea (except specific shortcuts)
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) {
      if (!(meta && (key === "`" || key === "\\"))) return false;
    }

    // ── Escape → don't claim, let panels handle it first ──
    if (key === "escape" && !meta && !shift) {
      return false;
    }

    // ── Cmd+\ → Focus/Zen mode ──
    if (meta && key === "\\") {
      e.preventDefault();
      toggleFocus();
      return true;
    }

    // ── Cmd+[ → Back, Cmd+] → Forward ──
    if (meta && key === "[" && !shift) {
      e.preventDefault();
      goBack();
      return true;
    }
    if (meta && key === "]" && !shift) {
      e.preventDefault();
      goForward();
      return true;
    }

    // ── Chord: Cmd+K → leader mode ──
    if (meta && key === "k" && !shift) {
      if (chordPending.current) {
        e.preventDefault();
        toggleAgent();
        chordPending.current = false;
        clearTimeout(chordTimer.current);
        return true;
      }
      e.preventDefault();
      chordPending.current = true;
      chordTimer.current = setTimeout(() => {
        chordPending.current = false;
      }, 1500);
      return true;
    }

    // ── Chord second key ──
    if (chordPending.current) {
      chordPending.current = false;
      clearTimeout(chordTimer.current);

      const chordActions: Record<string, () => void> = {
        // Layout
        s: () => toggleSidebar(),
        b: () => toggleTray(),
        a: () => toggleAgent(),
        z: () => toggleZen(),
        // Split view
        "\\": () => toggleSplit("vertical"),
        "-": () => toggleSplit("horizontal"),
        // Bottom panels
        t: () => {
          setTrayView("terminal");
          setTrayVisible(true);
        },
        l: () => {
          setTrayView("agent-log");
          setTrayVisible(true);
        },
        o: () => {
          setTrayView("output");
          setTrayVisible(true);
        },
        p: () => {
          setTrayView("problems");
          setTrayVisible(true);
        },
        // Surface switch (1-9+)
        "1": () => setActiveSurface("chat"),
        "2": () => setActiveSurface("editor"),
        "3": () => setActiveSurface("review"),
        "4": () => setActiveSurface("replay"),
        "5": () => setActiveSurface("agent"),
        "6": () => setActiveSurface("graph"),
        "7": () => setActiveSurface("orchestrator"),
        "8": () => setActiveSurface("code"),
        "9": () => setActiveSurface("overview"),
        "0": () => setActiveSurface("tasks"),
      };

      const action = chordActions[key];
      if (action) {
        e.preventDefault();
        action();
        return true;
      }
      return false;
    }

    // ── Direct shortcuts ──

    // ? → keyboard shortcut overlay
    if (key === "?" && !meta && !shift) {
      e.preventDefault();
      setShortcutOverlay((v) => !v);
      return true;
    }

    // Cmd+` → toggle terminal
    if (meta && key === "`") {
      e.preventDefault();
      setTrayView("terminal");
      setTrayVisible(true);
      return true;
    }

    // Cmd+Shift+M → problems
    if (meta && shift && key === "m") {
      e.preventDefault();
      setTrayView("problems");
      setTrayVisible(true);
      return true;
    }

    // Cmd+Shift+U → output
    if (meta && shift && key === "u") {
      e.preventDefault();
      setTrayView("output");
      setTrayVisible(true);
      return true;
    }

    // Cmd+Shift+L → event log
    if (meta && shift && key === "l") {
      e.preventDefault();
      setTrayView("agent-log");
      setTrayVisible(true);
      return true;
    }

    // Cmd+B → toggle sidebar
    if (meta && key === "b" && !shift) {
      e.preventDefault();
      toggleSidebar();
      return true;
    }

    // Cmd+J → toggle bottom panel
    if (meta && key === "j" && !shift) {
      e.preventDefault();
      toggleTray();
      return true;
    }

    return false;
  });
}
