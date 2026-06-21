/* Roostr Face-Off — higher/lower engine. No dependencies, no backend.
   Reuses the shared PUZZLES data (items stored ascending by the hidden value).
   State lives in localStorage under the "fo-" namespace, keyed to the local day. */
(function () {
  "use strict";

  /* —— configuration (mirrors js/game.js) —— */
  var EPOCH = new Date(2026, 5, 1);          // day No. 1 = June 1, 2026
  var CALLS = 4;                              // 5 contestants → 4 higher/lower calls
  var SITE_URL = "playroostr.com/faceoff";   // shown in the share text
  var PAYMENT_LINK = "";                      // Stripe Payment Link for Plus (leave "" until ready)

  /* Coffee tip jar (PayPal) */
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;

  /* Google AdSense — fill BOTH after approval; hidden while ADSENSE_CLIENT is "". */
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  /* —— daily selection ——
     Offset from the ranking game so the two games rarely share a day's puzzle. */
  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();
  var PUZZLE_NO = DAY + 1;
  var PICK = DAY + Math.floor(PUZZLES.length / 2);
  var puzzle = PUZZLES[((PICK % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];

  /* deterministic shuffle so everyone faces the same sequence */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sequence() {
    var rng = mulberry32(DAY * 40503 + 13);
    var arr = [0, 1, 2, 3, 4];
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  var SEQ = sequence();   // item indices, in the order they appear in the run

  /* —— persistent state —— */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  var state = load("fo-day", null);
  if (!state || state.day !== DAY) {
    state = { day: DAY, step: 1, calls: [], done: false };   // calls[i] = true/false for call i (1-indexed by step)
  }
  var stats = load("fo-stats", { played: 0, wins: 0, streak: 0, maxStreak: 0, lastDay: null, lastWinDay: null, dist: [0, 0, 0, 0, 0] });
  var isPlus = localStorage.getItem("po-plus") === "1";   // Plus is account-wide; shared with the ranking game
  if (isPlus) document.body.classList.add("plus");

  /* —— DOM —— */
  var $ = function (id) { return document.getElementById(id); };
  var champEl = $("fo-champ");
  var challEl = $("fo-challenger");
  var btnHigher = $("btn-higher");
  var btnLower = $("btn-lower");

  /* —— header / prompt —— */
  $("puzzle-no").textContent = "No. " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("prompt-title").textContent = puzzle.q;
  $("prompt-metric").textContent = puzzle.metric;
  $("fo-metric-inline").textContent = puzzle.metric.toLowerCase();

  function setCard(el, itemIdx, showValue) {
    el.querySelector(".fo-name").textContent = puzzle.items[itemIdx][0];
    var val = el.querySelector(".fo-value");
    if (showValue) {
      val.textContent = puzzle.items[itemIdx][1];
      val.classList.remove("mystery");
    } else {
      val.textContent = "?";
      val.classList.add("mystery");
    }
  }

  /* —— render the current matchup —— */
  function renderMatch() {
    champEl.classList.remove("fo-right", "fo-wrong", "fo-pop");
    challEl.classList.remove("fo-right", "fo-wrong", "fo-pop");
    var champItem = SEQ[state.step - 1];
    var challItem = SEQ[state.step];
    setCard(champEl, champItem, true);
    setCard(challEl, challItem, false);
    btnHigher.disabled = false;
    btnLower.disabled = false;
  }

  function lock(v) { btnHigher.disabled = v; btnLower.disabled = v; }

  /* —— a call —— */
  function call(higher) {
    if (state.done || btnHigher.disabled) return;
    lock(true);
    var champItem = SEQ[state.step - 1];
    var challItem = SEQ[state.step];
    var actuallyHigher = challItem > champItem;     // items stored ascending → larger index = higher value
    var correct = (higher === actuallyHigher);

    state.calls.push(correct);
    setCard(challEl, challItem, true);
    challEl.classList.add(correct ? "fo-right" : "fo-wrong", "fo-pop");
    renderBench();
    save("fo-day", state);

    var last = state.step >= CALLS;
    setTimeout(function () {
      if (last) {
        state.done = true;
        recordResult();
        save("fo-day", state);
        finish();
      } else {
        state.step++;
        renderMatch();
        save("fo-day", state);
      }
    }, last ? 700 : 850);
  }

  function score() { return state.calls.filter(Boolean).length; }
  function swept() { return state.done && score() === CALLS; }

  function recordResult() {
    if (stats.lastDay === DAY) return;            // already counted
    stats.played++;
    stats.dist[score()]++;
    if (swept()) {
      stats.wins++;
      stats.streak = (stats.lastWinDay === DAY - 1) ? stats.streak + 1 : 1;
      stats.lastWinDay = DAY;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    } else {
      stats.streak = 0;
    }
    stats.lastDay = DAY;
    save("fo-stats", stats);
  }

  /* —— bench rendering —— */
  function renderBench() {
    var att = $("attempts");
    att.innerHTML = "";
    for (var i = 0; i < CALLS; i++) {
      var p = document.createElement("i");
      p.className = "peck" + (i < state.calls.length ? " used" : "");
      att.appendChild(p);
    }
    var hist = $("history");
    hist.innerHTML = "";
    if (state.calls.length) {
      var row = document.createElement("div");
      row.className = "history-row";
      state.calls.forEach(function (ok) {
        var sq = document.createElement("i");
        sq.className = ok ? "h" : "x";
        row.appendChild(sq);
      });
      hist.appendChild(row);
    }
  }

  /* —— verdict —— */
  function finish() {
    lock(true);
    var s = score();
    var stampEl = $("verdict-stamp");
    if (swept()) {
      stampEl.textContent = "CLEAN SWEEP";
      stampEl.classList.remove("lost");
      $("verdict-sub").textContent = "Four for four — flawless. The true order:";
    } else {
      stampEl.textContent = s + " / " + CALLS;
      stampEl.classList.add("lost");
      var msg = s === 0 ? "Rough day at the fair." :
                s === 1 ? "One good call." :
                s === 2 ? "Split decision." :
                "So close — three of four.";
      $("verdict-sub").textContent = msg + " The true order:";
    }

    var rev = $("reveal");
    rev.innerHTML = "";
    puzzle.items.forEach(function (item, i) {
      var li = document.createElement("li");
      li.style.animationDelay = (0.1 + i * 0.09) + "s";
      li.innerHTML = "<b></b><span></span>";
      li.querySelector("b").textContent = item[0];
      li.querySelector("span").textContent = item[1];
      rev.appendChild(li);
    });
    $("factbox-text").textContent = puzzle.fact;
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
    startCountdown();
  }

  /* —— share —— */
  function shareText() {
    var s = score();
    var grid = state.calls.map(function (ok) { return ok ? "🟩" : "🟥"; }).join("");
    return "Roostr Face-Off #" + PUZZLE_NO + " — " + s + "/" + CALLS +
      (swept() ? " 🏅" : " 🐔") + "\n" + grid + "\n" + SITE_URL;
  }
  function share() {
    var text = shareText();
    var mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (navigator.share && mobile) {
      navigator.share({ text: text }).catch(function () { copyShare(text); });
    } else {
      copyShare(text);
    }
  }
  function copyShare(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Result copied — go brag"); },
        function () { window.prompt("Copy your result:", text); }
      );
    } else {
      window.prompt("Copy your result:", text);
    }
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

  /* —— stats modal —— */
  function renderStats() {
    $("st-played").textContent = stats.played;
    $("st-winpct").textContent = (stats.played ? Math.round(100 * stats.wins / stats.played) : 0) + "%";
    $("st-streak").textContent = stats.streak;
    $("st-max").textContent = stats.maxStreak;
    var dist = $("dist");
    dist.innerHTML = "";
    var max = Math.max.apply(null, stats.dist.concat(1));
    stats.dist.forEach(function (n, i) {
      var row = document.createElement("div");
      row.className = "dist-row";
      row.innerHTML = "<b>" + i + "</b><div class='dist-bar'>" + n + "</div>";
      row.querySelector(".dist-bar").style.width = Math.max(8, 100 * n / max) + "%";
      dist.appendChild(row);
    });
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
      "&item_name=" + encodeURIComponent(label) +
      "&amount=" + amount.toFixed(2) +
      "&currency_code=USD";
  }
  function buyCoffee() { window.open(coffeeUrl(coffeeAmount()), "_blank", "noopener"); }

  /* —— advertisements (Google AdSense) —— */
  function initAds() {
    var slot = $("ad-1");
    if (!slot) return;
    if (isPlus || !ADSENSE_CLIENT) { slot.hidden = true; return; }
    slot.innerHTML = "";
    slot.removeAttribute("aria-hidden");
    var loader = document.createElement("script");
    loader.async = true;
    loader.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_CLIENT;
    loader.crossOrigin = "anonymous";
    document.head.appendChild(loader);
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
    if (ADSENSE_SLOT) ins.setAttribute("data-ad-slot", ADSENSE_SLOT);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    slot.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
  }

  /* —— modals —— */
  var overlay = $("overlay");
  function openModal(id) {
    overlay.hidden = false;
    ["modal-help", "modal-stats", "modal-plus", "modal-about", "modal-coffee"].forEach(function (m) {
      $(m).hidden = m !== id;
    });
    if (id === "modal-stats") renderStats();
    if (id === "modal-coffee") updateCoffeeUI();
  }
  function closeModal() { overlay.hidden = true; }
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay || e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
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
    if (PAYMENT_LINK) {
      window.open(PAYMENT_LINK, "_blank", "noopener");
    } else {
      $("plus-note").textContent = "Plus isn't open for entries quite yet — check back soon!";
    }
  });
  $("btn-share").addEventListener("click", share);
  btnHigher.addEventListener("click", function () { call(true); });
  btnLower.addEventListener("click", function () { call(false); });

  /* —— toast —— */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* —— boot —— */
  renderMatch();
  renderBench();
  initAds();
  if (state.done) {
    finish();
  } else if (!localStorage.getItem("fo-seen")) {
    save("fo-seen", 1);
    openModal("modal-help");
  }
})();
