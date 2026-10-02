// Share safe HTML rendering, links, search, dates, and downloads across sections.

import { state } from "./state.mjs";

// Escape plain data before inserting it into an HTML template.
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Search user-facing data while excluding internal edit metadata.
export function matchRecord(record, term) {
  if (!term) {
    return true;
  }

  // Saved row identities and edit metadata are bookkeeping, not searchable text.
  return JSON.stringify(record, (key, value) => key.startsWith("_") ? undefined : value)
    .toLowerCase().includes(term.toLowerCase());
}

// Keep unfinished draft rows visible while filtering a collection.
export function filtered(collection) {
  const data = state.data[collection];
  return Array.isArray(data) ? data.filter((item) => item._draft || matchRecord(item, state.searchTerm)) : data;
}

// Use the local calendar date rather than shifting it through UTC.
export function currentLocalDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Allow only ordinary web links, adding HTTPS when a scheme is missing.
export function safeExternalUrl(value) {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(/^[a-z][a-z\d+.-]*:/i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.href : "";
  } catch {
    return "";
  }
}

// Open a valid reference safely, or display its text when the URL is unusable.
export function renderExternalLink(value, label) {
  const href = safeExternalUrl(value);
  if (!href) {
    return `<span aria-label="${escapeHtml(label)}">${escapeHtml(value)}</span>`;
  }

  return `<a class="is-link-like table-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${label}: ${value}`)}">${escapeHtml(value)}</a>`;
}

// Share a recognizable bin icon instead of depending on a platform-specific character.
export function renderTrashIcon() {
  return `<svg class="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>`;
}

// Read either editable text or a form control using the same trimming rules.
export function fieldText(field) {
  return field.isContentEditable ? field.textContent.trim() : field.value.trim();
}

// Download generated text directly without sending it to a server.
export function downloadTextFile(contents, filename, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([contents], { type }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Use one escaped empty-state message for all sections.
export function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}
