// Arrange workbook summaries into a readable knowledge hierarchy.

import { escapeHtml, filtered, renderEmpty } from "../core/utils.mjs";

export function renderKnowledge() {
  const allItems = filtered("knowledge")
    .map((item) => ({ ...item, hierarchy: knowledgeHierarchy(item) }))
    .sort((a, b) => a.hierarchy.order - b.hierarchy.order || a.title.localeCompare(b.title));

  document.querySelector("#knowledge-list").innerHTML = allItems.length
    ? allItems.map(renderKnowledgeItem).join("")
    : renderEmpty("No knowledge articles match.");
}

export function renderKnowledgeItem(item) {
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

export function knowledgeHierarchy(item) {
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
