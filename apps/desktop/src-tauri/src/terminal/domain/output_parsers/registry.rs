//! Output Parser Registry — Manages and dispatches to registered parsers.

use crate::terminal::domain::ports::OutputParser;
use crate::terminal::domain::types::ParsedTerminalEvent;

pub struct OutputParserRegistry {
    parsers: Vec<Box<dyn OutputParser>>,
}

impl OutputParserRegistry {
    pub fn new() -> Self {
        Self {
            parsers: Vec::new(),
        }
    }

    pub fn register(&mut self, parser: Box<dyn OutputParser>) {
        self.parsers.push(parser);
    }

    /// Try all parsers on a single line. Returns all matches.
    pub fn parse_line(&self, line: &str) -> Vec<ParsedTerminalEvent> {
        let mut events = Vec::new();
        for parser in &self.parsers {
            if let Some(event) = parser.try_parse_line(line) {
                events.push(event);
            }
        }
        events
    }

    /// Try all parsers on a block of lines. Returns all matches.
    #[allow(dead_code)]
    pub fn parse_block(&self, lines: &[&str]) -> Vec<ParsedTerminalEvent> {
        let mut events = Vec::new();
        for parser in &self.parsers {
            if let Some(event) = parser.try_parse_block(lines) {
                events.push(event);
            }
        }
        events
    }

    /// Create a registry with all built-in parsers.
    pub fn with_defaults() -> Self {
        let mut registry = Self::new();
        registry.register(Box::new(super::typescript::TypeScriptParser));
        registry.register(Box::new(super::jest::JestParser));
        registry.register(Box::new(super::cargo::CargoParser));
        registry.register(Box::new(super::python::PythonParser));
        registry.register(Box::new(super::generic::GenericParser));
        registry
    }
}

impl Default for OutputParserRegistry {
    fn default() -> Self {
        Self::with_defaults()
    }
}
