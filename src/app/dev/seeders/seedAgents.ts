import type {
  AgentInstance,
  AgentInstanceId,
  AgentMessage,
  MissionControlAgent,
} from "../../../shared/protocol";
import { postServerEvent } from "../devUtils";

/**
 * Seeds parallel agents, mission control agents, and agent P2P messages.
 */
export function seedAgents() {
  const now = Date.now();

  // ── Parallel agents ────────────────────────────────────
  const agents: AgentInstance[] = [
    { id: "agent-seed-1" as AgentInstanceId, label: "Lint 자동 수정", status: "success", progress: 100, model_id: "claude-haiku-4-5", created_at_ms: now - 45000, completed_at_ms: now - 40000, files_processed: 12, files_total: 12, current_task: "완료" },
    { id: "agent-seed-2" as AgentInstanceId, label: "테스트 파일 생성", status: "running", progress: 65, model_id: "claude-sonnet-4-6", created_at_ms: now - 10000, current_file: "src/routes/__tests__/auth.test.ts", files_processed: 3, files_total: 5, current_task: "auth.test.ts 작성 중" },
    { id: "agent-seed-3" as AgentInstanceId, label: "타입 체크", status: "error", progress: 30, model_id: "claude-haiku-4-5", created_at_ms: now - 8000, error_message: "Type error in jwt.ts:15" },
  ];
  for (const a of agents) postServerEvent({ t: "UPSERT_AGENT_INSTANCE", instance: a });

  // ── Mission control agents ──────────────────────────────
  const mcAgents: MissionControlAgent[] = [
    { id: "agent-seed-1" as AgentInstanceId, name: "Linter", status: "idle", progress_pct: 100, risk_level: "safe" },
    { id: "agent-seed-2" as AgentInstanceId, name: "Test Writer", status: "running", current_task: "auth.test.ts", progress_pct: 65, risk_level: "safe", eta_ms: 5000 },
    { id: "agent-seed-3" as AgentInstanceId, name: "Type Checker", status: "error", progress_pct: 30, risk_level: "moderate" },
  ];
  postServerEvent({ t: "SET_MISSION_CONTROL_AGENTS", agents: mcAgents });

  // ── Agent messages (P2P) ────────────────────────────────
  const agentMessages: AgentMessage[] = [
    { id: "am-1", from_agent: "Test Writer", to_agent: "Linter", content: "auth.test.ts 생성 완료, lint 확인 부탁", timestamp_ms: now - 5000, message_type: "request" },
    { id: "am-2", from_agent: "Linter", to_agent: "Test Writer", content: "lint 통과, 문제 없음", timestamp_ms: now - 4000, message_type: "response" },
  ];
  postServerEvent({ t: "SET_AGENT_MESSAGES", messages: agentMessages });
}
