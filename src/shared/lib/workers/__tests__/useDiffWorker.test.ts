import { act,renderHook } from "@testing-library/react";

import { useDiffWorker } from "../useDiffWorker";

// ─── Mock Worker ───────────────────────────────────────────

type MessageHandler = (event: MessageEvent) => void;

const createdWorkers: MockWorker[] = [];

class MockWorker {
  onmessage: MessageHandler | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  terminated = false;

  constructor() {
    createdWorkers.push(this);
  }

  postMessage(data: { id: string; before: string; after: string }) {
    if (this.terminated) return;

    // Simulate async worker computation
    setTimeout(() => {
      if (this.terminated || !this.onmessage) return;

      // Simple mock: count lines
      const beforeLines = data.before ? data.before.split("\n") : [];
      const afterLines = data.after ? data.after.split("\n") : [];

      this.onmessage(
        new MessageEvent("message", {
          data: {
            id: data.id,
            result: {
              lines: [],
              additions: afterLines.length,
              deletions: beforeLines.length,
              unchanged: 0,
            },
          },
        }),
      );
    }, 0);
  }

  terminate() {
    this.terminated = true;
  }
}

// Replace global Worker with our mock class
vi.stubGlobal("Worker", MockWorker);

// ─── Tests ─────────────────────────────────────────────────

describe("useDiffWorker", () => {
  beforeEach(() => {
    createdWorkers.length = 0;
  });

  it("returns a computeDiff function", () => {
    const { result } = renderHook(() => useDiffWorker());
    expect(typeof result.current.computeDiff).toBe("function");
  });

  it("resolves with diff result", async () => {
    const { result } = renderHook(() => useDiffWorker());

    let diffResult: Awaited<ReturnType<typeof result.current.computeDiff>> | undefined;

    await act(async () => {
      diffResult = await result.current.computeDiff("line1", "line2\nline3");
    });

    expect(diffResult).toBeDefined();
    expect(diffResult!.additions).toBe(2);
    expect(diffResult!.deletions).toBe(1);
  });

  it("handles multiple concurrent requests", async () => {
    const { result } = renderHook(() => useDiffWorker());

    let results: Awaited<ReturnType<typeof result.current.computeDiff>>[] = [];

    await act(async () => {
      const promises = [
        result.current.computeDiff("a", "b"),
        result.current.computeDiff("x\ny", "z"),
      ];
      results = await Promise.all(promises);
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toBeDefined();
    expect(results[1]).toBeDefined();
  });

  it("creates worker lazily on first call", async () => {
    const { result } = renderHook(() => useDiffWorker());

    // Worker should not be created yet
    expect(createdWorkers).toHaveLength(0);

    // Trigger a computation and await it to avoid unhandled rejection on cleanup
    await act(async () => {
      await result.current.computeDiff("a", "b");
    });

    expect(createdWorkers).toHaveLength(1);
  });

  it("reuses the same worker for multiple calls", async () => {
    const { result } = renderHook(() => useDiffWorker());

    await act(async () => {
      await Promise.all([
        result.current.computeDiff("a", "b"),
        result.current.computeDiff("c", "d"),
      ]);
    });

    // Should only create one worker
    expect(createdWorkers).toHaveLength(1);
  });

  it("terminates worker on unmount", async () => {
    const { result, unmount } = renderHook(() => useDiffWorker());

    // Trigger worker creation and wait for the result
    await act(async () => {
      await result.current.computeDiff("a", "b");
    });

    expect(createdWorkers).toHaveLength(1);
    expect(createdWorkers[0]?.terminated).toBe(false);

    unmount();

    expect(createdWorkers[0]?.terminated).toBe(true);
  });
});
