//! Tool-call permission policy: deny list > session allowlist > ask.
//!
//! Ask modes:
//! - `Stdin` — blocking prompt (line-based REPL)
//! - `Channel` — forwards the request to a UI (TUI) and awaits reply
//! - `AutoDeny` — non-interactive; asks are denied (headless/serve safe)

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::io::Write;
use tokio::sync::{mpsc, oneshot};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Decision {
    Allow,
    Deny,
}

/// Reply sent by a channel-mode UI. `always` mirrors the "a" answer.
#[derive(Debug)]
pub struct AskReply {
    pub decision: Decision,
    pub always: bool,
}

#[derive(Debug)]
pub struct AskRequest {
    pub tool: String,
    pub args_preview: String,
    pub reply: oneshot::Sender<AskReply>,
}

#[derive(Clone)]
pub enum AskMode {
    Stdin,
    /// Receives AskRequests; the UI must answer via `reply`.
    Channel(mpsc::UnboundedSender<AskRequest>),
    AutoDeny,
}

#[derive(Clone)]
pub struct Permissions {
    /// Glob-ish patterns: exact name or trailing `*` prefix match.
    allow: Vec<String>,
    deny: Vec<String>,
    /// Tools approved with "always" this session.
    always: HashSet<String>,
    mode: AskMode,
}

enum AskOutcome {
    Once(Decision),
    Always(Decision),
}

impl Permissions {
    pub fn new(allow: Vec<String>, deny: Vec<String>, mode: AskMode) -> Self {
        Self {
            allow,
            deny,
            always: HashSet::new(),
            mode,
        }
    }

    /// Check without prompting. Returns None when the user must be asked.
    pub fn check(&self, tool: &str) -> Option<Decision> {
        if matches_any(&self.deny, tool) {
            return Some(Decision::Deny);
        }
        if self.always.contains(tool) || matches_any(&self.allow, tool) {
            return Some(Decision::Allow);
        }
        None
    }

    pub fn grant_always(&mut self, tool: &str) {
        self.always.insert(tool.to_string());
    }

    /// Resolve a permission, prompting if needed. "always" answers are
    /// persisted for the rest of the session.
    pub async fn resolve(&mut self, tool: &str, args_preview: &str) -> Decision {
        if let Some(d) = self.check(tool) {
            return d;
        }
        match self.ask(tool, args_preview).await {
            Some(AskOutcome::Always(Decision::Allow)) => {
                self.grant_always(tool);
                persist_grant(tool);
                Decision::Allow
            }
            Some(AskOutcome::Once(d)) | Some(AskOutcome::Always(d)) => d,
            None => Decision::Deny,
        }
    }

    async fn ask(&self, tool: &str, args_preview: &str) -> Option<AskOutcome> {
        match &self.mode {
            AskMode::AutoDeny => None,
            AskMode::Stdin => stdin_ask(tool, args_preview).await,
            AskMode::Channel(tx) => {
                let (rtx, rrx) = oneshot::channel();
                let req = AskRequest {
                    tool: tool.to_string(),
                    args_preview: args_preview.to_string(),
                    reply: rtx,
                };
                if tx.send(req).is_err() {
                    return None;
                }
                rrx.await.ok().map(|r| {
                    if r.always {
                        AskOutcome::Always(r.decision)
                    } else {
                        AskOutcome::Once(r.decision)
                    }
                })
            }
        }
    }
}

async fn stdin_ask(tool: &str, args_preview: &str) -> Option<AskOutcome> {
    let (tx, rx) = oneshot::channel();
    let tool = tool.to_string();
    let preview = args_preview.to_string();
    tokio::task::spawn_blocking(move || {
        eprint!("[hieudoanm] allow {tool}({preview})? [y/n/a] ");
        let _ = std::io::stderr().flush();
        let mut line = String::new();
        let answer = if std::io::stdin().read_line(&mut line).is_ok() {
            match line.trim() {
                "y" | "Y" | "yes" => Some(AskOutcome::Once(Decision::Allow)),
                "a" | "A" | "always" => Some(AskOutcome::Always(Decision::Allow)),
                _ => Some(AskOutcome::Once(Decision::Deny)),
            }
        } else {
            None
        };
        let _ = tx.send(answer);
    });
    rx.await.ok().flatten()
}

/// Append a tool grant to ~/.config/harness/permissions.json so `a`
/// answers survive across sessions. Best-effort; never fails the call.
fn persist_grant(tool: &str) {
    let path = std::env::var_os("HOME")
        .map(|h| std::path::PathBuf::from(h).join(".config/harness/permissions.json"))
        .unwrap_or_else(|| std::path::PathBuf::from("permissions.json"));
    let mut allow: Vec<String> = std::fs::read_to_string(&path)
        .ok()
        .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok())
        .and_then(|v| {
            v.get("allow").and_then(|a| a.as_array()).map(|arr| {
                arr.iter()
                    .filter_map(|x| x.as_str().map(str::to_string))
                    .collect()
            })
        })
        .unwrap_or_default();
    if !allow.iter().any(|a| a == tool) {
        allow.push(tool.to_string());
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let json = serde_json::json!({"allow": allow});
        let _ = std::fs::write(
            &path,
            serde_json::to_string_pretty(&json).unwrap_or_default(),
        );
    }
}

pub(crate) fn matches_any(patterns: &[String], name: &str) -> bool {
    patterns.iter().any(|p| {
        if let Some(prefix) = p.strip_suffix('*') {
            name.starts_with(prefix)
        } else {
            p == name
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_match() {
        let pats = vec!["fdr__stats".to_string()];
        assert!(matches_any(&pats, "fdr__stats"));
        assert!(!matches_any(&pats, "fdr__statsx"));
        assert!(!matches_any(&pats, "fdr__pick_food"));
    }

    #[test]
    fn prefix_glob() {
        let pats = vec!["fdr__*".to_string()];
        assert!(matches_any(&pats, "fdr__stats"));
        assert!(matches_any(&pats, "fdr__pick_food"));
        assert!(!matches_any(&pats, "tracers__stats"));
    }

    #[test]
    fn bare_star_matches_all() {
        let pats = vec!["*".to_string()];
        assert!(matches_any(&pats, "anything__goes"));
    }

    #[test]
    fn empty_patterns_never_match() {
        assert!(!matches_any(&[], "fdr__stats"));
    }

    #[test]
    fn deny_wins_over_allow() {
        let p = Permissions::new(
            vec!["fdr__*".into()],
            vec!["fdr__stats".into()],
            AskMode::AutoDeny,
        );
        assert!(matches!(p.check("fdr__stats"), Some(Decision::Deny)));
        assert!(matches!(p.check("fdr__pick_food"), Some(Decision::Allow)));
        assert!(p.check("tracers__x").is_none()); // falls through to prompt
    }
}
