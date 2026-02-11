#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# Git Repository Cleanup
#
# Usage:
#   ./git-cleanup.sh
#   ./git-cleanup.sh ~/Projects/github
#   ./git-cleanup.sh ~/Projects/github --days 90
#   ./git-cleanup.sh ~/Projects/github --apply
#   ./git-cleanup.sh ~/Projects/github --days 90 --apply
# ============================================================

ROOT_DIR="$PWD"
STALE_DAYS=180
APPLY=false

START_TIME=$(date +%s)

TOTAL=0
STALE=0
DIRTY=0
NO_REMOTE=0
MERGED_BRANCHES=0
DELETED_BRANCHES=0
FAILED=0

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'

[[ -t 1 ]] || {
    RESET=''
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
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

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --days)
                [[ $# -ge 2 ]] || {
                    error "--days requires a number."
                    exit 1
                }
                STALE_DAYS="$2"
                shift 2
                ;;
            --apply)
                APPLY=true
                shift
                ;;
            --help|-h)
                echo "Usage: ./git-cleanup.sh [directory] [--days N] [--apply]"
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                exit 1
                ;;
            *)
                ROOT_DIR="$1"
                shift
                ;;
        esac
    done

    [[ "$STALE_DAYS" =~ ^[0-9]+$ ]] || {
        error "Days must be a non-negative integer."
        exit 1
    }
}

find_repositories() {
    local result=()

    while IFS= read -r -d '' git_dir; do
        result+=("${git_dir%/.git}")
    done < <(
        find "$ROOT_DIR" -mindepth 1 -maxdepth 3 \
            -type d -name .git -prune -print0
    )

    REPOSITORIES=("${result[@]}")
    TOTAL=${#REPOSITORIES[@]}
}

inspect_repository() {
    local repo="$1"
    local name="${repo##*/}"

    echo
    info "Inspecting: $name"
    info "Location: $repo"

    cd "$repo"

    # Last commit date
    local last_commit
    local last_timestamp
    local age_days

    last_timestamp=$(git log -1 --format=%ct 2>/dev/null || true)

    if [[ -z "$last_timestamp" ]]; then
        warn "Repository has no commits."
        age_days=-1
    else
        age_days=$(( ($(date +%s) - last_timestamp) / 86400 ))
        last_commit=$(git log -1 --format='%h %s' 2>/dev/null || true)

        info "Last commit: $last_commit"
        info "Last commit age: $age_days days"

        if (( age_days >= STALE_DAYS )); then
            warn "Repository is stale."
            STALE=$((STALE + 1))
        fi
    fi

    # Working tree
    if [[ -n "$(git status --porcelain)" ]]; then
        warn "Uncommitted changes detected."
        DIRTY=$((DIRTY + 1))
    else
        success "Working tree clean."
    fi

    # Remote
    if [[ -z "$(git remote)" ]]; then
        warn "No remote configured."
        NO_REMOTE=$((NO_REMOTE + 1))
    else
        info "Remotes:"
        git remote -v | sort -u
    fi

    # Default branch detection
    local default_ref
    local default_branch

    default_ref=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || true)
    default_branch="${default_ref#refs/remotes/origin/}"

    if [[ -z "$default_branch" ]]; then
        default_branch=$(git config --get init.defaultBranch || echo main)
    fi

    info "Default branch candidate: $default_branch"

    # Inspect merged local branches
    local current_branch
    current_branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)

    if [[ -n "$current_branch" ]] && git show-ref \
        --verify --quiet "refs/heads/$default_branch"; then

        local merged

        merged=$(git branch --format='%(refname:short)' \
            --merged "$default_branch")

        while IFS= read -r branch; do
            [[ -z "$branch" ]] && continue
            [[ "$branch" == "$current_branch" ]] && continue
            [[ "$branch" == "$default_branch" ]] && continue

            MERGED_BRANCHES=$((MERGED_BRANCHES + 1))

            info "Merged branch candidate: $branch"

            if [[ "$APPLY" == true ]]; then
                if git branch -d "$branch"; then
                    success "Deleted local branch: $branch"
                    DELETED_BRANCHES=$((DELETED_BRANCHES + 1))
                else
                    warn "Could not delete branch: $branch"
                    FAILED=$((FAILED + 1))
                fi
            else
                warn "Dry run: branch will not be deleted."
            fi

        done <<< "$merged"
    else
        warn "Could not determine local default branch. Skipping branch cleanup."
    fi
}

main() {
    parse_arguments "$@"

    echo
    echo "============================================================"
    echo "                  GIT REPOSITORY CLEANUP"
    echo "============================================================"

    info "Start time: $(timestamp)"
    info "Root directory: $ROOT_DIR"
    info "Stale threshold: $STALE_DAYS days"
    info "Apply changes: $APPLY"

    if ! command -v git >/dev/null 2>&1; then
        error "Git is not installed."
        exit 1
    fi

    if [[ ! -d "$ROOT_DIR" ]]; then
        error "Directory does not exist."
        exit 1
    fi

    ROOT_DIR="$(cd "$ROOT_DIR" && pwd)"

    info "Discovering repositories..."
    find_repositories

    success "Found $TOTAL repositories."

    if (( TOTAL == 0 )); then
        warn "No repositories found."
        exit 0
    fi

    if [[ "$APPLY" == true ]]; then
        warn "APPLY MODE ENABLED."
        warn "Merged local branches may be deleted."
        warn "Repository files and remote branches will not be deleted."
        echo
        read -r -p "Continue? [y/N] " confirmation

        case "$confirmation" in
            y|Y|yes|YES) ;;
            *)
                warn "Operation cancelled."
                exit 0
                ;;
        esac
    else
        info "Dry-run mode: no branches will be deleted."
    fi

    local repo
    local index=0

    for repo in "${REPOSITORIES[@]}"; do
        index=$((index + 1))

        echo
        info "Progress: $index/$TOTAL"

        if ! inspect_repository "$repo"; then
            error "Failed to inspect $repo"
            FAILED=$((FAILED + 1))
        fi
    done

    echo
    echo "============================================================"
    echo "                 CLEANUP SUMMARY"
    echo "============================================================"
    echo "Repositories inspected : $TOTAL"
    echo "Stale repositories     : $STALE"
    echo "Dirty repositories     : $DIRTY"
    echo "Without remotes        : $NO_REMOTE"
    echo "Merged branches found  : $MERGED_BRANCHES"
    echo "Branches deleted       : $DELETED_BRANCHES"
    echo "Failed operations      : $FAILED"
    echo "Duration               : $(elapsed)"
    echo "============================================================"

    if [[ "$APPLY" == false ]]; then
        info "Run with --apply to delete eligible merged local branches."
    fi

    (( FAILED == 0 )) || exit 1
}

main "$@"
