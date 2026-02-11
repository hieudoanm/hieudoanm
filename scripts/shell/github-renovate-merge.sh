#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# GitHub Renovate PR Merge
#
# Scans every git repository under a directory for open pull
# requests opened by Renovate. If every check on a PR is green
# (completed with success/skipped/neutral — no failures), the
# PR is squash-merged.
#
# Usage:
#   ./shell/github-renovate-merge.sh
#   ./shell/github-renovate-merge.sh ~/git/github.com/hieudoanm
#   ./shell/github-renovate-merge.sh ~/git/github.com/hieudoanm --dry-run
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCAN_DIR="$(dirname "$REPO_ROOT")"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *) SCAN_DIR="$arg" ;;
  esac
done

BOLD=$'\033[1m'
GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
DIM=$'\033[2m'
RESET=$'\033[0m'

merged=0
skipped=0
failed=0
repos_scanned=0

check_state() {
  # $1 = JSON array of statusCheckRollup contexts.
  # Prints "green", "failed", or "pending".
  jq -r '
    if length == 0 then "pending"
    elif any(.[]; (((.status // "COMPLETED") | ascii_upcase) != "COMPLETED") or
                  (((.conclusion // .state // "") | ascii_downcase) == "pending" or
                   (.conclusion // .state // "") == null or
                   (.conclusion // .state // "") == "")) then "pending"
    elif any(.[]; ((.conclusion // .state // "") | ascii_downcase) as $c |
                  (["failure", "error", "cancelled", "timed_out", "action_required", "stale"] | index($c) != null)) then "failed"
    elif all(.[]; ((.conclusion // .state // "") | ascii_downcase) as $c |
                  ["success", "skipped", "neutral"] | index($c) != null) then "green"
    else "pending"
    end
  ' <<<"$1"
}

log_pr() {
  # $1 = status color, $2 = status text, $3 = slug, $4 = num, $5 = title
  printf '  %s%-22s%s %-14s %s#%s%s %s\n' \
    "$1" "$2" "$RESET" "$DIM" "$3" "$4" "$RESET" "$5"
}

shopt -s nullglob
for dir in "$SCAN_DIR"/*/; do
  [ -d "$dir/.git" ] || [ -f "$dir/.git" ] || continue

  remote="$(git -C "$dir" remote get-url origin 2>/dev/null)" || continue
  [[ "$remote" =~ github\.com[:/]([^/]+)/([^/]+)$ ]] || continue
  owner="${BASH_REMATCH[1]}"
  repo="${BASH_REMATCH[2]%.git}"
  slug="$owner/$repo"

  prs="$(gh pr list -R "$slug" --state open --limit 50 \
    --json number,title,author,isDraft,mergeable,statusCheckRollup,headRefName \
    --jq '.[] | select(.author.login | test("renovate"; "i")) |
          "\(.number)\t\(.title)\t\(.isDraft)\t\(.mergeable)\t\(.statusCheckRollup | @json)"' \
    2>/dev/null)" || continue

  [ -n "$prs" ] || continue
  repos_scanned=$((repos_scanned + 1))

  printf '\n%s==>%s %s%s%s\n' "$BOLD" "$RESET" "$BOLD" "$slug" "$RESET"

  while IFS=$'\t' read -r num title draft mergeable checks; do
    [ -n "$num" ] || continue

    if [ "$draft" = "true" ]; then
      log_pr "$YELLOW" "draft" "$slug" "$num" "$title"
      skipped=$((skipped + 1))
      continue
    fi
    if [ "$mergeable" = "CONFLICTING" ]; then
      log_pr "$RED" "conflicts" "$slug" "$num" "$title"
      skipped=$((skipped + 1))
      continue
    fi
    state="$(check_state "$checks")"
    if [ "$state" != "green" ]; then
      if [ "$state" = "failed" ]; then
        log_pr "$RED" "checks failed" "$slug" "$num" "$title"
      else
        log_pr "$YELLOW" "checks pending" "$slug" "$num" "$title"
      fi
      skipped=$((skipped + 1))
      continue
    fi

    if [ "$DRY_RUN" = true ]; then
      log_pr "$GREEN" "would merge" "$slug" "$num" "$title"
      merged=$((merged + 1))
      continue
    fi

    if gh pr merge "$num" -R "$slug" --squash 2>/dev/null; then
      log_pr "$GREEN" "merged" "$slug" "$num" "$title"
      merged=$((merged + 1))
    else
      log_pr "$RED" "merge failed" "$slug" "$num" "$title"
      failed=$((failed + 1))
    fi
  done <<<"$prs"
done

printf '\n%s==> Summary%s\n' "$BOLD" "$RESET"
printf '  repos with renovate PRs : %d\n' "$repos_scanned"
printf '  %smerged/would merge%s        : %d\n' "$GREEN" "$RESET" "$merged"
printf '  %sskipped%s                  : %d\n' "$YELLOW" "$RESET" "$skipped"
printf '  %sfailed%s                   : %d\n' "$RED" "$RESET" "$failed"
