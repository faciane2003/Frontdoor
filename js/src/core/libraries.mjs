// Load large optional tools only when used, sharing requests and allowing retries.

// Optional tools share one in-flight request. Failed loads can be retried.
let outlookRequest;
let outlookAttempts = 0;
let spreadsheetRequest;

export function loadOutlookLibrary() {
  if (outlookRequest) return outlookRequest;
  const url = new URL("js/oft-browser.js", document.baseURI);
  url.searchParams.set("v", "20261001-refactor");
  // Browsers remember failed module imports. A retry needs a fresh URL.
  if (outlookAttempts++) url.searchParams.set("retry", String(outlookAttempts));
  outlookRequest = import(url.href)
    .catch((error) => {
      outlookRequest = null;
      throw new Error(`Unable to load Outlook tools: ${error.message}`);
    });
  return outlookRequest;
}

export function loadSpreadsheetLibrary() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  spreadsheetRequest ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else { script.remove(); reject(new Error("Spreadsheet reader did not initialize.")); }
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Unable to load spreadsheet tools. Check your connection and try again."));
    };
    document.head.append(script);
  }).catch((error) => {
    spreadsheetRequest = null;
    throw error;
  });
  return spreadsheetRequest;
}
