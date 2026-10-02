// Render compact dashboard cards with three searchable bullets per section.

import { escapeHtml, renderEmpty } from "../core/utils.mjs";
import { state } from "../core/state.mjs";

// Keep card descriptions short and searchable while leaving navigation to the shared router.
export function renderDashboard() {
  const topics = [
    ["sops", "SOPs", ["Security procedures", "Response workflows", "Operational guidance"]],
    ["links", "Links", ["Approved tools", "Documentation", "Research resources"]],
    ["mail", "Mail", ["Outlook templates", "Editable emails", "Import and download"]],
    ["certs", "Certs", ["Certification paths", "Credential details", "Security specialties"]],
    ["features", "Features", ["Feature ideas", "Editable descriptions", "Add and remove entries"]],
    ["training", "JQS", ["Qualification tasks", "Training progress", "Evidence and signoffs"]],
    ["schedule", "On-Call", ["Team coverage", "Absences", "Handoff notes"]],
    ["github", "GitHub", ["Repositories and projects", "Teams and people", "Security reviews"]],
    ["tools", "Tools", ["Compare data lists", "Find differences", "Clean shared data"]],
    ["cons", "CONs", ["Cybersecurity events", "Monthly map", "Dates and locations"]],
    ["soc", "SOC Reference", ["Analyst workflows", "Systems and networking", "Labs and references"]],
  ];
  const search = state.searchTerm.toLowerCase();
  const visibleTopics = topics.filter(([, name, description]) =>
    `${name} ${description.join(" ")}`.toLowerCase().includes(search),
  );

  document.querySelector("#dashboard-grid").innerHTML = `
    <section class="portal-section dashboard-section" aria-label="Dashboard sections">

      ${
        visibleTopics.length
          ? `<div class="overview-cards">
              ${visibleTopics
                .map(
                  ([view, name, description]) => `
                    <button class="overview-card" type="button" data-dashboard-view="${escapeHtml(view)}">
                      <strong>${escapeHtml(name)}</strong>
                      <span class="dashboard-bullets" role="list">${description.map((bullet) => `<span class="dashboard-bullet" role="listitem">${escapeHtml(bullet)}</span>`).join("")}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>`
          : renderEmpty("No dashboard topics match.")
      }
    </section>
  `;
}
