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
