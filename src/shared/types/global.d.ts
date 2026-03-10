import type { TurnId } from "../protocol";

type PipelineStage =
  | "input_gate"
  | "fail_closed"
  | "strategy"
  | "validation"
  | "evidence"
  | "verdict"
  | "risk_heatmap"
  | "side_effect"
  | "drift_guard";

/** Dev-mode pipeline scenario simulator */
interface DevSimulator {
  bugfix(turnId?: TurnId): Promise<void>;
  feature(turnId?: TurnId): Promise<void>;
  dangerous(turnId?: TurnId): Promise<void>;
  scenarioBugfix(): Promise<void>;
  scenarioFeature(): Promise<void>;
  scenarioDangerous(): Promise<void>;
  scenarioToolApproval(): Promise<void>;
  scenarioSessionOps(): Promise<void>;
  scenarioTodoPlan(): Promise<void>;
  scenarioReviewDiff(): Promise<void>;
  scenarioCleanupHitl(): Promise<void>;
  scenarioAgents(): Promise<void>;
  scenarioMcp(): Promise<void>;
  scenarioBrowser(): Promise<void>;
  scenarioMemory(): Promise<void>;
  scenarioArena(): Promise<void>;
  scenarioGitCommits(): Promise<void>;
  scenarioRemote(): Promise<void>;
  scenarioIndex(): Promise<void>;
  scenarioChatStream(): Promise<void>;
  scenarioReviewComments(): Promise<void>;
  scenarioP0(): Promise<void>;
  scenarioP1(): Promise<void>;
  scenarioP2(): Promise<void>;
  scenarioSota(): Promise<void>;
  scenarioCoreState(): Promise<void>;
  scenarioPanels(): Promise<void>;
  scenarioReseed(): Promise<void>;
  scenarioMultiAgent(): Promise<void>;
  scenarioCodingOS(): Promise<void>;
  reset(turnId: TurnId): void;
  step(stage: PipelineStage, variant?: "pass" | "fail", turnId?: TurnId): void;
  help(): void;
}

/** Dev-mode globals injected by devInjector */
interface DevGlobals {
  seedAll(): void;
  streamTurn(durationSec?: number): Promise<void>;
  stream1000cps(durationSec?: number): Promise<void>;
  simulateAgents(): void;
  simulateIndex(): void;
  simulateMcp(): void;
  simulateBrowser(): void;
  simulateMemory(): void;
  simulateArena(): Promise<void>;
  simulateGitCommits(): void;
  simulateReview(): void;
  simulateRemote(): void;
  sim: DevSimulator;
}

declare global {
  interface Window {
    __dev?: DevGlobals;
  }
}

export {};
