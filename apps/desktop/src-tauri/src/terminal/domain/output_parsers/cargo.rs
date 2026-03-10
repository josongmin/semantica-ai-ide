//! Cargo / Rust compiler output parser.
//!
//! Matches patterns like:
//!   error[E0308]: mismatched types
//!    --> src/main.rs:42:5
//!   warning: unused variable: `x`
//!    --> src/lib.rs:10:9
//!   test result: ok. 5 passed; 0 failed; 0 ignored
//!   Compiling foo v0.1.0

use crate::terminal::domain::ports::OutputParser;
use crate::terminal::domain::types::{
    DiagnosticEvent, FileLinkEvent, ParsedEventData, ParsedEventKind, ParsedTerminalEvent,
    SummaryCounts, SummaryEvent,
};

pub struct CargoParser;

impl OutputParser for CargoParser {
    fn name(&self) -> &'static str {
        "cargo"
    }

    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent> {
        let trimmed = line.trim();

        // Cargo diagnostic: error[Exxxx] or warning: or note:
        if let Some(event) = parse_cargo_header(trimmed) {
            return Some(event);
        }

        // Location line: --> file:line:col
        if let Some(event) = parse_cargo_location(trimmed) {
            return Some(event);
        }

        // Test result summary
        if let Some(event) = parse_cargo_test_result(trimmed) {
            return Some(event);
        }

        // Compiling progress
        if let Some(event) = parse_cargo_compiling(trimmed) {
            return Some(event);
        }

        None
    }

    fn try_parse_block(&self, lines: &[&str]) -> Option<ParsedTerminalEvent> {
        // Look for error block: error[E...] message \n --> file:line:col
        for window in lines.windows(3) {
            let header = window[0].trim();
            let location = window[1].trim();

            let severity = if header.starts_with("error") {
                "error"
            } else if header.starts_with("warning") {
                "warning"
            } else {
                continue;
            };

            if !location.starts_with("-->") {
                continue;
            }

            let message = header
                .find(": ")
                .map_or(header, |p| &header[p + 2..])
                .to_string();

            let loc_part = location.trim_start_matches("-->").trim();
            if let Some((file, line_num, col)) = parse_rust_location(loc_part) {
                return Some(make_diagnostic(
                    file, line_num, col, severity, &message, "rustc",
                ));
            }
        }
        None
    }
}

fn parse_cargo_header(line: &str) -> Option<ParsedTerminalEvent> {
    // error[E0308]: mismatched types
    // warning: unused variable: `x`
    let (severity, message) = if line.starts_with("error[") {
        let msg_start = line.find("]: ").map_or(0, |p| p + 3);
        ("error", &line[msg_start..])
    } else if line.starts_with("error:") || line.starts_with("error: ") {
        ("error", line.trim_start_matches("error:").trim())
    } else if line.starts_with("warning:") || line.starts_with("warning: ") {
        ("warning", line.trim_start_matches("warning:").trim())
    } else {
        return None;
    };

    // This is just the header — no file/line info yet
    // Return a diagnostic with empty file (will be enriched by block parser)
    Some(make_diagnostic(
        String::new(),
        0,
        None,
        severity,
        message,
        "rustc",
    ))
}

fn parse_cargo_location(line: &str) -> Option<ParsedTerminalEvent> {
    // --> src/main.rs:42:5
    if !line.starts_with("-->") {
        return None;
    }

    let loc = line.trim_start_matches("-->").trim();
    let (file, line_num, col) = parse_rust_location(loc)?;

    Some(make_file_link(file, line_num, col, line))
}

fn parse_cargo_test_result(line: &str) -> Option<ParsedTerminalEvent> {
    // test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
    if !line.starts_with("test result:") {
        return None;
    }

    let mut passed = None;
    let mut failed = None;
    let mut skipped = None;

    for part in line.split(';') {
        let part = part.trim();
        if part.ends_with("passed") {
            passed = extract_number(part);
        } else if part.ends_with("failed") {
            failed = extract_number(part);
        } else if part.ends_with("ignored") {
            skipped = extract_number(part);
        }
    }

    let total = passed
        .unwrap_or(0)
        .checked_add(failed.unwrap_or(0))
        .and_then(|n| n.checked_add(skipped.unwrap_or(0)));

    Some(make_summary(line, passed, failed, skipped, total))
}

fn parse_cargo_compiling(line: &str) -> Option<ParsedTerminalEvent> {
    // Compiling foo v0.1.0 (/path/to/foo)
    if !line.starts_with("Compiling ") && !line.starts_with("   Compiling ") {
        return None;
    }

    // Extract progress if it looks like "Compiling [N/M]"
    // Cargo doesn't show N/M natively, but cargo-nextest and some wrappers do
    None
}

fn parse_rust_location(loc: &str) -> Option<(String, usize, Option<usize>)> {
    let parts: Vec<&str> = loc.rsplitn(3, ':').collect();
    match parts.len() {
        3 => {
            let col = parts[0].parse::<usize>().ok();
            let line = parts[1].parse::<usize>().ok()?;
            Some((parts[2].to_string(), line, col))
        }
        2 => {
            let line = parts[0].parse::<usize>().ok()?;
            Some((parts[1].to_string(), line, None))
        }
        _ => None,
    }
}

fn extract_number(s: &str) -> Option<u32> {
    s.split_whitespace()
        .find_map(|word| word.parse::<u32>().ok())
}

fn make_diagnostic(
    file: String,
    line: usize,
    column: Option<usize>,
    severity: &str,
    message: &str,
    source: &str,
) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_cargo_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::Diagnostic,
        timestamp: 0,
        data: ParsedEventData::Diagnostic(DiagnosticEvent {
            severity: severity.into(),
            file,
            line,
            column,
            message: message.to_string(),
            source: Some(source.into()),
        }),
    }
}

fn make_file_link(
    file: String,
    line: usize,
    column: Option<usize>,
    text: &str,
) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_link_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::FileLink,
        timestamp: 0,
        data: ParsedEventData::FileLink(FileLinkEvent {
            file,
            line,
            column,
            text: text.to_string(),
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
        event_id: format!("evt_csum_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
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
    fn parses_cargo_error_header() {
        let parser = CargoParser;
        let event = parser
            .try_parse_line("error[E0308]: mismatched types")
            .unwrap();
        if let ParsedEventData::Diagnostic(d) = &event.data {
            assert_eq!(d.severity, "error");
            assert!(d.message.contains("mismatched types"));
        }
    }

    #[test]
    fn parses_cargo_location() {
        let parser = CargoParser;
        let event = parser.try_parse_line(" --> src/main.rs:42:5").unwrap();
        if let ParsedEventData::FileLink(f) = &event.data {
            assert_eq!(f.file, "src/main.rs");
            assert_eq!(f.line, 42);
            assert_eq!(f.column, Some(5));
        }
    }

    #[test]
    fn parses_cargo_test_summary() {
        let parser = CargoParser;
        let event = parser
            .try_parse_line("test result: ok. 5 passed; 1 failed; 2 ignored; 0 measured; 0 filtered out")
            .unwrap();
        if let ParsedEventData::Summary(s) = &event.data {
            assert_eq!(s.counts.as_ref().unwrap().passed, Some(5));
            assert_eq!(s.counts.as_ref().unwrap().failed, Some(1));
            assert_eq!(s.counts.as_ref().unwrap().skipped, Some(2));
        }
    }

    #[test]
    fn parses_block_diagnostic() {
        let parser = CargoParser;
        let lines = &[
            "error[E0308]: mismatched types",
            " --> src/main.rs:42:5",
            " |",
        ];
        let event = parser.try_parse_block(lines).unwrap();
        if let ParsedEventData::Diagnostic(d) = &event.data {
            assert_eq!(d.file, "src/main.rs");
            assert_eq!(d.line, 42);
        }
    }
}
