//! TypeScript / `ESLint` output parser.
//!
//! Matches patterns like:
//!   src/foo.ts:42:13 - error TS2322: Type 'string' is not assignable...
//!   src/bar.tsx(10,5): error TS1005: ';' expected.
//!   /path/file.ts:1:1  warning  Missing return type  @typescript-eslint/...

use std::path::Path;

use crate::terminal::domain::ports::OutputParser;
use crate::terminal::domain::types::{
    DiagnosticEvent, ParsedEventData, ParsedEventKind, ParsedTerminalEvent,
};

pub struct TypeScriptParser;

impl OutputParser for TypeScriptParser {
    fn name(&self) -> &'static str {
        "typescript"
    }

    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent> {
        // Pattern 1: file.ts:line:col - error TSxxxx: message
        if let Some(event) = parse_tsc_diagnostic(line) {
            return Some(event);
        }

        // Pattern 2: file.ts(line,col): error TSxxxx: message
        if let Some(event) = parse_tsc_paren_diagnostic(line) {
            return Some(event);
        }

        // Pattern 3: ESLint format — file.ts:line:col  warning/error  message  rule
        if let Some(event) = parse_eslint_diagnostic(line) {
            return Some(event);
        }

        None
    }

    fn try_parse_block(&self, _lines: &[&str]) -> Option<ParsedTerminalEvent> {
        None
    }
}

fn parse_tsc_diagnostic(line: &str) -> Option<ParsedTerminalEvent> {
    // src/foo.ts:42:13 - error TS2322: Type 'string' is not...
    let trimmed = line.trim();

    // Find " - error " or " - warning "
    let (severity_str, split_pos) = if let Some(pos) = trimmed.find(" - error ") {
        ("error", pos)
    } else if let Some(pos) = trimmed.find(" - warning ") {
        ("warning", pos)
    } else {
        return None;
    };

    let file_part = &trimmed[..split_pos];
    let message_part = &trimmed[split_pos + if severity_str == "error" { 9 } else { 11 }..];

    // Parse file:line:col
    let (file, line_num, col) = parse_file_line_col(file_part)?;

    // Extract TS error code if present
    let source = if message_part.starts_with("TS") {
        let code_end = message_part.find(':').unwrap_or(message_part.len());
        Some(format!("tsc({})", &message_part[..code_end]))
    } else {
        Some("tsc".into())
    };

    let message = message_part
        .find(": ")
        .map_or(message_part, |p| &message_part[p + 2..])
        .to_string();

    Some(make_diagnostic_event(
        file,
        line_num,
        col,
        severity_str,
        &message,
        source.as_deref(),
    ))
}

fn parse_tsc_paren_diagnostic(line: &str) -> Option<ParsedTerminalEvent> {
    // file.ts(10,5): error TS1005: ';' expected.
    let trimmed = line.trim();
    let paren_start = trimmed.find('(')?;
    let paren_end = trimmed.find(')')?;

    if paren_end <= paren_start {
        return None;
    }

    let file = trimmed[..paren_start].to_string();
    if !looks_like_ts_file(&file) {
        return None;
    }

    let coords = &trimmed[paren_start + 1..paren_end];
    let parts: Vec<&str> = coords.split(',').collect();
    let line_num = parts.first()?.trim().parse::<usize>().ok()?;
    let col = parts.get(1).and_then(|c| c.trim().parse::<usize>().ok());

    let after_paren = &trimmed[paren_end + 1..].trim_start_matches(": ");

    let severity = if after_paren.starts_with("error") {
        "error"
    } else if after_paren.starts_with("warning") {
        "warning"
    } else {
        return None;
    };

    let message = after_paren.find(": ").map_or_else(
        || (*after_paren).to_string(),
        |p| after_paren[p + 2..].to_string(),
    );

    Some(make_diagnostic_event(
        file, line_num, col, severity, &message, Some("tsc"),
    ))
}

fn parse_eslint_diagnostic(line: &str) -> Option<ParsedTerminalEvent> {
    // /path/file.ts:1:1  warning  Missing return type  @typescript-eslint/rule
    let trimmed = line.trim();

    // Must have file:line:col pattern followed by double-space
    let first_double_space = trimmed.find("  ")?;
    let file_part = &trimmed[..first_double_space];
    let (file, line_num, col) = parse_file_line_col(file_part)?;

    let rest = trimmed[first_double_space..].trim();
    let severity = if rest.starts_with("error") {
        "error"
    } else if rest.starts_with("warning") {
        "warning"
    } else {
        return None;
    };

    let after_severity = rest[severity.len()..].trim();
    let message = after_severity.to_string();

    Some(make_diagnostic_event(
        file, line_num, col, severity, &message, Some("eslint"),
    ))
}

fn parse_file_line_col(s: &str) -> Option<(String, usize, Option<usize>)> {
    let parts: Vec<&str> = s.rsplitn(3, ':').collect();
    match parts.len() {
        3 => {
            let col = parts[0].parse::<usize>().ok();
            let line = parts[1].parse::<usize>().ok()?;
            let file = parts[2].to_string();
            Some((file, line, col))
        }
        2 => {
            let line = parts[0].parse::<usize>().ok()?;
            let file = parts[1].to_string();
            Some((file, line, None))
        }
        _ => None,
    }
}

fn looks_like_ts_file(file: &str) -> bool {
    let path = Path::new(file);
    path.extension()
        .is_some_and(|ext| {
            ext.eq_ignore_ascii_case("ts")
                || ext.eq_ignore_ascii_case("tsx")
                || ext.eq_ignore_ascii_case("js")
                || ext.eq_ignore_ascii_case("jsx")
                || ext.eq_ignore_ascii_case("mts")
                || ext.eq_ignore_ascii_case("cts")
        })
}

fn make_diagnostic_event(
    file: String,
    line: usize,
    column: Option<usize>,
    severity: &str,
    message: &str,
    source: Option<&str>,
) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static EVENT_COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_{}", EVENT_COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(), // set by caller
        session_id: String::new(), // set by caller
        kind: ParsedEventKind::Diagnostic,
        timestamp: 0, // set by caller
        data: ParsedEventData::Diagnostic(DiagnosticEvent {
            severity: severity.into(),
            file,
            line,
            column,
            message: message.to_string(),
            source: source.map(std::string::ToString::to_string),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_tsc_error() {
        let parser = TypeScriptParser;
        let event = parser
            .try_parse_line("src/foo.ts:42:13 - error TS2322: Type 'string' is not assignable")
            .unwrap();
        assert!(matches!(event.kind, ParsedEventKind::Diagnostic));
        if let ParsedEventData::Diagnostic(d) = &event.data {
            assert_eq!(d.severity, "error");
            assert_eq!(d.file, "src/foo.ts");
            assert_eq!(d.line, 42);
            assert_eq!(d.column, Some(13));
            assert!(d.message.contains("Type 'string'"));
        }
    }

    #[test]
    fn parses_tsc_paren_format() {
        let parser = TypeScriptParser;
        let event = parser
            .try_parse_line("src/bar.tsx(10,5): error TS1005: ';' expected.")
            .unwrap();
        if let ParsedEventData::Diagnostic(d) = &event.data {
            assert_eq!(d.file, "src/bar.tsx");
            assert_eq!(d.line, 10);
            assert_eq!(d.column, Some(5));
        }
    }

    #[test]
    fn parses_eslint_warning() {
        let parser = TypeScriptParser;
        let event = parser
            .try_parse_line("src/index.ts:1:1  warning  Missing return type  @typescript-eslint/explicit-function-return-type")
            .unwrap();
        if let ParsedEventData::Diagnostic(d) = &event.data {
            assert_eq!(d.severity, "warning");
            assert_eq!(d.source, Some("eslint".into()));
        }
    }

    #[test]
    fn ignores_non_ts_output() {
        let parser = TypeScriptParser;
        assert!(parser.try_parse_line("normal output").is_none());
    }
}
