/**
 * Response pools for Q_REFACTOR, Q_SEC, and Q_PERF intents.
 */
import type { ResponseEntry } from "./types";

export const refactorResponses: ResponseEntry[] = [
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
];

export const secResponses: ResponseEntry[] = [
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
];

export const perfResponses: ResponseEntry[] = [
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
];
