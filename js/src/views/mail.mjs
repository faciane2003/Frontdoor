// Manage email rows, editable previews, Outlook imports, and updated template downloads.

import { escapeHtml, matchRecord, renderEmpty, renderTrashIcon } from "../core/utils.mjs";
import { state } from "../core/state.mjs";
import { globalSearch } from "../core/dom.mjs";
import { loadOutlookLibrary } from "../core/libraries.mjs";
import { writeStoredValue } from "../core/persistence.mjs";

// Validate the selected Outlook file before extracting its readable email content.
export async function readOutlookFile(file) {
  if (!/\.(oft|msg)$/i.test(file.name)) throw new Error("Choose an .oft or .msg file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file smaller than 10 MB.");
  const bytes = await file.arrayBuffer();
  const signature = Array.from(new Uint8Array(bytes, 0, Math.min(8, bytes.byteLength))).map((value) => value.toString(16).padStart(2, "0")).join("");
  if (signature !== "d0cf11e0a1b11ae1") throw new Error("This is not a binary Outlook template or message.");
  const { parseMailOft } = await loadOutlookLibrary();
  return parseMailOft(bytes);
}

// Save a new email row before displaying it as successfully added.
export function addMailEmail(preview = { to: "", subject: "New Email", body: "" }, title = "New Email", description = "", categoryId = state.mailSection) {
  const section = state.data.mail.find((section) => section.id === categoryId) || state.data.mail[0];
  const item = { id: `mail-${crypto.randomUUID()}`, categoryId: section.id, title, description, template: "#", preview: { to: preview.to, subject: preview.subject, body: preview.body } };
  const added = [...state.mailAdded, item];
  // Persist before rendering so storage failures do not appear as successful additions.
  writeStoredValue("frontdoor:mail-added", JSON.stringify(added));
  state.mailAdded = added;
  section.subsections.unshift(item);
  state.expandedMailSections.add(section.id);
  state.expandedMailPreviews.add(item.id);
  return item;
}

// Generate a binary Outlook template from the most recently saved email content.
export async function downloadMailTemplate(id) {
  const item = state.data.mail.flatMap((section) => section.subsections).find((row) => row.id === id);
  if (!item) throw new Error("Email template not found.");
  const saved = { ...item.preview, ...state.mailEdits[id] };
  if (!saved.subject.trim() || !saved.body.trim()) throw new Error("Upload or enter email contents and Save before downloading.");
  const { createMailOft } = await loadOutlookLibrary();
  const preview = { ...item.preview, ...state.mailEdits[id] };
  const bytes = await createMailOft({
    subject: preview.subject,
    to: preview.to.split(/[,;]/).map((value) => value.trim()).filter(Boolean),
    text: preview.body,
    html: `<html><body>${preview.body.split("\n\n").map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("")}</body></html>`,
  });
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.ms-outlook" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = /\.oft$/i.test(item.title) ? item.title : `${item.title}.oft`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Group templates by section and show editors only for expanded email rows.
export function renderMail() {
  const term = state.searchTerm.trim().toLowerCase();
  const folders = state.data.mail;
  const descendants = (id) => folders.filter((folder) => folder.parentId === id);
  const selected = folders.find((folder) => folder.id === state.mailSection);
  const roots = selected ? [selected] : folders.filter((folder) => !folder.parentId);
  const matches = (folder) => matchRecord({ title: folder.title }, term) || folder.subsections.some((item) => !state.mailEdits[item.id]?.deleted && matchRecord({ ...item, ...state.mailEdits[item.id] }, term)) || descendants(folder.id).some(matches);
  const renderFolder = (section, depth = 0, inheritedMatch = false, visible = true) => {
    const sectionMatches = inheritedMatch || matchRecord({ title: section.title }, term);
    if (term && !sectionMatches && !matches(section)) return "";
    const children = section.subsections.filter((item) => !state.mailEdits[item.id]?.deleted && (sectionMatches || matchRecord({ ...item, ...state.mailEdits[item.id] }, term))).map((item) => ({ ...item, ...state.mailEdits[item.id] }));
    const expanded = Boolean(term || selected) || state.expandedMailSections.has(section.id);
    const titleLink = (item) => `<a class="table-link" aria-disabled="${!({ ...item.preview, ...state.mailEdits[item.id] }).body?.trim()}" href="${escapeHtml(item.template)}" data-mail-download="${escapeHtml(item.id)}" download>${escapeHtml(item.title)}</a>`;
    const renderEmail = (item) => {
          const previewExpanded = state.expandedMailPreviews.has(item.id);
          const preview = { ...item.preview, ...state.mailEdits[item.id] };
          return `<tr class="mail-subsection-row" data-mail-preview-toggle="${escapeHtml(item.id)}" tabindex="0" aria-expanded="${previewExpanded}" aria-controls="mail-preview-${escapeHtml(item.id)}" aria-label="Preview ${escapeHtml(item.title)}"><td style="--mail-depth:${depth + 1}"><span data-mail-title-link ${previewExpanded ? "hidden" : ""}>${titleLink(item)}</span><span class="editable-field is-link-like" contenteditable="true" role="textbox" aria-label="Title" data-mail-meta="title" data-mail-id="${escapeHtml(item.id)}" ${previewExpanded ? "" : "hidden"}>${escapeHtml(item.title)}</span></td><td><span class="editable-field is-multiline" contenteditable="${previewExpanded}" ${previewExpanded ? 'role="textbox" aria-label="Description"' : ""} data-mail-meta="description" data-mail-id="${escapeHtml(item.id)}">${escapeHtml(item.description)}</span></td><td><span class="row-actions"><button class="row-trash" type="button" data-mail-delete="${escapeHtml(item.id)}" aria-label="Delete row" title="Delete row">${renderTrashIcon()}</button></span></td></tr>
            <tr id="mail-preview-${escapeHtml(item.id)}" class="mail-preview-row" ${previewExpanded ? "" : "hidden"}><td colspan="3"><form class="mail-preview" data-mail-edit="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)} email example"><div class="mail-upload-control"><button type="button" class="table-add" data-mail-upload-open>Upload</button><input data-mail-upload type="file" accept=".oft,.msg" aria-label="Upload Outlook Template" hidden></div><label>To<input name="to" type="email" multiple value="${escapeHtml(preview.to)}"></label><label>Subject<input name="subject" type="text" required value="${escapeHtml(preview.subject)}"></label><label for="mail-body-${escapeHtml(item.id)}">Body</label><textarea id="mail-body-${escapeHtml(item.id)}" name="body" rows="12" required>${escapeHtml(preview.body)}</textarea><button class="table-add" type="submit">Save</button><span class="mail-save-status" role="status" aria-live="polite"></span></form></td></tr>`;
        };
    return `
      <tbody ${visible ? "" : "hidden"}><tr class="${depth === 0 ? "training-tier-row" : "training-area-row"} mail-section-row">
        <td colspan="3"><button class="${depth === 0 ? "training-tier-toggle" : "training-area-toggle"}" type="button" data-mail-toggle="${escapeHtml(section.id)}" aria-expanded="${expanded}">${depth === 0 ? `<strong>${escapeHtml(section.title)}</strong>` : `<span style="--mail-depth:${depth}">${escapeHtml(section.title)}</span>`}</button></td>
      </tr></tbody>
      ${[...children, ...descendants(section.id)].sort((a, b) => (a.order ?? -1) - (b.order ?? -1)).map((item) => item.subsections ? renderFolder(item, depth + 1, sectionMatches, visible && expanded) : `<tbody ${visible && expanded ? "" : "hidden"}>${renderEmail(item)}</tbody>`).join("")}`;
  };
  const rows = roots.map((folder) => renderFolder(folder)).filter(Boolean);
  document.querySelector("#mail-list").innerHTML = `
    <div class="mail-layout">
      <div class="section-controls">
        <div class="section-filter-toolbar"><label for="mail-section-select">Category</label><select id="mail-section-select"><option value="">All categories</option>${state.data.mail.map((section) => `<option value="${escapeHtml(section.id)}" ${state.mailSection === section.id ? "selected" : ""}>${escapeHtml(section.path || section.title)}</option>`).join("")}</select></div>
        <button class="table-add" type="button" data-mail-add>Add Email</button>
        <button class="table-add" type="button" data-mail-import-open ${state.mailImporting ? "disabled" : ""}>Import</button>
        <input type="file" accept=".oft,.msg" multiple data-mail-import hidden aria-label="Import Outlook emails">
      </div>
      <div role="status" data-mail-import-status aria-live="polite"></div>
      ${rows.length ? `<div class="table-wrap"><table class="data-table mail-table"><thead><tr><th scope="col">Title</th><th scope="col">Description</th><th aria-label="Row actions"></th></tr></thead>${rows.join("")}</table></div>` : renderEmpty("No mail templates match.")}
    </div>`;

}

// Handle email forms, imports, previews, metadata edits, and downloads in one place.
export function bindMailEvents() {
  const mailAddDialog = document.querySelector("#mail-add-dialog");
  const mailAddForm = document.querySelector("#mail-add-form");
  mailAddDialog.querySelector("[data-mail-add-cancel]").addEventListener("click", () => mailAddDialog.close());
  mailAddForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(mailAddForm));
    if (!values.title.trim() || !values.subject.trim() || !values.body.trim()) {
      mailAddForm.querySelector(".mail-add-status").textContent = "Enter a title, subject, and body.";
      return;
    }
    try {
      const item = addMailEmail({ to: values.to.trim(), subject: values.subject.trim(), body: values.body }, values.title.trim(), values.description.trim(), values.categoryId);
      state.mailSection = values.categoryId;
      state.searchTerm = "";
      globalSearch.value = "";
      mailAddDialog.close();
      renderMail();
      document.querySelector(`[data-mail-preview-toggle="${CSS.escape(item.id)}"]`).focus();
    } catch { mailAddForm.querySelector(".mail-add-status").textContent = "Unable to save email. Check available browser storage."; }
  });
  document.querySelector("#mail-list").addEventListener("change", async (event) => {
    if (!event.target.matches("[data-mail-import]")) return;
    const files = Array.from(event.target.files || []);
    if (!files.length || state.mailImporting) return;
    const categoryId = state.mailSection;
    state.mailImporting = true;
    document.querySelector("[data-mail-import-open]").disabled = true;
    const status = document.querySelector("[data-mail-import-status]");
    status.textContent = "Importing Outlook emails…";
    let count = 0;
    let attachments = false;
    const errors = [];
    for (const file of files) {
      try {
        const parsed = await readOutlookFile(file);
        const title = parsed.subject.trim() || file.name.replace(/\.(oft|msg)$/i, "");
        addMailEmail(parsed, title, parsed.body.replace(/\s+/g, " ").trim().slice(0, 120), categoryId);
        attachments ||= parsed.attachmentCount > 0;
        count += 1;
      } catch (error) { errors.push(`${file.name}: ${error.message}`); }
    }
    state.mailImporting = false;
    if (count) { state.searchTerm = ""; globalSearch.value = ""; }
    renderMail();
    document.querySelector("[data-mail-import-status]").textContent = `${count} email${count === 1 ? "" : "s"} added.${attachments ? " Attachments are not imported." : ""}${errors.length ? ` ${errors.join(" ")}` : ""}`;
  });
  const saveMailMetadata = (id, changes) => {
    const edits = { ...state.mailEdits, [id]: { ...state.mailEdits[id], ...changes } };
    try {
      writeStoredValue("frontdoor:mail-edits", JSON.stringify(edits));
      state.mailEdits = edits;
      return true;
    } catch { alert("Unable to save changes. Check available browser storage."); return false; }
  };
  document.querySelector("#mail-list").addEventListener("focusout", (event) => {
    const field = event.target.closest('[data-mail-meta][contenteditable="true"]');
    if (!field) return;
    const value = field.textContent.trim();
    if (field.dataset.mailMeta === "title" && !value) {
      const item = state.data.mail.flatMap((section) => section.subsections).find((item) => item.id === field.dataset.mailId);
      field.textContent = state.mailEdits[field.dataset.mailId]?.title || item.title;
      return;
    }
    if (saveMailMetadata(field.dataset.mailId, { [field.dataset.mailMeta]: value }) && field.dataset.mailMeta === "title") {
      field.closest("tr").querySelector("a").textContent = value;
      field.closest("tr").setAttribute("aria-label", `Preview ${value}`);
    }
  });
  document.querySelector("#mail-list").addEventListener("change", async (event) => {
    if (!event.target.matches("[data-mail-upload]")) return;
    const input = event.target;
    const file = input.files?.[0];
    const form = input.closest("[data-mail-edit]");
    const status = form.querySelector(".mail-save-status");
    if (!file) return;
    try {
      const parsed = await readOutlookFile(file);
      form.elements.to.value = parsed.to;
      form.elements.subject.value = parsed.subject;
      form.elements.body.value = parsed.body;
      status.textContent = `Imported ${file.name}. Review and Save to update the download.${parsed.attachmentCount ? " Attachments are not imported." : ""}`;
    } catch (error) { status.textContent = `Import failed: ${error.message}`; }
    input.value = "";
  });
  document.querySelector("#mail-list").addEventListener("submit", (event) => {
    const form = event.target.closest("[data-mail-edit]");
    if (!form) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const nextEdits = { ...state.mailEdits, [form.dataset.mailEdit]: { ...state.mailEdits[form.dataset.mailEdit], ...values } };
    const status = form.querySelector(".mail-save-status");
    try {
      writeStoredValue("frontdoor:mail-edits", JSON.stringify(nextEdits));
      state.mailEdits = nextEdits;

      document.querySelector(`[data-mail-download="${CSS.escape(form.dataset.mailEdit)}"]`).setAttribute("aria-disabled", "false");
      status.textContent = "Saved. Title downloads now use this email.";
    } catch { status.textContent = "Unable to save. Check available browser storage and try again."; }
  });
  document.querySelector("#mail-list").addEventListener("input", (event) => {
    const form = event.target.closest("[data-mail-edit]");
    if (form) form.querySelector(".mail-save-status").textContent = "Unsaved changes.";
  });
  const toggleMailPreview = (row) => {
    const id = row.dataset.mailPreviewToggle;
    const expanded = !state.expandedMailPreviews.has(id);
    if (expanded) state.expandedMailPreviews.add(id);
    else state.expandedMailPreviews.delete(id);
    row.setAttribute("aria-expanded", String(expanded));
    row.querySelector("[data-mail-title-link]").hidden = expanded;
    row.querySelector('[data-mail-meta="title"]').hidden = !expanded;
    const description = row.querySelector('[data-mail-meta="description"]');
    description.contentEditable = String(expanded);
    if (expanded) { description.setAttribute("role", "textbox"); description.setAttribute("aria-label", "Description"); }
    else { description.removeAttribute("role"); description.removeAttribute("aria-label"); }
    document.getElementById(`mail-preview-${id}`).hidden = !expanded;
  };
  document.querySelector("#mail-list").addEventListener("keydown", (event) => {
    if (!event.target.matches("[data-mail-preview-toggle]") || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    toggleMailPreview(event.target);
  });
  document.querySelector("#mail-list").addEventListener("change", (event) => {
    if (event.target.id !== "mail-section-select") return;
    state.mailSection = event.target.value;
    renderMail();
  });
  document.querySelector("#mail-list").addEventListener("click", (event) => {
    if (event.target.closest("[data-mail-add]")) {
      mailAddForm.reset();
      mailAddForm.elements.categoryId.innerHTML = state.data.mail.map((section) => `<option value="${escapeHtml(section.id)}">${escapeHtml(section.path || section.title)}</option>`).join("");
      mailAddForm.elements.categoryId.value = state.mailSection || state.data.mail[0].id;
      mailAddForm.querySelector(".mail-add-status").textContent = "";
      mailAddDialog.showModal();
      mailAddForm.elements.title.focus();
      return;
    }
    if (event.target.closest("[data-mail-import-open]")) {
      document.querySelector("[data-mail-import]").click();
      return;
    }
    const uploadButton = event.target.closest("[data-mail-upload-open]");
    if (uploadButton) {
      uploadButton.closest("[data-mail-edit]").querySelector("[data-mail-upload]").click();
      return;
    }
    const deleteRow = event.target.closest("[data-mail-delete]");
    if (deleteRow) {
      if (saveMailMetadata(deleteRow.dataset.mailDelete, { deleted: true })) renderMail();
      return;
    }
    const download = event.target.closest("[data-mail-download]");
    if (download) {
      event.preventDefault();
      downloadMailTemplate(download.dataset.mailDownload).catch((error) => alert(`Unable to download template: ${error.message}`));
      return;
    }
    const previewRow = event.target.closest("[data-mail-preview-toggle]");
    if (previewRow && !event.target.closest('a, button, [contenteditable="true"]')) {
      toggleMailPreview(previewRow);
      return;
    }
    const toggle = event.target.closest("[data-mail-toggle]");
    if (!toggle) return;
    const id = toggle.dataset.mailToggle;
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    if (expanded) state.expandedMailSections.add(id);
    else state.expandedMailSections.delete(id);
    renderMail();
  });
}
