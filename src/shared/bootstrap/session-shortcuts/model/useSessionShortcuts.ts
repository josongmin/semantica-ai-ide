import { useCallback, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeTabIdAtom,
  closeTabAtom,
  newTabAtom,
  sessionSidebarOpenAtom,
  sessionSwitcherOpenAtom,
  turnTocOpenAtom,
} from "~shared/lib";

/**
 * Global keyboard shortcut handler for session-level actions.
 *
 * Registers a single `keydown` listener on `document` and routes
 * modifier-key combos to the appropriate Jotai write atoms.
 */
export function useSessionShortcuts(): void {
  const activeTabId = useAtomValue(activeTabIdAtom);
  const setSwitcherOpen = useSetAtom(sessionSwitcherOpenAtom);
  const setSidebarOpen = useSetAtom(sessionSidebarOpenAtom);
  const setTocOpen = useSetAtom(turnTocOpenAtom);
  const closeTab = useSetAtom(closeTabAtom);
  const newTab = useSetAtom(newTabAtom);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Don't fire inside input/textarea/select/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      // All session shortcuts use Cmd+Shift to avoid VS Code conflicts.
      // Cmd+Shift+K → toggle session switcher
      if (e.shiftKey && (e.key === "K" || e.key === "k")) {
        e.preventDefault();
        setSwitcherOpen((v) => !v);
        return;
      }

      // Cmd+Shift+O → toggle turn TOC
      if (e.shiftKey && (e.key === "O" || e.key === "o")) {
        e.preventDefault();
        setTocOpen((v) => !v);
        return;
      }

      // Cmd+Shift+B → toggle session sidebar
      if (e.shiftKey && (e.key === "B" || e.key === "b")) {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }

      // Cmd+Shift+W → close active tab
      if (e.shiftKey && (e.key === "W" || e.key === "w")) {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Cmd+Shift+N → new session tab
      if (e.shiftKey && (e.key === "N" || e.key === "n")) {
        e.preventDefault();
        newTab();
        
      }
    },
    [
      activeTabId,
      setSwitcherOpen,
      setSidebarOpen,
      setTocOpen,
      closeTab,
      newTab,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
