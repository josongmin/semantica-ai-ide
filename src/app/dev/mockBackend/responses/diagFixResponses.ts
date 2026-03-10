/**
 * Response pools for Q_DIAG and Q_FIX intents.
 */
import type { ResponseEntry } from "./types";

export const diagResponses: ResponseEntry[] = [
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
];

export const fixResponses: ResponseEntry[] = [
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
];
