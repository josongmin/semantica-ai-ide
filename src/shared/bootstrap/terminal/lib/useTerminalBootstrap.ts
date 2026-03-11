/**
 * useTerminalBootstrap — App-level initialization
 *
 * Initializes the terminal bridge and event listener with Tauri's
 * invoke/listen functions. Must be called once in StreamingBootstrap.
 *
 * Detects platform (Tauri vs browser) and only activates on Tauri.
 */

import { useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";

import { IS_TAURI } from "~shared/lib/hooks/usePlatform";
import { logger } from "~shared/lib/logger";

import { terminalBridgeReadyAtom } from "../model/atoms";
import { initTerminalBridge } from "./tauriTerminalBridge";
import { initTerminalEventListener, useTerminalEventListener } from "./useTerminalEventListener";

/**
 * Bootstrap the terminal system.
 * - On Tauri: initializes bridge + event listener with real Tauri APIs
 * - On browser: no-op (terminal features degrade gracefully)
 */
export function useTerminalBootstrap(): void {
  const initializing = useRef(false);
  const [ready, setReady] = useState(false);
  const setBridgeReady = useSetAtom(terminalBridgeReadyAtom);

  useEffect(() => {
    if (initializing.current) return;
    if (!IS_TAURI) {
      logger.info("[Terminal] Not on Tauri — terminal features disabled");
      return;
    }

    initializing.current = true;

    // Access Tauri APIs from the global (withGlobalTauri: true injects window.__TAURI__).
    // Dynamic import with @vite-ignore fails on WebKit because bare specifiers
    // aren't resolved by the browser's native module loader.
    try {
      type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      type ListenFn = (
        event: string,
        handler: (event: { payload: unknown }) => void,
      ) => Promise<() => void>;
      interface TauriGlobal {
        core?: { invoke?: InvokeFn };
        event?: { listen?: ListenFn };
      }

      const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
      if (!tauri?.core?.invoke || !tauri.event?.listen) {
        throw new Error("window.__TAURI__ API not found (core.invoke / event.listen)");
      }

      initTerminalBridge(tauri.core.invoke);
      initTerminalEventListener(tauri.event.listen);

      // State updates in useEffect: bridge init is async external sync, safe on mount
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Tauri bridge init, not derived state
      setReady(true);
      setBridgeReady(true);
      logger.info("[Terminal] Bridge + event listener initialized via __TAURI__ global");
    } catch (err) {
      logger.warn("[Terminal] Failed to initialize Tauri bridge:", err);
    }

    // StrictMode safety: reset flag on cleanup so re-mount can re-initialize
    return () => {
      initializing.current = false;
    };
  }, [setBridgeReady]);

  // Only activate event subscriptions AFTER bridge + listen are initialized
  // This solves the race: useTerminalEventListener checks listenFn on mount,
  // and `ready` state change triggers a re-render → re-run of the hook
  useTerminalEventListener(ready);
}
