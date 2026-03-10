//! Policy Guard — Domain logic for command safety rules.
//!
//! Pure rule matching, no I/O.

use super::types::PolicyDecision;

/// A single policy rule that can match against a command string.
#[derive(Debug, Clone)]
pub struct PolicyRule {
    pub pattern: String,
    pub decision: PolicyDecision,
}

/// Evaluates commands against safety/security rules.
pub struct PolicyGuard {
    rules: Vec<PolicyRule>,
}

impl PolicyGuard {
    pub fn new() -> Self {
        Self {
            rules: Self::default_rules(),
        }
    }

    #[allow(dead_code)]
    pub const fn with_rules(rules: Vec<PolicyRule>) -> Self {
        Self { rules }
    }

    /// Check a command against all rules. First match wins.
    /// Returns `Allow` if no rule matches.
    pub fn check(&self, command: &str, source: &str) -> PolicyDecision {
        // User commands are always allowed
        if source == "user" {
            return PolicyDecision::Allow;
        }

        let normalized = command.trim().to_lowercase();

        for rule in &self.rules {
            if normalized.contains(&rule.pattern) {
                return rule.decision.clone();
            }
        }

        PolicyDecision::Allow
    }

    fn default_rules() -> Vec<PolicyRule> {
        vec![
            PolicyRule {
                pattern: "rm -rf /".into(),
                decision: PolicyDecision::Deny {
                    reason: "Destructive: recursive delete of root".into(),
                },
            },
            PolicyRule {
                pattern: "rm -rf ~".into(),
                decision: PolicyDecision::Deny {
                    reason: "Destructive: recursive delete of home".into(),
                },
            },
            PolicyRule {
                pattern: "mkfs".into(),
                decision: PolicyDecision::Deny {
                    reason: "Destructive: filesystem format".into(),
                },
            },
            PolicyRule {
                pattern: "dd if=".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Potentially destructive: raw disk write".into(),
                },
            },
            PolicyRule {
                pattern: "git push --force".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Force push can rewrite remote history".into(),
                },
            },
            PolicyRule {
                pattern: "git reset --hard".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Hard reset discards uncommitted changes".into(),
                },
            },
            PolicyRule {
                pattern: "chmod 777".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Overly permissive file permissions".into(),
                },
            },
            PolicyRule {
                pattern: "curl | sh".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Piping remote script to shell".into(),
                },
            },
            PolicyRule {
                pattern: "curl | bash".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Piping remote script to shell".into(),
                },
            },
            PolicyRule {
                pattern: "wget -o- | sh".into(),
                decision: PolicyDecision::RequireApproval {
                    reason: "Piping remote script to shell".into(),
                },
            },
        ]
    }
}

impl Default for PolicyGuard {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_commands_always_allowed() {
        let guard = PolicyGuard::new();
        assert!(matches!(
            guard.check("rm -rf /", "user"),
            PolicyDecision::Allow
        ));
    }

    #[test]
    fn agent_destructive_denied() {
        let guard = PolicyGuard::new();
        assert!(matches!(
            guard.check("rm -rf /", "agent"),
            PolicyDecision::Deny { .. }
        ));
    }

    #[test]
    fn agent_force_push_requires_approval() {
        let guard = PolicyGuard::new();
        assert!(matches!(
            guard.check("git push --force origin main", "agent"),
            PolicyDecision::RequireApproval { .. }
        ));
    }

    #[test]
    fn safe_commands_allowed() {
        let guard = PolicyGuard::new();
        assert!(matches!(
            guard.check("npm test", "agent"),
            PolicyDecision::Allow
        ));
    }
}
