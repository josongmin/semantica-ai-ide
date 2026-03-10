import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  indexFileCountAtom,
  indexProgressAtom,
  indexStatusAtom,
  searchResultsAtom,
} from "../../../entities/semantic-index";
import { searchPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { IndexStatus, SemanticSearchResult } from "../../../shared/protocol";

export function useSemanticSearch(): {
  indexStatus: IndexStatus;
  indexProgress: number;
  indexFileCount: number;
  results: readonly SemanticSearchResult[];
  panelVisible: boolean;
  togglePanel: () => void;
  triggerSearch: (query: string) => void;
  triggerReindex: () => void;
} {
  const indexStatus = useAtomValue(indexStatusAtom);
  const indexProgress = useAtomValue(indexProgressAtom);
  const indexFileCount = useAtomValue(indexFileCountAtom);
  const results = useAtomValue(searchResultsAtom);
  const panelVisible = useAtomValue(searchPanelVisibleAtom);

  const setVisible = useSetAtom(searchPanelVisibleAtom);
  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const triggerSearch = useCallback((query: string) => {
    getVscodeApi().postMessage({ type: "SEMANTIC_SEARCH", query });
  }, []);

  const triggerReindex = useCallback(() => {
    getVscodeApi().postMessage({ type: "REQUEST_INDEX" });
  }, []);

  return {
    indexStatus,
    indexProgress,
    indexFileCount,
    results,
    panelVisible,
    togglePanel,
    triggerSearch,
    triggerReindex,
  };
}
