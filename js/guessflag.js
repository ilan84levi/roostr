/* Roostr Guess the Flag — daily flag quiz engine. No dependencies, no backend.
   Uses the FLAGS dataset (inline-SVG flags). Five rounds a day, four choices
   each. State lives in localStorage under the "gf-" namespace. */
(function () {
  "use strict";

  /* —— configuration (mirrors js/game.js) —— */
  var EPOCH = new Date(2026, 5, 1);          // day No. 1 = June 1, 2026
  var ROUNDS = 5;
  var CHOICES = 4;
  var SITE_URL = "playroostr.com/flags";     // shown in the share text
  var PAYMENT_LINK = "";

  /* Coffee tip jar (PayPal) */
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;

  /* Google AdSense — fill BOTH after approval; hidden while ADSENSE_CLIENT is "". */
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
  var N = FLAGS.length;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(indices, rng) {
    var arr = indices.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* Build the day's five rounds: a correct flag + three plausible distractors,
     preferring the same region, then filling from the rest. */
  function buildRounds() {
    var rng = mulberry32(DAY * 2654435761 + 101);
    var all = [];
    for (var i = 0; i < N; i++) all.push(i);
    var answers = shuffled(all, rng).slice(0, ROUNDS);

    return answers.map(function (ans) {
      var region = FLAGS[ans].region;
      var sameRegion = shuffled(all.filter(function (i) {
        return i !== ans && FLAGS[i].region === region;
      }), rng);
      var other = shuffled(all.filter(function (i) {
        return i !== ans && FLAGS[i].region !== region;
      }), rng);
      var pool = sameRegion.concat(other);
      var distractors = pool.slice(0, CHOICES - 1);
      var options = shuffled([ans].concat(distractors), rng);
      return { answer: ans, options: options };
    });
  }
  var ROUND_DATA = buildRounds();

  /* —— persistent state —— */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  var state = load("gf-day", null);
  if (!state || state.day !== DAY) {
    state = { day: DAY, round: 0, picks: [], done: false };   // picks[r] = true/false
  }
  var stats = load("gf-stats", { played: 0, wins: 0, streak: 0, maxStreak: 0, lastDay: null, lastWinDay: null, dist: [0, 0, 0, 0, 0, 0] });
  var isPlus = localStorage.getItem("po-plus") === "1";   // Plus is account-wide
  if (isPlus) document.body.classList.add("plus");

  /* —— DOM —— */
  var $ = function (id) { return document.getElementById(id); };
  var stageEl = $("flag-stage");
  var choicesEl = $("flag-choices");

  /* —— header —— */
  $("puzzle-no").textContent = "No. " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("round-total").textContent = ROUNDS;

  /* —— render the current round —— */
  function renderRound() {
    var r = curRound();
    $("round-no").textContent = state.round + 1;
    stageEl.innerHTML = FLAGS[r.answer].svg;

    choicesEl.className = "flag-choices";
    choicesEl.innerHTML = "";
    r.options.forEach(function (flagIdx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flag-choice";
      btn.dataset.flag = flagIdx;
      btn.textContent = FLAGS[flagIdx].name;
      btn.addEventListener("click", function () { pick(flagIdx); });
      choicesEl.appendChild(btn);
    });
  }
  function curRound() { return ROUND_DATA[state.round]; }

  /* —— a pick —— */
  function pick(flagIdx) {
    if (state.done || choicesEl.classList.contains("revealed")) return;
    var r = curRound();
    var correct = flagIdx === r.answer;
    state.picks.push(correct);

    choicesEl.classList.add("revealed");
    var btns = choicesEl.querySelectorAll(".flag-choice");
    btns.forEach(function (b) {
      var idx = parseInt(b.dataset.flag, 10);
      if (idx === r.answer) b.classList.add("flag-correct");
      else if (idx === flagIdx) b.classList.add("flag-wrong");
    });
    renderBench();
    save("gf-day", state);

    var last = state.round >= ROUNDS - 1;
    setTimeout(function () {
      if (last) {
        state.done = true;
        recordResult();
        save("gf-day", state);
        finish();
      } else {
        state.round++;
        renderRound();
        save("gf-day", state);
      }
    }, 1050);
  }

  function score() { return state.picks.filter(Boolean).length; }
  function swept() { return state.done && score() === ROUNDS; }

  function recordResult() {
    if (stats.lastDay === DAY) return;
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
    save("gf-stats", stats);
  }

  /* —— bench rendering —— */
  function renderBench() {
    var att = $("attempts");
    att.innerHTML = "";
    for (var i = 0; i < ROUNDS; i++) {
      var p = document.createElement("i");
      p.className = "peck" + (i < state.picks.length ? " used" : "");
      att.appendChild(p);
    }
    var hist = $("history");
    hist.innerHTML = "";
    if (state.picks.length) {
      var row = document.createElement("div");
      row.className = "history-row";
      state.picks.forEach(function (ok) {
        var sq = document.createElement("i");
        sq.className = ok ? "h" : "x";
        row.appendChild(sq);
      });
      hist.appendChild(row);
    }
  }

  /* —— verdict —— */
  function finish() {
    var s = score();
    var stampEl = $("verdict-stamp");
    if (swept()) {
      stampEl.textContent = "GLOBETROTTER";
      stampEl.classList.remove("lost");
      $("verdict-sub").textContent = "Five for five — you know your flags!";
    } else {
      stampEl.textContent = s + " / " + ROUNDS;
      stampEl.classList.add("lost");
      var msg = s === 0 ? "Tough map today." :
                s <= 2 ? "A few to brush up on." :
                "Solid — almost there.";
      $("verdict-sub").textContent = msg + " Today's flags:";
    }
    if (swept()) $("verdict-sub").textContent += " Today's flags:";

    var rev = $("reveal");
    rev.innerHTML = "";
    ROUND_DATA.forEach(function (r, i) {
      var f = FLAGS[r.answer];
      var li = document.createElement("li");
      li.style.animationDelay = (0.1 + i * 0.1) + "s";
      li.innerHTML = '<span class="flag-mini"></span><span class="flag-mini-name"></span>' +
        '<span class="flag-mark"></span>';
      li.querySelector(".flag-mini").innerHTML = f.svg;
      li.querySelector(".flag-mini-name").textContent = f.name;
      li.querySelector(".flag-mark").textContent = state.picks[i] ? "✓" : "✗";
      li.querySelector(".flag-mark").className = "flag-mark " + (state.picks[i] ? "ok" : "no");
      rev.appendChild(li);
    });
    $("factbox-text").textContent = FLAGS[ROUND_DATA[0].answer].fact;
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
    startCountdown();
  }

  /* —— share —— */
  function shareText() {
    var s = score();
    var grid = state.picks.map(function (ok) { return ok ? "🟩" : "🟥"; }).join("");
    return "Roostr Guess the Flag #" + PUZZLE_NO + " — " + s + "/" + ROUNDS +
      (swept() ? " 🏅" : " 🚩") + "\n" + grid + "\n" + SITE_URL;
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
  renderRound();
  renderBench();
  initAds();
  if (state.done) {
    finish();
  } else if (!localStorage.getItem("gf-seen")) {
    save("gf-seen", 1);
    openModal("modal-help");
  }
})();
