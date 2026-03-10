/**
 * Turn atoms — turn family, ordering, metrics, and phase updates.
 *
 * Turn-level read and write atoms that are independent of the message family.
 */
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import type {
  Turn,
  TurnId,
  TurnPhase,
  TurnPhaseEntry,
} from "~shared/protocol";

// ─── Turn Atoms ────────────────────────────────────────────

/** Ordered list of turn IDs (append order from UPSERT_TURN events) */
export const turnOrderAtom = atom<readonly TurnId[]>([]);

/** Set for O(1) membership checks when upserting */
export const turnIdSetAtom = atom<ReadonlySet<TurnId>>(new Set<TurnId>());

/** Per-turn atom family */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const turnAtomFamily = atomFamily(
  (_id: TurnId) => atom<Turn | null>(null),
  (a: TurnId, b: TurnId) => a === b,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- atomFamily lacks debugLabel in type, but supports it at runtime
(turnAtomFamily as any).debugLabel = "turnAtomFamily";

/** Currently active (latest) turn */
export const activeTurnIdAtom = atom<TurnId | null>(null);

// ─── Derived Turn Atoms ────────────────────────────────────

/** Accumulated tokens/cost from all turns with UPDATE_TURN_METRICS — for display when backend doesn't send SET_SESSION_META per turn */
export const sessionMetricsFromTurnsAtom = atom((get): { tokens_in: number; tokens_out: number; cost_usd: number } => {
  const ids = get(turnOrderAtom);
  let tokensIn = 0;
  let tokensOut = 0;
  let costUsd = 0;
  for (const id of ids) {
    const t = get(turnAtomFamily(id));
    if (t?.token_usage) {
      tokensIn += t.token_usage.input_tokens;
      tokensOut += t.token_usage.output_tokens;
    }
    if (t?.estimated_cost_usd != null) costUsd += t.estimated_cost_usd;
  }
  return { tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: costUsd };
});

/** Turn IDs sorted by created_at_ms — ensures User → Agent order regardless of event arrival */
export const turnOrderSortedAtom = atom((get): readonly TurnId[] => {
  const ids = get(turnOrderAtom);
  return [...ids].sort((a, b) => {
    const ta = get(turnAtomFamily(a));
    const tb = get(turnAtomFamily(b));
    const msA = ta?.created_at_ms ?? 0;
    const msB = tb?.created_at_ms ?? 0;
    return msA - msB;
  });
});

/** Derived atom: 1-based turn index for a given turnId (avoids full array subscription per TurnContainer) */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const turnIndexAtomFamily = atomFamily(
  (turnId: TurnId) =>
    atom((get) => {
      const sorted = get(turnOrderSortedAtom);
      return sorted.indexOf(turnId) + 1;
    }),
  (a: TurnId, b: TurnId) => a === b,
);

// ─── Turn Writers ──────────────────────────────────────────

/** Write-only: upsert a turn (merges phases with existing if present) */
export const upsertTurnAtom = atom(null, (get, set, turn: Turn) => {
  const existing = get(turnAtomFamily(turn.id));

  if (existing) {
    const mergedPhases = turn.phases.length > 0 ? turn.phases : existing.phases;
    set(turnAtomFamily(turn.id), { ...existing, ...turn, phases: mergedPhases });
  } else {
    set(turnAtomFamily(turn.id), turn);

    const idSet = get(turnIdSetAtom);
    const nextSet = new Set(idSet);
    nextSet.add(turn.id);
    set(turnIdSetAtom, nextSet);
    set(turnOrderAtom, [...get(turnOrderAtom), turn.id]);

    // Only set active turn on creation — updates to old turns shouldn't move the pointer
    set(activeTurnIdAtom, turn.id);
  }
});

/** Write-only: update a specific phase within a turn */
export const updateTurnPhaseAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      turn_id: TurnId;
      phase: TurnPhase;
      entry: Partial<TurnPhaseEntry>;
    },
  ) => {
    const turn = get(turnAtomFamily(payload.turn_id));
    if (!turn) return;

    const phaseIndex = turn.phases.findIndex((p) => p.phase === payload.phase);

    let updatedPhases: TurnPhaseEntry[];
    if (phaseIndex >= 0) {
      updatedPhases = turn.phases.map((p, i) =>
        i === phaseIndex ? { ...p, ...payload.entry } : p,
      );
    } else {
      const newPhase: TurnPhaseEntry = {
        phase: payload.phase,
        message_ids: [],
        tool_call_ids: [],
        summary: "",
        collapsed: payload.phase !== "user_message" && payload.phase !== "summary",
        status: "pending",
        ...payload.entry,
      };
      updatedPhases = [...turn.phases, newPhase];
    }

    set(turnAtomFamily(payload.turn_id), {
      ...turn,
      phases: updatedPhases,
    });
  },
);
