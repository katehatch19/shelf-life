/* js/safety.js (Makissa): the ONLY safety logic in the app.
   checkMeal, applySwap, suggest. See CLAUDE.md 2.1-2.10, 2.16-2.17 and 4.3.
   Definitions only, nothing runs at load time. Uses SL.data, SL.util and
   SL.recipes.effective at call time. All reason text is written here. */
window.SL = window.SL || {};

SL.safety = (function () {
  var BADGE_ORDER = { safe: 0, label: 1, fixable: 2, unsafe: 3 };
  var RESULT_RANK = { pass: 0, label: 1, fail: 2 };

  var TAG_NAMES = {
    "tree-nuts": "tree nuts", "high-fodmap": "high-FODMAP foods",
    "high-carb": "high-carb foods", "low-fodmap": "low-FODMAP"
  };
  var DIET_NAMES = {
    vegan: "vegan", vegetarian: "vegetarian", halal: "halal", keto: "keto",
    "low-fodmap": "low-FODMAP", "high-protein": "high-protein", "macro-focused": "macro-focused"
  };

  function data() { return (window.SL && SL.data) || {}; }
  function ings() { return data().ingredients || {}; }
  function dietRules() { return data().dietRules || {}; }
  function swapsList() { return data().swaps || []; }

  function tagName(t) { return TAG_NAMES[t] || t; }
  function listWords(arr) {
    if (arr.length <= 1) return arr.join("");
    return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
  }
  function lowerFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function uniq(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) if (out.indexOf(arr[i]) < 0) out.push(arr[i]);
    return out;
  }
  function intersect(a, b) {
    var out = [];
    for (var i = 0; i < (a || []).length; i++) if ((b || []).indexOf(a[i]) >= 0 && out.indexOf(a[i]) < 0) out.push(a[i]);
    return out;
  }

  /* ---------- per-person rule set ---------- */

  /* Turns a profile's restrictions into:
     exclude: { tag: [{ level, why }] }   tags that fail
     strict:  [tags]                      strict tags (mayContain → label)
     labelTags: { tag: [why] }            diet labelCheck tags
     custom:  { ingredientId: why }       custom avoid foods */
  function rulesFor(person) {
    var name = person.firstName || "This person";
    var r = { exclude: {}, strict: [], labelTags: {}, custom: {}, count: 0 };
    var rs = person.restrictions || [];
    for (var i = 0; i < rs.length; i++) {
      var tag = rs[i].tag, level = rs[i].level === "strict" ? "strict" : "avoid";
      if (!tag) continue;
      r.count++;
      if (tag.indexOf("custom:") === 0) {
        var id = tag.slice(7);
        var ing = ings()[id];
        r.custom[id] = name + " avoids " + lowerFirst(ing ? ing.name : id) + ".";
        continue;
      }
      var diet = dietRules()[tag];
      if (diet) {
        var dWhy = name + " follows a " + (DIET_NAMES[tag] || tag) + " diet.";
        (diet.exclude || []).forEach(function (t) { addExclude(r, t, "avoid", dWhy); });
        (diet.labelCheck || []).forEach(function (t) {
          (r.labelTags[t] = r.labelTags[t] || []).push({ diet: tag, why: dWhy });
        });
        continue;
      }
      var why;
      if (tag === "gluten" && level === "strict") why = name + " has celiac.";
      else if (level === "strict") why = name + " is allergic to " + tagName(tag) + ".";
      else why = name + " avoids " + tagName(tag) + ".";
      addExclude(r, tag, level, why);
      if (level === "strict" && r.strict.indexOf(tag) < 0) r.strict.push(tag);
    }
    return r;
  }
  function addExclude(r, tag, level, why) {
    (r.exclude[tag] = r.exclude[tag] || []).push({ level: level, why: why });
  }
  function whyFor(rules, tags) {
    var out = [];
    tags.forEach(function (t) {
      (rules.exclude[t] || []).forEach(function (e) { if (out.indexOf(e.why) < 0) out.push(e.why); });
    });
    return out.join(" ");
  }

  /* ---------- one row ---------- */

  function labelConfirmed(id, state) {
    var checks = (state && state.labelChecks) || {};
    if (!checks[id]) return false;
    var fridge = (state && state.fridge) || [];
    for (var i = 0; i < fridge.length; i++) {
      if (fridge[i].ingredientId === id && fridge[i].newPackage) return false;
    }
    return true;
  }
  function hasNewPackage(id, state) {
    var fridge = (state && state.fridge) || [];
    for (var i = 0; i < fridge.length; i++) {
      if (fridge[i].ingredientId === id && fridge[i].newPackage) return true;
    }
    return false;
  }

  /* Decide one row for one person and one recipe line. fail > label > pass. */
  function decideRow(line, person, rules, state) {
    var id = line ? line.ingredientId : null;
    var ing = id ? ings()[id] : null;
    var rowId = id == null ? null : id;

    if (!ing) {
      return { ingredientId: rowId, result: "label",
        reason: "We don't recognize this ingredient, so we can't check it." +
          (line && line.rawText ? " (" + line.rawText + ")" : "") };
    }
    var name = ing.name;

    /* fail */
    var contains = ing.contains || [];
    var failTags = contains.filter(function (t) { return !!rules.exclude[t]; });
    var customWhy = rules.custom[id];
    if (failTags.length || customWhy) {
      var parts = [];
      if (failTags.length) {
        var shown = failTags.slice();
        /* Celiac/gluten: say "wheat" when the gluten comes from wheat (2.6 example). */
        var gi = shown.indexOf("gluten");
        if (gi >= 0 && contains.indexOf("wheat") >= 0 && shown.indexOf("wheat") < 0) shown[gi] = "wheat";
        else if (gi >= 0 && shown.indexOf("wheat") >= 0) shown.splice(gi, 1);
        parts.push(name + (ing.hiddenSourceNote ? " usually contains " : " contains ") +
          listWords(shown.map(tagName)) + ".");
        if (ing.hiddenSourceNote) parts.push(ing.hiddenSourceNote);
        parts.push(whyFor(rules, failTags));
      }
      if (customWhy) parts.push(customWhy);
      return { ingredientId: rowId, result: "fail", reason: parts.join(" ") };
    }

    /* label triggers (2.3) */
    var labelReasons = [];
    if (ing.variesByBrand) {
      var vt = (ing.variesTags || []).filter(function (t) { return !!rules.exclude[t]; });
      if (vt.length) {
        labelReasons.push((ing.hiddenSourceNote || ("Some brands of " + lowerFirst(name) + " contain " +
          listWords(vt.map(tagName)) + ".")) + " Check the label for " + listWords(vt.map(tagName)) +
          ". " + whyFor(rules, vt));
      }
    }
    var mc = intersect(ing.mayContain || [], rules.strict);
    if (mc.length) {
      labelReasons.push(name + " may contain " + listWords(mc.map(tagName)) +
        " from shared equipment. Check the label. " + whyFor(rules, mc));
    }
    var lt = contains.filter(function (t) { return !!rules.labelTags[t]; });
    if (lt.length) {
      var dWhys = [];
      lt.forEach(function (t) {
        rules.labelTags[t].forEach(function (x) {
          var s = "Check the label to make sure the " + lowerFirst(name) + " is " +
            (DIET_NAMES[x.diet] || x.diet) + ". " + x.why;
          if (dWhys.indexOf(s) < 0) dWhys.push(s);
        });
      });
      labelReasons.push(dWhys.join(" "));
    }
    if (labelReasons.length) {
      if (labelConfirmed(id, state)) {
        return { ingredientId: rowId, result: "pass",
          reason: "You checked the label on " + lowerFirst(name) + ", so it's confirmed for everyone." };
      }
      var pre = (state && state.labelChecks && state.labelChecks[id] && hasNewPackage(id, state))
        ? "This may be a different product. Please check its label. " : "";
      return { ingredientId: rowId, result: "label", reason: pre + labelReasons.join(" ") };
    }

    /* pass */
    var first = person.firstName || "This person";
    if (!rules.count) return { ingredientId: rowId, result: "pass", reason: first + " has no food restrictions." };
    return { ingredientId: rowId, result: "pass",
      reason: name + " doesn't conflict with " + first + "'s restrictions." };
  }

  /* ---------- checkMeal ---------- */

  function findPerson(id, state) {
    var ps = (state && state.profiles) || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
    return null;
  }

  /* Rows, people, safeCount and the badge before fixes are considered. */
  function baseCheck(recipe, eaterIds, state) {
    var lines = (recipe && recipe.ingredients) || [];
    var people = [];
    var anyFail = false, anyLabel = false, safeCount = 0;
    (eaterIds || []).forEach(function (pid) {
      var person = findPerson(pid, state) || { id: pid, firstName: "Someone", restrictions: [] };
      var rules = rulesFor(person);
      var rows = [], worst = "pass";
      for (var i = 0; i < lines.length; i++) {
        var row = decideRow(lines[i], person, rules, state);
        rows.push(row);
        if (RESULT_RANK[row.result] > RESULT_RANK[worst]) worst = row.result;
      }
      if (worst === "fail") anyFail = true; else safeCount++;
      if (worst === "label") anyLabel = true;
      people.push({ personId: pid, status: worst, rows: rows });
    });
    return {
      badge: anyFail ? "unsafe" : (anyLabel ? "label" : "safe"),
      safeCount: safeCount, total: people.length, people: people, fixes: []
    };
  }

  function checkMeal(recipe, eaterIds, state) {
    var base = baseCheck(recipe, eaterIds, state);
    if (base.badge !== "unsafe") return base;

    /* Failing ingredients and every tag that fails on each (2.5). */
    var lines = (recipe && recipe.ingredients) || [];
    var failing = {}, order = [];
    base.people.forEach(function (p) {
      var person = findPerson(p.personId, state) || { restrictions: [] };
      var rules = rulesFor(person);
      p.rows.forEach(function (row, i) {
        if (row.result !== "fail") return;
        var id = lines[i].ingredientId;
        var ing = ings()[id];
        if (!failing[id]) { failing[id] = []; order.push(id); }
        (ing.contains || []).forEach(function (t) {
          if (rules.exclude[t] && failing[id].indexOf(t) < 0) failing[id].push(t);
        });
      });
    });

    var fixes = [];
    for (var k = 0; k < order.length; k++) {
      var id = order[k], tags = failing[id], found = null;
      var all = swapsList();
      for (var s = 0; s < all.length; s++) {
        var sw = all[s];
        if (sw.from !== id) continue;
        /* A custom avoid food is fixed by any swap away from it (no tags to cover). */
        var covers = tags.every(function (t) { return (sw.fixes || []).indexOf(t) >= 0; });
        if (covers) { found = sw; break; }
      }
      if (!found) return base; /* unsafe, not suggested */
      fixes.push(found);
    }

    var swapped = recipe;
    fixes.forEach(function (sw) { swapped = applySwap(swapped, sw); });
    var after = baseCheck(swapped, eaterIds, state);
    if (after.badge === "safe" || after.badge === "label") {
      base.badge = "fixable";
      base.fixes = fixes;
    }
    return base;
  }

  /* ---------- applySwap ---------- */

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function applySwap(recipe, swap) {
    var copy = clone(recipe);
    if (!swap) return copy;
    copy.ingredients = (copy.ingredients || []).map(function (line) {
      if (line.ingredientId === swap.from) {
        var n = {};
        for (var k in line) if (Object.prototype.hasOwnProperty.call(line, k)) n[k] = line[k];
        n.ingredientId = swap.to;
        return n;
      }
      return line;
    });
    return copy;
  }

  /* ---------- suggest ---------- */

  function suggest(mealType, eaterIds, state) {
    state = state || {};
    var catalog = ings();
    var onHand = {}; /* ingredientId -> lowest days left among confirmed items */
    (state.fridge || []).forEach(function (item) {
      if (item.confirmed !== true) return;
      var dl = SL.util.daysLeft(item);
      if (dl == null) dl = Infinity;
      if (!(item.ingredientId in onHand) || dl < onHand[item.ingredientId]) onHand[item.ingredientId] = dl;
    });

    var ids = [], seen = {};
    [].concat(data().recipes || [], state.recipes || []).forEach(function (r) {
      if (!r || seen[r.id]) return;
      if ((r.mealTypes || []).indexOf(mealType) < 0) return;
      seen[r.id] = true;
      ids.push(r.id);
    });

    var out = [];
    ids.forEach(function (rid) {
      var recipe = SL.recipes.effective(rid, state);
      if (!recipe) return;
      var nonStaple = [], minDays = Infinity;
      (recipe.ingredients || []).forEach(function (line) {
        var ing = line.ingredientId ? catalog[line.ingredientId] : null;
        if (line.ingredientId in onHand && onHand[line.ingredientId] < minDays) minDays = onHand[line.ingredientId];
        if (ing && !ing.staple) nonStaple.push(line.ingredientId);
      });
      nonStaple = uniq(nonStaple);
      var have = nonStaple.filter(function (id) { return id in onHand; });
      if (have.length * 2 < nonStaple.length) return; /* at least half on hand */
      var check = checkMeal(recipe, eaterIds, state);
      if (check.badge === "unsafe") return;
      out.push({
        recipe: recipe, check: check,
        missing: nonStaple.filter(function (id) { return !(id in onHand); }),
        _days: minDays,
        _share: nonStaple.length ? have.length / nonStaple.length : 1
      });
    });

    out.sort(function (a, b) {
      if (a._days !== b._days) return a._days < b._days ? -1 : 1;
      if (a._share !== b._share) return b._share - a._share;
      var ba = BADGE_ORDER[a.check.badge], bb = BADGE_ORDER[b.check.badge];
      if (ba !== bb) return ba - bb;
      var ta = String(a.recipe.title || ""), tb = String(b.recipe.title || "");
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });

    return out.slice(0, 5).map(function (s) {
      return { recipe: s.recipe, check: s.check, missing: s.missing };
    });
  }

  return { checkMeal: checkMeal, applySwap: applySwap, suggest: suggest };
})();
