// Start the portal after its baseline data and browser edits are ready.

import { renderEmpty } from "./core/utils.mjs";
import { setView } from "./core/router.mjs";
import { loadData } from "./core/data.mjs";
import { loadIntuneLists } from "./core/storage.mjs";
import { bindEvents } from "./core/events.mjs";
import { state, viewTitles } from "./core/state.mjs";

// Bind controls, load available data, and open the requested section.
export async function init() {
  bindEvents();
  loadIntuneLists();

  let loadError = null;
  try {
    await loadData();
  } catch (error) {
    loadError = error;
  }

  // Render only the requested view at startup. Other sections are created lazily
  // when selected, which avoids building every large table and calendar up front.
  const hashView = window.location.hash.replace("#", "");
  setView(viewTitles[hashView] ? hashView : "dashboard");

  if (loadError) {
    document.getElementById(state.activeView).insertAdjacentHTML(
      "afterbegin",
      renderEmpty(`Data load failed: ${loadError.message}`),
    );
  }
}

init();
