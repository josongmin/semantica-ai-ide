# IDE 기능 위시리스트 vs 구현 갭 분석

> AI 기능 제외, IDE 엔진/UI 기능만 대상
> 기준: RFC-PANEL-ARCHITECTURE, 사용자 위시리스트, 실제 코드베이스

---

## 1. 레이어 구분

| 레이어 | 설명 | 현재 상태 |
|--------|------|----------|
| **엔진** | semantica-codegraph-v2 (별도 레포) | RFC 기준 20개 L4/L3 구현 완료 |
| **Tauri Bridge** | invoke → 엔진 호출 | **미구현** — lib.rs에 IDE command 0개 |
| **Frontend UI** | Monaco/CodeMirror + 패널 | CodeMirror만, LSP/엔진 연동 없음 |

---

## 2. 위시리스트 vs 구현 갭 (핵심 10개)

| # | 기능 | 위시 | 엔진 | Tauri Bridge | UI | 갭 |
|---|------|------|------|--------------|-----|-----|
| 1 | **Call Hierarchy** (incoming/outgoing) | O | `call_type_hierarchy.rs` (CHA) | X | X | Bridge + UI |
| 2 | **Type Hierarchy** (interface→impl, class→sub) | O | `call_type_hierarchy.rs` + PTA | X | X | Bridge + UI |
| 3 | **Data Flow Analysis** (show to/from here) | O | IFDS, DFG | X | X | Bridge + UI |
| 4 | **Inline Value Preview** (x=a+b // a=10 b=20) | O | constant propagation 가능 | X | X | Bridge + UI |
| 5 | **Extract Refactorings** (method, variable, param, inline) | O | `code_actions.rs` (Extract/Inline) | X | X | Bridge + UI |
| 6 | **Safe Delete** (used in N places) | O | reference graph | X | X | Bridge + UI |
| 7 | **Find Implementations** (interface→impls) | O | `textDocument/implementation` | X | X | Bridge + UI |
| 8 | **Dead Code Detection** | O | DFG reachability, MCP `dead_code` | X | X | Bridge + UI |
| 9 | **Impact Analysis** | O | TaintSolver + DFG, MCP `impact_analysis` | X | X | Bridge + UI |
| 10 | **Semantic Code Search** | O | UnifiedSearchPort, HIR+Tantivy | X | SemanticSearchPanel 있음 | Bridge 연결 |

---

## 3. SOTA++ 위시리스트 vs 구현

### 3.1 Semantic Navigation SOTA++

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Go to Definition | `go_to_definition.rs` L4 | X | X | Bridge + Editor |
| Find References | `find_references.rs` L4 | X | X | Bridge + Editor |
| Go to Implementation | `textDocument/implementation` | X | X | Bridge + UI |
| Go to Caller/Callee | CallGraphQuery | X | X | Bridge + UI |
| Go to Data Producer | DFG | X | X | Bridge + UI |
| Go to Data Consumer | DFG | X | X | Bridge + UI |
| Cross-repo navigation | - | - | - | 엔진 확장 필요 |

### 3.2 Refactoring Engine SOTA++

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| extract_method | `code_actions.rs` | X | X | Bridge + UI |
| extract_variable | `code_actions.rs` | X | X | Bridge + UI |
| extract_parameter | `code_actions.rs` | X | X | Bridge + UI |
| inline_variable | `code_actions.rs` | X | X | Bridge + UI |
| inline_function | `code_actions.rs` | X | X | Bridge + UI |
| move_symbol | - | - | - | 엔진 확인 필요 |
| change_signature | - | - | - | 엔진 확인 필요 |
| rename | `rename_workspace_edit.rs` L4 | X | X | Bridge + Editor |

### 3.3 Dataflow IDE (IntelliJ killer)

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Show Data Flow To Here | IFDS, DFG | X | X | Bridge + UI |
| Show Data Flow From Here | IFDS, DFG | X | X | Bridge + UI |
| Variable Lifetime View | DFG | X | X | Bridge + UI |
| Field Flow | MemSSA | X | X | Bridge + UI |

### 3.4 Program Slicing IDE

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Backward Slice | `q3/slicing/` L3 | X | X | Bridge + UI |
| Forward Slice | `q3/slicing/` | X | X | Bridge + UI |
| Chop Slice (source→sink) | Taint | X | X | Bridge + UI |

### 3.5 Static Analysis Live IDE

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Taint Visualization | IFDS | X | X | Bridge + UI |
| Vulnerability Explanation | TaintSolverPort | X | X | Bridge + UI |
| Path Explanation | - | - | - | 엔진 확인 |
| Security Autofix | - | - | - | 엔진 확인 |

### 3.6 Impact Analysis Engine

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Change Impact (affected callers/tests) | MCP `impact_analysis` | X | X | Bridge + UI |
| Risk Score (fan-in, fan-out) | - | - | - | 엔진 확인 |

### 3.7 Semantic Code Search

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Natural language search | UnifiedSearchPort | X | SemanticSearchPanel | Bridge 연결 |
| Structural Search | - | - | - | 엔진 확인 |

### 3.8 Execution Prediction

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Path Prediction | - | - | - | 엔진 확인 |
| Value Range | Abstract interpretation | X | X | Bridge + UI |
| Constant propagation preview | - | - | - | Bridge + UI |

### 3.9 Architectural Analysis

| 기능 | 엔진 | Bridge | UI | 갭 |
|------|------|--------|-----|-----|
| Dependency Graph | ImportGraphQueryV2 | X | WorkspaceGraphPanel | Bridge 연결 |
| Layer violation detection | - | - | - | 엔진 확인 |
| Microservice boundary check | - | - | - | 엔진 확인 |

---

## 4. 현재 플러그인에 실제로 있는 것

| 영역 | 구현 | 비고 |
|------|------|------|
| **Editor** | CodeMirrorEditor | CodeMirror autocompletion만 (언어 무관) |
| **패널** | ExplorerPanel, OutputPanel, ProblemsPanel, TerminalPanel, EventLogPanel | UI만, 엔진 데이터 소스 없음 |
| **그래프** | WorkspaceGraphPanel | Mock/로컬 데이터, 엔진 import_graph 미연결 |
| **검색** | SemanticSearchPanel | UI만, UnifiedSearchPort 미연결 |
| **심볼** | SymbolRow, SymbolPanel | UI만 |
| **진단** | diagnosticsMapAtom, SET_DIAGNOSTICS | Agent 이벤트 기반, LSP/엔진 invoke 없음 |
| **LSP** | LspSessionManager (interface) | placeholder, 실제 구현 없음 |
| **Query** | QueryGateway, QueryIntent (typeHierarchy 등) | interface만, 엔진 연동 없음 |
| **Tauri** | devos_send (agent protocol) | IDE invoke 0개 |

---

## 5. 갭 요약

### 5.1 구조적 갭

1. **Tauri ↔ 엔진 연결 부재**
   - RFC Phase 0 계획: `goto_definition`, `hover`, `completion`, `diagnostics`, `semantic_tokens` 5개
   - 실제: `apps/desktop/src-tauri/src/lib.rs`에 IDE command 0개
   - 엔진 Cargo path dependency 미추가

2. **LSP Multiplexer 부재**
   - Semantica + 외부 LSP 병합 계획만 문서화
   - Monaco + LSP 미도입 (CodeMirror 사용 중)

3. **Editor ↔ IDE 기능 연결 부재**
   - Go to definition, Find references, Hover 등 Editor gesture → invoke 경로 없음

### 5.2 기능별 갭 (위시리스트 기준)

| 카테고리 | 위시 수 | 엔진 있음 | Bridge | UI | 실제 사용 가능 |
|----------|---------|-----------|--------|-----|----------------|
| Navigation | 7 | 5 | 0 | 0 | 0 |
| Refactoring | 8 | 4 | 0 | 0 | 0 |
| Dataflow | 4 | 4 | 0 | 0 | 0 |
| Slicing | 3 | 3 | 0 | 0 | 0 |
| Static Analysis | 4 | 2 | 0 | 0 | 0 |
| Impact | 2 | 1 | 0 | 0 | 0 |
| Search | 2 | 1 | 0 | 1 (UI만) | 0 |
| Architecture | 3 | 1 | 0 | 1 (UI만) | 0 |
| Execution | 3 | 0 | 0 | 0 | 0 |

### 5.3 우선순위 제안 (90% IDE 달성용)

RFC 7절 기준 "IDE engine 90%"를 위해 필요한 5가지:

1. **Call hierarchy** — callHierarchy/incomingCalls, outgoingCalls
2. **Dataflow view** — Show data flow to/from here
3. **Extract refactors** — extract_method, extract_variable, inline_*
4. **Impact analysis** — change here → affected services
5. **Semantic search** — query → 관련 코드 (Bridge 연결)

**선행 조건**: Tauri Bridge + 엔진 Cargo 연동 (Phase 0)

---

## 6. 결론

- **엔진**: 20개 기능 L4/L3 수준으로 구현됨 (RFC·별도 레포 기준)
- **플러그인**: 엔진 연동 경로 없음 → **실제 사용 가능한 IDE 기능 0개**
- **갭**: 90%가 **UI surface + Bridge** 문제. 엔진은 대부분 준비됨.
