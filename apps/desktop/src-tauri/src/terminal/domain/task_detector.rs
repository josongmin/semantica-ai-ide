//! Task Detector — Detects long-running dev tasks from command + output patterns.
//!
//! Identifies: dev servers, watch mode, build processes, test runners,
//! port bindings, and progress indicators.
//!
//! Pure domain logic — no I/O.

use super::types::{TerminalTaskState, PortBindingEvent, TaskProgress};

// ─── Command Pattern Matching ────────────────────────────

/// Detect task type from the command string itself.
pub fn detect_task_type_from_command(command: &str) -> Option<String> {
    let cmd = command.trim().to_lowercase();

    // Dev servers
    if matches_any(&cmd, &[
        "npm run dev", "npm start", "yarn dev", "yarn start",
        "pnpm dev", "pnpm start", "bun dev", "bun run dev",
        "next dev", "vite", "vite dev", "vite serve",
        "webpack serve", "webpack-dev-server",
        "ng serve", "angular serve",
        "cargo run", "go run",
        "python manage.py runserver", "flask run",
        "uvicorn", "gunicorn",
        "rails server", "rails s",
        "php artisan serve",
    ]) {
        return Some("dev-server".into());
    }

    // Watch mode
    if matches_any(&cmd, &[
        "npm run watch", "yarn watch", "tsc --watch", "tsc -w",
        "nodemon", "cargo watch", "jest --watch",
        "vitest --watch", "chokidar",
        "fswatch", "inotifywait",
    ]) || cmd.contains("--watch") || cmd.contains("-w ")
    {
        return Some("watch".into());
    }

    // Build
    if matches_any(&cmd, &[
        "npm run build", "yarn build", "pnpm build", "bun run build",
        "next build", "vite build",
        "tsc", "tsc --build",
        "cargo build", "go build",
        "make", "cmake", "ninja",
        "gradle build", "mvn compile", "mvn package",
        "docker build",
    ]) {
        return Some("build".into());
    }

    // Test
    if matches_any(&cmd, &[
        "npm test", "npm run test", "yarn test", "pnpm test",
        "jest", "vitest", "mocha", "ava",
        "cargo test", "go test",
        "pytest", "python -m pytest", "python -m unittest",
        "rspec", "bundle exec rspec",
        "phpunit",
        "dotnet test",
    ]) {
        return Some("test".into());
    }

    // Install
    if matches_any(&cmd, &[
        "npm install", "npm i", "npm ci",
        "yarn install", "yarn", "pnpm install", "pnpm i",
        "bun install", "bun i",
        "pip install", "pip3 install",
        "cargo install",
        "go install", "go get",
        "brew install", "apt install", "apt-get install",
        "bundle install",
        "composer install",
    ]) {
        return Some("install".into());
    }

    None
}

// ─── Output Pattern Detection ────────────────────────────

/// Detect task lifecycle events from output lines.
pub fn detect_from_output(
    session_id: &str,
    command_id: &str,
    task_type: &str,
    line: &str,
) -> Option<TerminalTaskState> {
    let lower = line.to_lowercase();

    // Dev server ready signals
    if (task_type == "dev-server" || task_type == "watch")
        && matches_any(&lower, &[
            "ready in", "started on", "listening on",
            "server running", "compiled successfully",
            "compiled in", "watching for file changes",
            "ready on", "local:",
            "network:", "server started",
            "application is running",
        ])
    {
        return Some(TerminalTaskState {
            session_id: session_id.into(),
            command_id: command_id.into(),
            task_type: task_type.into(),
            phase: "ready".into(),
            progress: None,
            label: extract_label(line),
        });
    }

    // Build/compile progress
    if let Some(progress) = detect_progress(line) {
        return Some(TerminalTaskState {
            session_id: session_id.into(),
            command_id: command_id.into(),
            task_type: task_type.into(),
            phase: "running".into(),
            progress: Some(progress),
            label: extract_label(line),
        });
    }

    // Crash/error signals
    if matches_any(&lower, &[
        "error:", "fatal error", "panic:", "segmentation fault",
        "killed", "oom", "out of memory",
        "eaddrinuse", "address already in use",
        "unhandled rejection", "uncaught exception",
    ]) {
        return Some(TerminalTaskState {
            session_id: session_id.into(),
            command_id: command_id.into(),
            task_type: task_type.into(),
            phase: "crashed".into(),
            progress: None,
            label: extract_label(line),
        });
    }

    None
}

// ─── Port Binding Detection ──────────────────────────────

/// Detect port binding from output text.
pub fn detect_port_binding(line: &str) -> Option<PortBindingEvent> {
    // Pattern: localhost:PORT or 0.0.0.0:PORT or 127.0.0.1:PORT
    let patterns = [
        ("localhost:", "localhost"),
        ("127.0.0.1:", "127.0.0.1"),
        ("0.0.0.0:", "0.0.0.0"),
        ("http://localhost:", "localhost"),
        ("https://localhost:", "localhost"),
        ("http://127.0.0.1:", "127.0.0.1"),
        ("http://0.0.0.0:", "0.0.0.0"),
    ];

    let lower = line.to_lowercase();

    for (pattern, host) in &patterns {
        if let Some(pos) = lower.find(pattern) {
            let after_colon = &line[pos + pattern.len()..];
            let port_str: String = after_colon.chars().take_while(char::is_ascii_digit).collect();
            if let Ok(port) = port_str.parse::<u16>() {
                if port > 0 {
                    let protocol = if lower.contains("https") {
                        Some("https".into())
                    } else if lower.contains("http") {
                        Some("http".into())
                    } else {
                        None
                    };

                    return Some(PortBindingEvent {
                        port,
                        host: (*host).to_string(),
                        protocol,
                    });
                }
            }
        }
    }

    None
}

// ─── Progress Detection ──────────────────────────────────

/// Detect progress indicators from output lines.
fn detect_progress(line: &str) -> Option<TaskProgress> {
    // Pattern 1: "N/M" (e.g., "3/10", "Compiling 5/20")
    if let Some(progress) = detect_fraction_progress(line) {
        return Some(progress);
    }

    // Pattern 2: "N%" (e.g., "45%", "Progress: 78%")
    if let Some(progress) = detect_percentage_progress(line) {
        return Some(progress);
    }

    None
}

fn detect_fraction_progress(line: &str) -> Option<TaskProgress> {
    // Match patterns like "5/20", "[3/10]", "(7/15)"
    let chars: Vec<char> = line.chars().collect();
    let len = chars.len();

    for i in 0..len {
        if chars[i] == '/' {
            // Look backward for current number
            let mut start = i;
            while start > 0 && chars[start - 1].is_ascii_digit() {
                start -= 1;
            }

            // Look forward for total number
            let mut end = i + 1;
            while end < len && chars[end].is_ascii_digit() {
                end += 1;
            }

            if start < i && end > i + 1 {
                let current_str: String = chars[start..i].iter().collect();
                let total_str: String = chars[i + 1..end].iter().collect();

                if let (Ok(current), Ok(total)) = (
                    current_str.parse::<u32>(),
                    total_str.parse::<u32>(),
                ) {
                    if total > 0 && current <= total && total < 100_000 {
                        return Some(TaskProgress {
                            current: u64::from(current),
                            total: Some(u64::from(total)),
                            percentage: Some(f64::from(current) / f64::from(total) * 100.0),
                        });
                    }
                }
            }
        }
    }

    None
}

fn detect_percentage_progress(line: &str) -> Option<TaskProgress> {
    let chars: Vec<char> = line.chars().collect();
    let len = chars.len();

    for i in 0..len {
        if chars[i] == '%' {
            let mut start = i;
            while start > 0 && (chars[start - 1].is_ascii_digit() || chars[start - 1] == '.') {
                start -= 1;
            }

            if start < i {
                let num_str: String = chars[start..i].iter().collect();
                if let Ok(pct) = num_str.parse::<f64>() {
                    if (0.0..=100.0).contains(&pct) {
                        // pct is in 0..=100; parse integer part separately for lossless conversion
                        let whole = num_str.split('.').next().and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
                        return Some(TaskProgress {
                            current: whole,
                            total: Some(100),
                            percentage: Some(pct),
                        });
                    }
                }
            }
        }
    }

    None
}

// ─── Helpers ─────────────────────────────────────────────

fn matches_any(input: &str, patterns: &[&str]) -> bool {
    patterns.iter().any(|p| input.contains(p))
}

fn extract_label(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if trimmed.len() > 120 {
        Some(format!("{}...", &trimmed[..117]))
    } else if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_dev_server_commands() {
        assert_eq!(detect_task_type_from_command("npm run dev"), Some("dev-server".into()));
        assert_eq!(detect_task_type_from_command("vite"), Some("dev-server".into()));
        assert_eq!(detect_task_type_from_command("next dev"), Some("dev-server".into()));
        assert_eq!(detect_task_type_from_command("cargo run"), Some("dev-server".into()));
    }

    #[test]
    fn detects_watch_commands() {
        assert_eq!(detect_task_type_from_command("tsc --watch"), Some("watch".into()));
        assert_eq!(detect_task_type_from_command("nodemon"), Some("watch".into()));
    }

    #[test]
    fn detects_build_commands() {
        assert_eq!(detect_task_type_from_command("npm run build"), Some("build".into()));
        assert_eq!(detect_task_type_from_command("cargo build"), Some("build".into()));
    }

    #[test]
    fn detects_test_commands() {
        assert_eq!(detect_task_type_from_command("npm test"), Some("test".into()));
        assert_eq!(detect_task_type_from_command("jest"), Some("test".into()));
        assert_eq!(detect_task_type_from_command("cargo test"), Some("test".into()));
        assert_eq!(detect_task_type_from_command("pytest"), Some("test".into()));
    }

    #[test]
    fn detects_install_commands() {
        assert_eq!(detect_task_type_from_command("npm install"), Some("install".into()));
        assert_eq!(detect_task_type_from_command("pip install requests"), Some("install".into()));
    }

    #[test]
    fn returns_none_for_unknown() {
        assert_eq!(detect_task_type_from_command("ls -la"), None);
        assert_eq!(detect_task_type_from_command("echo hello"), None);
    }

    #[test]
    fn detects_dev_server_ready() {
        let state = detect_from_output("s1", "c1", "dev-server", "  Ready in 350ms").unwrap();
        assert_eq!(state.phase, "ready");
    }

    #[test]
    fn detects_crash_signal() {
        let state = detect_from_output("s1", "c1", "dev-server", "Error: EADDRINUSE").unwrap();
        assert_eq!(state.phase, "crashed");
    }

    #[test]
    fn detects_port_binding() {
        let event = detect_port_binding("  Local: http://localhost:3000/").unwrap();
        assert_eq!(event.port, 3000);
        assert_eq!(event.host, "localhost");
        assert_eq!(event.protocol, Some("http".into()));
    }

    #[test]
    fn detects_port_without_protocol() {
        let event = detect_port_binding("listening on localhost:8080").unwrap();
        assert_eq!(event.port, 8080);
    }

    #[test]
    fn detects_fraction_progress() {
        let progress = detect_progress("Compiling [5/20]").unwrap();
        assert_eq!(progress.current, 5);
        assert_eq!(progress.total, Some(20));
        assert!((progress.percentage.unwrap() - 25.0).abs() < 0.1);
    }

    #[test]
    fn detects_percentage_progress() {
        let progress = detect_progress("Progress: 45%").unwrap();
        assert_eq!(progress.current, 45);
        assert_eq!(progress.percentage, Some(45.0));
    }

    #[test]
    fn ignores_invalid_progress() {
        assert!(detect_progress("no progress here").is_none());
    }
}
