//! Shell Detector — detects the user's default shell from $SHELL env var.

use crate::terminal::domain::ports::ShellDetector;
use crate::terminal::domain::types::ShellType;

pub struct DefaultShellDetector;

impl ShellDetector for DefaultShellDetector {
    fn detect(&self) -> (ShellType, String) {
        if cfg!(target_os = "windows") {
            (ShellType::Pwsh, "pwsh.exe".into())
        } else {
            let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
            let shell_type = if shell.contains("zsh") {
                ShellType::Zsh
            } else if shell.contains("bash") {
                ShellType::Bash
            } else if shell.contains("fish") {
                ShellType::Fish
            } else {
                ShellType::Unknown
            };
            (shell_type, shell)
        }
    }
}
