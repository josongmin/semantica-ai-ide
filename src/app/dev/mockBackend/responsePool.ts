/**
 * Response pool for mock backend.
 *
 * Covers all 9 intent types from the Request Classifier:
 *   Q_INFO, Q_LOCATE, Q_DIAG, Q_FIX, Q_REFACTOR, Q_SEC, Q_PERF, Q_SPEC, Q_MIGRATE
 *
 * Each response also carries risk level (R0–R4), change size (C0–C3),
 * and uncertainty (U0–U3) metadata so the handler can vary turn structure.
 */

// ── Types ─────────────────────────────────────────────────────

export type IntentType =
  | "Q_INFO"
  | "Q_LOCATE"
  | "Q_DIAG"
  | "Q_FIX"
  | "Q_REFACTOR"
  | "Q_SEC"
  | "Q_PERF"
  | "Q_SPEC"
  | "Q_MIGRATE";

export type MockRiskLevel = "R0" | "R1" | "R2" | "R3" | "R4";
export type ChangeSize = "C0" | "C1" | "C2" | "C3";
export type Uncertainty = "U0" | "U1" | "U2" | "U3";

export interface ToolCallEntry {
  tool_name: string;
  category: string;
  args_summary: string;
  result_summary: string;
  duration_ms: number;
}

export interface FileChangeEntry {
  file_path: string;
  status: "added" | "modified" | "deleted";
  insertions: number;
  deletions: number;
}

export interface ResponseEntry {
  text: string;
  intent: IntentType;
  risk: MockRiskLevel;
  changeSize: ChangeSize;
  uncertainty: Uncertainty;
  toolCalls?: ToolCallEntry[];
  fileChanges?: FileChangeEntry[];
  /** Custom thinking text for the thinking phase */
  thinkingText?: string;
  /** Custom plan steps */
  planSteps?: string;
}

export interface Classification {
  intent: IntentType;
  risk: MockRiskLevel;
  changeSize: ChangeSize;
  uncertainty: Uncertainty;
}

// ── Intent Classification ─────────────────────────────────────

const INTENT_KEYWORDS: [IntentType, string[]][] = [
  ["Q_MIGRATE", ["migrate", "마이그레이션", "migration", "upgrade", "업그레이드", "convert", "변환", "port", "이전"]],
  ["Q_SEC", ["security", "보안", "vulnerability", "취약", "xss", "injection", "csrf", "auth", "인증", "인가", "owasp", "cve"]],
  ["Q_PERF", ["performance", "성능", "optimize", "최적화", "slow", "느린", "memory", "메모리", "bottleneck", "병목", "profil", "benchmark"]],
  ["Q_DIAG", ["debug", "디버그", "diagnosis", "진단", "왜 안", "안되", "fail", "crash", "error", "에러", "오류", "broken", "깨진", "안 돼"]],
  ["Q_FIX", ["fix", "수정", "bug", "버그", "patch", "hotfix", "resolve", "해결", "create", "만들", "생성", "add", "추가", "new", "implement", "구현"]],
  ["Q_REFACTOR", ["refactor", "리팩토", "clean", "정리", "개선", "restructure", "simplify", "단순화", "extract", "추출"]],
  ["Q_LOCATE", ["find", "찾", "where", "어디", "locate", "위치", "which file", "어떤 파일", "search", "검색", "grep"]],
  ["Q_SPEC", ["spec", "스펙", "document", "문서", "type", "타입", "interface", "인터페이스", "schema", "스키마", "api doc", "jsdoc", "test", "테스트", "coverage", "커버리지"]],
  ["Q_INFO", ["explain", "설명", "어떻게", "뭐", "what", "how", "why", "왜", "구조", "architecture", "개념", "concept", "이해"]],
];

function detectIntent(text: string): IntentType {
  const lower = text.toLowerCase();
  for (const [intent, words] of INTENT_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return intent;
  }
  return "Q_INFO"; // default fallback
}

function inferRisk(intent: IntentType, text: string): MockRiskLevel {
  const lower = text.toLowerCase();
  // Explicit risk hints
  if (lower.includes("production") || lower.includes("프로덕션") || lower.includes("운영")) return "R3";
  if (lower.includes("database") || lower.includes("db") || lower.includes("데이터베이스")) return "R3";
  if (lower.includes("payment") || lower.includes("결제") || lower.includes("billing")) return "R4";
  if (lower.includes("regulatory") || lower.includes("규제") || lower.includes("compliance")) return "R4";

  // Intent-based defaults
  const defaults: Record<IntentType, MockRiskLevel> = {
    Q_INFO: "R0",
    Q_LOCATE: "R0",
    Q_DIAG: "R1",
    Q_SPEC: "R0",
    Q_FIX: "R2",
    Q_REFACTOR: "R2",
    Q_SEC: "R3",
    Q_PERF: "R2",
    Q_MIGRATE: "R3",
  };
  return defaults[intent];
}

function inferChangeSize(intent: IntentType, text: string): ChangeSize {
  const lower = text.toLowerCase();
  if (lower.includes("전체") || lower.includes("all") || lower.includes("repo-wide") || lower.includes("프로젝트 전체")) return "C3";
  if (lower.includes("여러") || lower.includes("multiple") || lower.includes("몇 개")) return "C2";

  const defaults: Record<IntentType, ChangeSize> = {
    Q_INFO: "C0",
    Q_LOCATE: "C0",
    Q_DIAG: "C0",
    Q_SPEC: "C1",
    Q_FIX: "C1",
    Q_REFACTOR: "C2",
    Q_SEC: "C2",
    Q_PERF: "C1",
    Q_MIGRATE: "C3",
  };
  return defaults[intent];
}

function inferUncertainty(text: string): Uncertainty {
  const lower = text.toLowerCase();
  // "?" + ("or" or "또는") → asking for alternatives = high uncertainty
  if (lower.includes("?") && (lower.includes("or") || lower.includes("또는"))) return "U2";
  // "또는" alone still indicates presenting options
  if (lower.includes("또는")) return "U2";
  if (lower.includes("best") || lower.includes("최선") || lower.includes("recommend") || lower.includes("추천")) return "U1";
  if (lower.includes("어떻게 하면") || lower.includes("방법이") || lower.includes("가능할까")) return "U2";
  if (lower.length < 15) return "U1"; // very short prompts tend to be ambiguous
  return "U0";
}

/** Classify user input into intent/risk/changeSize/uncertainty */
export function classifyIntent(text: string): Classification {
  const intent = detectIntent(text);
  return {
    intent,
    risk: inferRisk(intent, text),
    changeSize: inferChangeSize(intent, text),
    uncertainty: inferUncertainty(text),
  };
}

// ── Response Pools ────────────────────────────────────────────

const responses: Record<IntentType, ResponseEntry[]> = {
  // ── Q_INFO: Information / Explanation ──────────────────────
  Q_INFO: [
    {
      intent: "Q_INFO", risk: "R0", changeSize: "C0", uncertainty: "U0",
      text: "코드를 분석했습니다.\n\n### 동작 방식\n이 모듈은 **Observer 패턴**을 구현합니다:\n\n1. `subscribe()` — 리스너 등록\n2. `notify()` — 모든 리스너에 이벤트 전파\n3. `unsubscribe()` — 리스너 해제\n\n### 핵심 포인트\n- WeakRef를 사용해 메모리 누수 방지\n- 이벤트 큐는 microtask로 처리되어 batch 최적화\n- TypeScript 제네릭으로 이벤트 타입 안전성 보장",
      thinkingText: "사용자가 코드의 동작 방식에 대한 설명을 요청했습니다. 해당 모듈의 구조와 패턴을 분석하겠습니다.",
    },
    {
      intent: "Q_INFO", risk: "R0", changeSize: "C0", uncertainty: "U0",
      text: "이 프로젝트는 **Feature Sliced Design (FSD)** 아키텍처를 따릅니다.\n\n### 레이어 구조\n- `shared/` — UI 프리미티브, 프로토콜 타입, 유틸리티\n- `entities/` — Jotai atom 기반 도메인 모델\n- `features/` — 비즈니스 로직 (send-message, streaming)\n- `widgets/` — 조합 컴포넌트 (TurnContainer, MessageRow)\n- `pages/` — 라우트 페이지\n- `app/` — 앱 진입점, 프로바이더\n\n각 레이어는 단방향 의존성을 가지며, 하위 레이어만 import할 수 있습니다.",
      thinkingText: "프로젝트 아키텍처에 대한 질문입니다. FSD 구조를 설명하겠습니다.",
    },
    {
      intent: "Q_INFO", risk: "R0", changeSize: "C0", uncertainty: "U1",
      text: "React의 `useEffect`와 `useLayoutEffect`의 차이를 설명드립니다.\n\n| 특성 | useEffect | useLayoutEffect |\n|------|-----------|------------------|\n| 실행 시점 | 브라우저 페인트 후 | DOM 변경 직후, 페인트 전 |\n| 블로킹 | 비동기 (non-blocking) | 동기 (blocking) |\n| 용도 | 데이터 fetching, 구독 | DOM 측정, 동기 업데이트 |\n\n대부분의 경우 `useEffect`로 충분하며, 화면 깜빡임이 발생할 때만 `useLayoutEffect`를 사용하세요.",
      thinkingText: "React hooks의 차이점에 대한 설명 요청입니다.",
    },
  ],

  // ── Q_LOCATE: File/Symbol Finding ─────────────────────────
  Q_LOCATE: [
    {
      intent: "Q_LOCATE", risk: "R0", changeSize: "C0", uncertainty: "U0",
      text: "요청하신 파일/심볼을 찾았습니다.\n\n### 검색 결과\n| 파일 | 라인 | 내용 |\n|------|------|------|\n| `src/features/streaming/model/useStreamingCommit.ts` | 42 | `export function useStreamingCommit()` |\n| `src/entities/message/model/atoms.ts` | 15 | `export const messagesAtom = atom(...)` |\n| `src/shared/protocol/types.ts` | 87 | `export type ServerEvent = ...` |\n\n총 3개 위치에서 관련 코드를 발견했습니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "pattern: user query", result_summary: "Found 3 matches across project", duration_ms: 120 },
        { tool_name: "read_file", category: "read", args_summary: "src/features/streaming/model/useStreamingCommit.ts", result_summary: "Read streaming commit hook", duration_ms: 25 },
      ],
      thinkingText: "파일/심볼 위치를 찾는 요청입니다. 프로젝트 전체에서 검색을 수행하겠습니다.",
    },
    {
      intent: "Q_LOCATE", risk: "R0", changeSize: "C0", uncertainty: "U0",
      text: "라우팅 관련 파일들을 찾았습니다.\n\n```\nsrc/app/router/\n├── AppRouter.tsx        ← 메인 라우터 (React Router)\n├── routes.ts            ← 라우트 정의\n└── guards/\n    └── AuthGuard.tsx    ← 인증 가드\n\nsrc/pages/\n├── ChatPage.tsx         ← /chat\n├── SessionsPage.tsx     ← /sessions\n└── SettingsPage.tsx     ← /settings\n```\n\n`AppRouter.tsx`에서 모든 라우트가 정의되어 있습니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "glob: **/router/**", result_summary: "Found router directory", duration_ms: 45 },
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'Route'", result_summary: "Found Route usage in 4 files", duration_ms: 80 },
      ],
      thinkingText: "라우팅 구현 위치를 파악하기 위해 프로젝트를 검색하겠습니다.",
    },
  ],

  // ── Q_DIAG: Failure Diagnosis ─────────────────────────────
  Q_DIAG: [
    {
      intent: "Q_DIAG", risk: "R1", changeSize: "C0", uncertainty: "U1",
      text: "에러를 분석했습니다.\n\n### 원인\n`useCallback`의 의존성 배열에서 `state` 변수가 누락되어 **stale closure** 문제가 발생하고 있습니다.\n\n### 스택 트레이스 분석\n```\nTypeError: Cannot read properties of undefined (reading 'id')\n  at handleClick (Button.tsx:15)\n  at onClick (React event handler)\n```\n\n`handleClick`이 최초 렌더 시점의 `state`를 캡처하고 있어, 이후 업데이트된 값을 참조하지 못합니다.\n\n### 권장 수정\n`useCallback`의 deps에 `state`를 추가하거나, `useRef`로 최신 값을 참조하세요.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "src/components/Button.tsx", result_summary: "Found stale closure in useCallback", duration_ms: 28 },
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'useCallback.*state'", result_summary: "Found 3 similar patterns", duration_ms: 95 },
      ],
      thinkingText: "에러 원인을 진단하기 위해 관련 코드를 분석하겠습니다. 스택 트레이스와 코드 패턴을 확인합니다.",
    },
    {
      intent: "Q_DIAG", risk: "R1", changeSize: "C0", uncertainty: "U2",
      text: "빌드 실패 원인을 분석했습니다.\n\n### 진단 결과\n1. **직접 원인**: `tsconfig.json`의 `paths` 설정이 `vite.config.ts`의 `resolve.alias`와 불일치\n2. **영향 범위**: `@/shared/*` 경로를 사용하는 23개 파일\n3. **트리거**: 최근 vite 6.0 업데이트 후 alias 해석 방식 변경\n\n### 해결 방법\n두 가지 옵션이 있습니다:\n- **A)** `vite.config.ts`의 alias를 tsconfig에 맞게 수정 (권장)\n- **B)** `vite-tsconfig-paths` 플러그인 사용\n\n어떤 방법을 선호하시나요?",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "tsconfig.json", result_summary: "Read TS config paths", duration_ms: 15 },
        { tool_name: "read_file", category: "read", args_summary: "vite.config.ts", result_summary: "Read Vite config aliases", duration_ms: 15 },
        { tool_name: "search_files", category: "search", args_summary: "pattern: '@/shared/'", result_summary: "Found 23 imports", duration_ms: 110 },
      ],
      thinkingText: "빌드 실패의 근본 원인을 파악하기 위해 설정 파일들을 비교 분석하겠습니다.",
    },
  ],

  // ── Q_FIX: Bug Fix ────────────────────────────────────────
  Q_FIX: [
    {
      intent: "Q_FIX", risk: "R2", changeSize: "C1", uncertainty: "U0",
      text: "버그를 수정했습니다.\n\n### 원인\n이벤트 핸들러에서 `useCallback` 의존성 배열이 누락되어 stale closure 문제가 발생했습니다.\n\n### 수정\n- 의존성 배열에 누락된 변수 추가\n- cleanup 함수 추가로 메모리 누수 방지\n\n수정 후 정상 동작을 확인했습니다.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "src/components/Button.tsx", result_summary: "Found stale closure", duration_ms: 28 },
        { tool_name: "write_file", category: "write", args_summary: "src/components/Button.tsx", result_summary: "Fixed useCallback deps", duration_ms: 15 },
      ],
      fileChanges: [
        { file_path: "src/components/Button.tsx", status: "modified", insertions: 3, deletions: 2 },
      ],
      thinkingText: "버그 수정 요청입니다. 관련 코드를 읽고 원인을 파악한 후 수정하겠습니다.",
      planSteps: "1. Read the affected component\n2. Identify the stale closure\n3. Fix useCallback dependencies\n4. Verify no side effects",
    },
    {
      intent: "Q_FIX", risk: "R2", changeSize: "C2", uncertainty: "U0",
      text: "두 파일에 걸친 버그를 수정했습니다.\n\n### 원인\n`useStreamingCommit`에서 origin 검증 로직이 dev 모드에서 `localhost`를 허용하지 않아 메시지가 무시되고 있었습니다.\n\n### 수정 파일\n- `src/features/streaming/model/useStreamingCommit.ts` — origin 검증 조건 수정\n- `src/shared/lib/vscodeApi.ts` — dev fallback에서 origin 헤더 추가\n\n기존 테스트 전부 통과합니다.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "useStreamingCommit.ts", result_summary: "Found origin check", duration_ms: 30 },
        { tool_name: "read_file", category: "read", args_summary: "vscodeApi.ts", result_summary: "Found dev fallback", duration_ms: 20 },
        { tool_name: "write_file", category: "write", args_summary: "useStreamingCommit.ts", result_summary: "Fixed origin validation", duration_ms: 18 },
        { tool_name: "write_file", category: "write", args_summary: "vscodeApi.ts", result_summary: "Added origin header", duration_ms: 12 },
      ],
      fileChanges: [
        { file_path: "src/features/streaming/model/useStreamingCommit.ts", status: "modified", insertions: 5, deletions: 2 },
        { file_path: "src/shared/lib/vscodeApi.ts", status: "modified", insertions: 3, deletions: 1 },
      ],
      thinkingText: "dev 모드 메시지 전달 버그를 수정합니다. origin 검증 로직을 확인하겠습니다.",
    },
    {
      intent: "Q_FIX", risk: "R3", changeSize: "C1", uncertainty: "U0",
      text: "**[High Risk]** 프로덕션 환경의 인증 토큰 만료 버그를 수정했습니다.\n\n### 원인\n토큰 갱신 로직에서 `expiresAt`을 UTC가 아닌 로컬 타임존으로 비교하여, 서버 시간과 불일치가 발생했습니다.\n\n### 수정\n- `Date.now()` 대신 서버 응답의 `Date` 헤더 기준으로 만료 계산\n- 토큰 갱신 마진을 30초 → 60초로 확대\n\n[WARN] 프로덕션 배포 전 반드시 통합 테스트를 실행하세요.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "src/auth/tokenManager.ts", result_summary: "Found timezone issue in token refresh", duration_ms: 35 },
        { tool_name: "write_file", category: "write", args_summary: "src/auth/tokenManager.ts", result_summary: "Fixed timezone comparison", duration_ms: 20 },
      ],
      fileChanges: [
        { file_path: "src/auth/tokenManager.ts", status: "modified", insertions: 8, deletions: 4 },
      ],
      thinkingText: "프로덕션 인증 버그 — 높은 위험도입니다. 토큰 갱신 로직을 신중하게 분석하겠습니다.",
    },
    {
      intent: "Q_FIX", risk: "R1", changeSize: "C2", uncertainty: "U0",
      text: "새 컴포넌트를 생성했습니다.\n\n### 파일 구조\n- `src/widgets/new-widget/NewWidget.tsx` — 메인 컴포넌트\n- `src/widgets/new-widget/index.ts` — barrel export\n\nProps 인터페이스와 기본 스타일링이 포함되어 있습니다. Tailwind CSS 클래스와 기존 디자인 토큰을 사용합니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "existing widget patterns", result_summary: "Analyzed 8 widgets", duration_ms: 95 },
        { tool_name: "write_file", category: "write", args_summary: "src/widgets/new-widget/NewWidget.tsx", result_summary: "Created component", duration_ms: 20 },
        { tool_name: "write_file", category: "write", args_summary: "src/widgets/new-widget/index.ts", result_summary: "Created barrel", duration_ms: 8 },
      ],
      fileChanges: [
        { file_path: "src/widgets/new-widget/NewWidget.tsx", status: "added", insertions: 42, deletions: 0 },
        { file_path: "src/widgets/new-widget/index.ts", status: "added", insertions: 1, deletions: 0 },
      ],
      thinkingText: "새 코드 생성 요청입니다. 기존 패턴을 분석하고 일관된 구조로 생성하겠습니다.",
      planSteps: "1. Analyze existing widget patterns\n2. Create component file\n3. Create barrel export\n4. Verify integration",
    },
    {
      intent: "Q_FIX", risk: "R1", changeSize: "C1", uncertainty: "U0",
      // eslint-disable-next-line no-template-curly-in-string -- intentional: mock code snippet with template literal syntax
      text: "새 유틸리티 함수를 추가했습니다.\n\n```typescript\nexport function formatDuration(ms: number): string {\n  if (ms < 1000) return `${ms}ms`;\n  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;\n  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;\n}\n```\n\n기존 테스트 패턴에 맞춰 단위 테스트도 함께 추가했습니다.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "src/shared/lib/utils.ts", result_summary: "Read existing utilities", duration_ms: 15 },
        { tool_name: "write_file", category: "write", args_summary: "src/shared/lib/formatDuration.ts", result_summary: "Created utility", duration_ms: 10 },
      ],
      fileChanges: [
        { file_path: "src/shared/lib/formatDuration.ts", status: "added", insertions: 18, deletions: 0 },
      ],
      thinkingText: "새 유틸리티 함수 생성 요청입니다. 기존 유틸리티 패턴을 확인하겠습니다.",
    },
  ],

  // ── Q_REFACTOR: Code Refactoring ──────────────────────────
  Q_REFACTOR: [
    {
      intent: "Q_REFACTOR", risk: "R2", changeSize: "C2", uncertainty: "U0",
      text: "리팩토링을 완료했습니다.\n\n### 변경 사항\n1. 중복 로직을 커스텀 훅으로 추출 (`useSharedLogic`)\n2. 매직 넘버를 상수로 분리\n3. 타입 안전성 개선 (generic 적용)\n\n기존 테스트 전부 통과, 동작 변경 없음을 확인했습니다.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "src/features/shared.ts", result_summary: "Identified duplicated patterns", duration_ms: 40 },
        { tool_name: "write_file", category: "write", args_summary: "src/hooks/useSharedLogic.ts", result_summary: "Created shared hook", duration_ms: 22 },
        { tool_name: "write_file", category: "write", args_summary: "src/features/shared.ts", result_summary: "Refactored to use hook", duration_ms: 18 },
      ],
      fileChanges: [
        { file_path: "src/hooks/useSharedLogic.ts", status: "added", insertions: 28, deletions: 0 },
        { file_path: "src/features/shared.ts", status: "modified", insertions: 5, deletions: 35 },
      ],
      thinkingText: "리팩토링 요청입니다. 중복 코드 패턴을 분석하고 공통 추출을 계획하겠습니다.",
      planSteps: "1. Identify duplicated patterns\n2. Extract shared hook\n3. Update consumers\n4. Verify test pass",
    },
    {
      intent: "Q_REFACTOR", risk: "R2", changeSize: "C3", uncertainty: "U1",
      text: "대규모 리팩토링을 완료했습니다.\n\n### 변경 요약\n- **Before**: 각 컴포넌트가 개별적으로 API 호출, 에러 처리 중복\n- **After**: `useApiQuery` 훅 + `ApiProvider` 패턴으로 통합\n\n### 변경 파일 (7개)\n| 파일 | 변경 내용 |\n|------|----------|\n| `src/shared/hooks/useApiQuery.ts` | 새 공통 훅 생성 |\n| `src/shared/providers/ApiProvider.tsx` | 에러 바운더리 통합 |\n| `src/features/chat/api.ts` | useApiQuery로 교체 |\n| `src/features/session/api.ts` | useApiQuery로 교체 |\n| `src/features/settings/api.ts` | useApiQuery로 교체 |\n| `src/features/export/api.ts` | useApiQuery로 교체 |\n| `src/app/App.tsx` | ApiProvider 래핑 |\n\n모든 테스트 통과를 확인했습니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'fetch\\('", result_summary: "Found 12 API call patterns", duration_ms: 130 },
        { tool_name: "read_file", category: "read", args_summary: "multiple files", result_summary: "Analyzed 7 API patterns", duration_ms: 60 },
        { tool_name: "write_file", category: "write", args_summary: "useApiQuery.ts", result_summary: "Created shared hook", duration_ms: 25 },
        { tool_name: "write_file", category: "write", args_summary: "5 more files", result_summary: "Migrated to shared hook", duration_ms: 45 },
      ],
      fileChanges: [
        { file_path: "src/shared/hooks/useApiQuery.ts", status: "added", insertions: 65, deletions: 0 },
        { file_path: "src/shared/providers/ApiProvider.tsx", status: "added", insertions: 38, deletions: 0 },
        { file_path: "src/features/chat/api.ts", status: "modified", insertions: 8, deletions: 32 },
        { file_path: "src/features/session/api.ts", status: "modified", insertions: 6, deletions: 28 },
        { file_path: "src/features/settings/api.ts", status: "modified", insertions: 5, deletions: 25 },
        { file_path: "src/features/export/api.ts", status: "modified", insertions: 4, deletions: 20 },
        { file_path: "src/app/App.tsx", status: "modified", insertions: 3, deletions: 1 },
      ],
      thinkingText: "API 호출 패턴이 분산되어 있습니다. 공통 추상화를 만들어 통합하겠습니다.",
      planSteps: "1. Audit all API call patterns\n2. Design useApiQuery hook\n3. Create ApiProvider\n4. Migrate each feature\n5. Remove old patterns\n6. Run tests",
    },
  ],

  // ── Q_SEC: Security Analysis ──────────────────────────────
  Q_SEC: [
    {
      intent: "Q_SEC", risk: "R3", changeSize: "C2", uncertainty: "U0",
      text: "보안 분석을 완료했습니다.\n\n### 발견된 취약점\n\n| 심각도 | 유형 | 위치 | 상태 |\n|--------|------|------|------|\n| 🔴 Critical | XSS | `MessageRow.tsx:45` | **수정 완료** |\n| 🟡 Medium | CSRF | `api/middleware.ts:12` | **수정 완료** |\n| [LIVE] Low | Info leak | `errorHandler.ts:8` | **수정 완료** |\n\n### 수정 내용\n1. **XSS 방지**: `dangerouslySetInnerHTML` → `DOMPurify.sanitize()` 적용\n2. **CSRF 토큰**: 모든 POST 요청에 CSRF 토큰 헤더 추가\n3. **정보 노출**: 프로덕션 에러 응답에서 스택 트레이스 제거",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'dangerouslySetInnerHTML'", result_summary: "Found 2 XSS-vulnerable locations", duration_ms: 90 },
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'csrf|token'", result_summary: "No CSRF protection found", duration_ms: 85 },
        { tool_name: "read_file", category: "read", args_summary: "src/api/middleware.ts", result_summary: "Missing CSRF middleware", duration_ms: 20 },
        { tool_name: "write_file", category: "write", args_summary: "MessageRow.tsx", result_summary: "Added DOMPurify", duration_ms: 15 },
        { tool_name: "write_file", category: "write", args_summary: "api/middleware.ts", result_summary: "Added CSRF token validation", duration_ms: 18 },
      ],
      fileChanges: [
        { file_path: "src/widgets/message-row/MessageRow.tsx", status: "modified", insertions: 5, deletions: 2 },
        { file_path: "src/api/middleware.ts", status: "modified", insertions: 15, deletions: 3 },
        { file_path: "src/shared/lib/errorHandler.ts", status: "modified", insertions: 4, deletions: 1 },
      ],
      thinkingText: "보안 분석 요청입니다. OWASP Top 10 기준으로 코드베이스를 스캔하겠습니다.",
      planSteps: "1. Scan for XSS vulnerabilities\n2. Check CSRF protection\n3. Audit error handling\n4. Fix critical issues\n5. Verify fixes",
    },
    {
      intent: "Q_SEC", risk: "R4", changeSize: "C0", uncertainty: "U0",
      text: "**[Critical Risk]** 보안 감사를 완료했습니다.\n\n### 결과 요약\n[PASS] 인증/인가 — 정상\n[PASS] 입력 검증 — 정상\n[WARN] 의존성 취약점 — `lodash` 4.17.20 (CVE-2021-23337)\n[WARN] 비밀 관리 — `.env` 파일이 git에 추적됨\n\n### 권장 조치\n1. `npm audit fix` 실행으로 의존성 업데이트\n2. `.gitignore`에 `.env` 추가 + git history에서 제거\n3. 시크릿 로테이션 (노출된 키 교체)\n\n[WARN] 이 결과는 자동 스캔이므로, 전문 보안 감사도 병행하는 것을 권장합니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "glob: '**/.env*'", result_summary: "Found .env in git", duration_ms: 40 },
        { tool_name: "read_file", category: "read", args_summary: "package-lock.json", result_summary: "Checked dependency versions", duration_ms: 50 },
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'API_KEY|SECRET|PASSWORD'", result_summary: "Found 2 hardcoded secrets", duration_ms: 110 },
      ],
      thinkingText: "보안 감사 — 최고 위험도입니다. 인증, 입력 검증, 의존성, 시크릿 관리를 전수 점검하겠습니다.",
    },
  ],

  // ── Q_PERF: Performance Optimization ──────────────────────
  Q_PERF: [
    {
      intent: "Q_PERF", risk: "R2", changeSize: "C1", uncertainty: "U0",
      text: "성능 최적화를 완료했습니다.\n\n### 분석 결과\n- **Before**: `MessageRow` 컴포넌트가 부모 리렌더마다 재렌더 (평균 16ms/render)\n- **After**: `React.memo` + `useMemo`로 불필요한 리렌더 제거 (평균 2ms/render)\n\n### 적용 최적화\n1. `React.memo`로 props 변경 시에만 리렌더\n2. `useMemo`로 마크다운 파싱 결과 캐싱\n3. 가상 스크롤 적용으로 DOM 노드 수 90% 감소\n\n**성능 개선**: 렌더링 시간 **87.5% 감소** (16ms → 2ms)",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "MessageRow.tsx", result_summary: "Found unnecessary re-renders", duration_ms: 25 },
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'React.memo'", result_summary: "Only 2 components memoized", duration_ms: 70 },
        { tool_name: "write_file", category: "write", args_summary: "MessageRow.tsx", result_summary: "Added memoization", duration_ms: 20 },
      ],
      fileChanges: [
        { file_path: "src/widgets/message-row/MessageRow.tsx", status: "modified", insertions: 12, deletions: 5 },
      ],
      thinkingText: "성능 최적화 요청입니다. React DevTools 프로파일링 관점에서 리렌더 패턴을 분석하겠습니다.",
      planSteps: "1. Profile component renders\n2. Identify unnecessary re-renders\n3. Apply React.memo + useMemo\n4. Measure improvement",
    },
    {
      intent: "Q_PERF", risk: "R2", changeSize: "C2", uncertainty: "U1",
      text: "번들 사이즈 최적화를 완료했습니다.\n\n### 분석 결과\n```\nBefore: 1.2MB (gzipped: 380KB)\nAfter:  680KB (gzipped: 210KB)  ← 44% 감소\n```\n\n### 적용 최적화\n1. **Code splitting**: `React.lazy()` + `Suspense`로 라우트별 청크 분리\n2. **Tree shaking**: `lodash` → `lodash-es`로 교체 (-120KB)\n3. **Dynamic import**: 무거운 라이브러리 (highlight.js, katex) 지연 로드\n\n### 청크 분석\n| 청크 | Before | After |\n|------|--------|-------|\n| vendor | 800KB | 420KB |\n| main | 300KB | 180KB |\n| lazy chunks | 0 | 80KB (on demand) |",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "vite.config.ts", result_summary: "Checked build config", duration_ms: 15 },
        { tool_name: "read_file", category: "read", args_summary: "package.json", result_summary: "Analyzed dependencies", duration_ms: 10 },
        { tool_name: "write_file", category: "write", args_summary: "vite.config.ts", result_summary: "Added code splitting config", duration_ms: 18 },
        { tool_name: "write_file", category: "write", args_summary: "src/app/router/AppRouter.tsx", result_summary: "Added React.lazy", duration_ms: 22 },
      ],
      fileChanges: [
        { file_path: "vite.config.ts", status: "modified", insertions: 15, deletions: 3 },
        { file_path: "src/app/router/AppRouter.tsx", status: "modified", insertions: 20, deletions: 8 },
        { file_path: "package.json", status: "modified", insertions: 2, deletions: 2 },
      ],
      thinkingText: "번들 사이즈 최적화를 위해 빌드 출력을 분석하겠습니다.",
    },
  ],

  // ── Q_SPEC: Specification / Documentation / Types / Tests ──
  Q_SPEC: [
    {
      intent: "Q_SPEC", risk: "R0", changeSize: "C1", uncertainty: "U0",
      text: "타입 정의를 생성했습니다.\n\n### 생성된 타입\n```typescript\nexport interface UserProfile {\n  id: string;\n  email: string;\n  displayName: string;\n  avatarUrl?: string;\n  role: 'admin' | 'member' | 'viewer';\n  preferences: UserPreferences;\n  createdAt: Date;\n  lastLoginAt: Date;\n}\n\nexport interface UserPreferences {\n  theme: 'light' | 'dark' | 'system';\n  language: string;\n  notifications: NotificationSettings;\n}\n```\n\n기존 코드베이스의 패턴과 컨벤션을 따릅니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "glob: '**/*.d.ts'", result_summary: "Analyzed existing type patterns", duration_ms: 55 },
        { tool_name: "write_file", category: "write", args_summary: "src/shared/types/user.ts", result_summary: "Created type definitions", duration_ms: 12 },
      ],
      fileChanges: [
        { file_path: "src/shared/types/user.ts", status: "added", insertions: 25, deletions: 0 },
      ],
      thinkingText: "타입 정의 생성 요청입니다. 기존 타입 패턴을 분석하고 일관성 있게 작성하겠습니다.",
    },
    {
      intent: "Q_SPEC", risk: "R0", changeSize: "C0", uncertainty: "U0",
      text: "API 스펙을 문서화했습니다.\n\n### `POST /api/sessions`\n**Request Body**\n```json\n{\n  \"model_id\": \"claude-opus-4-6\",\n  \"approval_mode\": \"confirm\",\n  \"context_files\": [\"src/app.ts\"]\n}\n```\n\n**Response 200**\n```json\n{\n  \"session_id\": \"sess_abc123\",\n  \"status\": \"idle\",\n  \"created_at_ms\": 1709568000000\n}\n```\n\n**Error Codes**: 400 (invalid model), 401 (unauthorized), 429 (rate limit)",
      thinkingText: "API 스펙 문서화 요청입니다. 엔드포인트별 요청/응답 형식을 정리하겠습니다.",
    },
    {
      intent: "Q_SPEC", risk: "R1", changeSize: "C1", uncertainty: "U0",
      text: "테스트를 작성했습니다.\n\n### 추가된 테스트\n```typescript\ndescribe('useStreamingCommit', () => {\n  it('processes APPEND_TEXT serverEvents correctly', () => { ... });\n  it('handles SERVER_EVENT_BATCH with multiple serverEvents', () => { ... });\n  it('rejects messages from unknown origins', () => { ... });\n  it('updates message status on SET_MESSAGE_STATUS', () => { ... });\n});\n```\n\n### 커버리지 변화\n- **Before**: 72% (lines), 65% (branches)\n- **After**: 91% (lines), 85% (branches)\n\n`vitest run`으로 전체 테스트 통과를 확인했습니다.",
      toolCalls: [
        { tool_name: "read_file", category: "read", args_summary: "src/features/streaming/model/useStreamingCommit.ts", result_summary: "Read target module", duration_ms: 20 },
        { tool_name: "search_files", category: "search", args_summary: "glob: '**/__tests__/*.test.ts'", result_summary: "Found existing test patterns", duration_ms: 65 },
        { tool_name: "write_file", category: "write", args_summary: "src/features/streaming/__tests__/useStreamingCommit.test.ts", result_summary: "Created test file", duration_ms: 25 },
      ],
      fileChanges: [
        { file_path: "src/features/streaming/__tests__/useStreamingCommit.test.ts", status: "added", insertions: 85, deletions: 0 },
      ],
      thinkingText: "테스트 작성 요청입니다. 기존 테스트 패턴을 분석하고 커버리지를 높이겠습니다.",
      planSteps: "1. Read target module\n2. Analyze existing test patterns\n3. Write unit tests\n4. Run vitest to verify",
    },
    {
      intent: "Q_SPEC", risk: "R1", changeSize: "C2", uncertainty: "U0",
      text: "테스트 커버리지를 개선했습니다.\n\n### 추가된 테스트 파일\n| 파일 | 테스트 수 | 커버리지 |\n|------|----------|----------|\n| `atoms.test.ts` | 12 | 95% |\n| `dispatchServerEvent.test.ts` | 18 | 92% |\n| `isServerEvent.test.ts` | 8 | 100% |\n\n### 전체 커버리지\n```\nBefore: 72% → After: 91% (+19%)\n```\n\n모든 edge case와 에러 경로를 커버합니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "glob: '**/*.test.{ts,tsx}'", result_summary: "Found 28 test files", duration_ms: 80 },
        { tool_name: "read_file", category: "read", args_summary: "multiple source files", result_summary: "Analyzed untested code paths", duration_ms: 45 },
        { tool_name: "write_file", category: "write", args_summary: "3 test files", result_summary: "Created test files", duration_ms: 35 },
      ],
      fileChanges: [
        { file_path: "src/entities/message/__tests__/atoms.test.ts", status: "added", insertions: 95, deletions: 0 },
        { file_path: "src/features/streaming/__tests__/dispatchServerEvent.test.ts", status: "added", insertions: 120, deletions: 0 },
        { file_path: "src/shared/protocol/__tests__/isServerEvent.test.ts", status: "modified", insertions: 45, deletions: 5 },
      ],
      thinkingText: "테스트 커버리지 개선 요청입니다. 미테스트 코드 경로를 분석하겠습니다.",
      planSteps: "1. Run coverage report\n2. Identify uncovered code paths\n3. Write tests for each gap\n4. Verify coverage improvement",
    },
  ],

  // ── Q_MIGRATE: Migration ──────────────────────────────────
  Q_MIGRATE: [
    {
      intent: "Q_MIGRATE", risk: "R3", changeSize: "C3", uncertainty: "U1",
      text: "마이그레이션을 완료했습니다.\n\n### 마이그레이션 내용\n`class-based components` → `함수형 컴포넌트 + Hooks`\n\n### 변경 파일 (12개)\n1. [PASS] `src/components/Header.tsx` — class → FC + useState\n2. [PASS] `src/components/Sidebar.tsx` — class → FC + useEffect\n3. [PASS] `src/components/Modal.tsx` — class → FC + useRef\n4. [PASS] `src/components/Form.tsx` — class → FC + useForm\n5. [PASS] `src/components/Table.tsx` — class → FC + useMemo\n6. [PASS] 나머지 7개 파일 — 동일 패턴 적용\n\n### Breaking Changes\n- `ref` 전달 방식: `createRef` → `forwardRef` + `useImperativeHandle`\n- lifecycle 메서드: `componentDidMount` → `useEffect`\n\n기존 테스트 전부 통과를 확인했습니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'extends React.Component'", result_summary: "Found 12 class components", duration_ms: 150 },
        { tool_name: "read_file", category: "read", args_summary: "multiple components", result_summary: "Analyzed class patterns", duration_ms: 80 },
        { tool_name: "write_file", category: "write", args_summary: "12 component files", result_summary: "Migrated to functional", duration_ms: 120 },
      ],
      fileChanges: [
        { file_path: "src/components/Header.tsx", status: "modified", insertions: 25, deletions: 40 },
        { file_path: "src/components/Sidebar.tsx", status: "modified", insertions: 30, deletions: 45 },
        { file_path: "src/components/Modal.tsx", status: "modified", insertions: 20, deletions: 35 },
        { file_path: "src/components/Form.tsx", status: "modified", insertions: 35, deletions: 50 },
        { file_path: "src/components/Table.tsx", status: "modified", insertions: 28, deletions: 38 },
      ],
      thinkingText: "대규모 마이그레이션입니다. class 컴포넌트를 전수 조사하고 단계적으로 변환하겠습니다.",
      planSteps: "1. Audit all class components\n2. Plan migration order (leaf → root)\n3. Convert each component\n4. Update refs and lifecycle\n5. Run full test suite",
    },
    {
      intent: "Q_MIGRATE", risk: "R3", changeSize: "C3", uncertainty: "U2",
      text: "React Router v5 → v6 마이그레이션을 완료했습니다.\n\n### 주요 변경\n| v5 | v6 |\n|-----|-----|\n| `<Switch>` | `<Routes>` |\n| `<Route component={X}>` | `<Route element={<X/>}>` |\n| `useHistory()` | `useNavigate()` |\n| `<Redirect>` | `<Navigate>` |\n| exact prop | 기본 동작 |\n\n### 변경 파일\n- `src/app/router/AppRouter.tsx` — Routes 구조 교체\n- `src/pages/*.tsx` — useHistory → useNavigate\n- `src/widgets/nav/*.tsx` — Link 컴포넌트 업데이트\n- `package.json` — react-router-dom 업그레이드\n\n[WARN] nested routes 패턴이 변경되었으므로 QA 확인을 권장합니다.",
      toolCalls: [
        { tool_name: "search_files", category: "search", args_summary: "pattern: 'useHistory|Switch|Redirect'", result_summary: "Found 18 v5 usages", duration_ms: 100 },
        { tool_name: "read_file", category: "read", args_summary: "AppRouter.tsx", result_summary: "Read current router setup", duration_ms: 20 },
        { tool_name: "write_file", category: "write", args_summary: "multiple files", result_summary: "Migrated to v6 API", duration_ms: 90 },
      ],
      fileChanges: [
        { file_path: "src/app/router/AppRouter.tsx", status: "modified", insertions: 40, deletions: 35 },
        { file_path: "src/pages/ChatPage.tsx", status: "modified", insertions: 5, deletions: 8 },
        { file_path: "src/pages/SessionsPage.tsx", status: "modified", insertions: 4, deletions: 7 },
        { file_path: "src/pages/SettingsPage.tsx", status: "modified", insertions: 3, deletions: 6 },
        { file_path: "src/widgets/nav/NavBar.tsx", status: "modified", insertions: 6, deletions: 4 },
        { file_path: "package.json", status: "modified", insertions: 1, deletions: 1 },
      ],
      thinkingText: "React Router v5→v6 마이그레이션입니다. API 변경 사항을 전수 조사하겠습니다.",
      planSteps: "1. Inventory all v5 API usage\n2. Update router configuration\n3. Replace useHistory with useNavigate\n4. Convert Switch/Redirect patterns\n5. Update Link components\n6. Full regression test",
    },
  ],
};

// ── Protocol type mapping ─────────────────────────────────────
// Maps internal mock types → protocol types for serverEvent emission

import type {
  ChangeSize as ProtoChangeSize,
  IntentType as ProtoIntentType,
  RiskLevel as ProtoRiskLevel,
  UncertaintyLevel as ProtoUncertaintyLevel,
} from "../../../shared/protocol";

const INTENT_TO_PROTO: Record<IntentType, ProtoIntentType> = {
  Q_INFO: "question",
  Q_LOCATE: "question",
  Q_DIAG: "bug_fix",
  Q_FIX: "bug_fix",
  Q_REFACTOR: "refactor",
  Q_SEC: "bug_fix",
  Q_PERF: "refactor",
  Q_SPEC: "docs",
  Q_MIGRATE: "feature",
};

const RISK_TO_PROTO: Record<MockRiskLevel, ProtoRiskLevel> = {
  R0: "safe", R1: "safe", R2: "moderate", R3: "dangerous", R4: "dangerous",
};

const CHANGE_TO_PROTO: Record<ChangeSize, ProtoChangeSize> = {
  C0: "trivial", C1: "small", C2: "medium", C3: "large",
};

const UNCERTAINTY_TO_PROTO: Record<Uncertainty, ProtoUncertaintyLevel> = {
  U0: "low", U1: "low", U2: "medium", U3: "high",
};

/** Convert internal classification → protocol-compatible InputGateResult */
export function toProtoClassification(c: Classification) {
  return {
    intent_type: INTENT_TO_PROTO[c.intent],
    risk_level: RISK_TO_PROTO[c.risk],
    change_size: CHANGE_TO_PROTO[c.changeSize],
    uncertainty: UNCERTAINTY_TO_PROTO[c.uncertainty],
  };
}

/** Map internal mock risk level → protocol RiskLevel */
export function toProtoRiskLevel(risk: MockRiskLevel): ProtoRiskLevel {
  return RISK_TO_PROTO[risk];
}

// ── Public API ────────────────────────────────────────────────

/** Pick a response based on intent classification of user input */
export function pickResponse(userText: string): ResponseEntry {
  const { intent } = classifyIntent(userText);
  const pool = responses[intent];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  // Pool is always non-empty by construction; guard satisfies noUncheckedIndexedAccess
  if (picked === undefined) throw new Error(`Empty response pool for intent: ${intent}`);
  return picked;
}
