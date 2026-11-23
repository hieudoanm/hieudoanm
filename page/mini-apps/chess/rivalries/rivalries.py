#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["requests"]
# ///
"""Find who a Chess.com user plays the most and their biggest rivals.

Usage:
    ./rivalries.py <username> [--dir PATH] [--max-archives N]

Fetches the user's monthly game archives from the Chess.com public API,
aggregates results per opponent, enriches the top opponents with profile
info (title/avatar), and writes CSVs into <dir>/csv/<username>_* plus a
JSON payload into <dir>/json/<username>_rivalries.json for index.html.
"""

import argparse
import csv
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE = "https://api.chess.com/pub"
MAX_WORKERS = 8
MIN_GAMES = 5   # minimum games for score-based rankings (filters 1-game flukes)
JSON_TOP = 100  # rows shipped per score-ranked table

# On the Chess.com API the winner's result is "win"/"won"/"variantwin";
# "resigned"/"checkmated"/"timeout"/"abandoned" are the loser's results.
WIN_RESULTS = {"win", "won", "variantwin"}
DRAW_RESULTS = {"agreed", "repetition", "insufficient", "startingposition"}

session = requests.Session()
session.headers["User-Agent"] = "chess-rivalries/0.1"


def get_json(url: str):
    r = session.get(url, timeout=30)
    r.raise_for_status()
    return r.json()


def iso_date(ts) -> str:
    if not ts:
        return ""
    return datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%d")


def outcome_for(user_result: str, opp_result: str) -> str:
    """Classify a game from the user's perspective using both result fields."""
    if user_result in WIN_RESULTS:
        return "win"
    if opp_result in WIN_RESULTS:
        return "loss"
    if user_result in DRAW_RESULTS or opp_result in DRAW_RESULTS:
        return "draw"
    return "loss"


def side_of(game: dict, user_lower: str):
    """Return (user_side, opponent_side, user_is_white), or None."""
    white, black = game.get("white", {}), game.get("black", {})
    if white.get("username", "").lower() == user_lower:
        return white, black, True
    if black.get("username", "").lower() == user_lower:
        return black, white, False
    return None


def scan_archive(args) -> list[dict]:
    url, user_lower = args
    try:
        data = get_json(url)
    except requests.RequestException as e:
        print(f"  archive failed {url}: {e}", file=sys.stderr)
        return []
    found = []
    for g in data.get("games", []):
        sides = side_of(g, user_lower)
        if sides is None:
            continue
        user_side, opp_side, _user_white = sides
        opp = opp_side.get("username", "")
        if not opp:
            continue
        found.append(
            {
                "opponent": opp,
                "opp_result": opp_side.get("result", ""),
                "user_result": user_side.get("result", ""),
                "date": iso_date(g.get("end_time")),
            }
        )
    return found


def add_wdl(bucket: dict, outcome: str) -> None:
    bucket["games"] += 1
    bucket[{"win": "wins", "draw": "draws", "loss": "losses"}[outcome]] += 1


def score_of(s: dict) -> float:
    return (s["wins"] + 0.5 * s["draws"]) / s["games"] if s["games"] else 0.0


def enrich_profile(username: str) -> dict:
    try:
        p = get_json(f"{BASE}/player/{username}")
        return {
            "title": p.get("title") or "",
            "avatar": p.get("avatar") or "",
            "name": p.get("name") or "",
        }
    except requests.RequestException:
        return {}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("username")
    ap.add_argument("--dir", type=Path, default=None)
    ap.add_argument("--max-archives", type=int, default=None)
    args = ap.parse_args()

    user = args.username.strip()
    user_lower = user.lower()
    base_dir = args.dir or Path(__file__).resolve().parent / "data"
    csv_dir = base_dir / "csv"
    json_dir = base_dir / "json"
    csv_dir.mkdir(parents=True, exist_ok=True)
    json_dir.mkdir(parents=True, exist_ok=True)

    try:
        profile = get_json(f"{BASE}/player/{user}")
    except requests.RequestException as e:
        sys.exit(f"failed to fetch player {user}: {e}")

    archives = get_json(f"{BASE}/player/{user}/games/archives").get("archives", [])
    if args.max_archives:
        archives = archives[: args.max_archives]
    print(f"{user}: {len(archives)} archives", file=sys.stderr)

    games = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        for chunk in ex.map(scan_archive, [(u, user_lower) for u in archives]):
            games.extend(chunk)
    print(f"{user}: {len(games)} games total", file=sys.stderr)

    opp_agg: dict[str, dict] = {}

    for g in games:
        outcome = outcome_for(g["user_result"], g["opp_result"])
        key = g["opponent"].lower()
        o = opp_agg.setdefault(
            key,
            {
                "opponent": g["opponent"],
                "games": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "first_date": g["date"],
                "last_date": g["date"],
            },
        )
        add_wdl(o, outcome)
        # Archives arrive oldest→newest, so first/last seen are the bounds.
        if g["date"]:
            if not o["first_date"]:
                o["first_date"] = g["date"]
            o["last_date"] = g["date"]

    opponents = sorted(opp_agg.values(), key=lambda o: (-o["games"], o["opponent"].lower()))
    for o in opponents:
        o["score"] = round(score_of(o), 4)

    contenders = [o for o in opponents if o["games"] >= MIN_GAMES]
    best = sorted(
        contenders, key=lambda o: (-o["score"], -o["games"], o["opponent"].lower())
    )[:JSON_TOP]
    worst = sorted(
        contenders, key=lambda o: (o["score"], -o["games"], o["opponent"].lower())
    )[:JSON_TOP]
    dead_heat = (
        min(contenders, key=lambda o: (abs(o["score"] - 0.5), -o["games"]))
        if contenders
        else None
    )
    most_played = opponents[0] if opponents else None
    beat_me_most = worst[0] if worst else None

    # Enrich every opponent the page displays (callouts + both tables).
    shown = {}
    most = opponents[:JSON_TOP]
    for o in [most_played, dead_heat, beat_me_most, *most, *best, *worst]:
        if o:
            shown[o["opponent"].lower()] = o
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        profiles = list(ex.map(lambda o: enrich_profile(o["opponent"]), shown.values()))
    for o, prof in zip(shown.values(), profiles):
        o.update(prof)

    payload = {
        "username": profile.get("username") or user,
        "player": {
            "name": profile.get("name") or "",
            "username": profile.get("username") or user,
            "avatar": profile.get("avatar") or "",
            "url": f"https://www.chess.com/member/{user}",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "opponents": len(opponents),
        "min_games": MIN_GAMES,
        "most_played": most_played,
        "most": most,
        "dead_heat": dead_heat,
        "beat_me_most": beat_me_most,
        "best": best,
        "worst": worst,
    }

    with open(csv_dir / f"{user_lower}_opponents.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["opponent", "title", "games", "wins", "draws", "losses", "score", "first_date", "last_date"])
        for o in opponents:
            w.writerow(
                [
                    o["opponent"],
                    o.get("title", ""),
                    o["games"],
                    o["wins"],
                    o["draws"],
                    o["losses"],
                    f"{o['score']:.4f}",
                    o["first_date"],
                    o["last_date"],
                ]
            )

    with open(json_dir / f"{user_lower}_rivalries.json", "w") as f:
        json.dump(payload, f, separators=(",", ":"))

    print(f"wrote {json_dir / (user_lower + '_rivalries.json')}", file=sys.stderr)


if __name__ == "__main__":
    main()
