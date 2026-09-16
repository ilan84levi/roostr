/* Roostr Solitaire core — pure Klondike (draw-1) rules, no DOM.
   Cards are ints 0..51: suit = Math.floor(c/13) (0♠ 1♥ 2♦ 3♣), rank = c%13+1
   (1 = ace … 13 = king). Exported for the engine (js/solitaire.js) and for
   Node tests. */
var SolitaireCore = (function () {
  "use strict";

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function suit(c) { return Math.floor(c / 13); }
  function rank(c) { return c % 13 + 1; }
  function isRed(c) { var s = suit(c); return s === 1 || s === 2; }

  function deal(seed) {
    var rng = mulberry32(seed);
    var deck = [];
    for (var i = 0; i < 52; i++) deck.push(i);
    for (i = 51; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    var st = { stock: [], waste: [], found: [[], [], [], []], tab: [], flips: [] };
    var p = 0;
    for (i = 0; i < 7; i++) {
      var pile = [];
      for (j = 0; j <= i; j++) pile.push({ c: deck[p++], up: j === i });
      st.tab.push(pile);
    }
    while (p < 52) st.stock.push(deck[p++]);
    return st;
  }

  /* —— legality —— */
  function canToFound(st, c) {
    var f = st.found[suit(c)];
    return rank(c) === f.length + 1;
  }
  function canToTab(st, c, j) {
    var pile = st.tab[j];
    if (pile.length === 0) return rank(c) === 13;
    var top = pile[pile.length - 1];
    if (!top.up) return false;
    return isRed(top.c) !== isRed(c) && rank(top.c) === rank(c) + 1;
  }

  /* —— moves (mutate st, return true if applied) —— */
  function draw(st) {
    if (st.stock.length) { st.waste.push(st.stock.pop()); return true; }
    if (st.waste.length) {                      // recycle
      while (st.waste.length) st.stock.push(st.waste.pop());
      return true;
    }
    return false;
  }
  function flipIfNeeded(st, j) {
    var pile = st.tab[j];
    if (pile.length && !pile[pile.length - 1].up) pile[pile.length - 1].up = true;
  }
  function wasteToFound(st) {
    if (!st.waste.length) return false;
    var c = st.waste[st.waste.length - 1];
    if (!canToFound(st, c)) return false;
    st.found[suit(c)].push(st.waste.pop());
    return true;
  }
  function wasteToTab(st, j) {
    if (!st.waste.length) return false;
    var c = st.waste[st.waste.length - 1];
    if (!canToTab(st, c, j)) return false;
    st.tab[j].push({ c: st.waste.pop(), up: true });
    return true;
  }
  function tabToFound(st, i) {
    var pile = st.tab[i];
    if (!pile.length) return false;
    var top = pile[pile.length - 1];
    if (!top.up || !canToFound(st, top.c)) return false;
    st.found[suit(top.c)].push(pile.pop().c);
    flipIfNeeded(st, i);
    return true;
  }
  function foundToTab(st, s, j) {
    var f = st.found[s];
    if (!f.length) return false;
    var c = f[f.length - 1];
    if (!canToTab(st, c, j)) return false;
    st.tab[j].push({ c: f.pop(), up: true });
    return true;
  }
  function tabToTab(st, i, k, j) {              // move run tab[i][k..] onto tab[j]
    if (i === j) return false;
    var pile = st.tab[i];
    if (k < 0 || k >= pile.length || !pile[k].up) return false;
    if (!canToTab(st, pile[k].c, j)) return false;
    var run = pile.splice(k);
    for (var m = 0; m < run.length; m++) st.tab[j].push(run[m]);
    flipIfNeeded(st, i);
    return true;
  }

  function won(st) {
    return st.found[0].length === 13 && st.found[1].length === 13 &&
           st.found[2].length === 13 && st.found[3].length === 13;
  }
  /* all cards face-up and stock/waste empty → the rest is mechanical */
  function autoFinishable(st) {
    if (st.stock.length || st.waste.length) return false;
    for (var i = 0; i < 7; i++) {
      var pile = st.tab[i];
      for (var k = 0; k < pile.length; k++) if (!pile[k].up) return false;
    }
    return true;
  }
  function autoFinishStep(st) {                 // one card to a foundation, or false
    for (var i = 0; i < 7; i++) if (tabToFound(st, i)) return true;
    return false;
  }

  function cardCount(st) {
    var n = st.stock.length + st.waste.length;
    for (var s = 0; s < 4; s++) n += st.found[s].length;
    for (var i = 0; i < 7; i++) n += st.tab[i].length;
    return n;
  }

  return {
    suit: suit, rank: rank, isRed: isRed, deal: deal,
    canToFound: canToFound, canToTab: canToTab,
    draw: draw, wasteToFound: wasteToFound, wasteToTab: wasteToTab,
    tabToFound: tabToFound, tabToTab: tabToTab, foundToTab: foundToTab,
    won: won, autoFinishable: autoFinishable, autoFinishStep: autoFinishStep,
    cardCount: cardCount
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = SolitaireCore;
