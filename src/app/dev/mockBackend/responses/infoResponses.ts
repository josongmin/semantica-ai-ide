/**
 * Response pools for Q_INFO and Q_LOCATE intents.
 */
import type { ResponseEntry } from "./types";

export const infoResponses: ResponseEntry[] = [
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
];

export const locateResponses: ResponseEntry[] = [
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
];
