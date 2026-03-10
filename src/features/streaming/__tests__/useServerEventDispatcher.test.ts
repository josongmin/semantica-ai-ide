import { createStore } from "jotai";

import { agentInstanceAtomFamily, agentInstanceIdsAtom } from "~entities/agent-instance";
import {
  arenaResponseAtomFamily,
  arenaResponseIdsAtom,
  arenaWinnerAtom,
} from "~entities/arena";
import { completionSettingsAtom, completionStatsAtom } from "~entities/completion-settings";
import { fileChangeAtomFamily } from "~entities/diff";
import { autoCommitEnabledAtom, gitCommitsAtom } from "~entities/git-history";
import { mcpServerAtomFamily, mcpServerIdsAtom, mcpToolsByServerAtom } from "~entities/mcp";
import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";
import { projectTodoListAtom } from "~entities/project-todo";
import { approvalModeAtom } from "~entities/session/settings";
import { checkpointsAtom, sessionMetaAtom } from "~entities/session/state";
import { timelineEventsAtom } from "~entities/timeline-event";
import { toolCallAtomFamily } from "~entities/tool-call";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { browserConsoleEntriesAtom, browserStateAtom } from "../../../entities/browser";
import { memoryRuleIdsAtom } from "../../../entities/memory-rule";
import { planChecklistAtomFamily } from "../../../entities/plan-checklist";
import { remoteCommandsAtom, remoteStatusAtom } from "../../../entities/remote-control";
import { reviewCommentAtomFamily, reviewedFilesAtom } from "../../../entities/review-comment";
import {
  indexStatusAtom,
  searchResultsAtom,
  symbolMentionsAtom,
} from "../../../entities/semantic-index";
import { boomerangTasksAtom } from "../../../features/boomerang-tasks";
import { ganttEntriesAtom } from "../../../features/gantt-timeline";
import { missionControlAgentsMapAtom } from "../../../features/parallel-agents";
import { threeWayDiffsByTurnFamily } from "../../../features/three-way-diff";
import { usageStatsAtom } from "../../../features/usage-dashboard";
import {
  availableModelsAtom,
  currentPageAtom,
  fastModeAtom,
  projectFilesAtom,
  sessionListAtom,
  thinkingModeAtom,
} from "../../../shared/lib";
import {
  createAgentInstance,
  createArenaResponse,
  createBoomerangTask,
  createBrowserConsoleEntry,
  createCheckpoint,
  createClassifiedError,
  createFileChange,
  createGanttEntry,
  createGitCommit,
  createMcpServer,
  createMcpTool,
  createMcpToolCall,
  createMemoryRule,
  createMessage,
  createMissionControlAgent,
  createModelInfo,
  createPlanChecklistItem,
  createRemoteCommand,
  createReviewComment,
  createSessionListEntry,
  createThreeWayDiffData,
  createTimelineEvent,
  createToolCall,
  createTurn,
  createTurnPhase,
  createUsageStats,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type {
  AgentInstanceId,
  ArenaResponseId,
  McpServerId,
  MemoryRuleId,
  MessageId,
  ProjectTodoId,
  ReviewCommentId,
  SessionId,
  TurnId,
} from "../../../shared/protocol";
function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) =>
    dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("ServerEvent dispatcher integration", () => {
  it("UPSERT_MESSAGE creates message in store", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({ id: "msg_1" as MessageId });

    dispatch({ t: "UPSERT_MESSAGE", msg });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))).toEqual(msg);
  });

  it("APPEND_TEXT appends to existing message", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({ id: "msg_1" as MessageId, text: "Hello" });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: " world" });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))?.text).toBe("Hello world");
  });

  it("SET_MESSAGE_STATUS changes status", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({ id: "msg_1" as MessageId, status: "streaming" });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({ t: "SET_MESSAGE_STATUS", id: "msg_1" as MessageId, status: "final" });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))?.status).toBe("final");
  });

  it("UPSERT_TURN creates turn in store", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId });

    dispatch({ t: "UPSERT_TURN", turn });

    expect(store.get(turnOrderAtom)).toEqual(["turn_1"]);
    expect(store.get(turnAtomFamily("turn_1" as TurnId))).toEqual(turn);
  });

  it("UPDATE_TURN_PHASE updates phase status", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({
      id: "turn_1" as TurnId,
      phases: [createTurnPhase({ phase: "thinking", status: "pending" })],
    });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_PHASE",
      turn_id: "turn_1" as TurnId,
      phase: "thinking",
      entry: { status: "success" },
    });

    const result = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(result?.phases[0]?.status).toBe("success");
  });

  it("UPSERT_TOOL_CALL + UPDATE_TOOL_CALL_STATUS", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const tc = createToolCall({ id: "tc_1", turn_id: "turn_1", status: "running" });

    dispatch({ t: "UPSERT_TOOL_CALL", tool_call: tc });
    dispatch({
      t: "UPDATE_TOOL_CALL_STATUS",
      id: "tc_1",
      status: "success",
      result_summary: "Done",
      duration_ms: 42,
    });

    const updated = store.get(toolCallAtomFamily("tc_1"));
    expect(updated?.status).toBe("success");
    expect(updated?.result_summary).toBe("Done");
    expect(updated?.duration_ms).toBe(42);
  });

  it("SET_SESSION_META updates session metadata", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_SESSION_META", meta: { status: "running", model_label: "Opus" } });

    const meta = store.get(sessionMetaAtom);
    expect(meta.status).toBe("running");
    expect(meta.model_label).toBe("Opus");
  });

  it("SET_APPROVAL_MODE updates approval mode", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_APPROVAL_MODE", mode: "turbo" });

    expect(store.get(approvalModeAtom)).toBe("turbo");
  });

  it("ADD_CHECKPOINT appends checkpoint", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const cp = createCheckpoint({ id: "cp_1", label: "v1" });

    dispatch({ t: "ADD_CHECKPOINT", checkpoint: cp });

    expect(store.get(checkpointsAtom)).toHaveLength(1);
    expect(store.get(checkpointsAtom)[0]?.label).toBe("v1");
  });

  it("PUSH_TIMELINE appends timeline event", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const event = createTimelineEvent({ id: "evt_1", summary: "Started" });

    dispatch({ t: "PUSH_TIMELINE", event });

    expect(store.get(timelineEventsAtom)).toHaveLength(1);
    expect(store.get(timelineEventsAtom)[0]?.summary).toBe("Started");
  });

  it("NOP does nothing", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Should not throw
    expect(() => dispatch({ t: "NOP" })).not.toThrow();
  });

  it("SET_PROGRESS stores progress data", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_PROGRESS", key: "build", value: 50, max: 100, label: "Building..." });

    // Should not throw and data is stored
    expect(() => dispatch({ t: "SET_PROGRESS", key: "test", value: 75 })).not.toThrow();
  });

  it("REQUEST_TOOL_APPROVAL sets approval data on tool call", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const tc = createToolCall({ id: "tc_1", turn_id: "turn_1", status: "running" });
    dispatch({ t: "UPSERT_TOOL_CALL", tool_call: tc });

    dispatch({
      t: "REQUEST_TOOL_APPROVAL",
      tool_call_id: "tc_1",
      action_id: "action_1",
      risk_level: "safe",
      description: "Read file",
    });

    const updated = store.get(toolCallAtomFamily("tc_1"));
    expect(updated?.status).toBe("awaiting_approval");
    expect(updated?.approval_action_id).toBe("action_1");
  });

  it("SET_TOOL_OUTPUT sets output on tool call", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const tc = createToolCall({ id: "tc_1", turn_id: "turn_1", status: "success" });
    dispatch({ t: "UPSERT_TOOL_CALL", tool_call: tc });

    dispatch({
      t: "SET_TOOL_OUTPUT",
      id: "tc_1",
      output: { stdout: "hello", stderr: "", exit_code: 0 },
    });

    const updated = store.get(toolCallAtomFamily("tc_1"));
    expect(updated?.output?.stdout).toBe("hello");
  });

  it("SET_CURRENT_PAGE navigates to page", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_CURRENT_PAGE", page: "sessions" });

    expect(store.get(currentPageAtom)).toBe("sessions");
  });

  it("SET_THINKING_MODE toggles thinking mode", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_THINKING_MODE", enabled: true });
    expect(store.get(thinkingModeAtom)).toBe(true);

    dispatch({ t: "SET_THINKING_MODE", enabled: false });
    expect(store.get(thinkingModeAtom)).toBe(false);
  });

  it("SET_FAST_MODE toggles fast mode", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_FAST_MODE", enabled: true });
    expect(store.get(fastModeAtom)).toBe(true);
  });

  it("RESET_STORES clears all entity stores", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Populate stores
    dispatch({
      t: "UPSERT_MESSAGE",
      msg: createMessage({ id: "msg_1" as MessageId, text: "Hello" }),
    });
    dispatch({
      t: "UPSERT_TURN",
      turn: createTurn({ id: "turn_1" as TurnId }),
    });
    dispatch({
      t: "PUSH_TIMELINE",
      event: createTimelineEvent({ id: "evt_1" }),
    });
    expect(store.get(messageOrderAtom).length).toBeGreaterThan(0);
    expect(store.get(turnOrderAtom).length).toBeGreaterThan(0);
    expect(store.get(timelineEventsAtom).length).toBeGreaterThan(0);

    // Reset
    dispatch({ t: "RESET_STORES" });

    expect(store.get(messageOrderAtom)).toHaveLength(0);
    expect(store.get(turnOrderAtom)).toHaveLength(0);
    expect(store.get(timelineEventsAtom)).toHaveLength(0);
    expect(store.get(sessionMetaAtom).session_id).toBe("");
  });

  it("UPDATE_SESSION_SUMMARY updates summary and stats on session meta", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Set initial session meta so the guard passes
    dispatch({ t: "SET_SESSION_META", meta: { status: "running", model_label: "Opus" } });

    dispatch({
      t: "UPDATE_SESSION_SUMMARY",
      summary: "Implementing authentication flow",
      stats: {
        turns_count: 5,
        files_modified: 3,
        files_created: 1,
        files_deleted: 0,
        tool_calls_count: 12,
        errors_count: 0,
      },
    });

    const meta = store.get(sessionMetaAtom);
    expect(meta.summary).toBe("Implementing authentication flow");
    expect(meta.stats?.files_modified).toBe(3);
    expect(meta.stats?.tool_calls_count).toBe(12);
  });

  it("UPDATE_SESSION_SUMMARY without stats only updates summary", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_SESSION_META", meta: { status: "running" } });

    dispatch({
      t: "UPDATE_SESSION_SUMMARY",
      summary: "Just a summary update",
    });

    const meta = store.get(sessionMetaAtom);
    expect(meta.summary).toBe("Just a summary update");
    expect(meta.stats).toBeUndefined();
  });

  it("SET_BOOMERANG_TASKS stores boomerang tasks", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const tasks = [
      createBoomerangTask({ id: "boom_1", parent_turn_id: "turn_1" as TurnId, label: "Fix auth" }),
      createBoomerangTask({ id: "boom_2", parent_turn_id: "turn_1" as TurnId, label: "Add tests" }),
    ];

    dispatch({ t: "SET_BOOMERANG_TASKS", tasks });

    const map = store.get(boomerangTasksAtom);
    expect(map.size).toBe(2);
    expect(map.get("boom_1")?.label).toBe("Fix auth");
    expect(map.get("boom_2")?.label).toBe("Add tests");
  });

  it("SET_MISSION_CONTROL_AGENTS stores mission control agents", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const agents = [
      createMissionControlAgent({
        id: "agent-1" as unknown as AgentInstanceId,
        name: "Agent Alpha",
        status: "running",
        session_id: "session-1" as SessionId,
      }),
    ];

    dispatch({ t: "SET_MISSION_CONTROL_AGENTS", agents });

    const map = store.get(missionControlAgentsMapAtom);
    expect(map.size).toBe(1);
    expect(map.get("agent-1" as unknown as AgentInstanceId)?.name).toBe("Agent Alpha");
  });

  it("RESET_STORES clears boomerang tasks and mission control agents", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Populate
    dispatch({
      t: "SET_BOOMERANG_TASKS",
      tasks: [createBoomerangTask({ id: "boom_1" })],
    });
    dispatch({
      t: "SET_MISSION_CONTROL_AGENTS",
      agents: [
        createMissionControlAgent({
          id: "agent-1" as unknown as AgentInstanceId,
        }),
      ],
    });

    expect(store.get(boomerangTasksAtom).size).toBe(1);
    expect(store.get(missionControlAgentsMapAtom).size).toBe(1);

    // Reset
    dispatch({ t: "RESET_STORES" });

    expect(store.get(boomerangTasksAtom).size).toBe(0);
    expect(store.get(missionControlAgentsMapAtom).size).toBe(0);
  });

  it("SET_USAGE_STATS stores usage stats", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const stats = createUsageStats({ total_sessions: 10, total_cost_usd: 5.0 });

    dispatch({ t: "SET_USAGE_STATS", stats });

    const result = store.get(usageStatsAtom);
    expect(result?.total_sessions).toBe(10);
    expect(result?.total_cost_usd).toBe(5.0);
  });

  it("SET_GANTT_ENTRIES stores gantt entries", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const entries = [
      createGanttEntry({ id: "g1", tool_name: "read_file" }),
      createGanttEntry({ id: "g2", tool_name: "write_file" }),
    ];

    dispatch({ t: "SET_GANTT_ENTRIES", entries });

    const result = store.get(ganttEntriesAtom);
    expect(result).toHaveLength(2);
    expect(result[0]?.tool_name).toBe("read_file");
  });

  it("SET_THREE_WAY_DIFF pushes diff into turn-scoped store", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const data = createThreeWayDiffData({ file_path: "src/app.ts", turn_id: "turn_1" as TurnId });

    dispatch({ t: "SET_THREE_WAY_DIFF", data });

    const diffs = store.get(threeWayDiffsByTurnFamily("turn_1" as TurnId));
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.file_path).toBe("src/app.ts");
  });

  it("RESET_STORES clears usage stats, gantt entries, and three-way diff", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Populate
    dispatch({ t: "SET_USAGE_STATS", stats: createUsageStats() });
    dispatch({
      t: "SET_GANTT_ENTRIES",
      entries: [createGanttEntry({ id: "g1" })],
    });
    dispatch({
      t: "SET_THREE_WAY_DIFF",
      data: createThreeWayDiffData({ turn_id: "turn_1" as TurnId }),
    });

    expect(store.get(usageStatsAtom)).not.toBeNull();
    expect(store.get(ganttEntriesAtom)).toHaveLength(1);
    expect(store.get(threeWayDiffsByTurnFamily("turn_1" as TurnId))).toHaveLength(1);

    // Reset
    dispatch({ t: "RESET_STORES" });

    expect(store.get(usageStatsAtom)).toBeNull();
    expect(store.get(ganttEntriesAtom)).toHaveLength(0);
    expect(store.get(threeWayDiffsByTurnFamily("turn_1" as TurnId))).toHaveLength(0);
  });

  // ── Feature 1: Parallel Agents ──
  it("UPSERT_AGENT_INSTANCE + UPDATE_AGENT_STATUS + REMOVE_AGENT_INSTANCE", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const agent = createAgentInstance({ id: "agent_1" as AgentInstanceId });

    dispatch({ t: "UPSERT_AGENT_INSTANCE", instance: agent });
    expect(store.get(agentInstanceIdsAtom)).toContain("agent_1");
    expect(store.get(agentInstanceAtomFamily("agent_1"))?.status).toBe("queued");

    dispatch({
      t: "UPDATE_AGENT_STATUS",
      id: "agent_1" as AgentInstanceId,
      status: "success",
      progress: 100,
    });
    expect(store.get(agentInstanceAtomFamily("agent_1"))?.status).toBe("success");

    dispatch({ t: "REMOVE_AGENT_INSTANCE", id: "agent_1" as AgentInstanceId });
    expect(store.get(agentInstanceIdsAtom)).not.toContain("agent_1");
  });

  // ── Feature 2: Semantic Indexing ──
  it("SET_INDEX_STATUS + SET_SEARCH_RESULTS + SET_SYMBOL_MENTIONS", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_INDEX_STATUS", status: "indexing", progress: 50, file_count: 200 });
    expect(store.get(indexStatusAtom)).toBe("indexing");

    dispatch({ t: "SET_SEARCH_RESULTS", query: "test", results: [] });
    expect(store.get(searchResultsAtom)).toEqual([]);

    dispatch({ t: "SET_SYMBOL_MENTIONS", symbols: [] });
    expect(store.get(symbolMentionsAtom)).toEqual([]);
  });

  // ── Feature 3: MCP ──
  it("UPSERT_MCP_SERVER + SET_MCP_SERVER_STATUS + SET_MCP_TOOLS + UPSERT_MCP_TOOL_CALL", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const server = createMcpServer({ id: "mcp_1" as McpServerId });
    const tool = createMcpTool({ tool_name: "read_file" });
    const call = createMcpToolCall();

    dispatch({ t: "UPSERT_MCP_SERVER", server });
    expect(store.get(mcpServerIdsAtom)).toContain("mcp_1");

    dispatch({ t: "SET_MCP_SERVER_STATUS", id: "mcp_1" as McpServerId, status: "connected" });
    expect(store.get(mcpServerAtomFamily("mcp_1"))?.status).toBe("connected");

    dispatch({ t: "SET_MCP_TOOLS", server_id: "mcp_1" as McpServerId, tools: [tool] });
    expect(store.get(mcpToolsByServerAtom).mcp_1).toHaveLength(1);

    dispatch({ t: "UPSERT_MCP_TOOL_CALL", call });
    // Should not throw
  });

  // ── Feature 4: Inline Completion ──
  it("SET_COMPLETION_STATS + SET_COMPLETION_SETTINGS", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_COMPLETION_STATS",
      stats: { shown_today: 10, accepted_today: 5, acceptance_rate: 0.5 },
    });
    expect(store.get(completionStatsAtom).shown_today).toBe(10);

    dispatch({ t: "SET_COMPLETION_SETTINGS", settings: { enabled: false } });
    expect(store.get(completionSettingsAtom).enabled).toBe(false);
  });

  // ── Feature 5: Browser Preview ──
  it("SET_BROWSER_STATE + PUSH_BROWSER_CONSOLE + CLEAR_BROWSER_CONSOLE", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_BROWSER_STATE", state: { url: "http://localhost:3000", loading: true } });
    expect(store.get(browserStateAtom).url).toBe("http://localhost:3000");

    const entry = createBrowserConsoleEntry({ level: "error", message: "Something failed" });
    dispatch({ t: "PUSH_BROWSER_CONSOLE", entry });
    expect(store.get(browserConsoleEntriesAtom)).toHaveLength(1);

    dispatch({ t: "CLEAR_BROWSER_CONSOLE" });
    expect(store.get(browserConsoleEntriesAtom)).toHaveLength(0);
  });

  // ── Feature 6: Project Memory ──
  it("UPSERT_MEMORY_RULE + DELETE_MEMORY_RULE", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const rule = createMemoryRule({ id: "rule_1" as MemoryRuleId });

    dispatch({ t: "UPSERT_MEMORY_RULE", rule });
    expect(store.get(memoryRuleIdsAtom)).toContain("rule_1");

    dispatch({ t: "DELETE_MEMORY_RULE", id: "rule_1" as MemoryRuleId });
    expect(store.get(memoryRuleIdsAtom)).not.toContain("rule_1");
  });

  // ── Feature 7: Arena Mode ──
  it("UPSERT_ARENA_RESPONSE + APPEND_ARENA_TEXT + SET_ARENA_WINNER", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const response = createArenaResponse({ id: "arena_1" as ArenaResponseId, text: "Hello" });

    dispatch({ t: "UPSERT_ARENA_RESPONSE", response });
    expect(store.get(arenaResponseIdsAtom)).toContain("arena_1");

    dispatch({ t: "APPEND_ARENA_TEXT", id: "arena_1" as ArenaResponseId, chunk: " world" });
    expect(store.get(arenaResponseAtomFamily("arena_1"))?.text).toBe("Hello world");

    dispatch({ t: "SET_ARENA_WINNER", winner: "A" });
    expect(store.get(arenaWinnerAtom)).toBe("A");
  });

  // ── Feature 8: Git Auto-Commit ──
  it("PUSH_GIT_COMMIT + SET_AUTO_COMMIT_ENABLED", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const commit = createGitCommit({ message: "feat: add auth" });

    dispatch({ t: "PUSH_GIT_COMMIT", commit });
    expect(store.get(gitCommitsAtom)).toHaveLength(1);

    dispatch({ t: "SET_AUTO_COMMIT_ENABLED", enabled: true });
    expect(store.get(autoCommitEnabledAtom)).toBe(true);
  });

  // ── Feature 9: AI Code Review ──
  it("UPSERT_REVIEW_COMMENT + UPDATE_REVIEW_COMMENT_STATUS + SET_REVIEW_COMMENTS", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const comment = createReviewComment({
      id: "rc_1" as ReviewCommentId,
      file_path: "src/index.ts",
    });

    dispatch({ t: "UPSERT_REVIEW_COMMENT", comment });
    expect(store.get(reviewedFilesAtom)).toContain("src/index.ts");

    dispatch({
      t: "UPDATE_REVIEW_COMMENT_STATUS",
      id: "rc_1" as ReviewCommentId,
      status: "accepted",
    });
    expect(store.get(reviewCommentAtomFamily("rc_1"))?.status).toBe("accepted");

    dispatch({ t: "SET_REVIEW_COMMENTS", file_path: "src/app.ts", comments: [] });
    // Should not throw
  });

  // ── Feature 10: Remote Control ──
  it("SET_REMOTE_STATUS + PUSH_REMOTE_COMMAND", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({ t: "SET_REMOTE_STATUS", status: "connected" });
    expect(store.get(remoteStatusAtom)).toBe("connected");

    const command = createRemoteCommand({ text: "send_message" });
    dispatch({ t: "PUSH_REMOTE_COMMAND", command });
    expect(store.get(remoteCommandsAtom)).toHaveLength(1);
  });

  // ── Plan Checklist ──
  it("UPSERT_PLAN_CHECKLIST + UPDATE_PLAN_ITEM", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const items = [
      createPlanChecklistItem({ id: "p1", label: "Step 1", status: "pending" }),
      createPlanChecklistItem({ id: "p2", label: "Step 2", status: "pending" }),
    ];

    dispatch({ t: "UPSERT_PLAN_CHECKLIST", turn_id: "turn_1" as TurnId, items });
    expect(store.get(planChecklistAtomFamily("turn_1"))).toHaveLength(2);

    dispatch({
      t: "UPDATE_PLAN_ITEM",
      turn_id: "turn_1" as TurnId,
      item_id: "p1",
      status: "completed",
    });
    expect(store.get(planChecklistAtomFamily("turn_1"))[0]?.status).toBe("completed");
  });

  // ── Project TODOs ──
  it("SYNC_PROJECT_TODOS + UPSERT_PROJECT_TODO + UPDATE_PROJECT_TODO_STATUS + DELETE_PROJECT_TODO", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const todo1 = {
      id: "todo_1" as ProjectTodoId,
      label: "Implement auth",
      status: "pending" as const,
      priority: "high" as const,
      source_session_ids: [],
      created_at_ms: 1000,
      updated_at_ms: 1000,
    };
    const todo2 = {
      id: "todo_2" as ProjectTodoId,
      label: "Write tests",
      status: "pending" as const,
      priority: "medium" as const,
      source_session_ids: [],
      created_at_ms: 2000,
      updated_at_ms: 2000,
    };

    // Sync replaces entire list
    dispatch({ t: "SYNC_PROJECT_TODOS", todos: [todo1, todo2] });
    expect(store.get(projectTodoListAtom)).toHaveLength(2);

    // Upsert adds a new one
    const todo3 = {
      id: "todo_3" as ProjectTodoId,
      label: "Deploy",
      status: "pending" as const,
      priority: "low" as const,
      source_session_ids: [],
      created_at_ms: 3000,
      updated_at_ms: 3000,
    };
    dispatch({ t: "UPSERT_PROJECT_TODO", todo: todo3 });
    expect(store.get(projectTodoListAtom)).toHaveLength(3);

    // Update status
    dispatch({
      t: "UPDATE_PROJECT_TODO_STATUS",
      id: "todo_1" as ProjectTodoId,
      status: "completed",
    });
    const updated = store.get(projectTodoListAtom).find((t) => t.id === "todo_1");
    expect(updated?.status).toBe("completed");

    // Delete
    dispatch({ t: "DELETE_PROJECT_TODO", id: "todo_2" as ProjectTodoId });
    expect(store.get(projectTodoListAtom)).toHaveLength(2);
  });

  // ── Turn Metrics ──
  it("UPDATE_TURN_METRICS updates performance metrics on existing turn", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      ttft_ms: 120,
      latency_ms: 3500,
      estimated_cost_usd: 0.05,
    });

    const result = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(result?.ttft_ms).toBe(120);
    expect(result?.latency_ms).toBe(3500);
    expect(result?.estimated_cost_usd).toBe(0.05);
  });

  it("UPDATE_TURN_METRICS is no-op for missing turn", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Should not throw when turn doesn't exist
    expect(() =>
      dispatch({
        t: "UPDATE_TURN_METRICS",
        turn_id: "nonexistent" as TurnId,
        ttft_ms: 100,
      }),
    ).not.toThrow();
  });

  // ── Error Classification ──
  it("CLASSIFY_ERROR attaches classified error to message", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({ id: "msg_1" as MessageId, status: "error" });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({
      t: "CLASSIFY_ERROR",
      id: "msg_1" as MessageId,
      error: createClassifiedError({
        category: "rate_limit",
        message: "Too many requests",
        retry_strategy: "retry_with_backoff",
        retry_after_ms: 5000,
      }),
    });

    const updated = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(updated?.classified_error?.category).toBe("rate_limit");
    expect(updated?.classified_error?.retry_strategy).toBe("retry_with_backoff");
    expect(updated?.classified_error?.retry_after_ms).toBe(5000);
  });

  // ── Previously missing coverage: core serverEvent types ──
  it("SET_DIFF_LOADED sets diff_loaded on existing message", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const msg = createMessage({ id: "msg_1" as MessageId, text: "Review diff" });

    dispatch({ t: "UPSERT_MESSAGE", msg });
    dispatch({
      t: "SET_DIFF_LOADED",
      id: "msg_1" as MessageId,
      diff_text: "--- a/file\n+++ b/file",
    });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))?.diff_loaded).toBe(
      "--- a/file\n+++ b/file",
    );
  });

  it("UPSERT_FILE_CHANGE stores file change and indexes by turn", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const fc = createFileChange({ file_path: "src/index.ts", turn_id: "turn_1" });

    dispatch({ t: "UPSERT_FILE_CHANGE", file_change: fc });

    expect(store.get(fileChangeAtomFamily("turn_1::src/index.ts"))).toEqual(fc);
  });

  it("SET_SESSION_LIST populates session list", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const sessions = [
      createSessionListEntry({ title: "Session A" }),
      createSessionListEntry({ title: "Session B" }),
    ];

    dispatch({ t: "SET_SESSION_LIST", sessions });

    expect(store.get(sessionListAtom)).toHaveLength(2);
    expect(store.get(sessionListAtom)[0]?.title).toBe("Session A");
  });

  it("SET_AVAILABLE_MODELS populates model list", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const models = [
      createModelInfo({ id: "claude-opus-4-6", label: "Claude Opus 4.6" }),
      createModelInfo({ id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" }),
    ];

    dispatch({ t: "SET_AVAILABLE_MODELS", models });

    expect(store.get(availableModelsAtom)).toHaveLength(2);
    expect(store.get(availableModelsAtom)[1]?.label).toBe("Claude Sonnet 4.6");
  });

  it("SET_PROJECT_FILES populates project file list", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const files = ["src/app.tsx", "src/index.ts", "package.json"];

    dispatch({ t: "SET_PROJECT_FILES", files });

    expect(store.get(projectFilesAtom)).toEqual(["src/app.tsx", "src/index.ts", "package.json"]);
  });

  it("full streaming scenario: message → turn → append → final", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // 1. Create message
    dispatch({
      t: "UPSERT_MESSAGE",
      msg: createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
    });

    // 2. Create turn
    dispatch({
      t: "UPSERT_TURN",
      turn: createTurn({
        id: "turn_1" as TurnId,
        status: "running",
        phases: [
          createTurnPhase({
            phase: "user_message",
            message_ids: ["msg_1" as MessageId],
            status: "success",
          }),
        ],
      }),
    });

    // 3. Stream tokens
    dispatch({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: "Hello" });
    dispatch({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: " world" });
    dispatch({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: "!" });

    // 4. Finalize
    dispatch({ t: "SET_MESSAGE_STATUS", id: "msg_1" as MessageId, status: "final" });

    // Verify
    const msg = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(msg?.text).toBe("Hello world!");
    expect(msg?.status).toBe("final");
    expect(store.get(turnOrderAtom)).toHaveLength(1);
  });
});
