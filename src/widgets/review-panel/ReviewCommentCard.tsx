import React from "react";
import { useAtomValue } from "jotai";

import { reviewCommentAtomFamily, type ReviewSeverity } from "../../entities/review-comment";
import { useCodeReview } from "../../features/code-review";
import { Badge, Button, Text } from "../../shared/ui";
import { FixButton } from "../fix-in-editor";

interface ReviewCommentCardProps {
  id: string;
}

const severityVariantMap: Record<ReviewSeverity, "info" | "warning" | "error" | "success"> = {
  info: "info",
  warning: "warning",
  error: "error",
  suggestion: "success",
};

export const ReviewCommentCard = React.memo(function ReviewCommentCard({
  id,
}: ReviewCommentCardProps) {
  const comment = useAtomValue(reviewCommentAtomFamily(id));
  const { acceptComment, dismissComment } = useCodeReview();

  if (!comment) return null;

  const isOpen = comment.status === "open";

  function handleAccept() {
    acceptComment(id);
  }

  function handleDismiss() {
    dismissComment(id);
  }

  return (
    <div
      className="flex flex-col gap-2 px-3 py-2 border-b border-vsc-border last:border-0
                 hover:bg-vsc-list-hover/30 transition-colors duration-fast"
      role="article"
      aria-label={comment.message}
    >
      <div className="flex items-center gap-2">
        <Badge
          text={comment.severity}
          variant={severityVariantMap[comment.severity]}
        />
        <Text size="xs" tone="tertiary">
          Lines {comment.line_start}–{comment.line_end}
        </Text>
      </div>

      <Text size="xs" tone="primary">
        {comment.message}
      </Text>

      {comment.suggestion && (
        <pre className="text-xs font-mono bg-vsc-surface-2 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap
                      border border-vsc-border/30 shadow-sm">
          {comment.suggestion}
        </pre>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAccept}
          disabled={!isOpen}
          aria-label="Accept comment"
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          disabled={!isOpen}
          aria-label="Dismiss comment"
        >
          Dismiss
        </Button>
        {isOpen && <FixButton comment={comment} />}
        {comment.status !== "open" && (
          <Text size="xs" tone="tertiary" className="capitalize">
            {comment.status}
          </Text>
        )}
      </div>
    </div>
  );
});
