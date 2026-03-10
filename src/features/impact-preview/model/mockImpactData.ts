import { type AffectedPath, IMPACT_PHASES,type ImpactPhase, type ImpactPhaseStatus, type ImpactResult, type ImpactScoreCard, type ImpactSeverity } from "./impactPreviewAtoms";

// ─── Helpers ────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

// ─── Mock Affected Paths ────────────────────────────────

const MOCK_SYMBOLS: { symbolName: string; filePath: string; line: number }[] = [
  { symbolName: "LoginController.handle()", filePath: "auth/ctrl.ts", line: 34 },
  { symbolName: "SessionManager.refresh()", filePath: "session/mgr.ts", line: 89 },
  { symbolName: "TokenValidator.verify()", filePath: "auth/token.ts", line: 12 },
  { symbolName: "UserRepository.findById()", filePath: "users/repo.ts", line: 45 },
  { symbolName: "PasswordHasher.compare()", filePath: "auth/hash.ts", line: 23 },
  { symbolName: "RateLimiter.check()", filePath: "middleware/rate.ts", line: 67 },
  { symbolName: "AuditLogger.record()", filePath: "audit/logger.ts", line: 101 },
  { symbolName: "NotificationService.send()", filePath: "notify/service.ts", line: 55 },
  { symbolName: "CacheManager.invalidate()", filePath: "cache/mgr.ts", line: 78 },
  { symbolName: "MetricsCollector.track()", filePath: "metrics/collector.ts", line: 33 },
  { symbolName: "FeatureFlagService.isEnabled()", filePath: "flags/service.ts", line: 19 },
  { symbolName: "ErrorHandler.wrap()", filePath: "errors/handler.ts", line: 41 },
  { symbolName: "ConfigLoader.get()", filePath: "config/loader.ts", line: 8 },
  { symbolName: "DatabasePool.acquire()", filePath: "db/pool.ts", line: 92 },
  { symbolName: "HealthCheck.run()", filePath: "health/check.ts", line: 15 },
];

function generateAffectedPaths(): AffectedPath[] {
  const count = randInt(5, 15);
  const shuffled = [...MOCK_SYMBOLS].sort(() => Math.random() - 0.5).slice(0, count);

  return shuffled.map((s, i) => ({
    ...s,
    relationship: i < Math.ceil(count * 0.6) ? "direct" : "transitive",
    description: i % 3 === 0 ? `Calls target via ${pick(["method invocation", "interface dispatch", "event handler"])}` : undefined,
  }));
}

function breakingChangesSeverity(count: number): ImpactSeverity {
  if (count === 0) return "safe";
  if (count >= 2) return "high";
  return "moderate";
}

function generateScoreCards(): ImpactScoreCard[] {
  const callSites = randInt(20, 50);
  const breakingChanges = randInt(0, 3);
  const latencySev: ImpactSeverity = pick(["safe", "low"]);
  const securitySev: ImpactSeverity = pick(["safe", "safe", "low"]);

  return [
    {
      label: "Call Sites",
      value: callSites,
      severity: callSites > 40 ? "moderate" : "safe",
      detail: `${callSites} call sites, ${callSites > 40 ? "review recommended" : "all safe"}`,
    },
    {
      label: "Breaking Changes",
      value: breakingChanges,
      severity: breakingChangesSeverity(breakingChanges),
      detail: breakingChanges === 0 ? "No breaking changes" : `${breakingChanges} breaking change${breakingChanges > 1 ? "s" : ""} detected`,
    },
    {
      label: "Latency Risk",
      value: latencySev === "safe" ? 0 : 1,
      severity: latencySev,
      detail: latencySev === "safe" ? "No latency impact" : "Minor latency increase possible",
    },
    {
      label: "Security Risk",
      value: securitySev === "safe" ? 0 : 1,
      severity: securitySev,
      detail: securitySev === "safe" ? "No security concerns" : "Low-risk pattern detected",
    },
  ];
}

function generateResult(): ImpactResult {
  const scoreCards = generateScoreCards();
  const affectedPaths = generateAffectedPaths();
  const total = randInt(12, 20);
  const covered = Math.min(total, randInt(Math.floor(total * 0.8), total));
  const percentage = Math.round((covered / total) * 100);

  const severities: ImpactSeverity[] = scoreCards.map((c) => c.severity);
  let overallRisk: ImpactSeverity = "safe";
  if (severities.includes("high")) overallRisk = "high";
  else if (severities.includes("moderate")) overallRisk = "moderate";
  else if (severities.includes("low")) overallRisk = "low";

  return {
    targetSymbol: "AuthService.login()",
    targetFile: "src/services/auth/AuthService.ts",
    scoreCards,
    affectedPaths,
    testCoverage: { covered, total, percentage },
    overallRisk,
    confidence: +(0.7 + Math.random() * 0.25).toFixed(2),
  };
}

// ─── Simulation Entry Point ─────────────────────────────

export interface ImpactAnalysisDispatch {
  setPhases: (phases: Record<ImpactPhase, ImpactPhaseStatus>) => void;
  setResult: (result: ImpactResult) => void;
}

export function simulateImpactAnalysis(dispatch: ImpactAnalysisDispatch): void {
  const phases: Record<ImpactPhase, ImpactPhaseStatus> = {
    "static-analysis": "pending",
    "call-graph": "pending",
    "data-flow": "pending",
    security: "pending",
    performance: "pending",
  };

  let currentIndex = 0;

  function advancePhase(): void {
    if (currentIndex >= IMPACT_PHASES.length) {
      // All phases done — set result
      dispatch.setResult(generateResult());
      return;
    }

    const phase = IMPACT_PHASES[currentIndex];
    if (phase === undefined) return;

    // Mark current phase as running
    phases[phase] = "running";
    dispatch.setPhases({ ...phases });

    // After delay, mark done and advance
    setTimeout(() => {
      phases[phase] = "done";
      dispatch.setPhases({ ...phases });
      currentIndex++;
      advancePhase();
    }, 800);
  }

  advancePhase();
}
