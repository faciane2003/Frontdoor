// Centralize browser-storage access and turn write failures into readable errors.

// Keep existing keys compatible with browser edits made before the refactor.
export function readStoredValue(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

export function writeStoredValue(key, value) {
  try { localStorage.setItem(key, value); }
  catch {
    throw new Error("Unable to save changes. Check available browser storage and try again.");
  }
}

export function removeStoredValue(key) {
  try { localStorage.removeItem(key); }
  catch { /* Reading malformed data should not prevent the portal from opening. */ }
}
