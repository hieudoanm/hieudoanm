#!/usr/bin/env bash
#
# git-secrests-scan.sh — Scan git repositories for accidentally committed
# secrets. No external dependencies: uses only git, grep, and standard POSIX
# tools.
#
# Scans both the working tree and full commit history of every repository
# under the root directory (or the repos passed as arguments).
#
# Usage:
#   ./git-secrests-scan.sh                     # scan all repos under ../../..
#   ./git-secrests-scan.sh /path/to/repo ...   # scan specific repos
#   ./git-secrests-scan.sh --worktree-only     # skip history scan
#
# Exit code: 0 = clean, 1 = findings, 2 = usage/environment error.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEFAULT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

WORKTREE_ONLY=0
REPOS=()
for arg in "$@"; do
    case "$arg" in
        --worktree-only) WORKTREE_ONLY=1 ;;
        *) REPOS+=("$arg") ;;
    esac
done

if [[ ${#REPOS[@]} -eq 0 ]]; then
    while IFS= read -r d; do
        REPOS+=("$d")
    done < <(find "$DEFAULT_ROOT" -maxdepth 2 \( -name .git -type d -o -name .git -type f \) -prune -exec dirname {} \; 2>/dev/null | sort)
fi

if [[ ${#REPOS[@]} -eq 0 ]]; then
    echo "error: no git repositories found under $DEFAULT_ROOT" >&2
    exit 2
fi

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
TOTAL_FINDINGS=0

# High-signal secret patterns; intentionally excludes generic
# password=/secret= assignments to limit false positives. Review any match —
# docs, tests, and placeholders can still trip these.
GREP_PATTERNS=(
    -e '-----BEGIN [A-Z0-9 ]*PRIVATE KEY'
    -e 'AKIA[0-9A-Z]{16}'
    -e 'ghp_[A-Za-z0-9]{36}' -e 'gho_[A-Za-z0-9]{36}' -e 'ghu_[A-Za-z0-9]{36}'
    -e 'ghs_[A-Za-z0-9]{36}' -e 'ghr_[A-Za-z0-9]{36}'
    -e 'github_pat_[A-Za-z0-9_]{22,}'
    -e 'glpat-[A-Za-z0-9_-]{20,}'
    -e 'xox[baprs]-[A-Za-z0-9-]{10,}'
    -e 'sk-proj-[A-Za-z0-9_-]{20,}' -e 'sk-[A-Za-z0-9_-]{32,}'
    -e 'AIza[0-9A-Za-z_-]{35}'
)

scan_repo() {
    local repo="$1"
    local name
    name="$(basename "$repo")"
    echo
    echo "${CYAN}== ${name}${RESET}  ($repo)"

    local repo_findings=0

    # 1. Working tree (tracked + untracked-but-not-ignored files)
    local wt_out
    wt_out="$(cd "$repo" && git grep -I -n -E "${GREP_PATTERNS[@]}" \
        -- . ':(exclude)*.lock' 2>/dev/null)"
    if [[ -n "$wt_out" ]]; then
        echo "${YELLOW}  [worktree]${RESET}"
        printf '%s\n' "$wt_out" | while IFS= read -r l; do printf '    %s\n' "$(printf '%s' "$l" | cut -c1-200)"; done
        repo_findings=$((repo_findings + $(printf '%s\n' "$wt_out" | wc -l | tr -d ' ')))
    fi

    # 2. Full history — one git grep across all commits
    if [[ "$WORKTREE_ONLY" -eq 0 ]]; then
        local hist_out
        hist_out="$(cd "$repo" && git grep -I -n -E "${GREP_PATTERNS[@]}" \
            $(git rev-list --all 2>/dev/null) -- . ':(exclude)*.lock' 2>/dev/null \
            | head -200)"
        if [[ -n "$hist_out" ]]; then
            echo "${YELLOW}  [history]${RESET}"
            printf '%s\n' "$hist_out" | while IFS= read -r l; do printf '    %s\n' "$(printf '%s' "$l" | cut -c1-200)"; done
            repo_findings=$((repo_findings + $(printf '%s\n' "$hist_out" | wc -l | tr -d ' ')))
        fi
    fi

    if [[ "$repo_findings" -eq 0 ]]; then
        echo "  ${GREEN}clean${RESET}"
    else
        TOTAL_FINDINGS=$((TOTAL_FINDINGS + repo_findings))
    fi
}

echo "Scanning ${#REPOS[@]} repositories (worktree$( [[ $WORKTREE_ONLY -eq 0 ]] && echo +history || echo ))..."
for repo in "${REPOS[@]}"; do
    [[ -d "$repo/.git" || -f "$repo/.git" ]] || { echo "skip (not a git repo): $repo" >&2; continue; }
    scan_repo "$repo"
done

echo
if [[ "$TOTAL_FINDINGS" -eq 0 ]]; then
    echo "${GREEN}No secrets found.${RESET}"
    exit 0
else
    echo "${RED}Found $TOTAL_FINDINGS potential secret(s).${RESET} Review matches above — some may be false positives (placeholders, docs, tests)."
    exit 1
fi
