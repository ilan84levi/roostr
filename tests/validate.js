/* Puzzle data integrity check — run with: node tests/validate.js */
const PUZZLES = require("../js/puzzles.js");

let errors = 0;
const fail = (msg) => { errors++; console.error("FAIL:", msg); };

if (!Array.isArray(PUZZLES) || PUZZLES.length < 30) {
  fail(`expected a healthy puzzle pool, got ${PUZZLES && PUZZLES.length}`);
}

const seenTitles = new Set();
PUZZLES.forEach((p, idx) => {
  const where = `puzzle ${idx} ("${p && p.q}")`;
  for (const field of ["q", "metric", "lo", "hi", "fact"]) {
    if (!p[field] || typeof p[field] !== "string") fail(`${where}: missing ${field}`);
  }
  if (seenTitles.has(p.q + "|" + p.metric)) fail(`${where}: duplicate puzzle`);
  seenTitles.add(p.q + "|" + p.metric);

  if (!Array.isArray(p.items) || p.items.length !== 5) {
    fail(`${where}: needs exactly 5 items`);
    return;
  }
  const names = new Set();
  p.items.forEach(([name, display], i) => {
    if (!name || typeof name !== "string") fail(`${where} item ${i}: bad name`);
    if (!display || typeof display !== "string") fail(`${where} item ${i}: bad display value`);
    if (name.length > 40) fail(`${where} item ${i}: name too long for the card ("${name}")`);
    if (names.has(name)) fail(`${where}: duplicate item "${name}"`);
    names.add(name);
  });

  // numeric sanity: displays should be parseable and strictly ascending
  const nums = p.items.map(([, d]) => {
    const cleaned = d.replace(/[≈,+]/g, "").replace("−", "-");
    const m = cleaned.match(/-?\d+(\.\d+)?/);
    let v = m ? parseFloat(m[0]) : NaN;
    if (/billion/i.test(d)) v *= 1e9;
    else if (/million/i.test(d)) v *= 1e6;
    return v;
  });
  if (nums.some(Number.isNaN)) {
    fail(`${where}: unparseable display value (${p.items.map(x => x[1]).join(" | ")})`);
  } else {
    for (let i = 1; i < nums.length; i++) {
      if (!(nums[i] > nums[i - 1])) {
        fail(`${where}: values not strictly ascending at position ${i} ` +
          `(${p.items[i - 1][1]} → ${p.items[i][1]})`);
      }
    }
  }
});

if (errors) {
  console.error(`\n${errors} problem(s) in ${PUZZLES.length} puzzles.`);
  process.exit(1);
} else {
  console.log(`OK — ${PUZZLES.length} puzzles, all 5-item, unique, strictly orderable.`);
}
