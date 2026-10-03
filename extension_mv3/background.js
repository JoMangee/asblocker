// SPDX-License-Identifier: GPL-3.0-only
// Axel Springer Blocker (ASB); see README-BLOCKER.md and repository LICENSE.
// Runtime domain rules use the same uBlock-style domain-and-subdomain matching
// semantics as the checked-in static DNR ruleset.

const CONFIG_KEY = "asbConfig";
const STATIC_RULESET_ID = "configurable_blocklist";
// Reserved exclusively for rules owned by this worker. Never remove rules outside
// this range when replacing our dynamic rules.
const OWN_RULE_ID_START = 100000;
const MAX_OWN_DYNAMIC_RULES = 5000;
const MAX_DYNAMIC_RULES = 5000; // Conservative cross-version DNR quota.
const CATEGORY_NAMES = ["google", "amazon", "springer", "adtrackers"];
const RESOURCE_TYPES = [
  "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
  "object", "xmlhttprequest", "ping", "media", "websocket", "other"
];

// Defaults mirror the checked-in root config.json and extension_mv3/rules.json.
// The static ruleset remains enabled until these defaults (or a saved config) are
// successfully installed as dynamic rules.
const DEFAULT_CONFIG = {
  google: {
    enabled: true,
    domains: ["google.com", "google.co.uk", "google.de", "google.fr", "google.ca", "google.com.au", "google.co.nz", "doubleclick.net", "googlesyndication.com", "googletagmanager.com", "google-analytics.com"]
  },
  amazon: {
    enabled: true,
    domains: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.ca", "amazon.com.au", "amazon.co.jp"]
  },
  springer: {
    enabled: true,
    domains: ["springer.com", "springerlink.com", "bild.de", "welt.de", "politico.eu", "businessinsider.com", "upday.com", "transfermarkt.de"]
  },
  adtrackers: {
    enabled: true,
    domains: ["adservice.google.com", "adform.net", "adroll.com", "criteo.com", "taboola.com", "outbrain.com"]
  }
};

let rebuildQueue = Promise.resolve();

function validateAndNormalizeConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Configuration must be an object of categories.");
  }
  const normalized = {};
  for (const category of CATEGORY_NAMES) {
    const entry = config[category];
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof entry.enabled !== "boolean" || !Array.isArray(entry.domains)) {
      throw new Error(`Invalid configuration for category '${category}'.`);
    }
    const domains = [];
    const seen = new Set();
    for (const input of entry.domains) {
      if (typeof input !== "string") {
        throw new Error(`A domain in '${category}' is not text.`);
      }
      const domain = input.trim().toLowerCase().replace(/\.$/, "");
      if (!domain) continue;
      if (domain.length > 253 || domain.includes("..") || domain.includes("*") ||
          domain.includes("/") || domain.includes(":")) {
        throw new Error(`Invalid domain '${input}' in '${category}'. Enter a hostname only (for example, example.com).`);
      }
      const labels = domain.split(".");
      if (labels.length < 2 || labels.some(label => label.length < 1 || label.length > 63 ||
          !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
        throw new Error(`Invalid domain '${input}' in '${category}'. Enter a valid DNS hostname.`);
      }
      if (!seen.has(domain)) {
        seen.add(domain);
        domains.push(domain);
      }
    }
    normalized[category] = { enabled: entry.enabled, domains };
  }
  return normalized;
}

function makeDynamicRules(config) {
  const uniqueDomains = new Set();
  for (const category of CATEGORY_NAMES) {
    if (!config[category].enabled) continue;
    for (const domain of config[category].domains) uniqueDomains.add(domain);
  }
  if (uniqueDomains.size > MAX_OWN_DYNAMIC_RULES) {
    throw new Error(`The configuration needs ${uniqueDomains.size} dynamic rules; the safe limit is ${MAX_OWN_DYNAMIC_RULES}.`);
  }
  return [...uniqueDomains].map((domain, index) => ({
    id: OWN_RULE_ID_START + index,
    priority: 1,
    action: { type: "block" },
    condition: { requestDomains: [domain], resourceTypes: RESOURCE_TYPES }
  }));
}

function isOurRule(rule) {
  return Number.isInteger(rule.id) && rule.id >= OWN_RULE_ID_START &&
    rule.id < OWN_RULE_ID_START + MAX_OWN_DYNAMIC_RULES;
}

async function ensureFallbackEnabled() {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: [STATIC_RULESET_ID]
  });
}

async function ensureStoredConfig() {
  const stored = await chrome.storage.sync.get(CONFIG_KEY);
  if (!Object.prototype.hasOwnProperty.call(stored, CONFIG_KEY)) {
    // Only seed when the key is absent. Never overwrite a user's saved value.
    await chrome.storage.sync.set({ [CONFIG_KEY]: DEFAULT_CONFIG });
  }
}

async function applyStoredConfig() {
  await ensureStoredConfig();
  const stored = await chrome.storage.sync.get(CONFIG_KEY);
  const config = validateAndNormalizeConfig(stored[CONFIG_KEY]);
  const additions = makeDynamicRules(config);
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ourRules = currentRules.filter(isOurRule);
  const otherRuleCount = currentRules.length - ourRules.length;
  if (otherRuleCount + additions.length > MAX_DYNAMIC_RULES) {
    throw new Error(`Dynamic DNR quota would be exceeded (${otherRuleCount} other rules + ${additions.length} ASB rules; safe maximum ${MAX_DYNAMIC_RULES}).`);
  }

  // The update is atomic. Do not disable the packaged fallback until the
  // replacement rules have been accepted by Chrome.
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ourRules.map(rule => rule.id),
    addRules: additions
  });
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: [STATIC_RULESET_ID]
  });
  return { ok: true, ruleCount: additions.length };
}

function rebuild() {
  const next = rebuildQueue.then(async () => {
    try {
      return await applyStoredConfig();
    } catch (error) {
      try {
        await ensureFallbackEnabled();
      } catch (fallbackError) {
        console.error("ASB could not re-enable the static fallback ruleset:", fallbackError);
      }
      throw new Error(`Could not apply ASB domain rules; the packaged static fallback was kept/enabled. ${error && error.message ? error.message : error}`);
    }
  });
  rebuildQueue = next.catch(() => {});
  return next;
}

async function initialize() {
  await ensureStoredConfig();
  await rebuild();
}

chrome.runtime.onInstalled.addListener(() => {
  initialize().catch(error => console.error("ASB initialization failed:", error));
});
chrome.runtime.onStartup.addListener(() => {
  initialize().catch(error => console.error("ASB startup failed:", error));
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && Object.prototype.hasOwnProperty.call(changes, CONFIG_KEY)) {
    rebuild().catch(error => console.error("ASB configuration rebuild failed:", error));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "ASB_GET_CONFIG") {
    ensureStoredConfig()
      .then(() => chrome.storage.sync.get(CONFIG_KEY))
      .then(stored => sendResponse({ ok: true, config: stored[CONFIG_KEY] }))
      .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }
  if (message && message.type === "ASB_REBUILD") {
    rebuild()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }
  return false;
});

// Covers worker activation after installation as well as explicit install/startup
// events; ensureStoredConfig checks for absence and never replaces saved settings.
initialize().catch(error => console.error("ASB worker initialization failed:", error));
