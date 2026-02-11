# AGENTS.md

Conventions and commands for working in this repository.

## Layout

- `README.md` — GitHub profile README (the repo is the `hieudoanm` profile repo content)
- `page/` — static landing page (plain HTML/CSS, no build step); deployed to GitHub Pages
- `assets/` — static assets; `branding/` holds README images/SVGs and `svg-to-png.sh`
- `scripts/shell/` — standalone Bash utilities (self-contained, executable)
- `scripts/rust/snap/` — Rust CLI that captures website screenshots via Firefox + geckodriver
- `notes/` — design rules and other notes (`ai-unslop-design.md` applies to `page/`)

## Commands

```sh
make snap SNAP_ARGS="https://example.com -o shot.png"   # one screenshot
make snap-apps                                        # all README apps -> page/images/
make snap-build                                       # cargo build --release
```

`snap`/`snap-apps` auto-start `geckodriver` if needed. Firefox is selected
via `FIREFOX_BINARY` (Firefox Developer Edition is installed at
`/Applications/Firefox Developer Edition.app`).

Regenerate branding PNGs: `./assets/branding/svg-to-png.sh assets/branding`
(requires `brew install librsvg`).

## Rules

- `page/` must stay dependency-free: no frameworks, no JS build, relative
  paths only (must work over `file://` and GitHub Pages).
- Screenshots are 1280×640 (2:1); keep `images/` files at that size.
- Never add Chromium/Chrome-based screenshot tooling — Firefox only.
- Follow `notes/ai-unslop-design.md` for anything user-facing.
- `security.txt` expiry (`page/.well-known/security.txt`) must be bumped
  yearly.
