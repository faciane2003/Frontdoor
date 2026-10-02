// Keep shared page state, catalog paths, and navigation names in one place.

export const DATA_FILES = {
  features: "data/features.json",
  knowledge: "data/knowledge.json",
  training: "data/training.json",
  sops: "data/sops.json",
  certs: "data/certs.json",
  schedule: "data/on-call.json",
  links: "data/links.json",
  mail: "data/mail.json",
  whitepages: "data/whitepages.json",
  cons: "data/cons.json",
  usStates: "assets/us-states.json",
};

// This single state object keeps rendering predictable: UI controls update state,
// then only the affected view is redrawn.

export const state = {
  activeView: "dashboard",
  data: {
    features: [],
    knowledge: [],
    training: [],
    sops: [],
    certs: [],
    schedule: [],
    links: [],
    mail: [],
    whitepages: [],
    cons: [],
    usStates: [],
  },
  searchTerm: "",
  expandedMailSections: new Set(),
  expandedMailPreviews: new Set(),
  mailEdits: {},
  mailAdded: [],
  mailImporting: false,
  mailSection: "",
  sopCategory: "",
  expandedSopCategories: new Set(),
  sopCategoriesInitialized: false,
  trainingArea: "",
  expandedTrainingTiers: new Set(),
  expandedTrainingAreas: new Set(),
  onCallDate: "",
  certPhase: "",
  expandedCertCategories: new Set(),
  linkCategory: "",
  expandedLinkCategories: new Set(),
  onCallMonth: "",
  githubSection: "Overview",
  toolsStanding: [],
  toolsNew: [],
  toolsSection: "Intune Checker",
  consSelectedMonth: "",
};

// Navigation keys match both the section IDs in index.html and the URL hashes.

export const viewTitles = {
  dashboard: "SOC HUD",
  features: "Features",
  knowledge: "Knowledge Base",
  training: "JQS",
  sops: "SOPs",
  certs: "Certs",
  schedule: "On-Call",
  links: "Links",
  mail: "Mail",
  github: "GitHub",
  tools: "Tools",
  cons: "CONs",
  soc: "SOC Reference",
};
