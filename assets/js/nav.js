// ============================================================
//  WhatsApp chat support
//  Put your number in international format, DIGITS ONLY (no + or spaces).
//  UK example: drop the leading 0 and add 44  ->  07123 456789 = 447123456789
var WHATSAPP_NUMBER  = "447886629147";
var WHATSAPP_MESSAGE = "Hi TroveMart 👋, I have a question.";
// ============================================================

// Trust bar (injected on every page)
(function () {
  if (document.querySelector(".topbar")) return;
  var bar = document.createElement("div");
  bar.className = "topbar";
  bar.innerHTML =
    '<div class="container topbar-inner">' +
      '<span>🔒 Secure checkout</span>' +
      '<span>🚚 Fast UK dispatch</span>' +
      '<span>⭐ Top-rated seller</span>' +
      '<span>💬 Friendly support</span>' +
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);
})();

// Floating WhatsApp button (only shows once a valid number is set)
(function () {
  if (!/^\d{7,15}$/.test(WHATSAPP_NUMBER)) return;      // hidden until number is configured
  if (document.querySelector(".wa-float")) return;
  var a = document.createElement("a");
  a.className = "wa-float";
  a.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
  a.target = "_blank"; a.rel = "noopener";
  a.setAttribute("aria-label", "Chat with us on WhatsApp");
  a.innerHTML =
    '<svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M16.04 4C9.4 4 4 9.4 4 16.04c0 2.12.55 4.19 1.6 6.02L4 28l6.13-1.6a12 12 0 0 0 5.9 1.53h.01c6.64 0 12.04-5.4 12.04-12.04C28.08 9.4 22.68 4 16.04 4zm0 21.86a10 10 0 0 1-5.11-1.4l-.36-.22-3.64.95.97-3.55-.24-.37a9.98 9.98 0 0 1-1.53-5.3c0-5.52 4.5-10.02 10.02-10.02 2.68 0 5.19 1.04 7.08 2.94a9.95 9.95 0 0 1 2.94 7.08c0 5.52-4.5 10.01-10.02 10.01zm5.5-7.5c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.07-.12-.27-.2-.57-.35z"/></svg>' +
    '<span class="wa-label">Chat with us</span>';
  document.body.appendChild(a);
})();

// Mobile nav toggle
(function () {
  var t = document.querySelector(".nav-toggle");
  var n = document.getElementById("mainNav");
  if (!t || !n) return;
  t.addEventListener("click", function () {
    var open = n.classList.toggle("open");
    t.setAttribute("aria-expanded", open ? "true" : "false");
  });
  n.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      n.classList.remove("open");
      t.setAttribute("aria-expanded", "false");
    });
  });
})();
