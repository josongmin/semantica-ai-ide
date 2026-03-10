import React from "react";

import { VOICE_STYLE_OPTIONS,type VoiceStyle } from "~shared/bootstrap/theme-settings";
import { cn, Text } from "~shared/ui";

interface VoiceSelectorProps {
  voiceStyle: VoiceStyle;
  onSelect: (id: VoiceStyle) => void;
}

export const VoiceSelector = React.memo(function VoiceSelector({
  voiceStyle,
  onSelect,
}: VoiceSelectorProps) {
  return (
    <div className="space-y-2">
      <Text as="div" size="xs" weight="semibold" tone="primary">
        Voice settings
      </Text>
      <Text as="div" size="2xs" tone="ghost" className="-mt-1">
        Voice
      </Text>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {VOICE_STYLE_OPTIONS.map((opt) => {
          const isActive = voiceStyle === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "flex items-center justify-center py-3.5 px-2 rounded-xl border-2 transition-colors duration-normal cursor-pointer focus-ring",
                isActive
                  ? "border-vsc-focus bg-vsc-bg ring-1 ring-vsc-focus"
                  : "border-vsc-border/40 bg-vsc-surface-1 hover:border-vsc-text-tertiary hover:bg-vsc-surface-2",
              )}
            >
              <Text size="2xs" weight={isActive ? "semibold" : "medium"} tone={isActive ? "primary" : "ghost"}>
                {opt.label}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
});
