//! `harness serve` — expose the agent loop as an MCP server over stdio.
//!
//! Tools: `ask` (run a prompt through the agent), `clear`, `list_tools`,
//! `status`. Runs headless: tool permissions are non-interactive, so only
//! `--allow`/`--deny`/config patterns apply (asks are denied).

use crate::agent::Agent;
use anyhow::Result;
use serde_json::{json, Value};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

fn server_tools() -> Value {
    json!([
        {
            "name": "ask",
            "description": "Ask the harness agent. It can use all configured MCP tools and returns the final answer.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "The user's question or task"}
                },
                "required": ["prompt"]
            }
        },
        {
            "name": "clear",
            "description": "Clear the agent's conversation history.",
            "inputSchema": {"type": "object", "properties": {}}
        },
        {
            "name": "list_tools",
            "description": "List the MCP tools available to the agent.",
            "inputSchema": {"type": "object", "properties": {}}
        },
        {
            "name": "status",
            "description": "Show agent status: LLM provider, model, and tool count.",
            "inputSchema": {"type": "object", "properties": {}}
        }
    ])
}

async fn call_tool(agent: &mut Agent, name: &str, args: &Value) -> Result<String> {
    match name {
        "ask" => {
            let prompt = args.get("prompt").and_then(Value::as_str).unwrap_or("");
            if prompt.is_empty() {
                anyhow::bail!("missing 'prompt'");
            }
            agent.run_turn(prompt, |_| {}).await
        }
        "clear" => {
            agent.clear();
            Ok("history cleared".to_string())
        }
        "list_tools" => {
            let names: Vec<&str> = agent.tools().iter().map(|t| t.name.as_str()).collect();
            Ok(names.join("\n"))
        }
        "status" => Ok(format!(
            "provider: {}\nmodel: {}\nmcp tools: {}",
            agent.llm.provider_name(),
            agent.llm.model,
            agent.tools().len()
        )),
        other => anyhow::bail!("unknown tool: {other}"),
    }
}

fn ok(id: &Value, result: Value) -> Value {
    json!({"jsonrpc": "2.0", "id": id, "result": result})
}

fn err(id: &Value, code: i64, message: &str) -> Value {
    json!({"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}})
}

fn text_result(text: String) -> Value {
    json!({"content": [{"type": "text", "text": text}]})
}

/// Run the MCP stdio server loop until stdin closes.
pub async fn serve(agent: &mut Agent) -> Result<()> {
    agent.set_quiet(true);
    let stdin = tokio::io::stdin();
    let mut lines = BufReader::new(stdin).lines();
    let mut out = tokio::io::stdout();

    while let Some(line) = lines.next_line().await? {
        let line = line.trim().to_string();
        if line.is_empty() {
            continue;
        }
        let Ok(req) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        let Some(id) = req.get("id").cloned() else {
            continue; // notification
        };
        let method = req.get("method").and_then(Value::as_str).unwrap_or("");
        let params = req.get("params").cloned().unwrap_or(json!({}));

        let response = match method {
            "initialize" => ok(
                &id,
                json!({
                    "protocolVersion": params
                        .get("protocolVersion")
                        .and_then(Value::as_str)
                        .unwrap_or("2024-11-05"),
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "harness", "version": env!("CARGO_PKG_VERSION")}
                }),
            ),
            "ping" => ok(&id, json!({})),
            "tools/list" => ok(&id, json!({"tools": server_tools()})),
            "tools/call" => {
                let name = params.get("name").and_then(Value::as_str).unwrap_or("");
                let args = params.get("arguments").cloned().unwrap_or(json!({}));
                match call_tool(agent, name, &args).await {
                    Ok(text) => ok(&id, text_result(text)),
                    Err(e) => ok(
                        &id,
                        json!({
                            "content": [{"type": "text", "text": format!("error: {e}")}],
                            "isError": true
                        }),
                    ),
                }
            }
            other => err(&id, -32601, &format!("method not found: {other}")),
        };
        let mut s = serde_json::to_string(&response)?;
        s.push('\n');
        out.write_all(s.as_bytes()).await?;
        out.flush().await?;
    }
    Ok(())
}
