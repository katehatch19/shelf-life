/* js/app.js (Kate): hash router, tab bar, boot. Loaded LAST.
   Screens register as SL.screens.<name> = { render(container, params) }.
   render is called on route change only, never on store changes. */
window.SL = window.SL || {};
SL.screens = SL.screens || {};

SL.app = (function () {
  var PAGES = { setup: "family", family: "family", fridge: "fridge", meals: "meals", recipes: "recipes", list: "list" };
  var TITLES = { setup: "Welcome", family: "Family", fridge: "Fridge", meals: "Meals", recipes: "Recipes", list: "List" };

  function parse(hash) {
    var h = String(hash || "").replace(/^#?\/?/, "");
    var segs = h.split("/").filter(function (s) { return s !== ""; }).map(function (s) {
      try { return decodeURIComponent(s); } catch (e) { return s; }
    });
    return { page: segs[0] || "", parts: segs.slice(1) };
  }

  function norm(route) {
    var r = String(route || "").replace(/^#?\/?/, "");
    return "#/" + r;
  }

  function hasProfiles() {
    try { return SL.store.get().profiles.length > 0; } catch (e) { return false; }
  }

  /* Where should this hash really go? Returns a hash to redirect to, or null. */
  function redirectFor(r) {
    var profiles = hasProfiles();
    if (!profiles && r.page !== "setup") return "#/setup";
    if (!PAGES[r.page]) return profiles ? "#/fridge" : "#/setup";
    if (r.page === "list" && r.parts.length === 0) return "#/list/grocery";
    return null;
  }

  function updateTabs(page) {
    var bar = document.getElementById("tabbar");
    if (!bar) return;
    bar.hidden = page === "setup";
    var tabs = bar.querySelectorAll("[data-tab]");
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute("data-tab") === page) tabs[i].setAttribute("aria-current", "page");
      else tabs[i].removeAttribute("aria-current");
    }
    document.body.classList.toggle("no-tabbar", page === "setup");
  }

  function comingSoon(container, page) {
    var name = TITLES[page] || "This screen";
    container.innerHTML =
      '<section class="card coming-soon">' +
      "<h1>" + SL.util.esc(name) + "</h1>" +
      "<p>Coming soon. This part of the prototype isn't built yet.</p>" +
      "</section>";
  }

  function focusHeading(container) {
    var h = container.querySelector("h1") || container.querySelector("h2");
    var target = h || container;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    window.scrollTo(0, 0);
  }

  function route() {
    var r = parse(window.location.hash);
    var to = redirectFor(r);
    if (to) {
      if (window.location.hash !== to) { window.location.replace(to); return; }
      r = parse(to);
    }
    var container = document.getElementById("app");
    if (!container) return;
    updateTabs(r.page);
    document.title = (TITLES[r.page] || "Shelf Life") + " · Shelf Life";

    var screen = SL.screens[PAGES[r.page]];
    container.innerHTML = "";
    if (screen && typeof screen.render === "function") {
      try {
        screen.render(container, { page: r.page, parts: r.parts });
      } catch (e) {
        if (window.console) console.error("Screen failed to render:", e);
        container.innerHTML = '<section class="card"><h1>Something went wrong</h1>' +
          "<p>This screen couldn't load. Try another tab.</p></section>";
      }
    } else {
      comingSoon(container, r.page);
    }
    focusHeading(container);
  }

  /* Navigate. Accepts "#/fridge", "/fridge" or "fridge". Re-renders if already there. */
  function go(target) {
    var h = norm(target);
    if (window.location.hash === h) route();
    else window.location.hash = h;
  }

  function boot() {
    try { SL.store.rollWeek(); } catch (e) { if (window.console) console.error(e); }
    window.addEventListener("hashchange", route);
    route();
  }

  document.addEventListener("DOMContentLoaded", boot);

  return { go: go, _parse: parse, _route: route };
})();
