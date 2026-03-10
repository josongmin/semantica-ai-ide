/**
 * Shared-layer atom barrel.
 *
 * FSD compliance: Entity atoms are imported directly from their entity modules.
 * This barrel only exports atoms defined in the shared layer (no entity deps).
 */

// ─── Atom factories ─────────────────────────────────────────
export { createPushAtomSet } from "./createPushAtomSet";
export { createStateAtomSet } from "./createStateAtomSet";

// ─── Settings persistence (localStorage) ────────────────────
export type { UserSettings } from "./settingsStorage";
export { resetSettingsAtom, updateSettingsAtom, userSettingsAtom } from "./settingsStorage";

// ─── Session persistence atoms ───────────────────────────────
export {
  persistedSessionIdAtom,
  persistSessionIdAtom,
  restorePersistedSessionAtom,
} from "./sessionPersistenceAtoms";

// Bookmarks
export type { BookmarkFilter } from "./bookmarkAtoms";
export {
  bookmarkDrawerOpenAtom,
  bookmarkedTurnIdsAtom,
  bookmarkFilterAtom,
  bookmarkLabelsAtom,
  resetBookmarkStoreAtom,
  toggleBookmarkAtom,
} from "./bookmarkAtoms";

// Quotes
export type { PendingQuote } from "./quoteAtoms";
export { clearPendingQuoteAtom, pendingQuoteAtom, setPendingQuoteAtom } from "./quoteAtoms";

// ─── Shared-layer atoms (split by concern) ──────────────────

// Attachments
export {
  addAttachmentAtom,
  clearAttachmentsAtom,
  pendingAttachmentsAtom,
  removeAttachmentAtom,
  resetAttachmentAtomsAtom,
} from "./attachmentAtoms";

// Overlay stack
export type { OverlayEntry, OverlayId, OverlayType } from "./overlayAtoms";
export {
  overlayStackAtom,
  popOverlayAtom,
  pushOverlayAtom,
  resetOverlayAtomsAtom,
  topOverlayAtom,
} from "./overlayAtoms";

// Toast stack
export type { ToastData, ToastVariant } from "./toastAtoms";
export { dismissToastAtom, pushToastAtom, resetToastAtomsAtom, toastStackAtom } from "./toastAtoms";

// Progress tracking
export type { ProgressItem } from "./progressAtoms";
export {
  progressItemFamily,
  progressKeysAtom,
  removeProgressAtom,
  resetProgressStoreAtom,
  setProgressAtom,
} from "./progressAtoms";

// Dialog / modal visibility
export {
  activityFeedVisibleAtom,
  codeBlockPickerOpenAtom,
  commitGenDialogOpenAtom,
  conversationSearchOpenAtom,
  demoModalOpenAtom,
  keyboardShortcutsOpenAtom,
  mcpRegistryOpenAtom,
  modeGalleryOpenAtom,
  playbookMarketOpenAtom,
  rewindPanelOpenAtom,
} from "./dialogAtoms";

// Feature sheet (mutex bottom-sheet controller)
export type { FeatureSheetId } from "./featureSheetAtoms";
export { activeFeatureSheetAtom, toggleFeatureSheetAtom } from "./featureSheetAtoms";

// Panel visibility toggles
export {
  agentsPanelVisibleAtom,
  backgroundJobsPanelVisibleAtom,
  bgAgentsPanelVisibleAtom,
  browserPanelVisibleAtom,
  compactionPanelVisibleAtom,
  deepWikiPanelVisibleAtom,
  gitPanelVisibleAtom,
  graphPanelVisibleAtom,
  intentPanelVisibleAtom,
  livePreviewPanelVisibleAtom,
  mcpPanelVisibleAtom,
  memoryPanelVisibleAtom,
  missionControlPanelVisibleAtom,
  multiAgentReviewPanelVisibleAtom,
  pipelineGlobalVisibleAtom,
  remotePanelVisibleAtom,
  resetPanelAtomsAtom,
  resourcesPanelVisibleAtom,
  reviewChangesPanelVisibleAtom,
  reviewExpandedFileAtom,
  reviewSearchQueryAtom,
  scratchpadPanelVisibleAtom,
  searchPanelVisibleAtom,
  snapshotsPanelVisibleAtom,
  teamPanelVisibleAtom,
  terminalPanelVisibleAtom,
  threeModelPanelVisibleAtom,
  ticketLinkPanelVisibleAtom,
  usageDashboardPanelVisibleAtom,
  watchModePanelVisibleAtom,
  workspaceAwarenessPanelVisibleAtom,
} from "./panelAtoms";

// Session tabs
export type { SessionTab } from "./sessionTabAtoms";
export {
  activeTabAtom,
  activeTabIdAtom,
  closeAllTabsAtom,
  closeOtherTabsAtom,
  closeTabAtom,
  isSessionPinnedAtom,
  newTabAtom,
  openSessionTabAtom,
  openTabsAtom,
  pinnedSessionIdsAtom,
  reorderTabsAtom,
  resetTabsAtom,
  sessionSidebarOpenAtom,
  sessionSwitcherOpenAtom,
  switchTabByIndexAtom,
  togglePinSessionAtom,
  turnTocOpenAtom,
  updateTabMetaAtom,
} from "./sessionTabAtoms";

// ─── Feature adapter atoms (DIP inversion layer) ────────────────────
export type { ApprovalGateAdapter } from "./approvalAdapterAtoms";
export { approvalGateAdapterAtom } from "./approvalAdapterAtoms";
export type { DiffReviewAdapter } from "./diffReviewAdapterAtoms";
export { diffReviewAdapterAtom } from "./diffReviewAdapterAtoms";
export type { KeyboardNavAdapter } from "./keyboardNavAdapterAtoms";
export {
  COPY_CONVERSATION_EVENT,
  FOCUS_PROMPT_EVENT,
  keyboardNavAdapterAtom,
  OPEN_COMMAND_PALETTE_EVENT,
} from "./keyboardNavAdapterAtoms";
export type { ScopeGuardAdapter } from "./scopeGuardAdapterAtoms";
export { scopeGuardAdapterAtom } from "./scopeGuardAdapterAtoms";
export type { QueuedMessage, SendMessageAdapter } from "./sendMessageAdapterAtoms";
export { sendMessageAdapterAtom } from "./sendMessageAdapterAtoms";
export type {
  ArgSuggestion as AdapterArgSuggestion,
  CommandArgDef as AdapterCommandArgDef,
  CommandGroup as AdapterCommandGroup,
  CommandMatch as AdapterCommandMatch,
  SlashCommandDef as AdapterSlashCommandDef,
  ArgCompletionAdapter,
  SlashCommandAdapter,
} from "./slashCommandAdapterAtoms";
export { argCompletionAdapterAtom, slashCommandAdapterAtom } from "./slashCommandAdapterAtoms";
export type {
  WorkspaceAwarenessAdapter,
  WorkspaceFileAction,
  WorkspaceFileEntry,
  WorkspaceFileGroup,
} from "./workspaceAdapterAtoms";
export { workspaceAwarenessAdapterAtom } from "./workspaceAdapterAtoms";

// UI state (view modes, navigation, host data, panels, reset)
export type { SettingsTab } from "./navigationAtoms";
export { settingsTabAtom } from "./navigationAtoms";
export type { DiffViewMode, FileViewMode, PageId, TodoFilterStatus, TodoSortKey } from "./uiAtoms";
export {
  availableModelsAtom,
  clearFocusedTurnAtom,
  completionSettingsOpenAtom,
  currentPageAtom,
  dangerousApprovalToolCallIdAtom,
  diffViewModeAtom,
  editingMessageIdAtom,
  fastModeAtom,
  filePickerOpenAtom,
  fileTreePanelVisibleAtom,
  fileViewModeAtom,
  focusedTurnIdAtom,
  focusedTurnIndexAtom,
  permissionSettingsOpenAtom,
  projectFilesAtom,
  promptPrefillAtom,
  resetUiStoreAtom,
  scopeGuardDialogOpenAtom,
  sessionListAtom,
  setAvailableModelsAtom,
  setProjectFilesAtom,
  setSessionListAtom,
  symbolPanelVisibleAtom,
  thinkingModeAtom,
  todoBoardFilterAtom,
  todoBoardSearchAtom,
  todoBoardSortAtom,
  toolCategoryFilterAtom,
  workspaceNameAtom,
} from "./uiAtoms";
