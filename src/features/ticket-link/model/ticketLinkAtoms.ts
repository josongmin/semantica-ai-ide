/**
 * Ticket Link atoms (CS-09).
 *
 * Manages the linked ticket (Linear, Jira, GitHub) for the
 * current session, with search dialog state.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { LinkedTicket } from "../../../shared/protocol";

// ─── Ticket Data ─────────────────────────────────────────────

/** Currently linked ticket (null = no ticket linked) */
export const linkedTicketAtom = atom<LinkedTicket | null>(null);

/** Write-only: set or clear the linked ticket */
export const setLinkedTicketAtom = atom(null, (_get, set, ticket: LinkedTicket | null) => {
  set(linkedTicketAtom, ticket);
});

/** Whether the ticket search dialog is open */
export const ticketSearchDialogOpenAtom = atom(false);

/** Derived: whether a ticket is currently linked */
export const hasLinkedTicketAtom = atom((get) => get(linkedTicketAtom) !== null);

/** Write-only: reset ticket link store */
export const resetTicketLinkStoreAtom = atom(null, (_get, set) => {
  set(linkedTicketAtom, null);
  set(ticketSearchDialogOpenAtom, false);
});

registerResetAtom(resetTicketLinkStoreAtom);
