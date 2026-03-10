import React, { memo, useEffect, useState } from "react";

import type { UserInputChoice } from "../../../shared/protocol";
import { Button } from "../../../shared/ui";
import { ChoiceChip } from "./ChoiceChip";

// ─── Single choice input (1-click submit) ────────────────────
export const SingleChoiceInput = memo(function SingleChoiceInput({
  choices,
  defaultValue,
  onSubmit,
  onSkip,
  required,
  onKeyActionRef,
}: {
  choices: readonly UserInputChoice[];
  defaultValue?: string;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  required: boolean;
  onKeyActionRef: React.MutableRefObject<((key: string) => boolean) | null>;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    onKeyActionRef.current = (key: string) => {
      const idx = parseInt(key, 10) - 1;
      const choice = choices[idx];
      if (idx >= 0 && idx < choices.length && choice !== undefined) {
        onSubmit(choice.id);
        return true;
      }
      return false;
    };
    return () => { onKeyActionRef.current = null; };
  }, [onSubmit, choices, onKeyActionRef]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {choices.map((c, i) => (
          <div key={c.id} onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}>
            <ChoiceChip
              choice={c}
              selected={hovered === c.id}
              recommended={c.id === defaultValue}
              onClick={() => onSubmit(c.id)}
              index={i}
              showCheck={false}
            />
          </div>
        ))}
      </div>
      {!required && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
            <kbd className="ml-1 text-2xs opacity-40 font-mono">Esc</kbd>
          </Button>
        </div>
      )}
    </div>
  );
});
