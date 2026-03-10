import { atom } from "jotai";

import type { MessageId } from "../../protocol";

// ─── Pending Quote ───────────────────────────────────────

export interface PendingQuote {
  readonly message_id: MessageId;
  readonly text: string;
}

/** Draft quote for the prompt box (null = no active quote) */
export const pendingQuoteAtom = atom<PendingQuote | null>(null);

/** Write-only: set pending quote */
export const setPendingQuoteAtom = atom(null, (_get, set, quote: PendingQuote | null) => {
  set(pendingQuoteAtom, quote);
});

/** Write-only: clear pending quote */
export const clearPendingQuoteAtom = atom(null, (_get, set) => {
  set(pendingQuoteAtom, null);
});
