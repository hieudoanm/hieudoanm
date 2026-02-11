#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# GitHub Account Statistics
#
# Usage:
#   ./github-stats.sh
#   ./github-stats.sh hieudoanm
#   ./github-stats.sh hieudoanm --output stats.json
# ============================================================

GITHUB_USER="${1:-}"
OUTPUT_FILE=""

START_TIME=$(date +%s)

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
BOLD='\033[1m'

[[ -t 1 ]] || {
    RESET=''
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    GRAY=''
    BOLD=''
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
    local positional=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --output|-o)
                [[ $# -ge 2 ]] || {
                    error "--output requires a filename."
                    exit 1
                }
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: ./github-stats.sh [username] [--output stats.json]"
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                exit 1
                ;;
            *)
                positional+=("$1")
                shift
                ;;
        esac
    done

    GITHUB_USER="${positional[0]:-}"
}

check_dependencies() {
    info "Checking dependencies..."

    command -v gh >/dev/null 2>&1 || {
        error "GitHub CLI is not installed."
        exit 1
    }

    command -v jq >/dev/null 2>&1 || {
        error "jq is not installed. Install it using:"
        echo "  macOS: brew install jq"
        echo "  Ubuntu: sudo apt-get install jq"
        exit 1
    }

    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI is not authenticated."
        info "Run: gh auth login"
        exit 1
    fi

    success "All dependencies are available."
}

fetch_user() {
    info "Fetching GitHub account information..."

    if [[ -z "$GITHUB_USER" ]]; then
        GITHUB_USER=$(gh api user --jq '.login') || {
            error "Could not identify authenticated user."
            exit 1
        }
    fi

    USER_DATA=$(gh api "users/$GITHUB_USER") || {
        error "Could not retrieve GitHub user: $GITHUB_USER"
        exit 1
    }

    info "Account: $GITHUB_USER"
    success "Account information retrieved."
}

fetch_repositories() {
    info "Fetching repository information..."
    info "This may take a moment for large accounts."

    REPOSITORY_DATA=$(gh repo list "$GITHUB_USER" \
        --limit 1000 \
        --json nameWithOwner,isPrivate,isArchived,isFork,stargazerCount,forkCount,updatedAt,primaryLanguage,url) || {
        error "Could not retrieve repositories."
        exit 1
    }

    REPOSITORY_COUNT=$(echo "$REPOSITORY_DATA" | jq 'length')

    success "Retrieved $REPOSITORY_COUNT repositories."
}

calculate_statistics() {
    info "Calculating account statistics..."

    PUBLIC_COUNT=$(echo "$REPOSITORY_DATA" |
        jq '[.[] | select(.isPrivate == false)] | length')

    PRIVATE_COUNT=$(echo "$REPOSITORY_DATA" |
        jq '[.[] | select(.isPrivate == true)] | length')

    ARCHIVED_COUNT=$(echo "$REPOSITORY_DATA" |
        jq '[.[] | select(.isArchived == true)] | length')

    FORK_COUNT=$(echo "$REPOSITORY_DATA" |
        jq '[.[] | select(.isFork == true)] | length')

    ORIGINAL_COUNT=$((REPOSITORY_COUNT - FORK_COUNT))

    TOTAL_STARS=$(echo "$REPOSITORY_DATA" |
        jq '[.[].stargazerCount] | add // 0')

    TOTAL_FORKS=$(echo "$REPOSITORY_DATA" |
        jq '[.[].forkCount] | add // 0')

    FOLLOWERS=$(echo "$USER_DATA" | jq '.followers // 0')
    FOLLOWING=$(echo "$USER_DATA" | jq '.following // 0')

    ACCOUNT_CREATED=$(echo "$USER_DATA" | jq -r '.created_at')
    ACCOUNT_LOCATION=$(echo "$USER_DATA" |
        jq -r '.location // "Not specified"')

    success "Statistics calculated."
}

print_header() {
    echo
    printf "%b" "$BOLD"
    echo "============================================================"
    echo "                  GITHUB ACCOUNT STATS"
    echo "============================================================"
    printf "%b" "$RESET"

    echo
    printf "  Account       : %b@%s%b\n" "$CYAN" "$GITHUB_USER" "$RESET"
    printf "  Name          : %s\n" "$(echo "$USER_DATA" | jq -r '.name // "Not specified"')"
    printf "  Location      : %s\n" "$ACCOUNT_LOCATION"
    printf "  Created       : %s\n" "${ACCOUNT_CREATED%%T*}"
    printf "  Profile       : %s\n" "$(echo "$USER_DATA" | jq -r '.html_url')"
}

print_repository_statistics() {
    echo
    echo "============================================================"
    echo "                  REPOSITORY OVERVIEW"
    echo "============================================================"

    printf "  Total repositories : %s\n" "$REPOSITORY_COUNT"
    printf "  Public             : %s\n" "$PUBLIC_COUNT"
    printf "  Private            : %s\n" "$PRIVATE_COUNT"
    printf "  Original projects  : %s\n" "$ORIGINAL_COUNT"
    printf "  Forks              : %s\n" "$FORK_COUNT"
    printf "  Archived           : %s\n" "$ARCHIVED_COUNT"

    echo
    echo "============================================================"
    echo "                  COMMUNITY OVERVIEW"
    echo "============================================================"

    printf "  Followers          : %s\n" "$FOLLOWERS"
    printf "  Following          : %s\n" "$FOLLOWING"
    printf "  Total stars        : %s\n" "$TOTAL_STARS"
    printf "  Total forks        : %s\n" "$TOTAL_FORKS"
}

print_languages() {
    echo
    echo "============================================================"
    echo "                  LANGUAGE DISTRIBUTION"
    echo "============================================================"

    local languages

    languages=$(echo "$REPOSITORY_DATA" | jq -r '
        [
            .[]
            | select(.primaryLanguage != null)
            | .primaryLanguage.name
        ]
        | group_by(.)
        | map({
            name: .[0],
            count: length
        })
        | sort_by(-.count)
        | .[:15][]
        | "\(.name)\t\(.count)"
    ')

    if [[ -z "$languages" ]]; then
        warn "No language information available."
        return
    fi

    printf "%-25s %s\n" "LANGUAGE" "REPOSITORIES"
    echo "------------------------------------------"

    while IFS=$'\t' read -r language count; do
        printf "%-25s %s\n" "$language" "$count"
    done <<< "$languages"
}

print_top_repositories() {
    echo
    echo "============================================================"
    echo "                  TOP REPOSITORIES BY STARS"
    echo "============================================================"

    echo "$REPOSITORY_DATA" | jq -r '
        sort_by(-.stargazerCount)
        | .[:10][]
        | "\(.stargazerCount)\t\(.nameWithOwner)"
    ' | while IFS=$'\t' read -r stars repository; do
        printf "  %-8s %s\n" "$stars stars" "$repository"
    done
}

print_recent_repositories() {
    echo
    echo "============================================================"
    echo "                  RECENTLY UPDATED PROJECTS"
    echo "============================================================"

    echo "$REPOSITORY_DATA" | jq -r '
        sort_by(.updatedAt)
        | reverse
        | .[:10][]
        | "\(.updatedAt[0:10])\t\(.nameWithOwner)"
    ' | while IFS=$'\t' read -r updated repository; do
        printf "  %-12s %s\n" "$updated" "$repository"
    done
}

export_statistics() {
    [[ -z "$OUTPUT_FILE" ]] && return

    info "Exporting statistics to $OUTPUT_FILE..."

    jq -n \
        --arg generated_at "$(timestamp)" \
        --arg username "$GITHUB_USER" \
        --argjson user "$USER_DATA" \
        --argjson repositories "$REPOSITORY_DATA" \
        '{
            generated_at: $generated_at,
            account: {
                username: $username,
                name: $user.name,
                followers: $user.followers,
                following: $user.following,
                created_at: $user.created_at,
                profile_url: $user.html_url
            },
            statistics: {
                total_repositories: ($repositories | length),
                public_repositories: ([$repositories[] | select(.isPrivate == false)] | length),
                private_repositories: ([$repositories[] | select(.isPrivate == true)] | length),
                archived_repositories: ([$repositories[] | select(.isArchived == true)] | length),
                forks: ([$repositories[] | select(.isFork == true)] | length),
                total_stars: ([$repositories[].stargazerCount] | add // 0),
                total_forks: ([$repositories[].forkCount] | add // 0)
            },
            repositories: $repositories
        }' > "$OUTPUT_FILE"

    success "Statistics exported successfully."
}

main() {
    parse_arguments "$@"

    echo
    info "Starting GitHub statistics collection..."
    info "Start time: $(timestamp)"

    check_dependencies
    fetch_user
    fetch_repositories
    calculate_statistics

    print_header
    print_repository_statistics
    print_languages
    print_top_repositories
    print_recent_repositories
    export_statistics

    echo
    echo "============================================================"
    echo "                  COLLECTION COMPLETE"
    echo "============================================================"
    printf "  Repositories analysed : %s\n" "$REPOSITORY_COUNT"
    printf "  Duration              : %s\n" "$(elapsed)"
    [[ -n "$OUTPUT_FILE" ]] && printf "  Exported to           : %s\n" "$OUTPUT_FILE"
    echo "============================================================"

    success "GitHub statistics collection completed."
}

USER_DATA=""
REPOSITORY_DATA=""
REPOSITORY_COUNT=0

main "$@"
