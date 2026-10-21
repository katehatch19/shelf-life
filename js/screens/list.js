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
