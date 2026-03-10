/**
 * Handler Registry
 *
 * Aggregates all domain-specific handler modules into a single
 * Map<string, Handler> used by the top-level handleMessage dispatcher.
 */
import type { AgentRule, AutoContextState, ReplaySession, SpeculativeEditState } from "../../../../shared/protocol";
import type { MockSessionState } from "../MockSessionState";

// ── Shared handler context ────────────────────────────────────

/** Mutable state bag shared across all handler modules */
export interface HandlerContext {
  state: MockSessionState;
  setState: (s: MockSessionState) => void;
  activeAbort: AbortController | null;
  setActiveAbort: (a: AbortController | null) => void;
  pendingApprovalResolve: ((approved: boolean) => void) | null;
  setPendingApprovalResolve: (r: ((approved: boolean) => void) | null) => void;
  pendingDiffResolve: ((resolution: string) => void) | null;
  setPendingDiffResolve: (r: ((resolution: string) => void) | null) => void;
  sotaState: {
    agentRules: AgentRule[];
    autoContext: AutoContextState | null;
    specEdits: SpeculativeEditState | null;
    replay: ReplaySession | null;
  };
}

/**
 * A single mock backend message handler.
 *
 * Handlers are registered by message `type` string, so `msg` is conceptually
 * narrowed to the matching ExtensionHostMessage variant at runtime. We keep
 * the parameter loosely typed here because the registry pattern dispatches
 * by string key — TypeScript can't verify the narrowing statically.
 */
 
export type Handler = (msg: any, ctx: HandlerContext) => void;

// ── Domain registrations ──────────────────────────────────────

import { registerCoreFeatureHandlers } from "./coreFeatureHandlers";
import { registerExtendedFeatureHandlers } from "./extendedFeatureHandlers";
import { registerMcpHandlers } from "./mcpHandlers";
import { registerSessionHandlers } from "./sessionHandlers";
import { registerSettingsHandlers } from "./settingsHandlers";
import { registerSotaFeatureHandlers } from "./sotaFeatureHandlers";
import { registerStreamingHandlers } from "./streamingHandlers";

export function createHandlerRegistry(): Map<string, Handler> {
  const registry = new Map<string, Handler>();
  registerStreamingHandlers(registry);
  registerSessionHandlers(registry);
  registerSettingsHandlers(registry);
  registerMcpHandlers(registry);
  registerCoreFeatureHandlers(registry);
  registerExtendedFeatureHandlers(registry);
  registerSotaFeatureHandlers(registry);
  return registry;
}
