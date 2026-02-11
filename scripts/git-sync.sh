#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# Git Repository Synchronisation
#
# Usage:
#   ./git-sync.sh
#   ./git-sync.sh ~/Projects/github
#   ./git-sync.sh ~/Projects/github --dry-run
# ============================================================

ROOT_DIR="${1:-$PWD}"
DRY_RUN="${2:-}"

START_TIME=$(date +%s)
TOTAL=0
SYNCED=0
SKIPPED=0
FAILED=0

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
error() { log ERROR "${RED}$1${RESET}"; }

elapsed() {
    local seconds=$(( $(date +%s) - START_TIME ))
    printf '%02d:%02d:%02d' \
        $((seconds / 3600)) \
        $(((seconds % 3600) / 60)) \
        $((seconds % 60))
}

progress() {
    local current="$1"
    local total="$2"
    local width=30
    local filled=$((current * width / total))
    local empty=$((width - filled))

    printf "\r%b[" "$CYAN"
    printf '%*s' "$filled" '' | tr ' ' '#'
    printf '%*s' "$empty" '' | tr ' ' '-'
    printf "]%b %3d%% (%d/%d)\n" \
        "$RESET" "$((current * 100 / total))" "$current" "$total"
}

is_dirty() {
    [[ -n "$(git status --porcelain)" ]]
}

sync_repository() {
    local repo="$1"
    local name="${repo##*/}"

    echo
    info "Processing repository: $name"
    info "Path: $repo"

    cd "$repo"

    if is_dirty; then
        warn "Uncommitted changes detected. Skipping."
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    local branch
    branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)

    if [[ -z "$branch" ]]; then
        warn "Detached HEAD. Skipping."
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    info "Current branch: $branch"

    local upstream
    upstream=$(git rev-parse --abbrev-ref '@{upstream}' 2>/dev/null || true)

    if [[ -z "$upstream" ]]; then
        warn "No upstream configured for $branch. Skipping."
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    info "Upstream: $upstream"

    local remotes
    remotes=$(git remote)

    if [[ -z "$remotes" ]]; then
        warn "No Git remotes configured. Skipping."
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        info "[DRY RUN] Would fetch and fast-forward $upstream."
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    info "Fetching all remotes and pruning deleted branches..."

    if ! git fetch --all --prune; then
        error "Fetch failed."
        FAILED=$((FAILED + 1))
        return
    fi

    local behind ahead
    behind=$(git rev-list --count "HEAD..$upstream")
    ahead=$(git rev-list --count "$upstream..HEAD")

    info "Commits behind: $behind"
    info "Commits ahead: $ahead"

    if (( ahead > 0 )); then
        warn "Local branch has commits not present upstream."
    fi

    if (( behind == 0 )); then
        success "Already up to date."
        SYNCED=$((SYNCED + 1))
        return
    fi

    info "Fast-forwarding branch..."

    if git merge --ff-only "$upstream"; then
        success "Successfully synchronised $name."
        SYNCED=$((SYNCED + 1))
    else
        error "Fast-forward failed. Manual intervention required."
        FAILED=$((FAILED + 1))
    fi
}

main() {
    echo
    echo "============================================================"
    echo "                 GIT REPOSITORY SYNC"
    echo "============================================================"

    info "Start time: $(timestamp)"
    info "Root directory: $ROOT_DIR"
    info "Dry run: ${DRY_RUN:-false}"

    if [[ ! -d "$ROOT_DIR" ]]; then
        error "Directory does not exist: $ROOT_DIR"
        exit 1
    fi

    ROOT_DIR="$(cd "$ROOT_DIR" && pwd)"

    if ! command -v git >/dev/null 2>&1; then
        error "Git is not installed."
        exit 1
    fi

    info "Searching for Git repositories..."

    local repositories=()

    while IFS= read -r -d '' directory; do
        repositories+=("$directory")
    done < <(
        find "$ROOT_DIR" -mindepth 1 -maxdepth 3 \
            -type d -name .git -prune -print0 |
        while IFS= read -r -d '' git_dir; do
            printf '%s\0' "${git_dir%/.git}"
        done
    )

    TOTAL=${#repositories[@]}

    info "Found $TOTAL repositories."

    if (( TOTAL == 0 )); then
        warn "No repositories found."
        exit 0
    fi

    local index=0
    local repository

    for repository in "${repositories[@]}"; do
        index=$((index + 1))

        printf "\n"
        progress "$index" "$TOTAL"

        if ! sync_repository "$repository"; then
            error "Unexpected error processing $repository"
            FAILED=$((FAILED + 1))
        fi
    done

    echo
    echo "============================================================"
    echo "                  SYNC SUMMARY"
    echo "============================================================"
    echo "Total repositories : $TOTAL"
    echo "Synchronised       : $SYNCED"
    echo "Skipped            : $SKIPPED"
    echo "Failed             : $FAILED"
    echo "Duration           : $(elapsed)"
    echo "============================================================"

    (( FAILED == 0 )) || exit 1
}

main "$@"
