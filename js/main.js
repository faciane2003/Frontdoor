const DATA_FILES = {
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
    knowledge: [],
    training: [],
    sops: [],
    certs: [],
    schedule: [],
    links: [],
  },
  searchTerm: "",
};

const viewTitles = {
  dashboard: "Dashboard",
  knowledge: "Knowledge Base",
  training: "Training",
  sops: "SOPs",
  certs: "Certs",
  schedule: "On-Call Schedule",
  links: "Links",
  terminal: "Terminal",
};

const terminalCommands = {
  help: "Commands: help, status, sections, search <term>, clear",
  status: "Portal status: static mode, local JSON data loaded, no backend connected.",
  sections: "Sections: dashboard, knowledge, training, sops, certs, schedule, links, terminal.",
};

const navToggle = document.querySelector(".nav-toggle");
const appNav = document.querySelector("#app-nav");
const navItems = [...document.querySelectorAll(".nav-item")];
const viewTitle = document.querySelector("#view-title");
const globalSearch = document.querySelector("#global-search");
const terminalOutput = document.querySelector("#terminal-output");
const terminalForm = document.querySelector("#terminal-form");
const terminalInput = document.querySelector("#terminal-input");

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
  return state.data[collection].filter((item) => matchRecord(item, state.searchTerm));
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

function renderMetrics() {
  const metrics = [
    ["Knowledge Articles", state.data.knowledge.length, "Searchable wiki entries"],
    ["Training Items", state.data.training.length, "Tracked qualification tasks"],
    ["SOPs", state.data.sops.length, "Procedure references"],
    ["Links", state.data.links.length, "Curated resources"],
  ];

  document.querySelector("#metric-grid").innerHTML = metrics
    .map(
      ([label, value, note]) => `
        <article class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </article>
      `,
    )
    .join("");
}

function renderDashboard() {
  document.querySelector("#dashboard-training").innerHTML = state.data.training
    .slice(0, 4)
    .map(
      (item) => `
        <article class="stack-item">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.owner)} - ${escapeHtml(item.due)}</span>
          <span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
        </article>
      `,
    )
    .join("");

  document.querySelector("#dashboard-schedule").innerHTML = state.data.schedule
    .slice(0, 3)
    .map(
      (item) => `
        <article class="stack-item">
          <strong>${escapeHtml(item.date)} - ${escapeHtml(item.shift)}</strong>
          <span>${escapeHtml(item.primary)} primary - ${escapeHtml(item.backup)} backup</span>
          <span>${escapeHtml(item.notes)}</span>
        </article>
      `,
    )
    .join("");

  document.querySelector("#dashboard-knowledge").innerHTML = state.data.knowledge
    .slice(0, 3)
    .map(renderArticle)
    .join("");
}

function renderArticle(item) {
  return `
    <article class="article-card">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </div>
      <div class="tag-row">
        ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderKnowledge() {
  const items = filtered("knowledge");
  document.querySelector("#knowledge-list").innerHTML =
    items.length > 0 ? items.map(renderArticle).join("") : renderEmpty("No knowledge articles match.");
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
  const rows = filtered("training").map(
    (item) => `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.tier)}</td>
        <td><span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.owner)}</td>
        <td>${escapeHtml(item.due)}</td>
      </tr>
    `,
  );
  renderTable("#training-list", ["Task", "Tier", "Status", "Owner", "Due"], rows);
}

function renderSops() {
  const rows = filtered("sops").map(
    (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.type)}</td>
        <td><span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.owner)}</td>
        <td>${escapeHtml(item.updated)}</td>
      </tr>
    `,
  );
  renderTable("#sops-list", ["SOP", "Type", "Status", "Owner", "Updated"], rows);
}

function renderCerts() {
  const rows = filtered("certs").map(
    (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.level)}</td>
        <td><span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.expires)}</td>
        <td>${escapeHtml(item.notes)}</td>
      </tr>
    `,
  );
  renderTable("#certs-list", ["Certification", "Level", "Status", "Expires", "Notes"], rows);
}

function renderSchedule() {
  const items = filtered("schedule");
  document.querySelector("#schedule-list").innerHTML =
    items.length > 0
      ? items
          .map(
            (item) => `
              <article class="schedule-card">
                <div>
                  <h3>${escapeHtml(item.date)} - ${escapeHtml(item.shift)}</h3>
                  <p>${escapeHtml(item.notes)}</p>
                </div>
                <div>
                  <p><strong>Primary:</strong> ${escapeHtml(item.primary)}</p>
                  <p><strong>Backup:</strong> ${escapeHtml(item.backup)}</p>
                </div>
              </article>
            `,
          )
          .join("")
      : renderEmpty("No schedule entries match.");
}

function renderLinks() {
  const items = filtered("links");
  document.querySelector("#links-list").innerHTML =
    items.length > 0
      ? items
          .map(
            (item) => `
              <article class="resource-card">
                <div>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                </div>
                <div class="tag-row">
                  <span class="tag">${escapeHtml(item.type)}</span>
                  <a href="${escapeHtml(item.url)}">Open</a>
                </div>
              </article>
            `,
          )
          .join("")
      : renderEmpty("No links match.");
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderAll() {
  renderMetrics();
  renderDashboard();
  renderKnowledge();
  renderTraining();
  renderSops();
  renderCerts();
  renderSchedule();
  renderLinks();
}

function writeTerminal(line) {
  const outputLine = document.createElement("p");
  outputLine.className = "terminal-line";
  outputLine.textContent = line;
  terminalOutput.append(outputLine);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function runTerminalCommand(command) {
  const normalized = command.trim();
  if (!normalized) {
    return;
  }

  writeTerminal(`portal> ${normalized}`);

  if (normalized === "clear") {
    terminalOutput.textContent = "";
    return;
  }

  if (normalized.startsWith("search ")) {
    const term = normalized.slice(7).trim();
    globalSearch.value = term;
    state.searchTerm = term;
    renderAll();
    writeTerminal(`Search applied: ${term || "none"}`);
    return;
  }

  writeTerminal(terminalCommands[normalized] || `Unknown command: ${normalized}. Type help.`);
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

  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runTerminalCommand(terminalInput.value);
    terminalInput.value = "";
  });
}

async function init() {
  bindEvents();
  writeTerminal("SOC Knowledge Portal terminal ready. Type help.");

  try {
    await loadData();
    renderAll();
  } catch (error) {
    document.querySelector("#dashboard").insertAdjacentHTML(
      "afterbegin",
      renderEmpty(`Data load failed: ${error.message}`),
    );
    writeTerminal(`Data load failed: ${error.message}`);
  }

  const hashView = window.location.hash.replace("#", "");
  if (viewTitles[hashView]) {
    setView(hashView);
  }
}

init();
