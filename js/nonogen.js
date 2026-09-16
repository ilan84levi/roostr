/* Roostr Nonogram generator — deterministic daily 10×10 picross puzzles.
   A puzzle is only accepted if a pure line-by-line logic solver completes it,
   which guarantees a unique solution AND that it's solvable without guessing.
   Exported for the engine (js/nonogram.js) and Node tests. */
var NonoGen = (function () {
  "use strict";
  var N = 10;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clueOf(line) {
    var out = [], run = 0;
    for (var i = 0; i < line.length; i++) {
      if (line[i]) run++;
      else if (run) { out.push(run); run = 0; }
    }
    if (run) out.push(run);
    return out.length ? out : [0];
  }

  /* all placements of `clue` runs in a line of length N consistent with
     `known` (-1 unknown, 0 empty, 1 filled); returns [everFilled, everEmpty]
     bitmasks or null if none. */
  function linePossibilities(clue, known) {
    var everF = 0, everE = 0, any = false;
    var runs = clue[0] === 0 ? [] : clue;
    function rec(pos, ri, mask) {
      if (ri === runs.length) {
        for (var i = pos; i < N; i++) if (known[i] === 1) return;
        var emptyMask = (~mask) & ((1 << N) - 1);
        everF |= mask; everE |= emptyMask; any = true;
        return;
      }
      var len = runs[ri];
      var maxStart = N - len;
      for (var i2 = ri + 1; i2 < runs.length; i2++) maxStart -= runs[i2] + 1;
      for (var s = pos; s <= maxStart; s++) {
        var ok = true;
        for (var g = pos; g < s; g++) if (known[g] === 1) { ok = false; break; }
        if (ok) {
          for (var f = s; f < s + len; f++) if (known[f] === 0) { ok = false; break; }
        }
        if (ok && s + len < N && known[s + len] === 1) ok = false;
        if (ok) {
          var m2 = mask;
          for (var f2 = s; f2 < s + len; f2++) m2 |= (1 << f2);
          rec(s + len + 1, ri + 1, m2);
        }
      }
    }
    rec(0, 0, 0);
    return any ? [everF, everE] : null;
  }

  /* returns solved grid (N*N array of 0/1) or null if logic stalls/contradicts */
  function solve(rowClues, colClues) {
    var g = [];
    for (var i = 0; i < N * N; i++) g.push(-1);
    function getRow(r) { var out = []; for (var c = 0; c < N; c++) out.push(g[r * N + c]); return out; }
    function getCol(c) { var out = []; for (var r = 0; r < N; r++) out.push(g[r * N + c]); return out; }
    var changed = true, guard = 0;
    while (changed && guard++ < 200) {
      changed = false;
      for (var r = 0; r < N; r++) {
        var res = linePossibilities(rowClues[r], getRow(r));
        if (!res) return null;
        for (var c = 0; c < N; c++) {
          var idx = r * N + c;
          var f = (res[0] >> c) & 1, e = (res[1] >> c) & 1;
          if (g[idx] === -1) {
            if (f && !e) { g[idx] = 1; changed = true; }
            else if (e && !f) { g[idx] = 0; changed = true; }
          }
        }
      }
      for (var c2 = 0; c2 < N; c2++) {
        var res2 = linePossibilities(colClues[c2], getCol(c2));
        if (!res2) return null;
        for (var r2 = 0; r2 < N; r2++) {
          var idx2 = r2 * N + c2;
          var f2 = (res2[0] >> r2) & 1, e2 = (res2[1] >> r2) & 1;
          if (g[idx2] === -1) {
            if (f2 && !e2) { g[idx2] = 1; changed = true; }
            else if (e2 && !f2) { g[idx2] = 0; changed = true; }
          }
        }
      }
    }
    for (i = 0; i < N * N; i++) if (g[i] === -1) return null;
    return g;
  }

  /* deterministic daily puzzle: try attempt seeds until one is line-solvable */
  function generate(day) {
    for (var att = 0; att < 80; att++) {
      var rng = mulberry32(day * 2654435761 + att * 7919 + 233);
      var grid = [];
      var density = 0.5 + rng() * 0.12;
      for (var i = 0; i < N * N; i++) grid.push(rng() < density ? 1 : 0);
      var rowClues = [], colClues = [];
      for (var r = 0; r < N; r++) {
        var row = []; for (var c = 0; c < N; c++) row.push(grid[r * N + c]);
        rowClues.push(clueOf(row));
      }
      for (var c2 = 0; c2 < N; c2++) {
        var col = []; for (var r2 = 0; r2 < N; r2++) col.push(grid[r2 * N + c2]);
        colClues.push(clueOf(col));
      }
      var solved = solve(rowClues, colClues);
      if (solved) return { size: N, rowClues: rowClues, colClues: colClues, solution: solved, attempt: att };
    }
    return null;
  }

  return { generate: generate, solve: solve, clueOf: clueOf, N: N };
})();
if (typeof module !== "undefined" && module.exports) module.exports = NonoGen;
