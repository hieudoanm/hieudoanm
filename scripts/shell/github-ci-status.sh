#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# GitHub CI Status
#
# Prints the latest completed GitHub Actions run on the master
# branch for every git repository under a directory, along with
# repo visibility. Repos are matched to GitHub remotes via
# their `origin` URL.
#
# Usage:
#   ./shell/github-ci-status.sh
#   ./shell/github-ci-status.sh ~/git/github.com/hieudoanm
#   ./shell/github-ci-status.sh ~/git/github.com/hieudoanm --failed-only
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCAN_DIR="$(dirname "$REPO_ROOT")"
FAILED_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --failed-only) FAILED_ONLY=true ;;
    -h|--help)
      sed -n '2,20p' "$0"
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
    failure|cancelled|timed_out|action_required|startup_failure|stale) printf '%s' "$RED" ;;
    *) printf '%s' "$YELLOW" ;;
  esac
}

printf '%-24s %-10s %-22s %-10s %s\n' "REPO" "VISIBILITY" "WORKFLOW" "STATUS" "LAST RUN (UTC)"
printf '%s\n' "--------------------------------------------------------------------------------"

shopt -s nullglob

visibility_for() {
  # $1 = owner/repo slug
  gh repo view "$1" --json visibility \
    --jq '.visibility | ascii_downcase' 2>/dev/null || true
}

for dir in "$SCAN_DIR"/*/; do
  [ -d "$dir/.git" ] || [ -f "$dir/.git" ] || continue

  remote="$(git -C "$dir" remote get-url origin 2>/dev/null)" || continue
  [[ "$remote" =~ github\.com[:/]([^/]+)/([^/]+)$ ]] || continue
  owner="${BASH_REMATCH[1]}"
  repo="${BASH_REMATCH[2]%.git}"

  run="$(gh run list -R "$owner/$repo" --branch master --status completed --limit 1 \
    --json conclusion,status,workflowName,createdAt \
    --jq '.[0] // empty | "\(.workflowName // "-")\t\((.conclusion // "") | if . == "" then .status else . end)\t\(.createdAt)"' \
    2>/dev/null)" || continue

  [ -n "$run" ] || continue
  IFS=$'\t' read -r workflow result created <<<"$run"

  if [ "$FAILED_ONLY" = true ] && [ "$result" = "success" ]; then
    continue
  fi

  # gh sometimes reports the workflow file path instead of its name
  workflow="${workflow##*/}"

  vis="$(visibility_for "$owner/$repo")"
  [ -n "$vis" ] || vis="unknown"

  printf '%-24s %-10s %-22s %s%-10s%s %s%s%s\n' \
    "$repo" "$vis" "$workflow" "$(color_for "$result")" "$result" "$RESET" \
    "$DIM" "${created:0:10}" "$RESET"
done
