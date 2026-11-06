/* Product detail page: renders one item from the catalogue in products.js,
   chosen by ?id= in the URL. The catalogue is the only source of truth here —
   nothing is fetched, so the page works as long as the site does. */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  document.querySelectorAll(".js-store-link").forEach(function (a) { a.href = SITE.storeUrl; });
  document.querySelectorAll(".js-tagline").forEach(function (el) { el.textContent = SITE.tagline; });
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var body = document.getElementById("pdpBody");
  var id = new URLSearchParams(location.search).get("id");
  var product = PRODUCTS.filter(function (p) { return String(p.id) === String(id); })[0];

  if (!product) {
    body.innerHTML =
      '<div class="pdp-missing">' +
        '<h1>Product not found</h1>' +
        '<p>This item may have sold out or been removed from our store.</p>' +
        '<a class="btn-primary" href="index.html">Browse all products</a>' +
      '</div>';
    document.title = "Product not found — TroveMart";
    return;
  }

  var price = SITE.currency + Number(product.price).toFixed(2);
  var ebayUrl = product.ebayUrl ||
    ("https://www.ebay.co.uk/sch/i.html?_nkw=" + encodeURIComponent(product.name));

  /* ---- page metadata ------------------------------------------------- */
  // Each product needs its own title, description and canonical, otherwise
  // every item shares the homepage's and none of them rank for anything.
  var blurb = product.name + " — " + price + ". In stock at TroveMart, dispatched " +
              "fast from the UK with secure checkout.";
  document.title = product.name + " — " + price + " | TroveMart";
  function meta(sel, value) {
    var el = document.querySelector(sel);
    if (el) el.setAttribute("content", value);
  }
  meta('meta[name="description"]', blurb);
  meta('meta[property="og:title"]', product.name);
  meta('meta[property="og:description"]', blurb);
  meta('meta[property="og:url"]', location.href);
  if (product.image) meta('meta[property="og:image"]', product.image);
  var canon = document.querySelector('link[rel="canonical"]');
  if (canon) canon.href = location.origin + location.pathname + "?id=" + encodeURIComponent(product.id);

  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product",
    name: product.name,
    image: product.image ? [product.image] : undefined,
    category: product.category,
    brand: { "@type": "Brand", name: "TroveMart" },
    offers: {
      "@type": "Offer", price: Number(product.price).toFixed(2), priceCurrency: "GBP",
      availability: "https://schema.org/InStock", url: location.href
    }
  });
  document.head.appendChild(ld);

  /* ---- breadcrumbs ---------------------------------------------------- */
  document.getElementById("crumbs").innerHTML =
    '<a href="index.html">Home</a><span aria-hidden="true">/</span>' +
    '<a href="index.html#catalog">' + esc(product.category) + '</a>' +
    '<span aria-hidden="true">/</span><span class="crumb-current">' + esc(product.name) + '</span>';

  /* ---- main product block --------------------------------------------- */
  var art = product.image
    ? '<img id="pdpImg" src="' + esc(product.image) + '" alt="' + esc(product.name) + '">'
    : '<span class="pdp-noimg" aria-hidden="true">🛍️</span>';

  body.innerHTML =
    '<div class="pdp-media"><div class="pdp-frame" id="pdpFrame">' + art + '</div></div>' +
    '<div class="pdp-info">' +
      '<span class="badge pdp-badge">' + esc(product.category) + '</span>' +
      '<h1 class="pdp-title">' + esc(product.name) + '</h1>' +
      '<p class="pdp-price">' + esc(price) + '<span class="pdp-vat"> inc. VAT</span></p>' +
      '<ul class="pdp-points">' +
        '<li>🚚 Fast dispatch from the UK</li>' +
        '<li>🔒 Secure checkout — card details go straight to Stripe</li>' +
        '<li>🛡️ Covered by eBay Buyer Protection</li>' +
      '</ul>' +
      '<div class="pdp-buy">' +
        '<div class="qty" role="group" aria-label="Quantity">' +
          '<button type="button" class="qty-btn" id="qtyDown" aria-label="Decrease quantity">−</button>' +
          '<input id="qty" class="qty-val" type="number" value="1" min="1" max="99" aria-label="Quantity">' +
          '<button type="button" class="qty-btn" id="qtyUp" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<button class="btn-primary pdp-add add-to-cart" type="button" ' +
          'data-id="' + esc(product.id) + '" data-name="' + esc(product.name) + '" ' +
          'data-price="' + Number(product.price).toFixed(2) + '" ' +
          'data-image="' + esc(product.image || "") + '">Add to Cart</button>' +
      '</div>' +
      '<a class="pdp-ebay" href="' + esc(ebayUrl) + '" target="_blank" rel="noopener">' +
        'Prefer to buy on eBay? View this listing ↗</a>' +
    '</div>';

  /* ---- quantity ------------------------------------------------------- */
  // cart.js adds exactly one per click, so repeat the click to honour the
  // chosen quantity rather than duplicating its storage logic here.
  // cart.js reads data-qty off the button, so keeping that attribute in step
  // with the selector is all this needs to do — no synthetic clicks, which
  // the HTML spec ignores when one click() is already in flight anyway.
  var qtyEl = document.getElementById("qty");
  var addBtn = body.querySelector(".pdp-add");

  function clampQty() {
    var n = parseInt(qtyEl.value, 10);
    if (!n || n < 1) n = 1;
    if (n > 99) n = 99;
    qtyEl.value = n;
    addBtn.dataset.qty = n;
    return n;
  }
  clampQty();

  document.getElementById("qtyDown").addEventListener("click", function () {
    qtyEl.value = Math.max(1, clampQty() - 1);
    clampQty();
  });
  document.getElementById("qtyUp").addEventListener("click", function () {
    qtyEl.value = Math.min(99, clampQty() + 1);
    clampQty();
  });
  qtyEl.addEventListener("input", clampQty);
  qtyEl.addEventListener("change", clampQty);

  /* ---- detail accordions ---------------------------------------------- */
  var sections = [
    ["Description",
      "<p>" + esc(product.name) + "</p>" +
      "<p>Listed in <strong>" + esc(product.category) + "</strong>. This item is stocked and " +
      "dispatched by TroveMart, a trading name of Momin Khan Ltd. The full listing, including " +
      "manufacturer specifications where available, is on our eBay store.</p>" +
      '<p><a href="' + esc(ebayUrl) + '" target="_blank" rel="noopener">View the full listing on eBay ↗</a></p>'],
    ["Delivery &amp; Returns",
      "<p>Orders are dispatched quickly from the UK. Delivery cost and estimated arrival are " +
      "confirmed at checkout before you pay.</p>" +
      "<p>Returns are handled through our eBay store, where your purchase is covered by eBay " +
      "Buyer Protection. Please do not send returns to our office address.</p>" +
      '<p><a href="delivery-returns.html">Full delivery &amp; returns information</a></p>'],
    ["Payment &amp; Security",
      "<p>Card payments are processed by <strong>Stripe</strong>. Your card details are entered " +
      "on Stripe's own secure page and are never seen or stored by this website.</p>" +
      "<p>Prices are shown in pounds sterling and include VAT where applicable.</p>"]
  ];
  document.getElementById("acc").innerHTML = sections.map(function (s, i) {
    return '<details class="acc-item"' + (i === 0 ? " open" : "") + '>' +
      '<summary>' + s[0] + '</summary><div class="acc-body">' + s[1] + '</div></details>';
  }).join("");
  document.getElementById("pdpDetails").hidden = false;

  /* ---- related products ------------------------------------------------ */
  var related = PRODUCTS.filter(function (p) {
    return p.category === product.category && String(p.id) !== String(product.id);
  }).slice(0, 4);

  if (related.length) {
    document.getElementById("relatedGrid").innerHTML = related.map(function (p) {
      var img = p.image
        ? '<img loading="lazy" src="' + esc(p.image) + '" alt="' + esc(p.name) + '">'
        : '<span class="card-emoji">🛍️</span>';
      return '<article class="card">' +
        '<a class="card-media" href="product.html?id=' + encodeURIComponent(p.id) + '">' + img + '</a>' +
        '<div class="card-body">' +
          '<h3 class="card-title"><a href="product.html?id=' + encodeURIComponent(p.id) + '">' +
            esc(p.name) + '</a></h3>' +
          '<div class="card-foot">' +
            '<span class="price">' + SITE.currency + Number(p.price).toFixed(2) + '</span>' +
            '<button class="btn-buy add-to-cart" type="button" data-id="' + esc(p.id) + '" ' +
              'data-name="' + esc(p.name) + '" data-price="' + Number(p.price).toFixed(2) + '" ' +
              'data-image="' + esc(p.image || "") + '">Add to Cart</button>' +
          '</div>' +
        '</div></article>';
    }).join("");
    document.getElementById("pdpRelated").hidden = false;
  }

  /* ---- sticky buy bar on small screens --------------------------------- */
  var bar = document.getElementById("buybar");
  document.getElementById("buybarName").textContent = product.name;
  document.getElementById("buybarPrice").textContent = price;
  document.getElementById("buybarAdd").addEventListener("click", function () {
    addBtn.click();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.hidden = entries[0].isIntersecting;
      // the WhatsApp float sits in the same corner and would cover the bar's
      // Add to Cart button, so lift it while the bar is up
      document.body.classList.toggle("has-buybar", !bar.hidden);
    }, { threshold: 0 }).observe(addBtn);
  }
})();
