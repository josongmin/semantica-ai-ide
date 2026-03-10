import React, { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { progressItemFamily, progressKeysAtom, removeProgressAtom } from "../../shared/lib";
import { cn, ProgressBar, Text } from "../../shared/ui";

/** Delay (ms) before removing a completed progress entry */
const FADE_OUT_DELAY = 2000;

const ProgressEntry = React.memo(function ProgressEntry({ progressKey }: { progressKey: string }) {
  const item = useAtomValue(progressItemFamily(progressKey));
  const removeProgress = useSetAtom(removeProgressAtom);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const max = item?.max != null && item.max > 0 ? item.max : 100;
  const isComplete = item != null && item.value >= max;

  useEffect(() => {
    if (isComplete) {
       
      setFading(true);
      timerRef.current = setTimeout(() => {
        removeProgress(progressKey);
      }, FADE_OUT_DELAY);
    } else {
      // Reset fading if progress reverts from complete → incomplete

      setFading(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isComplete, progressKey, removeProgress]);

  if (!item) return null;
  const label = item.label ?? progressKey;

  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-opacity duration-slow",
        "animate-[fade-in_200ms_ease-out]",
        fading && "opacity-0",
      )}
      data-testid={`progress-${progressKey}`}
    >
      <Text size="2xs" tone="tertiary" truncate className="max-w-[100px]">
        {label}
      </Text>
      <ProgressBar value={item.value} max={max} className="w-20" />
      <Text size="2xs" tone="ghost">
        {Math.round((item.value / max) * 100)}%
      </Text>
    </div>
  );
});

export const ProgressIndicator = React.memo(function ProgressIndicator({
  className,
}: {
  className?: string;
}) {
  const keys = useAtomValue(progressKeysAtom);

  if (keys.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)} data-testid="progress-indicator">
      {keys.map((key) => (
        <ProgressEntry key={key} progressKey={key} />
      ))}
    </div>
  );
});
