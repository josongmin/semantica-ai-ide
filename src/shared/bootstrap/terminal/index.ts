/**
 * Terminal Feature — Public API
 *
 * Implements the Semantica DevOS terminal system per RFC-TERMINAL-010~014.
 * Phase A: PTY viewport, session management, compatibility fallback.
 * Phase B: Hybrid UX — blocks, rail, overlay, search, parsed decorations.
 */

import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

// ── View self-registration ───────────────────────────────────
registerView({
  id: "terminal",
  kind: "panel",
  title: "Terminal",
  icon: "terminal",
  frames: ["tray", "floating"],
  defaultFrame: "floating",
  shortcut: "Cmd+`",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 30,
  component: lazy(() =>
    import("./ui/TerminalPanel").then((m) => ({
      default: m.TerminalView,
    })),
  ),
});

// Model (types, events, atoms)
export {
  activeSessionCommandsAtom,
  activeSessionCompatibilityAtom,
  activeSessionOverlayEnabledAtom,
  activeTerminalSessionAtom,
  activeTerminalSessionIdAtom,
  agentTerminalExecutionMapAtom,
  appendParsedEventAtom,
  appendTerminalCommandAtom,
  dequeueApprovalAtom,
  enqueueApprovalAtom,
  markSessionExitedAtom,
  removeTerminalSessionAtom,
  resetTerminalStoreAtom,
  runningSessionCountAtom,
  storeAgentExecutionResultAtom,
  terminalApprovalQueueAtom,
  terminalCommandMapAtom,
  terminalCompatibilityMapAtom,
  terminalModeAtom,
  // Overlay & Approval
  terminalOverlayStateMapAtom,
  terminalPanelVisibleAtom,
  terminalParsedEventMapAtom,
  // Derived
  terminalSessionListAtom,
  // Core state
  terminalSessionMapAtom,
  terminalTaskStateMapAtom,
  terminalUIStateAtom,
  updateCompatibilityAtom,
  updateOverlayStateAtom,
  updateSessionCwdAtom,
  updateSessionModeAtom,
  updateTaskStateAtom,
  updateTerminalCommandAtom,
  // Write
  upsertTerminalSessionAtom,
} from "./model/atoms";
export type { TerminalEventMap, TerminalEventName } from "./model/events";
export { TERMINAL_EVENTS } from "./model/events";
export type {
  AgentTerminalExecRequest,
  AgentTerminalExecResponse,
  AgentTerminalExecutionResult,
  ApprovalRequiredPayload,
  CommandProvenance,
  CompatibilityState,
  DiagnosticEvent,
  ExecutionState,
  FileLinkEvent,
  OverlayModeChangedPayload,
  ParsedEventKind,
  ParsedTerminalEvent,
  PortBindingEvent,
  ProgressEvent,
  SessionProvenance,
  SummaryEvent,
  TaskLifecycleEvent,
  TerminalCommand,
  TerminalMode,
  TerminalSessionMeta,
  TerminalTaskState,
  TerminalUIState,
  TestResultEvent,
  UrlEvent,
} from "./model/types";

// Lib (bridge, theme, event listener)
export {
  approveCommand,
  buildXtermTheme,
  cancelAgentExec,
  createSession,
  execAgentCommand,
  getCommands,
  getExecution,
  getSessions,
  getTerminalListenFn,
  initTerminalBridge,
  initTerminalEventListener,
  isTerminalBridgeReady,
  killSession,
  resizePty,
  useTerminalEventListener,
  writeToPty,
} from "./lib";

// Lib — bootstrap
export { useTerminalBootstrap } from "./lib";

// Lib — Phase B (cross-surface intents, block navigation, AI)
export type { BlockNavigationActions,BlockNavigationState } from "./lib";
export {
  blockToMarkdown,
  buildSummaryText,
  copyCommandText,
  parseFileReference,
  registerTerminalIntentHandler,
  resolveFilePath,
  useBlockNavigation,
  useGhostText,
  useTerminalIntentDispatch,
  useTerminalIntentReceiver,
  useTerminalKeyboard,
} from "./lib";

// Lib — Phase C (block export, problems panel sync, FE parsers, workflows)
export { exportBlockAsJSON, exportBlockAsMarkdown, syncDiagnosticsToProblems, useTerminalProblemsSync } from "./lib";
export { BUILTIN_WORKFLOWS, createExecution, interpolateTemplate, resolveSteps, useFEParserFallback, validateParams } from "./lib";
export { detectParser, parseBlock, parseLine } from "./lib";

// Model — Phase C (workflow atoms, types)
export type {
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowParam,
  WorkflowStep,
  WorkflowStepState,
  WorkflowStepStatus,
  WorkflowTemplate,
} from "./model/workflowTypes";
// Model — Phase C (plugin parser atoms)
export type { PluginParserConfig, PluginParserRule } from "./lib";
export { loadPluginConfig, parseToml, runPluginParsers, usePluginParserSync } from "./lib";
export {
  pluginParserConfigsAtom,
  pluginParserNamesAtom,
  removePluginParserAtom,
  upsertPluginParserAtom,
} from "./model/pluginParserAtoms";
export {
  activeWorkflowExecutionAtom,
  advanceWorkflowStepAtom,
  completeWorkflowAtom,
  registerWorkflowAtom,
  removeWorkflowAtom,
  updateWorkflowStepAtom,
  workflowHistoryAtom,
  workflowTemplatesAtom,
} from "./model/workflowAtoms";

// Model — Phase B (intent types, AI atoms)
export {
  dismissAgentAttachmentAtom,
  terminalAgentAttachmentAtom,
} from "./model/agentBridgeAtoms";
export type {
  AICommandInputState,
  ExplainState,
  GhostTextState,
  TerminalAIContext,
} from "./model/aiAtoms";
export {
  dismissExplainAtom,
  hideAICommandInputAtom,
  showAICommandInputAtom,
  terminalAICommandInputAtom,
  terminalAIContextAtom,
  terminalExplainAtom,
  terminalGhostTextAtom,
} from "./model/aiAtoms";
export type {
  AskAgentPayload,
  CopyToEditorPayload,
  OpenFilePayload,
  OpenProblemsPayload,
  RevealTerminalPayload,
  SurfaceIntent,
  SurfaceSource,
  TerminalBlockAttachment,
  TerminalIntent,
} from "./model/intentTypes";

// UI — Phase A
export type { TerminalSessionTabsProps,TerminalViewportRawProps } from "./ui";
export { TerminalSessionTabs,TerminalViewportRaw } from "./ui";

// UI — Phase B
export type {
  AICommandInputProps,
  AIExplainPopoverProps,
  AIGhostTextProps,
  BlockActionsProps,
  BlockOutlineProps,
  BlockSummaryFooterProps,
  CommandBlockProps,
  CommandRailProps,
  JumpToBottomProps,
  OverlayRootProps,
  ParsedEventDecorationProps,
  SearchOptions,
  StickyCommandHeaderProps,
  TerminalBlockAttachPreviewProps,
  TerminalPanelProps,
  TerminalSearchOverlayProps,
  TerminalViewProps,
} from "./ui";
export {
  BlockActions,
  BlockOutline,
  BlockSummaryFooter,
  CommandBlock,
  CommandRail,
  DiagnosticChip,
  FileLinkChip,
  JumpToBottom,
  OverlayRoot,
  ParsedEventDecoration,
  PortBindingChip,
  StickyCommandHeader,
  TerminalBlockAttachPreview,
  TerminalPanel,
  TerminalSearchOverlay,
  TerminalSettings,
  TerminalView,
  TestResultChip,
  UrlChip,
} from "./ui";
export {
  AICommandInput,
  AIExplainPopover,
  AIGhostText,
} from "./ui";

// UI — Phase C (workflow panel)
export type { WorkflowPanelProps } from "./ui";
export { WorkflowPanel } from "./ui";
