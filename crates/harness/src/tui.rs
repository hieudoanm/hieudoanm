//! `harness tui` — Ratatui chat interface.
//!
//! Streams assistant text live, shows tool completions, prompts for
//! permissions inline ([y/n/a]), and supports the same slash commands
//! as the REPL. The agent runs on a tokio task behind a mutex so the UI
//! stays responsive.

use crate::agent::{Agent, AgentEvent};
use crate::permissions::{AskMode, AskReply, AskRequest, Decision, Permissions};
use anyhow::Result;
use crossterm::event::{self, Event, KeyCode, KeyModifiers};
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph, Wrap};
use ratatui::Terminal;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

enum TxtMsg {
    Delta(String),
    Done(Result<String, String>),
}

struct State {
    transcript: String,
    stream: String,
    input: String,
    running: bool,
    perm: Option<AskRequest>,
    model_label: String,
    /// /diff marker: index into agent.messages of first unseen message.
    diff_mark: usize,
}

pub async fn tui(mut agent: Agent, allow: Vec<String>, deny: Vec<String>) -> Result<()> {
    // Permission asks come to the UI via channel.
    let (perm_tx, mut perm_rx) = mpsc::unbounded_channel::<AskRequest>();
    agent.set_permissions(Permissions::new(allow, deny, AskMode::Channel(perm_tx)));
    agent.set_quiet(true);
    let model_label = format!("{} {}", agent.llm.provider_name(), agent.llm.model);

    let mut notify_rx = agent.take_notifications();
    let agent = Arc::new(Mutex::new(agent));

    let (txt_tx, mut txt_rx) = mpsc::unbounded_channel::<TxtMsg>();
    let (ev_tx, mut ev_rx) = mpsc::unbounded_channel::<AgentEvent>();
    agent.lock().await.set_event_tx(Some(ev_tx));

    // Crossterm events on a blocking thread -> tokio channel.
    let (key_tx, mut key_rx) = mpsc::unbounded_channel::<event::KeyEvent>();
    std::thread::spawn(move || loop {
        if event::poll(std::time::Duration::from_millis(200)).unwrap_or(false) {
            if let Ok(Event::Key(k)) = event::read() {
                if key_tx.send(k).is_err() {
                    break;
                }
            }
        }
    });

    crossterm::terminal::enable_raw_mode()?;
    crossterm::execute!(std::io::stdout(), crossterm::terminal::EnterAlternateScreen)?;
    let mut terminal = Terminal::new(ratatui::backend::CrosstermBackend::new(std::io::stdout()))?;
    terminal.clear()?;

    let mut state = State {
        transcript: String::new(),
        stream: String::new(),
        input: String::new(),
        running: false,
        perm: None,
        model_label,
        diff_mark: agent.lock().await.messages.len(),
    };

    let result = loop {
        terminal.draw(|f| draw(f, &state))?;

        tokio::select! {
            key = key_rx.recv() => {
                let Some(key) = key else { break Ok(()) };
                if !handle_key(key, &mut state, &agent, &txt_tx).await? {
                    break Ok(());
                }
            }
            msg = txt_rx.recv() => {
                match msg {
                    Some(TxtMsg::Delta(d)) => state.stream.push_str(&d),
                    Some(TxtMsg::Done(Ok(_))) => {
                        state.transcript.push_str(&state.stream);
                        state.transcript.push_str("\n\n");
                        state.stream.clear();
                        state.running = false;
                    }
                    Some(TxtMsg::Done(Err(e))) => {
                        state.transcript.push_str(&state.stream);
                        state.transcript.push_str(&format!("\nerror: {e}\n\n"));
                        state.stream.clear();
                        state.running = false;
                    }
                    None => {}
                }
            }
            ev = ev_rx.recv() => {
                if let Some(AgentEvent::Tool { name, chars }) = ev {
                    state.transcript.push_str(&format!("  · {name} → {chars} chars\n"));
                }
            }
            req = perm_rx.recv() => {
                if let Some(req) = req {
                    state.perm = Some(req);
                }
            }
            notif = async {
                match notify_rx.as_mut() {
                    Some(rx) => rx.recv().await,
                    None => std::future::pending().await,
                }
            } => {
                if let Some((server, msg)) = notif {
                    let method = msg
                        .get("method")
                        .and_then(|m| m.as_str())
                        .unwrap_or("notification");
                    let text = msg
                        .pointer("/params/message/content/text")
                        .or_else(|| msg.pointer("/params/content/0/text"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .chars()
                        .take(200)
                        .collect::<String>();
                    state.transcript.push_str(&format!(
                        "  · {server}: {method} {text}\n"
                    ));
                }
            }
        }
    };

    // Restore terminal.
    crossterm::execute!(
        std::io::stdout(),
        crossterm::terminal::LeaveAlternateScreen,
        crossterm::event::DisableMouseCapture
    )?;
    crossterm::terminal::disable_raw_mode()?;
    result
}

/// Returns Ok(false) to quit.
async fn handle_key(
    key: event::KeyEvent,
    state: &mut State,
    agent: &Arc<Mutex<Agent>>,
    txt_tx: &mpsc::UnboundedSender<TxtMsg>,
) -> Result<bool> {
    // Permission prompt takes precedence.
    if let Some(req) = state.perm.take() {
        let (decision, always) = match key.code {
            KeyCode::Char('y') | KeyCode::Char('Y') => (Decision::Allow, false),
            KeyCode::Char('a') | KeyCode::Char('A') => (Decision::Allow, true),
            _ => (Decision::Deny, false),
        };
        let _ = req.reply.send(AskReply { decision, always });
        return Ok(true);
    }

    match key.code {
        KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            return Ok(false);
        }
        KeyCode::Enter => {
            let input = state.input.trim().to_string();
            if input.is_empty() {
                return Ok(true);
            }
            if input == "/exit" || input == "/quit" {
                return Ok(false);
            }
            if input.starts_with('/') {
                slash_command(&input, state, agent, txt_tx.clone()).await;
                state.input.clear();
                return Ok(true);
            }
            if state.running {
                return Ok(true); // ignore submits while a turn runs
            }
            state.transcript.push_str(&format!("> {input}\n"));
            state.input.clear();
            state.running = true;
            spawn_turn(agent, input, txt_tx.clone());
        }
        KeyCode::Char(c) => state.input.push(c),
        KeyCode::Backspace => {
            state.input.pop();
        }
        KeyCode::Esc => state.input.clear(),
        _ => {}
    }
    Ok(true)
}

fn sessions_dir_tui() -> std::path::PathBuf {
    std::env::var_os("HOME")
        .map(|h| std::path::PathBuf::from(h).join(".local/share/harness/sessions"))
        .unwrap_or_else(|| std::path::PathBuf::from("sessions"))
}

fn spawn_turn(agent: &Arc<Mutex<Agent>>, prompt: String, txt_tx: mpsc::UnboundedSender<TxtMsg>) {
    let agent = Arc::clone(agent);
    tokio::spawn(async move {
        let mut g = agent.lock().await;
        let delta_tx = txt_tx.clone();
        let result = g
            .run_turn(&prompt, move |t| {
                let _ = delta_tx.send(TxtMsg::Delta(t.to_string()));
            })
            .await
            .map_err(|e| e.to_string());
        let _ = txt_tx.send(TxtMsg::Done(result));
    });
}

async fn slash_command(
    input: &str,
    state: &mut State,
    agent: &Arc<Mutex<Agent>>,
    txt_tx: mpsc::UnboundedSender<TxtMsg>,
) {
    let (head, arg) = match input[1..].split_once(char::is_whitespace) {
        Some((h, a)) => (h, a.trim()),
        None => (&input[1..], ""),
    };
    let mut g = agent.lock().await;
    match head {
        "help" | "h" | "?" => state.transcript.push_str(
            "/help /tools /model [name] /clear /compact /undo /retry /fork /diff /status /exit\n\n",
        ),
        "tools" | "t" => {
            for t in g.tools() {
                state
                    .transcript
                    .push_str(&format!("{} — {}\n", t.name, t.description));
            }
            state.transcript.push('\n');
        }
        "model" | "m" => {
            if arg.is_empty() {
                state
                    .transcript
                    .push_str(&format!("model: {}\n\n", g.llm.model));
            } else {
                g.llm.model = arg.to_string();
                state.model_label = format!("{} {}", g.llm.provider_name(), g.llm.model);
                state
                    .transcript
                    .push_str(&format!("model: {}\n\n", g.llm.model));
            }
        }
        "status" | "s" => {
            let (i, o) = g.usage();
            state.transcript.push_str(&format!(
                "model: {}\nusage: {i} in / {o} out tokens\nest. cost: ${:.4}\n\n",
                g.llm.model,
                g.cost_usd()
            ));
        }
        "clear" | "c" => {
            g.clear();
            state.transcript.clear();
            state.stream.clear();
            state.diff_mark = g.messages.len();
        }
        "compact" | "cp" => match g.compact().await {
            Ok(removed) => {
                state
                    .transcript
                    .push_str(&format!("compacted: removed {removed} messages\n\n"));
                state.diff_mark = g.messages.len();
            }
            Err(e) => state
                .transcript
                .push_str(&format!("compact failed: {e}\n\n")),
        },
        "export" => {
            let name = format!(
                "transcript-{}.md",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0)
            );
            let dir = sessions_dir_tui();
            let path = dir.join(name);
            let md = g.export_markdown();
            let p2 = path.clone();
            tokio::spawn(async move {
                if let Some(parent) = p2.parent() {
                    let _ = tokio::fs::create_dir_all(parent).await;
                }
                let _ = tokio::fs::write(&p2, md).await;
            });
            state
                .transcript
                .push_str(&format!("exported -> {}\n\n", path.display()));
        }
        "undo" | "u" => {
            let removed = g.undo();
            if removed == 0 {
                state.transcript.push_str("nothing to undo\n\n");
            } else {
                state
                    .transcript
                    .push_str(&format!("undone: removed {removed} messages\n\n"));
                state.diff_mark = state.diff_mark.min(g.messages.len());
            }
        }
        "retry" | "r" => match g.last_prompt() {
            Some(prompt) => {
                state.running = true;
                state.transcript.push_str("> (retry)\n");
                drop(g);
                spawn_turn(agent, prompt, txt_tx);
            }
            None => state.transcript.push_str("nothing to retry\n\n"),
        },
        "fork" => {
            let dir = sessions_dir_tui();
            let name = format!(
                "fork-{}.json",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0)
            );
            let path = dir.join(name);
            let msgs = g.messages.clone();
            drop(g);
            match serde_json::to_string(&msgs) {
                Ok(json) => {
                    let p2 = path.clone();
                    tokio::spawn(async move {
                        if let Some(parent) = p2.parent() {
                            let _ = tokio::fs::create_dir_all(parent).await;
                        }
                        let _ = tokio::fs::write(&p2, json).await;
                    });
                    state
                        .transcript
                        .push_str(&format!("forked -> {}\n\n", path.display()));
                }
                Err(e) => state.transcript.push_str(&format!("fork failed: {e}\n\n")),
            }
        }
        "diff" | "d" => {
            let msgs = &g.messages;
            if state.diff_mark >= msgs.len() {
                state
                    .transcript
                    .push_str("nothing new since last /diff\n\n");
            } else {
                for m in &msgs[state.diff_mark..] {
                    let role = m.get("role").and_then(|r| r.as_str()).unwrap_or("?");
                    let content = m
                        .get("content")
                        .and_then(|c| c.as_str())
                        .unwrap_or("")
                        .replace('\n', " ");
                    let preview: String = content.chars().take(100).collect();
                    state.transcript.push_str(&format!("{role}: {preview}\n"));
                    if let Some(calls) = m.get("tool_calls").and_then(|c| c.as_array()) {
                        for c in calls {
                            let name = c
                                .pointer("/function/name")
                                .and_then(|n| n.as_str())
                                .unwrap_or("?");
                            state
                                .transcript
                                .push_str(&format!("  -> tool_call {name}\n"));
                        }
                    }
                }
                state.transcript.push('\n');
            }
            state.diff_mark = msgs.len();
        }
        "exit" | "quit" => {
            // handled by caller via input check below
        }
        other => state
            .transcript
            .push_str(&format!("unknown command: /{other}\n\n")),
    }
}

fn draw(f: &mut ratatui::Frame, state: &State) {
    let area = f.area();
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(3),
            Constraint::Length(1),
            Constraint::Length(3),
        ])
        .split(area);

    // Transcript + streaming text.
    let mut text = state.transcript.clone();
    text.push_str(&state.stream);
    let lines: Vec<Line> = text.lines().map(|l| Line::from(l.to_string())).collect();
    let total = lines.len() as u16;
    let height = chunks[0].height;
    let scroll = total.saturating_sub(height);
    let transcript = Paragraph::new(lines)
        .wrap(Wrap { trim: false })
        .scroll((scroll, 0))
        .block(Block::default().borders(Borders::TOP).title(" harness "));
    f.render_widget(transcript, chunks[0]);

    // Status bar.
    let status = if state.running {
        format!("{} — running… (ctrl-c to quit)", state.model_label)
    } else {
        state.model_label.clone()
    };
    let status_line = Paragraph::new(Line::from(Span::styled(
        status,
        Style::default().fg(Color::DarkGray),
    )));
    f.render_widget(status_line, chunks[1]);

    // Input box.
    let input = Paragraph::new(format!("❯ {}", state.input))
        .block(Block::default().borders(Borders::ALL).title(" input "));
    f.render_widget(input, chunks[2]);

    // Permission overlay.
    if let Some(req) = &state.perm {
        let w: u16 = 60.min(area.width.saturating_sub(4));
        let h = 7u16;
        let x = area.x + (area.width.saturating_sub(w)) / 2;
        let y = area.y + (area.height.saturating_sub(h)) / 2;
        let rect = Rect {
            x,
            y,
            width: w,
            height: h,
        };
        let preview: String = req.args_preview.chars().take(200).collect();
        let body = vec![
            Line::from(Span::styled(
                "Allow tool call?",
                Style::default().add_modifier(Modifier::BOLD),
            )),
            Line::from(""),
            Line::from(format!("tool: {}", req.tool)),
            Line::from(format!("args: {preview}")),
            Line::from(""),
            Line::from(Span::styled(
                "[y] allow  [n] deny  [a] always",
                Style::default().fg(Color::Yellow),
            )),
        ];
        let popup = Paragraph::new(body)
            .block(Block::default().borders(Borders::ALL).title(" permission "))
            .wrap(Wrap { trim: false });
        f.render_widget(ratatui::widgets::Clear, rect);
        f.render_widget(popup, rect);
    }
}
