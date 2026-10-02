// Show feature titles and descriptions with inline editing and row deletion.

import { filtered, renderEmpty } from "../core/utils.mjs";
import { renderEditableField, renderRowActions, renderTableTools } from "../shared/tables.mjs";
import { state } from "../core/state.mjs";

// Render each feature as editable title and description text with a delete button.
export function renderFeatures() {
  const rows = filtered("features").map((item) => {
    const index = state.data.features.indexOf(item);
    return `<tr><td>${renderEditableField("features", index, "title", item.title, "Feature title")}</td><td>${renderEditableField("features", index, "description", item.description, "Feature description", true)}</td><td>${renderRowActions("features", index)}</td></tr>`;
  }).join("");
  document.querySelector("#features-list").innerHTML = `
    ${renderTableTools("features", "Add Feature")}
    <div class="table-wrap"><table class="data-table resource-table features-table">
      <thead><tr><th scope="col">Title</th><th scope="col">Description</th><th aria-label="Row actions"></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3">${renderEmpty(state.searchTerm ? "No features match." : "No features yet. Add a feature to get started.")}</td></tr>`}</tbody>
    </table></div>`;
}
