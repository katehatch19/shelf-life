/* js/util.js (Kate): shared helpers. Definitions only, nothing runs at load time.
   Dates are always LOCAL "YYYY-MM-DD". Never use toISOString() (it is UTC). */
window.SL = window.SL || {};

SL.util = (function () {
  var idCounter = 0;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* Date object -> local "YYYY-MM-DD". */
  function dateStr(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  /* "YYYY-MM-DD" -> Date at local noon (noon avoids DST edge cases). */
  function parse(s) {
    var p = String(s).slice(0, 10).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }

  /* Today's local date. Tests may set SL.util._today = "2026-10-21". */
  function today() {
    return SL.util._today ? String(SL.util._today) : dateStr(new Date());
  }

  /* Monday on or before the given date ("YYYY-MM-DD"). */
  function mondayOf(s) {
    var d = parse(s);
    var back = (d.getDay() + 6) % 7; // Sun=6, Mon=0, Tue=1...
    d.setDate(d.getDate() - back);
    return dateStr(d);
  }

  /* Whole days from a to b (b − a). Both "YYYY-MM-DD". */
  function daysBetween(a, b) {
    var pa = String(a).slice(0, 10).split("-"), pb = String(b).slice(0, 10).split("-");
    var ua = Date.UTC(+pa[0], +pa[1] - 1, +pa[2]);
    var ub = Date.UTC(+pb[0], +pb[1] - 1, +pb[2]);
    return Math.round((ub - ua) / 86400000);
  }

  /* Add n days to a "YYYY-MM-DD" date. */
  function addDays(s, n) {
    var d = parse(s);
    d.setDate(d.getDate() + n);
    return dateStr(d);
  }

  /* shelfDays − (today − addedOn). null if the ingredient is unknown. */
  function daysLeft(item) {
    var ings = (SL.data && SL.data.ingredients) || {};
    var ing = item && ings[item.ingredientId];
    if (!ing || typeof ing.shelfDays !== "number") return null;
    return ing.shelfDays - daysBetween(item.addedOn || today(), today());
  }

  /* Unique id for user-created things, e.g. newId("r") -> "r-u-lq3k9x2". */
  function newId(prefix) {
    idCounter += 1;
    var rand = Math.floor(Math.random() * 1296).toString(36);
    return (prefix || "x") + "-u-" + Date.now().toString(36) + rand + idCounter.toString(36);
  }

  /* Escape text for safe insertion into HTML. */
  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* The ONLY badge markup in the app (CLAUDE.md 2.13). Text + aria-hidden icon.
     names (optional, unsafe only): first names, giving "Not safe for Jordan and Sam". */
  function badgeHTML(check, names) {
    var b = check && check.badge;
    var icon, text;
    if (b === "safe") { icon = "✓"; text = "Safe"; }
    else if (b === "label") { icon = "!"; text = "Safe after a label check"; }
    else if (b === "fixable") {
      icon = "↻";
      text = "Safe for " + (check.safeCount || 0) + " of " + (check.total || 0) + " with a fix";
    } else {
      b = "unsafe"; icon = "✕"; text = "Not safe";
      if (names && names.length) text += " for " + joinNames(names);
    }
    return '<span class="badge badge--' + b + '">' +
      '<span class="badge__icon" aria-hidden="true">' + icon + "</span>" +
      '<span class="badge__text">' + esc(text) + "</span></span>";
  }

  function joinNames(n) {
    if (n.length <= 1) return n.join("");
    return n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
  }

  var FRACTIONS = { 0: "", 0.25: "¼", 0.5: "½", 0.75: "¾" };
  var PLURAL = { cup: "cups", slice: "slices", clove: "cloves" };

  /* Display rounding per CLAUDE.md 4.1:
     tsp/tbsp/cup -> nearest ¼ as fractions; each/slice/clove -> nearest ½;
     oz/lb -> one decimal. A positive amount never shows as 0 (it shows the
     smallest step). Returns "1½ tbsp", "2 cups", "3" (unit "each" is omitted). */
  function fmtAmount(amount, unit) {
    var a = Number(amount) || 0;
    var num;
    if (unit === "tsp" || unit === "tbsp" || unit === "cup") {
      num = fracStr(roundStep(a, 0.25));
    } else if (unit === "each" || unit === "slice" || unit === "clove") {
      num = fracStr(roundStep(a, 0.5));
    } else {
      var r = Math.round(a * 10) / 10;
      if (r === 0 && a > 0) r = 0.1;
      num = String(r);
    }
    if (!unit || unit === "each") return num;
    var u = unit;
    if (PLURAL[unit] && parseFloat(roundStep(a, 0.25)) > 1) u = PLURAL[unit];
    return num + " " + u;
  }

  function roundStep(a, step) {
    var r = Math.round(a / step) * step;
    if (r === 0 && a > 0) r = step;
    return r;
  }

  function fracStr(r) {
    var whole = Math.floor(r);
    var frac = FRACTIONS[Math.round((r - whole) * 100) / 100] || "";
    if (whole === 0 && frac) return frac;
    return whole + frac;
  }

  return {
    _today: null,
    today: today,
    dateStr: dateStr,
    mondayOf: mondayOf,
    daysBetween: daysBetween,
    addDays: addDays,
    daysLeft: daysLeft,
    newId: newId,
    esc: esc,
    badgeHTML: badgeHTML,
    fmtAmount: fmtAmount
  };
})();
