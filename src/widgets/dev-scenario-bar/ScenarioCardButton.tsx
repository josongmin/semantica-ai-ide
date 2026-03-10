import React from "react";

import { cn, Text } from "../../shared/ui";
import type { Scenario } from "./scenarioData";

interface ScenarioCardButtonProps {
  scenario: Scenario;
  disabled: boolean;
  onRun: (scenario: Scenario) => void;
}

/** A single scenario entry button inside the popover list. */
export const ScenarioCardButton = React.memo(function ScenarioCardButton({
  scenario,
  disabled,
  onRun,
}: ScenarioCardButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onRun(scenario)}
      disabled={disabled}
      className={cn(
        "w-full flex items-start gap-2 px-2 py-1.5 rounded text-left",
        "transition-colors duration-fast cursor-pointer focus-ring",
        "hover:bg-vsc-list-hover",
        "disabled:opacity-40 disabled:cursor-not-allowed",
      )}
    >
      <div className="flex-1 min-w-0">
        <Text size="xs" weight="medium" tone="primary">
          {scenario.label}
        </Text>
        <Text size="2xs" tone="tertiary">
          {scenario.description}
        </Text>
      </div>
    </button>
  );
});
