/* js/share.js (Eleanor): share sheet (link / text / print) and Report a problem.
   Both are overlays, not routes (CLAUDE.md 3, 4.3 "Share overlay").
   Definitions only, nothing runs at load time. */
window.SL = window.SL || {};

SL.share = (function () {
  var MEALS = ["breakfast", "lunch", "dinner", "snack"];
  var MEAL_NAMES = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  var DISCLAIMER = "Shelf Life helps you plan but is not medical advice; always read product labels.";

  var openEl = null;      // the .overlay element while open
  var returnFocus = null; // element focused before opening

  function esc(t) { return SL.util.esc(t); }
  function ings() { return (SL.data && SL.data.ingredients) || {}; }
  function money(n) { return "$" + (Number(n) || 0).toFixed(2); }

  function dayName(date) {
    var p = String(date).split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2], 12);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  function lineText(line) {
    var ing = line.ingredientId ? ings()[line.ingredientId] : null;
    if (!ing) return "- " + (line.rawText || "Unrecognized ingredient") + " (not recognized: check it yourself)";
    return "- " + SL.util.fmtAmount(line.amount, line.unit || ing.unit) + " " + ing.name;
  }

  /* ---------- what gets shared ---------- */

  function recipeContent(payload, state) {
    var id = payload && payload.recipeId;
    var r = SL.recipes.effective(id, state);
    if (!r) return null;
    var serv = r.servings || r.baseServings;
    var lines = [r.title, "Source: " + ((r.source && r.source.label) || "Unknown"),
      "Serves " + serv, "", "Ingredients:"];
    (r.ingredients || []).forEach(function (l) { lines.push(lineText(l)); });
    lines.push("", "Steps:");
    (r.steps || []).forEach(function (s, i) { lines.push((i + 1) + ". " + s); });
    lines.push("", DISCLAIMER);
    return { title: r.title, id: id, text: lines.join("\n") };
  }

  function planContent(payload, state) {
    var start = (payload && payload.weekStart) || state.weekStart;
    var plan = state.plan || {};
    var lines = ["Meal plan: week of " + dayName(start), ""];
    var any = false;
    for (var i = 0; i < 7; i++) {
      var date = SL.util.addDays(start, i);
      var day = plan[date] || {};
      var rows = [];
      MEALS.forEach(function (m) {
        var slot = day[m];
        if (!slot || !slot.recipeId) return;
        var r = SL.recipes.find(slot.recipeId, state);
        rows.push("  " + MEAL_NAMES[m] + ": " + (r ? r.title : "Recipe") +
          (slot.leftoverOf ? " (leftovers)" : "") + (slot.servings ? ", serves " + slot.servings : ""));
      });
      if (rows.length) { any = true; lines.push(dayName(date)); lines = lines.concat(rows); lines.push(""); }
    }
    if (!any) lines.push("Nothing planned yet.", "");
    lines.push(DISCLAIMER);
    return { title: "This week's meal plan", id: start, text: lines.join("\n") };
  }

  function listContent(payload, state) {
    var built = SL.list.build(state);
    var lines = ["Grocery list: week of " + dayName(state.weekStart), ""];
    var aisle = null;
    built.items.forEach(function (it) {
      var ing = ings()[it.ingredientId] || { name: it.ingredientId };
      if (it.aisle !== aisle) { if (aisle !== null) lines.push(""); aisle = it.aisle; lines.push(aisle + ":"); }
      lines.push("- " + ing.name + ", " + SL.util.fmtAmount(it.amount, it.unit) + " (" + money(it.costUSD) + " estimate)");
      it.warnings.forEach(function (w) { lines.push("    ! Check the label: " + w.text); });
    });
    if (!built.items.length) lines.push("Nothing to buy yet.");
    lines.push("", "Estimated total: " + money(built.totalUSD) + " of a " + money(built.budgetUSD) + " weekly budget");
    lines.push("", DISCLAIMER);
    return { title: "Grocery list", id: state.weekStart, text: lines.join("\n") };
  }

  /* ---------- dialog plumbing ---------- */

  function focusables(root) {
    var els = root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(els, function (e) { return e.offsetParent !== null || e === document.activeElement; });
  }

  function onKey(e) {
    if (!openEl) return;
    if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    var f = focusables(openEl);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !openEl.contains(document.activeElement))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !openEl.contains(document.activeElement))) {
      e.preventDefault(); first.focus();
    }
  }

  function show(titleText, bodyHTML, labelId) {
    close();
    returnFocus = document.activeElement;
    var ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML =
      '<div class="overlay__panel sh-panel" role="dialog" aria-modal="true" aria-labelledby="' + labelId + '">' +
        '<div class="spread sh-head">' +
          '<h2 id="' + labelId + '" class="sh-title" tabindex="-1">' + esc(titleText) + "</h2>" +
          '<button type="button" class="btn btn-text no-print" data-sh="close" aria-label="Close">✕ Close</button>' +
        "</div>" + bodyHTML +
      "</div>";
    ov.addEventListener("click", function (e) {
      if (e.target === ov) close();
      var b = e.target.closest && e.target.closest('[data-sh="close"]');
      if (b) close();
    });
    document.body.appendChild(ov);
    document.body.classList.add("has-overlay");
    document.addEventListener("keydown", onKey, true);
    openEl = ov;
    var h = ov.querySelector("h2");
    try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); }
    return ov;
  }

  function close() {
    if (!openEl) return;
    document.removeEventListener("keydown", onKey, true);
    if (openEl.parentNode) openEl.parentNode.removeChild(openEl);
    openEl = null;
    document.body.classList.remove("has-overlay");
    var back = returnFocus;
    returnFocus = null;
    if (back && document.body.contains(back) && typeof back.focus === "function") {
      try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); }
    } else {
      var app = document.getElementById("app");
      if (app) app.focus();
    }
  }

  function isOpen() { return !!openEl; }

  /* ---------- share sheet ---------- */

  function open(kind, payload) {
    var state = SL.store.get();
    var c = kind === "recipe" ? recipeContent(payload, state)
      : kind === "plan" ? planContent(payload, state)
      : kind === "list" ? listContent(payload, state) : null;
    if (!c) return;
    var url = "https://shelflife.app/s/" + kind + "-" + encodeURIComponent(c.id || "x");
    var body =
      '<div class="no-print">' +
        '<section class="sh-section" aria-labelledby="sh-link-h">' +
          '<h3 id="sh-link-h">Link</h3>' +
          '<label class="sr-only" for="sh-link">Share link</label>' +
          '<input type="text" id="sh-link" readonly value="' + esc(url) + '">' +
          '<p class="small muted">Links aren\'t live in this prototype.</p>' +
        "</section>" +
        '<section class="sh-section" aria-labelledby="sh-text-h">' +
          '<h3 id="sh-text-h">Text</h3>' +
          '<label class="sr-only" for="sh-text">Text to share</label>' +
          '<textarea id="sh-text" class="sh-text" readonly rows="8">' + esc(c.text) + "</textarea>" +
          '<div class="row"><button type="button" class="btn btn-primary" data-sh="copy" aria-label="Copy text">Copy</button>' +
          '<p class="small sh-copy-status" role="status" aria-live="polite"></p></div>' +
        "</section>" +
        '<section class="sh-section" aria-labelledby="sh-print-h">' +
          '<h3 id="sh-print-h">Print</h3>' +
          '<button type="button" class="btn btn-secondary" data-sh="print" aria-label="Print">🖨️ Print</button>' +
        "</section>" +
      "</div>" +
      '<pre class="sh-printable" aria-hidden="true">' + esc(c.text) + "</pre>";
    var ov = show("Share " + c.title, body, "sh-dialog-title");
    ov.querySelector('[data-sh="copy"]').addEventListener("click", function () {
      var ta = ov.querySelector("#sh-text");
      var status = ov.querySelector(".sh-copy-status");
      var settled = false;
      function fallback() {
        if (settled) return;
        settled = true;
        ta.focus(); ta.select();
        status.textContent = "Press Ctrl+C (⌘C on Mac) to copy.";
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(c.text).then(function () {
            if (settled) return;
            settled = true; status.textContent = "Copied.";
          }, fallback);
          setTimeout(fallback, 1500); // clipboard blocked or waiting on a prompt
        } else fallback();
      } catch (e) { fallback(); }
    });
    ov.querySelector('[data-sh="print"]').addEventListener("click", function () {
      try { window.print(); } catch (e) { /* print unavailable */ }
    });
  }

  /* ---------- report a problem ---------- */

  function nowStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return SL.util.dateStr(d) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function report(recipeId) {
    var r = SL.recipes.find(recipeId, SL.store.get());
    var body =
      '<form class="sh-report no-print" novalidate>' +
        (r ? '<p class="muted">About: ' + esc(r.title) + "</p>" : "") +
        '<fieldset><legend>What kind of problem?</legend>' +
          '<label class="row"><input type="radio" name="sh-kind" value="safety" checked> Safety (an allergen or ingredient looks wrong)</label>' +
          '<label class="row"><input type="radio" name="sh-kind" value="recipe"> Recipe (steps, amounts or anything else)</label>' +
        "</fieldset>" +
        '<div class="form-row"><label for="sh-report-text">What went wrong?</label>' +
          '<textarea id="sh-report-text" rows="4" aria-describedby="sh-report-err"></textarea>' +
          '<p id="sh-report-err" class="error" hidden>Please tell us what went wrong.</p></div>' +
        '<div class="row"><button type="submit" class="btn btn-primary" aria-label="Send report">Send report</button>' +
        '<button type="button" class="btn btn-text" data-sh="close" aria-label="Cancel">Cancel</button></div>' +
      "</form>";
    var ov = show("Report a problem", body, "sh-report-title");
    var form = ov.querySelector("form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = ov.querySelector("#sh-report-text").value.trim();
      var err = ov.querySelector("#sh-report-err");
      if (!text) { err.hidden = false; ov.querySelector("#sh-report-text").focus(); return; }
      var kindEl = ov.querySelector('input[name="sh-kind"]:checked');
      var st = SL.store.get();
      var reports = (st.reports || []).concat([{
        recipeId: recipeId || null, kind: kindEl ? kindEl.value : "recipe", text: text, at: nowStamp()
      }]);
      SL.store.set({ reports: reports });
      form.outerHTML =
        '<div class="sh-thanks" role="status"><p><strong>Thank you.</strong> We saved your report' +
        " and will look at it. If this is about an allergy, please keep checking product labels.</p>" +
        '<button type="button" class="btn btn-primary" data-sh="close" aria-label="Close">Done</button></div>';
      var done = ov.querySelector('.sh-thanks [data-sh="close"]');
      if (done) done.focus();
    });
  }

  return { open: open, report: report, close: close, isOpen: isOpen };
})();
