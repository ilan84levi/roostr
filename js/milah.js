/* Roostr מילה — daily Hebrew word game (Wordle-style). No dependencies.
   Uses HEB_ANSWERS / HEB_ALLOWED (js/hebwords.js), stored normalized (final
   letters written as regular). Display converts a trailing כ/מ/נ/פ/צ to its
   final form. State lives in the "mw-" localStorage namespace. */
(function () {
  "use strict";

  var EPOCH = new Date(2026, 5, 1);
  var SITE_URL = "playroostr.com/milah";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";
  var LEN = 5, TRIES = 6;

  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();
  var PUZZLE_NO = DAY + 1;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* fixed shuffled order over the answer pool so the sequence isn't guessable */
  var ORDER = (function () {
    var rng = mulberry32(779977);
    var idx = [];
    for (var i = 0; i < HEB_ANSWERS.length; i++) idx.push(i);
    for (i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx;
  })();
  var ANSWER = HEB_ANSWERS[ORDER[((DAY % ORDER.length) + ORDER.length) % ORDER.length]];
  var DICT = {};
  HEB_ANSWERS.forEach(function (w) { DICT[w] = 1; });
  HEB_ALLOWED.forEach(function (w) { DICT[w] = 1; });

  /* final-letter handling */
  var TO_REG = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  var TO_FIN = { "כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ" };
  function norm(ch) { return TO_REG[ch] || ch; }
  function displayWord(w) {
    var last = w[LEN - 1];
    return w.slice(0, LEN - 1) + (TO_FIN[last] || last);
  }
  function displayCh(ch, isLast) { return isLast && TO_FIN[ch] ? TO_FIN[ch] : ch; }

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("mw-stats", { played: 0, wins: 0, streak: 0, maxStreak: 0, lastDay: null, lastWinDay: null, dist: [0, 0, 0, 0, 0, 0] });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  var state = load("mw-day", null);
  if (!state || state.day !== DAY) state = { day: DAY, guesses: [], done: false, won: false };
  var current = "";

  /* —— board —— */
  var boardEl = $("mw-board");
  var tiles = [];
  function buildBoard() {
    boardEl.innerHTML = "";
    for (var r = 0; r < TRIES; r++) {
      var row = document.createElement("div");
      row.className = "mw-row";
      var rowTiles = [];
      for (var c = 0; c < LEN; c++) {
        var t = document.createElement("div");
        t.className = "mw-tile";
        row.appendChild(t);
        rowTiles.push(t);
      }
      boardEl.appendChild(row);
      tiles.push(rowTiles);
    }
  }

  /* —— keyboard —— */
  var KEYROWS = [
    ["ק", "ר", "א", "ט", "ו", "פ"],
    ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל"],
    ["ENTER", "ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "BS"]
  ];
  var keyEls = {};
  function buildKeyboard() {
    var kb = $("mw-kb");
    kb.innerHTML = "";
    KEYROWS.forEach(function (row) {
      var rEl = document.createElement("div");
      rEl.className = "kb-row";
      row.forEach(function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "kb-key" + (k.length > 1 ? " kb-wide" : "");
        b.textContent = k === "ENTER" ? "אישור" : k === "BS" ? "⌫" : k;
        b.addEventListener("click", function () { press(k); });
        rEl.appendChild(b);
        if (k.length === 1) keyEls[k] = b;
      });
      kb.appendChild(rEl);
    });
  }

  function press(k) {
    if (state.done) return;
    if (k === "ENTER") submit();
    else if (k === "BS") { current = current.slice(0, -1); renderCurrent(); }
    else if (current.length < LEN) { current += norm(k); renderCurrent(); }
  }
  document.addEventListener("keydown", function (e) {
    if (!$("overlay").hidden) { if (e.key === "Escape") closeModal(); return; }
    if (state.done) return;
    if (e.key === "Enter") { submit(); e.preventDefault(); }
    else if (e.key === "Backspace") { press("BS"); e.preventDefault(); }
    else if (/^[א-ת]$/.test(e.key)) { press(e.key); e.preventDefault(); }
  });

  /* —— scoring —— */
  function score(guess) {
    var res = new Array(LEN).fill(0);              // 0 gray, 1 yellow, 2 green
    var counts = {};
    for (var i = 0; i < LEN; i++) {
      if (guess[i] === ANSWER[i]) res[i] = 2;
      else counts[ANSWER[i]] = (counts[ANSWER[i]] || 0) + 1;
    }
    for (i = 0; i < LEN; i++) {
      if (res[i] === 2) continue;
      if (counts[guess[i]]) { res[i] = 1; counts[guess[i]]--; }
    }
    return res;
  }

  function submit() {
    if (current.length !== LEN) { shake(); toast("צריך חמש אותיות"); return; }
    if (!DICT[current]) { shake(); toast("המילה לא במילון שלנו"); return; }
    state.guesses.push(current);
    var won = current === ANSWER;
    if (won || state.guesses.length >= TRIES) {
      state.done = true; state.won = won;
      recordResult();
    }
    save("mw-day", state);
    current = "";
    render();
    if (state.done) setTimeout(finish, 900);
  }
  function shake() {
    var row = boardEl.children[state.guesses.length];
    if (!row) return;
    row.classList.add("mw-shake");
    setTimeout(function () { row.classList.remove("mw-shake"); }, 450);
  }

  function recordResult() {
    if (stats.lastDay === DAY) return;
    stats.played++;
    if (state.won) {
      stats.wins++;
      stats.dist[state.guesses.length - 1]++;
      stats.streak = (stats.lastWinDay === DAY - 1) ? stats.streak + 1 : 1;
      stats.lastWinDay = DAY;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    } else {
      stats.streak = 0;
    }
    stats.lastDay = DAY;
    save("mw-stats", stats);
  }

  /* —— render —— */
  var keyState = {};                               // letter -> 0/1/2 best seen
  function render() {
    keyState = {};
    for (var r = 0; r < TRIES; r++) {
      var guess = state.guesses[r];
      for (var c = 0; c < LEN; c++) {
        var t = tiles[r][c];
        t.className = "mw-tile";
        if (guess) {
          var sc = score(guess);
          t.textContent = displayCh(guess[c], c === LEN - 1);
          t.classList.add(sc[c] === 2 ? "mw-green" : sc[c] === 1 ? "mw-yellow" : "mw-gray");
          var ks = keyState[guess[c]] || 0;
          if (sc[c] > ks) keyState[guess[c]] = sc[c];
          else if (!(guess[c] in keyState)) keyState[guess[c]] = sc[c];
        } else t.textContent = "";
      }
    }
    renderCurrent();
    for (var k in keyEls) {
      keyEls[k].className = "kb-key";
      if (k in keyState) keyEls[k].classList.add(keyState[k] === 2 ? "mw-green" : keyState[k] === 1 ? "mw-yellow" : "mw-gray");
    }
  }
  function renderCurrent() {
    var r = state.guesses.length;
    if (r >= TRIES) return;
    for (var c = 0; c < LEN; c++) {
      var t = tiles[r][c];
      t.className = "mw-tile" + (c < current.length ? " mw-filled" : "");
      t.textContent = c < current.length ? displayCh(current[c], c === LEN - 1 && current.length === LEN) : "";
    }
  }

  /* —— finish —— */
  function finish() {
    $("mw-answer").textContent = displayWord(ANSWER);
    $("mw-answer-wrap").hidden = state.won;
    var stamp = $("verdict-stamp");
    if (state.won) {
      stamp.textContent = ["גאונות!", "מדהים!", "מעולה!", "יפה מאוד!", "כל הכבוד!", "בדיוק בזמן!"][state.guesses.length - 1];
      stamp.classList.remove("lost");
      $("verdict-sub").textContent = "פתרת ב־" + state.guesses.length + " ניסיונות מתוך " + TRIES + ".";
    } else {
      stamp.textContent = "לא הפעם";
      stamp.classList.add("lost");
      $("verdict-sub").textContent = "המילה תחכה לך מחר. שומרים על הרצף!";
    }
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
    startCountdown();
  }

  function shareText() {
    var head = "מילה של Roostr ‏#" + PUZZLE_NO + " — " + (state.won ? state.guesses.length : "X") + "/" + TRIES;
    var grid = state.guesses.map(function (g) {
      var sc = score(g);
      var row = "";
      for (var i = LEN - 1; i >= 0; i--) row += sc[i] === 2 ? "🟩" : sc[i] === 1 ? "🟨" : "⬜";
      return row;
    }).join("\n");
    return head + "\n" + grid + "\n" + SITE_URL;
  }
  function share() {
    var text = shareText();
    var mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (navigator.share && mobile) navigator.share({ text: text }).catch(function () { copyShare(text); });
    else copyShare(text);
  }
  function copyShare(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("הועתק — לכו להשוויץ"); }, function () { window.prompt("העתיקו את התוצאה:", text); });
    else window.prompt("העתיקו את התוצאה:", text);
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
    else $("plus-note").textContent = "פלוס עוד לא נפתח להרשמה — נתראה בקרוב!";
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
  $("puzzle-no").textContent = "מס׳ " + PUZZLE_NO;
  $("puzzle-date").textContent = new Date().toLocaleDateString("he-IL", { weekday: "long", month: "long", day: "numeric" });
  buildBoard();
  buildKeyboard();
  initAds();
  render();
  if (state.done) finish();
  else if (!localStorage.getItem("mw-seen")) { save("mw-seen", 1); openModal("modal-help"); }
})();
