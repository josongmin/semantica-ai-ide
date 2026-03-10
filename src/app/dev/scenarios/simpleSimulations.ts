import type {
  AgentInstance,
  AgentInstanceId,
  ArenaResponse,
  ArenaResponseId,
  BrowserConsoleEntry,
  GitCommit,
  GitCommitId,
  McpServer,
  McpServerId,
  McpTool,
  MemoryRule,
  MemoryRuleId,
  RemoteCommand,
  RemoteCommandId,
  ReviewComment,
  ReviewCommentId,
} from "../../../shared/protocol";
import { nextId, postServerEvent, postServerEvents, sleep } from "../devUtils";

export function simulateAgents() {
  const agentId = nextId("agent") as AgentInstanceId;
  const instance: AgentInstance = {
    id: agentId,
    label: "Background task: lint fix",
    status: "running",
    progress: 0,
    model_id: "claude-opus-4-6",
    created_at_ms: Date.now(),
  };
  postServerEvent({ t: "UPSERT_AGENT_INSTANCE", instance });
  setTimeout(() => {
    postServerEvent({ t: "UPDATE_AGENT_STATUS", id: agentId, status: "success", progress: 100 });
  }, 3000);
}

export function simulateIndex() {
  postServerEvent({ t: "SET_INDEX_STATUS", status: "indexing", progress: 0, file_count: 0 });
  let p = 0;
  const iv = setInterval(() => {
    p += 10;
    postServerEvent({ t: "SET_INDEX_STATUS", status: "indexing", progress: p, file_count: p * 12 });
    if (p >= 100) {
      clearInterval(iv);
      postServerEvent({ t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 1200 });
    }
  }, 500);
}

export function simulateMcp() {
  const serverId = nextId("mcp") as McpServerId;
  const server: McpServer = {
    id: serverId,
    name: "filesystem",
    url: "stdio://localhost",
    status: "connecting",
    enabled: true,
    tool_count: 0,
  };
  postServerEvent({ t: "UPSERT_MCP_SERVER", server });
  setTimeout(() => {
    postServerEvent({ t: "SET_MCP_SERVER_STATUS", id: serverId, status: "connected" });
    const tools: McpTool[] = [
      {
        server_id: serverId,
        tool_name: "read_file",
        description: "Read file contents",
        requires_approval: false,
        input_schema: {},
      },
      {
        server_id: serverId,
        tool_name: "write_file",
        description: "Write file contents",
        requires_approval: true,
        input_schema: {},
      },
    ];
    postServerEvent({ t: "SET_MCP_TOOLS", server_id: serverId, tools });
  }, 1000);
}

export function simulateBrowser() {
  postServerEvent({ t: "SET_BROWSER_STATE", state: { url: "http://localhost:3000", loading: true } });
  setTimeout(() => {
    postServerEvent({
      t: "SET_BROWSER_STATE",
      state: { loading: false, screenshot_data_url: "data:image/png;base64,..." },
    });
    const entry: BrowserConsoleEntry = {
      id: nextId("console"),
      level: "log",
      message: "App mounted successfully",
      timestamp_ms: Date.now(),
    };
    postServerEvent({ t: "PUSH_BROWSER_CONSOLE", entry });
  }, 1500);
}

export function simulateMemory() {
  const ruleId = nextId("rule") as MemoryRuleId;
  const rule: MemoryRule = {
    id: ruleId,
    title: "Always use TypeScript strict mode",
    content: "Ensure tsconfig.json has strict: true",
    source: "custom",
    active: true,
    created_at_ms: Date.now(),
  };
  postServerEvent({ t: "UPSERT_MEMORY_RULE", rule });
  postServerEvent({ t: "SET_ACTIVE_RULES", ids: [ruleId] });
}

export async function simulateArena() {
  const idA = nextId("arena") as ArenaResponseId;
  const idB = nextId("arena") as ArenaResponseId;
  const respA: ArenaResponse = {
    id: idA,
    slot: "A",
    model_id: "claude-opus-4-6",
    model_label: "Claude Opus 4",
    text: "",
    status: "streaming",
    created_at_ms: Date.now(),
  };
  const respB: ArenaResponse = {
    id: idB,
    slot: "B",
    model_id: "gpt-4o",
    model_label: "GPT-4o",
    text: "",
    status: "streaming",
    created_at_ms: Date.now(),
  };
  postServerEvents([
    { t: "UPSERT_ARENA_RESPONSE", response: respA },
    { t: "UPSERT_ARENA_RESPONSE", response: respB },
  ]);
  const textA = "Arena response A: This is Claude's analysis of the problem.";
  const textB = "Arena response B: This is GPT-4o's approach to the solution.";
  for (let i = 0; i < textA.length; i += 3) {
    postServerEvent({ t: "APPEND_ARENA_TEXT", id: idA, chunk: textA.slice(i, i + 3) });
    postServerEvent({ t: "APPEND_ARENA_TEXT", id: idB, chunk: textB.slice(i, i + 3) });
    await sleep(50);
  }
}

export function simulateGitCommits() {
  postServerEvent({ t: "SET_AUTO_COMMIT_ENABLED", enabled: true });
  const commit: GitCommit = {
    id: nextId("commit") as GitCommitId,
    sha: "abc1234",
    message: "feat: add authentication endpoint",
    timestamp_ms: Date.now(),
    auto: true,
  };
  postServerEvent({ t: "PUSH_GIT_COMMIT", commit });
}

export function simulateReview() {
  const commentId = nextId("rc") as ReviewCommentId;
  const comment: ReviewComment = {
    id: commentId,
    file_path: "src/routes/auth.ts",
    line: 42,
    line_start: 42,
    line_end: 42,
    text: "Consider adding input validation for the email field",
    severity: "warning",
    message: "Consider adding input validation for the email field",
    suggestion: "Use zod schema to validate request body",
    status: "open",
  };
  postServerEvent({ t: "UPSERT_REVIEW_COMMENT", comment });
}

export function simulateRemote() {
  postServerEvent({
    t: "SET_REMOTE_STATUS",
    status: "waiting",
    qr_code_data_url: "data:image/png;base64,iVBOR...",
  });
  setTimeout(() => {
    postServerEvent({ t: "SET_REMOTE_STATUS", status: "connected" });
    const command: RemoteCommand = {
      id: nextId("cmd") as RemoteCommandId,
      text: "Build and deploy",
      received_at_ms: Date.now(),
      executed: false,
    };
    postServerEvent({ t: "PUSH_REMOTE_COMMAND", command });
  }, 2000);
}
