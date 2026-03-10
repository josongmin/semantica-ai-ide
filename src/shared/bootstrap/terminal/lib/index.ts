export {
  approveCommand,
  cancelAgentExec,
  createSession,
  execAgentCommand,
  getCommands,
  getExecution,
  getSessions,
  initTerminalBridge,
  isTerminalBridgeReady,
  killSession,
  resizePty,
  writeToPty,
} from "./tauriTerminalBridge";
export { useTerminalBootstrap } from "./useTerminalBootstrap";
export { getTerminalListenFn, initTerminalEventListener, useTerminalEventListener } from "./useTerminalEventListener";
export { buildXtermTheme } from "./xtermTheme";

// Phase B — Cross-surface intents, block navigation, AI
export { blockToMarkdown, buildSummaryText, copyCommandText, exportBlockAsJSON, exportBlockAsMarkdown } from "./blockExport";
export { parseFileReference,resolveFilePath } from "./resolveFilePath";
export { useAICommandSuggest } from "./useAICommandSuggest";
export { useAIExplain } from "./useAIExplain";
export type { AIGhostTextActions } from "./useAIGhostText";
export { useAIGhostText } from "./useAIGhostText";
export type { BlockNavigationActions,BlockNavigationState } from "./useBlockNavigation";
export { useBlockNavigation } from "./useBlockNavigation";
export { useGhostText } from "./useGhostText";
export { registerTerminalIntentHandler,useTerminalIntentDispatch } from "./useTerminalIntentDispatch";
export { useTerminalIntentReceiver } from "./useTerminalIntentReceiver";
export { useTerminalKeyboard } from "./useTerminalKeyboard";

// Phase C — Block export, problems panel sync
export { syncDiagnosticsToProblems } from "./problemsPanelSync";
export { useTerminalProblemsSync } from "./useTerminalProblemsSync";

// Phase C — FE fallback parsers (Cargo, Python)
export { detectParser, parseBlock, parseLine } from "./parsers";
export { parseCargoBlock, parseCargoLine } from "./parsers/cargoParser";
export { parsePythonBlock, parsePythonLine } from "./parsers/pythonParser";
export { useFEParserFallback } from "./useFEParserFallback";

// Phase C — Workflow engine
export { BUILTIN_WORKFLOWS, createExecution, evaluateCondition, interpolateTemplate, resolveSteps, validateParams } from "./workflowEngine";

// Phase C — User plugin parsers (TOML config)
export type { PluginParserConfig, PluginParserRule } from "./pluginParser";
export { loadPluginConfig, matchPluginRule, parseToml, runPluginParsers } from "./pluginParser";
export { usePluginParserSync } from "./usePluginParserSync";
