//! `harness eval <file>` — run prompt test cases against the agent.
//!
//! Input: JSON array (or JSONL) of cases:
//! ```json
//! [{"name": "stats", "prompt": "how many dishes?",
//!   "expect": {"text_contains": "480", "tools": ["fdr__stats"]}}]
//! ```
//! `expect.tools` = tool names that must have been called;
//! `expect.forbid_tools` = names that must not appear;
//! `expect.text_contains` = substring of the final answer.
//!
//! Permissions are allow-all (`--deny` still applies) so runs are
//! deterministic. Exit code 1 if any case fails.

use crate::agent::{Agent, AgentEvent};
use crate::permissions::{AskMode, Permissions};
use anyhow::{Context, Result};
use serde::Deserialize;
use std::path::PathBuf;
use tokio::sync::mpsc;

#[derive(Debug, Deserialize)]
struct Turn {
    prompt: String,
    #[serde(default)]
    expect: Expect,
}

#[derive(Debug, Deserialize)]
struct Case {
    #[serde(default)]
    name: Option<String>,
    prompt: String,
    #[serde(default)]
    expect: Expect,
    /// Additional turns in the same conversation (no history reset).
    #[serde(default)]
    followups: Vec<Turn>,
    /// Shell command run once before the case's first turn.
    #[serde(default)]
    setup: Option<String>,
    /// Shell command run once after the case's last turn (always runs).
    #[serde(default)]
    teardown: Option<String>,
}

#[derive(Debug, Deserialize, Default, Clone)]
struct Expect {
    text_contains: Option<String>,
    #[serde(default)]
    tools: Vec<String>,
    #[serde(default)]
    forbid_tools: Vec<String>,
    /// Substring that must appear in some message's content/tool_calls.
    history_contains: Option<String>,
    /// Maximum allowed total message count after the turn.
    history_max_len: Option<usize>,
}

pub async fn run_eval(
    agent: &mut Agent,
    file: &PathBuf,
    deny: Vec<String>,
    json_out: bool,
    filter: Option<&str>,
) -> Result<i32> {
    let text = if file.as_os_str() == "-" {
        let mut s = String::new();
        tokio::io::AsyncReadExt::read_to_string(&mut tokio::io::stdin(), &mut s).await?;
        s
    } else {
        tokio::fs::read_to_string(file)
            .await
            .with_context(|| format!("cannot read {}", file.display()))?
    };

    // JSON array or JSONL
    let cases: Vec<Case> = if let Ok(arr) = serde_json::from_str::<Vec<Case>>(&text) {
        arr
    } else {
        text.lines()
            .filter(|l| !l.trim().is_empty())
            .map(serde_json::from_str::<Case>)
            .collect::<std::result::Result<_, _>>()
            .context("invalid eval file: expected JSON array or JSONL")?
    };
    if cases.is_empty() {
        anyhow::bail!("no eval cases found");
    }
    let cases: Vec<Case> = match filter {
        Some(f) => {
            let f = f.to_lowercase();
            cases
                .into_iter()
                .filter(|c| {
                    c.name.as_deref().unwrap_or("").to_lowercase().contains(&f)
                        || c.prompt.to_lowercase().contains(&f)
                })
                .collect()
        }
        None => cases,
    };
    if cases.is_empty() {
        anyhow::bail!("no eval cases match the filter");
    }

    // Deterministic permissions: allow everything except --deny.
    agent.set_permissions(Permissions::new(vec!["*".into()], deny, AskMode::AutoDeny));
    agent.set_quiet(true);

    let (ev_tx, mut ev_rx) = mpsc::unbounded_channel::<AgentEvent>();
    agent.set_event_tx(Some(ev_tx));

    let mut passed = 0usize;
    let mut failed = 0usize;
    let mut results: Vec<serde_json::Value> = Vec::new();
    for (i, case) in cases.iter().enumerate() {
        agent.clear();
        while ev_rx.try_recv().is_ok() {} // drain stale events

        let label = case
            .name
            .clone()
            .unwrap_or_else(|| format!("case {}", i + 1));

        // First turn plus any followups, all in one conversation.
        let mut steps: Vec<(String, String, Expect)> =
            vec![(label.clone(), case.prompt.clone(), case.expect.clone())];
        for (j, f) in case.followups.iter().enumerate() {
            steps.push((
                format!("{label} (followup {})", j + 1),
                f.prompt.clone(),
                f.expect.clone(),
            ));
        }

        if let Some(cmd) = &case.setup {
            let ok = tokio::process::Command::new("sh")
                .arg("-c")
                .arg(cmd)
                .status()
                .await
                .map(|s| s.success())
                .unwrap_or(false);
            if !ok {
                failed += 1;
                results.push(serde_json::json!({
                    "case": i + 1, "name": format!("{label} (setup)"),
                    "pass": false, "elapsed_ms": 0, "tool_calls": [],
                    "failures": [format!("setup command failed: {cmd}")],
                }));
                if !json_out {
                    println!("not ok {} - {} (setup)", i + 1, label);
                    println!("  # setup command failed: {cmd}");
                }
                if let Some(cmd) = &case.teardown {
                    let _ = tokio::process::Command::new("sh")
                        .arg("-c")
                        .arg(cmd)
                        .status()
                        .await;
                }
                continue;
            }
        }

        for (step_label, prompt, expect) in steps {
            let started = std::time::Instant::now();
            // Stream progress: report tool calls as they happen.
            let mut turn = Box::pin(agent.run_turn(&prompt, |_| {}));
            let mut tick = tokio::time::interval(std::time::Duration::from_millis(150));
            let mut live_tools: Vec<String> = Vec::new();
            let result = loop {
                tokio::select! {
                    r = &mut turn => break r,
                    _ = tick.tick() => {
                        while let Ok(ev) = ev_rx.try_recv() {
                            let AgentEvent::Tool { name, .. } = ev;
                            eprintln!("  # tool: {name}");
                            live_tools.push(name);
                        }
                    }
                }
            };
            drop(turn); // release the &mut agent borrow before inspecting history
            let elapsed = started.elapsed();

            // Collect tool names that completed during this turn.
            let mut tools_called = live_tools;
            while let Ok(ev) = ev_rx.try_recv() {
                let AgentEvent::Tool { name, .. } = ev;
                tools_called.push(name);
            }

            let mut reasons: Vec<String> = Vec::new();
            match &result {
                Ok(answer) => {
                    if let Some(want) = &expect.text_contains {
                        if !answer.contains(want.as_str()) {
                            reasons.push(format!(
                                "answer missing '{want}' (got: {:.120})",
                                answer.replace('\n', " ")
                            ));
                        }
                    }
                }
                Err(e) => reasons.push(format!("run failed: {e}")),
            }
            for want in &expect.tools {
                if !tools_called.iter().any(|t| t == want) {
                    reasons.push(format!("expected tool '{want}' not called"));
                }
            }
            for bad in &expect.forbid_tools {
                if tools_called.iter().any(|t| t == bad) {
                    reasons.push(format!("forbidden tool '{bad}' was called"));
                }
            }
            if let Some(want) = &expect.history_contains {
                let found = agent
                    .messages
                    .iter()
                    .any(|m| m.to_string().contains(want.as_str()));
                if !found {
                    reasons.push(format!("history missing '{want}'"));
                }
            }
            if let Some(max) = expect.history_max_len {
                if agent.messages.len() > max {
                    reasons.push(format!(
                        "history too long: {} messages > {max}",
                        agent.messages.len()
                    ));
                }
            }

            let ok = reasons.is_empty();
            if ok {
                passed += 1;
            } else {
                failed += 1;
            }
            let failures_json: Vec<serde_json::Value> = reasons
                .iter()
                .map(|r| serde_json::Value::String(r.clone()))
                .collect();
            results.push(serde_json::json!({
                "case": i + 1,
                "name": step_label,
                "pass": ok,
                "elapsed_ms": elapsed.as_millis() as u64,
                "tool_calls": tools_called,
                "failures": failures_json,
            }));
            if !json_out {
                if ok {
                    println!(
                        "ok {} - {} ({:.1?}, {} tool calls)",
                        i + 1,
                        step_label,
                        elapsed,
                        tools_called.len()
                    );
                } else {
                    println!("not ok {} - {}", i + 1, step_label);
                    for r in &reasons {
                        println!("  # {r}");
                    }
                }
            }
        }
        if let Some(cmd) = &case.teardown {
            let ok = tokio::process::Command::new("sh")
                .arg("-c")
                .arg(cmd)
                .status()
                .await
                .map(|s| s.success())
                .unwrap_or(false);
            if !ok {
                failed += 1;
                results.push(serde_json::json!({
                    "case": i + 1, "name": format!("{label} (teardown)"),
                    "pass": false, "elapsed_ms": 0, "tool_calls": [],
                    "failures": [format!("teardown command failed: {cmd}")],
                }));
                if !json_out {
                    println!("not ok {} - {} (teardown)", i + 1, label);
                    println!("  # teardown command failed: {cmd}");
                }
            }
        }
        let _ = i;
    }
    if json_out {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "passed": passed,
                "failed": failed,
                "cases": results,
            }))?
        );
    } else {
        println!("# {passed} passed, {failed} failed");
    }
    Ok(if failed == 0 { 0 } else { 1 })
}
