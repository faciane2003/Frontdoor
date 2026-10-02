// Check inline JavaScript syntax without executing browser code.
// Lightweight syntax check for inline browser scripts without adding a test dependency.
const fs = require("fs");
const vm = require("vm");

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/validate-inline-js.js <html files>");
  process.exit(1);
}

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, index) => new vm.Script(match[1], { filename: `${file}:inline-${index + 1}` }));
  console.log(`${file}: ${scripts.length} inline script${scripts.length === 1 ? "" : "s"} valid`);
}
