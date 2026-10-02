// Check monthly pins, event summaries, and vacancy messages in a real browser.
import { baseUrl, launchPuppeteer } from "./browser.cjs";

const browser = await launchPuppeteer();

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  await page.setViewport({ width: 1400, height: 800 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.$eval('[data-view="cons"]', (button) => button.click());
  await page.waitForSelector("[data-cons-month]");

  const results = await page.evaluate(async () => {
    const slider = document.querySelector("[data-cons-month]");
    const observations = [];
    for (let index = 0; index <= Number(slider.max); index += 1) {
      slider.value = String(index);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 15));
      observations.push({
        month: document.querySelector("[data-cons-month-label]").textContent,
        visiblePins: document.querySelectorAll(".cons-map-pin:not([hidden])").length,
        callouts: document.querySelectorAll(".cons-map-callout").length,
        vacant: !document.querySelector("[data-cons-vacancy]").hasAttribute("hidden"),
      });
    }
    return observations;
  });

  if (new Set(results.map((item) => item.visiblePins)).size < 2) {
    throw new Error(`Map pins did not change across months: ${JSON.stringify(results)}`);
  }
  if (results.some((item) => item.vacant !== (item.visiblePins === 0))) {
    throw new Error(`Vacant state did not match visible pin counts: ${JSON.stringify(results)}`);
  }
  if (results.some((item) => item.callouts !== item.visiblePins)) {
    throw new Error(`Event summaries did not match visible pins: ${JSON.stringify(results)}`);
  }
  for (const month of ["January 2027", "February 2027", "March 2027"]) {
    const observation = results.find((item) => item.month.includes(month));
    if (!observation || observation.visiblePins === 0) {
      throw new Error(`Missing newly populated conference month: ${month}`);
    }
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
