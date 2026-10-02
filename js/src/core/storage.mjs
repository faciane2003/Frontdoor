// Preserve saved rows across refreshes without changing their source JSON files.

import { state } from "./state.mjs";
import { readStoredValue, removeStoredValue, writeStoredValue } from "./persistence.mjs";

export const TABLE_STORAGE_PREFIX = "editable-table";

export const CERTS_DATA_VERSION_KEY = "editable-table:certs-version";

export const CERTS_DATA_VERSION = "2";

export const INTUNE_STORAGE_KEYS = {
  standing: "intune-checker:standing",
  new: "intune-checker:new",
};

export const EDITABLE_TABLES = ["training", "sops", "certs", "links", "whitepages", "features"];

export const lastTableSaves = new Map();
const pendingTableSaves = new Map();

// Wait briefly after typing so each keystroke does not write the entire table.
export function scheduleTableSave(collection) {
  clearTimeout(pendingTableSaves.get(collection));
  pendingTableSaves.set(collection, setTimeout(() => saveTable(collection), 250));
}

// Finish pending writes before the page is hidden or closed.
export function flushTableSaves() {
  for (const collection of pendingTableSaves.keys()) saveTable(collection);
}

// Keep row identity separate from titles, URLs, and IDs the user can edit.
export function ensureRowIds(collection, rows) {
  rows.forEach((row, index) => {
    row._rowId ||= row._addedAt ? `custom:${crypto.randomUUID()}` : `baseline:${collection}:${rowKey(collection, row) || index}`;
  });
}

export function tableStorageKey(collection) {
  return `${TABLE_STORAGE_PREFIX}:${collection}`;
}

// Merge local edits with the latest checked-in rows. Source fields fill missing
// values, while explicitly edited browser values continue to win.

// Migrate older browser data while keeping new catalog entries and saved edits.
export function applySavedTables() {
  for (const collection of EDITABLE_TABLES) {
    const saved = readStoredValue(tableStorageKey(collection));
    if (!saved) continue;
    let parsed;
    try { parsed = JSON.parse(saved); }
    catch { removeStoredValue(tableStorageKey(collection)); continue; }
    if (!Array.isArray(parsed)) continue;
    const sourceRows = state.data[collection];
    const savedRows = parsed.filter((row) => row && typeof row === "object" && !Array.isArray(row));
    state.data[collection] = mergeSavedRows(collection, sourceRows, savedRows);
    if (collection === "certs" && readStoredValue(CERTS_DATA_VERSION_KEY) !== CERTS_DATA_VERSION) {
      const savedKeys = new Set(state.data.certs.map((row) => rowKey("certs", row)).filter(Boolean));
      state.data.certs.push(...sourceRows.filter((row) => !savedKeys.has(rowKey("certs", row))));
      // Never erase valid saved rows when a migration write fails.
      if (saveTable("certs")) writeStoredValue(CERTS_DATA_VERSION_KEY, CERTS_DATA_VERSION);
    }
  }
}

// Restore each comparison list independently so one malformed list cannot break the other.
export function loadIntuneLists() {
  Object.entries(INTUNE_STORAGE_KEYS).forEach(([listName, storageKey]) => {
    try {
      const saved = JSON.parse(readStoredValue(storageKey) || "[]");
      if (Array.isArray(saved)) state[listName === "standing" ? "toolsStanding" : "toolsNew"] = saved;
    } catch {
      removeStoredValue(storageKey);
    }
  });
}

// Save the selected list under its existing browser-storage key.
export function saveIntuneList(listName) {
  const values = listName === "standing" ? state.toolsStanding : state.toolsNew;
  writeStoredValue(INTUNE_STORAGE_KEYS[listName], JSON.stringify(values));
}

// Match saved rows to source rows; explicit edits win, including intentional blanks.
export function mergeSavedRows(collection, sourceRows, savedRows) {
  const sourceByKey = new Map(sourceRows.flatMap((row) => [[row._rowId, row], [rowKey(collection, row), row]]).filter(([key]) => key));
  return savedRows.map((savedRow) => {
    const sourceRow = sourceByKey.get(savedRow._rowId) || sourceByKey.get(rowKey(collection, savedRow));
    if (!sourceRow) {
      return { ...savedRow, _rowId: savedRow._rowId || `custom:${crypto.randomUUID()}` };
    }

    return Object.entries(savedRow).reduce(
      (merged, [key, value]) => {
        if (typeof value === "string" && !value.trim() && typeof sourceRow[key] === "string" && !savedRow._editedFields?.includes(key)) {
          return merged;
        }
        merged[key] = value;
        return merged;
      },
      { ...sourceRow },
    );
  });
}

// Recognize older saved rows that predate permanent row identities.
export function rowKey(collection, row) {
  const keys = {
    features: "id",
    training: "id",
    sops: "id",
    certs: "url",
    links: "url",
    whitepages: "ticket",
  };
  return String(row?.[keys[collection]] || "").trim().toLowerCase();
}

// Persist the current rows only when their content changes, and report storage failures.
export function saveTable(collection) {
  clearTimeout(pendingTableSaves.get(collection));
  pendingTableSaves.delete(collection);
  ensureRowIds(collection, state.data[collection]);
  const cleanItems = (state.data[collection] || []).map(({ _draft, ...item }) => item);
  const value = JSON.stringify(cleanItems);
  if (lastTableSaves.get(collection) !== value) {
    try { writeStoredValue(tableStorageKey(collection), value); }
    catch (error) {
      let notice = document.querySelector("#storage-status");
      if (!notice) {
        notice = document.createElement("p");
        notice.id = "storage-status";
        notice.className = "storage-status";
        notice.setAttribute("role", "alert");
        document.querySelector(".workspace").prepend(notice);
      }
      notice.textContent = error.message;
      return false;
    }
    lastTableSaves.set(collection, value);
    document.querySelector("#storage-status")?.remove();
  }
  return true;
}
