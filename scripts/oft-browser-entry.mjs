// Adapt the Outlook libraries to browser imports and plain-text template editing.
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
const { createOft } = await import("html-to-oft");
export const createMailOft = createOft;
const readerModule = await import("@kenjiuno/msgreader");
const MsgReader = readerModule.default.default || readerModule.default;
// Import readable text only; attachments and rich formatting stay outside the editor.
export const parseMailOft = (bytes) => {
  const data = new MsgReader(bytes).getFileData();
  if (data.error || (!data.subject && !data.body && !data.bodyHtml)) throw new Error("This file does not contain a readable Outlook email.");
  let body = data.body || "";
  if (!body && data.bodyHtml) {
    const html = typeof data.bodyHtml === "string" ? data.bodyHtml : new TextDecoder().decode(data.bodyHtml);
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,style").forEach((element) => element.remove());
    doc.querySelectorAll("br").forEach((element) => element.replaceWith("\n"));
    doc.querySelectorAll("p,div,tr").forEach((element) => element.append("\n"));
    body = doc.body.textContent.trim();
  }
  return { to: (data.recipients || []).filter((recipient) => !recipient.recipType || recipient.recipType === "to").map((recipient) => recipient.smtpAddress || recipient.email || recipient.name || "").filter((value) => value.includes("@")).join(", "), subject: data.subject || "", body, attachmentCount: data.attachments?.length || 0 };
};
