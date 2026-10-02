// Group procedures by category and open their guidance and saved analyst notes.

import { escapeHtml, filtered, renderEmpty } from "../core/utils.mjs";
import { renderEditableField, renderRowActions, renderTableTools } from "../shared/tables.mjs";
import { state } from "../core/state.mjs";
import { readStoredValue } from "../core/persistence.mjs";

export const SOP_CATEGORY_GROUPS = {
  Triage: "Security Operations",
  "Case Management": "Security Operations",
  Operations: "Security Operations",
  "Response Management": "Incident Response",
  "Endpoint Response": "Incident Response",
  "Email Security": "Incident Response",
  "Detection Engineering": "Detection & Intelligence",
  "Threat Intelligence": "Detection & Intelligence",
  "Identity and Access": "Identity, Cloud & Data",
  "Cloud Security": "Identity, Cloud & Data",
  "Data Protection": "Identity, Cloud & Data",
  "Network Security": "Network & Vulnerability",
  "Vulnerability Management": "Network & Vulnerability",
};

// All data inserted into HTML templates passes through this small escaping helper.

export function renderSops() {
  const allItems = filtered("sops");
  const target = document.querySelector("#sops-list");

  if (!allItems.length) {
    target.innerHTML = renderEmpty("No SOPs match.");
    return;
  }

  const groups = Object.entries(groupByCategory(allItems)).sort(([a], [b]) => a.localeCompare(b));
  const categories = groups.map(([category]) => category);
  if (!state.sopCategoriesInitialized) {
    state.expandedSopCategories.clear();
    state.sopCategoriesInitialized = true;
  }
  if (state.sopCategory && !categories.includes(state.sopCategory)) {
    state.sopCategory = "";
  }

  const rows = groups
    .filter(([category]) => !state.sopCategory || category === state.sopCategory)
    .map(([category, sops]) => {
      const isExpanded = Boolean(state.searchTerm || state.sopCategory) || state.expandedSopCategories.has(category);
      return `
        <tr class="sop-category-row">
          <td colspan="5">
            <button type="button" class="sop-category-toggle" data-sop-category-toggle="${escapeHtml(category)}" aria-expanded="${isExpanded}">
              <strong>${escapeHtml(category)}</strong>
            </button>
          </td>
        </tr>
        ${isExpanded ? sops.map((item) => renderSopTocRow(item, state.data.sops.indexOf(item), true)).join("") : ""}
      `;
    })
    .join("");
  const visibleItems = state.sopCategory
    ? allItems.filter((item) => normalizeSopCategory(item.category || item.type) === state.sopCategory)
    : allItems;

  target.innerHTML = `
    <div class="sop-layout">
      <div class="section-controls">
        <div class="section-filter-toolbar">
          <label for="sop-category-select">Category</label>
          <select id="sop-category-select" data-sop-category-select>
            <option value="">All categories</option>
            ${groups
              .map(
                ([category]) => `
                  <option value="${escapeHtml(category)}" ${state.sopCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>
                `,
              )
              .join("")}
          </select>
        </div>
        ${renderTableTools("sops")}
      </div>
      <div class="sop-content">
        <div class="table-wrap">
          <table class="data-table sop-toc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Purpose</th>
                <th aria-label="Row actions"></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="sop-body-list">
          ${visibleItems.map(renderSopBody).join("")}
        </div>
      </div>
    </div>
  `;
}

export function groupByCategory(items) {
  return items
    .slice()
    .sort((a, b) => {
      const addedSort = (b._addedAt || 0) - (a._addedAt || 0);
      if (addedSort) {
        return addedSort;
      }
      const categorySort = normalizeSopCategory(a.category || a.type).localeCompare(normalizeSopCategory(b.category || b.type));
      return categorySort || (a.id || a.name || "").localeCompare(b.id || b.name || "");
    })
    .reduce((groups, item) => {
      const category = normalizeSopCategory(item.category || item.type);
      groups[category] ||= [];
      groups[category].push(item);
      return groups;
    }, {});
}

export function normalizeSopCategory(category) {
  const value = String(category || "Security Operations").trim() || "Security Operations";
  return SOP_CATEGORY_GROUPS[value] || value;
}

export function renderSopTocRow(item, index, isCategoryChild = false) {
  const id = sopId(item);
  return `
    <tr class="${isCategoryChild ? "sop-category-child" : ""}">
      <td>
        <a class="table-link" href="https://www.google.com/" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(item.id || item.name || "SOP")} example link">${escapeHtml(item.id || item.name || "")}</a>
      </td>
      <td>
        <button class="table-link sop-open-link editable-field is-multiline" type="button" contenteditable="true" data-sop-open="${id}" data-table-field="sops-${index}" data-table-name="title" aria-label="SOP Title">${escapeHtml(item.title || item.type || item.name || "")}</button>
      </td>
      <td>${renderEditableField("sops", index, "category", normalizeSopCategory(item.category || item.type), "Category")}</td>
      <td>${renderEditableField("sops", index, "purpose", item.purpose || "", "Purpose", true)}</td>
      <td>${renderRowActions("sops", index)}</td>
    </tr>
  `;
}

export function sopId(item) {
  return `sop-${String(item.id || item.name || item.title || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function renderSopBody(item) {
  const id = sopId(item);
  const savedNotes = readStoredValue(sopNotesKey(id));
  const notes = savedNotes ?? defaultSopNotes(item);

  return `
    <article id="${id}" class="sop-body" hidden>
      <header class="sop-body-header">
        <div>
          <h3>${escapeHtml(item.id || item.name || "")} - ${escapeHtml(normalizeSopCategory(item.category || item.type))} - ${escapeHtml(item.title || item.type || item.name || "Untitled SOP")}</h3>
        </div>
        <dl class="sop-meta">
          <div>
            <dt>Updated</dt>
            <dd>${escapeHtml(item.updated || "Not set")}</dd>
          </div>
        </dl>
      </header>
      <section class="sop-notes">
        <label for="${id}-notes">Notes</label>
        <textarea id="${id}-notes" data-sop-notes="${id}" rows="5">${escapeHtml(notes)}</textarea>
      </section>
    </article>
  `;
}

export function sopNotesKey(id) {
  return `sop-notes:${id}`;
}

export function defaultSopNotes(item) {
  return (item.sections || [])
    .slice(0, 5)
    .map((section, index) => `${index + 1}. ${section.body}`)
    .join("\n");
}
