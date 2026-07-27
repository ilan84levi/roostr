/* Roostr Sudoku generator — deterministic, seeded, dependency-free.
   generate(seed, holes) returns { puzzle, solution, givens } where puzzle and
   solution are 81-length arrays (0 = empty). The digger only removes a cell
   while the puzzle keeps exactly one solution, so every puzzle is unique. */
var SudokuGen = (function () {
  "use strict";

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function rowOf(i) { return Math.floor(i / 9); }
  function colOf(i) { return i % 9; }
  function boxOf(i) { return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3); }

  function candidates(grid, idx) {
    var used = 0;
    var r = rowOf(idx), c = colOf(idx);
    var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (var k = 0; k < 9; k++) {
      used |= 1 << grid[r * 9 + k];
      used |= 1 << grid[k * 9 + c];
      used |= 1 << grid[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)];
    }
    var out = [];
    for (var d = 1; d <= 9; d++) if (!(used & (1 << d))) out.push(d);
    return out;
  }

  /* fill an empty grid into a full valid solution (seeded order) */
  function fillGrid(grid, rng) {
    var idx = grid.indexOf(0);
    if (idx < 0) return true;
    var cands = shuffled(candidates(grid, idx), rng);
    for (var i = 0; i < cands.length; i++) {
      grid[idx] = cands[i];
      if (fillGrid(grid, rng)) return true;
    }
    grid[idx] = 0;
    return false;
  }

  /* count solutions up to `cap`, choosing the most-constrained cell first */
  function countSolutions(grid, cap) {
    var bestIdx = -1, bestCands = null;
    for (var i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue;
      var c = candidates(grid, i);
      if (c.length === 0) return 0;
      if (bestCands === null || c.length < bestCands.length) { bestIdx = i; bestCands = c; }
      if (bestCands.length === 1) break;
    }
    if (bestIdx < 0) return 1;                    // full grid = one solution
    var total = 0;
    for (var k = 0; k < bestCands.length; k++) {
      grid[bestIdx] = bestCands[k];
      total += countSolutions(grid, cap - total);
      grid[bestIdx] = 0;
      if (total >= cap) return total;
    }
    return total;
  }

  function generate(seed, holes) {
    var rng = mulberry32(seed);
    var grid = [];
    for (var i = 0; i < 81; i++) grid.push(0);
    fillGrid(grid, rng);
    var solution = grid.slice();

    var order = [];
    for (i = 0; i < 81; i++) order.push(i);
    order = shuffled(order, rng);
    var removed = 0;
    for (i = 0; i < order.length && removed < holes; i++) {
      var idx = order[i];
      var backup = grid[idx];
      grid[idx] = 0;
      if (countSolutions(grid.slice(), 2) !== 1) grid[idx] = backup;
      else removed++;
    }
    return { puzzle: grid, solution: solution, givens: 81 - removed };
  }

  return { generate: generate, countSolutions: countSolutions, rowOf: rowOf, colOf: colOf, boxOf: boxOf };
})();
if (typeof module !== "undefined" && module.exports) module.exports = SudokuGen;
