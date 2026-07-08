/* Roostr Coop Run — a tiny endless runner. No dependencies, no backend.
   Jump the rooster over hay bales and fences; the coop speeds up the longer you
   last. Distance + best run live in localStorage under the "cr-" namespace. */
(function () {
  "use strict";

  /* —— configuration (shared conventions with the puzzle games) —— */
  var SITE_URL = "playroostr.com/run";        // shown in the share text
  var PAYMENT_LINK = "";
  var PAYPAL_EMAIL = "ilan@playroostr.com";
  var COFFEE_MIN = 1.50;
  var ADSENSE_CLIENT = "";
  var ADSENSE_SLOT = "";

  /* —— palette (matches css/style.css) —— */
  var COL = {
    paper: "#f3ead8", paperDeep: "#e7dcc2", card: "#fbf6ea", ink: "#2a2118",
    inkSoft: "#5b4f3f", red: "#b5402a", redDeep: "#93311f", teal: "#20655a",
    gold: "#c89a3f", goldPale: "#ecd9a8"
  };

  var $ = function (id) { return document.getElementById(id); };

  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }
  var stats = load("cr-stats", { plays: 0, best: 0, totalMeters: 0 });
  var isPlus = localStorage.getItem("po-plus") === "1";
  if (isPlus) document.body.classList.add("plus");

  /* —— canvas —— */
  var stage = $("run-stage");
  var canvas = $("run-canvas");
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, groundY = 0;

  function resize() {
    var rect = stage.getBoundingClientRect();
    W = Math.max(280, Math.round(rect.width));
    H = Math.max(220, Math.round(rect.height));
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    groundY = H - 38;
    if (rooster) {                   // keep the rooster grounded after a resize
      rooster.x = Math.max(48, W * 0.16);
      if (rooster.onGround) rooster.y = groundY - rooster.h;
    }
    if (state === "ready" && rooster) draw();   // fresh idle frame on rotate/resize (once initialized)
  }

  /* —— game model —— */
  var GRAVITY = 2500;        // px/s²
  var JUMP_V = 700;          // initial jump velocity — apex ~98px, clears a 42px fence
  var SPEED0 = 250;          // starting scroll speed px/s
  var SPEEDMAX = 560;
  var ACCEL = 9;             // speed gained per second survived

  var rooster, obstacles, speed, distance, nextGap, frame, state, overAt;
  var groundScroll = 0, buntScroll = 0;
  var clouds = [];

  function reset() {
    rooster = { x: Math.max(48, W * 0.16), y: 0, vy: 0, w: 42, h: 36, onGround: true };
    rooster.y = groundY - rooster.h;
    obstacles = [];
    speed = SPEED0;
    distance = 0;
    nextGap = 320;
    frame = 0;
    clouds = [
      { x: W * 0.5, y: 44, s: 1.0 },
      { x: W * 1.1, y: 78, s: 0.7 }
    ];
  }

  function start() {
    reset();
    state = "run";
    hideOverlays();
  }

  function gameOver() {
    state = "over";
    var meters = Math.floor(distance / 10);
    stats.plays++;
    stats.totalMeters += meters;
    if (meters > stats.best) stats.best = meters;
    save("cr-stats", stats);
    overAt = now();
    $("ro-score").textContent = meters;
    $("ro-best").textContent = stats.best;
    $("ro-newbest").hidden = !(meters > 0 && meters === stats.best && meters >= 1);
    show($("run-over"));
    if (window.RoostrShare) RoostrShare.render(document.getElementById("share-row"), shareText());
    syncHud();
  }

  /* —— obstacles —— */
  function spawn() {
    var roll = Math.random();
    var ob;
    if (roll < 0.5) ob = { type: "bale", w: 30, h: 26 };
    else if (roll < 0.8) ob = { type: "fence", w: 16, h: 42 };
    else ob = { type: "bales", w: 52, h: 26 };
    ob.x = W + 10;
    ob.y = groundY - ob.h;
    obstacles.push(ob);
    /* gap shrinks as we speed up, but always stays jump-able */
    var minGap = speed * 0.78 + 90;
    nextGap = minGap + Math.random() * (minGap * 0.7);
  }

  /* —— per-frame update —— */
  function update(dt) {
    frame += dt * 60;
    speed = Math.min(SPEEDMAX, speed + ACCEL * dt);
    distance += speed * dt;
    groundScroll = (groundScroll + speed * dt) % 24;
    buntScroll = (buntScroll + speed * 0.25 * dt) % 56;

    /* rooster physics */
    if (!rooster.onGround) {
      rooster.vy += GRAVITY * dt;
      rooster.y += rooster.vy * dt;
      if (rooster.y >= groundY - rooster.h) {
        rooster.y = groundY - rooster.h;
        rooster.vy = 0;
        rooster.onGround = true;
      }
    }

    /* clouds drift */
    clouds.forEach(function (c) {
      c.x -= speed * 0.12 * c.s * dt;
      if (c.x < -60) { c.x = W + 40; c.y = 40 + Math.random() * 50; }
    });

    /* obstacles */
    nextGap -= speed * dt;
    if (nextGap <= 0) spawn();
    for (var i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed * dt;
      if (obstacles[i].x + obstacles[i].w < -10) obstacles.splice(i, 1);
    }

    /* collision (forgiving hitbox) */
    var rx = rooster.x + 6, ry = rooster.y + 4, rw = rooster.w - 14, rh = rooster.h - 6;
    for (var j = 0; j < obstacles.length; j++) {
      var o = obstacles[j];
      if (rx < o.x + o.w - 3 && rx + rw > o.x + 3 && ry < o.y + o.h && ry + rh > o.y + 2) {
        gameOver();
        return;
      }
    }
    syncHud();
  }

  function jump() {
    if (rooster.onGround) {
      rooster.vy = -JUMP_V;
      rooster.onGround = false;
    }
  }

  /* —— drawing —— */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBunting();
    clouds.forEach(drawCloud);
    drawGround();
    obstacles.forEach(drawObstacle);
    drawRooster();
  }

  function drawBunting() {
    var y = 14, span = 28, n = Math.ceil(W / span) + 2;
    var cols = [COL.red, COL.gold, COL.teal];
    ctx.save();
    ctx.strokeStyle = "rgba(42,33,24,.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y - 4); ctx.stroke();
    for (var i = 0; i < n; i++) {
      var x = i * span - (buntScroll % span);
      ctx.fillStyle = cols[i % 3];
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + span * 0.66, y); ctx.lineTo(x + span * 0.33, y + 16);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawCloud(c) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 13 * c.s, 0, 7); ctx.arc(c.x + 15 * c.s, c.y + 3, 10 * c.s, 0, 7);
    ctx.arc(c.x - 14 * c.s, c.y + 4, 9 * c.s, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function drawGround() {
    ctx.save();
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    ctx.strokeStyle = "rgba(42,33,24,.35)";
    ctx.lineWidth = 2;
    for (var x = -((groundScroll) % 24); x < W; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, groundY + 8); ctx.lineTo(x + 10, groundY + 8); ctx.stroke();
    }
    ctx.restore();
  }

  function drawObstacle(o) {
    ctx.save();
    if (o.type === "fence") {
      ctx.fillStyle = COL.teal;
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = COL.paper;
      ctx.fillRect(o.x - 2, o.y + 10, o.w + 4, 4);
      ctx.fillRect(o.x - 2, o.y + 24, o.w + 4, 4);
    } else {
      /* hay bale(s) */
      var segs = o.type === "bales" ? 2 : 1;
      var sw = o.w / segs;
      for (var s = 0; s < segs; s++) {
        var bx = o.x + s * sw;
        ctx.fillStyle = COL.gold;
        ctx.strokeStyle = COL.redDeep; ctx.lineWidth = 2;
        roundRect(bx + 1, o.y, sw - 2, o.h, 5);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "rgba(147,49,31,.5)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx + 1, o.y + o.h * 0.4); ctx.lineTo(bx + sw - 1, o.y + o.h * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 1, o.y + o.h * 0.7); ctx.lineTo(bx + sw - 1, o.y + o.h * 0.7); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRooster() {
    var x = rooster.x, y = rooster.y, w = rooster.w, h = rooster.h;
    var cx = x + w / 2, feetY = y + h;
    ctx.save();

    /* legs — running cycle on the ground, tucked in the air */
    ctx.strokeStyle = COL.gold; ctx.lineWidth = 3; ctx.lineCap = "round";
    if (rooster.onGround) {
      var swing = Math.sin(frame * 0.6) * 7;
      leg(cx - 5, feetY - 2, -swing); leg(cx + 5, feetY - 2, swing);
    } else {
      leg(cx - 4, feetY - 6, 5); leg(cx + 6, feetY - 6, 8);
    }

    /* tail feathers */
    ctx.fillStyle = COL.teal;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 14);
    ctx.quadraticCurveTo(x - 12, y + 4, x - 6, y + 24);
    ctx.quadraticCurveTo(x - 2, y + 18, x + 6, y + 22);
    ctx.closePath(); ctx.fill();

    /* body */
    ctx.fillStyle = COL.red;
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.55, w * 0.40, h * 0.40, 0, 0, 7);
    ctx.fill(); ctx.stroke();

    /* wing */
    ctx.fillStyle = COL.redDeep;
    ctx.beginPath();
    ctx.ellipse(cx - 2, y + h * 0.58, w * 0.20, h * 0.20, -0.3, 0, 7);
    ctx.fill();

    /* head */
    var hx = x + w * 0.78, hy = y + h * 0.30;
    ctx.fillStyle = COL.red; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, h * 0.24, 0, 7); ctx.fill(); ctx.stroke();

    /* comb */
    ctx.fillStyle = COL.redDeep;
    ctx.beginPath();
    ctx.arc(hx - 3, hy - h * 0.24, 3, 0, 7);
    ctx.arc(hx + 2, hy - h * 0.30, 3.4, 0, 7);
    ctx.arc(hx + 7, hy - h * 0.24, 3, 0, 7);
    ctx.fill();

    /* beak + wattle */
    ctx.fillStyle = COL.gold;
    ctx.beginPath();
    ctx.moveTo(hx + h * 0.20, hy - 2); ctx.lineTo(hx + h * 0.42, hy + 1); ctx.lineTo(hx + h * 0.20, hy + 5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = COL.redDeep;
    ctx.beginPath(); ctx.arc(hx + h * 0.20, hy + 7, 2.4, 0, 7); ctx.fill();

    /* eye */
    ctx.fillStyle = COL.ink;
    ctx.beginPath(); ctx.arc(hx + 2, hy - 2, 2, 0, 7); ctx.fill();

    ctx.restore();

    function leg(px, py, ang) {
      var len = 9, a = ang * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.sin(a) * len, py + len);
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* —— HUD + overlays —— */
  function syncHud() {
    $("run-dist").textContent = Math.floor(distance / 10) + " m";
    $("run-hi").textContent = "best " + stats.best + " m";
  }
  function show(el) { el.hidden = false; }
  function hideOverlays() { $("run-start").hidden = true; $("run-over").hidden = true; }

  /* —— main loop —— */
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  var last = now();
  function loop() {
    var t = now();
    var dt = Math.min(0.034, (t - last) / 1000);
    last = t;
    if (state === "run") { update(dt); }
    draw();
    requestAnimationFrame(loop);
  }

  /* —— input —— */
  function press() {
    if (state === "ready") start();
    else if (state === "run") jump();
    else if (state === "over" && now() - overAt > 350) start();   // small cooldown
  }
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      if (!$("overlay").hidden) return;   // a modal is open
      press();
    }
  });
  canvas.addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });
  $("run-start").addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });
  $("run-over").addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;   // let the share/retry buttons handle themselves
    e.preventDefault(); press();
  });
  $("btn-retry").addEventListener("click", function (e) { e.stopPropagation(); start(); });

  document.addEventListener("visibilitychange", function () { last = now(); });

  /* —— share —— */
  function shareText() {
    var m = Math.floor(distance / 10);
    return "Roostr Coop Run 🐔 — I ran " + m + " m! Can you beat my rooster?\n" + SITE_URL;
  }
  function share() {
    var text = shareText();
    var mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (navigator.share && mobile) navigator.share({ text: text }).catch(function () { copyShare(text); });
    else copyShare(text);
  }
  function copyShare(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Result copied — go brag"); },
        function () { window.prompt("Copy your result:", text); });
    } else { window.prompt("Copy your result:", text); }
  }
  $("btn-share").addEventListener("click", function (e) { e.stopPropagation(); share(); });

  /* —— stats modal —— */
  function renderStats() {
    $("st-plays").textContent = stats.plays;
    $("st-best").textContent = stats.best;
    $("st-total").textContent = stats.totalMeters;
  }

  /* —— coffee tip jar (shared with the other games) —— */
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
    var t = $("toast");
    t.textContent = msg; t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* —— boot —— */
  state = "ready";
  resize();
  reset();
  initAds();
  syncHud();
  draw();                          // paint an immediate idle frame (don't wait for rAF)
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
  if (!localStorage.getItem("cr-seen")) { save("cr-seen", 1); openModal("modal-help"); }
})();
