#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# System Cleanup
#
# Removes regenerable caches, logs, and temporary files.
# Nothing is deleted unless --apply is passed.
# Supports macOS and Linux.
#
# Usage:
#   ./shell/system-cleanup.sh
#   ./shell/system-cleanup.sh --apply
#   ./shell/system-cleanup.sh --apply --yes
#   ./shell/system-cleanup.sh --dev --caches
#   ./shell/system-cleanup.sh --temp --logs --days 30
#   ./shell/system-cleanup.sh --all --aggressive --apply
# ============================================================

OS="$(uname -s)"
HOME="${HOME:-$(cd ~ && pwd)}"

APPLY=false
ASSUME_YES=false
AGGRESSIVE=false
TEMP_DAYS=7
CATEGORY_SET=false

SELECT_TEMP=false
SELECT_LOGS=false
SELECT_CACHES=false
SELECT_DEV=false
SELECT_XCODE=false
SELECT_TRASH=false
SELECT_DOCKER=false
SELECT_SIMULATORS=false

START_TIME=$(date +%s)

TARGETS=0
PLANNED_KB=0
CLEANED_KB=0
FAILED=0

if [[ "$OS" == "Darwin" ]]; then
    CACHE_ROOT="$HOME/Library/Caches"
else
    CACHE_ROOT="${XDG_CACHE_HOME:-$HOME/.cache}"
fi

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

section() {
    printf '\n'
    printf '%s\n' "============================================================"
    printf '  %s\n' "$1"
    printf '%s\n' "============================================================"
}

human_kb() {
    local kb="${1:-0}"

    awk -v kb="$kb" 'BEGIN {
        split("KB MB GB TB", units, " ")
        value = kb
        unit = 1
        while (value >= 1024 && unit < 4) {
            value /= 1024
            unit++
        }
        printf "%.1f %s", value, units[unit]
    }'
}

path_size_kb() {
    local path="$1"
    local size

    if [[ ! -e "$path" ]]; then
        echo 0
        return 0
    fi

    size=$(du -sk "$path" 2>/dev/null | awk '{ print $1; exit }')
    echo "${size:-0}"
}

usage() {
    cat <<'USAGE'
Usage: ./shell/system-cleanup.sh [options]

Removes regenerable caches, logs, and temporary files.
Dry-run by default; nothing is deleted without --apply.

Options:
  --apply               Delete the selected targets
  --dry-run             Report only (default)
  -y, --yes             Skip the confirmation prompt with --apply
  --days N              Only remove temp/log entries older than N days (default: 7)
  --aggressive          Also remove heavy caches (Gradle, Maven, Go modules,
                        Xcode Archives/DeviceSupport, Cargo sources)

Categories (default: temp, logs, dev, xcode, caches):
  --temp                Temporary files
  --logs                User logs
  --dev                 Developer package-manager caches
  --xcode               Xcode DerivedData and simulator caches (macOS)
  --caches              Generic user cache directory
  --trash               Empty the Trash (opt-in)
  --docker              Prune unused Docker data (opt-in, keeps volumes)
  --simulators          Delete unavailable iOS simulators (opt-in, macOS)
  --all                 Select every category

  -h, --help            Show this help

Examples:
  ./shell/system-cleanup.sh                          # dry run with default categories
  ./shell/system-cleanup.sh --apply --yes            # clean defaults without prompting
  ./shell/system-cleanup.sh --dev --caches --apply   # only developer and user caches
  ./shell/system-cleanup.sh --all --aggressive --apply
USAGE
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --apply)
                APPLY=true
                shift
                ;;
            --dry-run)
                APPLY=false
                shift
                ;;
            -y|--yes)
                ASSUME_YES=true
                shift
                ;;
            --days)
                [[ $# -ge 2 ]] || {
                    error "--days requires a number."
                    exit 1
                }
                TEMP_DAYS="$2"
                shift 2
                ;;
            --aggressive)
                AGGRESSIVE=true
                shift
                ;;
            --temp)
                SELECT_TEMP=true
                CATEGORY_SET=true
                shift
                ;;
            --logs)
                SELECT_LOGS=true
                CATEGORY_SET=true
                shift
                ;;
            --caches)
                SELECT_CACHES=true
                CATEGORY_SET=true
                shift
                ;;
            --dev)
                SELECT_DEV=true
                CATEGORY_SET=true
                shift
                ;;
            --xcode)
                SELECT_XCODE=true
                CATEGORY_SET=true
                shift
                ;;
            --trash)
                SELECT_TRASH=true
                CATEGORY_SET=true
                shift
                ;;
            --docker)
                SELECT_DOCKER=true
                CATEGORY_SET=true
                shift
                ;;
            --simulators)
                SELECT_SIMULATORS=true
                CATEGORY_SET=true
                shift
                ;;
            --all)
                SELECT_TEMP=true
                SELECT_LOGS=true
                SELECT_CACHES=true
                SELECT_DEV=true
                SELECT_XCODE=true
                SELECT_TRASH=true
                SELECT_DOCKER=true
                SELECT_SIMULATORS=true
                CATEGORY_SET=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                error "Unexpected argument: $1"
                usage
                exit 1
                ;;
        esac
    done

    [[ "$TEMP_DAYS" =~ ^[1-9][0-9]*$ ]] || {
        error "Days must be a positive integer."
        exit 1
    }

    if [[ "$CATEGORY_SET" == false ]]; then
        SELECT_TEMP=true
        SELECT_LOGS=true
        SELECT_CACHES=true
        SELECT_DEV=true
        SELECT_XCODE=true
    fi
}

selected_categories() {
    local selected=()

    [[ "$SELECT_TEMP" == true ]] && selected+=("temp")
    [[ "$SELECT_LOGS" == true ]] && selected+=("logs")
    [[ "$SELECT_DEV" == true ]] && selected+=("dev")
    [[ "$SELECT_XCODE" == true ]] && selected+=("xcode")
    [[ "$SELECT_CACHES" == true ]] && selected+=("caches")
    [[ "$SELECT_TRASH" == true ]] && selected+=("trash")
    [[ "$SELECT_DOCKER" == true ]] && selected+=("docker")
    [[ "$SELECT_SIMULATORS" == true ]] && selected+=("simulators")

    local joined=""
    local category

    for category in "${selected[@]}"; do
        if [[ -z "$joined" ]]; then
            joined="$category"
        else
            joined="$joined, $category"
        fi
    done

    printf '%s' "$joined"
}

assert_safe_path() {
    local path="$1"

    if [[ -z "$path" ]]; then
        error "Refusing to clean an empty path."
        return 1
    fi

    if [[ "$path" != /* ]]; then
        error "Refusing to clean a relative path: $path"
        return 1
    fi

    if [[ "$path" == "/" || "$path" == "$HOME" || "$path" == "$HOME/" ]]; then
        error "Refusing to clean an unsafe path: $path"
        return 1
    fi

    return 0
}

remove_target() {
    local kind="$1"
    local path="$2"

    case "$kind" in
        contents)
            # Remove the entries but keep the directory itself, so applications
            # can keep writing to a path they already have open.
            find "$path" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null
            ;;
        path)
            rm -rf "$path" 2>/dev/null
            ;;
        *)
            error "Unknown removal kind: $kind"
            return 1
            ;;
    esac
}

handle_target() {
    local kind="$1"
    local path="$2"
    local label="$3"
    local size_kb

    if ! assert_safe_path "$path"; then
        FAILED=$((FAILED + 1))
        return 0
    fi

    if [[ ! -e "$path" ]]; then
        info "Skip: $label (not found)"
        return 0
    fi

    size_kb=$(path_size_kb "$path")

    if (( size_kb == 0 )); then
        info "Empty: $label"
        return 0
    fi

    TARGETS=$((TARGETS + 1))
    info "$label: $path ($(human_kb "$size_kb"))"

    if [[ "$APPLY" == false ]]; then
        PLANNED_KB=$((PLANNED_KB + size_kb))
        warn "Dry run: would remove $kind of $path"
        return 0
    fi

    if remove_target "$kind" "$path"; then
        CLEANED_KB=$((CLEANED_KB + size_kb))
        success "Removed: $label ($(human_kb "$size_kb"))"
    else
        error "Failed to remove: $path"
        FAILED=$((FAILED + 1))
    fi
}

clean_temp_dir() {
    local dir="$1"
    local count
    local size_kb

    count=$(find "$dir" -mindepth 1 -maxdepth 1 \
        -user "$(id -u)" -mtime +"$TEMP_DAYS" -print 2>/dev/null \
        | wc -l | tr -d ' ')

    if (( count == 0 )); then
        info "Nothing older than $TEMP_DAYS days in $dir"
        return 0
    fi

    size_kb=$(find "$dir" -mindepth 1 -maxdepth 1 \
        -user "$(id -u)" -mtime +"$TEMP_DAYS" -exec du -sk {} + 2>/dev/null \
        | awk '{ total += $1 } END { print total + 0 }')

    TARGETS=$((TARGETS + 1))
    info "Temporary entries older than $TEMP_DAYS days in $dir: $count ($(human_kb "$size_kb"))"

    if [[ "$APPLY" == false ]]; then
        PLANNED_KB=$((PLANNED_KB + size_kb))
        warn "Dry run: would remove $count entries from $dir"
        return 0
    fi

    if find "$dir" -mindepth 1 -maxdepth 1 \
        -user "$(id -u)" -mtime +"$TEMP_DAYS" -exec rm -rf {} + 2>/dev/null; then
        CLEANED_KB=$((CLEANED_KB + size_kb))
        success "Removed $count entries from $dir ($(human_kb "$size_kb"))"
    else
        error "Failed to remove some entries from $dir"
        FAILED=$((FAILED + 1))
    fi
}

clean_temp() {
    section "TEMPORARY FILES"

    local candidates=()
    local unique=()
    local dir
    local real
    local duplicate
    local i

    [[ -n "${TMPDIR:-}" ]] && candidates+=("${TMPDIR%/}")
    candidates+=("/tmp")

    for dir in "${candidates[@]}"; do
        [[ -d "$dir" ]] || continue

        real=$(cd "$dir" 2>/dev/null && pwd -P) || continue

        duplicate=false
        i=0
        while (( i < ${#unique[@]} )); do
            [[ "${unique[$i]}" == "$real" ]] && duplicate=true
            i=$((i + 1))
        done

        [[ "$duplicate" == true ]] || unique+=("$real")
    done

    if (( ${#unique[@]} == 0 )); then
        info "No usable temporary directories found."
        return 0
    fi

    for dir in "${unique[@]}"; do
        clean_temp_dir "$dir"
    done
}

clean_logs() {
    section "LOGS"

    if [[ "$OS" == "Darwin" ]]; then
        handle_target contents "$HOME/Library/Logs" "User logs"
        return 0
    fi

    if command -v journalctl >/dev/null 2>&1 \
        && journalctl --user -n 0 >/dev/null 2>&1; then
        if [[ "$APPLY" == true ]]; then
            if journalctl --user --vacuum-time="${TEMP_DAYS}d" >/dev/null 2>&1; then
                success "Vacuumed user journal entries older than $TEMP_DAYS days."
            else
                error "Failed to vacuum the user journal."
                FAILED=$((FAILED + 1))
            fi
        else
            warn "Dry run: would vacuum user journal entries older than $TEMP_DAYS days."
        fi
    else
        info "Skip: no user journal available."
    fi

    info "System logs under /var/log require sudo and are not touched."
}

handle_dev_cache() {
    local path="$1"
    local label="$2"

    if [[ "$SELECT_CACHES" == true && "$path" == "$CACHE_ROOT"/* ]]; then
        info "Skip: $label (covered by the cache category)"
        return 0
    fi

    handle_target contents "$path" "$label"
}

clean_dev() {
    section "DEVELOPER CACHES"

    handle_dev_cache "$HOME/.cargo/registry/cache" "Cargo registry cache"
    handle_dev_cache "$HOME/.npm/_cacache" "npm cache"
    handle_dev_cache "$HOME/.bun/install/cache" "Bun install cache"
    handle_dev_cache "$CACHE_ROOT/pip" "pip cache"
    handle_dev_cache "$CACHE_ROOT/yarn" "Yarn cache"
    handle_dev_cache "$HOME/.yarn/berry/cache" "Yarn Berry cache"
    handle_dev_cache "$CACHE_ROOT/go-build" "Go build cache"
    handle_dev_cache "$CACHE_ROOT/uv" "uv cache"
    handle_dev_cache "$HOME/.pnpm-store" "pnpm store"
    handle_dev_cache "$HOME/Library/pnpm/store" "pnpm store"
    handle_dev_cache "$HOME/.local/share/pnpm/store" "pnpm store"
    handle_dev_cache "$CACHE_ROOT/deno" "Deno cache"

    if [[ "$AGGRESSIVE" == true ]]; then
        warn "Aggressive mode: removing caches that require re-downloading."
        handle_dev_cache "$HOME/.cargo/registry/src" "Cargo registry sources"
        handle_dev_cache "$HOME/.gradle/caches" "Gradle caches"
        handle_dev_cache "$HOME/.m2/repository" "Maven repository"
        handle_dev_cache "$HOME/go/pkg/mod" "Go module cache"
        handle_dev_cache "$HOME/.rustup/downloads" "Rustup downloads"
    fi
}

clean_xcode() {
    section "XCODE"

    if [[ "$OS" != "Darwin" ]]; then
        info "Skip: Xcode cleanup is macOS-only."
        return 0
    fi

    handle_target contents \
        "$HOME/Library/Developer/Xcode/DerivedData" "Xcode DerivedData"
    handle_target contents \
        "$HOME/Library/Developer/CoreSimulator/Caches" "CoreSimulator caches"

    if [[ "$AGGRESSIVE" == true ]]; then
        handle_target contents \
            "$HOME/Library/Developer/Xcode/Archives" "Xcode Archives"
        handle_target contents \
            "$HOME/Library/Developer/Xcode/iOS DeviceSupport" "iOS DeviceSupport"
        handle_target contents \
            "$HOME/Library/Developer/Xcode/watchOS DeviceSupport" "watchOS DeviceSupport"
        handle_target contents \
            "$HOME/Library/Developer/Xcode/tvOS DeviceSupport" "tvOS DeviceSupport"
        handle_target contents \
            "$HOME/Library/Developer/Xcode/macOS DeviceSupport" "macOS DeviceSupport"
        handle_target contents \
            "$HOME/Library/Developer/Xcode/visionOS DeviceSupport" "visionOS DeviceSupport"
    fi
}

clean_caches() {
    section "USER CACHES"

    warn "Applications may need a restart after their caches are removed."
    handle_target contents "$CACHE_ROOT" "User cache directory"
}

clean_trash() {
    section "TRASH"

    if [[ "$OS" == "Darwin" ]]; then
        handle_target contents "$HOME/.Trash" "Trash"
        return 0
    fi

    local data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
    handle_target contents "$data_home/Trash/files" "Trash files"
    handle_target contents "$data_home/Trash/expunged" "Trash expunged files"
    handle_target contents "$data_home/Trash/info" "Trash metadata"
}

clean_docker() {
    section "DOCKER"

    if ! command -v docker >/dev/null 2>&1; then
        info "Skip: docker is not installed."
        return 0
    fi

    if ! docker info >/dev/null 2>&1; then
        warn "Skip: the Docker daemon is not running."
        return 0
    fi

    info "Current Docker disk usage:"
    docker system df 2>/dev/null || true

    if [[ "$APPLY" == true ]]; then
        if docker system prune -f >/dev/null 2>&1; then
            success "Pruned stopped containers, unused networks, dangling images, and build cache."
        else
            error "docker system prune failed."
            FAILED=$((FAILED + 1))
        fi
    else
        warn "Dry run: would run 'docker system prune -f' (volumes are preserved)."
    fi
}

clean_simulators() {
    section "SIMULATORS"

    if [[ "$OS" != "Darwin" ]]; then
        info "Skip: simulator cleanup is macOS-only."
        return 0
    fi

    if ! command -v xcrun >/dev/null 2>&1; then
        info "Skip: xcrun is not available."
        return 0
    fi

    if [[ "$APPLY" == false ]]; then
        local unavailable

        unavailable=$(xcrun simctl list devices unavailable 2>/dev/null \
            | grep -c "Unavailable" || true)

        warn "Dry run: would delete ${unavailable:-0} unavailable simulator(s)."
        return 0
    fi

    if xcrun simctl delete unavailable >/dev/null 2>&1; then
        success "Deleted unavailable simulators."
    else
        warn "No unavailable simulators were deleted."
    fi
}

main() {
    parse_arguments "$@"

    echo
    echo "============================================================"
    echo "                     SYSTEM CLEANUP"
    echo "============================================================"

    info "Start time: $(timestamp)"
    info "Operating system: $OS"
    info "Home directory: $HOME"
    info "Categories: $(selected_categories)"
    info "Temp age threshold: $TEMP_DAYS days"
    info "Apply changes: $APPLY"
    info "Aggressive mode: $AGGRESSIVE"

    if [[ "$APPLY" == true ]]; then
        echo
        warn "APPLY MODE ENABLED."
        warn "Caches, logs, temporary files, and selected opt-in targets will be permanently deleted."

        if [[ "$ASSUME_YES" == true ]]; then
            info "Proceeding without confirmation (--yes)."
        else
            if [[ ! -t 0 ]]; then
                error "Refusing to delete without confirmation in a non-interactive shell."
                error "Re-run with --yes to accept."
                exit 1
            fi

            echo
            read -r -p "Continue? [y/N] " confirmation

            case "$confirmation" in
                y|Y|yes|YES) ;;
                *)
                    warn "Operation cancelled."
                    exit 0
                    ;;
            esac
        fi
    else
        echo
        info "Dry-run mode: nothing will be deleted. Use --apply to clean."
    fi

    [[ "$SELECT_TEMP" == true ]] && clean_temp
    [[ "$SELECT_LOGS" == true ]] && clean_logs
    [[ "$SELECT_DEV" == true ]] && clean_dev
    [[ "$SELECT_XCODE" == true ]] && clean_xcode
    [[ "$SELECT_CACHES" == true ]] && clean_caches
    [[ "$SELECT_TRASH" == true ]] && clean_trash
    [[ "$SELECT_DOCKER" == true ]] && clean_docker
    [[ "$SELECT_SIMULATORS" == true ]] && clean_simulators

    section "CLEANUP SUMMARY"

    printf "Categories selected   : %s\n" "$(selected_categories)"
    printf "Targets with data     : %d\n" "$TARGETS"

    if [[ "$APPLY" == true ]]; then
        printf "Space reclaimed       : %s\n" "$(human_kb "$CLEANED_KB")"
    else
        printf "Space reclaimable     : %s\n" "$(human_kb "$PLANNED_KB")"
    fi

    printf "Failed operations     : %d\n" "$FAILED"
    printf "Duration              : %s\n" "$(elapsed)"
    printf "%s\n" "============================================================"

    if [[ "$APPLY" == false ]]; then
        info "Run with --apply to remove these files."
    fi

    (( FAILED == 0 )) || exit 1
}

main "$@"
