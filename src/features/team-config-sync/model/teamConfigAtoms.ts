import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { TeamConfig } from "../../../shared/protocol";

/** Whether the team config sync dialog is open */
export const teamConfigDialogOpenAtom = atom(false);

/** Array of team config items showing local vs team differences */
export const teamConfigItemsAtom = atom<readonly TeamConfig[]>([]);

/** Write-only: set team config items from a serverEvent */
export const setTeamConfigAtom = atom(null, (_get, set, items: readonly TeamConfig[]) => {
  set(teamConfigItemsAtom, items);
});

/** Derived: count of items with differences */
export const teamConfigDiffCountAtom = atom((get) => {
  const items = get(teamConfigItemsAtom);
  return items.filter((item) => item.status !== "same").length;
});

/** Derived: items filtered to only show differences */
export const teamConfigDifferencesAtom = atom((get) => {
  const items = get(teamConfigItemsAtom);
  return items.filter((item) => item.status !== "same");
});

/** Write-only: reset the team config store */
export const resetTeamConfigStoreAtom = atom(null, (_get, set) => {
  set(teamConfigDialogOpenAtom, false);
  set(teamConfigItemsAtom, []);
});

registerResetAtom(resetTeamConfigStoreAtom);
