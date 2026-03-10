import { useCallback, useEffect, useRef } from "react";

import type { DiffResult } from "../../protocol";

interface PendingRequest {
  resolve: (result: DiffResult) => void;
  reject: (error: Error) => void;
}

type WorkerResponse = { id: string; result: DiffResult } | { id: string; error: string };

let requestCounter = 0;

/**
 * Hook that provides `computeDiff(before, after): Promise<DiffResult>`,
 * offloading the computation to a Web Worker to prevent UI blocking.
 *
 * The worker is created lazily on first call and cleaned up when the
 * component unmounts.
 *
 * Usage:
 * ```ts
 * const { computeDiff } = useDiffWorker();
 * const result = await computeDiff(before, after);
 * ```
 */
export function useDiffWorker(): {
  computeDiff: (before: string, after: string) => Promise<DiffResult>;
} {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());

  // Initialize worker lazily
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("./diffWorker.ts", import.meta.url), {
        type: "module",
      });

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const {data} = event;
        const pending = pendingRef.current.get(data.id);
        if (!pending) return;

        pendingRef.current.delete(data.id);

        if ("error" in data) {
          pending.reject(new Error(data.error));
        } else {
          pending.resolve(data.result);
        }
      };

      workerRef.current.onerror = (error) => {
        // Reject all pending requests
        for (const [id, pending] of pendingRef.current) {
          pending.reject(new Error(error.message || "Worker error"));
          pendingRef.current.delete(id);
        }
      };
    }
    return workerRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const worker = workerRef;
    const pending = pendingRef;
    return () => {
      if (worker.current) {
        worker.current.terminate();
        worker.current = null;
      }
      // Reject any pending requests
      for (const [, p] of pending.current) {
        p.reject(new Error("Worker terminated"));
      }
      pending.current.clear();
    };
  }, []);

  const computeDiff = useCallback(
    (before: string, after: string): Promise<DiffResult> => {
      return new Promise<DiffResult>((resolve, reject) => {
        const id = `diff_${++requestCounter}`;
        pendingRef.current.set(id, { resolve, reject });

        try {
          const worker = getWorker();
          worker.postMessage({ id, before, after });
        } catch (err) {
          pendingRef.current.delete(id);
          reject(err instanceof Error ? err : new Error("Failed to post to worker"));
        }
      });
    },
    [getWorker],
  );

  return { computeDiff };
}
