#!/usr/bin/env bash

set -euo pipefail

# Build generated/bundle.bash from sources/*.bash.

cd "$(dirname "${BASH_SOURCE[0]}")"

SRC_DIR="sources"
GENERATED_DIR="generated"
GENERATED_FILE="$GENERATED_DIR/bundle.bash"

strip_whitespace() {
    local value="$1"

    while [[ "$value" == [[:space:]]* ]]; do
        value="${value#?}"
    done

    while [[ "$value" == *[[:space:]] ]]; do
        value="${value%?}"
    done

    printf '%s' "$value"
}

collect_sources() {
    local script

    scripts=()

    while IFS= read -r script; do
        scripts+=("$script")
    done < <(find "$SRC_DIR" -maxdepth 1 -type f -name '*.bash' | LC_ALL=C sort)
}

build_full_script() {
    local script
    local content
    local first=true

    mkdir -p "$GENERATED_DIR"

    {
        printf '#!/bin/bash\n\n'

        for script in "${scripts[@]}"; do
            content="$(sed 's|#!/bin/bash||g' "$script")"
            content="$(strip_whitespace "$content")"

            if [[ "$first" == false ]]; then
                printf '\n\n'
            fi
            first=false

            printf '%s' "$content"
        done
    } > "$GENERATED_FILE"
}

main() {
    collect_sources

    if (( ${#scripts[@]} == 0 )); then
        echo "Error: no source files found in $SRC_DIR." >&2
        exit 1
    fi

    echo "Building ${#scripts[@]} source files..."
    build_full_script
    echo "  wrote $GENERATED_FILE"
}

main "$@"
