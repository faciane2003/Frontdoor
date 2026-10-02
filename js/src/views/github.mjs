// Render sample repository, project, team, people, and security information.

import { escapeHtml, renderEmpty } from "../core/utils.mjs";
import { state } from "../core/state.mjs";

export const GITHUB_SECTION_ITEMS = {
  Overview: [],
  Repo: [
    "Project Alpha",
    "Project Beta",
    "Project Gamma",
    "Project Delta",
    "Project Epsilon",
    "Project Zeta",
    "Project Eta",
    "Project Theta",
    "Project Iota",
    "Project Kappa",
  ],
  Projects: [
    "Portal Improvements", "Incident Response", "Detection Engineering",
    "Vulnerability Remediation", "Access Reviews", "Analyst Training",
    "SOP Maintenance", "Email Templates", "On-Call Coverage", "Tooling and Automation",
  ],
  Teams: [
    "Team Alpha", "Team Beta", "Team Gamma", "Team Delta", "Team Epsilon",
    "Team Zeta", "Team Eta", "Team Theta", "Team Iota", "Team Kappa",
  ],
  People: [
    "Person Alpha", "Person Beta", "Person Gamma", "Person Delta", "Person Epsilon",
    "Person Zeta", "Person Eta", "Person Theta", "Person Iota", "Person Kappa",
  ],
  Security: [
    "Security Alpha", "Security Beta", "Security Gamma", "Security Delta", "Security Epsilon",
    "Security Zeta", "Security Eta", "Security Theta", "Security Iota", "Security Kappa",
  ],
};

export const GITHUB_ITEM_DESCRIPTIONS = {
  "Portal Improvements": "Example roadmap for navigation, usability improvements, and new portal features.",
  "Incident Response": "Example work tracker for investigations, response actions, and incident follow-ups.",
  "Detection Engineering": "Example backlog for detection rules, alert tuning, and validation exercises.",
  "Vulnerability Remediation": "Example project for prioritizing findings, scheduling fixes, and verifying remediation.",
  "Access Reviews": "Example tracker for account reviews, permission changes, and approval follow-ups.",
  "Analyst Training": "Example training plan for JQS tasks, practical exercises, and qualification milestones.",
  "SOP Maintenance": "Example review schedule for updating procedures, assigning reviewers, and tracking approvals.",
  "Email Templates": "Example worklist for drafting, reviewing, and maintaining Outlook communication templates.",
  "On-Call Coverage": "Example planning board for coverage assignments, shift handoffs, and backup arrangements.",
  "Tooling and Automation": "Example backlog for reusable scripts, data imports, and operational utilities.",
  "Project Alpha": "General repository for shared application code, documentation, and configuration.",
  "Project Beta": "Workspace for internal tools, reusable scripts, and operational automation.",
  "Project Gamma": "Project repository for service components, integration files, and deployment notes.",
  "Project Delta": "Reference repository for templates, examples, and team development standards.",
  "Project Epsilon": "Operations repository for procedures, maintenance tasks, and support resources.",
  "Project Zeta": "Testing repository for validating workflows, releases, and configuration changes.",
  "Project Eta": "Data integration repository for approved imports, exports, and processing utilities.",
  "Project Theta": "Security repository for detection content, review notes, and response resources.",
  "Project Iota": "Training repository for exercises, guides, and qualification materials.",
  "Project Kappa": "Archive repository for completed project files and historical documentation.",
  "Team Alpha": "Application team responsible for shared services, feature delivery, and technical support.",
  "Team Beta": "Automation team maintaining reusable workflows, scripts, and operational tooling.",
  "Team Gamma": "Platform team supporting infrastructure, integrations, and deployment standards.",
  "Team Delta": "Quality team coordinating reviews, testing, and release validation.",
  "Team Epsilon": "Operations team managing routine maintenance, requests, and service continuity.",
  "Team Zeta": "Data team supporting approved data flows, reporting, and processing utilities.",
  "Team Eta": "Documentation team maintaining guides, templates, and reference material.",
  "Team Theta": "Security team reviewing controls, findings, and response activities.",
  "Team Iota": "Training team developing exercises, learning resources, and qualification paths.",
  "Team Kappa": "Planning team coordinating priorities, schedules, and cross-team initiatives.",
  "Person Alpha": "Example organization member who contributes code and project documentation.",
  "Person Beta": "Example collaborator who reviews changes and supports team workflows.",
  "Person Gamma": "Example developer responsible for application features and maintenance.",
  "Person Delta": "Example analyst who supports testing, reporting, and issue resolution.",
  "Person Epsilon": "Example project member who coordinates tasks and delivery milestones.",
  "Person Zeta": "Example engineer who maintains integrations and deployment resources.",
  "Person Eta": "Example contributor who maintains guides and reusable templates.",
  "Person Theta": "Example security reviewer who evaluates findings and proposed changes.",
  "Person Iota": "Example trainer who develops exercises and reference materials.",
  "Person Kappa": "Example administrator who supports access and organization settings.",
  "Security Alpha": "Example dependency review for identifying and tracking vulnerable packages.",
  "Security Beta": "Example code-scanning review for potential implementation weaknesses.",
  "Security Gamma": "Example secret-scanning review for exposed credentials and sensitive values.",
  "Security Delta": "Example access review covering roles, permissions, and membership changes.",
  "Security Epsilon": "Example configuration review for repository protection and policy settings.",
  "Security Zeta": "Example alert review for investigation status, ownership, and resolution notes.",
  "Security Eta": "Example release review covering approvals and deployment safeguards.",
  "Security Theta": "Example audit review for activity records and administrative changes.",
  "Security Iota": "Example remediation tracker for prioritized security improvements.",
  "Security Kappa": "Example security summary for open work, completed actions, and follow-up items.",
};

// These maps consolidate narrow legacy categories without rewriting saved rows.

export function renderGithub() {
  const sections = ["Overview", "Repo", "Projects", "Teams", "People", "Security"];
  if (!sections.includes(state.githubSection)) {
    state.githubSection = "Overview";
  }
  const overviewItems = [
    ["Repo", "A repository stores a project's files, code, documentation, and change history so people can work together and track updates."],
    ["Projects", "Projects organize work into boards, roadmaps, and task lists so teams can plan assignments, monitor progress, and manage deadlines."],
    ["Teams", "Teams group organization members so repository access, responsibilities, reviews, and notifications can be managed collectively."],
    ["People", "People are the organization members and collaborators who create content, review changes, manage repositories, and support projects."],
    ["Security", "Security tools identify vulnerable dependencies, exposed secrets, risky code, and access concerns so teams can investigate and correct them."],
  ];
  const target = document.querySelector("#github-list");
  const githubSearch = state.searchTerm.toLowerCase();
  const visibleOverviewItems = overviewItems.filter(([name, description]) =>
    `${name} ${description}`.toLowerCase().includes(githubSearch),
  );
  const items = (GITHUB_SECTION_ITEMS[state.githubSection] || [])
    .filter((item) => `${item} ${GITHUB_ITEM_DESCRIPTIONS[item] || ""}`.toLowerCase().includes(githubSearch))
    .slice()
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const rows = items
    .map(
      (item) => `
        <tr>
          <td>
            <a class="table-link" href="https://www.google.com/" target="_blank" rel="noopener noreferrer">${escapeHtml(item)}</a>
          </td>
          <td class="github-description">${escapeHtml(GITHUB_ITEM_DESCRIPTIONS[item] || `Example ${state.githubSection.toLowerCase()} entry with general supporting information.`)}</td>
        </tr>
      `,
    )
    .join("");

  target.innerHTML = `
    <div class="github-layout">
      <nav class="github-mini-nav" aria-label="GitHub sections">
        ${sections
          .map(
            (section) => `
              <button type="button" data-github-section="${escapeHtml(section)}" class="${state.githubSection === section ? "is-active" : ""}" aria-current="${state.githubSection === section ? "page" : "false"}">${escapeHtml(section)}</button>
            `,
          )
          .join("")}
      </nav>
      <div>
        <section class="portal-section" aria-label="${escapeHtml(state.githubSection)}">
          ${
            state.githubSection === "Overview"
              ? `
                ${
                  visibleOverviewItems.length
                    ? `<div class="overview-cards">
                        ${visibleOverviewItems
                          .map(
                            ([name, description]) => `
                              <button class="overview-card" type="button" data-github-section="${escapeHtml(name)}">
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
