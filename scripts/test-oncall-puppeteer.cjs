const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  page.on("console", (message) => console.error(`browser:${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => console.error(`browser:error: ${error.message}`));
  await page.setViewport({ width: 1400, height: 800 });
  await page.goto("http://127.0.0.1:8000/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-view="schedule"]');
  await page.waitForSelector("[data-oncall-window]");
  await page.click('[data-view="schedule"]');
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

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.visible || result.dialogOpen || !result.weekdaySticky || result.weekdayOrder.join(",") !== "Mon,Tue,Wed,Thu,Fri,Sat,Sun") process.exitCode = 1;
})();
