// Check current-day visibility, weekday order, and sticky headers during scrolling.
const { baseUrl, launchPuppeteer } = require("./browser.cjs");

(async () => {
  const browser = await launchPuppeteer();
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on("console", (message) => console.error(`browser:${message.type()}: ${message.text()}`));
    page.on("pageerror", (error) => console.error(`browser:error: ${error.message}`));
    await page.setViewport({ width: 1400, height: 800 });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-view="schedule"]');
    await page.click('[data-view="schedule"]');
    await page.waitForSelector("[data-oncall-window]");
    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = await page.evaluate(() => {
      const currentDay = document.querySelector('[aria-current="date"]');
      const calendarWindow = document.querySelector("[data-oncall-window]");
      const dayRect = currentDay?.getBoundingClientRect();
      const windowRect = calendarWindow?.getBoundingClientRect();
      const weekdayRect = currentDay?.closest("[data-oncall-calendar-month]")?.querySelector(".oncall-weekdays")?.getBoundingClientRect();
      const weekdayOrder = [...(document.querySelector(".oncall-weekdays")?.querySelectorAll("span") || [])].map((item) => item.textContent.trim());
      return {
        currentDate: currentDay?.dataset.oncallDate || null,
        selectedMonth: document.querySelector("[data-oncall-month]")?.value || null,
        dialogOpen: Boolean(document.querySelector("[data-oncall-dialog][open]")),
        dayTop: dayRect?.top ?? null,
        dayBottom: dayRect?.bottom ?? null,
        windowTop: windowRect?.top ?? null,
        windowBottom: windowRect?.bottom ?? null,
        weekdayTop: weekdayRect?.top ?? null,
        weekdaySticky: Boolean(weekdayRect && windowRect && Math.abs(weekdayRect.top - windowRect.top) < 2),
        weekdayOrder,
        visible: Boolean(dayRect && windowRect && dayRect.top >= windowRect.top && dayRect.bottom <= windowRect.bottom),
        scrollTop: calendarWindow?.scrollTop ?? null,
      };
    });

    // The weekday row begins below the month heading. Scroll it past the top of
    // its container before checking whether sticky positioning keeps it visible.
    const stickyAfterScroll = await page.evaluate(async () => {
      const calendarWindow = document.querySelector("[data-oncall-window]");
      const month = document.querySelector('[aria-current="date"]').closest("[data-oncall-calendar-month]");
      calendarWindow.dataset.shifting = "true";
      calendarWindow.scrollTop += 200;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pinned = Math.abs(month.querySelector(".oncall-weekdays").getBoundingClientRect().top - calendarWindow.getBoundingClientRect().top) < 2;
      calendarWindow.dataset.shifting = "false";
      return pinned;
    });
    console.log(JSON.stringify({ ...result, stickyAfterScroll }, null, 2));
    if (!result.visible || result.dialogOpen || !stickyAfterScroll || result.weekdayOrder.join(",") !== "Mon,Tue,Wed,Thu,Fri,Sat,Sun") process.exitCode = 1;

  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
