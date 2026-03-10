import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { SecurityScan } from "../../../shared/protocol";

export const [securityScanAtom, setSecurityScanAtom, resetSecurityScanAtom] =
  createStateAtomSet<SecurityScan | null>(null);

registerResetAtom(resetSecurityScanAtom);
