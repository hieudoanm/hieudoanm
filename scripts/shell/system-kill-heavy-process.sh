
#!/usr/bin/env bash

# cleanup.sh
# Cross-platform resource-heavy process cleaner.
# Compatible with macOS Bash 3.2+ and Linux Bash 4+.
#
# Default: dry-run (no processes are killed).
#
# Usage:
#   ./cleanup.sh
#   ./cleanup.sh --apply
#   ./cleanup.sh --apply --cpu 90 --mem 25
#   ./cleanup.sh --apply --cpu 90 --mem 25 --force

set -uo pipefail

# --------------------------------------------------
# Configuration
# --------------------------------------------------

CPU_THRESHOLD=80
MEM_THRESHOLD=20
WAIT_SECONDS=5

APPLY=false
FORCE=false

CURRENT_USER="$(id -un)"
SCRIPT_PID=$$
PARENT_PID=$PPID

# Critical services and processes that should never be targeted.
PROTECTED_PATTERN='^(init|systemd|launchd|kernel_task|kthreadd|ksoftirqd|rcu_sched|migration|watchdog|watchdogd|WindowServer|loginwindow|Finder|Dock|coreaudiod|syslogd|logd|securityd|opendirectoryd|notifyd|distnoted|cfprefsd|mds|mds_stores|fseventsd|diskarbitrationd|powerd|bluetoothd|wifid|sshd|cron|crond|dbus-daemon|udevd|systemd-.*|containerd|dockerd|postgres|postmaster|mysqld|mariadbd|redis-server|mongod|cleanup\.sh)$'

# --------------------------------------------------
# Helpers
# --------------------------------------------------

log() {
    printf '[cleanup] %s\n' "$*"
}

error() {
    printf '[error] %s\n' "$*" >&2
}

usage() {
    cat <<EOF
Usage: ./cleanup.sh [options]

Options:
  --apply       Actually terminate eligible processes
  --cpu N       CPU threshold percentage (default: 80)
  --mem N       Memory threshold percentage (default: 20)
  --force       Send SIGKILL if SIGTERM fails (requires --apply)
  -h, --help    Show this help

Examples:
  ./cleanup.sh
  ./cleanup.sh --apply
  ./cleanup.sh --apply --cpu 90 --mem 25
  ./cleanup.sh --apply --cpu 80 --mem 20 --force

A process is considered heavy when:
  CPU usage >= CPU threshold OR
  Memory usage >= memory threshold

Only processes owned by the current user are considered.
EOF
}

validate_number() {
    local value="$1"
    local name="$2"

    if ! [[ "$value" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
        error "Invalid $name threshold: $value"
        exit 1
    fi

    if ! awk -v n="$value" 'BEGIN { exit !(n > 0 && n <= 100) }'; then
        error "$name threshold must be greater than 0 and at most 100."
        exit 1
    fi
}

is_protected() {
    local process="$1"

    # Compare executable basename rather than full path.
    process="${process##*/}"

    [[ "$process" =~ $PROTECTED_PATTERN ]]
}

# --------------------------------------------------
# Parse arguments
# --------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --apply)
            APPLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --cpu)
            [[ $# -ge 2 ]] || {
                error "--cpu requires a value"
                exit 1
            }
            CPU_THRESHOLD="$2"
            shift 2
            ;;
        --mem)
            [[ $# -ge 2 ]] || {
                error "--mem requires a value"
                exit 1
            }
            MEM_THRESHOLD="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

validate_number "$CPU_THRESHOLD" "CPU"
validate_number "$MEM_THRESHOLD" "Memory"

if [[ "$FORCE" == true && "$APPLY" == false ]]; then
    error "--force requires --apply"
    exit 1
fi

# --------------------------------------------------
# Platform detection
# --------------------------------------------------

OS="$(uname -s)"

case "$OS" in
    Darwin)
        PLATFORM="macOS"
        ;;
    Linux)
        PLATFORM="Linux"
        ;;
    *)
        error "Unsupported operating system: $OS"
        exit 1
        ;;
esac

if ! command -v ps >/dev/null 2>&1; then
    error "ps command not found."
    exit 1
fi

if ! command -v awk >/dev/null 2>&1; then
    error "awk command not found."
    exit 1
fi

# --------------------------------------------------
# Display configuration
# --------------------------------------------------

printf '\n'
printf '========================================\n'
printf '       PROCESS CLEANUP UTILITY\n'
printf '========================================\n'
printf ' Platform       : %s\n' "$PLATFORM"
printf ' User           : %s\n' "$CURRENT_USER"
printf ' CPU threshold  : %s%%\n' "$CPU_THRESHOLD"
printf ' Memory threshold: %s%%\n' "$MEM_THRESHOLD"
printf ' Mode           : %s\n' "$(
    if [[ "$APPLY" == true ]]; then
        echo "APPLY"
    else
        echo "DRY RUN"
    fi
)"
printf ' Force kill     : %s\n' "$FORCE"
printf '========================================\n\n'

if [[ "$APPLY" == false ]]; then
    log "Dry-run mode: no processes will be terminated."
    log "Use --apply to enable termination."
    printf '\n'
fi

# --------------------------------------------------
# Collect heavy processes
# --------------------------------------------------

log "Scanning processes..."

# Use ps fields common to macOS and Linux.
# comm is the executable name, avoiding argument parsing issues.
PROCESS_LIST="$(
    ps -axo pid=,ppid=,user=,%cpu=,%mem=,comm= 2>/dev/null |
    awk \
        -v user="$CURRENT_USER" \
        -v cpu_threshold="$CPU_THRESHOLD" \
        -v mem_threshold="$MEM_THRESHOLD" \
        -v script_pid="$SCRIPT_PID" \
        -v parent_pid="$PARENT_PID" \
        -v protected="$PROTECTED_PATTERN" '
        {
            pid = $1
            ppid = $2
            owner = $3
            cpu = $4
            mem = $5

            command = $6
            for (i = 7; i <= NF; i++) {
                command = command " " $i
            }

            executable = command
            sub(/^.*\//, "", executable)

            if (owner != user) next
            if (pid == 1 || pid == script_pid || pid == parent_pid) next
            if (ppid == script_pid) next

            if (executable ~ protected) next

            if (cpu + 0 >= cpu_threshold || mem + 0 >= mem_threshold) {
                printf "%s\t%s\t%s\t%.1f\t%.1f\t%s\n",
                    pid, ppid, owner, cpu, mem, command
            }
        }
    ' | sort -t "$(printf '\t')" -k4,4nr
)"

if [[ -z "$PROCESS_LIST" ]]; then
    log "No eligible heavy processes found."
    exit 0
fi

# --------------------------------------------------
# Display candidates
# --------------------------------------------------

printf '\n'
printf '%-8s %-8s %-8s %-8s %s\n' \
    "PID" "CPU%" "MEM%" "USER" "PROCESS"

printf '%s\n' \
    "----------------------------------------------------------------"

TOTAL=0
KILLED=0
FAILED=0
SKIPPED=0

while IFS="$(printf '\t')" read -r pid ppid owner cpu mem command; do
    [[ -n "$pid" ]] || continue

    printf '%-8s %-8s %-8s %-8s %s\n' \
        "$pid" "$cpu" "$mem" "$owner" "$command"

    TOTAL=$((TOTAL + 1))

    if [[ "$APPLY" == false ]]; then
        continue
    fi

    # Final safety checks before termination.
    if [[ "$pid" == "$SCRIPT_PID" ||
          "$pid" == "$PARENT_PID" ||
          "$pid" == 1 ||
          "$owner" != "$CURRENT_USER" ]]; then
        log "Skipping protected PID $pid."
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    if is_protected "$command"; then
        log "Skipping protected process: $command"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    log "Sending SIGTERM to PID $pid ($command)..."

    if ! kill -TERM "$pid" 2>/dev/null; then
        error "Could not terminate PID $pid."
        FAILED=$((FAILED + 1))
        continue
    fi

    # Allow graceful shutdown.
    elapsed=0

    while kill -0 "$pid" 2>/dev/null &&
          [[ "$elapsed" -lt "$WAIT_SECONDS" ]]; do
        sleep 1
        elapsed=$((elapsed + 1))
    done

    if ! kill -0 "$pid" 2>/dev/null; then
        log "Successfully terminated PID $pid."
        KILLED=$((KILLED + 1))
        continue
    fi

    if [[ "$FORCE" == true ]]; then
        log "Process still running. Sending SIGKILL to PID $pid..."

        if kill -KILL "$pid" 2>/dev/null; then
            log "SIGKILL sent to PID $pid."
            KILLED=$((KILLED + 1))
        else
            error "Failed to force-kill PID $pid."
            FAILED=$((FAILED + 1))
        fi
    else
        log "PID $pid did not exit within ${WAIT_SECONDS}s. Leaving it running."
        FAILED=$((FAILED + 1))
    fi

done <<< "$PROCESS_LIST"

# --------------------------------------------------
# Summary
# --------------------------------------------------

printf '\n'
printf '========================================\n'
printf '             CLEANUP SUMMARY\n'
printf '========================================\n'
printf ' Eligible processes : %s\n' "$TOTAL"
printf ' Terminated         : %s\n' "$KILLED"
printf ' Failed / remaining : %s\n' "$FAILED"
printf ' Skipped            : %s\n' "$SKIPPED"
printf '========================================\n\n'

if [[ "$APPLY" == false ]]; then
    log "Dry-run completed. No processes were killed."
    log "Run with --apply to execute cleanup."
fi
