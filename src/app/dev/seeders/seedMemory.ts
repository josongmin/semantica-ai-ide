import type {
  MemoryRule,
  MemoryRuleId,
} from "../../../shared/protocol";
import { postServerEvent } from "../devUtils";

/**
 * Seeds memory rules, active rules, and auto-memory suggestions.
 */
export function seedMemory() {
  const now = Date.now();

  const rules: MemoryRule[] = [
    { id: "rule-1" as MemoryRuleId, title: "TypeScript strict mode 사용", content: "tsconfig.json에 strict: true 설정", source: "CLAUDE.md", active: true, created_at_ms: now - 100000 },
    { id: "rule-2" as MemoryRuleId, title: "항상 한국어로 응답", content: "사용자와 한국어로 대화할 것", source: "user", active: true, pinned: true, created_at_ms: now - 90000 },
    { id: "rule-3" as MemoryRuleId, title: "Vitest 사용", content: "테스트에 Jest 대신 Vitest 사용", source: "project", active: true, created_at_ms: now - 80000 },
  ];
  for (const r of rules) postServerEvent({ t: "UPSERT_MEMORY_RULE", rule: r });
  postServerEvent({ t: "SET_ACTIVE_RULES", ids: rules.map((r) => r.id) });

  // ── Auto-memory suggestion ──────────────────────────────
  postServerEvent({ t: "SUGGEST_AUTO_MEMORY", suggestion: { id: "auto-mem-1", title: "FSD 아키텍처 준수", content: "Feature-Sliced Design 패턴 사용: shared → entities → features → widgets → pages", confidence: 0.92, source_turn_id: "turn-seed-1" } });
}
