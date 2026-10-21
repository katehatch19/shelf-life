# Shelf Life: MVP prototype

A clickable prototype of Shelf Life (see [PRD.md](PRD.md)). One fridge photo leads to meals that are safe for everyone at the table, with macros, cost per serving and one weekly grocery list. **Everything runs on mock data.** No real AI, scanning, prices or accounts.

PRD.md is the source of truth for product behavior. If this file and the PRD disagree, the PRD wins. Fix this file, then the code.

---

## 1. MVP prototype rules

1. **Opens by double-clicking `index.html`.** It must work from `file://` in Chrome, Edge, Safari and Firefox. No server, no build step, no installs, no npm.
2. **Plain HTML, CSS and JavaScript only.** No frameworks and no libraries, CDN ones included. No TypeScript, no JSX.
3. **No ES modules and no `fetch`.** Both are blocked on `file://`. Load every file with a classic `<script src="...">` tag in `index.html`, in the order given in section 5. All code hangs off one global, `window.SL`.
4. **Nothing runs at load time except definitions.** A script file only defines `SL.*` objects and functions. No DOM work and no store reads or writes at load time. `js/app.js` boots on `DOMContentLoaded`. This lets `tests.html` load any logic file without side effects.
5. **Mock data only.** All data lives in `data/*.js` files that assign plain objects to `SL.data`. No network calls of any kind.
6. **State persists in localStorage** under the key `shelflife.v1`, through `js/store.js` only. Wrap every read and write in `try/catch`. If storage is unavailable the app still works and just forgets on reload. Stored state that won't parse or has the wrong `version` is replaced with a fresh state. The Family tab has a **Reset demo data** button (see 2.24).
7. **Phone-first layout.** One centered column, at most 480px wide, with a fixed bottom tab bar. It must also work on a desktop browser.
8. **In scope:** the core loop (profiles → fridge photo → safe meals → Recipe Keeper → grocery list), plus the weekly planner, recipe import, sharing and Report a problem.
9. **Out of scope for the prototype:** barcode scanning (shown **locked**, see 2.9), receipt scanning, partner recipes, care cards, grocery delivery, real sign-in, multiple accounts, offline sync, AI recipe generation (AI recipes are canned entries in `data/recipes.js`). Do not build these.
10. **One owner per file** (section 5). Change a file you don't own only with its owner's OK. Cross-file calls go through the public functions listed in section 4.3. Exception: `styles.css` has one marked section per screen file, and that screen's owner may edit their own section freely (see 5).

---

## 2. Hard product rules (from the PRD, do not bend)

### Safety (PRD §4)
1. **Every meal shown is checked against every person marked as eating it**, whatever the recipe's source (`ai`, `own`, `imported`). All checks go through one function, `SL.safety.checkMeal`. No screen computes safety by itself.
2. **Two levels per restriction.**
   - `strict` (allergy, celiac): the ingredient is never used, and any `mayContain` match is flagged for a label check.
   - `avoid` (intolerance, diet, custom avoid food): the ingredient is left out. `mayContain` is ignored.

   The user picks the level per restriction in Family. Allergens default to `strict`. Diets and custom foods are always `avoid`. **Celiac is the `gluten` tag at `strict`** and is shown as "Celiac / gluten".
3. **Never guess.** For each person, an ingredient gets **"check the label"** when any of these is true:
   - It has `variesByBrand: true` and one of its `variesTags` is excluded for that person, at either level.
   - The person has a `strict` restriction that matches one of its `mayContain` tags.
   - A diet rule lists one of its tags under `labelCheck` (e.g. halal → `meat`).
   - The database doesn't know it (`ingredientId: null`, such as an unmatched imported line).

   A meal is never called **Safe** if any ingredient can't be confirmed.
4. **How a row is decided.** For each person and ingredient, the result is the worst that applies, in this order: **fail > label > pass**.
   - **fail:** a `contains` tag is excluded for the person, or the ingredient is the person's `custom:` avoid food.
   - **label:** rule 2.3 applies and the label isn't confirmed (2.9).
   - **pass:** anything else.

   A person's status is their worst row. A label check never clears a fail.
5. **Badges.** Exactly three appear on suggestions. Each has text and an icon:
   - **✓ Safe**: every row passes for every eater.
   - **! Safe after a label check**: no fails, at least one label row.
   - **↻ Safe for X of Y with a fix**: some eaters fail, and the swaps in `fixes` fix every fail. X is `safeCount`, the number of eaters with no fail rows (label rows count toward X). Y is the number of eaters.

   **When a meal counts as fixable.** For each failing ingredient, `fixes` holds the first swap in `data/swaps.js` order whose `from` is that ingredient and whose `fixes` cover every failing tag for every eater on it. A `custom:` avoid fail is covered by any swap away from that ingredient. The meal is `fixable` only if every failing ingredient has such a swap and, after applying all of them, `checkMeal` returns `safe` or `label`. Otherwise it is `unsafe` and is **not suggested** (PRD goal 3).

   Recipe detail in the Keeper may show an `unsafe` recipe as **✕ Not safe for <names>**. This is the only red in the app.
6. **Show your work.** Each meal's detail shows, for each person, every ingredient with `pass`, `fail` or `label` and a plain-language reason (e.g. "Soy sauce usually contains wheat. Jordan has celiac."). A person with no restrictions gets pass rows reading "Sam has no food restrictions." All reason text is written in `js/safety.js`.
7. **Hidden sources are known.** The ingredient data flags them through `hiddenSourceNote`, e.g. wheat in soy sauce, malt in cereal, dairy in some bread, nuts in pesto.
8. **One-tap safe swap.** Swaps come only from `data/swaps.js`. Applying a swap **rechecks** the meal. While any eater has a fail, **Save, Plan and Cooked are disabled** with the note "Apply the swap first."
9. **Recheck after every change:** swaps, servings, edits, imports, label checks and changes to who's eating.
10. **Remembered label checks.** "I checked the label" is stored per ingredient in `state.labelChecks` and applies to **every person**. It turns that ingredient's label rows into pass and stays confirmed.
    - **New package.** Whenever an ingredient that has a `labelChecks` entry is added to the fridge again, by a scan or by typing, its fridge item gets `newPackage: true`. While `newPackage` is true, `checkMeal` ignores the stored check, so the ingredient is a label row again. The item and every meal using it show *"This may be a different product. Please check its label."* until the user re-confirms. Re-confirming sets `labelChecks[id]` to today and `newPackage` to false.
    - **Barcode is locked.** Barcode scanning appears as a locked **"Scan barcode · Premium"** button that opens a note saying it isn't in this prototype. It never blocks or replaces a manual check.
11. **No paid placement near safety.** Nothing sponsored appears in results or swaps. The prototype has no sponsored content at all.
12. **Disclaimer** on setup, on meal detail, on recipe detail and as a one-line footer under the suggestion list: *Shelf Life helps you plan but is not medical advice; always read product labels.*
13. **Safety status is never shown by color alone.** Every badge has text and an icon. Badge markup comes only from `SL.util.badgeHTML(check)`.

### Fridge, meals, recipes, list
14. **Photo scan.** Unsure items appear **dashed** and must be confirmed or removed before any meal is suggested. While any fridge item has `confirmed: false`, Meals shows only "Confirm N unsure items first" with a button to `#/fridge/confirm`.
    - **Scan cap.** **10 photo scans a week, resetting Monday 00:00 local time.** A scan counts when the user picks a sample fridge, even if they leave the confirm screen without confirming.
    - **Typing.** Typing items is unlimited. Typed items must match the ingredient catalog (autocomplete with `<datalist>`). Text that matches nothing shows "We don't know that item yet" and isn't added.
15. **Inventory.** Items stay between scans. Items are only "have" or "don't have", with no quantities.
    - **Re-adding.** Re-adding an item already in the fridge resets its `addedOn` (new package, fresh date).
    - **Cooked.** Marking a meal **Cooked** removes its non-staple ingredients from the fridge, after swaps (cooking with tamari removes tamari). Staples stay.
16. **Use-first.** Each item shows estimated days left (0 or less reads "Use today", never "spoiled" or "wasted"). Suggestions sort by:
    1. the lowest days left among the recipe's ingredients that are in the fridge, ascending;
    2. then the share of non-staple ingredients on hand, descending;
    3. then badge, in the order safe, label, fixable;
    4. then title.
17. **Suggestions.** 3–5 ideas for the chosen meal (breakfast, lunch, dinner or snack), with a **"Who's eating?"** picker and a **"makes leftovers"** tag. AI recipes are labeled **"AI-generated"**.
    - **Pantry staples** (`staple: true`) are always assumed on hand. They never need to be in the fridge and never go on the grocery list.
    - **Which recipes qualify.** A recipe qualifies when at least half of its non-staple ingredients are confirmed in the fridge. Missing ones are listed as "You'll need" and go on the grocery list if the meal is planned.
    - **Too few.** If fewer than 3 qualify, show the ones that do and the message "Add a few more items to get more ideas." Never pad the list with unsafe meals.
    - **Default eaters.** The picker starts with everyone, and at least one person must stay selected.
18. **Macros per serving:** calories, protein, carbs and fat, display only, as whole numbers. No goals or targets. Staples are included in macros.
19. **Cost per serving:** USD to 2 decimals, labeled **"estimate"**. Pantry staples (`staple: true`) are left out of cost. Unmatched lines are left out of macros and cost, with the note "Excludes 1 unrecognized ingredient."
20. **Servings scaling** rescales ingredients, macros and cost **immediately** and triggers a recheck.
21. **Every recipe shows its source.**
22. **Grocery list** = the ingredients of planned (non-leftover) slots, minus what's in the fridge, minus staples. It **never** includes an item the user confirmed is in the fridge. Items are grouped by aisle, each with its total amount and estimated cost. It shows label warnings per person, using each slot's `eaterIds`, and an estimated total against the weekly budget. **Over budget** shows in dark ink with the icon **▲** and text "Over budget by $X". It is never red (that means "not safe") and never amber (that means "check the label").
23. **Profiles.**
    - **Owner.** There is exactly one adult profile: the account owner, `id: "p-owner"`, `kind: "adult"`.
    - **Children only.** Every other profile is a **child** (`kind: "child"`) with **only a first name and restrictions** and no account. **No other adult profiles.** Other adults (a partner, a roommate) need their own account, which is out of scope for the prototype. Setup and Family offer only "Add a child". The store refuses any second `kind: "adult"` profile.
    - **Units.** US only: imperial units, USD.
24. **First run and reset.** A fresh state has no profiles, an empty fridge and an empty plan, so the app opens on `#/setup`. Setup offers **"Use the demo household"**, which loads `SL.data.profiles` in one tap, or adding people by hand. **Reset demo data** returns to this fresh state (and so to setup).
25. **Tone:** never shame users about wasted food, and never hide uncertainty ("Until then we don't call it safe").

### Look (PRD §5)
- **Colors.** Soft off-white background, deep green for primary actions, amber for "check the label", red **only** for "not safe".
- **Layout.** Large headings, rounded cards, one main action per screen.
- **Accessibility.** WCAG AA contrast. Every button and icon has an accessible label. Icons are text or emoji with an `aria-label`, never images.

---

## 3. Navigation

Hash-based routing (works on `file://`), handled only by `js/app.js`.

**How a screen file registers.** Each screen file registers itself as `SL.screens.<name> = { render(container, params) }`, where `<name>` is `family`, `fridge`, `meals`, `recipes` or `list`.
- **Which screen.** `app.js` maps the first hash segment to a screen. `setup` and `family` both go to `family`. Every other first segment goes to the screen of the same name.
- **`params`.** `app.js` calls `render(container, { page, parts })`. `page` is the first segment, and `parts` is the rest, so `#/fridge/scan` gives `{ page: "fridge", parts: ["scan"] }`.
- **Unbuilt screens.** If a screen isn't registered yet, `app.js` shows a "Coming soon" placeholder. `app.js` calls `render` on route change only. It does **not** re-render on store changes. A screen re-renders itself after its own `SL.store.set`, so inputs keep focus.

**Who's eating.** Whenever profiles change (setup, adding or removing a child, demo household), `state.eaters` is reset to every profile ID. Any screen reading `eaters` drops IDs that no longer exist and falls back to everyone if none are left.

**First run:** if `state.profiles` is empty, go to `#/setup`. The steps are:
1. Disclaimer.
2. "Use the demo household", or add yourself and then any children you cook for.
3. `#/fridge`.

Target: from opening the app to safe meal ideas in under 3 minutes.

**Bottom tab bar (always visible after setup):** Fridge · Meals · Recipes · List · Family

| Route | Screen | Owner file |
|---|---|---|
| `#/setup` | First-run disclaimer + profile setup | family.js |
| `#/fridge` | Inventory, sorted by days left; add by typing; "Snap fridge" button with scans left this week | fridge.js |
| `#/fridge/scan` | Pick one of the sample fridges | fridge.js |
| `#/fridge/confirm` | Scan result; dashed unsure items must be confirmed or removed | fridge.js |
| `#/meals` | Meal-type tabs + "Who's eating?" + 3–5 suggestions with badges | meals.js |
| `#/meals/:recipeId` | Meal detail: show-your-work per person, swaps, servings, macros, cost, disclaimer, Save / Plan / Cooked / Share / Report | meals.js |
| `#/recipes` | Recipe Keeper: folders, tags, search | recipes.js |
| `#/recipes/:recipeId` | Recipe detail/edit with servings scaling and safety summary | recipes.js |
| `#/recipes/import` | Import from link, pasted text or cookbook photo (mocked) | recipes.js |
| `#/list` | Defaults to `#/list/grocery` | list.js |
| `#/list/plan` | Weekly planner: drag recipes from the tray onto days × meals; leftovers fill later slots | list.js |
| `#/list/plan/:recipeId` | Planner with that recipe highlighted at the top of the tray (from meal detail "Plan") | list.js |
| `#/list/grocery` | Grocery list + budget bar + label warnings | list.js |
| `#/family` | You and your children, with restrictions; label checks; weekly budget; Reset demo data | family.js |

Unknown routes go to `#/fridge` (or `#/setup` if there are no profiles). The share sheet and the report form are overlays, not routes.

**Planning a meal (drag, per PRD §3).** The planner shows a grid of this week's days × breakfast/lunch/dinner/snack, and a **tray** of recipes to drag from. The tray holds the Keeper's recipes, plus any recipe sent from meal detail.
- **Drag with Pointer Events** (`pointerdown`/`pointermove`/`pointerup`), not the HTML5 drag-and-drop API, which doesn't work reliably with touch on phones. Set `touch-action: none` on draggable cards. While dragging, highlight the cell under the pointer.
- **What a drag can do.** Drag a tray recipe onto a cell to plan it. Drag a planned slot to another cell to move it, or back onto the tray to remove it.
- **Keyboard and accessibility alternative (required, WCAG 2.5.7).** Every tray card and planned slot also has a **"Place…"** button. It opens a day + meal picker that does the same thing as a drop, so tab order and screen readers reach every action.
- **Plan from meal detail.** "Plan" on meal detail goes to `#/list/plan/<recipeId>`, which shows that recipe at the top of the tray, highlighted.
- **Safety on drop.** Every drop rechecks the recipe with `SL.safety.checkMeal` for the current eaters. If any eater has a fail, the drop is refused with "Not safe for <names> yet. Apply the swap first." Tray cards show their badge.
- **What a slot stores.** A placed slot stores the recipe, the current eaters and the effective servings.

**Leftovers.** If the recipe `makesLeftovers`, the next day's **lunch** is filled too, if it's empty. If not, the next empty lunch later this week is used, and if there's none, nothing is filled. The leftover slot has `leftoverOf: "<date>:<meal>"` and adds nothing to the grocery list.

---

## 4. Data contract

### 4.1 Static mock data (`data/*.js`, read-only at runtime)

Every data file starts with `window.SL = window.SL || {}; SL.data = SL.data || {};` and assigns one key. Seed IDs are lowercase kebab-case strings and never change once used. Recipe IDs start with `r-`, profile IDs with `p-`. User-created IDs come from `SL.util.newId(prefix)`, e.g. `r-u-lq3k9x`, so they never collide with seed IDs.

**Units.** The allowed units are `tsp` `tbsp` `cup` `oz` `lb` `each` `slice` `clove`. There is **no unit conversion**. A recipe line's `unit`, the ingredient's `unit`, `macrosPerUnit` and the price's `unit` must all be the same for that ingredient.

**Display.** `tsp`/`tbsp`/`cup` amounts are rounded to the nearest ¼ and shown as fractions (¼ ½ ¾); `each`/`slice`/`clove` to the nearest ½; `oz`/`lb` to one decimal.

```js
// data/ingredients.js  (Makissa)
SL.data.ingredients = {
  "soy-sauce": {
    id: "soy-sauce", name: "Soy sauce", aisle: "Condiments",
    contains:   ["soy", "wheat", "gluten"], // tags from the TAG LIST below
    mayContain: [],                      // cross-contact tags (flagged for strict only)
    variesByBrand: false,                // true = some brands differ...
    variesTags: [],                      // ...in these tags → label check (non-empty when variesByBrand is true)
    hiddenSourceNote: "Usually brewed with wheat.",
    staple: false,                       // true = oil, salt, spices: assumed on hand, left out of cost and list
    shelfDays: 365,                      // fridge life, for use-first
    unit: "tbsp",
    macrosPerUnit: { kcal: 9, proteinG: 1.3, carbsG: 0.8, fatG: 0 }
  }
};
SL.data.dietRules = {                  // diet tag → ingredient tags
  vegan:           { exclude: ["milk", "eggs", "fish", "shellfish", "meat", "honey"], labelCheck: [] },
  vegetarian:      { exclude: ["meat", "fish", "shellfish"], labelCheck: [] },
  halal:           { exclude: ["pork", "alcohol"], labelCheck: ["meat"] },  // is the meat halal?
  keto:            { exclude: ["high-carb"], labelCheck: [] },
  "low-fodmap":    { exclude: ["high-fodmap"], labelCheck: [] },
  "high-protein":  { exclude: [], labelCheck: [] },   // display only: shown as macros, filters nothing
  "macro-focused": { exclude: [], labelCheck: [] }    // display only: shown as macros, filters nothing
};

// data/swaps.js  (Makissa)
SL.data.swaps = [
  { from: "soy-sauce", to: "gf-tamari", fixes: ["wheat", "gluten"], note: "Use certified gluten-free tamari." },
  { from: "cheddar",   to: "oat-milk-cheese", fixes: ["milk"], note: "" }
];

// data/profiles.js  (Kate) — the demo household, loaded by "Use the demo household" on setup
SL.data.profiles = [
  { id: "p-owner", firstName: "Alex", kind: "adult",  // "adult" only for p-owner; everyone else "child"
    restrictions: [ { tag: "high-protein", level: "avoid" } ] },
  { id: "p-jordan", firstName: "Jordan", kind: "child",
    restrictions: [ { tag: "gluten", level: "strict" } ] },
  { id: "p-kid", firstName: "Sam", kind: "child",
    restrictions: [ { tag: "peanuts", level: "strict" }, { tag: "tree-nuts", level: "strict" } ] }
];

// data/fridges.js  (Kate) — sample fridge "photos" for the mock scan
SL.data.fridges = [
  { id: "fridge-a", label: "Weeknight fridge", emoji: "🥚🧀🥬",
    items: [ { ingredientId: "eggs", ageDays: 3, unsure: false },
             { ingredientId: "soy-sauce", ageDays: 40, unsure: true } ] }
];

// data/recipes.js  (Eleanor)
SL.data.recipes = [
  { id: "r-veg-fried-rice", title: "Veggie fried rice",
    source: { type: "ai", label: "AI-generated" },  // type: "ai" | "own" | "imported"
    mealTypes: ["lunch", "dinner"],                  // breakfast | lunch | dinner | snack
    baseServings: 4, makesLeftovers: true,
    folder: "Weeknights", tags: ["quick"],
    ingredients: [ { ingredientId: "soy-sauce", amount: 2, unit: "tbsp" } ],
    steps: ["Cook rice...", "..."] }
];
SL.data.importSamples = {             // canned results for link / photo import
  link:  { /* recipe object, source.type "imported" */ },
  photo: { /* recipe object, source.type "imported"; includes one unmatched line */ }
};

// data/prices.js  (Eleanor) — US national average estimates, USD, every non-staple ingredient
SL.data.prices = { "soy-sauce": { perUnit: 0.12, unit: "tbsp" } };
```

**Unmatched recipe lines** (from import) use `{ ingredientId: null, rawText: "2 tbsp oyster sauce", amount: 2, unit: "tbsp" }`. They are a label row for everyone ("We don't recognize this ingredient, so we can't check it.") until the user edits the line to pick a catalog ingredient or removes it.

**TAG LIST** (`contains`, `mayContain`, `variesTags` and restriction `tag` all use these, and nothing else):
- **Allergens:** `milk` `eggs` `fish` `shellfish` `tree-nuts` `peanuts` `wheat` `soy` `sesame` `gluten`. Every ingredient that contains `wheat` also lists `gluten`. Barley, rye and malt list `gluten` without `wheat`.
- **Diets:** `low-fodmap` `keto` `halal` `high-protein` `macro-focused` `vegan` `vegetarian`. A diet tag on a profile maps to ingredient tags through `SL.data.dietRules`, shown above. `exclude` tags fail and `labelCheck` tags need a label check.
- **Ingredient-only tags:** `meat` `pork` `alcohol` `honey` `high-fodmap` `high-carb`. These appear only on ingredients, never as a restriction. Every `pork` ingredient also lists `meat`. Fish and shellfish are not `meat`.
- **Custom avoid foods:** `{ tag: "custom:<ingredientId>", level: "avoid" }`. This matches that ingredient ID directly.

**Mock data must exercise every rule.** The demo household and sample fridges together must produce at least one of each:
- Safe
- Safe after a label check
- Safe for X of Y with a fix, whose swap target is **not** `variesByBrand` so that one tap gives Safe
- a hidden source
- a dashed unsure item
- a may-contain flag on a strict allergy
- an item expiring within 2 days

### 4.2 Runtime state (`js/store.js`, saved to localStorage `shelflife.v1`)

```js
{
  version: 1,
  profiles: [ /* same shape as SL.data.profiles; [] in a fresh state */ ],
  fridge: [ { ingredientId, addedOn: "2026-10-21", confirmed: true, newPackage: false } ],
                                              // confirmed: false = dashed unsure scan item
  scans: [ "2026-10-21T18:02:00" ],           // photo scans only (local time), for the 10/week cap
  labelChecks: { "soy-sauce": "2026-10-21" }, // ingredientId -> date the label was checked
  recipes: [ /* user-owned, imported and edited recipes; same shape as SL.data.recipes */ ],
  savedRecipeIds: [ "r-veg-fried-rice" ],     // seed recipes saved to the Keeper
  recipeOverrides: { "r-id": { servings: 6, swaps: { "soy-sauce": "gf-tamari" } } },
  plan: { "2026-10-20": { breakfast: null,
                          lunch: { recipeId, eaterIds: ["p-owner"], servings: 4, leftoverOf: null },
                          dinner: null, snack: null } },
  weekStart: "2026-10-20",                    // Monday of the current week
  budgetUSD: 120,
  eaters: [ "p-owner", "p-kid" ],             // current "Who's eating?" selection
  reports: [ { recipeId, kind: "safety" | "recipe", text, at } ]
}
```

- **Dates.** All dates are **local** `YYYY-MM-DD` from `SL.util`. Never use `toISOString()`, because it gives UTC dates, which are a day off in US evenings.
- **Fridge dates.** On scan: `addedOn = today − ageDays`. Days left = `shelfDays − (today − addedOn)`.
- **New week.** On boot, if the current Monday ≠ `weekStart`, set `weekStart` to the current Monday and drop plan days before it. The scan cap counts only `scans` at or after the current Monday 00:00.
- **Swaps and servings** go in `recipeOverrides[recipeId]` and apply everywhere that recipe appears. A planned slot keeps its own `servings`.
- **Edits.** Editing a seed recipe's title, ingredients or steps saves a **copy** to `state.recipes` with a new ID. The copy keeps `source.type` and gets the label `"<original label>, edited by you"`. Own and imported recipes in `state.recipes` are edited in place.
- **The Keeper** lists the recipes in `savedRecipeIds` plus all of `state.recipes`.

### 4.3 Public functions (the only cross-file API)

| Function | Owner | Returns |
|---|---|---|
| `SL.util.today()` / `dateStr(d)` / `mondayOf(dateStr)` / `daysBetween(a, b)` / `daysLeft(fridgeItem)` / `newId(prefix)` / `esc(text)` / `badgeHTML(check)` / `fmtAmount(amount, unit)` | util.js | helpers; tests may set `SL.util._today = "2026-10-21"` to fix the date |
| `SL.store.get()` / `SL.store.set(patch)` / `SL.store.reset()` / `SL.store.subscribe(fn)` | store.js | `get` returns a **deep copy**; `set` **shallow-merges top-level keys** (pass whole nested objects), saves and notifies `fn(state)`; `reset` returns to the fresh state |
| `SL.safety.checkMeal(recipe, eaterIds, state)` | safety.js | `{ badge: "safe" \| "label" \| "fixable" \| "unsafe", safeCount, total, people: [{ personId, status, rows: [{ ingredientId, result: "pass" \| "fail" \| "label", reason }] }], fixes: [swap] }` (see 2.4–2.5) |
| `SL.safety.applySwap(recipe, swap)` | safety.js | a new recipe object (call `checkMeal` again) |
| `SL.safety.suggest(mealType, eaterIds, state)` | safety.js | up to 5 `{ recipe, check, missing: [ingredientId] }` sorted per 2.16, never `unsafe`; recipes are effective recipes (overrides applied) |
| `SL.recipes.find(id, state)` / `SL.recipes.effective(id, state)` | recipes.js | the raw recipe from `state.recipes` or `SL.data.recipes`; the same with `recipeOverrides` applied (swaps, then servings) |
| `SL.recipes.scale(recipe, servings)` / `SL.recipes.macros(recipe)` / `SL.recipes.cost(recipe)` | recipes.js | scaled recipe; per-serving `{ kcal, proteinG, carbsG, fatG }`; per-serving `{ usd, excludedCount }` |
| `SL.list.build(state)` | list.js | `{ items: [{ ingredientId, aisle, amount, unit, costUSD, warnings: [{ personId, text }] }], totalUSD, budgetUSD }` |
| `SL.share.open(kind, payload)` / `SL.share.report(recipeId)` | share.js | opens the overlay; `kind` is `"recipe"` (`{ recipeId }`), `"plan"` (`{ weekStart }`) or `"list"` (`{}`) |
| `SL.app.go(route)` | app.js | navigates |

**Servings, macros and cost.**
- **`scale(recipe, n)`** returns a copy with `servings: n` and every amount × `n / (recipe.servings || recipe.baseServings)`, so scaling an already-scaled recipe doesn't double-scale.
- **The serving count** is `recipe.servings || recipe.baseServings`. `macros` and `cost` divide totals by it.
- **Rounding.** `macros` returns whole numbers. `cost.usd` is rounded to cents.
- **Leaving lines out.** Staples are left out of cost only. Unmatched lines are left out of both and counted in `excludedCount`.

**`effective(id, state)`**:
1. Look up the recipe with `find`.
2. For each `recipeOverrides[id].swaps` entry `{ from: to }`, take the matching swap object from `SL.data.swaps` and call `SL.safety.applySwap`.
3. If `recipeOverrides[id].servings` is set, `scale` to it.

**`SL.list.build(state)`**:
1. For every plan slot on or after `weekStart` with `leftoverOf: null`, take `effective(recipeId)` scaled to the slot's `servings`.
2. Sum the amounts per ingredient across those slots.
3. Drop staples, unmatched lines and any ingredient with a fridge item where `confirmed: true`.
4. Each item's `costUSD` is amount × `perUnit`, rounded to cents. `totalUSD` is the sum.
5. **Warnings:** for each slot using the item, run `checkMeal(recipe, slot.eaterIds, state)`. Every `label` row for that ingredient becomes `{ personId, text: row.reason }`, one per person.
6. Sort the items by aisle, then name.

**`SL.safety.suggest`** considers `SL.data.recipes` plus `state.recipes` whose `mealTypes` include the meal type. Each one is turned into an effective recipe through `SL.recipes.effective`. Only fridge items with `confirmed: true` count as on hand.

**Share overlay.**
- **Link:** a mock URL `https://shelflife.app/s/<kind>-<id>` with the note "Links aren't live in this prototype."
- **Text:** a plain-text version in a read-only textarea with **Copy**. It uses `navigator.clipboard` when available. Otherwise it selects the text and says "Press Ctrl+C (⌘C on Mac) to copy."
- **Print:** `window.print()`, with print styles that show only the shared content.
- **Report a problem:** asks for the kind (safety or recipe) and text, then saves to `state.reports`.

**Pasted-text import.**
1. Each line before a line reading "Steps", "Directions" or "Method" is an ingredient. The rest are steps.
2. In each ingredient line, a leading number is the `amount`, and the next word is the `unit` if it's an allowed unit.
3. The rest is matched case-insensitively to an ingredient `name`: an exact match first, then a name the text contains.
4. A line that matches nothing becomes an unmatched line.

---

## 5. File layout and owners

One owner per file. The owner reviews every change to it.

```
index.html              Kate      shell, tab bar, <script> tags in this order ↓
styles.css              Kate      tokens on :root + shared component kit; one marked section per screen
data/ingredients.js     Makissa   ingredients, hidden sources, dietRules
data/swaps.js           Makissa   safe swaps
data/profiles.js        Kate      demo household
data/fridges.js         Kate      sample fridges for the mock scan
data/recipes.js         Eleanor   recipes + importSamples
data/prices.js          Eleanor   price estimates
js/util.js              Kate      local dates, ids, escaping, badgeHTML, fmtAmount
js/store.js             Kate      state, localStorage, reset, subscribe
js/safety.js            Makissa   checkMeal, applySwap, suggest (the ONLY safety logic)
js/share.js             Eleanor   share sheet (link/text/print) + Report a problem
js/screens/family.js    Kate      #/setup, #/family
js/screens/fridge.js    Kate      #/fridge, scan, confirm
js/screens/meals.js     Makissa   #/meals, meal detail
js/screens/recipes.js   Eleanor   Recipe Keeper, import, find/effective/scale/macros/cost
js/screens/list.js      Eleanor   planner + grocery list + budget, SL.list.build
js/app.js               Kate      router, tab bar, boot on DOMContentLoaded (loaded LAST)
tests.html              Makissa   in-browser checks (open by double-click)
js/tests.js             Makissa   assertions for safety, list, scaling
```

**`styles.css`.** Kate owns the tokens and the shared component kit: card, buttons, the badges, chip, dashed unsure item, form rows, overlay, budget bar and print styles. Below them are sections marked `/* == screen: meals (Makissa) == */` and so on. Each screen's owner edits only their own section.

**`tests.html`** loads `data/*.js`, `js/util.js`, `js/safety.js`, `js/screens/recipes.js` and `js/screens/list.js`, then `js/tests.js`. Tests build their own state objects and never call `SL.store` or touch localStorage.

`demo_app.py` is unrelated to this prototype. Leave it alone.

---

## 6. How we check it works

Open `tests.html` by double-clicking. All checks must show **PASS**. Then run through this by hand in a fresh browser window, after **Reset demo data**:

1. **Opens:** double-click `index.html`. No console errors, and it lands on setup. Setup and Family offer only "Add a child", never another adult.
2. **Under 3 minutes:** finish setup, scan a sample fridge, confirm items and reach meal ideas, timed.
3. **Never guess:** a dashed unsure item blocks suggestions until it's confirmed. Meals using an unconfirmed `variesByBrand` item say "Safe after a label check", never "Safe".
4. **Swap and recheck:** a "Safe for X of Y" meal becomes Safe after one tap, and show-your-work updates. Save, Plan and Cooked stay disabled until then.
5. **Label memory:** confirm a label, scan again with that item, and the "may be a different product" warning appears. The meal drops back to "Safe after a label check" until you re-confirm.
6. **Scaling:** changing servings updates ingredients, macros and cost at once.
7. **List:** drag two meals onto the planner, once with a mouse and once with touch (or a phone-sized window with touch emulation). Place a third with the "Place…" button using only the keyboard. The grocery list has none of the fridge's confirmed items and no staples, a leftover slot adds nothing, and the total is compared to the budget.
8. **Scan cap:** the 11th photo scan in a week is refused. Typing an item still works.
9. **Persistence:** reload and everything is still there. Reset demo data returns to setup, and "Use the demo household" restores the mock household.
10. **Accessibility:** every badge reads correctly with color turned off (grayscale), and tab order reaches every button.
