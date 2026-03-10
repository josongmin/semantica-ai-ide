import { useCallback, useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { createPerfCollector, createStreamingEngine, isAllowedOrigin, pushToastAtom } from "../../shared/lib";
import { logger } from "../../shared/lib/logger";
import { createReconnectManager } from "../../shared/lib/streaming/reconnectManager";
import { isServerEvent, isServerEventBatch } from "../../shared/protocol";
import { useServerEventDispatcher } from "./useServerEventDispatcher";

/**
 * Connects the postMessage bridge from the Extension Host to the
 * Jotai store via the StreamingEngine (rAF-coalesced commits).
 *
 * Uses a ref for `commit` so the effect never re-runs when dispatch changes.
 */
export function useStreamingCommit(): { flush: () => void } {
  const { dispatch } = useServerEventDispatcher();
  const pushToast = useSetAtom(pushToastAtom);
  const dispatchRef = useRef(dispatch);
  const pushToastRef = useRef(pushToast);
  const engineRef = useRef<ReturnType<typeof createStreamingEngine> | null>(null);

  // Keep refs current without re-running the effect
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);
  useEffect(() => {
    pushToastRef.current = pushToast;
  }, [pushToast]);

  useEffect(() => {
    const perf = createPerfCollector();

    const reconnect = createReconnectManager({
      heartbeatTimeoutMs: 30_000,
      maxRetries: 3,
      onReconnect: (attempt) => {
        logger.warn(`[useStreamingCommit] No messages for 30s, reconnect attempt ${attempt}`);
        pushToastRef.current({
          id: `reconnect-${attempt}`,
          message: `Connection interrupted. Retrying… (${attempt}/3)`,
          variant: "warning",
          duration: 5000,
        });
      },
      onGiveUp: () => {
        logger.error("[useStreamingCommit] Connection appears lost after max retries");
        pushToastRef.current({
          id: "connection-lost",
          message: "Connection to extension host lost. Please reload the window.",
          variant: "error",
        });
      },
    });
    reconnect.start();

    const engine = createStreamingEngine((serverEvents) => {
      perf.recordUICommit();
      for (const serverEvent of serverEvents) {
        dispatchRef.current(serverEvent);
      }
    });
    engineRef.current = engine;

    function handleMessage(event: MessageEvent<unknown>) {
      if (!isAllowedOrigin(event.origin)) return;

      const {data} = event;
      if (data == null || typeof data !== "object") return;

      perf.recordPostMessage();
      reconnect.recordActivity();

      try {
        if (isServerEventBatch(data)) {
          engine.push(data);
          return;
        }

        if (isServerEvent(data)) {
          engine.push(data);
        }
      } catch (err) {
        logger.error("[useStreamingCommit] Failed to process serverEvent:", err);
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      engine.destroy();
      perf.destroy();
      reconnect.stop();
      engineRef.current = null;
    };
  }, []); // stable — no deps, dispatch accessed via ref

  return {
    flush: useCallback(() => engineRef.current?.flush(), []),
  };
}
