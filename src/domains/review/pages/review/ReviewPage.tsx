import React from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { ReviewFileSection } from "~widgets/review-panel";
import { useCodeReview } from "~features/code-review";
import { currentPageAtom } from "~shared/lib";
import { Badge, Button, EmptyState, ErrorBoundary, Text } from "~shared/ui";

import { reviewCommentIdsByFileAtom } from "../../../../entities/review-comment";

export const ReviewPage = React.memo(function ReviewPage() {
  const { reviewedFiles, reviewSummary: summary, requestReview } = useCodeReview();
  const commentIdsByFile = useAtomValue(reviewCommentIdsByFileAtom);
  const setCurrentPage = useSetAtom(currentPageAtom);

  function handleBack() {
    setCurrentPage("chat");
  }

  function handleRequestReview() {
    requestReview();
  }

  return (
    <ErrorBoundary fallback={<div className="p-4 text-vsc-error">Code review failed to load</div>}>
      <div className="flex flex-col h-full" role="region" aria-label="Code review">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border bg-vsc-surface-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={handleBack} aria-label="Back to chat">
            Back
          </Button>
          <Text size="sm" tone="primary" className="flex-1 font-medium">
            Code Review
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRequestReview}
            aria-label="Request code review"
          >
            Request Review
          </Button>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-vsc-border bg-vsc-surface-2 shrink-0">
          <Text size="xs" tone="tertiary">
            {summary.files} {summary.files === 1 ? "file" : "files"}
          </Text>
          <div className="flex items-center gap-1">
            <Badge text={summary.open} variant="default" />
            <Text size="xs" tone="tertiary">
              open
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <Badge text={summary.accepted} variant="success" />
            <Text size="xs" tone="tertiary">
              accepted
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <Badge text={summary.dismissed} variant="default" className="text-vsc-text-tertiary" />
            <Text size="xs" tone="tertiary">
              dismissed
            </Text>
          </div>
        </div>

        {/* File sections */}
        <div className="flex-1 overflow-y-auto">
          {reviewedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <EmptyState icon="code-review" title="No review comments yet" />
              <Button size="sm" variant="ghost" onClick={handleRequestReview}>
                Request Review
              </Button>
            </div>
          ) : (
            <div>
              {reviewedFiles.map((file) => (
                <ReviewFileSection
                  key={file}
                  filePath={file}
                  commentIds={commentIdsByFile[file] ?? []}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
});
