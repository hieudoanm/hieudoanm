use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

const PROTOCOL_VERSION: &str = "2025-11-25";
const MAX_READ: usize = 2 * 1024 * 1024;
const MAX_OUTPUT: usize = 256 * 1024;
const DEFAULT_TIMEOUT: u64 = 120;
const MAX_TIMEOUT: u64 = 600;

fn tools_list() -> Value {
    json!([
        {"name": "fs_read", "title": "Read File",
         "description": "Read a UTF-8 text file. Returns content (capped at 2 MiB).",
         "inputSchema": {"type": "object", "properties": {
             "path": {"type": "string", "description": "Absolute or relative file path"},
             "offset": {"type": "integer", "description": "Byte offset to start reading"},
             "limit": {"type": "integer", "description": "Max bytes to return"}
         }, "required": ["path"]},
         "annotations": {"readOnlyHint": true, "destructiveHint": false, "idempotentHint": true, "openWorldHint": false}},
        {"name": "fs_write", "title": "Write File",
         "description": "Write content to a file, creating parent directories as needed. Overwrites existing files.",
         "inputSchema": {"type": "object", "properties": {
             "path": {"type": "string"},
             "content": {"type": "string"}
         }, "required": ["path", "content"]},
         "annotations": {"readOnlyHint": false, "destructiveHint": true, "idempotentHint": true, "openWorldHint": false}},
        {"name": "fs_list", "title": "List Directory",
         "description": "List entries in a directory (name, type, size).",
         "inputSchema": {"type": "object", "properties": {
             "path": {"type": "string"}
         }, "required": ["path"]},
         "annotations": {"readOnlyHint": true, "destructiveHint": false, "idempotentHint": true, "openWorldHint": false}},
        {"name": "run_command", "title": "Run Command",
         "description": "Run a shell command. Returns exit code, stdout and stderr (each capped at 256 KiB).",
         "inputSchema": {"type": "object", "properties": {
             "command": {"type": "string", "description": "Shell command line (run via sh -c)"},
             "cwd": {"type": "string", "description": "Working directory"},
             "timeout_secs": {"type": "integer", "description": "Timeout in seconds (default 120, max 600)"}
         }, "required": ["command"]},
         "annotations": {"readOnlyHint": false, "destructiveHint": true, "idempotentHint": false, "openWorldHint": true}}
    ])
}

fn ok(id: &Value, result: Value) -> Value {
    json!({"jsonrpc": "2.0", "id": id, "result": result})
}

fn err(id: &Value, code: i64, message: &str) -> Value {
    json!({"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}})
}

fn tool_text(id: &Value, text: String, is_error: bool) -> Value {
    json!({"jsonrpc": "2.0", "id": id, "result": {
        "content": [{"type": "text", "text": text}],
        "isError": is_error
    }})
}

fn cap(s: String) -> String {
    if s.len() > MAX_OUTPUT {
        format!(
            "{}\n... [truncated at {} bytes]",
            &s[..MAX_OUTPUT],
            MAX_OUTPUT
        )
    } else {
        s
    }
}

fn call_tool(name: &str, args: &Value) -> Result<Value, String> {
    let text = match name {
        "fs_read" => {
            let path = args["path"].as_str().ok_or("missing path")?;
            let data = std::fs::read(path).map_err(|e| format!("{path}: {e}"))?;
            if data.len() > MAX_READ {
                return Err(format!(
                    "{path}: file too large ({} bytes, max {MAX_READ})",
                    data.len()
                ));
            }
            let mut offset = args["offset"].as_u64().unwrap_or(0) as usize;
            let limit = args["limit"].as_u64().unwrap_or(MAX_READ as u64) as usize;
            offset = offset.min(data.len());
            let end = (offset + limit).min(data.len());
            let slice = &data[offset..end];
            let content = String::from_utf8_lossy(slice);
            json!({"path": path, "offset": offset, "length": slice.len(),
                   "content": content})
            .to_string()
        }
        "fs_write" => {
            let path = args["path"].as_str().ok_or("missing path")?;
            let content = args["content"].as_str().ok_or("missing content")?;
            if let Some(parent) = Path::new(path).parent() {
                if !parent.as_os_str().is_empty() {
                    std::fs::create_dir_all(parent).map_err(|e| format!("{parent:?}: {e}"))?;
                }
            }
            std::fs::write(path, content).map_err(|e| format!("{path}: {e}"))?;
            format!("wrote {} bytes to {path}", content.len())
        }
        "fs_list" => {
            let path = args["path"].as_str().ok_or("missing path")?;
            let mut entries = Vec::new();
            for e in std::fs::read_dir(path).map_err(|e| format!("{path}: {e}"))? {
                let e = e.map_err(|e| e.to_string())?;
                let meta = e.metadata().ok();
                entries.push(json!({
                    "name": e.file_name().to_string_lossy(),
                    "dir": meta.as_ref().map(|m| m.is_dir()).unwrap_or(false),
                    "size": meta.as_ref().map(|m| m.len()).unwrap_or(0)
                }));
            }
            entries.sort_by_key(|v| v["name"].as_str().unwrap_or("").to_string());
            json!({"path": path, "entries": entries}).to_string()
        }
        "run_command" => {
            let command = args["command"].as_str().ok_or("missing command")?;
            let timeout = args["timeout_secs"]
                .as_u64()
                .unwrap_or(DEFAULT_TIMEOUT)
                .clamp(1, MAX_TIMEOUT);
            let mut cmd = Command::new("sh");
            cmd.arg("-c")
                .arg(command)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());
            if let Some(cwd) = args["cwd"].as_str() {
                cmd.current_dir(cwd);
            }
            let mut child = cmd.spawn().map_err(|e| format!("spawn: {e}"))?;
            let start = Instant::now();
            let status = loop {
                match child.try_wait().map_err(|e| e.to_string())? {
                    Some(s) => break Some(s),
                    None if start.elapsed() > Duration::from_secs(timeout) => {
                        let _ = child.kill();
                        let _ = child.wait();
                        break None;
                    }
                    None => std::thread::sleep(Duration::from_millis(50)),
                }
            };
            let out = child.wait_with_output().map_err(|e| e.to_string())?;
            let stdout = cap(String::from_utf8_lossy(&out.stdout).into_owned());
            let stderr = cap(String::from_utf8_lossy(&out.stderr).into_owned());
            match status {
                Some(s) => json!({
                    "exit_code": s.code(),
                    "timed_out": false,
                    "elapsed_ms": start.elapsed().as_millis(),
                    "stdout": stdout, "stderr": stderr
                })
                .to_string(),
                None => json!({
                    "exit_code": null, "timed_out": true,
                    "stdout": stdout, "stderr": stderr
                })
                .to_string(),
            }
        }
        other => return Err(format!("unknown tool: {other}")),
    };
    Ok(json!({"content": [{"type": "text", "text": text}], "isError": false}))
}

fn handle(msg: &Value) -> Option<Value> {
    let method = msg["method"].as_str()?;
    let id = msg.get("id").cloned();
    let id = match id {
        Some(v) if !v.is_null() => v,
        _ => return None, // notification: never respond
    };
    match method {
        "initialize" => Some(ok(
            &id,
            json!({
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": false}},
                "serverInfo": {"name": "hieudoanm-tools", "version": env!("CARGO_PKG_VERSION")}
            }),
        )),
        "ping" => Some(ok(&id, json!({}))),
        "tools/list" => Some(ok(&id, json!({"tools": tools_list()}))),
        "tools/call" => {
            let params = &msg["params"];
            let name = params["name"].as_str().unwrap_or("");
            let args = params.get("arguments").cloned().unwrap_or(json!({}));
            match call_tool(name, &args) {
                Ok(result) => Some(ok(&id, result)),
                Err(e) => Some(tool_text(&id, e, true)),
            }
        }
        _ => Some(err(&id, -32601, &format!("method not found: {method}"))),
    }
}

fn main() {
    let stdin = std::io::stdin();
    let mut out = std::io::stdout();
    for line in BufReader::new(stdin.lock()).lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };
        if line.trim().is_empty() {
            continue;
        }
        let msg: Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(e) => {
                let resp = err(&Value::Null, -32700, &format!("parse error: {e}"));
                let _ = writeln!(out, "{resp}");
                let _ = out.flush();
                continue;
            }
        };
        if let Some(resp) = handle(&msg) {
            let _ = writeln!(out, "{resp}");
            let _ = out.flush();
        }
    }
}
