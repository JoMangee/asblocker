# ASB Blocker

## What this is

ASB Blocker is a configurable domain blocker. This is the first cut of its Manifest V3 version (MV3). It lets you choose which groups of websites to block and edit the domain lists for those groups.

Upstream attribution: fork of [AndreasGB/axelspringerblocker](https://github.com/AndreasGB/axelspringerblocker), licensed under GPL-3.0.

This project is licensed under [GPL-3.0](https://github.com/JoMangee/asblocker/blob/mv3-config-first-cut/LICENSE). This work is tracked as **MESHDEV-129**.

## Install the unpacked extension

An “unpacked” extension is one loaded directly from the folder you extracted. You do not need to build or package it first.

### Chrome

1. [Download the branch ZIP](https://github.com/JoMangee/asblocker/archive/refs/heads/mv3-config-first-cut.zip).
2. Extract the ZIP file. Open the extracted `asblocker-mv3-config-first-cut` folder.
3. In Chrome, open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Choose the `extension_mv3` folder inside the extracted project, then confirm.

### Firefox

1. [Download the same branch ZIP](https://github.com/JoMangee/asblocker/archive/refs/heads/mv3-config-first-cut.zip).
2. Extract the ZIP file. Open the extracted `asblocker-mv3-config-first-cut` folder.
3. In Firefox, open `about:debugging#/runtime/this-firefox` (or go to `about:debugging` and choose **This Firefox**).
4. Click **Load Temporary Add-on…**.
5. Open the `extension_mv3` folder and select its `manifest.json` file. Firefox asks you to choose the add-on file inside the folder.

**Important:** In either browser, use `extension_mv3`. Do **not** load the old `extension/` folder; it is the legacy version and is not the loadable version for this first cut. Chrome may show an extension ID ending in `gjlpkah…`; that can be normal.

## Test that it is working

Jo's basic test is to visit [bild.de](https://www.bild.de/) or [politico.eu](https://www.politico.eu/). With the relevant blocking category enabled, expect the browser to show a blocked page or an `ERR_BLOCKED_BY_CLIENT` message instead of loading the site normally. That message means the request was blocked by the extension.

## Configure categories and domain lists

In Chrome, open `chrome://extensions`, find ASB Blocker, click **Details**, then **Extension options**. You can also right-click the extension icon and choose **Options**. In Firefox, open the add-on's preferences from its entry in `about:addons`.

The options page has on/off switches for the **google**, **amazon**, **springer**, and **adtrackers** categories. Use the domain list editor to add or remove domains in a category. Changes apply immediately; you do not need to rebuild the extension.

## Update the unpacked extension

1. [Download the branch ZIP again](https://github.com/JoMangee/asblocker/archive/refs/heads/mv3-config-first-cut.zip).
2. Extract it over the old project folder, replacing the old files. Keep track of the new `extension_mv3` folder.
3. In Chrome, open `chrome://extensions`.
4. Find the ASB Blocker card and click its **Reload** arrow. If you loaded it temporarily in Firefox, load `extension_mv3/manifest.json` again from `about:debugging` when needed.

## Optional: rebuild the generated files

Most users do not need to run these commands. If you are changing the project's source configuration, run them from the project folder, in this order:

```sh
python3 blocklist_build.py
python3 extension_mv3/generate_rules.py
```

`config.json` is the source of truth for the categories and their domain lists. `blocklist_build.py` reads that configuration and writes `blocklist.txt`. `extension_mv3/generate_rules.py` reads the same configuration and writes `extension_mv3/rules.json`.

When the MV3 extension starts, `extension_mv3/background.js` seeds its saved settings and rebuilds the dynamic blocking rules. The `extension_mv3/options.*` files provide the live configuration page for changing the categories and domain lists.

## Legacy folder

The `extension/` folder is kept only for upstream reference. It is the legacy MV2 version and is **not** the loadable version described here. Load `extension_mv3/` instead.

## Links

- [Branch ZIP download](https://github.com/JoMangee/asblocker/archive/refs/heads/mv3-config-first-cut.zip)
- Release: https://github.com/JoMangee/asblocker/releases/tag/v0.1.0-mv3-first-cut
