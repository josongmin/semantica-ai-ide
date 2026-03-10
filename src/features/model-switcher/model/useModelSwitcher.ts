import { useCallback } from "react";
import { useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { availableModelsAtom } from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { ModelInfo } from "../../../shared/protocol";

export function useModelSwitcher(): {
  models: readonly ModelInfo[];
  currentModelId: string;
  switchModel: (modelId: string) => void;
} {
  const models = useAtomValue(availableModelsAtom);
  const meta = useAtomValue(sessionMetaAtom);

  const switchModel = useCallback((modelId: string) => {
    getVscodeApi().postMessage({ type: "SWITCH_MODEL", model_id: modelId });
  }, []);

  return { models, currentModelId: meta.model_id, switchModel };
}
