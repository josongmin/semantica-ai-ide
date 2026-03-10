import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BrowserConsoleEntry, BrowserState } from "../../../shared/protocol";

/** Maximum number of console entries to retain */
export const MAX_CONSOLE_ENTRIES = 200;

const defaultBrowserState: BrowserState = {
  url: "",
  loading: false,
};

/** Current browser state */
export const browserStateAtom = atom<BrowserState>(defaultBrowserState);

/** Buffered browser console entries (capped at MAX_CONSOLE_ENTRIES) */
export const browserConsoleEntriesAtom = atom<readonly BrowserConsoleEntry[]>([]);

/** Write-only: partial merge browser state */
export const updateBrowserStateAtom = atom(null, (get, set, partial: Partial<BrowserState>) => {
  set(browserStateAtom, { ...get(browserStateAtom), ...partial });
});

/** Write-only: append a console entry, trimming to MAX_CONSOLE_ENTRIES */
export const pushBrowserConsoleAtom = atom(null, (get, set, entry: BrowserConsoleEntry) => {
  const current = get(browserConsoleEntriesAtom);
  const next = [...current, entry];
  set(
    browserConsoleEntriesAtom,
    next.length > MAX_CONSOLE_ENTRIES ? next.slice(next.length - MAX_CONSOLE_ENTRIES) : next,
  );
});

/** Write-only: clear all console entries */
export const clearBrowserConsoleAtom = atom(null, (_get, set) => {
  set(browserConsoleEntriesAtom, []);
});

/** Write-only: reset all browser state */
export const resetBrowserStoreAtom = atom(null, (_get, set) => {
  set(browserStateAtom, defaultBrowserState);
  set(browserConsoleEntriesAtom, []);
});

registerResetAtom(resetBrowserStoreAtom);
