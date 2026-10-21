/* Shelf Life mock data: the demo household. Owner: Kate.
   Loaded by "Use the demo household" on setup. Only p-owner is an adult. */
window.SL = window.SL || {}; SL.data = SL.data || {};

SL.data.profiles = [
  { id: "p-owner", firstName: "Alex", kind: "adult",
    restrictions: [ { tag: "high-protein", level: "avoid" } ] },
  { id: "p-jordan", firstName: "Jordan", kind: "child",
    restrictions: [ { tag: "gluten", level: "strict" } ] },
  { id: "p-kid", firstName: "Sam", kind: "child",
    restrictions: [ { tag: "peanuts", level: "strict" }, { tag: "tree-nuts", level: "strict" } ] }
];
