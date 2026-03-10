import React from "react";
import { useAtomValue } from "jotai";

import { threeModelStateAtom } from "../../features/three-model";
import { threeModelPanelVisibleAtom } from "../../shared/lib/atoms/inspectionPanelAtoms";
import type { ModelRoleState } from "../../shared/protocol";
import { cn, Icon, ScrollArea, Text } from "../../shared/ui";

// ─── Role configuration ──────────────────────────────────────

interface RoleConfig {
  readonly key: "planner" | "coder" | "critic";
  readonly label: string;
  readonly icon: string;
  readonly accentClass: string;
  readonly borderClass: string;
  readonly bgClass: string;
}

const ROLE_CONFIGS: readonly RoleConfig[] = [
  {
    key: "planner",
    label: "Planner",
    icon: "lightbulb",
    accentClass: "text-vsc-keyword",
    borderClass: "border-vsc-keyword/40",
    bgClass: "bg-vsc-keyword/5",
  },
  {
    key: "coder",
    label: "Coder",
    icon: "code",
    accentClass: "text-vsc-info",
    borderClass: "border-vsc-info/40",
    bgClass: "bg-vsc-info/5",
  },
  {
    key: "critic",
    label: "Critic",
    icon: "search",
    accentClass: "text-vsc-warning",
    borderClass: "border-vsc-warning/40",
    bgClass: "bg-vsc-warning/5",
  },
] as const;

// ─── Status helpers ──────────────────────────────────────────

function statusLabel(status: ModelRoleState["status"]): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "active":
      return "Active";
    case "done":
      return "Done";
  }
}

function statusDotClass(status: ModelRoleState["status"]): string {
  switch (status) {
    case "idle":
      return "bg-vsc-fg/30";
    case "active":
      return "bg-vsc-success animate-[pulse_2s_ease-in-out_infinite]";
    case "done":
      return "bg-vsc-success";
  }
}

// ─── ModelColumn ─────────────────────────────────────────────

interface ModelColumnProps {
  config: RoleConfig;
  state: ModelRoleState;
}

const ModelColumn = React.memo(function ModelColumn({ config, state }: ModelColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-0 border rounded",
        config.borderClass,
        config.bgClass,
      )}
      data-testid={`model-column-${config.key}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit">
        <Icon name={config.icon} tokenSize="sm" className={config.accentClass} />
        <Text size="sm" weight="semibold" className={config.accentClass}>
          {config.label}
        </Text>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className={cn("inline-block w-2 h-2 rounded-full", statusDotClass(state.status))} />
          <Text size="2xs" tone="secondary">
            {statusLabel(state.status)}
          </Text>
        </div>
      </div>

      {/* Model name */}
      {state.model && (
        <div className="px-3 py-1 border-b border-inherit">
          <Text size="2xs" tone="tertiary" truncate>
            {state.model}
          </Text>
        </div>
      )}

      {/* Output */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-2">
        <Text size="xs" tone="secondary" as="div" className="whitespace-pre-wrap break-words">
          {state.output || (
            <Text size="xs" tone="tertiary">
              No output yet
            </Text>
          )}
        </Text>
      </ScrollArea>
    </div>
  );
});

// ─── ThreeModelPanel ─────────────────────────────────────────

/**
 * AS-03: 3-Model Architecture panel.
 * Shows Planner (purple), Coder (blue), Critic (orange) in side-by-side columns.
 * Each column displays model name, status indicator, and streaming output.
 */
export const ThreeModelPanel = React.memo(function ThreeModelPanel() {
  const visible = useAtomValue(threeModelPanelVisibleAtom);
  const state = useAtomValue(threeModelStateAtom);

  if (!visible) return null;

  return (
    <div
      className="flex gap-2 p-2 h-full min-h-0"
      data-testid="three-model-panel"
      role="region"
      aria-label="Three-model architecture"
    >
      {ROLE_CONFIGS.map((config) => (
        <ModelColumn key={config.key} config={config} state={state[config.key]} />
      ))}
    </div>
  );
});
