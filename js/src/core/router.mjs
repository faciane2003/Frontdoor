// Switch sections, restore their defaults, and dispatch the appropriate renderer.

import { currentLocalDateValue } from "./utils.mjs";
import { renderDashboard } from "../views/dashboard.mjs";
import { renderFeatures } from "../views/features.mjs";
import { renderKnowledge } from "../views/knowledge.mjs";
import { renderTraining } from "../views/training.mjs";
import { renderSops } from "../views/sops.mjs";
import { renderCerts } from "../views/certs.mjs";
import { ensureOnCallMonth, renderSchedule } from "../views/schedule.mjs";
import { renderLinks } from "../views/links.mjs";
import { renderGithub } from "../views/github.mjs";
import { renderWhitepages } from "../views/whitepages.mjs";
import { renderCons } from "../views/cons.mjs";
import { renderTools } from "../views/tools.mjs";
import { renderMail } from "../views/mail.mjs";
import { state, viewTitles } from "./state.mjs";
import { appNav, navItems, navToggle, socFrame, viewTitle } from "./dom.mjs";

// Forward the portal search into the loaded reference document.
export function syncSocSearch() {
  const socSearch = socFrame?.contentDocument?.querySelector("#pageSearch");
  if (!socSearch) {
    return;
  }

  if (socSearch.value !== state.searchTerm) {
    socSearch.value = state.searchTerm;
  }
  socSearch.dispatchEvent(new Event("input", { bubbles: true }));
}

// Activate one section and reset its filters or scroll position as required.
export function setView(view) {
  state.activeView = view;
  if (view === "github") {
    state.githubSection = "Overview";
    renderGithub();
  }
  if (view === "schedule") {
    const today = currentLocalDateValue();
    state.onCallMonth = today.slice(0, 7);
    ensureOnCallMonth(state.onCallMonth);
    state.onCallDate = "";
    renderSchedule();
  }
  if (view === "soc" && !socFrame.getAttribute("src")) {
    socFrame.src = socFrame.dataset.src;
  }
  if (view !== "github" && view !== "schedule" && view !== "soc") {
    renderView(view);
  }
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("is-active", section.id === view);
  });
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });
  if (viewTitle) {
    viewTitle.textContent = viewTitles[view] || "Dashboard";
  }
  window.history.replaceState(null, "", `#${encodeURIComponent(view)}`);
  appNav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll(`#${CSS.escape(view)} .table-wrap`).forEach((scroller) => {
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
    });
    if (view === "soc") {
      syncSocSearch();
    }
  });
}

// Refresh the table affected by an add, edit, or delete action.
export function renderCollection(collection) {
  if (collection === "whitepages") renderWhitepages();
  else renderView(collection);
}

export const VIEW_RENDERERS = {
  features: renderFeatures,
  dashboard: renderDashboard,
  knowledge: renderKnowledge,
  training: renderTraining,
  sops: renderSops,
  certs: renderCerts,
  schedule: renderSchedule,
  links: renderLinks,
  mail: renderMail,
  github: renderGithub,
  tools: renderTools,
  cons: renderCons,
};

// Dispatch navigation and search through the shared view registry.
export function renderView(view) {
  VIEW_RENDERERS[view]?.();
}
