(function () {
  "use strict";
  var KEY = "trovemart_cart_v1";
  var cart = read();

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write() { localStorage.setItem(KEY, JSON.stringify(cart)); render(); }
  function count() { return cart.reduce(function (n, i) { return n + i.qty; }, 0); }
  function total() { return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
  function money(n) { return "£" + Number(n).toFixed(2); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function add(item) {
    if (!item.id || isNaN(item.price)) return;
    var ex = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === item.id) { ex = cart[i]; break; } }
    if (ex) ex.qty += 1;
    else cart.push({ id: item.id, name: item.name, price: item.price, image: item.image || "", qty: 1 });
    write(); open();
  }
  function change(id, d) {
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) { cart[i].qty += d; break; } }
    cart = cart.filter(function (i) { return i.qty > 0; });
    write();
  }
  function removeItem(id) { cart = cart.filter(function (i) { return i.id !== id; }); write(); }

  var CART_ICON = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';

  function injectUI() {
    var hdr = document.querySelector(".header-inner");
    if (hdr && !hdr.querySelector(".cart-btn")) {
      var btn = document.createElement("button");
      btn.className = "cart-btn"; btn.type = "button";
      btn.setAttribute("aria-label", "Open cart");
      btn.innerHTML = CART_ICON + '<span class="cart-count" hidden>0</span>';
      btn.addEventListener("click", open);
      hdr.appendChild(btn);
    }
    if (!document.getElementById("cartDrawer")) {
      var host = document.createElement("div");
      host.innerHTML =
        '<div id="cartOverlay" class="cart-overlay" hidden></div>' +
        '<aside id="cartDrawer" class="cart-drawer" aria-hidden="true" aria-label="Shopping cart">' +
          '<div class="cart-head"><h3>Your Cart</h3><button id="cartClose" class="cart-close" aria-label="Close">&times;</button></div>' +
          '<div id="cartItems" class="cart-items"></div>' +
          '<div class="cart-foot">' +
            '<div class="cart-total"><span>Subtotal</span><strong id="cartTotal">£0.00</strong></div>' +
            '<button id="cartCheckout" class="btn-primary cart-checkout" type="button">Checkout</button>' +
            '<p class="cart-note">🔒 Secure payment via Stripe · delivery calculated at checkout.</p>' +
          '</div>' +
        '</aside>';
      document.body.appendChild(host);
      document.getElementById("cartOverlay").addEventListener("click", close);
      document.getElementById("cartClose").addEventListener("click", close);
      document.getElementById("cartCheckout").addEventListener("click", checkout);
    }
  }

  function render() {
    var badge = document.querySelector(".cart-count");
    var c = count();
    if (badge) { badge.textContent = c; badge.hidden = c === 0; }
    var wrap = document.getElementById("cartItems");
    if (!wrap) return;
    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    } else {
      wrap.innerHTML = cart.map(function (i) {
        var img = i.image ? '<img src="' + esc(i.image) + '" alt="">' : '<div class="ci-noimg">🛍️</div>';
        return '<div class="cart-item">' +
          '<div class="ci-img">' + img + '</div>' +
          '<div class="ci-main">' +
            '<div class="ci-name">' + esc(i.name) + '</div>' +
            '<div class="ci-price">' + money(i.price) + ' each</div>' +
            '<div class="ci-qty">' +
              '<button class="ci-dec" data-id="' + esc(i.id) + '" aria-label="Decrease">−</button>' +
              '<span>' + i.qty + '</span>' +
              '<button class="ci-inc" data-id="' + esc(i.id) + '" aria-label="Increase">+</button>' +
              '<button class="ci-rm" data-id="' + esc(i.id) + '">Remove</button>' +
            '</div>' +
          '</div>' +
          '<div class="ci-line">' + money(i.price * i.qty) + '</div>' +
        '</div>';
      }).join("");
    }
    var tot = document.getElementById("cartTotal");
    if (tot) tot.textContent = money(total());
    var co = document.getElementById("cartCheckout");
    if (co) co.disabled = cart.length === 0;
  }

  function open() {
    var d = document.getElementById("cartDrawer"), o = document.getElementById("cartOverlay");
    if (d) { d.classList.add("open"); d.setAttribute("aria-hidden", "false"); }
    if (o) o.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function close() {
    var d = document.getElementById("cartDrawer"), o = document.getElementById("cartOverlay");
    if (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); }
    if (o) o.hidden = true;
    document.body.style.overflow = "";
  }

  function checkout() {
    if (!cart.length) return;
    var btn = document.getElementById("cartCheckout");
    btn.disabled = true; btn.textContent = "Redirecting…";
    fetch("checkout.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(function (i) { return { id: i.id, qty: i.qty }; }) })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.url) { window.location.href = res.url; }
      else { alert(res && res.error ? res.error : "Checkout isn't available yet. Please try again soon."); reset(); }
    }).catch(function () { alert("Checkout isn't set up yet. Please try again soon."); reset(); });
    function reset() { btn.disabled = false; btn.textContent = "Checkout"; }
  }

  // delegated clicks: add-to-cart + qty controls
  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest ? e.target.closest(".add-to-cart") : null;
    if (addBtn) {
      e.preventDefault();
      add({ id: addBtn.dataset.id, name: addBtn.dataset.name, price: parseFloat(addBtn.dataset.price), image: addBtn.dataset.image });
      return;
    }
    var t = e.target;
    if (!t.dataset || !t.dataset.id) return;
    if (t.classList.contains("ci-inc")) change(t.dataset.id, 1);
    else if (t.classList.contains("ci-dec")) change(t.dataset.id, -1);
    else if (t.classList.contains("ci-rm")) removeItem(t.dataset.id);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  injectUI();
  render();
})();
