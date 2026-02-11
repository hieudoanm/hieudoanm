# Shell

Small, standalone Bash utilities for maintaining this machine, the local Git
checkout tree, and the GitHub account. All scripts live in [`shell/`](shell/).

Every script is self-contained (no shared library), executable, and can be run
from any directory:

```bash
cd ~/git/github.com/hieudoanm/hieudoanm
./scripts/shell/github-stats.sh
```

## Quick reference

| Script                                           | Purpose                                               | Network | Deletes data   |
| ------------------------------------------------ | ----------------------------------------------------- | ------- | -------------- |
| [`git-cleanup.sh`](#git-cleanupsh)               | Inspect local repositories and prune merged branches  | No      | With `--apply` |
| [`git-sync.sh`](#git-syncsh)                     | Fetch and fast-forward local repositories             | Yes     | No             |
| [`github-setup.sh`](#github-setupsh)             | Install Git/GitHub CLI, authenticate, clone all repos | Yes     | No             |
| [`github-stats.sh`](#github-statssh)             | Report GitHub account statistics                      | Yes     | No             |
| [`system-cleanup.sh`](#system-cleanupsh)         | Remove regenerable caches, logs and temp files        | No      | With `--apply` |
| [`system-specs.sh`](#system-specssh)             | Print hardware and system specifications              | No      | No             |
| [`opencode-reinstall.sh`](#opencode-reinstallsh) | Clean reinstall of OpenCode (macOS)                   | Yes     | Always         |

## Requirements

- **Bash** 3.2 or newer (the macOS default is sufficient).
- **Git** for `git-cleanup.sh`, `git-sync.sh`, and `github-setup.sh`.
- **GitHub CLI (`gh`)** for `github-setup.sh` and `github-stats.sh`.
- **jq** for `github-stats.sh`.
- **Docker** (optional) and **Xcode command line tools** (optional) for
  `system-cleanup.sh`.
- **macOS** for `opencode-reinstall.sh`; the other scripts also support Linux,
  except the Xcode and simulator targets in `system-cleanup.sh`.

Run `./scripts/shell/<script>.sh --help` where supported to see the exact
options.

## Conventions

- **Dry-run first.** Destructive scripts (`git-cleanup.sh`,
  `system-cleanup.sh`) report what they would do unless `--apply` is passed.
- **Confirmation.** `--apply` prompts before deleting; pass `--yes` for
  unattended runs (currently `system-cleanup.sh`).
- **Timestamps.** Most scripts print `[timestamp] [LEVEL]` log lines.
- **Colour.** ANSI colour is disabled automatically when output is piped or
  redirected.
- **Exit codes.** Scripts exit non-zero when an operation fails.
- **Scope.** Defaults are anchored to the current directory (`$PWD`) unless a
  directory argument is supplied, so the effect of a run depends on where you
  start it.

---

## `git-cleanup.sh`

Audits a directory tree of Git repositories: last commit age, uncommitted
changes, remotes, and merged local branches. With `--apply`, deletes merged
local branches after a confirmation prompt. Remote branches and repository
files are never deleted.

```bash
./scripts/shell/git-cleanup.sh
./scripts/shell/git-cleanup.sh ~/git/github.com/hieudoanm
./scripts/shell/git-cleanup.sh ~/git/github.com/hieudoanm --days 90
./scripts/shell/git-cleanup.sh ~/git/github.com/hieudoanm --apply
```

| Option         | Default | Description                                         |
| -------------- | ------- | --------------------------------------------------- |
| `[directory]`  | `$PWD`  | Root to scan (repositories up to three levels deep) |
| `--days N`     | `180`   | Age at which a repository is reported as stale      |
| `--apply`      | off     | Delete merged local branches after confirmation     |
| `--help`, `-h` |         | Show usage                                          |

Notes:

- Repositories without commits are reported but never deleted.
- Branches that are checked out, or that are the default branch, are skipped.
- Deletion uses `git branch -d`, so unmerged branches are never forced.

---

## `git-sync.sh`

Finds local repositories and fast-forwards the current branch to its upstream.
It fetches with `--prune` and never rebases or force-pushes.

```bash
./scripts/shell/git-sync.sh
./scripts/shell/git-sync.sh ~/git/github.com/hieudoanm
./scripts/shell/git-sync.sh ~/git/github.com/hieudoanm --dry-run
```

| Option        | Default | Description                                              |
| ------------- | ------- | -------------------------------------------------------- |
| `[directory]` | `$PWD`  | Root to scan (repositories up to three levels deep)      |
| `--dry-run`   | off     | Must be the **second** argument; reports what would sync |

Notes:

- Skips repositories with uncommitted changes, a detached HEAD, no upstream, or
  no remotes.
- Reports commits ahead/behind; local commits ahead are left untouched.
- Sync is `git merge --ff-only`; divergence is reported, not resolved.

---

## `github-setup.sh`

Bootstraps a development machine: detects the OS, installs Git and the GitHub
CLI if missing, authenticates `gh`, then clones every repository owned by the
given account.

```bash
./scripts/shell/github-setup.sh
./scripts/shell/github-setup.sh hieudoanm
./scripts/shell/github-setup.sh hieudoanm ~/git/github.com/hieudoanm
```

| Argument      | Default     | Description                                  |
| ------------- | ----------- | -------------------------------------------- |
| `[username]`  | `hieudoanm` | GitHub account whose repositories are cloned |
| `[directory]` | `$PWD`      | Clone destination                            |

Notes:

- Supports macOS (Homebrew), Debian/Ubuntu (APT), Fedora (DNF), and Arch
  (Pacman). Package installation may request `sudo` on Linux.
- Repository list is capped at 1000 and fetched through `gh`.
- Existing repositories are skipped; an existing non-Git directory at the
  destination is reported as a failure instead of being overwritten.
- Set `LOG_LEVEL=DEBUG` for verbose command logging.

---

## `github-stats.sh`

Collects and prints account statistics: repository counts, followers, stars,
forks, language distribution, top repositories, and recently updated projects.
Optionally exports the raw data as JSON.

```bash
./scripts/shell/github-stats.sh
./scripts/shell/github-stats.sh hieudoanm
./scripts/shell/github-stats.sh hieudoanm --output stats.json
./scripts/shell/github-stats.sh hieudoanm -o stats.json
```

| Option           | Default            | Description                           |
| ---------------- | ------------------ | ------------------------------------- |
| `[username]`     | authenticated user | Account to analyse                    |
| `--output`, `-o` | none               | Write a JSON report to the given file |
| `--help`, `-h`   |                    | Show usage                            |

Notes:

- Requires an authenticated `gh` session (`gh auth login`) and `jq`.
- Repository list is capped at 1000.
- Private repositories are counted when the token can see them.

---

## `system-cleanup.sh`

Removes regenerable caches, logs, and temporary files. **Dry-run by default**;
nothing is deleted without `--apply`, and `--apply` asks for confirmation unless
`--yes` is supplied. Supports macOS and Linux.

```bash
./scripts/shell/system-cleanup.sh                          # dry run with default categories
./scripts/shell/system-cleanup.sh --apply --yes            # clean defaults without prompting
./scripts/shell/system-cleanup.sh --dev --caches --apply   # only developer and user caches
./scripts/shell/system-cleanup.sh --temp --days 30 --apply
./scripts/shell/system-cleanup.sh --all --aggressive --apply
```

Default categories: `temp`, `logs`, `dev`, `xcode`, `caches`.

| Option         | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `--dry-run`    | Report only (default)                                              |
| `--apply`      | Delete the selected targets                                        |
| `-y`, `--yes`  | Skip the confirmation prompt                                       |
| `--days N`     | Only remove temp/journal entries older than N days (default `7`)   |
| `--aggressive` | Also remove heavy, re-downloadable caches                          |
| `--temp`       | Temporary files (`$TMPDIR`, `/tmp`, user-owned, older than N days) |
| `--logs`       | `~/Library/Logs` (macOS) or the user journal (Linux)               |
| `--dev`        | Cargo, npm, Bun, pip, Yarn, Go, uv, pnpm, and Deno caches          |
| `--xcode`      | Xcode DerivedData and CoreSimulator caches (macOS)                 |
| `--caches`     | `~/Library/Caches` (macOS) or `~/.cache` (Linux)                   |
| `--trash`      | Empty the Trash (opt-in)                                           |
| `--docker`     | `docker system prune -f`, volumes preserved (opt-in)               |
| `--simulators` | Delete unavailable simulators via `xcrun simctl` (opt-in)          |
| `--all`        | Select every category                                              |
| `--help`, `-h` | Show usage                                                         |

Notes:

- Cache directories are emptied, but the directories themselves are kept so
  running applications can continue writing to them.
- Cleaning `--caches` may require restarting running applications.
- `--aggressive` adds Gradle, Maven, Go module, Cargo source, rustup download,
  Xcode Archive, and DeviceSupport caches.
- Refuses to clean `/`, `$HOME`, empty paths, and relative paths.
- Never requires `sudo` and leaves system-owned files alone.

---

## `system-specs.sh`

Prints a read-only hardware and system report: OS, CPU, memory, GPU, storage,
battery, thermal/power, network hardware, and displays.

```bash
./scripts/shell/system-specs.sh
```

Notes:

- No options and no changes to the system.
- On macOS uses `sw_vers`, `sysctl`, `system_profiler`, `diskutil`, and `pmset`.
- On Linux uses `/proc`, `lscpu`, `free`, `lsblk`, `nvidia-smi`, and `lspci`
  where available.
- Pipe it to a file to keep a snapshot: `./scripts/shell/system-specs.sh > specs.txt`.

---

## `opencode-reinstall.sh`

Performs a clean reinstall of [OpenCode](https://opencode.ai) on macOS: stops
running processes, uninstalls the existing CLI, removes configuration, data,
cache, and state directories, then downloads and runs the official installer.

```bash
./scripts/shell/opencode-reinstall.sh
```

| Detail        | Value                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Platform      | macOS only                                                                                                     |
| Installer     | `https://opencode.ai/v2/install`                                                                               |
| Log file      | `~/reinstall-opencode-<timestamp>.log`                                                                         |
| Removed paths | `~/.opencode`, `~/.config/opencode`, `~/.local/share/opencode`, `~/.cache/opencode`, `~/.local/state/opencode` |

Notes:

- **Destructive:** local OpenCode configuration and data are removed. Back up
  anything under those paths first.
- Warnings are printed for OpenCode entries that remain in shell profiles; they
  are not edited automatically.
- Requires `curl` and an internet connection.
- Run it directly; it does not accept arguments.
