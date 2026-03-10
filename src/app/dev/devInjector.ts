/**
 * Dev injector — thin orchestrator that composes seeders and scenarios.
 *
 * Usage from browser console:
 *   __dev.seedAll()        — instantly seed ALL features with test data
 *   __dev.streamTurn(5)    — 5 second simulated turn
 *   __dev.stream1000cps(30) — 30 seconds of 1000 chars/sec streaming
 *   __dev.sim.bugfix()     — pipeline bugfix scenario
 *   __dev.sim.help()       — show all available scenarios
 */

// Defense-in-depth: ensure devInjector never runs in production
if (import.meta.env.PROD) {
  throw new Error("[devInjector] Must not be loaded in production builds");
}

// ─── Seeders ────────────────────────────────────────────────────
// ─── Scenarios & Simulations ────────────────────────────────────
import {
  simBugfix,
  simDangerous,
  simFeature,
  simHelp,
  simReset,
  simScenarioAgents,
  simScenarioArena,
  simScenarioBrowser,
  simScenarioBugfix,
  simScenarioChatStream,
  simScenarioCleanupHitl,
  simScenarioCodingOS,
  simScenarioCoreState,
  simScenarioDangerous,
  simScenarioFeature,
  simScenarioGitCommits,
  simScenarioIndex,
  simScenarioMcp,
  simScenarioMemory,
  simScenarioMultiAgent,
  simScenarioP0,
  simScenarioP1,
  simScenarioP2,
  simScenarioPanels,
  simScenarioRemote,
  simScenarioReseed,
  simScenarioReviewComments,
  simScenarioReviewDiff,
  simScenarioSessionOps,
  simScenarioSota,
  simScenarioTodoPlan,
  simScenarioToolApproval,
  simStep,
  simulateAgents,
  simulateArena,
  simulateBrowser,
  simulateGitCommits,
  simulateIndex,
  simulateMcp,
  simulateMemory,
  simulateRemote,
  simulateReview,
  stream1000cps,
  streamTurn,
} from "./scenarios";
import { seedFeatures, seedSession, seedUiState } from "./seeders";

// ─── Orchestrator ───────────────────────────────────────────────

function createDevInjector() {
  /**
   * Instantly populate ALL features with test data.
   * Delegates to domain-specific seeders.
   */
  function seedAll() {
    const { t1, t2: turnTwo, t1Files } = seedSession();
    seedFeatures(t1, turnTwo, t1Files);
    seedUiState(t1);
    // eslint-disable-next-line no-console
    console.log("[dev] seedAll() complete — 4 turns, all features populated (including P0/P1/P2 + SOTA)");
  }

  const sim = {
    // Pipeline
    bugfix: simBugfix,
    feature: simFeature,
    dangerous: simDangerous,
    scenarioBugfix: simScenarioBugfix,
    scenarioFeature: simScenarioFeature,
    scenarioDangerous: simScenarioDangerous,
    reset: simReset,
    step: simStep,
    help: simHelp,
    // Gap-coverage
    scenarioToolApproval: simScenarioToolApproval,
    scenarioSessionOps: simScenarioSessionOps,
    scenarioTodoPlan: simScenarioTodoPlan,
    scenarioReviewDiff: simScenarioReviewDiff,
    scenarioCleanupHitl: simScenarioCleanupHitl,
    // Simulate wrappers
    scenarioAgents: simScenarioAgents,
    scenarioMcp: simScenarioMcp,
    scenarioBrowser: simScenarioBrowser,
    scenarioMemory: simScenarioMemory,
    scenarioArena: simScenarioArena,
    scenarioGitCommits: simScenarioGitCommits,
    scenarioRemote: simScenarioRemote,
    scenarioIndex: simScenarioIndex,
    scenarioChatStream: simScenarioChatStream,
    scenarioReviewComments: simScenarioReviewComments,
    // Tier
    scenarioP0: simScenarioP0,
    scenarioP1: simScenarioP1,
    scenarioP2: simScenarioP2,
    scenarioSota: simScenarioSota,
    // Bulk
    scenarioCoreState: simScenarioCoreState,
    scenarioPanels: simScenarioPanels,
    scenarioReseed: simScenarioReseed,
    // Multi-Agent
    scenarioMultiAgent: simScenarioMultiAgent,
    // Coding OS
    scenarioCodingOS: simScenarioCodingOS,
  };

  return {
    seedAll,
    streamTurn,
    stream1000cps,
    simulateAgents,
    simulateIndex,
    simulateMcp,
    simulateBrowser,
    simulateMemory,
    simulateArena,
    simulateGitCommits,
    simulateReview,
    simulateRemote,
    sim,
  };
}

const devInjector = createDevInjector();
(window as unknown as Record<string, unknown>).__dev = devInjector;

export { devInjector };
