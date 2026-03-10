/* eslint-disable @typescript-eslint/no-deprecated -- backward-compat wrappers reference deprecated atoms within this module */
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { upsertMemoryRuleAtom } from "../../../entities/memory-rule";
import { type AutoMemorySuggestion, createMemoryRuleId, type TurnId } from "../../../shared/protocol";

// ── Per-turn atomFamily ──────────────────────────────────

/** Per-turn auto-memory suggestions (atomFamily keyed by TurnId) */
export const autoMemorySuggestionsFamily = atomFamily((_turnId: TurnId) =>
  atom<readonly AutoMemorySuggestion[]>([]),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- atomFamily lacks debugLabel in type, but supports it at runtime
(autoMemorySuggestionsFamily as any).debugLabel = "autoMemorySuggestionsFamily";

/** Write-only: add a suggestion for a specific turn */
export const addAutoMemorySuggestionForTurnAtom = atom(
  null,
  (get, set, suggestion: AutoMemorySuggestion) => {
    const turnId = suggestion.source_turn_id as TurnId | undefined;
    if (!turnId) {
      // Fallback: write to global atom
      const existing = get(autoMemorySuggestionsAtom);
      if (existing.some((s) => s.id === suggestion.id)) return;
      set(autoMemorySuggestionsAtom, [...existing, suggestion]);
      return;
    }
    const existing = get(autoMemorySuggestionsFamily(turnId));
    if (existing.some((s) => s.id === suggestion.id)) return;
    set(autoMemorySuggestionsFamily(turnId), [...existing, suggestion]);
  },
);

/** Write-only: dismiss a suggestion by id from its turn */
export const dismissAutoMemoryForTurnAtom = atom(
  null,
  (get, set, payload: { id: string; turn_id: TurnId }) => {
    const current = get(autoMemorySuggestionsFamily(payload.turn_id));
    set(
      autoMemorySuggestionsFamily(payload.turn_id),
      current.filter((s) => s.id !== payload.id),
    );
  },
);

/** Write-only: accept a suggestion — converts to MemoryRule and removes from turn */
export const acceptAutoMemoryForTurnAtom = atom(
  null,
  (get, set, payload: { id: string; turn_id: TurnId }) => {
    const suggestions = get(autoMemorySuggestionsFamily(payload.turn_id));
    const suggestion = suggestions.find((s) => s.id === payload.id);
    if (!suggestion) return;

    set(upsertMemoryRuleAtom, {
      id: createMemoryRuleId(`mem_${suggestion.id}`),
      title: suggestion.title,
      content: suggestion.content,
    });

    set(
      autoMemorySuggestionsFamily(payload.turn_id),
      suggestions.filter((s) => s.id !== payload.id),
    );
  },
);

/** Reset atom: clear all per-turn auto-memory state */
export const resetAutoMemoryFamilyAtom = atom(null, (_get, _set) => {
  // atomFamily entries are GC'd automatically
});

// ── Backward compat: global atoms ────────────────────────

/** @deprecated Use autoMemorySuggestionsFamily(turnId) */
export const autoMemorySuggestionsAtom = atom<readonly AutoMemorySuggestion[]>([]);

/** @deprecated Use addAutoMemorySuggestionForTurnAtom */
export const addAutoMemorySuggestionAtom = atom(
  null,
  (get, set, suggestion: AutoMemorySuggestion) => {
    const existing = get(autoMemorySuggestionsAtom);
    if (existing.some((s) => s.id === suggestion.id)) return;
    set(autoMemorySuggestionsAtom, [...existing, suggestion]);
  },
);

/** @deprecated Use dismissAutoMemoryForTurnAtom */
export const dismissAutoMemoryAtom = atom(null, (get, set, id: string) => {
  set(
    autoMemorySuggestionsAtom,
    get(autoMemorySuggestionsAtom).filter((s) => s.id !== id),
  );
});

/** @deprecated Use acceptAutoMemoryForTurnAtom */
export const acceptAutoMemoryAtom = atom(null, (get, set, id: string) => {
  const suggestions = get(autoMemorySuggestionsAtom);
  const suggestion = suggestions.find((s) => s.id === id);
  if (!suggestion) return;

  set(upsertMemoryRuleAtom, {
    id: createMemoryRuleId(`mem_${suggestion.id}`),
    title: suggestion.title,
    content: suggestion.content,
  });

  set(
    autoMemorySuggestionsAtom,
    suggestions.filter((s) => s.id !== id),
  );
});

/** Write-only: reset all suggestions */
export const resetAutoMemoryStoreAtom = atom(null, (_get, set) => {
  set(autoMemorySuggestionsAtom, []);
});
