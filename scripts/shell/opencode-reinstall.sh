#!/usr/bin/env bash

set -Eeuo pipefail

# ==========================================
# OpenCode Clean Reinstall
# macOS
# ==========================================

VERSION_URL="https://opencode.ai/v2/install"
LOG_FILE="$HOME/reinstall-opencode-$(date +%Y%m%d-%H%M%S).log"

# Colours
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"
}

section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BLUE}==========================================${NC}" | tee -a "$LOG_FILE"
    log "$*"
    echo -e "${BLUE}==========================================${NC}" | tee -a "$LOG_FILE"
}

cleanup_on_error() {
    error "Installation failed. Check log: $LOG_FILE"
}

trap cleanup_on_error ERR

# ==========================================
# 1. Environment checks
# ==========================================

section "1. ENVIRONMENT CHECK"

if [[ "$(uname -s)" != "Darwin" ]]; then
    error "This script supports macOS only."
    exit 1
fi

log "macOS: $(sw_vers -productVersion)"
log "Architecture: $(uname -m)"
log "User: $USER"

if ! command -v curl >/dev/null 2>&1; then
    error "curl is required."
    exit 1
fi

if ! command -v bash >/dev/null 2>&1; then
    error "bash is required."
    exit 1
fi

# ==========================================
# 2. Detect existing installation
# ==========================================

section "2. DETECT EXISTING INSTALLATION"

OPENCODE_BIN="$(command -v opencode || true)"
TMP_PATH=""

if [[ -n "$OPENCODE_BIN" ]]; then
    log "Executable: $OPENCODE_BIN"

    log "Current version:"
    opencode --version 2>&1 | tee -a "$LOG_FILE" || true

    TMP_PATH="$(opencode debug paths tmp 2>/dev/null || true)"

    log "Running OpenCode uninstall command..."

    opencode uninstall --force 2>&1 | tee -a "$LOG_FILE" || {
        warning "Official uninstaller returned an error. Continuing with manual cleanup."
    }
else
    warning "No existing OpenCode executable found."
fi

# ==========================================
# 3. Stop remaining processes
# ==========================================

section "3. STOP OPENCode PROCESSES"

if pgrep -f '[o]pencode' >/dev/null 2>&1; then
    log "Stopping remaining OpenCode processes..."
    pkill -f '[o]pencode' || true
    sleep 2
else
    log "No remaining OpenCode processes."
fi

# ==========================================
# 4. Remove installation and data
# ==========================================

section "4. REMOVE ALL OPENCODE DATA"

DIRS=(
    "$HOME/.opencode"
    "$HOME/.config/opencode"
    "$HOME/.local/share/opencode"
    "$HOME/.cache/opencode"
    "$HOME/.local/state/opencode"
)

for dir in "${DIRS[@]}"; do
    if [[ -e "$dir" ]]; then
        log "Removing: $dir"
        rm -rf "$dir"
        success "Removed $dir"
    else
        log "Already clean: $dir"
    fi
done

# Remove the temporary directory reported by OpenCode.
if [[ -n "$TMP_PATH" && "$(basename "$TMP_PATH")" == "opencode" ]]; then
    if [[ "$TMP_PATH" == /private/var/folders/*/T/opencode ]]; then
        log "Removing temporary data: $TMP_PATH"
        rm -rf "$TMP_PATH"
    fi
fi

# ==========================================
# 5. Check shell configuration
# ==========================================

section "5. CHECK SHELL CONFIGURATION"

for file in "$HOME/.zshrc" "$HOME/.zprofile" "$HOME/.zshenv" \
            "$HOME/.bashrc" "$HOME/.bash_profile"; do
    if [[ -f "$file" ]] && grep -nEi 'opencode|OPENCODE' "$file"; then
        warning "Review obsolete OpenCode entries in $file"
    fi
done

# ==========================================
# 6. Verify cleanup
# ==========================================

section "6. VERIFY CLEANUP"

for dir in "${DIRS[@]}"; do
    if [[ -e "$dir" ]]; then
        error "Directory still exists: $dir"
        exit 1
    else
        success "Clean: $dir"
    fi
done

# ==========================================
# 7. Download official installer
# ==========================================

section "7. INSTALL LATEST OPENCODE"

INSTALLER="$(mktemp)"

log "Downloading official installer..."
curl -fL --retry 3 "$VERSION_URL" -o "$INSTALLER"

log "Running official installer..."
bash "$INSTALLER" 2>&1 | tee -a "$LOG_FILE"

rm -f "$INSTALLER"

# ==========================================
# 8. Verify installation
# ==========================================

section "8. VERIFY NEW INSTALLATION"

export PATH="$HOME/.opencode/bin:$PATH"
hash -r

if ! command -v opencode >/dev/null 2>&1; then
    error "OpenCode executable not found after installation."
    exit 1
fi

success "OpenCode installed successfully."

log "Executable: $(command -v opencode)"
log "Version:"
opencode --version 2>&1 | tee -a "$LOG_FILE"

log "Installation paths:"
opencode debug paths 2>&1 | tee -a "$LOG_FILE"

# ==========================================
# 9. Finish
# ==========================================

section "COMPLETED"

success "OpenCode has been completely reinstalled."
log "Log file: $LOG_FILE"

echo ""
echo "Run the following command to start OpenCode:"
echo ""
echo "    opencode"
echo ""
