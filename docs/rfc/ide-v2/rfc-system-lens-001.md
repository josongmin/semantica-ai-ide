# RFC-SYSTEM-LENS-001: System Intelligence UI — Implementation Spec

> Quanta Engine 233 알고리즘 기반 SOTA++ DX 구현 스펙
> Mock data 기반 Phase 1 → Engine 연결 Phase 2

---

## 0. 설계 원칙

```
Code editing IDE  →  System Reasoning IDE
파일 탐색         →  그래프 탐색
코드 수정         →  의도 기반 개발
사후 디버깅       →  사전 영향 예측
Black-box AI     →  Explainable AI
```

**핵심 질문 3개를 0-click으로 해결:**
1. 이 코드 어디서 쓰이나? (Call Lens)
2. 왜 이 코드가 실행되나? (Dataflow Lens)
3. 이 코드를 바꾸면 무엇이 깨지나? (Impact Lens)

**성능 목표:**
| Interaction | Target Latency |
|---|---|
| hover preview | < 50ms |
| gutter badge render | < 30ms |
| graph expand (1-hop) | < 150ms |
| impact radar update | < 200ms |
| root cause first result | < 2s |

---

## 1. Feature 목록 & 디렉토리 구조

### 1.1 새로 생성하는 features

```
src/features/
├── system-lens/          # Tier 1: Live System Lens (gutter overlay)
│   ├── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── atoms.ts
│   │   └── mockData.ts
│   ├── lib/
│   │   └── lensQueries.ts
│   └── ui/
│       ├── LensGutterBadge.tsx
│       ├── LensHoverCard.tsx
│       ├── LensMiniGraph.tsx
│       └── LensOverlay.tsx
│
├── impact-radar/         # Tier 1: Impact Radar (change prediction)
│   ├── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── atoms.ts
│   │   └── mockData.ts
│   ├── lib/
│   │   └── impactAnalysis.ts
│   └── ui/
│       ├── ImpactRadarPanel.tsx
│       ├── ImpactNodeList.tsx
│       ├── ImpactRadarGraph.tsx
│       └── ImpactSeverityBadge.tsx
│
├── root-cause/           # Tier 1: Root Cause Viewer (causal chain)
│   ├── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── atoms.ts
│   │   └── mockData.ts
│   ├── lib/
│   │   └── causalRanking.ts
│   └── ui/
│       ├── RootCausePanel.tsx
│       ├── CausalChainGraph.tsx
│       ├── EvidenceBundle.tsx
│       └── CauseCandidate.tsx
│
├── dataflow-lens/        # Tier 2: Dataflow Lens (value journey)
│   ├── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── atoms.ts
│   │   └── mockData.ts
│   └── ui/
│       ├── DataflowOverlay.tsx
│       ├── DataflowPath.tsx
│       └── DataflowNode.tsx
│
├── arch-guardian/        # Tier 2: Architecture Guardian
│   ├── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── atoms.ts
│   │   └── mockData.ts
│   └── ui/
│       ├── ArchViolationBadge.tsx
│       ├── ArchGuardianPanel.tsx
│       └── LayerDiagram.tsx
│
├── self-explain/         # Tier 3: Self-Explaining Code
│   ├── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── atoms.ts
│   │   └── mockData.ts
│   └── ui/
│       ├── SelfExplainPanel.tsx
│       ├── ExplainSection.tsx
│       └── WhyChain.tsx
│
└── intent-engine/        # Tier 3: Intent Simulation
    ├── index.ts
    ├── model/
    │   ├── types.ts
    │   ├── atoms.ts
    │   └── mockData.ts
    ├── lib/
    │   └── intentParser.ts
    └── ui/
        ├── IntentBar.tsx
        ├── IntentPlanPreview.tsx
        ├── IntentSimulation.tsx
        └── IntentTimeline.tsx
```

### 1.2 기존 feature 확장

```
src/features/code-lens/     # 확장: System Lens 통합
src/surfaces/graph/          # 확장: 실제 그래프 렌더링
```

### 1.3 새로 생성하는 surfaces

```
src/surfaces/
├── reasoning/               # AI Reasoning Surface
│   ├── ReasoningSurface.tsx
│   ├── reasoningAtoms.ts
│   └── index.ts
└── timeline/                # Timeline Surface
    ├── TimelineSurface.tsx
    ├── timelineAtoms.ts
    └── index.ts
```

---

## 2. Feature Spec: System Lens (Tier 1)

> 코드 위에 실시간 시스템 정보를 overlay하는 핵심 기능

### 2.1 Types

```typescript
// src/features/system-lens/model/types.ts

/** 렌즈 종류 */
export type LensKind =
  | "call"       // callers/callees
  | "impact"     // affected scope
  | "dataflow"   // value flow
  | "change"     // recent changes
  | "runtime";   // execution frequency

/** 심볼 종류 */
export type SymbolKind =
  | "function"
  | "method"
  | "class"
  | "interface"
  | "variable"
  | "module"
  | "type"
  | "hook";

/** Gutter에 표시할 요약 데이터 */
export interface LensBadgeData {
  symbolId: string;
  symbolName: string;
  symbolKind: SymbolKind;
  filePath: string;
  line: number;
  endLine: number;

  // Call Lens
  callerCount: number;
  calleeCount: number;

  // Impact Lens
  impactedModules: number;
  impactedTests: number;
  impactedApis: number;

  // Runtime Lens
  callFrequency: number | null;      // calls/hour, null if no runtime data
  avgLatency: number | null;         // ms

  // Change Lens
  lastModifiedCommit: string | null;
  lastModifiedDaysAgo: number | null;
  changeFrequency: number;           // changes in last 90 days

  // Risk
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
}

/** Hover 시 확장 데이터 */
export interface LensDetailData extends LensBadgeData {
  // Call graph edges
  callers: LensGraphNode[];
  callees: LensGraphNode[];

  // Impact details
  impactedItems: ImpactItem[];

  // Dataflow
  dataflowIn: DataflowEdge[];     // 이 심볼로 들어오는 데이터
  dataflowOut: DataflowEdge[];    // 이 심볼에서 나가는 데이터

  // Evidence
  recentCommits: CommitRef[];
  relatedTests: TestRef[];
}

export interface LensGraphNode {
  id: string;
  name: string;
  kind: SymbolKind;
  filePath: string;
  line: number;
  module: string;             // 소속 모듈/서비스
}

export interface ImpactItem {
  id: string;
  name: string;
  kind: "module" | "test" | "api" | "service";
  severity: "direct" | "transitive";
  filePath: string;
  line: number;
}

export interface DataflowEdge {
  fromSymbol: string;
  toSymbol: string;
  transformations: string[];  // e.g., ["validate", "sanitize", "encode"]
  taintLabel?: string;        // "user-input", "db-result", etc.
}

export interface CommitRef {
  hash: string;
  message: string;
  author: string;
  daysAgo: number;
}

export interface TestRef {
  id: string;
  name: string;
  filePath: string;
  status: "pass" | "fail" | "skip";
  lastRun: number;
}
```

### 2.2 Atoms

```typescript
// src/features/system-lens/model/atoms.ts

import { atom } from "jotai";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { LensBadgeData, LensDetailData, LensKind } from "./types";

// ─── Visibility ─────────────────────────────────────────
export const systemLensEnabledAtom = atom<boolean>(true);
export const activeLensKindsAtom = atom<Set<LensKind>>(
  new Set(["call", "impact"])
);

// ─── Badge Data (per-file) ──────────────────────────────
/** Map<filePath, LensBadgeData[]> — 현재 열린 파일들의 gutter badge 데이터 */
export const lensBadgeMapAtom = atom<Map<string, LensBadgeData[]>>(new Map());

// ─── Hover Detail ───────────────────────────────────────
export const lensHoverTargetAtom = atom<{
  symbolId: string;
  position: { x: number; y: number };
} | null>(null);

export const lensDetailDataAtom = atom<LensDetailData | null>(null);
export const lensDetailLoadingAtom = atom<boolean>(false);

// ─── Mini Graph ─────────────────────────────────────────
export const lensMiniGraphVisibleAtom = atom<boolean>(false);
export const lensMiniGraphCenterAtom = atom<string | null>(null); // symbolId

// ─── Write Atoms ────────────────────────────────────────

/** 파일 열릴 때 badge 데이터 로드 */
export const loadLensBadgesAtom = atom(
  null,
  async (_get, set, filePath: string) => {
    // Phase 1: mock data
    // Phase 2: Quanta Engine query
    const { generateMockBadges } = await import("./mockData");
    const badges = generateMockBadges(filePath);
    set(lensBadgeMapAtom, (prev) => {
      const next = new Map(prev);
      next.set(filePath, badges);
      return next;
    });
  }
);

/** Symbol hover → detail 로드 */
export const loadLensDetailAtom = atom(
  null,
  async (_get, set, symbolId: string, position: { x: number; y: number }) => {
    set(lensHoverTargetAtom, { symbolId, position });
    set(lensDetailLoadingAtom, true);
    // Phase 1: mock data with 40ms delay (simulate sub-50ms target)
    const { generateMockDetail } = await import("./mockData");
    await new Promise((r) => setTimeout(r, 40));
    const detail = generateMockDetail(symbolId);
    set(lensDetailDataAtom, detail);
    set(lensDetailLoadingAtom, false);
  }
);

/** Hover 해제 */
export const clearLensHoverAtom = atom(null, (_get, set) => {
  set(lensHoverTargetAtom, null);
  set(lensDetailDataAtom, null);
  set(lensDetailLoadingAtom, false);
});

/** Lens 종류 토글 */
export const toggleLensKindAtom = atom(
  null,
  (_get, set, kind: LensKind) => {
    set(activeLensKindsAtom, (prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }
);

// ─── Reset ──────────────────────────────────────────────
const resetSystemLensAtom = atom(null, (_get, set) => {
  set(systemLensEnabledAtom, true);
  set(activeLensKindsAtom, new Set(["call", "impact"]));
  set(lensBadgeMapAtom, new Map());
  set(lensHoverTargetAtom, null);
  set(lensDetailDataAtom, null);
  set(lensDetailLoadingAtom, false);
  set(lensMiniGraphVisibleAtom, false);
  set(lensMiniGraphCenterAtom, null);
});
registerResetAtom(resetSystemLensAtom);
```

### 2.3 Mock Data

```typescript
// src/features/system-lens/model/mockData.ts

import type {
  LensBadgeData, LensDetailData, LensGraphNode,
  ImpactItem, DataflowEdge, CommitRef, TestRef, SymbolKind,
} from "./types";

// ─── Mock Symbol Database ───────────────────────────────
// 실제 프로젝트의 패턴을 반영한 현실적인 mock 데이터

const MOCK_SYMBOLS: Record<string, Partial<LensBadgeData>> = {
  "fn:handleLogin": {
    symbolName: "handleLogin",
    symbolKind: "function",
    callerCount: 3,
    calleeCount: 7,
    impactedModules: 4,
    impactedTests: 12,
    impactedApis: 2,
    callFrequency: 120000,
    avgLatency: 45,
    changeFrequency: 8,
    riskLevel: "high",
  },
  "fn:validateToken": {
    symbolName: "validateToken",
    symbolKind: "function",
    callerCount: 15,
    calleeCount: 3,
    impactedModules: 8,
    impactedTests: 22,
    impactedApis: 5,
    callFrequency: 350000,
    avgLatency: 12,
    changeFrequency: 2,
    riskLevel: "critical",
  },
  "fn:formatDate": {
    symbolName: "formatDate",
    symbolKind: "function",
    callerCount: 42,
    calleeCount: 1,
    impactedModules: 12,
    impactedTests: 5,
    impactedApis: 0,
    callFrequency: 500000,
    avgLatency: 0.3,
    changeFrequency: 0,
    riskLevel: "low",
  },
  "class:AuthService": {
    symbolName: "AuthService",
    symbolKind: "class",
    callerCount: 8,
    calleeCount: 12,
    impactedModules: 6,
    impactedTests: 34,
    impactedApis: 4,
    callFrequency: 200000,
    avgLatency: 65,
    changeFrequency: 5,
    riskLevel: "high",
  },
  "hook:useAuth": {
    symbolName: "useAuth",
    symbolKind: "hook",
    callerCount: 23,
    calleeCount: 4,
    impactedModules: 15,
    impactedTests: 18,
    impactedApis: 0,
    callFrequency: null,
    avgLatency: null,
    changeFrequency: 3,
    riskLevel: "medium",
  },
  "fn:sanitizeInput": {
    symbolName: "sanitizeInput",
    symbolKind: "function",
    callerCount: 28,
    calleeCount: 2,
    impactedModules: 3,
    impactedTests: 8,
    impactedApis: 0,
    callFrequency: 180000,
    avgLatency: 1.2,
    changeFrequency: 1,
    riskLevel: "medium",
  },
  "fn:queryDatabase": {
    symbolName: "queryDatabase",
    symbolKind: "function",
    callerCount: 35,
    calleeCount: 2,
    impactedModules: 1,
    impactedTests: 40,
    impactedApis: 8,
    callFrequency: 95000,
    avgLatency: 120,
    changeFrequency: 4,
    riskLevel: "high",
  },
  "interface:UserProfile": {
    symbolName: "UserProfile",
    symbolKind: "interface",
    callerCount: 18,
    calleeCount: 0,
    impactedModules: 9,
    impactedTests: 14,
    impactedApis: 3,
    callFrequency: null,
    avgLatency: null,
    changeFrequency: 6,
    riskLevel: "medium",
  },
};

// ─── Generators ─────────────────────────────────────────

/** 파일 경로 기반 mock badge 생성 (3~8개 심볼/파일) */
export function generateMockBadges(filePath: string): LensBadgeData[] {
  const hash = simpleHash(filePath);
  const symbolKeys = Object.keys(MOCK_SYMBOLS);
  const count = 3 + (hash % 6); // 3~8 symbols per file

  return Array.from({ length: count }, (_, i) => {
    const key = symbolKeys[(hash + i * 7) % symbolKeys.length];
    const base = MOCK_SYMBOLS[key]!;
    const line = 5 + i * 12 + (hash % 5); // spread across file

    return {
      symbolId: `${filePath}:${key}:${line}`,
      filePath,
      line,
      endLine: line + 4 + (i % 8),
      lastModifiedCommit: `${hash.toString(16).slice(0, 7)}a${i}`,
      lastModifiedDaysAgo: 1 + (hash % 30) + i * 3,
      ...base,
    } as LensBadgeData;
  });
}

/** symbolId 기반 mock detail 생성 */
export function generateMockDetail(symbolId: string): LensDetailData {
  const hash = simpleHash(symbolId);
  const symbolKeys = Object.keys(MOCK_SYMBOLS);
  const key = symbolKeys[hash % symbolKeys.length];
  const base = MOCK_SYMBOLS[key]!;

  const callers: LensGraphNode[] = Array.from(
    { length: base.callerCount ?? 3 },
    (_, i) => ({
      id: `caller-${i}`,
      name: CALLER_NAMES[(hash + i) % CALLER_NAMES.length],
      kind: (["function", "method", "hook"] as const)[(hash + i) % 3],
      filePath: `/src/${MODULE_NAMES[(hash + i) % MODULE_NAMES.length]}.ts`,
      line: 10 + i * 20,
      module: MODULE_NAMES[(hash + i) % MODULE_NAMES.length],
    }),
  ).slice(0, 8); // max 8 shown

  const callees: LensGraphNode[] = Array.from(
    { length: base.calleeCount ?? 2 },
    (_, i) => ({
      id: `callee-${i}`,
      name: CALLEE_NAMES[(hash + i) % CALLEE_NAMES.length],
      kind: (["function", "method", "class"] as const)[(hash + i) % 3],
      filePath: `/src/${MODULE_NAMES[(hash + i + 3) % MODULE_NAMES.length]}.ts`,
      line: 15 + i * 15,
      module: MODULE_NAMES[(hash + i + 3) % MODULE_NAMES.length],
    }),
  ).slice(0, 6);

  const impactedItems: ImpactItem[] = Array.from(
    { length: (base.impactedModules ?? 0) + (base.impactedTests ?? 0) },
    (_, i) => ({
      id: `impact-${i}`,
      name: IMPACT_NAMES[(hash + i) % IMPACT_NAMES.length],
      kind: (["module", "test", "api", "service"] as const)[i % 4],
      severity: i < 3 ? "direct" as const : "transitive" as const,
      filePath: `/src/${IMPACT_NAMES[(hash + i) % IMPACT_NAMES.length]}.ts`,
      line: 1,
    }),
  ).slice(0, 12);

  const dataflowIn: DataflowEdge[] = [
    {
      fromSymbol: "request.body",
      toSymbol: base.symbolName ?? "target",
      transformations: ["parse", "validate"],
      taintLabel: "user-input",
    },
  ];

  const dataflowOut: DataflowEdge[] = [
    {
      fromSymbol: base.symbolName ?? "target",
      toSymbol: "response.json",
      transformations: ["transform", "serialize"],
    },
  ];

  const recentCommits: CommitRef[] = Array.from({ length: 3 }, (_, i) => ({
    hash: `${hash.toString(16).slice(0, 6)}${i}f`,
    message: COMMIT_MESSAGES[(hash + i) % COMMIT_MESSAGES.length],
    author: AUTHORS[(hash + i) % AUTHORS.length],
    daysAgo: 1 + i * 5 + (hash % 10),
  }));

  const relatedTests: TestRef[] = Array.from(
    { length: base.impactedTests ?? 3 },
    (_, i) => ({
      id: `test-${i}`,
      name: `test ${base.symbolName ?? "fn"} ${TEST_SUFFIXES[i % TEST_SUFFIXES.length]}`,
      filePath: `/tests/${base.symbolName ?? "fn"}.test.ts`,
      status: (["pass", "pass", "pass", "fail", "skip"] as const)[
        (hash + i) % 5
      ],
      lastRun: Date.now() - i * 3600000,
    }),
  ).slice(0, 8);

  return {
    symbolId,
    filePath: symbolId.split(":")[0] || "/unknown",
    line: parseInt(symbolId.split(":")[2] || "1"),
    endLine: parseInt(symbolId.split(":")[2] || "1") + 5,
    lastModifiedCommit: recentCommits[0]?.hash ?? null,
    lastModifiedDaysAgo: recentCommits[0]?.daysAgo ?? null,
    ...base,
    callers,
    callees,
    impactedItems,
    dataflowIn,
    dataflowOut,
    recentCommits,
    relatedTests,
  } as LensDetailData;
}

// ─── Helpers ────────────────────────────────────────────

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const CALLER_NAMES = [
  "handleRequest", "processLogin", "middleware", "routeHandler",
  "useAuthContext", "validateSession", "checkPermission", "resolveUser",
  "apiGateway", "eventHandler", "workerProcess", "schedulerTick",
];

const CALLEE_NAMES = [
  "db.query", "cache.get", "logger.info", "jwt.verify",
  "hash.compare", "emit", "serialize", "validate",
  "transform", "encrypt", "compress", "dispatch",
];

const MODULE_NAMES = [
  "auth/AuthController", "auth/AuthService", "auth/TokenService",
  "user/UserRepository", "api/Gateway", "middleware/RateLimit",
  "cache/RedisClient", "db/QueryBuilder", "events/EventBus",
  "config/ConfigLoader", "utils/Validator", "logging/Logger",
];

const IMPACT_NAMES = [
  "AuthModule", "UserModule", "PaymentModule", "NotificationService",
  "APIGateway", "RateLimiter", "SessionStore", "AuditLogger",
  "loginFlow.test", "authMiddleware.test", "tokenRefresh.test",
  "userProfile.test", "payment.e2e.test", "security.integration.test",
];

const COMMIT_MESSAGES = [
  "fix: token expiry edge case",
  "feat: add rate limiting middleware",
  "refactor: extract validation logic",
  "fix: handle null user in auth flow",
  "perf: cache token verification result",
  "feat: add audit logging to auth",
  "fix: race condition in session refresh",
  "chore: update auth dependencies",
];

const AUTHORS = ["alex", "jordan", "casey", "taylor", "morgan", "riley"];

const TEST_SUFFIXES = [
  "happy path", "error case", "edge case", "null input",
  "timeout", "concurrent", "integration", "boundary",
];
```

### 2.4 UI Components

#### LensGutterBadge — 에디터 gutter에 표시되는 인라인 badge

```
┌──────────────────────────────────────────────────────┐
│  5 │ ↑12 ↓3 ⚡8  │ function handleLogin(req, res) { │
│  6 │              │   const token = req.headers...    │
│  7 │              │   const user = await validate...  │
│  8 │ ↑15 ↓3 ⚡22 │   function validateToken(tok) {   │
│  9 │              │     return jwt.verify(tok, se...  │
│ 10 │              │   }                               │
│ 11 │ ↑42 ↓1      │   function formatDate(d) {        │
└──────────────────────────────────────────────────────┘

↑ = callers, ↓ = callees, ⚡ = impacted tests
색상: none=ghost, low=dim, medium=yellow, high=orange, critical=red
```

**Props:**
```typescript
interface LensGutterBadgeProps {
  badge: LensBadgeData;
  activeLenses: Set<LensKind>;
  onHover: (symbolId: string, rect: DOMRect) => void;
  onHoverEnd: () => void;
  onClick: (symbolId: string) => void;
}
```

**렌더링 규칙:**
- `callerCount + calleeCount > 0` → `↑{n} ↓{n}` 표시
- `impactedTests > 0` → `⚡{n}` 표시
- `callFrequency !== null` → `~{n}k/h` 표시
- `riskLevel` → border-left 색상 (ghost/green/yellow/orange/red)
- 전체 width 고정 (font-mono, text-3xs)

#### LensHoverCard — hover 시 팝업 상세

```
┌─────────────────────────────────────────┐
│ 🔵 handleLogin                  function │
│ auth/AuthController.ts:5                │
├─────────────────────────────────────────┤
│ Callers (12)        │ Callees (7)       │
│ ├ processLogin      │ ├ db.query        │
│ ├ routeHandler      │ ├ jwt.verify      │
│ ├ apiGateway        │ ├ cache.get       │
│ └ +9 more           │ └ +4 more         │
├─────────────────────────────────────────┤
│ Impact: 4 modules · 12 tests · 2 APIs  │
│ Runtime: ~120k/h · avg 45ms            │
│ Changed: 8 days ago (fix: token expiry) │
│ Risk: ████████░░ HIGH                   │
├─────────────────────────────────────────┤
│ [Graph] [Dataflow] [Impact] [Explain]  │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface LensHoverCardProps {
  detail: LensDetailData;
  loading: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: "graph" | "dataflow" | "impact" | "explain") => void;
  onNodeClick: (filePath: string, line: number) => void;
}
```

**행동:**
- hover 유지 300ms 후 표시
- mouse leave → 200ms 후 닫힘 (카드 위에 마우스 올리면 유지)
- [Graph] → mini graph 확장
- [Dataflow] → dataflow overlay 표시
- [Impact] → impact radar 패널 열기
- [Explain] → self-explain 패널 열기
- caller/callee 이름 클릭 → 해당 파일/라인으로 jump

#### LensMiniGraph — 확장 그래프 뷰

```
                    ┌─────────────┐
                    │ processLogin│
                    └──────┬──────┘
                           │
    ┌────────────┐   ┌─────┴──────┐   ┌──────────┐
    │ apiGateway ├───┤handleLogin ├───┤ db.query  │
    └────────────┘   └─────┬──────┘   └──────────┘
                           │
                    ┌──────┴──────┐
                    │ jwt.verify  │
                    └─────────────┘
```

hover card 하단에서 확장되거나, 에디터 오른쪽에 overlay로 표시.
SVG 기반, 노드 클릭 시 file jump.

---

## 3. Feature Spec: Impact Radar (Tier 1)

> 코드 수정 시 실시간으로 영향 범위를 예측 표시

### 3.1 Types

```typescript
// src/features/impact-radar/model/types.ts

export type ImpactCategory =
  | "module"
  | "test"
  | "api"
  | "service"
  | "config"
  | "type";

export type ImpactSeverity = "breaking" | "major" | "minor" | "cosmetic";

export type ImpactDirection = "direct" | "transitive-1" | "transitive-2+";

export interface ImpactNode {
  id: string;
  name: string;
  category: ImpactCategory;
  severity: ImpactSeverity;
  direction: ImpactDirection;
  filePath: string;
  line: number;
  description: string;         // 왜 영향 받는지 한줄 설명
  confidence: number;          // 0~1
}

export interface ImpactSummary {
  totalAffected: number;
  breaking: number;
  major: number;
  minor: number;
  testsPredictedFailing: number;
  testsPredictedPassing: number;
  apisAffected: number;
  servicesAffected: number;
}

export interface ImpactAnalysisResult {
  triggerSymbol: string;
  triggerFile: string;
  triggerLine: number;
  timestamp: number;
  nodes: ImpactNode[];
  summary: ImpactSummary;
  graphEdges: Array<{ from: string; to: string; kind: string }>;
}

/** 수정 이벤트 (에디터에서 발생) */
export interface ChangeEvent {
  filePath: string;
  line: number;
  symbolName: string;
  changeType: "edit" | "delete" | "add" | "rename";
}
```

### 3.2 Atoms

```typescript
// src/features/impact-radar/model/atoms.ts

import { atom } from "jotai";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { ChangeEvent, ImpactAnalysisResult } from "./types";

// ─── State ──────────────────────────────────────────────
export const impactRadarEnabledAtom = atom<boolean>(true);
export const impactRadarVisibleAtom = atom<boolean>(false);
export const impactAnalysisResultAtom = atom<ImpactAnalysisResult | null>(null);
export const impactRadarLoadingAtom = atom<boolean>(false);

/** 현재 에디터에서 발생한 최신 변경 */
export const pendingChangeAtom = atom<ChangeEvent | null>(null);

// ─── Write Atoms ────────────────────────────────────────

/** 코드 수정 시 impact 분석 트리거 (debounced in UI layer) */
export const analyzeImpactAtom = atom(
  null,
  async (_get, set, change: ChangeEvent) => {
    set(pendingChangeAtom, change);
    set(impactRadarLoadingAtom, true);
    set(impactRadarVisibleAtom, true);

    // Phase 1: mock (200ms delay simulating graph query)
    const { generateMockImpact } = await import("./mockData");
    await new Promise((r) => setTimeout(r, 180));
    const result = generateMockImpact(change);
    set(impactAnalysisResultAtom, result);
    set(impactRadarLoadingAtom, false);
  }
);

export const closeImpactRadarAtom = atom(null, (_get, set) => {
  set(impactRadarVisibleAtom, false);
});

// ─── Reset ──────────────────────────────────────────────
const resetImpactRadarAtom = atom(null, (_get, set) => {
  set(impactRadarEnabledAtom, true);
  set(impactRadarVisibleAtom, false);
  set(impactAnalysisResultAtom, null);
  set(impactRadarLoadingAtom, false);
  set(pendingChangeAtom, null);
});
registerResetAtom(resetImpactRadarAtom);
```

### 3.3 UI Layout

Impact Radar는 bottom panel의 한 탭 또는 에디터 우측 overlay로 표시.

```
┌─────────────────────────────────────────────────────────┐
│ Impact Radar — handleLogin (auth/AuthController.ts:5)   │
│ ▓▓▓▓░░░░░░ analyzing...                                │
├──────────┬──────────────────────────────────────────────┤
│ Summary  │ Affected Items                              │
│          │                                              │
│ 🔴 2     │ 🔴 BREAKING  PaymentService.charge()        │
│ breaking │   └ direct caller, signature changed        │
│          │ 🔴 BREAKING  /api/v2/payments (POST)        │
│ 🟠 3     │   └ API contract broken                     │
│ major    │ 🟠 MAJOR    NotificationService.send()      │
│          │   └ transitive via PaymentService            │
│ 🟡 5     │ 🟠 MAJOR    loginFlow.test.ts               │
│ minor    │   └ test will fail (assertion mismatch)      │
│          │ 🟠 MAJOR    authMiddleware.test.ts           │
│ Tests    │   └ test will fail (mock outdated)           │
│ 🔴 2 fail│ 🟡 MINOR    UserRepository.findById()       │
│ 🟢 10 ok │   └ transitive, type change propagates      │
│          │ 🟡 MINOR    AuditLogger.log()               │
│ APIs: 2  │   └ cosmetic, log format affected           │
│ Svcs: 3  │                                              │
├──────────┴──────────────────────────────────────────────┤
│ [Run Affected Tests] [Show Graph] [Dismiss]             │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Feature Spec: Root Cause Viewer (Tier 1)

> 에러/장애의 원인 체인을 causal graph로 시각화

### 4.1 Types

```typescript
// src/features/root-cause/model/types.ts

export type CauseConfidence = number; // 0~1

export interface CauseCandidate {
  id: string;
  rank: number;                    // 1 = most likely
  symbolName: string;
  filePath: string;
  line: number;
  confidence: CauseConfidence;
  description: string;             // 왜 이것이 원인인지
  evidenceIds: string[];           // 근거 ID 목록
}

export type EvidenceKind =
  | "call-path"
  | "dataflow-path"
  | "recent-commit"
  | "runtime-trace"
  | "test-failure"
  | "stack-trace"
  | "config-change";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  title: string;
  detail: string;
  relevance: number;               // 0~1
  filePath?: string;
  line?: number;
  commitHash?: string;
}

export interface CausalChainNode {
  id: string;
  symbolName: string;
  filePath: string;
  line: number;
  role: "root-cause" | "propagator" | "symptom";
  description: string;
}

export interface CausalChainEdge {
  from: string;
  to: string;
  label: string;                   // "calls", "passes tainted data", "triggers"
}

export interface RootCauseAnalysis {
  id: string;
  symptom: string;                 // 원래 에러/증상
  symptomFile: string;
  symptomLine: number;
  analyzedAt: number;
  candidates: CauseCandidate[];
  evidence: EvidenceItem[];
  causalChain: {
    nodes: CausalChainNode[];
    edges: CausalChainEdge[];
  };
  status: "analyzing" | "complete" | "partial";
}
```

### 4.2 Atoms

```typescript
// src/features/root-cause/model/atoms.ts

import { atom } from "jotai";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { RootCauseAnalysis } from "./types";

export const rootCauseVisibleAtom = atom<boolean>(false);
export const rootCauseAnalysisAtom = atom<RootCauseAnalysis | null>(null);
export const rootCauseLoadingAtom = atom<boolean>(false);

/** Cmd+Shift+R → 현재 에러에 대해 root cause 분석 시작 */
export const startRootCauseAtom = atom(
  null,
  async (
    _get,
    set,
    params: { symptom: string; filePath: string; line: number },
  ) => {
    set(rootCauseVisibleAtom, true);
    set(rootCauseLoadingAtom, true);

    // Phase 1: mock data, progressive reveal (simulating 2s target)
    const { generateMockRootCause } = await import("./mockData");

    // Step 1: show analyzing state (fast)
    const partial = generateMockRootCause(params, "analyzing");
    set(rootCauseAnalysisAtom, partial);

    // Step 2: show full results after delay
    await new Promise((r) => setTimeout(r, 1500));
    const full = generateMockRootCause(params, "complete");
    set(rootCauseAnalysisAtom, full);
    set(rootCauseLoadingAtom, false);
  }
);

export const closeRootCauseAtom = atom(null, (_get, set) => {
  set(rootCauseVisibleAtom, false);
});

const resetRootCauseAtom = atom(null, (_get, set) => {
  set(rootCauseVisibleAtom, false);
  set(rootCauseAnalysisAtom, null);
  set(rootCauseLoadingAtom, false);
});
registerResetAtom(resetRootCauseAtom);
```

### 4.3 UI Layout

Root Cause는 우측 패널(Agent Panel 위치) 또는 dedicated surface로 표시.

```
┌─────────────────────────────────────────────────────────┐
│ Root Cause Analysis                    Cmd+Shift+R      │
│ Symptom: "TypeError: Cannot read property 'token'"      │
│ auth/AuthController.ts:42                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Analyzing...                                            │
│ ■■■■□□□□□□ locating handler                             │
│ ■■■■■■□□□□ analyzing call graph                         │
│ ■■■■■■■■□□ checking recent commits                     │
│ ■■■■■■■■■■ ranking causes                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ #1 ██████████ 92% — ConfigLoader.getSecret()            │
│    config/ConfigLoader.ts:28                            │
│    "JWT_SECRET env var missing after deploy config      │
│     change in commit 8a21f (3 days ago)"                │
│    Evidence: [commit] [call-path] [runtime-trace]       │
│                                                         │
│ #2 ████████░░ 78% — TokenService.verify()               │
│    auth/TokenService.ts:15                              │
│    "Token verification throws when secret is undefined" │
│    Evidence: [stack-trace] [dataflow]                   │
│                                                         │
│ #3 ██████░░░░ 55% — EnvParser.load()                    │
│    config/EnvParser.ts:8                                │
│    "New .env format not backward compatible"            │
│    Evidence: [recent-commit] [config-change]            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Causal Chain:                                           │
│                                                         │
│  EnvParser.load ──missing key──▶ ConfigLoader.getSecret │
│       │                              │                  │
│       │                    returns undefined             │
│       │                              │                  │
│       │                    TokenService.verify           │
│       │                              │                  │
│       │                     throws TypeError            │
│       │                              │                  │
│       └──────────────────▶ AuthController.handleLogin   │
│                              (SYMPTOM)                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Fix Suggestion] [Show in Editor] [Run Tests] [Share]   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Feature Spec: Self-Explaining Code (Tier 3)

### 5.1 Types

```typescript
// src/features/self-explain/model/types.ts

export interface SelfExplanation {
  symbolId: string;
  symbolName: string;
  filePath: string;
  line: number;

  /** 목적: 이 코드는 무엇을 하는가 */
  purpose: string;

  /** 사용: 누가 이 코드를 쓰는가 */
  usage: {
    callerCount: number;
    topCallers: Array<{ name: string; filePath: string; line: number }>;
    exposedVia: string[];  // "REST API", "GraphQL", "internal", "event"
  };

  /** 영향: 이 코드를 바꾸면 무엇에 영향 */
  impact: {
    modules: number;
    tests: number;
    apis: number;
    services: number;
    riskLevel: string;
  };

  /** 역사: 왜 만들어졌고 어떻게 진화 */
  history: {
    createdCommit: string;
    createdBy: string;
    createdDaysAgo: number;
    totalChanges: number;
    significantChanges: Array<{
      commit: string;
      message: string;
      author: string;
      daysAgo: number;
    }>;
  };

  /** 런타임: 실제 운영 중요도 */
  runtime: {
    callsPerHour: number | null;
    avgLatencyMs: number | null;
    errorRate: number | null;     // 0~1
    lastIncident: string | null;
    criticalPath: boolean;
  };

  /** Why Chain: 존재 이유의 근본 체인 */
  whyChain: string[];
  // e.g., ["Handles JWT validation",
  //        "← Required by auth middleware",
  //        "← Required by all protected API routes",
  //        "← Security compliance requirement"]
}
```

---

## 6. Feature Spec: Intent Engine (Tier 3)

### 6.1 Types

```typescript
// src/features/intent-engine/model/types.ts

export type IntentCategory =
  | "feature"      // 새 기능 추가
  | "bugfix"       // 버그 수정
  | "refactor"     // 리팩토링
  | "investigate"  // 분석/탐색
  | "security"     // 보안 분석
  | "performance"  // 성능 개선
  | "test"         // 테스트 추가
  | "explore";     // 아키텍처 탐색

export interface Intent {
  id: string;
  text: string;                  // 원문 자연어
  category: IntentCategory;
  detectedAt: number;
}

export interface IntentAnalysis {
  intent: Intent;
  /** 대상 심볼/모듈 */
  targets: Array<{
    name: string;
    kind: string;
    filePath: string;
    line: number;
    relevance: number;           // 0~1
  }>;
  /** 영향 받는 범위 */
  affectedScope: {
    files: number;
    modules: number;
    tests: number;
    apis: number;
  };
  /** 잠재 리스크 */
  risks: Array<{
    description: string;
    severity: "low" | "medium" | "high";
    mitigation: string;
  }>;
  /** 아키텍처 고려사항 */
  archConcerns: string[];
  /** 런타임 컨텍스트 */
  runtimeContext: Array<{
    metric: string;
    value: string;
    relevance: string;
  }>;
}

export interface IntentPlan {
  intentId: string;
  steps: Array<{
    id: string;
    action: string;              // "locate", "analyze", "modify", "test", "verify"
    description: string;
    targetFile?: string;
    targetLine?: number;
    status: "pending" | "running" | "done" | "skipped";
    substeps?: string[];
  }>;
  estimatedImpact: {
    newFiles: number;
    modifiedFiles: number;
    deletedFiles: number;
    testsNeeded: number;
  };
}

export interface IntentSession {
  id: string;
  intent: Intent;
  analysis: IntentAnalysis | null;
  plan: IntentPlan | null;
  status: "input" | "analyzing" | "planned" | "executing" | "completed";
  startedAt: number;
  completedAt: number | null;
}
```

### 6.2 UI — Intent Bar (상단)

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 What are you trying to do?                    Cmd+I │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Add rate limiting to the login API endpoint         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Category: feature · Target: AuthController.handleLogin  │
│                                                         │
│ ┌─ Scope Analysis ────────────────────────────────────┐ │
│ │ Files: 3 modified, 1 new · Tests: 4 needed         │ │
│ │ APIs: /api/auth/login affected                      │ │
│ │ Services: Redis (rate limit store)                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ Risks ─────────────────────────────────────────────┐ │
│ │ 🟡 Rate limiter needs Redis — not in current stack  │ │
│ │ 🟡 120k req/h endpoint — latency sensitive          │ │
│ │ 🟢 No architecture violations detected              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ Plan ──────────────────────────────────────────────┐ │
│ │ 1. □ Locate auth handler & middleware chain         │ │
│ │ 2. □ Create RateLimiter middleware                  │ │
│ │ 3. □ Add Redis client configuration                │ │
│ │ 4. □ Wire middleware into auth route                │ │
│ │ 5. □ Add rate limit exceeded response handler       │ │
│ │ 6. □ Write tests (4 cases)                         │ │
│ │ 7. □ Verify impact on existing auth tests           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Execute Plan] [Modify] [Cancel]                        │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Panel Registry 통합

### 7.1 새로운 Bottom Panel 등록

```typescript
// panelRegistry.ts에 추가

// Impact Radar (이미 impact-preview 존재 → 교체)
{
  id: "impact-radar",
  title: "Impact Radar",
  icon: "pulse",
  zone: "bottom",
  shortcut: "Cmd+Shift+I",
  floatable: true,
  component: lazy(() =>
    import("../../../features/impact-radar/ui/ImpactRadarPanel")
      .then((m) => ({ default: m.ImpactRadarPanel }))
  ),
},

// Root Cause Viewer
{
  id: "root-cause",
  title: "Root Cause",
  icon: "search-fuzzy",
  zone: "bottom",
  shortcut: "Cmd+Shift+R",
  floatable: true,
  component: lazy(() =>
    import("../../../features/root-cause/ui/RootCausePanel")
      .then((m) => ({ default: m.RootCausePanel }))
  ),
},

// Architecture Guardian
{
  id: "arch-guardian",
  title: "Architecture",
  icon: "shield",
  zone: "bottom",
  floatable: true,
  component: lazy(() =>
    import("../../../features/arch-guardian/ui/ArchGuardianPanel")
      .then((m) => ({ default: m.ArchGuardianPanel }))
  ),
},
```

### 7.2 새로운 Surface 등록

```typescript
// SurfaceRouter.tsx에 추가

const ReasoningSurface = lazy(() =>
  import("./reasoning").then((m) => ({ default: m.ReasoningSurface }))
);
const TimelineSurface = lazy(() =>
  import("./timeline").then((m) => ({ default: m.TimelineSurface }))
);

// SurfaceId type에 추가: "reasoning" | "timeline"
```

### 7.3 키보드 단축키

```
Cmd+I           → Intent Bar 열기
Cmd+K           → AI Command Palette (기존)
Cmd+Shift+G     → Graph Explorer surface
Cmd+Shift+R     → Root Cause Analysis 시작
Cmd+Shift+I     → Impact Radar 토글
Cmd+Shift+E     → Self-Explain 현재 심볼
Cmd+Shift+A     → Agent Task 패널
Alt+hover       → System Lens mini graph
Shift+hover     → Dataflow path overlay
```

---

## 8. Color System (Visual Hierarchy)

```css
/* Surface 역할 구분 색상 */

/* Code — Blue */
--lens-code: #7aa2f7;

/* Graph — Purple */
--lens-graph: #bb9af7;

/* Reasoning — Green */
--lens-reasoning: #9ece6a;

/* Runtime — Orange */
--lens-runtime: #ff9e64;

/* Impact severity */
--impact-breaking: #f7768e;    /* red */
--impact-major: #ff9e64;       /* orange */
--impact-minor: #e0af68;       /* yellow */
--impact-cosmetic: #565f89;    /* ghost */

/* Risk levels */
--risk-none: #565f89;
--risk-low: #9ece6a;
--risk-medium: #e0af68;
--risk-high: #ff9e64;
--risk-critical: #f7768e;

/* Confidence bar */
--confidence-high: #9ece6a;
--confidence-medium: #e0af68;
--confidence-low: #f7768e;
```

---

## 9. Seeder 통합

### 9.1 Feature Seeder 추가

```typescript
// src/app/dev/seeders/systemIntelligenceSeeders.ts

export function seedSystemLens(): void {
  // 에디터가 열려있는 파일에 대해 mock badge 데이터 주입
  // openCodeLensAtom과 유사한 패턴으로 atom 직접 설정
}

export function seedImpactRadar(): void {
  // 샘플 change event에 대한 impact 결과 주입
}

export function seedRootCause(): void {
  // 샘플 에러에 대한 root cause 분석 결과 주입
}

export function seedIntentSession(): void {
  // 진행 중인 intent session mock 주입
}
```

### 9.2 Bootstrap Hook

```typescript
// src/features/system-lens/lib/useSystemLensBootstrap.ts

export function useSystemLensBootstrap(): void {
  // 에디터 파일 변경 감지 → loadLensBadgesAtom 호출
  // 에디터 수정 감지 → analyzeImpactAtom 호출 (debounced 500ms)
}
```

---

## 10. 구현 Phase 계획

### Phase 1: Mock UI (현재)

```
Week 1-2: System Lens
  ├── types, atoms, mockData
  ├── LensGutterBadge (에디터 연동)
  ├── LensHoverCard
  └── LensMiniGraph (SVG 정적)

Week 3: Impact Radar
  ├── types, atoms, mockData
  ├── ImpactRadarPanel (bottom panel)
  ├── ImpactNodeList
  └── Panel registry 등록

Week 4: Root Cause Viewer
  ├── types, atoms, mockData
  ├── RootCausePanel
  ├── CausalChainGraph (SVG)
  └── EvidenceBundle

Week 5-6: Intent Engine
  ├── IntentBar (상단 overlay)
  ├── IntentPlanPreview
  ├── IntentSimulation
  └── 키보드 단축키 연결

Week 7: Self-Explain + Arch Guardian
  ├── SelfExplainPanel
  ├── ArchGuardianPanel
  └── 에디터 overlay 통합

Week 8: Graph Surface 실제 렌더링
  ├── D3/Cytoscape 통합
  ├── 노드 인터랙션
  └── Lens → Graph 연결
```

### Phase 2: Engine 연결 (추후)

```
mockData.ts 의 generate* 함수들을
Quanta Engine API 호출로 교체

loadLensBadgesAtom:
  mock → quantaEngine.querySymbolBadges(filePath)

analyzeImpactAtom:
  mock → quantaEngine.analyzeImpact(changeSet)

startRootCauseAtom:
  mock → quantaEngine.analyzeCause(symptom)
```

Mock → Engine 전환 포인트가 각 feature의 **atoms.ts write atom** 하나로 수렴하도록 설계.
`mockData.ts` import를 engine client import로 교체하면 끝.

---

## 11. 기존 Code Lens 확장 계획

현재 code-lens feature는 단일 심볼 설명 (summary, flow, sideEffects, complexity).
System Lens와 통합하여:

```
기존 CodeLens (Alt+Click)
  → summary, flow, sideEffects, complexity

확장 SystemLens (hover/gutter)
  → callers, callees, impact, dataflow, runtime, history

통합 방향:
  CodeLens의 openCodeLensAtom 호출 시
  SystemLens의 lensDetailDataAtom도 함께 로드
  → CodeLensCard에 "System" 탭 추가
```

---

## 12. 핵심 Interaction Contract

| 사용자 동작 | 시스템 반응 | Latency |
|---|---|---|
| 파일 열기 | gutter에 모든 심볼 badge 표시 | <100ms |
| 심볼 hover 300ms | LensHoverCard 팝업 | <50ms |
| Shift+hover | Dataflow path inline overlay | <80ms |
| Alt+click | Self-Explain 패널 열기 | <150ms |
| Cmd+click | Go to definition + graph context | <80ms |
| 코드 수정 (debounce 500ms) | Impact Radar 업데이트 | <200ms |
| Cmd+Shift+R | Root Cause 분석 시작 | <2s 첫 결과 |
| Cmd+I | Intent Bar 열기 | instant |
| Intent 입력 + Enter | 분석 + Plan 생성 | <3s |
| HoverCard → [Graph] 클릭 | Mini graph 확장 | <150ms |
| HoverCard → caller 이름 클릭 | 해당 파일:라인으로 jump | <80ms |
| Impact node 클릭 | 에디터에서 해당 위치 열기 | <80ms |
| Causal chain node 클릭 | 에디터에서 해당 위치 + highlight | <80ms |
