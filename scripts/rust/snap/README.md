# snap

Capture website screenshots using your existing **Firefox** installation in
headless mode. Built with Rust, Tokio, [thirtyfour](https://crates.io/crates/thirtyfour)
(WebDriver), and Clap. It never installs or launches Chromium/Chrome.

## Requirements

- Rust (stable, `cargo`)
- Firefox (any recent release; Firefox Developer Edition works too)
- [geckodriver](https://github.com/mozilla/geckodriver) — the WebDriver bridge
  that lets thirtyfour talk to Firefox

### Installing geckodriver

```sh
# macOS (Homebrew)
brew install geckodriver

# or download a release matching your Firefox major version from
# https://github.com/mozilla/geckodriver/releases
```

Start it before running snap (leave it running in a terminal):

```sh
geckodriver --port 9515
```

## Installation

```sh
cd scripts/rust/snap
cargo install --path .   # installs the `snap` binary
# or build and run without installing:
cargo run -- https://example.com
```

## Usage

From this directory:

```sh
cargo run --release -- https://example.com -o screenshot.png
snap --apps   # capture every app linked in the repo README
# or via the repo Makefile:
make -C ../.. snap SNAP_ARGS="https://example.com -o screenshot.png"
make -C ../.. snap-apps   # capture all apps listed in the repo README
```
snap https://example.com
snap https://example.com -o screenshot.png
snap https://example.com --width 1280 --height 640
```

### Options

| Flag | Default | Description |
| ---- | ------- | ----------- |
| `URL` (positional) | — | URL of the website to capture |
| `-o`, `--output <PATH>` | `assets/apps/snap-<timestamp>.png` | Output PNG path |
| `--width <PX>` | `1280` | Viewport width |
| `--height <PX>` | `640` | Viewport height |
| `--timeout <SECS>` | `30` | Max seconds to wait for page load |
| `--settle <MS>` | `500` | Extra delay after page load |
| `--apps` | — | Capture all apps listed in `APPS` to `assets/apps/<app>.png` |
| `--geckodriver <URL>` | `http://127.0.0.1:9515` | geckodriver address (env: `GECKODRIVER_URL`) |
| `--firefox-binary <PATH>` | auto-detect | Firefox binary (env: `FIREFOX_BINARY`) |

Enable verbose logging with `RUST_LOG=debug snap ...`.

## How it works

The whole CLI lives in a single `src/main.rs`: Clap defines the arguments,
then the program builds Firefox capabilities (`moz:firefoxOptions` with
`-headless` and window-size args), connects to geckodriver, corrects the
window rect so the viewport matches `--width`/`--height` exactly, polls
`document.readyState`, captures the viewport screenshot, and quits the
session cleanly — even on error.

Only the visible viewport is captured. No Chromium/Chrome is downloaded or
launched at any point.

Screenshots default to `assets/apps/` at the repository root (created if
missing); pass `-o` to write elsewhere.

## Troubleshooting

- **"failed to start a WebDriver session"** — geckodriver isn't running or is
  on a different port. Start it (`geckodriver`) or pass `--geckodriver`.
- **Firefox not found** — pass `--firefox-binary /path/to/firefox`, or set
  `FIREFOX_BINARY`.
- **Screenshot is blank** — increase `--settle` for JS-heavy pages, or raise
  `--timeout`.
