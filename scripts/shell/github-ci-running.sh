#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# GitHub CI Running
#
# Counts GitHub Actions runs that are still in progress or
# queued on the master branch across every git repository
# under a directory. Repos are matched to GitHub remotes via
# their `origin` URL.
#
# Usage:
#   ./shell/github-ci-running.sh
#   ./shell/github-ci-running.sh ~/git/github.com/hieudoanm
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCAN_DIR="$(dirname "$REPO_ROOT")"

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *) SCAN_DIR="$arg" ;;
  esac
done

BOLD=$'\033[1m'
YELLOW=$'\033[0;33m'
DIM=$'\033[2m'
RESET=$'\033[0m'

total=0
repos_with_runs=0

printf '%-28s %-24s %-12s %s\n' "REPO" "WORKFLOW" "STATUS" "STARTED (UTC)"
printf '%s\n' "------------------------------------------------------------"

shopt -s nullglob
for dir in "$SCAN_DIR"/*/; do
  [ -d "$dir/.git" ] || [ -f "$dir/.git" ] || continue

  remote="$(git -C "$dir" remote get-url origin 2>/dev/null)" || continue
  [[ "$remote" =~ github\.com[:/]([^/]+)/([^/]+)$ ]] || continue
  owner="${BASH_REMATCH[1]}"
  repo="${BASH_REMATCH[2]%.git}"
  slug="$owner/$repo"

  runs="$(gh run list -R "$slug" --branch master --limit 30 \
    --json status,workflowName,createdAt \
    --jq '.[] | select(.status != "completed") |
          "\(.workflowName)\t\(.status)\t\(.createdAt)"' \
    2>/dev/null)" || continue
  [ -n "$runs" ] || continue

  repos_with_runs=$((repos_with_runs + 1))
  while IFS=$'\t' read -r workflow status created; do
    [ -n "$workflow" ] || continue
    total=$((total + 1))
    printf '%-28s %-24s %s%-12s%s %s%s%s\n' \
      "$slug" "$workflow" "$YELLOW" "$status" "$RESET" \
      "$DIM" "${created:0:16}" "$RESET"
  done <<<"$runs"
done

printf '\n%s%d%s CI run(s) in progress/queued on master across %d repo(s)\n' \
  "$BOLD" "$total" "$RESET" "$repos_with_runs"
