/* Roostr Astro Coop — a tiny spaceship dodger. No dependencies, no backend.
   Fly the ship through a starfield and dodge incoming asteroids; it speeds up
   the longer you survive. Distance + best run live in the "sd-" localStorage. */
(function () {
  "use strict";

  /* —— configuration —— */
  var SITE_URL = "playroostr.com/dodge";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  var COL = {
    paper: "#f3ead8", card: "#fbf6ea", ink: "#2a2118", inkSoft: "#5b4f3f",
    red: "#b5402a", redDeep: "#93311f", teal: "#20655a", gold: "#c89a3f", goldPale: "#ecd9a8",
    rock: "#9a8f7d", rockDeep: "#6f6757", rockDark: "#564f42", star: "#f3ead8"
  };

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("sd-stats", { plays: 0, best: 0, totalMeters: 0 });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— canvas —— */
  var stage = $("run-stage");
  var canvas = $("run-canvas");
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  /* —— model —— */
  var SPEED0 = 230, SPEEDMAX = 560, ACCEL = 8;
  var ship, rocks, stars, speed, distance, nextGap, frame, state, overAt, targetY;
  var keyUp = false, keyDown = false;

  function reset() {
    ship = { x: Math.max(50, W * 0.24), y: H / 2, r: 13 };
    targetY = H / 2;
    rocks = [];
    speed = SPEED0;
    distance = 0;
    nextGap = 150;
    frame = 0;
    stars = [];
    for (var i = 0; i < 64; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, layer: 0.4 + Math.random() * 1.1, s: Math.random() < 0.2 ? 1.6 : 1 });
    }
  }
  function start() { reset(); state = "run"; hideOverlays(); }

  function gameOver() {
    state = "over";
    var meters = Math.floor(distance / 10);
    stats.plays++; stats.totalMeters += meters;
    if (meters > stats.best) stats.best = meters;
    save("sd-stats", stats);
    overAt = now();
    $("ro-score").textContent = meters;
    $("ro-best").textContent = stats.best;
    $("ro-newbest").hidden = !(meters > 0 && meters === stats.best);
    show($("run-over"));
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    syncHud();
  }

  function spawn() {
    var margin = 26;
    var r = 12 + Math.random() * 15;
    var verts = [];
    for (var k = 0; k < 9; k++) verts.push(0.72 + Math.random() * 0.42);
    rocks.push({
      x: W + r + 8,
      y: margin + Math.random() * (H - margin * 2),
      r: r, verts: verts,
      spin: (Math.random() - 0.5) * 1.6, rot: Math.random() * 6.28,
      vy: (Math.random() - 0.5) * 40
    });
    var minGap = speed * 0.5 + 70;
    nextGap = minGap + Math.random() * (minGap * 0.9);
  }

  function update(dt) {
    frame += dt * 60;
    speed = Math.min(SPEEDMAX, speed + ACCEL * dt);
    distance += speed * dt;

    /* steering: keyboard nudges the target, pointer sets it directly */
    if (keyUp) targetY -= 360 * dt;
    if (keyDown) targetY += 360 * dt;
    var m = 18;
    targetY = Math.max(m, Math.min(H - m, targetY));
    ship.y += (targetY - ship.y) * Math.min(1, dt * 13);
    ship.y = Math.max(m, Math.min(H - m, ship.y));

    /* stars */
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      st.x -= speed * 0.35 * st.layer * dt;
      if (st.x < -2) { st.x = W + 2; st.y = Math.random() * H; }
    }

    /* rocks */
    nextGap -= speed * dt;
    if (nextGap <= 0) spawn();
    for (var i = rocks.length - 1; i >= 0; i--) {
      var a = rocks[i];
      a.x -= speed * dt;
      a.y += a.vy * dt;
      a.rot += a.spin * dt;
      if (a.y < a.r || a.y > H - a.r) a.vy *= -1;   // bounce off top/bottom
      if (a.x + a.r < -8) rocks.splice(i, 1);
    }

    /* collision (circle vs circle, forgiving) */
    for (var j = 0; j < rocks.length; j++) {
      var o = rocks[j];
      var dx = o.x - ship.x, dy = o.y - ship.y;
      var rr = o.r + ship.r - 5;
      if (dx * dx + dy * dy < rr * rr) { gameOver(); return; }
    }
    syncHud();
  }

  /* —— drawing —— */
  function draw() {
    /* space background */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#16243a"); g.addColorStop(1, "#0b1422");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawStars();
    if (rocks) rocks.forEach(drawRock);
    if (ship) drawShip(ship.x, ship.y);
  }

  function drawStars() {
    if (!stars) return;
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      ctx.globalAlpha = 0.35 + 0.5 * (st.layer / 1.5);
      ctx.fillStyle = COL.star;
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawRock(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.beginPath();
    for (var k = 0; k < a.verts.length; k++) {
      var ang = (k / a.verts.length) * Math.PI * 2;
      var rad = a.r * a.verts[k];
      var px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = COL.rock; ctx.strokeStyle = COL.rockDark; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.rockDeep;
    ctx.beginPath(); ctx.arc(-a.r * 0.25, -a.r * 0.15, a.r * 0.22, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(a.r * 0.3, a.r * 0.25, a.r * 0.15, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawShip(x, y) {
    ctx.save();
    /* exhaust flame, flickering */
    var fl = 9 + (Math.floor(frame) % 6);
    ctx.fillStyle = COL.gold;
    ctx.beginPath(); ctx.moveTo(x - 13, y - 5); ctx.lineTo(x - 13 - fl, y); ctx.lineTo(x - 13, y + 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = COL.red;
    ctx.beginPath(); ctx.moveTo(x - 13, y - 3); ctx.lineTo(x - 13 - fl * 0.6, y); ctx.lineTo(x - 13, y + 3); ctx.closePath(); ctx.fill();
    /* fins */
    ctx.fillStyle = COL.teal;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 7); ctx.lineTo(x - 17, y - 16); ctx.lineTo(x - 4, y - 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 7); ctx.lineTo(x - 17, y + 16); ctx.lineTo(x - 4, y + 4); ctx.closePath(); ctx.fill();
    /* body */
    ctx.fillStyle = COL.red; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.quadraticCurveTo(x + 2, y - 13, x - 14, y - 9);
    ctx.quadraticCurveTo(x - 8, y, x - 14, y + 9);
    ctx.quadraticCurveTo(x + 2, y + 13, x + 20, y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    /* nose cone accent + porthole */
    ctx.fillStyle = COL.gold;
    ctx.beginPath(); ctx.arc(x + 4, y, 4.6, 0, 7); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  /* —— HUD + overlays —— */
  function syncHud() {
    $("run-dist").textContent = Math.floor(distance / 10) + " m";
    $("run-hi").textContent = "best " + stats.best + " m";
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
    if (ship) { ship.x = Math.max(50, W * 0.24); }
    if (state === "ready" && ship) draw();
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
    if (state === "ready") start();
    else if (state === "over" && now() - overAt > 350) start();
  }
  window.addEventListener("keydown", function (e) {
    if (!$("overlay").hidden) return;
    if (e.code === "ArrowUp" || e.code === "KeyW") { keyUp = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "ArrowDown" || e.code === "KeyS") { keyDown = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "Space") { e.preventDefault(); press(); }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "ArrowUp" || e.code === "KeyW") keyUp = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keyDown = false;
  });
  function pointerY(e) {
    var rect = canvas.getBoundingClientRect();
    targetY = e.clientY - rect.top;
    if (state === "ready") start();
  }
  canvas.addEventListener("pointerdown", function (e) { e.preventDefault(); pointerY(e); });
  canvas.addEventListener("pointermove", function (e) {
    if (e.buttons || e.pointerType === "touch") { e.preventDefault(); pointerY(e); }
    else if (state === "run") { var rect = canvas.getBoundingClientRect(); targetY = e.clientY - rect.top; }
  });
  $("run-start").addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });
  $("run-over").addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; e.preventDefault(); press(); });
  $("btn-retry").addEventListener("click", function (e) { e.stopPropagation(); start(); });
  document.addEventListener("visibilitychange", function () { last = now(); });

  /* —— share —— */
  function shareText() {
    var m = Math.floor(distance / 10);
    return "Roostr Astro Coop 🚀 — I flew " + m + " m dodging asteroids! Beat me?\n" + SITE_URL;
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
    $("st-best").textContent = stats.best;
    $("st-plays").textContent = stats.plays;
    $("st-total").textContent = stats.totalMeters;
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
  if (!localStorage.getItem("sd-seen")) { save("sd-seen", 1); openModal("modal-help"); }
})();
