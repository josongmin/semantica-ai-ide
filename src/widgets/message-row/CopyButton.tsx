import React, { useCallback, useEffect, useRef, useState } from "react";

import { writeToClipboard } from "../../shared/lib";
import { COPY_FEEDBACK_MS, Icon } from "../../shared/ui";

interface CopyButtonProps {
  text: string;
}

/**
 * Copy-to-clipboard button with transient "Copied!" / "Failed" feedback.
 * Self-contained: manages its own timer and abort controller.
 */
export const CopyButton = React.memo(function CopyButton({ text }: CopyButtonProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    if (!text) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    clearTimeout(copyTimerRef.current);
    writeToClipboard(text).then(
      () => {
        if (signal.aborted) return;
        setCopyState("copied");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
      },
      () => {
        if (signal.aborted) return;
        setCopyState("failed");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
      },
    );
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy message"
      className="text-vsc-text-tertiary hover:text-vsc-text-primary p-0.5 rounded hover:bg-vsc-toolbar cursor-pointer transition-opacity duration-fast focus-ring"
      title={(() => { if (copyState === "copied") return "Copied!"; if (copyState === "failed") return "Copy failed"; return "Copy"; })()}
    >
      <Icon
        name={(() => { if (copyState === "copied") return "check"; if (copyState === "failed") return "error"; return "copy"; })()}
        tokenSize="xs"
        className={copyState === "failed" ? "text-vsc-error" : undefined}
      />
    </button>
  );
});
