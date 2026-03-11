export { stripAnsi } from "./ansiStrip";
export * from "./atoms";
export type { FileTreeNode, FlatTreeEntry } from "./buildFileTree";
export { buildFileTree, filterTree, flattenTree } from "./buildFileTree";
export { writeToClipboard } from "./clipboard";
export { formatCost, formatRelativeTime, formatTokens } from "./formatters";
export { fuzzyScore } from "./fuzzyScore";
export { useAnimatedPresence } from "./hooks/useAnimatedPresence";
export { useBodyScrollLock } from "./hooks/useBodyScrollLock";
export { useClickOutside } from "./hooks/useClickOutside";
export { useControllable } from "./hooks/useControllable";
export { useElapsedTime } from "./hooks/useElapsedTime";
export { useEscapeDismiss } from "./hooks/useEscapeDismiss";
/* eslint-disable @typescript-eslint/no-deprecated -- computeFloatingPosition, FloatingPosition, FloatingPositionConfig kept for backward compat */
export {
  type Alignment,
  type AnchorRef,
  computeFloatingPosition,
  type FloatingPosition,
  type FloatingPositionConfig,
  type Placement,
  type Position,
  useFloatingPosition,
} from "./hooks/useFloatingPosition";
export { useFocusTrap } from "./hooks/useFocusTrap";
export { useMergeRefs } from "./hooks/useMergeRefs";
export { useNavigateToFile } from "./hooks/useNavigateToFile";
export { useOverlayBehavior } from "./hooks/useOverlayBehavior";
export { useOverlayStack } from "./hooks/useOverlayStack";
export {
  detectPlatform,
  HAS_TRAFFIC_LIGHTS,
  IS_MAC,
  IS_TAURI,
  type PlatformKind,
  startTauriDrag,
} from "./hooks/usePlatform";
export { PortalContainerProvider, usePortalContainer } from "./hooks/usePortalContainer";
export { type ResizeEntry, useResizeObserver } from "./hooks/useResizeObserver";
export { useScrollbarOverlay } from "./hooks/useScrollbarOverlay";
export { useXtermTerminal } from "./hooks/useXtermTerminal";
export { useKeyboardScope, useKeyboardScopeSync } from "./keyboard";
export { logger } from "./logger";
export { isAllowedOrigin } from "./messaging/validateOrigin";
export { isObject } from "./messaging/validatePayload";
export {
  buildHiddenSet,
  type ContextGroup,
  type DiffLine,
  type DiffLineType,
  findCollapsibleGroups,
  lineStyles,
  parseDiffLines,
} from "./parseDiffLines";
export { extractDirPath, extractFileName } from "./pathUtils";
export { createPerfCollector } from "./perf/perfCollector";
export { PHASE_META, type PhaseMeta } from "./phaseMeta";
export { PRIORITY_VARIANTS, STATUS_COLORS, STATUS_ICONS } from "./statusMappings";
export {
  APPEND_TEXT_STRATEGY,
  type CoalescingStrategy,
  createStreamingEngine,
} from "./streaming/streamingEngine";
export { type ExtensionHostMessage, getVscodeApi } from "./vscodeApi";
export { detectVscodeTheme, getVscodeColor } from "./vscodeTheme";
export { useDiffWorker } from "./workers/useDiffWorker";
