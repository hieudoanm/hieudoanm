#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# GitHub Project Setup
#
# Usage:
#   ./github-setup.sh
#   ./github-setup.sh hieudoanm
#   ./github-setup.sh hieudoanm ~/Projects/github
#
# ============================================================

# ----------------------------
# Configuration
# ----------------------------

GITHUB_USER="${1:-hieudoanm}"
CLONE_DIR="${2:-$PWD}"

TOTAL_STEPS=5
CURRENT_STEP=0
START_TIME=$(date +%s)

TOTAL_REPOS=0
CLONED_REPOS=0
SKIPPED_REPOS=0
FAILED_REPOS=0

OS=""
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# ----------------------------
# Colors
# ----------------------------

if [[ -t 1 ]]; then
    RESET='\033[0m'
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    GRAY='\033[0;90m'
    BOLD='\033[1m'
else
    RESET=''
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    GRAY=''
    BOLD=''
fi

# ----------------------------
# Logging
# ----------------------------

timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

log() {
    local level="$1"
    shift

    printf "%b[%s] [%-7s]%b %s\n" \
        "$GRAY" "$(timestamp)" "$level" "$RESET" "$*"
}

info() {
    log INFO "$@"
}

debug() {
    if [[ "$LOG_LEVEL" == "DEBUG" ]]; then
        log DEBUG "$@"
    fi
}

success() {
    log SUCCESS "$GREEN$*$RESET"
}

warn() {
    log WARN "$YELLOW$*$RESET"
}

error() {
    log ERROR "$RED$*$RESET" >&2
}

fatal() {
    error "$@"
    exit 1
}

separator() {
    printf "%b============================================================%b\n" \
        "$CYAN" "$RESET"
}

elapsed_time() {
    local elapsed=$(( $(date +%s) - START_TIME ))
    printf '%02d:%02d:%02d' \
        $((elapsed / 3600)) \
        $(((elapsed % 3600) / 60)) \
        $((elapsed % 60))
}

progress_bar() {
    local current="$1"
    local total="$2"
    local width=30
    local filled=0

    if (( total > 0 )); then
        filled=$((current * width / total))
    fi

    local empty=$((width - filled))

    printf "\r%b[" "$CYAN"
    printf "%${filled}s" | tr ' ' '#'
    printf "%${empty}s" | tr ' ' '-'
    printf "]%b %3d%% (%d/%d)" \
        "$RESET" \
        "$((current * 100 / total))" \
        "$current" "$total"
}

step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))

    echo
    separator
    log STEP "STEP $CURRENT_STEP/$TOTAL_STEPS: $1"
    separator
}

run_command() {
    debug "Executing: $*"

    if "$@"; then
        debug "Command completed successfully."
        return 0
    else
        local status=$?
        warn "Command failed with exit code $status: $*"
        return "$status"
    fi
}

# ----------------------------
# Error handling
# ----------------------------

on_error() {
    local exit_code=$?
    local line_number="${1:-unknown}"

    error "Unexpected error at line $line_number (exit code: $exit_code)."
    error "Setup stopped after $(elapsed_time)."

    exit "$exit_code"
}

trap 'on_error $LINENO' ERR

# ----------------------------
# OS Detection
# ----------------------------

detect_os() {
    step "Detect Operating System"

    info "Detecting operating system..."
    info "Kernel: $(uname -s)"
    info "Architecture: $(uname -m)"

    case "$(uname -s)" in
        Darwin)
            OS="macos"
            info "Detected macOS."
            ;;

        Linux)
            if [[ -f /etc/debian_version ]]; then
                OS="debian"
            elif [[ -f /etc/fedora-release ]]; then
                OS="fedora"
            elif [[ -f /etc/arch-release ]]; then
                OS="arch"
            else
                fatal "Unsupported Linux distribution."
            fi

            info "Detected Linux distribution: $OS"
            ;;

        *)
            fatal "Unsupported operating system."
            ;;
    esac

    success "Operating system detection completed."
}

# ----------------------------
# Package Installation
# ----------------------------

install_packages() {
    local packages=("$@")

    info "Preparing package installation."
    info "Packages: ${packages[*]}"

    case "$OS" in
        macos)
            command -v brew >/dev/null 2>&1 \
                || fatal "Homebrew is required. Install it from https://brew.sh"

            info "Using Homebrew..."
            run_command brew install "${packages[@]}"
            ;;

        debian)
            info "Updating APT package index..."
            run_command sudo apt-get update

            info "Installing packages through APT..."
            run_command sudo apt-get install -y "${packages[@]}"
            ;;

        fedora)
            info "Installing packages through DNF..."
            run_command sudo dnf install -y "${packages[@]}"
            ;;

        arch)
            info "Installing packages through Pacman..."
            run_command sudo pacman -Sy --needed --noconfirm "${packages[@]}"
            ;;
    esac
}

# ----------------------------
# Git Installation
# ----------------------------

install_git() {
    step "Check and Install Git"

    info "Checking whether Git is installed..."

    if command -v git >/dev/null 2>&1; then
        success "Git is already installed."
        info "Version: $(git --version)"
    else
        warn "Git was not found."
        info "Starting Git installation..."

        install_packages git

        command -v git >/dev/null 2>&1 \
            || fatal "Git installation failed."

        success "Git installed successfully."
        info "Version: $(git --version)"
    fi

    info "Git executable: $(command -v git)"
}

# ----------------------------
# GitHub CLI Installation
# ----------------------------

install_github_cli() {
    step "Check and Install GitHub CLI"

    info "Checking whether GitHub CLI is installed..."

    if command -v gh >/dev/null 2>&1; then
        success "GitHub CLI is already installed."
        info "Version: $(gh --version | head -n 1)"
    else
        warn "GitHub CLI was not found."
        info "Starting GitHub CLI installation..."

        case "$OS" in
            macos)
                install_packages gh
                ;;

            debian)
                info "Installing GitHub CLI repository prerequisites..."

                install_packages curl gpg

                info "Adding GitHub CLI signing key..."

                sudo mkdir -p -m 755 /etc/apt/keyrings

                curl -fsSL \
                    https://cli.github.com/packages/githubcli-archive-keyring.gpg \
                    | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg \
                    >/dev/null

                sudo chmod go+r \
                    /etc/apt/keyrings/githubcli-archive-keyring.gpg

                info "Adding GitHub CLI APT repository..."

                echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
                    | sudo tee /etc/apt/sources.list.d/github-cli.list \
                    >/dev/null

                info "Updating APT package index..."
                run_command sudo apt-get update

                info "Installing GitHub CLI..."
                run_command sudo apt-get install -y gh
                ;;

            fedora)
                install_packages gh
                ;;

            arch)
                install_packages github-cli
                ;;
        esac

        command -v gh >/dev/null 2>&1 \
            || fatal "GitHub CLI installation failed."

        success "GitHub CLI installed successfully."
        info "Version: $(gh --version | head -n 1)"
    fi

    info "GitHub CLI executable: $(command -v gh)"
}

# ----------------------------
# GitHub Authentication
# ----------------------------

authenticate_github() {
    step "Check GitHub Authentication"

    info "Checking existing GitHub authentication..."

    if gh auth status >/dev/null 2>&1; then
        success "GitHub authentication is already configured."

        info "Authenticated account:"
        gh api user --jq '"Username: @" + .login'

        return
    fi

    warn "GitHub authentication is not configured."
    info "Starting interactive GitHub authentication..."
    info "Follow the instructions displayed by GitHub CLI."
    echo

    gh auth login

    info "Verifying GitHub authentication..."

    gh auth status >/dev/null 2>&1 \
        || fatal "GitHub authentication failed."

    success "GitHub authentication completed."

    info "Authenticated account:"
    gh api user --jq '"Username: @" + .login'
}

# ----------------------------
# Repository Discovery
# ----------------------------

fetch_repositories() {
    info "Checking GitHub username: $GITHUB_USER"
    info "Requesting repository list from GitHub API..."
    info "Repository limit: 1000"

    local repositories

    if ! repositories=$(gh repo list "$GITHUB_USER" \
        --limit 1000 \
        --json nameWithOwner \
        --jq '.[].nameWithOwner'); then
        fatal "Could not retrieve repositories for $GITHUB_USER."
    fi

    if [[ -z "$repositories" ]]; then
        warn "No repositories found."
        return 0
    fi

    REPOSITORIES="$repositories"

    TOTAL_REPOS=$(printf '%s\n' "$REPOSITORIES" | wc -l | tr -d ' ')

    success "Repository discovery completed."
    info "Found $TOTAL_REPOS repositories."
}

# ----------------------------
# Clone Repositories
# ----------------------------

clone_repositories() {
    step "Clone GitHub Repositories"

    info "GitHub user: $GITHUB_USER"
    info "Destination: $CLONE_DIR"

    info "Creating destination directory..."

    mkdir -p "$CLONE_DIR"

    CLONE_DIR="$(cd "$CLONE_DIR" && pwd)"

    success "Destination directory ready: $CLONE_DIR"

    info "Fetching repository list..."
    fetch_repositories

    if (( TOTAL_REPOS == 0 )); then
        warn "Nothing to clone."
        return
    fi

    echo
    separator
    info "Starting repository cloning."
    info "Total repositories: $TOTAL_REPOS"
    info "Existing repositories will be skipped."
    info "Failed repositories will not stop the process."
    separator

    local current=0
    local repository
    local repo_name
    local destination
    local repo_start
    local repo_duration

    while IFS= read -r repository; do
        [[ -z "$repository" ]] && continue

        current=$((current + 1))

        repo_name="${repository##*/}"
        destination="$CLONE_DIR/$repo_name"

        repo_start=$(date +%s)

        echo
        separator

        log REPOSITORY "[$current/$TOTAL_REPOS] $repository"

        progress_bar "$current" "$TOTAL_REPOS"
        echo

        info "Repository name: $repo_name"
        info "Destination: $destination"

        # Already cloned
        if [[ -d "$destination/.git" ]]; then
            warn "Repository already exists. Skipping."
            SKIPPED_REPOS=$((SKIPPED_REPOS + 1))

        # Destination exists but is not a Git repository
        elif [[ -e "$destination" ]]; then
            warn "Destination already exists but is not a Git repository."
            warn "Skipping to avoid overwriting existing files."
            FAILED_REPOS=$((FAILED_REPOS + 1))

        # Clone repository
        else
            info "Cloning repository from GitHub..."
            info "Command: gh repo clone $repository $destination"

            if gh repo clone "$repository" "$destination"; then
                success "Repository cloned successfully."
                CLONED_REPOS=$((CLONED_REPOS + 1))
            else
                warn "Repository cloning failed: $repository"
                FAILED_REPOS=$((FAILED_REPOS + 1))
            fi
        fi

        repo_duration=$(( $(date +%s) - repo_start ))

        info "Repository duration: ${repo_duration}s"
        info "Progress: $current/$TOTAL_REPOS"
        info "Cloned: $CLONED_REPOS | Skipped: $SKIPPED_REPOS | Failed: $FAILED_REPOS"
        info "Total elapsed: $(elapsed_time)"

    done <<< "$REPOSITORIES"

    echo
    progress_bar "$TOTAL_REPOS" "$TOTAL_REPOS"
    echo
}

# ----------------------------
# Final Summary
# ----------------------------

print_summary() {
    step "Final Summary"

    local end_time
    end_time=$(elapsed_time)

    separator

    printf "%b\n" "$BOLD"
    echo "                  SETUP COMPLETED"
    printf "%b\n" "$RESET"

    separator

    echo " Configuration"
    echo " ----------------------------------------"
    echo " Operating system : $OS"
    echo " GitHub user      : $GITHUB_USER"
    echo " Destination      : $CLONE_DIR"

    echo
    echo " Installation"
    echo " ----------------------------------------"
    echo " Git              : $(git --version)"
    echo " GitHub CLI       : $(gh --version | head -n 1)"

    echo
    echo " Repository Results"
    echo " ----------------------------------------"
    echo " Total            : $TOTAL_REPOS"
    echo " Cloned           : $CLONED_REPOS"
    echo " Skipped          : $SKIPPED_REPOS"
    echo " Failed           : $FAILED_REPOS"

    echo
    echo " Execution"
    echo " ----------------------------------------"
    echo " Total duration   : $end_time"

    separator

    if (( FAILED_REPOS > 0 )); then
        warn "Setup completed with $FAILED_REPOS repository errors."
    else
        success "All repositories processed successfully!"
    fi

    echo
}

# ----------------------------
# Main
# ----------------------------

main() {
    separator

    echo
    printf "%b" "$BOLD"
    echo "              GITHUB PROJECT SETUP"
    printf "%b" "$RESET"
    echo

    info "Starting setup..."
    info "Start time: $(timestamp)"
    info "GitHub user: $GITHUB_USER"
    info "Clone directory: $CLONE_DIR"
    info "Log level: $LOG_LEVEL"

    detect_os
    install_git
    install_github_cli
    authenticate_github
    clone_repositories
    print_summary
}

main "$@"
