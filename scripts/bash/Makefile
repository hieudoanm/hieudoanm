# ----------------------------------------
# Makefile for Bash + Docsify
# ----------------------------------------

# Use Bash so `echo -e` behaves as intended (make defaults to /bin/sh)
SHELL := /bin/bash

# Phony targets (always run)
.PHONY: build lint format run docsify serve-docs help

# Colors
BLUE  := \033[0;34m
GREEN := \033[0;32m
RESET := \033[0m

# ----------------------------------------
# Code Quality
# ----------------------------------------

lint:
	@echo -e "$(BLUE)==> Checking Bash syntax...$(RESET)"
	@bash -n generate.sh
	@for file in sources/*.bash; do \
		[ -e "$$file" ] || continue; \
		bash -n "$$file" || exit 1; \
	done

format:
	@echo -e "$(BLUE)==> Formatting Bash...$(RESET)"
	@if command -v shfmt >/dev/null 2>&1; then \
		shfmt -w generate.sh sources/*.bash; \
	else \
		echo "shfmt is not installed; skipping."; \
	fi

# ----------------------------------------
# Main build target
# ----------------------------------------

build: lint run
	@echo -e "$(GREEN)✔ Build complete.$(RESET)"

run:
	@echo -e "$(BLUE)==> Building generated/bundle.bash...$(RESET)"
	./generate.sh

# ----------------------------------------
# Docsify
# ----------------------------------------

docsify:
	@echo -e "$(BLUE)==> Initializing Docsify folder...$(RESET)"
	pnpx docsify-cli init ./docs

serve-docs:
	@echo -e "$(BLUE)==> Starting Docsify dev server...$(RESET)"
	pnpx docsify-cli serve ./docs

# ----------------------------------------
# Help
# ----------------------------------------

help:
	@echo "Available commands:"
	@echo "  make lint        - Check Bash syntax"
	@echo "  make format      - Format Bash with shfmt (if installed)"
	@echo "  make run         - Build generated/bundle.bash"
	@echo "  make build       - Lint + run"
	@echo "  make docsify     - Initialize Docsify"
	@echo "  make serve-docs  - Serve Docsify"
