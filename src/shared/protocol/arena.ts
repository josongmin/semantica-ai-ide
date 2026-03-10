/**
 * Arena Mode Types
 */

import type { ArenaResponseId } from "./brandedIds";

// ─── Arena ─────────────────────────────────────────────────
export type ArenaModelSlot = "A" | "B";
export type ArenaWinner = ArenaModelSlot | "tie" | null;
export type ArenaResponseStatus = "streaming" | "final" | "error";
export interface ArenaResponse {
  readonly id: ArenaResponseId;
  readonly slot: ArenaModelSlot;
  readonly model_id: string;
  readonly model_label: string;
  readonly text: string;
  readonly status: ArenaResponseStatus;
  readonly created_at_ms: number;
}
