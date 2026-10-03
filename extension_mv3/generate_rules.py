#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
# Axel Springer Blocker (ASB); see README-BLOCKER.md and repository LICENSE.
"""Generate static MV3 declarativeNetRequest rules from root config.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESOURCE_TYPES = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "media", "websocket", "other"]


def main():
    config = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    rules = []
    for category, settings in config.items():
        if not isinstance(settings, dict) or not isinstance(settings.get("enabled"), bool):
            raise ValueError(f"{category!r} must have a boolean enabled value")
        domains = settings.get("domains")
        if not isinstance(domains, list) or not all(isinstance(d, str) and d.strip() for d in domains):
            raise ValueError(f"{category!r} domains must be non-empty strings")
        if settings["enabled"] and domains:
            rules.append({"id": len(rules) + 1, "priority": 1,
                          "action": {"type": "block"},
                          "condition": {"requestDomains": [d.strip().lower() for d in domains],
                                        "resourceTypes": RESOURCE_TYPES}})
    output = Path(__file__).resolve().parent / "rules.json"
    output.write_text(json.dumps(rules, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rules)} rules to {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
