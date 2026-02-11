push:
	git add -A
	git commit --amend --no-edit
	git push -f

# Capture a website screenshot with Firefox (scripts/rust/snap).
# Usage: make snap SNAP_ARGS="https://example.com -o shot.png"
snap:
	cd scripts/rust/snap && cargo run --release -- $(SNAP_ARGS)

# Capture all apps listed in the README to assets/apps/<app>.png
# Usage: make snap-apps SNAP_ARGS="--settle 500"
snap-apps:
	cd scripts/rust/snap && cargo run --release -- --apps $(SNAP_ARGS)

snap-build:
	cd scripts/rust/snap && cargo build --release
