/* Roostr Mini Crossword — daily 5×5 crossword engine. No dependencies.
   Uses CROSSWORDS (js/crosswords.js); the day's puzzle is the same for
   everyone. Progress, streaks and best times live in the "cw-" namespace. */
(function () {
  "use strict";

  var EPOCH = new Date(2026, 5, 1);
  var SITE_URL = "playroostr.com/crossword";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();
  var PUZZLE_NO = DAY + 1;
  var PUZ = CROSSWORDS[((DAY % CROSSWORDS.length) + CROSSWORDS.length) % CROSSWORDS.length];

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("cw-stats", { plays: 0, best: 0, streak: 0, maxStreak: 0, lastWinDay: null });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— model —— */
  var grid = [];                                 // 25 chars or "#"
  for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) grid.push(PUZ.rows[r][c]);
  function solAt(i) { return grid[i]; }
  function isBlock(i) { return grid[i] === "#"; }

  /* word slots from clue data */
  function cellsFor(dir, n) {
    // find the numbered start cell, then walk
    var num = 0, startIdx = -1;
    for (var i = 0; i < 25; i++) {
      if (isBlock(i)) continue;
      var r = Math.floor(i / 5), c = i % 5;
      var sA = (c === 0 || isBlock(i - 1)) && c + 1 < 5 && !isBlock(i + 1);
      var sD = (r === 0 || isBlock(i - 5)) && r + 1 < 5 && !isBlock(i + 5);
      if (sA || sD) num++;
      if (num === n && ((dir === "A" && sA) || (dir === "D" && sD))) { startIdx = i; break; }
    }
    if (startIdx < 0) return [];
    var cells = [], step = dir === "A" ? 1 : 5;
    for (var j = startIdx; j < 25 && !isBlock(j); j += step) {
      cells.push(j);
      if (dir === "A" && j % 5 === 4) break;
    }
    return cells;
  }
  var SLOTS = [];
  PUZ.across.forEach(function (cl) { SLOTS.push({ dir: "A", n: cl.n, clue: cl.clue, cells: cellsFor("A", cl.n) }); });
  PUZ.down.forEach(function (cl) { SLOTS.push({ dir: "D", n: cl.n, clue: cl.clue, cells: cellsFor("D", cl.n) }); });
  function slotAt(idx, dir) {
    for (var s = 0; s < SLOTS.length; s++) {
      if (SLOTS[s].dir === dir && SLOTS[s].cells.indexOf(idx) >= 0) return SLOTS[s];
    }
    return null;
  }

  /* —— per-day state —— */
  var state = load("cw-day", null);
  if (!state || state.day !== DAY || !state.entries || state.entries.length !== 25) {
    state = { day: DAY, entries: new Array(25).fill(""), elapsed: 0, done: false };
  }
  function persist() { save("cw-day", state); }

  var sel = -1, dir = "A";

  /* —— DOM build —— */
  var gridEl = $("cw-grid");
  var cells = [];
  function buildGrid() {
    gridEl.innerHTML = "";
    var num = 0;
    for (var i = 0; i < 25; i++) {
      var d = document.createElement(isBlock(i) ? "div" : "button");
      d.className = "cw-cell" + (isBlock(i) ? " cw-block" : "");
      if (!isBlock(i)) {
        d.type = "button";
        var r = Math.floor(i / 5), c = i % 5;
        var sA = (c === 0 || isBlock(i - 1)) && c + 1 < 5 && !isBlock(i + 1);
        var sD = (r === 0 || isBlock(i - 5)) && r + 1 < 5 && !isBlock(i + 5);
        if (sA || sD) { num++; d.innerHTML = "<span class='cw-num'>" + num + "</span><span class='cw-letter'></span>"; }
        else d.innerHTML = "<span class='cw-letter'></span>";
        (function (idx) { d.addEventListener("click", function () { tap(idx); }); })(i);
      }
      gridEl.appendChild(d);
      cells.push(d);
    }
  }

  var KEYROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  function buildKeyboard() {
    var kb = $("cw-kb");
    kb.innerHTML = "";
    KEYROWS.forEach(function (row, ri) {
      var rEl = document.createElement("div");
      rEl.className = "kb-row";
      if (ri === 2) {
        var bs = document.createElement("button");
        bs.type = "button"; bs.className = "kb-key kb-wide"; bs.textContent = "⌫";
        bs.addEventListener("click", backspace);
        rEl.appendChild(bs);
      }
      row.split("").forEach(function (ch) {
        var k = document.createElement("button");
        k.type = "button"; k.className = "kb-key"; k.textContent = ch;
        k.addEventListener("click", function () { typeCh(ch); });
        rEl.appendChild(k);
      });
      kb.appendChild(rEl);
    });
  }

  /* —— interaction —— */
  function tap(idx) {
    if (state.done) return;
    if (sel === idx) dir = dir === "A" ? "D" : "A";
    else {
      sel = idx;
      if (!slotAt(idx, dir)) dir = dir === "A" ? "D" : "A";
    }
    render();
  }
  function typeCh(ch) {
    if (state.done || sel < 0) return;
    startTimer();
    state.entries[sel] = ch;
    cells[sel].classList.remove("cw-wrong");
    var slot = slotAt(sel, dir);
    if (slot) {
      var pos = slot.cells.indexOf(sel);
      // advance to next empty cell in slot, else next cell
      for (var k = pos + 1; k < slot.cells.length; k++) {
        if (!state.entries[slot.cells[k]]) { sel = slot.cells[k]; break; }
        if (k === slot.cells.length - 1) sel = slot.cells[Math.min(pos + 1, slot.cells.length - 1)];
      }
      if (pos === slot.cells.length - 1) { /* stay */ }
      else if (slot.cells.indexOf(sel) === pos) sel = slot.cells[pos + 1];
    }
    persist();
    render();
    checkDone();
  }
  function backspace() {
    if (state.done || sel < 0) return;
    if (state.entries[sel]) state.entries[sel] = "";
    else {
      var slot = slotAt(sel, dir);
      if (slot) {
        var pos = slot.cells.indexOf(sel);
        if (pos > 0) { sel = slot.cells[pos - 1]; state.entries[sel] = ""; }
      }
    }
    cells[sel].classList.remove("cw-wrong");
    persist();
    render();
  }
  document.addEventListener("keydown", function (e) {
    if (!$("overlay").hidden) { if (e.key === "Escape") closeModal(); return; }
    if (state.done) return;
    if (/^[a-zA-Z]$/.test(e.key)) { typeCh(e.key.toUpperCase()); e.preventDefault(); }
    else if (e.key === "Backspace") { backspace(); e.preventDefault(); }
    else if (e.key === " ") { dir = dir === "A" ? "D" : "A"; render(); e.preventDefault(); }
    else if (sel >= 0) {
      var r = Math.floor(sel / 5), c = sel % 5, t = sel;
      if (e.key === "ArrowLeft" && c > 0) t = sel - 1;
      else if (e.key === "ArrowRight" && c < 4) t = sel + 1;
      else if (e.key === "ArrowUp" && r > 0) t = sel - 5;
      else if (e.key === "ArrowDown" && r < 4) t = sel + 5;
      else return;
      e.preventDefault();
      if (!isBlock(t)) { sel = t; render(); }
    }
  });

  function checkDone() {
    for (var i = 0; i < 25; i++) {
      if (isBlock(i)) continue;
      if (!state.entries[i]) return;
    }
    /* full — correct? */
    var allOk = true;
    for (i = 0; i < 25; i++) {
      if (isBlock(i)) continue;
      if (state.entries[i] !== solAt(i)) { allOk = false; cells[i].classList.add("cw-wrong"); }
    }
    if (!allOk) { toast("Filled — but something's off. Red squares need another look."); return; }
    state.done = true;
    stopTimer();
    persist();
    win();
  }

  function render() {
    var slot = sel >= 0 ? slotAt(sel, dir) : null;
    for (var i = 0; i < 25; i++) {
      if (isBlock(i)) continue;
      var el = cells[i];
      el.querySelector(".cw-letter").textContent = state.entries[i] || "";
      el.classList.toggle("cw-sel", i === sel);
      el.classList.toggle("cw-word", !!(slot && slot.cells.indexOf(i) >= 0 && i !== sel));
    }
    $("cw-cluebar").textContent = slot ? (slot.n + (slot.dir === "A" ? "-Across" : "-Down") + ": " + slot.clue) : "Tap a square to start";
    /* clue lists */
    document.querySelectorAll(".cw-clue").forEach(function (li) {
      li.classList.toggle("active", !!(slot && li.dataset.dir === slot.dir && parseInt(li.dataset.n, 10) === slot.n));
    });
  }

  function buildClueLists() {
    var a = $("cw-across"), d = $("cw-down");
    PUZ.across.forEach(function (cl) {
      var li = document.createElement("li");
      li.className = "cw-clue"; li.dataset.dir = "A"; li.dataset.n = cl.n;
      li.innerHTML = "<b>" + cl.n + "</b> " + cl.clue;
      li.addEventListener("click", function () { dir = "A"; sel = cellsFor("A", cl.n)[0]; render(); });
      a.appendChild(li);
    });
    PUZ.down.forEach(function (cl) {
      var li = document.createElement("li");
      li.className = "cw-clue"; li.dataset.dir = "D"; li.dataset.n = cl.n;
      li.innerHTML = "<b>" + cl.n + "</b> " + cl.clue;
      li.addEventListener("click", function () { dir = "D"; sel = cellsFor("D", cl.n)[0]; render(); });
      d.appendChild(li);
    });
  }

  /* —— timer —— */
  var timer = null, runStart = 0;
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function elapsedMs() { return state.elapsed + (runStart ? nowMs() - runStart : 0); }
  function startTimer() {
    if (runStart || state.done) return;
    runStart = nowMs();
    timer = setInterval(function () {
      $("cw-time").textContent = fmt(elapsedMs());
      state.elapsed = elapsedMs(); runStart = nowMs(); persist();
    }, 1000);
  }
  function stopTimer() {
    if (runStart) { state.elapsed += nowMs() - runStart; runStart = 0; }
    if (timer) { clearInterval(timer); timer = null; }
  }
  function fmt(ms) {
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  /* —— win —— */
  function win() {
    var pb = false;
    if (stats.lastWinDay !== DAY) {
      stats.plays++;
      stats.streak = (stats.lastWinDay === DAY - 1) ? stats.streak + 1 : 1;
      stats.lastWinDay = DAY;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      if (!stats.best || state.elapsed < stats.best) { stats.best = state.elapsed; pb = true; }
      save("cw-stats", stats);
    }
    $("cw-final-time").textContent = fmt(state.elapsed);
    $("cw-best").textContent = stats.best ? fmt(stats.best) : "—";
    $("cw-newbest").hidden = !pb;
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
    startCountdown();
  }
  function shareText() {
    return "Roostr Mini Crossword #" + PUZZLE_NO + " ✏️ — solved in " + fmt(state.elapsed) + "! Race me:\n" + SITE_URL;
  }
  function share() {
    var text = shareText();
    var mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (navigator.share && mobile) navigator.share({ text: text }).catch(function () { copyShare(text); });
    else copyShare(text);
  }
  function copyShare(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("Result copied — go brag"); }, function () { window.prompt("Copy your result:", text); });
    else window.prompt("Copy your result:", text);
  }

  /* —— countdown —— */
  var cdTimer = null;
  function startCountdown() {
    function tick() {
      var now = new Date();
      var mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      var s = Math.max(0, Math.floor((mid - now) / 1000));
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      $("countdown").textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
      if (s === 0) location.reload();
    }
    if (cdTimer) clearInterval(cdTimer);
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* —— stats modal —— */
  function renderStats() {
    $("st-streak").textContent = stats.streak;
    $("st-max").textContent = stats.maxStreak;
    $("st-plays").textContent = stats.plays;
    $("st-best").textContent = stats.best ? fmt(stats.best) : "—";
  }

  /* —— coffee tip jar —— */
  var coffeeCups = 1;
  function coffeeAmount() {
    var raw = ($("cup-custom").value || "").replace(",", ".");
    var custom = parseFloat(raw);
    if (raw !== "" && !isNaN(custom) && custom >= 1) return Math.round(custom * 100) / 100;
    return Math.round(coffeeCups * COFFEE_MIN * 100) / 100;
  }
  function updateCoffeeUI() {
    $("cup-count").textContent = coffeeCups;
    var n = Math.min(coffeeCups, 5);
    $("cup-emoji").textContent = new Array(n + 1).join("☕");
    $("coffee-total").textContent = "$" + coffeeAmount().toFixed(2);
  }
  function coffeeUrl(amount) {
    var label = amount >= COFFEE_MIN * 2 ? "Coffees for Roostr" : "A coffee for Roostr";
    return "https://www.paypal.com/donate/?business=" + encodeURIComponent(PAYPAL_EMAIL) +
      "&item_name=" + encodeURIComponent(label) + "&amount=" + amount.toFixed(2) + "&currency_code=USD";
  }
  function buyCoffee() { window.open(coffeeUrl(coffeeAmount()), "_blank", "noopener"); }

  function initAds() {
    var slot = $("ad-1");
    if (!slot) return;
    if (isPlus || !ADSENSE_CLIENT) { slot.hidden = true; return; }
    slot.innerHTML = ""; slot.removeAttribute("aria-hidden");
    var loader = document.createElement("script");
    loader.async = true;
    loader.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_CLIENT;
    loader.crossOrigin = "anonymous";
    document.head.appendChild(loader);
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle"; ins.style.display = "block";
    ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
    if (ADSENSE_SLOT) ins.setAttribute("data-ad-slot", ADSENSE_SLOT);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    slot.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
  }

  /* —— modals —— */
  var overlay = $("overlay");
  function openModal(id) {
    overlay.hidden = false;
    ["modal-help", "modal-stats", "modal-plus", "modal-about", "modal-coffee"].forEach(function (m) { $(m).hidden = m !== id; });
    if (id === "modal-stats") renderStats();
    if (id === "modal-coffee") updateCoffeeUI();
  }
  function closeModal() { overlay.hidden = true; }
  overlay.addEventListener("click", function (e) { if (e.target === overlay || e.target.hasAttribute("data-close")) closeModal(); });
  $("btn-help").addEventListener("click", function () { openModal("modal-help"); });
  $("btn-stats").addEventListener("click", function () { openModal("modal-stats"); });
  $("btn-stats2").addEventListener("click", function () { openModal("modal-stats"); });
  $("btn-plus").addEventListener("click", function () { openModal("modal-plus"); });
  $("btn-plus2").addEventListener("click", function () { openModal("modal-plus"); });
  $("btn-about").addEventListener("click", function () { openModal("modal-about"); });
  $("btn-coffee").addEventListener("click", function () { openModal("modal-coffee"); });
  $("btn-coffee2").addEventListener("click", function () { openModal("modal-coffee"); });
  $("btn-coffee-buy").addEventListener("click", buyCoffee);
  $("cup-minus").addEventListener("click", function () { coffeeCups = Math.max(1, coffeeCups - 1); $("cup-custom").value = ""; updateCoffeeUI(); });
  $("cup-plus").addEventListener("click", function () { coffeeCups = Math.min(20, coffeeCups + 1); $("cup-custom").value = ""; updateCoffeeUI(); });
  $("cup-custom").addEventListener("input", updateCoffeeUI);
  $("btn-buy").addEventListener("click", function () {
    if (PAYMENT_LINK) window.open(PAYMENT_LINK, "_blank", "noopener");
    else $("plus-note").textContent = "Plus isn't open for entries quite yet — check back soon!";
  });
  $("btn-share").addEventListener("click", share);

  /* —— toast —— */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* —— boot —— */
  $("puzzle-no").textContent = "No. " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  buildGrid();
  buildKeyboard();
  buildClueLists();
  initAds();
  $("cw-time").textContent = fmt(state.elapsed);
  sel = -1;
  render();
  if (state.done) win();
  else if (!localStorage.getItem("cw-seen")) { save("cw-seen", 1); openModal("modal-help"); }
  window.addEventListener("pagehide", function () { stopTimer(); persist(); });
})();
