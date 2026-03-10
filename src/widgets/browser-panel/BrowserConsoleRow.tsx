import React from "react";

import type { BrowserConsoleEntry, BrowserConsoleLevel } from "../../entities/browser";
import { cn, Text } from "../../shared/ui";

interface BrowserConsoleRowProps {
  entry: BrowserConsoleEntry;
}

const levelBorderColor: Record<BrowserConsoleLevel, string> = {
  log: "border-vsc-fg/20",
  info: "border-vsc-info",
  warn: "border-vsc-warning",
  error: "border-vsc-error",
};

const levelTextColor: Record<BrowserConsoleLevel, string> = {
  log: "text-vsc-text-secondary",
  info: "text-vsc-info",
  warn: "text-vsc-warning",
  error: "text-vsc-error",
};

export const BrowserConsoleRow = React.memo(function BrowserConsoleRow({
  entry,
}: BrowserConsoleRowProps) {
  const borderColor = levelBorderColor[entry.level];
  const textColor = levelTextColor[entry.level];

  return (
    <div
      className={cn("flex items-start gap-2 px-2 py-0.5 border-l-2 hover:bg-vsc-list-hover transition-colors duration-fast", borderColor)}
      data-testid={`console-row-${entry.id}`}
      role="listitem"
    >
      <Text size="2xs" tone="ghost" mono className="shrink-0 mt-0.5">
        {new Date(entry.timestamp_ms).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </Text>
      <Text size="xs" mono className={cn("break-all", textColor)}>
        {entry.message}
      </Text>
    </div>
  );
});
