//! Minimal MCP client: spawns stdio JSON-RPC servers from a config file,
//! performs the initialize handshake, lists tools, and routes tools/call.

use anyhow::{anyhow, bail, Context, Result};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::{oneshot, Mutex};

#[derive(Debug, Clone)]
pub struct McpTool {
    /// Exposed name (`<server>__<tool>`), safe for LLM tool schemas.
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

struct Pending {
    map: Mutex<HashMap<u64, oneshot::Sender<Value>>>,
}

struct Server {
    name: String,
    stdin: Mutex<ChildStdin>,
    pending: Arc<Pending>,
    _child: Child,
}

pub struct McpManager {
    servers: Vec<Server>,
    /// Sink feeding server->client notifications
    /// (server name, raw JSON-RPC message) to `notify_rx`.
    /// Keeps the notification channel alive for spawned readers.
    _notify_tx: tokio::sync::mpsc::UnboundedSender<(String, Value)>,
    notify_rx: std::sync::Mutex<Option<tokio::sync::mpsc::UnboundedReceiver<(String, Value)>>>,
    /// exposed name -> (server index, original tool name)
    routes: HashMap<String, (usize, String)>,
    pub tools: Vec<McpTool>,
}

#[derive(serde::Deserialize)]
struct ServerConfig {
    command: String,
    #[serde(default)]
    args: Vec<String>,
    #[serde(default)]
    env: HashMap<String, String>,
    #[serde(default)]
    cwd: Option<String>,
}

#[derive(serde::Deserialize)]
struct Config {
    #[serde(rename = "mcpServers")]
    mcp_servers: HashMap<String, ServerConfig>,
    /// Optional allowlist of exposed tool names (same pattern syntax as
    /// --allow: exact or trailing `*`). When present, only matches are kept.
    #[serde(rename = "enabledTools", default)]
    enabled_tools: Vec<String>,
    /// Optional denylist of exposed tool names.
    #[serde(rename = "disabledTools", default)]
    disabled_tools: Vec<String>,
}

impl McpManager {
    /// Load `{"mcpServers": {...}}` (standard MCP config shape) and connect.
    pub async fn connect(config_path: &Path) -> Result<Self> {
        let text = tokio::fs::read_to_string(config_path)
            .await
            .with_context(|| format!("cannot read {}", config_path.display()))?;
        let config: Config = serde_json::from_str(&text).context("invalid MCP config JSON")?;
        if config.mcp_servers.is_empty() {
            bail!("no mcpServers defined in {}", config_path.display());
        }

        let mut servers = Vec::new();
        let mut entries: Vec<(McpTool, (usize, String))> = Vec::new();
        let (notify_tx, notify_rx) = tokio::sync::mpsc::unbounded_channel();

        for (name, cfg) in &config.mcp_servers {
            let server = spawn_server(name, cfg, notify_tx.clone()).await?;
            let idx = servers.len();

            // initialize handshake
            let init = server
                .request(
                    "initialize",
                    json!({
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": "harness", "version": env!("CARGO_PKG_VERSION")}
                    }),
                )
                .await?;
            let _ = init;
            server
                .notify("notifications/initialized", json!({}))
                .await?;

            // tools/list
            let listed = server.request("tools/list", json!({})).await?;
            let list = listed
                .get("tools")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let count = list.len();
            for tool in &list {
                let tool_name = tool
                    .get("name")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                if tool_name.is_empty() {
                    continue;
                }
                let exposed = format!("{name}__{tool_name}");
                let mt = McpTool {
                    name: exposed.clone(),
                    description: tool
                        .get("description")
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .to_string(),
                    input_schema: tool
                        .get("inputSchema")
                        .cloned()
                        .unwrap_or_else(|| json!({"type": "object", "properties": {}})),
                };
                entries.push((mt, (idx, tool_name)));
            }
            eprintln!("[hieudoanm] {}: {} tool(s)", name, count);
            servers.push(server);
        }

        // Apply optional enabledTools/disabledTools filters.
        let visible = |name: &str| {
            (config.enabled_tools.is_empty()
                || crate::permissions::matches_any(&config.enabled_tools, name))
                && !crate::permissions::matches_any(&config.disabled_tools, name)
        };
        let mut routes = HashMap::new();
        let mut tools = Vec::new();
        for (tool, route) in entries {
            if visible(&tool.name) {
                routes.insert(tool.name.clone(), route);
                tools.push(tool);
            }
        }

        Ok(Self {
            servers,
            _notify_tx: notify_tx,
            notify_rx: std::sync::Mutex::new(Some(notify_rx)),
            routes,
            tools,
        })
    }

    /// Take the notification receiver (once). Yields
    /// `(server_name, jsonrpc_message)` for server notifications such as
    /// `notifications/message`.
    pub fn take_notifications(
        &self,
    ) -> Option<tokio::sync::mpsc::UnboundedReceiver<(String, Value)>> {
        self.notify_rx.lock().unwrap().take()
    }

    pub fn tools(&self) -> &[McpTool] {
        &self.tools
    }

    pub fn tool_schemas(&self) -> Vec<Value> {
        self.tools
            .iter()
            .map(|t| {
                json!({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.input_schema,
                    }
                })
            })
            .collect()
    }

    /// Call an MCP tool by its exposed (`server__tool`) name.
    /// Returns the text content of the first content item.
    pub async fn call(&self, exposed_name: &str, arguments: Value) -> Result<String> {
        let (idx, tool) = self
            .routes
            .get(exposed_name)
            .ok_or_else(|| anyhow!("unknown tool: {exposed_name}"))?;
        let result = self.servers[*idx]
            .request("tools/call", json!({"name": tool, "arguments": arguments}))
            .await?;
        extract_text(&result)
    }
}

fn extract_text(result: &Value) -> Result<String> {
    if let Some(err) = result.get("isError").and_then(Value::as_bool) {
        if err {
            let text = result
                .get("content")
                .and_then(Value::as_array)
                .and_then(|c| c.first())
                .and_then(|c| c.get("text"))
                .and_then(Value::as_str)
                .unwrap_or("tool error");
            bail!("{text}");
        }
    }
    let content = result
        .get("content")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut out = String::new();
    for item in content {
        if let Some(text) = item.get("text").and_then(Value::as_str) {
            if !out.is_empty() {
                out.push('\n');
            }
            out.push_str(text);
        }
    }
    if out.is_empty() {
        Ok(serde_json::to_string(result).unwrap_or_default())
    } else {
        Ok(out)
    }
}

async fn spawn_server(
    name: &str,
    cfg: &ServerConfig,
    notify_tx: tokio::sync::mpsc::UnboundedSender<(String, Value)>,
) -> Result<Server> {
    let mut command = Command::new(&cfg.command);
    command
        .args(&cfg.args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .envs(&cfg.env)
        .kill_on_drop(true);
    if let Some(cwd) = &cfg.cwd {
        command.current_dir(cwd);
    }
    let mut child = command
        .spawn()
        .with_context(|| format!("failed to spawn MCP server '{name}': {}", cfg.command))?;
    let stdin = child.stdin.take().context("no stdin")?;
    let stdout = child.stdout.take().context("no stdout")?;

    let pending = Arc::new(Pending {
        map: Mutex::new(HashMap::new()),
    });

    // reader task: route responses to pending requests, forward
    // notifications (messages without an id) to the notify channel
    {
        let pending = Arc::clone(&pending);
        let server_name = name.to_string();
        tokio::spawn(async move {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let Ok(msg) = serde_json::from_str::<Value>(&line) else {
                    continue;
                };
                if msg.get("id").is_none() {
                    let _ = notify_tx.send((server_name.clone(), msg));
                    continue;
                }
                let Some(id) = msg.get("id").and_then(Value::as_u64) else {
                    continue;
                };
                if let Some(tx) = pending.map.lock().await.remove(&id) {
                    let _ = tx.send(msg);
                }
            }
        });
    }

    Ok(Server {
        name: name.to_string(),
        stdin: Mutex::new(stdin),
        pending,
        _child: child,
    })
}

impl Server {
    async fn request(&self, method: &str, params: Value) -> Result<Value> {
        let id = NEXT_ID.fetch_add(1, Ordering::SeqCst);
        let (tx, rx) = oneshot::channel();
        self.pending.map.lock().await.insert(id, tx);

        let msg = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": method,
            "params": params,
        });
        let mut line = serde_json::to_string(&msg)?;
        line.push('\n');
        {
            let mut stdin = self.stdin.lock().await;
            stdin.write_all(line.as_bytes()).await?;
            stdin.flush().await?;
        }

        let response = tokio::time::timeout(Duration::from_secs(600), rx)
            .await
            .map_err(|_| anyhow!("MCP request '{method}' timed out"))?
            .map_err(|_| anyhow!("MCP server '{}' closed", self.name))?;

        if let Some(err) = response.get("error") {
            bail!(
                "MCP error from '{}': {}",
                self.name,
                err.get("message").and_then(Value::as_str).unwrap_or("?")
            );
        }
        Ok(response.get("result").cloned().unwrap_or(Value::Null))
    }

    async fn notify(&self, method: &str, params: Value) -> Result<()> {
        let msg = json!({"jsonrpc": "2.0", "method": method, "params": params});
        let mut line = serde_json::to_string(&msg)?;
        line.push('\n');
        let mut stdin = self.stdin.lock().await;
        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;
        Ok(())
    }
}

static NEXT_ID: AtomicU64 = AtomicU64::new(1);
