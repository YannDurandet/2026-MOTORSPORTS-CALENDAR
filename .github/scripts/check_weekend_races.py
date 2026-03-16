"""
Detect last week's motorsport races from data/series.json and generate
a GitHub Issue body with a pre-filled results template.

Run by the weekly-results GitHub Actions workflow every Monday.
"""

import json
import os
import tempfile
from datetime import datetime, timedelta, timezone

SERIES_NAMES = {
    "f1": "Formula 1", "f1a": "F1 Academy", "fe": "Formula E",
    "sf": "Super Formula", "wec": "WEC", "imsa": "IMSA",
    "wrc": "WRC", "indycar": "IndyCar", "nascar": "NASCAR",
    "motogp": "MotoGP", "wsbk": "WSBK", "dtm": "DTM",
    "btcc": "BTCC", "supercars": "Supercars", "elms": "ELMS",
    "gtwce": "GTWCE", "gtwca": "GTWCA", "nls": "NLS",
    "igtc": "IGTC", "tcr": "TCR", "erc": "ERC",
}

# Series that use co-drivers in results
CODRIVER_SERIES = {"wrc", "erc"}

# Endurance series with multiple drivers per car
MULTI_DRIVER_SERIES = {"wec", "imsa", "igtc", "elms", "gtwce", "gtwca", "nls"}

PARIS_OFFSET = timedelta(hours=1)  # CET; close enough for weekly window


def parse_date(date_str):
    """Parse ISO 8601 date string to UTC datetime."""
    return datetime.fromisoformat(date_str).astimezone(timezone.utc)


def get_last_week_window():
    """Return (monday 00:00, sunday 23:59:59) of last week in UTC+1 (Paris approx)."""
    now = datetime.now(timezone.utc) + PARIS_OFFSET
    # Find last Monday (the Monday before today)
    days_since_monday = now.weekday()  # 0=Mon
    last_monday = (now - timedelta(days=days_since_monday + 7)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    last_sunday = last_monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    # Convert back to UTC for comparison
    return (
        last_monday - PARIS_OFFSET,
        last_sunday - PARIS_OFFSET,
    )


def find_weekend_races(series_data, start_utc, end_utc):
    """Find all races in the given UTC window."""
    races = []
    for series_key, events in series_data.items():
        for event in events:
            dt = parse_date(event["date"])
            if start_utc <= dt <= end_utc:
                races.append({
                    "series": series_key,
                    "name": event["name"],
                    "date": event["date"],
                    "dt": dt,
                })
    races.sort(key=lambda r: r["dt"])
    return races


def format_date_display(dt):
    """Format datetime for display: 'Sun Mar 15, 08:00'."""
    return dt.strftime("%a %b %d, %H:%M")


def build_json_template(races):
    """Build a JSON template grouped by series with placeholder values."""
    grouped = {}
    for r in races:
        key = r["series"]
        if key not in grouped:
            grouped[key] = []

        entry = {"event": r["name"], "driver": "???", "team": "???"}
        if key in CODRIVER_SERIES:
            entry["codriver"] = "???"
        grouped[key].append(entry)

    return json.dumps(grouped, indent=2)


def build_issue_body(races, week_start, week_end):
    """Build the full Markdown issue body."""
    paris_start = week_start + PARIS_OFFSET
    paris_end = week_end + PARIS_OFFSET
    date_range = f"{paris_start.strftime('%b %d')} – {paris_end.strftime('%b %d')}"

    lines = [
        f"## Races from last weekend ({date_range})\n",
        "Check results for each race and update `data/results.json`:\n",
    ]

    for r in races:
        display_dt = r["dt"] + PARIS_OFFSET
        series_label = SERIES_NAMES.get(r["series"], r["series"].upper())
        lines.append(
            f"- [ ] **{series_label}** — {r['name']} "
            f"({format_date_display(display_dt)} CET)"
        )

    lines.append("\n### JSON template\n")
    lines.append(
        "Merge this into `data/results.json`, replacing the `???` placeholders:\n"
    )
    lines.append("```json")
    lines.append(build_json_template(races))
    lines.append("```\n")

    # Special notes
    notes = []
    series_in_races = {r["series"] for r in races}
    if series_in_races & CODRIVER_SERIES:
        notes.append("- **WRC/ERC**: Include `codriver` field")
    if series_in_races & MULTI_DRIVER_SERIES:
        notes.append(
            '- **Endurance races**: List all drivers separated by " / " '
            '(e.g. "Driver A / Driver B / Driver C")'
        )
    if "fe" in series_in_races:
        fe_races = [r for r in races if r["series"] == "fe"]
        if len(fe_races) > 1:
            notes.append(
                "- **Formula E double-header**: Create separate entries with "
                '`"note": "Round X"` for each race'
            )
    if notes:
        lines.append("### Notes\n")
        lines.extend(notes)
        lines.append("")

    lines.append("### How to update\n")
    lines.append("1. Open Claude Code in the project")
    lines.append(
        '2. Say: "Fill in last weekend\'s race results from the GitHub issue"'
    )
    lines.append(
        "3. Claude will web-search for winners and update `data/results.json`"
    )
    lines.append("4. Push to `main` — GitHub Pages auto-deploys\n")
    lines.append("*Auto-generated by weekly-results workflow*")

    return "\n".join(lines)


def set_output(name, value):
    """Set a GitHub Actions output variable."""
    output_file = os.environ.get("GITHUB_OUTPUT", "")
    if output_file:
        with open(output_file, "a") as f:
            f.write(f"{name}={value}\n")
    else:
        print(f"  {name}={value}")


def main():
    with open("data/series.json", "r", encoding="utf-8") as f:
        series_data = json.load(f)

    start_utc, end_utc = get_last_week_window()
    races = find_weekend_races(series_data, start_utc, end_utc)

    paris_start = start_utc + PARIS_OFFSET
    paris_end = end_utc + PARIS_OFFSET
    print(
        f"Checking window: {paris_start.strftime('%Y-%m-%d')} "
        f"to {paris_end.strftime('%Y-%m-%d')} (Paris time)"
    )
    print(f"Found {len(races)} race(s)")

    if not races:
        set_output("has_races", "false")
        return

    # Build issue
    body = build_issue_body(races, start_utc, end_utc)
    tmp_dir = os.environ.get("RUNNER_TEMP", tempfile.gettempdir())
    output_path = os.path.join(tmp_dir, "results_issue_body.md")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(body)

    date_range = (
        f"{paris_start.strftime('%b %d')}-{paris_end.strftime('%b %d')}"
    )
    set_output("has_races", "true")
    set_output("issue_title", f"Results needed: Week of {date_range}")

    print("\n--- Issue preview ---")
    print(body)


if __name__ == "__main__":
    main()
