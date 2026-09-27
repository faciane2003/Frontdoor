const fs = require("fs");

const sourcePath = process.argv[2];
const outputPath = process.argv[3];
const source = fs.readFileSync(sourcePath, "utf8");
const excluded = new Set(["AK", "HI", "AS", "GU", "MP", "PR", "VI"]);
const states = [];

function simplify(points, tolerance = 0.025) {
  if (points.length <= 4) return points;
  const sqTolerance = tolerance * tolerance;
  const first = points[0];
  const last = points[points.length - 1];
  let furthestIndex = 0;
  let furthestDistance = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const dx = last[0] - first[0];
    const dy = last[1] - first[1];
    const length = dx * dx + dy * dy;
    const ratio = length ? Math.max(0, Math.min(1, ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) / length)) : 0;
    const offsetX = point[0] - (first[0] + ratio * dx);
    const offsetY = point[1] - (first[1] + ratio * dy);
    const distance = offsetX * offsetX + offsetY * offsetY;
    if (distance > furthestDistance) {
      furthestDistance = distance;
      furthestIndex = index;
    }
  }
  if (furthestDistance <= sqTolerance) return [first, last];
  return [...simplify(points.slice(0, furthestIndex + 1), tolerance).slice(0, -1), ...simplify(points.slice(furthestIndex), tolerance)];
}

for (const match of source.matchAll(/<Placemark\b[^>]*>[\s\S]*?<\/Placemark>/g)) {
  const block = match[0];
  const state = block.match(/<SimpleData name="STUSPS">([^<]+)</)?.[1];
  if (!state || excluded.has(state)) continue;
  const rings = [...block.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)]
    .map((coordinates) => simplify(coordinates[1].trim().split(/\s+/).map((pair) => {
      const [longitude, latitude] = pair.split(",").map(Number);
      return [Number(longitude.toFixed(3)), Number(latitude.toFixed(3))];
    })))
    .filter((ring) => ring.length > 2);
  states.push({ state, rings });
}

fs.writeFileSync(outputPath, `${JSON.stringify(states)}\n`);
console.log(`Wrote ${states.length} states to ${outputPath}.`);
