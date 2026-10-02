// Regenerate the checked-in Outlook examples from the shared Mail catalog.
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createOft, inspectOft } from "html-to-oft";

const root = new URL("../", import.meta.url);
const dataPath = new URL("data/mail.json", root);
const sections = JSON.parse(await fs.readFile(dataPath, "utf8"));
const rows = sections.flatMap((section) => [section, ...section.subsections]);
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

for (const row of rows) {
  const template = `assets/mail/${row.id}.oft`;
  const text = `Hello [Recipient],\n\nThis is a dummy email template for ${row.title}.\nReplace this sample text with your approved message.\n\nSummary: [Add details]\nAction required: [Add action]\nDue date: [Add date]\n\nRegards,\n[Your name]`;
  const bytes = await createOft({
    subject: row.preview?.subject || `[DUMMY TEMPLATE] ${row.title}`,
    html: `<html><body>${(row.preview?.body || text).split("\n\n").map((paragraph) => `<p>${escape(paragraph).replaceAll("\n", "<br>")}</p>`).join("")}</body></html>`,
    text: row.preview?.body || text,
    to: [row.preview?.to || "recipient@example.com"],
  });
  if (bytes.subarray(0, 8).toString("hex") !== "d0cf11e0a1b11ae1" || !inspectOft(bytes).hasHtml) {
    throw new Error(`Invalid OFT output for ${row.title}`);
  }
  await fs.writeFile(new URL(template, root), bytes);
  row.template = template;
}

await fs.writeFile(dataPath, JSON.stringify(sections, null, 2) + "\n");
// Remove only the previous generated message files after all templates succeed.
for (const row of rows) {
  await fs.rm(new URL(`assets/mail/${row.id}.eml`, root), { force: true });
}
console.log(`Generated and structurally validated ${rows.length} binary OFT templates in ${fileURLToPath(new URL("assets/mail/", root))}.`);
