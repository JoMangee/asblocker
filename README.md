# ASB Blocker — MV3 first cut

ASB Blocker is a configurable domain blocker. Choose which groups of sites to block, and edit the domains in each group. This is the first cut of the Manifest V3 (MV3) version.

## What this is

Upstream attribution: fork of [AndreasGB/axelspringerblocker](https://github.com/AndreasGB/axelspringerblocker), licensed under GPL-3.0.

- **License:** [GPL-3.0](LICENSE)
- **Work item:** MESHDEV-129
- **Release:** [v0.1.0-mv3-first-cut](https://github.com/JoMangee/asblocker/releases/tag/v0.1.0-mv3-first-cut)

## Install the unpacked extension

This first cut is installed from a folder on your computer. You do not need to build or package it.

### Chrome

1. [Download the branch ZIP](https://github.com/JoMangee/asblocker/archive/refs/heads/mv3-config-first-cut.zip) and extract it.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. In the extracted project, select the **`extension_mv3`** folder. Do **not** select the old `extension/` folder.

### Firefox

1. [Download the same branch ZIP](https://github.com/JoMangee/asblocker/archive/refs/heads/mv3-config-first-cut.zip) and extract it.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**. Firefox does not use Chrome's Developer mode switch on this page.
4. In the extracted project, open **`extension_mv3`** and select its `manifest.json` file. Do **not** select anything in the old `extension/` folder.

Firefox temporary add-ons may need to be loaded again after Firefox restarts.

## Check that blocking works

Visit [bild.de](https://www.bild.de/) or [politico.eu](https://www.politico.eu/) while the matching blocking category is enabled. The extension blocks matching page navigations and tracker/analytics requests, including scripts, XHR (`XMLHttpRequest`), beacons, and images. A blocked navigation may show a blocked page or an `ERR_BLOCKED_BY_CLIENT` message instead of the site loading normally; blocked tracker requests may be less visible and can be checked in the browser's Network panel. That message means the browser blocked the request.

## Change what is blocked

Open ASB Blocker's **Options** page from your browser's extensions page or the extension's menu. Turn the **google**, **amazon**, **springer**, and **adtrackers** categories on or off, and use the domain editor to add or remove domains in a category. The extension blocks matching page navigations as well as tracker/analytics calls made by pages, including scripts, XHR (`XMLHttpRequest`), beacons, and images. Changes take effect after you click Save. The Save button is at the top of the options page. You do not need to rebuild the extension.

## Update your unpacked copy

1. Download the branch ZIP again and extract it over the old project folder, replacing the old files.
2. Open your browser's extensions page and find the ASB Blocker card.
3. Click its **Reload** arrow. In Firefox, load the temporary add-on again if needed.

## Optional: rebuild generated files

Most users can skip this section. If you are changing the project's source configuration, run these commands from the project folder, in order:

```sh
python3 blocklist_build.py
python3 extension_mv3/generate_rules.py
```

`config.json` is the source of truth for categories and their domain lists. `blocklist_build.py` reads it and generates `blocklist.txt`. `extension_mv3/generate_rules.py` reads the configuration and generates `extension_mv3/rules.json`. When the MV3 extension starts, `extension_mv3/background.js` seeds saved settings and rebuilds the dynamic blocking rules. The `extension_mv3/options.*` files provide the page for changing category switches and domain lists.

## About the old extension folder

The `extension/` folder is the legacy Manifest V2 version, kept for reference. It is not loadable for this first cut. Use `extension_mv3/` instead.
