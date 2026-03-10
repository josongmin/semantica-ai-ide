import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { QuotaStatus } from "../../../shared/protocol";

const DEFAULT_QUOTA_STATUS: QuotaStatus = {
  alert_level: "normal",
};

export const [quotaStatusAtom, setQuotaStatusAtom, resetQuotaStatusAtom] =
  createStateAtomSet<QuotaStatus>(DEFAULT_QUOTA_STATUS);

registerResetAtom(resetQuotaStatusAtom);
