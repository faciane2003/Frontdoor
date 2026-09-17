const DATA_FILES = {
  dashboard: "data/dashboard.json",
  knowledge: "data/knowledge.json",
  training: "data/training.json",
  sops: "data/sops.json",
  certs: "data/certs.json",
  schedule: "data/on-call.json",
  links: "data/links.json",
};

const state = {
  activeView: "dashboard",
  data: {
    dashboard: {},
    knowledge: [],
    training: [],
    sops: [],
    certs: [],
    schedule: [],
    links: [],
  },
  searchTerm: "",
  sopCategory: "",
  trainingArea: "",
  onCallDate: "",
  certPhase: "",
  linkCategory: "",
  onCallMonth: "",
};

const viewTitles = {
  dashboard: "SOC HUD",
  knowledge: "Knowledge Base",
  training: "JQS",
  sops: "SOPs",
  certs: "Certs",
  schedule: "On-Call",
  links: "Links",
};

const navToggle = document.querySelector(".nav-toggle");
const appNav = document.querySelector("#app-nav");
const navItems = [...document.querySelectorAll(".nav-item")];
const viewTitle = document.querySelector("#view-title");
const globalSearch = document.querySelector("#global-search");

const DASHBOARD_STORAGE_KEY = "dashboard-items";
const DASHBOARD_SECTIONS = [
  ["tasks", "Tasks"],
  ["projectStatus", "Project Status"],
  ["personnel", "Personnel"],
  ["alerts", "Alerts"],
  ["updates", "Webpage Updates"],
];
const TABLE_STORAGE_PREFIX = "editable-table";
const EDITABLE_TABLES = ["training", "sops", "certs", "links"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function matchRecord(record, term) {
  if (!term) {
    return true;
  }

  return JSON.stringify(record).toLowerCase().includes(term.toLowerCase());
}

function filtered(collection) {
  const data = state.data[collection];
  return Array.isArray(data) ? data.filter((item) => item._draft || matchRecord(item, state.searchTerm)) : data;
}

async function loadData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Unable to load ${url}`);
      }
      return [key, await response.json()];
    }),
  );

  for (const [key, value] of entries) {
    state.data[key] = value;
  }

  applySavedDashboard();
  applySavedTables();
}

function setView(view) {
  state.activeView = view;
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("is-active", section.id === view);
  });
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });
  viewTitle.textContent = viewTitles[view] || "Dashboard";
  window.location.hash = view;
  appNav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("complete") || normalized.includes("current")) {
    return "complete";
  }
  if (normalized.includes("progress") || normalized.includes("review")) {
    return "progress";
  }
  if (normalized.includes("critical") || normalized.includes("due")) {
    return "critical";
  }
  return "pending";
}

function renderDashboard() {
  const dashboard = state.data.dashboard;

  document.querySelector("#dashboard-grid").innerHTML = DASHBOARD_SECTIONS
    .map(([key, title]) => {
      const entries = (dashboard[key] || [])
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item._draft || matchRecord(item, state.searchTerm));
      return renderHudPanel(key, title, entries);
    })
    .join("");
}

function renderHudPanel(key, title, entries) {
  const content = entries.length
    ? entries.map(({ item, index }) => renderHudItem(key, item, index)).join("")
    : renderEmpty("No entries.");

  return `
    <section class="hud-panel" aria-label="${escapeHtml(title)}">
      <div class="hud-panel-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="hud-add" type="button" data-dashboard-add="${escapeHtml(key)}" aria-label="Add ${escapeHtml(title)} entry">+</button>
      </div>
      <div class="hud-list">${content}</div>
    </section>
  `;
}

function renderHudItem(section, item, index) {
  const fieldId = `${section}-${index}`;
  return `
    <article class="hud-item">
      <div class="hud-fields">
        <input data-dashboard-field="${escapeHtml(fieldId)}" data-dashboard-name="title" value="${escapeHtml(item.title || "")}" placeholder="Title">
        <input data-dashboard-field="${escapeHtml(fieldId)}" data-dashboard-name="detail" value="${escapeHtml(item.detail || "")}" placeholder="Details">
        <select data-dashboard-field="${escapeHtml(fieldId)}" data-dashboard-name="status" aria-label="Status">
          ${["Pending", "In Progress", "Complete", "Critical"]
            .map((status) => `<option value="${escapeHtml(status)}" ${status === item.status ? "selected" : ""}>${escapeHtml(status)}</option>`)
            .join("")}
        </select>
      </div>
      <div class="hud-actions">
        <button class="hud-save" type="button" data-dashboard-save="${escapeHtml(section)}" data-dashboard-index="${index}">Save</button>
        <button class="hud-trash" type="button" data-dashboard-delete="${escapeHtml(section)}" data-dashboard-index="${index}" aria-label="Delete entry">&#128465;</button>
      </div>
    </article>
  `;
}

function applySavedDashboard() {
  const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.data.dashboard = DASHBOARD_SECTIONS.reduce((dashboard, [key]) => {
      dashboard[key] = Array.isArray(parsed[key]) ? parsed[key] : state.data.dashboard[key] || [];
      return dashboard;
    }, {});
  } catch {
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
  }
}

function saveDashboard() {
  const cleanDashboard = DASHBOARD_SECTIONS.reduce((dashboard, [key]) => {
    dashboard[key] = (state.data.dashboard[key] || []).map(({ _draft, ...item }) => item);
    return dashboard;
  }, {});
  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(cleanDashboard));
}

function tableStorageKey(collection) {
  return `${TABLE_STORAGE_PREFIX}:${collection}`;
}

function applySavedTables() {
  EDITABLE_TABLES.forEach((collection) => {
    const saved = localStorage.getItem(tableStorageKey(collection));
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        state.data[collection] = parsed;
      }
    } catch {
      localStorage.removeItem(tableStorageKey(collection));
    }
  });
}

function saveTable(collection) {
  const cleanItems = (state.data[collection] || []).map(({ _draft, ...item }) => item);
  localStorage.setItem(tableStorageKey(collection), JSON.stringify(cleanItems));
}

function renderTableTools(collection, label) {
  return `
    <div class="table-tools">
      <button class="table-add" type="button" data-table-add="${escapeHtml(collection)}">+ ${escapeHtml(label)}</button>
    </div>
  `;
}

function renderEditableField(collection, index, name, value, label, multiline = false) {
  const fieldId = `${collection}-${index}`;
  const isLinkText = name === "url" || name === "id";
  const attrs = `class="editable-field ${multiline ? "is-multiline" : ""} ${isLinkText ? "is-link-like" : ""}" contenteditable="true" role="textbox" data-table-field="${escapeHtml(fieldId)}" data-table-name="${escapeHtml(name)}" aria-label="${escapeHtml(label)}"`;
  return `<span ${attrs}>${escapeHtml(value || "")}</span>`;
}

function renderRowActions(collection, index) {
  return `
    <span class="row-actions">
      <button class="row-save" type="button" data-table-save="${escapeHtml(collection)}" data-table-index="${index}">Save</button>
      <button class="row-trash" type="button" data-table-delete="${escapeHtml(collection)}" data-table-index="${index}" aria-label="Delete row">&#128465;</button>
    </span>
  `;
}

function addTableRow(collection) {
  const defaults = {
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
      category: state.sopCategory || "General",
      purpose: "",
      status: "Pending",
      updated: new Date().toISOString().slice(0, 10),
      sections: [],
    },
    certs: {
      name: "",
      provider: "",
      track: "",
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
  };

  state.data[collection].push({ ...defaults[collection], _draft: true });
  renderCollection(collection);
}

function saveTableRow(collection, index) {
  const item = state.data[collection]?.[index];
  if (!item) {
    return;
  }

  const fieldId = `${collection}-${index}`;
  const fields = [...document.querySelectorAll(`[data-table-field="${CSS.escape(fieldId)}"]`)];
  fields.forEach((field) => {
    item[field.dataset.tableName] = (field.value ?? field.textContent).trim();
  });
  delete item._draft;
  if (collection === "links" && !item.url) {
    state.data.links.splice(index, 1);
    saveTable(collection);
    renderCollection(collection);
    return;
  }
  saveTable(collection);
  renderCollection(collection);
}

function deleteTableRow(collection, index) {
  if (!state.data[collection]?.[index]) {
    return;
  }

  state.data[collection].splice(index, 1);
  saveTable(collection);
  renderCollection(collection);
}

function renderCollection(collection) {
  const renderers = {
    training: renderTraining,
    sops: renderSops,
    certs: renderCerts,
    links: renderLinks,
  };
  renderers[collection]?.();
}

function renderKnowledge() {
  const allItems = filtered("knowledge")
    .map((item) => ({ ...item, hierarchy: knowledgeHierarchy(item) }))
    .sort((a, b) => a.hierarchy.order - b.hierarchy.order || a.title.localeCompare(b.title));

  document.querySelector("#knowledge-list").innerHTML = allItems.length
    ? allItems.map(renderKnowledgeItem).join("")
    : renderEmpty("No knowledge articles match.");
}

function renderKnowledgeItem(item) {
  return `
    <article class="knowledge-item">
      <div>
        <h3>
          <span class="knowledge-path">${escapeHtml(item.hierarchy.path)}</span>
          <span class="knowledge-separator">-</span>
          <span>${escapeHtml(item.hierarchy.title)}</span>
        </h3>
      </div>
      <p>${escapeHtml(item.summary)}</p>
    </article>
  `;
}

function knowledgeHierarchy(item) {
  const title = item.title || "";

  if (title === "Imported JQS Workbook") {
    return {
      order: 10,
      path: "01 Overview / Workbook Import",
      title,
    };
  }

  if (title.endsWith("Qualification Scope")) {
    return {
      order: 20,
      path: "02 Qualification Scope / Tier Path",
      title,
    };
  }

  if (title.endsWith("Competency") || String(item.summary || "").includes("JQS tasks are associated with")) {
    return {
      order: 30,
      path: "03 Skill Areas / Tools and Workflows",
      title: title.replace(/\s+Competency$/, ""),
    };
  }

  return {
    order: 90,
    path: "99 Reference / Other",
    title,
  };
}

function renderTable(target, headers, rows) {
  const table = `
    <table class="data-table">
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
  document.querySelector(target).innerHTML = rows.length ? table : renderEmpty("No matching records.");
}

function renderTraining() {
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
  const rows = items
    .map((item) => ({ item, index: state.data.training.indexOf(item) }))
    .sort((a, b) => (a.item.area || "").localeCompare(b.item.area || "") || (a.item.id || "").localeCompare(b.item.id || ""))
    .map(({ item, index }) => renderTrainingRow(item, index))
    .join("");

  target.innerHTML = `
    <div class="reference-layout training-layout">
      <aside class="reference-nav" aria-label="JQS areas">
        <h3>Areas</h3>
        <nav>
          ${groups
            .map(
              ([area]) => `
                <button class="${state.trainingArea === area ? "is-active" : ""}" type="button" data-training-area="${escapeHtml(area)}">
                  ${escapeHtml(area)}
                </button>
              `,
            )
            .join("")}
        </nav>
      </aside>
      <div class="reference-content">
        ${renderTableTools("training", "Add JQS Row")}
        <div class="table-wrap">
          <table class="data-table training-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tier</th>
                <th>Task</th>
                <th>Performance Standard</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function groupTrainingByArea(items) {
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

function renderTrainingRow(item, index) {
  return `
    <tr>
      <td>${renderEditableField("training", index, "id", item.id, "JQS ID")}</td>
      <td>${renderEditableField("training", index, "tier", formatTier(item.tier), "Tier")}</td>
      <td>${renderEditableField("training", index, "title", item.title, "Task", true)}</td>
      <td>${renderEditableField("training", index, "standard", item.standard, "Performance Standard", true)}</td>
      <td>${renderRowActions("training", index)}</td>
    </tr>
  `;
}

function formatTier(tier) {
  return String(tier || "").replace(/^Tier\s+/i, "") || "N/A";
}

function renderSops() {
  const allItems = filtered("sops");
  const target = document.querySelector("#sops-list");

  if (!allItems.length) {
    target.innerHTML = renderEmpty("No SOPs match.");
    return;
  }

  const groups = Object.entries(groupByCategory(allItems));
  const categories = groups.map(([category]) => category);
  if (state.sopCategory && !categories.includes(state.sopCategory)) {
    state.sopCategory = "";
  }

  const rows = groups
    .filter(([category]) => !state.sopCategory || category === state.sopCategory)
    .map(([, sops]) => sops.map((item) => renderSopTocRow(item, state.data.sops.indexOf(item))).join(""))
    .join("");
  const visibleItems = state.sopCategory
    ? allItems.filter((item) => (item.category || item.type || "General") === state.sopCategory)
    : allItems;

  target.innerHTML = `
    <div class="reference-layout sop-layout">
      <aside class="reference-nav sop-nav" aria-label="SOP categories">
        <h3>Categories</h3>
        <nav>
          ${groups
            .map(
              ([category]) => `
                <button class="${state.sopCategory === category ? "is-active" : ""}" type="button" data-sop-category="${escapeHtml(category)}">
                  ${escapeHtml(category)}
                </button>
              `,
            )
            .join("")}
        </nav>
      </aside>
      <div class="reference-content sop-content">
        ${renderTableTools("sops", "Add SOP Row")}
        <div class="table-wrap">
          <table class="data-table sop-toc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Purpose</th>
                <th>Actions</th>
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

function groupByCategory(items) {
  return items
    .slice()
    .sort((a, b) => {
      const categorySort = (a.category || a.type || "General").localeCompare(b.category || b.type || "General");
      return categorySort || (a.id || a.name || "").localeCompare(b.id || b.name || "");
    })
    .reduce((groups, item) => {
      const category = item.category || item.type || "General";
      groups[category] ||= [];
      groups[category].push(item);
      return groups;
    }, {});
}

function renderSopTocRow(item, index) {
  const id = sopId(item);
  return `
    <tr>
      <td>
        ${renderEditableField("sops", index, "id", item.id || item.name || "", "SOP ID")}
      </td>
      <td>
        ${renderEditableField("sops", index, "title", item.title || item.type || item.name || "", "SOP Title", true)}
        <a class="table-link sop-open-link row-open-link" href="#${id}" data-sop-open="${id}">Open</a>
      </td>
      <td>${renderEditableField("sops", index, "category", item.category || item.type || "", "Category")}</td>
      <td>${renderEditableField("sops", index, "purpose", item.purpose || "", "Purpose", true)}</td>
      <td>${renderRowActions("sops", index)}</td>
    </tr>
  `;
}

function sopId(item) {
  return `sop-${String(item.id || item.name || item.title || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function renderSopBody(item) {
  const id = sopId(item);
  const savedNotes = localStorage.getItem(sopNotesKey(id));
  const notes = savedNotes ?? defaultSopNotes(item);

  return `
    <article id="${id}" class="sop-body" hidden>
      <header class="sop-body-header">
        <div>
          <h3>${escapeHtml(item.id || item.name || "")} - ${escapeHtml(item.category || item.type || "General")} - ${escapeHtml(item.title || item.type || item.name || "Untitled SOP")}</h3>
        </div>
        <span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status || "")}</span>
      </header>
      <dl class="sop-meta">
        <div>
          <dt>Updated</dt>
          <dd>${escapeHtml(item.updated || "Not set")}</dd>
        </div>
      </dl>
      <section class="sop-notes">
        <label for="${id}-notes">Notes</label>
        <textarea id="${id}-notes" data-sop-notes="${id}" rows="5">${escapeHtml(notes)}</textarea>
        <div class="sop-notes-actions">
          <button type="button" data-sop-save="${id}">Save</button>
          <span data-sop-save-status="${id}" aria-live="polite"></span>
        </div>
      </section>
    </article>
  `;
}

function sopNotesKey(id) {
  return `sop-notes:${id}`;
}

function defaultSopNotes(item) {
  return (item.sections || [])
    .slice(0, 5)
    .map((section, index) => `${index + 1}. ${section.body}`)
    .join("\n");
}

function renderCerts() {
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
  const items = state.certPhase
    ? allItems.filter((item) => (item.phase || "Other") === state.certPhase)
    : allItems;
  const rows = items
    .map((item) => ({ item, index: state.data.certs.indexOf(item) }))
    .sort((a, b) => (a.item.phase || "").localeCompare(b.item.phase || "") || (a.item.track || "").localeCompare(b.item.track || "") || (a.item.name || "").localeCompare(b.item.name || ""))
    .map(({ item, index }) => renderCertRow(item, index))
    .join("");

  target.innerHTML = `
    <div class="reference-layout cert-layout">
      <aside class="reference-nav" aria-label="Certification categories">
        <h3>Categories</h3>
        <nav>
          ${groups
            .map(
              ([phase]) => `
                <button class="${state.certPhase === phase ? "is-active" : ""}" type="button" data-cert-phase="${escapeHtml(phase)}">
                  ${escapeHtml(phase)}
                </button>
              `,
            )
            .join("")}
        </nav>
      </aside>
      <div class="reference-content">
        ${renderTableTools("certs", "Add Cert Row")}
        <div class="table-wrap">
          <table class="data-table cert-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Certification</th>
                <th>Focus</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderCertRow(item, index) {
  return `
    <tr>
      <td>${renderEditableField("certs", index, "track", item.track || "", "Track")}</td>
      <td>
        ${renderEditableField("certs", index, "name", item.name || "", "Certification")}
        ${renderEditableField("certs", index, "provider", item.provider || "", "Provider")}
        <a class="table-link row-open-link" href="${escapeHtml(item.url || "#")}">Official Page</a>
      </td>
      <td>${renderEditableField("certs", index, "focus", item.focus || "", "Focus", true)}</td>
      <td>${renderEditableField("certs", index, "notes", item.notes || "", "Notes", true)}</td>
      <td>${renderRowActions("certs", index)}</td>
    </tr>
  `;
}

function renderSchedule() {
  const items = filtered("schedule");
  const target = document.querySelector("#schedule-list");

  if (!items.length) {
    target.innerHTML = renderEmpty("No on-call entries match.");
    return;
  }

  const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date));
  const months = onCallMonths(sorted);
  if (!state.onCallMonth || !months.some((month) => month.value === state.onCallMonth)) {
    state.onCallMonth = months[0].value;
  }
  const visibleItems = sorted.filter((item) => item.date.startsWith(state.onCallMonth));

  target.innerHTML = `
    <section class="oncall-calendar" aria-label="On-call calendar">
      <header class="oncall-calendar-header">
        <label>
          <span>Month</span>
          <select id="oncall-month" data-oncall-month>
            ${months
              .map(
                (month) => `
                  <option value="${escapeHtml(month.value)}" ${month.value === state.onCallMonth ? "selected" : ""}>
                    ${escapeHtml(month.label)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
      </header>
      <div class="oncall-weekdays" aria-hidden="true">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="oncall-calendar-grid">
        ${renderOnCallCalendarDays(visibleItems)}
      </div>
    </section>
  `;
}

function onCallMonths(items) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  return [...new Set(items.map((item) => item.date.slice(0, 7)))].map((value) => ({
    value,
    label: formatter.format(new Date(`${value}-01T12:00:00`)),
  }));
}

function renderOnCallCalendarDays(items) {
  const firstDate = new Date(`${items[0].date}T12:00:00`);
  const offset = firstDate.getDay();
  const blanks = Array.from({ length: offset }, () => `<div class="oncall-day is-empty" aria-hidden="true"></div>`);
  const days = items.map((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    const isActive = state.onCallDate === item.date;
    const current = onCallDisplayItem(item);
    const notes = localStorage.getItem(onCallNotesKey(item.date)) || "";
    const hasNotes = notes.trim().length > 0;
    return `
      <article class="oncall-day ${isActive ? "is-active" : ""}" tabindex="0" role="button" data-oncall-date="${escapeHtml(item.date)}">
        <span class="oncall-date">${date.getDate()}</span>
        ${
          isActive
            ? `
              <label>Primary<input data-oncall-field="primary" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml(current.primary)}"></label>
              <label>Backup<input data-oncall-field="backup" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml(current.backup)}"></label>
              <label>OOO<input data-oncall-field="pto" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml((current.pto || []).join(", "))}"></label>
              <label>Notes<textarea data-oncall-notes="${escapeHtml(item.date)}" rows="3">${escapeHtml(notes)}</textarea></label>
              <span class="oncall-inline-actions">
                <span data-oncall-save-status="${escapeHtml(item.date)}" aria-live="polite"></span>
                <button type="button" data-oncall-save="${escapeHtml(item.date)}">Save</button>
              </span>
            `
            : `
              <p><b>Primary</b> ${escapeHtml(current.primary)}</p>
              <p><b>Backup</b> ${escapeHtml(current.backup)}</p>
              <p><b>OOO</b> ${escapeHtml((current.pto || []).join(", ") || "None")}</p>
              ${hasNotes ? `<p class="oncall-note-preview"><b>Notes</b> ${escapeHtml(notes)}</p>` : ""}
            `
        }
      </article>
    `;
  });

  return [...blanks, ...days].join("");
}

function onCallNotesKey(date) {
  return `on-call-notes:${date}`;
}

function onCallEditKey(date) {
  return `on-call-edit:${date}`;
}

function onCallDisplayItem(item) {
  const saved = localStorage.getItem(onCallEditKey(item.date));
  if (!saved) {
    return item;
  }

  try {
    return { ...item, ...JSON.parse(saved) };
  } catch {
    return item;
  }
}

function renderLinks() {
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
  const items = state.linkCategory
    ? allItems.filter((item) => (item.category || "Reference") === state.linkCategory)
    : allItems;
  const rows = items
    .map((item) => ({ item, index: state.data.links.indexOf(item) }))
    .sort((a, b) => (a.item.category || "").localeCompare(b.item.category || "") || (a.item.name || "").localeCompare(b.item.name || ""))
    .map(
      ({ item, index }) => `
        <tr>
          <td>
            ${renderEditableField("links", index, "name", item.name || "", "Resource")}
          </td>
          <td>${renderEditableField("links", index, "description", item.description || "", "Description", true)}</td>
          <td>${renderEditableField("links", index, "url", item.url || "", "URL", true)}</td>
          <td>${renderRowActions("links", index)}</td>
        </tr>
      `,
    )
    .join("");

  target.innerHTML = `
    <div class="reference-layout links-layout">
      <aside class="reference-nav" aria-label="Link categories">
        <h3>Categories</h3>
        <nav>
          ${groups
            .map(
              ([category]) => `
                <button class="${state.linkCategory === category ? "is-active" : ""}" type="button" data-link-category="${escapeHtml(category)}">
                  ${escapeHtml(category)}
                </button>
              `,
            )
            .join("")}
        </nav>
      </aside>
      <div class="reference-content">
        ${renderTableTools("links", "Add Link Row")}
        <div class="table-wrap">
          <table class="data-table resource-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Description</th>
                <th>URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function groupByResourceCategory(items) {
  return items
    .slice()
    .sort((a, b) => (a.category || "Reference").localeCompare(b.category || "Reference"))
    .reduce((groups, item) => {
      const category = item.category || "Reference";
      groups[category] ||= [];
      groups[category].push(item);
      return groups;
    }, {});
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderAll() {
  renderDashboard();
  renderKnowledge();
  renderTraining();
  renderSops();
  renderCerts();
  renderSchedule();
  renderLinks();
}

function bindEvents() {
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

  globalSearch.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim();
    renderAll();
  });

  document.addEventListener("change", (event) => {
    const monthSelect = event.target.closest("[data-oncall-month]");
    if (!monthSelect) {
      return;
    }

    state.onCallMonth = monthSelect.value;
    if (state.onCallDate && !state.onCallDate.startsWith(state.onCallMonth)) {
      state.onCallDate = "";
    }
    renderSchedule();
  });

  document.addEventListener("click", (event) => {
    const tableAdd = event.target.closest("[data-table-add]");
    if (tableAdd) {
      addTableRow(tableAdd.dataset.tableAdd);
      return;
    }

    const tableSave = event.target.closest("[data-table-save]");
    if (tableSave) {
      saveTableRow(tableSave.dataset.tableSave, Number(tableSave.dataset.tableIndex));
      return;
    }

    const tableDelete = event.target.closest("[data-table-delete]");
    if (tableDelete) {
      deleteTableRow(tableDelete.dataset.tableDelete, Number(tableDelete.dataset.tableIndex));
      return;
    }

    const dashboardAdd = event.target.closest("[data-dashboard-add]");
    if (dashboardAdd) {
      const section = dashboardAdd.dataset.dashboardAdd;
      state.data.dashboard[section] ||= [];
      state.data.dashboard[section].push({ title: "", detail: "", status: "Pending", _draft: true });
      renderDashboard();
      return;
    }

    const dashboardSave = event.target.closest("[data-dashboard-save]");
    if (dashboardSave) {
      const section = dashboardSave.dataset.dashboardSave;
      const index = Number(dashboardSave.dataset.dashboardIndex);
      const fieldId = `${section}-${index}`;
      const fields = [...document.querySelectorAll(`[data-dashboard-field="${CSS.escape(fieldId)}"]`)];
      if (state.data.dashboard[section]?.[index]) {
        fields.forEach((field) => {
          state.data.dashboard[section][index][field.dataset.dashboardName] = field.value.trim();
        });
        delete state.data.dashboard[section][index]._draft;
        saveDashboard();
        renderDashboard();
      }
      return;
    }

    const dashboardDelete = event.target.closest("[data-dashboard-delete]");
    if (dashboardDelete) {
      const section = dashboardDelete.dataset.dashboardDelete;
      const index = Number(dashboardDelete.dataset.dashboardIndex);
      if (state.data.dashboard[section]?.[index]) {
        state.data.dashboard[section].splice(index, 1);
        saveDashboard();
        renderDashboard();
      }
      return;
    }

    const onCallSave = event.target.closest("[data-oncall-save]");
    if (onCallSave) {
      const date = onCallSave.dataset.oncallSave;
      const fields = [...document.querySelectorAll(`[data-oncall-edit="${CSS.escape(date)}"]`)];
      const notes = document.querySelector(`[data-oncall-notes="${CSS.escape(date)}"]`);
      const status = document.querySelector(`[data-oncall-save-status="${CSS.escape(date)}"]`);
      const values = fields.reduce((record, field) => {
        record[field.dataset.oncallField] = field.value.trim();
        return record;
      }, {});
      values.pto = values.pto ? values.pto.split(",").map((name) => name.trim()).filter(Boolean) : [];
      localStorage.setItem(onCallEditKey(date), JSON.stringify(values));
      if (notes) {
        localStorage.setItem(onCallNotesKey(date), notes.value);
      }
      if (status) {
        status.textContent = "Saved";
      }
      return;
    }

    const onCallDay = event.target.closest("[data-oncall-date]");
    if (onCallDay) {
      if (event.target.closest("input, textarea")) {
        return;
      }
      const date = onCallDay.dataset.oncallDate;
      state.onCallDate = state.onCallDate === date ? "" : date;
      renderSchedule();
      return;
    }

    const certPhase = event.target.closest("[data-cert-phase]");
    if (certPhase) {
      const phase = certPhase.dataset.certPhase;
      state.certPhase = state.certPhase === phase ? "" : phase;
      renderCerts();
      return;
    }

    const linkCategory = event.target.closest("[data-link-category]");
    if (linkCategory) {
      const category = linkCategory.dataset.linkCategory;
      state.linkCategory = state.linkCategory === category ? "" : category;
      renderLinks();
      return;
    }

    const sopCategory = event.target.closest("[data-sop-category]");
    if (sopCategory) {
      const category = sopCategory.dataset.sopCategory;
      state.sopCategory = state.sopCategory === category ? "" : category;
      renderSops();
      return;
    }

    const trainingArea = event.target.closest("[data-training-area]");
    if (trainingArea) {
      const area = trainingArea.dataset.trainingArea;
      state.trainingArea = state.trainingArea === area ? "" : area;
      renderTraining();
      return;
    }

    const sopSave = event.target.closest("[data-sop-save]");
    if (sopSave) {
      const id = sopSave.dataset.sopSave;
      const notes = document.querySelector(`[data-sop-notes="${CSS.escape(id)}"]`);
      const status = document.querySelector(`[data-sop-save-status="${CSS.escape(id)}"]`);
      if (notes) {
        localStorage.setItem(sopNotesKey(id), notes.value);
      }
      if (status) {
        status.textContent = "Saved";
      }
      return;
    }

    const sopLink = event.target.closest(".sop-open-link");
    if (sopLink) {
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

async function init() {
  bindEvents();

  try {
    await loadData();
    renderAll();
  } catch (error) {
    document.querySelector("#dashboard").insertAdjacentHTML(
      "afterbegin",
      renderEmpty(`Data load failed: ${error.message}`),
    );
  }

  const hashView = window.location.hash.replace("#", "");
  if (viewTitles[hashView]) {
    setView(hashView);
  }
}

init();
