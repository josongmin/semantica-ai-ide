// Latency measurement models (cold/warm/incremental)

export type LatencyPhase = "cold" | "warm" | "incremental";

export interface LatencyPacket {
  readonly phase: LatencyPhase;
  readonly operation: string;
  readonly start_ms: number;
  readonly end_ms: number;
  readonly duration_ms: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LatencyProfile {
  readonly session_id: string;
  readonly packets: readonly LatencyPacket[];
  readonly summary: LatencySummary;
}

export interface LatencySummary {
  readonly cold_p50_ms: number;
  readonly cold_p99_ms: number;
  readonly warm_p50_ms: number;
  readonly warm_p99_ms: number;
  readonly incremental_p50_ms: number;
  readonly incremental_p99_ms: number;
}
