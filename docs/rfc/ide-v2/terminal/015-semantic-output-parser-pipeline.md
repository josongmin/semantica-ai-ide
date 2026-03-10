# RFC-TERMINAL-015: Semantic Output Parser Pipeline

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-015-PARSER-PIPELINE |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Engine Team, Agent Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Depends On | RFC-TERMINAL-013 (SSOT types), RFC-TERMINAL-001 (Architecture) |
| Scope | Output parser registry, language-specific parsers, extensible plugin system, event emission |

---

## 1. 문제 정의

Rust `OutputPipeline`에 parser registry와 generic parser는 구현되어 있지만,
**언어별/도구별 전문 파서가 스텁 상태**다. 이것 없이는:

- `FileLinkChip` 클릭 불가 (파일 경로 파싱 안 됨)
- `DiagnosticChip` 표시 불가 (에러 메시지 파싱 안 됨)
- `TestResultChip` 표시 불가 (테스트 결과 파싱 안 됨)
- `SummaryEvent` 생성 불가 (블록 요약 없음)
- Agent에게 `parsedErrors` 피드백 불가

즉, **시맨틱 터미널의 핵심 가치가 전부 비활성** 상태.

---

## 2. 목표

```
Phase B 완료 시:
- 주요 5개 도구(TypeScript, ESLint, Jest/Vitest, Cargo, Python)의 출력을 파싱
- file:line:col 클릭 → 에디터 점프 동작
- 에러/경고 카운트 블록 summary 자동 생성
- Agent에게 parsedErrors 반환
- 사용자 커스텀 파서 확장 가능
```

---

## 3. 아키텍처

### 3.1 파이프라인 전체 흐름

```
PTY stdout chunk
  │
  ▼
┌──────────────────────────────────────────────────────────┐
│ OutputPipeline                                            │
│                                                          │
│  ① UTF-8 decode + line buffer                            │
│  ② ANSI strip (파싱용 plain text 추출)                    │
│  ③ Shell marker extraction (command boundary)            │
│  ④ Compatibility check (alt-screen → skip semantic)      │
│  ⑤ Parser Registry dispatch                              │
│     ├── GenericParser (URL, file:line, port)              │
│     ├── TypeScriptParser (tsc errors)                     │
│     ├── ESLintParser (lint warnings/errors)               │
│     ├── JestVitestParser (test results)                   │
│     ├── CargoParser (rustc diagnostics)                   │
│     ├── PythonParser (traceback, pytest)                  │
│     └── UserPluginParser[] (확장)                         │
│  ⑥ Event aggregation (per-command)                       │
│  ⑦ Summary generation (on command complete)              │
│  ⑧ EventEmitter.emit_parsed_event()                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Parser Trait (기존 — 변경 없음)

```rust
pub trait OutputParser: Send + Sync {
    fn name(&self) -> &str;
    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent>;
    fn try_parse_block(&self, lines: &[&str]) -> Option<ParsedTerminalEvent>;
}
```

### 3.3 ANSI Stripping

파서는 **plain text**를 입력받아야 한다. ANSI escape sequence가 포함된 raw output으로는 regex 매칭이 불안정하다.

```rust
/// Strip ANSI escape sequences for parser input
/// Raw output은 그대로 xterm.js에 전달 (색상 보존)
fn strip_ansi(input: &str) -> String {
    // \x1b\[[0-9;]*[a-zA-Z] — CSI sequences
    // \x1b\][^\x07]*\x07    — OSC sequences
    // \x1b[()][AB012]        — character set
    ANSI_RE.replace_all(input, "").to_string()
}
```

### 3.4 Parser 우선순위 & 단락 평가

```rust
impl OutputParserRegistry {
    /// 파서 실행 순서:
    /// 1. Context-aware parsers (현재 커맨드에 따라 선택)
    /// 2. Generic parser (항상 실행)
    ///
    /// 단락 평가: 같은 라인에서 두 파서가 겹치면 context-aware가 우선
    pub fn parse_line(&self, line: &str, command_hint: Option<&str>) -> Vec<ParsedTerminalEvent> {
        let context_parser = self.select_parser(command_hint);
        let mut events = vec![];

        // Context-aware parser first
        if let Some(parser) = context_parser {
            if let Some(event) = parser.try_parse_line(line) {
                events.push(event);
                return events; // 단락: context parser가 잡으면 generic skip
            }
        }

        // Generic fallback
        if let Some(event) = self.generic.try_parse_line(line) {
            events.push(event);
        }

        events
    }
}
```

### 3.5 Command Hint → Parser 선택

```rust
fn select_parser(&self, command_hint: Option<&str>) -> Option<&dyn OutputParser> {
    let cmd = command_hint?;
    let first_token = cmd.split_whitespace().next()?;

    match first_token {
        "tsc" | "npx" => Some(&self.typescript),
        "eslint" | "biome" => Some(&self.eslint),
        "jest" | "vitest" | "pnpm" | "npm" | "npx" if cmd.contains("test") => {
            Some(&self.jest_vitest)
        }
        "cargo" => Some(&self.cargo),
        "python" | "python3" | "pytest" | "py" => Some(&self.python),
        _ => None,
    }
}
```

---

## 4. 언어별 파서 명세

### 4.1 TypeScript Parser (`tsc`, `vue-tsc`)

**대상 패턴:**

```
src/foo.ts(42,13): error TS2322: Type 'string' is not assignable to type 'number'.
src/bar.ts:18:5 - error TS2345: Argument of type ...
```

**Regex:**

```rust
// Pattern 1: tsc native — file(line,col): severity TSxxxx: message
r"^(?P<file>[^\s(]+)\((?P<line>\d+),(?P<col>\d+)\):\s+(?P<sev>error|warning)\s+(?P<code>TS\d+):\s+(?P<msg>.+)$"

// Pattern 2: tsc pretty — file:line:col - severity TSxxxx: message
r"^(?P<file>[^\s:]+):(?P<line>\d+):(?P<col>\d+)\s+-\s+(?P<sev>error|warning)\s+(?P<code>TS\d+):\s+(?P<msg>.+)$"

// Summary: Found N errors in M files.
r"^Found\s+(?P<errors>\d+)\s+error"
```

**Emit:**

| 패턴 매칭 | Event Kind | Data |
|-----------|------------|------|
| error/warning line | `diagnostic` | `{ severity, file, line, column, message, source: "tsc" }` |
| summary line | `summary` | `{ text, counts: { failed: N } }` |

### 4.2 ESLint / Biome Parser

**대상 패턴:**

```
/abs/path/src/foo.ts
  42:13  error  Unexpected any  @typescript-eslint/no-explicit-any
  18:5   warning  ...

✖ 2 problems (1 error, 1 warning)
```

**Regex:**

```rust
// File header (absolute or relative path, standalone line)
r"^(?P<file>/[^\s]+|[a-zA-Z][^\s]*\.[a-z]+)$"

// Diagnostic line: col:line severity message rule
r"^\s+(?P<line>\d+):(?P<col>\d+)\s+(?P<sev>error|warning|info)\s+(?P<msg>.+?)\s{2,}(?P<rule>\S+)$"

// Summary
r"^[✖✗]\s+(?P<total>\d+)\s+problems?\s+\((?P<errors>\d+)\s+errors?,\s+(?P<warnings>\d+)"
```

**특이점:** ESLint는 **블록 단위 파싱** 필요 (파일 헤더 + 하위 diagnostic 라인).
`try_parse_block`에서 현재 파일 컨텍스트를 유지하며 파싱.

### 4.3 Jest / Vitest Parser

**대상 패턴:**

```
 PASS  src/utils.test.ts (3.2s)
 FAIL  src/parser.test.ts (1.1s)
  ● Parser > should handle edge case
    expect(received).toBe(expected)
    Expected: 42
    Received: undefined

Tests: 2 failed, 12 passed, 14 total
```

**Regex:**

```rust
// Test file result
r"^\s*(?P<status>PASS|FAIL|SKIP)\s+(?P<file>\S+)(?:\s+\((?P<duration>[\d.]+)s?\))?"

// Individual test case
r"^\s*[●✓✕✗]\s+(?P<suite>.+?)\s+>\s+(?P<name>.+)$"

// Summary line
r"^Tests:\s+(?:(?P<failed>\d+)\s+failed,?\s*)?(?:(?P<passed>\d+)\s+passed,?\s*)?(?:(?P<skipped>\d+)\s+skipped,?\s*)?(?P<total>\d+)\s+total"

// Vitest variant
r"^\s*(?P<status>✓|×|↓)\s+(?P<name>.+?)(?:\s+(?P<duration>\d+)ms)?$"
```

**Emit:**

| 패턴 | Event Kind | Data |
|------|------------|------|
| PASS/FAIL line | `test-result` | `{ testName: file, status, duration }` |
| test case line | `test-result` | `{ testName: suite > name, status }` |
| Summary | `summary` | `{ text, counts: { passed, failed, skipped, total } }` |
| FAIL + file:line in stack | `file-link` + `diagnostic` | stack trace → file link |

### 4.4 Cargo Parser (`rustc`, `clippy`)

**대상 패턴:**

```
error[E0308]: mismatched types
 --> src/main.rs:42:13
  |
42 |     let x: u32 = "hello";
  |                  ^^^^^^^ expected `u32`, found `&str`

warning: unused variable: `y`
 --> src/lib.rs:18:9

error: could not compile `my-crate` (bin "my-crate") due to 2 previous errors
```

**Regex:**

```rust
// Diagnostic header
r"^(?P<sev>error|warning)(?:\[(?P<code>[A-Z]\d+)\])?: (?P<msg>.+)$"

// Location pointer
r"^\s+--> (?P<file>[^:]+):(?P<line>\d+):(?P<col>\d+)$"

// Compile summary
r"^error: could not compile .+ due to (?P<count>\d+) previous error"
```

**특이점:** Cargo는 **multi-line block** 파싱 필수.
diagnostic header → location → source snippet → help message 가 하나의 블록.

### 4.5 Python Parser (`traceback`, `pytest`)

**대상 패턴:**

```
Traceback (most recent call last):
  File "src/main.py", line 42, in <module>
    result = process(data)
ValueError: invalid literal for int()

========================= short test summary info =========================
FAILED tests/test_query.py::test_rewrite - AssertionError: ...
====== 1 failed, 12 passed in 3.24s ======
```

**Regex:**

```rust
// Traceback file link
r#"^\s+File "(?P<file>[^"]+)", line (?P<line>\d+)"#

// Pytest FAILED summary
r"^FAILED\s+(?P<file>[^:]+)::(?P<test>\S+)\s*-?\s*(?P<msg>.*)?$"

// Pytest summary
r"^[=]+\s+(?:(?P<failed>\d+)\s+failed)?[,\s]*(?:(?P<passed>\d+)\s+passed)?[,\s]*in\s+(?P<duration>[\d.]+)s"

// Exception type
r"^(?P<type>[A-Z]\w*(?:Error|Exception|Warning)): (?P<msg>.+)$"
```

---

## 5. Summary 생성 전략

### 5.1 Command 완료 시 자동 Summary

```rust
impl OutputPipeline {
    fn generate_summary(&self, command: &TerminalCommand) -> Option<SummaryEvent> {
        let events = self.events_for_command(command.command_id);

        let mut errors = 0u32;
        let mut warnings = 0u32;
        let mut tests_passed = 0u32;
        let mut tests_failed = 0u32;
        let mut tests_skipped = 0u32;
        let mut ports: Vec<u16> = vec![];

        for event in &events {
            match &event.data {
                ParsedEventData::Diagnostic(d) => match d.severity {
                    "error" => errors += 1,
                    "warning" => warnings += 1,
                    _ => {}
                },
                ParsedEventData::TestResult(t) => match t.status {
                    "pass" => tests_passed += 1,
                    "fail" => tests_failed += 1,
                    "skip" => tests_skipped += 1,
                    _ => {}
                },
                ParsedEventData::PortBinding(p) => ports.push(p.port),
                _ => {}
            }
        }

        // 파서가 직접 생성한 summary가 있으면 우선 사용
        let parser_summary = events.iter().find(|e| e.kind == "summary");
        if let Some(s) = parser_summary {
            return Some(s.data.clone());
        }

        // 없으면 자동 집계
        let has_data = errors > 0 || warnings > 0 || tests_passed > 0
            || tests_failed > 0 || !ports.is_empty();

        if !has_data { return None; }

        Some(SummaryEvent {
            text: format_summary_text(errors, warnings, tests_passed, tests_failed, tests_skipped),
            counts: Some(SummaryCounts {
                passed: if tests_passed > 0 { Some(tests_passed) } else { None },
                failed: Some(errors + tests_failed),
                skipped: if tests_skipped > 0 { Some(tests_skipped) } else { None },
                total: None,
            }),
        })
    }
}
```

### 5.2 Summary Text 포맷

```
Build:  "2 errors · 1 warning"
Test:   "3 failed · 12 passed · 1 skipped (16 total)"
Mixed:  "2 errors · 3 tests failed"
Clean:  "✓ 0 errors · 15 passed"
```

---

## 6. 확장성: User Plugin Parser

### 6.1 TOML 기반 커스텀 파서

사용자가 `.semantica/parsers/` 에 커스텀 파서 정의:

```toml
# .semantica/parsers/custom-lint.toml
[parser]
name = "custom-lint"
command_match = ["my-lint", "custom-check"]

[[rules]]
kind = "diagnostic"
pattern = '^(?P<file>[^:]+):(?P<line>\d+):\s+(?P<sev>ERROR|WARN):\s+(?P<msg>.+)$'
severity_map = { ERROR = "error", WARN = "warning" }

[[rules]]
kind = "file-link"
pattern = '^\s+at\s+(?P<file>[^:]+):(?P<line>\d+):(?P<col>\d+)$'

[[rules]]
kind = "summary"
pattern = '^Total:\s+(?P<errors>\d+)\s+errors,\s+(?P<warnings>\d+)\s+warnings$'
```

### 6.2 런타임 로딩

```rust
impl OutputParserRegistry {
    pub fn load_user_parsers(&mut self, workspace_root: &Path) {
        let parser_dir = workspace_root.join(".semantica/parsers");
        if !parser_dir.exists() { return; }

        for entry in fs::read_dir(parser_dir).ok().into_iter().flatten() {
            let path = entry.path();
            if path.extension() == Some("toml".as_ref()) {
                match TomlParser::load(&path) {
                    Ok(parser) => self.register(Box::new(parser)),
                    Err(e) => tracing::warn!("Failed to load parser {}: {}", path.display(), e),
                }
            }
        }
    }
}
```

---

## 7. 성능 제약

| 제약 | 값 | 이유 |
|------|-----|------|
| 라인당 최대 파서 실행 시간 | < 100µs | PTY throughput 저하 방지 |
| 라인당 최대 emit 이벤트 | 3개 | UI 렌더 부하 제한 |
| 세션당 최대 parsed events | 1,000개 | 메모리 제한 (atoms.ts MAX_EVENTS) |
| ANSI strip은 파서 입력에만 | — | raw output은 xterm.js에 그대로 전달 |
| Regex는 lazy_static / once_cell | — | 컴파일 비용 1회 |

---

## 8. 테스트 전략

### 8.1 Unit Test (per parser)

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn typescript_error_pattern_1() {
        let parser = TypeScriptParser::new();
        let line = "src/foo.ts(42,13): error TS2322: Type 'string' is not assignable to type 'number'.";
        let event = parser.try_parse_line(line).unwrap();
        assert_eq!(event.kind, "diagnostic");
        // assert file, line, col, severity, message
    }
}
```

### 8.2 Golden File Test

```
tests/fixtures/parsers/
  typescript/
    tsc-errors.txt            ← raw output
    tsc-errors.expected.json  ← expected ParsedTerminalEvent[]
  jest/
    jest-mixed.txt
    jest-mixed.expected.json
  cargo/
    cargo-errors.txt
    cargo-errors.expected.json
```

### 8.3 Integration Test

OutputPipeline 전체를 통과시키는 end-to-end 테스트:
- raw PTY chunk 입력 → 최종 emitted events 검증
- command boundary + parsing + summary 전체 체인

---

## 9. 구현 순서

| 순서 | 작업 | 의존성 | 예상 규모 |
|------|------|--------|-----------|
| 1 | ANSI strip 유틸 + 테스트 | 없음 | S |
| 2 | GenericParser 강화 (file:line 변형 커버리지) | 1 | S |
| 3 | TypeScriptParser 구현 + golden tests | 1 | M |
| 4 | JestVitestParser 구현 + golden tests | 1 | M |
| 5 | ESLintParser (블록 파싱) 구현 | 1 | M |
| 6 | CargoParser 구현 | 1 | M |
| 7 | PythonParser 구현 | 1 | M |
| 8 | Summary 자동 생성 로직 | 3-7 | S |
| 9 | OutputPipeline integration test | 1-8 | M |
| 10 | User plugin (TOML) 로더 | 9 | L (V1.5) |

---

## 관련 문서

- [013-event-state-ssot.md](./013-event-state-ssot.md) — ParsedTerminalEvent 스키마
- [001-architecture.md](./001-architecture.md) — OutputPipeline 위치
- [005-compatibility-and-components.md](./005-compatibility-and-components.md) — 호환성 skip 조건
- [004-warp-level-ux.md](./004-warp-level-ux.md) — Block summary UX 스펙
