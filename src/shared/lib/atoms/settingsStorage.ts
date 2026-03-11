import { atom } from "jotai";

// ─── Settings Storage ───────────────────────────────────
//
// Unified persistence layer for all user-facing settings.
// Uses localStorage as primary store (survives app restarts).
// Falls back gracefully when localStorage is unavailable.

const STORAGE_KEY = "semantica:user-settings";

/** All persisted user settings. Add new fields with defaults here. */
export interface UserSettings {
  themeId: string;
  chatFont: string;
  voiceStyle: string;
}

const DEFAULTS: UserSettings = {
  themeId: "github-light",
  chatFont: "system",
  voiceStyle: "buttery",
};

// ─── Low-level read/write ────────────────────────────────

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

// ─── Jotai atoms ─────────────────────────────────────────

/** Internal source-of-truth atom, initialized from localStorage. */
const settingsStoreAtom = atom<UserSettings>(loadSettings());

/**
 * Read a single setting value.
 * Usage: `useAtomValue(settingAtom("themeId"))`
 */
export function settingAtom<K extends keyof UserSettings>(key: K) {
  return atom((get) => get(settingsStoreAtom)[key]);
}

/**
 * Write-only atom to update one or more settings.
 * Merges into store and persists to localStorage immediately.
 *
 * Usage: `const update = useSetAtom(updateSettingsAtom);`
 *        `update({ themeId: "monokai" });`
 */
export const updateSettingsAtom = atom(null, (get, set, patch: Partial<UserSettings>) => {
  const next = { ...get(settingsStoreAtom), ...patch };
  set(settingsStoreAtom, next);
  saveSettings(next);
});

/**
 * Read the full settings object.
 */
export const userSettingsAtom = atom((get) => get(settingsStoreAtom));

/**
 * Reset all settings to defaults and clear storage.
 */
export const resetSettingsAtom = atom(null, (_get, set) => {
  set(settingsStoreAtom, { ...DEFAULTS });
  saveSettings({ ...DEFAULTS });
});
