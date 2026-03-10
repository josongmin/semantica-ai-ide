import React, { useCallback } from "react";
import { useAtom } from "jotai";

import {
  type ChatFont,
  chatFontAtom,
  LIGHT_THEME_IDS,
  THEME_PRESETS,
  type ThemeId,
  themeIdAtom,
  type VoiceStyle,
  voiceStyleAtom,
} from "~shared/bootstrap/theme-settings";
import { Button, cn, Icon, Text } from "~shared/ui";

import { FontSelector } from "./FontSelector";
import { ThemePreview } from "./ThemePreview";
import { VoiceSelector } from "./VoiceSelector";

/* Module-level constants – THEME_PRESETS & LIGHT_THEME_IDS never change at runtime */
const lightPresets = THEME_PRESETS.filter((p) => LIGHT_THEME_IDS.has(p.id));
const darkPresets = THEME_PRESETS.filter((p) => !LIGHT_THEME_IDS.has(p.id));

export const ThemeSection = React.memo(function ThemeSection() {
  const [themeId, setThemeId] = useAtom(themeIdAtom);
  const [chatFont, setChatFont] = useAtom(chatFontAtom);
  const [voiceStyle, setVoiceStyle] = useAtom(voiceStyleAtom);

  const handleThemeSelect = useCallback((id: ThemeId) => setThemeId(id), [setThemeId]);

  const handleFontSelect = useCallback((id: ChatFont) => setChatFont(id), [setChatFont]);

  const handleVoiceSelect = useCallback((id: VoiceStyle) => setVoiceStyle(id), [setVoiceStyle]);

  const themeCard = (preset: (typeof THEME_PRESETS)[number]) => {
    const isActive = themeId === preset.id;
    return (
      <Button
        key={preset.id}
        variant="ghost"
        role="radio"
        aria-checked={isActive}
        onClick={() => handleThemeSelect(preset.id)}
        className={cn(
          "flex flex-col gap-2 p-3 rounded-lg border transition-colors duration-fast text-left items-stretch h-auto",
          isActive
            ? "border-vsc-focus ring-1 ring-vsc-focus/50 bg-vsc-surface-2"
            : "border-vsc-border hover:border-vsc-text-tertiary bg-vsc-surface-1",
        )}
      >
        <ThemePreview colors={preset.colors} />
        <div className="flex items-center gap-2">
          <Icon
            name={isActive ? "pass-filled" : "circle-large-outline"}
            tokenSize="2xs"
            className={isActive ? "text-vsc-button" : "text-vsc-text-ghost"}
          />
          <Text size="2xs" weight="medium" tone={isActive ? "primary" : "secondary"}>
            {preset.label}
          </Text>
        </div>
      </Button>
    );
  };

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Light themes */}
      <div className="space-y-2">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Light
        </Text>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {lightPresets.map(themeCard)}
        </div>
      </div>

      {/* Dark themes */}
      <div className="space-y-2">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Dark
        </Text>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {darkPresets.map(themeCard)}
        </div>
      </div>

      {/* System (auto-detect) */}
      <Button
        variant="ghost"
        role="radio"
        aria-checked={themeId === "system"}
        onClick={() => handleThemeSelect("system")}
        className={cn(
          "flex items-center gap-2 w-full p-3 rounded-lg border transition-colors duration-fast text-left justify-start h-auto",
          themeId === "system"
            ? "border-vsc-focus ring-1 ring-vsc-focus/50 bg-vsc-surface-2"
            : "border-vsc-border hover:border-vsc-text-tertiary bg-vsc-surface-1",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            themeId === "system" ? "bg-vsc-warning/15" : "bg-vsc-surface-3",
          )}
        >
          <Icon
            name="color-mode"
            tokenSize="sm"
            className={themeId === "system" ? "text-vsc-warning" : "text-vsc-text-tertiary"}
          />
        </div>
        <div className="flex-1">
          <Text size="xs" weight="medium" tone={themeId === "system" ? "primary" : "secondary"}>
            System
          </Text>
          <Text size="2xs" tone="ghost">
            Follows your OS light/dark preference
          </Text>
        </div>
        {themeId === "system" && (
          <Icon name="check" tokenSize="xs" className="text-vsc-success shrink-0" />
        )}
      </Button>

      {/* VSCode Sync */}
      <Button
        variant="ghost"
        role="radio"
        aria-checked={themeId === "vscode-sync"}
        onClick={() => handleThemeSelect("vscode-sync")}
        className={cn(
          "flex items-center gap-2 w-full p-3 rounded-lg border transition-colors duration-fast text-left justify-start h-auto",
          themeId === "vscode-sync"
            ? "border-vsc-focus ring-1 ring-vsc-focus/50 bg-vsc-surface-2"
            : "border-vsc-border hover:border-vsc-text-tertiary bg-vsc-surface-1",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            themeId === "vscode-sync" ? "bg-vsc-info/15" : "bg-vsc-surface-3",
          )}
        >
          <Icon
            name="sync"
            tokenSize="sm"
            className={themeId === "vscode-sync" ? "text-vsc-info" : "text-vsc-text-tertiary"}
          />
        </div>
        <div className="flex-1">
          <Text
            size="xs"
            weight="medium"
            tone={themeId === "vscode-sync" ? "primary" : "secondary"}
          >
            VSCode Sync
          </Text>
          <Text size="2xs" tone="ghost">
            Follows your editor theme automatically
          </Text>
        </div>
        {themeId === "vscode-sync" && (
          <Icon name="check" tokenSize="xs" className="text-vsc-success shrink-0" />
        )}
      </Button>

      {/* ── Divider ── */}
      <hr className="border-vsc-border" />

      {/* ── Chat font ── */}
      <FontSelector chatFont={chatFont} onSelect={handleFontSelect} />

      {/* ── Divider ── */}
      <hr className="border-vsc-border" />

      {/* ── Voice settings ── */}
      <VoiceSelector voiceStyle={voiceStyle} onSelect={handleVoiceSelect} />
    </div>
  );
});
