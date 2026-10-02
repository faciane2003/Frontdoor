// Project event locations onto the U.S. map and keep pins, summaries, and dates aligned.

import { currentLocalDateValue, escapeHtml, filtered, matchRecord, renderEmpty } from "../core/utils.mjs";
import { state } from "../core/state.mjs";
import { conferenceDialog, conferenceDialogContent, conferenceDialogTitle } from "../core/dom.mjs";

export const CONFERENCE_COORDINATES = {
  "Bethesda, Maryland": [38.9847, -77.0947],
  "Atlanta, Georgia": [33.749, -84.388],
  "Bellevue, Washington": [47.6101, -122.2015],
  "Reston, Virginia": [38.9586, -77.357],
  "Boston, Massachusetts": [42.3601, -71.0589],
  "Orlando, Florida": [28.5383, -81.3792],
  "Arlington, Virginia": [38.8816, -77.091],
  "New York City, New York": [40.7128, -74.006],
  "Coral Gables, Florida": [25.7215, -80.2684],
  "Dallas, Texas": [32.7767, -96.797],
  "The Woodlands, Texas": [30.1658, -95.4613],
  "Houston, Texas": [29.7604, -95.3698],
  "Scottsdale, Arizona": [33.4942, -111.9261],
  "Jacksonville, Florida": [30.3322, -81.6557],
  "Washington, District of Columbia": [38.9072, -77.0369],
  "San Francisco, California": [37.7749, -122.4194],
  "Mesa, Arizona": [33.4152, -111.8315],
  "San Diego, California": [32.7157, -117.1611],
  "Park City, Utah": [40.6461, -111.498],
  "New Orleans, Louisiana": [29.9511, -90.0715],
  "National Harbor, Maryland": [38.7826, -77.0151],
};
// Intl formatters are relatively expensive to construct, so reuse them for every
// timeline row, tooltip, popup, and scrubber update.

export const CONFERENCE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const CONFERENCE_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const CONFERENCE_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
// GitHub data is intentionally static placeholder content until an API is wired in.

// Format dates in UTC so western time zones do not display the previous day.
export function formatConferenceDate(startDate, endDate) {
  const format = (value, includeYear = true) => (includeYear ? CONFERENCE_DATE_FORMATTER : CONFERENCE_SHORT_DATE_FORMATTER)
    .format(new Date(`${value}T00:00:00Z`));
  if (!endDate || endDate === startDate) return format(startDate);
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
  if (sameMonth) {
    return `${format(startDate, false)}-${new Date(`${endDate}T00:00:00Z`).getUTCDate()}, ${endDate.slice(0, 4)}`;
  }
  return `${format(startDate, !sameYear)}-${format(endDate)}`;
}

// Apply one projection to state boundaries and city coordinates. This simple
// contiguous-U.S. projection is fast, deterministic, and requires no map library.

// Apply the same map projection to geographic boundaries and conference pins.
export function projectUsCoordinate(longitude, latitude) {
  return [
    30 + ((longitude + 125) / 58.5) * 740,
    25 + ((49.5 - latitude) / 25.1) * 350,
  ];
}

export let cachedUsStatePaths = "";

// State geometry never changes during a session, so build its large SVG path
// string once and reuse it on later searches or CONs rerenders.

// Cache the state-boundary SVG instead of rebuilding it on every search.
export function renderUsStatePaths() {
  if (cachedUsStatePaths) return cachedUsStatePaths;
  cachedUsStatePaths = (state.data.usStates || []).map((item) => {
    const path = (item.rings || []).map((ring) => ring.map(([longitude, latitude], index) => {
      const [x, y] = projectUsCoordinate(longitude, latitude);
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z").join(" ");
    return `<path class="cons-map-state" d="${path}"></path>`;
  }).join("");
  return cachedUsStatePaths;
}

// Build the map and chronological list from the same filtered conference set so
// search results, pins, and timeline entries can never disagree.

export function renderCons() {
  const target = document.querySelector("#cons-list");
  const today = currentLocalDateValue();
  const conferences = filtered("cons")
    .filter((item) => (item.endDate || item.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));

  if (!conferences.length) {
    target.innerHTML = renderEmpty("No upcoming conferences match.");
    return;
  }

  const firstMonth = conferences[0].startDate.slice(0, 7);
  const lastMonth = conferences.reduce((latest, item) => item.endDate > latest ? item.endDate : latest, conferences[0].endDate).slice(0, 7);
  const mapMonths = [];
  const monthCursor = new Date(`${firstMonth}-01T00:00:00Z`);
  while (monthCursor.toISOString().slice(0, 7) <= lastMonth) {
    mapMonths.push(monthCursor.toISOString().slice(0, 7));
    monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1);
  }
  if (!mapMonths.includes(state.consSelectedMonth)) state.consSelectedMonth = mapMonths[0];
  const selectedMonthIndex = mapMonths.indexOf(state.consSelectedMonth);
  const selectedRange = conferenceMonthRange(state.consSelectedMonth);

  const months = conferences.reduce((groups, item) => {
    const month = CONFERENCE_MONTH_FORMATTER.format(new Date(`${item.startDate}T00:00:00Z`));
    groups[month] ||= [];
    groups[month].push(item);
    return groups;
  }, {});
  const locations = conferences.reduce((groups, item) => {
    const coordinates = CONFERENCE_COORDINATES[item.location];
    if (!coordinates) return groups;
    groups[item.location] ||= { coordinates, conferences: [] };
    groups[item.location].conferences.push(item.name);
    return groups;
  }, {});
  const selectedLocationCount = new Set(
    conferences
      .filter((item) => item.startDate <= selectedRange.end && item.endDate >= selectedRange.start)
      .filter((item) => CONFERENCE_COORDINATES[item.location])
      .map((item) => item.location),
  ).size;
  const mapPins = Object.entries(locations).map(([location, details]) => {
    const [latitude, longitude] = details.coordinates;
    const [x, y] = projectUsCoordinate(longitude, latitude);
    const locationEvents = conferences.filter((item) => item.location === location);
    const context = locationEvents.map((item) => `${item.name} (${formatConferenceDate(item.startDate, item.endDate)})`).join("; ");
    const intervals = locationEvents.map((item) => `${item.startDate}|${item.endDate}`).join(",");
    const visible = locationEvents.some((item) => item.startDate <= selectedRange.end && item.endDate >= selectedRange.start);
    const label = `${location}: ${context}`;
    return `
      <g class="cons-map-pin" tabindex="0" role="img" aria-label="${escapeHtml(label)}" data-map-location="${escapeHtml(location)}" data-map-context="${escapeHtml(context)}" data-map-intervals="${escapeHtml(intervals)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" ${visible ? "" : "hidden"}>
        <circle r="8"></circle>
        <circle r="3"></circle>
      </g>
    `;
  }).join("");

  target.innerHTML = `
    <section class="cons-map" aria-label="Map of upcoming conference locations">
      <svg viewBox="0 0 800 400" role="img" aria-label="Upcoming U.S. cybersecurity conference locations; pins mark cities represented in the timeline below.">
        ${renderUsStatePaths()}
        ${mapPins}
      </svg>
      <div class="cons-map-tooltip" data-cons-map-tooltip role="tooltip" hidden></div>
      <div class="cons-map-callouts" data-cons-callouts></div>
      <div class="cons-map-scrubber" aria-label="Conference map month">
        <div class="cons-scrubber-heading">
          <strong>Map month</strong>
          <span><span data-cons-month-label>${escapeHtml(CONFERENCE_MONTH_FORMATTER.format(new Date(`${state.consSelectedMonth}-01T00:00:00Z`)))}</span><b class="cons-vacancy" data-cons-vacancy ${selectedLocationCount ? "hidden" : ""}>Vacant</b></span>
        </div>
        <label><span>${escapeHtml(CONFERENCE_MONTH_FORMATTER.format(new Date(`${firstMonth}-01T00:00:00Z`)))}</span><input type="range" min="0" max="${mapMonths.length - 1}" value="${selectedMonthIndex}" step="1" data-cons-month data-cons-months="${mapMonths.join(",")}"><span>${escapeHtml(CONFERENCE_MONTH_FORMATTER.format(new Date(`${lastMonth}-01T00:00:00Z`)))}</span></label>
      </div>
    </section>
    <div class="cons-timeline" aria-label="Upcoming cybersecurity conference timeline">
      ${Object.entries(months).map(([month, items]) => `
        <section class="cons-month">
          <h3>${escapeHtml(month)}</h3>
          <div class="cons-month-events">
            ${items.map((item) => `
              <article class="cons-event">
                <time datetime="${escapeHtml(item.startDate)}">${escapeHtml(formatConferenceDate(item.startDate, item.endDate))}</time>
                <div class="cons-event-details">
                  <a class="table-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a>
                  <span>${escapeHtml(item.location)}</span>
                  <p>${escapeHtml(item.focus)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
  requestAnimationFrame(() => renderConferenceCallouts(target.querySelector(".cons-map")));
}

// Find the first and last day of the selected month for event filtering.
export function conferenceMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { start: `${month}-01`, end };
}

// Return events for a city that overlap the currently selected month.
export function conferenceEventsForLocation(location) {
  const today = currentLocalDateValue();
  const range = conferenceMonthRange(state.consSelectedMonth);
  return (state.data.cons || [])
    .filter((item) => item.location === location && (item.endDate || item.startDate) >= today)
    .filter((item) => item.startDate <= range.end && item.endDate >= range.start)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// Move one monthly scrubber and update the existing SVG nodes in place. Avoiding
// a full rerender keeps the control smooth while it is being dragged.

// Update pins, event summaries, and the vacant-month message together.
export function updateConferenceMapMonth(control) {
  const map = control.closest(".cons-map");
  const months = control.dataset.consMonths.split(",");
  state.consSelectedMonth = months[Number(control.value)];
  const range = conferenceMonthRange(state.consSelectedMonth);
  map.querySelector("[data-cons-month-label]").textContent = CONFERENCE_MONTH_FORMATTER.format(new Date(`${state.consSelectedMonth}-01T00:00:00Z`));
  let visiblePinCount = 0;
  map.querySelectorAll(".cons-map-pin").forEach((pin) => {
    const isVisible = pin.dataset.mapIntervals.split(",").some((interval) => {
      const [startDate, endDate] = interval.split("|");
      return startDate <= range.end && endDate >= range.start;
    });
    // SVGElement does not implement HTMLElement.hidden consistently. Toggle the
    // actual attribute so the CSS selector hides and reveals pins while scrubbing.
    pin.toggleAttribute("hidden", !isVisible);
    if (isVisible) visiblePinCount += 1;
  });
  map.querySelector("[data-cons-vacancy]")?.toggleAttribute("hidden", visiblePinCount > 0);
  const tooltip = map.querySelector("[data-cons-map-tooltip]");
  if (tooltip) tooltip.hidden = true;
  if (conferenceDialog?.open) conferenceDialog.close();
  renderConferenceCallouts(map);
}

// Place short event summaries beside visible pins while limiting collisions.
export function renderConferenceCallouts(map) {
  const layer = map?.querySelector("[data-cons-callouts]");
  if (!layer) return;
  layer.replaceChildren();
  const mapRect = map.getBoundingClientRect();
  const svgRect = map.querySelector("svg").getBoundingClientRect();
  const boxes = [];
  map.querySelectorAll(".cons-map-pin:not([hidden])").forEach((pin) => {
    const events = conferenceEventsForLocation(pin.dataset.mapLocation).filter((item) => matchRecord(item, state.searchTerm));
    if (!events.length) return;
    const card = document.createElement("div");
    card.className = "cons-map-callout";
    card.dataset.location = pin.dataset.mapLocation;
    card.innerHTML = events.map((item) => `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(formatConferenceDate(item.startDate, item.endDate))}</span><p>${escapeHtml(item.focus)}</p>`).join("");
    layer.append(card);
    const pinRect = pin.getBoundingClientRect();
    const x = pinRect.left + pinRect.width / 2 - mapRect.left;
    const y = pinRect.top + pinRect.height / 2 - mapRect.top;
    const width = Math.min(132, mapRect.width - 16);
    card.style.width = `${width}px`;
    const height = card.offsetHeight;
    let best = null;
    for (const dy of [0, -height - 12, height + 12, -2 * height - 24, 2 * height + 24]) {
      for (const dx of [12, -width - 12, 150, -width - 150]) {
        const left = Math.max(8, Math.min(mapRect.width - width - 8, x + dx));
        const top = Math.max(svgRect.top - mapRect.top, Math.min(svgRect.bottom - mapRect.top - height, y + dy));
        const overlap = boxes.reduce((sum, box) => sum + Math.max(0, Math.min(left + width, box.left + box.width) - Math.max(left, box.left)) * Math.max(0, Math.min(top + height, box.top + box.height) - Math.max(top, box.top)), 0);
        const score = overlap * 100 + Math.abs(left - x) + Math.abs(top - y);
        if (!best || score < best.score) best = { left, top, width, height, score };
      }
    }
    card.style.left = `${best.left}px`;
    card.style.top = `${best.top}px`;
    boxes.push(best);
  });
}

// Open a readable event detail panel beside the selected map location.
export function openConferenceDetails(location, pin) {
  if (conferenceDialog.open && conferenceDialog.dataset.location === location) {
    conferenceDialog.close();
    conferenceDialog.dataset.location = "";
    return;
  }
  const events = conferenceEventsForLocation(location);
  if (!events.length) return;

  conferenceDialogTitle.textContent = location;
  conferenceDialogContent.innerHTML = events.map((item) => `
    <article class="conference-dialog-event">
      <div>
        <time datetime="${escapeHtml(item.startDate)}">${escapeHtml(formatConferenceDate(item.startDate, item.endDate))}</time>
        <h3>${escapeHtml(item.name)}</h3>
      </div>
      <p>${escapeHtml(item.focus)}</p>
      <a class="table-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Open official event website</a>
    </article>
  `).join("");
  if (conferenceDialog.open) conferenceDialog.close();
  conferenceDialog.show();
  conferenceDialog.dataset.location = location;
  const pinRect = pin.getBoundingClientRect();
  const popupRect = conferenceDialog.getBoundingClientRect();
  const gap = 12;
  const preferredLeft = pinRect.right + gap;
  const fallbackLeft = pinRect.left - popupRect.width - gap;
  const left = preferredLeft + popupRect.width <= window.innerWidth - 12 ? preferredLeft : Math.max(12, fallbackLeft);
  const top = Math.max(12, Math.min(window.innerHeight - popupRect.height - 12, pinRect.top + pinRect.height / 2 - popupRect.height / 2));
  conferenceDialog.style.left = `${left}px`;
  conferenceDialog.style.top = `${top}px`;
}
