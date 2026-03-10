import type {
  ArenaResponse,
  ArenaResponseId,
} from "../../../shared/protocol";
import { postServerEvents } from "../devUtils";

/**
 * Seeds arena mode with two competing model responses.
 */
export function seedArena() {
  const now = Date.now();

  const arenaA: ArenaResponse = { id: "arena-a" as ArenaResponseId, slot: "A", model_id: "claude-opus-4-6", model_label: "Claude Opus 4.6", text: "Arena A: 이 코드에서 JWT 토큰을 HttpOnly 쿠키에 저장하는 것이 가장 안전합니다.", status: "final", created_at_ms: now - 5000 };
  const arenaB: ArenaResponse = { id: "arena-b" as ArenaResponseId, slot: "B", model_id: "claude-sonnet-4-6", model_label: "Sonnet 4.6", text: "Arena B: Authorization 헤더에 Bearer 토큰으로 전달하는 것이 RESTful 표준에 부합합니다.", status: "final", created_at_ms: now - 5000 };
  postServerEvents([
    { t: "UPSERT_ARENA_RESPONSE", response: arenaA },
    { t: "UPSERT_ARENA_RESPONSE", response: arenaB },
  ]);
}
