/**
 * Hydrate hook that populates the diff-review adapter atom.
 * Called once at bootstrap time from StreamingBootstrap.
 */
import { useEffect, useMemo } from "react";
import { useSetAtom } from "jotai";

import {
  type DiffReviewAdapter,
  diffReviewAdapterAtom,
} from "~shared/lib/atoms/diffReviewAdapterAtoms";

import { useDiffReview } from "./useDiffReview";

export function useHydrateDiffReviewAdapter(): void {
  const review = useDiffReview();
  const setAdapter = useSetAtom(diffReviewAdapterAtom);

  const adapter: DiffReviewAdapter = useMemo(
    () => ({
      approve: review.approve,
      reject: review.reject,
      approveAll: review.approveAll,
      rejectAll: review.rejectAll,
      openInEditor: review.openInEditor,
      setApprovalStatus: review.setApprovalStatus,
    }),
    [review.approve, review.reject, review.approveAll, review.rejectAll, review.openInEditor, review.setApprovalStatus],
  );

  useEffect(() => {
    setAdapter(adapter);
  }, [setAdapter, adapter]);
}
