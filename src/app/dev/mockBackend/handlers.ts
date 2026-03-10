/**
 * Mock Backend Message Handlers — Thin Orchestrator
 *
 * Routes ExtensionHostMessage to the appropriate domain handler
 * via a registry pattern. All actual handler logic lives in
 * the `handlers/` subdirectory, organized by domain:
 *
 * - streamingHandlers   — Core conversation (SEND_MESSAGE, STOP_AGENT, approvals)
 * - sessionHandlers     — Session lifecycle (NEW_SESSION, RESUME_SESSION, etc.)
 * - settingsHandlers    — Settings (SWITCH_MODEL, thinking/fast mode)
 * - mcpHandlers         — MCP server management
 * - coreFeatureHandlers — Bookmarks, memory, templates, todos, diffs, checkpoints
 * - extendedFeatureHandlers — Arena, git, share, agents, review, browser, voice, etc.
 * - sotaFeatureHandlers — Agent rules, speculative edits, debate, replay, etc.
 */
import type { ExtensionHostMessage } from "../../../shared/lib/vscodeApi";
import type { AgentRule, AutoContextState, ReplaySession, SpeculativeEditState } from "../../../shared/protocol";
import { createHandlerRegistry, type HandlerContext } from "./handlers/index";
import { createMockSessionState, type MockSessionState } from "./MockSessionState";

// ── Module-level mutable state ────────────────────────────────

/** Active abort controller for current streaming turn */
let activeAbort: AbortController | null = null;

/** Session state */
let state: MockSessionState = createMockSessionState();

/** Pending approval resolve callback */
let pendingApprovalResolve: ((approved: boolean) => void) | null = null;

/** Pending three-way diff resolve callback */
let pendingDiffResolve: ((resolution: string) => void) | null = null;

/** SOTA state — survives across handler calls for stateful interactions */
const sotaState: HandlerContext["sotaState"] = {
  agentRules: [
    { id: "rule-1", title: "Use TypeScript strict mode", content: "Always enable strictNullChecks", source: "file", file_path: ".cursorrules", status: "active", violation_count: 0 },
    { id: "rule-2", title: "No console.log in production", content: "Remove all console.log statements", source: "user", status: "active", violation_count: 2 },
    { id: "rule-3", title: "Prefer named exports", content: "Use named exports over default exports", source: "team", status: "active", violation_count: 0 },
    { id: "rule-4", title: "Max function length 50 lines", content: "Keep functions under 50 lines", source: "auto_detected", status: "disabled", violation_count: 1 },
  ] as AgentRule[],
  autoContext: null as AutoContextState | null,
  specEdits: null as SpeculativeEditState | null,
  replay: null as ReplaySession | null,
};

// ── Handler Registry (built once) ─────────────────────────────

const registry = createHandlerRegistry();

// ── Context builder ───────────────────────────────────────────

function buildHandlerContext(): HandlerContext {
  return {
    state,
    setState: (s: MockSessionState) => { state = s; },
    activeAbort,
    setActiveAbort: (a: AbortController | null) => { activeAbort = a; },
    pendingApprovalResolve,
    setPendingApprovalResolve: (r: ((approved: boolean) => void) | null) => { pendingApprovalResolve = r; },
    pendingDiffResolve,
    setPendingDiffResolve: (r: ((resolution: string) => void) | null) => { pendingDiffResolve = r; },
    sotaState,
  };
}

// ── Main dispatcher ───────────────────────────────────────────

/**
 * Main handler — routes a message from the frontend to the
 * appropriate domain handler via the registry.
 */
export function handleMessage(msg: ExtensionHostMessage): void {
  const handler = registry.get(msg.type);
  if (handler) {
    handler(msg, buildHandlerContext());
  } else {
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] unhandled: ${(msg as { type: string }).type}`);
  }
}

/** Expose state for console debugging */
export function getState(): MockSessionState {
  return state;
}
