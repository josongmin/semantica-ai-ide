import { atom } from "jotai";

import { BUILT_IN_COMMANDS } from "./registry";
import type { SlashCommandDef } from "./types";

/** Whether the slash command palette is open */
export const slashCommandOpenAtom = atom(false);

/** Raw query text typed after "/" (e.g., user typed "/cl" -> query is "cl") */
export const slashCommandQueryAtom = atom("");

/** Currently selected index in the filtered result list */
export const slashCommandSelectedIndexAtom = atom(0);

/** Full command registry — extensible via plugins */
export const slashCommandRegistryAtom = atom<readonly SlashCommandDef[]>(BUILT_IN_COMMANDS);

/** Write atom to open the palette and reset state */
export const openSlashPaletteAtom = atom(null, (_get, set) => {
  set(slashCommandOpenAtom, true);
  set(slashCommandQueryAtom, "");
  set(slashCommandSelectedIndexAtom, 0);
});

/**
 * Write atom to close the palette.
 * Query and selection are NOT reset here — they stay intact during the
 * exit animation so the filtered list doesn't flash to unfiltered.
 * State is cleaned up when the palette next opens (openSlashPaletteAtom).
 */
export const closeSlashPaletteAtom = atom(null, (_get, set) => {
  set(slashCommandOpenAtom, false);
});
