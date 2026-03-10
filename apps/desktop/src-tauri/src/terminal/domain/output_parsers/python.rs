//! Python output parser — tracebacks, pytest results, file references.
//!
//! Matches patterns like:
//!   File "foo.py", line 42, in bar
//!   Traceback (most recent call last):
//!   `PASSED tests/test_foo.py::test_bar`
//!   `FAILED tests/test_foo.py::test_baz - AssertionError`
//!   === 3 passed, 1 failed in 2.50s ===

use crate::terminal::domain::ports::OutputParser;
use crate::terminal::domain::types::{
    DiagnosticEvent, FileLinkEvent, ParsedEventData, ParsedEventKind, ParsedTerminalEvent,
    SummaryCounts, SummaryEvent, TestResultEvent,
};

pub struct PythonParser;

impl OutputParser for PythonParser {
    fn name(&self) -> &'static str {
        "python"
    }

    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent> {
        let trimmed = line.trim();

        // Python traceback file reference
        if let Some(event) = parse_python_file_ref(trimmed) {
            return Some(event);
        }

        // Pytest test result
        if let Some(event) = parse_pytest_result(trimmed) {
            return Some(event);
        }

        // Pytest summary
        if let Some(event) = parse_pytest_summary(trimmed) {
            return Some(event);
        }

        // Python error message
        if let Some(event) = parse_python_error(trimmed) {
            return Some(event);
        }

        None
    }

    fn try_parse_block(&self, lines: &[&str]) -> Option<ParsedTerminalEvent> {
        // Look for traceback block
        for (i, line) in lines.iter().enumerate() {
            if line.trim() == "Traceback (most recent call last):" {
                // Find the last "File ..." line in the traceback
                let mut last_file_line = None;
                for l in &lines[(i + 1)..] {
                    let l = l.trim();
                    if l.starts_with("File \"") {
                        last_file_line = Some(l);
                    } else if !l.is_empty() && !l.starts_with("File") && last_file_line.is_some() {
                        // This is the error message line
                        if let Some(file_ref) = last_file_line {
                            return parse_python_file_ref(file_ref);
                        }
                    }
                }
            }
        }
        None
    }
}

fn parse_python_file_ref(line: &str) -> Option<ParsedTerminalEvent> {
    // File "foo.py", line 42, in bar
    // File "/path/to/foo.py", line 42
    let after_quote = line.strip_prefix("File \"")?;
    let end_quote = after_quote.find('"')?;
    let file = &after_quote[..end_quote];

    let after_file = &after_quote[end_quote + 1..];
    let line_num = if let Some(pos) = after_file.find("line ") {
        let after_line = &after_file[pos + 5..];
        let num_str: String = after_line.chars().take_while(char::is_ascii_digit).collect();
        num_str.parse::<usize>().ok()?
    } else {
        return None;
    };

    Some(make_file_link(file, line_num, line))
}

fn parse_pytest_result(line: &str) -> Option<ParsedTerminalEvent> {
    // PASSED tests/test_foo.py::test_bar
    // FAILED tests/test_foo.py::test_baz - AssertionError
    // SKIPPED tests/test_foo.py::test_qux
    let (status, rest) = if let Some(rest) = line.strip_prefix("PASSED ") {
        ("pass", rest)
    } else if let Some(rest) = line.strip_prefix("FAILED ") {
        ("fail", rest)
    } else if let Some(rest) = line.strip_prefix("SKIPPED ") {
        ("skip", rest)
    } else {
        return None;
    };

    let (name, message) = rest.find(" - ").map_or_else(
        || (rest.trim(), None),
        |dash_pos| (&rest[..dash_pos], Some(rest[dash_pos + 3..].to_string())),
    );

    Some(make_test_result(name, status, message))
}

fn parse_pytest_summary(line: &str) -> Option<ParsedTerminalEvent> {
    // === 3 passed, 1 failed in 2.50s ===
    // === 10 passed in 0.52s ===
    if !line.starts_with('=') || !line.ends_with('=') {
        return None;
    }

    let inner = line.trim_matches('=').trim();
    if !inner.contains("passed") && !inner.contains("failed") {
        return None;
    }

    let mut passed = None;
    let mut failed = None;
    let mut skipped = None;

    // Remove the "in X.XXs" part
    let stats_part = inner.split(" in ").next()?;

    for segment in stats_part.split(',') {
        let seg = segment.trim();
        if seg.ends_with("passed") {
            passed = extract_number(seg);
        } else if seg.ends_with("failed") {
            failed = extract_number(seg);
        } else if seg.ends_with("skipped") || seg.ends_with("deselected") {
            skipped = extract_number(seg);
        }
    }

    let total = [passed, failed, skipped]
        .iter()
        .filter_map(|&x| x)
        .sum::<u32>();

    Some(make_summary(
        inner,
        passed,
        failed,
        skipped,
        if total > 0 { Some(total) } else { None },
    ))
}

fn parse_python_error(line: &str) -> Option<ParsedTerminalEvent> {
    // SyntaxError: invalid syntax
    // NameError: name 'foo' is not defined
    // TypeError: unsupported operand type(s)
    let python_errors = [
        "SyntaxError:", "NameError:", "TypeError:", "ValueError:",
        "ImportError:", "ModuleNotFoundError:", "AttributeError:",
        "IndexError:", "KeyError:", "RuntimeError:", "OSError:",
        "FileNotFoundError:", "PermissionError:",
    ];

    for err_type in &python_errors {
        if let Some(rest) = line.strip_prefix(err_type) {
            let message = rest.trim();
            return Some(make_diagnostic(
                "error",
                message,
                err_type.trim_end_matches(':'),
            ));
        }
    }

    None
}

fn extract_number(s: &str) -> Option<u32> {
    s.split_whitespace()
        .find_map(|word| word.parse::<u32>().ok())
}

fn make_file_link(file: &str, line: usize, text: &str) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_py_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::FileLink,
        timestamp: 0,
        data: ParsedEventData::FileLink(FileLinkEvent {
            file: file.to_string(),
            line,
            column: None,
            text: text.to_string(),
        }),
    }
}

fn make_test_result(name: &str, status: &str, message: Option<String>) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_pytest_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::TestResult,
        timestamp: 0,
        data: ParsedEventData::TestResult(TestResultEvent {
            test_name: name.to_string(),
            status: status.into(),
            duration: None,
            message,
        }),
    }
}

fn make_summary(
    text: &str,
    passed: Option<u32>,
    failed: Option<u32>,
    skipped: Option<u32>,
    total: Option<u32>,
) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_pysum_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
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

fn make_diagnostic(severity: &str, message: &str, source: &str) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_pyerr_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::Diagnostic,
        timestamp: 0,
        data: ParsedEventData::Diagnostic(DiagnosticEvent {
            severity: severity.into(),
            file: String::new(),
            line: 0,
            column: None,
            message: message.to_string(),
            source: Some(source.into()),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_python_file_ref() {
        let parser = PythonParser;
        let event = parser
            .try_parse_line("  File \"foo.py\", line 42, in bar")
            .unwrap();
        if let ParsedEventData::FileLink(f) = &event.data {
            assert_eq!(f.file, "foo.py");
            assert_eq!(f.line, 42);
        }
    }

    #[test]
    fn parses_pytest_pass() {
        let parser = PythonParser;
        let event = parser
            .try_parse_line("PASSED tests/test_foo.py::test_bar")
            .unwrap();
        if let ParsedEventData::TestResult(t) = &event.data {
            assert_eq!(t.status, "pass");
        }
    }

    #[test]
    fn parses_pytest_fail_with_message() {
        let parser = PythonParser;
        let event = parser
            .try_parse_line("FAILED tests/test_foo.py::test_baz - AssertionError")
            .unwrap();
        if let ParsedEventData::TestResult(t) = &event.data {
            assert_eq!(t.status, "fail");
            assert!(t.message.as_ref().unwrap().contains("AssertionError"));
        }
    }

    #[test]
    fn parses_pytest_summary() {
        let parser = PythonParser;
        let event = parser
            .try_parse_line("=== 3 passed, 1 failed in 2.50s ===")
            .unwrap();
        if let ParsedEventData::Summary(s) = &event.data {
            assert_eq!(s.counts.as_ref().unwrap().passed, Some(3));
            assert_eq!(s.counts.as_ref().unwrap().failed, Some(1));
        }
    }

    #[test]
    fn parses_python_error() {
        let parser = PythonParser;
        let event = parser
            .try_parse_line("TypeError: unsupported operand type(s)")
            .unwrap();
        if let ParsedEventData::Diagnostic(d) = &event.data {
            assert_eq!(d.severity, "error");
            assert_eq!(d.source, Some("TypeError".into()));
        }
    }
}
