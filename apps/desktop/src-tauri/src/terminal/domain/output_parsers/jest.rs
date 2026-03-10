//! Jest / Vitest / Mocha test result parser.
//!
//! Matches patterns like:
//!   ✓ should work (3ms)
//!   ✕ should fail (10ms)
//!   PASS src/foo.test.ts
//!   FAIL src/bar.test.ts
//!   Tests: 2 failed, 8 passed, 10 total

use crate::terminal::domain::ports::OutputParser;
use crate::terminal::domain::types::{
    ParsedEventData, ParsedEventKind, ParsedTerminalEvent, SummaryCounts, SummaryEvent,
    TestResultEvent,
};

pub struct JestParser;

impl OutputParser for JestParser {
    fn name(&self) -> &'static str {
        "jest"
    }

    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent> {
        let trimmed = line.trim();

        // Pass/Fail file result
        if let Some(event) = parse_suite_result(trimmed) {
            return Some(event);
        }

        // Individual test result
        if let Some(event) = parse_test_result(trimmed) {
            return Some(event);
        }

        // Summary line
        if let Some(event) = parse_test_summary(trimmed) {
            return Some(event);
        }

        None
    }

    fn try_parse_block(&self, lines: &[&str]) -> Option<ParsedTerminalEvent> {
        // Look for test summary block
        for line in lines {
            if let Some(event) = parse_test_summary(line.trim()) {
                return Some(event);
            }
        }
        None
    }
}

fn parse_suite_result(line: &str) -> Option<ParsedTerminalEvent> {
    // PASS src/foo.test.ts
    // FAIL src/bar.test.ts
    if let Some(rest) = line.strip_prefix("PASS ") {
        return Some(make_test_event(rest.trim(), "pass", None, None));
    }
    if let Some(rest) = line.strip_prefix("FAIL ") {
        return Some(make_test_event(rest.trim(), "fail", None, None));
    }

    // Handle with ANSI color codes stripped
    let stripped = strip_ansi_prefix(line);
    if let Some(rest) = stripped.strip_prefix("PASS ") {
        return Some(make_test_event(rest.trim(), "pass", None, None));
    }
    if let Some(rest) = stripped.strip_prefix("FAIL ") {
        return Some(make_test_event(rest.trim(), "fail", None, None));
    }

    None
}

fn parse_test_result(line: &str) -> Option<ParsedTerminalEvent> {
    let stripped = strip_ansi_prefix(line);
    let trimmed = stripped.trim();

    // ✓ test name (Nms)  or  √ test name (Nms)
    // ✕ test name (Nms)  or  × test name (Nms)
    // ○ test name         (skipped)

    let (status, rest) = if trimmed.starts_with('✓')
        || trimmed.starts_with('√')
        || trimmed.starts_with("✔")
    {
        ("pass", trim_marker(trimmed))
    } else if trimmed.starts_with('✕')
        || trimmed.starts_with('×')
        || trimmed.starts_with("✖")
    {
        ("fail", trim_marker(trimmed))
    } else if trimmed.starts_with('○') || trimmed.starts_with("◌") {
        ("skip", trim_marker(trimmed))
    } else if let Some(after) = trimmed.strip_prefix("✓ ") {
        ("pass", after)
    } else {
        return None;
    };

    let (name, duration) = extract_duration(rest);

    Some(make_test_event(&name, status, duration, None))
}

fn parse_test_summary(line: &str) -> Option<ParsedTerminalEvent> {
    let stripped = strip_ansi_prefix(line);
    let trimmed = stripped.trim();

    // Tests: 2 failed, 8 passed, 10 total
    // Tests:       10 passed, 10 total
    // Test Suites: 1 failed, 3 passed, 4 total
    if !trimmed.starts_with("Tests:") && !trimmed.starts_with("Test Suites:") {
        return None;
    }

    let counts_part = trimmed.split(':').nth(1)?.trim();
    let mut passed = None;
    let mut failed = None;
    let mut skipped = None;
    let mut total = None;

    for segment in counts_part.split(',') {
        let seg = segment.trim();
        if seg.ends_with("passed") {
            passed = parse_count_before(seg, "passed");
        } else if seg.ends_with("failed") {
            failed = parse_count_before(seg, "failed");
        } else if seg.ends_with("skipped") || seg.ends_with("pending") || seg.ends_with("todo") {
            skipped = parse_count_before(seg, seg.split_whitespace().last().unwrap_or(""));
        } else if seg.ends_with("total") {
            total = parse_count_before(seg, "total");
        }
    }

    Some(make_summary_event(trimmed, passed, failed, skipped, total))
}

// ─── Helpers ─────────────────────────────────────────────

fn strip_ansi_prefix(s: &str) -> String {
    // Remove ANSI escape sequences
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '\x1b' {
            // Skip until we find the end of the escape sequence
            if let Some(&next) = chars.peek() {
                if next == '[' {
                    chars.next();
                    while let Some(&c) = chars.peek() {
                        chars.next();
                        if c.is_ascii_alphabetic() {
                            break;
                        }
                    }
                    continue;
                }
            }
        }
        result.push(c);
    }

    result
}

fn trim_marker(s: &str) -> &str {
    // Skip the first character (marker) and any whitespace
    let bytes = s.as_bytes();
    let mut i = 0;
    // Skip one UTF-8 character
    if !bytes.is_empty() {
        if bytes[i] < 0x80 {
            i += 1;
        } else if bytes[i] < 0xE0 {
            i += 2;
        } else if bytes[i] < 0xF0 {
            i += 3;
        } else {
            i += 4;
        }
    }
    // Skip whitespace
    while i < bytes.len() && bytes[i] == b' ' {
        i += 1;
    }
    &s[i.min(s.len())..]
}

fn extract_duration(s: &str) -> (String, Option<u64>) {
    // Extract "(Nms)" or "(N ms)" from end of string
    if let Some(paren_start) = s.rfind('(') {
        if let Some(paren_end) = s.rfind(')') {
            if paren_end > paren_start {
                let inside = &s[paren_start + 1..paren_end].trim();
                let ms_str = inside
                    .trim_end_matches("ms")
                    .trim_end_matches('s')
                    .trim();
                if let Ok(ms) = ms_str.parse::<u64>() {
                    let name = s[..paren_start].trim().to_string();
                    return (name, Some(ms));
                }
            }
        }
    }
    (s.trim().to_string(), None)
}

fn parse_count_before(segment: &str, keyword: &str) -> Option<u32> {
    let before = segment.trim().strip_suffix(keyword)?.trim();
    before.parse::<u32>().ok()
}

fn make_test_event(
    name: &str,
    status: &str,
    duration: Option<u64>,
    message: Option<String>,
) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_test_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::TestResult,
        timestamp: 0,
        data: ParsedEventData::TestResult(TestResultEvent {
            test_name: name.to_string(),
            status: status.into(),
            duration,
            message,
        }),
    }
}

fn make_summary_event(
    text: &str,
    passed: Option<u32>,
    failed: Option<u32>,
    skipped: Option<u32>,
    total: Option<u32>,
) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_sum_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::Summary,
        timestamp: 0,
        data: ParsedEventData::Summary(SummaryEvent {
            text: text.to_string(),
            counts: Some(SummaryCounts {
                passed,
                failed,
                skipped,
                total,
            }),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_pass_suite() {
        let parser = JestParser;
        let event = parser.try_parse_line("PASS src/foo.test.ts").unwrap();
        if let ParsedEventData::TestResult(t) = &event.data {
            assert_eq!(t.status, "pass");
            assert_eq!(t.test_name, "src/foo.test.ts");
        }
    }

    #[test]
    fn parses_fail_suite() {
        let parser = JestParser;
        let event = parser.try_parse_line("FAIL src/bar.test.ts").unwrap();
        if let ParsedEventData::TestResult(t) = &event.data {
            assert_eq!(t.status, "fail");
        }
    }

    #[test]
    fn parses_test_summary() {
        let parser = JestParser;
        let event = parser
            .try_parse_line("Tests:        2 failed, 8 passed, 10 total")
            .unwrap();
        if let ParsedEventData::Summary(s) = &event.data {
            assert_eq!(s.counts.as_ref().unwrap().failed, Some(2));
            assert_eq!(s.counts.as_ref().unwrap().passed, Some(8));
            assert_eq!(s.counts.as_ref().unwrap().total, Some(10));
        }
    }

    #[test]
    fn ignores_non_test_output() {
        let parser = JestParser;
        assert!(parser.try_parse_line("normal output").is_none());
    }
}
