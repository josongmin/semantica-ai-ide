/**
 * Workflow Atoms — RFC-TERMINAL-018 §6
 *
 * Jotai atoms for workflow template management and execution state.
 */

import { atom } from "jotai";

import { BUILTIN_WORKFLOWS } from "../lib/workflowEngine";
import type {
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowStepState,
  WorkflowTemplate,
} from "./workflowTypes";

// ─── Template Registry ──────────────────────────────────────

/** All available workflow templates (built-in + user-defined) */
export const workflowTemplatesAtom = atom<readonly WorkflowTemplate[]>(BUILTIN_WORKFLOWS);

/** Currently active workflow execution (null if none running) */
export const activeWorkflowExecutionAtom = atom<WorkflowExecution | null>(null);

/** Execution history (last 20 runs) */
export const workflowHistoryAtom = atom<readonly WorkflowExecution[]>([]);

// ─── History Limit ──────────────────────────────────────────

const MAX_WORKFLOW_HISTORY = 20;

// ─── Write Atoms ────────────────────────────────────────────

/** Register a custom workflow template (add or replace by id) */
export const registerWorkflowAtom = atom(
  null,
  (get, set, template: WorkflowTemplate) => {
    const prev = get(workflowTemplatesAtom);
    const idx = prev.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = template;
      set(workflowTemplatesAtom, next);
    } else {
      set(workflowTemplatesAtom, [...prev, template]);
    }
  },
);

/** Remove a workflow template (built-ins are protected) */
export const removeWorkflowAtom = atom(
  null,
  (get, set, templateId: string) => {
    // Don't allow removing built-in workflows
    if (templateId.startsWith("builtin:")) return;
    const prev = get(workflowTemplatesAtom);
    set(workflowTemplatesAtom, prev.filter((t) => t.id !== templateId));
  },
);

/** Update a step's state during execution */
export const updateWorkflowStepAtom = atom(
  null,
  (get, set, update: Partial<WorkflowStepState> & { stepId: string }) => {
    const exec = get(activeWorkflowExecutionAtom);
    if (!exec) return;

    const stepStates = exec.stepStates.map((s) =>
      s.stepId === update.stepId ? { ...s, ...update } : s,
    );
    set(activeWorkflowExecutionAtom, { ...exec, stepStates });
  },
);

/** Advance to the next step in the workflow */
export const advanceWorkflowStepAtom = atom(null, (get, set) => {
  const exec = get(activeWorkflowExecutionAtom);
  if (!exec) return;

  const nextIndex = exec.currentStepIndex + 1;
  set(activeWorkflowExecutionAtom, { ...exec, currentStepIndex: nextIndex });
});

/** Complete, fail, or cancel the workflow */
export const completeWorkflowAtom = atom(
  null,
  (get, set, status: "completed" | "failed" | "cancelled") => {
    const exec = get(activeWorkflowExecutionAtom);
    if (!exec) return;

    const completed: WorkflowExecution = {
      ...exec,
      status: status as WorkflowExecutionStatus,
      completedAt: Date.now(),
    };

    // Move to history
    const history = get(workflowHistoryAtom);
    const next = [completed, ...history].slice(0, MAX_WORKFLOW_HISTORY);
    set(workflowHistoryAtom, next);

    // Clear active execution
    set(activeWorkflowExecutionAtom, null);
  },
);
