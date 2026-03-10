import { useCallback } from "react";
import { useAtomValue } from "jotai";

import { completionSettingsAtom, completionStatsAtom } from "~entities/completion-settings";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { CompletionSettings, CompletionStats } from "../../../shared/protocol";

export function useInlineCompletion(): {
  settings: CompletionSettings;
  stats: CompletionStats;
  updateSettings: (partial: Partial<CompletionSettings>) => void;
  toggleEnabled: () => void;
} {
  const settings = useAtomValue(completionSettingsAtom);
  const stats = useAtomValue(completionStatsAtom);

  const updateSettings = useCallback((partial: Partial<CompletionSettings>) => {
    getVscodeApi().postMessage({ type: "SET_COMPLETION_SETTINGS", settings: partial });
  }, []);

  const toggleEnabled = useCallback(() => {
    getVscodeApi().postMessage({
      type: "SET_COMPLETION_SETTINGS",
      settings: { enabled: !settings.enabled },
    });
  }, [settings.enabled]);

  return { settings, stats, updateSettings, toggleEnabled };
}
