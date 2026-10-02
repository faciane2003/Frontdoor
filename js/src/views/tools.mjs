// Compare normalized Intune lists and provide the Whitepages utility.

import { escapeHtml, renderTrashIcon } from "../core/utils.mjs";
import { saveIntuneList } from "../core/storage.mjs";
import { renderWhitepagesContent } from "./whitepages.mjs";
import { state } from "../core/state.mjs";
import { intuneEntryDialog, intuneEntryForm, intuneEntryValue } from "../core/dom.mjs";
import { loadSpreadsheetLibrary } from "../core/libraries.mjs";

// Compare list entries without treating casing or extra spaces as differences.
export function normalizeComparisonValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function renderIntuneList(listName, title, items, standingValues) {
  const visibleItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !state.searchTerm || item.toLowerCase().includes(state.searchTerm.toLowerCase()));
  const rows = visibleItems
    .map(({ item, index }) => {
      const isNewList = listName === "new";
      const isMatch = isNewList && standingValues.has(normalizeComparisonValue(item));
      const status = isNewList ? `<span class="intune-status ${isMatch ? "is-match" : "is-missing"}">${isMatch ? "Match" : "Not in standing list"}</span>` : "";
      return `<tr class="intune-item ${isNewList ? (isMatch ? "is-match" : "is-missing") : ""}"><td>${escapeHtml(item)}</td><td>${status}</td><td><button class="row-trash" type="button" data-tools-delete="${escapeHtml(listName)}" data-tools-index="${index}" aria-label="Delete ${escapeHtml(item)}" title="Delete row">${renderTrashIcon()}</button></td></tr>`;
    })
    .join("");

  return `
    <section class="intune-list-panel">
      <header class="intune-list-header">
        <h3>${escapeHtml(title)}</h3>
        <div class="intune-list-tools"><button class="table-add" type="button" data-tools-add="${escapeHtml(listName)}">Add Item</button><button class="table-import" type="button" data-tools-upload="${escapeHtml(listName)}">Upload File</button></div>
        <input class="sr-only" type="file" data-tools-file="${escapeHtml(listName)}" accept=".csv,.txt,.xls,.xlsx,.ods" aria-label="Upload ${escapeHtml(title)}">
      </header>
      <div class="import-status" data-tools-status="${escapeHtml(listName)}" aria-live="polite"></div>
      ${rows ? `<div class="intune-table-wrap"><table class="data-table intune-table"><thead><tr><th>Item</th><th>Status</th><th aria-label="Row actions"></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state">Add an item or upload a file to populate this list.</div>`}
    </section>
  `;
}

export function renderTools() {
  const target = document.querySelector("#tools-list");
  if (!target) return;
  const standingValues = new Set(state.toolsStanding.map(normalizeComparisonValue));
  const isIntune = state.toolsSection === "Intune Checker";
  target.innerHTML = `
    <div class="tools-layout">
      <nav class="tools-mini-nav" aria-label="Tools subcategories">
        ${["Intune Checker", "Whitepages"].map((section) => `<button type="button" class="${state.toolsSection === section ? "is-active" : ""}" data-tools-section="${escapeHtml(section)}" ${state.toolsSection === section ? 'aria-current="page"' : ""}>${escapeHtml(section)}</button>`).join("")}
      </nav>
      <section class="tools-subcategory" aria-label="${escapeHtml(state.toolsSection)}">
        ${isIntune
          ? `<div class="intune-columns">
              ${renderIntuneList("standing", "Standing Comparison List", state.toolsStanding, standingValues)}
              ${renderIntuneList("new", "New List", state.toolsNew, standingValues)}
            </div>`
          : renderWhitepagesContent()}
      </section>
    </div>
  `;
}

export function openIntuneAdd(listName) {
  intuneEntryForm.dataset.listName = listName;
  document.querySelector("#intune-entry-dialog-title").textContent = `Add ${listName === "standing" ? "Standing Comparison" : "New List"} Item`;
  intuneEntryForm.reset();
  intuneEntryDialog.showModal();
  intuneEntryValue.focus();
}

export function deleteIntuneItem(listName, index) {
  const values = listName === "standing" ? state.toolsStanding : state.toolsNew;
  if (!values[index]) return;
  values.splice(index, 1);
  saveIntuneList(listName);
  renderTools();
}

// Read plain-text lists while ignoring empty lines.
export function parseIntuneText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\t|,|\|/)[0].trim().replace(/^['"]|['"]$/g, ""));
}

// Trim imported entries and remove repeated values before storing them.
export function cleanIntuneValues(values) {
  const headerNames = new Set(["device", "device name", "hostname", "computer", "computer name", "name", "serial number", "identifier", "standing comparison list", "new list"]);
  const seen = new Set();
  return values.filter((value, index) => {
    const normalized = normalizeComparisonValue(value);
    if (!normalized || (index === 0 && headerNames.has(normalized)) || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// Imports accept text directly and use SheetJS only when a workbook is supplied.
// Values are normalized before comparison so casing and whitespace do not matter.

// Import text directly, or load the spreadsheet reader only for workbook files.
export async function importIntuneFile(file, listName) {
  const status = document.querySelector(`[data-tools-status="${CSS.escape(listName)}"]`);
  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };
  if (!file) return;

  const isTextFile = file.name.toLowerCase().endsWith(".txt");
  try {
    setStatus("Reading file...");
    if (!isTextFile) await loadSpreadsheetLibrary();
    let values;
    if (isTextFile) {
      values = parseIntuneText(await file.text());
    } else {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false });
      values = rows.map((row) => row.find((cell) => String(cell).trim()) || "");
    }

    const cleaned = cleanIntuneValues(values);
    if (!cleaned.length) {
      setStatus("No list entries were found in that file.", true);
      return;
    }

    if (listName === "standing") state.toolsStanding = cleaned;
    else state.toolsNew = cleaned;
    saveIntuneList(listName);
    renderTools();
    const updatedStatus = document.querySelector(`[data-tools-status="${CSS.escape(listName)}"]`);
    if (updatedStatus) updatedStatus.textContent = `${cleaned.length} unique ${cleaned.length === 1 ? "item" : "items"} loaded.`;
  } catch (error) {
    setStatus(`Could not read that file: ${error.message}. Upload TXT, CSV, or an exported spreadsheet.`, true);
  }
}
