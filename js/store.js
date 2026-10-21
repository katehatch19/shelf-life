/* js/store.js (Kate): the only place that touches localStorage ("shelflife.v1").
   Definitions only: state is loaded lazily on the first get()/set().
   Every storage read/write is wrapped in try/catch; if storage is blocked the
   app keeps working from memory and just forgets on reload.

   Profile rule (CLAUDE.md 2.23): set() THROWS an Error (and changes nothing)
   when given a profiles array with more than one kind:"adult" profile, or an
   adult whose id isn't "p-owner". Throwing makes the bug loud for the caller. */
window.SL = window.SL || {};

SL.store = (function () {
  var KEY = "shelflife.v1";
  var VERSION = 1;
  var state = null;       // in-memory copy (also the fallback when storage is blocked)
  var listeners = [];

  function copy(x) { return JSON.parse(JSON.stringify(x)); }

  function fresh() {
    return {
      version: VERSION,
      profiles: [],
      fridge: [],
      scans: [],
      labelChecks: {},
      recipes: [],
      savedRecipeIds: [],
      recipeOverrides: {},
      plan: {},
      weekStart: SL.util.mondayOf(SL.util.today()),
      budgetUSD: 120,
      eaters: [],
      reports: []
    };
  }

  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (isObj(parsed) && parsed.version === VERSION) {
          var base = fresh();
          for (var k in parsed) if (Object.prototype.hasOwnProperty.call(parsed, k)) base[k] = parsed[k];
          return base;
        }
      } catch (e2) { /* bad JSON: fall through to fresh */ }
    }
    return fresh();
  }

  function ensure() { if (!state) state = load(); return state; }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* storage unavailable: memory only */ }
  }

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](copy(state)); }
      catch (e) { if (window.console) console.error("store listener failed", e); }
    }
  }

  function checkProfiles(profiles) {
    if (!Array.isArray(profiles)) throw new Error("SL.store.set: profiles must be an array");
    var adults = profiles.filter(function (p) { return p && p.kind === "adult"; });
    if (adults.length > 1) {
      throw new Error("SL.store.set: only one adult profile (the owner) is allowed");
    }
    if (adults.length === 1 && adults[0].id !== "p-owner") {
      throw new Error('SL.store.set: the adult profile must have id "p-owner"');
    }
  }

  /* Deep copy of the current state. */
  function get() { return copy(ensure()); }

  /* Shallow-merge top-level keys, save, notify. Pass whole nested objects. */
  function set(patch) {
    ensure();
    if (!isObj(patch)) return copy(state);
    if (Object.prototype.hasOwnProperty.call(patch, "profiles")) checkProfiles(patch.profiles);
    var p = copy(patch);
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) state[k] = p[k];
    state.version = VERSION;
    save();
    notify();
    return copy(state);
  }

  /* Back to the fresh first-run state (empty profiles -> setup). */
  function reset() {
    state = fresh();
    save();
    notify();
    return copy(state);
  }

  /* fn(state) on every set/reset. Returns an unsubscribe function. */
  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  /* New week (CLAUDE.md 4.2): if the current Monday != weekStart, set weekStart
     and drop plan days before it. Called by app.js on boot. Returns true if it
     changed anything. */
  function rollWeek() {
    ensure();
    var monday = SL.util.mondayOf(SL.util.today());
    if (state.weekStart === monday) return false;
    var plan = {};
    var old = state.plan || {};
    for (var day in old) {
      if (Object.prototype.hasOwnProperty.call(old, day) && day >= monday) plan[day] = old[day];
    }
    set({ weekStart: monday, plan: plan });
    return true;
  }

  return { KEY: KEY, get: get, set: set, reset: reset, subscribe: subscribe, rollWeek: rollWeek, fresh: fresh };
})();
