import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

export type AuditAction = "create" | "modify" | "delete" | "execute" | "approve" | "reject";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  target: string;
  summary: string;
  turnId?: string;
  risk?: "low" | "medium" | "high";
}

export const auditLogAtom = atom<AuditEntry[]>([]);

/** Reset all audit-log state */
export const resetAuditLogStoreAtom = atom(null, (_get, set) => {
  set(auditLogAtom, []);
});
registerResetAtom(resetAuditLogStoreAtom);
