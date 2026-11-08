/* js/screens/fridge.js (Kate): #/fridge, #/fridge/scan, #/fridge/confirm.
   Definitions only, nothing runs at load time except the registration.
   Rules: CLAUDE.md 2.9 (new package), 2.13 (dashed unsure items, 10 scans a
   week from Monday), 2.14 (have / don't have), 2.15 (days left, use-first),
   2.23 (never shame about waste). */
window.SL = window.SL || {};
SL.screens = SL.screens || {};

SL.screens.fridge = (function () {
  var SCAN_LIMIT = 10;
  var NEW_PACKAGE = "This may be a different product. Please check its label.";

  var current = null;      // { container, params }
  var flash = "";
  var addError = "";
  var addValue = "";
  var lastScan = null;     // { label, emoji, count } from the most recent scan

  function esc(s) { return SL.util.esc(s); }
  function ings() { return (SL.data && SL.data.ingredients) || {}; }
  function nameOf(id) { var i = ings()[id]; return i ? i.name : id; }

  /* Photo scans since this week's Monday 00:00 local. */
  function scansThisWeek(state) {
    var monday = SL.util.mondayOf(SL.util.today());
    return ((state && state.scans) || []).filter(function (s) {
      return String(s).slice(0, 10) >= monday;
    }).length;
  }
  function scansLeft(state) { return Math.max(0, SCAN_LIMIT - scansThisWeek(state)); }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function nowLocal() {
    var d = new Date();
    var day = SL.util._today ? String(SL.util._today) : SL.util.dateStr(d);
    return day + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function daysText(dl) {
    if (dl === null || dl === undefined) return "Days left unknown";
    if (dl <= 0) return "Use today";
    if (dl === 1) return "1 day left";
    return dl + " days left";
  }

  /* Add or replace one fridge entry, applying the new-package rule (2.9):
     re-adding an item whose label is already confirmed flags newPackage. */
  function upsert(fridge, labelChecks, ingredientId, addedOn, confirmed) {
    var out = fridge.filter(function (f) { return f.ingredientId !== ingredientId; });
    out.push({
      ingredientId: ingredientId,
      addedOn: addedOn,
      confirmed: !!confirmed,
      newPackage: !!(labelChecks && labelChecks[ingredientId])
    });
    return out;
  }

  /* Exact match on catalog name or id (case-insensitive). */
  function matchIngredient(text) {
    var t = String(text || "").trim().toLowerCase();
    if (!t) return null;
    var all = ings();
    for (var id in all) {
      if (!Object.prototype.hasOwnProperty.call(all, id)) continue;
      if (id === t || String(all[id].name).toLowerCase() === t) return id;
    }
    return null;
  }

  /* ---------- plumbing ---------- */

  function sub(params) { return (params.parts && params.parts[0]) || ""; }

  function mount(container, params) {
    current = { container: container, params: params };
    container.innerHTML = "";
    var root = document.createElement("div");
    root.className = "fr-screen";
    container.appendChild(root);
    root.addEventListener("click", onClick);
    root.addEventListener("submit", onSubmit);
    var s = sub(params);
    root.innerHTML = s === "scan" ? scanHTML() : s === "confirm" ? confirmHTML() : fridgeHTML();
    return root;
  }

  function refresh(focusSel) {
    if (!current || !current.container.isConnected) return;
    var root = mount(current.container, current.params);
    var f = focusSel ? root.querySelector(focusSel) : null;
    if (!f) f = root.querySelector("h1");
    if (f) {
      if (!f.hasAttribute("tabindex") && /^H\d$/.test(f.tagName)) f.setAttribute("tabindex", "-1");
      try { f.focus({ preventScroll: true }); } catch (e) { try { f.focus(); } catch (e2) { /* ignore */ } }
    }
  }

  function render(container, params) {
    params = params || {};
    flash = "";
    addError = "";
    addValue = "";
    mount(container, params);
  }

  /* ---------- #/fridge ---------- */

  function itemHTML(f) {
    var name = nameOf(f.ingredientId);
    var dl = SL.util.daysLeft(f);
    var soon = dl !== null && dl <= 2;
    var cls = "item fr-item" + (f.confirmed ? "" : " item--unsure") + (f.newPackage ? " fr-item--newpkg" : "");
    var h = '<li class="' + cls + '"><div class="item__main">' +
      '<div class="fr-item__name">' + esc(name) + "</div>" +
      '<div class="fr-days' + (soon ? " fr-days--soon" : "") + '">' +
      (soon ? '<span aria-hidden="true">⏳ </span>' : "") + esc(daysText(dl)) + "</div>";
    if (!f.confirmed) {
      h += '<a class="fr-confirm-link" href="#/fridge/confirm">Confirm ' + esc(name) + "</a>";
    }
    if (f.newPackage) {
      h += '<p class="warning fr-warning"><span aria-hidden="true">!</span><span>' + esc(NEW_PACKAGE) + "</span></p>" +
        '<button type="button" class="btn btn-secondary fr-checked" data-action="label" data-id="' + esc(f.ingredientId) +
        '" aria-label="I checked the label on ' + esc(name) + '">I checked the label</button>';
    }
    h += "</div>" +
      '<button type="button" class="btn btn-text fr-remove" data-action="remove" data-id="' + esc(f.ingredientId) +
      '" aria-label="Remove ' + esc(name) + '"><span aria-hidden="true">✕</span><span class="fr-remove__text">Remove</span></button></li>';
    return h;
  }

  function sortedFridge(fridge) {
    return fridge.slice().sort(function (a, b) {
      var da = SL.util.daysLeft(a), db = SL.util.daysLeft(b);
      if (da === null && db !== null) return 1;
      if (db === null && da !== null) return -1;
      if (da !== db) return da - db;
      var na = nameOf(a.ingredientId), nb = nameOf(b.ingredientId);
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
  }

  function fridgeHTML() {
    var st = SL.store.get();
    var left = scansLeft(st);
    var fridge = sortedFridge(st.fridge || []);
    var unsure = fridge.filter(function (f) { return !f.confirmed; }).length;

    var h = '<div class="spread fr-head"><h1>Your fridge</h1></div>';
    h += '<a class="btn btn-primary btn-block fr-snap" href="#/fridge/scan" aria-label="Snap fridge, ' + left + " of " + SCAN_LIMIT +
      ' photo scans left this week"><span aria-hidden="true">📷</span> Snap fridge</a>' +
      '<p class="small muted fr-scans-left" aria-hidden="true">' + left + " of " + SCAN_LIMIT + " photo scans left this week · resets Monday</p>";

    if (flash) h += '<p class="fr-flash" role="status"><span aria-hidden="true">✓ </span>' + esc(flash) + "</p>";
    else h += '<p class="sr-only" role="status"></p>';

    if (unsure) {
      h += '<p class="warning fr-unsure-note"><span aria-hidden="true">!</span><span>' + unsure +
        (unsure === 1 ? " item needs" : " items need") + ' a quick look before we suggest meals. <a href="#/fridge/confirm">Confirm items</a></span></p>';
    }

    // Add by typing
    var names = Object.keys(ings()).map(function (k) { return ings()[k].name; }).sort();
    h += '<form class="card fr-add" data-form="add" novalidate>' +
      '<div class="form-row"><label for="fr-add-input">Add an item</label>' +
      '<div class="row fr-add__row"><input type="text" id="fr-add-input" list="fr-catalog" autocomplete="off" placeholder="e.g. Eggs" value="' + esc(addValue) + '"' +
      (addError ? ' aria-invalid="true" aria-describedby="fr-add-err"' : "") + ">" +
      '<button type="submit" class="btn btn-secondary">Add</button></div>' +
      (addError ? '<p class="error" id="fr-add-err" role="alert">' + esc(addError) + "</p>" : "") +
      '<datalist id="fr-catalog">' + names.map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join("") + "</datalist>" +
      '<p class="hint">Typing items is unlimited.</p></div></form>';

    h += '<section aria-labelledby="fr-items-h"><h2 id="fr-items-h">What you have <span class="muted small">(' + fridge.length + ")</span></h2>";
    if (!fridge.length) {
      h += '<p class="card">Your fridge list is empty. Snap a photo or type what you have.</p>';
    } else {
      h += '<p class="small muted">Soonest to use first.</p><ul class="fr-list">' + fridge.map(itemHTML).join("") + "</ul>";
    }
    h += "</section>";
    return h;
  }

  /* ---------- #/fridge/scan ---------- */

  function scanHTML() {
    var st = SL.store.get();
    var left = scansLeft(st);
    var h = '<a class="btn btn-text fr-back" href="#/fridge"><span aria-hidden="true">← </span>Back to fridge</a>' +
      "<h1>Snap your fridge</h1>";
    if (left <= 0) {
      h += '<section class="card fr-capped" role="status"><h2>You\'ve used this week\'s photo scans</h2>' +
        "<p>You get " + SCAN_LIMIT + " photo scans a week, and they reset Monday. You can still type items, as many as you like.</p>" +
        '<a class="btn btn-primary btn-block" href="#/fridge">Type items instead</a></section>';
      return h;
    }
    h += '<p class="muted">This prototype uses sample photos. Pick one to scan. ' +
      left + " of " + SCAN_LIMIT + " scans left this week.</p>" +
      '<ul class="fr-samples">';
    (SL.data.fridges || []).forEach(function (fr) {
      h += '<li><button type="button" class="card fr-sample" data-action="scan" data-id="' + esc(fr.id) + '" aria-label="Scan ' + esc(fr.label) +
        ", " + fr.items.length + ' items">' +
        '<span class="fr-sample__emoji" aria-hidden="true">' + esc(fr.emoji) + "</span>" +
        '<span class="fr-sample__label">' + esc(fr.label) + "</span>" +
        '<span class="small muted">' + fr.items.length + " items</span></button></li>";
    });
    h += "</ul>";
    return h;
  }

  function doScan(fridgeId) {
    var st = SL.store.get();
    if (scansLeft(st) <= 0) { refresh(); return; }
    var sample = null;
    (SL.data.fridges || []).forEach(function (f) { if (f.id === fridgeId) sample = f; });
    if (!sample) return;
    var today = SL.util.today();
    var fridge = st.fridge || [];
    sample.items.forEach(function (it) {
      if (!ings()[it.ingredientId]) return;
      fridge = upsert(fridge, st.labelChecks, it.ingredientId, SL.util.addDays(today, -(it.ageDays || 0)), !it.unsure);
    });
    SL.store.set({ fridge: fridge, scans: (st.scans || []).concat([nowLocal()]) });
    lastScan = { label: sample.label, emoji: sample.emoji, ids: sample.items.map(function (i) { return i.ingredientId; }) };
    SL.app.go("#/fridge/confirm");
  }

  /* ---------- #/fridge/confirm ---------- */

  function confirmHTML() {
    var st = SL.store.get();
    var fridge = sortedFridge(st.fridge || []);
    var unsure = fridge.filter(function (f) { return !f.confirmed; });
    var h = "<h1>Check what we found</h1>";
    if (lastScan) {
      h += '<p class="muted"><span aria-hidden="true">' + esc(lastScan.emoji) + " </span>" + esc(lastScan.label) +
        ": " + lastScan.ids.length + " items found.</p>";
    }
    if (flash) h += '<p class="fr-flash" role="status"><span aria-hidden="true">✓ </span>' + esc(flash) + "</p>";
    else h += '<p class="sr-only" role="status"></p>';

    if (unsure.length) {
      h += '<section aria-labelledby="fr-unsure-h"><h2 id="fr-unsure-h">We\'re not sure about ' + unsure.length +
        (unsure.length === 1 ? " item" : " items") + "</h2>" +
        '<p class="small muted">Confirm what you have, or remove what you don\'t. We won\'t suggest meals until these are sorted.</p>' +
        '<ul class="fr-list">';
      unsure.forEach(function (f) {
        var name = nameOf(f.ingredientId);
        h += '<li class="item item--unsure fr-item"><div class="item__main"><div class="fr-item__name">' + esc(name) + "</div>" +
          (f.newPackage ? '<p class="warning fr-warning"><span aria-hidden="true">!</span><span>' + esc(NEW_PACKAGE) + "</span></p>" : "") +
          "</div>" +
          '<div class="row fr-unsure-actions">' +
          '<button type="button" class="btn btn-secondary" data-action="confirm" data-id="' + esc(f.ingredientId) + '" aria-label="Confirm ' + esc(name) + '">Confirm</button>' +
          '<button type="button" class="btn btn-text" data-action="remove" data-id="' + esc(f.ingredientId) + '" aria-label="Remove ' + esc(name) + '">Remove</button>' +
          "</div></li>";
      });
      h += "</ul></section>";
    } else {
      h += '<p class="fr-all-set"><span aria-hidden="true">✓ </span>Everything is confirmed.</p>';
    }

    var newPkg = fridge.filter(function (f) { return f.confirmed && f.newPackage; });
    if (newPkg.length) {
      h += '<section aria-labelledby="fr-np-h"><h2 id="fr-np-h">New packages</h2><ul class="fr-list">' +
        newPkg.map(itemHTML).join("") + "</ul></section>";
    }

    var blocked = unsure.length > 0;
    h += '<button type="button" class="btn btn-primary btn-block fr-continue" data-action="continue"' +
      // aria-disabled, not disabled: the button stays in tab order so keyboard and
      // screen-reader users can reach it and hear why it's blocked.
      (blocked ? ' aria-disabled="true" aria-describedby="fr-continue-why"' : "") + ">See meal ideas</button>";
    if (blocked) {
      h += '<p class="small muted" id="fr-continue-why">Confirm or remove the ' + unsure.length +
        (unsure.length === 1 ? " item" : " items") + " above first.</p>";
    }
    h += '<a class="btn btn-text" href="#/fridge">Back to fridge</a>';
    return h;
  }

  /* ---------- events ---------- */

  function onClick(e) {
    var btn = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!btn || btn.disabled) return;
    var a = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    var st = SL.store.get();
    addError = "";

    if (a === "scan") { doScan(id); return; }

    if (a === "remove") {
      SL.store.set({ fridge: (st.fridge || []).filter(function (f) { return f.ingredientId !== id; }) });
      flash = "Removed " + nameOf(id) + ".";
      // Not the add box: focusing it pops open the browser's suggestion list.
      refresh(sub(current.params) === "confirm" ? "[data-action='confirm'], .fr-continue" : null);
      return;
    }

    if (a === "confirm") {
      SL.store.set({ fridge: (st.fridge || []).map(function (f) {
        if (f.ingredientId === id) f.confirmed = true;
        return f;
      }) });
      flash = "Confirmed " + nameOf(id) + ".";
      refresh("[data-action='confirm'], .fr-continue");
      return;
    }

    if (a === "label") {
      var checks = st.labelChecks || {};
      checks[id] = SL.util.today();
      SL.store.set({
        labelChecks: checks,
        fridge: (st.fridge || []).map(function (f) {
          if (f.ingredientId === id) f.newPackage = false;
          return f;
        })
      });
      flash = "Label confirmed for " + nameOf(id) + ".";
      refresh();
      return;
    }

    if (a === "continue") {
      var unsure = (st.fridge || []).some(function (f) { return !f.confirmed; });
      if (!unsure) SL.app.go("#/meals");
      else {
        // Blocked: send focus to the first item that still needs confirming.
        var next = current.container.querySelector("[data-action='confirm']");
        if (next) next.focus();
      }
    }
  }

  function onSubmit(e) {
    var form = e.target;
    if (!form || form.getAttribute("data-form") !== "add") return;
    e.preventDefault();
    var input = form.querySelector("#fr-add-input");
    var text = input ? input.value : "";
    addValue = text;
    if (!String(text).trim()) {
      addError = "Type an item name first.";
      flash = "";
      refresh("#fr-add-input");
      return;
    }
    var id = matchIngredient(text);
    if (!id) {
      addError = "We don't know that item yet. Try a name from the list.";
      flash = "";
      refresh("#fr-add-input");
      return;
    }
    var st = SL.store.get();
    var fridge = upsert(st.fridge || [], st.labelChecks, id, SL.util.today(), true);
    SL.store.set({ fridge: fridge });
    addError = "";
    addValue = "";
    flash = "Added " + nameOf(id) + ".";
    // Focus the heading, not the add box, so the suggestion list doesn't pop open.
    refresh(null);
  }

  return {
    render: render,
    scansLeft: scansLeft,
    SCAN_LIMIT: SCAN_LIMIT
  };
})();
