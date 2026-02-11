//! Chat client with two providers:
//! - `openai` (default): OpenAI-compatible `/chat/completions` with SSE
//!   streaming — OpenAI, Ollama, LM Studio, OpenRouter, Groq, etc.
//! - `anthropic`: Anthropic Messages API (`/v1/messages`) with SSE
//!   streaming (content_block_delta events).
//!
//! Select with `LLM_PROVIDER` (`openai`|`anthropic`); auto-detected as
//! anthropic when `LLM_BASE_URL` contains "anthropic".

use anyhow::{bail, Context, Result};
use futures::StreamExt;
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Provider {
    OpenAi,
    Anthropic,
}

#[derive(Clone)]
pub struct LlmClient {
    http: reqwest::Client,
    provider: Provider,
    base_url: String,
    api_key: String,
    pub model: String,
    /// (prompt_tokens, completion_tokens) of the most recent call.
    usage: Arc<Mutex<Option<(u64, u64)>>>,
}

/// Accumulates one streamed tool call.
#[derive(Default)]
struct ToolCallAcc {
    id: String,
    name: String,
    arguments: String,
}

/// Accumulates one Anthropic content block.
enum BlockAcc {
    Text(String),
    ToolUse {
        id: String,
        name: String,
        json: String,
    },
}

impl LlmClient {
    pub fn from_env() -> Result<Self> {
        let base_url = std::env::var("LLM_BASE_URL")
            .unwrap_or_else(|_| "https://api.openai.com/v1".to_string())
            .trim_end_matches('/')
            .to_string();
        let explicit = std::env::var("LLM_PROVIDER")
            .unwrap_or_default()
            .to_lowercase();
        let provider = match explicit.as_str() {
            "anthropic" => Provider::Anthropic,
            "openai" => Provider::OpenAi,
            "" if base_url.contains("anthropic") => Provider::Anthropic,
            _ => Provider::OpenAi,
        };
        let (base_url, api_key, default_model) = if provider == Provider::Anthropic {
            (
                std::env::var("ANTHROPIC_BASE_URL")
                    .unwrap_or_else(|_| "https://api.anthropic.com".to_string())
                    .trim_end_matches('/')
                    .to_string(),
                std::env::var("ANTHROPIC_API_KEY")
                    .or_else(|_| std::env::var("LLM_API_KEY"))
                    .unwrap_or_default(),
                "claude-sonnet-4-5".to_string(),
            )
        } else {
            (
                base_url,
                std::env::var("LLM_API_KEY").unwrap_or_default(),
                "gpt-4o-mini".to_string(),
            )
        };
        let model = std::env::var("LLM_MODEL").unwrap_or(default_model);
        Ok(Self {
            http: reqwest::Client::new(),
            provider,
            base_url,
            api_key,
            model,
            usage: Arc::new(Mutex::new(None)),
        })
    }

    pub fn last_usage(&self) -> Option<(u64, u64)> {
        *self.usage.lock().unwrap()
    }

    pub fn provider_name(&self) -> &'static str {
        match self.provider {
            Provider::OpenAi => "openai",
            Provider::Anthropic => "anthropic",
        }
    }

    /// One chat round. `tools` are OpenAI-format tool schemas.
    /// `on_text` receives content deltas as they stream. Returns an
    /// OpenAI-shaped assistant message.
    pub async fn chat(
        &self,
        messages: &[Value],
        tools: &[Value],
        on_text: impl FnMut(&str),
    ) -> Result<Value> {
        match self.provider {
            Provider::OpenAi => self.chat_openai(messages, tools, on_text).await,
            Provider::Anthropic => self.chat_anthropic(messages, tools, on_text).await,
        }
    }

    // ---------- OpenAI-compatible (SSE streaming) ----------

    async fn chat_openai(
        &self,
        messages: &[Value],
        tools: &[Value],
        mut on_text: impl FnMut(&str),
    ) -> Result<Value> {
        let mut body = json!({
            "model": self.model,
            "messages": messages,
            "stream": true,
            "stream_options": {"include_usage": true},
        });
        if !tools.is_empty() {
            body["tools"] = json!(tools);
            body["tool_choice"] = json!("auto");
        }
        let response = self
            .http
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .context("LLM request failed")?;
        let status = response.status();
        if !status.is_success() {
            let text = response.text().await.unwrap_or_default();
            bail!("LLM API error {status}: {}", &text[..text.len().min(500)]);
        }

        let mut content = String::new();
        let mut calls: Vec<ToolCallAcc> = Vec::new();
        stream_sse(response, |v| {
            if let Some(u) = v.get("usage") {
                *self.usage.lock().unwrap() = Some((
                    u.get("prompt_tokens").and_then(Value::as_u64).unwrap_or(0),
                    u.get("completion_tokens")
                        .and_then(Value::as_u64)
                        .unwrap_or(0),
                ));
            }
            let Some(delta) = v
                .get("choices")
                .and_then(|c| c.get(0))
                .and_then(|c| c.get("delta"))
            else {
                return;
            };
            if let Some(text) = delta.get("content").and_then(Value::as_str) {
                content.push_str(text);
                on_text(text);
            }
            if let Some(arr) = delta.get("tool_calls").and_then(Value::as_array) {
                for tc in arr {
                    let idx = tc.get("index").and_then(Value::as_u64).unwrap_or(0) as usize;
                    while calls.len() <= idx {
                        calls.push(ToolCallAcc::default());
                    }
                    let acc = &mut calls[idx];
                    if let Some(id) = tc.get("id").and_then(Value::as_str) {
                        acc.id = id.to_string();
                    }
                    if let Some(f) = tc.get("function") {
                        if let Some(name) = f.get("name").and_then(Value::as_str) {
                            acc.name.push_str(name);
                        }
                        if let Some(args) = f.get("arguments").and_then(Value::as_str) {
                            acc.arguments.push_str(args);
                        }
                    }
                }
            }
        })
        .await?;

        Ok(assemble_message(content, calls))
    }

    // ---------- Anthropic Messages API (SSE streaming) ----------

    async fn chat_anthropic(
        &self,
        messages: &[Value],
        tools: &[Value],
        mut on_text: impl FnMut(&str),
    ) -> Result<Value> {
        let (system, msgs) = to_anthropic_messages(messages);
        let max_tokens: u64 = std::env::var("LLM_MAX_TOKENS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(4096);
        let mut body = json!({
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": msgs,
            "stream": true,
        });
        if !system.is_empty() {
            body["system"] = json!(system);
        }
        if !tools.is_empty() {
            body["tools"] = json!(tools
                .iter()
                .map(|t| {
                    let f = &t["function"];
                    json!({
                        "name": f["name"],
                        "description": f["description"],
                        "input_schema": f["parameters"],
                    })
                })
                .collect::<Vec<_>>());
        }
        let response = self
            .http
            .post(format!("{}/v1/messages", self.base_url))
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await
            .context("Anthropic request failed")?;
        let status = response.status();
        if !status.is_success() {
            let text = response.text().await.unwrap_or_default();
            bail!(
                "Anthropic API error {status}: {}",
                &text[..text.len().min(500)]
            );
        }

        // Accumulate content blocks by index.
        let mut blocks: Vec<Option<BlockAcc>> = Vec::new();
        let mut input_tokens = 0u64;
        let mut output_tokens = 0u64;
        stream_sse(response, |v| match v.get("type").and_then(Value::as_str) {
            Some("message_start") => {
                if let Some(u) = v.pointer("/message/usage") {
                    input_tokens = u.get("input_tokens").and_then(Value::as_u64).unwrap_or(0);
                }
            }
            Some("content_block_start") => {
                let idx = v.get("index").and_then(Value::as_u64).unwrap_or(0) as usize;
                while blocks.len() <= idx {
                    blocks.push(None);
                }
                let cb = &v["content_block"];
                blocks[idx] = Some(match cb.get("type").and_then(Value::as_str) {
                    Some("tool_use") => BlockAcc::ToolUse {
                        id: cb
                            .get("id")
                            .and_then(Value::as_str)
                            .unwrap_or("")
                            .to_string(),
                        name: cb
                            .get("name")
                            .and_then(Value::as_str)
                            .unwrap_or("")
                            .to_string(),
                        json: String::new(),
                    },
                    _ => BlockAcc::Text(String::new()),
                });
            }
            Some("content_block_delta") => {
                let idx = v.get("index").and_then(Value::as_u64).unwrap_or(0) as usize;
                let delta = &v["delta"];
                match delta.get("type").and_then(Value::as_str) {
                    Some("text_delta") => {
                        if let Some(text) = delta.get("text").and_then(Value::as_str) {
                            if let Some(Some(BlockAcc::Text(buf))) = blocks.get_mut(idx) {
                                buf.push_str(text);
                            }
                            on_text(text);
                        }
                    }
                    Some("input_json_delta") => {
                        if let (Some(partial), Some(Some(BlockAcc::ToolUse { json, .. }))) = (
                            delta.get("partial_json").and_then(Value::as_str),
                            blocks.get_mut(idx),
                        ) {
                            json.push_str(partial);
                        }
                    }
                    _ => {}
                }
            }
            Some("message_delta") => {
                if let Some(u) = v.get("usage") {
                    output_tokens = u.get("output_tokens").and_then(Value::as_u64).unwrap_or(0);
                }
            }
            _ => {}
        })
        .await?;

        *self.usage.lock().unwrap() = Some((input_tokens, output_tokens));

        // Convert blocks back to an OpenAI-shaped message.
        let mut content = String::new();
        let mut calls: Vec<ToolCallAcc> = Vec::new();
        for b in blocks.into_iter().flatten() {
            match b {
                BlockAcc::Text(t) => content.push_str(&t),
                BlockAcc::ToolUse { id, name, json } => {
                    calls.push(ToolCallAcc {
                        id,
                        name,
                        arguments: if json.is_empty() { "{}".into() } else { json },
                    });
                }
            }
        }
        Ok(assemble_message(content, calls))
    }
}

/// Read an SSE stream (`data: {...}` events separated by blank lines)
/// and invoke `on_event` for each parsed JSON payload.
async fn stream_sse(response: reqwest::Response, mut on_event: impl FnMut(&Value)) -> Result<()> {
    let mut buf: Vec<u8> = Vec::new();
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.context("LLM stream read failed")?;
        buf.extend_from_slice(&chunk);
        loop {
            let sep = buf
                .windows(2)
                .position(|w| w == b"\n\n")
                .map(|p| (p, 2))
                .into_iter()
                .chain(
                    buf.windows(4)
                        .position(|w| w == b"\r\n\r\n")
                        .map(|p| (p, 4)),
                )
                .min_by_key(|(p, _)| *p);
            let Some((pos, len)) = sep else { break };
            let event: Vec<u8> = buf.drain(..pos + len).collect();
            let event = String::from_utf8_lossy(&event[..event.len() - len]);
            for line in event.lines() {
                let Some(data) = line.strip_prefix("data:") else {
                    continue;
                };
                let data = data.trim();
                if data.is_empty() || data == "[DONE]" {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<Value>(data) {
                    on_event(&v);
                }
            }
        }
    }
    Ok(())
}

/// Price per 1M tokens (input, output) in USD.
/// `LLM_PRICE_INPUT`/`LLM_PRICE_OUTPUT` env vars override the table.
pub fn price_for(model: &str) -> (f64, f64) {
    if let (Ok(i), Ok(o)) = (
        std::env::var("LLM_PRICE_INPUT"),
        std::env::var("LLM_PRICE_OUTPUT"),
    ) {
        if let (Ok(i), Ok(o)) = (i.parse::<f64>(), o.parse::<f64>()) {
            return (i, o);
        }
    }
    let m = model.to_lowercase();
    if m.contains("gpt-4o-mini") {
        (0.15, 0.60)
    } else if m.contains("gpt-4o") {
        (2.50, 10.00)
    } else if m.contains("claude-opus") {
        (15.0, 75.0)
    } else if m.contains("claude-sonnet") {
        (3.0, 15.0)
    } else if m.contains("claude-haiku") {
        (0.80, 4.0)
    } else {
        (0.0, 0.0) // unknown/local — treat as free
    }
}

fn assemble_message(content: String, calls: Vec<ToolCallAcc>) -> Value {
    let mut message = json!({"role": "assistant", "content": content});
    if !calls.is_empty() {
        let tool_calls: Vec<Value> = calls
            .into_iter()
            .map(|c| {
                json!({
                    "id": c.id,
                    "type": "function",
                    "function": {"name": c.name, "arguments": c.arguments},
                })
            })
            .collect();
        message["tool_calls"] = json!(tool_calls);
    }
    message
}

/// Convert OpenAI-shaped history to Anthropic format.
/// Returns (system_prompt, messages). Tool results are folded into
/// `user` messages as `tool_result` blocks.
fn to_anthropic_messages(messages: &[Value]) -> (String, Vec<Value>) {
    let mut system_parts: Vec<String> = Vec::new();
    let mut out: Vec<Value> = Vec::new();

    let content_text = |m: &Value| -> String {
        m.get("content")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string()
    };

    for m in messages {
        match m.get("role").and_then(Value::as_str) {
            Some("system") => {
                let t = content_text(m);
                if !t.is_empty() {
                    system_parts.push(t);
                }
            }
            Some("user") => {
                out.push(json!({"role": "user", "content": content_text(m)}));
            }
            Some("assistant") => {
                let mut blocks: Vec<Value> = Vec::new();
                let text = content_text(m);
                if !text.is_empty() {
                    blocks.push(json!({"type": "text", "text": text}));
                }
                if let Some(calls) = m.get("tool_calls").and_then(Value::as_array) {
                    for c in calls {
                        let f = &c["function"];
                        let input: Value = f
                            .get("arguments")
                            .and_then(Value::as_str)
                            .and_then(|s| serde_json::from_str(s).ok())
                            .unwrap_or_else(|| json!({}));
                        blocks.push(json!({
                            "type": "tool_use",
                            "id": c.get("id").and_then(Value::as_str).unwrap_or(""),
                            "name": f.get("name").and_then(Value::as_str).unwrap_or(""),
                            "input": input,
                        }));
                    }
                }
                if blocks.is_empty() {
                    blocks.push(json!({"type": "text", "text": ""}));
                }
                out.push(json!({"role": "assistant", "content": blocks}));
            }
            Some("tool") => {
                let block = json!({
                    "type": "tool_result",
                    "tool_use_id": m.get("tool_call_id").and_then(Value::as_str).unwrap_or(""),
                    "content": content_text(m),
                });
                // Merge consecutive tool results into one user message.
                if let Some(last) = out.last_mut() {
                    if last.get("role").and_then(Value::as_str) == Some("user")
                        && last.get("content").and_then(Value::as_array).is_some()
                    {
                        last["content"].as_array_mut().unwrap().push(block);
                        continue;
                    }
                }
                out.push(json!({"role": "user", "content": [block]}));
            }
            _ => {}
        }
    }

    (system_parts.join("\n\n"), out)
}
