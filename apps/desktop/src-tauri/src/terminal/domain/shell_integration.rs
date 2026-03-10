//! Shell Integration — Marker protocol and hook script generation.
//!
//! Handles:
//! - Generating shell hook scripts for zsh/bash/fish/pwsh
//! - Extracting markers from PTY output
//! - Marker protocol: `__SEM_TERM_CMD_START__`, `__SEM_TERM_CMD_END__`, `__SEM_TERM_CWD__`
//!
//! Pure domain logic — no I/O.

use super::types::{ShellType, ShellMarker, CommandStartMarker, CommandEndMarker};

// ─── Marker Constants ────────────────────────────────────

pub const MARKER_CMD_START: &str = "__SEM_TERM_CMD_START__";
pub const MARKER_CMD_END: &str = "__SEM_TERM_CMD_END__";
pub const MARKER_CWD: &str = "__SEM_TERM_CWD__";

// Markers are wrapped in invisible OSC sequences to hide from display.
// Format: \x1b]633;{MARKER}:{JSON}\x07
pub const OSC_PREFIX: &str = "\x1b]633;";
pub const OSC_SUFFIX: &str = "\x07";

// ─── Shell Hook Scripts ──────────────────────────────────

/// Generates the hook script content for a given shell type.
pub fn generate_hook_script(shell_type: &ShellType) -> String {
    match shell_type {
        ShellType::Zsh => generate_zsh_hooks(),
        ShellType::Bash => generate_bash_hooks(),
        ShellType::Fish => generate_fish_hooks(),
        ShellType::Pwsh => generate_pwsh_hooks(),
        ShellType::Unknown => String::new(),
    }
}

fn generate_zsh_hooks() -> String {
    let start = MARKER_CMD_START;
    let end = MARKER_CMD_END;
    let cwd = MARKER_CWD;
    format!(
        r#"
# Semantica Terminal Integration — DO NOT EDIT
# Injected by Semantica DevOS for command boundary tracking

__semantica_preexec() {{
    local cmd="$1"
    local cwd="$PWD"
    local ts=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))')
    printf '\033]633;{start}:{{"cmd":"%s","cwd":"%s","ts":%s}}\007' \
        "$(echo "$cmd" | sed 's/"/\\"/g')" \
        "$(echo "$cwd" | sed 's/"/\\"/g')" \
        "$ts"
}}

__semantica_precmd() {{
    local exit_code=$?
    local ts=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))')
    printf '\033]633;{end}:{{"exitCode":%d,"ts":%s}}\007' "$exit_code" "$ts"

    # Also emit CWD change
    printf '\033]633;{cwd}:{{"cwd":"%s"}}\007' "$PWD"
}}

# Install hooks only if not already installed
if [[ -z "$__SEMANTICA_HOOKS_INSTALLED" ]]; then
    autoload -Uz add-zsh-hook
    add-zsh-hook preexec __semantica_preexec
    add-zsh-hook precmd __semantica_precmd
    export __SEMANTICA_HOOKS_INSTALLED=1
fi
"#
    )
}

fn generate_bash_hooks() -> String {
    let start = MARKER_CMD_START;
    let end = MARKER_CMD_END;
    let cwd = MARKER_CWD;
    format!(
        r#"
# Semantica Terminal Integration — DO NOT EDIT
# Injected by Semantica DevOS for command boundary tracking

__semantica_debug_trap() {{
    # Only fire for the main command, not subshells
    if [[ "$BASH_COMMAND" == "$PROMPT_COMMAND" ]]; then
        return
    fi
    local cmd="$BASH_COMMAND"
    local cwd="$PWD"
    local ts=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))')
    printf '\033]633;{start}:{{"cmd":"%s","cwd":"%s","ts":%s}}\007' \
        "$(echo "$cmd" | sed 's/"/\\"/g')" \
        "$(echo "$cwd" | sed 's/"/\\"/g')" \
        "$ts"
}}

__semantica_prompt_command() {{
    local exit_code=$?
    local ts=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))')
    printf '\033]633;{end}:{{"exitCode":%d,"ts":%s}}\007' "$exit_code" "$ts"
    printf '\033]633;{cwd}:{{"cwd":"%s"}}\007' "$PWD"
}}

if [[ -z "$__SEMANTICA_HOOKS_INSTALLED" ]]; then
    trap '__semantica_debug_trap' DEBUG
    PROMPT_COMMAND="__semantica_prompt_command;${{PROMPT_COMMAND}}"
    export __SEMANTICA_HOOKS_INSTALLED=1
fi
"#
    )
}

fn generate_fish_hooks() -> String {
    let start = MARKER_CMD_START;
    let end = MARKER_CMD_END;
    let cwd = MARKER_CWD;
    format!(
        r#"
# Semantica Terminal Integration — DO NOT EDIT
# Injected by Semantica DevOS for command boundary tracking

if not set -q __SEMANTICA_HOOKS_INSTALLED
    function __semantica_preexec --on-event fish_preexec
        set -l cmd $argv[1]
        set -l cwd (pwd)
        set -l ts (date +%s%3N 2>/dev/null; or python3 -c 'import time; print(int(time.time()*1000))')
        printf '\033]633;{start}:{{"cmd":"%s","cwd":"%s","ts":%s}}\007' \
            (string replace -a '"' '\\"' -- "$cmd") \
            (string replace -a '"' '\\"' -- "$cwd") \
            "$ts"
    end

    function __semantica_postexec --on-event fish_postexec
        set -l exit_code $status
        set -l ts (date +%s%3N 2>/dev/null; or python3 -c 'import time; print(int(time.time()*1000))')
        printf '\033]633;{end}:{{"exitCode":%d,"ts":%s}}\007' "$exit_code" "$ts"
        printf '\033]633;{cwd}:{{"cwd":"%s"}}\007' (pwd)
    end

    set -g __SEMANTICA_HOOKS_INSTALLED 1
end
"#
    )
}

fn generate_pwsh_hooks() -> String {
    let start = MARKER_CMD_START;
    let end = MARKER_CMD_END;
    let cwd = MARKER_CWD;
    format!(
        r#"
# Semantica Terminal Integration — DO NOT EDIT
# Injected by Semantica DevOS for command boundary tracking

if (-not $env:__SEMANTICA_HOOKS_INSTALLED) {{
    $__SemOriginalPrompt = $function:prompt

    function prompt {{
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) {{ $exitCode = 0 }}
        $ts = [long]([System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
        $cwd = (Get-Location).Path -replace '"', '\"'

        # End marker for previous command
        Write-Host -NoNewline "`e]633;{end}:{{`"exitCode`":$exitCode,`"ts`":$ts}}`a"
        Write-Host -NoNewline "`e]633;{cwd}:{{`"cwd`":`"$cwd`"}}`a"

        # Call original prompt
        & $__SemOriginalPrompt
    }}

    # PreCommandLookupAction for command start
    $ExecutionContext.InvokeCommand.PreCommandLookupAction = {{
        param($CommandName, $CommandLookupEventArgs)
        $ts = [long]([System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
        $cwd = (Get-Location).Path -replace '"', '\"'
        $cmd = $CommandName -replace '"', '\"'
        Write-Host -NoNewline "`e]633;{start}:{{`"cmd`":`"$cmd`",`"cwd`":`"$cwd`",`"ts`":$ts}}`a"
    }}

    $env:__SEMANTICA_HOOKS_INSTALLED = "1"
}}
"#
    )
}

// ─── Marker Extraction ───────────────────────────────────

/// Extract a shell marker from a raw PTY output line.
/// Returns the marker and the remaining line content (with marker stripped).
pub fn extract_marker(line: &str) -> Option<(ShellMarker, String)> {
    // Look for OSC 633 sequence: \x1b]633;MARKER:JSON\x07
    let osc_start = line.find(OSC_PREFIX)?;
    let after_prefix = &line[osc_start + OSC_PREFIX.len()..];
    let osc_end = after_prefix.find(OSC_SUFFIX)?;
    let payload = &after_prefix[..osc_end];

    // Split marker type from JSON
    let colon_pos = payload.find(':')?;
    let marker_type = &payload[..colon_pos];
    let json_str = &payload[colon_pos + 1..];

    let marker = match marker_type {
        s if s == MARKER_CMD_START => {
            let parsed: serde_json::Value = serde_json::from_str(json_str).ok()?;
            ShellMarker::CommandStart(CommandStartMarker {
                command: parsed["cmd"].as_str()?.to_string(),
                cwd: parsed["cwd"].as_str()?.to_string(),
                timestamp: parsed["ts"].as_u64()?,
            })
        }
        s if s == MARKER_CMD_END => {
            let parsed: serde_json::Value = serde_json::from_str(json_str).ok()?;
            ShellMarker::CommandEnd(CommandEndMarker {
                exit_code: i32::try_from(parsed["exitCode"].as_i64()?).ok()?,
                timestamp: parsed["ts"].as_u64()?,
            })
        }
        s if s == MARKER_CWD => {
            let parsed: serde_json::Value = serde_json::from_str(json_str).ok()?;
            ShellMarker::CwdChanged {
                cwd: parsed["cwd"].as_str()?.to_string(),
            }
        }
        _ => return None,
    };

    // Build remaining line with marker stripped
    let before = &line[..osc_start];
    let after = &line[osc_start + OSC_PREFIX.len() + osc_end + OSC_SUFFIX.len()..];
    let remaining = format!("{before}{after}");

    Some((marker, remaining))
}

/// Split raw output into lines, extracting markers from each line.
/// Returns a vec of (optional marker, cleaned line text).
pub fn process_output(data: &str) -> Vec<(Option<ShellMarker>, String)> {
    let mut results = Vec::new();

    for line in data.split('\n') {
        if line.is_empty() {
            continue;
        }

        match extract_marker(line) {
            Some((marker, cleaned)) => {
                results.push((Some(marker), cleaned));
            }
            None => {
                results.push((None, line.to_string()));
            }
        }
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_zsh_hooks() {
        let script = generate_hook_script(&ShellType::Zsh);
        assert!(script.contains("__semantica_preexec"));
        assert!(script.contains("__semantica_precmd"));
        assert!(script.contains(MARKER_CMD_START));
        assert!(script.contains(MARKER_CMD_END));
        assert!(script.contains("__SEMANTICA_HOOKS_INSTALLED"));
    }

    #[test]
    fn generates_bash_hooks() {
        let script = generate_hook_script(&ShellType::Bash);
        assert!(script.contains("__semantica_debug_trap"));
        assert!(script.contains("PROMPT_COMMAND"));
    }

    #[test]
    fn generates_fish_hooks() {
        let script = generate_hook_script(&ShellType::Fish);
        assert!(script.contains("fish_preexec"));
        assert!(script.contains("fish_postexec"));
    }

    #[test]
    fn generates_pwsh_hooks() {
        let script = generate_hook_script(&ShellType::Pwsh);
        assert!(script.contains("PreCommandLookupAction"));
    }

    #[test]
    fn unknown_shell_returns_empty() {
        let script = generate_hook_script(&ShellType::Unknown);
        assert!(script.is_empty());
    }

    #[test]
    fn extracts_cmd_start_marker() {
        let line = format!(
            "{}{}:{{\"cmd\":\"npm test\",\"cwd\":\"/project\",\"ts\":1000}}{}",
            OSC_PREFIX, MARKER_CMD_START, OSC_SUFFIX
        );
        let (marker, remaining) = extract_marker(&line).unwrap();
        assert!(matches!(marker, ShellMarker::CommandStart(ref m) if m.command == "npm test"));
        assert!(remaining.is_empty());
    }

    #[test]
    fn extracts_cmd_end_marker() {
        let line = format!(
            "{}{}:{{\"exitCode\":0,\"ts\":5000}}{}",
            OSC_PREFIX, MARKER_CMD_END, OSC_SUFFIX
        );
        let (marker, _) = extract_marker(&line).unwrap();
        assert!(matches!(marker, ShellMarker::CommandEnd(ref m) if m.exit_code == 0));
    }

    #[test]
    fn extracts_cwd_marker() {
        let line = format!(
            "{}{}:{{\"cwd\":\"/new/path\"}}{}",
            OSC_PREFIX, MARKER_CWD, OSC_SUFFIX
        );
        let (marker, _) = extract_marker(&line).unwrap();
        assert!(matches!(marker, ShellMarker::CwdChanged { ref cwd } if cwd == "/new/path"));
    }

    #[test]
    fn preserves_surrounding_text() {
        let line = format!(
            "before{}{}:{{\"exitCode\":1,\"ts\":2000}}{}after",
            OSC_PREFIX, MARKER_CMD_END, OSC_SUFFIX
        );
        let (_, remaining) = extract_marker(&line).unwrap();
        assert_eq!(remaining, "beforeafter");
    }

    #[test]
    fn returns_none_for_no_marker() {
        assert!(extract_marker("regular output line").is_none());
    }

    #[test]
    fn process_output_handles_mixed() {
        let data = format!(
            "line1\n{}{}:{{\"cmd\":\"ls\",\"cwd\":\"/\",\"ts\":100}}{}\nline3\n",
            OSC_PREFIX, MARKER_CMD_START, OSC_SUFFIX
        );
        let results = process_output(&data);
        assert_eq!(results.len(), 3);
        assert!(results[0].0.is_none());
        assert!(results[1].0.is_some());
        assert!(results[2].0.is_none());
    }
}
