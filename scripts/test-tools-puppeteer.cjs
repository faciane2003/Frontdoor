// Check normalized Intune comparisons and the Links table with an isolated browser.
const path = require("path");
const { baseUrl, launchPuppeteer } = require("./browser.cjs");

(async () => {
  const browser = await launchPuppeteer();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 800 });
    page.setDefaultTimeout(10000);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-view="tools"]');
    await page.$eval('[data-view="tools"]', (button) => button.click());

    const standingInput = await page.$('[data-tools-file="standing"]');
    await standingInput.uploadFile(path.join(__dirname, "fixtures", "intune-standing.txt"));
    await page.waitForFunction(() => document.querySelectorAll('.intune-list-panel:has([data-tools-file="standing"]) .intune-item').length === 2);

    const newInput = await page.$('[data-tools-file="new"]');
    await newInput.uploadFile(path.join(__dirname, "fixtures", "intune-new.txt"));
    await page.waitForFunction(() => document.querySelectorAll('.intune-list-panel:has([data-tools-file="new"]) .intune-item').length === 2);

    const result = await page.evaluate(() => ({
      standing: [...document.querySelectorAll('.intune-list-panel:has([data-tools-file="standing"]) .intune-item')].map((item) => item.querySelector("td")?.textContent.trim()),
      newItems: [...document.querySelectorAll('.intune-list-panel:has([data-tools-file="new"]) .intune-item')].map((item) => ({
        value: item.querySelector("td")?.textContent.trim(),
        status: item.querySelector(".intune-status")?.textContent.trim(),
      })),
    }));

    await page.$eval('[data-view="links"]', (button) => button.click());
    const linkResult = await page.evaluate(() => ({
      headers: [...document.querySelectorAll(".resource-table thead th")].map((item) => item.textContent.trim()),
      categoryLabels: [...document.querySelectorAll(".link-category-toggle")].map((item) => item.textContent.trim()),
    }));

    console.log(JSON.stringify({ ...result, links: linkResult }, null, 2));

    const correctComparison = result.standing.length === 2
      && result.newItems[0]?.status === "Match"
      && result.newItems[1]?.status === "Not in standing list";
    const correctLinks = linkResult.headers.join(",") === "Resource,URL,Description,"
      && linkResult.categoryLabels.every((label) => !/\d+\s+links?$/i.test(label));
    if (!correctComparison || !correctLinks) process.exitCode = 1;

  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
