// Browser-level smoke test for the CONs monthly map scrubber.
const pages = await (await fetch("http://localhost:9223/json")).json();
const page = pages.find((item) => item.type === "page" && item.url.includes("localhost:8000"));
if (!page) throw new Error("CONs browser page was not found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

const expression = `(async () => {
  const slider = document.querySelector('[data-cons-month]');
  if (!slider) throw new Error('CONs month slider was not rendered');
  const results = [];
  for (let index = 0; index <= Number(slider.max); index += 1) {
    slider.value = String(index);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 15));
    results.push({
      month: document.querySelector('[data-cons-month-label]').textContent,
      visiblePins: document.querySelectorAll('.cons-map-pin:not([hidden])').length,
      vacant: !document.querySelector('[data-cons-vacancy]').hasAttribute('hidden'),
    });
  }
  return results;
})()`;

socket.send(JSON.stringify({
  id: 1,
  method: "Runtime.evaluate",
  params: { expression, awaitPromise: true, returnByValue: true },
}));

const response = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Browser response timed out")), 10_000);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== 1) return;
    clearTimeout(timer);
    resolve(message);
  };
});

socket.close();
if (response.result?.exceptionDetails) {
  throw new Error(response.result.exceptionDetails.text || "Browser evaluation failed");
}
const results = response.result.result.value;
if (!Array.isArray(results) || new Set(results.map((item) => item.visiblePins)).size < 2) {
  throw new Error(`Map pins did not change across months: ${JSON.stringify(results)}`);
}
if (results.some((item) => item.vacant !== (item.visiblePins === 0))) {
  throw new Error(`Vacant state did not match visible pin counts: ${JSON.stringify(results)}`);
}
console.log(JSON.stringify(results, null, 2));
