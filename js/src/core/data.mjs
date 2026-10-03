// Load JSON catalogs and layer browser-local changes over the shared baseline.

import { EDITABLE_TABLES, applySavedTables, ensureRowIds } from "./storage.mjs";
import { DATA_FILES, state } from "./state.mjs";
import { readStoredValue, writeStoredValue } from "./persistence.mjs";

// Fetch catalogs in parallel, retain successful results, and restore local edits.
export async function loadData() {
  // Keep healthy sections usable if a single catalog cannot be fetched.
  const results = await Promise.allSettled(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Unable to load ${url}`);
      }
      return [key, await response.json()];
    }),
  );

  const failures = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      const [key, value] = result.value;
      state.data[key] = value;
    } else {
      failures.push(result.reason.message);
    }
  }

  EDITABLE_TABLES.forEach((collection) => ensureRowIds(collection, state.data[collection]));
  applySavedTables();
  // Start Mail folders collapsed; search and folder filters still reveal matches.
  state.expandedMailSections = new Set();

  // Reset Mail demo data once when replacing the catalog with the ENO outline.
  const catalogReady = readStoredValue("frontdoor:mail-catalog") === "eno-outline-v1";
  if (!catalogReady) {
    try {
      writeStoredValue("frontdoor:mail-edits", "{}");
      writeStoredValue("frontdoor:mail-added", "[]");
      writeStoredValue("frontdoor:mail-catalog", "eno-outline-v1");
    } catch { /* The new baseline remains usable without browser storage. */ }
  }
  try {
    const edits = JSON.parse((catalogReady ? readStoredValue("frontdoor:mail-edits") : null) || "{}");
    if (edits && typeof edits === "object" && !Array.isArray(edits)) state.mailEdits = edits;
  } catch { state.mailEdits = {}; }
  try {
    const added = JSON.parse((catalogReady ? readStoredValue("frontdoor:mail-added") : null) || "[]");
    if (Array.isArray(added)) {
      state.mailAdded = added.filter((item) => typeof item.id === "string" && typeof item.title === "string" && item.preview && ["to", "subject", "body"].every((key) => typeof item.preview[key] === "string"));
      for (const item of state.mailAdded) {
        const section = state.data.mail.find((section) => section.id === item.categoryId) || state.data.mail.at(-1);
        if (section) section.subsections.unshift(item);
      }
    }
  } catch { state.mailAdded = []; }
  if (failures.length) throw new Error(failures.join("; "));
}
