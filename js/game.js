/* Pecking Order — game engine. No dependencies, no backend.
   State lives in localStorage; daily puzzle keyed to the local calendar day. */
(function () {
  "use strict";

  /* —— configuration —— */
  var EPOCH = new Date(2026, 5, 1);          // puzzle No. 1 = June 1, 2026
  var MAX_GUESSES = 3;
  var PAYMENT_LINK = "";                      // paste a Stripe Payment Link URL to go live
  var SITE_URL = "peckingorder.game";         // shown in share text — update after deploy

  /* —— daily puzzle selection —— */
  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();
  var PUZZLE_NO = DAY + 1;
  var puzzle = PUZZLES[((DAY % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];

  /* deterministic shuffle so everyone starts from the same arrangement */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function startingOrder() {
    var rng = mulberry32(DAY * 2654435761 + 7);
    var arr = [0, 1, 2, 3, 4];
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    var sorted = arr.every(function (v, k) { return v === k; });
    if (sorted) arr.push(arr.shift());
    return arr;
  }

  /* —— persistent state —— */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  var state = load("po-day", null);
  if (!state || state.day !== DAY) {
    state = { day: DAY, order: startingOrder(), guesses: [], done: false, win: false };
  }
  var stats = load("po-stats", { played: 0, wins: 0, streak: 0, maxStreak: 0, lastDay: null, dist: [0, 0, 0] });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— DOM —— */
  var $ = function (id) { return document.getElementById(id); };
  var roost = $("roost");
  var btnSubmit = $("btn-submit");
  var cards = [];                 // card elements, indexed by ITEM index
  var rowH = 0;

  /* —— header / prompt —— */
  $("puzzle-no").textContent = "No. " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("prompt-title").textContent = puzzle.q;
  $("prompt-metric").textContent = puzzle.metric;
  $("label-lo").textContent = puzzle.lo;
  $("label-hi").textContent = puzzle.hi;

  /* —— build cards —— */
  function buildCards() {
    puzzle.items.forEach(function (item, i) {
      var el = document.createElement("div");
      el.className = "card";
      el.dataset.item = i;
      el.innerHTML =
        '<div class="card-stub"></div>' +
        '<div class="card-name"><b></b><span class="card-value"></span></div>' +
        '<div class="card-nudge">' +
          '<button type="button" aria-label="Move up">▲</button>' +
          '<button type="button" aria-label="Move down">▼</button>' +
        '</div>';
      el.querySelector(".card-name b").textContent = item[0];
      el.querySelector(".card-value").textContent = item[1];
      roost.appendChild(el);
      cards[i] = el;
      attachDrag(el, i);
      var nudges = el.querySelectorAll(".card-nudge button");
      nudges[0].addEventListener("click", function () { nudge(i, -1); });
      nudges[1].addEventListener("click", function () { nudge(i, 1); });
    });
    layout(true);
  }

  function posOf(itemIdx) { return state.order.indexOf(itemIdx); }

  function layout(measure) {
    if (measure || !rowH) {
      var gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--card-gap")) || 10;
      rowH = cards[0].offsetHeight + gap;
      roost.style.height = (rowH * 5 - gap) + "px";
    }
    state.order.forEach(function (itemIdx, pos) {
      var el = cards[itemIdx];
      if (!el.classList.contains("dragging")) {
        el.style.setProperty("--ty", "translateY(" + (pos * rowH) + "px)");
      }
      el.querySelector(".card-stub").textContent = pos + 1;
    });
  }

  function nudge(itemIdx, dir) {
    if (state.done) return;
    var p = posOf(itemIdx);
    var np = p + dir;
    if (np < 0 || np > 4) return;
    state.order.splice(p, 1);
    state.order.splice(np, 0, itemIdx);
    clearFeedback();
    layout();
    save("po-day", state);
  }

  /* —— drag to reorder —— */
  function attachDrag(el, itemIdx) {
    el.addEventListener("pointerdown", function (ev) {
      if (state.done) return;
      if (ev.target.closest(".card-nudge")) return;
      ev.preventDefault();
      el.setPointerCapture(ev.pointerId);
      var startY = ev.clientY;
      var fromPos = posOf(itemIdx);
      var baseY = fromPos * rowH;
      el.classList.add("dragging");

      function onMove(e) {
        var dy = e.clientY - startY;
        el.style.setProperty("--ty", "translateY(" + (baseY + dy) + "px)");
        var target = Math.max(0, Math.min(4, Math.round((baseY + dy) / rowH)));
        if (target !== posOf(itemIdx)) {
          state.order.splice(posOf(itemIdx), 1);
          state.order.splice(target, 0, itemIdx);
          clearFeedback();
          layout();
        }
      }
      function onUp() {
        el.classList.remove("dragging");
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        layout();
        save("po-day", state);
      }
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    });
  }

  function clearFeedback() {
    cards.forEach(function (c) { c.classList.remove("fb-hit", "fb-close", "fb-miss"); });
  }

  /* —— judging —— */
  function judge(order) {
    /* items are stored ascending: item i belongs at position i */
    return order.map(function (itemIdx, pos) {
      var d = Math.abs(pos - itemIdx);
      return d === 0 ? "h" : d === 1 ? "c" : "m";
    });
  }

  function submit() {
    if (state.done || state.guesses.length >= MAX_GUESSES) return;
    state.guesses.push(state.order.slice());
    var fb = judge(state.order);
    var win = fb.every(function (x) { return x === "h"; });

    fb.forEach(function (mark, pos) {
      var el = cards[state.order[pos]];
      el.classList.add(mark === "h" ? "fb-hit" : mark === "c" ? "fb-close" : "fb-miss");
    });

    if (win || state.guesses.length >= MAX_GUESSES) {
      state.done = true;
      state.win = win;
      recordResult(win, state.guesses.length);
      setTimeout(finish, 650);
    } else {
      toast(fb.filter(function (x) { return x === "h"; }).length + " of 5 in the right roost");
    }
    renderBench();
    save("po-day", state);
  }

  function recordResult(win, tries) {
    if (stats.lastDay === DAY) return;     // already counted (e.g. reload race)
    stats.played++;
    if (win) {
      stats.wins++;
      stats.streak = (stats.lastWinDay === DAY - 1) ? stats.streak + 1 : 1;
      stats.lastWinDay = DAY;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      stats.dist[tries - 1]++;
    } else {
      stats.streak = 0;
    }
    stats.lastDay = DAY;
    save("po-stats", stats);
  }

  /* —— bench rendering —— */
  function renderBench() {
    var att = $("attempts");
    att.innerHTML = "";
    for (var i = 0; i < MAX_GUESSES; i++) {
      var p = document.createElement("i");
      p.className = "peck" + (i < state.guesses.length ? " used" : "");
      att.appendChild(p);
    }
    var hist = $("history");
    hist.innerHTML = "";
    state.guesses.forEach(function (g) {
      var row = document.createElement("div");
      row.className = "history-row";
      judge(g).forEach(function (mark) {
        var sq = document.createElement("i");
        sq.className = mark;
        row.appendChild(sq);
      });
      hist.appendChild(row);
    });
    btnSubmit.disabled = state.done;
  }

  /* —— verdict —— */
  function finish() {
    /* snap cards to the true order and reveal values */
    state.order = [0, 1, 2, 3, 4];
    clearFeedback();
    cards.forEach(function (c) {
      c.classList.add("settled", "show-value", "fb-hit");
    });
    layout();
    btnSubmit.disabled = true;

    var stampEl = $("verdict-stamp");
    if (state.win) {
      var lines = ["First judging — outrageous.", "Second judging — fine form.", "Third judging — squeaked in."];
      stampEl.textContent = "BEST IN SHOW";
      stampEl.classList.remove("lost");
      $("verdict-sub").textContent = lines[state.guesses.length - 1] + " The true order:";
    } else {
      stampEl.textContent = "HEN-PECKED";
      stampEl.classList.add("lost");
      $("verdict-sub").textContent = "No rosette today. The true order:";
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
    var score = state.win ? state.guesses.length : "X";
    var grid = state.guesses.map(function (g) {
      return judge(g).map(function (m) { return m === "h" ? "🟩" : m === "c" ? "🟨" : "⬜"; }).join("");
    }).join("\n");
    return "Pecking Order #" + PUZZLE_NO + " — " + score + "/" + MAX_GUESSES +
      (state.win ? " 🏅" : " 🐔") + "\n" + grid + "\n" + SITE_URL;
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
      row.innerHTML = "<b>" + (i + 1) + "</b><div class='dist-bar'>" + n + "</div>";
      row.querySelector(".dist-bar").style.width = Math.max(8, 100 * n / max) + "%";
      dist.appendChild(row);
    });
  }

  /* —— modals —— */
  var overlay = $("overlay");
  function openModal(id) {
    overlay.hidden = false;
    ["modal-help", "modal-stats", "modal-plus", "modal-about"].forEach(function (m) {
      $(m).hidden = m !== id;
    });
    if (id === "modal-stats") renderStats();
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
  $("btn-buy").addEventListener("click", function () {
    if (PAYMENT_LINK) {
      window.open(PAYMENT_LINK, "_blank", "noopener");
    } else {
      $("plus-note").textContent = "Plus isn't open for entries quite yet — check back soon!";
    }
  });
  $("btn-share").addEventListener("click", share);
  btnSubmit.addEventListener("click", submit);

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
  buildCards();
  renderBench();
  if (state.done) {
    finish();
  } else if (!localStorage.getItem("po-seen")) {
    save("po-seen", 1);
    openModal("modal-help");
  }
  window.addEventListener("resize", function () { layout(true); });
})();
