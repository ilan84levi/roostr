/* Roostr Sudoku — daily sudoku engine. No dependencies, no backend.
   Uses SudokuGen (js/sudokugen.js) to build the same puzzle for everyone each
   day, per difficulty. Progress, stats and streaks live in localStorage under
   the "su-" namespace. */
(function () {
  "use strict";

  /* —— configuration —— */
  var EPOCH = new Date(2026, 5, 1);          // day No. 1 = June 1, 2026
  var LEVELS = {
    easy:   { holes: 38, off: 17, label: "Easy" },
    medium: { holes: 46, off: 41, label: "Medium" },
    hard:   { holes: 52, off: 89, label: "Hard" }
  };
  var SITE_URL = "playroostr.com/sudoku";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  /* —— daily selection —— */
  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();
  var PUZZLE_NO = DAY + 1;

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("su-stats", { plays: 0, best: {}, streak: 0, maxStreak: 0, lastWinDay: null });
  if (!stats.best || typeof stats.best !== "object") stats.best = {};
  var level = load("su-level", "easy");
  if (!LEVELS[level]) level = "easy";
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— puzzle + per-day state —— */
  var puzzle, solution, state;

  function buildPuzzle() {
    var L = LEVELS[level];
    var gen = SudokuGen.generate(DAY * 2654435761 + L.off, L.holes);
    puzzle = gen.puzzle;
    solution = gen.solution;
  }

  function stateKey() { return "su-day-" + level; }
  function freshState() {
    var entries = [];
    var notes = [];
    for (var i = 0; i < 81; i++) { entries.push(puzzle[i]); notes.push(0); }
    return { day: DAY, entries: entries, notes: notes, mistakes: 0, elapsed: 0, done: false };
  }
  function loadState() {
    state = load(stateKey(), null);
    if (!state || state.day !== DAY || !state.entries || state.entries.length !== 81) state = freshState();
    if (!state.notes || state.notes.length !== 81) { state.notes = []; for (var i = 0; i < 81; i++) state.notes.push(0); }
  }
  function persist() { save(stateKey(), state); }

  /* —— DOM —— */
  var gridEl = $("su-grid");
  var padEl = $("su-pad");
  var selected = -1;
  var notesMode = false;
  var cells = [];

  $("puzzle-no").textContent = "No. " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  function buildGrid() {
    gridEl.innerHTML = "";
    cells = [];
    for (var i = 0; i < 81; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "su-cell";
      var r = SudokuGen.rowOf(i), c = SudokuGen.colOf(i);
      if (c === 2 || c === 5) b.classList.add("su-br");
      if (r === 2 || r === 5) b.classList.add("su-bb");
      (function (idx) { b.addEventListener("click", function () { select(idx); }); })(i);
      gridEl.appendChild(b);
      cells.push(b);
    }
  }

  function buildPad() {
    padEl.innerHTML = "";
    for (var d = 1; d <= 9; d++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "su-key";
      b.innerHTML = "<b>" + d + "</b><span class='su-left' id='su-left-" + d + "'></span>";
      (function (dd) { b.addEventListener("click", function () { input(dd); }); })(d);
      padEl.appendChild(b);
    }
  }

  function counts() {
    var n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 81; i++) if (state.entries[i]) n[state.entries[i]]++;
    return n;
  }

  function render() {
    var n = counts();
    for (var i = 0; i < 81; i++) {
      var b = cells[i];
      var v = state.entries[i];
      var given = puzzle[i] !== 0;
      b.classList.toggle("su-given", given);
      b.classList.toggle("su-wrong", !given && v !== 0 && v !== solution[i]);
      b.classList.toggle("su-sel", i === selected);
      var sameUnit = selected >= 0 && i !== selected &&
        (SudokuGen.rowOf(i) === SudokuGen.rowOf(selected) ||
         SudokuGen.colOf(i) === SudokuGen.colOf(selected) ||
         SudokuGen.boxOf(i) === SudokuGen.boxOf(selected));
      b.classList.toggle("su-unit", sameUnit);
      var selVal = selected >= 0 ? state.entries[selected] : 0;
      b.classList.toggle("su-same", selVal !== 0 && v === selVal && i !== selected);
      if (v) {
        b.textContent = v;
      } else if (state.notes[i]) {
        var html = "<span class='su-notes'>";
        for (var d = 1; d <= 9; d++) html += "<i>" + ((state.notes[i] & (1 << d)) ? d : "") + "</i>";
        b.innerHTML = html + "</span>";
      } else {
        b.textContent = "";
      }
    }
    for (var d2 = 1; d2 <= 9; d2++) {
      var left = 9 - n[d2];
      var el = $("su-left-" + d2);
      if (el) el.textContent = left > 0 ? left : "✓";
    }
    $("su-mist").textContent = state.mistakes;
    $("btn-notes").classList.toggle("active", notesMode);
    $("btn-notes").setAttribute("aria-pressed", notesMode ? "true" : "false");
  }

  function select(idx) {
    if (state.done) return;
    selected = idx;
    render();
  }

  function clearNotesFor(idx, d) {
    var r = SudokuGen.rowOf(idx), c = SudokuGen.colOf(idx), bx = SudokuGen.boxOf(idx);
    for (var i = 0; i < 81; i++) {
      if (SudokuGen.rowOf(i) === r || SudokuGen.colOf(i) === c || SudokuGen.boxOf(i) === bx) {
        state.notes[i] &= ~(1 << d);
      }
    }
  }

  function input(d) {
    if (state.done || selected < 0) return;
    if (puzzle[selected] !== 0) return;                 // givens are sacred
    startTimer();
    if (notesMode) {
      if (state.entries[selected] === 0) state.notes[selected] ^= (1 << d);
    } else {
      if (state.entries[selected] === d) { state.entries[selected] = 0; }
      else {
        state.entries[selected] = d;
        state.notes[selected] = 0;
        if (d !== solution[selected]) state.mistakes++;
        else clearNotesFor(selected, d);
      }
    }
    persist();
    render();
    checkWin();
  }

  function erase() {
    if (state.done || selected < 0 || puzzle[selected] !== 0) return;
    state.entries[selected] = 0;
    state.notes[selected] = 0;
    persist();
    render();
  }

  function checkWin() {
    for (var i = 0; i < 81; i++) if (state.entries[i] !== solution[i]) return;
    state.done = true;
    stopTimer();
    state.elapsed = elapsedMs();
    persist();
    win();
  }

  /* —— timer —— */
  var timer = null, runStart = 0;
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function elapsedMs() { return state.elapsed + (runStart ? nowMs() - runStart : 0); }
  function startTimer() {
    if (runStart || state.done) return;
    runStart = nowMs();
    timer = setInterval(function () {
      $("su-time").textContent = fmt(elapsedMs());
      if (Math.floor(elapsedMs() / 1000) % 10 === 0) { state.elapsed = elapsedMs(); runStart = nowMs(); persist(); }
    }, 500);
  }
  function stopTimer() {
    if (runStart) { state.elapsed = state.elapsed + (nowMs() - runStart); runStart = 0; }
    if (timer) { clearInterval(timer); timer = null; }
  }
  function fmt(ms) {
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  /* —— win —— */
  function recordWin() {
    stats.plays++;
    var b = stats.best[level] || 0;
    var t = state.elapsed;
    var pb = false;
    if (!b || t < b) { stats.best[level] = t; pb = true; }
    if (stats.lastWinDay !== DAY) {
      stats.streak = (stats.lastWinDay === DAY - 1) ? stats.streak + 1 : 1;
      stats.lastWinDay = DAY;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    }
    save("su-stats", stats);
    return pb;
  }
  function win() {
    var pb = recordWin();
    $("su-final-time").textContent = fmt(state.elapsed);
    $("su-final-mist").textContent = state.mistakes;
    $("su-best").textContent = "best (" + LEVELS[level].label + "): " + fmt(stats.best[level]);
    $("su-newbest").hidden = !pb;
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
    startCountdown();
  }

  function shareText() {
    var mist = state.mistakes;
    return "Roostr Sudoku #" + PUZZLE_NO + " (" + LEVELS[level].label + ") 🧩 — solved in " +
      fmt(state.elapsed) + (mist ? " with " + mist + " mistake" + (mist > 1 ? "s" : "") : ", flawless") +
      "! Your turn:\n" + SITE_URL;
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
      $("countdown").textContent =
        (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
      if (s === 0) location.reload();
    }
    if (cdTimer) clearInterval(cdTimer);
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* —— difficulty —— */
  function setLevel(next) {
    if (!LEVELS[next] || next === level) return;
    stopTimer();
    persist();
    level = next;
    save("su-level", level);
    boot(false);
  }
  function updateLevelButtons() {
    document.querySelectorAll(".mem-level").forEach(function (b) {
      var on = b.dataset.level === level;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }

  /* —— keyboard —— */
  document.addEventListener("keydown", function (e) {
    if (!$("overlay").hidden) { if (e.key === "Escape") closeModal(); return; }
    if (state.done) return;
    if (e.key >= "1" && e.key <= "9") { input(parseInt(e.key, 10)); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { erase(); e.preventDefault(); }
    else if (e.key === "n" || e.key === "N") { notesMode = !notesMode; render(); }
    else if (selected >= 0) {
      var r = SudokuGen.rowOf(selected), c = SudokuGen.colOf(selected);
      if (e.key === "ArrowUp" && r > 0) { select(selected - 9); e.preventDefault(); }
      else if (e.key === "ArrowDown" && r < 8) { select(selected + 9); e.preventDefault(); }
      else if (e.key === "ArrowLeft" && c > 0) { select(selected - 1); e.preventDefault(); }
      else if (e.key === "ArrowRight" && c < 8) { select(selected + 1); e.preventDefault(); }
    }
  });

  /* —— stats modal —— */
  function renderStats() {
    $("st-streak").textContent = stats.streak;
    $("st-max").textContent = stats.maxStreak;
    $("st-plays").textContent = stats.plays;
    $("st-beste").textContent = stats.best.easy ? fmt(stats.best.easy) : "—";
    $("st-bestm").textContent = stats.best.medium ? fmt(stats.best.medium) : "—";
    $("st-besth").textContent = stats.best.hard ? fmt(stats.best.hard) : "—";
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
  $("btn-erase").addEventListener("click", erase);
  $("btn-notes").addEventListener("click", function () { notesMode = !notesMode; render(); });
  document.querySelectorAll(".mem-level").forEach(function (b) {
    b.addEventListener("click", function () { setLevel(b.dataset.level); });
  });

  /* —— toast —— */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* —— boot —— */
  function boot(firstBoot) {
    buildPuzzle();
    loadState();
    selected = -1;
    $("verdict").hidden = true;
    $("su-time").textContent = fmt(state.elapsed);
    updateLevelButtons();
    render();
    if (state.done) win();
    if (firstBoot && !localStorage.getItem("su-seen")) { save("su-seen", 1); openModal("modal-help"); }
  }
  buildGrid();
  buildPad();
  initAds();
  boot(true);
  window.addEventListener("pagehide", function () { stopTimer(); persist(); });
})();
