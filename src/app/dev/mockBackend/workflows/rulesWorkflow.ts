import type { MemoryRuleId } from "../../../../shared/protocol";
import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  type TurnId,
} from "./types";

export async function runRulesWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Loading agent rules and scanning for violations...`, "Checking compliance...", signal, 600);

  // Load rules
  const rules = [
    { id: "rule-1", title: "Use TypeScript strict mode", content: "Always enable strictNullChecks and noImplicitAny", source: "file" as const, file_path: ".cursorrules", status: "active" as const, violation_count: 0 },
    { id: "rule-2", title: "No console.log in production", content: "Remove all console.log — use proper logger", source: "user" as const, status: "active" as const, violation_count: 3 },
    { id: "rule-3", title: "Prefer named exports", content: "Use named exports over default exports", source: "team" as const, status: "active" as const, violation_count: 1 },
    { id: "rule-4", title: "Max function length 50 lines", content: "Keep functions under 50 lines for readability", source: "auto_detected" as const, status: "active" as const, violation_count: 2 },
  ];
  ctx.sotaState.agentRules = rules;
  postServerEvent({ t: "SET_AGENT_RULES", rules });
  await abortableSleep(500, signal);

  // Push violations
  postServerEvent({
    t: "PUSH_RULE_VIOLATION",
    violation: { id: nextId("rv"), rule_id: "rule-2", turn_id: turnId, description: "Found console.log at src/utils/helpers.ts:42", severity: "warning", timestamp_ms: Date.now() },
  });
  await abortableSleep(300, signal);
  postServerEvent({
    t: "PUSH_RULE_VIOLATION",
    violation: { id: nextId("rv"), rule_id: "rule-4", turn_id: turnId, description: "Function handleSubmit at src/components/Form.tsx:15 is 72 lines (limit: 50)", severity: "error", timestamp_ms: Date.now() },
  });

  postServerEvent({ t: "PUSH_NOTIFICATION", notification: { id: nextId("notif"), type: "warning", urgency: "high", title: "Rule Violations", message: "2 rule violations detected in current session", timestamp_ms: Date.now() } });

  // Memory rules management
  const memRuleIds = [nextId("mr") as MemoryRuleId, nextId("mr") as MemoryRuleId, nextId("mr") as MemoryRuleId];
  postServerEvent({ t: "SET_ACTIVE_RULES", ids: memRuleIds });
  await abortableSleep(200, signal);

  // Pin an important memory rule
  const firstRuleId = memRuleIds[0];
  if (firstRuleId !== undefined) {
    postServerEvent({ t: "PIN_MEMORY_RULE", id: firstRuleId, pinned: true });
  }

  // Remove an obsolete memory rule
  const thirdRuleId = memRuleIds[2];
  if (thirdRuleId !== undefined) {
    postServerEvent({ t: "REMOVE_MEMORY_RULE", id: thirdRuleId });
  }
  await abortableSleep(200, signal);

  // Suggest auto-detected memory rule
  const sugId = nextId("ams");
  postServerEvent({
    t: "SUGGEST_AUTO_MEMORY",
    suggestion: {
      id: sugId,
      title: "Always use named exports",
      content: "Detected pattern: this project consistently uses named exports over default exports. Consider adding as a permanent rule.",
      confidence: 0.82,
      source_turn_id: turnId as string,
    },
  });
  await abortableSleep(300, signal);

  // Auto-dismiss low-confidence suggestion
  postServerEvent({ t: "DISMISS_AUTO_MEMORY", id: sugId });

  await emitSummary(
    turnId,
    `## Agent Rules Report\n\n**4 rules loaded** | **2 violations detected**\n\n### Active Rules\n1. [PASS] TypeScript strict mode — compliant\n2. [WARN] No console.log — **3 violations** (latest: \`helpers.ts:42\`)\n3. [PASS] Named exports — 1 minor violation (auto-fixable)\n4. [FAIL] Max function length — **\`handleSubmit\` is 72 lines** (limit: 50)\n\n### Recommended Actions\n- Split \`handleSubmit\` into smaller functions\n- Replace \`console.log\` with structured logger\n- Run \`/fix\` to auto-fix the named export violation`,
    signal, 1200,
  );

  finalizeTurn(turnId, ctx);
}
