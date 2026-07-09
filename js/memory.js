/* Roostr Memory — a classic flip-and-match card game. No dependencies, no backend.
   Uses the FLAGS dataset as card faces. Three difficulties; fewest moves and best
   time per difficulty are saved in localStorage under the "mem-" namespace. */
(function () {
  "use strict";

  /* —— configuration —— */
  var LEVELS = {
    easy:   { pairs: 8,  cols: 4, label: "Easy" },
    medium: { pairs: 12, cols: 4, label: "Medium" },
    hard:   { pairs: 18, cols: 6, label: "Hard" }
  };
  var ORDER = ["easy", "medium", "hard"];

  var SITE_URL = "playroostr.com/memory";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  /* preferred, visually-distinct flags first; the rest of the dataset fills in */
  var PREFERRED = ["Japan", "Sweden", "Greece", "Germany", "United Kingdom", "United States",
    "Switzerland", "Ukraine", "Italy", "Bangladesh", "France", "Poland",
    "Ireland", "Netherlands", "Denmark", "Finland", "Norway", "Nigeria"];

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("mem-stats", { plays: 0, best: {} });
  if (!stats.best || typeof stats.best !== "object") stats.best = {};
  var level = load("mem-level", "easy");
  if (!LEVELS[level]) level = "easy";
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* build the face pool (distinct flags), preferred names first */
  var POOL = [];
  PREFERRED.forEach(function (n) {
    for (var i = 0; i < FLAGS.length; i++) if (FLAGS[i].name === n && POOL.indexOf(FLAGS[i]) < 0) { POOL.push(FLAGS[i]); break; }
  });
  FLAGS.forEach(function (f) { if (POOL.indexOf(f) < 0) POOL.push(f); });

  /* —— DOM —— */
  var gridEl = $("mem-grid");

  /* —— game state —— */
  var PAIRS, deck, faces, flipped, matchedCount, moves, lock, startMs, timer, playing;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function newGame() {
    stopTimer();
    var L = LEVELS[level];
    PAIRS = Math.min(L.pairs, POOL.length);
    faces = POOL.slice(0, PAIRS);
    deck = [];
    for (var f = 0; f < PAIRS; f++) { deck.push(f); deck.push(f); }
    shuffle(deck);
    flipped = [];
    matchedCount = 0;
    moves = 0;
    lock = false;
    startMs = 0;
    playing = true;
    $("verdict").hidden = true;
    gridEl.style.gridTemplateColumns = "repeat(" + L.cols + ", 1fr)";
    gridEl.className = "mem-grid" + (L.cols >= 6 ? " mem-grid--dense" : "");
    updateHud();
    updateLevelButtons();
    render();
  }

  function render() {
    gridEl.innerHTML = "";
    deck.forEach(function (faceIdx, pos) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-card";
      btn.dataset.pos = pos;
      btn.setAttribute("aria-label", "Card " + (pos + 1));
      btn.innerHTML =
        '<span class="mem-inner">' +
          '<span class="mem-cover">' +
            '<svg viewBox="0 0 100 100" aria-hidden="true">' +
              '<circle cx="50" cy="50" r="30" fill="var(--gold)"/>' +
              '<circle cx="50" cy="50" r="21" fill="var(--red)"/>' +
              '<text x="50" y="63" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="34" fill="var(--paper)">R</text>' +
            '</svg>' +
          '</span>' +
          '<span class="mem-face">' + faces[faceIdx].svg + '</span>' +
        '</span>';
      btn.addEventListener("click", function () { flip(pos, btn); });
      gridEl.appendChild(btn);
    });
  }

  function flip(pos, btn) {
    if (!playing || lock) return;
    if (btn.classList.contains("flipped") || btn.classList.contains("matched")) return;
    if (!startMs) startTimer();

    btn.classList.add("flipped");
    flipped.push({ pos: pos, el: btn });

    if (flipped.length === 2) {
      moves++;
      updateHud();
      var a = flipped[0], b = flipped[1];
      if (deck[a.pos] === deck[b.pos]) {
        a.el.classList.add("matched");
        b.el.classList.add("matched");
        flipped = [];
        matchedCount++;
        if (matchedCount === PAIRS) win();
      } else {
        lock = true;
        setTimeout(function () {
          a.el.classList.remove("flipped");
          b.el.classList.remove("flipped");
          flipped = [];
          lock = false;
        }, 820);
      }
    }
  }

  /* —— difficulty —— */
  function setLevel(next) {
    if (!LEVELS[next]) return;
    level = next;
    save("mem-level", level);
    newGame();
  }
  function updateLevelButtons() {
    var btns = document.querySelectorAll(".mem-level");
    btns.forEach(function (b) {
      var on = b.dataset.level === level;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }

  /* —— timer —— */
  function startTimer() {
    startMs = now();
    timer = setInterval(function () { $("mem-time").textContent = fmt(now() - startMs); }, 500);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function elapsedMs() { return startMs ? (now() - startMs) : 0; }
  function fmt(ms) {
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function updateHud() {
    $("mem-moves").textContent = moves;
    if (!startMs) $("mem-time").textContent = "0:00";
  }

  /* —— win —— */
  function win() {
    playing = false;
    stopTimer();
    var timeMs = elapsedMs();
    stats.plays++;
    var b = stats.best[level] || { moves: 0, timeMs: 0 };
    var pbMoves = false, pbTime = false;
    if (!b.moves || moves < b.moves) { b.moves = moves; pbMoves = true; }
    if (!b.timeMs || timeMs < b.timeMs) { b.timeMs = timeMs; pbTime = true; }
    stats.best[level] = b;
    save("mem-stats", stats);

    $("mem-final-moves").textContent = moves;
    $("mem-final-time").textContent = fmt(timeMs);
    $("mem-best").textContent = "best (" + LEVELS[level].label + "): " + b.moves + " moves · " + fmt(b.timeMs);
    $("mem-newbest").hidden = !(pbMoves || pbTime);
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function shareText() {
    return "Roostr Memory 🃏 (" + LEVELS[level].label + ") — matched all " + PAIRS +
      " pairs in " + moves + " moves (" + fmt(elapsedMs()) + ")! Beat me?\n" + SITE_URL;
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

  /* —— stats modal (current difficulty) —— */
  function renderStats() {
    var b = stats.best[level] || {};
    $("st-level").textContent = LEVELS[level].label;
    $("st-moves").textContent = b.moves || "—";
    $("st-time").textContent = b.timeMs ? fmt(b.timeMs) : "—";
    $("st-plays").textContent = stats.plays;
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
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  $("btn-help").addEventListener("click", function () { openModal("modal-help"); });
  $("btn-stats").addEventListener("click", function () { openModal("modal-stats"); });
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
  $("mem-new").addEventListener("click", newGame);
  $("btn-again").addEventListener("click", newGame);
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
  initAds();
  newGame();
  if (!localStorage.getItem("mem-seen")) { save("mem-seen", 1); openModal("modal-help"); }
})();
