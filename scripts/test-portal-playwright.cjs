// Exercise the shared portal behavior in isolated profiles, never the user's browser.
const assert = require("node:assert/strict");
const { baseUrl, launchPlaywright } = require("./browser.cjs");

(async () => {
  const browser = await launchPlaywright();
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    const requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(baseUrl);
    await page.locator("[data-dashboard-view]").first().waitFor();
    assert.equal(requests.some((url) => /oft-browser|xlsx|SOC\/index/.test(url)), false);
    assert.equal(await page.locator("[data-dashboard-view]").count(), 11);
    const bullets = await page.locator("[data-dashboard-view]").evaluateAll((cards) =>
      cards.map((card) => card.querySelectorAll('[role="listitem"]').length));
    assert.ok(bullets.every((count) => count === 3));
    assert.equal(await page.locator(".dashboard-card-footer, .dashboard-heading").count(), 0);
    const nav = await page.locator(".nav-item").allTextContents();
    assert.deepEqual(nav, [...nav].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));

    for (const [width, columns] of [[1400, 4], [900, 2], [390, 1]]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.locator(".dashboard-section .overview-cards").evaluate((grid) => ({
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.equal(layout.columns, columns);
      assert.equal(layout.overflow, false);
    }
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.locator("#global-search").fill("Outlook");
    await page.waitForFunction(() => document.querySelectorAll("[data-dashboard-view]").length === 1);
    await page.locator("#global-search").fill("");
    await page.waitForFunction(() => document.querySelectorAll("[data-dashboard-view]").length === 11);

    // Check both GitHub navigation buttons and cards against the real click handler.
    await page.locator('[data-view="github"]').click();
    for (const section of ["Repo", "Projects", "Teams", "People", "Security"]) {
      await page.locator(`.github-mini-nav [data-github-section="${section}"]`).click();
      assert.equal(await page.locator(`.github-mini-nav [data-github-section="${section}"]`).getAttribute("aria-current"), "page");
      assert.equal(await page.locator("#github-list .portal-section").getAttribute("aria-label"), section);
      assert.equal(await page.locator(".github-table tbody tr").count(), 10);
      await page.locator('.github-mini-nav [data-github-section="Overview"]').click();
      await page.locator(`.overview-card[data-github-section="${section}"]`).click();
      assert.equal(await page.locator("#github-list .portal-section").getAttribute("aria-label"), section);
    }
    await page.locator('[data-view="dashboard"]').click();

    // A canceled form adds nothing. Saved rows survive editing, refresh, and deletion.
    await page.locator('[data-dashboard-view="features"]').click();
    await page.locator('[data-table-add="features"]').click();
    await page.locator("[data-entry-cancel]").click();
    assert.equal(await page.locator('[data-table-delete="features"]').count(), 0);
    await page.locator('[data-table-add="features"]').click();
    await page.locator("#entry-title").fill("Feature test");
    await page.locator("#entry-description").fill("Original description");
    await page.locator('#table-row-form button[type="submit"]').click();
    await page.locator('[data-table-name="description"]').fill("Updated description");
    await page.locator('[data-table-name="description"]').press("Tab");
    await page.reload();
    await page.locator('[data-table-name="description"]').waitFor();
    assert.equal(await page.locator('[data-table-name="description"]').innerText(), "Updated description");
    await page.locator('[data-table-delete="features"]').click();
    await page.reload();
    await page.locator('[data-table-add="features"]').waitFor();
    assert.equal(await page.locator('[data-table-delete="features"]').count(), 0);

    // Opening the reference triggers its first request, then retains the same frame.
    await page.locator('[data-view="soc"]').click();
    const reference = page.frameLocator(".soc-frame");
    await reference.locator("#socSectionSelect").waitFor({ state: "attached" });
    await reference.locator(".toc-card").first().waitFor({ state: "attached" });
    assert.equal(requests.filter((url) => url.includes("SOC/index.html")).length, 1);
    await page.locator('[data-view="dashboard"]').click();
    await page.locator('[data-view="soc"]').click();
    assert.equal(requests.filter((url) => url.includes("SOC/index.html")).length, 1);
    await reference.locator("#socSectionSelect").evaluate((select) => {
      select.value = "network";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(await reference.locator('.tab-panel.active, .tab-panel.is-active').count() > 0, true);
    assert.deepEqual(errors, []);
    await page.close();

    // Legacy rows have no new metadata: restore legacy blanks while preserving
    // intentionally cleared fields and identities after new edits.
    const migrationPage = await browser.newPage();
    const legacyFeature = { id: "legacy-feature", title: "Legacy feature", description: "Saved before refactor" };
    const seed = await browser.newPage();
    await seed.goto(baseUrl);
    const sourceLinks = await seed.evaluate(async () => (await (await fetch("data/links.json")).json()));
    const training = await seed.evaluate(async () => (await (await fetch("data/training.json")).json())[0]);
    await seed.close();
    const original = sourceLinks[0];
    await migrationPage.addInitScript(({ original, legacyFeature, training }) => {
      if (localStorage.getItem("migration-seeded")) return;
      localStorage.setItem("editable-table:features", JSON.stringify([legacyFeature]));
      localStorage.setItem("editable-table:links", JSON.stringify([{ ...original, description: "" }]));
      localStorage.setItem("editable-table:training", JSON.stringify([training]));
      localStorage.setItem("migration-seeded", "true");
    }, { original, legacyFeature, training });
    await migrationPage.goto(baseUrl + "#features");
    await migrationPage.locator('[data-table-name="title"]').waitFor();
    assert.equal(await migrationPage.locator('[data-table-name="title"]').innerText(), legacyFeature.title);
    await migrationPage.locator('[data-view="links"]').click();
    await migrationPage.locator("[data-link-category-toggle]").first().click();
    const description = migrationPage.locator('#links [data-table-name="description"]');
    assert.equal(await description.innerText(), original.description);
    await description.fill("");
    await description.press("Tab");
    await migrationPage.reload();
    await migrationPage.locator("[data-link-category-toggle]").first().click();
    assert.equal(await description.innerText(), "");
    await migrationPage.locator('[data-view="training"]').click();
    await migrationPage.locator("[data-training-tier]").first().click();
    await migrationPage.locator("[data-training-area]").first().click();
    const standard = migrationPage.locator('#training [data-table-name="standard"]');
    await standard.fill("");
    await standard.press("Tab");
    const before = await migrationPage.evaluate(() => JSON.parse(localStorage.getItem("editable-table:training"))[0]._rowId);
    const id = migrationPage.locator('#training [data-table-name="id"]');
    await id.fill("RENAMED-001");
    await id.press("Tab");
    await migrationPage.reload();
    await migrationPage.locator("[data-training-tier]").first().click();
    await migrationPage.locator("[data-training-area]").first().click();
    assert.equal(await standard.innerText(), "");
    assert.equal(await id.innerText(), "RENAMED-001");
    const after = await migrationPage.evaluate(() => JSON.parse(localStorage.getItem("editable-table:training"))[0]._rowId);
    assert.equal(after, before);
    await migrationPage.close();

    // Failed optional resources can be retried without reloading the whole app.
    const retryPage = await browser.newPage();
    let attempts = 0;
    await retryPage.route("**/js/oft-browser.js*", (route) => {
      attempts += 1;
      return attempts === 1 ? route.abort() : route.continue();
    });
    await retryPage.goto(baseUrl + "#mail");
    await retryPage.locator("[data-mail-toggle]").first().click();
    const alerts = [];
    retryPage.on("dialog", async (dialog) => { alerts.push(dialog.message()); await dialog.dismiss(); });
    const downloadLink = retryPage.locator("[data-mail-download]:visible").first();
    const failedImport = retryPage.waitForEvent("dialog");
    await downloadLink.click();
    await failedImport;
    assert.match(alerts[0], /Unable to load Outlook tools/);
    const download = retryPage.waitForEvent("download");
    await downloadLink.click();
    await download;
    assert.equal(attempts, 2);
    await retryPage.close();

    // One missing catalog should not make unrelated sections unusable.
    const partialPage = await browser.newPage();
    await partialPage.route("**/data/cons.json", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
    await partialPage.goto(baseUrl + "#features");
    await partialPage.getByText(/Data load failed: Unable to load data\/cons.json/).waitFor();
    await partialPage.locator('[data-table-add="features"]').click();
    await partialPage.locator("#entry-title").fill("Available feature");
    await partialPage.locator("#entry-description").fill("Other sections still work");
    await partialPage.locator('#table-row-form button[type="submit"]').click();
    assert.equal(await partialPage.locator('[data-table-delete="features"]').count(), 1);
    await partialPage.close();

    // A failed save should keep the add dialog open and show a readable error.
    const blockedPage = await browser.newPage();
    await blockedPage.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "editable-table:features") throw new DOMException("Storage full", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await blockedPage.goto(baseUrl + "#features");
    await blockedPage.locator('[data-table-add="features"]').click();
    await blockedPage.locator("#entry-title").fill("Unsaved feature");
    await blockedPage.locator("#entry-description").fill("Storage failure check");
    await blockedPage.locator('#table-row-form button[type="submit"]').click();
    await blockedPage.getByRole("alert").waitFor();
    assert.equal(await blockedPage.locator("#table-row-dialog").evaluate((dialog) => dialog.open), true);
    assert.equal(await blockedPage.locator('[data-table-delete="features"]').count(), 0);
    await blockedPage.close();

    // Check the optional spreadsheet loader without making tests depend on a CDN.
    // The small test reader isolates loading/retry behavior from workbook parsing.
    const spreadsheetPage = await browser.newPage();
    let spreadsheetRequests = 0;
    await spreadsheetPage.route("**/xlsx.full.min.js", (route) => {
      spreadsheetRequests += 1;
      if (spreadsheetRequests === 1) return route.abort();
      return route.fulfill({
        contentType: "text/javascript",
        body: 'window.XLSX = { read: () => ({ Sheets: { first: {} }, SheetNames: ["first"] }), utils: { sheet_to_json: () => [["LAPTOP-001"], ["laptop-001"], ["LAPTOP-002"]] } };',
      });
    });
    await spreadsheetPage.goto(baseUrl + "#tools");
    const upload = spreadsheetPage.locator('[data-tools-file="standing"]');
    const file = { name: "list.csv", mimeType: "text/csv", buffer: Buffer.from("LAPTOP-001\nLAPTOP-002") };
    await upload.setInputFiles(file);
    await spreadsheetPage.locator('[data-tools-status="standing"]').filter({ hasText: /Unable to load spreadsheet tools/ }).waitFor();
    await upload.setInputFiles(file);
    await spreadsheetPage.waitForFunction(() => document.querySelectorAll('[data-tools-delete="standing"]').length === 2);
    await upload.setInputFiles(file);
    await spreadsheetPage.waitForFunction(() => document.querySelector('[data-tools-status="standing"]').textContent.includes("loaded"));
    assert.equal(spreadsheetRequests, 2);
    await spreadsheetPage.close();
    console.log("PASS: Dashboard, alphabetical navigation, Features, legacy storage, deliberate blanks, stable identities, reference loading, and optional-load errors.");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
