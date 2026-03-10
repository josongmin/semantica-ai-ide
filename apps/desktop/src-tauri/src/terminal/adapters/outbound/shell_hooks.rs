//! Shell Hook Installer — Filesystem adapter for installing shell integration hooks.
//!
//! Injects marker hook scripts into the user's shell config files
//! (.zshrc, .bashrc, .config/fish/config.fish, `PowerShell` profile).

use std::fs;
use std::path::PathBuf;

use crate::terminal::domain::ports::ShellHookInstaller;
use crate::terminal::domain::shell_integration;
use crate::terminal::domain::types::ShellType;

const HOOK_MARKER_START: &str = "# >>> Semantica Terminal Integration >>>";
const HOOK_MARKER_END: &str = "# <<< Semantica Terminal Integration <<<";

pub struct FsShellHookInstaller;

impl ShellHookInstaller for FsShellHookInstaller {
    fn install_hooks(&self, shell_type: &ShellType, home_dir: &str) -> Result<bool, String> {
        let config_path = shell_config_path(shell_type, home_dir)
            .ok_or_else(|| format!("Unknown shell config path for {shell_type:?}"))?;

        let hook_script = shell_integration::generate_hook_script(shell_type);
        if hook_script.is_empty() {
            return Ok(false);
        }

        // Read existing config
        let existing = fs::read_to_string(&config_path).unwrap_or_default();

        // Check if hooks are already installed
        if existing.contains(HOOK_MARKER_START) {
            // Update existing hooks
            let updated = replace_hook_block(&existing, &hook_script);
            fs::write(&config_path, updated)
                .map_err(|e| format!("Failed to update {}: {e}", config_path.display()))?;
            return Ok(true);
        }

        // Append hooks
        let block = format!(
            "\n{HOOK_MARKER_START}\n{hook_script}\n{HOOK_MARKER_END}\n"
        );

        let new_content = format!("{existing}{block}");
        fs::write(&config_path, new_content)
            .map_err(|e| format!("Failed to write {}: {e}", config_path.display()))?;

        Ok(true)
    }
}

fn shell_config_path(shell_type: &ShellType, home_dir: &str) -> Option<PathBuf> {
    let home = PathBuf::from(home_dir);

    match shell_type {
        ShellType::Zsh => Some(home.join(".zshrc")),
        ShellType::Bash => {
            // Prefer .bashrc, fall back to .bash_profile
            let bashrc = home.join(".bashrc");
            if bashrc.exists() {
                Some(bashrc)
            } else {
                Some(home.join(".bash_profile"))
            }
        }
        ShellType::Fish => Some(home.join(".config/fish/config.fish")),
        ShellType::Pwsh => {
            // PowerShell profile path varies by OS
            if cfg!(target_os = "windows") {
                Some(home.join("Documents/PowerShell/Microsoft.PowerShell_profile.ps1"))
            } else {
                Some(home.join(".config/powershell/Microsoft.PowerShell_profile.ps1"))
            }
        }
        ShellType::Unknown => None,
    }
}

fn replace_hook_block(content: &str, new_script: &str) -> String {
    let mut result = String::new();
    let mut in_block = false;

    for line in content.lines() {
        if line.trim() == HOOK_MARKER_START {
            in_block = true;
            result.push_str(HOOK_MARKER_START);
            result.push('\n');
            result.push_str(new_script);
            result.push('\n');
            continue;
        }
        if line.trim() == HOOK_MARKER_END {
            in_block = false;
            result.push_str(HOOK_MARKER_END);
            result.push('\n');
            continue;
        }
        if !in_block {
            result.push_str(line);
            result.push('\n');
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_path_zsh() {
        let path = shell_config_path(&ShellType::Zsh, "/home/user").unwrap();
        assert_eq!(path, PathBuf::from("/home/user/.zshrc"));
    }

    #[test]
    fn config_path_unknown_is_none() {
        assert!(shell_config_path(&ShellType::Unknown, "/home/user").is_none());
    }

    #[test]
    fn replace_hook_block_works() {
        let content = format!(
            "line1\n{}\nold script\n{}\nline2\n",
            HOOK_MARKER_START, HOOK_MARKER_END
        );
        let result = replace_hook_block(&content, "new script");
        assert!(result.contains("new script"));
        assert!(!result.contains("old script"));
        assert!(result.contains("line1"));
        assert!(result.contains("line2"));
    }

}
