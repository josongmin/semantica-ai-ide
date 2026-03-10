import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type {
  RiskLevel,
  ToolCall,
  ToolCallGroup,
  ToolCallOutput,
  ToolCallStatus,
  ToolCategory,
} from "~shared/protocol";

/** Per-tool-call atom family.
 *  Bounded to 2000 entries to prevent unbounded memory growth between resets. */
export const toolCallAtomFamily = createBoundedAtomFamily(
  (_id: string) => atom<ToolCall | null>(null),
  { maxSize: 2000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(toolCallAtomFamily, "toolCallAtomFamily");

/** Tool call IDs indexed by turn_id → Set for O(1) membership */
const toolCallIdSetByTurnAtom = atom<Readonly<Record<string, ReadonlySet<string>>>>({});

/** Ordered tool call IDs by turn_id (preserves insertion order for rendering) */
export const toolCallIdsByTurnAtom = atom<Readonly<Record<string, readonly string[]>>>({});

/** Write-only: upsert a tool call */
export const upsertToolCallAtom = atom(null, (get, set, tc: ToolCall) => {
  set(toolCallAtomFamily(tc.id), tc);

  const setByTurn = get(toolCallIdSetByTurnAtom);
  const turnSet = setByTurn[tc.turn_id] ?? new Set<string>();
  if (!turnSet.has(tc.id)) {
    const nextSet = new Set(turnSet);
    nextSet.add(tc.id);
    set(toolCallIdSetByTurnAtom, { ...setByTurn, [tc.turn_id]: nextSet });

    const byTurn = get(toolCallIdsByTurnAtom);
    const turnIds = byTurn[tc.turn_id] ?? [];
    set(toolCallIdsByTurnAtom, { ...byTurn, [tc.turn_id]: [...turnIds, tc.id] });
  }
});

/** Write-only: reset all tool call state (call on session change) */
export const resetToolCallStoreAtom = atom(null, (get, set) => {
  const byTurn = get(toolCallIdSetByTurnAtom);
  for (const [turnId, ids] of Object.entries(byTurn)) {
    for (const id of ids) {
      toolCallAtomFamily.remove(id);
    }
    toolCallGroupsByTurnAtom.remove(turnId);
  }
  set(toolCallIdSetByTurnAtom, {});
  set(toolCallIdsByTurnAtom, {});
});

/** Write-only: update tool call status */
export const updateToolCallStatusAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      id: string;
      status: ToolCallStatus;
      result_summary?: string;
      duration_ms?: number;
      diff_text?: string;
    },
  ) => {
    const tc = get(toolCallAtomFamily(payload.id));
    if (!tc) return;
    set(toolCallAtomFamily(payload.id), {
      ...tc,
      status: payload.status,
      result_summary: payload.result_summary ?? tc.result_summary,
      duration_ms: payload.duration_ms ?? tc.duration_ms,
      diff_text: payload.diff_text ?? tc.diff_text,
    });
  },
);

/** Read-only: get tool calls for a specific turn, grouped by category */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- atomFamily migration to jotai-family tracked separately
export const toolCallGroupsByTurnAtom = atomFamily(
  (turnId: string) =>
    atom<readonly ToolCallGroup[]>((get) => {
      const ids = get(toolCallIdsByTurnAtom)[turnId] ?? [];
      const calls = ids
        .map((id) => get(toolCallAtomFamily(id)))
        .filter((tc): tc is ToolCall => tc !== null);

      const grouped = new Map<ToolCategory, ToolCall[]>();
      for (const call of calls) {
        const group = grouped.get(call.category) ?? [];
        group.push(call);
        grouped.set(call.category, group);
      }

      return Array.from(grouped.entries()).map(([category, groupCalls]) => ({
        category,
        calls: groupCalls,
        count: groupCalls.length,
      }));
    }),
  (a: string, b: string) => a === b,
);
setDebugLabel(toolCallGroupsByTurnAtom, "toolCallGroupsByTurnAtom");

// ─── Approval & Output Atoms ─────────────────────────────

/** Write-only: set tool call to awaiting_approval with action_id and risk_level */
export const requestToolApprovalAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      tool_call_id: string;
      action_id: string;
      risk_level: RiskLevel;
      description: string;
      supports_sandbox?: boolean;
    },
  ) => {
    const tc = get(toolCallAtomFamily(payload.tool_call_id));
    if (!tc) return;
    set(toolCallAtomFamily(payload.tool_call_id), {
      ...tc,
      status: "awaiting_approval" as const,
      approval_action_id: payload.action_id,
      risk_level: payload.risk_level,
      args_summary: payload.description || tc.args_summary,
      ...(payload.supports_sandbox !== undefined && { supports_sandbox: payload.supports_sandbox }),
    });
  },
);

/** Write-only: set tool call output */
export const setToolOutputAtom = atom(
  null,
  (get, set, payload: { id: string; output: ToolCallOutput }) => {
    const tc = get(toolCallAtomFamily(payload.id));
    if (!tc) return;
    set(toolCallAtomFamily(payload.id), {
      ...tc,
      output: payload.output,
    });
  },
);

/** Derived: count of tool calls in awaiting_approval status */
export const pendingApprovalCountAtom = atom((get) => {
  const byTurn = get(toolCallIdsByTurnAtom);
  let count = 0;
  for (const ids of Object.values(byTurn)) {
    for (const id of ids) {
      const tc = get(toolCallAtomFamily(id));
      if (tc?.status === "awaiting_approval") count++;
    }
  }
  return count;
});

/** Derived: all tool calls currently awaiting approval */
export const awaitingApprovalToolCallsAtom = atom((get) => {
  const byTurn = get(toolCallIdsByTurnAtom);
  const result: ToolCall[] = [];
  for (const ids of Object.values(byTurn)) {
    for (const id of ids) {
      const tc = get(toolCallAtomFamily(id));
      if (tc?.status === "awaiting_approval") result.push(tc);
    }
  }
  return result;
});

registerResetAtom(resetToolCallStoreAtom);
