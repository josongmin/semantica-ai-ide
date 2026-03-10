import { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  awaitingApprovalToolCallsAtom,
  categoryIcons,
  pendingApprovalCountAtom,
} from "~entities/tool-call";

import { approvalGateAdapterAtom, dangerousApprovalToolCallIdAtom, pushToastAtom } from "../../../shared/lib";
import type { ToolCall } from "../../../shared/protocol";

let toastCounter = 0;

interface CategorySummaryEntry {
  readonly category: string;
  readonly count: number;
  readonly icon: string;
}

/**
 * Encapsulates batch approval logic (SRP).
 * Separates dangerous vs non-dangerous, provides approve/deny all,
 * and derives category summary for the banner UI.
 */
export function useBatchApproval() {
  const pendingCount = useAtomValue(pendingApprovalCountAtom);
  const awaiting = useAtomValue(awaitingApprovalToolCallsAtom);
  const setDangerousId = useSetAtom(dangerousApprovalToolCallIdAtom);
  const pushToast = useSetAtom(pushToastAtom);
  const approvalGate = useAtomValue(approvalGateAdapterAtom);
  const grantApproval = approvalGate?.grantApproval;
  const denyApproval = approvalGate?.denyApproval;

  const { nonDangerous, dangerous } = useMemo(() => {
    const nd: ToolCall[] = [];
    const d: ToolCall[] = [];
    for (const tc of awaiting) {
      if (tc.risk_level === "dangerous") d.push(tc);
      else nd.push(tc);
    }
    return { nonDangerous: nd, dangerous: d };
  }, [awaiting]);

  const categorySummary: readonly CategorySummaryEntry[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tc of awaiting) {
      counts.set(tc.category, (counts.get(tc.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([cat, count]) => ({
      category: cat,
      count,
      icon: (categoryIcons[cat as keyof typeof categoryIcons] as string | undefined) ?? "extensions",
    }));
  }, [awaiting]);

  const categorySummaryLabel = useMemo(() => {
    return categorySummary.map((c) => `${c.count} ${c.category}`).join(", ");
  }, [categorySummary]);

  const approveAll = useCallback(() => {
    for (const tc of nonDangerous) {
      if (tc.approval_action_id) {
        grantApproval?.(tc.approval_action_id);
      }
    }
    const firstDangerous = dangerous[0];
    if (dangerous.length > 0 && firstDangerous !== undefined) {
      setDangerousId(firstDangerous.id);
      if (nonDangerous.length > 0) {
        pushToast({
          id: `batch-approved-${++toastCounter}`,
          message: `Approved ${nonDangerous.length} safe operation(s). ${dangerous.length} dangerous require individual review.`,
          variant: "warning",
        });
      }
    } else if (nonDangerous.length > 0) {
      pushToast({
        id: `batch-approved-${++toastCounter}`,
        message: `Approved all ${nonDangerous.length} operation(s)`,
        variant: "success",
      });
    }
  }, [nonDangerous, dangerous, setDangerousId, pushToast, grantApproval]);

  const denyAll = useCallback(() => {
    for (const tc of awaiting) {
      if (tc.approval_action_id) {
        denyApproval?.(tc.approval_action_id);
      }
    }
    pushToast({
      id: `batch-denied-${++toastCounter}`,
      message: `Denied all ${awaiting.length} operation(s)`,
      variant: "info",
    });
  }, [awaiting, pushToast, denyApproval]);

  const approveButtonLabel =
    nonDangerous.length > 0 && dangerous.length > 0 ? "Approve Safe" : "Approve All";

  return {
    pendingCount,
    dangerousCount: dangerous.length,
    categorySummary,
    categorySummaryLabel,
    approveAll,
    denyAll,
    approveButtonLabel,
  };
}
