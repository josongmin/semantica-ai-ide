import React, { useCallback, useEffect } from "react";
import { useAtom } from "jotai";

import { keyboardShortcutsOpenAtom } from "../../shared/lib";
import { Dialog, Kbd, Text } from "../../shared/ui";

interface ShortcutEntry {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutEntry[];
}

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const MOD = isMac ? "\u2318" : "Ctrl";

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Chat",
    shortcuts: [
      { keys: ["Enter"], label: "Send message" },
      { keys: ["Shift", "Enter"], label: "New line" },
      { keys: ["Escape"], label: "Clear focus / cancel" },
      { keys: ["/"], label: "Focus prompt" },
      { keys: [MOD, "L"], label: "Focus prompt" },
      { keys: [MOD, "K"], label: "Command palette" },
    ],
  },
  {
    title: "Navigation (Vim-style)",
    shortcuts: [
      { keys: ["J"], label: "Next turn" },
      { keys: ["K"], label: "Previous turn" },
      { keys: ["Shift", "G"], label: "Jump to last turn" },
    ],
  },
  {
    title: "Panels",
    shortcuts: [
      { keys: [MOD, "/"], label: "Toggle activity feed" },
      { keys: [MOD, "Shift", "C"], label: "Copy conversation" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: [MOD, "?"], label: "Keyboard shortcuts" },
    ],
  },
];

export const KeyboardShortcutsDialog = React.memo(function KeyboardShortcutsDialog() {
  const [open, setOpen] = useAtom(keyboardShortcutsOpenAtom);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  // Global keyboard shortcut: Cmd/Ctrl + ?
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Keyboard Shortcuts"
      className="max-w-lg border-vsc-border/40"
    >
      <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto scroll-shadow">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <Text size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
              {group.title}
            </Text>
            <div className="space-y-1.5">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-vsc-toolbar/30 transition-colors duration-fast"
                >
                  <Text size="xs" tone="secondary">
                    {shortcut.label}
                  </Text>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
});
