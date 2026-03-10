# RFC (Backend) — 이 프로젝트 구현 범위 아님

뒷단 에이전트(추론, 도구 실행, 임베딩, ModelPort, EnginePort 등) 관련 RFC.  
**이 프로젝트(semantica-code-agent-plugin)는 Agent UX 프론트엔드만 구현**하므로, 아래 문서는 참조용.

| RFC | 내용 |
|-----|------|
| [011](011.md) | Quanta 엔진 연동 (Rust, analysis.*) |
| [012](012.md) | Model Runtime SSOT (ModelPort 라우팅, fallback) |
| [014](014.md) | Agent Trajectory Evaluation |
| [015](015.md) | Agent Runtime v3 (6 Layer) — superseded by 018 |
| [018](018.md) | SOTA+++ v2 (Session Actor, Event Sourcing, EnginePort, EventStore) |
| [019](019.md) | Engine Execution Single Truth (Budget, Determinism, Analyzer Contract) |
