
#!/usr/bin/env bash

# ============================================================
# shell/system-specs.sh
# Hardware and system specifications
# Supports macOS and Linux
# ============================================================

set -uo pipefail

OS="$(uname -s)"
ARCH="$(uname -m)"

section() {
    printf '\n'
    printf '%s\n' "============================================================"
    printf '  %s\n' "$1"
    printf '%s\n' "============================================================"
}

# ------------------------------------------------------------
# SYSTEM
# ------------------------------------------------------------

section "SYSTEM"

printf "Hostname:              %s\n" "$(hostname)"
printf "Operating system:      %s\n" "$OS"
printf "Architecture:          %s\n" "$ARCH"
printf "Kernel:                %s\n" "$(uname -r)"
printf "System uptime:         %s\n" "$(uptime)"

if [[ "$OS" == "Darwin" ]]; then
    printf "OS version:            %s\n" "$(sw_vers -productVersion)"
    printf "OS build:              %s\n" "$(sw_vers -buildVersion)"
elif [[ -f /etc/os-release ]]; then
    . /etc/os-release
    printf "Distribution:          %s\n" "${PRETTY_NAME:-Unknown}"
fi

# ------------------------------------------------------------
# CPU
# ------------------------------------------------------------

section "CPU"

if [[ "$OS" == "Darwin" ]]; then
    printf "CPU brand:             %s\n" \
        "$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo Apple-Silicon)"

    printf "Logical cores:         %s\n" "$(sysctl -n hw.ncpu)"
    printf "Physical cores:        %s\n" "$(sysctl -n hw.physicalcpu)"
    printf "Performance cores:     %s\n" "$(sysctl -n hw.perflevel0.physicalcpu 2>/dev/null || echo Unknown)"
    printf "Efficiency cores:      %s\n" "$(sysctl -n hw.perflevel1.physicalcpu 2>/dev/null || echo Unknown)"
    printf "CPU frequency:         %s\n" "$(sysctl -n hw.cpufrequency 2>/dev/null || echo Dynamic/Unknown)"
    printf "CPU cache:             %s\n" "$(sysctl -n hw.l1dcachesize 2>/dev/null || echo Unknown)"

    printf "\nCPU capabilities:\n"
    sysctl -a 2>/dev/null | grep -E \
        'hw.optional.arm|hw.optional.avx|hw.optional.neon' | head -30 || true

elif [[ "$OS" == "Linux" ]]; then
    lscpu 2>/dev/null || cat /proc/cpuinfo
fi

# ------------------------------------------------------------
# MEMORY
# ------------------------------------------------------------

section "MEMORY"

if [[ "$OS" == "Darwin" ]]; then
    TOTAL="$(sysctl -n hw.memsize)"
    printf "Physical RAM:          %.2f GB\n" \
        "$(awk "BEGIN {print $TOTAL / 1073741824}")"

    printf "\nMemory statistics:\n"
    vm_stat

elif [[ "$OS" == "Linux" ]]; then
    free -h
    printf "\nDetailed memory:\n"
    cat /proc/meminfo
fi

# ------------------------------------------------------------
# GPU
# ------------------------------------------------------------

section "GPU"

if [[ "$OS" == "Darwin" ]]; then
    system_profiler SPDisplaysDataType 2>/dev/null

elif [[ "$OS" == "Linux" ]]; then
    if command -v nvidia-smi >/dev/null 2>&1; then
        nvidia-smi
    fi

    if command -v lspci >/dev/null 2>&1; then
        lspci | grep -iE 'vga|3d controller|display controller' || true
    fi
fi

# ------------------------------------------------------------
# STORAGE
# ------------------------------------------------------------

section "STORAGE"

printf "\nMounted filesystems:\n"
df -h

printf "\nPhysical storage devices:\n"

if [[ "$OS" == "Darwin" ]]; then
    diskutil list
    printf "\nDisk information:\n"
    diskutil info /
elif [[ "$OS" == "Linux" ]]; then
    lsblk -o NAME,MODEL,SIZE,TYPE,FSTYPE,MOUNTPOINTS,ROTA
fi

# ------------------------------------------------------------
# BATTERY
# ------------------------------------------------------------

section "BATTERY"

if [[ "$OS" == "Darwin" ]]; then
    pmset -g batt 2>/dev/null || true
    system_profiler SPPowerDataType 2>/dev/null || true

elif [[ -d /sys/class/power_supply ]]; then
    for battery in /sys/class/power_supply/BAT*; do
        [[ -d "$battery" ]] || continue
        for field in capacity status health energy_full energy_full_design; do
            if [[ -f "$battery/$field" ]]; then
                printf "%-25s %s\n" "$field:" "$(cat "$battery/$field")"
            fi
        done
    done
fi

# ------------------------------------------------------------
# THERMAL / POWER
# ------------------------------------------------------------

section "THERMAL AND POWER"

if [[ "$OS" == "Darwin" ]]; then
    pmset -g therm 2>/dev/null || true
    pmset -g ps 2>/dev/null || true

    printf "\nThermal information:\n"
    sysctl -a 2>/dev/null | grep -iE \
        'thermal|temperature|fan' | head -30 || true

elif [[ -d /sys/class/thermal ]]; then
    for zone in /sys/class/thermal/thermal_zone*; do
        [[ -d "$zone" ]] || continue
        printf "%s: " "$(cat "$zone/type" 2>/dev/null || echo Unknown)"
        cat "$zone/temp" 2>/dev/null || true
    done
fi

# ------------------------------------------------------------
# NETWORK HARDWARE
# ------------------------------------------------------------

section "NETWORK HARDWARE"

if [[ "$OS" == "Darwin" ]]; then
    system_profiler SPNetworkDataType 2>/dev/null
elif command -v lspci >/dev/null 2>&1; then
    lspci | grep -iE 'network|ethernet|wireless' || true
fi

# ------------------------------------------------------------
# DISPLAY
# ------------------------------------------------------------

section "DISPLAY"

if [[ "$OS" == "Darwin" ]]; then
    system_profiler SPDisplaysDataType 2>/dev/null
elif command -v xrandr >/dev/null 2>&1; then
    xrandr --current
fi

# ------------------------------------------------------------
# HARDWARE SUMMARY
# ------------------------------------------------------------

section "COMPLETE"

printf "OS:                    %s\n" "$OS"
printf "Architecture:          %s\n" "$ARCH"
printf "Report generated:      %s\n" "$(date)"
printf "\nHardware inspection completed.\n"
