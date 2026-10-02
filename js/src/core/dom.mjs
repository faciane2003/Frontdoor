// Cache permanent page controls; rendered rows are queried only when needed.

// Cache permanent page controls once; individual views render inside these containers.

export const navToggle = document.querySelector(".nav-toggle");

export const appNav = document.querySelector("#app-nav");

export const navItems = [...document.querySelectorAll(".nav-item")];

export const viewTitle = document.querySelector("#view-title");

export const globalSearch = document.querySelector("#global-search");

export const tableRowDialog = document.querySelector("#table-row-dialog");

export const tableRowForm = document.querySelector("#table-row-form");

export const tableRowFields = document.querySelector("#table-row-fields");

export const socFrame = document.querySelector(".soc-frame");

export const conferenceDialog = document.querySelector("#conference-dialog");

export const conferenceDialogTitle = document.querySelector("#conference-dialog-title");

export const conferenceDialogContent = document.querySelector("#conference-dialog-content");

export const intuneEntryDialog = document.querySelector("#intune-entry-dialog");

export const intuneEntryForm = document.querySelector("#intune-entry-form");

export const intuneEntryValue = document.querySelector("#intune-entry-value");
