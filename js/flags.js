/* Roostr — flag data for "Guess the Flag".
   Each flag is hand-built from simple, accurate geometry (viewBox 90×60, a 3:2
   ratio) so it renders crisply at any size with no external image requests.
   Curated 2026-06 from stable public reference knowledge. */
const FLAGS = (function () {
  "use strict";
  var W = 90, H = 60;

  /* —— little SVG builders —— */
  function rectV(x, w, c) { return '<rect x="' + x + '" y="0" width="' + w + '" height="' + H + '" fill="' + c + '"/>'; }
  function rectH(y, h, c) { return '<rect x="0" y="' + y + '" width="' + W + '" height="' + h + '" fill="' + c + '"/>'; }
  function vert3(a, b, c) { return rectV(0, 30, a) + rectV(30, 30, b) + rectV(60, 30, c); }
  function horiz3(a, b, c) { return rectH(0, 20, a) + rectH(20, 20, b) + rectH(40, 20, c); }
  function horiz2(a, b) { return rectH(0, 30, a) + rectH(30, 30, b); }
  function field(c) { return '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + c + '"/>'; }
  function disc(cx, cy, r, c) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + c + '"/>'; }
  /* a 5-point star centred at (cx,cy) with outer radius r */
  function starFn(cx, cy, r, c) {
    var pts = [], inner = r * 0.382;
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? r : inner;
      pts.push((cx + rad * Math.cos(ang)).toFixed(2) + ',' + (cy + rad * Math.sin(ang)).toFixed(2));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + c + '"/>';
  }

  /* Nordic cross: vertical bar offset toward the hoist (left). */
  function nordic(bg, cross, inner) {
    var s = field(bg);
    var bar = 12, ix = 24, iy = 24;                 // outer cross thickness/position
    s += '<rect x="0" y="' + iy + '" width="' + W + '" height="' + bar + '" fill="' + cross + '"/>';
    s += '<rect x="' + ix + '" y="0" width="' + bar + '" height="' + H + '" fill="' + cross + '"/>';
    if (inner) {
      var b2 = 5, ox = (bar - b2) / 2;
      s += '<rect x="0" y="' + (iy + ox) + '" width="' + W + '" height="' + b2 + '" fill="' + inner + '"/>';
      s += '<rect x="' + (ix + ox) + '" y="0" width="' + b2 + '" height="' + H + '" fill="' + inner + '"/>';
    }
    return s;
  }

  function svg(inner) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" ' +
      'preserveAspectRatio="none" role="img">' + inner + '</svg>';
  }

  /* United Kingdom — recognisable Union Jack (geometry simplified). */
  function unionJack() {
    return '<defs><clipPath id="uk"><rect width="90" height="60"/></clipPath></defs>' +
      '<g clip-path="url(#uk)">' +
      field('#012169') +
      '<path d="M0,0 L90,60 M90,0 L0,60" stroke="#fff" stroke-width="12"/>' +
      '<path d="M0,0 L90,60 M90,0 L0,60" stroke="#C8102E" stroke-width="5"/>' +
      '<rect x="0" y="23" width="90" height="14" fill="#fff"/>' +
      '<rect x="38" y="0" width="14" height="60" fill="#fff"/>' +
      '<rect x="0" y="26" width="90" height="8" fill="#C8102E"/>' +
      '<rect x="41" y="0" width="8" height="60" fill="#C8102E"/>' +
      '</g>';
  }

  /* United States — 13 stripes + 50-star canton (9 rows: 6,5,6…). */
  function starsAndStripes() {
    var s = '', i, stripeH = H / 13;
    for (i = 0; i < 13; i++) s += rectH(i * stripeH, stripeH, i % 2 === 0 ? '#B22234' : '#fff');
    var cantonW = 36, cantonH = stripeH * 7;
    s += '<rect x="0" y="0" width="' + cantonW + '" height="' + cantonH + '" fill="#3C3B6E"/>';
    var star = '';
    for (var row = 0; row < 9; row++) {
      var cols = row % 2 === 0 ? 6 : 5;
      var offx = row % 2 === 0 ? 3.6 : 6.6;
      var py = 2.6 + row * (cantonH - 4.6) / 8;
      for (var col = 0; col < cols; col++) {
        var px = offx + col * 6;
        star += starFn(px, py, 1.7, '#fff');
      }
    }
    return s + star;
  }

  /* Greece — 9 blue/white stripes + canton with a white cross. */
  function greece() {
    var s = '', i, st = H / 9;
    for (i = 0; i < 9; i++) s += rectH(i * st, st, i % 2 === 0 ? '#0D5EAF' : '#fff');
    var cw = st * 5;
    s += '<rect x="0" y="0" width="' + cw + '" height="' + cw + '" fill="#0D5EAF"/>';
    var t = 5, mid = cw / 2;
    s += '<rect x="0" y="' + (mid - t / 2) + '" width="' + cw + '" height="' + t + '" fill="#fff"/>';
    s += '<rect x="' + (mid - t / 2) + '" y="0" width="' + t + '" height="' + cw + '" fill="#fff"/>';
    return s;
  }

  /* Swiss cross (rendered to fill the 3:2 box). */
  function swiss() {
    var s = field('#D52B1E'), t = 12;
    s += '<rect x="0" y="' + ((H - t) / 2) + '" width="' + W + '" height="' + t + '" fill="#fff"/>';
    s += '<rect x="' + ((W - t) / 2) + '" y="0" width="' + t + '" height="' + H + '" fill="#fff"/>';
    return s;
  }

  /* Thailand — red / white / blue(2×) / white / red. */
  function thailand() {
    return rectH(0, 10, '#A51931') + rectH(10, 10, '#fff') + rectH(20, 20, '#2D2A4A') +
      rectH(40, 10, '#fff') + rectH(50, 10, '#A51931');
  }

  var F = [
    /* —— vertical tricolours —— */
    { name: "France", region: "Europe", svg: svg(vert3('#0055A4', '#fff', '#EF4135')),
      fact: "The French tricolour's blue and red come from Paris; the white was the royal colour." },
    { name: "Italy", region: "Europe", svg: svg(vert3('#009246', '#fff', '#CE2B37')),
      fact: "Italy's green-white-red was inspired by the French flag during Napoleon's campaigns." },
    { name: "Ireland", region: "Europe", svg: svg(vert3('#169B62', '#fff', '#FF883E')),
      fact: "The orange honours Irish Protestants; the white between stands for peace with the green Catholic tradition." },
    { name: "Belgium", region: "Europe", svg: svg(vert3('#000000', '#FDDA24', '#EF3340')),
      fact: "Belgium's colours come from the old Duchy of Brabant's coat of arms." },
    { name: "Romania", region: "Europe", svg: svg(vert3('#002B7F', '#FCD116', '#CE1126')),
      fact: "Romania's flag is nearly identical to Chad's — the two governments have actually disputed it." },
    { name: "Nigeria", region: "Africa", svg: svg(vert3('#008751', '#fff', '#008751')),
      fact: "Nigeria's green stands for its farmland; the design won a 1959 student competition." },
    { name: "Peru", region: "Americas", svg: svg(vert3('#D91023', '#fff', '#D91023')),
      fact: "Legend says Peru's red-and-white came from flamingos San Martín saw taking flight." },
    { name: "Mali", region: "Africa", svg: svg(vert3('#14B53A', '#FCD116', '#CE1126')),
      fact: "Mali uses the pan-African colours green, gold and red." },
    { name: "Guinea", region: "Africa", svg: svg(vert3('#CE1126', '#FCD116', '#009460')),
      fact: "Guinea's flag is the mirror image of Mali's." },
    { name: "Ivory Coast", region: "Africa", svg: svg(vert3('#F77F00', '#fff', '#009E60')),
      fact: "Côte d'Ivoire's flag is Ireland's reversed — orange at the hoist instead of the fly." },

    /* —— horizontal tricolours —— */
    { name: "Germany", region: "Europe", svg: svg(horiz3('#000000', '#DD0000', '#FFCE00')),
      fact: "The black-red-gold dates to 19th-century soldiers' uniforms in the wars against Napoleon." },
    { name: "Netherlands", region: "Europe", svg: svg(horiz3('#AE1C28', '#fff', '#21468B')),
      fact: "The Dutch flag is the oldest tricolour still in use, dating to the late 1500s." },
    { name: "Russia", region: "Europe", svg: svg(horiz3('#fff', '#0039A6', '#D52B1E')),
      fact: "Peter the Great based Russia's flag on the Dutch one after a shipbuilding visit." },
    { name: "Austria", region: "Europe", svg: svg(horiz3('#ED2939', '#fff', '#ED2939')),
      fact: "Austria's flag may be the oldest national design of all, traced to a duke's blood-soaked tunic in 1191." },
    { name: "Hungary", region: "Europe", svg: svg(horiz3('#CD2A3E', '#fff', '#436F4D')),
      fact: "Red for strength, white for faithfulness, green for hope." },
    { name: "Bulgaria", region: "Europe", svg: svg(horiz3('#fff', '#00966E', '#D62612')),
      fact: "Bulgaria swapped the usual Slavic blue for green to represent its farmland." },
    { name: "Lithuania", region: "Europe", svg: svg(horiz3('#FDB913', '#006A44', '#C1272D')),
      fact: "Lithuania's yellow-green-red was revived in 1989 as the country broke from the USSR." },
    { name: "Armenia", region: "Asia", svg: svg(horiz3('#D90012', '#0033A0', '#F2A800')),
      fact: "The orange band is said to stand for the Armenian people's hard work and courage." },
    { name: "Estonia", region: "Europe", svg: svg(horiz3('#0072CE', '#000000', '#fff')),
      fact: "Blue for the sky, black for the soil and hardship, white for the snow and freedom." },
    { name: "Gabon", region: "Africa", svg: svg(horiz3('#009E60', '#FCD116', '#3A75C4')),
      fact: "Gabon's green is its forests, gold the equator that runs through it, blue the sea." },

    /* —— two bands —— */
    { name: "Ukraine", region: "Europe", svg: svg(horiz2('#0057B7', '#FFDD00')),
      fact: "Blue sky over a field of golden wheat — a literal Ukrainian landscape." },
    { name: "Indonesia", region: "Asia", svg: svg(horiz2('#FF0000', '#fff')),
      fact: "Indonesia's flag is Monaco's, just slightly taller — both are red over white." },
    { name: "Poland", region: "Europe", svg: svg(horiz2('#fff', '#DC143C')),
      fact: "Poland's white-over-red is the reverse of Indonesia's and Monaco's." },

    /* —— a disc in the field —— */
    { name: "Japan", region: "Asia", svg: svg(field('#fff') + disc(45, 30, 16, '#BC002D')),
      fact: "The red disc is the sun — Japan is Nihon, 'the origin of the sun'." },
    { name: "Bangladesh", region: "Asia", svg: svg(field('#006A4E') + disc(41, 30, 15, '#F42A41')),
      fact: "The red circle sits slightly off-centre so it looks centred when the flag flies." },
    { name: "Palau", region: "Oceania", svg: svg(field('#4AADD6') + disc(40, 30, 15, '#FFDE00')),
      fact: "Palau's golden disc is the moon, not the sun — considered most beautiful over its waters." },

    /* —— Nordic crosses —— */
    { name: "Sweden", region: "Europe", svg: svg(nordic('#006AA7', '#FECC00')),
      fact: "Sweden's gold cross on blue may derive from a golden cross a king saw in the sky." },
    { name: "Denmark", region: "Europe", svg: svg(nordic('#C8102E', '#fff')),
      fact: "The Dannebrog is the oldest continuously used national flag, legend dating it to 1219." },
    { name: "Finland", region: "Europe", svg: svg(nordic('#fff', '#003580')),
      fact: "Blue for the country's thousands of lakes, white for the winter snow." },
    { name: "Norway", region: "Europe", svg: svg(nordic('#BA0C2F', '#fff', '#00205B')),
      fact: "Norway's flag cleverly contains the flags of Denmark, Sweden and even France within it." },
    { name: "Iceland", region: "Europe", svg: svg(nordic('#02529C', '#fff', '#DC1E35')),
      fact: "Blue mountains, white ice and red volcanic fire — Iceland in one flag." },

    /* —— special geometry —— */
    { name: "Switzerland", region: "Europe", svg: svg(swiss()),
      fact: "Switzerland's is one of only two square national flags (the Vatican's is the other)." },
    { name: "Greece", region: "Europe", svg: svg(greece()),
      fact: "The nine stripes are often linked to the nine syllables of the Greek cry for freedom." },
    { name: "Thailand", region: "Asia", svg: svg(thailand()),
      fact: "The blue centre band was added in 1917 to align Thailand with its WWI allies." },
    { name: "United Kingdom", region: "Europe", svg: svg(unionJack()),
      fact: "The Union Jack overlays the crosses of England, Scotland and Ireland's patron saints." },
    { name: "United States", region: "Americas", svg: svg(starsAndStripes()),
      fact: "The 50 stars are states, the 13 stripes the original colonies." }
  ];

  return F;
})();
if (typeof module !== "undefined") module.exports = FLAGS;
