# Contributing to hieudoanm

Thanks for contributing to the `hieudoanm` profile repository.

## Scope

- `README.md` — GitHub profile README.
- `page/` — static landing page (plain HTML/CSS, no build step), deployed to
  GitHub Pages.
- `assets/` — static assets; `branding/` holds README images/SVGs and
  `svg-to-png.sh`.
- `scripts/shell/` — standalone Bash utilities.
- `scripts/rust/snap/` — Rust CLI that captures website screenshots.
- `notes/` — design rules and notes.

## Rules

- `page/` must stay dependency-free: no frameworks, no JS build system,
  relative paths only (must work over `file://` and GitHub Pages). A small
  vanilla script is allowed.
- Screenshots are 1280×640 (2:1); keep `images/landing/` files at that size.
- Never add Chromium/Chrome-based screenshot tooling — Firefox only.
- Follow `notes/ai-unslop-design.md` for anything user-facing.
- Bump the `security.txt` expiry in `page/.well-known/security.txt` yearly.

## Checks

```bash
# shell scripts
bash -n scripts/shell/*.sh

# snap CLI
cd scripts/rust/snap && cargo fmt --check && cargo clippy && cargo test
```

## Pull requests

- Small, focused changes.
- Verify the page still works over `file://` after editing `page/`.

## License

By contributing, you agree that your contributions will be licensed under the
repository license in [`LICENSE`](LICENSE).
