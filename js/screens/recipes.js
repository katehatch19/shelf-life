/* js/screens/recipes.js (Eleanor): Recipe Keeper, import, and the recipe logic
   SL.recipes.find / effective / scale / macros / cost (CLAUDE.md 4.3).
   Definitions only, nothing runs at load time. Logic functions take state as an
   argument and never call SL.store. They never mutate their inputs or SL.data. */
window.SL = window.SL || {};

SL.recipes = (function () {
  function copy(obj) { return obj == null ? obj : JSON.parse(JSON.stringify(obj)); }

  /* Round to cents; toFixed first so float noise (0.915 -> 0.91499...) rounds half up. */
  function cents(n) { return Math.round(Number((n * 100).toFixed(6))) / 100; }

  function ingredientsDb() { return (SL.data && SL.data.ingredients) || {}; }

  /* The serving count every per-serving number divides by. */
  function servingsOf(recipe) {
    return Number(recipe && (recipe.servings || recipe.baseServings)) || 1;
  }

  /* A line we can't look up: no ingredientId (unmatched import) or not in the catalog. */
  function lineIngredient(line) {
    if (!line || !line.ingredientId) return null;
    return ingredientsDb()[line.ingredientId] || null;
  }

  /* Raw recipe: state.recipes first, then SL.data.recipes. A copy, or null. */
  function find(id, state) {
    if (!id) return null;
    var own = (state && state.recipes) || [];
    for (var i = 0; i < own.length; i++) {
      if (own[i] && own[i].id === id) return copy(own[i]);
    }
    var seed = (SL.data && SL.data.recipes) || [];
    for (var j = 0; j < seed.length; j++) {
      if (seed[j] && seed[j].id === id) return copy(seed[j]);
    }
    return null;
  }

  /* A copy with servings: n and every amount rescaled. Scales from the recipe's
     current serving count, so re-scaling an already scaled recipe is correct
     (for an unscaled recipe this is amount × n / baseServings). */
  function scale(recipe, n) {
    if (!recipe) return null;
    var out = copy(recipe);
    var target = Number(n);
    if (!(target > 0)) return out;
    var factor = target / servingsOf(recipe);
    out.servings = target;
    out.ingredients = (out.ingredients || []).map(function (line) {
      if (typeof line.amount === "number") line.amount = line.amount * factor;
      return line;
    });
    return out;
  }

  /* Per-serving macros as whole numbers. Staples included, unmatched lines left out. */
  function macros(recipe) {
    var t = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    var lines = (recipe && recipe.ingredients) || [];
    for (var i = 0; i < lines.length; i++) {
      var ing = lineIngredient(lines[i]);
      if (!ing || !ing.macrosPerUnit) continue;
      var a = Number(lines[i].amount) || 0, m = ing.macrosPerUnit;
      t.kcal += a * (m.kcal || 0);
      t.proteinG += a * (m.proteinG || 0);
      t.carbsG += a * (m.carbsG || 0);
      t.fatG += a * (m.fatG || 0);
    }
    var s = servingsOf(recipe);
    return {
      kcal: Math.round(t.kcal / s),
      proteinG: Math.round(t.proteinG / s),
      carbsG: Math.round(t.carbsG / s),
      fatG: Math.round(t.fatG / s)
    };
  }

  /* Per-serving cost in USD, rounded to cents. Staples left out; unmatched lines
     left out and counted in excludedCount. */
  function cost(recipe) {
    var prices = (SL.data && SL.data.prices) || {};
    var total = 0, excluded = 0;
    var lines = (recipe && recipe.ingredients) || [];
    for (var i = 0; i < lines.length; i++) {
      var ing = lineIngredient(lines[i]);
      if (!ing) { excluded += 1; continue; }
      if (ing.staple) continue;
      var p = prices[ing.id];
      if (!p) continue;
      total += (Number(lines[i].amount) || 0) * p.perUnit;
    }
    return { usd: cents(total / servingsOf(recipe)), excludedCount: excluded };
  }

  /* The recipe with state.recipeOverrides applied: swaps, then servings. */
  function effective(id, state) {
    var recipe = find(id, state);
    if (!recipe) return null;
    var ov = state && state.recipeOverrides && state.recipeOverrides[id];
    if (!ov) return recipe;
    var swaps = ov.swaps || {};
    var all = (SL.data && SL.data.swaps) || [];
    Object.keys(swaps).forEach(function (from) {
      var to = swaps[from];
      for (var i = 0; i < all.length; i++) {
        if (all[i].from === from && all[i].to === to) {
          recipe = SL.safety.applySwap(recipe, all[i]);
          break;
        }
      }
    });
    if (ov.servings) recipe = scale(recipe, ov.servings);
    return recipe;
  }

  return {
    find: find,
    effective: effective,
    scale: scale,
    macros: macros,
    cost: cost
  };
})();

// ---- UI (Step 3): SL.screens.recipes goes here ----
SL.screens = SL.screens || {};

SL.screens.recipes = (function () {
  var DISCLAIMER = "Shelf Life helps you plan but is not medical advice; always read product labels.";
  var UNITS = ["tsp", "tbsp", "cup", "oz", "lb", "each", "slice", "clove"];
  var MEALS = ["breakfast", "lunch", "dinner", "snack"];
  var MEAL_NAMES = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  var RESULT_TEXT = { pass: "✓ OK", label: "! Check the label", fail: "✕ Not safe" };
  var STATUS_TEXT = { pass: "✓ Safe", label: "! Needs a label check", fail: "✕ Not safe" };

  var view = { container: null, params: null };
  var ui = { query: "", tag: "", importTab: "link", importText: "", importTitle: "", importUrl: "" };
  var draft = null;   // { mode: "edit" | "import", origId, recipe }

  function esc(t) { return SL.util.esc(t); }
  function ings() { return (SL.data && SL.data.ingredients) || {}; }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function money(n) { return "$" + (Number(n) || 0).toFixed(2); }

  /* ---------- shared helpers ---------- */

  function eaterIds(state) {
    var ids = (state.profiles || []).map(function (p) { return p.id; });
    var e = (state.eaters || []).filter(function (id) { return ids.indexOf(id) >= 0; });
    return e.length ? e : ids;
  }
  function nameOf(id, state) {
    var ps = state.profiles || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i].firstName;
    return "Someone";
  }
  function failNames(check, state) {
    return (check.people || []).filter(function (p) { return p.status === "fail"; })
      .map(function (p) { return nameOf(p.personId, state); });
  }
  function joinNames(n) {
    if (n.length <= 1) return n.join("");
    return n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
  }
  function badge(check, state) {
    return SL.util.badgeHTML(check, check.badge === "unsafe" ? failNames(check, state) : undefined);
  }
  function isOwn(id, state) {
    return (state.recipes || []).some(function (r) { return r.id === id; });
  }
  function keeperIds(state) {
    var out = [];
    (state.savedRecipeIds || []).forEach(function (id) { if (out.indexOf(id) < 0 && SL.recipes.find(id, state)) out.push(id); });
    (state.recipes || []).forEach(function (r) { if (r && out.indexOf(r.id) < 0) out.push(r.id); });
    return out;
  }
  function ingName(line) {
    var ing = line.ingredientId ? ings()[line.ingredientId] : null;
    return ing ? ing.name : (line.rawText || "Unrecognized ingredient");
  }

  /* Re-render this screen, keeping focus on the element with the same data-fk. */
  function refresh() {
    if (!view.container) return;
    var a = document.activeElement;
    var fk = a && a.getAttribute && a.getAttribute("data-fk");
    draw(view.container, view.params);
    if (fk) {
      var el = view.container.querySelector('[data-fk="' + fk + '"]');
      if (el && !el.disabled) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    }
  }

  /* ---------- pasted-text import (CLAUDE.md 4.3) ---------- */

  function parseAmount(s) {
    var m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s);
    if (m) return +m[1] + (+m[2] / +m[3]);
    m = /^(\d+)\/(\d+)$/.exec(s);
    if (m) return +m[1] / +m[2];
    return parseFloat(s);
  }
  function normUnit(w) {
    var u = String(w || "").toLowerCase().replace(/\.$/, "");
    if (UNITS.indexOf(u) >= 0) return u;
    if (/s$/.test(u) && UNITS.indexOf(u.slice(0, -1)) >= 0) return u.slice(0, -1);
    return null;
  }
  /* Exact name first, then the longest catalog name the text contains. */
  function matchName(text) {
    var t = String(text || "").toLowerCase().trim();
    if (!t) return null;
    var all = ings(), best = null;
    for (var id in all) if (all[id].name.toLowerCase() === t) return id;
    for (var id2 in all) {
      var n = all[id2].name.toLowerCase();
      if (t.indexOf(n) >= 0 && (!best || n.length > all[best].name.length)) best = id2;
    }
    return best;
  }
  function parseText(text, title) {
    var lines = String(text || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var ingredients = [], steps = [], inSteps = false;
    lines.forEach(function (raw) {
      if (!inSteps && /^(steps|directions|method)\s*:?$/i.test(raw)) { inSteps = true; return; }
      if (inSteps) { steps.push(raw.replace(/^\d+[.)]\s*/, "")); return; }
      var line = raw.replace(/^[-•*]\s*/, "");
      var amount = null, unit = null, rest = line;
      var m = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)$/.exec(line);
      if (m) {
        amount = parseAmount(m[1]); rest = m[2];
        var w = /^(\S+)\s*(.*)$/.exec(rest);
        if (w && normUnit(w[1])) { unit = normUnit(w[1]); rest = w[2]; }
      }
      var id = matchName(rest);
      if (id) {
        ingredients.push({ ingredientId: id, amount: amount == null ? 1 : amount, unit: ings()[id].unit });
      } else {
        ingredients.push({ ingredientId: null, rawText: raw, amount: amount == null ? 1 : amount, unit: unit || "each" });
      }
    });
    return {
      id: "r-import-draft", title: title || "Pasted recipe",
      source: { type: "imported", label: "Imported from pasted text" },
      mealTypes: ["dinner"], baseServings: 4, makesLeftovers: false,
      folder: "Imported", tags: [], ingredients: ingredients, steps: steps
    };
  }

  /* ---------- safety summary (2.6, 2.13) ---------- */

  function safetyHTML(recipe, state, withSwaps) {
    var check = SL.safety.checkMeal(recipe, eaterIds(state), state);
    var html = '<div class="rc-safety">' +
      '<div class="row rc-safety__badge">' + badge(check, state) + "</div>" +
      '<ul class="rc-people">';
    (check.people || []).forEach(function (p) {
      var name = nameOf(p.personId, state);
      html += '<li class="rc-person"><details><summary><strong>' + esc(name) + "</strong>: " +
        '<span class="result--' + p.status + '">' + esc(STATUS_TEXT[p.status]) + "</span></summary>" +
        '<ul class="rc-rows">';
      p.rows.forEach(function (row, i) {
        var line = (recipe.ingredients || [])[i] || {};
        html += '<li><span class="result--' + row.result + ' rc-result">' + esc(RESULT_TEXT[row.result]) + "</span> " +
          "<strong>" + esc(ingName(line)) + "</strong>: " + esc(row.reason) + "</li>";
      });
      html += "</ul></details></li>";
    });
    html += "</ul>";
    if (check.badge === "fixable" && check.fixes.length) {
      if (withSwaps) {
        html += '<p class="small">A safe swap fixes this:</p><ul class="rc-fixes">';
        check.fixes.forEach(function (sw, i) {
          var from = ings()[sw.from], to = ings()[sw.to];
          html += '<li class="rc-fix"><span>' + esc((from ? from.name : sw.from) + " → " + (to ? to.name : sw.to)) +
            (sw.note ? ". " + esc(sw.note) : "") + "</span> " +
            '<button type="button" class="btn btn-secondary" data-act="swap" data-i="' + i + '" data-fk="swap-' + i +
            '" aria-label="Apply swap: use ' + esc(to ? to.name : sw.to) + '">↻ Apply swap</button></li>';
        });
        html += "</ul>";
      } else {
        html += '<p class="small">A safe swap is available. Save, then apply it on the recipe page.</p>';
      }
    }
    html += "</div>";
    return { html: html, check: check };
  }

  /* ---------- Keeper (#/recipes) ---------- */

  function renderKeeper(c, state) {
    var ids = keeperIds(state);
    var eaters = eaterIds(state);
    var items = ids.map(function (id) {
      var r = SL.recipes.effective(id, state);
      return { r: r, check: SL.safety.checkMeal(r, eaters, state) };
    });
    var tags = [];
    items.forEach(function (it) { (it.r.tags || []).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
    tags.sort();
    if (ui.tag && tags.indexOf(ui.tag) < 0) ui.tag = "";

    var html =
      '<header class="spread"><h1>Recipe Keeper</h1>' +
      '<a class="btn btn-primary" href="#/recipes/import" aria-label="Import a recipe">＋ Import</a></header>' +
      '<p class="muted small">Badges are for: ' + esc(joinNames(eaters.map(function (id) { return nameOf(id, state); }))) + ".</p>" +
      '<div class="form-row"><label for="rc-search">Search recipes</label>' +
      '<input type="search" id="rc-search" data-fk="search" placeholder="Title, tag or ingredient" value="' + esc(ui.query) + '"></div>';
    if (tags.length) {
      html += '<div class="rc-tags" role="group" aria-label="Filter by tag"><ul class="chip-list">';
      tags.forEach(function (t) {
        html += '<li><button type="button" class="chip" data-act="tag" data-tag="' + esc(t) + '" data-fk="tag-' + esc(t) +
          '" aria-pressed="' + (ui.tag === t) + '" aria-label="Tag ' + esc(t) + '">' + esc(t) + "</button></li>";
      });
      html += "</ul></div>";
    }
    html += '<div id="rc-results"></div>';
    c.innerHTML = '<section class="rc-keeper">' + html + "</section>";
    c.querySelector("#rc-results").innerHTML = keeperResults(items, state);

    c.querySelector("#rc-search").addEventListener("input", function (e) {
      ui.query = e.target.value;
      c.querySelector("#rc-results").innerHTML = keeperResults(items, state);
    });
    c.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act='tag']");
      if (!b) return;
      var t = b.getAttribute("data-tag");
      ui.tag = ui.tag === t ? "" : t;
      refresh();
    });
  }

  function keeperResults(items, state) {
    if (!items.length) {
      return '<div class="card rc-empty"><h2>No saved recipes yet</h2>' +
        "<p>Save ideas from Meals, or import a recipe from a link, pasted text or a cookbook photo.</p>" +
        '<div class="row"><a class="btn btn-secondary" href="#/meals" aria-label="Find meal ideas">Find meal ideas</a>' +
        '<a class="btn btn-secondary" href="#/recipes/import" aria-label="Import a recipe">Import a recipe</a></div></div>';
    }
    var q = ui.query.trim().toLowerCase();
    var shown = items.filter(function (it) {
      var r = it.r;
      if (ui.tag && (r.tags || []).indexOf(ui.tag) < 0) return false;
      if (!q) return true;
      if (String(r.title).toLowerCase().indexOf(q) >= 0) return true;
      if ((r.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) >= 0; })) return true;
      return (r.ingredients || []).some(function (l) { return ingName(l).toLowerCase().indexOf(q) >= 0; });
    });
    if (!shown.length) return '<p class="rc-none" role="status">No recipes match. Try another word or tag.</p>';
    var folders = {}, order = [];
    shown.forEach(function (it) {
      var f = it.r.folder || "Unfiled";
      if (!folders[f]) { folders[f] = []; order.push(f); }
      folders[f].push(it);
    });
    order.sort();
    var html = '<p class="sr-only" role="status">' + shown.length + " recipes shown.</p>";
    order.forEach(function (f) {
      html += '<section class="rc-folder" aria-label="Folder ' + esc(f) + '"><h2 class="rc-folder__h">' +
        '<span aria-hidden="true">📁</span> ' + esc(f) + ' <span class="muted small">(' + folders[f].length + ")</span></h2>";
      folders[f].forEach(function (it) {
        var r = it.r;
        html += '<a class="card card--link rc-card" href="#/recipes/' + encodeURIComponent(r.id) + '" data-rid="' + esc(r.id) + '">' +
          '<span class="card__title">' + esc(r.title) + "</span>" +
          '<span class="rc-source small muted">' + esc((r.source && r.source.label) || "") + "</span>" +
          '<span class="rc-card__badge">' + badge(it.check, state) + "</span>" +
          ((r.tags || []).length ? '<span class="rc-card__tags small">' + r.tags.map(function (t) { return "#" + esc(t); }).join(" ") + "</span>" : "") +
          "</a>";
      });
      html += "</section>";
    });
    return html;
  }

  /* ---------- Detail (#/recipes/:id) ---------- */

  function renderDetail(c, state, id) {
    if (draft && draft.mode === "edit" && draft.origId === id) return renderEditor(c, state);
    var raw = SL.recipes.find(id, state);
    if (!raw) {
      c.innerHTML = '<section class="card"><h1>Recipe not found</h1><p>This recipe may have been removed.</p>' +
        '<a class="btn btn-secondary" href="#/recipes" aria-label="Back to Recipe Keeper">Back to Recipe Keeper</a></section>';
      return;
    }
    var r = SL.recipes.effective(id, state);
    var serv = r.servings || r.baseServings;
    var m = SL.recipes.macros(r), cost = SL.recipes.cost(r);
    var s = safetyHTML(r, state, true);
    var anyFail = (s.check.people || []).some(function (p) { return p.status === "fail"; });
    var saved = isOwn(id, state) || (state.savedRecipeIds || []).indexOf(id) >= 0;

    var html =
      '<a class="btn btn-text" href="#/recipes" aria-label="Back to Recipe Keeper">← Recipes</a>' +
      "<h1>" + esc(r.title) + "</h1>" +
      '<p class="rc-source"><span class="muted">Source:</span> ' + esc((r.source && r.source.label) || "Unknown") +
      (r.source && r.source.url ? ' <span class="small muted">(' + esc(r.source.url) + ")</span>" : "") + "</p>" +
      '<p class="small muted">' + esc(r.folder || "Unfiled") + ((r.tags || []).length ? " · " + r.tags.map(function (t) { return "#" + esc(t); }).join(" ") : "") +
      (r.makesLeftovers ? ' · <span aria-hidden="true">🍱</span> makes leftovers' : "") + "</p>" +
      '<section class="card" aria-live="polite"><h2>Is it safe?</h2>' + s.html + "</section>" +
      '<section class="card"><div class="spread"><h2 id="rc-serv-h">Servings</h2>' +
        '<div class="row rc-stepper" role="group" aria-labelledby="rc-serv-h">' +
        '<button type="button" class="btn btn-secondary rc-step" data-act="serv" data-d="-1" data-fk="serv-minus" aria-label="Fewer servings"' + (serv <= 1 ? " disabled" : "") + ">−</button>" +
        '<output class="rc-serv" aria-live="polite" aria-label="Servings">' + serv + "</output>" +
        '<button type="button" class="btn btn-secondary rc-step" data-act="serv" data-d="1" data-fk="serv-plus" aria-label="More servings"' + (serv >= 24 ? " disabled" : "") + ">＋</button>" +
        "</div></div>" +
        '<h3>Ingredients</h3><ul class="rc-ings">';
    (r.ingredients || []).forEach(function (l) {
      var ing = l.ingredientId ? ings()[l.ingredientId] : null;
      html += ing
        ? "<li><strong>" + esc(SL.util.fmtAmount(l.amount, l.unit || ing.unit)) + "</strong> " + esc(ing.name) +
          (ing.staple ? ' <span class="small muted">(pantry staple)</span>' : "") + "</li>"
        : '<li class="rc-unmatched"><span aria-hidden="true">?</span> ' + esc(l.rawText || "Unrecognized ingredient") +
          ' <span class="small">(not recognized: edit to match it)</span></li>';
    });
    html += "</ul>" +
      '<h3>Per serving</h3><dl class="rc-macros">' +
        "<div><dt>Calories</dt><dd>" + m.kcal + "</dd></div>" +
        "<div><dt>Protein</dt><dd>" + m.proteinG + " g</dd></div>" +
        "<div><dt>Carbs</dt><dd>" + m.carbsG + " g</dd></div>" +
        "<div><dt>Fat</dt><dd>" + m.fatG + " g</dd></div>" +
        '<div><dt>Cost</dt><dd class="rc-cost">' + money(cost.usd) + ' <span class="small muted">estimate</span></dd></div>' +
      "</dl>" +
      '<p class="small rc-total">Whole recipe: <span class="rc-total__usd">' + money(cost.usd * serv) + "</span> estimate for " + serv + " servings.</p>" +
      (cost.excludedCount ? '<p class="small muted">Excludes ' + cost.excludedCount + " unrecognized ingredient" + (cost.excludedCount > 1 ? "s" : "") + ".</p>" : "") +
      '<p class="small muted">Pantry staples are left out of cost.</p>' +
      "</section>" +
      '<section class="card"><h2>Steps</h2><ol class="rc-steps">' +
      (r.steps || []).map(function (st) { return "<li>" + esc(st) + "</li>"; }).join("") + "</ol></section>" +
      '<div class="rc-actions">' +
        (anyFail ? '<p class="rc-note" id="rc-fix-note"><span aria-hidden="true">↻ </span>Apply the swap first.</p>' : "") +
        '<div class="row">' +
        '<button type="button" class="btn btn-primary" data-act="plan" data-fk="plan" aria-label="Plan this meal"' +
          (anyFail ? ' disabled aria-describedby="rc-fix-note"' : "") + ">📅 Plan</button>" +
        (saved
          ? (isOwn(id, state) ? "" : '<button type="button" class="btn btn-secondary" data-act="unsave" data-fk="save" aria-label="Remove from Keeper">Remove from Keeper</button>')
          : '<button type="button" class="btn btn-secondary" data-act="save" data-fk="save" aria-label="Save to Keeper"' + (anyFail ? ' disabled aria-describedby="rc-fix-note"' : "") + ">♡ Save to Keeper</button>") +
        '<button type="button" class="btn btn-secondary" data-act="edit" data-fk="edit" aria-label="Edit recipe">✎ Edit</button>' +
        '<button type="button" class="btn btn-secondary" data-act="share" data-fk="share" aria-label="Share recipe">↗ Share</button>' +
        '<button type="button" class="btn btn-text" data-act="report" data-fk="report" aria-label="Report a problem">⚑ Report a problem</button>' +
        "</div></div>" +
      '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    c.innerHTML = '<article class="rc-detail">' + html + "</article>";

    c.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]");
      if (!b || b.disabled) return;
      var act = b.getAttribute("data-act");
      var st = SL.store.get();
      var ov = copy(st.recipeOverrides || {});
      if (act === "serv") {
        var cur = (ov[id] && ov[id].servings) || serv;
        var n = Math.max(1, Math.min(24, cur + Number(b.getAttribute("data-d"))));
        ov[id] = ov[id] || {}; ov[id].servings = n;
        SL.store.set({ recipeOverrides: ov }); refresh();
      } else if (act === "swap") {
        var sw = s.check.fixes[Number(b.getAttribute("data-i"))];
        if (!sw) return;
        ov[id] = ov[id] || {}; ov[id].swaps = ov[id].swaps || {}; ov[id].swaps[sw.from] = sw.to;
        SL.store.set({ recipeOverrides: ov }); refresh();
        var hb = c.querySelector(".rc-safety__badge"); if (hb && !c.contains(document.activeElement)) { hb.setAttribute("tabindex", "-1"); hb.focus(); }
      } else if (act === "plan") {
        SL.app.go("#/list/plan/" + encodeURIComponent(id));
      } else if (act === "save") {
        SL.store.set({ savedRecipeIds: (st.savedRecipeIds || []).concat([id]) }); refresh();
      } else if (act === "unsave") {
        SL.store.set({ savedRecipeIds: (st.savedRecipeIds || []).filter(function (x) { return x !== id; }) }); refresh();
      } else if (act === "edit") {
        draft = { mode: "edit", origId: id, recipe: SL.recipes.find(id, st) };
        draw(view.container, view.params);
        var t = view.container.querySelector("#rc-title"); if (t) t.focus();
      } else if (act === "share") {
        SL.share.open("recipe", { recipeId: id });
      } else if (act === "report") {
        SL.share.report(id);
      }
    });
  }

  /* ---------- Editor (edit mode + import preview) ---------- */

  function catalogOptions(selected) {
    var all = ings(), ids = Object.keys(all).sort(function (a, b) { return all[a].name < all[b].name ? -1 : 1; });
    var html = '<option value=""' + (selected ? "" : " selected") + ">Not recognized: pick an ingredient</option>";
    ids.forEach(function (id) {
      html += '<option value="' + esc(id) + '"' + (id === selected ? " selected" : "") + ">" + esc(all[id].name) + "</option>";
    });
    return html;
  }

  /* The draft as it would be shown: with the recipe's servings override (edit mode). */
  function editorRecipe(state) {
    var r = copy(draft.recipe);
    if (draft.mode === "edit") {
      var ov = state.recipeOverrides && state.recipeOverrides[draft.origId];
      if (ov && ov.servings) r = SL.recipes.scale(r, ov.servings);
    }
    return r;
  }

  function renderEditor(c, state) {
    var r = draft.recipe;
    var isImport = draft.mode === "import";
    var lines = r.ingredients || [];
    var html =
      (isImport
        ? '<h1>Check your import</h1><p class="muted">Source: ' + esc(r.source.label) + ". Fix anything we didn't recognize, then save.</p>"
        : "<h1>Edit recipe</h1>" + (isOwn(draft.origId, state) ? "" :
          '<p class="muted small">Saving makes your own copy. The original stays as it was.</p>')) +
      '<form class="rc-edit" novalidate>' +
      '<div class="form-row"><label for="rc-title">Title</label><input type="text" id="rc-title" data-fk="title" data-f="title" value="' + esc(r.title) + '"></div>' +
      '<div class="form-row"><label for="rc-folder">Folder</label><input type="text" id="rc-folder" data-fk="folder" data-f="folder" value="' + esc(r.folder || "") + '"></div>' +
      '<div class="form-row"><label for="rc-tags">Tags</label><input type="text" id="rc-tags" data-fk="tags" data-f="tags" aria-describedby="rc-tags-hint" value="' + esc((r.tags || []).join(", ")) + '">' +
        '<span class="hint" id="rc-tags-hint">Separate tags with commas.</span></div>' +
      '<fieldset><legend>Meal types</legend><div class="row">' +
      MEALS.map(function (m) {
        return '<label class="row rc-check"><input type="checkbox" data-f="meal" data-fk="meal-' + m + '" value="' + m + '"' +
          ((r.mealTypes || []).indexOf(m) >= 0 ? " checked" : "") + "> " + MEAL_NAMES[m] + "</label>";
      }).join("") +
      '<label class="row rc-check"><input type="checkbox" data-f="leftovers" data-fk="leftovers"' + (r.makesLeftovers ? " checked" : "") + "> Makes leftovers</label>" +
      "</div></fieldset>" +
      '<div class="form-row"><label for="rc-base">Base servings</label><input type="number" min="1" max="24" id="rc-base" data-fk="base" data-f="base" value="' + esc(r.baseServings) + '"></div>' +
      '<fieldset><legend>Ingredients</legend><ul class="rc-lines">';
    lines.forEach(function (l, i) {
      var ing = l.ingredientId ? ings()[l.ingredientId] : null;
      html += '<li class="rc-line' + (ing ? "" : " rc-line--unmatched") + '">' +
        (ing ? "" : '<p class="rc-raw"><span aria-hidden="true">? </span>We don\'t recognize “' + esc(l.rawText || "this line") + "”. Pick a match or remove it.</p>") +
        '<div class="rc-line__grid">' +
        '<label class="sr-only" for="rc-ing-' + i + '">Ingredient ' + (i + 1) + "</label>" +
        '<select id="rc-ing-' + i + '" data-f="ing" data-i="' + i + '" data-fk="ing-' + i + '">' + catalogOptions(l.ingredientId) + "</select>" +
        '<label class="sr-only" for="rc-amt-' + i + '">Amount for ingredient ' + (i + 1) + "</label>" +
        '<input type="number" min="0" step="any" id="rc-amt-' + i + '" data-f="amt" data-i="' + i + '" data-fk="amt-' + i + '" value="' + esc(l.amount) + '">' +
        '<label class="sr-only" for="rc-unit-' + i + '">Unit for ingredient ' + (i + 1) + "</label>" +
        '<select id="rc-unit-' + i + '" data-f="unit" data-i="' + i + '" data-fk="unit-' + i + '"' + (ing ? ' disabled aria-describedby="rc-unit-hint"' : "") + ">" +
        UNITS.map(function (u) { var cur = ing ? ing.unit : l.unit; return '<option value="' + u + '"' + (u === cur ? " selected" : "") + ">" + u + "</option>"; }).join("") +
        "</select>" +
        '<button type="button" class="btn btn-text" data-act="rm-line" data-i="' + i + '" data-fk="rm-' + i + '" aria-label="Remove ' + esc(ingName(l)) + '">✕ Remove</button>' +
        "</div></li>";
    });
    html += "</ul>" +
      '<p class="hint small" id="rc-unit-hint">Each catalog ingredient has a fixed unit (no unit conversion).</p>' +
      '<button type="button" class="btn btn-secondary" data-act="add-line" data-fk="add-line" aria-label="Add an ingredient">＋ Add ingredient</button>' +
      "</fieldset>" +
      '<div class="form-row"><label for="rc-steps">Steps</label><textarea id="rc-steps" data-f="steps" data-fk="steps" aria-describedby="rc-steps-hint" rows="6">' +
        esc((r.steps || []).join("\n")) + '</textarea><span class="hint" id="rc-steps-hint">One step per line.</span></div>' +
      '<section class="card" aria-live="polite"><h2>Is it safe?</h2><div id="rc-live-safety"></div></section>' +
      '<p class="rc-msg" role="alert"></p>' +
      '<div class="row"><button type="submit" class="btn btn-primary" data-fk="save-edit" aria-label="' + (isImport ? "Save to Keeper" : "Save changes") + '">' +
        (isImport ? "Save to Keeper" : "Save changes") + "</button>" +
      '<button type="button" class="btn btn-text" data-act="cancel" data-fk="cancel" aria-label="Cancel">Cancel</button></div>' +
      "</form>" +
      '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    c.innerHTML = '<section class="rc-editor">' + html + "</section>";
    updateLiveSafety(c, state);

    var form = c.querySelector("form");
    form.addEventListener("input", function (e) { readField(e.target, false); updateLiveSafety(c, SL.store.get()); });
    form.addEventListener("change", function (e) {
      var structural = readField(e.target, true);
      if (structural) refresh(); else updateLiveSafety(c, SL.store.get());
    });
    form.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "rm-line") {
        draft.recipe.ingredients.splice(Number(b.getAttribute("data-i")), 1);
        refresh();
        var next = view.container.querySelector('[data-fk="add-line"]'); if (next) next.focus();
      } else if (act === "add-line") {
        draft.recipe.ingredients.push({ ingredientId: null, rawText: "New ingredient", amount: 1, unit: "each" });
        refresh();
        var sel = view.container.querySelector("#rc-ing-" + (draft.recipe.ingredients.length - 1)); if (sel) sel.focus();
      } else if (act === "cancel") {
        var back = draft.mode === "edit" ? "#/recipes/" + encodeURIComponent(draft.origId) : "#/recipes/import";
        draft = null; SL.app.go(back);
      }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); saveDraft(c); });
  }

  function updateLiveSafety(c, state) {
    var box = c.querySelector("#rc-live-safety");
    if (box) box.innerHTML = safetyHTML(editorRecipe(state), state, false).html;
  }

  /* Copies a form field into the draft. Returns true when the layout must re-render. */
  function readField(el, isChange) {
    var f = el.getAttribute("data-f"), r = draft.recipe;
    if (!f) return false;
    var i = Number(el.getAttribute("data-i"));
    if (f === "title") r.title = el.value;
    else if (f === "folder") r.folder = el.value;
    else if (f === "tags") r.tags = el.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    else if (f === "steps") r.steps = el.value.split(/\r?\n/).map(function (t) { return t.trim(); }).filter(Boolean);
    else if (f === "base") { var n = parseInt(el.value, 10); if (n > 0) r.baseServings = Math.min(24, n); }
    else if (f === "leftovers") r.makesLeftovers = el.checked;
    else if (f === "meal") {
      var mt = (r.mealTypes || []).filter(function (m) { return m !== el.value; });
      if (el.checked) mt.push(el.value);
      r.mealTypes = MEALS.filter(function (m) { return mt.indexOf(m) >= 0; });
    } else if (f === "amt") { var a = parseFloat(el.value); r.ingredients[i].amount = a >= 0 ? a : 0; }
    else if (f === "unit") r.ingredients[i].unit = el.value;
    else if (f === "ing" && isChange) {
      var line = r.ingredients[i], id = el.value || null;
      if (id) { line.ingredientId = id; line.unit = ings()[id].unit; delete line.rawText; }
      else { line.rawText = line.rawText || "Unrecognized ingredient"; line.ingredientId = null; }
      return true;
    }
    return false;
  }

  function saveDraft(c) {
    var st = SL.store.get();
    var r = copy(draft.recipe);
    var msg = c.querySelector(".rc-msg");
    if (!String(r.title || "").trim()) { msg.textContent = "▲ Please give the recipe a title."; c.querySelector("#rc-title").focus(); return; }
    if (!(r.mealTypes || []).length) { msg.textContent = "▲ Pick at least one meal type."; return; }
    r.title = r.title.trim();
    r.folder = String(r.folder || "").trim() || "Unfiled";
    var recipes = st.recipes || [], newId;
    if (draft.mode === "import") {
      newId = SL.util.newId("r");
      r.id = newId;
      r.source = { type: "imported", label: r.source.label || "Imported", url: r.source.url };
      if (!r.source.url) delete r.source.url;
      SL.store.set({ recipes: recipes.concat([r]) });
    } else if (isOwn(draft.origId, st)) {
      newId = draft.origId;
      SL.store.set({ recipes: recipes.map(function (x) { return x.id === newId ? r : x; }) });
    } else {
      var orig = SL.recipes.find(draft.origId, st);
      if (JSON.stringify(orig) === JSON.stringify(r)) { newId = draft.origId; }
      else {
        newId = SL.util.newId("r");
        r.id = newId;
        r.source = { type: orig.source.type, label: orig.source.label + ", edited by you" };
        if (orig.source.url) r.source.url = orig.source.url;
        var ov = copy(st.recipeOverrides || {});
        if (ov[draft.origId]) ov[newId] = copy(ov[draft.origId]);
        SL.store.set({
          recipes: recipes.concat([r]),
          recipeOverrides: ov,
          savedRecipeIds: (st.savedRecipeIds || []).filter(function (x) { return x !== draft.origId; })
        });
      }
    }
    draft = null;
    ui.importText = ""; ui.importUrl = ""; ui.importTitle = "";
    SL.app.go("#/recipes/" + encodeURIComponent(newId));
  }

  /* ---------- Import (#/recipes/import) ---------- */

  function renderImport(c, state) {
    if (draft && draft.mode === "import") return renderEditor(c, state);
    var tabs = [["link", "🔗", "Link"], ["paste", "📋", "Paste text"], ["photo", "📷", "Cookbook photo"]];
    var html =
      '<a class="btn btn-text" href="#/recipes" aria-label="Back to Recipe Keeper">← Recipes</a>' +
      "<h1>Import a recipe</h1>" +
      '<p class="muted">Every imported recipe is checked for everyone at your table before you save it.</p>' +
      '<div class="row rc-import-tabs" role="group" aria-label="Import from">' +
      tabs.map(function (t) {
        return '<button type="button" class="chip" data-act="itab" data-tab="' + t[0] + '" data-fk="itab-' + t[0] +
          '" aria-pressed="' + (ui.importTab === t[0]) + '" aria-label="Import from ' + t[2] + '"><span aria-hidden="true">' + t[1] + "</span> " + t[2] + "</button>";
      }).join("") + "</div>" +
      '<form class="card rc-import" novalidate>';
    if (ui.importTab === "link") {
      html += '<div class="form-row"><label for="rc-url">Recipe link</label>' +
        '<input type="url" id="rc-url" data-fk="url" placeholder="https://" value="' + esc(ui.importUrl) + '">' +
        '<span class="hint">In this prototype every link returns the same sample recipe.</span></div>' +
        '<button type="submit" class="btn btn-primary" aria-label="Import from link">Import</button>';
    } else if (ui.importTab === "paste") {
      html += '<div class="form-row"><label for="rc-ptitle">Recipe name</label>' +
        '<input type="text" id="rc-ptitle" data-fk="ptitle" value="' + esc(ui.importTitle) + '" placeholder="Pasted recipe"></div>' +
        '<div class="form-row"><label for="rc-paste">Recipe text</label>' +
        '<textarea id="rc-paste" data-fk="paste" rows="10" aria-describedby="rc-paste-hint">' + esc(ui.importText) + "</textarea>" +
        '<span class="hint" id="rc-paste-hint">One ingredient per line, like “2 cups white rice”. Then a line that says Steps, followed by the steps.</span></div>' +
        '<button type="submit" class="btn btn-primary" aria-label="Import pasted text">Import</button>';
    } else {
      html += "<p>Take a photo of a cookbook page and we'll read it.</p>" +
        '<button type="submit" class="btn btn-primary" aria-label="Take cookbook photo (sample)"><span aria-hidden="true">📷</span> Take photo (sample)</button>' +
        '<p class="hint small">This prototype uses a sample cookbook page.</p>';
    }
    html += '<p class="rc-msg" role="alert"></p></form>';
    c.innerHTML = '<section class="rc-importer">' + html + "</section>";

    c.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act='itab']");
      if (!b) return;
      ui.importTab = b.getAttribute("data-tab"); refresh();
    });
    var form = c.querySelector("form");
    form.addEventListener("input", function (e) {
      if (e.target.id === "rc-url") ui.importUrl = e.target.value;
      if (e.target.id === "rc-paste") ui.importText = e.target.value;
      if (e.target.id === "rc-ptitle") ui.importTitle = e.target.value;
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var samples = (SL.data && SL.data.importSamples) || {};
      var recipe = null, msg = form.querySelector(".rc-msg");
      if (ui.importTab === "link") {
        if (!/^https?:\/\/\S+\.\S+/i.test(ui.importUrl.trim())) { msg.textContent = "▲ Please paste a full link that starts with https://"; form.querySelector("#rc-url").focus(); return; }
        recipe = copy(samples.link);
      } else if (ui.importTab === "paste") {
        if (!ui.importText.trim()) { msg.textContent = "▲ Paste the recipe text first."; form.querySelector("#rc-paste").focus(); return; }
        recipe = parseText(ui.importText, ui.importTitle.trim());
      } else {
        recipe = copy(samples.photo);
      }
      if (!recipe) return;
      draft = { mode: "import", origId: null, recipe: recipe };
      draw(view.container, view.params);
      var h = view.container.querySelector("h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    });
  }

  /* ---------- entry ---------- */

  /* Route entry: a route change always starts outside edit mode. */
  function render(container, params) {
    draft = null;
    draw(container, params);
  }

  function draw(container, params) {
    view.container = container; view.params = params;
    // A fresh child element each render, so listeners never stack up.
    var c = document.createElement("div");
    c.className = "rc-screen";
    container.innerHTML = "";
    container.appendChild(c);
    var state = SL.store.get();
    var parts = (params && params.parts) || [];
    if (draft && draft.mode === "edit" && parts[0] !== draft.origId) draft = null;
    if (draft && draft.mode === "import" && parts[0] !== "import") draft = null;
    if (parts[0] === "import") renderImport(c, state);
    else if (parts[0]) renderDetail(c, state, parts[0]);
    else renderKeeper(c, state);
  }

  return { render: render, _parseText: parseText };
})();
