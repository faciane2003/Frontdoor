// Share browser launch settings and the test server address across checks.
const { chromium } = require("playwright");
const puppeteer = require("puppeteer");

const baseUrl = process.env.FRONTDOOR_BASE_URL || "http://127.0.0.1:8000/";
const launchPlaywright = () => chromium.launch({ headless: true });
const launchPuppeteer = () => puppeteer.launch({
  headless: true,
  executablePath: chromium.executablePath(),
});

module.exports = { baseUrl, launchPlaywright, launchPuppeteer };
