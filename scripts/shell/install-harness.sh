#!/usr/bin/env bash
# Install the `harness` binary via cargo (release build).
set -euo pipefail
cd "$(dirname "$0")/../.."
cargo install --path crates/harness --locked
