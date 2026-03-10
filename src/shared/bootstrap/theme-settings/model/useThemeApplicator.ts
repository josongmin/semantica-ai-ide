import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { updateSettingsAtom, userSettingsAtom } from "~shared/lib/atoms/settingsStorage";
import {
  setThemeIdAtom,
  THEME_PRESETS,
  THEME_VARIABLE_NAMES,
  type ThemeId,
  themeIdAtom,
} from "~shared/lib/theme";

import {
  CHAT_FONT_OPTIONS,
  type ChatFont,
  chatFontAtom,
  setChatFontAtom,
  setVoiceStyleAtom,
  type VoiceStyle,
  voiceStyleAtom,
} from "./fontVoiceAtoms";

/**
 * Applies theme CSS variable overrides to :root and persists the choice.
 * Call once in a top-level component (e.g. StreamingBootstrap).
 *
 * Persistence: localStorage via settingsStorage (survives app restarts).
 *
 * - Named themes: overrides every `--color-vsc-*` on document.documentElement
 * - "system": auto-detects OS preference and picks claude-light / tokyo-night
 * - "vscode-sync": clears all overrides so VSCode host variables flow through
 */
const SYSTEM_DARK_THEME: ThemeId = "tokyo-night";
const SYSTEM_LIGHT_THEME: ThemeId = "claude-light";

/** Wrap a DOM mutation in a View Transition crossfade when available. */
function withViewTransition(fn: () => void) {
  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(fn);
  } else {
    fn();
  }
}

function applyPreset(root: HTMLElement, presetId: ThemeId) {
  if (presetId === "vscode-sync" || presetId === "system") {
    root.removeAttribute("data-theme");
    for (const varName of THEME_VARIABLE_NAMES) {
      root.style.removeProperty(varName);
    }
    return;
  }

  const preset = THEME_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;

  root.dataset.theme = presetId;
  for (const [prop, value] of Object.entries(preset.colors)) {
    root.style.setProperty(prop, value);
  }
}

export function useThemeApplicator() {
  const themeId = useAtomValue(themeIdAtom);
  const setThemeId = useSetAtom(setThemeIdAtom);
  const chatFont = useAtomValue(chatFontAtom);
  const setChatFont = useSetAtom(setChatFontAtom);
  const voiceStyle = useAtomValue(voiceStyleAtom);
  const setVoiceStyle = useSetAtom(setVoiceStyleAtom);
  const savedSettings = useAtomValue(userSettingsAtom);
  const updateSettings = useSetAtom(updateSettingsAtom);
  const isFirstRender = useRef(true);

  // Restore persisted settings on mount (from localStorage)
  useEffect(() => {
    if (savedSettings.themeId) {
      setThemeId(savedSettings.themeId as ThemeId);
    }
    if (savedSettings.chatFont) {
      setChatFont(savedSettings.chatFont as ChatFont);
    }
    if (savedSettings.voiceStyle) {
      setVoiceStyle(savedSettings.voiceStyle as VoiceStyle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme & persist on change
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (themeId === "system") {
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        applyPreset(root, mql.matches ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME);
      } else {
        applyPreset(root, themeId);
      }
    };

    // Smooth crossfade via View Transition (skip on initial mount)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      apply();
    } else {
      withViewTransition(apply);
    }

    // Handle OS color-scheme changes for "system" theme
    if (themeId === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        withViewTransition(() => {
          applyPreset(root, mql.matches ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME);
        });
      };
      mql.addEventListener("change", onChange);
      updateSettings({ themeId });
      return () => mql.removeEventListener("change", onChange);
    }

    // Persist selection to localStorage
    updateSettings({ themeId });
  }, [themeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply chat font & persist on change
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.chatFont = chatFont;

    const fontOption = CHAT_FONT_OPTIONS.find((o) => o.id === chatFont);
    root.style.setProperty(
      "--font-chat",
      fontOption?.fontFamily ?? CHAT_FONT_OPTIONS[0].fontFamily,
    );

    updateSettings({ chatFont });
  }, [chatFont]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist voice style on change
  useEffect(() => {
    updateSettings({ voiceStyle });
  }, [voiceStyle]); // eslint-disable-line react-hooks/exhaustive-deps
}
