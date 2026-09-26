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
  githubSection: "Overview",
};

const viewTitles = {
  dashboard: "SOC HUD",
  knowledge: "Knowledge Base",
  training: "JQS",
  sops: "SOPs",
  certs: "Certs",
  schedule: "On-Call",
  links: "Links",
  github: "GitHub",
};

const navToggle = document.querySelector(".nav-toggle");
const appNav = document.querySelector("#app-nav");
const navItems = [...document.querySelectorAll(".nav-item")];
const viewTitle = document.querySelector("#view-title");
const globalSearch = document.querySelector("#global-search");
const tableRowDialog = document.querySelector("#table-row-dialog");
const tableRowForm = document.querySelector("#table-row-form");
const tableRowFields = document.querySelector("#table-row-fields");

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
const TABLE_FORM_SCHEMAS = {
  training: [["id", "ID", "text", true], ["tier", "Tier", "text", true], ["title", "Task", "text", true], ["area", "Area", "text", true], ["standard", "Performance Standard", "textarea", true]],
  sops: [["id", "ID", "text", true], ["title", "Title", "text", true], ["category", "Category", "text", true], ["purpose", "Purpose", "textarea", true]],
  certs: [["track", "Track", "text", true], ["name", "Certification", "text", true], ["provider", "Provider", "text", false], ["phase", "Category", "text", true], ["focus", "Focus", "textarea", true], ["notes", "Notes", "textarea", false], ["url", "Official URL", "url", true]],
  links: [["name", "Resource", "text", true], ["category", "Category", "text", true], ["description", "Description", "textarea", true], ["url", "URL", "url", true]],
};
const ON_CALL_PEOPLE = ["Maya Chen", "Andre Patel", "Nina Brooks", "Luis Romero", "Jordan Ellis"];
const ON_CALL_PTO_ROTATION = [["Sam Rivera"], ["Taylor Morgan", "Chris Lee"], [], ["Avery Scott"], ["Morgan Blake"], [], ["Riley Park"]];
const ON_CALL_ROTATION_ANCHOR = "2026-09-17";
const ON_CALL_OFFICE_NOTES = [
  "Morning handoff is scheduled for 8:30 AM. Review overnight tickets and update the shared tracker before the daily stand-up.",
  "Team stand-up begins at 9:00 AM. Confirm open action items, assign follow-ups, and document any staffing concerns.",
  "Complete the weekly access review and send outstanding approval reminders. File completed records in the team folder.",
  "Reserved time for documentation cleanup. Review outdated procedures, correct broken links, and note items requiring owner approval.",
  "Coordinate the afternoon operations handoff. Summarize unresolved issues, current priorities, and expected follow-up times.",
  "Scheduled maintenance window begins this evening. Verify the contact roster and confirm that escalation details are current.",
  "Review the team inbox at the start and end of the shift. Route new requests and flag anything that needs manager attention.",
  "Monthly reporting work is in progress. Validate tracker entries and collect missing updates before the reporting deadline.",
  "Training block is reserved for the afternoon. Finish assigned modules and add completion notes to the qualification tracker.",
  "Check the office calendar for visitor appointments and planned absences. Share coverage changes during the morning meeting.",
  "Inventory review is due today. Record equipment changes and submit replacement requests for missing or damaged items.",
  "End-of-day reminder: close completed tasks, update pending work, and leave a clear handoff note for the next shift.",
];
const GITHUB_SECTION_ITEMS = {
  Overview: [],
  Repo: [
    "Corelight",
    "threatco",
    "ATH",
    "turbine-monorepo",
    "CSIRT",
    "SADAM",
    "Training",
    "AcctMgmt",
    "IO",
    "WraithWatch",
    "thelp",
    "sysmon",
    "SADOM-cert-ops",
    "SADOM-IAM",
    "SADOM-ECS",
    "sadom-example-service",
    "querybot",
    "SADOM-Node-Images",
    "BOD-26-04",
    "SOC_Copilot_Initiative_Repo",
    "sadom-testing-image",
    "birminghamtest",
    "orca",
    "Support",
    "gitcrawler",
    "t_swimlane_support_document_manager",
    "t_phx_email_parser",
    "t_phxcyber_cribl_put",
    "t_swimlane_turbine23",
    "t_teramind",
  ],
  Projects: [],
  Teams: [],
  People: [],
  Security: [],
};
const GITHUB_REPO_DESCRIPTIONS = {
  AcctMgmt: "Account-management service for access requests, approvals, and account lifecycle tasks.",
  ATH: "Automation repository for shared technical utilities and operational helper scripts.",
  "BOD-26-04": "Compliance project for tracking BOD 26-04 requirements, evidence, and remediation work.",
  birminghamtest: "Sandbox repository used to validate workflows and deployment changes in a test environment.",
  Corelight: "Integration repository for Corelight network telemetry, sensors, and detection content.",
  CSIRT: "Incident-response repository containing CSIRT procedures, playbooks, and case resources.",
  gitcrawler: "Utility that inventories Git repositories and collects approved project metadata.",
  IO: "Repository for input-output services, data exchanges, and supporting integration components.",
  orca: "Cloud-security integration for findings, asset context, and remediation tracking.",
  querybot: "Chat-based assistant that runs approved queries and returns formatted operational results.",
  SADAM: "Central repository for SADAM application code, documentation, and deployment resources.",
  "SADOM-cert-ops": "Certificate-operations service for issuance, renewal, inventory, and expiration tracking.",
  "SADOM-ECS": "Repository for SADOM container services and ECS deployment configuration.",
  "sadom-example-service": "Reference service demonstrating standard SADOM application and deployment patterns.",
  "SADOM-IAM": "Identity and access management repository for roles, policies, and authorization workflows.",
  "SADOM-Node-Images": "Repository for maintaining approved Node.js build and runtime container images.",
  "sadom-testing-image": "Container image used for SADOM integration and pipeline testing.",
  "SOC_Copilot_Initiative_Repo": "SOC Copilot initiative workspace for prototypes, requirements, and evaluation notes.",
  Support: "Support repository for troubleshooting guides, common requests, and escalation procedures.",
  sysmon: "Repository for Sysmon configuration, event collection, and detection-focused tuning.",
  "t_phx_email_parser": "Automation for parsing PHX mailbox messages into structured workflow data.",
  "t_phxcyber_cribl_put": "Integration that sends PHX Cyber data through an approved Cribl ingestion path.",
  "t_swimlane_support_document_manager": "Workflow for organizing and maintaining support documents in Swimlane.",
  "t_swimlane_turbine23": "Swimlane automation package supporting Turbine 23 operational workflows.",
  "t_teramind": "Integration for processing approved Teramind events and investigation context.",
  thelp: "Command-line helper containing common troubleshooting and support functions.",
  threatco: "Threat-intelligence repository for indicators, enrichment logic, and analysis workflows.",
  Training: "Training repository containing exercises, reference material, and qualification resources.",
  "turbine-monorepo": "Monorepo for Turbine applications, shared packages, and deployment tooling.",
  WraithWatch: "Monitoring project for detecting suspicious activity and coordinating follow-up reviews.",
};

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
  const fieldId = `${section}:${index}`;
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
        state.data[collection] = mergeSavedRows(collection, state.data[collection], parsed);
      }
    } catch {
      localStorage.removeItem(tableStorageKey(collection));
    }
  });
}

function mergeSavedRows(collection, sourceRows, savedRows) {
  const sourceByKey = new Map(sourceRows.map((row) => [rowKey(collection, row), row]).filter(([key]) => key));
  return savedRows.map((savedRow) => {
    const sourceRow = sourceByKey.get(rowKey(collection, savedRow));
    if (!sourceRow) {
      return savedRow;
    }

    return Object.entries(savedRow).reduce(
      (merged, [key, value]) => {
        if (typeof value === "string" && !value.trim() && typeof sourceRow[key] === "string") {
          return merged;
        }
        merged[key] = value;
        return merged;
      },
      { ...sourceRow },
    );
  });
}

function rowKey(collection, row) {
  const keys = {
    training: "id",
    sops: "id",
    certs: "url",
    links: "url",
  };
  return String(row?.[keys[collection]] || "").trim().toLowerCase();
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
      <button class="row-trash" type="button" data-table-delete="${escapeHtml(collection)}" data-table-index="${index}" aria-label="Delete row">&#128465;</button>
    </span>
  `;
}

function fieldText(field) {
  return field.isContentEditable ? field.textContent.trim() : field.value.trim();
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

  const schema = TABLE_FORM_SCHEMAS[collection];
  if (!schema) {
    return;
  }

  tableRowForm.dataset.collection = collection;
  document.querySelector("#entry-dialog-title").textContent = `Add ${viewTitles[collection] || "Row"}`;
  tableRowFields.innerHTML = schema
    .map(([name, label, type, required]) => {
      const value = defaults[collection][name] || "";
      const control = type === "textarea"
        ? `<textarea id="entry-${escapeHtml(name)}" name="${escapeHtml(name)}" rows="3" ${required ? "required" : ""}>${escapeHtml(value)}</textarea>`
        : `<input id="entry-${escapeHtml(name)}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${required ? "required" : ""}>`;
      return `<label for="entry-${escapeHtml(name)}"><span>${escapeHtml(label)}</span>${control}</label>`;
    })
    .join("");
  tableRowDialog.showModal();
  tableRowFields.querySelector("input, textarea")?.focus();
}

function syncTableRow(collection, index, shouldRender = false) {
  const item = state.data[collection]?.[index];
  if (!item) {
    return;
  }

  const fieldId = `${collection}-${index}`;
  const fields = [...document.querySelectorAll(`[data-table-field="${CSS.escape(fieldId)}"]`)];
  fields.forEach((field) => {
    item[field.dataset.tableName] = fieldText(field);
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
  saveTable(collection);
  if (shouldRender) {
    renderCollection(collection);
  }
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

function syncDashboardItem(field) {
  const [section, indexValue] = field.dataset.dashboardField.split(":");
  const item = state.data.dashboard[section]?.[index];
  if (!item) {
    return;
  }

  item[field.dataset.dashboardName] = field.value.trim();
  delete item._draft;
  saveDashboard();
}

function syncOnCallDay(date) {
  const fields = [...document.querySelectorAll(`[data-oncall-edit="${CSS.escape(date)}"]`)];
  const notes = document.querySelector(`[data-oncall-notes="${CSS.escape(date)}"]`);
  const values = fields.reduce((record, field) => {
    record[field.dataset.oncallField] = field.value.trim();
    return record;
  }, {});
  values.pto = values.pto ? values.pto.split(",").map((name) => name.trim()).filter(Boolean) : [];
  localStorage.setItem(onCallEditKey(date), JSON.stringify(values));
  if (notes) {
    localStorage.setItem(onCallNotesKey(date), notes.value);
  }
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
    .sort((a, b) => (b.item._addedAt || 0) - (a.item._addedAt || 0) || (a.item.area || "").localeCompare(b.item.area || "") || (a.item.id || "").localeCompare(b.item.id || ""))
    .map(({ item, index }) => renderTrainingRow(item, index))
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
        ${renderTableTools("training", "Add JQS Row")}
      </div>
      <div>
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
        ${renderTableTools("sops", "Add SOP Row")}
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
      const addedSort = (b._addedAt || 0) - (a._addedAt || 0);
      if (addedSort) {
        return addedSort;
      }
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
        <button class="table-link sop-open-link editable-field is-multiline" type="button" contenteditable="true" data-sop-open="${id}" data-table-field="sops-${index}" data-table-name="title" aria-label="SOP Title">${escapeHtml(item.title || item.type || item.name || "")}</button>
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
    .sort((a, b) => (b.item._addedAt || 0) - (a.item._addedAt || 0) || (a.item.phase || "").localeCompare(b.item.phase || "") || (a.item.track || "").localeCompare(b.item.track || "") || (a.item.name || "").localeCompare(b.item.name || ""))
    .map(({ item, index }) => renderCertRow(item, index))
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
        ${renderTableTools("certs", "Add Cert Row")}
      </div>
      <div>
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
        <a class="table-link" href="${escapeHtml(item.url || "#")}">${escapeHtml(item.name || "Untitled Certification")}</a>
        ${renderEditableField("certs", index, "provider", item.provider || "", "Provider")}
      </td>
      <td>${renderEditableField("certs", index, "focus", item.focus || "", "Focus", true)}</td>
      <td>${renderEditableField("certs", index, "notes", item.notes || "", "Notes", true)}</td>
      <td>${renderRowActions("certs", index)}</td>
    </tr>
  `;
}

function renderSchedule(preservedScrollTop = null) {
  const target = document.querySelector("#schedule-list");
  const availableMonths = onCallMonths(state.data.schedule);

  if (!availableMonths.length) {
    target.innerHTML = renderEmpty("No on-call entries match.");
    return;
  }

  if (!state.onCallMonth) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    state.onCallMonth = availableMonths.some((month) => month.value === currentMonth) ? currentMonth : availableMonths[0].value;
  }

  const windowMonths = [shiftOnCallMonth(state.onCallMonth, -1), state.onCallMonth, shiftOnCallMonth(state.onCallMonth, 1)];
  windowMonths.forEach(ensureOnCallMonth);

  const items = filtered("schedule");
  const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date));
  const dropdownMonths = onCallMonths(state.data.schedule);
  const monthLabels = new Map(dropdownMonths.map((month) => [month.value, month.label]));

  target.innerHTML = `
    <div class="oncall-month-picker">
      <select id="oncall-month" data-oncall-month aria-label="Select month">
        ${dropdownMonths
          .map((month) => `<option value="${escapeHtml(month.value)}" ${month.value === state.onCallMonth ? "selected" : ""}>${escapeHtml(month.label)}</option>`)
          .join("")}
      </select>
    </div>
    <section class="oncall-calendar-window" aria-label="Scrollable on-call calendar" data-oncall-window>
      ${windowMonths
        .map((monthValue) => {
          const monthItems = sorted.filter((item) => item.date.startsWith(monthValue));
          return renderOnCallMonth(monthValue, monthLabels.get(monthValue), monthItems);
        })
        .join("")}
    </section>
  `;

  target.querySelectorAll("[data-oncall-notes]").forEach((field) => {
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  });

  const calendarWindow = target.querySelector("[data-oncall-window]");
  const selectedCalendar = target.querySelector(`[data-oncall-calendar-month="${CSS.escape(state.onCallMonth)}"]`);
  calendarWindow.dataset.shifting = "true";
  requestAnimationFrame(() => {
    calendarWindow.scrollTop = preservedScrollTop ?? selectedCalendar.offsetTop - calendarWindow.offsetTop;
    requestAnimationFrame(() => {
      calendarWindow.dataset.shifting = "false";
    });
  });
  calendarWindow.addEventListener("scroll", () => {
    if (calendarWindow.dataset.shifting === "true") {
      return;
    }
    const calendars = [...calendarWindow.querySelectorAll("[data-oncall-calendar-month]")];
    const position = calendarWindow.scrollTop + 80;
    const visibleCalendar = calendars.find((calendar) => calendar.offsetTop - calendarWindow.offsetTop + calendar.offsetHeight > position);
    if (visibleCalendar) {
      state.onCallMonth = visibleCalendar.dataset.oncallCalendarMonth;
      const monthSelect = target.querySelector("[data-oncall-month]");
      if ([...monthSelect.options].some((option) => option.value === state.onCallMonth)) {
        monthSelect.value = state.onCallMonth;
      }
    }

    if (calendarWindow.scrollTop < 120) {
      extendOnCallWindow(calendarWindow, -1);
    } else if (calendarWindow.scrollTop + calendarWindow.clientHeight > calendarWindow.scrollHeight - 120) {
      extendOnCallWindow(calendarWindow, 1);
    }
  });
}

function renderOnCallMonth(monthValue, label, items) {
  return `
    <section class="oncall-calendar" data-oncall-calendar-month="${escapeHtml(monthValue)}" aria-labelledby="oncall-month-${escapeHtml(monthValue)}">
      <header class="oncall-calendar-header">
        <h3 id="oncall-month-${escapeHtml(monthValue)}">${escapeHtml(label)}</h3>
      </header>
      <div class="oncall-weekdays" aria-hidden="true">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="oncall-calendar-grid">
        ${renderOnCallCalendarDays(items, monthValue)}
      </div>
    </section>
  `;
}

function extendOnCallWindow(calendarWindow, direction) {
  if (calendarWindow.dataset.loading === "true") {
    return;
  }
  calendarWindow.dataset.loading = "true";

  const calendars = [...calendarWindow.querySelectorAll("[data-oncall-calendar-month]")];
  const edgeCalendar = direction < 0 ? calendars[0] : calendars[calendars.length - 1];
  const monthValue = shiftOnCallMonth(edgeCalendar.dataset.oncallCalendarMonth, direction);
  ensureOnCallMonth(monthValue);
  const monthItems = filtered("schedule")
    .filter((item) => item.date.startsWith(monthValue))
    .sort((a, b) => a.date.localeCompare(b.date));
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${monthValue}-01T12:00:00`));
  const previousHeight = calendarWindow.scrollHeight;

  edgeCalendar.insertAdjacentHTML(direction < 0 ? "beforebegin" : "afterend", renderOnCallMonth(monthValue, label, monthItems));
  if (direction < 0) {
    calendarWindow.scrollTop += calendarWindow.scrollHeight - previousHeight;
  }

  const monthSelect = document.querySelector("[data-oncall-month]");
  if (![...monthSelect.options].some((option) => option.value === monthValue)) {
    const option = new Option(label, monthValue);
    if (direction < 0) {
      monthSelect.prepend(option);
    } else {
      monthSelect.append(option);
    }
  }

  requestAnimationFrame(() => {
    calendarWindow.dataset.loading = "false";
  });
}

function shiftOnCallMonth(monthValue, amount) {
  const [year, month] = monthValue.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return shifted.toISOString().slice(0, 7);
}

function ensureOnCallMonth(monthValue) {
  const existingDates = new Set(state.data.schedule.map((item) => item.date));
  const [year, month] = monthValue.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const anchorDate = new Date(`${ON_CALL_ROTATION_ANCHOR}T12:00:00Z`);

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const day = new Date(Date.UTC(year, month - 1, dayNumber, 12));
    const dateValue = day.toISOString().slice(0, 10);
    if (existingDates.has(dateValue)) {
      continue;
    }
    const rotationOffset = Math.round((day - anchorDate) / 86400000);
    const personIndex = ((rotationOffset % ON_CALL_PEOPLE.length) + ON_CALL_PEOPLE.length) % ON_CALL_PEOPLE.length;
    const ptoIndex = ((rotationOffset % ON_CALL_PTO_ROTATION.length) + ON_CALL_PTO_ROTATION.length) % ON_CALL_PTO_ROTATION.length;
    state.data.schedule.push({
      date: dateValue,
      primary: ON_CALL_PEOPLE[personIndex],
      backup: ON_CALL_PEOPLE[(personIndex + 1) % ON_CALL_PEOPLE.length],
      pto: ON_CALL_PTO_ROTATION[ptoIndex],
    });
  }
}

function onCallMonths(items) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  return [...new Set(items.map((item) => item.date.slice(0, 7)))].map((value) => ({
    value,
    label: formatter.format(new Date(`${value}-01T12:00:00`)),
  }));
}

function renderOnCallCalendarDays(items, monthValue) {
  const firstDate = new Date(`${monthValue}-01T12:00:00`);
  const offset = firstDate.getDay();
  const blanks = Array.from({ length: offset }, () => `<div class="oncall-day is-empty" aria-hidden="true"></div>`);
  const days = items.map((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    const isActive = state.onCallDate === item.date;
    const fullDateLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
    const current = onCallDisplayItem(item);
    const savedNotes = localStorage.getItem(onCallNotesKey(item.date));
    const notes = savedNotes ?? defaultOnCallNotes(item);
    const preview = onCallNotePreview(notes);
    return `
      <article class="oncall-day ${isActive ? "is-active" : ""}" tabindex="0" role="button" data-oncall-date="${escapeHtml(item.date)}">
        <span class="oncall-date">${date.getDate()}</span>
        ${isActive ? `<span class="oncall-date-label">${escapeHtml(fullDateLabel)}</span>` : ""}
        ${
          isActive
            ? `
              <label>IRM<input data-oncall-field="primary" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml(current.primary)}"></label>
              <label>BIRM<input data-oncall-field="backup" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml(current.backup)}"></label>
              <label>Out of Office<input data-oncall-field="pto" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml((current.pto || []).join(", "))}"></label>
              <label>Notes<textarea data-oncall-notes="${escapeHtml(item.date)}" rows="6">${escapeHtml(notes)}</textarea></label>
            `
            : `
              <p class="oncall-role"><b>IRM:</b> ${escapeHtml(current.primary)}</p>
              <p class="oncall-role"><b>BIRM:</b> ${escapeHtml(current.backup)}</p>
              <button class="oncall-note-trigger" type="button" data-oncall-open>
                ${escapeHtml(preview)}${preview ? "…" : "No notes…"}
              </button>
            `
        }
      </article>
    `;
  });

  return [...blanks, ...days].join("");
}

function onCallNotePreview(notes) {
  const normalized = notes.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || normalized;
  return firstSentence.replace(/\.{3}$/, "").slice(0, 110);
}

function defaultOnCallNotes(item) {
  const dayNumber = Math.floor(new Date(`${item.date}T12:00:00Z`).getTime() / 86400000);
  const firstNote = ON_CALL_OFFICE_NOTES[((dayNumber % ON_CALL_OFFICE_NOTES.length) + ON_CALL_OFFICE_NOTES.length) % ON_CALL_OFFICE_NOTES.length];
  const secondNote = ON_CALL_OFFICE_NOTES[((dayNumber + 5) % ON_CALL_OFFICE_NOTES.length + ON_CALL_OFFICE_NOTES.length) % ON_CALL_OFFICE_NOTES.length];
  return `${firstNote}\n\n${secondNote}`;
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
    .sort((a, b) => (b.item._addedAt || 0) - (a.item._addedAt || 0) || (a.item.category || "").localeCompare(b.item.category || "") || (a.item.name || "").localeCompare(b.item.name || ""))
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
        ${renderTableTools("links", "Add Link Row")}
      </div>
      <div>
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

function renderGithub() {
  const sections = ["Overview", "Repo", "Projects", "Teams", "People", "Security"];
  const overviewItems = [
    ["Repo", "A repository stores a project's files, code, documentation, and change history so people can work together and track updates."],
    ["Projects", "Projects organize work into boards, roadmaps, and task lists so teams can plan assignments, monitor progress, and manage deadlines."],
    ["Teams", "Teams group organization members so repository access, responsibilities, reviews, and notifications can be managed collectively."],
    ["People", "People are the organization members and collaborators who create content, review changes, manage repositories, and support projects."],
    ["Security", "Security tools identify vulnerable dependencies, exposed secrets, risky code, and access concerns so teams can investigate and correct them."],
  ];
  const descriptions = {
    Overview: "Summary and activity for the GitHub workspace.",
    Repo: "Repository folders, files, branches, and documentation.",
    Projects: "Project boards, milestones, and tracked work.",
    Teams: "Team structure, responsibilities, and collaboration resources.",
    People: "Repository contributors, owners, and contacts.",
    Security: "Security guidance, reviews, alerts, and repository controls.",
  };
  const target = document.querySelector("#github-list");
  const githubSearch = state.searchTerm.toLowerCase();
  const visibleOverviewItems = overviewItems.filter(([name, description]) =>
    `${name} ${description}`.toLowerCase().includes(githubSearch),
  );
  const items = (GITHUB_SECTION_ITEMS[state.githubSection] || [])
    .filter((item) => `${item} ${GITHUB_REPO_DESCRIPTIONS[item] || ""}`.toLowerCase().includes(githubSearch))
    .slice()
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const rows = items
    .map(
      (item) => `
        <tr>
          <td>
            <a class="table-link" href="https://www.google.com/" target="_blank" rel="noopener noreferrer">${escapeHtml(item)}</a>
          </td>
          <td class="github-description">${escapeHtml(GITHUB_REPO_DESCRIPTIONS[item] || `Repository for ${item} project files, documentation, and team workflows.`)}</td>
        </tr>
      `,
    )
    .join("");

  target.innerHTML = `
    <div class="github-layout">
      <div class="section-filter-toolbar">
        <label for="github-section-select">Section</label>
        <select id="github-section-select" data-github-section-select>
          ${sections
            .map(
              (section) => `
                <option value="${escapeHtml(section)}" ${state.githubSection === section ? "selected" : ""}>${escapeHtml(section)}</option>
              `,
            )
            .join("")}
        </select>
      </div>
      <div>
        <section class="github-section" aria-labelledby="github-section-heading">
          <h3 id="github-section-heading">${escapeHtml(state.githubSection)}</h3>
          <p>${escapeHtml(descriptions[state.githubSection])}</p>
          ${
            state.githubSection === "Overview"
              ? `
                ${
                  visibleOverviewItems.length
                    ? `<div class="github-overview-cards">
                        ${visibleOverviewItems
                          .map(
                            ([name, description]) => `
                              <button class="github-overview-card" type="button" data-github-section="${escapeHtml(name)}">
                                <strong>${escapeHtml(name)}</strong>
                                <span>${escapeHtml(description)}</span>
                              </button>
                            `,
                          )
                          .join("")}
                      </div>`
                    : renderEmpty("No GitHub overview sections match.")
                }
              `
              : items.length
              ? `
                <div class="table-wrap">
                  <table class="data-table github-table">
                    <thead>
                      <tr><th>Name</th><th>Description</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              `
              : `<div class="empty-state">No ${escapeHtml(state.githubSection.toLowerCase())} entries yet.</div>`
          }
        </section>
      </div>
    </div>
  `;
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
  renderGithub();
}

function bindEvents() {
  tableRowForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const collection = tableRowForm.dataset.collection;
    if (!TABLE_FORM_SCHEMAS[collection]) {
      return;
    }

    const item = Object.fromEntries(new FormData(tableRowForm).entries());
    if (collection === "sops") {
      Object.assign(item, { status: "Pending", updated: new Date().toISOString().slice(0, 10), sections: [] });
    }
    item._addedAt = Date.now();
    state.data[collection].unshift(item);
    saveTable(collection);
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

  globalSearch.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim();
    renderAll();
  });

  document.addEventListener("change", (event) => {
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

    const dashboardField = event.target.closest("[data-dashboard-field]");
    if (dashboardField) {
      syncDashboardItem(dashboardField);
      return;
    }

    const onCallField = event.target.closest("[data-oncall-edit]");
    if (onCallField) {
      syncOnCallDay(onCallField.dataset.oncallEdit);
      return;
    }
  });

  document.addEventListener("input", (event) => {
    const dashboardField = event.target.closest("[data-dashboard-field]");
    if (dashboardField) {
      syncDashboardItem(dashboardField);
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
      localStorage.setItem(sopNotesKey(sopNotes.dataset.sopNotes), sopNotes.value);
      return;
    }

    const onCallNotes = event.target.closest("[data-oncall-notes]");
    if (onCallNotes) {
      localStorage.setItem(onCallNotesKey(onCallNotes.dataset.oncallNotes), onCallNotes.value);
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
    const tableAdd = event.target.closest("[data-table-add]");
    if (tableAdd) {
      addTableRow(tableAdd.dataset.tableAdd);
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
