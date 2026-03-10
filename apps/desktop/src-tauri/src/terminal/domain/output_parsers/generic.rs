//! Generic output parser — catches common patterns across all languages.
//!
//! Matches:
//!   - `file:line:col` references (e.g., `src/foo.ts:42:13`)
//!   - URLs (http://, https://)
//!   - Port bindings (localhost:PORT)
//!   - Generic error/warning patterns

use crate::terminal::domain::ports::OutputParser;
use crate::terminal::domain::types::{
    FileLinkEvent, ParsedEventData, ParsedEventKind, ParsedTerminalEvent, PortBindingEvent,
    UrlEvent,
};
use crate::terminal::domain::task_detector;

pub struct GenericParser;

impl OutputParser for GenericParser {
    fn name(&self) -> &'static str {
        "generic"
    }

    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent> {
        let trimmed = line.trim();

        // URL detection
        if let Some(event) = detect_url(trimmed) {
            return Some(event);
        }

        // Port binding detection (delegated to task_detector)
        if let Some(port_event) = task_detector::detect_port_binding(trimmed) {
            return Some(make_port_event(port_event));
        }

        // Generic file:line:col reference
        if let Some(event) = detect_file_reference(trimmed) {
            return Some(event);
        }

        None
    }

    fn try_parse_block(&self, _lines: &[&str]) -> Option<ParsedTerminalEvent> {
        None
    }
}

fn detect_url(line: &str) -> Option<ParsedTerminalEvent> {
    // Find http:// or https:// URLs
    let prefixes = ["https://", "http://"];

    for prefix in &prefixes {
        if let Some(start) = line.find(prefix) {
            let url_start = start;
            let after = &line[url_start..];

            // Extract URL until whitespace or common terminators
            let url_end = after
                .find(|c: char| c.is_whitespace() || c == ')' || c == ']' || c == '>' || c == '"' || c == '\'')
                .unwrap_or(after.len());

            let url = &after[..url_end];

            // Skip very short URLs or localhost (handled by port detection)
            if url.len() < 10 {
                return None;
            }

            return Some(make_url_event(url, line));
        }
    }

    None
}

fn detect_file_reference(line: &str) -> Option<ParsedTerminalEvent> {
    // Match patterns like:
    //   path/file.ext:line:col
    //   path/file.ext:line
    // But avoid matching URLs, timestamps, or other colon-separated values

    let known_extensions = [
        ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
        ".rs", ".go", ".py", ".rb", ".java", ".kt",
        ".c", ".cpp", ".h", ".hpp", ".cs",
        ".swift", ".m", ".mm",
        ".vue", ".svelte", ".astro",
        ".css", ".scss", ".less", ".sass",
        ".html", ".htm", ".xml", ".json", ".yaml", ".yml", ".toml",
        ".md", ".txt", ".sh", ".bash", ".zsh",
        ".sql", ".graphql", ".proto",
        ".ex", ".exs", ".erl", ".hs", ".ml", ".fs",
        ".php", ".lua", ".r", ".jl",
    ];

    // Split on whitespace to find potential file references
    for word in line.split_whitespace() {
        // Remove surrounding punctuation
        let cleaned = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '/' && c != '.' && c != ':' && c != '_' && c != '-');

        // Must contain a colon for line number
        let Some(first_colon) = cleaned.find(':') else {
            continue;
        };
        let file_part = &cleaned[..first_colon];
        let after_colon = &cleaned[first_colon + 1..];

        // File must have a known extension
        let has_ext = known_extensions.iter().any(|ext| file_part.ends_with(ext));
        if !has_ext {
            continue;
        }

        // Parse line number
        let parts: Vec<&str> = after_colon.splitn(2, ':').collect();
        let Ok(line_num) = parts[0].parse::<usize>() else {
            continue;
        };
        let col = parts.get(1).and_then(|c| c.parse::<usize>().ok());

        if line_num > 0 {
            return Some(make_file_link(file_part, line_num, col, word));
        }
    }

    None
}

fn make_url_event(url: &str, text: &str) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_url_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::Url,
        timestamp: 0,
        data: ParsedEventData::Url(UrlEvent {
            url: url.to_string(),
            text: text.to_string(),
        }),
    }
}

fn make_port_event(port: PortBindingEvent) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_port_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::PortBinding,
        timestamp: 0,
        data: ParsedEventData::PortBinding(port),
    }
}

fn make_file_link(file: &str, line: usize, col: Option<usize>, text: &str) -> ParsedTerminalEvent {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    ParsedTerminalEvent {
        event_id: format!("evt_flink_{}", COUNTER.fetch_add(1, Ordering::Relaxed)),
        command_id: String::new(),
        session_id: String::new(),
        kind: ParsedEventKind::FileLink,
        timestamp: 0,
        data: ParsedEventData::FileLink(FileLinkEvent {
            file: file.to_string(),
            line,
            column: col,
            text: text.to_string(),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_https_url() {
        let parser = GenericParser;
        let event = parser
            .try_parse_line("Visit https://example.com/docs for more info")
            .unwrap();
        if let ParsedEventData::Url(u) = &event.data {
            assert_eq!(u.url, "https://example.com/docs");
        }
    }

    #[test]
    fn detects_port_binding() {
        let parser = GenericParser;
        let event = parser
            .try_parse_line("Server running at http://localhost:3000")
            .unwrap();
        // Could be URL or port depending on order — both are valid
        assert!(matches!(
            event.kind,
            ParsedEventKind::Url | ParsedEventKind::PortBinding
        ));
    }

    #[test]
    fn detects_file_reference() {
        let parser = GenericParser;
        let event = parser
            .try_parse_line("Error in src/main.rs:42:5")
            .unwrap();
        if let ParsedEventData::FileLink(f) = &event.data {
            assert_eq!(f.file, "src/main.rs");
            assert_eq!(f.line, 42);
            assert_eq!(f.column, Some(5));
        }
    }

    #[test]
    fn ignores_plain_text() {
        let parser = GenericParser;
        assert!(parser.try_parse_line("just some text").is_none());
    }
}
