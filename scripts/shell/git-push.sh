#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# Git Push All Repositories
#
# Commits all pending changes in every Git repository under
# the root directory with the same commit message, then pushes.
#
# Usage:
#   ./shell/git-push.sh
#   ./shell/git-push.sh ~/Projects/github
#   ./shell/git-push.sh ~/Projects/github --dry-run
#   ./shell/git-push.sh ~/Projects/github --dry-run "commit message"
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DEFAULT_ROOT="$(dirname "$DEFAULT_ROOT")"

ROOT_DIR="${1:-$DEFAULT_ROOT}"
DRY_RUN="${2:-}"
MESSAGE="${3:-Update}"

START_TIME=$(date +%s)
TOTAL=0
PUSHED=0
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

push_repository() {
    local repo="$1"
    local name="${repo##*/}"

    echo
    info "Processing repository: $name"
    info "Path: $repo"

    cd "$repo"

    if [[ -z "$(git status --porcelain)" ]]; then
        info "No changes. Skipping."
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
    info "Commit message: $MESSAGE"

    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        info "[DRY RUN] Would stage all changes, commit, and push."
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    git add -A

    if ! git diff --cached --quiet; then
        if ! git commit -m "$MESSAGE"; then
            error "Commit failed."
            FAILED=$((FAILED + 1))
            return
        fi
        info "Committed changes."
    else
        warn "Nothing staged after add. Skipping commit."
    fi

    local upstream
    upstream=$(git rev-parse --abbrev-ref '@{upstream}' 2>/dev/null || true)

    if [[ -n "$upstream" ]]; then
        info "Pulling with rebase from $upstream..."
        if ! git pull --rebase; then
            error "Rebase failed (conflicts?). Resolve manually."
            git rebase --abort 2>/dev/null || true
            FAILED=$((FAILED + 1))
            return
        fi

        info "Pushing to $upstream..."
        if git push; then
            success "Pushed $name."
            PUSHED=$((PUSHED + 1))
        else
            error "Push failed."
            FAILED=$((FAILED + 1))
        fi
    elif git remote | grep -qx origin; then
        info "No upstream configured. Pushing with -u origin $branch..."
        if git push -u origin "$branch"; then
            success "Pushed $name."
            PUSHED=$((PUSHED + 1))
        else
            error "Push failed."
            FAILED=$((FAILED + 1))
        fi
    else
        warn "No upstream and no origin remote. Skipping push."
        SKIPPED=$((SKIPPED + 1))
    fi
}

main() {
    echo
    echo "============================================================"
    echo "                 GIT PUSH ALL REPOSITORIES"
    echo "============================================================"

    info "Start time: $(timestamp)"
    info "Root directory: $ROOT_DIR"
    info "Dry run: ${DRY_RUN:-false}"
    info "Commit message: $MESSAGE"

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

        if ! push_repository "$repository"; then
            error "Unexpected error processing $repository"
            FAILED=$((FAILED + 1))
        fi
    done

    echo
    echo "============================================================"
    echo "                  PUSH SUMMARY"
    echo "============================================================"
    echo "Total repositories : $TOTAL"
    echo "Pushed             : $PUSHED"
    echo "Skipped            : $SKIPPED"
    echo "Failed             : $FAILED"
    echo "Duration           : $(elapsed)"
    echo "============================================================"

    (( FAILED == 0 )) || exit 1
}

main "$@"
