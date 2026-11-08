/* js/screens/family.js (Kate): #/setup (first run) and #/family.
   Definitions only, nothing runs at load time except the registration.
   Profile rules (CLAUDE.md 2.22): one adult (id "p-owner"); children hold only
   a first name and restrictions. There is no UI path to add a second adult. */
window.SL = window.SL || {};
SL.screens = SL.screens || {};

SL.screens.family = (function () {
  var DISCLAIMER = "Shelf Life helps you plan but is not medical advice; always read product labels.";

  /* TAG LIST (CLAUDE.md 4.1) with friendly names. */
  var ALLERGENS = [
    ["milk", "Milk / dairy"], ["eggs", "Eggs"], ["fish", "Fish"], ["shellfish", "Shellfish"],
    ["tree-nuts", "Tree nuts"], ["peanuts", "Peanuts"], ["wheat", "Wheat"], ["soy", "Soy"],
    ["sesame", "Sesame"], ["gluten", "Celiac / gluten"]
  ];
  var DIETS = [
    ["vegan", "Vegan"], ["vegetarian", "Vegetarian"], ["halal", "Halal"], ["keto", "Keto"],
    ["low-fodmap", "Low FODMAP"], ["high-protein", "High protein"], ["macro-focused", "Macro-focused"]
  ];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* Screen-local UI state (never persisted). */
  var setupStep = "disclaimer";   // disclaimer | who | owner | kids
  var draftOwner = null;
  var draftKids = [];
  var addingChild = false;
  var editing = null;             // profile id, or "new-child"
  var confirmRemove = null;       // profile id
  var confirmReset = false;
  var flash = "";
  var formError = "";

  var current = null;             // { container, params }

  function esc(s) { return SL.util.esc(s); }
  function ings() { return (SL.data && SL.data.ingredients) || {}; }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }

  function lookup(list, tag) {
    for (var i = 0; i < list.length; i++) if (list[i][0] === tag) return list[i][1];
    return null;
  }

  /* Friendly name for a restriction tag (also used by other screens via SL.screens.family.tagName). */
  function tagName(tag) {
    if (String(tag).indexOf("custom:") === 0) {
      var ing = ings()[tag.slice(7)];
      return ing ? ing.name : tag.slice(7);
    }
    return lookup(ALLERGENS, tag) || lookup(DIETS, tag) || tag;
  }

  function restrictionText(r) {
    var name = tagName(r.tag);
    if (String(r.tag).indexOf("custom:") === 0) return "Avoids " + name.toLowerCase();
    if (lookup(DIETS, r.tag)) return name;
    return name + (r.level === "strict" ? " (allergy)" : " (intolerance)");
  }

  function summary(p) {
    var rs = p.restrictions || [];
    if (!rs.length) return "No restrictions";
    return rs.map(restrictionText).join(" · ");
  }

  function fmtDate(s) {
    var p = String(s || "").slice(0, 10).split("-");
    if (p.length !== 3) return String(s || "");
    return MONTHS[(+p[1] - 1) % 12] + " " + (+p[2]) + ", " + p[0];
  }

  /* ---------- restriction editor (shared by setup and Family) ---------- */

  function editorHTML(prefix, restrictions) {
    var have = {};
    (restrictions || []).forEach(function (r) { have[r.tag] = r.level || "avoid"; });

    var h = '<fieldset class="fam-editor"><legend>Allergies and intolerances</legend>' +
      '<p class="hint small muted">An allergy (or celiac) means the food is never used, and "may contain" warnings are flagged. ' +
      "An intolerance means it's left out.</p>" +
      '<ul class="fam-allergens">';
    ALLERGENS.forEach(function (a) {
      var id = prefix + "-al-" + a[0];
      var on = Object.prototype.hasOwnProperty.call(have, a[0]);
      var level = on ? have[a[0]] : "strict";
      h += '<li class="fam-allergen">' +
        '<label class="fam-check" for="' + id + '"><input type="checkbox" id="' + id + '" data-allergen="' + a[0] + '"' +
        (on ? " checked" : "") + "> " + esc(a[1]) + "</label>" +
        '<label class="sr-only" for="' + id + '-level">How strict for ' + esc(a[1]) + "</label>" +
        '<select id="' + id + '-level" class="fam-level" data-level-for="' + a[0] + '"' + (on ? "" : " disabled") + ">" +
        '<option value="strict"' + (level === "strict" ? " selected" : "") + ">Allergy: never use</option>" +
        '<option value="avoid"' + (level === "avoid" ? " selected" : "") + ">Intolerance: leave out</option>" +
        "</select></li>";
    });
    h += "</ul></fieldset>";

    h += '<fieldset class="fam-editor"><legend>Diets</legend><ul class="fam-diets">';
    DIETS.forEach(function (d) {
      var id = prefix + "-diet-" + d[0];
      h += '<li><label class="fam-check" for="' + id + '"><input type="checkbox" id="' + id + '" data-diet="' + d[0] + '"' +
        (Object.prototype.hasOwnProperty.call(have, d[0]) ? " checked" : "") + "> " + esc(d[1]) + "</label></li>";
    });
    h += "</ul></fieldset>";

    h += '<fieldset class="fam-editor"><legend>Other foods to avoid</legend><ul class="chip-list fam-custom">';
    (restrictions || []).forEach(function (r) {
      if (String(r.tag).indexOf("custom:") === 0) h += customChip(r.tag);
    });
    h += "</ul>";
    var names = Object.keys(ings()).map(function (k) { return ings()[k]; })
      .sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    h += '<div class="row fam-custom-add"><label class="sr-only" for="' + prefix + '-custom">Food to avoid</label>' +
      '<select id="' + prefix + '-custom" class="fam-custom-select"><option value="">Choose a food…</option>';
    names.forEach(function (i) { h += '<option value="' + esc(i.id) + '">' + esc(i.name) + "</option>"; });
    h += '</select><button type="button" class="btn btn-secondary" data-action="custom-add">Add food to avoid</button></div>' +
      "</fieldset>";
    return h;
  }

  function customChip(tag) {
    var name = tagName(tag);
    return '<li class="chip fam-chip" data-custom="' + esc(tag) + '"><span>' + esc(name) + "</span>" +
      '<button type="button" class="fam-chip-x" data-action="custom-remove" aria-label="Remove ' + esc(name) +
      ' from foods to avoid"><span aria-hidden="true">✕</span></button></li>';
  }

  function readEditor(form) {
    var out = [];
    var al = form.querySelectorAll("[data-allergen]");
    for (var i = 0; i < al.length; i++) {
      if (!al[i].checked) continue;
      var tag = al[i].getAttribute("data-allergen");
      var sel = form.querySelector('[data-level-for="' + tag + '"]');
      out.push({ tag: tag, level: sel && sel.value === "avoid" ? "avoid" : "strict" });
    }
    var di = form.querySelectorAll("[data-diet]");
    for (var j = 0; j < di.length; j++) {
      if (di[j].checked) out.push({ tag: di[j].getAttribute("data-diet"), level: "avoid" });
    }
    var cu = form.querySelectorAll("[data-custom]");
    for (var k = 0; k < cu.length; k++) out.push({ tag: cu[k].getAttribute("data-custom"), level: "avoid" });
    return out;
  }

  /* Returns true if the click was an editor action. */
  function editorClick(btn) {
    var action = btn.getAttribute("data-action");
    var fs = btn.closest(".fam-editor");
    if (action === "custom-add" && fs) {
      var sel = fs.querySelector(".fam-custom-select");
      var id = sel && sel.value;
      if (!id) { sel && sel.focus(); return true; }
      var tag = "custom:" + id;
      var list = fs.querySelector(".fam-custom");
      if (!list.querySelector('[data-custom="' + tag + '"]')) list.insertAdjacentHTML("beforeend", customChip(tag));
      sel.value = "";
      sel.focus();
      return true;
    }
    if (action === "custom-remove" && fs) {
      var li = btn.closest("[data-custom]");
      if (li) li.parentNode.removeChild(li);
      var s2 = fs.querySelector(".fam-custom-select");
      if (s2) s2.focus();
      return true;
    }
    return false;
  }

  function editorChange(t) {
    if (t.hasAttribute && t.hasAttribute("data-allergen")) {
      var form = t.closest("form");
      var sel = form && form.querySelector('[data-level-for="' + t.getAttribute("data-allergen") + '"]');
      if (sel) sel.disabled = !t.checked;
    }
  }

  /* Name + restrictions form. kind: "owner" | "child" | "edit". */
  function personForm(kind, prefix, profile, submitText, cancel) {
    var p = profile || { firstName: "", restrictions: [] };
    var nameId = prefix + "-name";
    var err = formError && formError !== "budget" ? formError : "";
    return '<form class="card fam-form" data-form="' + kind + '"' + (profile && profile.id ? ' data-id="' + esc(profile.id) + '"' : "") + ' novalidate>' +
      '<div class="form-row"><label for="' + nameId + '">First name</label>' +
      '<input type="text" id="' + nameId + '" name="firstName" autocomplete="given-name" maxlength="40" value="' + esc(p.firstName) + '"' +
      (err ? ' aria-invalid="true" aria-describedby="' + nameId + '-err"' : "") + ">" +
      (err ? '<p class="error" id="' + nameId + '-err">' + esc(err) + "</p>" : "") +
      "</div>" +
      editorHTML(prefix, p.restrictions) +
      '<div class="row">' +
      '<button type="submit" class="btn btn-primary">' + esc(submitText) + "</button>" +
      (cancel ? '<button type="button" class="btn btn-text" data-action="cancel">Cancel</button>' : "") +
      "</div></form>";
  }

  function readPerson(form) {
    var name = String((form.querySelector('[name="firstName"]') || {}).value || "").trim();
    return { firstName: name, restrictions: readEditor(form) };
  }

  /* ---------- rendering plumbing ---------- */

  function mount(container, params) {
    current = { container: container, params: params };
    container.innerHTML = "";
    var root = document.createElement("div");
    root.className = params.page === "setup" ? "fam-setup" : "fam-family";
    container.appendChild(root);
    root.addEventListener("click", onClick);
    root.addEventListener("submit", onSubmit);
    root.addEventListener("change", function (e) { editorChange(e.target); });
    root.innerHTML = params.page === "setup" ? setupHTML() : familyHTML();
    return root;
  }

  /* Re-render in place (after SL.store.set or a UI-state change). */
  function refresh(focusSel) {
    if (!current || !current.container.isConnected) return;
    var root = mount(current.container, current.params);
    var f = focusSel ? root.querySelector(focusSel) : null;
    if (!f) f = root.querySelector("[aria-invalid='true']") || root.querySelector("h1");
    if (f) {
      if (!f.hasAttribute("tabindex") && /^H\d$/.test(f.tagName)) f.setAttribute("tabindex", "-1");
      try { f.focus({ preventScroll: false }); } catch (e) { f.focus(); }
    }
  }

  function render(container, params) {
    params = params || {};
    flash = "";
    formError = "";
    confirmReset = false;
    confirmRemove = null;
    editing = null;
    mount(container, params);
  }

  /* ---------- setup ---------- */

  function setupHTML() {
    var st = SL.store.get();
    if (st.profiles.length) {
      return '<h1>You\'re all set</h1><section class="card"><p>Your household is already set up. You can change it on the Family tab.</p>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="to-fridge">Go to my fridge</button></section>';
    }
    if (setupStep === "disclaimer") {
      return '<h1>Welcome to Shelf Life</h1>' +
        '<p class="fam-lede">One fridge photo, and meal ideas that are safe for everyone at your table.</p>' +
        '<section class="card fam-disclaimer" aria-labelledby="fam-disc-h"><h2 id="fam-disc-h">Before you start</h2>' +
        '<p class="fam-disclaimer__text"><span aria-hidden="true">ⓘ </span>' + esc(DISCLAIMER) + "</p>" +
        "<p class=\"small muted\">If we can't confirm an ingredient, we say so. Until then we don't call a meal safe.</p>" +
        '<button type="button" class="btn btn-primary btn-block" data-action="ack">I understand</button></section>';
    }
    if (setupStep === "who") {
      var demo = (SL.data.profiles || []).map(function (p) {
        return "<li><strong>" + esc(p.firstName) + "</strong>" + (p.kind === "adult" ? " (you)" : "") +
          ': <span class="muted">' + esc(summary(p)) + "</span></li>";
      }).join("");
      return '<h1>Who\'s at your table?</h1>' +
        '<section class="card"><h2>Try the demo household</h2><ul class="fam-demo">' + demo + "</ul>" +
        '<button type="button" class="btn btn-primary btn-block" data-action="demo">Use the demo household</button></section>' +
        '<section class="card"><h2>Or set up your own</h2><p class="muted">Start with you, then add the children you cook for.</p>' +
        '<button type="button" class="btn btn-secondary btn-block" data-action="own">Set up my household</button></section>' +
        '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    }
    if (setupStep === "owner") {
      return '<h1>About you</h1><p class="muted">You\'re the account owner. Pick anything you need to avoid.</p>' +
        personForm("owner", "fam-owner", draftOwner, "Next", false) +
        '<button type="button" class="btn btn-text" data-action="back-who">Back</button>';
    }
    // kids
    var h = '<h1>People you cook for</h1>' +
      '<p class="muted">Add your children. We keep only a first name and what they need to avoid. Shelf Life has one adult account: yours.</p>' +
      '<section class="card"><h2 class="card__title">' + esc(draftOwner.firstName) + ' (you)</h2><p class="small muted">' + esc(summary(draftOwner)) +
      '</p><button type="button" class="btn btn-text" data-action="edit-owner" aria-label="Edit ' + esc(draftOwner.firstName) + '">Edit</button></section>';
    draftKids.forEach(function (k, i) {
      h += '<section class="card"><h2 class="card__title">' + esc(k.firstName) + '</h2><p class="small muted">' + esc(summary(k)) + "</p>" +
        '<button type="button" class="btn btn-text" data-action="remove-draft" data-index="' + i + '" aria-label="Remove ' + esc(k.firstName) + '">Remove</button></section>';
    });
    if (addingChild) {
      h += "<h2>Add a child</h2>" + personForm("child", "fam-kid", null, "Add child", true);
    } else {
      h += '<button type="button" class="btn btn-secondary btn-block" data-action="add-child">Add a child</button>';
      h += '<button type="button" class="btn btn-primary btn-block fam-finish" data-action="finish">' +
        (draftKids.length ? "Done: go to my fridge" : "Skip: it's just me") + "</button>";
    }
    h += '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    return h;
  }

  function finishSetup(profiles) {
    try {
      SL.store.set({ profiles: profiles, eaters: profiles.map(function (p) { return p.id; }) });
    } catch (e) {
      formError = "We couldn't save that household.";
      refresh();
      return;
    }
    setupStep = "disclaimer"; draftOwner = null; draftKids = []; addingChild = false;
    SL.app.go("#/fridge");
  }

  /* ---------- family ---------- */

  function familyHTML() {
    var st = SL.store.get();
    var h = "<h1>Family</h1>";
    if (flash) h += '<p class="fam-flash" role="status"><span aria-hidden="true">✓ </span>' + esc(flash) + "</p>";
    else h += '<p class="sr-only" role="status"></p>';

    // People
    h += '<section aria-labelledby="fam-people-h"><h2 id="fam-people-h">You and your children</h2>';
    st.profiles.forEach(function (p) {
      if (editing === p.id) {
        h += personForm("edit", "fam-edit", p, "Save " + p.firstName, true);
        return;
      }
      h += '<article class="card fam-person"><div class="spread"><h3 class="card__title">' + esc(p.firstName) +
        "</h3><span class=\"fam-kind\">" + (p.kind === "adult" ? "You" : "Child") + "</span></div>" +
        '<p class="small muted">' + esc(summary(p)) + "</p>";
      if (confirmRemove === p.id) {
        h += '<div class="fam-confirm" role="group" aria-label="Confirm removing ' + esc(p.firstName) + '"><p>Remove ' + esc(p.firstName) + "?</p>" +
          '<div class="row"><button type="button" class="btn btn-secondary" data-action="remove-yes" data-id="' + esc(p.id) + '">Yes, remove ' + esc(p.firstName) + "</button>" +
          '<button type="button" class="btn btn-text" data-action="remove-no">Cancel</button></div></div>';
      } else {
        h += '<div class="row"><button type="button" class="btn btn-text" data-action="edit" data-id="' + esc(p.id) + '" aria-label="Edit ' + esc(p.firstName) + '">Edit</button>' +
          (p.kind === "child" ? '<button type="button" class="btn btn-text" data-action="remove" data-id="' + esc(p.id) + '" aria-label="Remove ' + esc(p.firstName) + '">Remove</button>' : "") +
          "</div>";
      }
      h += "</article>";
    });
    if (editing === "new-child") h += "<h3>Add a child</h3>" + personForm("child", "fam-kid", null, "Add child", true);
    else h += '<button type="button" class="btn btn-primary btn-block" data-action="add-child">Add a child</button>';
    h += "</section>";

    // Label checks
    var newPkg = {};
    (st.fridge || []).forEach(function (f) { if (f.newPackage) newPkg[f.ingredientId] = true; });
    var ids = Object.keys(st.labelChecks || {}).sort(function (a, b) {
      return tagName("custom:" + a) < tagName("custom:" + b) ? -1 : 1;
    });
    h += '<section class="card" aria-labelledby="fam-labels-h"><h2 id="fam-labels-h">Label checks</h2>' +
      '<p class="small muted">Labels you\'ve checked stay confirmed. If you add a new package, we\'ll ask you to check it again.</p>';
    if (!ids.length) {
      h += "<p>No label checks yet. When you check a label on a meal, it's remembered here.</p>";
    } else {
      h += '<ul class="fam-labels">';
      ids.forEach(function (id) {
        var name = tagName("custom:" + id);
        h += '<li class="item"><div class="item__main"><strong>' + esc(name) + "</strong>" +
          '<div class="small muted">Checked ' + esc(fmtDate(st.labelChecks[id])) + "</div>";
        if (newPkg[id]) {
          h += '<p class="warning fam-warning"><span aria-hidden="true">!</span><span>This may be a different product. Please check its label.</span></p>' +
            '<button type="button" class="btn btn-secondary" data-action="reconfirm" data-id="' + esc(id) + '" aria-label="I checked the label on ' + esc(name) + '">I checked the label</button>';
        }
        h += "</div></li>";
      });
      h += "</ul>";
    }
    h += "</section>";

    // Budget
    h += '<section class="card" aria-labelledby="fam-budget-h"><h2 id="fam-budget-h">Weekly grocery budget</h2>' +
      '<form data-form="budget" class="row fam-budget" novalidate><label class="sr-only" for="fam-budget">Weekly budget in US dollars</label>' +
      '<span aria-hidden="true" class="fam-dollar">$</span><input type="number" id="fam-budget" min="0" step="1" inputmode="decimal" value="' + esc(st.budgetUSD) + '">' +
      '<button type="submit" class="btn btn-secondary">Save budget</button></form>' +
      (formError === "budget" ? '<p class="form-row error" role="alert">Enter a dollar amount of 0 or more.</p>' : "") +
      "</section>";

    // Reset
    h += '<section class="card" aria-labelledby="fam-reset-h"><h2 id="fam-reset-h">Demo data</h2>';
    if (confirmReset) {
      h += '<div class="fam-confirm" role="group" aria-label="Confirm reset"><p><strong>Reset everything?</strong> This clears your household, fridge, recipes, plan and label checks, and starts setup again.</p>' +
        '<div class="row"><button type="button" class="btn btn-secondary" data-action="reset-yes">Yes, reset demo data</button>' +
        '<button type="button" class="btn btn-text" data-action="reset-no">Cancel</button></div></div>';
    } else {
      h += '<p class="small muted">Start the prototype over from the beginning.</p>' +
        '<button type="button" class="btn btn-secondary" data-action="reset">Reset demo data</button>';
    }
    h += "</section>";
    h += '<p class="disclaimer">' + esc(DISCLAIMER) + "</p>";
    return h;
  }

  function saveProfiles(profiles, msg, extra) {
    var patch = extra || {};
    patch.profiles = profiles;
    try { SL.store.set(patch); }
    catch (e) { formError = "We couldn't save that."; refresh(); return false; }
    flash = msg || "";
    formError = "";
    return true;
  }

  /* ---------- events ---------- */

  function onClick(e) {
    var btn = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!btn) return;
    if (editorClick(btn)) return;
    var a = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    var st;
    formError = "";

    switch (a) {
      // setup
      case "ack": setupStep = "who"; refresh(); break;
      case "demo": finishSetup(copy(SL.data.profiles || [])); break;
      case "own": setupStep = "owner"; refresh(); break;
      case "back-who": setupStep = "who"; refresh(); break;
      case "edit-owner": setupStep = "owner"; refresh(); break;
      case "remove-draft": draftKids.splice(+btn.getAttribute("data-index"), 1); refresh(); break;
      case "finish": finishSetup([draftOwner].concat(draftKids)); break;
      case "to-fridge": SL.app.go("#/fridge"); break;

      // shared
      case "add-child":
        if (current.params.page === "setup") addingChild = true; else editing = "new-child";
        refresh("#fam-kid-name");
        break;
      case "cancel":
        addingChild = false; editing = null;
        refresh(current.params.page === "setup" ? "[data-action='add-child']" : null);
        break;

      // family
      case "edit": editing = id; confirmRemove = null; refresh("#fam-edit-name"); break;
      case "remove": confirmRemove = id; refresh("[data-action='remove-yes']"); break;
      case "remove-no": confirmRemove = null; refresh(); break;
      case "remove-yes":
        st = SL.store.get();
        var gone = null;
        var left = st.profiles.filter(function (p) {
          if (p.id === id && p.kind === "child") { gone = p; return false; }
          return true;
        });
        confirmRemove = null;
        if (gone) saveProfiles(left, "Removed " + gone.firstName + ".", {
          eaters: (st.eaters || []).filter(function (x) { return x !== id; })
        });
        refresh();
        break;
      case "reconfirm":
        st = SL.store.get();
        var checks = st.labelChecks || {};
        checks[id] = SL.util.today();
        var fridge = (st.fridge || []).map(function (f) {
          if (f.ingredientId === id) f.newPackage = false;
          return f;
        });
        SL.store.set({ labelChecks: checks, fridge: fridge });
        flash = "Label confirmed for " + tagName("custom:" + id) + ".";
        refresh();
        break;
      case "reset": confirmReset = true; refresh("[data-action='reset-yes']"); break;
      case "reset-no": confirmReset = false; refresh("[data-action='reset']"); break;
      case "reset-yes":
        confirmReset = false;
        setupStep = "disclaimer"; draftOwner = null; draftKids = []; addingChild = false;
        SL.store.reset();
        SL.app.go("#/setup");
        break;
    }
  }

  function onSubmit(e) {
    var form = e.target;
    if (!form || !form.getAttribute) return;
    e.preventDefault();
    var kind = form.getAttribute("data-form");
    formError = "";

    if (kind === "budget") {
      var raw = (form.querySelector("#fam-budget") || {}).value;
      var n = Number(raw);
      if (raw === "" || !isFinite(n) || n < 0) { formError = "budget"; refresh("#fam-budget"); return; }
      SL.store.set({ budgetUSD: Math.round(n * 100) / 100 });
      flash = "Budget saved.";
      refresh();
      return;
    }

    var p = readPerson(form);
    if (!p.firstName) {
      formError = "Please enter a first name.";
      rerenderFormWithError(form);
      return;
    }

    if (kind === "owner") {
      draftOwner = { id: "p-owner", firstName: p.firstName, kind: "adult", restrictions: p.restrictions };
      setupStep = "kids";
      refresh();
      return;
    }

    if (kind === "child" && current.params.page === "setup") {
      draftKids.push({ id: SL.util.newId("p"), firstName: p.firstName, kind: "child", restrictions: p.restrictions });
      addingChild = false;
      refresh("[data-action='add-child']");
      return;
    }

    var st = SL.store.get();
    if (kind === "child") {
      var kid = { id: SL.util.newId("p"), firstName: p.firstName, kind: "child", restrictions: p.restrictions };
      var eaters = (st.eaters || []).concat([kid.id]);
      editing = null;
      saveProfiles(st.profiles.concat([kid]), "Added " + kid.firstName + ".", { eaters: eaters });
      refresh();
      return;
    }

    if (kind === "edit") {
      var id = form.getAttribute("data-id");
      var profiles = st.profiles.map(function (x) {
        if (x.id !== id) return x;
        // Only name + restrictions change; kind and id never do.
        return { id: x.id, firstName: p.firstName, kind: x.kind, restrictions: p.restrictions };
      });
      editing = null;
      saveProfiles(profiles, "Saved " + p.firstName + ".");
      refresh();
    }
  }

  /* Show the name error without losing the restriction choices on the form. */
  function rerenderFormWithError(form) {
    var nameInput = form.querySelector('[name="firstName"]');
    var row = nameInput.parentNode;
    var errId = nameInput.id + "-err";
    var old = row.querySelector(".error");
    if (!old) {
      old = document.createElement("p");
      old.className = "error";
      old.id = errId;
      row.appendChild(old);
    }
    old.textContent = formError;
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.setAttribute("aria-describedby", errId);
    formError = "";
    nameInput.focus();
  }

  return {
    render: render,
    tagName: tagName,
    restrictionText: restrictionText,
    DISCLAIMER: DISCLAIMER,
    ALLERGENS: ALLERGENS,
    DIETS: DIETS
  };
})();
