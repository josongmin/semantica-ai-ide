import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import { Button, cn } from "../../../shared/ui";

/** Small delay (ms) so the DOM layout settles before focusing the input. */
const FOCUS_LAYOUT_TICK_MS = 50;

// ─── Text input ─────────────────────────────────────────────
export const TextInputField = memo(function TextInputField({
  placeholder,
  defaultValue,
  onSubmit,
  onSkip,
  required,
}: {
  placeholder?: string;
  defaultValue?: string;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  required: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), FOCUS_LAYOUT_TICK_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && value.trim()) {
        e.preventDefault();
        onSubmit(value.trim());
      }
      if (e.key === "Escape" && !required) {
        e.preventDefault();
        onSkip();
      }
    },
    [onSubmit, onSkip, value, required],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Type your answer..."}
          className={cn(
            "w-full px-2.5 py-1.5 pr-8 text-sm rounded-md border",
            "bg-vsc-surface-3 text-vsc-fg border-vsc-border/40",
            "focus:outline-none focus:border-vsc-accent focus-ring",
            "placeholder:text-vsc-text-ghost",
          )}
        />
        {value.trim() && (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-vsc-text-ghost font-mono">
            &crarr;
          </kbd>
        )}
      </div>
      <div className="flex gap-1.5 justify-end">
        {!required && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
            <kbd className="ml-1 text-2xs opacity-40 font-mono">Esc</kbd>
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={required && !value.trim()}
          onClick={() => onSubmit(value.trim())}
        >
          Send
        </Button>
      </div>
    </div>
  );
});
