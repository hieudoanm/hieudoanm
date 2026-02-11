#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# Git Remote Origin Checker
#
# Prints the origin remote URL of every Git repository under
# the root directory.
#
# Usage:
#   ./shell/github-remote-origin.sh
#   ./shell/github-remote-origin.sh ~/Projects/github
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

ROOT_DIR="${1:-$DEFAULT_ROOT}"

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'

[[ -t 1 ]] || {
    RESET=''
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    GRAY=''
}

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    printf "%b[%s] [%-7s]%b %s\n" \
        "$GRAY" "$(timestamp)" "$1" "$RESET" "$2"
}

info() { log INFO "$1"; }
success() { log SUCCESS "${GREEN}$1${RESET}"; }
warn() { log WARN "${YELLOW}$1${RESET}"; }

main() {
    echo
    echo "============================================================"
    echo "              GIT REMOTE ORIGIN REPORT"
    echo "============================================================"

    info "Root directory: $ROOT_DIR"

    if [[ ! -d "$ROOT_DIR" ]]; then
        echo "Directory does not exist: $ROOT_DIR" >&2
        exit 1
    fi

    ROOT_DIR="$(cd "$ROOT_DIR" && pwd)"

    if ! command -v git >/dev/null 2>&1; then
        echo "Git is not installed." >&2
        exit 1
    fi

    local repositories=()
    local directory

    while IFS= read -r -d '' directory; do
        repositories+=("$directory")
    done < <(
        find "$ROOT_DIR" -mindepth 1 -maxdepth 2 \
            -type d -name .git -prune -print0 |
        while IFS= read -r -d '' git_dir; do
            printf '%s\0' "${git_dir%/.git}"
        done
    )

    if (( ${#repositories[@]} == 0 )); then
        warn "No repositories found."
        exit 0
    fi

    echo
    printf "%-8s %-40s %s\n" "STATUS" "REPOSITORY" "ORIGIN"
    printf "%-8s %-40s %s\n" "------" "----------" "------"

    local repo name origin branch
    local ok=0 missing=0

    for repo in "${repositories[@]}"; do
        name="${repo##*/}"
        cd "$repo"

        origin="$(git remote get-url origin 2>/dev/null || true)"
        branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo 'DETACHED')"

        if [[ -n "$origin" ]]; then
            printf "%-8s %-40s %s\n" "${GREEN}ok${RESET}" "$name" "$origin"
            ok=$((ok + 1))
        else
            printf "%-8s %-40s %s\n" "${RED}missing${RESET}" "$name ($branch)" "-"
            missing=$((missing + 1))
        fi
    done

    echo
    echo "============================================================"
    echo "Total repositories : ${#repositories[@]}"
    echo "With origin        : $ok"
    echo "Missing origin     : $missing"
    echo "============================================================"
}

main "$@"
