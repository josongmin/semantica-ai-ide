import { useCallback } from "react";
import { useSetAtom } from "jotai";

import { getVscodeApi, promptPrefillAtom } from "../../../shared/lib";
import type { ReviewComment } from "../../../shared/protocol";

/**
 * Build a fix prompt from a review comment.
 * Produces a concise instruction suitable for the agent prompt box.
 */
export function buildFixPrompt(comment: ReviewComment): string {
  const location = `${comment.file_path}:${comment.line}`;
  const parts = [`Fix the issue at ${location}:`];
  parts.push(comment.message ?? comment.text);
  if (comment.suggested_fix) {
    parts.push(`Suggested fix: ${comment.suggested_fix}`);
  }
  return parts.join("\n");
}

/**
 * Hook for the "Fix in Editor" action.
 * Opens the file in the IDE at the correct line, and pre-fills the prompt box
 * with a fix instruction derived from the review comment.
 */
export function useFixInEditor(): {
  fixInEditor: (comment: ReviewComment) => void;
} {
  const setPromptPrefill = useSetAtom(promptPrefillAtom);

  const fixInEditor = useCallback(
    (comment: ReviewComment) => {
      // Open the file at the relevant line in the IDE
      getVscodeApi().postMessage({
        type: "OPEN_FILE_AT_LINE",
        file_path: comment.file_path,
        line: comment.line,
      });

      // Pre-fill the prompt box with a fix instruction
      const prompt = buildFixPrompt(comment);
      setPromptPrefill(prompt);
    },
    [setPromptPrefill],
  );

  return { fixInEditor };
}
