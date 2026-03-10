import { atom } from "jotai";

import type { ApprovalMode } from "../../protocol";

// ─── Approval-gate adapter ──────────────────────────────────
// Widgets read this atom; the features/approval-gate module writes it at
// bootstrap time.  This breaks the direct Widget → Feature import.

/** The contract that the approval-gate feature fulfils. */
export interface ApprovalGateAdapter {
  mode: ApprovalMode;
  changeMode: (newMode: ApprovalMode) => void;
  grantApproval: (actionId: string) => void;
  grantApprovalInSandbox: (actionId: string) => void;
  denyApproval: (actionId: string) => void;
  stopTool: (toolCallId: string) => void;
  retryTool: (toolCallId: string) => void;
}

/**
 * Populated by `features/approval-gate` at mount time via
 * `useHydrateApprovalAdapter`.  Widgets consume this instead of
 * importing `useApprovalGate` directly.
 */
export const approvalGateAdapterAtom = atom<ApprovalGateAdapter | null>(null);
