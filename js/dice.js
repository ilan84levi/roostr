/* Roostr Steady Dice — a tilt-the-phone dice balancing game. No dependencies.
   Three dice sit on a round tray. Tilting the phone (or moving the mouse /
   arrow keys) tilts the tray and the dice slide with it — keep them all on
   the tray as it gets more slippery. Time balanced is the score; best run
   lives in the "dt-" localStorage namespace. */
(function () {
  "use strict";

  /* —— configuration —— */
  var SITE_URL = "playroostr.com/dice";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  var COL = {
    paper: "#f3ead8", card: "#fbf6ea", ink: "#2a2118", inkSoft: "#5b4f3f",
    red: "#b5402a", redDeep: "#93311f", teal: "#20655a", gold: "#c89a3f", goldPale: "#ecd9a8",
    table: "#8a6a45", tableDeep: "#6f5436", tray: "#fbf6ea", rim: "#c89a3f"
  };

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("dt-stats", { plays: 0, best: 0, totalSec: 0 });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— canvas —— */
  var stage = $("run-stage");
  var canvas = $("run-canvas");
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, CX = 0, CY = 0, R = 0;

  /* —— model —— */
  var DIE = 19;                                  // die half-size (px)
  var G0 = 320, GMAX = 1100, GRAMP = 16;         // tilt force ramps over time
  var dice, elapsed, gK, state, overAt, frame;

  /* tilt input: tx/ty in [-1, 1] */
  var tiltX = 0, tiltY = 0;                      // from sensors / mouse / keys
  var keyL = false, keyR = false, keyU = false, keyD = false;
  var zeroBeta = null, zeroGamma = null;         // calibrated neutral grip

  function reset() {
    dice = [];
    var offs = [[-1.6, -0.9], [1.6, -0.9], [0, 1.6]];
    for (var i = 0; i < 3; i++) {
      dice.push({
        x: CX + offs[i][0] * DIE, y: CY + offs[i][1] * DIE,
        vx: 0, vy: 0,
        face: 1 + Math.floor(Math.random() * 6),
        ang: (Math.random() - 0.5) * 0.5,
        falling: 0
      });
    }
    elapsed = 0;
    gK = G0;
    frame = 0;
    zeroBeta = null; zeroGamma = null;           // re-calibrate on each run
  }
  function start() { reset(); state = "run"; hideOverlays(); }

  function gameOver() {
    state = "over";
    var sec = Math.floor(elapsed * 10) / 10;
    stats.plays++;
    stats.totalSec = Math.round((stats.totalSec + sec) * 10) / 10;
    if (sec > stats.best) stats.best = sec;
    save("dt-stats", stats);
    overAt = now();
    $("ro-score").textContent = sec.toFixed(1);
    $("ro-best").textContent = stats.best.toFixed(1);
    $("ro-newbest").hidden = !(sec > 0 && sec === stats.best);
    show($("run-over"));
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    syncHud();
  }

  function update(dt) {
    frame += dt * 60;
    elapsed += dt;
    gK = Math.min(GMAX, gK + GRAMP * dt);

    /* keyboard tilt folds into the sensor/mouse tilt */
    var kx = (keyR ? 1 : 0) - (keyL ? 1 : 0);
    var ky = (keyD ? 1 : 0) - (keyU ? 1 : 0);
    var tx = Math.max(-1, Math.min(1, tiltX + kx));
    var ty = Math.max(-1, Math.min(1, tiltY + ky));

    for (var i = 0; i < dice.length; i++) {
      var d = dice[i];
      if (d.falling) { d.falling += dt; continue; }
      d.vx += tx * gK * dt;
      d.vy += ty * gK * dt;
      /* rolling friction — the tray gets more slippery the longer you last */
      var slick = Math.max(0.3, 1.4 - elapsed * 0.02);
      var fr = Math.max(0, 1 - slick * dt);
      d.vx *= fr; d.vy *= fr;
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      /* tumble: fast dice change face + wobble */
      var sp = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (sp > 90 && Math.random() < dt * (sp / 45)) {
        d.face = 1 + Math.floor(Math.random() * 6);
        d.ang += (Math.random() - 0.5) * 0.7;
      }
      d.ang *= Math.max(0, 1 - 2.2 * dt);
    }

    /* die vs die collisions (equal mass, springy) */
    for (i = 0; i < dice.length; i++) {
      for (var j = i + 1; j < dice.length; j++) {
        var a = dice[i], b = dice[j];
        if (a.falling || b.falling) continue;
        var dx = b.x - a.x, dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var min = DIE * 1.9;
        if (dist < min) {
          var nx = dx / dist, ny = dy / dist;
          var push = (min - dist) / 2;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          var rvx = b.vx - a.vx, rvy = b.vy - a.vy;
          var rel = rvx * nx + rvy * ny;
          if (rel < 0) {
            var imp = -rel * 0.75;
            a.vx -= nx * imp; a.vy -= ny * imp;
            b.vx += nx * imp; b.vy += ny * imp;
            if (Math.abs(rel) > 60) { a.face = 1 + Math.floor(Math.random() * 6); b.face = 1 + Math.floor(Math.random() * 6); }
          }
        }
      }
    }

    /* off the tray? */
    var lost = false;
    for (i = 0; i < dice.length; i++) {
      var e = dice[i];
      if (e.falling) { if (e.falling > 0.45) lost = true; continue; }
      var rx = e.x - CX, ry = e.y - CY;
      if (Math.sqrt(rx * rx + ry * ry) > R - DIE * 0.55) e.falling = 0.0001;
    }
    if (lost) { gameOver(); return; }
    syncHud();
  }

  /* —— drawing —— */
  function draw() {
    /* table */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, COL.table); g.addColorStop(1, COL.tableDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    /* wood grain */
    ctx.strokeStyle = "rgba(42,33,24,.18)";
    ctx.lineWidth = 1.5;
    for (var y = 18; y < H; y += 26) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y - 5, W * 0.7, y + 5, W, y); ctx.stroke();
    }

    /* tray: shadow, rim, felt */
    ctx.fillStyle = "rgba(42,33,24,.3)";
    ctx.beginPath(); ctx.ellipse(CX + 5, CY + 8, R + 10, R + 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = COL.rim;
    ctx.beginPath(); ctx.arc(CX, CY, R + 9, 0, 7); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = COL.tray;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(42,33,24,.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    /* subtle inner rings */
    ctx.strokeStyle = "rgba(42,33,24,.08)";
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.62, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.3, 0, 7); ctx.stroke();

    if (dice) {
      for (var i = 0; i < dice.length; i++) drawDie(dice[i]);
    }
  }

  function drawDie(d) {
    var s = DIE;
    var scale = d.falling ? Math.max(0.1, 1 - d.falling * 2.2) : 1;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.ang);
    ctx.scale(scale, scale);
    /* shadow */
    ctx.fillStyle = "rgba(42,33,24,.28)";
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(-s + 3, -s + 5, s * 2, s * 2, 6); ctx.fill(); }
    else ctx.fillRect(-s + 3, -s + 5, s * 2, s * 2);
    /* body */
    ctx.fillStyle = COL.card;
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(-s, -s, s * 2, s * 2, 6); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(-s, -s, s * 2, s * 2); ctx.strokeRect(-s, -s, s * 2, s * 2); }
    /* pips */
    var p = s * 0.48;
    var pip = [[], [[0, 0]], [[-p, -p], [p, p]], [[-p, -p], [0, 0], [p, p]],
      [[-p, -p], [p, -p], [-p, p], [p, p]],
      [[-p, -p], [p, -p], [0, 0], [-p, p], [p, p]],
      [[-p, -p], [p, -p], [-p, 0], [p, 0], [-p, p], [p, p]]][d.face];
    ctx.fillStyle = d.face === 1 ? COL.red : COL.ink;
    for (var k = 0; k < pip.length; k++) {
      ctx.beginPath(); ctx.arc(pip[k][0], pip[k][1], s * 0.17, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  /* —— HUD + overlays —— */
  function syncHud() {
    $("run-dist").textContent = (state === "run" ? elapsed.toFixed(1) : "0.0") + " s";
    $("run-hi").textContent = "best " + stats.best.toFixed(1) + " s";
  }
  function show(el) { el.hidden = false; }
  function hideOverlays() { $("run-start").hidden = true; $("run-over").hidden = true; }

  function resize() {
    var rect = stage.getBoundingClientRect();
    W = Math.max(280, Math.round(rect.width));
    H = Math.max(220, Math.round(rect.height));
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W / 2; CY = H / 2;
    R = Math.min(W, H) * 0.4;
    if (state === "ready" && dice) draw();
  }

  /* —— loop —— */
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  var last = now();
  function loop() {
    var t = now(); var dt = Math.min(0.034, (t - last) / 1000); last = t;
    if (state === "run") update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* —— input —— */
  function press() {
    if (state === "ready") { requestTilt(); start(); }
    else if (state === "over" && now() - overAt > 350) start();
  }

  /* phone tilt = the whole game. Calibrated to however you hold the phone
     when the run starts, so "neutral" is your natural grip. */
  var tiltWired = false;
  function wireTilt() {
    if (tiltWired || !window.DeviceOrientationEvent) return;
    tiltWired = true;
    window.addEventListener("deviceorientation", function (e) {
      if (e.beta == null || e.gamma == null) return;
      if (zeroBeta === null) { zeroBeta = e.beta; zeroGamma = e.gamma; }
      var MAX = 22;                                        // degrees to full tilt
      tiltY = Math.max(-1, Math.min(1, (e.beta - zeroBeta) / MAX));
      tiltX = Math.max(-1, Math.min(1, (e.gamma - zeroGamma) / MAX));
    });
  }
  function requestTilt() {
    if (!window.DeviceOrientationEvent) return;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then(function (res) {
          if (res === "granted") wireTilt();
        }).catch(function () { /* mouse/keys still work */ });
      } else {
        wireTilt();
      }
    } catch (e) { /* mouse/keys still work */ }
  }

  /* desktop: mouse position tilts the tray */
  canvas.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    var rect = canvas.getBoundingClientRect();
    tiltX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) - CX) / (R * 1.1)));
    tiltY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) - CY) / (R * 1.1)));
  });
  canvas.addEventListener("pointerdown", function (e) { e.preventDefault(); if (state !== "run") press(); });
  window.addEventListener("keydown", function (e) {
    if (!$("overlay").hidden) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") { keyL = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "ArrowRight" || e.code === "KeyD") { keyR = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "ArrowUp" || e.code === "KeyW") { keyU = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "ArrowDown" || e.code === "KeyS") { keyD = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "Space") { e.preventDefault(); press(); }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keyL = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keyR = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keyU = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keyD = false;
  });
  $("run-start").addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });
  $("run-over").addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; e.preventDefault(); press(); });
  $("btn-retry").addEventListener("click", function (e) { e.stopPropagation(); start(); });
  document.addEventListener("visibilitychange", function () { last = now(); });

  /* —— share —— */
  function shareText() {
    return "Roostr Steady Dice 🎲 — I kept the dice balanced for " + stats.best.toFixed(1) + "s! Steadier hands?\n" + SITE_URL;
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
  $("btn-share").addEventListener("click", function (e) { e.stopPropagation(); share(); });

  /* —— stats modal —— */
  function renderStats() {
    $("st-best").textContent = stats.best.toFixed(1);
    $("st-plays").textContent = stats.plays;
    $("st-total").textContent = Math.round(stats.totalSec);
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

  /* —— toast —— */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* —— boot —— */
  state = "ready";
  resize();
  reset();
  initAds();
  syncHud();
  draw();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
  if (!localStorage.getItem("dt-seen")) { save("dt-seen", 1); openModal("modal-help"); }
})();
