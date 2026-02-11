#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["requests"]
# ///
"""Collect every app's latest-release assets into data/downloads.json.

Queries the GitHub API for each repo's latest release and emits one entry
per asset, so index.html can render an aggregate downloads page that never
drifts from what GitHub actually publishes.

Usage:
    ./fetch.py [--dir PATH]
"""

import argparse
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote

import requests

APPS = [
    "api",
    "backers",
    "browsers",
    "chess",
    "fdr",
    "linguae",
    "mars",
    "markers",
    "monkey",
    "neuro.imagers",
    "resume",
    "tracers",
    "transcribers",
    "vectors",
]
MAX_WORKERS = 8
API = "https://api.github.com/repos/hieudoanm"


def auth_headers() -> dict:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        try:
            token = (
                subprocess.run(
                    ["gh", "auth", "token"], capture_output=True, text=True, timeout=10
                ).stdout.strip()
                or None
            )
        except (OSError, subprocess.SubprocessError):
            token = None
    headers = {
        "User-Agent": "hieudoanm-downloads",
        "Accept": "application/vnd.github+json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def platform_of(name: str) -> str:
    f = name.lower()
    if f.startswith("cli-") or f.startswith("desktop-"):
        if "apple-darwin" in f or f.endswith((".dmg", ".app.zip", ".pkg")):
            return "macOS"
        if "linux" in f or f.endswith((".deb", ".rpm", ".appimage")):
            return "Linux"
        if "windows" in f or f.endswith((".msi", ".exe")):
            return "Windows"
        return "CLI"
    if "jetbrains" in f or "intellij" in f:
        return "JetBrains"
    if "vscode" in f or f.endswith(".vsix"):
        return "VS Code"
    if "zed" in f:
        return "Zed"
    if f.endswith((".crx", ".xpi")) or "chrome" in f or "firefox" in f:
        return "Browser"
    return "Other"


def fetch_app(app: str) -> list[dict]:
    try:
        r = requests.get(
            f"{API}/{app}/releases/latest",
            headers=auth_headers(),
            timeout=20,
        )
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"skip {app}: {e}", file=sys.stderr)
        return []

    links = []
    for asset in r.json().get("assets", []):
        name = asset["name"]
        links.append(
            {
                "app": app,
                "platform": platform_of(name),
                "label": name,
                "size": asset.get("size", 0),
                "url": f"https://github.com/hieudoanm/{app}/releases/latest/download/{quote(name)}",
            }
        )
    return links


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", type=Path, default=Path(__file__).parent)
    args = ap.parse_args()

    out_dir = args.dir / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    all_links: list[dict] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        for links in ex.map(fetch_app, APPS):
            all_links.extend(links)

    order = {a: i for i, a in enumerate(APPS)}
    all_links.sort(key=lambda l: (order.get(l["app"], 99), l["url"]))

    out = out_dir / "downloads.json"
    out.write_text(json.dumps(all_links, indent=2) + "\n")
    apps = sorted({l["app"] for l in all_links})
    print(f"{len(all_links)} assets across {len(apps)} apps -> {out}")
    for a in apps:
        print(f"  {a}: {sum(1 for l in all_links if l['app'] == a)}")


if __name__ == "__main__":
    main()
