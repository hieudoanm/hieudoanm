//! Agent loop: prompt -> LLM -> tool calls -> MCP -> repeat.
//!
//! The core `agent_loop` is shared by the top-level agent and the
//! built-in `hieudoanm__spawn_agent` sub-agent tool (fresh context, no
//! nested sub-agents).

use crate::llm::LlmClient;
use crate::mcp::McpManager;
use crate::permissions::{Decision, Permissions};
use anyhow::Result;
use serde_json::{json, Value};
use std::future::Future;
use std::pin::Pin;
use tokio::sync::mpsc;

const SYSTEM_PROMPT: &str = "You are a helpful assistant with access to tools. \
Use tools when they help answer the user's request. Be concise.";

/// Built-in tool name (exposed alongside MCP tools).
pub const SPAWN_AGENT: &str = "hieudoanm__spawn_agent";

/// UI-facing event emitted during a turn (tool completions).
#[derive(Debug, Clone)]
pub enum AgentEvent {
    Tool { name: String, chars: usize },
}
const SUBAGENT_DEFAULT_ROUNDS: usize = 6;
const SUBAGENT_MAX_ROUNDS: usize = 12;

pub struct Agent {
    pub llm: LlmClient,
    mcp: McpManager,
    permissions: Permissions,
    max_rounds: usize,
    pub messages: Vec<Value>,
    quiet: bool,
    event_tx: Option<mpsc::UnboundedSender<AgentEvent>>,
    /// Cumulative (prompt, completion) tokens across all turns.
    totals: std::sync::Arc<std::sync::Mutex<(u64, u64)>>,
}

impl Agent {
    pub fn new(
        llm: LlmClient,
        mcp: McpManager,
        permissions: Permissions,
        max_rounds: usize,
    ) -> Self {
        Self {
            llm,
            mcp,
            permissions,
            max_rounds,
            messages: vec![json!({"role": "system", "content": SYSTEM_PROMPT})],
            quiet: false,
            event_tx: None,
            totals: std::sync::Arc::new(std::sync::Mutex::new((0, 0))),
        }
    }

    /// Cumulative token usage across all turns this session.
    pub fn usage(&self) -> (u64, u64) {
        *self.totals.lock().unwrap()
    }

    /// Estimated cost in USD from the model's price table
    /// (env LLM_PRICE_INPUT/LLM_PRICE_OUTPUT override, $ per 1M tokens).
    pub fn cost_usd(&self) -> f64 {
        let (pin, pout) = crate::llm::price_for(&self.llm.model);
        let (i, o) = self.usage();
        (i as f64 * pin + o as f64 * pout) / 1_000_000.0
    }

    /// Take the MCP notification receiver (server -> client messages).
    pub fn take_notifications(
        &self,
    ) -> Option<mpsc::UnboundedReceiver<(String, serde_json::Value)>> {
        self.mcp.take_notifications()
    }

    /// Suppress stderr diagnostics (TUI raw mode).
    pub fn set_quiet(&mut self, quiet: bool) {
        self.quiet = quiet;
    }

    /// Subscribe to AgentEvents (tool completions).
    pub fn set_event_tx(&mut self, tx: Option<mpsc::UnboundedSender<AgentEvent>>) {
        self.event_tx = tx;
    }

    /// Replace the permission policy (e.g. channel mode for the TUI).
    pub fn set_permissions(&mut self, permissions: Permissions) {
        self.permissions = permissions;
    }

    /// Replace history with a loaded session.
    pub fn load_session(&mut self, saved: Vec<Value>) {
        self.messages = saved;
        if self
            .messages
            .first()
            .and_then(|m| m.get("role"))
            .and_then(Value::as_str)
            != Some("system")
        {
            self.messages
                .insert(0, json!({"role": "system", "content": SYSTEM_PROMPT}));
        }
    }

    pub fn clear(&mut self) {
        self.messages.truncate(1);
    }

    /// All discovered MCP tools (for `/tools` in the REPL).
    pub fn tools(&self) -> &[crate::mcp::McpTool] {
        self.mcp.tools()
    }

    /// Summarize history via the LLM and replace it with system + summary.
    /// Returns the number of messages removed.
    pub async fn compact(&mut self) -> Result<usize> {
        compact_history(&self.llm, &mut self.messages).await
    }

    /// Render the conversation as Markdown (for /export).
    pub fn export_markdown(&self) -> String {
        let mut out = String::from("# hieudoanm transcript\n\n");
        for m in &self.messages {
            let role = m.get("role").and_then(Value::as_str).unwrap_or("?");
            if role == "system" {
                continue;
            }
            let content = m.get("content").and_then(Value::as_str).unwrap_or("");
            match role {
                "user" => out.push_str(&format!("## User\n\n{content}\n\n")),
                "assistant" => {
                    out.push_str(&format!("## Assistant\n\n{content}\n\n"));
                    if let Some(calls) = m.get("tool_calls").and_then(Value::as_array) {
                        for c in calls {
                            let name = c
                                .pointer("/function/name")
                                .and_then(|n| n.as_str())
                                .unwrap_or("?");
                            let args = c
                                .pointer("/function/arguments")
                                .and_then(|n| n.as_str())
                                .unwrap_or("{}");
                            out.push_str(&format!("- tool call `{name}` `{args}`\n"));
                        }
                        out.push('\n');
                    }
                }
                "tool" => {
                    let preview: String = content.chars().take(2000).collect();
                    out.push_str(&format!("### tool result\n\n```\n{preview}\n```\n\n"));
                }
                _ => {}
            }
        }
        out
    }

    /// Content of the most recent user prompt (for /retry).
    pub fn last_prompt(&self) -> Option<String> {
        self.messages
            .iter()
            .rev()
            .find(|m| m.get("role").and_then(Value::as_str) == Some("user"))
            .and_then(|m| m.get("content").and_then(Value::as_str))
            .map(str::to_string)
    }

    /// Remove the last user turn (user message + everything after it).
    /// Returns the number of messages removed, or 0 if nothing to undo.
    pub fn undo(&mut self) -> usize {
        // Find the last real user prompt (index > 0; index 0 may be system,
        // but a compacted summary also lives at index 1 as user role —
        // treat only the LAST user message as the turn boundary).
        let cut = self
            .messages
            .iter()
            .rposition(|m| m.get("role").and_then(Value::as_str) == Some("user"));
        match cut {
            Some(i) if i > 0 => {
                let removed = self.messages.len() - i;
                self.messages.truncate(i);
                removed
            }
            _ => 0,
        }
    }
    /// Run one user turn to completion; returns the assistant's final text.
    /// `on_text` receives streamed content deltas.
    pub async fn run_turn(
        &mut self,
        prompt: &str,
        on_text: impl FnMut(&str) + Send,
    ) -> Result<String> {
        self.messages
            .push(json!({"role": "user", "content": prompt}));
        let mut tools = self.mcp.tool_schemas();
        tools.push(subagent_schema());
        agent_loop(
            &self.llm,
            &self.mcp,
            &mut self.permissions,
            &mut self.messages,
            &tools,
            self.max_rounds,
            self.quiet,
            self.event_tx.clone(),
            self.totals.clone(),
            None,
            on_text,
        )
        .await
    }
}

/// Shared compaction: summarize `messages` in place via the LLM.
/// Keeps the system prompt, replaces the rest with a summary exchange.
/// Returns the number of messages removed.
pub(crate) async fn compact_history(llm: &LlmClient, messages: &mut Vec<Value>) -> Result<usize> {
    if messages.len() <= 2 {
        return Ok(0);
    }
    let mut transcript = String::new();
    for m in messages.iter().skip(1) {
        let role = m.get("role").and_then(Value::as_str).unwrap_or("?");
        let content = m
            .get("content")
            .and_then(Value::as_str)
            .unwrap_or("")
            .replace('\n', " ");
        let preview: String = content.chars().take(400).collect();
        transcript.push_str(&format!("{role}: {preview}\n"));
        if let Some(calls) = m.get("tool_calls").and_then(Value::as_array) {
            for c in calls {
                let name = c
                    .pointer("/function/name")
                    .and_then(|n| n.as_str())
                    .unwrap_or("?");
                transcript.push_str(&format!("  -> tool_call {name}\n"));
            }
        }
        if transcript.len() > 30_000 {
            transcript.push_str("[...truncated...]\n");
            break;
        }
    }
    let request = vec![
        json!({"role": "system", "content": SYSTEM_PROMPT}),
        json!({"role": "user", "content": format!(
            "Summarize this conversation so far in at most 300 words. \
             Preserve key facts, decisions, file paths, tool results, \
             and anything needed to continue the task.\n\n{transcript}"
        )}),
    ];
    let reply = llm.chat(&request, &[], |_| {}).await?;
    let summary = reply
        .get("content")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    if summary.is_empty() {
        anyhow::bail!("LLM returned an empty summary");
    }
    let removed = messages.len() - 2;
    *messages = vec![
        json!({"role": "system", "content": SYSTEM_PROMPT}),
        json!({"role": "user", "content": format!("Summary of earlier conversation:\n{summary}")}),
        json!({"role": "assistant", "content": "Understood — continuing from the summary."}),
    ];
    Ok(removed)
}

fn subagent_schema() -> Value {
    json!({
        "type": "function",
        "function": {
            "name": SPAWN_AGENT,
            "description": "Spawn a sub-agent with a fresh conversation context to handle a focused subtask. Returns the sub-agent's final answer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "The task for the sub-agent"},
                    "max_rounds": {"type": "integer", "description": "Tool-call round limit (default 6, max 12)"}
                },
                "required": ["prompt"]
            }
        }
    })
}

enum Target {
    Mcp { name: String, args: Value },
    SubAgent { prompt: String, max_rounds: usize },
}

struct Pending {
    id: String,
    preview: String,
    allowed: bool,
    target: Target,
}

/// The shared agent loop. Sub-agents get a tool list without
/// `hieudoanm__spawn_agent`, which prevents nesting.
#[allow(clippy::too_many_arguments)]
fn agent_loop<'a>(
    llm: &'a LlmClient,
    mcp: &'a McpManager,
    permissions: &'a mut Permissions,
    messages: &'a mut Vec<Value>,
    tools: &'a [Value],
    max_rounds: usize,
    quiet: bool,
    events: Option<mpsc::UnboundedSender<AgentEvent>>,
    totals: std::sync::Arc<std::sync::Mutex<(u64, u64)>>,
    token_budget: Option<u64>,
    mut on_text: impl FnMut(&str) + Send + 'a,
) -> Pin<Box<dyn Future<Output = Result<String>> + Send + 'a>> {
    Box::pin(async move {
        let mut spent: u64 = 0;
        for _round in 0..max_rounds {
            let message = llm.chat(messages, tools, &mut on_text).await?;
            log_usage(llm, quiet);
            maybe_auto_compact(llm, messages, quiet).await;
            if let Some((p, c)) = llm.last_usage() {
                let mut t = totals.lock().unwrap();
                t.0 += p;
                t.1 += c;
                spent += p + c;
                if let Some(budget) = token_budget {
                    if spent > budget {
                        anyhow::bail!(
                            "sub-agent token budget exceeded ({spent} > {budget} tokens)"
                        );
                    }
                }
            }

            let tool_calls = message
                .get("tool_calls")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();

            if tool_calls.is_empty() {
                let text = message
                    .get("content")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                messages.push(message);
                return Ok(text);
            }

            messages.push(message);

            // Parse calls and resolve permissions sequentially (asks are
            // interactive), then dispatch approved calls in parallel.
            let mut pending: Vec<Pending> = Vec::new();
            for call in &tool_calls {
                let id = call
                    .get("id")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                let name = call
                    .get("function")
                    .and_then(|f| f.get("name"))
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                let args: Value = call
                    .get("function")
                    .and_then(|f| f.get("arguments"))
                    .and_then(Value::as_str)
                    .and_then(|s| serde_json::from_str(s).ok())
                    .unwrap_or_else(|| json!({}));

                let target = if name == SPAWN_AGENT {
                    Target::SubAgent {
                        prompt: args
                            .get("prompt")
                            .and_then(Value::as_str)
                            .unwrap_or("")
                            .to_string(),
                        max_rounds: args
                            .get("max_rounds")
                            .and_then(Value::as_u64)
                            .unwrap_or(SUBAGENT_DEFAULT_ROUNDS as u64)
                            .min(SUBAGENT_MAX_ROUNDS as u64)
                            as usize,
                    }
                } else {
                    Target::Mcp {
                        name: name.clone(),
                        args: args.clone(),
                    }
                };
                let preview_source = match &target {
                    Target::Mcp { args, .. } => args.clone(),
                    Target::SubAgent { prompt, .. } => json!({"prompt": prompt}),
                };
                let preview: String = serde_json::to_string(&preview_source)
                    .unwrap_or_default()
                    .chars()
                    .take(120)
                    .collect();

                let allowed = permissions.resolve(&name, &preview).await == Decision::Allow;
                if !allowed && !quiet {
                    eprintln!("[hieudoanm] denied {name}");
                }
                pending.push(Pending {
                    id,
                    preview,
                    allowed,
                    target,
                });
            }

            // Parallel dispatch of all allowed calls.
            let allowed_idx: Vec<usize> = pending
                .iter()
                .enumerate()
                .filter(|(_, p)| p.allowed)
                .map(|(i, _)| i)
                .collect();
            let outcomes: Vec<Result<String, anyhow::Error>> =
                futures::future::join_all(pending.iter().filter(|p| p.allowed).map(|p| {
                    let perms = permissions.clone();
                    let events = events.clone();
                    let totals = totals.clone();
                    let target = match &p.target {
                        Target::Mcp { name, args } => Target::Mcp {
                            name: name.clone(),
                            args: args.clone(),
                        },
                        Target::SubAgent { prompt, max_rounds } => Target::SubAgent {
                            prompt: prompt.clone(),
                            max_rounds: *max_rounds,
                        },
                    };
                    async move {
                        match target {
                            Target::Mcp { name, args } => mcp.call(&name, args).await,
                            Target::SubAgent { prompt, max_rounds } => {
                                run_subagent(
                                    llm,
                                    mcp,
                                    &perms,
                                    &prompt,
                                    max_rounds,
                                    quiet,
                                    events.clone(),
                                    totals.clone(),
                                )
                                .await
                            }
                        }
                    }
                }))
                .await;
            let mut results: Vec<Option<Result<String, anyhow::Error>>> =
                (0..pending.len()).map(|_| None).collect();
            for (slot, res) in allowed_idx.into_iter().zip(outcomes) {
                results[slot] = Some(res);
            }

            for (i, p) in pending.iter().enumerate() {
                let content = if !p.allowed {
                    "error: tool call denied by user".to_string()
                } else {
                    match results[i].take().unwrap() {
                        Ok(text) => {
                            let label = match &p.target {
                                Target::Mcp { name, .. } => name.clone(),
                                Target::SubAgent { .. } => SPAWN_AGENT.to_string(),
                            };
                            if !quiet {
                                eprintln!("[hieudoanm] -> {label}({})", p.preview);
                                eprintln!("[hieudoanm] <- {} chars", text.len());
                            }
                            if let Some(tx) = &events {
                                let _ = tx.send(AgentEvent::Tool {
                                    name: label,
                                    chars: text.len(),
                                });
                            }
                            truncate_result(text)
                        }
                        Err(e) => format!("error: {e}"),
                    }
                };
                messages.push(json!({
                    "role": "tool",
                    "tool_call_id": p.id,
                    "content": content,
                }));
            }
        }
        Ok("(stopped after maximum tool rounds)".to_string())
    })
}

/// Run a sub-agent with a fresh conversation (no nested sub-agents).
#[allow(clippy::too_many_arguments)]
async fn run_subagent(
    llm: &LlmClient,
    mcp: &McpManager,
    permissions: &Permissions,
    prompt: &str,
    max_rounds: usize,
    quiet: bool,
    events: Option<mpsc::UnboundedSender<AgentEvent>>,
    totals: std::sync::Arc<std::sync::Mutex<(u64, u64)>>,
) -> Result<String> {
    let mut messages = vec![
        json!({"role": "system", "content": SYSTEM_PROMPT}),
        json!({"role": "user", "content": prompt}),
    ];
    let tools = mcp.tool_schemas(); // no spawn_agent — depth guard
    let mut perms = permissions.clone();
    let budget: Option<u64> = std::env::var("LLM_SUBAGENT_TOKEN_BUDGET")
        .ok()
        .and_then(|v| v.parse().ok())
        .or(Some(20_000));
    agent_loop(
        llm,
        mcp,
        &mut perms,
        &mut messages,
        &tools,
        max_rounds,
        quiet,
        events,
        totals,
        budget,
        |_| {},
    )
    .await
}

/// Auto-compact when prompt tokens approach the context warning threshold.
/// Disable with LLM_AUTO_COMPACT=0. Runs at most the LLM calls needed —
/// compaction itself resets usage to a small prompt.
async fn maybe_auto_compact(llm: &LlmClient, messages: &mut Vec<Value>, quiet: bool) {
    if std::env::var("LLM_AUTO_COMPACT")
        .map(|v| v == "0")
        .unwrap_or(false)
    {
        return;
    }
    let warn_at: u64 = std::env::var("LLM_CONTEXT_WARN")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(100_000);
    let Some((prompt, _)) = llm.last_usage() else {
        return;
    };
    // Compact at 80% of the warning threshold, only when there's history.
    if prompt >= warn_at * 4 / 5 && messages.len() > 8 {
        match compact_history(llm, messages).await {
            Ok(removed) if !quiet => {
                eprintln!("[hieudoanm] auto-compacted {removed} messages ({prompt} prompt tokens)");
            }
            Ok(_) => {}
            Err(e) if !quiet => eprintln!("[hieudoanm] auto-compact failed: {e}"),
            Err(_) => {}
        }
    }
}

/// Log token usage for the last LLM call; warn near the context limit.
fn log_usage(llm: &LlmClient, quiet: bool) {
    if quiet {
        return;
    }
    let Some((prompt, completion)) = llm.last_usage() else {
        return;
    };
    eprintln!("[hieudoanm] context: {prompt} prompt / {completion} completion tokens");
    let warn_at: u64 = std::env::var("LLM_CONTEXT_WARN")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(100_000);
    if prompt >= warn_at {
        eprintln!(
            "[hieudoanm] warning: prompt is {prompt} tokens (>= {warn_at}); \
             consider /clear or a larger-context model"
        );
    }
}

/// Cap tool results so huge outputs don't blow the context window.
fn truncate_result(text: String) -> String {
    const MAX_CHARS: usize = 30_000;
    if text.chars().count() <= MAX_CHARS {
        return text;
    }
    let kept: String = text.chars().take(MAX_CHARS).collect();
    format!(
        "{kept}\n[truncated — {} chars total; narrow the query or use offset/limit args]",
        text.len()
    )
}
