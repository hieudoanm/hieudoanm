# hieudoanm

A minimal agent harness: it connects to [MCP](https://modelcontextprotocol.io)
servers over stdio, exposes their tools to an OpenAI-compatible chat model,
and runs the agent loop — prompt → tool calls → results → answer.

Part of the `hieudoanm` Cargo workspace (`crates/`).

## How it works

```
prompt ──▶ LLM ──▶ tool_calls ──▶ MCP servers ──▶ results ──▶ LLM ──▶ answer
             ▲                                                    │
             └────────────── up to 12 rounds ◀───────────────────┘
```

- **MCP client** (`src/mcp.rs`) — spawns each server from a
  `{"mcpServers": {...}}` config, performs `initialize` /
  `notifications/initialized` / `tools/list`, and routes `tools/call`.
  Tools are exposed to the model as `<server>__<tool>` (OpenAI function
  names can't contain `:`).
- **LLM client** (`src/llm.rs`) — OpenAI-compatible `/chat/completions`.
  Works with OpenAI, Ollama, LM Studio, OpenRouter, Groq, etc.
- **Agent loop** (`src/agent.rs`) — appends assistant messages and tool
  results to the conversation until the model answers with text or the
  round limit (12) is hit.

## Configuration

MCP config (default `./mcp.json`, then `~/.config/harness/mcp.json`,
or `--config <path>`):

```json
{
  "mcpServers": {
    "fdr": {
      "command": "/path/to/fdr",
      "args": ["mcp"],
      "cwd": "/path/to/fdr",
      "env": { "OPTIONAL": "value" }
    }
  }
}
```

`cwd` and `env` are optional. `cwd` sets the server's working directory
(needed by tools that resolve files relative to their repo, e.g. `fdr`).

### Profiles

Optional `./harness.json` or `~/.config/harness/config.json`:

```json
{
  "profile": "work",
  "profiles": {
    "work": {
      "mcpConfig": "~/work/mcp.json",
      "allow": ["tracers__*"],
      "deny": ["llm__train"],
      "env": { "LLM_MODEL": "gpt-4o", "LLM_BASE_URL": "https://..." }
    }
  }
}
```

`--profile <name>` selects a profile (or set top-level `"profile"`).
Profile `env` vars are applied before the LLM client is built;
`mcpConfig`/`allow`/`deny` merge with CLI flags (`--config` wins over
`mcpConfig`).

Optional top-level keys filter which tools the model sees:

```json
{
  "mcpServers": { "...": "..." },
  "enabledTools": ["fdr__*"],
  "disabledTools": ["llm__train"]
}
```

Two providers, selected with `LLM_PROVIDER` (`openai` default, or
`anthropic` — also auto-detected when `LLM_BASE_URL` contains
"anthropic"):

| Variable            | Default                          |
| ------------------- | -------------------------------- |
| `LLM_PROVIDER`      | `openai`                         |
| `LLM_BASE_URL`      | `https://api.openai.com/v1`      |
| `LLM_API_KEY`       | *(empty — needed by hosted APIs)* |
| `LLM_MODEL`         | `gpt-4o-mini` / `claude-sonnet-4-5` |
| `ANTHROPIC_API_KEY` | falls back to `LLM_API_KEY`      |
| `ANTHROPIC_BASE_URL`| `https://api.anthropic.com`      |
| `LLM_MAX_TOKENS`    | `4096` (Anthropic only)          |
| `LLM_CONTEXT_WARN`  | `100000` (prompt-token warning)  |

For a local model with Ollama: `LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3.2`.
For Anthropic: `LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-...`.

## Features

- **Streaming** — both providers stream over SSE: OpenAI
  `chat/completions` deltas and Anthropic `content_block_delta` events.
  Tool-call fragments are reassembled before dispatch.
- **Parallel tool calls** — multiple tool calls in one round dispatch
  concurrently (`join_all`); results are appended in call order.
- **Tool filtering** — optional top-level `enabledTools` /
  `disabledTools` arrays in the MCP config (same pattern syntax as
  `--allow`) restrict which tools are exposed to the model.
- **Result truncation** — tool outputs over 30k chars are truncated with
  a notice so they can't blow the context window.
- **Context tracking** — prompt/completion token usage is logged each
  round; a warning fires at `LLM_CONTEXT_WARN` tokens.
- **Permissions** — every tool call asks `[y/n/a]` unless it matches
  `--allow <pattern>` (repeatable, trailing `*` = prefix match) or
  `--deny <pattern>`. `a` approves the tool for the rest of the session
  and persists it to `~/.config/harness/permissions.json` (loaded
  automatically on later runs).
- **Sessions** — `--session <file>` loads conversation history on start
  and saves it (as JSON) after every turn.
- **Slash commands** (REPL + TUI) — `/help`, `/tools`, `/model [name]`,
  `/clear`, `/compact`, `/undo`, `/retry`, `/fork [name]`, `/export
  [path]` (Markdown transcript), `/session`, `/status` (token usage +
  est. cost), `/diff` (messages since last `/diff`), `/exit`. A
  trailing `\` continues input on the next line (multiline).
- **REPL editing** — rustyline: persistent history
  (`~/.local/share/harness/history.txt`), Tab completion for slash
  commands, Ctrl-C/Ctrl-D to quit.
- **Sessions** — `--session <file>` for one chat, or a directory path
  to auto-create timestamped `session-<epoch>.json` files.
  `hieudoanm sessions [dir]` lists them with previews;
  `hieudoanm sessions rm <file>` deletes one,
  `hieudoanm sessions rename <file> <name>` renames it,
  `hieudoanm sessions prune <days>` deletes old files, and
  `--search <text>` filters by session name or first-prompt preview.
- **Cost tracking** — cumulative prompt/completion tokens with a
  per-model price table (`LLM_PRICE_INPUT`/`LLM_PRICE_OUTPUT` env
  override, $ per 1M tokens); shown by `/status`.
- **`hieudoanm eval <file>`** — run JSON/JSONL test cases
  (`prompt` + `expect.text_contains`/`tools`/`forbid_tools`, plus
  optional `followups: [{prompt, expect}]` for multi-turn checks,
  `setup`/`teardown` shell commands, `--filter <text>` to run
  only matching cases, and `expect.history_contains` /
  `expect.history_max_len` state assertions)
  against the agent with allow-all permissions; TAP-style output,
  exit 1 on failure. `-` reads cases from stdin. `--json` emits a
  machine-readable summary instead; tool calls are reported live on
  stderr as `# tool: <name>`.
- **`hieudoanm init [--output file]`** — prints (or writes) a
  ready-to-paste `mcpServers` config block for `hieudoanm serve`.
- **Session durability** — sessions save after every turn, including
  failed ones, so partial progress isn't lost.
- **`hieudoanm doctor`** — checks LLM env vars, profile config, and
  MCP server connectivity (spawn + handshake + tools/list, 20s
  timeout); exits 1 on problems.
- **Repo integration** — `make crates-build` / `harness-build` /
  `harness-run HARNESS_ARGS="..."` targets; `scripts/shell/
  install-harness.sh` installs the `hieudoanm` binary via
  `cargo install --path`.
- **Unit tests** — `cargo test -p harness` covers permission
  patterns, config profiles, and session save/load.
- **MCP notifications** — server notifications (e.g.
  `notifications/message`) are forwarded to the TUI transcript.
- **`--max-rounds N`** — cap on tool-call rounds per turn (default 12).
- **Sub-agents** — the built-in `hieudoanm__spawn_agent` tool runs a
  focused subtask in a fresh conversation (no nested sub-agents,
  `max_rounds` arg, default 6 / max 12, token budget
  `LLM_SUBAGENT_TOKEN_BUDGET`, default 20000).
- **`hieudoanm serve`** — exposes the agent itself as an MCP server
  (`ask`, `clear`, `list_tools`, `status` tools), so any MCP client can
  use the harness. Headless: permission asks are denied unless
  allowlisted via `--allow`.
- **`hieudoanm tui`** — Ratatui chat UI: live streaming transcript, tool
  completions, inline permission prompts ([y/n/a]), slash commands,
  status bar with provider/model.

## Usage

```sh
cargo build -p harness

# list tools discovered from MCP servers
./target/debug/hieudoanm --config mcp.json tools

# call a tool directly (debugging, no LLM needed)
./target/debug/hieudoanm --config mcp.json call fdr__pick_food '{"country":"japanese"}'

# one-shot prompt (auto-approve fdr tools for this run)
LLM_API_KEY=sk-... ./target/debug/hieudoanm --allow 'fdr__*' run "pick me a japanese dish"

# interactive REPL with a persistent session
LLM_API_KEY=sk-... ./target/debug/hieudoanm --session ~/.local/share/harness/chat.json

# TUI
LLM_API_KEY=sk-... ./target/debug/hieudoanm --allow 'fdr__*' tui

# serve the agent as an MCP server (for Claude Desktop, Cursor, etc.)
./target/debug/hieudoanm --config mcp.json --allow 'fdr__*' serve

# eval test cases
./target/debug/hieudoanm --config mcp.json --allow 'fdr__*' eval cases.json

# print a ready-to-paste MCP client config for `hieudoanm serve`
./target/debug/hieudoanm --config mcp.json init

# sessions directory + listing
./target/debug/hieudoanm --session ~/.local/share/harness/sessions run "hi"
./target/debug/hieudoanm sessions
```

Tool-call activity is logged to stderr (`[hieudoanm] -> tool(...)`,
`[hieudoanm] <- N chars`); answers go to stdout.
