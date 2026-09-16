/* Roostr Solitaire — Klondike (draw-1), tap-to-move. No dependencies.
   Uses SolitaireCore (js/solitairecore.js) for all rules. Daily deal is the
   same for everyone (seeded by day); Shuffle deals a random game. Stats live
   in the "sol-" localStorage namespace. */
(function () {
  "use strict";

  var EPOCH = new Date(2026, 5, 1);
  var SITE_URL = "playroostr.com/solitaire";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  var SUITS = ["♠", "♥", "♦", "♣"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  function dayIndex() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - EPOCH) / 86400000);
  }
  var DAY = dayIndex();

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("sol-stats", { plays: 0, wins: 0, bestTime: 0, bestMoves: 0 });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— game state —— */
  var st, undoStack, moves, playing, dealKind;      // dealKind: "daily" | "random"
  var timer = null, startMs = 0, elapsed = 0;

  function snapshot() { return JSON.stringify(st); }
  function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 300) undoStack.shift(); }
  function doUndo() {
    if (!undoStack.length || !playing) return;
    st = JSON.parse(undoStack.pop());
    moves++;
    render();
  }

  function newGame(kind) {
    dealKind = kind;
    var seed = kind === "daily" ? DAY * 2654435761 + 5 : Math.floor(Math.random() * 2147483647);
    st = SolitaireCore.deal(seed);
    undoStack = [];
    moves = 0;
    elapsed = 0;
    startMs = 0;
    stopTimer();
    playing = true;
    $("verdict").hidden = true;
    $("sol-deal-label").textContent = kind === "daily" ? "Daily deal No. " + (DAY + 1) : "Random deal";
    syncHud();
    render();
  }

  /* —— timer —— */
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function startTimer() {
    if (startMs || !playing) return;
    startMs = nowMs();
    timer = setInterval(function () { $("sol-time").textContent = fmt(elapsedMs()); }, 500);
  }
  function stopTimer() { if (startMs) { elapsed += nowMs() - startMs; startMs = 0; } if (timer) { clearInterval(timer); timer = null; } }
  function elapsedMs() { return elapsed + (startMs ? nowMs() - startMs : 0); }
  function fmt(ms) {
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function syncHud() {
    $("sol-moves").textContent = moves;
    if (!startMs) $("sol-time").textContent = fmt(elapsed);
  }

  /* —— rendering —— */
  var stockEl = $("sol-stock"), wasteEl = $("sol-waste");
  var foundEls = [$("sol-f0"), $("sol-f1"), $("sol-f2"), $("sol-f3")];
  var tabEls = [];
  for (var ti = 0; ti < 7; ti++) tabEls.push($("sol-t" + ti));

  function cardHTML(c) {
    var red = SolitaireCore.isRed(c);
    return '<span class="sol-corner">' + RANKS[SolitaireCore.rank(c) - 1] + '<i>' + SUITS[SolitaireCore.suit(c)] + '</i></span>' +
           '<span class="sol-pip">' + SUITS[SolitaireCore.suit(c)] + '</span>';
  }
  function mkCard(c, up) {
    var d = document.createElement("button");
    d.type = "button";
    d.className = "sol-card" + (up ? (SolitaireCore.isRed(c) ? " sol-red" : " sol-black") : " sol-down");
    if (up) d.innerHTML = cardHTML(c);
    else d.innerHTML = '<span class="sol-back">R</span>';
    return d;
  }

  function render() {
    /* stock */
    stockEl.innerHTML = "";
    stockEl.className = "sol-slot" + (st.stock.length ? "" : " sol-empty");
    if (st.stock.length) stockEl.appendChild(mkCard(st.stock[st.stock.length - 1], false));
    else stockEl.innerHTML = '<span class="sol-recycle">↺</span>';

    /* waste */
    wasteEl.innerHTML = "";
    wasteEl.className = "sol-slot" + (st.waste.length ? "" : " sol-empty");
    if (st.waste.length) {
      var w = mkCard(st.waste[st.waste.length - 1], true);
      w.addEventListener("click", onWaste);
      wasteEl.appendChild(w);
    }

    /* foundations */
    for (var s = 0; s < 4; s++) {
      var f = st.found[s];
      foundEls[s].innerHTML = f.length ? "" : '<span class="sol-hint">' + SUITS[s] + '</span>';
      foundEls[s].className = "sol-slot sol-found" + (f.length ? "" : " sol-empty");
      if (f.length) foundEls[s].appendChild(mkCard(f[f.length - 1], true));
    }

    /* tableau */
    for (var i = 0; i < 7; i++) {
      var el = tabEls[i];
      el.innerHTML = "";
      var pile = st.tab[i];
      if (!pile.length) {
        el.classList.add("sol-tab-empty");
        (function (j) {
          el.onclick = function () { onEmptyTab(j); };
        })(i);
        continue;
      }
      el.classList.remove("sol-tab-empty");
      el.onclick = null;
      for (var k = 0; k < pile.length; k++) {
        var card = mkCard(pile[k].c, pile[k].up);
        card.style.top = (k * (window.innerWidth < 420 ? 20 : 24)) + "px";
        if (pile[k].up) (function (ii, kk) {
          card.addEventListener("click", function (e) { e.stopPropagation(); onTab(ii, kk); });
        })(i, k);
        el.appendChild(card);
      }
    }

    $("btn-finish").hidden = !(playing && SolitaireCore.autoFinishable(st) && !SolitaireCore.won(st));
    syncHud();
  }

  /* —— tap-to-move —— */
  function afterMove() {
    moves++;
    startTimer();
    render();
    if (SolitaireCore.won(st)) win();
  }
  function tryMove(fn) {
    var snap = snapshot();
    if (fn()) { undoStack.push(snap); if (undoStack.length > 300) undoStack.shift(); afterMove(); return true; }
    return false;
  }
  stockEl.addEventListener("click", function () {
    if (!playing) return;
    tryMove(function () { return SolitaireCore.draw(st); });
  });
  function onWaste() {
    if (!playing) return;
    if (tryMove(function () { return SolitaireCore.wasteToFound(st); })) return;
    for (var j = 0; j < 7; j++) if (tryMove(function () { return SolitaireCore.wasteToTab(st, j); })) return;
  }
  function onTab(i, k) {
    if (!playing) return;
    var pile = st.tab[i];
    if (k === pile.length - 1) {                       // single card: foundation first
      if (tryMove(function () { return SolitaireCore.tabToFound(st, i); })) return;
    }
    for (var j = 0; j < 7; j++) {
      if (j === i) continue;
      if (tryMove(function () { return SolitaireCore.tabToTab(st, i, k, j); })) return;
    }
  }
  function onEmptyTab(j) {
    if (!playing) return;
    /* try to move a king here: from waste, then from another pile */
    if (tryMove(function () { return SolitaireCore.wasteToTab(st, j); })) return;
    for (var i = 0; i < 7; i++) {
      if (i === j) continue;
      var pile = st.tab[i];
      for (var k = 0; k < pile.length; k++) {
        if (pile[k].up && SolitaireCore.rank(pile[k].c) === 13 && k > 0) {
          if (tryMove(function () { return SolitaireCore.tabToTab(st, i, k, j); })) return;
        }
      }
    }
  }
  $("btn-finish").addEventListener("click", function () {
    if (!playing) return;
    pushUndo();
    var guard = 0;
    while (!SolitaireCore.won(st) && SolitaireCore.autoFinishStep(st) && guard++ < 60) moves++;
    render();
    if (SolitaireCore.won(st)) win();
  });
  $("btn-undo").addEventListener("click", doUndo);
  $("btn-newdeal").addEventListener("click", function () { newGame("random"); });
  $("btn-daily").addEventListener("click", function () { newGame("daily"); });

  /* —— win —— */
  function win() {
    playing = false;
    stopTimer();
    var t = elapsed;
    stats.plays++; stats.wins++;
    var pbT = false, pbM = false;
    if (!stats.bestTime || t < stats.bestTime) { stats.bestTime = t; pbT = true; }
    if (!stats.bestMoves || moves < stats.bestMoves) { stats.bestMoves = moves; pbM = true; }
    save("sol-stats", stats);
    $("sol-final-time").textContent = fmt(t);
    $("sol-final-moves").textContent = moves;
    $("sol-best").textContent = "best: " + fmt(stats.bestTime) + " · " + stats.bestMoves + " moves";
    $("sol-newbest").hidden = !(pbT || pbM);
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    $("verdict").hidden = false;
    $("verdict").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function shareText() {
    var what = dealKind === "daily" ? "daily deal #" + (DAY + 1) : "a deal";
    return "Roostr Solitaire 🃏 — cleared " + what + " in " + fmt(elapsed) + " (" + moves + " moves)! Your table:\n" + SITE_URL;
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
  $("btn-share").addEventListener("click", share);
  $("btn-again").addEventListener("click", function () { newGame(dealKind); });

  /* —— stats modal —— */
  function renderStats() {
    $("st-plays").textContent = stats.plays;
    $("st-wins").textContent = stats.wins;
    $("st-bestt").textContent = stats.bestTime ? fmt(stats.bestTime) : "—";
    $("st-bestm").textContent = stats.bestMoves || "—";
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
    else if ($("overlay").hidden && (e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doUndo(); }
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

  /* —— toast —— */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* —— boot —— */
  initAds();
  newGame("daily");
  window.addEventListener("resize", render);
  if (!localStorage.getItem("sol-seen")) { save("sol-seen", 1); openModal("modal-help"); }
})();
