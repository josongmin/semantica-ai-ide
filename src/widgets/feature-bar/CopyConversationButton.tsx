import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useCopyConversation } from "../../features/copy-conversation";
import { COPY_CONVERSATION_EVENT } from "../../shared/lib/atoms";
import { Button, cn, COPY_FEEDBACK_MS, Tooltip } from "../../shared/ui";

/** Copy-conversation button with keyboard shortcut support and feedback states. */
export const CopyConversationButton = React.memo(function CopyConversationButton() {
  const { copyAsMarkdown } = useCopyConversation();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = useCallback(() => {
    copyAsMarkdown().then(
      () => {
        setCopyState("copied");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
      },
      () => {
        setCopyState("failed");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
      },
    );
  }, [copyAsMarkdown]);

  const handleCopyRef = useRef(handleCopy);
  useLayoutEffect(() => { handleCopyRef.current = handleCopy; });

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  useEffect(() => {
    const onCopy = () => handleCopyRef.current();
    document.addEventListener(COPY_CONVERSATION_EVENT, onCopy);
    return () => document.removeEventListener(COPY_CONVERSATION_EVENT, onCopy);
  }, []);

  return (
    <Tooltip
      content={(() => { if (copyState === "copied") return "Copied!"; if (copyState === "failed") return "Copy failed"; return "Copy conversation (\u21E7\u2318C)"; })()}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label="Copy conversation"
        icon={(() => { if (copyState === "copied") return "check"; if (copyState === "failed") return "error"; return "copy"; })()}
        className={cn(
          "rounded-sm shrink-0",
          copyState === "copied" && "[&_svg]:text-vsc-success",
          copyState === "failed" && "[&_svg]:text-vsc-error",
          copyState === "idle" && "[&_svg]:text-vsc-text-tertiary",
        )}
      />
    </Tooltip>
  );
});
