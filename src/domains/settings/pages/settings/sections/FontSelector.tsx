import React from "react";

import { CHAT_FONT_OPTIONS,type ChatFont } from "~shared/bootstrap/theme-settings";
import { cn, Text } from "~shared/ui";

/** Font family mapping for preview rendering */
const FONT_PREVIEW_FAMILIES: Record<ChatFont, string> = {
  default: "'Georgia', serif",
  "source-serif": "'Source Serif 4', Georgia, serif",
  "editor-default": "Menlo, Monaco, 'Courier New', monospace",
  "panel-ui": "-apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif",
  sans: "'Inter', 'Helvetica Neue', sans-serif",
  roboto: "'Roboto', sans-serif",
  arial: "Arial, 'Helvetica Neue', sans-serif",
  helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', 'Lucida Grande', sans-serif",
  system: "system-ui, sans-serif",
  "jetbrains-mono": "'JetBrains Mono', monospace",
  "fira-code": "'Fira Code', monospace",
  "ibm-plex": "'IBM Plex Sans', sans-serif",
  nunito: "'Nunito', sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
  "noto-sans-kr": "'Noto Sans KR', sans-serif",
  outfit: "'Outfit', sans-serif",
  manrope: "'Manrope', sans-serif",
  dyslexic: "'Comic Sans MS', sans-serif",
};

interface FontSelectorProps {
  chatFont: ChatFont;
  onSelect: (id: ChatFont) => void;
}

export const FontSelector = React.memo(function FontSelector({
  chatFont,
  onSelect,
}: FontSelectorProps) {
  return (
    <div className="space-y-2">
      <Text as="div" size="xs" weight="semibold" tone="primary">
        Chat font
      </Text>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {CHAT_FONT_OPTIONS.map((opt) => {
          const isActive = chatFont === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 py-5 px-3 rounded-xl border-2 transition-colors duration-normal cursor-pointer focus-ring",
                isActive
                  ? "border-vsc-focus bg-vsc-bg ring-1 ring-vsc-focus"
                  : "border-vsc-border/40 bg-vsc-surface-1 hover:border-vsc-text-tertiary hover:bg-vsc-surface-2",
              )}
            >
              <span
                className={cn(
                  "text-3xl leading-none transition-colors duration-normal",
                  isActive ? "text-vsc-fg" : "text-vsc-text-secondary",
                )}
                style={{ fontFamily: FONT_PREVIEW_FAMILIES[opt.id] }}
              >
                Aa
              </span>
              <Text size="2xs" weight="medium" tone={isActive ? "primary" : "ghost"}>
                {opt.label}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
});
