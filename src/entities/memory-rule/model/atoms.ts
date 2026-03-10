import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { MemoryRule, MemoryRuleId } from "../../../shared/protocol";

/** All memory rules keyed by ID */
export const memoryRulesMapAtom = atom<ReadonlyMap<MemoryRuleId, MemoryRule>>(new Map());

/** Ordered list of all memory rules (derived) */
export const memoryRulesAtom = atom((get) => [...get(memoryRulesMapAtom).values()]);

/** Write-only: upsert a memory rule */
export const upsertMemoryRuleAtom = atom(null, (get, set, rule: MemoryRule) => {
  const map = new Map(get(memoryRulesMapAtom));
  map.set(rule.id, rule);
  set(memoryRulesMapAtom, map);
});

/** Write-only: remove a memory rule by ID */
export const removeMemoryRuleAtom = atom(null, (get, set, id: MemoryRuleId) => {
  const map = new Map(get(memoryRulesMapAtom));
  map.delete(id);
  set(memoryRulesMapAtom, map);
});

/** Write-only: toggle pin on a memory rule */
export const pinMemoryRuleAtom = atom(
  null,
  (get, set, payload: { readonly id: MemoryRuleId; readonly pinned: boolean }) => {
    const map = new Map(get(memoryRulesMapAtom));
    const existing = map.get(payload.id);
    if (existing) {
      map.set(payload.id, { ...existing, pinned: payload.pinned });
      set(memoryRulesMapAtom, map);
    }
  },
);

/** Derived: only memory rules with pinned === true */
export const pinnedMemoryRulesAtom = atom((get) =>
  get(memoryRulesAtom).filter((rule) => rule.pinned === true),
);

/** Write-only: reset memory rule store */
export const resetMemoryRuleStoreAtom = atom(null, (_get, set) => {
  set(memoryRulesMapAtom, new Map());
});

// ─── Compatibility / Derived atoms ─────────────────────────

/** Per-rule atom family — derived from the Map store */
export const memoryRuleAtomFamily = createBoundedAtomFamily(
  (id: string) => atom((get) => get(memoryRulesMapAtom).get(id as MemoryRuleId) ?? null),
  { maxSize: 1000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(memoryRuleAtomFamily, "memoryRuleAtomFamily");

/** Ordered rule IDs */
export const memoryRuleIdsAtom = atom(
  (get) => [...get(memoryRulesMapAtom).keys()] as readonly string[],
);

/** Count of total rules */
export const rulesCountAtom = atom((get) => {
  const rules = get(memoryRulesAtom);
  return { total: rules.length };
});

/** Write-only: reorder memory rule IDs */
export const reorderMemoryRulesAtom = atom(null, (get, set, orderedIds: readonly string[]) => {
  const currentMap = get(memoryRulesMapAtom);
  const newMap = new Map<MemoryRuleId, MemoryRule>();
  for (const id of orderedIds) {
    const rule = currentMap.get(id as MemoryRuleId);
    if (rule) newMap.set(rule.id, rule);
  }
  set(memoryRulesMapAtom, newMap);
});

// ─── Active Rules ────────────────────────────────────────

/** Derived: IDs of active rules */
export const activeRuleIdsAtom = atom((get) => {
  const rules = get(memoryRulesAtom);
  return new Set(rules.filter((r) => r.active !== false).map((r) => r.id as string));
});

/** Write-only: set which rules are active by ID */
export const setActiveRulesAtom = atom(null, (get, set, ids: readonly string[]) => {
  const activeSet = new Set(ids);
  const map = new Map(get(memoryRulesMapAtom));
  for (const [id, rule] of map) {
    map.set(id, { ...rule, active: activeSet.has(id as string) });
  }
  set(memoryRulesMapAtom, map);
});

// ─── Legacy aliases (used by dispatchServerEvent / older consumers) ──

/** Alias for removeMemoryRuleAtom (legacy serverEvent uses DELETE_MEMORY_RULE) */
export const deleteMemoryRuleAtom = removeMemoryRuleAtom;

/** Alias for resetMemoryRuleStoreAtom */
export const resetMemoryStoreAtom = resetMemoryRuleStoreAtom;

registerResetAtom(resetMemoryRuleStoreAtom);
