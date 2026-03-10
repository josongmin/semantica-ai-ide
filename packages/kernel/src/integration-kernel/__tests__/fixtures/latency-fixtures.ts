import type {
  LatencyPacket,
  LatencyProfile,
} from "@semantica/protocol/models";

// ---------------------------------------------------------------------------
// Cold-start packets: first query after kernel init (800-2000ms range)
// ---------------------------------------------------------------------------

export const coldPackets: readonly LatencyPacket[] = [
  {
    phase: "cold",
    operation: "kernel/initialize",
    start_ms: 0,
    end_ms: 1842,
    duration_ms: 1842,
    metadata: { firstRun: true, configLoaded: false },
  },
  {
    phase: "cold",
    operation: "lsp/openDocument",
    start_ms: 1842,
    end_ms: 2730,
    duration_ms: 888,
    metadata: { fileCount: 1, language: "typescript" },
  },
  {
    phase: "cold",
    operation: "policy/evaluate/cold",
    start_ms: 2730,
    end_ms: 3612,
    duration_ms: 882,
    metadata: { policyVersion: "1.0.0", rulesEvaluated: 14 },
  },
  {
    phase: "cold",
    operation: "query/impact/first",
    start_ms: 3612,
    end_ms: 5150,
    duration_ms: 1538,
    metadata: { graphNodes: 230, edgesTraversed: 412 },
  },
  {
    phase: "cold",
    operation: "graph/buildIndex",
    start_ms: 5150,
    end_ms: 6320,
    duration_ms: 1170,
    metadata: { indexType: "semantic", symbolCount: 1840 },
  },
  {
    phase: "cold",
    operation: "lsp/diagnostics/initial",
    start_ms: 6320,
    end_ms: 7480,
    duration_ms: 1160,
    metadata: { diagnosticCount: 7, severity: "warning" },
  },
  {
    phase: "cold",
    operation: "agent/loadCapabilities",
    start_ms: 7480,
    end_ms: 8390,
    duration_ms: 910,
    metadata: { capabilitiesLoaded: 22 },
  },
  {
    phase: "cold",
    operation: "review/loadRuleset",
    start_ms: 8390,
    end_ms: 9580,
    duration_ms: 1190,
    metadata: { rulesetVersion: "2.3.0", ruleCount: 48 },
  },
  {
    phase: "cold",
    operation: "timeline/hydrate",
    start_ms: 9580,
    end_ms: 10900,
    duration_ms: 1320,
    metadata: { eventsReplayed: 312 },
  },
  {
    phase: "cold",
    operation: "orchestrator/planFirst",
    start_ms: 10900,
    end_ms: 12740,
    duration_ms: 1840,
    metadata: { planSteps: 5, retryBudget: 3 },
  },
  {
    phase: "cold",
    operation: "verdict/computeInitial",
    start_ms: 12740,
    end_ms: 13590,
    duration_ms: 850,
    metadata: { verdictType: "pass", confidence: 0.91 },
  },
];

// ---------------------------------------------------------------------------
// Warm packets: subsequent queries with cached state (50-200ms range)
// ---------------------------------------------------------------------------

export const warmPackets: readonly LatencyPacket[] = [
  {
    phase: "warm",
    operation: "query/impact/cached",
    start_ms: 20000,
    end_ms: 20112,
    duration_ms: 112,
  },
  {
    phase: "warm",
    operation: "lsp/hover/warm",
    start_ms: 20112,
    end_ms: 20178,
    duration_ms: 66,
  },
  {
    phase: "warm",
    operation: "policy/checkCapability/cached",
    start_ms: 20178,
    end_ms: 20240,
    duration_ms: 62,
  },
  {
    phase: "warm",
    operation: "graph/lookupSymbol",
    start_ms: 20240,
    end_ms: 20327,
    duration_ms: 87,
  },
  {
    phase: "warm",
    operation: "lsp/completion/warm",
    start_ms: 20327,
    end_ms: 20519,
    duration_ms: 192,
  },
  {
    phase: "warm",
    operation: "review/checkCached",
    start_ms: 20519,
    end_ms: 20600,
    duration_ms: 81,
  },
  {
    phase: "warm",
    operation: "agent/routeIntent",
    start_ms: 20600,
    end_ms: 20735,
    duration_ms: 135,
  },
  {
    phase: "warm",
    operation: "query/references/cached",
    start_ms: 20735,
    end_ms: 20893,
    duration_ms: 158,
  },
  {
    phase: "warm",
    operation: "orchestrator/rePlan/cached",
    start_ms: 20893,
    end_ms: 21050,
    duration_ms: 157,
  },
  {
    phase: "warm",
    operation: "verdict/recheck/cached",
    start_ms: 21050,
    end_ms: 21108,
    duration_ms: 58,
  },
];

// ---------------------------------------------------------------------------
// Incremental packets: delta updates after file change (10-80ms range)
// ---------------------------------------------------------------------------

export const incrementalPackets: readonly LatencyPacket[] = [
  {
    phase: "incremental",
    operation: "lsp/changeDocument",
    start_ms: 30000,
    end_ms: 30028,
    duration_ms: 28,
  },
  {
    phase: "incremental",
    operation: "query/impactDelta",
    start_ms: 30028,
    end_ms: 30073,
    duration_ms: 45,
  },
  {
    phase: "incremental",
    operation: "event/emit/delta",
    start_ms: 30073,
    end_ms: 30085,
    duration_ms: 12,
  },
  {
    phase: "incremental",
    operation: "graph/patchIndex",
    start_ms: 30085,
    end_ms: 30147,
    duration_ms: 62,
  },
  {
    phase: "incremental",
    operation: "lsp/diagnostics/incremental",
    start_ms: 30147,
    end_ms: 30189,
    duration_ms: 42,
  },
  {
    phase: "incremental",
    operation: "policy/revalidateDelta",
    start_ms: 30189,
    end_ms: 30225,
    duration_ms: 36,
  },
  {
    phase: "incremental",
    operation: "review/diffCheck",
    start_ms: 30225,
    end_ms: 30293,
    duration_ms: 68,
  },
  {
    phase: "incremental",
    operation: "timeline/appendDelta",
    start_ms: 30293,
    end_ms: 30311,
    duration_ms: 18,
  },
  {
    phase: "incremental",
    operation: "verdict/updateDelta",
    start_ms: 30311,
    end_ms: 30365,
    duration_ms: 54,
  },
  {
    phase: "incremental",
    operation: "orchestrator/adjustPlan",
    start_ms: 30365,
    end_ms: 30440,
    duration_ms: 75,
  },
];

// ---------------------------------------------------------------------------
// Pre-computed summary (percentiles derived from the packets above)
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computePercentiles(packets: readonly LatencyPacket[]) {
  const durations = packets.map((p) => p.duration_ms).sort((a, b) => a - b);
  return { p50: percentile(durations, 50), p99: percentile(durations, 99) };
}

const coldStats = computePercentiles(coldPackets);
const warmStats = computePercentiles(warmPackets);
const incrStats = computePercentiles(incrementalPackets);

// ---------------------------------------------------------------------------
// Full profile combining all phases
// ---------------------------------------------------------------------------

export const latencyProfile: LatencyProfile = {
  session_id: "test-session-latency-001",
  packets: [...coldPackets, ...warmPackets, ...incrementalPackets],
  summary: {
    cold_p50_ms: coldStats.p50,
    cold_p99_ms: coldStats.p99,
    warm_p50_ms: warmStats.p50,
    warm_p99_ms: warmStats.p99,
    incremental_p50_ms: incrStats.p50,
    incremental_p99_ms: incrStats.p99,
  },
};
