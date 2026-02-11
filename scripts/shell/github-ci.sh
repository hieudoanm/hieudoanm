#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# GitHub CI Status — all repos, default branch
#
# Scans every git repository under a directory and prints the
# latest GitHub Actions run on the repository's default branch
# (master/main) for each repo that has workflow runs.
#
# Usage:
#   ./shell/github-ci.sh
#   ./shell/github-ci.sh ~/git/github.com/hieudoanm
#   ./shell/github-ci.sh ~/git/github.com/hieudoanm --failed-only
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCAN_DIR="$(dirname "$REPO_ROOT")"
FAILED_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --failed-only) FAILED_ONLY=true ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *) SCAN_DIR="$arg" ;;
  esac
done

GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
DIM=$'\033[2m'
RESET=$'\033[0m'

color_for() {
  case "$1" in
    success) printf '%s' "$GREEN" ;;
    failure|cancelled|timed_out|startup_failure|action_required) printf '%s' "$RED" ;;
    *) printf '%s' "$YELLOW" ;;
  esac
}

printf '%-28s %-10s %-24s %-18s %s\n' "REPO" "BRANCH" "WORKFLOW" "STATUS" "LAST RUN"
printf '%s\n' "$(printf '%.0s-' {1..110})"

shopt -s nullglob
for dir in "$SCAN_DIR"/*/; do
  [ -d "$dir/.git" ] || [ -f "$dir/.git" ] || continue

  remote="$(git -C "$dir" remote get-url origin 2>/dev/null)" || continue
  [[ "$remote" =~ github\.com[:/]([^/]+)/([^/]+)$ ]] || continue
  owner="${BASH_REMATCH[1]}"
  repo="${BASH_REMATCH[2]%.git}"
  slug="$owner/$repo"

  branch="$(gh repo view "$slug" --json defaultBranchRef \
    --jq '.defaultBranchRef.name' 2>/dev/null)" || continue
  [ -n "$branch" ] || continue

  run="$(gh run list -R "$slug" --branch "$branch" --limit 1 \
    --json status,conclusion,workflowName,createdAt \
    --jq '.[0] | "\(.status)\t\(.conclusion // "")\t\(.workflowName)\t\(.createdAt)"' \
    2>/dev/null)" || continue
  [ -n "$run" ] || continue

  IFS=$'\t' read -r status conclusion workflow created <<<"$run"
  [ -n "$status" ] && [ "$status" != "null" ] || continue

  resolved="$conclusion"
  [ -n "$resolved" ] || resolved="$status"

  if [ "$FAILED_ONLY" = true ] && [ "$resolved" = "success" ]; then
    continue
  fi

  color="$(color_for "$resolved")"
  printf '%-28s %-10s %-24s %s%-18s%s %s\n' \
    "$slug" "$branch" "$workflow" "$color" "$resolved" "$RESET" \
    "${created%%T*}"
done
