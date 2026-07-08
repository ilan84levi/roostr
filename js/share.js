/* Roostr — one-tap social share row, shared by every game.
   Call RoostrShare.render(containerEl, text) when a result is shown; it builds
   WhatsApp / X / Telegram / Copy buttons from the result text. No dependencies. */
(function () {
  "use strict";

  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { return; }
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2000);
  }

  function copy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Result copied — go brag"); },
        function () { window.prompt("Copy your result:", text); }
      );
    } else {
      window.prompt("Copy your result:", text);
    }
  }

  window.RoostrShare = {
    render: function (container, text) {
      if (!container) return;
      var url = location.href.split("#")[0].split("?")[0];
      var t = encodeURIComponent(text);
      var u = encodeURIComponent(url);

      container.innerHTML = "";
      var label = document.createElement("span");
      label.className = "share-row-label";
      label.textContent = "Share:";
      container.appendChild(label);

      var targets = [
        { name: "WhatsApp", cls: "sh-wa", href: "https://wa.me/?text=" + t },
        { name: "X", cls: "sh-x", href: "https://twitter.com/intent/tweet?text=" + t },
        { name: "Telegram", cls: "sh-tg", href: "https://t.me/share/url?url=" + u + "&text=" + t }
      ];
      targets.forEach(function (tg) {
        var a = document.createElement("a");
        a.className = "share-btn " + tg.cls;
        a.href = tg.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = tg.name;
        a.setAttribute("aria-label", "Share on " + tg.name);
        container.appendChild(a);
      });

      var c = document.createElement("button");
      c.type = "button";
      c.className = "share-btn sh-copy";
      c.textContent = "Copy";
      c.setAttribute("aria-label", "Copy result to clipboard");
      c.addEventListener("click", function () { copy(text); });
      container.appendChild(c);
    }
  };
})();
