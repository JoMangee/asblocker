# Axel Springer Blocker (ASB): configurable blocklist and MV3 first cut

This addition supplies configurable domain groups, a uBlock-compatible filter list, and a minimal Manifest V3 extension using `declarativeNetRequest` (DNR). The legacy upstream `extension/` directory is intentionally unchanged.

## License and upstream attribution

Distributed under the repository's **GPL-3.0** license (see [`LICENSE`](LICENSE)). This addition retains the Axel Springer Blocker (ASB) project attribution: [upstream repository](https://github.com/JoMangee/axelspringerblocker). The upstream README links to the [original Chrome Web Store listing](https://chrome.google.com/webstore/detail/axel-springer-blocker-asb/cbnipbdpgncaghphljojicfgmkonflee). Preserve upstream attribution when redistributing or building on this work.

## Configure and regenerate

Edit category `enabled` booleans and `domains` arrays in root [`config.json`](config.json). Disabled groups are omitted from both generated outputs. From the repository root, run:

```sh
python3 blocklist_build.py
python3 extension_mv3/generate_rules.py
```

The first command writes root `blocklist.txt` with uBlock syntax (`||domain^`). The second reads the same config and writes `extension_mv3/rules.json`, a static DNR ruleset with one blocking rule per enabled, non-empty category. DNR `requestDomains` matches configured domains and their subdomains. The checked-in outputs match the default config.

## Load unpacked

1. Regenerate after editing the configuration.
2. Open `chrome://extensions` in a Chromium-based browser and enable **Developer mode**.
3. Select **Load unpacked** and choose `extension_mv3/`.

This first cut does not replace or modify the legacy upstream extension under `extension/`.

## Configuring domains live

Open `chrome://extensions`, select this extension's **Details**, then open **Extension options**. Toggle the checkbox for each Google, Amazon, Springer, or ad-tracker category to enable or disable it. Use **Add domain** and **Remove** to edit the hostnames in each category, then select **Save**. Changes are saved in Chrome sync storage and applied immediately by the extension; no rebuild is needed.
