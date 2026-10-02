// Render a scrolling coverage calendar and preserve edits for individual days.

import { currentLocalDateValue, escapeHtml, filtered, renderEmpty } from "../core/utils.mjs";
import { state } from "../core/state.mjs";
import { readStoredValue, writeStoredValue } from "../core/persistence.mjs";

export const ON_CALL_PEOPLE = ["Maya Chen", "Andre Patel", "Nina Brooks", "Luis Romero", "Jordan Ellis"];

export const ON_CALL_PTO_ROTATION = [["Sam Rivera"], ["Taylor Morgan", "Chris Lee"], [], ["Avery Scott"], ["Morgan Blake"], [], ["Riley Park"]];

export const ON_CALL_ROTATION_ANCHOR = "2026-09-17";

export const ON_CALL_OFFICE_NOTES = [
  "Morning handoff is scheduled for 8:30 AM. Review overnight tickets and update the shared tracker before the daily stand-up.",
  "Team stand-up begins at 9:00 AM. Confirm open action items, assign follow-ups, and document any staffing concerns.",
  "Complete the weekly access review and send outstanding approval reminders. File completed records in the team folder.",
  "Reserved time for documentation cleanup. Review outdated procedures, correct broken links, and note items requiring owner approval.",
  "Coordinate the afternoon operations handoff. Summarize unresolved issues, current priorities, and expected follow-up times.",
  "Scheduled maintenance window begins this evening. Verify the contact roster and confirm that escalation details are current.",
  "Review the team inbox at the start and end of the shift. Route new requests and flag anything that needs manager attention.",
  "Monthly reporting work is in progress. Validate tracker entries and collect missing updates before the reporting deadline.",
  "Training block is reserved for the afternoon. Finish assigned modules and add completion notes to the qualification tracker.",
  "Check the office calendar for visitor appointments and planned absences. Share coverage changes during the morning meeting.",
  "Inventory review is due today. Record equipment changes and submit replacement requests for missing or damaged items.",
  "End-of-day reminder: close completed tasks, update pending work, and leave a clear handoff note for the next shift.",
];
// Conference pins use real city coordinates. The same projection is applied to
// these points and the Census state boundaries, keeping every pin aligned.

// Save the selected day coverage and notes without changing the shared catalog.
export function syncOnCallDay(date) {
  const fields = [...document.querySelectorAll(`[data-oncall-edit="${CSS.escape(date)}"]`)];
  const notes = document.querySelector(`[data-oncall-notes="${CSS.escape(date)}"]`);
  const values = fields.reduce((record, field) => {
    record[field.dataset.oncallField] = field.value.trim();
    return record;
  }, {});
  values.pto = values.pto ? values.pto.split(",").map((name) => name.trim()).filter(Boolean) : [];
  writeStoredValue(onCallEditKey(date), JSON.stringify(values));
  if (notes) {
    writeStoredValue(onCallNotesKey(date), notes.value);
  }
}

// Render adjacent months and preserve the calendar scroll position during day edits.
export function renderSchedule(preservedScrollTop = null) {
  const target = document.querySelector("#schedule-list");
  const availableMonths = onCallMonths(state.data.schedule);

  if (!availableMonths.length) {
    target.innerHTML = renderEmpty("No on-call entries match.");
    return;
  }

  if (!state.onCallMonth) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    state.onCallMonth = availableMonths.some((month) => month.value === currentMonth) ? currentMonth : availableMonths[0].value;
  }

  const windowMonths = [shiftOnCallMonth(state.onCallMonth, -1), state.onCallMonth, shiftOnCallMonth(state.onCallMonth, 1)];
  windowMonths.forEach(ensureOnCallMonth);

  const items = filtered("schedule");
  const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date));
  const dropdownMonths = onCallMonths(state.data.schedule);
  const monthLabels = new Map(dropdownMonths.map((month) => [month.value, month.label]));

  target.innerHTML = `
    <div class="oncall-month-picker">
      <select id="oncall-month" data-oncall-month aria-label="Select month">
        ${dropdownMonths
          .map((month) => `<option value="${escapeHtml(month.value)}" ${month.value === state.onCallMonth ? "selected" : ""}>${escapeHtml(month.label)}</option>`)
          .join("")}
      </select>
    </div>
    <section class="oncall-calendar-window" aria-label="Scrollable on-call calendar" data-oncall-window>
      ${windowMonths
        .map((monthValue) => {
          const monthItems = sorted.filter((item) => item.date.startsWith(monthValue));
          return renderOnCallMonth(monthValue, monthLabels.get(monthValue), monthItems);
        })
        .join("")}
    </section>
    ${renderOnCallDayDialog()}
  `;

  target.querySelectorAll("[data-oncall-notes]").forEach((field) => {
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  });

  const calendarWindow = target.querySelector("[data-oncall-window]");
  const dayDialog = target.querySelector("[data-oncall-dialog]");
  if (dayDialog && !dayDialog.open) {
    dayDialog.showModal();
    dayDialog.querySelectorAll("[data-oncall-notes]").forEach((field) => {
      field.style.height = "auto";
      field.style.height = `${field.scrollHeight}px`;
    });
    dayDialog.addEventListener("cancel", () => {
      state.onCallDate = "";
      renderSchedule(calendarWindow.scrollTop);
    }, { once: true });
  }
  const selectedCalendar = target.querySelector(`[data-oncall-calendar-month="${CSS.escape(state.onCallMonth)}"]`);
  const selectedDay = state.onCallDate
    ? target.querySelector(`[data-oncall-date="${CSS.escape(state.onCallDate)}"]`)
    : target.querySelector('[aria-current="date"]');
  calendarWindow.dataset.shifting = "true";
  requestAnimationFrame(() => {
    const selectedDayPosition = selectedDay
      ? selectedDay.offsetTop - calendarWindow.offsetTop - Math.max(0, (calendarWindow.clientHeight - selectedDay.offsetHeight) / 2)
      : null;
    calendarWindow.scrollTop = preservedScrollTop ?? selectedDayPosition ?? selectedCalendar.offsetTop - calendarWindow.offsetTop;
    requestAnimationFrame(() => {
      calendarWindow.dataset.shifting = "false";
    });
  });
  calendarWindow.addEventListener("scroll", () => {
    if (calendarWindow.dataset.shifting === "true") {
      return;
    }
    const calendars = [...calendarWindow.querySelectorAll("[data-oncall-calendar-month]")];
    const position = calendarWindow.scrollTop + 80;
    const visibleCalendar = calendars.find((calendar) => calendar.offsetTop - calendarWindow.offsetTop + calendar.offsetHeight > position);
    if (visibleCalendar) {
      state.onCallMonth = visibleCalendar.dataset.oncallCalendarMonth;
      const monthSelect = target.querySelector("[data-oncall-month]");
      if ([...monthSelect.options].some((option) => option.value === state.onCallMonth)) {
        monthSelect.value = state.onCallMonth;
      }
    }

    if (calendarWindow.scrollTop < 120) {
      extendOnCallWindow(calendarWindow, -1);
    } else if (calendarWindow.scrollTop + calendarWindow.clientHeight > calendarWindow.scrollHeight - 120) {
      extendOnCallWindow(calendarWindow, 1);
    }
  });
}

export function renderOnCallMonth(monthValue, label, items) {
  return `
    <section class="oncall-calendar" data-oncall-calendar-month="${escapeHtml(monthValue)}" aria-labelledby="oncall-month-${escapeHtml(monthValue)}">
      <header class="oncall-calendar-header">
        <h3 id="oncall-month-${escapeHtml(monthValue)}">${escapeHtml(label)}</h3>
      </header>
      <div class="oncall-weekdays" aria-hidden="true">
        ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="oncall-calendar-grid">
        ${renderOnCallCalendarDays(items, monthValue)}
      </div>
    </section>
  `;
}

// Append or prepend a month while keeping existing dates in the same scroll position.
export function extendOnCallWindow(calendarWindow, direction) {
  if (calendarWindow.dataset.loading === "true") {
    return;
  }
  calendarWindow.dataset.loading = "true";

  const calendars = [...calendarWindow.querySelectorAll("[data-oncall-calendar-month]")];
  const edgeCalendar = direction < 0 ? calendars[0] : calendars[calendars.length - 1];
  const monthValue = shiftOnCallMonth(edgeCalendar.dataset.oncallCalendarMonth, direction);
  ensureOnCallMonth(monthValue);
  const monthItems = filtered("schedule")
    .filter((item) => item.date.startsWith(monthValue))
    .sort((a, b) => a.date.localeCompare(b.date));
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${monthValue}-01T12:00:00`));
  const previousHeight = calendarWindow.scrollHeight;

  edgeCalendar.insertAdjacentHTML(direction < 0 ? "beforebegin" : "afterend", renderOnCallMonth(monthValue, label, monthItems));
  if (direction < 0) {
    calendarWindow.scrollTop += calendarWindow.scrollHeight - previousHeight;
  }

  const monthSelect = document.querySelector("[data-oncall-month]");
  if (![...monthSelect.options].some((option) => option.value === monthValue)) {
    const option = new Option(label, monthValue);
    if (direction < 0) {
      monthSelect.prepend(option);
    } else {
      monthSelect.append(option);
    }
  }

  requestAnimationFrame(() => {
    calendarWindow.dataset.loading = "false";
  });
}

export function shiftOnCallMonth(monthValue, amount) {
  const [year, month] = monthValue.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return shifted.toISOString().slice(0, 7);
}

// Generate consistent sample coverage when a requested month has no baseline rows.
export function ensureOnCallMonth(monthValue) {
  const existingDates = new Set(state.data.schedule.map((item) => item.date));
  const [year, month] = monthValue.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const anchorDate = new Date(`${ON_CALL_ROTATION_ANCHOR}T12:00:00Z`);

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const day = new Date(Date.UTC(year, month - 1, dayNumber, 12));
    const dateValue = day.toISOString().slice(0, 10);
    if (existingDates.has(dateValue)) {
      continue;
    }
    const rotationOffset = Math.round((day - anchorDate) / 86400000);
    const personIndex = ((rotationOffset % ON_CALL_PEOPLE.length) + ON_CALL_PEOPLE.length) % ON_CALL_PEOPLE.length;
    const ptoIndex = ((rotationOffset % ON_CALL_PTO_ROTATION.length) + ON_CALL_PTO_ROTATION.length) % ON_CALL_PTO_ROTATION.length;
    state.data.schedule.push({
      date: dateValue,
      primary: ON_CALL_PEOPLE[personIndex],
      backup: ON_CALL_PEOPLE[(personIndex + 1) % ON_CALL_PEOPLE.length],
      pto: ON_CALL_PTO_ROTATION[ptoIndex],
    });
  }
}

export function onCallMonths(items) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  return [...new Set(items.map((item) => item.date.slice(0, 7)))].map((value) => ({
    value,
    label: formatter.format(new Date(`${value}-01T12:00:00`)),
  }));
}

export function renderOnCallCalendarDays(items, monthValue) {
  const firstDate = new Date(`${monthValue}-01T12:00:00`);
  const offset = (firstDate.getDay() + 6) % 7;
  const blanks = Array.from({ length: offset }, () => `<div class="oncall-day is-empty" aria-hidden="true"></div>`);
  const days = items.map((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    const isActive = state.onCallDate === item.date;
    const isToday = currentLocalDateValue() === item.date;
    const current = onCallDisplayItem(item);
    const savedNotes = readStoredValue(onCallNotesKey(item.date));
    const notes = savedNotes ?? defaultOnCallNotes(item);
    const preview = onCallNotePreview(notes);
    return `
      <article class="oncall-day ${isActive ? "is-active" : ""} ${isToday ? "is-today" : ""}" tabindex="0" role="button" data-oncall-date="${escapeHtml(item.date)}" ${isToday ? 'aria-current="date"' : ""}>
        <span class="oncall-date">${date.getDate()}</span>
        <p class="oncall-role"><b>IRM:</b> ${escapeHtml(current.primary)}</p>
        <p class="oncall-role"><b>BIRM:</b> ${escapeHtml(current.backup)}</p>
        <button class="oncall-note-trigger" type="button" data-oncall-open>
          ${escapeHtml(preview)}${preview ? "…" : "No notes…"}
        </button>
      </article>
    `;
  });

  return [...blanks, ...days].join("");
}

export function renderOnCallDayDialog() {
  if (!state.onCallDate) {
    return "";
  }

  const item = state.data.schedule.find((entry) => entry.date === state.onCallDate);
  if (!item) {
    return "";
  }

  const date = new Date(`${item.date}T12:00:00`);
  const fullDateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const current = onCallDisplayItem(item);
  const savedNotes = readStoredValue(onCallNotesKey(item.date));
  const notes = savedNotes ?? defaultOnCallNotes(item);

  return `
    <dialog class="oncall-day-dialog" data-oncall-dialog aria-labelledby="oncall-dialog-title">
      <div class="oncall-dialog-header">
        <div>
          <span class="oncall-date">${date.getDate()}</span>
          <h3 id="oncall-dialog-title">${escapeHtml(fullDateLabel)}</h3>
        </div>
        <button type="button" class="oncall-dialog-close" data-oncall-close aria-label="Close day details">Close</button>
      </div>
      <div class="oncall-dialog-fields">
        <label>IRM<input data-oncall-field="primary" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml(current.primary)}"></label>
        <label>BIRM<input data-oncall-field="backup" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml(current.backup)}"></label>
        <label>Out of Office<input data-oncall-field="pto" data-oncall-edit="${escapeHtml(item.date)}" value="${escapeHtml((current.pto || []).join(", "))}"></label>
        <label class="oncall-dialog-notes">Notes<textarea data-oncall-notes="${escapeHtml(item.date)}" rows="6">${escapeHtml(notes)}</textarea></label>
      </div>
    </dialog>
  `;
}

export function onCallNotePreview(notes) {
  const normalized = notes.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || normalized;
  return firstSentence.replace(/\.{3}$/, "").slice(0, 110);
}

export function defaultOnCallNotes(item) {
  const dayNumber = Math.floor(new Date(`${item.date}T12:00:00Z`).getTime() / 86400000);
  const firstNote = ON_CALL_OFFICE_NOTES[((dayNumber % ON_CALL_OFFICE_NOTES.length) + ON_CALL_OFFICE_NOTES.length) % ON_CALL_OFFICE_NOTES.length];
  const secondNote = ON_CALL_OFFICE_NOTES[((dayNumber + 5) % ON_CALL_OFFICE_NOTES.length + ON_CALL_OFFICE_NOTES.length) % ON_CALL_OFFICE_NOTES.length];
  return `${firstNote}\n\n${secondNote}`;
}

export function onCallNotesKey(date) {
  return `on-call-notes:${date}`;
}

export function onCallEditKey(date) {
  return `on-call-edit:${date}`;
}

// Layer saved coverage edits over the sample day record.
export function onCallDisplayItem(item) {
  const saved = readStoredValue(onCallEditKey(item.date));
  if (!saved) {
    return item;
  }

  try {
    return { ...item, ...JSON.parse(saved) };
  } catch {
    return item;
  }
}
