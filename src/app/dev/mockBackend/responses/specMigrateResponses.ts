/**
 * Response pools for Q_SPEC and Q_MIGRATE intents.
 */
import type { ResponseEntry } from "./types";

export const specResponses: ResponseEntry[] = [
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
];

export const migrateResponses: ResponseEntry[] = [
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
];
