/* js/screens/list.js (Eleanor): weekly planner + grocery list, and the logic
   SL.list.build(state) (CLAUDE.md 4.3). Definitions only, nothing runs at load
   time. build takes state as an argument, never calls SL.store and never
   mutates its input or SL.data. */
window.SL = window.SL || {};

SL.list = (function () {
  var MEALS = ["breakfast", "lunch", "dinner", "snack"];

  /* Round to cents; toFixed first so float noise (2.025 -> 2.02499...) rounds half up. */
  function cents(n) { return Math.round(Number((n * 100).toFixed(6))) / 100; }

  /* Planned (non-leftover) slots on or after weekStart, in date then meal order. */
  function plannedSlots(state) {
    var plan = (state && state.plan) || {};
    var start = (state && state.weekStart) || "";
    var out = [];
    Object.keys(plan).sort().forEach(function (date) {
      if (start && date < start) return;
      var day = plan[date] || {};
      MEALS.forEach(function (meal) {
        var slot = day[meal];
        if (slot && slot.recipeId && !slot.leftoverOf) out.push(slot);
      });
    });
    return out;
  }

  function build(state) {
    var ings = (SL.data && SL.data.ingredients) || {};
    var prices = (SL.data && SL.data.prices) || {};

    // Confirmed fridge items never go on the list.
    var inFridge = {};
    ((state && state.fridge) || []).forEach(function (f) {
      if (f && f.confirmed === true) inFridge[f.ingredientId] = true;
    });

    // 1–3. Effective recipe per slot, scaled to the slot; sum amounts; drop
    // staples, unmatched lines and confirmed fridge items.
    var byId = {}, order = [], uses = [];
    plannedSlots(state).forEach(function (slot) {
      var recipe = SL.recipes.effective(slot.recipeId, state);
      if (!recipe) return;
      if (slot.servings) recipe = SL.recipes.scale(recipe, slot.servings);
      var use = { slot: slot, recipe: recipe, ids: {}, check: null };
      uses.push(use);
      (recipe.ingredients || []).forEach(function (line) {
        var id = line.ingredientId;
        var ing = id && ings[id];
        if (!ing || ing.staple || inFridge[id]) return;
        if (!byId[id]) {
          byId[id] = { ingredientId: id, aisle: ing.aisle || "Other", amount: 0,
                       unit: line.unit || ing.unit, costUSD: 0, warnings: [] };
          order.push(id);
        }
        byId[id].amount += Number(line.amount) || 0;
        use.ids[id] = true;
      });
    });

    // 4. Cost per item, then total.
    var total = 0;
    order.forEach(function (id) {
      var p = prices[id];
      byId[id].costUSD = p ? cents(byId[id].amount * p.perUnit) : 0;
      total += byId[id].costUSD;
    });

    // 5. Label warnings from each slot's own eaters, one per person per item.
    order.forEach(function (id) {
      var seen = {};
      uses.forEach(function (use) {
        if (!use.ids[id]) return;
        if (!use.check) use.check = SL.safety.checkMeal(use.recipe, use.slot.eaterIds || [], state);
        ((use.check && use.check.people) || []).forEach(function (person) {
          if (seen[person.personId]) return;
          var rows = person.rows || [];
          for (var i = 0; i < rows.length; i++) {
            if (rows[i].ingredientId === id && rows[i].result === "label") {
              seen[person.personId] = true;
              byId[id].warnings.push({ personId: person.personId, text: rows[i].reason });
              break;
            }
          }
        });
      });
    });

    // 6. Sort by aisle, then ingredient name.
    var items = order.map(function (id) { return byId[id]; });
    items.sort(function (a, b) {
      if (a.aisle !== b.aisle) return a.aisle < b.aisle ? -1 : 1;
      var na = (ings[a.ingredientId].name || "").toLowerCase();
      var nb = (ings[b.ingredientId].name || "").toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

    return { items: items, totalUSD: cents(total), budgetUSD: (state && state.budgetUSD) || 0 };
  }

  return { build: build };
})();

// ---- UI (Step 3): SL.screens.list goes here ----
SL.screens = SL.screens || {};

SL.screens.list = (function () {
  var MEALS = ["breakfast", "lunch", "dinner", "snack"];
  var MEAL_NAMES = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  var DISCLAIMER = "Shelf Life helps you plan but is not medical advice; always read product labels.";
  var DRAG_PX = 6;
  var EDGE_PX = 80;      // auto-scroll zone at the top and bottom of the screen while dragging
  var MAX_SCROLL = 18;   // px per frame at the very edge

  var view = { container: null, params: null };
  var ui = { picker: null, msg: null, budgetMsg: null };   // picker: { from: "tray"|"slot", recipeId, key, returnFk }
  var drag = null;

  function esc(t) { return SL.util.esc(t); }
  function ings() { return (SL.data && SL.data.ingredients) || {}; }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function money(n) { return "$" + (Number(n) || 0).toFixed(2); }

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
  function joinNames(n) {
    if (n.length <= 1) return n.join("");
    return n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
  }
  function failNames(check, state) {
    return (check.people || []).filter(function (p) { return p.status === "fail"; })
      .map(function (p) { return nameOf(p.personId, state); });
  }
  function weekDates(state) {
    var out = [];
    for (var i = 0; i < 7; i++) out.push(SL.util.addDays(state.weekStart, i));
    return out;
  }
  function dayLabel(date, long) {
    var p = String(date).split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2], 12);
    return d.toLocaleDateString("en-US", long ? { weekday: "long", month: "short", day: "numeric" } : { weekday: "short", day: "numeric" });
  }
  function slotName(key) {
    var k = key.split(":");
    return dayLabel(k[0], true) + " " + MEAL_NAMES[k[1]].toLowerCase();
  }
  function getSlot(plan, key) {
    var k = key.split(":");
    return plan[k[0]] ? plan[k[0]][k[1]] || null : null;
  }
  function putSlot(plan, key, slot) {
    var k = key.split(":");
    if (!plan[k[0]]) plan[k[0]] = { breakfast: null, lunch: null, dinner: null, snack: null };
    plan[k[0]][k[1]] = slot;
  }
  /* Clear a slot and any leftover slots made from it. */
  function clearSlot(plan, key) {
    putSlot(plan, key, null);
    Object.keys(plan).forEach(function (d) {
      MEALS.forEach(function (m) {
        var s = plan[d] && plan[d][m];
        if (s && s.leftoverOf === key) plan[d][m] = null;
      });
    });
  }
  function recipeTitle(id, state) {
    var r = SL.recipes.find(id, state);
    return r ? r.title : "Recipe";
  }

  /* Keep focus on the element with the same data-fk across a re-render. */
  function refresh(focusFk) {
    if (!view.container) return;
    var a = document.activeElement;
    var fk = focusFk || (a && a.getAttribute && a.getAttribute("data-fk"));
    draw(view.container, view.params);
    if (fk) {
      var el = view.container.querySelector('[data-fk="' + fk + '"]');
      if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    }
  }

  /* ---------- planning logic (CLAUDE.md 3 "Planning a meal", "Leftovers") ---------- */

  /* Place a recipe (from the tray) or move a slot (fromKey) into toKey.
     Returns { ok, text }. */
  function place(recipeId, toKey, fromKey) {
    var state = SL.store.get();
    var plan = copy(state.plan || {});
    var moving = fromKey ? getSlot(plan, fromKey) : null;
    if (fromKey && !moving) return { ok: false, text: "That slot is already empty." };
    if (fromKey === toKey) return { ok: true, text: "" };
    var rid = moving ? moving.recipeId : recipeId;
    var recipe = SL.recipes.effective(rid, state);
    if (!recipe) return { ok: false, text: "We couldn't find that recipe." };

    var eaters = eaterIds(state);
    var check = SL.safety.checkMeal(recipe, eaters, state);
    var fails = failNames(check, state);
    if (fails.length) {
      return { ok: false, text: "Not safe for " + joinNames(fails) + " yet. Apply the swap first." };
    }
    var servings = moving ? moving.servings : (recipe.servings || recipe.baseServings);
    var leftoverOf = moving ? moving.leftoverOf || null : null;
    if (fromKey) clearSlot(plan, fromKey);
    if (getSlot(plan, toKey)) clearSlot(plan, toKey);
    putSlot(plan, toKey, { recipeId: rid, eaterIds: eaters, servings: servings, leftoverOf: leftoverOf });

    var text = "Planned " + recipe.title + " for " + slotName(toKey) + ".";
    if (!leftoverOf && recipe.makesLeftovers) {
      var lk = fillLeftovers(plan, toKey, state, { recipeId: rid, eaterIds: eaters, servings: servings });
      if (lk) text += " Leftovers fill " + slotName(lk) + ".";
    }
    SL.store.set({ plan: plan });
    return { ok: true, text: text };
  }

  /* Next day's lunch if empty, else the next empty lunch later this week. */
  function fillLeftovers(plan, key, state, base) {
    var date = key.split(":")[0];
    var last = SL.util.addDays(state.weekStart, 6);
    for (var d = SL.util.addDays(date, 1); d <= last; d = SL.util.addDays(d, 1)) {
      var k = d + ":lunch";
      if (!getSlot(plan, k)) {
        putSlot(plan, k, { recipeId: base.recipeId, eaterIds: base.eaterIds, servings: base.servings, leftoverOf: key });
        return k;
      }
    }
    return null;
  }

  function removeSlot(key) {
    var state = SL.store.get();
    var plan = copy(state.plan || {});
    var s = getSlot(plan, key);
    if (!s) return { ok: false, text: "" };
    clearSlot(plan, key);
    SL.store.set({ plan: plan });
    return { ok: true, text: "Removed " + recipeTitle(s.recipeId, state) + " from " + slotName(key) + "." };
  }

  /* ---------- tabs ---------- */

  function tabsHTML(active) {
    function t(id, href, label, icon) {
      return '<a class="ls-tab" href="' + href + '"' + (active === id ? ' aria-current="page"' : "") +
        ' aria-label="' + label + '"><span aria-hidden="true">' + icon + "</span> " + label + "</a>";
    }
    return '<nav class="ls-tabs" aria-label="List views">' +
      t("plan", "#/list/plan", "Plan", "📅") + t("grocery", "#/list/grocery", "Grocery list", "🛒") + "</nav>";
  }

  /* ---------- planner (#/list/plan[/:recipeId]) ---------- */

  function renderPlan(c, state, focusId) {
    var eaters = eaterIds(state);
    var plan = state.plan || {};
    var trayIds = [];
    if (focusId && SL.recipes.find(focusId, state)) trayIds.push(focusId);
    (state.savedRecipeIds || []).forEach(function (id) { if (trayIds.indexOf(id) < 0 && SL.recipes.find(id, state)) trayIds.push(id); });
    (state.recipes || []).forEach(function (r) { if (r && trayIds.indexOf(r.id) < 0) trayIds.push(r.id); });

    var html = '<h1>This week</h1>' + tabsHTML("plan") +
      '<p class="muted small">Drag a recipe onto a day, or use “Place…”. Drag a planned meal back to the tray to remove it.</p>' +
      '<div class="ls-eaters" role="group" aria-label="Who\'s eating?"><span class="ls-eaters__label">Who\'s eating?</span> <ul class="chip-list">' +
      (state.profiles || []).map(function (p) {
        var on = eaters.indexOf(p.id) >= 0;
        return '<li><button type="button" class="chip" data-act="eater" data-pid="' + esc(p.id) + '" data-fk="eater-' + esc(p.id) +
          '" aria-pressed="' + on + '" aria-label="' + esc(p.firstName) + ' is eating">' + esc(p.firstName) + "</button></li>";
      }).join("") + "</ul></div>" +
      '<p class="ls-msg ' + (ui.msg && !ui.msg.ok ? "ls-msg--refused" : "") + '" role="' + (ui.msg && !ui.msg.ok ? "alert" : "status") + '">' +
        (ui.msg && ui.msg.text ? (ui.msg.ok ? "" : '<span aria-hidden="true">✕ </span>') + esc(ui.msg.text) : "") + "</p>" +
      pickerHTML(state) +
      '<section class="ls-tray" data-drop="tray" aria-labelledby="ls-tray-h"><h2 id="ls-tray-h" class="ls-tray__h">Recipes to plan</h2>';
    if (!trayIds.length) {
      html += '<p class="muted">Your Keeper is empty. Save recipes from <a href="#/meals">Meals</a> or <a href="#/recipes/import">import one</a> to plan them.</p>';
    }
    html += '<ul class="ls-tray__list">';
    trayIds.forEach(function (id) {
      var r = SL.recipes.effective(id, state);
      var check = SL.safety.checkMeal(r, eaters, state);
      var hl = id === focusId;
      html += '<li class="ls-card ls-drag' + (hl ? " ls-card--focus" : "") + '" data-rid="' + esc(id) + '">' +
        (hl ? '<span class="ls-card__flag small">★ From meal detail</span>' : "") +
        '<span class="ls-card__title">' + esc(r.title) + "</span>" +
        '<span class="ls-card__meta small muted">Serves ' + (r.servings || r.baseServings) + (r.makesLeftovers ? " · makes leftovers" : "") + "</span>" +
        SL.util.badgeHTML(check, check.badge === "unsafe" ? failNames(check, state) : undefined) +
        '<button type="button" class="btn btn-secondary ls-place" data-act="place" data-rid="' + esc(id) + '" data-fk="place-' + esc(id) +
        '" aria-label="Place ' + esc(r.title) + ' on a day">Place…</button></li>';
    });
    html += "</ul></section>";

    html += '<section class="ls-week" aria-label="Week plan">';
    weekDates(state).forEach(function (date) {
      var day = plan[date] || {};
      html += '<div class="ls-day"><h3 class="ls-day__h">' + esc(dayLabel(date, true)) + '</h3><div class="ls-day__grid">';
      MEALS.forEach(function (m) {
        var key = date + ":" + m, s = day[m];
        html += '<div class="ls-cell' + (s ? " ls-cell--full" : "") + '" data-cell="' + key + '">' +
          '<span class="ls-cell__meal small">' + MEAL_NAMES[m] + "</span>";
        if (s && s.recipeId) {
          var title = recipeTitle(s.recipeId, state);
          html += '<div class="ls-slot ls-drag' + (s.leftoverOf ? " ls-slot--leftover" : "") + '" data-key="' + key + '">' +
            '<a class="ls-slot__title" href="#/recipes/' + encodeURIComponent(s.recipeId) + '">' + esc(title) + "</a>" +
            '<span class="small muted">' + (s.leftoverOf ? '<span aria-hidden="true">🍱</span> Leftovers' : "Serves " + s.servings) + "</span>" +
            '<span class="ls-slot__btns">' +
            '<button type="button" class="btn btn-text ls-mini" data-act="move" data-key="' + key + '" data-fk="move-' + key +
              '" aria-label="Place ' + esc(title) + ' (' + esc(slotName(key)) + ') somewhere else">Place…</button>' +
            '<button type="button" class="btn btn-text ls-mini" data-act="remove" data-key="' + key + '" data-fk="rm-' + key +
              '" aria-label="Remove ' + esc(title) + " from " + esc(slotName(key)) + '">✕ Remove</button>' +
            "</span></div>";
        } else {
          html += '<span class="ls-cell__empty small muted">Empty</span>';
        }
        html += "</div>";
      });
      html += "</div></div>";
    });
    html += "</section>" +
      '<div class="row ls-actions"><button type="button" class="btn btn-secondary" data-act="share-plan" data-fk="share-plan" aria-label="Share plan">↗ Share plan</button>' +
      '<a class="btn btn-primary" href="#/list/grocery" aria-label="See grocery list">See grocery list</a></div>' +
      '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    c.innerHTML = '<section class="ls-plan">' + html + "</section>";

    c.addEventListener("click", onPlanClick);
    c.addEventListener("pointerdown", onPointerDown);
    c.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.key === "Esc") && ui.picker) { e.preventDefault(); closePicker(); }
    });
    var ps = c.querySelector("#ls-pick-day");
    if (ps && ui.picker && ui.picker.justOpened) { ui.picker.justOpened = false; ps.focus(); }
  }

  function pickerHTML(state) {
    var p = ui.picker;
    if (!p) return "";
    var title = p.from === "slot" ? recipeTitle(getSlot(state.plan || {}, p.key).recipeId, state) : recipeTitle(p.recipeId, state);
    var defDay = p.from === "slot" ? p.key.split(":")[0] : (SL.util.today() >= state.weekStart && SL.util.today() <= SL.util.addDays(state.weekStart, 6) ? SL.util.today() : state.weekStart);
    var defMeal = p.from === "slot" ? p.key.split(":")[1] : "dinner";
    return '<form class="card ls-picker" role="group" aria-labelledby="ls-pick-h">' +
      '<h2 id="ls-pick-h" class="ls-picker__h">Place “' + esc(title) + "”</h2>" +
      '<div class="ls-picker__grid"><div class="form-row"><label for="ls-pick-day">Day</label><select id="ls-pick-day">' +
      weekDates(state).map(function (d) { return '<option value="' + d + '"' + (d === defDay ? " selected" : "") + ">" + esc(dayLabel(d, true)) + "</option>"; }).join("") +
      '</select></div><div class="form-row"><label for="ls-pick-meal">Meal</label><select id="ls-pick-meal">' +
      MEALS.map(function (m) { return '<option value="' + m + '"' + (m === defMeal ? " selected" : "") + ">" + MEAL_NAMES[m] + "</option>"; }).join("") +
      "</select></div></div>" +
      '<div class="row"><button type="submit" class="btn btn-primary" data-fk="pick-ok" aria-label="Place here">Place here</button>' +
      (p.from === "slot" ? '<button type="button" class="btn btn-secondary" data-act="pick-remove" aria-label="Remove from plan">Remove from plan</button>' : "") +
      '<button type="button" class="btn btn-text" data-act="pick-cancel" aria-label="Cancel placing">Cancel</button></div></form>';
  }

  function closePicker() {
    var fk = ui.picker && ui.picker.returnFk;
    ui.picker = null;
    refresh(fk);
  }

  function onPlanClick(e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    var res;
    if (act === "place") {
      ui.picker = { from: "tray", recipeId: b.getAttribute("data-rid"), returnFk: b.getAttribute("data-fk"), justOpened: true };
      ui.msg = null; refresh("none");
    } else if (act === "move") {
      ui.picker = { from: "slot", key: b.getAttribute("data-key"), returnFk: b.getAttribute("data-fk"), justOpened: true };
      ui.msg = null; refresh("none");
    } else if (act === "remove") {
      ui.msg = removeSlot(b.getAttribute("data-key")); refresh("share-plan");
    } else if (act === "pick-cancel") {
      closePicker();
    } else if (act === "pick-remove") {
      var key = ui.picker.key;
      ui.picker = null; ui.msg = removeSlot(key); refresh("share-plan");
    } else if (act === "eater") {
      var st = SL.store.get(), pid = b.getAttribute("data-pid");
      var cur = eaterIds(st);
      var next = cur.indexOf(pid) >= 0 ? cur.filter(function (x) { return x !== pid; }) : cur.concat([pid]);
      if (!next.length) { ui.msg = { ok: false, text: "At least one person has to be eating." }; refresh(); return; }
      SL.store.set({ eaters: next }); ui.msg = null; refresh();
    } else if (act === "share-plan") {
      SL.share.open("plan", { weekStart: SL.store.get().weekStart });
    }
    if (res) refresh();
  }

  function onBudgetSubmit(e) {
    if (!e.target.getAttribute || e.target.getAttribute("data-form") !== "budget") return;
    e.preventDefault();
    var raw = (view.container.querySelector("#ls-budget-input") || {}).value;
    var n = Number(raw);
    if (raw === "" || raw == null || !isFinite(n) || n < 0) {
      ui.budgetMsg = { ok: false, text: "Enter a dollar amount of 0 or more." };
      refresh("budget-input");
      return;
    }
    SL.store.set({ budgetUSD: Math.round(n * 100) / 100 });
    ui.budgetMsg = { ok: true, text: "Budget saved." };
    refresh("budget-save");
  }

  function onPickerSubmit(e) {
    if (!e.target.classList || !e.target.classList.contains("ls-picker")) return;
    e.preventDefault();
    var p = ui.picker;
    if (!p) return;
    var key = view.container.querySelector("#ls-pick-day").value + ":" + view.container.querySelector("#ls-pick-meal").value;
    var res = p.from === "slot" ? place(null, key, p.key) : place(p.recipeId, key, null);
    ui.msg = res;
    if (res.ok) { ui.picker = null; refresh(p.from === "slot" ? "move-" + key : p.returnFk); }
    else refresh("pick-ok");
  }

  /* ---------- pointer drag (no HTML5 DnD; works with touch) ---------- */

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return;
    if (e.target.closest("button, a, select, input")) return;
    var src = e.target.closest(".ls-drag");
    if (!src) return;
    drag = {
      src: src, id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, ghost: null, over: null,
      recipeId: src.getAttribute("data-rid"), key: src.getAttribute("data-key")
    };
    try { src.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or unsupported */ }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  }

  function targetAt(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el || !view.container.contains(el)) return null;
    return el.closest("[data-cell]") || el.closest("[data-drop='tray']");
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.active) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_PX) return;
      drag.active = true;
      var g = drag.src.cloneNode(true);
      g.className += " ls-ghost";
      g.setAttribute("aria-hidden", "true");
      var r = drag.src.getBoundingClientRect();
      g.style.width = r.width + "px";
      drag.offX = drag.x0 - r.left; drag.offY = drag.y0 - r.top;
      document.body.appendChild(g);
      drag.ghost = g;
      drag.src.classList.add("ls-dragging");
    }
    e.preventDefault();
    drag.x = e.clientX; drag.y = e.clientY;
    drag.ghost.style.left = (e.clientX - drag.offX) + "px";
    drag.ghost.style.top = (e.clientY - drag.offY) + "px";
    updateOver();
    if (!drag.raf) drag.raf = window.requestAnimationFrame(autoScroll);
  }

  function updateOver() {
    var t = targetAt(drag.x, drag.y);
    if (t !== drag.over) {
      if (drag.over) drag.over.classList.remove("ls-over");
      drag.over = t;
      if (t) t.classList.add("ls-over");
    }
  }

  // The page can't scroll by touch while a card is held, so scroll it for the
  // user when the pointer sits near the top or bottom edge (above the tab bar).
  function autoScroll() {
    if (!drag || !drag.active) return;
    drag.raf = 0;
    var bar = document.querySelector(".tabbar");
    var bottom = bar ? bar.getBoundingClientRect().top : window.innerHeight;
    var step = 0;
    if (drag.y > bottom - EDGE_PX) step = Math.min(1, (drag.y - (bottom - EDGE_PX)) / EDGE_PX);
    else if (drag.y < EDGE_PX) step = -Math.min(1, (EDGE_PX - drag.y) / EDGE_PX);
    if (!step) return;
    var before = window.pageYOffset;
    window.scrollBy(0, Math.ceil(Math.abs(step) * MAX_SCROLL) * (step < 0 ? -1 : 1));
    if (window.pageYOffset === before) return;   // already at the top or bottom
    updateOver();
    drag.raf = window.requestAnimationFrame(autoScroll);
  }

  function endDrag() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    if (drag) {
      if (drag.raf) window.cancelAnimationFrame(drag.raf);
      if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
      if (drag.over) drag.over.classList.remove("ls-over");
      if (drag.src) drag.src.classList.remove("ls-dragging");
    }
  }

  function onPointerCancel() { endDrag(); drag = null; }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    var t = d.active ? (targetAt(e.clientX, e.clientY) || d.over) : null;
    endDrag();
    drag = null;
    if (!d.active || !t) return;
    var res = null;
    if (t.getAttribute("data-drop") === "tray") {
      if (d.key) res = removeSlot(d.key);
    } else {
      var to = t.getAttribute("data-cell");
      res = d.key ? place(null, to, d.key) : place(d.recipeId, to, null);
    }
    if (res) { ui.msg = res; refresh("none"); }
  }

  /* ---------- grocery (#/list/grocery) ---------- */

  function renderGrocery(c, state) {
    var built = SL.list.build(state);
    var planned = 0;
    Object.keys(state.plan || {}).forEach(function (d) {
      if (d < state.weekStart) return;
      MEALS.forEach(function (m) { if (state.plan[d] && state.plan[d][m]) planned++; });
    });
    var html = "<h1>Grocery list</h1>" + tabsHTML("grocery");
    var total = built.totalUSD, budget = built.budgetUSD;
    var over = budget > 0 && total > budget;
    var pct = budget > 0 ? Math.min(100, Math.round(total / budget * 100)) : 100;
    html += '<section class="budget card" aria-labelledby="ls-budget-h">' +
      '<h2 id="ls-budget-h" class="sr-only">Budget</h2>' +
      '<div class="budget__text"><span>Estimated total: ' + money(total) + '</span><span class="muted">Budget ' + money(budget) + "/week</span></div>" +
      '<div class="budget-bar' + (over ? " is-over" : "") + '" role="img" aria-label="' + money(total) + " of " + money(budget) + ' budget">' +
      '<div class="budget-bar__fill" style="width:' + pct + '%"></div></div>' +
      (over ? '<p class="budget-over ls-budget-note">Over budget by ' + money(total - budget) + "</p>"
            : '<p class="ls-budget-note muted">' + money(budget - total) + " left this week (estimate)</p>") +
      '<form class="row ls-budget-form" data-form="budget" novalidate>' +
      '<label for="ls-budget-input">Weekly budget</label>' +
      '<span class="ls-dollar" aria-hidden="true">$</span>' +
      '<input type="number" id="ls-budget-input" data-fk="budget-input" min="0" step="1" inputmode="decimal" value="' + esc(budget) + '"' +
      (ui.budgetMsg && !ui.budgetMsg.ok ? ' aria-invalid="true" aria-describedby="ls-budget-msg"' : "") + ">" +
      '<button type="submit" class="btn btn-secondary" data-fk="budget-save">Save</button></form>' +
      (ui.budgetMsg ? '<p id="ls-budget-msg" class="small ' + (ui.budgetMsg.ok ? "muted" : "error") + '" role="' + (ui.budgetMsg.ok ? "status" : "alert") + '">' +
        esc(ui.budgetMsg.text) + "</p>" : "") +
      "</section>";
    ui.budgetMsg = null;

    if (!built.items.length) {
      html += '<section class="card ls-empty"><h2>' + (planned ? "You have everything" : "Nothing to buy yet") + "</h2>" +
        "<p>" + (planned ? "Everything your planned meals need is already in your fridge or pantry."
          : "Plan a few meals and your list fills itself, minus what's already in your fridge.") + "</p>" +
        '<a class="btn btn-primary" href="#/list/plan" aria-label="Go to the planner">📅 Plan meals</a></section>';
    } else {
      var aisle = null;
      html += '<div class="ls-items">';
      built.items.forEach(function (it) {
        var ing = ings()[it.ingredientId] || { name: it.ingredientId };
        if (it.aisle !== aisle) {
          if (aisle !== null) html += "</ul></section>";
          aisle = it.aisle;
          html += '<section class="ls-aisle" aria-label="' + esc(aisle) + '"><h2 class="ls-aisle__h">' + esc(aisle) + '</h2><ul class="ls-aisle__list">';
        }
        html += '<li class="item ls-item" data-iid="' + esc(it.ingredientId) + '"><div class="item__main">' +
          '<div class="spread"><span><strong>' + esc(ing.name) + '</strong> <span class="muted">' + esc(SL.util.fmtAmount(it.amount, it.unit)) + "</span></span>" +
          '<span class="ls-cost">' + money(it.costUSD) + ' <span class="small muted">estimate</span></span></div>';
        it.warnings.forEach(function (w) {
          html += '<p class="warning ls-warn"><span aria-hidden="true">!</span><span><strong>Check the label for ' +
            esc(nameOf(w.personId, state)) + ":</strong> " + esc(w.text) + "</span></p>";
        });
        html += "</div></li>";
      });
      html += "</ul></section></div>" +
        '<p class="small muted">Leaves out pantry staples and anything confirmed in your fridge. Prices are US average estimates.</p>';
    }
    html += '<div class="row ls-actions"><button type="button" class="btn btn-secondary" data-act="share-list" aria-label="Share grocery list">↗ Share list</button></div>' +
      '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    c.innerHTML = '<section class="ls-grocery">' + html + "</section>";
    c.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act='share-list']");
      if (b) SL.share.open("list", {});
    });
  }

  /* ---------- entry ---------- */

  function render(container, params) {
    ui.picker = null; ui.msg = null; ui.budgetMsg = null;
    draw(container, params);
  }

  function draw(container, params) {
    view.container = container; view.params = params;
    var c = document.createElement("div");
    c.className = "ls-screen";
    container.innerHTML = "";
    container.appendChild(c);
    c.addEventListener("submit", onPickerSubmit);
    c.addEventListener("submit", onBudgetSubmit);
    var state = SL.store.get();
    var parts = (params && params.parts) || [];
    if (parts[0] === "plan") renderPlan(c, state, parts[1] || null);
    else renderGrocery(c, state);
  }

  return { render: render, _place: place, _remove: removeSlot };
})();
