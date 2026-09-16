/* Roostr Nonogram — daily 10×10 picross engine. No dependencies.
   Uses NonoGen (js/nonogen.js); every puzzle is line-logic solvable with a
   unique solution, and the day's grid is the same for everyone. Progress and
   streaks live in the "ng-" localStorage namespace. */
(function () {
  "use strict";

  var EPOCH = new Date(2026, 5, 1);
  var SITE_URL = "playroostr.com/nonogram";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";
  var N = 10;

  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();
  var PUZZLE_NO = DAY + 1;
  var PUZ = NonoGen.generate(DAY);

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("ng-stats", { plays: 0, best: 0, streak: 0, maxStreak: 0, lastWinDay: null });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* marks: 0 unknown, 1 filled, 2 X */
  var state = load("ng-day", null);
  if (!state || state.day !== DAY || !state.marks || state.marks.length !== N * N) {
    state = { day: DAY, marks: new Array(N * N).fill(0), mistakes: 0, elapsed: 0, done: false };
  }
  function persist() { save("ng-day", state); }

  var mode = "fill";                              // "fill" | "x"
  var cells = [];

  /* —— build board —— */
  function buildBoard() {
    var wrap = $("ng-board");
    wrap.innerHTML = "";
    var table = document.createElement("div");
    table.className = "ng-table";
    /* corner + column clues */
    var corner = document.createElement("div");
    corner.className = "ng-corner";
    table.appendChild(corner);
    for (var c = 0; c < N; c++) {
      var cc = document.createElement("div");
      cc.className = "ng-colclue" + (c % 5 === 4 && c < N - 1 ? " ng-gapr" : "");
      cc.innerHTML = PUZ.colClues[c].join("<br>");
      table.appendChild(cc);
    }
    for (var r = 0; r < N; r++) {
      var rc = document.createElement("div");
      rc.className = "ng-rowclue" + (r % 5 === 4 && r < N - 1 ? " ng-gapb" : "");
      rc.textContent = PUZ.rowClues[r].join(" ");
      table.appendChild(rc);
      for (c = 0; c < N; c++) {
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "ng-cell" +
          (c % 5 === 4 && c < N - 1 ? " ng-gapr" : "") +
          (r % 5 === 4 && r < N - 1 ? " ng-gapb" : "");
        (function (idx) { cell.addEventListener("click", function () { tap(idx); }); })(r * N + c);
        table.appendChild(cell);
        cells[r * N + c] = cell;
      }
    }
    wrap.appendChild(table);
  }

  function tap(idx) {
    if (state.done) return;
    startTimer();
    var m = state.marks[idx];
    if (mode === "fill") {
      if (m === 1) return;
      if (PUZ.solution[idx] === 1) state.marks[idx] = 1;
      else {                                       // wrong fill → auto-X + mistake
        state.marks[idx] = 2;
        state.mistakes++;
        flashWrong(idx);
      }
    } else {
      if (m === 1) return;
      state.marks[idx] = m === 2 ? 0 : 2;          // toggle X
    }
    persist();
    render();
    checkWin();
  }
  function flashWrong(idx) {
    cells[idx].classList.add("ng-wrongflash");
    setTimeout(function () { cells[idx].classList.remove("ng-wrongflash"); }, 500);
  }

  function lineDone(cellsIdx) {
    for (var i = 0; i < cellsIdx.length; i++) {
      var idx = cellsIdx[i];
      if (PUZ.solution[idx] === 1 && state.marks[idx] !== 1) return false;
    }
    return true;
  }
  function render() {
    for (var i = 0; i < N * N; i++) {
      var el = cells[i];
      el.classList.toggle("ng-fill", state.marks[i] === 1);
      el.classList.toggle("ng-x", state.marks[i] === 2);
      el.textContent = state.marks[i] === 2 ? "×" : "";
    }
    /* dim completed clue lines */
    var clues = document.querySelectorAll(".ng-rowclue");
    for (var r = 0; r < N; r++) {
      var rowIdx = []; for (var c = 0; c < N; c++) rowIdx.push(r * N + c);
      clues[r].classList.toggle("ng-doneline", lineDone(rowIdx));
    }
    var cclues = document.querySelectorAll(".ng-colclue");
    for (c = 0; c < N; c++) {
      var colIdx = []; for (r = 0; r < N; r++) colIdx.push(r * N + c);
      cclues[c].classList.toggle("ng-doneline", lineDone(colIdx));
    }
    $("ng-mist").textContent = state.mistakes;
    $("btn-fillmode").classList.toggle("active", mode === "fill");
    $("btn-xmode").classList.toggle("active", mode === "x");
  }

  function checkWin() {
    for (var i = 0; i < N * N; i++) {
      if (PUZ.solution[i] === 1 && state.marks[i] !== 1) return;
    }
    state.done = true;
    stopTimer();
    persist();
    win();
  }

  $("btn-fillmode").addEventListener("click", function () { mode = "fill"; render(); });
  $("btn-xmode").addEventListener("click", function () { mode = "x"; render(); });

  /* —— timer —— */
  var timer = null, runStart = 0;
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function elapsedMs() { return state.elapsed + (runStart ? nowMs() - runStart : 0); }
  function startTimer() {
    if (runStart || state.done) return;
    runStart = nowMs();
    timer = setInterval(function () {
      $("ng-time").textContent = fmt(elapsedMs());
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
      save("ng-stats", stats);
    }
    $("ng-final-time").textContent = fmt(state.elapsed);
    $("ng-final-mist").textContent = state.mistakes;
    $("ng-best").textContent = stats.best ? fmt(stats.best) : "—";
    $("ng-newbest").hidden = !pb;
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
    startCountdown();
  }
  function shareText() {
    var mist = state.mistakes;
    return "Roostr Nonogram #" + PUZZLE_NO + " 🖼️ — solved in " + fmt(state.elapsed) +
      (mist ? " with " + mist + " mistake" + (mist > 1 ? "s" : "") : ", flawless") + "! Your grid:\n" + SITE_URL;
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
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
    else if ($("overlay").hidden && (e.key === "x" || e.key === "X")) { mode = mode === "x" ? "fill" : "x"; render(); }
  });
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
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* —— boot —— */
  $("puzzle-no").textContent = "No. " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  buildBoard();
  initAds();
  $("ng-time").textContent = fmt(state.elapsed);
  render();
  if (state.done) win();
  else if (!localStorage.getItem("ng-seen")) { save("ng-seen", 1); openModal("modal-help"); }
  window.addEventListener("pagehide", function () { stopTimer(); persist(); });
})();
