// Connect navigation, shared forms, filters, and editable cells to their actions.

import { escapeHtml } from "./utils.mjs";
import { renderCollection, renderView, setView, syncSocSearch } from "./router.mjs";
import { flushTableSaves, saveIntuneList, saveTable } from "./storage.mjs";
import { TABLE_FORM_SCHEMAS, addTableRow, deleteTableRow, syncTableRow } from "../shared/tables.mjs";
import { renderTraining } from "../views/training.mjs";
import { renderSops, sopNotesKey } from "../views/sops.mjs";
import { renderCerts } from "../views/certs.mjs";
import { onCallNotesKey, renderSchedule, syncOnCallDay } from "../views/schedule.mjs";
import { renderLinks } from "../views/links.mjs";
import { renderGithub } from "../views/github.mjs";
import { exportWhitepages, importWhitepagesFile } from "../views/whitepages.mjs";
import { conferenceEventsForLocation, formatConferenceDate, openConferenceDetails, renderConferenceCallouts, updateConferenceMapMonth } from "../views/cons.mjs";
import { deleteIntuneItem, importIntuneFile, normalizeComparisonValue, openIntuneAdd, renderTools } from "../views/tools.mjs";
import { bindMailEvents } from "../views/mail.mjs";
import { state } from "./state.mjs";
import { appNav, conferenceDialog, globalSearch, intuneEntryDialog, intuneEntryForm, intuneEntryValue, navItems, navToggle, socFrame, tableRowDialog, tableRowForm } from "./dom.mjs";
import { writeStoredValue } from "./persistence.mjs";

export function bindEvents() {
  // Typing batches writes; leaving the page flushes edits that are still pending.
  window.addEventListener("pagehide", flushTableSaves);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushTableSaves();
  });
  bindMailEvents();
  window.addEventListener("resize", () => {
    if (state.activeView === "cons") renderConferenceCallouts(document.querySelector(".cons-map"));
  });
  intuneEntryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const listName = intuneEntryForm.dataset.listName;
    const value = intuneEntryValue.value.trim();
    const values = listName === "standing" ? state.toolsStanding : state.toolsNew;
    if (value && !values.some((item) => normalizeComparisonValue(item) === normalizeComparisonValue(value))) {
      values.unshift(value);
      saveIntuneList(listName);
    }
    intuneEntryDialog.close();
    renderTools();
  });

  document.querySelector("[data-intune-entry-cancel]").addEventListener("click", () => intuneEntryDialog.close());

  tableRowForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const collection = tableRowForm.dataset.collection;
    if (!TABLE_FORM_SCHEMAS[collection]) {
      return;
    }

    const item = Object.fromEntries(new FormData(tableRowForm).entries());
    if (collection === "features") {
      item.title = item.title.trim();
      item.description = item.description.trim();
      if (!item.title || !item.description) return;
      item.id = crypto.randomUUID();
    }
    if (collection === "sops") {
      Object.assign(item, { status: "Pending", updated: new Date().toISOString().slice(0, 10), sections: [] });
    }
    item._addedAt = Date.now();
    item._rowId = `custom:${crypto.randomUUID()}`;
    state.data[collection].unshift(item);
    if (!saveTable(collection)) {
      state.data[collection].shift();
      return;
    }
    tableRowDialog.close();
    tableRowForm.reset();
    renderCollection(collection);
  });

  document.querySelector("[data-entry-cancel]").addEventListener("click", () => {
    tableRowDialog.close();
    tableRowForm.reset();
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => setView(item.dataset.view));
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.jump));
  });

  navToggle.addEventListener("click", () => {
    const isOpen = appNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  let searchTimer;
  globalSearch.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      renderView(state.activeView);
      if (state.activeView === "soc") syncSocSearch();
    }, 100);
  });

  socFrame?.addEventListener("load", syncSocSearch);

  const showMapTooltip = (pin, clientX, clientY) => {
    const map = pin.closest(".cons-map");
    const tooltip = map?.querySelector("[data-cons-map-tooltip]");
    if (!map || !tooltip) return;
    const context = conferenceEventsForLocation(pin.dataset.mapLocation)
      .map((item) => `${item.name} (${formatConferenceDate(item.startDate, item.endDate)})`)
      .join("; ");
    const signature = `${pin.dataset.mapLocation}|${context}`;
    if (tooltip.dataset.signature !== signature) {
      tooltip.innerHTML = `<strong>${escapeHtml(pin.dataset.mapLocation)}</strong><span>${escapeHtml(context)}</span>`;
      tooltip.dataset.signature = signature;
    }
    tooltip.hidden = false;
    const mapRect = map.getBoundingClientRect();
    const pinRect = pin.getBoundingClientRect();
    const x = Number.isFinite(clientX) ? clientX - mapRect.left : pinRect.left + pinRect.width / 2 - mapRect.left;
    const y = Number.isFinite(clientY) ? clientY - mapRect.top : pinRect.top - mapRect.top;
    tooltip.style.left = `${Math.max(8, Math.min(mapRect.width - 268, x + 12))}px`;
    tooltip.style.top = `${Math.max(8, y - 12)}px`;
  };

  document.addEventListener("pointerover", (event) => {
    const pin = event.target.closest?.(".cons-map-pin");
    if (pin) showMapTooltip(pin, event.clientX, event.clientY);
  });

  document.addEventListener("pointermove", (event) => {
    const pin = event.target.closest?.(".cons-map-pin");
    if (pin) showMapTooltip(pin, event.clientX, event.clientY);
  });

  document.addEventListener("pointerout", (event) => {
    const pin = event.target.closest?.(".cons-map-pin");
    if (!pin || pin.contains(event.relatedTarget)) return;
    const tooltip = pin.closest(".cons-map")?.querySelector("[data-cons-map-tooltip]");
    if (tooltip) tooltip.hidden = true;
  });

  document.addEventListener("focusin", (event) => {
    const pin = event.target.closest?.(".cons-map-pin");
    if (pin) showMapTooltip(pin);
  });

  document.addEventListener("focusout", (event) => {
    const pin = event.target.closest?.(".cons-map-pin");
    const tooltip = pin?.closest(".cons-map")?.querySelector("[data-cons-map-tooltip]");
    if (tooltip) tooltip.hidden = true;
  });

  document.addEventListener("click", (event) => {
    const pin = event.target.closest?.(".cons-map-pin");
    if (pin) {
      const tooltip = pin.closest(".cons-map")?.querySelector("[data-cons-map-tooltip]");
      if (tooltip) tooltip.hidden = true;
      openConferenceDetails(pin.dataset.mapLocation, pin);
      return;
    }
    if (event.target.closest?.("[data-conference-close]")) {
      conferenceDialog.close();
      return;
    }
    if (conferenceDialog?.open && !event.target.closest?.("#conference-dialog")) conferenceDialog.close();
  });

  document.addEventListener("change", (event) => {
    const toolsFile = event.target.closest("[data-tools-file]");
    if (toolsFile) {
      importIntuneFile(toolsFile.files?.[0], toolsFile.dataset.toolsFile);
      toolsFile.value = "";
      return;
    }

    const whitepagesFile = event.target.closest("[data-whitepages-file]");
    if (whitepagesFile) {
      importWhitepagesFile(whitepagesFile.files?.[0]);
      whitepagesFile.value = "";
      return;
    }

    const trainingAreaSelect = event.target.closest("[data-training-area-select]");
    if (trainingAreaSelect) {
      state.trainingArea = trainingAreaSelect.value;
      renderTraining();
      return;
    }

    const sopCategorySelect = event.target.closest("[data-sop-category-select]");
    if (sopCategorySelect) {
      state.sopCategory = sopCategorySelect.value;
      renderSops();
      return;
    }

    const certPhaseSelect = event.target.closest("[data-cert-phase-select]");
    if (certPhaseSelect) {
      state.certPhase = certPhaseSelect.value;
      renderCerts();
      return;
    }

    const linkCategorySelect = event.target.closest("[data-link-category-select]");
    if (linkCategorySelect) {
      state.linkCategory = linkCategorySelect.value;
      renderLinks();
      return;
    }

    const githubSectionSelect = event.target.closest("[data-github-section-select]");
    if (githubSectionSelect) {
      state.githubSection = githubSectionSelect.value;
      renderGithub();
      return;
    }

    const monthSelect = event.target.closest("[data-oncall-month]");
    if (monthSelect) {
      state.onCallMonth = monthSelect.value;
      if (state.onCallDate && !state.onCallDate.startsWith(state.onCallMonth)) {
        state.onCallDate = "";
      }
      renderSchedule();
      return;
    }

    const onCallField = event.target.closest("[data-oncall-edit]");
    if (onCallField) {
      syncOnCallDay(onCallField.dataset.oncallEdit);
      return;
    }
  });

  document.addEventListener("input", (event) => {
    const monthControl = event.target.closest?.("[data-cons-month]");
    if (monthControl) {
      updateConferenceMapMonth(monthControl);
      return;
    }

    const tableField = event.target.closest("[data-table-field]");
    if (tableField) {
      const [collection, indexValue] = tableField.dataset.tableField.split("-");
      syncTableRow(collection, Number(indexValue));
      return;
    }

    const sopNotes = event.target.closest("[data-sop-notes]");
    if (sopNotes) {
      writeStoredValue(sopNotesKey(sopNotes.dataset.sopNotes), sopNotes.value);
      return;
    }

    const onCallNotes = event.target.closest("[data-oncall-notes]");
    if (onCallNotes) {
      writeStoredValue(onCallNotesKey(onCallNotes.dataset.oncallNotes), onCallNotes.value);
      onCallNotes.style.height = "auto";
      onCallNotes.style.height = `${onCallNotes.scrollHeight}px`;
      return;
    }

    const onCallField = event.target.closest("[data-oncall-edit]");
    if (onCallField) {
      syncOnCallDay(onCallField.dataset.oncallEdit);
    }
  });

  document.addEventListener("focusout", (event) => {
    const tableField = event.target.closest("[data-table-field]");
    if (!tableField) {
      return;
    }

    const [collection, indexValue] = tableField.dataset.tableField.split("-");
    syncTableRow(collection, Number(indexValue), true);
  });

  document.addEventListener("click", (event) => {
    const certCategoryToggle = event.target.closest("[data-cert-category-toggle]");
    if (certCategoryToggle) {
      const category = certCategoryToggle.dataset.certCategoryToggle;
      if (state.expandedCertCategories.has(category)) {
        state.expandedCertCategories.delete(category);
      } else {
        state.expandedCertCategories.add(category);
      }
      renderCerts();
      return;
    }

    const linkCategoryToggle = event.target.closest("[data-link-category-toggle]");
    if (linkCategoryToggle) {
      const category = linkCategoryToggle.dataset.linkCategoryToggle;
      if (state.expandedLinkCategories.has(category)) {
        state.expandedLinkCategories.delete(category);
      } else {
        state.expandedLinkCategories.add(category);
      }
      renderLinks();
      return;
    }

    const sopCategoryToggle = event.target.closest("[data-sop-category-toggle]");
    if (sopCategoryToggle) {
      const category = sopCategoryToggle.dataset.sopCategoryToggle;
      if (state.expandedSopCategories.has(category)) {
        state.expandedSopCategories.delete(category);
      } else {
        state.expandedSopCategories.add(category);
      }
      renderSops();
      return;
    }

    const onCallClose = event.target.closest("[data-oncall-close]");
    if (onCallClose) {
      const calendarWindow = document.querySelector("[data-oncall-window]");
      const scrollTop = calendarWindow?.scrollTop ?? null;
      state.onCallDate = "";
      renderSchedule(scrollTop);
      return;
    }

    const trainingTier = event.target.closest("[data-training-tier]");
    if (trainingTier) {
      const tier = trainingTier.dataset.trainingTier;
      if (state.expandedTrainingTiers.has(tier)) {
        state.expandedTrainingTiers.delete(tier);
      } else {
        state.expandedTrainingTiers.add(tier);
      }
      renderTraining();
      return;
    }

    const trainingArea = event.target.closest("[data-training-area]");
    if (trainingArea) {
      const areaKey = trainingArea.dataset.trainingArea;
      if (state.expandedTrainingAreas.has(areaKey)) {
        state.expandedTrainingAreas.delete(areaKey);
      } else {
        state.expandedTrainingAreas.add(areaKey);
      }
      renderTraining();
      return;
    }

    const dashboardView = event.target.closest("[data-dashboard-view]");
    if (dashboardView) {
      setView(dashboardView.dataset.dashboardView);
      return;
    }

    const toolsSection = event.target.closest("[data-tools-section]");
    if (toolsSection) {
      state.toolsSection = toolsSection.dataset.toolsSection;
      renderTools();
      return;
    }

    const toolsUpload = event.target.closest("[data-tools-upload]");
    if (toolsUpload) {
      document.querySelector(`[data-tools-file="${CSS.escape(toolsUpload.dataset.toolsUpload)}"]`)?.click();
      return;
    }

    const toolsAdd = event.target.closest("[data-tools-add]");
    if (toolsAdd) {
      openIntuneAdd(toolsAdd.dataset.toolsAdd);
      return;
    }

    const toolsDelete = event.target.closest("[data-tools-delete]");
    if (toolsDelete) {
      deleteIntuneItem(toolsDelete.dataset.toolsDelete, Number(toolsDelete.dataset.toolsIndex));
      return;
    }

    const tableAdd = event.target.closest("[data-table-add]");
    if (tableAdd) {
      addTableRow(tableAdd.dataset.tableAdd);
      return;
    }

    const whitepagesImport = event.target.closest("[data-whitepages-import]");
    if (whitepagesImport) {
      document.querySelector("[data-whitepages-file]")?.click();
      return;
    }

    const whitepagesExport = event.target.closest("[data-whitepages-export]");
    if (whitepagesExport) {
      const format = document.querySelector("[data-whitepages-export-format]")?.value || "xlsx";
      exportWhitepages(format);
      return;
    }

    const tableDelete = event.target.closest("[data-table-delete]");
    if (tableDelete) {
      deleteTableRow(tableDelete.dataset.tableDelete, Number(tableDelete.dataset.tableIndex));
      return;
    }

    const onCallDay = event.target.closest("[data-oncall-date]");
    if (onCallDay) {
      if (event.target.closest("input, textarea")) {
        return;
      }
      const date = onCallDay.dataset.oncallDate;
      const calendarWindow = document.querySelector("[data-oncall-window]");
      const scrollTop = calendarWindow?.scrollTop ?? null;
      state.onCallDate = state.onCallDate === date ? "" : date;
      renderSchedule(scrollTop);
      return;
    }

    const githubSection = event.target.closest("[data-github-section]");
    if (githubSection) {
      state.githubSection = githubSection.dataset.githubSection;
      renderGithub();
      return;
    }

    const sopLink = event.target.closest(".sop-open-link");
    if (sopLink) {
      if (event.target.closest("input, textarea, [data-sop-notes]")) {
        return;
      }
      const target = document.querySelector(`#${CSS.escape(sopLink.dataset.sopOpen)}`);
      if (target) {
        event.preventDefault();
        const shouldClose = !target.hidden;
        document.querySelectorAll(".sop-body").forEach((body) => {
          body.hidden = true;
        });
        target.hidden = shouldClose;
        if (!shouldClose) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }

    const toggle = event.target.closest(".table-section-toggle");
    if (!toggle) {
      return;
    }

    const body = document.querySelector(`#${CSS.escape(toggle.getAttribute("aria-controls"))}`);
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    body.hidden = isExpanded;
  });

}
