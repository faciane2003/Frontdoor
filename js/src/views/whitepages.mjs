// Maintain ticket/domain entries and import or export their three public columns.

import { currentLocalDateValue, downloadTextFile, filtered, renderEmpty } from "../core/utils.mjs";
import { saveTable } from "../core/storage.mjs";
import { renderEditableField, renderRowActions } from "../shared/tables.mjs";
import { renderTools } from "./tools.mjs";
import { state } from "../core/state.mjs";
import { loadSpreadsheetLibrary } from "../core/libraries.mjs";

export function renderWhitepagesContent() {
  const rows = filtered("whitepages")
    .map((item) => ({ item, index: state.data.whitepages.indexOf(item) }))
    .map(
      ({ item, index }) => `
        <tr>
          <td>${renderEditableField("whitepages", index, "ticket", item.ticket || "", "Ticket")}</td>
          <td>${renderEditableField("whitepages", index, "reason", item.reason || "", "Reason")}</td>
          <td>${renderEditableField("whitepages", index, "domain", item.domain || "", "Domain")}</td>
          <td>${renderRowActions("whitepages", index)}</td>
        </tr>
      `,
    )
    .join("");

  return `<div class="whitepages-content">${rows
    ? `
      <div class="table-tools whitepages-tools">
        <button class="table-add" type="button" data-table-add="whitepages">Add Row</button>
        <button class="table-import" type="button" data-whitepages-import>Import Sheet</button>
        <select data-whitepages-export-format aria-label="Whitepages export format">
          <option value="xlsx">XLSX</option><option value="xls">XLS</option><option value="ods">ODS</option><option value="csv">CSV</option><option value="txt">TXT</option>
        </select>
        <button class="table-import" type="button" data-whitepages-export>Export</button>
        <input class="sr-only" type="file" data-whitepages-file accept=".csv,.txt,.xls,.xlsx,.ods" aria-label="Import Whitepages spreadsheet or text file">
        <span class="import-status" data-whitepages-import-status aria-live="polite"></span>
      </div>
      <div class="table-wrap">
        <table class="data-table whitepages-table">
          <thead><tr><th>Ticket</th><th>Reason</th><th>Domain</th><th aria-label="Row actions"></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
    : `
      <div class="table-tools whitepages-tools">
        <button class="table-add" type="button" data-table-add="whitepages">Add Row</button>
        <button class="table-import" type="button" data-whitepages-import>Import Sheet</button>
        <select data-whitepages-export-format aria-label="Whitepages export format">
          <option value="xlsx">XLSX</option><option value="xls">XLS</option><option value="ods">ODS</option><option value="csv">CSV</option><option value="txt">TXT</option>
        </select>
        <button class="table-import" type="button" data-whitepages-export>Export</button>
        <input class="sr-only" type="file" data-whitepages-file accept=".csv,.txt,.xls,.xlsx,.ods" aria-label="Import Whitepages spreadsheet or text file">
        <span class="import-status" data-whitepages-import-status aria-live="polite"></span>
      </div>
      ${renderEmpty("No Whitepages entries match.")}
    `}</div>`;
}

export function renderWhitepages() {
  renderTools();
}

// Export only Ticket, Reason, and Domain so files can be imported again later.
export async function exportWhitepages(format) {
  const rows = (state.data.whitepages || []).map((item) => ({
    Ticket: item.ticket || "",
    Reason: item.reason || "",
    Domain: item.domain || "",
  }));
  const filename = `whitepages-${currentLocalDateValue()}`;

  if (format === "txt") {
    const text = ["Ticket\tReason\tDomain", ...rows.map((row) => `${row.Ticket}\t${row.Reason}\t${row.Domain}`)].join("\n");
    downloadTextFile(text, `${filename}.txt`, "text/plain;charset=utf-8");
    return;
  }

  if (format === "csv") {
    const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = ["Ticket,Reason,Domain", ...rows.map((row) => [row.Ticket, row.Reason, row.Domain].map(quote).join(","))].join("\n");
    downloadTextFile(csv, `${filename}.csv`, "text/csv;charset=utf-8");
    return;
  }

  try { await loadSpreadsheetLibrary(); }
  catch (error) {
    const status = document.querySelector("[data-whitepages-import-status]");
    if (status) status.textContent = error.message;
    return;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Whitepages");
  XLSX.writeFile(workbook, `${filename}.${format}`, { bookType: format });
}

// Conference dates are parsed in UTC to prevent a date moving backward for users
// west of Greenwich.

// Read delimited ticket/domain text and recognize its column headers.
export function parseWhitepagesText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      const values = line.includes("\t")
        ? line.split("\t")
        : line.includes(",")
          ? line.split(",")
          : line.includes("|")
            ? line.split("|")
            : line.split(/\s+/);
      const cleaned = values.map((value) => value.trim().replace(/^['"]|['"]$/g, ""));
      const ticket = cleaned[0] || "";
      const domain = cleaned.at(-1) || "";
      const reason = cleaned.length > 2 ? cleaned.slice(1, -1).join(" ") : "";
      if (index === 0 && ticket.toLowerCase() === "ticket" && domain.toLowerCase() === "domain") return null;
      return { ticket, reason, domain };
    })
    .filter((item) => item?.ticket && item.domain);
}

// Whitepages imports prepend only new records; either a repeated ticket or domain
// is enough to reject a duplicate.

// Read ticket/domain rows and skip duplicates already present in the table.
export async function importWhitepagesFile(file) {
  const status = document.querySelector("[data-whitepages-import-status]");
  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  if (!file) return;
  const isTextFile = file.name.toLowerCase().endsWith(".txt");
  try {
    setStatus("Reading file...");
    if (!isTextFile) await loadSpreadsheetLibrary();
    let importedRows;
    if (isTextFile) {
      importedRows = parseWhitepagesText(await file.text());
    } else {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sourceRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });
      importedRows = sourceRows
        .map((sourceRow) => {
          const normalized = Object.fromEntries(
            Object.entries(sourceRow).map(([key, value]) => [String(key).trim().toLowerCase(), String(value).trim()]),
          );
          return { ticket: normalized.ticket || "", reason: normalized.reason || "", domain: normalized.domain || "" };
        })
        .filter((item) => item.ticket && item.domain);
    }

    if (!importedRows.length) {
      setStatus("No rows found. Use Ticket, Reason, and Domain column headers.", true);
      return;
    }

    const knownTickets = new Set(
      state.data.whitepages.map((item) => String(item.ticket || "").trim().toLowerCase()).filter(Boolean),
    );
    const knownDomains = new Set(
      state.data.whitepages.map((item) => String(item.domain || "").trim().toLowerCase()).filter(Boolean),
    );
    const additions = importedRows.filter((item) => {
      const ticket = String(item.ticket || "").trim().toLowerCase();
      const domain = String(item.domain || "").trim().toLowerCase();
      if (knownTickets.has(ticket) || knownDomains.has(domain)) return false;
      knownTickets.add(ticket);
      knownDomains.add(domain);
      return true;
    });

    if (additions.length) {
      state.data.whitepages.unshift(...additions);
      saveTable("whitepages");
      renderWhitepages();
    }

    const updatedStatus = document.querySelector("[data-whitepages-import-status]");
    if (updatedStatus) {
      const skipped = importedRows.length - additions.length;
      updatedStatus.textContent = `${additions.length} added${skipped ? `, ${skipped} already listed` : ""}.`;
    }
  } catch {
    setStatus("Could not read that file. Upload TXT, CSV, or an exported Excel workbook.", true);
  }
}
