// Group certifications by path and display credential details and editable notes.

import { escapeHtml, filtered, renderEmpty } from "../core/utils.mjs";
import { renderEditableField, renderRowActions, renderTableTools } from "../shared/tables.mjs";
import { state } from "../core/state.mjs";

export function renderCerts() {
  const allItems = filtered("certs");
  const target = document.querySelector("#certs-list");

  if (!allItems.length) {
    target.innerHTML = renderEmpty("No certifications match.");
    return;
  }

  const byPhase = allItems.reduce((groups, item) => {
    const phase = item.phase || "Other";
    groups[phase] ||= [];
    groups[phase].push(item);
    return groups;
  }, {});
  const groups = Object.entries(byPhase).sort(([a], [b]) => a.localeCompare(b));
  const phases = groups.map(([phase]) => phase);
  if (state.certPhase && !phases.includes(state.certPhase)) {
    state.certPhase = "";
  }
  const rows = groups
    .filter(([phase]) => !state.certPhase || phase === state.certPhase)
    .map(([phase, categoryItems]) => {
      const isExpanded = Boolean(state.searchTerm || state.certPhase) || state.expandedCertCategories.has(phase);
      const childRows = isExpanded
        ? categoryItems
            .map((item) => ({ item, index: state.data.certs.indexOf(item) }))
            .sort((a, b) => (b.item._addedAt || 0) - (a.item._addedAt || 0) || (a.item.track || "").localeCompare(b.item.track || "") || (a.item.name || "").localeCompare(b.item.name || ""))
            .map(({ item, index }) => renderCertRow(item, index, true))
            .join("")
        : "";
      return `
        <tr class="cert-category-row">
          <td colspan="6">
            <button type="button" class="cert-category-toggle" data-cert-category-toggle="${escapeHtml(phase)}" aria-expanded="${isExpanded}">
              <strong>${escapeHtml(phase)}</strong>
            </button>
          </td>
        </tr>
        ${childRows}
      `;
    })
    .join("");

  target.innerHTML = `
    <div class="cert-layout">
      <div class="section-controls">
        <div class="section-filter-toolbar">
          <label for="cert-phase-select">Category</label>
          <select id="cert-phase-select" data-cert-phase-select>
            <option value="">All categories</option>
            ${groups
              .map(
                ([phase]) => `
                  <option value="${escapeHtml(phase)}" ${state.certPhase === phase ? "selected" : ""}>${escapeHtml(phase)}</option>
                `,
              )
              .join("")}
          </select>
        </div>
        ${renderTableTools("certs")}
      </div>
      <div>
        <div class="table-wrap">
          <table class="data-table cert-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Certification</th>
                <th>Rating</th>
                <th>Focus</th>
                <th>Notes</th>
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

export function renderCertRow(item, index, isCategoryChild = false) {
  return `
    <tr class="${isCategoryChild ? "cert-category-child" : ""}">
      <td>${renderEditableField("certs", index, "track", item.track || "", "Track")}</td>
      <td>
        <a class="table-link" href="${escapeHtml(item.url || "#")}">${escapeHtml(item.name || "Untitled Certification")}</a>
        ${renderEditableField("certs", index, "provider", item.provider || "", "Provider")}
      </td>
      <td>${renderEditableField("certs", index, "rating", item.rating || "Average", "Rating")}</td>
      <td>${renderEditableField("certs", index, "focus", item.focus || "", "Focus", true)}</td>
      <td>${renderEditableField("certs", index, "notes", item.notes || "", "Notes", true)}</td>
      <td>${renderRowActions("certs", index)}</td>
    </tr>
  `;
}
