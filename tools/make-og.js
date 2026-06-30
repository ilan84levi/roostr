/* Regenerate the per-game social share cards (og-*.png, 1200×630).
   Renders HTML templates with a headless Chromium/Chrome binary — no design
   tool or network needed. Usage:  node tools/make-og.js
   Override the browser with:       CHROME=/path/to/chrome node tools/make-og.js */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const FLAGS = require(path.join(ROOT, "js", "flags.js"));

/* —— locate a Chromium/Chrome binary —— */
function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  const candidates = [];
  const pw = "/opt/pw-browsers";
  if (fs.existsSync(pw)) {
    fs.readdirSync(pw).filter(d => d.startsWith("chromium-")).forEach(d => {
      candidates.push(path.join(pw, d, "chrome-linux", "chrome"));
    });
  }
  candidates.push(
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  );
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error("No Chromium/Chrome found. Set CHROME=/path/to/chrome.");
}
const CHROME = findChrome();

/* —— brand palette —— */
const C = {
  paper: "#f3ead8", paperDeep: "#e7dcc2", card: "#fbf6ea", ink: "#2a2118",
  inkSoft: "#5b4f3f", red: "#b5402a", teal: "#20655a", gold: "#c89a3f", goldPale: "#ecd9a8",
  rock: "#9a8f7d", rockDeep: "#6f6757", rockDark: "#564f42"
};

const rosette = `<svg viewBox="0 0 100 100" width="86" height="86" aria-hidden="true">
  <circle cx="50" cy="42" r="30" fill="${C.red}"/>
  <g fill="${C.paper}"><circle cx="50" cy="12" r="7"/><circle cx="76" cy="21" r="7"/><circle cx="80" cy="50" r="7"/><circle cx="68" cy="66" r="7"/><circle cx="32" cy="66" r="7"/><circle cx="20" cy="50" r="7"/><circle cx="24" cy="21" r="7"/></g>
  <path d="M38 60l-9 30 21-13 21 13-9-30z" fill="${C.teal}"/>
  <circle cx="50" cy="42" r="22" fill="${C.red}"/><circle cx="50" cy="42" r="15" fill="${C.paper}"/>
  <text x="50" y="52" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="22" fill="${C.ink}">1</text>
</svg>`;

function miniCard(label, stub, opts) {
  opts = opts || {};
  const bg = opts.bg || C.card, fg = opts.fg || C.ink, stubBg = opts.stubBg || C.goldPale, stubFg = opts.stubFg || C.ink;
  return `<div style="display:flex;align-items:stretch;background:${bg};color:${fg};border:3px solid ${C.ink};border-radius:6px;box-shadow:4px 6px 0 rgba(42,33,24,.28);min-width:300px;height:74px;overflow:hidden">
    <div style="flex:none;width:64px;display:flex;align-items:center;justify-content:center;background:${stubBg};color:${stubFg};border-right:3px dashed ${C.ink};font:900 30px Georgia,serif">${stub}</div>
    <div style="flex:1;display:flex;align-items:center;padding:0 18px;font:700 24px Karla,Arial,sans-serif">${label}</div>
  </div>`;
}

/* —— per-game motifs —— */
function motifRanking() {
  return `<div style="display:flex;flex-direction:column;gap:12px;transform:rotate(-1deg)">
    ${miniCard("Mercury", "1")}${miniCard("Earth", "2")}${miniCard("Jupiter", "3")}
  </div>`;
}
function motifFaceoff() {
  return `<div style="display:flex;align-items:center;gap:22px">
    <div style="width:210px">${miniCard("63 mg", "▲", { bg: C.teal, fg: C.card, stubBg: C.gold, stubFg: C.card })}</div>
    <div style="font:900 italic 34px Georgia,serif;color:${C.inkSoft}">vs</div>
    <div style="width:210px">${miniCard("? ? ?", "▼", { bg: C.card, stubBg: C.gold, stubFg: C.card })}</div>
  </div>`;
}
function motifPick() {
  return `<div style="display:flex;flex-direction:column;gap:12px">
    ${miniCard("Walrus", "?")}
    <div style="transform:scale(1.04)">${miniCard("Blue whale", "★", { bg: C.teal, fg: C.card, stubBg: C.gold, stubFg: C.card })}</div>
    ${miniCard("Vending machine", "?")}
  </div>`;
}
function motifFlags() {
  const want = ["Japan", "Greece", "France", "Sweden", "Germany", "Italy"];
  const picks = want.map(n => FLAGS.find(f => f.name === n)).filter(Boolean);
  const list = (picks.length >= 6 ? picks : FLAGS).slice(0, 6);
  const cells = list.map(f =>
    `<div style="width:150px;height:100px;border:3px solid ${C.ink};border-radius:5px;overflow:hidden;box-shadow:3px 5px 0 rgba(42,33,24,.28);line-height:0">${f.svg}</div>`
  ).join("");
  return `<div style="display:grid;grid-template-columns:repeat(3,150px);gap:18px;transform:rotate(-1deg)">${cells}</div>`;
}
function motifRun() {
  var rooster = '<g transform="translate(86,74) scale(1.8)">' +
    '<path d="M4 14 q-14 -10 -8 10 q4 -6 12 -2 z" fill="' + C.teal + '"/>' +
    '<ellipse cx="22" cy="20" rx="18" ry="15" fill="' + C.red + '" stroke="' + C.ink + '" stroke-width="2"/>' +
    '<ellipse cx="20" cy="21" rx="9" ry="9" fill="' + C.red + '" opacity=".55"/>' +
    '<circle cx="35" cy="10" r="9" fill="' + C.red + '" stroke="' + C.ink + '" stroke-width="2"/>' +
    '<circle cx="31" cy="1" r="3" fill="' + C.redDeep + '"/><circle cx="36" cy="-1" r="3.4" fill="' + C.redDeep + '"/><circle cx="41" cy="1" r="3" fill="' + C.redDeep + '"/>' +
    '<path d="M43 9 L53 11 L43 14 z" fill="' + C.gold + '"/>' +
    '<circle cx="43" cy="17" r="2.4" fill="' + C.redDeep + '"/>' +
    '<circle cx="37" cy="8" r="2" fill="' + C.ink + '"/>' +
    '<path d="M16 33 l3 8 M24 33 l3 8" stroke="' + C.gold + '" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    '</g>';
  var bale = '<rect x="236" y="166" width="58" height="36" rx="6" fill="' + C.gold + '" stroke="' + C.redDeep + '" stroke-width="2"/>' +
    '<line x1="236" y1="180" x2="294" y2="180" stroke="rgba(147,49,31,.5)" stroke-width="1.5"/>' +
    '<line x1="236" y1="192" x2="294" y2="192" stroke="rgba(147,49,31,.5)" stroke-width="1.5"/>';
  var ground = '<line x1="0" y1="202" x2="360" y2="202" stroke="' + C.ink + '" stroke-width="2.5"/>';
  var dashes = '', x; for (x = 4; x < 360; x += 22) dashes += '<line x1="' + x + '" y1="210" x2="' + (x + 10) + '" y2="210" stroke="rgba(42,33,24,.35)" stroke-width="2"/>';
  var bunt = '', i, bc = [C.red, C.gold, C.teal]; for (i = 0; i < 14; i++) { var bx = i * 28; bunt += '<path d="M' + bx + ' 8 L' + (bx + 18) + ' 8 L' + (bx + 9) + ' 22 z" fill="' + bc[i % 3] + '"/>'; }
  var svg = '<svg viewBox="0 0 360 250" width="360" height="250">' + bunt + ground + dashes + bale + rooster + '</svg>';
  return '<div style="width:382px;height:266px;border:3px solid ' + C.ink + ';border-radius:8px;background:linear-gradient(to bottom,#eaf0ef,' + C.paper + ');box-shadow:4px 6px 0 rgba(42,33,24,.28);overflow:hidden;display:flex;align-items:center;justify-content:center;transform:rotate(-1deg)">' + svg + '</div>';
}
function motifDodge() {
  function ship(cx, cy) {
    return '<g transform="translate(' + cx + ',' + cy + ')">' +
      '<path d="M-13 -5 L-24 0 L-13 5 z" fill="' + C.gold + '"/>' +
      '<path d="M-6 -7 L-17 -16 L-4 -4 z" fill="' + C.teal + '"/>' +
      '<path d="M-6 7 L-17 16 L-4 4 z" fill="' + C.teal + '"/>' +
      '<path d="M20 0 Q2 -13 -14 -9 Q-8 0 -14 9 Q2 13 20 0 z" fill="' + C.red + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      '<circle cx="4" cy="0" r="4.6" fill="' + C.gold + '" stroke="' + C.ink + '" stroke-width="1.5"/>' +
      '</g>';
  }
  function rock(cx, cy, r) {
    var v = [0.8, 1.05, 0.85, 1.1, 0.78, 1.0, 0.9, 1.08, 0.82], pts = [];
    for (var k = 0; k < 9; k++) { var a = k / 9 * 6.283; pts.push((cx + Math.cos(a) * r * v[k]).toFixed(1) + ',' + (cy + Math.sin(a) * r * v[k]).toFixed(1)); }
    return '<polygon points="' + pts.join(' ') + '" fill="' + C.rock + '" stroke="' + C.rockDark + '" stroke-width="2"/>' +
      '<circle cx="' + (cx - r * 0.25) + '" cy="' + (cy - r * 0.15) + '" r="' + (r * 0.2) + '" fill="' + C.rockDeep + '"/>';
  }
  var stars = '';
  var sx = [20, 60, 110, 150, 200, 250, 300, 330, 40, 90, 170, 220, 280, 320, 130, 70, 240, 190];
  var sy = [30, 80, 50, 120, 40, 90, 60, 140, 160, 200, 180, 30, 210, 110, 230, 150, 160, 70];
  for (var i = 0; i < sx.length; i++) stars += '<rect x="' + sx[i] + '" y="' + sy[i] + '" width="' + (i % 4 === 0 ? 2.4 : 1.6) + '" height="' + (i % 4 === 0 ? 2.4 : 1.6) + '" fill="#f3ead8" opacity="' + (0.5 + (i % 3) * 0.2) + '"/>';
  var svg = '<svg viewBox="0 0 360 250" width="360" height="250">' +
    '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16243a"/><stop offset="1" stop-color="#0b1422"/></linearGradient></defs>' +
    '<rect width="360" height="250" fill="url(#sky)"/>' + stars +
    rock(250, 70, 30) + rock(300, 180, 22) + rock(170, 200, 16) +
    ship(95, 120) + '</svg>';
  return '<div style="width:382px;height:266px;border:3px solid ' + C.ink + ';border-radius:8px;box-shadow:4px 6px 0 rgba(42,33,24,.28);overflow:hidden;display:flex;align-items:center;justify-content:center;transform:rotate(-1deg)">' + svg + '</div>';
}

/* —— card template —— */
function card(cfg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:${C.paper};font-family:Karla,Arial,sans-serif;position:relative;overflow:hidden}
  .grain{position:absolute;inset:0;opacity:.5;pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.13 0 0 0 0 0.09 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
  .frame{position:absolute;inset:24px;border:4px double ${C.ink};border-radius:8px}
  .wrap{position:absolute;inset:24px;display:flex;align-items:center;justify-content:space-between;padding:40px 64px 130px}
  .left{max-width:560px}
  .brand{display:flex;align-items:center;gap:16px;margin-bottom:26px}
  .brand .word{font:900 italic 46px Georgia,serif;letter-spacing:-1px;color:${C.ink}}
  .brand .word .ac{color:${C.red}}
  .kicker{font:700 20px Karla,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:${C.red};margin-bottom:10px}
  .title{font:900 italic 80px Georgia,serif;line-height:.98;color:${C.ink};margin-bottom:16px}
  .tag{font:400 26px Karla,Arial,sans-serif;color:${C.inkSoft};line-height:1.4;max-width:480px}
  .foot{position:absolute;left:64px;bottom:108px;display:flex;align-items:center;gap:14px}
  .url{font:900 26px Georgia,serif;color:${C.card};background:${C.teal};padding:8px 20px;border-radius:999px}
  .foot .by{font:400 20px Karla,Arial,sans-serif;color:${C.inkSoft}}
  .right{display:flex;align-items:center;justify-content:center;flex:none}
  </style></head><body>
  <div class="grain"></div><div class="frame"></div>
  <div class="wrap">
    <div class="left">
      <div class="brand">${rosette}<span class="word">R<span class="ac">oo</span>str</span></div>
      <div class="kicker">${cfg.kicker}</div>
      <div class="title">${cfg.title}</div>
      <div class="tag">${cfg.tag}</div>
    </div>
    <div class="right">${cfg.motif}</div>
  </div>
  <div class="foot"><span class="url">playroostr.com</span><span class="by">free to play · no sign-up</span></div>
  </body></html>`;
}

const GAMES = [
  { out: "og-ranking.png", kicker: "The daily ranking game", title: "Ranking",
    tag: "Drag five real things into order by a hidden measure. Three tries.", motif: motifRanking() },
  { out: "og-faceoff.png", kicker: "The daily higher-or-lower game", title: "Face-Off",
    tag: "Higher or lower on the hidden measure? Four calls, one run.", motif: motifFaceoff() },
  { out: "og-pick.png", kicker: "The daily spot-the-biggest game", title: "Top Pick",
    tag: "Tap the one with the most — or least. Three quick rounds.", motif: motifPick() },
  { out: "og-flags.png", kicker: "The daily flag quiz", title: "Guess<br>the Flag",
    tag: "Name the country from its flag. Five rounds, one guess each.", motif: motifFlags() },
  { out: "og-run.png", kicker: "The free rooster runner", title: "Coop Run",
    tag: "Jump the rooster over hay bales and fences. How far can you run?", motif: motifRun() },
  { out: "og-dodge.png", kicker: "The free space dodger", title: "Astro Coop",
    tag: "Fly a spaceship and dodge the asteroids. How far can you get?", motif: motifDodge() }
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "roostr-og-"));
console.log("Using Chrome:", CHROME);
for (const g of GAMES) {
  const htmlPath = path.join(tmp, g.out.replace(".png", ".html"));
  const outPath = path.join(ROOT, g.out);
  fs.writeFileSync(htmlPath, card(g));
  execFileSync(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--window-size=1200,630",
    "--default-background-color=00000000", "--screenshot=" + outPath, htmlPath
  ], { stdio: "ignore" });
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log("wrote", g.out, "(" + kb + " KB)");
}
console.log("done.");
