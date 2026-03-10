import React, { useCallback, useEffect, useRef } from "react";

import { writeToClipboard } from "../../lib/clipboard";
import { getVscodeApi } from "../../lib/vscodeApi";
import { COPY_FEEDBACK_MS } from "../tokens";
import { cn } from "../variants";
import { Icon } from "./Icon";

export interface CodeBlockActionsProps {
  code: string;
  language?: string;
  filePath?: string;
}

export const CodeBlockActions = React.memo(function CodeBlockActions({
  code,
  language,
  filePath,
}: CodeBlockActionsProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    clearTimeout(timerRef.current);
    writeToClipboard(code).then(
      () => {
        if (signal.aborted) return;
        setCopied(true);
        timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      },
      () => {
        // Clipboard API unavailable or denied — fail silently
      },
    );
  }, [code]);

  const handleApply = useCallback(() => {
    getVscodeApi().postMessage({
      type: "APPLY_CODE_BLOCK",
      code,
      language,
      file_path: filePath,
    });
  }, [code, language, filePath]);

  const handleInsert = useCallback(() => {
    getVscodeApi().postMessage({
      type: "INSERT_CODE_BLOCK",
      code,
    });
  }, [code]);

  return (
    <div
      className="absolute top-0 right-2 h-[--height-row-sm] flex items-center gap-1 opacity-0 group-hover/code:opacity-100 focus-within:opacity-100
                 hover:opacity-100 transition-opacity duration-fast"
    >
      <button
        type="button"
        onClick={handleInsert}
        aria-label="Insert at cursor"
        className="flex items-center justify-center size-6 shrink-0 rounded-sm bg-vsc-toolbar hover:bg-vsc-surface-3 cursor-pointer focus-ring transition-colors duration-fast"
        title="Insert at cursor"
      >
        <Icon name="diff-added" tokenSize="xs" className="leading-none block" />
      </button>
      <button
        type="button"
        onClick={handleApply}
        aria-label="Apply to file"
        className="flex items-center justify-center size-6 shrink-0 rounded-sm bg-vsc-toolbar hover:bg-vsc-surface-3 cursor-pointer focus-ring transition-colors duration-fast"
        title="Apply to file"
      >
        <Icon name="go-to-file" tokenSize="xs" className="leading-none block" />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="flex items-center justify-center size-6 shrink-0 rounded-sm bg-vsc-toolbar hover:bg-vsc-surface-3 cursor-pointer focus-ring transition-colors duration-fast"
        title={copied ? "Copied!" : "Copy"}
      >
        <Icon
          name={copied ? "check" : "copy"}
          tokenSize="xs"
          className={cn(
            "leading-none block",
            copied && "animate-[icon-pop_300ms_var(--ease-spring)]",
          )}
        />
      </button>
    </div>
  );
});
