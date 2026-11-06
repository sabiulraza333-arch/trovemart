/* Motion layer: scroll reveals, header state, and add-to-cart feedback.
   Everything here is decoration — the page is fully usable with JS off, and
   every effect is skipped when the visitor asks for reduced motion. */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { document.documentElement.classList.add("no-motion"); return; }

  document.documentElement.classList.add("motion");

  /* ---- reveal on scroll ---------------------------------------------- */
  // Targets are marked lazily so markup stays clean and anything rendered
  // later (the product grid) can be picked up by the same observer.
  var SELECTOR = [
    ".section-head", ".card", ".info-card", ".prose > h2", ".prose > p",
    ".prose > ul", ".trust-row", ".footer-col", ".footer-brand", ".cform"
  ].join(",");

  if (!("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

  function watch(root) {
    var nodes = (root || document).querySelectorAll(SELECTOR);
    Array.prototype.forEach.call(nodes, function (el, i) {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.classList.add("reveal");
      // Stagger within a row of cards only; long lists should not cascade
      // for a second and a half before the last one shows up.
      el.style.setProperty("--d", (Math.min(i, 7) * 55) + "ms");
      io.observe(el);
    });
  }

  // Safety net. A product that stays at opacity 0 because an observer never
  // fired is a product nobody can buy, so never rely on the observer alone:
  // sweep anything that is on screen but still hidden.
  function sweep() {
    var pending = document.querySelectorAll(".reveal:not(.in)");
    for (var i = 0; i < pending.length; i++) {
      var r = pending[i].getBoundingClientRect();
      if (r.top < window.innerHeight * 0.98 && r.bottom > 0) pending[i].classList.add("in");
    }
  }
  var sweeping = false;
  function queueSweep() {
    if (sweeping) return;
    sweeping = true;
    requestAnimationFrame(function () { sweep(); sweeping = false; });
  }
  window.addEventListener("scroll", queueSweep, { passive: true });
  window.addEventListener("resize", queueSweep, { passive: true });
  window.addEventListener("load", queueSweep);
  setTimeout(queueSweep, 1500);

  watch(document);
  queueSweep();

  // The grid re-renders on filter/search, so re-scan after those mutations.
  var grid = document.getElementById("grid") || document.querySelector(".grid");
  if (grid && "MutationObserver" in window) {
    var debounce;
    new MutationObserver(function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { watch(grid); queueSweep(); }, 30);
    }).observe(grid, { childList: true });
  }

  /* ---- header gains depth once the page moves ------------------------ */
  var header = document.querySelector(".site-header");
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle("scrolled", window.scrollY > 12);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- add-to-cart feedback ------------------------------------------ */
  // Confirms the click on the button itself; without it the only signal is a
  // small badge in the corner, which is easy to miss on a phone.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".add-to-cart");
    if (!btn || btn.dataset.busy) return;

    var original = btn.textContent;
    btn.dataset.busy = "1";
    btn.classList.add("added");
    btn.textContent = "Added ✓";

    var badge = document.querySelector(".cart-count");
    if (badge) {
      badge.classList.remove("pop");
      void badge.offsetWidth;            // restart the animation
      badge.classList.add("pop");
    }

    setTimeout(function () {
      btn.classList.remove("added");
      btn.textContent = original;
      delete btn.dataset.busy;
    }, 1100);
  });
})();
