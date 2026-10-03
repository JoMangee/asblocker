#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
# Axel Springer Blocker (ASB); see README-BLOCKER.md and repository LICENSE.
"""Build a uBlock-compatible blocklist from the root config.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    config = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    filters = []
    for category, settings in config.items():
        if not isinstance(settings, dict) or not isinstance(settings.get("enabled"), bool):
            raise ValueError(f"{category!r} must have a boolean enabled value")
        domains = settings.get("domains")
        if not isinstance(domains, list) or not all(isinstance(d, str) and d.strip() for d in domains):
            raise ValueError(f"{category!r} domains must be non-empty strings")
        if settings["enabled"]:
            filters.extend(f"||{d.strip()}^" for d in domains)
    output = ROOT / "blocklist.txt"
    output.write_text("\n".join(filters) + ("\n" if filters else ""), encoding="utf-8")
    print(f"Wrote {len(filters)} filters to {output.name}")


if __name__ == "__main__":
    main()
