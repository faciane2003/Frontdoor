import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  await page.setViewport({ width: 1400, height: 800 });
  await page.goto("http://127.0.0.1:8000/", { waitUntil: "domcontentloaded" });
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
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
