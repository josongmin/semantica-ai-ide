/**
 * Dialog registry — self-registration pattern for chat-page dialogs.
 *
 * Each widget calls `registerDialog()` at module scope.  ChatDialogs
 * iterates `getAllDialogs()` without knowing which dialogs exist (OCP).
 *
 * Consistent API:
 *   registerDialog(def)       — register a dialog definition
 *   getDialog(id)             — look up a single dialog by id
 *   getAllDialogs()            — all dialogs sorted by priority (desc)
 */
import type React from "react";

export interface DialogDef {
  id: string;
  render: () => React.ReactNode;
  /** Higher priority renders first. Default 0. */
  priority?: number;
}

const dialogs: DialogDef[] = [];
let sorted = true;

/** Register a dialog. Called at module scope by each widget entry.
 * Idempotent: re-registering the same id replaces the existing entry (HMR-safe). */
export function registerDialog(def: DialogDef): void {
  const idx = dialogs.findIndex((d) => d.id === def.id);
  if (idx >= 0) {
    dialogs[idx] = def;
  } else {
    dialogs.push(def);
  }
  sorted = false;
}

/** Get a single dialog by id. */
export function getDialog(id: string): DialogDef | undefined {
  return dialogs.find((d) => d.id === id);
}

/** Get all registered dialogs sorted by descending priority. */
export function getAllDialogs(): readonly DialogDef[] {
  if (!sorted) {
    dialogs.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    sorted = true;
  }
  return dialogs;
}

/**
 * @deprecated Use `getAllDialogs()` instead.
 */
export function getDialogs(): readonly DialogDef[] {
  return getAllDialogs();
}
