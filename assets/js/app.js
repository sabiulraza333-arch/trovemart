(function () {
  "use strict";

  var grid = document.getElementById("product-grid");
  var countEl = document.getElementById("result-count");
  var searchInput = document.getElementById("search");
  var filtersEl = document.querySelector(".filters");
  var activeCategory = "All";
  var query = "";

  document.querySelectorAll(".js-store-link").forEach(function (a) { a.href = SITE.storeUrl; });
  document.querySelectorAll(".js-tagline").forEach(function (el) { el.textContent = SITE.tagline; });
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---- categories derived from the (scraped) products ----
  var categories = [];
  (function () {
    var seen = {};
    PRODUCTS.forEach(function (p) {
      if (!seen[p.category]) { seen[p.category] = 1; categories.push(p.category); }
    });
    categories.sort();
  })();

  // [soft bg, accent, deep text] assigned to categories in order
  var PALETTE = [
    ["#e2edff", "#3b82f6", "#173a7a"], ["#ffedcf", "#f59e0b", "#7a4a08"],
    ["#dcfce7", "#16a34a", "#14532d"], ["#fbe3ee", "#e85d8a", "#7a1f3d"],
    ["#ede9fe", "#7c3aed", "#3b1d75"], ["#e0f2fe", "#0891b2", "#0e4a5a"],
    ["#fee2e2", "#ef4444", "#7f1d1d"], ["#f1f5f9", "#64748b", "#334155"]
  ];
  var colorFor = {};
  categories.forEach(function (c, i) { colorFor[c] = PALETTE[i % PALETTE.length]; });
  function catColor(c) { return colorFor[c] || ["#eef1f7", "#94a3b8", "#334155"]; }

  // ---- build filter pills + footer category list dynamically ----
  function buildChrome() {
    var html = '<button class="filter-pill active" data-cat="All">All</button>';
    categories.forEach(function (c) {
      html += '<button class="filter-pill" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    });
    filtersEl.innerHTML = html;
    filtersEl.querySelectorAll(".filter-pill").forEach(function (p) {
      p.addEventListener("click", function () { setCategory(p.dataset.cat); });
    });
    var fc = document.querySelector(".js-footer-cats");
    if (fc) fc.innerHTML = categories.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
  }

  function ebayLink(p) {
    return p.ebayUrl || ("https://www.ebay.co.uk/sch/i.html?_nkw=" + encodeURIComponent(p.name));
  }

  function media(p) {
    if (p.image) {
      return '<div class="card-media"><img loading="lazy" src="' + esc(p.image) +
             '" alt="' + esc(p.name) + '"></div>';
    }
    var c = catColor(p.category);
    return '<div class="card-media placeholder" style="background:radial-gradient(120% 120% at 30% 20%, #ffffff 0%, ' +
           c[0] + ' 70%);"><span class="card-emoji">🛍️</span></div>';
  }

  function card(p) {
    var c = catColor(p.category);
    return '<article class="card">' +
      media(p) +
      '<div class="card-body">' +
        '<span class="badge" style="background:' + c[0] + ';color:' + c[2] + '">' + esc(p.category) + '</span>' +
        '<h3 class="card-title">' + esc(p.name) + '</h3>' +
        '<div class="card-foot">' +
          '<span class="price">' + esc(SITE.currency) + Number(p.price).toFixed(2) + '</span>' +
          '<button class="btn-buy add-to-cart" type="button" data-id="' + esc(p.id) + '" ' +
            'data-name="' + esc(p.name) + '" data-price="' + Number(p.price).toFixed(2) + '" ' +
            'data-image="' + esc(p.image || "") + '" aria-label="Add ' + esc(p.name) + ' to cart">Add to Cart</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function render() {
    var q = query.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      var okCat = activeCategory === "All" || p.category === activeCategory;
      var okQ = !q || (p.name + " " + p.category).toLowerCase().indexOf(q) !== -1;
      return okCat && okQ;
    });
    countEl.textContent = list.length + (list.length === 1 ? " product" : " products");
    if (!list.length) {
      grid.innerHTML = '<div class="empty">No products match your search. ' +
        '<button id="clearBtn" class="linkbtn">Clear filters</button></div>';
      var cb = document.getElementById("clearBtn");
      if (cb) cb.addEventListener("click", function () { query = ""; searchInput.value = ""; setCategory("All"); });
      return;
    }
    grid.innerHTML = list.map(card).join("");
  }

  function setCategory(cat) {
    activeCategory = cat;
    filtersEl.querySelectorAll(".filter-pill").forEach(function (p) {
      p.classList.toggle("active", p.dataset.cat === cat);
    });
    render();
  }

  searchInput.addEventListener("input", function (e) { query = e.target.value; render(); });

  buildChrome();
  render();
})();
