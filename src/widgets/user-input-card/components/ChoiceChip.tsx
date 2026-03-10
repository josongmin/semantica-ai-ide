import React from "react";

import type { UserInputChoice } from "../../../shared/protocol";
import { cn, Icon, Text } from "../../../shared/ui";

// ─── Choice chip ────────────────────────────────────────────
export const ChoiceChip = React.memo(function ChoiceChip({
  choice,
  selected,
  recommended,
  onClick,
  index,
  showCheck,
}: {
  choice: UserInputChoice;
  selected: boolean;
  recommended: boolean;
  onClick: () => void;
  index: number;
  showCheck: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/chip relative flex flex-col gap-1 px-2.5 py-1.5 rounded-md border text-left",
        "transition-colors duration-fast cursor-pointer focus-ring",
        selected
          ? "bg-vsc-accent/15 border-vsc-accent text-vsc-fg shadow-glow-accent"
          : "bg-vsc-surface-3 border-vsc-border/30 text-vsc-text-secondary hover:bg-vsc-list-hover hover:border-vsc-border",
        recommended && !selected && "ring-1 ring-vsc-accent/20",
      )}
    >
      {recommended && !selected && (
        <span className="absolute -top-1.5 right-1.5 px-1 py-px text-2xs leading-none font-medium rounded-sm bg-vsc-accent/20 text-vsc-accent">
          rec
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {showCheck && (
          <div
            className={cn(
              "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors duration-fast",
              selected
                ? "bg-vsc-accent border-vsc-accent"
                : "border-vsc-border/50 group-hover/chip:border-vsc-border",
            )}
          >
            {selected && <Icon name="check" tokenSize="2xs" className="text-vsc-bg" />}
          </div>
        )}
        {choice.icon && (
          <Icon
            name={choice.icon}
            tokenSize="2xs"
            className={selected ? "text-vsc-accent" : "text-vsc-text-ghost"}
          />
        )}
        <Text
          size="xs"
          weight={selected ? "medium" : "normal"}
          tone={selected ? "primary" : "secondary"}
        >
          {choice.label}
        </Text>
        <kbd className="ml-auto text-2xs opacity-30 font-mono shrink-0">{index + 1}</kbd>
      </div>
      {choice.description && (
        <Text size="2xs" tone="ghost" className={showCheck ? "pl-5" : "pl-0.5"}>
          {choice.description}
        </Text>
      )}
    </button>
  );
});
