/* js/screens/meals.js (Makissa): #/meals (suggestions) and #/meals/:recipeId
   (meal detail). Registers SL.screens.meals. Definitions only, nothing runs at
   load time. All safety comes from SL.safety; this file never decides it.
   The screen re-renders itself after its own SL.store.set and puts focus back
   on the control that was used. */
window.SL = window.SL || {};
SL.screens = SL.screens || {};

SL.screens.meals = (function () {
  var MEALS = ["breakfast", "lunch", "dinner", "snack"];
  var MEAL_NAMES = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  var DISCLAIMER = "Shelf Life helps you plan but is not medical advice; always read product labels.";
  var NEW_PACKAGE = "This may be a different product. Please check its label.";
  var MIN_SERVINGS = 1, MAX_SERVINGS = 24;

  var mealType = null;      // chosen meal tab, kept in-module
  var current = null;       // { container, params }
  var flash = "";           // one-shot status message (Cooked, etc.)
  var barcodeOpen = false;  // locked barcode note visible
  var workOpen = false;     // "Show your work" expanded

  function esc(s) { return SL.util.esc(s); }
  function ings() { return (SL.data && SL.data.ingredients) || {}; }

  function defaultMeal() {
    var h = new Date().getHours();
    if (h >= 5 && h < 11) return "breakfast";
    if (h >= 11 && h < 15) return "lunch";
    if (h >= 15 && h < 17) return "snack";
    if (h >= 17 && h < 22) return "dinner";
    return "snack";
  }

  /* state.eaters minus stale IDs; everyone if none are left (CLAUDE.md 3). */
  function eatersOf(state) {
    var ids = (state.profiles || []).map(function (p) { return p.id; });
    var e = (state.eaters || []).filter(function (id) { return ids.indexOf(id) >= 0; });
    return e.length ? e : ids;
  }

  function personName(state, id) {
    var ps = state.profiles || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i].firstName || "Someone";
    return "Someone";
  }

  function joinNames(n) {
    if (n.length <= 1) return n.join("");
    return n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
  }

  function lineName(line) {
    var ing = line && line.ingredientId ? ings()[line.ingredientId] : null;
    if (ing) return ing.name;
    return (line && line.rawText) || "Unrecognized ingredient";
  }

  function ingName(id) {
    var ing = ings()[id];
    return ing ? ing.name : String(id);
  }

  function money(n) { return "$" + (Number(n) || 0).toFixed(2); }

  function daysText(d) {
    if (d == null || d === Infinity) return "";
    if (d <= 0) return "Use today";
    return d === 1 ? "1 day left" : d + " days left";
  }

  function failNames(state, check) {
    return (check.people || []).filter(function (p) { return p.status === "fail"; })
      .map(function (p) { return personName(state, p.personId); });
  }

  function badge(state, check) { return SL.util.badgeHTML(check, failNames(state, check)); }

  /* Save to the store, then re-render this screen and restore focus. */
  function save(patch) {
    var active = document.activeElement;
    var key = active && active.getAttribute ? active.getAttribute("data-focus") : null;
    if (patch) SL.store.set(patch);
    rerender();
    if (current && current.container) {
      var target = key ? current.container.querySelector('[data-focus="' + key + '"]') : null;
      if (!target) target = current.container.querySelector("h1");
      if (target) {
        if (target.tagName === "H1" && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
      }
    }
  }

  function rerender() {
    if (!current) return;
    current.container.innerHTML = "";
    draw(current.container, current.params);
  }

  /* ---------- shared pieces ---------- */

  function eatersPicker(state, eaters) {
    var ps = state.profiles || [];
    var h = '<fieldset class="ml-eaters"><legend>Who\'s eating?</legend><div class="chip-list" role="group" aria-label="Who\'s eating?">';
    ps.forEach(function (p) {
      var on = eaters.indexOf(p.id) >= 0;
      var only = on && eaters.length === 1;
      h += '<button type="button" class="chip" data-act="eater" data-id="' + esc(p.id) + '" data-focus="eater-' + esc(p.id) + '"' +
        ' aria-pressed="' + on + '"' +
        ' aria-label="' + esc(p.firstName) + (on ? ", eating" : ", not eating") + (only ? " (at least one person must eat)" : "") + '">' +
        esc(p.firstName) + "</button>";
    });
    h += "</div></fieldset>";
    return h;
  }

  function toggleEater(state, id) {
    var e = eatersOf(state).slice();
    var i = e.indexOf(id);
    if (i >= 0) {
      if (e.length === 1) { flash = "At least one person has to be eating."; rerender(); return; }
      e.splice(i, 1);
    } else {
      e.push(id);
    }
    var order = (state.profiles || []).map(function (p) { return p.id; });
    e.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    save({ eaters: e });
  }

  function statusRegion() {
    var h = '<p class="ml-status" role="status" aria-live="polite">' + (flash ? esc(flash) : "") + "</p>";
    flash = "";
    return h;
  }

  /* ---------- #/meals ---------- */

  function soonestDays(recipe, state) {
    var min = Infinity;
    var ids = (recipe.ingredients || []).map(function (l) { return l.ingredientId; });
    (state.fridge || []).forEach(function (item) {
      if (item.confirmed !== true || ids.indexOf(item.ingredientId) < 0) return;
      var d = SL.util.daysLeft(item);
      if (d != null && d < min) min = d;
    });
    return min;
  }

  function renderList(container) {
    var state = SL.store.get();
    if (!mealType) mealType = defaultMeal();
    var eaters = eatersOf(state);
    var fridge = state.fridge || [];
    var unsure = fridge.filter(function (f) { return f.confirmed !== true; }).length;

    var h = '<section class="ml-meals"><h1>Meals</h1>';

    if (unsure > 0) {
      h += '<div class="card ml-block">' +
        "<h2>Confirm " + unsure + " unsure item" + (unsure === 1 ? "" : "s") + " first</h2>" +
        "<p>We only suggest meals from items you've confirmed. Until then we don't call anything safe.</p>" +
        '<a class="btn btn-primary btn-block" href="#/fridge/confirm">Confirm items</a></div>';
      container.innerHTML = h + "</section>";
      return;
    }
    if (!fridge.length) {
      h += '<div class="card ml-block"><h2>Your fridge is empty</h2>' +
        "<p>Snap your fridge or type a few items, and we'll suggest meals that are safe for everyone.</p>" +
        '<a class="btn btn-primary btn-block" href="#/fridge">Go to Fridge</a></div>';
      container.innerHTML = h + "</section>";
      return;
    }

    h += '<div class="chip-list ml-tabs" role="group" aria-label="Meal type">';
    MEALS.forEach(function (m) {
      h += '<button type="button" class="chip" data-act="meal" data-meal="' + m + '" data-focus="meal-' + m + '"' +
        ' aria-pressed="' + (m === mealType) + '">' + MEAL_NAMES[m] + "</button>";
    });
    h += "</div>";
    h += eatersPicker(state, eaters);
    h += statusRegion();

    var list = SL.safety.suggest(mealType, eaters, state) || [];
    h += '<h2 class="ml-count">' + list.length + " " + MEAL_NAMES[mealType].toLowerCase() +
      " idea" + (list.length === 1 ? "" : "s") + "</h2>";
    h += '<ul class="ml-cards">';
    list.forEach(function (s) {
      var r = s.recipe, c = s.check;
      var cost = SL.recipes.cost(r);
      var days = daysText(soonestDays(r, state));
      var missing = (s.missing || []).map(ingName);
      h += '<li class="card ml-card">' +
        '<h3 class="card__title"><a class="ml-card__link" href="#/meals/' + encodeURIComponent(r.id) + '">' + esc(r.title) + "</a></h3>" +
        '<div class="ml-card__badge">' + badge(state, c) + "</div>" +
        '<p class="ml-meta small">' +
          '<span class="ml-source">' + esc((r.source && r.source.label) || "Source unknown") + "</span>" +
          (r.makesLeftovers ? ' <span class="ml-tag">Makes leftovers</span>' : "") +
          (days ? ' <span class="ml-days">' + esc(days) + "</span>" : "") +
        "</p>" +
        '<p class="small">' + (missing.length ? "You'll need: " + esc(missing.join(", ")) : "You have everything you need.") + "</p>" +
        '<p class="small ml-cost">' + money(cost.usd) + " per serving · estimate</p>" +
        "</li>";
    });
    h += "</ul>";
    if (list.length < 3) {
      h += '<div class="card ml-few"><p>Add a few more items to get more ideas.</p>' +
        '<a class="btn btn-secondary" href="#/fridge">Add items</a></div>';
    }
    h += '<p class="disclaimer">' + esc(DISCLAIMER) + "</p></section>";
    container.innerHTML = h;
  }

  /* ---------- #/meals/:recipeId ---------- */

  function overrideOf(state, id) {
    var all = state.recipeOverrides || {};
    var ov = all[id] || {};
    return { servings: ov.servings, swaps: ov.swaps || {} };
  }

  function setOverride(state, id, ov) {
    var all = state.recipeOverrides || {};
    var clean = {};
    if (ov.servings) clean.servings = ov.servings;
    if (Object.keys(ov.swaps || {}).length) clean.swaps = ov.swaps;
    if (Object.keys(clean).length) all[id] = clean; else delete all[id];
    save({ recipeOverrides: all });
  }

  function isSaved(state, id) {
    if ((state.savedRecipeIds || []).indexOf(id) >= 0) return true;
    return (state.recipes || []).some(function (r) { return r && r.id === id; });
  }

  function renderDetail(container, id) {
    var state = SL.store.get();
    var recipe = SL.recipes.effective(id, state);
    if (!recipe) {
      container.innerHTML = '<section class="card"><h1>Meal not found</h1>' +
        "<p>We couldn't find that meal.</p>" +
        '<a class="btn btn-primary" href="#/meals">Back to meal ideas</a></section>';
      return;
    }
    var eaters = eatersOf(state);
    var check = SL.safety.checkMeal(recipe, eaters, state);
    var anyFail = (check.people || []).some(function (p) { return p.status === "fail"; });
    var servings = recipe.servings || recipe.baseServings || 1;
    var macros = SL.recipes.macros(recipe);
    var cost = SL.recipes.cost(recipe);
    var ov = overrideOf(state, id);
    var lines = recipe.ingredients || [];
    var fridge = state.fridge || [];
    var labelChecks = state.labelChecks || {};

    var h = '<article class="ml-detail">' +
      '<p class="ml-back"><a href="#/meals">← Meal ideas</a></p>' +
      "<h1>" + esc(recipe.title) + "</h1>" +
      '<p class="ml-meta"><span class="ml-source">Source: ' + esc((recipe.source && recipe.source.label) || "unknown") + "</span>" +
      (recipe.makesLeftovers ? ' <span class="ml-tag">Makes leftovers</span>' : "") + "</p>" +
      '<div class="ml-detail__badge">' + badge(state, check) + "</div>";

    h += statusRegion();

    /* new-package warnings for ingredients this meal uses */
    var seenNp = {};
    lines.forEach(function (l) {
      var iid = l.ingredientId;
      if (!iid || seenNp[iid] || !labelChecks[iid]) return;
      var np = fridge.some(function (f) { return f.ingredientId === iid && f.newPackage; });
      if (np) {
        seenNp[iid] = true;
        h += '<p class="warning"><span aria-hidden="true">!</span><span>' + esc(ingName(iid)) + ": " + esc(NEW_PACKAGE) + "</span></p>";
      }
    });

    /* swaps */
    var swapKeys = Object.keys(ov.swaps);
    if ((check.fixes || []).length || swapKeys.length) {
      h += '<section class="card ml-swaps" aria-labelledby="ml-swaps-h"><h2 id="ml-swaps-h">Safe swaps</h2>';
      (check.fixes || []).forEach(function (sw) {
        h += '<div class="ml-swap"><button type="button" class="btn btn-primary btn-block" data-act="swap"' +
          ' data-from="' + esc(sw.from) + '" data-to="' + esc(sw.to) + '" data-focus="swap-' + esc(sw.from) + '">' +
          "Swap " + esc(ingName(sw.from)) + " for " + esc(ingName(sw.to)) + "</button>" +
          (sw.note ? '<p class="small muted">' + esc(sw.note) + "</p>" : "") + "</div>";
      });
      swapKeys.forEach(function (from) {
        h += '<div class="spread ml-swapped"><span>Using ' + esc(ingName(ov.swaps[from])) + " instead of " + esc(ingName(from)) + "</span>" +
          '<button type="button" class="btn btn-text" data-act="unswap" data-from="' + esc(from) + '" data-focus="unswap-' + esc(from) + '"' +
          ' aria-label="Undo swap: go back to ' + esc(ingName(from)) + '">Undo</button></div>';
      });
      h += "</section>";
    }

    /* actions */
    var saved = isSaved(state, id);
    var dis = anyFail ? ' aria-disabled="true" aria-describedby="ml-why-disabled"' : "";
    h += '<section class="ml-actions" aria-label="Actions">';
    if (anyFail) h += '<p id="ml-why-disabled" class="ml-why"><span aria-hidden="true">↻ </span>Apply the swap first.</p>';
    h += '<div class="row">' +
      '<button type="button" class="btn btn-primary" data-act="save" data-focus="save"' + dis +
        ' aria-pressed="' + saved + '">' + (saved ? "Saved" : "Save") + "</button>" +
      '<button type="button" class="btn btn-secondary" data-act="plan" data-focus="plan"' + dis + ">Plan</button>" +
      '<button type="button" class="btn btn-secondary" data-act="cooked" data-focus="cooked"' + dis + ">Cooked</button>" +
      '<button type="button" class="btn btn-text" data-act="share" data-focus="share">Share</button>' +
      '<button type="button" class="btn btn-text" data-act="report" data-focus="report">Report a problem</button>' +
      "</div></section>";

    /* who's eating (changing it rechecks) */
    h += eatersPicker(state, eaters);

    /* servings + ingredients */
    h += '<section class="card" aria-labelledby="ml-ing-h"><div class="spread"><h2 id="ml-ing-h">Ingredients</h2>' +
      '<div class="ml-stepper" role="group" aria-label="Servings">' +
      '<button type="button" class="btn btn-secondary ml-step" data-act="serv" data-delta="-1" data-focus="serv-down"' +
        (servings <= MIN_SERVINGS ? ' aria-disabled="true"' : "") + ' aria-label="Fewer servings">−</button>' +
      '<span class="ml-serv" aria-live="polite">' + servings + " serving" + (servings === 1 ? "" : "s") + "</span>" +
      '<button type="button" class="btn btn-secondary ml-step" data-act="serv" data-delta="1" data-focus="serv-up"' +
        (servings >= MAX_SERVINGS ? ' aria-disabled="true"' : "") + ' aria-label="More servings">+</button>' +
      "</div></div><ul class=\"ml-ings\">";
    lines.forEach(function (l) {
      var ing = l.ingredientId ? ings()[l.ingredientId] : null;
      h += "<li><span class=\"ml-amt\">" + esc(SL.util.fmtAmount(l.amount, l.unit)) + "</span> " + esc(lineName(l)) +
        (ing && ing.staple ? ' <span class="small muted">(pantry staple)</span>' : "") +
        (!ing ? ' <span class="small muted">(not recognized)</span>' : "") + "</li>";
    });
    h += "</ul></section>";

    /* macros + cost */
    h += '<section class="card" aria-labelledby="ml-nut-h"><h2 id="ml-nut-h">Per serving</h2>' +
      '<dl class="ml-macros">' +
      "<div><dt>Calories</dt><dd>" + macros.kcal + "</dd></div>" +
      "<div><dt>Protein</dt><dd>" + macros.proteinG + " g</dd></div>" +
      "<div><dt>Carbs</dt><dd>" + macros.carbsG + " g</dd></div>" +
      "<div><dt>Fat</dt><dd>" + macros.fatG + " g</dd></div>" +
      "</dl>" +
      '<p class="ml-cost"><strong>' + money(cost.usd) + "</strong> per serving · estimate</p>" +
      '<p class="small ml-total">All ' + servings + " servings: about " + money(cost.usd * servings) +
        " and " + (macros.kcal * servings) + " calories · estimate</p>" +
      '<p class="small muted">Pantry staples aren\'t counted in cost.' +
      (cost.excludedCount ? " Excludes " + cost.excludedCount + " unrecognized ingredient" + (cost.excludedCount === 1 ? "" : "s") + "." : "") +
      "</p></section>";

    /* label checks */
    var labelIds = [], unknownLabel = false;
    (check.people || []).forEach(function (p) {
      (p.rows || []).forEach(function (row) {
        if (row.result !== "label") return;
        if (!row.ingredientId || !ings()[row.ingredientId]) { unknownLabel = true; return; }
        if (labelIds.indexOf(row.ingredientId) < 0) labelIds.push(row.ingredientId);
      });
    });
    if (labelIds.length || unknownLabel) {
      h += '<section class="card ml-labels" aria-labelledby="ml-lab-h"><h2 id="ml-lab-h">Check the label</h2>' +
        "<p>Until you check, we don't call this meal safe.</p>";
      labelIds.forEach(function (iid) {
        h += '<div class="item"><div class="item__main"><span aria-hidden="true">! </span>' + esc(ingName(iid)) +
          (seenNp[iid] ? '<span class="small ml-np">' + esc(NEW_PACKAGE) + "</span>" : "") + "</div>" +
          '<button type="button" class="btn btn-secondary" data-act="label" data-id="' + esc(iid) + '" data-focus="label-' + esc(iid) + '"' +
          ' aria-label="I checked the label on ' + esc(ingName(iid)) + '">I checked the label</button></div>';
      });
      if (unknownLabel) {
        h += '<p class="small">Some lines aren\'t recognized. Edit them in Recipes to pick a known ingredient.</p>';
      }
      h += '<button type="button" class="btn btn-text btn-locked" data-act="barcode" data-focus="barcode"' +
        ' aria-label="Scan barcode, Premium, locked" aria-expanded="' + barcodeOpen + '">Scan barcode · Premium</button>';
      if (barcodeOpen) {
        h += '<p class="small muted">Barcode scanning isn\'t in this prototype. Check the label by hand, then tap "I checked the label".</p>';
      }
      h += "</section>";
    }

    /* steps */
    h += '<section class="card" aria-labelledby="ml-steps-h"><h2 id="ml-steps-h">Steps</h2><ol class="ml-steps">';
    (recipe.steps || []).forEach(function (s) { h += "<li>" + esc(s) + "</li>"; });
    h += "</ol></section>";

    /* show your work: one collapsed line; tap to see every row (CLAUDE.md 2.6) */
    h += '<details class="ml-work"' + (workOpen ? " open" : "") + '><summary data-focus="work"><span aria-hidden="true">🔍 </span>Show your work: safety check for each person</summary>';
    (check.people || []).forEach(function (p) {
      var name = personName(state, p.personId);
      var st = p.status === "fail" ? { cls: "fail", icon: "✕", text: "Not safe yet" }
        : p.status === "label" ? { cls: "label", icon: "!", text: "Check the label" }
        : { cls: "pass", icon: "✓", text: "Safe" };
      h += '<div class="ml-person"><h3>' + esc(name) + ' <span class="result--' + st.cls + ' ml-pstatus">' +
        '<span aria-hidden="true">' + st.icon + " </span>" + st.text + "</span></h3><ul class=\"ml-rows\">";
      (p.rows || []).forEach(function (row, i) {
        var res = row.result === "fail" ? { icon: "✕", text: "Not safe" }
          : row.result === "label" ? { icon: "!", text: "Check the label" }
          : { icon: "✓", text: "Pass" };
        h += '<li class="ml-row ml-row--' + row.result + '">' +
          '<span class="result--' + row.result + ' ml-res"><span aria-hidden="true">' + res.icon + " </span>" + res.text + "</span> " +
          "<strong>" + esc(lineName(lines[i] || { ingredientId: row.ingredientId })) + "</strong>" +
          '<span class="ml-reason">' + esc(row.reason) + "</span></li>";
      });
      h += "</ul></div>";
    });
    h += "</details>";

    h += '<p class="disclaimer">' + esc(DISCLAIMER) + "</p></article>";
    container.innerHTML = h;
  }

  /* ---------- events ---------- */

  function onClick(e) {
    var btn = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!btn || !current || !current.container.contains(btn)) return;
    if (!/^#\/?meals(\/|$)/.test(window.location.hash || "")) return;
    var act = btn.getAttribute("data-act");
    var state = SL.store.get();
    var id = current.params.parts[0];

    if (act === "meal") { mealType = btn.getAttribute("data-meal"); save(null); return; }
    if (act === "eater") { toggleEater(state, btn.getAttribute("data-id")); return; }
    if (!id) return;

    if (btn.getAttribute("aria-disabled") === "true") {
      if (act === "save" || act === "plan" || act === "cooked") { flash = "Apply the swap first."; save(null); }
      return;
    }

    var ov = overrideOf(state, id);
    if (act === "swap") {
      ov.swaps[btn.getAttribute("data-from")] = btn.getAttribute("data-to");
      flash = "Swapped. We rechecked the meal for everyone.";
      setOverride(state, id, ov);
    } else if (act === "unswap") {
      delete ov.swaps[btn.getAttribute("data-from")];
      flash = "Swap undone. We rechecked the meal.";
      setOverride(state, id, ov);
    } else if (act === "serv") {
      var r = SL.recipes.effective(id, state);
      var n = (r.servings || r.baseServings || 1) + Number(btn.getAttribute("data-delta"));
      if (n < MIN_SERVINGS || n > MAX_SERVINGS) return;
      ov.servings = n;
      setOverride(state, id, ov);
    } else if (act === "label") {
      var iid = btn.getAttribute("data-id");
      var checks = state.labelChecks || {};
      checks[iid] = SL.util.today();
      var fridge = (state.fridge || []).map(function (f) {
        if (f.ingredientId === iid) f.newPackage = false;
        return f;
      });
      flash = "Label confirmed for " + ingName(iid) + ".";
      save({ labelChecks: checks, fridge: fridge });
    } else if (act === "barcode") {
      barcodeOpen = !barcodeOpen;
      save(null);
    } else if (act === "save") {
      var ids = (state.savedRecipeIds || []).slice();
      var at = ids.indexOf(id);
      if (at >= 0) { ids.splice(at, 1); flash = "Removed from your Recipe Keeper."; }
      else { ids.push(id); flash = "Saved to your Recipe Keeper."; }
      save({ savedRecipeIds: ids });
    } else if (act === "plan") {
      SL.app.go("#/list/plan/" + encodeURIComponent(id));
    } else if (act === "cooked") {
      var rec = SL.recipes.effective(id, state);
      var used = [];
      (rec.ingredients || []).forEach(function (l) {
        var ing = l.ingredientId ? ings()[l.ingredientId] : null;
        if (ing && !ing.staple && used.indexOf(l.ingredientId) < 0) used.push(l.ingredientId);
      });
      var before = state.fridge || [];
      var after = before.filter(function (f) { return used.indexOf(f.ingredientId) < 0; });
      var removed = [];
      before.forEach(function (f) {
        if (used.indexOf(f.ingredientId) >= 0 && removed.indexOf(f.ingredientId) < 0) removed.push(f.ingredientId);
      });
      flash = removed.length
        ? "Enjoy! We took " + joinNames(removed.map(ingName)) + " out of your fridge."
        : "Enjoy! None of these items were in your fridge.";
      save({ fridge: after });
    } else if (act === "share") {
      if (SL.share && SL.share.open) SL.share.open("recipe", { recipeId: id });
      else { flash = "Sharing isn't available yet."; save(null); }
    } else if (act === "report") {
      if (SL.share && SL.share.report) SL.share.report(id);
      else { flash = "Reporting isn't available yet."; save(null); }
    }
  }

  function onToggle(e) {
    if (e.target && e.target.classList && e.target.classList.contains("ml-work")) workOpen = e.target.open;
  }

  function draw(container, params) {
    var parts = (params && params.parts) || [];
    if (parts.length) renderDetail(container, parts[0]);
    else renderList(container);
  }

  function render(container, params) {
    if (current && current.container && current.container !== container) {
      current.container.removeEventListener("click", onClick);
      current.container.removeEventListener("toggle", onToggle, true);
    }
    if (!current || current.container !== container) {
      container.addEventListener("click", onClick);
      container.addEventListener("toggle", onToggle, true);
    }
    current = { container: container, params: params || { page: "meals", parts: [] } };
    flash = "";
    barcodeOpen = false;
    workOpen = false;
    draw(container, current.params);
  }

  return { render: render };
})();
