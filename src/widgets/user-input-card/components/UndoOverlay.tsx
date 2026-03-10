import { memo, useMemo } from "react";

import type { UserInputChoice } from "../../../shared/protocol";
import { Button, Icon, Text } from "../../../shared/ui";
import { UNDO_WINDOW_MS } from "../hooks";

// ─── Undo overlay (shown during grace period) ───────────────
export const UndoOverlay = memo(function UndoOverlay({
  answer,
  countdown,
  onUndo,
  choices,
  responseType,
}: {
  answer: string | string[];
  countdown: number;
  onUndo: () => void;
  choices?: readonly UserInputChoice[];
  responseType: string;
}) {
  const progress = (countdown / UNDO_WINDOW_MS) * 100;

  const displayAnswer = useMemo(() => {
    if (responseType === "confirmation") return answer === "yes" ? "Yes" : "No";
    if (Array.isArray(answer) && choices) {
      return answer.map((id) => choices.find((c) => c.id === id)?.label ?? id).join(", ");
    }
    if (typeof answer === "string" && choices) {
      return choices.find((c) => c.id === answer)?.label ?? answer;
    }
    return String(answer);
  }, [answer, choices, responseType]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-vsc-success/30 bg-vsc-success/5 animate-[fade-in_100ms_ease]">
      <Icon name="check" tokenSize="sm" className="text-vsc-success shrink-0" />
      <div className="flex-1 min-w-0">
        <Text size="xs" tone="primary" weight="medium" truncate>
          {displayAnswer}
        </Text>
        {/* Countdown bar */}
        <div className="mt-1 w-full h-0.5 rounded-full bg-vsc-border/20 overflow-hidden">
          <div
            className="h-full bg-vsc-success/60 rounded-full transition-[width] duration-fast linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onUndo} className="shrink-0">
        <Icon name="discard" tokenSize="xs" />
        Undo
        <kbd className="ml-0.5 text-2xs opacity-40 font-mono">Z</kbd>
      </Button>
    </div>
  );
});
