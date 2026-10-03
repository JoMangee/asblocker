// SPDX-License-Identifier: GPL-3.0-only
const CONFIG_KEY = "asbConfig";
const CATEGORIES = [
  ["google", "Google"],
  ["amazon", "Amazon"],
  ["springer", "Springer"],
  ["adtrackers", "Ad trackers"]
];

const categoryContainer = document.getElementById("categories");
const form = document.getElementById("settings");
const saveButton = document.getElementById("save");
const status = document.getElementById("status");

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = kind;
}

function addDomainRow(list, value = "") {
  const row = document.createElement("div");
  row.className = "domain-row";
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "example.com";
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Domain");
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => row.remove());
  row.append(input, remove);
  list.append(row);
}

function render(config) {
  categoryContainer.replaceChildren();
  for (const [key, label] of CATEGORIES) {
    const entry = config[key];
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = label;
    const enabledLabel = document.createElement("label");
    enabledLabel.className = "enabled";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(entry.enabled);
    checkbox.dataset.category = key;
    enabledLabel.append(checkbox, document.createTextNode(` Enable ${label}`));
    const list = document.createElement("div");
    list.className = "domain-list";
    list.dataset.category = key;
    for (const domain of entry.domains) addDomainRow(list, domain);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add-domain";
    add.textContent = "Add domain";
    add.addEventListener("click", () => {
      addDomainRow(list);
      list.lastElementChild.querySelector("input").focus();
    });
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "Enter a hostname only, such as example.com (no URL or wildcard).";
    fieldset.append(legend, enabledLabel, list, add, hint);
    categoryContainer.append(fieldset);
  }
}

async function loadConfig() {
  const stored = await chrome.storage.sync.get(CONFIG_KEY);
  let config;
  if (Object.prototype.hasOwnProperty.call(stored, CONFIG_KEY)) {
    config = stored[CONFIG_KEY];
  } else {
    const response = await chrome.runtime.sendMessage({ type: "ASB_GET_CONFIG" });
    if (!response || !response.ok) throw new Error(response?.error || "Could not load the saved configuration.");
    config = response.config;
  }
  if (!config || CATEGORIES.some(([key]) => !config[key] || !Array.isArray(config[key].domains))) {
    throw new Error("The saved configuration is invalid. Correct it or remove the asbConfig sync-storage entry.");
  }
  render(config);
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  saveButton.disabled = true;
  setStatus("Saving configuration and applying rules…");
  try {
    const config = {};
    for (const [key] of CATEGORIES) {
      const checkbox = categoryContainer.querySelector(`input[type=checkbox][data-category="${key}"]`);
      const list = categoryContainer.querySelector(`.domain-list[data-category="${key}"]`);
      config[key] = {
        enabled: checkbox.checked,
        domains: [...list.querySelectorAll("input")].map(input => input.value.trim()).filter(Boolean)
      };
    }
    await chrome.storage.sync.set({ [CONFIG_KEY]: config });
    // Storage changes are watched by the service worker too; this explicit
    // request returns the immediate apply result so quota/API errors are visible.
    const response = await chrome.runtime.sendMessage({ type: "ASB_REBUILD" });
    if (!response || !response.ok) {
      throw new Error(response?.error || "The worker did not confirm the rule update.");
    }
    setStatus(`Saved. ${response.ruleCount} dynamic domain rule(s) are active.`, "success");
  } catch (error) {
    setStatus(error.message || String(error), "error");
  } finally {
    saveButton.disabled = false;
  }
});

loadConfig().catch(error => setStatus(error.message || String(error), "error"));
