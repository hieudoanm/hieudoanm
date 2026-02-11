//! `harness serve` — expose the agent loop as an MCP server over stdio.
//!
//! Tools: `ask` (run a prompt through the agent), `clear`, `list_tools`,
//! `status`. Runs headless: tool permissions are non-interactive, so only
//! `--allow`/`--deny`/config patterns apply (asks are denied).

use crate::agent::Agent;
use anyhow::Result;
use serde_json::{json, Value};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

/// The newest MCP revision this server implements.
const PROTOCOL_VERSION: &str = "2025-11-25";

/// Revisions this server can negotiate down to.
const SUPPORTED_VERSIONS: &[&str] = &["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

fn server_tools() -> Value {
    json!([
        {
            "name": "ask",
            "title": "Ask Agent",
            "description": "Ask the harness agent. It can use all configured MCP tools and returns the final answer.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "The user's question or task"}
                },
                "required": ["prompt"]
            },
            // The agent can invoke arbitrary MCP tools — including ones that
            // reach the network or mutate state — so this is neither a pure
            // read nor guaranteed idempotent.
            "annotations": {
                "readOnlyHint": false,
                "destructiveHint": false,
                "idempotentHint": false,
                "openWorldHint": true
            }
        },
        {
            "name": "clear",
            "title": "Clear History",
            "description": "Clear the agent's conversation history.",
            "inputSchema": {"type": "object", "properties": {}},
            // Irreversibly drops conversation state; repeating is harmless.
            "annotations": {
                "readOnlyHint": false,
                "destructiveHint": true,
                "idempotentHint": true,
                "openWorldHint": false
            }
        },
        {
            "name": "list_tools",
            "title": "List Tools",
            "description": "List the MCP tools available to the agent.",
            "inputSchema": {"type": "object", "properties": {}},
            "annotations": {
                "readOnlyHint": true,
                "destructiveHint": false,
                "idempotentHint": true,
                "openWorldHint": false
            }
        },
        {
            "name": "status",
            "title": "Agent Status",
            "description": "Show agent status: LLM provider, model, and tool count.",
            "inputSchema": {"type": "object", "properties": {}},
            "annotations": {
                "readOnlyHint": true,
                "destructiveHint": false,
                "idempotentHint": true,
                "openWorldHint": false
            }
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
        if let Some(response) = handle(agent, &req).await {
            let mut s = serde_json::to_string(&response)?;
            s.push('\n');
            out.write_all(s.as_bytes()).await?;
            out.flush().await?;
        }
    }
    Ok(())
}

/// Dispatch one JSON-RPC request, returning the response or `None` for
/// notifications. Shared by the stdio loop and the HTTP transport.
async fn handle(agent: &mut Agent, req: &Value) -> Option<Value> {
    let id = req.get("id")?.clone();
    if id.is_null() {
        return None;
    }
    let method = req.get("method").and_then(Value::as_str).unwrap_or("");
    let params = req.get("params").cloned().unwrap_or(json!({}));

    Some(match method {
        "initialize" => {
            let requested = params.get("protocolVersion").and_then(Value::as_str);
            let version = requested
                .filter(|v| SUPPORTED_VERSIONS.contains(v))
                .unwrap_or(PROTOCOL_VERSION);
            ok(
                &id,
                json!({
                    "protocolVersion": version,
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "harness", "version": env!("CARGO_PKG_VERSION")}
                }),
            )
        }
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
    })
}

const MAX_HEADER_BYTES: usize = 64 * 1024;
const MAX_BODY_BYTES: usize = 8 * 1024 * 1024;

/// Run the MCP server over streamable HTTP on `addr` until the process exits.
/// `POST /mcp` carries one JSON-RPC message; notifications get `202`.
/// Requests are handled sequentially because the agent is not `Sync`.
/// When `token` is set, requests must carry `Authorization: Bearer <token>`.
pub async fn serve_http(agent: &mut Agent, addr: &str, token: Option<String>) -> Result<()> {
    agent.set_quiet(true);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    eprintln!("[harness] streamable-http listening on http://{addr}/mcp");
    loop {
        let (mut stream, _) = listener.accept().await?;
        let token = token.clone();
        // Sequential handling: the agent holds non-Send MCP child processes,
        // so each connection is served on this task before the next accept.
        let _ = handle_conn(&mut stream, agent, token.as_deref()).await;
    }
}

async fn handle_conn(
    stream: &mut tokio::net::TcpStream,
    agent: &mut Agent,
    token: Option<&str>,
) -> Result<()> {
    use tokio::io::AsyncReadExt;

    let mut buf = Vec::new();
    let header_end = loop {
        let mut chunk = [0u8; 8192];
        let n = stream.read(&mut chunk).await?;
        if n == 0 {
            return Ok(());
        }
        buf.extend_from_slice(&chunk[..n]);
        if buf.len() > MAX_HEADER_BYTES {
            return respond(stream, 431, "request headers too large").await;
        }
        if let Some(pos) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
            break pos + 4;
        }
    };

    let head = String::from_utf8_lossy(&buf[..header_end]).into_owned();
    let mut lines = head.lines();
    let request_line = lines.next().unwrap_or("");
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let path = parts.next().unwrap_or("");

    let mut content_length = 0usize;
    let mut authorized = token.is_none();
    for line in lines {
        let line = line.trim_end_matches('\r');
        if let Some((name, value)) = line.split_once(':') {
            match name.trim().to_ascii_lowercase().as_str() {
                "content-length" => content_length = value.trim().parse().unwrap_or(0),
                "authorization" => {
                    if let Some(expected) = token {
                        authorized = value.trim() == format!("Bearer {expected}");
                    }
                }
                _ => {}
            }
        }
    }

    if !authorized {
        drain_body(stream, &mut buf, header_end, content_length).await?;
        return respond_json(stream, 401, br#"{"error":"unauthorized"}"#).await;
    }
    if path != "/mcp" {
        drain_body(stream, &mut buf, header_end, content_length).await?;
        return respond_json(stream, 404, br#"{"error":"not found"}"#).await;
    }
    if method != "POST" {
        drain_body(stream, &mut buf, header_end, content_length).await?;
        return respond_json(stream, 405, br#"{"error":"method not allowed"}"#).await;
    }
    if content_length > MAX_BODY_BYTES {
        return respond_json(stream, 413, br#"{"error":"body too large"}"#).await;
    }

    drain_body(stream, &mut buf, header_end, content_length).await?;
    let end = (header_end + content_length).min(buf.len());
    let body_str = String::from_utf8_lossy(&buf[header_end..end]).into_owned();

    if body_str.trim_start().starts_with('[') {
        let msg = br#"{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"batch requests are not supported"}}"#;
        return respond_raw(stream, 400, "application/json", msg).await;
    }

    let parsed = serde_json::from_str::<Value>(&body_str).ok();
    let reply = match parsed {
        Some(req) => handle(agent, &req).await,
        None => Some(err(&Value::Null, -32700, "parse error: invalid JSON")),
    };
    match reply {
        Some(response) => {
            let body = serde_json::to_vec(&response)?;
            respond_raw(stream, 200, "application/json", &body).await
        }
        None => respond_raw(stream, 202, "application/json", b"").await,
    }
}

/// Read and discard the request body (bounded by `MAX_BODY_BYTES`) so the
/// socket has no unread bytes when it closes early — otherwise the kernel
/// sends RST and the client can lose the response.
async fn drain_body(
    stream: &mut tokio::net::TcpStream,
    buf: &mut Vec<u8>,
    header_end: usize,
    content_length: usize,
) -> Result<()> {
    use tokio::io::AsyncReadExt;
    let want = header_end + content_length.min(MAX_BODY_BYTES);
    while buf.len() < want {
        let mut chunk = [0u8; 8192];
        let n = stream.read(&mut chunk).await?;
        if n == 0 {
            break;
        }
        buf.extend_from_slice(&chunk[..n]);
    }
    Ok(())
}

async fn respond(stream: &mut tokio::net::TcpStream, status: u16, message: &str) -> Result<()> {
    respond_raw(stream, status, "text/plain", message.as_bytes()).await
}

async fn respond_json(stream: &mut tokio::net::TcpStream, status: u16, body: &[u8]) -> Result<()> {
    respond_raw(stream, status, "application/json", body).await
}

async fn respond_raw(
    stream: &mut tokio::net::TcpStream,
    status: u16,
    content_type: &str,
    body: &[u8],
) -> Result<()> {
    let reason = match status {
        200 => "OK",
        202 => "Accepted",
        400 => "Bad Request",
        401 => "Unauthorized",
        404 => "Not Found",
        405 => "Method Not Allowed",
        413 => "Payload Too Large",
        431 => "Request Header Fields Too Large",
        _ => "Error",
    };
    let head = format!(
        "HTTP/1.1 {status} {reason}\r\ncontent-type: {content_type}\r\ncontent-length: {}\r\nconnection: close\r\n\r\n",
        body.len()
    );
    stream.write_all(head.as_bytes()).await?;
    stream.write_all(body).await?;
    stream.flush().await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every advertised tool must declare all four MCP hints as booleans —
    /// clients that rely on them reject listings where any hint is missing.
    #[test]
    fn every_tool_declares_all_four_hints() {
        let tools = server_tools();
        let tools = tools.as_array().expect("tools array");
        assert_eq!(tools.len(), 4);
        for tool in tools {
            let name = tool["name"].as_str().expect("tool name");
            let annotations = &tool["annotations"];
            for hint in [
                "readOnlyHint",
                "destructiveHint",
                "idempotentHint",
                "openWorldHint",
            ] {
                assert!(
                    annotations.get(hint).is_some_and(|v| v.is_boolean()),
                    "{name} missing boolean hint {hint}: {annotations}"
                );
            }
        }
    }

    /// The hint values must match each tool's real behaviour.
    #[test]
    fn tools_declare_expected_hints() {
        let tools = server_tools();
        let expected = json!([
            {
                "name": "ask",
                "annotations": {
                    "readOnlyHint": false,
                    "destructiveHint": false,
                    "idempotentHint": false,
                    "openWorldHint": true
                }
            },
            {
                "name": "clear",
                "annotations": {
                    "readOnlyHint": false,
                    "destructiveHint": true,
                    "idempotentHint": true,
                    "openWorldHint": false
                }
            },
            {
                "name": "list_tools",
                "annotations": {
                    "readOnlyHint": true,
                    "destructiveHint": false,
                    "idempotentHint": true,
                    "openWorldHint": false
                }
            },
            {
                "name": "status",
                "annotations": {
                    "readOnlyHint": true,
                    "destructiveHint": false,
                    "idempotentHint": true,
                    "openWorldHint": false
                }
            }
        ]);
        for expected_tool in expected.as_array().expect("expected array") {
            let name = expected_tool["name"].as_str().expect("name");
            let tool = tools
                .as_array()
                .expect("tools array")
                .iter()
                .find(|tool| tool["name"] == name)
                .unwrap_or_else(|| panic!("{name} missing"));
            assert_eq!(
                tool["annotations"], expected_tool["annotations"],
                "{name} annotations"
            );
        }
    }
}
