/* js/tests.js (Makissa): in-browser checks for safety, list and scaling.
   Uses inline fixture states and a fixed date. Never touches SL.store or localStorage. */
window.SL = window.SL || {};

SL.tests = (function () {
  var TODAY = "2026-10-21";      // a Wednesday
  var MONDAY = "2026-10-19";
  var groups = [];
  var current = null;

  function group(name) { current = { name: name, tests: [] }; groups.push(current); }
  function test(name, fn) { current.tests.push({ name: name, fn: fn }); }

  function fail(msg) { throw new Error(msg); }
  function eq(actual, expected, what) {
    var a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) fail((what ? what + ": " : "") + "expected " + e + ", got " + a);
  }
  function ok(cond, what) { if (!cond) fail(what || "expected true"); }
  function near(actual, expected, tol, what) {
    if (typeof actual !== "number" || Math.abs(actual - expected) > tol) {
      fail((what ? what + ": " : "") + "expected ≈" + expected + ", got " + JSON.stringify(actual));
    }
  }
  function contains(text, part, what) {
    if (String(text).indexOf(part) < 0) fail((what ? what + ": " : "") + JSON.stringify(text) + " should contain " + JSON.stringify(part));
  }

  /* ---------- fixtures ---------- */

  var P = {
    alex:   { id: "p-alex",   firstName: "Alex",   kind: "adult", restrictions: [] },
    jordan: { id: "p-jordan", firstName: "Jordan", kind: "child", restrictions: [{ tag: "gluten", level: "strict" }] },
    casey:  { id: "p-casey",  firstName: "Casey",  kind: "child", restrictions: [{ tag: "gluten", level: "avoid" }] },
    sam:    { id: "p-sam",    firstName: "Sam",    kind: "child",
              restrictions: [{ tag: "peanuts", level: "strict" }, { tag: "tree-nuts", level: "strict" }] },
    riley:  { id: "p-riley",  firstName: "Riley",  kind: "child", restrictions: [{ tag: "vegan", level: "avoid" }] },
    noor:   { id: "p-noor",   firstName: "Noor",   kind: "child", restrictions: [{ tag: "halal", level: "avoid" }] },
    max:    { id: "p-max",    firstName: "Max",    kind: "child", restrictions: [{ tag: "custom:broccoli", level: "avoid" }] },
    mila:   { id: "p-mila",   firstName: "Mila",   kind: "child",
              restrictions: [{ tag: "milk", level: "strict" }, { tag: "tree-nuts", level: "strict" }] },
    gwen:   { id: "p-gwen",   firstName: "Gwen",   kind: "child",
              restrictions: [{ tag: "gluten", level: "strict" }, { tag: "milk", level: "avoid" }] },
    tess:   { id: "p-tess",   firstName: "Tess",   kind: "child",
              restrictions: [{ tag: "tree-nuts", level: "strict" }, { tag: "custom:nut-free-pesto", level: "avoid" }] }
  };
  function allProfiles() { var a = []; for (var k in P) a.push(P[k]); return a; }

  function state(extra) {
    var s = {
      version: 1, profiles: allProfiles(), fridge: [], scans: [], labelChecks: {},
      recipes: [], savedRecipeIds: [], recipeOverrides: {}, plan: {},
      weekStart: MONDAY, budgetUSD: 120, eaters: [], reports: []
    };
    for (var k in (extra || {})) s[k] = extra[k];
    return s;
  }
  function recipe(id, lines, extra) {
    var r = { id: id, title: id, source: { type: "own", label: "Your recipe" },
      mealTypes: ["dinner"], baseServings: 2, makesLeftovers: false, folder: "", tags: [],
      ingredients: lines.map(function (l) {
        if (typeof l === "string") return { ingredientId: l, amount: 1, unit: SL.data.ingredients[l].unit };
        return l;
      }), steps: [] };
    for (var k in (extra || {})) r[k] = extra[k];
    return r;
  }
  function seed(id) {
    for (var i = 0; i < SL.data.recipes.length; i++) if (SL.data.recipes[i].id === id) return SL.data.recipes[i];
    return null;
  }
  function personOf(check, pid) {
    for (var i = 0; i < check.people.length; i++) if (check.people[i].personId === pid) return check.people[i];
    return null;
  }
  function rowOf(check, pid, ingId) {
    var p = personOf(check, pid);
    if (!p) fail("no person " + pid);
    for (var i = 0; i < p.rows.length; i++) if (p.rows[i].ingredientId === ingId) return p.rows[i];
    fail("no row " + ingId + " for " + pid);
  }
  var check = function (r, eaters, s) { return SL.safety.checkMeal(r, eaters, s || state()); };

  /* =================== SAFETY =================== */
  group("Safety (js/safety.js)");

  test("checkMeal returns the 4.3 shape", function () {
    var c = check(recipe("r-t", ["broccoli", "white-rice"]), ["p-jordan", "p-alex"]);
    ["badge", "safeCount", "total", "people", "fixes"].forEach(function (k) { ok(k in c, "missing " + k); });
    eq(c.people.length, 2, "people");
    eq(c.people[0].personId, "p-jordan");
    eq(c.people[0].rows.length, 2, "one row per line");
    ok(typeof c.people[0].rows[0].reason === "string" && c.people[0].rows[0].reason.length > 0, "reason text");
  });

  test("Badge: safe when every row passes", function () {
    var c = check(recipe("r-t", ["broccoli", "white-rice", "salt"]), ["p-jordan", "p-sam"]);
    eq(c.badge, "safe"); eq(c.safeCount, 2); eq(c.total, 2); eq(c.fixes, []);
  });

  test("Badge: label (variesByBrand tag touches a restriction)", function () {
    var c = check(recipe("r-t", ["chicken-broth", "carrot"]), ["p-jordan", "p-alex"]);
    eq(c.badge, "label");
    eq(rowOf(c, "p-jordan", "chicken-broth").result, "label");
    contains(rowOf(c, "p-jordan", "chicken-broth").reason, "Some broths add wheat or barley flavorings.", "uses hiddenSourceNote");
    eq(c.safeCount, 2, "label rows count toward safeCount");
  });

  test("variesByBrand is a label at avoid level too, and not for unrelated tags", function () {
    eq(check(recipe("r-t", ["chicken-broth"]), ["p-casey"]).badge, "label");
    eq(check(recipe("r-t", ["chicken-broth"]), ["p-sam"]).badge, "safe");
  });

  test("Badge: fixable, X of Y, with the first covering swap", function () {
    var c = check(recipe("r-t", ["soy-sauce", "broccoli"]), ["p-alex", "p-jordan"]);
    eq(c.badge, "fixable"); eq(c.safeCount, 1); eq(c.total, 2);
    eq(c.fixes.length, 1); eq(c.fixes[0].to, "gf-tamari");
  });

  test("Badge: unsafe when no swap exists (malt cereal for celiac)", function () {
    var c = check(recipe("r-t", ["malt-cereal", "marshmallows"]), ["p-jordan"]);
    eq(c.badge, "unsafe"); eq(c.safeCount, 0);
    contains(rowOf(c, "p-jordan", "malt-cereal").reason, "barley malt", "hidden source reason");
  });

  test("Unsafe when the swap does not cover every failing tag", function () {
    // pesto fails Mila on milk and tree-nuts; the pesto swap fixes only tree-nuts
    eq(check(recipe("r-t", ["pesto", "pasta"]), ["p-mila"]).badge, "unsafe");
  });

  test("Unsafe when the meal still fails after the swaps (recheck)", function () {
    // Tess: tree-nuts strict + custom nut-free-pesto. pesto -> nut-free-pesto covers tree-nuts but fails custom.
    eq(check(recipe("r-t", ["pesto"]), ["p-tess"]).badge, "unsafe");
  });

  test("Precedence: fail beats label (bread for celiac + milk avoid)", function () {
    var c = check(recipe("r-t", ["bread"]), ["p-gwen"]);
    eq(rowOf(c, "p-gwen", "bread").result, "fail");
    eq(personOf(c, "p-gwen").status, "fail");
  });

  test("Precedence: label beats pass; person status is the worst row", function () {
    var c = check(recipe("r-t", ["corn-tortillas", "broccoli"]), ["p-jordan"]);
    eq(rowOf(c, "p-jordan", "broccoli").result, "pass");
    eq(rowOf(c, "p-jordan", "corn-tortillas").result, "label");
    eq(personOf(c, "p-jordan").status, "label");
  });

  test("mayContain: strict → label, avoid → ignored", function () {
    var strictRow = rowOf(check(recipe("r-t", ["corn-tortillas"]), ["p-jordan"]), "p-jordan", "corn-tortillas");
    eq(strictRow.result, "label"); contains(strictRow.reason, "may contain");
    eq(rowOf(check(recipe("r-t", ["corn-tortillas"]), ["p-casey"]), "p-casey", "corn-tortillas").result, "pass");
    eq(rowOf(check(recipe("r-t", ["granola"]), ["p-sam"]), "p-sam", "granola").result, "label");
  });

  test("Unknown (unmatched) line → label for everyone, even with no restrictions", function () {
    var r = recipe("r-t", ["broccoli", { ingredientId: null, rawText: "2 tbsp oyster sauce", amount: 2, unit: "tbsp" }]);
    var c = check(r, ["p-alex", "p-sam"], state({ labelChecks: { "null": TODAY } }));
    eq(c.badge, "label");
    var row = c.people[0].rows[1];
    eq(row.ingredientId, null); eq(row.result, "label");
    contains(row.reason, "We don't recognize this ingredient, so we can't check it.");
    eq(c.people[1].rows[1].result, "label");
  });

  test("No restrictions: pass rows read \"<Name> has no food restrictions.\"", function () {
    var c = check(recipe("r-t", ["broccoli", "peanut-butter"]), ["p-alex"]);
    eq(c.people[0].rows[0].reason, "Alex has no food restrictions.");
    eq(c.people[0].rows[1].result, "pass");
  });

  test("Reasons name the person and the restriction", function () {
    var row = rowOf(check(recipe("r-t", ["soy-sauce"]), ["p-jordan"]), "p-jordan", "soy-sauce");
    eq(row.result, "fail");
    contains(row.reason, "Soy sauce usually contains wheat."); contains(row.reason, "Jordan has celiac.");
    contains(rowOf(check(recipe("r-t", ["pesto"]), ["p-sam"]), "p-sam", "pesto").reason, "Sam is allergic to tree nuts.");
  });

  test("Label check remembered for every person", function () {
    var s = state({ labelChecks: { "chicken-broth": TODAY } });
    var c = check(recipe("r-t", ["chicken-broth"]), ["p-jordan", "p-casey"], s);
    eq(c.badge, "safe");
    eq(rowOf(c, "p-jordan", "chicken-broth").result, "pass");
    eq(rowOf(c, "p-casey", "chicken-broth").result, "pass");
  });

  test("newPackage voids the stored check → label again with the warning", function () {
    var s = state({ labelChecks: { "chicken-broth": "2026-10-01" },
      fridge: [{ ingredientId: "chicken-broth", addedOn: TODAY, confirmed: true, newPackage: true }] });
    var c = check(recipe("r-t", ["chicken-broth"]), ["p-jordan"], s);
    eq(c.badge, "label");
    contains(rowOf(c, "p-jordan", "chicken-broth").reason, "This may be a different product. Please check its label.");
  });

  test("A label check never clears a fail", function () {
    var s = state({ labelChecks: { "soy-sauce": TODAY, "bread": TODAY } });
    eq(rowOf(check(recipe("r-t", ["soy-sauce"]), ["p-jordan"], s), "p-jordan", "soy-sauce").result, "fail");
    eq(rowOf(check(recipe("r-t", ["bread"]), ["p-gwen"], s), "p-gwen", "bread").result, "fail");
  });

  test("Diet exclude fails (vegan cheddar, halal pork, halal wine)", function () {
    eq(rowOf(check(recipe("r-t", ["cheddar"]), ["p-riley"]), "p-riley", "cheddar").result, "fail");
    eq(rowOf(check(recipe("r-t", ["honey"]), ["p-riley"]), "p-riley", "honey").result, "fail");
    eq(rowOf(check(recipe("r-t", ["pork-sausage"]), ["p-noor"]), "p-noor", "pork-sausage").result, "fail");
    eq(rowOf(check(recipe("r-t", ["white-wine"]), ["p-noor"]), "p-noor", "white-wine").result, "fail");
    contains(rowOf(check(recipe("r-t", ["cheddar"]), ["p-riley"]), "p-riley", "cheddar").reason, "Riley follows a vegan diet.");
  });

  test("Diet labelCheck → label, cleared by a label check", function () {
    var row = rowOf(check(recipe("r-t", ["chicken-breast"]), ["p-noor"]), "p-noor", "chicken-breast");
    eq(row.result, "label"); contains(row.reason, "halal");
    var s = state({ labelChecks: { "chicken-breast": TODAY } });
    eq(check(recipe("r-t", ["chicken-breast"]), ["p-noor"], s).badge, "safe");
    eq(check(recipe("r-t", ["salmon"]), ["p-noor"]).badge, "safe", "fish is not meat");
  });

  test("Display-only diets filter nothing (high-protein)", function () {
    var s = state({ profiles: SL.data.profiles });
    eq(check(recipe("r-t", ["pasta", "cheddar", "white-rice"]), ["p-owner"], s).badge, "safe");
  });

  test("custom: avoid food fails only that ingredient", function () {
    var c = check(recipe("r-t", ["broccoli", "carrot"]), ["p-max"]);
    eq(rowOf(c, "p-max", "broccoli").result, "fail");
    contains(rowOf(c, "p-max", "broccoli").reason, "Max avoids broccoli.");
    eq(rowOf(c, "p-max", "carrot").result, "pass");
    eq(c.badge, "unsafe", "no swap from broccoli");
  });

  test("applySwap returns a new recipe, keeps amount and unit, never mutates", function () {
    var r = recipe("r-t", [{ ingredientId: "soy-sauce", amount: 3, unit: "tbsp" }, "broccoli"]);
    var before = JSON.stringify(r);
    var out = SL.safety.applySwap(r, SL.data.swaps[0]);
    ok(out !== r, "new object");
    eq(JSON.stringify(r), before, "original unchanged");
    eq(out.ingredients[0], { ingredientId: "gf-tamari", amount: 3, unit: "tbsp" });
    eq(out.ingredients[1].ingredientId, "broccoli");
  });

  test("Swap → recheck → safe; show-your-work updates", function () {
    var r = recipe("r-t", ["soy-sauce", "broccoli"]);
    var c1 = check(r, ["p-alex", "p-jordan"]);
    var c2 = check(SL.safety.applySwap(r, c1.fixes[0]), ["p-alex", "p-jordan"]);
    eq(c2.badge, "safe"); eq(c2.safeCount, 2);
    eq(rowOf(c2, "p-jordan", "gf-tamari").result, "pass");
  });

  test("Swap to a label-check item gives fixable, then label", function () {
    var r = recipe("r-t", ["flour-tortillas", "cheddar"]);
    var c = check(r, ["p-jordan"]);
    eq(c.badge, "fixable"); eq(c.fixes[0].to, "corn-tortillas");
    eq(check(SL.safety.applySwap(r, c.fixes[0]), ["p-jordan"]).badge, "label");
  });

  /* ---- suggest ---- */
  function back(n) { return SL.util.addDays(TODAY, -n); }
  function suggestState() {
    // daysLeft = shelfDays - age
    var fridge = [
      { ingredientId: "tomato",        addedOn: back(6),  confirmed: true,  newPackage: false }, // 1
      { ingredientId: "zucchini",      addedOn: back(2),  confirmed: true,  newPackage: false }, // 5
      { ingredientId: "lemon",         addedOn: back(20), confirmed: true,  newPackage: false }, // 1
      { ingredientId: "lime",          addedOn: back(0),  confirmed: false, newPackage: false }, // unsure: not on hand
      { ingredientId: "romaine",       addedOn: back(1),  confirmed: true,  newPackage: false }, // 6
      { ingredientId: "spinach",       addedOn: back(2),  confirmed: true,  newPackage: false }, // 3
      { ingredientId: "chicken-broth", addedOn: back(2),  confirmed: true,  newPackage: false }, // 3
      { ingredientId: "green-onion",   addedOn: back(4),  confirmed: true,  newPackage: false }, // 3
      { ingredientId: "avocado",       addedOn: back(0),  confirmed: true,  newPackage: false }, // 4
      { ingredientId: "malt-cereal",   addedOn: back(0),  confirmed: true,  newPackage: false }
    ];
    var snack = { mealTypes: ["snack"] };
    function sr(id, title, lines) { var r = recipe(id, lines, snack); r.title = title; return r; }
    return state({ fridge: fridge, recipes: [
      sr("r-t-foxtrot", "Foxtrot", ["tomato", "zucchini"]),
      sr("r-t-alpha",   "Alpha",   ["zucchini", "tomato", "salt"]),
      sr("r-t-bravo",   "Bravo",   ["lemon", "lime"]),
      sr("r-t-charlie", "Charlie", ["romaine", "salt"]),
      sr("r-t-delta",   "Delta",   ["spinach", "chicken-broth"]),
      sr("r-t-echo",    "Echo",    ["spinach", "green-onion"]),
      sr("r-t-unsafe",  "Unsafe",  ["malt-cereal", "zucchini"]),
      sr("r-t-golf",    "Golf",    ["avocado", "lime", "carrot", "potato"])
    ] });
  }

  test("suggest: use-first order (days left, share on hand, badge, title), max 5", function () {
    var out = SL.safety.suggest("snack", ["p-jordan"], suggestState());
    eq(out.map(function (s) { return s.recipe.title; }), ["Alpha", "Foxtrot", "Bravo", "Echo", "Delta"]);
    eq(out[3].check.badge, "safe"); eq(out[4].check.badge, "label");
  });

  test("suggest: never unsafe; under half on hand doesn't qualify", function () {
    var out = SL.safety.suggest("snack", ["p-jordan"], suggestState());
    out.forEach(function (s) { ok(s.check.badge !== "unsafe", s.recipe.title + " is unsafe"); });
    var titles = out.map(function (s) { return s.recipe.title; });
    ok(titles.indexOf("Unsafe") < 0, "unsafe meal suggested");
    ok(titles.indexOf("Golf") < 0, "Golf has 1 of 4 on hand");
  });

  test("suggest: { recipe, check, missing }; unsure items are not on hand; staples never missing", function () {
    var out = SL.safety.suggest("snack", ["p-jordan"], suggestState());
    var bravo = out[2], alpha = out[0];
    ok("recipe" in bravo && "check" in bravo && "missing" in bravo, "shape");
    eq(bravo.missing, ["lime"]);
    eq(alpha.missing, []);
  });

  test("suggest: fixable meals are suggested; with all three demo eaters order is by days left", function () {
    var s = state({ profiles: SL.data.profiles,
      fridge: ["chicken-breast", "broccoli", "bell-pepper", "white-rice", "soy-sauce"].map(function (id) {
        return { ingredientId: id, addedOn: TODAY, confirmed: true, newPackage: false };
      }) });
    var out = SL.safety.suggest("dinner", ["p-owner", "p-jordan", "p-kid"], s);
    var stir = out.filter(function (x) { return x.recipe.id === "r-chicken-stir-fry"; })[0];
    ok(stir, "stir-fry suggested");
    eq(stir.check.badge, "fixable");
    ok(out.length >= 1 && out.length <= 5, "1-5 results");
  });

  /* ---- demo data coverage (4.1) ---- */
  test("Demo: soy-sauce stir-fry is fixable 2 of 3, safe after gf-tamari", function () {
    var s = state({ profiles: SL.data.profiles });
    var eaters = ["p-owner", "p-jordan", "p-kid"];
    var r = seed("r-chicken-stir-fry");
    var c = SL.safety.checkMeal(r, eaters, s);
    eq(c.badge, "fixable"); eq(c.safeCount, 2); eq(c.total, 3);
    eq(c.fixes[0].to, "gf-tamari");
    ok(!SL.data.ingredients["gf-tamari"].variesByBrand, "swap target is not variesByBrand");
    eq(SL.safety.checkMeal(SL.safety.applySwap(r, c.fixes[0]), eaters, s).badge, "safe");
  });

  test("Demo: household + data produce safe, label, may-contain, hidden source, dashed and ≤2 days", function () {
    var s = state({ profiles: SL.data.profiles });
    var eaters = ["p-owner", "p-jordan", "p-kid"];
    eq(SL.safety.checkMeal(seed("r-burrito-bowl"), eaters, s).badge, "safe", "burrito bowl");
    eq(SL.safety.checkMeal(seed("r-chicken-rice-soup"), eaters, s).badge, "label", "chicken soup");
    var oats = SL.safety.checkMeal(seed("r-overnight-oats"), eaters, s);
    eq(rowOf(oats, "p-jordan", "rolled-oats").result, "label", "may-contain on strict");
    ok(SL.data.ingredients["soy-sauce"].hiddenSourceNote, "hidden source");
    var dashed = false, soon = false;
    SL.data.fridges.forEach(function (f) {
      f.items.forEach(function (it) {
        if (it.unsure) dashed = true;
        if (SL.data.ingredients[it.ingredientId].shelfDays - it.ageDays <= 2) soon = true;
      });
    });
    ok(dashed, "dashed unsure item"); ok(soon, "item expiring within 2 days");
  });

  /* =================== LIST & SCALING =================== */
  group("Scaling, macros and cost (js/screens/recipes.js)");

  test("scale multiplies amounts by n / baseServings and sets servings; no mutation", function () {
    var r = seed("r-chicken-stir-fry");
    var before = JSON.stringify(r);
    var out = SL.recipes.scale(r, 8);
    eq(out.servings, 8);
    eq(out.ingredients[0].amount, 2, "chicken");
    eq(out.ingredients[3].amount, 3, "rice");
    eq(out.ingredients[0].unit, "lb");
    eq(JSON.stringify(r), before, "original unchanged");
    near(SL.recipes.scale(r, 2).ingredients[4].amount, 1.5, 1e-9, "soy sauce at 2 servings");
  });

  function macroFixture() {
    return recipe("r-t-macro", [
      { ingredientId: "eggs", amount: 4, unit: "each" },          // 288 kcal, 25.2 p, 1.6 c, 19.2 f, $1.20
      { ingredientId: "olive-oil", amount: 1, unit: "tbsp" },     // staple: 119 kcal, 13.5 f, no cost
      { ingredientId: null, rawText: "1 pinch magic dust", amount: 1, unit: "tsp" }
    ]);
  }

  test("macros per serving include staples, skip unmatched lines, whole numbers", function () {
    eq(SL.recipes.macros(macroFixture()), { kcal: 204, proteinG: 13, carbsG: 1, fatG: 16 });
  });

  test("cost per serving leaves out staples and counts unmatched in excludedCount", function () {
    var c = SL.recipes.cost(macroFixture());
    near(c.usd, 0.60, 1e-9, "usd"); eq(c.excludedCount, 1, "excludedCount");
  });

  test("macros and cost per serving don't change when scaled", function () {
    var scaled = SL.recipes.scale(macroFixture(), 6);
    eq(SL.recipes.macros(scaled), { kcal: 204, proteinG: 13, carbsG: 1, fatG: 16 });
    near(SL.recipes.cost(scaled).usd, 0.60, 1e-9);
  });

  test("effective applies override swaps, then servings", function () {
    var s = state({ recipeOverrides: { "r-chicken-stir-fry": { servings: 8, swaps: { "soy-sauce": "gf-tamari" } } } });
    var r = SL.recipes.effective("r-chicken-stir-fry", s);
    eq(r.servings, 8);
    var tam = r.ingredients.filter(function (l) { return l.ingredientId === "gf-tamari"; })[0];
    ok(tam, "tamari swapped in"); eq(tam.amount, 6);
    eq(SL.safety.checkMeal(r, ["p-jordan"], s).badge, "safe");
  });

  group("Grocery list (js/screens/list.js)");

  function listState() {
    var plan = {};
    plan["2026-10-12"] = { breakfast: null, lunch: null, snack: null,       // before weekStart: ignored
      dinner: { recipeId: "r-pesto-pasta", eaterIds: ["p-alex"], servings: 4, leftoverOf: null } };
    plan["2026-10-19"] = { breakfast: null, lunch: null, snack: null,
      dinner: { recipeId: "r-chicken-rice-soup", eaterIds: ["p-alex", "p-jordan"], servings: 6, leftoverOf: null } };
    plan["2026-10-20"] = { breakfast: null, dinner: null, snack: null,
      lunch: { recipeId: "r-chicken-rice-soup", eaterIds: ["p-alex", "p-jordan"], servings: 6, leftoverOf: "2026-10-19:dinner" } };
    plan["2026-10-21"] = { breakfast: null, lunch: null, snack: null,
      dinner: { recipeId: "r-burrito-bowl", eaterIds: ["p-alex", "p-sam"], servings: 8, leftoverOf: null } };
    return state({ plan: plan, budgetUSD: 75, fridge: [
      { ingredientId: "chicken-breast", addedOn: TODAY, confirmed: true,  newPackage: false },
      { ingredientId: "white-rice",     addedOn: TODAY, confirmed: false, newPackage: false }
    ] });
  }
  function item(res, id) {
    for (var i = 0; i < res.items.length; i++) if (res.items[i].ingredientId === id) return res.items[i];
    return null;
  }

  test("build returns { items, totalUSD, budgetUSD }", function () {
    var res = SL.list.build(listState());
    ok(Array.isArray(res.items), "items"); ok(typeof res.totalUSD === "number", "totalUSD");
    eq(res.budgetUSD, 75);
    var it = item(res, "carrot");
    ["ingredientId", "aisle", "amount", "unit", "costUSD", "warnings"].forEach(function (k) { ok(k in it, "item missing " + k); });
  });

  test("never lists a confirmed fridge item; unconfirmed items still listed", function () {
    var res = SL.list.build(listState());
    eq(item(res, "chicken-breast"), null, "chicken is confirmed in the fridge");
    ok(item(res, "white-rice"), "unsure rice still needed");
  });

  test("leaves out staples, leftover slots and days before weekStart", function () {
    var res = SL.list.build(listState());
    ["garlic", "salt", "black-pepper", "cumin", "pasta", "pesto", "parmesan"].forEach(function (id) {
      eq(item(res, id), null, id + " should not be listed");
    });
    eq(item(res, "chicken-broth").amount, 8, "leftover slot adds nothing");
  });

  test("sums amounts across slots, scaled to each slot's servings", function () {
    var res = SL.list.build(listState());
    near(item(res, "white-rice").amount, 3.75, 1e-9, "0.75 soup + 3 burrito (x2)");
    near(item(res, "cheddar").amount, 6, 1e-9, "cheddar x2");
    eq(item(res, "cheddar").unit, "oz");
  });

  test("costUSD per item and totalUSD as their sum", function () {
    var res = SL.list.build(listState());
    near(item(res, "chicken-broth").costUSD, 6.00, 1e-9, "8 × 0.75");
    near(item(res, "cheddar").costUSD, 3.00, 1e-9, "6 × 0.50");
    var sum = res.items.reduce(function (a, it) { return a + it.costUSD; }, 0);
    near(res.totalUSD, sum, 0.011, "total is the sum");
  });

  test("label warnings per person from each slot's eaters", function () {
    var res = SL.list.build(listState());
    var w = item(res, "chicken-broth").warnings;
    eq(w.length, 1, "one warning");
    eq(w[0].personId, "p-jordan");
    ok(w[0].text && w[0].text.length > 0, "warning text");
    eq(item(res, "carrot").warnings, []);
  });

  test("items sorted by aisle, then name", function () {
    var res = SL.list.build(listState());
    var ing = SL.data.ingredients;
    for (var i = 1; i < res.items.length; i++) {
      var a = ing[res.items[i - 1].ingredientId], b = ing[res.items[i].ingredientId];
      ok(a.aisle < b.aisle || (a.aisle === b.aisle && a.name <= b.name),
        "order: " + a.name + " before " + b.name);
    }
  });

  /* ---------- runner ---------- */

  function run() {
    var savedToday = SL.util ? SL.util._today : null;
    if (SL.util) SL.util._today = TODAY;
    var pass = 0, failCount = 0, html = "";
    groups.forEach(function (g) {
      var gp = 0, gf = 0, lis = "";
      g.tests.forEach(function (t) {
        var err = null;
        try { t.fn(); } catch (e) { err = e; }
        if (err) { gf++; failCount++; } else { gp++; pass++; }
        lis += '<li class="' + (err ? "fail" : "pass") + '"><span class="tag">' + (err ? "FAIL" : "PASS") +
          "</span> " + escapeHTML(t.name) +
          (err ? '<span class="msg">' + escapeHTML(err && err.message ? err.message : String(err)) + "</span>" : "") + "</li>";
      });
      html += "<h2>" + escapeHTML(g.name) + " — " + gp + "/" + (gp + gf) + " passed</h2><ul>" + lis + "</ul>";
    });
    if (SL.util) SL.util._today = savedToday;
    var total = pass + failCount;
    var sum = document.getElementById("summary");
    sum.textContent = (failCount ? "FAIL" : "PASS") + ": " + pass + " of " + total + " checks passed" +
      (failCount ? ", " + failCount + " failed." : ".");
    sum.className = failCount ? "bad" : "ok";
    document.getElementById("results").innerHTML = html;
    return { pass: pass, fail: failCount, total: total };
  }
  function escapeHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  return { run: run };
})();

window.addEventListener("load", function () { SL.tests.run(); });
