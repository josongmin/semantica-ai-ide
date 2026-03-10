import React, { useCallback } from "react";
import { useAtom } from "jotai";

import {
  ALL_STAGES,
  pipelineModeAtom,
  type PipelineStageId,
  type PipelineStageVisibility,
  pipelineStageVisibilityAtom,
  type PipelineVisibility,
} from "~features/pipeline-settings";
import { Button, cn, Icon, Text } from "~shared/ui";

const MODE_OPTIONS: { id: PipelineVisibility; label: string; icon: string; description: string }[] =
  [
    { id: "auto", label: "Auto", icon: "wand", description: "Show when data exists" },
    { id: "always", label: "Always", icon: "eye", description: "Always visible" },
    { id: "compact", label: "Compact", icon: "dash", description: "Badge only" },
    { id: "off", label: "Off", icon: "eye-closed", description: "Hidden" },
  ];

export const PipelineSection = React.memo(function PipelineSection() {
  const [mode, setMode] = useAtom(pipelineModeAtom);
  const [stages, setStages] = useAtom(pipelineStageVisibilityAtom);

  const handleModeChange = useCallback(
    (newMode: PipelineVisibility) => {
      setMode(newMode);
    },
    [setMode],
  );

  const handleStageToggle = useCallback(
    (stageId: PipelineStageId) => {
      setStages((prev: PipelineStageVisibility) => ({
        ...prev,
        [stageId]: !prev[stageId],
      }));
    },
    [setStages],
  );

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ── Pipeline Mode ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Display mode
        </Text>

        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.map((opt) => {
            const isActive = mode === opt.id;
            return (
              <Button
                key={opt.id}
                variant="ghost"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleModeChange(opt.id)}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border transition-colors duration-fast text-left justify-start",
                  isActive
                    ? "border-vsc-focus ring-1 ring-vsc-focus/50 bg-vsc-surface-2"
                    : "border-vsc-border hover:border-vsc-text-tertiary bg-vsc-surface-1",
                )}
              >
                <Icon
                  name={opt.icon}
                  tokenSize="sm"
                  className={isActive ? "text-vsc-button" : "text-vsc-text-ghost"}
                />
                <div className="min-w-0 flex flex-col gap-1">
                  <Text size="xs" weight="medium" tone={isActive ? "primary" : "secondary"}>
                    {opt.label}
                  </Text>
                  <Text size="2xs" tone="ghost">
                    {opt.description}
                  </Text>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── Visible Stages ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Visible stages
        </Text>

        <div
          className={cn(
            "rounded-xl border border-vsc-border overflow-hidden",
            mode === "off" && "opacity-40 pointer-events-none",
          )}
        >
          {ALL_STAGES.map((stage, idx) => (
            <Button
              key={stage.id}
              variant="ghost"
              onClick={() => handleStageToggle(stage.id)}
              disabled={mode === "off"}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2 text-left justify-start",
                "transition-colors duration-fast hover:bg-vsc-list-hover",
                idx > 0 && "border-t border-vsc-border/50",
              )}
            >
              <Icon
                name={stages[stage.id] ? "pass-filled" : "circle-large-outline"}
                tokenSize="sm"
                className={stages[stage.id] ? "text-vsc-success" : "text-vsc-text-ghost"}
              />
              <Text size="xs" tone={stages[stage.id] ? "primary" : "tertiary"} className="flex-1">
                {stage.label}
              </Text>
              {!stage.hasWidget && (
                <Text size="2xs" tone="ghost" className="italic">
                  soon
                </Text>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});
