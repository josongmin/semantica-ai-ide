import {
  nextMsgId,
  nextTurnId,
  postServerEvent,
  postServerEvents,
  sleep,
  STAGE_DELAY,
  streamText,
} from "../devUtils";
import { PIPELINE_STAGES,simDangerous, simFeature, simReset, simStep } from "./pipelineScenarios";

export async function simScenarioBugfix() {
  const turnId = nextTurnId();
  const now = Date.now();
  const userMsgId = nextMsgId();

  // 1. User message + turn
  postServerEvents([
    { t: "SET_SESSION_META", meta: { status: "running", model_label: "Pipeline Sim", model_id: "claude-opus-4-6" } },
    { t: "UPSERT_MESSAGE", msg: { id: userMsgId, turn_id: turnId, role: "user", created_at_ms: now, text: "NullPointerException \uBC84\uADF8 \uC218\uC815\uD574\uC918", status: "final" } },
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [{ phase: "user_message", message_ids: [userMsgId], tool_call_ids: [], summary: "NullPointerException \uBC84\uADF8 \uC218\uC815", collapsed: false, status: "success" }], status: "running", created_at_ms: now } },
  ]);
  await sleep(300);

  // 2. Thinking phase
  const thinkMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: thinkMsgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" } },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "running", message_ids: [thinkMsgId], summary: "\uD30C\uC774\uD504\uB77C\uC778 \uBD84\uC11D \uC911..." } },
  ]);
  await streamText(thinkMsgId, "Input Gate\uB85C \uC694\uCCAD\uC744 \uBD84\uC11D\uD558\uACE0, Fail-Closed \uC81C\uC57D\uC744 \uC124\uC815\uD55C \uD6C4 Strategy Orchestrator\uB85C \uD0D0\uC0C9\uD569\uB2C8\uB2E4...", 1500);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: thinkMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "success", collapsed: true } });

  // 3. Pipeline stages
  simReset(turnId);
  await sleep(200);
  for (const stage of PIPELINE_STAGES) {
    simStep(stage, "pass", turnId);
    await sleep(STAGE_DELAY);
  }

  // 4. Summary
  const summaryMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: summaryMsgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" } },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "running", message_ids: [summaryMsgId] } },
  ]);
  await streamText(
    summaryMsgId,
    "\u2705 **\uD30C\uC774\uD504\uB77C\uC778 \uC644\uB8CC** (9/9 \uC2A4\uD14C\uC774\uC9C0 PASS)\n\n" +
    "\u2022 **Input Gate**: bug_fix intent, moderate risk\n" +
    "\u2022 **Strategy**: BEAM search (depth 3, score 0.91)\n" +
    "\u2022 **Validation**: policy pass, 12/12 tests pass\n" +
    "\u2022 **Verdict**: null guard \uCD94\uAC00 + \uC5D0\uB7EC context \uBCF4\uC874 (confidence 0.91)\n\n" +
    "Evidence bundle sealed. Gate passed. \uD328\uCE58\uB97C \uC801\uC6A9\uD569\uB2C8\uB2E4.",
    2500,
  );
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: summaryMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "success" } });

  // 5. Finalize
  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "success", created_at_ms: now } },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
  // eslint-disable-next-line no-console
  console.log("[sim] Bugfix scenario with chat turn completed");
}

export async function simScenarioFeature() {
  const turnId = nextTurnId();
  const now = Date.now();
  const userMsgId = nextMsgId();

  postServerEvents([
    { t: "SET_SESSION_META", meta: { status: "running", model_label: "Pipeline Sim", model_id: "claude-opus-4-6" } },
    { t: "UPSERT_MESSAGE", msg: { id: userMsgId, turn_id: turnId, role: "user", created_at_ms: now, text: "\uC0C8\uB85C\uC6B4 \uB370\uC774\uD130 \uC18C\uC2A4 \uC5B4\uB311\uD130 \uAD6C\uD604\uD574\uC918", status: "final" } },
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [{ phase: "user_message", message_ids: [userMsgId], tool_call_ids: [], summary: "\uB370\uC774\uD130 \uC18C\uC2A4 \uC5B4\uB311\uD130 \uAD6C\uD604", collapsed: false, status: "success" }], status: "running", created_at_ms: now } },
  ]);
  await sleep(300);

  // Thinking
  const thinkMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: thinkMsgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" } },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "running", message_ids: [thinkMsgId], summary: "\uD30C\uC774\uD504\uB77C\uC778 \uBD84\uC11D \uC911..." } },
  ]);
  await streamText(thinkMsgId, "\uAE30\uB2A5 \uAD6C\uD604 \uC694\uCCAD\uC744 MCTS \uC804\uB7B5\uC73C\uB85C \uD0D0\uC0C9\uD569\uB2C8\uB2E4. 15\uAC1C \uD6C4\uBCF4 \uC911 \uCD5C\uC801 \uC544\uD0A4\uD14D\uCC98\uB97C \uC120\uD0DD...", 1500);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: thinkMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "success", collapsed: true } });

  // Pipeline: call the full simFeature which has progressive MCTS updates
  await simFeature(turnId);

  // Summary
  const summaryMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: summaryMsgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" } },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "running", message_ids: [summaryMsgId] } },
  ]);
  await streamText(
    summaryMsgId,
    "**Feature \uD30C\uC774\uD504\uB77C\uC778 \uC644\uB8CC**\n\n" +
    "\u2022 **Strategy**: MCTS (depth 6, 15 candidates \u2192 adapter pattern \uC120\uD0DD)\n" +
    "\u2022 **Validation**: 28/28 tests pass, 3/3 invariants hold\n" +
    "\u2022 **Verdict**: DataSourceAdapter interface \uAD6C\uD604 (confidence 0.92)\n\n" +
    "\uAC70\uBD80\uB41C \uB300\uC548: \uC9C1\uC811 \uC11C\uBE44\uC2A4 \uD655\uC7A5(\uB192\uC740 coupling), \uBCC4\uB3C4 DI \uBAA8\uB4C8(\uACFC\uC124\uACC4), monkeypatch(\uBD88\uBCC0\uC131 \uC704\uBC18)",
    2500,
  );
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: summaryMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "success" } });

  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "success", created_at_ms: now } },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
  // eslint-disable-next-line no-console
  console.log("[sim] Feature scenario with chat turn completed");
}

export async function simScenarioDangerous() {
  const turnId = nextTurnId();
  const now = Date.now();
  const userMsgId = nextMsgId();

  postServerEvents([
    { t: "SET_SESSION_META", meta: { status: "running", model_label: "Pipeline Sim", model_id: "claude-opus-4-6" } },
    { t: "UPSERT_MESSAGE", msg: { id: userMsgId, turn_id: turnId, role: "user", created_at_ms: now, text: "\uB808\uAC70\uC2DC DB \uB9C8\uC774\uADF8\uB808\uC774\uC158 \uC2E4\uD589\uD574\uC918", status: "final" } },
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [{ phase: "user_message", message_ids: [userMsgId], tool_call_ids: [], summary: "\uB808\uAC70\uC2DC DB \uB9C8\uC774\uADF8\uB808\uC774\uC158", collapsed: false, status: "success" }], status: "running", created_at_ms: now } },
  ]);
  await sleep(300);

  // Thinking
  const thinkMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: thinkMsgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" } },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "running", message_ids: [thinkMsgId], summary: "\uD30C\uC774\uD504\uB77C\uC778 \uBD84\uC11D \uC911..." } },
  ]);
  await streamText(thinkMsgId, "\uC704\uD5D8 \uBD84\uC11D \uC911... PII \uAC10\uC9C0, \uBE44\uAC00\uC5ED\uC801 \uC791\uC5C5 \uD655\uC778. Fail-Closed \uC81C\uC57D \uC801\uC6A9 \uC911...", 1500);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: thinkMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "success", collapsed: true } });

  // Pipeline: call the full simDangerous
  await simDangerous(turnId);

  // Summary — error outcome
  const summaryMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: summaryMsgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" } },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "running", message_ids: [summaryMsgId] } },
  ]);
  await streamText(
    summaryMsgId,
    "**\uD30C\uC774\uD504\uB77C\uC778 BLOCKED**\n\n" +
    "\u2022 **Input Gate**: DANGEROUS risk, PII \uAC10\uC9C0\n" +
    "\u2022 **Fail-Closed**: read-only \uBAA8\uB4DC (0 side-effects)\n" +
    "\u2022 **Validation**: FAIL \u2014 0/3 invariants, 2 critical risks\n" +
    "\u2022 **Verdict**: confidence 0.0, \uC2E4\uD589 \uBD88\uAC00\n\n" +
    "\uCC28\uB2E8 \uC0AC\uC720:\n1. PII(\uC774\uBA54\uC77C) \uB85C\uADF8 \uB178\uCD9C (GDPR \uC704\uBC18)\n2. DROP TABLE \uBE44\uAC00\uC5ED\uC801 (rollback \uBD88\uAC00)\n3. \uD14C\uC2A4\uD2B8 \uCEE4\uBC84\uB9AC\uC9C0 42% (80% \uBBF8\uB2EC)",
    3000,
  );
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: summaryMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "error" } });

  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "error", created_at_ms: now } },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
  // eslint-disable-next-line no-console
  console.log("[sim] Dangerous scenario with chat turn completed (BLOCKED)");
}

/**
 * Multi-Agent scenario: Orchestrator dispatches to Planner → Coder → Reviewer → Tester
 * Each turn has a distinct agent identity with role-colored badges.
 */
export async function simScenarioMultiAgent() {
  const now = Date.now();

  // ── Turn 1: User request ──
  const t1 = nextTurnId();
  const userMsgId = nextMsgId();
  postServerEvents([
    { t: "SET_SESSION_META", meta: { status: "running", model_label: "Multi-Agent", model_id: "claude-opus-4-6" } },
    { t: "UPSERT_MESSAGE", msg: { id: userMsgId, turn_id: t1, role: "user", created_at_ms: now, text: "사용자 인증 시스템에 OAuth2 소셜 로그인 추가해줘", status: "final" } },
    { t: "UPSERT_TURN", turn: { id: t1, phases: [{ phase: "user_message", message_ids: [userMsgId], tool_call_ids: [], summary: "OAuth2 소셜 로그인 추가 요청", collapsed: false, status: "success" }], status: "success", created_at_ms: now } },
  ]);
  await sleep(400);

  // ── Turn 2: Orchestrator dispatches ──
  const t2 = nextTurnId();
  const orchMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: orchMsgId, turn_id: t2, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming", agent_id: "orchestrator-1", agent_name: "Orchestrator", agent_role: "orchestrator" } },
    { t: "UPSERT_TURN", turn: { id: t2, phases: [{ phase: "thinking", message_ids: [orchMsgId], tool_call_ids: [], summary: "작업 분배 중", collapsed: false, status: "running" }], status: "running", created_at_ms: Date.now(), agent_id: "orchestrator-1", agent_name: "Orchestrator", agent_role: "orchestrator" } },
  ]);
  await streamText(orchMsgId, "OAuth2 소셜 로그인 구현을 위해 **4개 에이전트**에 작업을 분배합니다.\n\n1.  **Planner** → 아키텍처 설계\n2.  **Coder** → 구현\n3.  **Reviewer** → 코드 리뷰\n4. 6. **Tester** → 테스트 작성", 2000);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: orchMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: t2, phase: "thinking", entry: { status: "success", collapsed: true } });
  postServerEvent({ t: "UPSERT_TURN", turn: { id: t2, phases: [], status: "success", created_at_ms: Date.now(), agent_id: "orchestrator-1", agent_name: "Orchestrator", agent_role: "orchestrator" } });
  await sleep(300);

  // ── Turn 3: Planner ──
  const t3 = nextTurnId();
  const planMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: planMsgId, turn_id: t3, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming", agent_id: "planner-1", agent_name: "Planner", agent_role: "planner" } },
    { t: "UPSERT_TURN", turn: { id: t3, phases: [{ phase: "plan", message_ids: [planMsgId], tool_call_ids: [], summary: "아키텍처 설계", collapsed: false, status: "running" }], status: "running", created_at_ms: Date.now(), agent_id: "planner-1", agent_name: "Planner", agent_role: "planner" } },
  ]);
  await streamText(planMsgId, "## OAuth2 아키텍처 설계\n\n### 구조\n```\nsrc/auth/\n  ├── providers/     # Google, GitHub, Kakao\n  ├── strategies/    # Passport strategies\n  ├── middleware/    # Auth guard\n  └── tokens/       # JWT + Refresh\n```\n\n### 단계\n1. Provider 인터페이스 정의\n2. Google OAuth strategy 구현\n3. 토큰 교환 미들웨어\n4. 세션 관리 + Refresh token rotation", 2500);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: planMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: t3, phase: "plan", entry: { status: "success" } });
  postServerEvent({ t: "UPSERT_TURN", turn: { id: t3, phases: [], status: "success", created_at_ms: Date.now(), agent_id: "planner-1", agent_name: "Planner", agent_role: "planner" } });
  await sleep(300);

  // ── Turn 4: Coder ──
  const t4 = nextTurnId();
  const codeMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: codeMsgId, turn_id: t4, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming", agent_id: "coder-1", agent_name: "Coder", agent_role: "coder" } },
    { t: "UPSERT_TURN", turn: { id: t4, phases: [{ phase: "changes", message_ids: [codeMsgId], tool_call_ids: [], summary: "코드 구현", collapsed: false, status: "running" }], status: "running", created_at_ms: Date.now(), agent_id: "coder-1", agent_name: "Coder", agent_role: "coder" } },
  ]);
  await streamText(codeMsgId, "### `src/auth/providers/google.ts`\n```typescript\nexport class GoogleOAuthProvider implements OAuthProvider {\n  async authenticate(code: string): Promise<OAuthResult> {\n    const tokens = await this.exchangeCode(code);\n    const profile = await this.fetchProfile(tokens.access_token);\n    return {\n      provider: 'google',\n      providerId: profile.sub,\n      email: profile.email,\n      name: profile.name,\n      avatar: profile.picture,\n    };\n  }\n}\n```\n\n**4개 파일** 생성, **2개 파일** 수정 완료.", 3000);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: codeMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: t4, phase: "changes", entry: { status: "success" } });
  postServerEvent({ t: "UPSERT_TURN", turn: { id: t4, phases: [], status: "success", created_at_ms: Date.now(), agent_id: "coder-1", agent_name: "Coder", agent_role: "coder" } });
  await sleep(300);

  // ── Turn 5: Reviewer ──
  const t5 = nextTurnId();
  const reviewMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: reviewMsgId, turn_id: t5, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming", agent_id: "reviewer-1", agent_name: "Reviewer", agent_role: "reviewer" } },
    { t: "UPSERT_TURN", turn: { id: t5, phases: [{ phase: "analysis", message_ids: [reviewMsgId], tool_call_ids: [], summary: "코드 리뷰", collapsed: false, status: "running" }], status: "running", created_at_ms: Date.now(), agent_id: "reviewer-1", agent_name: "Reviewer", agent_role: "reviewer" } },
  ]);
  await streamText(reviewMsgId, "## 코드 리뷰 결과\n\n[PASS] **Provider 인터페이스** — 깔끔한 추상화\n[PASS] **Token rotation** — Refresh token 재발급 로직 정상\n[WARN] **CSRF 보호** — state 파라미터 검증 추가 필요\n[WARN] **Rate limiting** — OAuth callback에 rate limit 적용 권장\n\n**심각도**: 2 Warning / 0 Error\n**승인**: 조건부 승인 (CSRF 수정 후)", 2000);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: reviewMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: t5, phase: "analysis", entry: { status: "success" } });
  postServerEvent({ t: "UPSERT_TURN", turn: { id: t5, phases: [], status: "success", created_at_ms: Date.now(), agent_id: "reviewer-1", agent_name: "Reviewer", agent_role: "reviewer" } });
  await sleep(300);

  // ── Turn 6: Tester ──
  const t6 = nextTurnId();
  const testMsgId = nextMsgId();
  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: testMsgId, turn_id: t6, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming", agent_id: "tester-1", agent_name: "Tester", agent_role: "tester" } },
    { t: "UPSERT_TURN", turn: { id: t6, phases: [{ phase: "summary", message_ids: [testMsgId], tool_call_ids: [], summary: "테스트 작성", collapsed: false, status: "running" }], status: "running", created_at_ms: Date.now(), agent_id: "tester-1", agent_name: "Tester", agent_role: "tester" } },
  ]);
  await streamText(testMsgId, "## 테스트 결과\n\n```\n[PASS] GoogleOAuthProvider.authenticate     12ms\n[PASS] TokenRotation.refresh                 8ms\n[PASS] AuthGuard.validateSession             3ms\n[PASS] CSRFProtection.verifyState            2ms\n[PASS] Integration: Full OAuth flow          45ms\n```\n\n**5/5 테스트 통과** | 커버리지 **94%**", 2000);
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: testMsgId, status: "final" });
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: t6, phase: "summary", entry: { status: "success" } });
  postServerEvent({ t: "UPSERT_TURN", turn: { id: t6, phases: [], status: "success", created_at_ms: Date.now(), agent_id: "tester-1", agent_name: "Tester", agent_role: "tester" } });

  // ── Done ──
  postServerEvent({ t: "SET_SESSION_META", meta: { status: "idle", cost_usd: 0.0847, tokens_in: 12340, tokens_out: 5680 } });
  // eslint-disable-next-line no-console
  console.log("[sim]  Multi-Agent scenario completed (Orchestrator → Planner → Coder → Reviewer → Tester)");
}
