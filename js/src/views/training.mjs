// Group qualification tasks by tier and area while retaining their editable source rows.

import { escapeHtml, filtered, renderEmpty } from "../core/utils.mjs";
import { renderEditableField, renderRowActions, renderTableTools } from "../shared/tables.mjs";
import { state } from "../core/state.mjs";

export function renderTraining() {
  const allItems = filtered("training");
  const target = document.querySelector("#training-list");

  if (!allItems.length) {
    target.innerHTML = renderEmpty("No JQS records match.");
    return;
  }

  const groups = Object.entries(groupTrainingByArea(allItems));
  const areas = groups.map(([area]) => area);
  if (state.trainingArea && !areas.includes(state.trainingArea)) {
    state.trainingArea = "";
  }

  const items = state.trainingArea
    ? allItems.filter((item) => (item.area || "Uncategorized") === state.trainingArea)
    : allItems;
  const tierOrder = new Map([["Tier I", 1], ["Tier II", 2], ["Tier III", 3], ["Advanced", 4], ["Unassigned", 5]]);
  const tierGroups = Object.entries(
    items.reduce((result, item) => {
      const tier = normalizeTrainingTier(item.tier);
      result[tier] ||= [];
      result[tier].push(item);
      return result;
    }, {}),
  ).sort(([a], [b]) => (tierOrder.get(a) || 99) - (tierOrder.get(b) || 99) || a.localeCompare(b));
  const rows = tierGroups
    .map(([tier, tierItems]) => {
      const isExpanded = Boolean(state.searchTerm) || state.expandedTrainingTiers.has(tier);
      const childRows = isExpanded
        ? Object.entries(groupTrainingByArea(tierItems))
            .map(([area, areaItems]) => {
              const areaKey = `${tier}::${area}`;
              const isAreaExpanded = Boolean(state.searchTerm) || state.expandedTrainingAreas.has(areaKey);
              const areaRows = isAreaExpanded
                ? areaItems
                    .map((item) => ({ item, index: state.data.training.indexOf(item) }))
                    .sort((a, b) => (b.item._addedAt || 0) - (a.item._addedAt || 0) || (a.item.id || "").localeCompare(b.item.id || ""))
                    .map(({ item, index }) => renderTrainingRow(item, index, true))
                    .join("")
                : "";
              return `
                <tr class="training-area-row">
                  <td colspan="5">
                    <button type="button" class="training-area-toggle" data-training-area="${escapeHtml(areaKey)}" aria-expanded="${isAreaExpanded}">${escapeHtml(area)}</button>
                  </td>
                </tr>
                ${areaRows}
              `;
            })
            .join("")
        : "";
      return `
        <tr class="training-tier-row">
          <td colspan="5">
            <button type="button" class="training-tier-toggle" data-training-tier="${escapeHtml(tier)}" aria-expanded="${isExpanded}">
              <strong>${escapeHtml(tier)}</strong>
            </button>
          </td>
        </tr>
        ${childRows}
      `;
    })
    .join("");

  target.innerHTML = `
    <div class="training-layout">
      <div class="section-controls">
        <div class="section-filter-toolbar">
          <label for="training-area-select">Area</label>
          <select id="training-area-select" data-training-area-select>
            <option value="">All areas</option>
            ${groups
              .map(
                ([area]) => `
                  <option value="${escapeHtml(area)}" ${state.trainingArea === area ? "selected" : ""}>${escapeHtml(area)}</option>
                `,
              )
              .join("")}
          </select>
        </div>
        ${renderTableTools("training")}
      </div>
      <div>
        <div class="table-wrap">
          <table class="data-table training-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Area</th>
                <th>Task</th>
                <th>Performance Standard</th>
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

export function groupTrainingByArea(items) {
  return items
    .slice()
    .sort((a, b) => (a.area || "Uncategorized").localeCompare(b.area || "Uncategorized"))
    .reduce((groups, item) => {
      const area = item.area || "Uncategorized";
      groups[area] ||= [];
      groups[area].push(item);
      return groups;
    }, {});
}

export function renderTrainingRow(item, index, isTierChild = false) {
  return `
    <tr class="${isTierChild ? "training-tier-child" : ""}">
      <td>${renderEditableField("training", index, "id", item.id, "JQS ID")}</td>
      <td>${isTierChild ? `<span class="training-tier-child-label">${escapeHtml(item.area || "Uncategorized")}</span>` : renderEditableField("training", index, "area", item.area || "Uncategorized", "Area")}</td>
      <td>${renderEditableField("training", index, "title", item.title, "Task", true)}</td>
      <td>${renderEditableField("training", index, "standard", item.standard, "Performance Standard", true)}</td>
      <td>${renderRowActions("training", index)}</td>
    </tr>
  `;
}

export function formatTier(tier) {
  return normalizeTrainingTier(tier).replace(/^Tier\s+/i, "") || "N/A";
}

export function normalizeTrainingTier(tier) {
  const value = String(tier || "").trim();
  const romanTier = value.match(/^(?:tier\s*)?(i|ii|iii)$/i);
  if (romanTier) {
    return `Tier ${romanTier[1].toUpperCase()}`;
  }
  if (/^advanced$/i.test(value)) {
    return "Advanced";
  }
  return value || "Unassigned";
}
