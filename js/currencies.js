/* Roostr currency dataset — 36 world currencies, each rendered as a small
   stylized banknote (inline SVG, no external image requests). The banknote
   shows the currency's NAME and SYMBOL; the player guesses the COUNTRY.
   Each entry: { name (country), currency, symbol, region, fact, svg }.
   Every displayed currency name is unique, so each clue maps to one country. */
var CURRENCIES = (function () {
  "use strict";

  /* Build a banknote SVG from a two-colour (flag-derived) palette, the
     currency symbol, the currency name and a flavour denomination. */
  function note(c1, c2, ink, sym, name, denom) {
    var g = "grad" + Math.abs(hash(name));
    return '' +
      '<svg viewBox="0 0 320 180" role="img" aria-label="' + name + ' banknote">' +
        '<defs>' +
          '<linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="' + c1 + '"/>' +
            '<stop offset="1" stop-color="' + c2 + '"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<rect x="1" y="1" width="318" height="178" rx="12" fill="url(#' + g + ')" stroke="' + ink + '" stroke-width="2"/>' +
        '<rect x="10" y="10" width="300" height="160" rx="8" fill="none" stroke="' + ink + '" stroke-opacity=".45" stroke-width="1.5"/>' +
        '<circle cx="264" cy="54" r="30" fill="#ffffff" fill-opacity=".16" stroke="' + ink + '" stroke-opacity=".4" stroke-width="1.5"/>' +
        '<text x="264" y="66" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="34" fill="' + ink + '">' + esc(sym) + '</text>' +
        '<text x="28" y="52" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="30" fill="' + ink + '">' + esc(sym) + '</text>' +
        '<text x="28" y="120" font-family="Georgia,\'Times New Roman\',serif" font-style="italic" font-weight="700" font-size="30" fill="' + ink + '">' + esc(name) + '</text>' +
        '<text x="28" y="150" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" font-size="17" letter-spacing="3" fill="' + ink + '" fill-opacity=".8">' + denom + '</text>' +
        '<text x="296" y="150" text-anchor="end" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="24" fill="' + ink + '" fill-opacity=".85">' + denom + '</text>' +
      '</svg>';
  }
  function hash(s) { var h = 0, i; for (i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return h; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* country, currency name, symbol, region, palette (c1,c2,ink), denom, fun fact */
  var D = [
    ["Japan",          "Yen",      "¥",   "East Asia",     "#bc002d", "#ffe3e8", "#7a0016", 1000, "The yen's name means “round object”; Japan has no banknote smaller than 1,000 yen."],
    ["China",          "Yuan",     "¥", "East Asia",  "#de2910", "#ffd95a", "#7a0e05", 100,  "Chinese banknotes are officially the renminbi; “yuan” is the unit you count in."],
    ["South Korea",    "Won",      "₩", "East Asia",  "#0047a0", "#cfe0ff", "#00245a", 5000, "South Korea has no coins in everyday circulation above 500 won."],
    ["India",          "Rupee",    "₹", "South Asia", "#ff9933", "#ffe6c7", "#8a4a00", 500,  "The ₹ symbol, adopted in 2010, blends the Latin ‘R’ with the Devanagari ‘र’."],
    ["Thailand",       "Baht",     "฿", "SE Asia",    "#a51931", "#f4c9d0", "#5c0e1c", 100,  "The baht was once a unit of weight — about 15 grams of silver."],
    ["Vietnam",        "Dong",     "₫", "SE Asia",    "#da251d", "#ffe08a", "#7a120d", 50000,"Vietnam's dong notes are printed on durable plastic polymer, not paper."],
    ["Indonesia",      "Rupiah",   "Rp",  "SE Asia",       "#e70011", "#ffd4d8", "#7a0009", 10000,"A single US dollar is worth over 15,000 Indonesian rupiah."],
    ["Malaysia",       "Ringgit",  "RM",  "SE Asia",       "#010066", "#ffd75e", "#000040", 50,   "“Ringgit” means “jagged” — a nod to the milled edges of old Spanish dollars."],
    ["Philippines",    "Peso",     "₱", "SE Asia",    "#0038a8", "#ffde59", "#00205e", 100,  "The Philippine peso sign ₱ is a capital P with two strokes through it."],
    ["Bangladesh",     "Taka",     "৳", "South Asia", "#006a4e", "#f0d97a", "#003a2b", 100,  "“Taka” comes from an old Sanskrit word for a silver coin."],
    ["United Kingdom", "Pound",    "£", "Europe",     "#012169", "#c8102e", "#000f3a", 20,   "The pound sterling is the world's oldest currency still in use — over 1,200 years."],
    ["Poland",         "Złoty","zł","Europe",    "#dc143c", "#ffd7de", "#7a0a20", 100,  "“Złoty” simply means “golden” in Polish."],
    ["Hungary",        "Forint",   "Ft",  "Europe",        "#436f4d", "#e7c27a", "#254029", 10000,"The forint is named after the gold florins once struck in Florence."],
    ["Czechia",        "Koruna",   "Kč","Europe",     "#11457e", "#d7182a", "#082647", 500,  "“Koruna” means “crown” — a name shared by several European currencies."],
    ["Sweden",         "Krona",    "kr",  "Nordic",        "#006aa7", "#fecc00", "#00396a", 100,  "Swedish krona notes feature cultural icons like Greta Garbo and Astrid Lindgren."],
    ["Denmark",        "Krone",    "kr",  "Nordic",        "#c60c30", "#ffd7de", "#6e0619", 50,   "Danish krone banknotes are illustrated with the country's bridges and ancient artefacts."],
    ["Switzerland",    "Franc",    "Fr",  "Europe",        "#d52b1e", "#ffe3e0", "#7a140c", 100,  "Swiss franc notes are among the few printed vertically, not sideways."],
    ["Russia",         "Ruble",    "₽","Europe",      "#0039a6", "#d52b1e", "#001f5c", 1000, "The ruble got its ₽ symbol in 2013 after a public vote."],
    ["Ukraine",        "Hryvnia",  "₴","Europe",      "#005bbb", "#ffd500", "#00306a", 500,  "The hryvnia is named after a medieval measure of weight in silver or gold."],
    ["Turkey",         "Lira",     "₺","Middle East", "#e30a17", "#ffd7da", "#7a060c", 100,  "The Turkish lira symbol ₺ suggests an anchor, pointing to a stable currency."],
    ["Israel",         "Shekel",   "₪","Middle East", "#0038b8", "#dbe6ff", "#001e63", 200,  "The shekel is one of the oldest units of money named in recorded history."],
    ["Saudi Arabia",   "Riyal",    "SR",  "Middle East",   "#006c35", "#e8d79a", "#003a1c", 100,  "“Riyal” descends from the Spanish ‘real,’ the coin of global trade for centuries."],
    ["Iran",           "Rial",     "﷼","Middle East", "#239f40", "#e6d38a", "#0f5a22", 100000,"Iranians often price things in “toman” — informally, ten rials."],
    ["United Arab Emirates", "Dirham", "AED", "Middle East","#00732f", "#e6cf8a", "#003a18", 50,  "“Dirham” comes from the ancient Greek ‘drachma.’"],
    ["Nigeria",        "Naira",    "₦","Africa",       "#008751", "#e7f5ee", "#003a24", 1000, "Nigeria's naira is the most-used currency in West Africa by volume."],
    ["South Africa",   "Rand",     "R",   "Africa",        "#007a4d", "#ffb612", "#00402a", 100,  "The rand is named after the Witwatersrand, the gold-rich ridge beneath Johannesburg."],
    ["Ghana",          "Cedi",     "₵","Africa",       "#ce1126", "#fcd116", "#6e0914", 50,   "“Cedi” comes from the Akan word for the cowrie shells once used as money."],
    ["Kenya",          "Shilling", "KSh", "Africa",        "#006600", "#e7f5e7", "#003a00", 1000, "Kenyan shilling notes picture the nation's wildlife and Big Five animals."],
    ["Ethiopia",       "Birr",     "Br",  "Africa",        "#078930", "#fcdd09", "#04521c", 100,  "“Birr” means “silver” in Amharic."],
    ["United States",  "Dollar",   "$",   "Americas",      "#3c6e47", "#d8e8dc", "#1f3d27", 100,  "The dollar sign likely evolved from a handwritten ‘pesos’ abbreviation."],
    ["Brazil",         "Real",     "R$",  "Americas",      "#009c3b", "#ffdf00", "#00532a", 100,  "Brazilian real notes feature native animals — the jaguar, the macaw, the sea turtle."],
    ["Peru",           "Sol",      "S/",  "Americas",      "#d91023", "#ffd7db", "#70060f", 100,  "“Sol” means “sun” — a nod to the Inca sun god Inti."],
    ["Guatemala",      "Quetzal",  "Q",   "Americas",      "#4997d0", "#dbeeff", "#1c5a86", 100,  "The quetzal is named after Guatemala's national bird, whose feathers were once currency."],
    ["Kazakhstan",     "Tenge",    "₸","Central Asia","#00afca", "#fec50c", "#006c7c", 5000, "The tenge's name shares a root with the Russian word for money, ‘den’gi.’"],
    ["Mongolia",       "Tugrik",   "₮","Central Asia","#c4272e", "#f9cf02", "#6e1518", 20000,"Nearly every Mongolian tugrik note carries a portrait of Genghis Khan."],
    ["Georgia",        "Lari",     "₾","Caucasus",    "#ff0000", "#ffd7d7", "#7a0000", 50,   "The lari symbol ₾ is based on a letter from Georgia's own unique alphabet."]
  ];

  return D.map(function (r) {
    return {
      name: r[0], currency: r[1], symbol: r[2], region: r[3],
      fact: r[8],
      svg: note(r[4], r[5], r[6], r[2], r[1], r[7])
    };
  });
})();
if (typeof module !== "undefined" && module.exports) module.exports = CURRENCIES;
