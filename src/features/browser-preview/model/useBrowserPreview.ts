import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { browserConsoleEntriesAtom, browserStateAtom } from "../../../entities/browser";
import { browserPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { BrowserConsoleEntry, BrowserState } from "../../../shared/protocol";

export function useBrowserPreview(): {
  browserState: BrowserState;
  consoleEntries: readonly BrowserConsoleEntry[];
  panelVisible: boolean;
  togglePanel: () => void;
  navigate: (url: string) => void;
  click: (x: number, y: number) => void;
  close: () => void;
} {
  const browserState = useAtomValue(browserStateAtom);
  const consoleEntries = useAtomValue(browserConsoleEntriesAtom);
  const panelVisible = useAtomValue(browserPanelVisibleAtom);

  const setVisible = useSetAtom(browserPanelVisibleAtom);
  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const navigate = useCallback((url: string) => {
    getVscodeApi().postMessage({ type: "BROWSER_NAVIGATE", url });
  }, []);

  const click = useCallback((x: number, y: number) => {
    getVscodeApi().postMessage({ type: "BROWSER_CLICK", x, y });
  }, []);

  const close = useCallback(() => {
    getVscodeApi().postMessage({ type: "BROWSER_CLOSE" });
  }, []);

  return { browserState, consoleEntries, panelVisible, togglePanel, navigate, click, close };
}
