push:
	git add -A
	git commit --amend --no-edit
	git push -f

GECKODRIVER_PORT ?= 9515
GECKODRIVER_URL ?= http://127.0.0.1:$(GECKODRIVER_PORT)

# Start geckodriver if nothing is listening; kill it on exit only if we started it.
GECKODRIVER_GUARD = \
	if ! curl -sf --max-time 2 "$(GECKODRIVER_URL)/status" >/dev/null 2>&1; then \
		geckodriver --port "$(GECKODRIVER_PORT)" >/dev/null 2>&1 & GPID=$$!; \
		for i in $$(seq 1 50); do \
			curl -sf --max-time 2 "$(GECKODRIVER_URL)/status" >/dev/null 2>&1 && break; \
			sleep 0.1; \
		done; \
		trap 'kill $$GPID 2>/dev/null || true' EXIT; \
	fi;

# Capture a website screenshot with Firefox (crates/snap).
# Usage: make snap SNAP_ARGS="https://example.com -o shot.png"
snap:
	@$(GECKODRIVER_GUARD) GECKODRIVER_URL="$(GECKODRIVER_URL)" cargo run -p snap --release -- $(SNAP_ARGS)

# Capture all apps listed in the README to page/images/landing/<app>.png
# Usage: make snap-apps SNAP_ARGS="--settle 500"
snap-apps:
	@$(GECKODRIVER_GUARD) GECKODRIVER_URL="$(GECKODRIVER_URL)" cargo run -p snap --release -- --apps $(SNAP_ARGS)

# Capture all apps' GitHub READMEs (full page) to page/images/readme/<app>.png
# Usage: make snap-readmes SNAP_ARGS="--settle 500"
snap-readmes:
	@$(GECKODRIVER_GUARD) GECKODRIVER_URL="$(GECKODRIVER_URL)" cargo run -p snap --release -- --readmes $(SNAP_ARGS)

# Capture all apps' GitHub Releases pages to page/images/releases/<app>.png
# Usage: make snap-releases SNAP_ARGS="--settle 500"
snap-releases:
	@$(GECKODRIVER_GUARD) GECKODRIVER_URL="$(GECKODRIVER_URL)" cargo run -p snap --release -- --releases $(SNAP_ARGS)

# Capture all apps' downloads pages to page/images/downloads/<app>.png
# Usage: make snap-downloads SNAP_ARGS="--settle 500"
snap-downloads:
	@$(GECKODRIVER_GUARD) GECKODRIVER_URL="$(GECKODRIVER_URL)" cargo run -p snap --release -- --downloads $(SNAP_ARGS)

snap-build:
	cargo build --release -p snap

# Build all crates in the workspace (snap + harness)
crates-build:
	cargo build --workspace

# Build the agent harness in release mode
harness-build:
	cargo build --release -p harness

# Run the harness (needs LLM_* env and an MCP config; see crates/harness/README.md)
# Usage: make harness-run HARNESS_ARGS="--config mcp.json tui"
harness-run:
	cargo run -p harness -- $(HARNESS_ARGS)
