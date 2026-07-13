/* Roostr Coop Racer — a top-down road racer. No dependencies, no backend.
   Steer the car with two thumbs (hold the left / right half of the screen)
   or the arrow keys, and dodge the roosters hopping onto the road. Tilting
   the phone toward upright (or holding ↑ / Space) hits the BOOST.
   Distance + best run live in the "rc-" localStorage namespace. */
(function () {
  "use strict";

  /* —— configuration —— */
  var SITE_URL = "playroostr.com/race";
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  var COL = {
    paper: "#f3ead8", card: "#fbf6ea", ink: "#2a2118", inkSoft: "#5b4f3f",
    red: "#b5402a", redDeep: "#93311f", teal: "#20655a", gold: "#c89a3f", goldPale: "#ecd9a8",
    grass: "#7d9a58", grassDeep: "#67824a", road: "#6f6a60", roadDeep: "#615c53",
    dash: "#f3ead8", comb: "#c0392b", body: "#8a5a33", bodyDeep: "#6f4626", wing: "#a8743f"
  };

  var $ = function (id) { return document.getElementById(id); };
  function load(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  var stats = load("rc-stats", { plays: 0, best: 0, totalMeters: 0 });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— canvas —— */
  var stage = $("run-stage");
  var canvas = $("run-canvas");
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  /* —— model —— */
  var SPEED0 = 250, SPEEDMAX = 520, ACCEL = 6, BOOST_MULT = 1.65;
  var car, roosters, baseSpeed, speed, distance, nextGap, dashOff, frame, state, overAt;
  var steerLeft = false, steerRight = false;      // from thumbs or ← →
  var boostKey = false, tiltBoost = false;        // ↑/Space or phone tilt
  var roadX = 0, roadW = 0;

  function layout() {
    roadW = Math.round(W * 0.72);
    roadX = Math.round((W - roadW) / 2);
  }

  function reset() {
    layout();
    car = { x: W / 2, y: Math.round(H * 0.78), r: 15 };
    roosters = [];
    baseSpeed = SPEED0;
    speed = SPEED0;
    distance = 0;
    nextGap = 170;
    dashOff = 0;
    frame = 0;
  }
  function start() { reset(); state = "run"; hideOverlays(); }

  function gameOver() {
    state = "over";
    var meters = Math.floor(distance / 10);
    stats.plays++; stats.totalMeters += meters;
    if (meters > stats.best) stats.best = meters;
    save("rc-stats", stats);
    overAt = now();
    $("ro-score").textContent = meters;
    $("ro-best").textContent = stats.best;
    $("ro-newbest").hidden = !(meters > 0 && meters === stats.best);
    show($("run-over"));
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    syncHud();
  }

  function spawn() {
    var side = Math.random() < 0.5 ? -1 : 1;                       // -1: enters from the left
    /* hops across the road, so the velocity points away from the spawn side;
       it scales with the road speed so roosters genuinely cross the car's
       path instead of drifting past near the shoulder */
    var vx = -side * speed * (0.4 + Math.random() * 0.4);
    roosters.push({
      x: side < 0 ? roadX - 24 : roadX + roadW + 24,
      y: -34,
      vx: vx,
      r: 12,
      hop: Math.random() * 6.28
    });
    var minGap = speed * 0.55 + 90;
    nextGap = minGap + Math.random() * (minGap * 0.7);
  }

  function boosting() { return boostKey || tiltBoost; }

  function update(dt) {
    frame += dt * 60;
    baseSpeed = Math.min(SPEEDMAX, baseSpeed + ACCEL * dt);
    var target = baseSpeed * (boosting() ? BOOST_MULT : 1);
    speed += (target - speed) * Math.min(1, dt * 4);               // smooth boost in/out
    distance += speed * dt;
    dashOff = (dashOff + speed * dt) % 64;

    /* steering */
    var dir = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
    var steerSpeed = Math.max(250, W * 0.72);
    car.x += dir * steerSpeed * dt;
    var m = car.r + 4;
    car.x = Math.max(roadX + m, Math.min(roadX + roadW - m, car.x));

    /* roosters: scroll down with the road, hop across it */
    nextGap -= speed * dt;
    if (nextGap <= 0) spawn();
    for (var i = roosters.length - 1; i >= 0; i--) {
      var ro = roosters[i];
      ro.y += speed * dt;
      ro.x += ro.vx * dt;
      ro.hop += dt * 10;
      if (ro.y > H + 46 || ro.x < -40 || ro.x > W + 40) roosters.splice(i, 1);
    }

    /* collision (forgiving circle vs circle) */
    for (var j = 0; j < roosters.length; j++) {
      var o = roosters[j];
      var dx = o.x - car.x, dy = o.y - car.y;
      var rr = o.r + car.r - 6;
      if (dx * dx + dy * dy < rr * rr) { gameOver(); return; }
    }
    syncHud();
  }

  /* —— drawing —— */
  function draw() {
    /* grass */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, COL.grass); g.addColorStop(1, COL.grassDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawTufts();

    /* road + shoulders */
    ctx.fillStyle = COL.road;
    ctx.fillRect(roadX, 0, roadW, H);
    ctx.fillStyle = COL.roadDeep;
    ctx.fillRect(roadX, 0, 5, H); ctx.fillRect(roadX + roadW - 5, 0, 5, H);
    ctx.fillStyle = COL.goldPale;
    ctx.fillRect(roadX + 7, 0, 3, H); ctx.fillRect(roadX + roadW - 10, 0, 3, H);

    /* lane dashes (two dashed lines → three lanes) */
    ctx.fillStyle = COL.dash;
    var lane1 = roadX + roadW / 3, lane2 = roadX + roadW * 2 / 3;
    for (var y = -64 + dashOff; y < H; y += 64) {
      ctx.fillRect(lane1 - 2, y, 4, 30);
      ctx.fillRect(lane2 - 2, y, 4, 30);
    }

    if (roosters) roosters.forEach(drawRooster);
    if (car) drawCar(car.x, car.y);
  }

  function drawTufts() {
    /* deterministic grass tufts that scroll with the road */
    ctx.strokeStyle = COL.grassDeep;
    ctx.lineWidth = 2;
    for (var i = 0; i < 14; i++) {
      var gx = (i * 97) % W;
      if (gx > roadX - 14 && gx < roadX + roadW + 14) continue;
      var gy = ((i * 211 + dashOff * (0.8 + (i % 3) * 0.2)) % (H + 24)) - 12;
      ctx.beginPath();
      ctx.moveTo(gx, gy + 6); ctx.lineTo(gx - 3, gy);
      ctx.moveTo(gx, gy + 6); ctx.lineTo(gx + 1, gy - 1);
      ctx.moveTo(gx, gy + 6); ctx.lineTo(gx + 4, gy + 1);
      ctx.stroke();
    }
  }

  function drawRooster(ro) {
    var lift = Math.abs(Math.sin(ro.hop)) * 5;                     // hop bounce
    var facing = ro.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(ro.x, ro.y - lift);
    ctx.scale(facing, 1);
    /* shadow (stays on the ground) */
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = COL.ink;
    ctx.beginPath(); ctx.ellipse(0, ro.r + lift - 2, ro.r * 0.9, 3.4, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    /* tail feathers */
    ctx.fillStyle = COL.teal;
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(-19, -12, -13, 2); ctx.closePath(); ctx.fill();
    /* body */
    ctx.fillStyle = COL.body; ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 7.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.wing;
    ctx.beginPath(); ctx.ellipse(-1, 0.5, 5.5, 4, -0.35, 0, 7); ctx.fill();
    /* head + comb + beak */
    ctx.fillStyle = COL.body;
    ctx.beginPath(); ctx.arc(9, -6, 4.6, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.comb;
    ctx.beginPath(); ctx.arc(7.6, -10.4, 1.8, 0, 7); ctx.arc(9.8, -11.2, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = COL.gold;
    ctx.beginPath(); ctx.moveTo(13, -6.6); ctx.lineTo(17.6, -5.4); ctx.lineTo(13, -4.2); ctx.closePath(); ctx.fill();
    /* eye + legs */
    ctx.fillStyle = COL.ink;
    ctx.beginPath(); ctx.arc(10, -6.8, 0.9, 0, 7); ctx.fill();
    ctx.strokeStyle = COL.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-2, 7); ctx.lineTo(-3, 11); ctx.moveTo(3, 7); ctx.lineTo(4, 11); ctx.stroke();
    ctx.restore();
  }

  function drawCar(x, y) {
    ctx.save();
    ctx.translate(x, y);
    var boost = boosting();
    /* boost flames out the back */
    if (boost && state === "run") {
      var fl = 10 + (Math.floor(frame) % 5) * 2;
      ctx.fillStyle = COL.gold;
      ctx.beginPath(); ctx.moveTo(-5, 20); ctx.lineTo(0, 20 + fl); ctx.lineTo(5, 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = COL.red;
      ctx.beginPath(); ctx.moveTo(-2.6, 20); ctx.lineTo(0, 20 + fl * 0.6); ctx.lineTo(2.6, 20); ctx.closePath(); ctx.fill();
    }
    /* tires */
    ctx.fillStyle = COL.ink;
    [[-11, -12], [11, -12], [-11, 12], [11, 12]].forEach(function (t) {
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(t[0] - 3, t[1] - 6, 6, 12, 2); ctx.fill(); }
      else ctx.fillRect(t[0] - 3, t[1] - 6, 6, 12);
    });
    /* body (top-down) */
    ctx.fillStyle = COL.red; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -20);
    ctx.quadraticCurveTo(0, -24, 9, -20);
    ctx.quadraticCurveTo(12, -8, 10.5, 12);
    ctx.quadraticCurveTo(9, 21, 0, 21);
    ctx.quadraticCurveTo(-9, 21, -10.5, 12);
    ctx.quadraticCurveTo(-12, -8, -9, -20);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    /* gold racing stripe */
    ctx.fillStyle = COL.gold;
    ctx.fillRect(-2.2, -22, 4.4, 43);
    /* windshield + rear window */
    ctx.fillStyle = COL.teal;
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(-7.5, -12, 15, 8, 2.5); ctx.fill(); ctx.beginPath(); ctx.roundRect(-7, 9, 14, 6, 2.5); ctx.fill(); }
    else { ctx.fillRect(-7.5, -12, 15, 8); ctx.fillRect(-7, 9, 14, 6); }
    ctx.restore();
  }

  /* —— HUD + overlays —— */
  function syncHud() {
    $("run-dist").textContent = Math.floor(distance / 10) + " m";
    $("run-hi").textContent = "best " + stats.best + " m";
    $("run-boost").hidden = !(state === "run" && boosting());
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
    layout();
    if (car) {
      car.y = Math.round(H * 0.78);
      var m = car.r + 4;
      car.x = Math.max(roadX + m, Math.min(roadX + roadW - m, car.x));
    }
    if (state === "ready" && car) draw();
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

  /* —— input: two thumbs —— */
  var pointers = {};   // pointerId -> "L" | "R"
  function sideOf(e) {
    var rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left) < rect.width / 2 ? "L" : "R";
  }
  function recomputeSteer() {
    steerLeft = false; steerRight = false;
    for (var id in pointers) {
      if (pointers[id] === "L") steerLeft = true; else steerRight = true;
    }
  }
  function press() {
    if (state === "ready") { requestTilt(); start(); }
    else if (state === "over" && now() - overAt > 350) start();
  }
  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (state !== "run") { press(); return; }
    pointers[e.pointerId] = sideOf(e);
    recomputeSteer();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (pointers[e.pointerId] != null) { pointers[e.pointerId] = sideOf(e); recomputeSteer(); }
  });
  function releasePointer(e) { delete pointers[e.pointerId]; recomputeSteer(); }
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerout", function (e) { if (e.pointerType !== "mouse") releasePointer(e); });

  /* keyboard (desktop) */
  window.addEventListener("keydown", function (e) {
    if (!$("overlay").hidden) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") { steerLeft = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "ArrowRight" || e.code === "KeyD") { steerRight = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "ArrowUp" || e.code === "KeyW") { boostKey = true; e.preventDefault(); if (state !== "run") press(); }
    else if (e.code === "Space") { e.preventDefault(); if (state !== "run") press(); else boostKey = true; }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") steerLeft = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") steerRight = false;
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") boostKey = false;
  });

  /* tilt-to-boost: raising the phone toward upright hits the gas.
     beta ≈ 0° flat on the table, ≈ 90° held upright; hysteresis avoids flicker.
     iOS 13+ requires a user-gesture permission request — done on first tap. */
  var tiltWired = false;
  function wireTilt() {
    if (tiltWired || !window.DeviceOrientationEvent) return;
    tiltWired = true;
    window.addEventListener("deviceorientation", function (e) {
      if (e.beta == null) return;
      var b = Math.abs(e.beta);
      if (b >= 58) tiltBoost = true;
      else if (b <= 48) tiltBoost = false;
    });
  }
  function requestTilt() {
    if (!window.DeviceOrientationEvent) return;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then(function (res) {
          if (res === "granted") wireTilt();
        }).catch(function () { /* stays keyboard/thumb only */ });
      } else {
        wireTilt();
      }
    } catch (e) { /* no tilt — thumbs still work */ }
  }

  $("run-start").addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });
  $("run-over").addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; e.preventDefault(); press(); });
  $("btn-retry").addEventListener("click", function (e) { e.stopPropagation(); start(); });
  document.addEventListener("visibilitychange", function () { last = now(); });

  /* —— share —— */
  function shareText() {
    var m = Math.floor(distance / 10);
    return "Roostr Coop Racer 🏁🐓 — I raced " + m + " m dodging roosters! Beat me?\n" + SITE_URL;
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
  if (!localStorage.getItem("rc-seen")) { save("rc-seen", 1); openModal("modal-help"); }
})();
