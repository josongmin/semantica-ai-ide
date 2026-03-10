import { useCallback } from "react";
import { useAtomValue } from "jotai";

import {
  openCommentCountAtom,
  reviewedFilesAtom,
  reviewSummaryAtom,
} from "../../../entities/review-comment";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";

/**
 * Provides read-only code review state and actions to request a review,
 * accept or dismiss individual comments via the extension host.
 */
export function useCodeReview(): {
  reviewedFiles: readonly string[];
  openCommentCount: number;
  reviewSummary: { files: number; open: number; accepted: number; dismissed: number };
  requestReview: (filePath?: string) => void;
  acceptComment: (commentId: string) => void;
  dismissComment: (commentId: string) => void;
} {
  const reviewedFiles = useAtomValue(reviewedFilesAtom);
  const openCommentCount = useAtomValue(openCommentCountAtom);
  const reviewSummary = useAtomValue(reviewSummaryAtom);

  const requestReview = useCallback((filePath?: string) => {
    getVscodeApi().postMessage({ type: "REQUEST_CODE_REVIEW", file_path: filePath });
  }, []);

  const acceptComment = useCallback((commentId: string) => {
    getVscodeApi().postMessage({ type: "ACCEPT_REVIEW_COMMENT", comment_id: commentId });
  }, []);

  const dismissComment = useCallback((commentId: string) => {
    getVscodeApi().postMessage({ type: "DISMISS_REVIEW_COMMENT", comment_id: commentId });
  }, []);

  return {
    reviewedFiles,
    openCommentCount,
    reviewSummary,
    requestReview,
    acceptComment,
    dismissComment,
  };
}
