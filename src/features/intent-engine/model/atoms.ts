/**
 * Intent Engine Atoms
 *
 * Jotai state management for the intent engine feature.
 * Supports intent input, analysis, plan generation, and execution.
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import { pushToastAtom } from "~shared/lib/atoms/toastAtoms";

import type { IntentAnalysis, IntentPlan, IntentPlanStep, IntentSession } from "./types";

// ─── Core Atoms ─────────────────────────────────────────

export const intentBarVisibleAtom = atom(false);
export const intentInputAtom = atom("");
export const activeIntentSessionAtom = atom<IntentSession | null>(null);
export const intentLoadingAtom = atom(false);
export const intentHistoryAtom = atom<readonly IntentSession[]>([]);

// ─── Derived Atoms ──────────────────────────────────────

/** Get analysis from active session. */
export const intentAnalysisAtom = atom<IntentAnalysis | null>((get) => {
  const session = get(activeIntentSessionAtom);
  return session?.analysis ?? null;
});

/** Get plan from active session. */
export const intentPlanAtom = atom<IntentPlan | null>((get) => {
  const session = get(activeIntentSessionAtom);
  return session?.plan ?? null;
});

// ─── Write Atoms ────────────────────────────────────────

/** Open the intent bar and clear input. */
export const openIntentBarAtom = atom(null, (_get, set) => {
  set(intentBarVisibleAtom, true);
  set(intentInputAtom, "");
});

/** Close the intent bar. */
export const closeIntentBarAtom = atom(null, (_get, set) => {
  set(intentBarVisibleAtom, false);
});

/** Submit an intent text string. Creates session, generates analysis and plan with delays. */
let analysisTimer: ReturnType<typeof setTimeout> | null = null;
let planTimer: ReturnType<typeof setTimeout> | null = null;

export const submitIntentAtom = atom(null, (_get, set, text: string) => {
  if (analysisTimer !== null) clearTimeout(analysisTimer);
  if (planTimer !== null) clearTimeout(planTimer);

  const intentId = `intent-${Date.now()}`;
  const sessionId = `session-${Date.now()}`;

  type IntentCategory = "feature" | "bugfix" | "refactor" | "investigate" | "security" | "test";
  const lower = text.toLowerCase();
  let category: IntentCategory = "feature";
  if (lower.includes("fix") || lower.includes("bug")) category = "bugfix";
  else if (lower.includes("refactor")) category = "refactor";
  else if (lower.includes("investigat") || lower.includes("performance") || lower.includes("slow")) category = "investigate";
  else if (lower.includes("security") || lower.includes("audit") || lower.includes("vulnerab")) category = "security";
  else if (lower.includes("test") || lower.includes("coverage")) category = "test";

  const intent = {
    id: intentId,
    text,
    category,
    detectedAt: Date.now(),
  } as const;

  const session: IntentSession = {
    id: sessionId,
    intent,
    analysis: null,
    plan: null,
    status: "analyzing",
    startedAt: Date.now(),
    completedAt: null,
  };

  set(activeIntentSessionAtom, session);
  set(intentLoadingAtom, true);
  set(intentInputAtom, "");

  // Generate analysis after 800ms
  analysisTimer = setTimeout(async () => {
    const { generateMockAnalysis } = await import("./mockData");
    const analysis = generateMockAnalysis(intent);

    set(activeIntentSessionAtom, (prev) =>
      prev ? { ...prev, analysis, status: "analyzing" } : null,
    );

    // Generate plan after 1500ms more
    planTimer = setTimeout(async () => {
      const { generateMockPlan } = await import("./mockData");
      const plan = generateMockPlan(intent);

      set(activeIntentSessionAtom, (prev) =>
        prev ? { ...prev, plan, status: "planned" } : null,
      );
      set(intentLoadingAtom, false);
      set(pushToastAtom, {
        id: `intent-plan-${Date.now()}`,
        variant: "success",
        message: `Intent plan ready — ${plan.steps.length} steps`,
      });
    }, 1500);
  }, 800);
});

/** Execute the plan — progressively mark steps as running then done. */
let executionTimers: ReturnType<typeof setTimeout>[] = [];

export const executePlanAtom = atom(null, (get, set) => {
  const session = get(activeIntentSessionAtom);
  if (!session?.plan) return;

  // Clear any previous execution timers
  for (const t of executionTimers) clearTimeout(t);
  executionTimers = [];

  set(activeIntentSessionAtom, (prev) =>
    prev ? { ...prev, status: "executing" } : null,
  );

  const {steps} = session.plan;
  let delay = 0;

  for (let i = 0; i < steps.length; i++) {
    const stepIndex = i;

    // Mark as running
    delay += 600 + Math.random() * 400;
    const runTimer = setTimeout(() => {
      set(activeIntentSessionAtom, (prev) => {
        if (!prev?.plan) return prev;
        const updatedSteps = prev.plan.steps.map((s, idx) =>
          idx === stepIndex ? { ...s, status: "running" as const } : s,
        ) as readonly IntentPlanStep[];
        return { ...prev, plan: { ...prev.plan, steps: updatedSteps } };
      });
    }, delay);
    executionTimers.push(runTimer);

    // Mark as done
    delay += 800 + Math.random() * 600;
    const doneTimer = setTimeout(() => {
      set(activeIntentSessionAtom, (prev) => {
        if (!prev?.plan) return prev;
        const updatedSteps = prev.plan.steps.map((s, idx) =>
          idx === stepIndex ? { ...s, status: "done" as const } : s,
        ) as readonly IntentPlanStep[];

        // Check if all steps are done
        const allDone = updatedSteps.every((s) => s.status === "done" || s.status === "skipped");
        if (allDone) {
          const completedSession: IntentSession = {
            ...prev,
            plan: { ...prev.plan, steps: updatedSteps },
            status: "completed",
            completedAt: Date.now(),
          };
          // Add to history
          set(intentHistoryAtom, (history) => [completedSession, ...history]);
          return completedSession;
        }

        return { ...prev, plan: { ...prev.plan, steps: updatedSteps } };
      });
    }, delay);
    executionTimers.push(doneTimer);
  }
});

/** Cancel the active intent session. */
export const cancelIntentAtom = atom(null, (_get, set) => {
  if (analysisTimer !== null) clearTimeout(analysisTimer);
  if (planTimer !== null) clearTimeout(planTimer);
  for (const t of executionTimers) clearTimeout(t);
  executionTimers = [];

  set(activeIntentSessionAtom, null);
  set(intentLoadingAtom, false);
});

// ─── Reset ──────────────────────────────────────────────

export const resetIntentEngineAtomsAtom = atom(null, (_get, set) => {
  if (analysisTimer !== null) clearTimeout(analysisTimer);
  if (planTimer !== null) clearTimeout(planTimer);
  for (const t of executionTimers) clearTimeout(t);
  executionTimers = [];

  set(intentBarVisibleAtom, false);
  set(intentInputAtom, "");
  set(activeIntentSessionAtom, null);
  set(intentLoadingAtom, false);
  set(intentHistoryAtom, []);
});

registerResetAtom(resetIntentEngineAtomsAtom);
