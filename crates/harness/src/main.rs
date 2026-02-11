//! harness — a minimal agent harness.
//!
//! Connects to MCP servers described by a `{"mcpServers": {...}}` config,
//! exposes their tools to an OpenAI-compatible chat model, and runs the
//! agent loop (prompt -> tool calls -> results -> answer).
//!
//! Env: LLM_BASE_URL (default https://api.openai.com/v1), LLM_API_KEY,
//! LLM_MODEL (default gpt-4o-mini).

mod agent;
mod config;
mod eval;
mod llm;
mod mcp;
mod permissions;
mod serve;
mod tui;

use agent::Agent;
use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use permissions::{AskMode, Permissions};
use std::io::Write;
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "hieudoanm",
    version,
    about = "Agent harness over MCP tools and an LLM"
)]
struct Cli {
    /// Path to MCP config JSON ({"mcpServers": {...}}).
    /// Defaults to ./mcp.json then ~/.config/harness/mcp.json
    #[arg(long, global = true)]
    config: Option<PathBuf>,

    /// Maximum tool-call rounds per turn (default: 12)
    #[arg(long, global = true, default_value_t = 12)]
    max_rounds: usize,

    /// Allow a tool without asking (repeatable; supports trailing `*`)
    #[arg(long = "allow", global = true)]
    allow: Vec<String>,

    /// Deny a tool (repeatable; supports trailing `*`)
    #[arg(long = "deny", global = true)]
    deny: Vec<String>,

    /// Session file: load history on start, save after every turn.
    /// If a directory, a timestamped file is created inside it.
    #[arg(long, global = true)]
    session: Option<PathBuf>,

    /// Config profile name (harness.json / ~/.config/harness/config.json)
    #[arg(long, global = true)]
    profile: Option<String>,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Clone)]
enum Commands {
    /// Run a single prompt and print the answer
    Run {
        /// The prompt
        prompt: String,
    },
    /// Interactive REPL (type 'exit' or Ctrl-D to quit)
    Repl,
    /// List tools discovered from MCP servers
    Tools,
    /// Expose the agent itself as an MCP server (stdio, or --http for streamable HTTP)
    Serve {
        /// Serve over streamable HTTP on this address instead of stdio
        #[arg(long)]
        http: Option<String>,
        /// Bearer token required on HTTP requests (or MCP_AUTH_TOKEN)
        #[arg(long)]
        token: Option<String>,
    },
    /// Interactive Ratatui chat interface
    Tui,
    /// Print a ready-to-paste MCP client config for `harness serve`
    Init {
        /// Write the config to this path instead of stdout
        #[arg(long)]
        output: Option<PathBuf>,
    },
    /// Run eval cases from a JSON/JSONL file ('-' for stdin)
    Eval {
        /// Cases file
        file: PathBuf,
        /// Emit machine-readable JSON results instead of TAP output
        #[arg(long)]
        json: bool,
        /// Only run cases whose name or prompt contains this text
        #[arg(long)]
        filter: Option<String>,
    },
    /// Manage saved sessions (list/rm/rename)
    Sessions {
        #[command(subcommand)]
        action: Option<SessionAction>,
        /// Directory to scan for `list` (default: ~/.local/share/harness/sessions)
        dir: Option<PathBuf>,
        /// Only show sessions whose name or preview contains this text
        #[arg(long)]
        search: Option<String>,
    },
    /// Check LLM env vars, config files, and MCP server connectivity
    Doctor,
    /// Call an MCP tool directly: `harness call fdr__stats '{}'`
    Call {
        /// Exposed tool name (`<server>__<tool>`)
        tool: String,
        /// JSON arguments object (default: {})
        #[arg(default_value = "{}")]
        args: String,
    },
}

#[derive(Subcommand, Clone)]
enum SessionAction {
    /// Delete a session file
    Rm {
        /// Session file path
        file: PathBuf,
    },
    /// Delete session files older than N days
    Prune {
        /// Age threshold in days
        days: f64,
    },
    /// Rename a session file to <name>.json in the same directory
    Rename {
        /// Session file path
        file: PathBuf,
        /// New session name (sanitized to [a-zA-Z0-9_-])
        name: String,
    },
}

fn default_config() -> Option<PathBuf> {
    let cwd = PathBuf::from("mcp.json");
    if cwd.is_file() {
        return Some(cwd);
    }
    std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config/harness/mcp.json"))
}

async fn connect(config: Option<PathBuf>) -> Result<mcp::McpManager> {
    let path = config
        .or_else(default_config)
        .context("no MCP config found; pass --config or create mcp.json")?;
    if !path.is_file() {
        anyhow::bail!("MCP config not found: {}", path.display());
    }
    mcp::McpManager::connect(&path).await
}

fn print_delta(text: &str) {
    print!("{text}");
    let _ = std::io::stdout().flush();
}

async fn save_session(path: &PathBuf, messages: &[serde_json::Value]) -> Result<()> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    let json = serde_json::to_string(messages)?;
    tokio::fs::write(path, json).await?;
    Ok(())
}

async fn load_session(path: &PathBuf) -> Result<Vec<serde_json::Value>> {
    let text = tokio::fs::read_to_string(path).await?;
    Ok(serde_json::from_str(&text)?)
}

fn sessions_dir() -> PathBuf {
    std::env::var_os("HOME")
        .map(|h| PathBuf::from(h).join(".local/share/harness/sessions"))
        .unwrap_or_else(|| PathBuf::from("sessions"))
}

fn list_sessions(dir: &PathBuf, search: Option<&str>) -> Result<()> {
    let mut entries: Vec<(String, String)> = Vec::new();
    if dir.is_dir() {
        for e in std::fs::read_dir(dir)? {
            let e = e?;
            let p = e.path();
            if p.extension().and_then(|x| x.to_str()) != Some("json") {
                continue;
            }
            let meta = e.metadata()?;
            let mtime = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            // first user message as preview
            let preview = std::fs::read_to_string(&p)
                .ok()
                .and_then(|text| serde_json::from_str::<Vec<serde_json::Value>>(&text).ok())
                .and_then(|msgs| {
                    msgs.iter()
                        .find(|m| m.get("role").and_then(|r| r.as_str()) == Some("user"))
                        .and_then(|m| {
                            m.get("content")
                                .and_then(|c| c.as_str())
                                .map(str::to_string)
                        })
                })
                .unwrap_or_default()
                .chars()
                .take(60)
                .collect::<String>();
            let name = format!(
                "{} ({mtime})",
                p.file_name().unwrap_or_default().to_string_lossy()
            );
            if let Some(q) = search {
                let q = q.to_lowercase();
                if !name.to_lowercase().contains(&q) && !preview.to_lowercase().contains(&q) {
                    continue;
                }
            }
            entries.push((name, preview));
        }
    }
    entries.sort();
    for (name, preview) in entries {
        println!("{name}	{preview}");
    }
    Ok(())
}

/// Load harness.json profile (if any) and merge into CLI opts.
fn apply_profile(cli: &mut Cli) -> Result<()> {
    let Some(hcfg) = config::HarnessConfig::load(cli.profile.as_deref())? else {
        return Ok(());
    };
    let name = hcfg
        .active_profile(cli.profile.as_deref())
        .map(str::to_string);
    let Some(name) = name else {
        return Ok(());
    };
    let (mcp_config, allow, deny) = hcfg.apply(&name)?;
    if cli.config.is_none() {
        if let Some(p) = mcp_config {
            cli.config = Some(PathBuf::from(expand_tilde(&p)));
        }
    }
    cli.allow.extend(allow);
    cli.deny.extend(deny);
    eprintln!("[hieudoanm] profile '{name}' applied");
    Ok(())
}

fn expand_tilde(path: &str) -> String {
    if let Some(rest) = path.strip_prefix("~/") {
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home).join(rest).to_string_lossy().to_string();
        }
    }
    path.to_string()
}

#[tokio::main]
async fn main() -> Result<()> {
    let mut cli = Cli::parse();
    apply_profile(&mut cli)?;
    // Merge persisted "always allow" grants.
    if let Some(grants) = load_permission_grants() {
        cli.allow.extend(grants);
    }
    if let Some(s) = &cli.session {
        // Treat as a sessions directory when it exists as one, or when
        // the path doesn't exist and doesn't look like a .json file.
        let is_dir =
            s.is_dir() || (!s.exists() && s.extension().and_then(|e| e.to_str()) != Some("json"));
        if is_dir {
            let name = format!(
                "session-{}.json",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0)
            );
            cli.session = Some(s.join(name));
        }
    }
    let command = cli.command.clone().unwrap_or(Commands::Repl);

    match command {
        Commands::Tools => {
            let mcp = connect(cli.config.clone()).await?;
            for tool in &mcp.tools {
                println!("{}\t{}", tool.name, tool.description);
            }
            Ok(())
        }
        Commands::Call { tool, args } => {
            let mcp = connect(cli.config.clone()).await?;
            let arguments: serde_json::Value =
                serde_json::from_str(&args).context("args must be a JSON object")?;
            let result = mcp.call(&tool, arguments).await?;
            println!("{result}");
            Ok(())
        }
        Commands::Init { output } => {
            let exe = std::env::current_exe()?;
            let config_path = cli
                .config
                .clone()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| "mcp.json".to_string());
            let snippet = serde_json::json!({
                "mcpServers": {
                    "hieudoanm": {
                        "command": exe.to_string_lossy(),
                        "args": ["serve", "--config", config_path],
                    }
                }
            });
            let text = serde_json::to_string_pretty(&snippet)?;
            match output {
                Some(path) => {
                    tokio::fs::write(&path, format!("{text}\n")).await?;
                    eprintln!("wrote {}", path.display());
                }
                None => println!("{text}"),
            }
            Ok(())
        }
        Commands::Eval { file, json, filter } => {
            let mcp = connect(cli.config.clone()).await?;
            let llm = llm::LlmClient::from_env()?;
            let permissions =
                Permissions::new(vec!["*".into()], cli.deny.clone(), AskMode::AutoDeny);
            let mut agent = Agent::new(llm, mcp, permissions, cli.max_rounds);
            let code = eval::run_eval(&mut agent, &file, cli.deny.clone(), json, filter.as_deref())
                .await?;
            std::process::exit(code);
        }
        Commands::Sessions {
            action,
            dir,
            search,
        } => match action {
            Some(SessionAction::Rm { file }) => {
                if file.extension().and_then(|e| e.to_str()) != Some("json") {
                    anyhow::bail!("not a session file: {}", file.display());
                }
                tokio::fs::remove_file(&file).await?;
                println!("removed {}", file.display());
                Ok(())
            }
            Some(SessionAction::Rename { file, name }) => {
                let clean: String = name
                    .chars()
                    .map(|c| {
                        if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                            c
                        } else {
                            '-'
                        }
                    })
                    .collect::<String>()
                    .trim_matches(|c| c == '-' || c == '_')
                    .to_string();
                if clean.is_empty() {
                    anyhow::bail!("name sanitizes to empty string");
                }
                let target = file
                    .parent()
                    .unwrap_or_else(|| std::path::Path::new("."))
                    .join(format!("{clean}.json"));
                if target.exists() {
                    anyhow::bail!("target already exists: {}", target.display());
                }
                tokio::fs::rename(&file, &target).await?;
                println!("renamed {} -> {}", file.display(), target.display());
                Ok(())
            }
            Some(SessionAction::Prune { days }) => {
                let dir = dir.unwrap_or_else(sessions_dir);
                let cutoff = std::time::SystemTime::now()
                    .checked_sub(std::time::Duration::from_secs_f64(days * 86400.0))
                    .unwrap_or(std::time::UNIX_EPOCH);
                let mut removed = 0usize;
                if dir.is_dir() {
                    for e in std::fs::read_dir(&dir)? {
                        let p = e?.path();
                        if p.extension().and_then(|x| x.to_str()) != Some("json") {
                            continue;
                        }
                        let old = p
                            .metadata()
                            .and_then(|m| m.modified())
                            .map(|t| t < cutoff)
                            .unwrap_or(false);
                        if old {
                            tokio::fs::remove_file(&p).await?;
                            removed += 1;
                        }
                    }
                }
                println!(
                    "pruned {removed} session(s) older than {days} day(s) in {}",
                    dir.display()
                );
                Ok(())
            }
            None => list_sessions(&dir.unwrap_or_else(sessions_dir), search.as_deref()),
        },
        Commands::Doctor => doctor(&cli).await,
        Commands::Serve { http, token } => {
            let mcp = connect(cli.config.clone()).await?;
            let llm = llm::LlmClient::from_env()?;
            // Headless: permission asks are denied; use --allow/--deny.
            let permissions =
                Permissions::new(cli.allow.clone(), cli.deny.clone(), AskMode::AutoDeny);
            let mut agent = Agent::new(llm, mcp, permissions, cli.max_rounds);
            if let Some(path) = &cli.session {
                if path.is_file() {
                    let msgs = load_session(path).await?;
                    agent.load_session(msgs);
                }
            }
            match http {
                Some(addr) => {
                    serve::serve_http(
                        &mut agent,
                        &addr,
                        token.or_else(|| std::env::var("MCP_AUTH_TOKEN").ok()),
                    )
                    .await
                }
                None => serve::serve(&mut agent).await,
            }
        }
        Commands::Tui => {
            let mcp = connect(cli.config.clone()).await?;
            let llm = llm::LlmClient::from_env()?;
            let permissions =
                Permissions::new(cli.allow.clone(), cli.deny.clone(), AskMode::AutoDeny);
            let mut agent = Agent::new(llm, mcp, permissions, cli.max_rounds);
            if let Some(path) = &cli.session {
                if path.is_file() {
                    let msgs = load_session(path).await?;
                    agent.load_session(msgs);
                }
            }
            tui::tui(agent, cli.allow.clone(), cli.deny.clone()).await
        }
        Commands::Run { prompt } => {
            let mcp = connect(cli.config.clone()).await?;
            let llm = llm::LlmClient::from_env()?;
            let permissions = Permissions::new(cli.allow.clone(), cli.deny.clone(), AskMode::Stdin);
            let mut agent = Agent::new(llm, mcp, permissions, cli.max_rounds);
            if let Some(path) = &cli.session {
                if path.is_file() {
                    let msgs = load_session(path).await?;
                    agent.load_session(msgs);
                }
            }
            let result = agent.run_turn(&prompt, print_delta).await;
            println!();
            if let Some(path) = &cli.session {
                save_session(path, &agent.messages).await?;
            }
            result.map(|_| ())
        }
        Commands::Repl => {
            let mcp = connect(cli.config.clone()).await?;
            let llm = llm::LlmClient::from_env()?;
            let permissions = Permissions::new(cli.allow.clone(), cli.deny.clone(), AskMode::Stdin);
            let mut agent = Agent::new(llm, mcp, permissions, cli.max_rounds);
            if let Some(path) = &cli.session {
                if path.is_file() {
                    let msgs = load_session(path).await?;
                    agent.load_session(msgs);
                }
            }
            repl(&mut agent, &cli).await
        }
    }
}

async fn doctor(cli: &Cli) -> Result<()> {
    let mut failures = 0u32;

    // LLM env
    let provider = std::env::var("LLM_PROVIDER").unwrap_or_else(|_| "openai".into());
    let model = std::env::var("LLM_MODEL").unwrap_or_else(|_| "gpt-4o-mini".into());
    let base = std::env::var("LLM_BASE_URL").unwrap_or_else(|_| "https://api.openai.com/v1".into());
    let key = std::env::var("LLM_API_KEY").ok().or_else(|| {
        if provider == "anthropic" {
            std::env::var("ANTHROPIC_API_KEY").ok()
        } else {
            None
        }
    });
    println!("provider: {provider}");
    println!("model:    {model}");
    println!("base_url: {base}");
    match &key {
        Some(k) if !k.is_empty() => println!("api_key:  set ({}…)", &k[..k.len().min(4)]),
        _ => {
            println!("api_key:  MISSING (set LLM_API_KEY or ANTHROPIC_API_KEY)");
            failures += 1;
        }
    }

    // Harness profile config
    match config::HarnessConfig::load(cli.profile.as_deref())? {
        Some(_) => println!("profile:  config file loaded"),
        None => println!("profile:  no harness.json / ~/.config/harness/config.json"),
    }

    // MCP servers: spawn + handshake + tools/list with a timeout
    let path = cli.config.clone().or_else(default_config);
    match path {
        Some(p) if p.is_file() => {
            println!("mcp:      {}", p.display());
            match tokio::time::timeout(std::time::Duration::from_secs(20), connect(Some(p))).await {
                Ok(Ok(mcp)) => {
                    let mut by_server: std::collections::BTreeMap<String, usize> =
                        Default::default();
                    for tool in &mcp.tools {
                        let server = tool.name.split("__").next().unwrap_or("?").to_string();
                        *by_server.entry(server).or_default() += 1;
                    }
                    for (srv, n) in by_server {
                        println!("  {srv}: {n} tool(s)");
                    }
                    println!("mcp:      OK ({} tools total)", mcp.tools.len());
                }
                Ok(Err(e)) => {
                    println!("mcp:      FAILED — {e:#}");
                    failures += 1;
                }
                Err(_) => {
                    println!("mcp:      TIMEOUT after 20s");
                    failures += 1;
                }
            }
        }
        Some(p) => {
            println!("mcp:      config not found: {}", p.display());
            failures += 1;
        }
        None => {
            println!("mcp:      no config (pass --config or create mcp.json)");
            failures += 1;
        }
    }

    if failures > 0 {
        eprintln!("doctor: {failures} problem(s) found");
        std::process::exit(1);
    }
    println!("doctor: all checks passed");
    Ok(())
}

fn permissions_file() -> PathBuf {
    std::env::var_os("HOME")
        .map(|h| PathBuf::from(h).join(".config/harness/permissions.json"))
        .unwrap_or_else(|| PathBuf::from("permissions.json"))
}

fn load_permission_grants() -> Option<Vec<String>> {
    let text = std::fs::read_to_string(permissions_file()).ok()?;
    let v: serde_json::Value = serde_json::from_str(&text).ok()?;
    v.get("allow").and_then(|a| a.as_array()).map(|arr| {
        arr.iter()
            .filter_map(|x| x.as_str().map(str::to_string))
            .collect()
    })
}

const SLASH_COMMANDS: &[&str] = &[
    "/help", "/tools", "/model", "/clear", "/compact", "/session", "/status", "/diff", "/exit",
    "/quit",
];

struct SlashHelper;
impl rustyline::Helper for SlashHelper {}
impl rustyline::highlight::Highlighter for SlashHelper {}
impl rustyline::hint::Hinter for SlashHelper {
    type Hint = String;
}
impl rustyline::validate::Validator for SlashHelper {}
impl rustyline::completion::Completer for SlashHelper {
    type Candidate = String;

    fn complete(
        &self,
        line: &str,
        pos: usize,
        _ctx: &rustyline::Context<'_>,
    ) -> rustyline::Result<(usize, Vec<String>)> {
        if line.starts_with('/') {
            let cands: Vec<String> = SLASH_COMMANDS
                .iter()
                .filter(|c| c.starts_with(line))
                .map(|s| s.to_string())
                .collect();
            Ok((0, cands))
        } else {
            Ok((pos, vec![]))
        }
    }
}

fn history_path() -> PathBuf {
    std::env::var_os("HOME")
        .map(|h| PathBuf::from(h).join(".local/share/harness/history.txt"))
        .unwrap_or_else(|| PathBuf::from(".harness_history"))
}

async fn repl(agent: &mut Agent, cli: &Cli) -> Result<()> {
    eprintln!(
        "harness ready ({}, {}) — /help for commands, 'exit' or Ctrl-D to quit",
        agent.llm.provider_name(),
        agent.llm.model
    );
    let mut rl = rustyline::Editor::new()?;
    rl.set_helper(Some(SlashHelper));
    let hist = history_path();
    if let Some(parent) = hist.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = rl.load_history(&hist);
    // /diff marker: index into agent.messages of the first unseen message.
    let mut diff_mark = agent.messages.len();

    loop {
        let line = match rl.readline("harness> ") {
            Ok(l) => l,
            Err(rustyline::error::ReadlineError::Interrupted)
            | Err(rustyline::error::ReadlineError::Eof) => break,
            Err(e) => return Err(e.into()),
        };
        // Multiline: a trailing backslash continues on the next line.
        let mut input = line.trim_end().to_string();
        while input.ends_with('\\') {
            input.pop();
            match rl.readline("> ") {
                Ok(cont) => {
                    input.push('\n');
                    input.push_str(cont.trim_end());
                }
                Err(_) => break,
            }
        }
        let input = input.trim();
        if input.is_empty() {
            continue;
        }
        let _ = rl.add_history_entry(input);
        if input == "exit" || input == "quit" {
            break;
        }
        if let Some(rest) = input.strip_prefix('/') {
            let cmd = rest.trim();
            let (head, arg) = match cmd.split_once(char::is_whitespace) {
                Some((h, a)) => (h, a.trim()),
                None => (cmd, ""),
            };
            match head {
                "help" | "h" | "?" => {
                    println!(
                        "/help              show this help\n\
                         /tools             list MCP tools\n\
                         /model [name]      show or switch the LLM model\n\
                         /clear             clear conversation history\n\
                         /session           show session file path\n\
                         /status            token usage and est. cost\n\
                         /diff              show messages since last /diff\n\
                         /compact           summarize history to save context\n\
                         /undo              remove the last turn\n\
                         /retry             re-run the last prompt\n\
                         /fork [name]       save history as a new session branch\n\
                         /export [path]     write transcript as Markdown\n\
                         /exit              quit"
                    );
                }
                "tools" | "t" => {
                    for tool in agent.tools() {
                        println!("{}\t{}", tool.name, tool.description);
                    }
                }
                "model" | "m" => {
                    if arg.is_empty() {
                        println!("model: {}", agent.llm.model);
                    } else {
                        agent.llm.model = arg.to_string();
                        println!("model: {}", agent.llm.model);
                    }
                }
                "status" | "st" => {
                    let (i, o) = agent.usage();
                    println!(
                        "usage: {i} prompt / {o} completion tokens\n\
                         est. cost: ${:.4} ({})",
                        agent.cost_usd(),
                        agent.llm.model
                    );
                }
                "clear" | "c" => {
                    agent.clear();
                    println!("history cleared");
                }
                "diff" | "d" => {
                    let msgs = &agent.messages;
                    if diff_mark >= msgs.len() {
                        println!("nothing new since last /diff");
                    } else {
                        for m in &msgs[diff_mark..] {
                            let role = m.get("role").and_then(|r| r.as_str()).unwrap_or("?");
                            let content = m
                                .get("content")
                                .and_then(|c| c.as_str())
                                .unwrap_or("")
                                .replace('\n', " ");
                            let preview: String = content.chars().take(100).collect();
                            println!("{role}: {preview}");
                            if let Some(calls) = m.get("tool_calls").and_then(|c| c.as_array()) {
                                for c in calls {
                                    let name = c
                                        .pointer("/function/name")
                                        .and_then(|n| n.as_str())
                                        .unwrap_or("?");
                                    println!("  -> tool_call {name}");
                                }
                            }
                        }
                    }
                    diff_mark = msgs.len();
                }
                "compact" | "cp" => match agent.compact().await {
                    Ok(removed) => println!("compacted: removed {removed} messages"),
                    Err(e) => eprintln!("compact failed: {e}"),
                },
                "undo" | "u" => {
                    let removed = agent.undo();
                    if removed == 0 {
                        println!("nothing to undo");
                    } else {
                        println!("undone: removed {removed} messages");
                        diff_mark = diff_mark.min(agent.messages.len());
                    }
                }
                "retry" | "r" => match agent.last_prompt() {
                    Some(prompt) => {
                        let result = agent.run_turn(&prompt, print_delta).await;
                        println!();
                        if let Some(path) = &cli.session {
                            save_session(path, &agent.messages).await?;
                        }
                        if let Err(e) = result {
                            eprintln!("error: {e}\n");
                        }
                    }
                    None => println!("nothing to retry"),
                },
                "fork" => {
                    let dir = cli
                        .session
                        .as_ref()
                        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
                        .filter(|d| d.is_dir())
                        .unwrap_or_else(sessions_dir);
                    let name = if arg.is_empty() {
                        format!(
                            "fork-{}.json",
                            std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .map(|d| d.as_secs())
                                .unwrap_or(0)
                        )
                    } else {
                        let clean: String = arg
                            .chars()
                            .map(|c| {
                                if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                                    c
                                } else {
                                    '-'
                                }
                            })
                            .collect::<String>()
                            .trim_matches(|c| c == '-' || c == '_')
                            .to_string();
                        format!("{clean}.json")
                    };
                    let path = dir.join(name);
                    save_session(&path, &agent.messages).await?;
                    println!("forked -> {}", path.display());
                    diff_mark = agent.messages.len();
                }
                "export" => {
                    let default_name = format!(
                        "transcript-{}.md",
                        std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .map(|d| d.as_secs())
                            .unwrap_or(0)
                    );
                    let path = if arg.is_empty() {
                        cli.session
                            .as_ref()
                            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
                            .unwrap_or_else(|| std::path::PathBuf::from("."))
                            .join(default_name)
                    } else {
                        std::path::PathBuf::from(arg)
                    };
                    match tokio::fs::write(&path, agent.export_markdown()).await {
                        Ok(_) => println!("exported -> {}", path.display()),
                        Err(e) => eprintln!("export failed: {e}"),
                    }
                }
                "session" => match &cli.session {
                    Some(p) => println!("session: {}", p.display()),
                    None => println!("no session file (--session not set)"),
                },
                "exit" | "quit" => break,
                other => println!("unknown command: /{other} (try /help)"),
            }
            continue;
        }
        let result = agent.run_turn(input, print_delta).await;
        println!();
        if let Some(path) = &cli.session {
            save_session(path, &agent.messages).await?;
        }
        if let Err(e) = result {
            eprintln!("error: {e}\n");
        }
    }
    let _ = rl.save_history(&hist);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn session_save_load_roundtrip() {
        let dir = std::env::temp_dir().join(format!("harness-test-{}", std::process::id()));
        let path = dir.join("nested").join("s.json");
        let messages = vec![
            json!({"role": "system", "content": "sys"}),
            json!({"role": "user", "content": "hi"}),
            json!({"role": "assistant", "content": "hello", "tool_calls": []}),
        ];
        save_session(&path, &messages).await.unwrap();
        let loaded = load_session(&path).await.unwrap();
        assert_eq!(loaded, messages);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn session_load_missing_file_errors() {
        let path = std::env::temp_dir().join("harness-no-such-session.json");
        assert!(load_session(&path).await.is_err());
    }

    #[test]
    fn list_sessions_prints_json_files() {
        let dir = std::env::temp_dir().join(format!("harness-ls-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("a.json"), "[]").unwrap();
        std::fs::write(dir.join("b.txt"), "nope").unwrap();
        list_sessions(&dir, None).unwrap();
        let _ = std::fs::remove_dir_all(&dir);
    }
}
