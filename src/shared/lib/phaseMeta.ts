/**
 * Turn-phase display metadata registry.
 *
 * Centralises the label + icon mapping so that adding a new TurnPhase
 * only requires touching the protocol type and this file — not every
 * widget that renders phase headers.
 */
import type { TurnPhase } from "../protocol";

export interface PhaseMeta {
  readonly label: string;
  readonly icon: string;
}

export const PHASE_META: Readonly<Record<TurnPhase, PhaseMeta>> = {
  user_message: { label: "Message", icon: "comment" },
  thinking: { label: "Thinking", icon: "lightbulb" },
  analysis: { label: "Analysis", icon: "inspect" },
  plan: { label: "Plan", icon: "tasklist" },
  changes: { label: "Changes", icon: "diff" },
  summary: { label: "Summary", icon: "note" },
};
