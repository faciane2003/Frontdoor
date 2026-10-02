// Consolidate legacy resource categories and render references with editable descriptions.

import { escapeHtml, filtered, renderEmpty, renderExternalLink } from "../core/utils.mjs";
import { renderEditableField, renderRowActions, renderTableTools } from "../shared/tables.mjs";
import { state } from "../core/state.mjs";

export const LINK_CATEGORY_GROUPS = {
  "Apple Artifacts": "Digital Forensics",
  "Artifact Extraction": "Digital Forensics",
  "Browser Artifacts": "Digital Forensics",
  "File Analysis": "Digital Forensics",
  "File Recovery": "Digital Forensics",
  "Forensic Imaging": "Digital Forensics",
  "Forensic Suites": "Digital Forensics",
  "Memory Forensics": "Digital Forensics",
  "Windows Artifacts": "Digital Forensics",
  "Malware Analysis": "Malware & Reverse Engineering",
  "Reverse Engineering": "Malware & Reverse Engineering",
  "Network Analysis": "Network & Threat Intelligence",
  "Threat Intelligence": "Network & Threat Intelligence",
  "Linux References": "Operating Systems",
  "Windows Tools": "Operating Systems",
  "Lab Platforms": "Labs & Learning",
  "Learning Resources": "Labs & Learning",
  Hashing: "Utilities & Hashing",
  Utilities: "Utilities & Hashing",
};

export function renderLinks() {
  const allItems = filtered("links").filter((item) => item.url || item._draft);
  const target = document.querySelector("#links-list");

  if (!allItems.length) {
    target.innerHTML = renderEmpty("No links match.");
    return;
  }

  const groups = Object.entries(groupByResourceCategory(allItems));
  const categories = groups.map(([category]) => category);
  if (state.linkCategory && !categories.includes(state.linkCategory)) {
    state.linkCategory = "";
  }
  const rows = groups
    .filter(([category]) => !state.linkCategory || category === state.linkCategory)
    .map(([category, categoryItems]) => {
      const isExpanded = Boolean(state.searchTerm || state.linkCategory) || state.expandedLinkCategories.has(category);
      const childRows = isExpanded
        ? categoryItems
            .map((item) => ({ item, index: state.data.links.indexOf(item) }))
            .sort((a, b) => (b.item._addedAt || 0) - (a.item._addedAt || 0) || (a.item.name || "").localeCompare(b.item.name || ""))
            .map(({ item, index }) => renderLinkRow(item, index, true))
            .join("")
        : "";
      return `
        <tr class="link-category-row">
          <td colspan="4">
            <button type="button" class="link-category-toggle" data-link-category-toggle="${escapeHtml(category)}" aria-expanded="${isExpanded}">
              <strong>${escapeHtml(category)}</strong>
            </button>
          </td>
        </tr>
        ${childRows}
      `;
    })
    .join("");

  target.innerHTML = `
    <div class="links-layout">
      <div class="section-controls">
        <div class="section-filter-toolbar">
          <label for="link-category-select">Category</label>
          <select id="link-category-select" data-link-category-select>
            <option value="">All categories</option>
            ${groups
              .map(
                ([category]) => `
                  <option value="${escapeHtml(category)}" ${state.linkCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>
                `,
              )
              .join("")}
          </select>
        </div>
        ${renderTableTools("links")}
      </div>
      <div>
        <div class="table-wrap">
          <table class="data-table resource-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>URL</th>
                <th>Description</th>
                <th aria-label="Row actions"></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function renderLinkRow(item, index, isCategoryChild = false) {
  return `
    <tr class="${isCategoryChild ? "link-category-child" : ""}">
      <td>${renderEditableField("links", index, "name", item.name || "", "Resource")}</td>
      <td>${renderExternalLink(item.url || "", "URL")}</td>
      <td>${renderEditableField("links", index, "description", item.description || "", "Description", true)}</td>
      <td>${renderRowActions("links", index)}</td>
    </tr>
  `;
}

export function groupByResourceCategory(items) {
  return items
    .slice()
    .sort((a, b) => normalizeLinkCategory(a.category).localeCompare(normalizeLinkCategory(b.category)))
    .reduce((groups, item) => {
      const category = normalizeLinkCategory(item.category);
      groups[category] ||= [];
      groups[category].push(item);
      return groups;
    }, {});
}

export function normalizeLinkCategory(category) {
  const value = String(category || "Reference").trim() || "Reference";
  return LINK_CATEGORY_GROUPS[value] || value;
}
