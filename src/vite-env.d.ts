/// <reference types="vite/client" />

/** Typed dev-only window extensions */
declare global {
  interface Window {
    __agentUx?: {
      getMessageIds(): string[];
      getMessage(id: string): unknown;
      getTurnIds(): string[];
      getTurn(id: string): unknown;
      getSessionMeta(): unknown;
      getCheckpoints(): unknown[];
      getTimelineEvents(): unknown[];
      getMessageCount(): number;
      getTurnCount(): number;
      snapshot(): Record<string, unknown>;
    };
    __dev?: {
      streamTurn(seconds: number): void;
      stream1000cps(seconds: number): void;
      sim: Record<string, () => Promise<void>>;
    };
    __perf?: {
      snapshot(): Record<string, unknown>;
      destroy(): void;
    };
  }
}

export {};
