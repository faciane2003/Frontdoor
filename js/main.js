const DATA_URL = "data/repo-map.json";

const state = {
  activeView: "overview",
  searchTerm: "",
  activeTop: "",
  activeGroup: "",
  data: null,
};

const viewTitles = {
  overview: "Overview",
  explorer: "Explorer",
  worlds: "Worlds",
  assets: "Assets",
  code: "Code",
  docs: "Docs",
};

const navToggle = document.querySelector(".nav-toggle");
const appNav = document.querySelector("#app-nav");
const navItems = [...document.querySelectorAll(".nav-item")];
const viewTitle = document.querySelector("#view-title");
const globalSearch = document.querySelector("#global-search");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function titleFromPath(path) {
  return path
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replaceAll("-", " ")
    .replaceAll("_", " ") || path;
}

function getEntries() {
  if (!state.data) {
    return [];
  }

  const term = state.searchTerm.trim().toLowerCase();
  return state.data.entries.filter((entry) => {
    if (state.activeTop && entry.top !== state.activeTop) {
      return false;
    }

    if (!term) {
      return true;
    }

    return `${entry.path} ${entry.extension} ${entry.type}`.toLowerCase().includes(term);
  });
}

function entriesForPaths(prefixes) {
  const term = state.searchTerm.trim().toLowerCase();
  return state.data.entries.filter((entry) => {
    const inScope = prefixes.some((prefix) => entry.path === prefix || entry.path.startsWith(`${prefix}/`));
    if (!inScope) {
      return false;
    }

    if (!term) {
      return true;
    }

    return `${entry.path} ${entry.extension} ${entry.type}`.toLowerCase().includes(term);
  });
}

function groupBy(entries, keyFn) {
  return entries.reduce((groups, entry) => {
    const key = keyFn(entry) || "(root)";
    groups[key] ||= [];
    groups[key].push(entry);
    return groups;
  }, {});
}

function renderStats() {
  const stats = state.data.stats;
  const cards = [
    ["Total Entries", stats.totalEntries],
    ["Files", stats.files],
    ["Folders", stats.folders],
    ["Public Assets", stats.publicAssetEntries],
    ["World Files", stats.worldFiles],
    ["Model Files", stats.modelFiles],
    ["Top Levels", stats.topLevelCount],
    ["Generated", state.data.generatedAt.split("T")[0]],
  ];

  return `
    <div class="stats-grid">
      ${cards
        .map(
          ([label, value]) => `
            <article class="stat-card">
              <span>${escapeHtml(label)}</span>
              <strong>${typeof value === "number" ? formatNumber(value) : escapeHtml(value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderOverview() {
  const topRows = state.data.topLevelCounts.slice(0, 12);
  const extRows = state.data.extensionCounts.slice(0, 12);
  document.querySelector("#overview-content").innerHTML = `
    ${renderStats()}
    <div class="summary-grid">
      <section class="panel">
        <div class="panel-header">
          <h2>Top Level Areas</h2>
          <span>${formatNumber(topRows.length)}</span>
        </div>
        ${renderCountTable("Area", topRows)}
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>Extension Breakdown</h2>
          <span>${formatNumber(extRows.length)}</span>
        </div>
        ${renderCountTable("Extension", extRows)}
      </section>
    </div>
    <section class="panel">
      <div class="panel-header">
        <h2>Map Scope</h2>
        <span>file names only</span>
      </div>
      <table class="mini-table">
        <tbody>
          <tr><th>Source</th><td>${escapeHtml(state.data.sourceRoot)}</td></tr>
          <tr><th>Contents</th><td>Folder names, file names, paths, extensions, and counts.</td></tr>
          <tr><th>Excluded</th><td>File contents and source code text.</td></tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderCountTable(label, rows) {
  return `
    <table class="mini-table">
      <thead>
        <tr>
          <th>${escapeHtml(label)}</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([name, count]) => `
              <tr>
                <td>${escapeHtml(name)}</td>
                <td>${formatNumber(count)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderExplorer() {
  const topLevels = state.data.topLevelCounts.map(([name]) => name);
  const entries = getEntries();
  document.querySelector("#explorer-content").innerHTML = `
    <div class="explorer-layout">
      ${renderMiniNav(topLevels, state.activeTop)}
      <div class="tree-list">
        ${renderGroupedEntries(entries, (entry) => entry.parent || "(root)", 80)}
      </div>
    </div>
  `;
}

function renderMiniNav(items, active) {
  return `
    <aside class="mini-nav" aria-label="Filter">
      <button type="button" class="${active ? "" : "is-active"}" data-top-filter="">All</button>
      ${items
        .map(
          (item) => `
            <button type="button" class="${item === active ? "is-active" : ""}" data-top-filter="${escapeHtml(item)}">${escapeHtml(item)}</button>
          `,
        )
        .join("")}
    </aside>
  `;
}

function renderGroupedEntries(entries, keyFn, limit = 120) {
  if (!entries.length) {
    return `<div class="empty">No matching files or folders.</div>`;
  }

  const groups = Object.entries(groupBy(entries, keyFn)).sort(([a], [b]) => a.localeCompare(b));
  return groups
    .slice(0, limit)
    .map(([group, items], index) => renderTreeGroup(group, items, index < 6))
    .join("");
}

function renderTreeGroup(title, entries, expanded) {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  return `
    <section class="tree-group" aria-expanded="${expanded ? "true" : "false"}">
      <button class="tree-toggle" type="button">
        <strong>${escapeHtml(title)}</strong>
        <span>${formatNumber(sorted.length)} entries</span>
      </button>
      <div class="tree-body">
        ${sorted.map(renderEntryRow).join("")}
      </div>
    </section>
  `;
}

function renderEntryRow(entry) {
  return `
    <article class="file-row">
      <div class="file-path">${escapeHtml(entry.path)}</div>
      <span class="badge ${entry.type}">${escapeHtml(entry.type)}</span>
      <span class="badge">${escapeHtml(entry.extension || "folder")}</span>
    </article>
  `;
}

function renderScopedView(target, prefixes, navItemsForView) {
  const entries = entriesForPaths(prefixes);
  const grouped = renderGroupedEntries(entries, (entry) => {
    if (state.activeGroup === "extension") {
      return entry.extension || "folder";
    }
    return entry.parent || "(root)";
  });

  document.querySelector(target).innerHTML = `
    <div class="explorer-layout">
      <aside class="mini-nav" aria-label="View options">
        ${navItemsForView
          .map(
            ([key, label]) => `
              <button type="button" class="${state.activeGroup === key ? "is-active" : ""}" data-group-mode="${escapeHtml(key)}">${escapeHtml(label)}</button>
            `,
          )
          .join("")}
      </aside>
      <div class="tree-list">${grouped}</div>
    </div>
  `;
}

function renderWorlds() {
  renderScopedView(
    "#worlds-content",
    ["src/worlds", "public/3D World/models"],
    [
      ["folder", "By Folder"],
      ["extension", "By Extension"],
    ],
  );
}

function renderAssets() {
  renderScopedView(
    "#assets-content",
    ["public", "src/assets"],
    [
      ["folder", "By Folder"],
      ["extension", "By Extension"],
    ],
  );
}

function renderCode() {
  renderScopedView(
    "#code-content",
    ["src", "server", "scripts", "tools", "config"],
    [
      ["folder", "By Folder"],
      ["extension", "By Extension"],
    ],
  );
}

function renderDocs() {
  renderScopedView(
    "#docs-content",
    ["docs", "Playwright", "README.md", "AGENTS.md", "HANDOFF.md"],
    [
      ["folder", "By Folder"],
      ["extension", "By Extension"],
    ],
  );
}

function renderAll() {
  if (!state.data) {
    return;
  }

  renderOverview();
  renderExplorer();
  renderWorlds();
  renderAssets();
  renderCode();
  renderDocs();
}

function setView(view) {
  state.activeView = view;
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("is-active", section.id === view);
  });
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });
  viewTitle.textContent = viewTitles[view] || "Overview";
  window.location.hash = view;
  appNav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function bindEvents() {
  navToggle.addEventListener("click", () => {
    const isOpen = appNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => setView(item.dataset.view));
  });

  globalSearch.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    renderAll();
  });

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".tree-toggle");
    if (toggle) {
      const group = toggle.closest(".tree-group");
      group.setAttribute("aria-expanded", group.getAttribute("aria-expanded") !== "true");
      return;
    }

    const topFilter = event.target.closest("[data-top-filter]");
    if (topFilter) {
      state.activeTop = topFilter.dataset.topFilter;
      renderExplorer();
      return;
    }

    const groupMode = event.target.closest("[data-group-mode]");
    if (groupMode) {
      state.activeGroup = groupMode.dataset.groupMode;
      renderAll();
    }
  });
}

async function init() {
  bindEvents();
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Unable to load ${DATA_URL}`);
  }
  state.data = await response.json();
  state.activeGroup = "folder";
  renderAll();
  const initialView = window.location.hash.replace("#", "");
  if (initialView && viewTitles[initialView]) {
    setView(initialView);
  }
}

init().catch((error) => {
  document.querySelector("#overview-content").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
