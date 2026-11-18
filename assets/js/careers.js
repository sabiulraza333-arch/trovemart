/* Careers page: lists open roles from assets/data/vacancies.json and posts
   applications to apply.php.

   The roles come from a file rather than being written into the page so that
   whoever is hiring can add or remove one without touching HTML — and so the
   source can later be swapped for an HR system's vacancy feed without this
   page changing. */
(function () {
  "use strict";

  var listEl    = document.getElementById("rolesList");
  var applySec  = document.getElementById("applySection");
  var applyFor  = document.getElementById("applyFor");
  var roleInput = document.getElementById("applyRole");
  var form      = document.getElementById("applyForm");
  var statusEl  = document.getElementById("applyStatus");
  var submitBtn = document.getElementById("applySubmit");
  var HIRING_EMAIL = "info@mominkhanltd.com";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function noOpenings(msg) {
    listEl.innerHTML =
      '<div class="roles-empty">' +
        '<h3>No open positions right now</h3>' +
        '<p>' + esc(msg || "We are not hiring at the moment, but we are always glad to hear from good people.") + '</p>' +
        '<p>Send your CV to <a href="mailto:' + HIRING_EMAIL + '?subject=' +
          encodeURIComponent("Speculative application") + '">' + HIRING_EMAIL + '</a> ' +
        'and we will keep it on file.</p>' +
      '</div>';
  }

  function roleCard(r) {
    var meta = [r.type, r.location, r.salary].filter(Boolean)
      .map(function (m) { return '<span class="role-chip">' + esc(m) + "</span>"; }).join("");
    function bullets(title, items) {
      if (!items || !items.length) return "";
      return "<h4>" + esc(title) + "</h4><ul>" +
        items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
    }
    return '<article class="role">' +
      '<div class="role-head">' +
        "<h3>" + esc(r.title) + "</h3>" +
        '<div class="role-meta">' + meta + "</div>" +
      "</div>" +
      (r.summary ? "<p class='role-summary'>" + esc(r.summary) + "</p>" : "") +
      '<details class="role-detail"><summary>Full details</summary><div class="role-body">' +
        bullets("What you will be doing", r.responsibilities) +
        bullets("What we are looking for", r.requirements) +
        (r.closing ? "<p><strong>Closing date:</strong> " + esc(r.closing) + "</p>" : "") +
      "</div></details>" +
      '<button class="btn-primary sm role-apply" type="button" data-role="' + esc(r.title) + '">' +
        "Apply for this role</button>" +
      "</article>";
  }

  fetch("assets/data/vacancies.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var roles = (data && data.roles) || [];
      if (!roles.length) { noOpenings(); return; }
      listEl.innerHTML = roles.map(roleCard).join("");
    })
    .catch(function () {
      // never leave the page stuck on "Loading…" — give people a way through
      noOpenings("We could not load our current openings just now.");
    });

  // ---- choosing a role reveals and targets the form ----
  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".role-apply");
    if (!btn) return;
    var title = btn.dataset.role;
    roleInput.value = title;
    applyFor.textContent = 'Applying for: ' + title;
    applySec.hidden = false;
    applySec.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { document.getElementById("apName").focus(); }, 400);
  });

  // ---- submit ----
  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " is-" + kind : "");
  }

  function mailtoFallback() {
    var subject = "Application: " + (roleInput.value || "role at TroveMart");
    var body = "Name: " + (form.name.value || "") +
      "\nPhone: " + (form.phone.value || "") +
      "\nRight to work in the UK: " + (form.right_to_work.value || "") +
      "\n\n" + (form.message.value || "") +
      "\n\n(Please attach your CV to this email.)";
    return '<a href="mailto:' + HIRING_EMAIL + "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body) + '">email your application instead</a>';
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.name.value.trim() || !form.email.value.trim() ||
        !form.message.value.trim() || !form.right_to_work.value) {
      setStatus("Please fill in the required fields.", "error");
      return;
    }
    var cv = document.getElementById("apCv").files[0];
    if (cv && cv.size > 2 * 1024 * 1024) {
      setStatus("That CV is larger than 2 MB. Please attach a smaller file, or email it to us.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Sending your application…");

    fetch("apply.php", { method: "POST", body: new FormData(form) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res && res.ok) {
          form.innerHTML = '<div class="apply-done"><h3>Application sent ✅</h3>' +
            "<p>Thanks — we have your application and we will be in touch, normally within a week.</p></div>";
          return;
        }
        // Nothing was accepted, so say so plainly rather than letting someone
        // believe they have applied when nothing reached us.
        submitBtn.disabled = false;
        statusEl.className = "form-status is-error";
        statusEl.innerHTML = (res && res.error ? esc(res.error) + " " : "We could not send that. ") +
          "Please " + mailtoFallback() + ".";
      })
      .catch(function () {
        submitBtn.disabled = false;
        statusEl.className = "form-status is-error";
        statusEl.innerHTML = "We could not reach the server. Please " + mailtoFallback() + ".";
      });
  });
})();
