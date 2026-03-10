import React, { useCallback, useState } from "react";

import { useFixInEditor } from "../../features/fix-in-editor";
import type { ReviewComment } from "../../shared/protocol";
import { Button, Spinner } from "../../shared/ui";

const FEEDBACK_DELAY_MS = 300;

interface FixButtonProps {
  readonly comment: ReviewComment;
}

/**
 * Small "Fix" button displayed next to a review comment.
 * On click: opens the file in the editor at the relevant line
 * and pre-fills the prompt box with a fix instruction.
 */
export const FixButton = React.memo(function FixButton({ comment }: FixButtonProps) {
  const { fixInEditor } = useFixInEditor();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    fixInEditor(comment);
    // Brief loading state for user feedback
    setTimeout(() => setLoading(false), FEEDBACK_DELAY_MS);
  }, [fixInEditor, comment]);

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={loading ? undefined : "wrench"}
      onClick={handleClick}
      disabled={loading}
      aria-label={`Fix issue at ${comment.file_path}:${comment.line}`}
      data-testid="fix-in-editor-button"
    >
      {loading ? <Spinner size="sm" /> : "Fix"}
    </Button>
  );
});
