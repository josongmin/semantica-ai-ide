RFC-016-V2: Floating Console Window
Field Value
ID RFC-016-V2-FLOATING-CONSOLE
Status Draft
Date 2026-03-08
Owner Semantica DevOS
Audience IDE Team, Engine Team
Parent RFC-001-V2 Frontend Integration Kernel
Depends On RFC-015 Monorepo Structure (Tauri IPC), Engine Rust Runtime
Scope Floating console UI, Rust engine output streaming, agent execution log display
Non-Goals Terminal emulator 구현, interactive shell, stdin 입력

## 1. Summary

Activity Bar 하단에 콘솔 버튼을 추가하고, 클릭 시 macOS PiP(Picture-in-Picture) 스타일의 **플로팅 콘솔 윈도우**를 표시한다.

콘솔에는 두 종류의 출력이 표시된다:
- **Rust Engine 출력**: 인덱싱, 파싱, 그래프 빌드 등 엔진이 실행하면서 생성하는 stdout/stderr
- **Agent 실행 로그**: AI 에이전트가 도구를 호출하거나 코드를 실행할 때 발생하는 콘솔 출력

## 2. Problem Statement

| 문제 | 설명 |
|------|------|
| 엔진 상태 불투명 | Rust 엔진이 백그라운드에서 무엇을 하는지 사용자가 알 수 없음 |
| 에이전트 실행 추적 불가 | 에이전트가 실행한 명령의 stdout/stderr를 확인할 수 없음 |
| 디버깅 어려움 | 엔진/에이전트 오류 발생 시 원인 파악이 어려움 |
| 기존 Bottom Panel 부적합 | 콘솔은 항상 떠 있으면서 작업을 방해하지 않아야 함 → 고정 패널보다 플로팅이 적합 |

## 3. Design

### 3.1 UI 구조

```
+------------------------------------------+
| Activity Bar (icon strip)                |
|  [explorer]                              |
|  [search]                                |
|  [git]                                   |
|  ...                                     |
|                                          |
|  ─── spacer ───                          |
|  [console] ← 새 버튼                      |
+------------------------------------------+

클릭 시:

+------------------------------------------+
|                IDE Content               |
|                                          |
|        +-------------------------+       |
|        | ▸ Console         — □ × |  ← 플로팅 윈도우
|        |-------------------------|       |
|        | [Engine] [Agent]        |       |
|        |                         |       |
|        | 14:32:01 Indexing...    |       |
|        | 14:32:03 Built graph    |       |
|        | 14:32:05 Agent: npm test|       |
|        +-------------------------+       |
|                                          |
+------------------------------------------+
```

### 3.2 플로팅 윈도우 동작

| 기능 | 설명 |
|------|------|
| 드래그 이동 | 타이틀바를 드래그하여 화면 내 자유 이동 |
| 리사이즈 | 모서리/변 드래그로 크기 조절 (min: 320×200, max: 뷰포트 80%) |
| 최소화 | 타이틀바만 남기고 접기 (높이 32px) |
| 닫기 | Activity Bar 버튼 재클릭 또는 × 버튼으로 닫기 |
| 위치 기억 | 마지막 위치/크기를 localStorage에 저장 |
| 초기 위치 | 뷰포트 우하단, statusbar 위 16px 여백 |
| z-index | `--z-overlay` (20) 레이어 — 모달/토스트 아래, 일반 콘텐츠 위 |

### 3.3 콘솔 탭

| 탭 | 소스 | 내용 |
|----|------|------|
| Engine | Rust runtime (Tauri IPC `engine:log` event) | 인덱싱 진행률, 파싱 결과, 그래프 빌드 로그, 에러/워닝 |
| Agent | Agent runtime (WebSocket/IPC) | 도구 호출 stdout/stderr, 코드 실행 결과, 에이전트 상태 변경 |

각 탭은 독립적인 로그 버퍼를 가지며, 탭 전환 시 스크롤 위치가 보존된다.

### 3.4 로그 엔트리 구조

```typescript
interface ConsoleEntry {
  id: string;
  timestamp: number;
  source: "engine" | "agent";
  level: "info" | "warn" | "error" | "debug";
  message: string;
  /** 선택적: 접을 수 있는 상세 내용 */
  detail?: string;
}
```

## 4. Architecture

### 4.1 State (Jotai Atoms)

```typescript
// src/app/shell/model/consoleAtoms.ts

/** 콘솔 윈도우 표시 여부 */
export const consoleVisibleAtom = atom(false);
export const toggleConsoleAtom = atom(null, (get, set) => {
  set(consoleVisibleAtom, !get(consoleVisibleAtom));
});

/** 콘솔 윈도우 위치/크기 (localStorage 동기화) */
export const consoleGeometryAtom = atomWithStorage("console-geometry", {
  x: -1,  // -1 = 초기 위치 계산 필요
  y: -1,
  width: 480,
  height: 320,
  minimized: false,
});

/** 활성 콘솔 탭 */
export const activeConsoleTabAtom = atom<"engine" | "agent">("engine");

/** 로그 엔트리 (최대 5000건, ring buffer) */
export const consoleEntriesAtom = atom<ConsoleEntry[]>([]);
export const appendConsoleEntryAtom = atom(null, (get, set, entry: ConsoleEntry) => {
  const prev = get(consoleEntriesAtom);
  const next = prev.length >= 5000 ? [...prev.slice(-4999), entry] : [...prev, entry];
  set(consoleEntriesAtom, next);
});

/** 필터된 엔트리 (탭 기준) */
export const filteredConsoleEntriesAtom = atom((get) => {
  const tab = get(activeConsoleTabAtom);
  return get(consoleEntriesAtom).filter((e) => e.source === tab);
});
```

### 4.2 Hook: useFloatingWindow

```typescript
// src/shared/lib/hooks/useFloatingWindow.ts

interface FloatingWindowState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
}

interface UseFloatingWindowReturn {
  state: FloatingWindowState;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
  resizeHandlers: {
    onMouseDown: (e: React.MouseEvent, edge: ResizeEdge) => void;
  };
  minimize: () => void;
  restore: () => void;
}

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
```

드래그/리사이즈 로직은 기존 `ResizeHandle` 패턴을 따른다:
- `mousedown` → document-level `mousemove`/`mouseup` 리스너 등록
- `mousemove` 중 `document.body.style.userSelect = "none"` 설정
- `mouseup` 시 리스너 해제, 최종 위치를 atom에 저장

### 4.3 Components

```
src/app/shell/
├── console/
│   ├── FloatingConsole.tsx      # 메인 플로팅 윈도우 컨테이너
│   ├── ConsoleToolbar.tsx       # 탭 + 액션 버튼 (clear, filter, minimize, close)
│   ├── ConsoleLogView.tsx       # 가상화된 로그 목록 (@tanstack/react-virtual)
│   └── ConsoleEntry.tsx         # 개별 로그 행 (timestamp, level icon, message)
```

#### FloatingConsole.tsx 핵심 구조

```tsx
export function FloatingConsole() {
  const visible = useAtomValue(consoleVisibleAtom);
  const { state, dragHandlers, resizeHandlers, minimize } = useFloatingWindow(consoleGeometryAtom);

  if (!visible) return null;

  return (
    <OverlayPortal>
      <div
        className="fixed glass-panel rounded-lg shadow-lg border border-vsc-border/40
                   flex flex-col overflow-hidden"
        style={{
          left: state.position.x,
          top: state.position.y,
          width: state.size.width,
          height: state.minimized ? 32 : state.size.height,
          zIndex: "var(--z-overlay)",
        }}
      >
        {/* Title bar — drag handle */}
        <div {...dragHandlers} className="flex items-center h-8 px-2 shrink-0 cursor-move
                                          border-b border-vsc-border/20 select-none">
          <Icon name="terminal" tokenSize="xs" className="text-vsc-accent mr-1.5" />
          <span className="text-2xs font-medium text-vsc-fg">Console</span>
          <div className="flex-1" />
          {/* Window controls */}
          <ConsoleWindowControls onMinimize={minimize} />
        </div>

        {/* Content — hidden when minimized */}
        {!state.minimized && (
          <>
            <ConsoleToolbar />
            <ConsoleLogView />
          </>
        )}

        {/* Resize edges */}
        <ResizeEdges onResize={resizeHandlers.onMouseDown} />
      </div>
    </OverlayPortal>
  );
}
```

### 4.4 Activity Bar 통합

`ShellSidebar.tsx`의 icon strip에 하단 고정 콘솔 버튼을 추가한다:

```tsx
// Icon strip 내부, spacer 후 하단 고정
<div className="flex flex-col items-center w-10 shrink-0 ...">
  {/* 기존 패널 버튼들 */}
  {panels.map((panel) => (...))}

  {/* Spacer */}
  <div className="flex-1" />

  {/* Console 버튼 — 하단 고정 */}
  <button onClick={toggleConsole} className="..." title="Console">
    <Icon name="terminal" tokenSize="base" />
  </button>
</div>
```

### 4.5 데이터 흐름

```
Rust Engine (Tauri)                    Agent Runtime
      │                                      │
      ▼                                      ▼
  tauri::emit("engine:log", payload)    WS/IPC message
      │                                      │
      ▼                                      ▼
  TauriAdapter.onEngineLog()           AgentTransport.onLog()
      │                                      │
      └──────────┬───────────────────────────┘
                 ▼
        appendConsoleEntryAtom({ source, level, message })
                 │
                 ▼
        consoleEntriesAtom (ring buffer, max 5000)
                 │
                 ▼
        filteredConsoleEntriesAtom (탭 필터)
                 │
                 ▼
        ConsoleLogView (가상화 렌더링)
```

### 4.6 Tauri IPC 이벤트

```rust
// apps/desktop/src-tauri/src/lib.rs

// 엔진 로그 이벤트 구조
#[derive(Clone, serde::Serialize)]
struct EngineLogEvent {
    level: String,    // "info" | "warn" | "error" | "debug"
    message: String,
    detail: Option<String>,
    timestamp: u64,
}

// 엔진 실행 중 로그 emit
app_handle.emit("engine:log", EngineLogEvent {
    level: "info".into(),
    message: "Indexing src/...".into(),
    detail: None,
    timestamp: now_ms(),
})?;
```

## 5. 가상화 & 성능

| 항목 | 전략 |
|------|------|
| 렌더링 | `@tanstack/react-virtual`로 가상 스크롤 (행 높이 20px) |
| 버퍼 | Ring buffer 5000건 — 초과 시 오래된 항목 제거 |
| Auto-scroll | 스크롤이 하단에 있을 때만 새 항목 추가 시 자동 스크롤 |
| 일시정지 | 사용자가 위로 스크롤하면 auto-scroll 중단, "Jump to bottom" 버튼 표시 |
| 필터 | level 필터 (info/warn/error) — `useMemo`로 파생 |

## 6. 스타일 & 테마

```css
/* 콘솔 전용 스타일 */
.console-entry { font-family: var(--font-mono); font-size: 11px; line-height: 20px; }
.console-timestamp { color: var(--vsc-text-ghost); }
.console-level-error { color: var(--vsc-error); }
.console-level-warn { color: var(--vsc-warning); }
.console-level-info { color: var(--vsc-text-secondary); }
.console-level-debug { color: var(--vsc-text-ghost); }
```

플로팅 윈도우는 `glass-panel` 클래스(backdrop-blur + semi-transparent bg)를 사용하여 IDE 콘텐츠 위에 자연스럽게 떠 보이도록 한다.

## 7. 구현 순서

| Phase | 작업 | 산출물 |
|-------|------|--------|
| 1 | Atoms + useFloatingWindow hook | `consoleAtoms.ts`, `useFloatingWindow.ts` |
| 2 | FloatingConsole 컴포넌트 (정적 로그) | `console/*.tsx` |
| 3 | Activity Bar 콘솔 버튼 | `ShellSidebar.tsx` 수정 |
| 4 | ShellLayout에 FloatingConsole 마운트 | `ShellLayout.tsx` 수정 |
| 5 | Tauri IPC engine:log 연동 | `TauriAdapter.ts`, `lib.rs` |
| 6 | Agent 실행 로그 연동 | `AgentTransport` 수정 |
| 7 | 가상 스크롤 + auto-scroll | `ConsoleLogView.tsx` |

## 8. Open Questions

| # | 질문 | 상태 |
|---|------|------|
| 1 | 로그 레벨 필터를 콘솔 내에서 제공할지, 전역 설정으로 할지 | 미결 |
| 2 | 콘솔 로그를 파일로 export하는 기능이 필요한지 | 미결 |
| 3 | 여러 에이전트의 로그를 탭/세션으로 분리할지 | 미결 |
| 4 | VSCode webview 환경에서도 동일한 콘솔을 지원할지 (Tauri 전용 vs 공통) | 미결 |
