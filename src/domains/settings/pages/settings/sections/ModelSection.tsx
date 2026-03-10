import React, { useCallback } from "react";

import { useFastMode } from "~features/fast-mode";
import { useModelSwitcher } from "~features/model-switcher";
import { useThinkingMode } from "~features/thinking-mode";
import { Button, cn, Icon, Text } from "~shared/ui";

export const ModelSection = React.memo(function ModelSection() {
  const { models, currentModelId, switchModel } = useModelSwitcher();
  const { enabled: thinkingEnabled, toggle: toggleThinking } = useThinkingMode();
  const { enabled: fastEnabled, toggle: toggleFast } = useFastMode();

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ── Model Selection ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Active model
        </Text>

        {models.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-vsc-surface-1 border border-vsc-border">
            <Icon name="info" tokenSize="xs" className="text-vsc-text-ghost" />
            <Text size="2xs" tone="ghost">
              No models available. Start a session to load model list.
            </Text>
          </div>
        ) : (
          <div className="rounded-lg border border-vsc-border overflow-hidden">
            {models.map((model, idx) => {
              const isActive = model.id === currentModelId;
              return (
                <Button
                  key={model.id}
                  variant="ghost"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => switchModel(model.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 transition-colors duration-fast text-left justify-start",
                    isActive ? "bg-vsc-surface-2" : "hover:bg-vsc-list-hover",
                    idx > 0 && "border-t border-vsc-border/50",
                  )}
                >
                  <Icon
                    name={isActive ? "pass-filled" : "circle-large-outline"}
                    tokenSize="sm"
                    className={isActive ? "text-vsc-button" : "text-vsc-text-ghost"}
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <Text size="xs" weight="medium" tone={isActive ? "primary" : "secondary"}>
                      {model.label}
                    </Text>
                    {model.provider && (
                      <Text size="2xs" tone="ghost">{model.provider}</Text>
                    )}
                  </div>
                  {isActive && (
                    <Icon name="check" tokenSize="xs" className="text-vsc-success shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Mode Toggles ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Mode
        </Text>

        <div className="rounded-xl border border-vsc-border overflow-hidden">
          <ToggleRow
            label="Thinking Mode"
            description="Extended reasoning for complex tasks"
            icon="lightbulb"
            enabled={thinkingEnabled}
            onToggle={toggleThinking}
          />
          <ToggleRow
            label="Fast Mode"
            description="Faster responses, same model"
            icon="zap"
            enabled={fastEnabled}
            onToggle={toggleFast}
            border
          />
        </div>
      </div>
    </div>
  );
});

function ToggleRow({
  label,
  description,
  icon,
  enabled,
  onToggle,
  border,
}: {
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  onToggle: () => void;
  border?: boolean;
}) {
  const handleClick = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 hover:bg-vsc-list-hover transition-colors duration-fast text-left justify-start",
        border && "border-t border-vsc-border/50",
      )}
    >
      <Icon name={icon} tokenSize="sm" className={enabled ? "text-vsc-button" : "text-vsc-text-ghost"} />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Text size="xs" weight="medium" tone="primary">
          {label}
        </Text>
        <Text size="2xs" tone="tertiary">
          {description}
        </Text>
      </div>
      {/* Switch toggle */}
      <div
        role="switch"
        aria-checked={enabled}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-fast shrink-0",
          enabled ? "bg-vsc-button" : "bg-vsc-surface-3",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-vsc-fg shadow-sm transition-transform duration-fast",
            enabled ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </div>
    </Button>
  );
}
