import type {
  AgentRequestMode,
  ApprovalMode,
  ArenaWinner,
  Attachment,
  CompletionSettings,
  ConfigChoice,
  ExportFormat,
  ExportOptions,
  MemoryRuleSource,
  ProjectTodoId,
  ProjectTodoPriority,
  ProjectTodoStatus,
  PromptTemplate,
  RestoreMode,
  SessionId,
} from "../protocol";

/** Typed outgoing message payloads to the extension host */
export type ExtensionHostMessage =
  | {
      type: "SEND_MESSAGE";
      text: string;
      message_id: string;
      turn_id: string;
      attachments?: readonly Attachment[];
    }
  | { type: "RETRY_MESSAGE"; messageId: string }
  | { type: "STOP_AGENT" }
  | { type: "SET_APPROVAL_MODE"; mode: ApprovalMode }
  | { type: "SET_AGENT_REQUEST_MODE"; mode: AgentRequestMode }
  | { type: "GRANT_APPROVAL"; action_id: string; sandbox?: boolean }
  | { type: "DENY_APPROVAL"; action_id: string }
  | { type: "DIFF_APPROVE"; turn_id: string; file_path: string }
  | { type: "DIFF_REJECT"; turn_id: string; file_path: string }
  | { type: "DIFF_APPROVE_ALL"; turn_id: string; file_paths: string[] }
  | { type: "DIFF_REJECT_ALL"; turn_id: string; file_paths: string[] }
  | { type: "OPEN_FILE"; file_path: string; line?: number; column?: number; split?: boolean }
  | { type: "RESTORE_CHECKPOINT"; checkpoint_id: string; mode?: RestoreMode }
  | { type: "STOP_TOOL"; tool_call_id: string }
  | { type: "RETRY_TOOL"; tool_call_id: string }
  | { type: "APPLY_CODE_BLOCK"; code: string; language?: string; file_path?: string }
  | { type: "INSERT_CODE_BLOCK"; code: string }
  | { type: "LOAD_SESSION_LIST" }
  | { type: "RESUME_SESSION"; session_id: string }
  | { type: "NEW_SESSION" }
  | { type: "DELETE_SESSION"; session_id: string }
  | { type: "COMPACT_CONTEXT" }
  | { type: "SWITCH_MODEL"; model_id: string }
  | { type: "SET_THINKING_MODE"; enabled: boolean }
  | { type: "SET_FAST_MODE"; enabled: boolean }
  | { type: "CLEAR_CONVERSATION" }
  | { type: "EXPORT_SESSION"; format: "markdown" | "json"; session_id?: string }
  | { type: "PASTE_IMAGE"; data_url: string; name: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "APPROVE_ALL" }
  | { type: "SHOW_CONTEXT" }
  | { type: "OPEN_SETTINGS" }
  | { type: "SHOW_HELP" }
  | { type: "OPEN_SUB_PANEL"; panelId: string }
  | { type: "REQUEST_PROJECT_FILES" }
  | {
      type: "SET_CATEGORY_PERMISSIONS";
      permissions: { category: string; permission: string }[];
    }
  | { type: "EDIT_MESSAGE"; messageId: string; text: string }
  | { type: "COPY_CONVERSATION" }
  | { type: "TOGGLE_BOOKMARK"; turn_id: string; bookmarked: boolean; bookmark_label?: string }
  | { type: "FORK_SESSION"; source_turn_id: string }
  | { type: "SET_SCOPE_GUARD"; includes: readonly string[]; excludes: readonly string[] }
  | { type: "OPEN_FILE_AT_LINE"; file_path: string; line: number }
  | { type: "PREFETCH_SESSION"; session_id: string }
  | {
      type: "SHARE_SESSION";
      session_id: SessionId;
      options: { expires_in_hours?: number; mask_secrets?: boolean };
    }
  | { type: "GENERATE_PR_SUMMARY"; session_id: SessionId }
  | { type: "OPEN_PR_IN_GITHUB"; session_id: SessionId }
  | { type: "INSTALL_MCP_SERVER"; server_id: string }
  | { type: "UNINSTALL_MCP_SERVER"; server_id: string }
  | { type: "SAVE_NOTEPAD"; notepad_id: string; title: string; content: string }
  | { type: "DELETE_NOTEPAD"; notepad_id: string }
  | {
      type: "EXPORT_SESSION";
      session_id: SessionId;
      format: ExportFormat;
      options: ExportOptions;
    }
  | { type: "EXPORT_HTML"; session_id: SessionId; options: ExportOptions }
  | { type: "EXPORT_PDF"; session_id: SessionId; options: ExportOptions }
  | { type: "EXPORT_MARKDOWN"; session_id: SessionId; options: ExportOptions }
  | { type: "SYNC_TEAM_CONFIG" }
  | { type: "APPLY_CONFIG_CHOICE"; key: string; choice: ConfigChoice }
  | {
      type: "SAVE_PROMPT_TEMPLATE";
      template: Omit<PromptTemplate, "id">;
    }
  | { type: "DELETE_PROMPT_TEMPLATE"; template_id: string }
  | { type: "LOAD_PROMPT_TEMPLATES" }
  | { type: "APPLY_PROMPT_TEMPLATE"; template_id: string }
  | { type: "NAVIGATE_TO_SOURCE"; file_path: string; line: number; column: number }
  | { type: "OPEN_PREVIEW_EXTERNAL"; url: string }
  | { type: "REFRESH_PREVIEW" }
  // Voice Input
  | { type: "START_VOICE_INPUT" }
  | { type: "STOP_VOICE_INPUT" }
  | { type: "CONFIRM_VOICE_INPUT"; transcript: string }
  // Machine Snapshots
  | { type: "CREATE_SNAPSHOT"; label: string }
  | { type: "RESTORE_SNAPSHOT_ENV"; snapshot_id: string }
  | { type: "DELETE_SNAPSHOT"; snapshot_id: string }
  // Mode Gallery
  | { type: "INSTALL_MODE"; mode_id: string }
  | { type: "UNINSTALL_MODE"; mode_id: string }
  // Playbook Market
  | { type: "INSTALL_PLAYBOOK"; playbook_id: string }
  | { type: "UNINSTALL_PLAYBOOK"; playbook_id: string }
  | { type: "APPLY_PLAYBOOK"; playbook_id: string }
  // Context Spaces (CS-07)
  | { type: "CREATE_CONTEXT_SPACE"; name: string; description: string }
  | { type: "UPDATE_CONTEXT_SPACE"; space_id: string; updates: Record<string, unknown> }
  | { type: "DELETE_CONTEXT_SPACE"; space_id: string }
  // Integration (CS-08)
  | { type: "SEND_INTEGRATION_UPDATE"; connection_id: string; message: string }
  | { type: "DISCONNECT_INTEGRATION"; connection_id: string }
  // Ticket Link (CS-09)
  | { type: "LINK_TICKET"; ticket_key: string; platform: string }
  | { type: "UNLINK_TICKET"; ticket_id: string }
  | { type: "SYNC_TICKET_STATUS"; ticket_id: string }
  // Agent Team (AO-08)
  | { type: "SEND_AGENT_INTERVENTION"; agent_id: string; message: string }
  // Parallel Agents
  | { type: "SPAWN_AGENT"; label: string; model_id?: string }
  | { type: "CANCEL_AGENT"; agent_id: string }
  // Semantic Indexing
  | { type: "REQUEST_INDEX" }
  | { type: "SEMANTIC_SEARCH"; query: string }
  // MCP
  | { type: "ADD_MCP_SERVER"; url: string; name: string }
  | { type: "REMOVE_MCP_SERVER"; server_id: string }
  | { type: "TOGGLE_MCP_SERVER"; server_id: string; enabled: boolean }
  // Inline Completion
  | { type: "SET_COMPLETION_SETTINGS"; settings: Partial<CompletionSettings> }
  // Browser
  | { type: "BROWSER_NAVIGATE"; url: string }
  | { type: "BROWSER_CLICK"; x: number; y: number }
  | { type: "BROWSER_CLOSE" }
  // Project Memory
  | { type: "SAVE_MEMORY_RULE"; title: string; content: string; source: MemoryRuleSource }
  | { type: "DELETE_MEMORY_RULE"; rule_id: string }
  | { type: "TOGGLE_MEMORY_RULE"; rule_id: string; active: boolean }
  // Arena
  | { type: "ARENA_SET_MODELS"; model_a: string; model_b: string }
  | { type: "ARENA_SEND_PROMPT"; text: string }
  | { type: "ARENA_SELECT_WINNER"; winner: ArenaWinner }
  // Git
  | { type: "GIT_UNDO_COMMIT" }
  | { type: "TOGGLE_AUTO_COMMIT"; enabled: boolean }
  | { type: "REGENERATE_COMMIT_MESSAGE" }
  | { type: "COMMIT_WITH_MESSAGE"; message: string }
  // Code Review
  | { type: "REQUEST_CODE_REVIEW"; file_path?: string }
  | { type: "ACCEPT_REVIEW_COMMENT"; comment_id: string }
  | { type: "DISMISS_REVIEW_COMMENT"; comment_id: string }
  // Remote
  | { type: "REQUEST_REMOTE_QR" }
  | { type: "DISCONNECT_REMOTE" }
  // Project TODO
  | { type: "LOAD_PROJECT_TODOS" }
  | { type: "ADD_PROJECT_TODO"; label: string; priority: ProjectTodoPriority }
  | { type: "UPDATE_PROJECT_TODO"; id: ProjectTodoId; status: ProjectTodoStatus }
  | { type: "DELETE_PROJECT_TODO"; id: ProjectTodoId }
  // Checkpoint Comparison
  | { type: "GET_CHECKPOINT_DIFF"; from_id: string; to_id: string }
  // Agent Rules
  | { type: "LOAD_AGENT_RULES" }
  | { type: "SAVE_AGENT_RULE"; rule: { title: string; content: string; source: string } }
  | { type: "DELETE_AGENT_RULE"; rule_id: string }
  | { type: "TOGGLE_AGENT_RULE"; rule_id: string; status: string }
  // Smart Context
  | { type: "REQUEST_AUTO_CONTEXT"; prompt_text: string }
  | { type: "ACCEPT_CONTEXT_SUGGESTION"; suggestion_id: string }
  | { type: "REJECT_CONTEXT_SUGGESTION"; suggestion_id: string }
  // Speculative Edits
  | { type: "REQUEST_SPECULATIVE_EDIT"; prompt_text: string }
  | { type: "ACCEPT_SPECULATIVE_EDIT"; edit_id: string }
  | { type: "REJECT_SPECULATIVE_EDIT"; edit_id: string }
  // Background Agent
  | { type: "LAUNCH_BACKGROUND_JOB"; label: string; prompt: string; cloud: boolean }
  | { type: "CANCEL_BACKGROUND_JOB"; job_id: string }
  // Action Replay
  | { type: "START_REPLAY"; turn_id: string }
  | { type: "REPLAY_STEP"; direction: "forward" | "backward" }
  | { type: "REPLAY_BRANCH"; step_index: number }
  | { type: "STOP_REPLAY" }
  // Multi-Agent Debate
  | { type: "START_DEBATE"; prompt: string; model_ids: string[] }
  | { type: "DEBATE_PICK_WINNER"; agent_id: string }
  | { type: "DEBATE_MERGE"; agent_id: string }
  // User Input
  | { type: "RESPOND_USER_INPUT"; request_id: string; answer: string | string[] }
  | { type: "SKIP_USER_INPUT"; request_id: string }
  // Three-Way Diff Resolution
  | { type: "RESOLVE_THREE_WAY_DIFF"; id: string; resolution: string }
  // Session Management
  | { type: "RENAME_SESSION"; session_id: string; title: string }
  | { type: "PIN_SESSION"; session_id: string; pinned: boolean }
  // Terminal / Diagnostics
  | { type: "SYNC_DIAGNOSTICS"; sessionId: string; diagnostics: unknown[] }
  | { type: "LOAD_PLUGIN_PARSERS" }
  // Agent commands
  | { type: "RUN_TESTS"; scope?: string; file_path?: string }
  | { type: "ASK_AGENT"; prompt: string }
  // File Explorer Context Menu
  | { type: "REVEAL_IN_FINDER"; file_path: string }
  | { type: "OPEN_TERMINAL"; cwd: string }
  | { type: "FIND_REFERENCES"; file_path: string }
  | { type: "OPEN_CHANGES"; file_path: string }
  | { type: "FILE_HISTORY"; file_path: string }
  | { type: "RENAME_FILE"; file_path: string }
  | { type: "DUPLICATE_FILE"; file_path: string }
  | { type: "MOVE_FILE"; file_path: string }
  | { type: "DELETE_FILE"; file_path: string }
  | { type: "DEBUG_TESTS"; file_path: string };

type WebviewPersistedState = Record<string, unknown>;

interface VscodeApi {
  postMessage(msg: ExtensionHostMessage): void;
  getState(): WebviewPersistedState | null;
  setState(state: WebviewPersistedState): void;
}

declare function acquireVsCodeApi(): VscodeApi;

let vscodeApi: VscodeApi | null = null;

/** Dev-mode hook: when set, postMessage calls are routed here instead of being no-ops */
let devMessageHandler: ((msg: ExtensionHostMessage) => void) | null = null;

/** Register a handler to intercept postMessage in dev mode (mock backend) */
export function setDevMessageHandler(handler: (msg: ExtensionHostMessage) => void): void {
  devMessageHandler = handler;
}

/** Safely post a message, catching any unexpected runtime errors */
function safePostMessage(realApi: VscodeApi, msg: ExtensionHostMessage): void {
  try {
    realApi.postMessage(msg);
  } catch (err) {
    // In production the VSCode postMessage API should never throw,
    // but guard against edge cases (webview disposed, extension crashed).
    console.error("[postMessage] Failed to send:", msg.type, err);
  }
}

export function getVscodeApi(): VscodeApi {
  if (!vscodeApi) {
    try {
      const realApi = acquireVsCodeApi();
      vscodeApi = {
        postMessage: (msg: ExtensionHostMessage) => safePostMessage(realApi, msg),
        getState: () => realApi.getState(),
        setState: (s: WebviewPersistedState) => realApi.setState(s),
      };
    } catch {
      // Running outside VSCode (dev mode)
      vscodeApi = {
        postMessage: (msg: ExtensionHostMessage) => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[dev] postMessage:", msg);
            devMessageHandler?.(msg);
          }
        },
        getState: (): WebviewPersistedState | null => {
          try {
            const raw = localStorage.getItem("__dev_state");
            if (!raw) return null;
            const parsed: unknown = JSON.parse(raw);
            if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
              return parsed as WebviewPersistedState;
            }
            return null;
          } catch {
            /* silently ignore — localStorage or JSON.parse may fail; return null as safe default */
            return null;
          }
        },
        setState: (state: WebviewPersistedState) => {
          try {
            localStorage.setItem("__dev_state", JSON.stringify(state));
          } catch {
            /* silently ignore — localStorage may be full or unavailable in dev mode */
          }
        },
      };
    }
  }
  return vscodeApi;
}
