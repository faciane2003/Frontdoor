// Reuse the same add form, inline editing, and deletion behavior in every editable table.

import { escapeHtml, fieldText, renderTrashIcon } from "../core/utils.mjs";
import { renderCollection } from "../core/router.mjs";
import { saveTable, scheduleTableSave } from "../core/storage.mjs";
import { normalizeLinkCategory } from "../views/links.mjs";
import { state, viewTitles } from "../core/state.mjs";
import { tableRowDialog, tableRowFields, tableRowForm } from "../core/dom.mjs";

export const TABLE_FORM_SCHEMAS = {
  features: [["title", "Title", "text", true], ["description", "Description", "textarea", true]],
  training: [["id", "ID", "text", true], ["tier", "Tier", "text", true], ["title", "Task", "text", true], ["area", "Area", "text", true], ["standard", "Performance Standard", "textarea", true]],
  sops: [["id", "ID", "text", true], ["title", "Title", "text", true], ["category", "Category", "text", true], ["purpose", "Purpose", "textarea", true]],
  certs: [["track", "Track", "text", true], ["name", "Certification", "text", true], ["provider", "Provider", "text", false], ["rating", "Rating", "rating", true], ["phase", "Category", "text", true], ["focus", "Focus", "textarea", true], ["notes", "Notes", "textarea", false], ["url", "Official URL", "url", true]],
  links: [["name", "Title", "text", true], ["category", "Category", "select", true], ["url", "URL", "url", true], ["description", "Description", "textarea", true]],
  whitepages: [["ticket", "Ticket", "text", true], ["reason", "Reason", "text", true], ["domain", "Domain", "text", true]],
};
// Mock schedule inputs produce consistent sample coverage for months generated in
// the browser. Replace these arrays when a real schedule source is connected.

// Render the shared add button with a section-specific label.
export function renderTableTools(collection, label = "Add Item") {
  return `
    <div class="table-tools">
      <button class="table-add" type="button" data-table-add="${escapeHtml(collection)}">${escapeHtml(label)}</button>
    </div>
  `;
}

// Make table text editable without displaying a separate input box.
export function renderEditableField(collection, index, name, value, label, multiline = false) {
  const fieldId = `${collection}-${index}`;
  const isLinkText = name === "url" || name === "id";
  const attrs = `class="editable-field ${multiline ? "is-multiline" : ""} ${isLinkText ? "is-link-like" : ""}" contenteditable="true" role="textbox" data-table-field="${escapeHtml(fieldId)}" data-table-name="${escapeHtml(name)}" aria-label="${escapeHtml(label)}"`;
  return `<span ${attrs}>${escapeHtml(value || "")}</span>`;
}

// Use the same accessible trash button across all editable tables.
export function renderRowActions(collection, index) {
  return `
    <span class="row-actions">
      <button class="row-trash" type="button" data-table-delete="${escapeHtml(collection)}" data-table-index="${index}" aria-label="Delete row" title="Delete row">${renderTrashIcon()}</button>
    </span>
  `;
}

// Build the add dialog from the selected table schema and its current category.
export function addTableRow(collection) {
  const defaults = {
    features: { title: "", description: "" },
    training: {
      id: "",
      title: "",
      area: state.trainingArea || "Uncategorized",
      tier: "",
      standard: "",
    },
    sops: {
      id: "",
      title: "",
      category: state.sopCategory || "Security Operations",
      purpose: "",
      status: "Pending",
      updated: new Date().toISOString().slice(0, 10),
      sections: [],
    },
    certs: {
      name: "",
      provider: "",
      track: "",
      rating: "Beginner",
      phase: state.certPhase || "Foundations",
      focus: "",
      notes: "",
      url: "",
    },
    links: {
      name: "",
      description: "",
      url: "",
      category: state.linkCategory || "Reference",
    },
    whitepages: {
      ticket: "",
      reason: "",
      domain: "",
    },
  };

  const schema = TABLE_FORM_SCHEMAS[collection];
  if (!schema) {
    return;
  }

  tableRowForm.dataset.collection = collection;
  document.querySelector("#entry-dialog-title").textContent = collection === "features" ? "Add Feature" : `Add ${viewTitles[collection] || "Table"} Item`;
  tableRowFields.innerHTML = schema
    .map(([name, label, type, required]) => {
      const value = defaults[collection][name] || "";
      let control;
      if (type === "textarea") {
        control = `<textarea id="entry-${escapeHtml(name)}" name="${escapeHtml(name)}" rows="3" ${required ? "required" : ""}>${escapeHtml(value)}</textarea>`;
      } else if (type === "rating") {
        control = `
          <select id="entry-${escapeHtml(name)}" name="${escapeHtml(name)}" ${required ? "required" : ""}>
            ${["Beginner", "Average", "Expert"]
              .map((rating) => `<option value="${rating}" ${rating === value ? "selected" : ""}>${rating}</option>`)
              .join("")}
          </select>
        `;
      } else if (type === "select") {
        const categories = [...new Set((state.data.links || []).map((item) => normalizeLinkCategory(item.category)).filter(Boolean))]
          .concat(value)
          .filter((category, index, values) => category && values.indexOf(category) === index)
          .sort((a, b) => a.localeCompare(b));
        control = `
          <select id="entry-${escapeHtml(name)}" name="${escapeHtml(name)}" ${required ? "required" : ""}>
            ${categories
              .map((category) => `<option value="${escapeHtml(category)}" ${category === value ? "selected" : ""}>${escapeHtml(category)}</option>`)
              .join("")}
          </select>
        `;
      } else {
        control = `<input id="entry-${escapeHtml(name)}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${required ? "required" : ""}>`;
      }
      const wideClass = type === "textarea" || type === "url" ? " class=\"entry-field-wide\"" : "";
      return `<label${wideClass} for="entry-${escapeHtml(name)}"><span>${escapeHtml(label)}</span>${control}</label>`;
    })
    .join("");
  tableRowDialog.showModal();
  tableRowFields.querySelector("input, select, textarea")?.focus();
}

// Read the visible editable cells and record which fields the user changed.
export function syncTableRow(collection, index, shouldRender = false) {
  const item = state.data[collection]?.[index];
  if (!item) {
    return;
  }

  const fieldId = `${collection}-${index}`;
  const fields = [...document.querySelectorAll(`[data-table-field="${CSS.escape(fieldId)}"]`)];
  fields.forEach((field) => {
    const name = field.dataset.tableName;
    const value = fieldText(field);
    if (item[name] !== value) {
      item[name] = value;
      item._editedFields = [...new Set([...(item._editedFields || []), name])];
    }
  });
  delete item._draft;
  if (collection === "links" && !item.url) {
    state.data.links.splice(index, 1);
    saveTable(collection);
    if (shouldRender) {
      renderCollection(collection);
    }
    return;
  }
  if (shouldRender) saveTable(collection);
  else scheduleTableSave(collection);
  if (shouldRender) {
    renderCollection(collection);
  }
}

// Remove one row and restore it if its deletion cannot be saved.
export function deleteTableRow(collection, index) {
  if (!state.data[collection]?.[index]) {
    return;
  }

  const [removed] = state.data[collection].splice(index, 1);
  if (!saveTable(collection)) state.data[collection].splice(index, 0, removed);
  renderCollection(collection);
}
