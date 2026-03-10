import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

import type { UserInputChoice } from "../../../shared/protocol";
import { Button, Text } from "../../../shared/ui";
import { ChoiceChip } from "./ChoiceChip";

// ─── Multi choice input ─────────────────────────────────────
export const MultiChoiceInput = memo(function MultiChoiceInput({
  choices,
  defaultValue,
  onSubmit,
  onSkip,
  required,
  onKeyActionRef,
}: {
  choices: readonly UserInputChoice[];
  defaultValue?: string;
  onSubmit: (answer: string[]) => void;
  onSkip: () => void;
  required: boolean;
  onKeyActionRef: React.MutableRefObject<((key: string) => boolean) | null>;
}) {
  const defaultIds = useMemo(
    () => (defaultValue ? new Set(defaultValue.split(",").map((s) => s.trim())) : new Set<string>()),
    [defaultValue],
  );
  // Pre-select recommended items
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultIds));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    onKeyActionRef.current = (key: string) => {
      const idx = parseInt(key, 10) - 1;
      const choice = choices[idx];
      if (idx >= 0 && idx < choices.length && choice !== undefined) {
        toggle(choice.id);
        return true;
      }
      if (key === "Enter" && selected.size > 0) {
        onSubmit([...selected]);
        return true;
      }
      return false;
    };
    return () => { onKeyActionRef.current = null; };
  }, [onSubmit, choices, toggle, selected, onKeyActionRef]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {choices.map((c, i) => (
          <ChoiceChip
            key={c.id}
            choice={c}
            selected={selected.has(c.id)}
            recommended={defaultIds.has(c.id)}
            onClick={() => toggle(c.id)}
            index={i}
            showCheck
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 justify-end">
        {selected.size > 0 && (
          <Text size="2xs" tone="info" weight="medium">
            {selected.size} selected
          </Text>
        )}
        {!required && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
            <kbd className="ml-1 text-2xs opacity-40 font-mono">Esc</kbd>
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={required && selected.size === 0}
          onClick={() => onSubmit([...selected])}
        >
          Confirm
          <kbd className="ml-1 text-2xs opacity-50 font-mono">&crarr;</kbd>
        </Button>
      </div>
    </div>
  );
});
