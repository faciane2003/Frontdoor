// Start an isolated static server, run checks in order, and close it even on failure.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./serve.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = await startStaticServer(0);
const baseUrl = `http://127.0.0.1:${server.address().port}/`;
const checks = [
  ["--check", "js/main.js"],
  ["--check", "SOC/js/reference.js"],
  ["scripts/validate-inline-js.js", "index.html", "SOC/index.html", "SOC/previous-interview-prep.html"],
  ["scripts/test-portal-playwright.cjs"],
  ["scripts/test-mail-playwright.cjs"],
  ["scripts/test-tools-puppeteer.cjs"],
  ["scripts/verify-cons-map.mjs"],
  ["scripts/test-oncall-puppeteer.cjs"],
];

try {
  for (const args of checks) {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: root, stdio: "inherit", env: { ...process.env, FRONTDOOR_BASE_URL: baseUrl },
      });
      child.once("error", reject);
      child.once("exit", resolve);
    });
    if (code !== 0) throw new Error(`Check failed: ${args.join(" ")}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
}
