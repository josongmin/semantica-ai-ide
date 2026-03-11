/**
 * Central manifest of all bootstrap features.
 *
 * Each feature is registered via `registerBootstrapFeature()` at module
 * scope.  This file is imported for its side effects by useFeatureBootstrap.
 *
 * Priority (descending): higher number runs first.
 * Streaming commit is highest because every other sync hook depends on
 * the postMessage -> Jotai bridge being active.
 */

// ── View self-registration (side-effect imports) ─────────────
import "~shared/views/explorer";
import "~shared/views/search";
import "~shared/views/symbols";
import "~shared/views/findings";
import "~shared/views/problems";
import "~shared/views/output";
import "~shared/views/debug";
import "~shared/views/terminal";
import "~shared/views/tasks";
import "~shared/views/log";
import "~shared/views/event-log";
// ── Surface self-registration (side-effect imports) ──────────────────
import "~domains/chat";
import "~domains/editor";
import "~domains/review";
import "~domains/replay";
import "~domains/agent";
import "~domains/graph";
import "~domains/orchestrator";
import "~domains/code";
import "~domains/overview";
import "~domains/reasoning";
import "~domains/tasks";
import "~domains/timeline";
import "~domains/agents";
import "~domains/settings";

import { useHydrateApprovalAdapter } from "~shared/bootstrap/approval-gate";
import { useBackgroundAgentSync } from "~shared/bootstrap/background-agent";
import { useHydrateDiffReviewAdapter } from "~shared/bootstrap/diff-review";
import { useIntentSync } from "~shared/bootstrap/intent-tracking";
import { useHydrateKeyboardNavAdapter } from "~shared/bootstrap/keyboard-navigation";
import { useResourceMonitorSync } from "~shared/bootstrap/resource-monitor";
import { useHydrateScopeGuardAdapter } from "~shared/bootstrap/scope-guard";
import { useSemanticDiffSync } from "~shared/bootstrap/semantic-diff";
import { useHydrateSendMessageAdapter } from "~shared/bootstrap/send-message";
import { useSessionRestore } from "~shared/bootstrap/session-lifecycle";
import { useSessionShortcuts } from "~shared/bootstrap/session-shortcuts";
import { useHydrateSlashCommandAdapter } from "~shared/bootstrap/slash-command";
import { useTerminalBootstrap } from "~shared/bootstrap/terminal";
import { useTerminalBridgeSync } from "~shared/bootstrap/terminal-bridge";
import { useThemeApplicator } from "~shared/bootstrap/theme-settings";
import { useTransactionSync } from "~shared/bootstrap/transactional-edit";
import { useHydrateWorkspaceAdapter } from "~shared/bootstrap/workspace-awareness";
import { useWorkspaceGraphSync } from "~shared/bootstrap/workspace-graph";

import { useStreamingCommit } from "./event-dispatch";
import { registerBootstrapFeature } from "./featureRegistry";

// ── Register all bootstrap features (side-effect) ───────────────────
// To add a new feature: append a registerBootstrapFeature() call below.
// No other file needs to change (OCP).

registerBootstrapFeature({ name: "streaming-commit", hook: useStreamingCommit, priority: 100 });
registerBootstrapFeature({ name: "session-restore", hook: useSessionRestore, priority: 90 });
registerBootstrapFeature({ name: "theme-applicator", hook: useThemeApplicator, priority: 80 });
registerBootstrapFeature({ name: "session-shortcuts", hook: useSessionShortcuts, priority: 0 });
registerBootstrapFeature({
  name: "background-agent-sync",
  hook: useBackgroundAgentSync,
  priority: 0,
});
registerBootstrapFeature({
  name: "terminal-bridge-sync",
  hook: useTerminalBridgeSync,
  priority: 0,
});
registerBootstrapFeature({ name: "terminal-bootstrap", hook: useTerminalBootstrap, priority: 0 });
registerBootstrapFeature({
  name: "workspace-graph-sync",
  hook: useWorkspaceGraphSync,
  priority: 0,
});
registerBootstrapFeature({
  name: "resource-monitor-sync",
  hook: useResourceMonitorSync,
  priority: 0,
});
registerBootstrapFeature({ name: "intent-sync", hook: useIntentSync, priority: 0 });
registerBootstrapFeature({ name: "semantic-diff-sync", hook: useSemanticDiffSync, priority: 0 });
registerBootstrapFeature({ name: "transaction-sync", hook: useTransactionSync, priority: 0 });

// ── Hydrate adapters (run after main features) ──────────────────────
registerBootstrapFeature({
  name: "hydrate-approval",
  hook: useHydrateApprovalAdapter,
  priority: -200,
});
registerBootstrapFeature({
  name: "hydrate-workspace",
  hook: useHydrateWorkspaceAdapter,
  priority: -200,
});
registerBootstrapFeature({
  name: "hydrate-send-message",
  hook: useHydrateSendMessageAdapter,
  priority: -200,
});
registerBootstrapFeature({
  name: "hydrate-scope-guard",
  hook: useHydrateScopeGuardAdapter,
  priority: -210,
});
registerBootstrapFeature({
  name: "hydrate-diff-review",
  hook: useHydrateDiffReviewAdapter,
  priority: -220,
});
registerBootstrapFeature({
  name: "hydrate-slash-command",
  hook: useHydrateSlashCommandAdapter,
  priority: -230,
});
registerBootstrapFeature({
  name: "hydrate-keyboard-nav",
  hook: useHydrateKeyboardNavAdapter,
  priority: -240,
});
