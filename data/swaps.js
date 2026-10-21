/* Shelf Life mock data: safe swaps. Owner: Makissa.
   from/to share a unit. Order matters: checkMeal uses the first swap that covers every failing tag. */
window.SL = window.SL || {}; SL.data = SL.data || {};

SL.data.swaps = [
  { from: "soy-sauce",       to: "gf-tamari",        fixes: ["wheat", "gluten"], note: "Use certified gluten-free tamari." },
  { from: "pasta",           to: "gf-pasta",         fixes: ["wheat", "gluten"], note: "Use gluten-free spaghetti; cook it a minute less." },
  { from: "bread",           to: "gf-bread",         fixes: ["wheat", "gluten"], note: "Use gluten-free bread." },
  { from: "flour-tortillas", to: "corn-tortillas",   fixes: ["wheat", "gluten"], note: "Use corn tortillas. Check the label for shared equipment." },
  { from: "pesto",           to: "nut-free-pesto",   fixes: ["tree-nuts"],       note: "Use a nut-free pesto." },
  { from: "peanut-butter",   to: "sunflower-butter", fixes: ["peanuts"],         note: "Use sunflower seed butter." },
  { from: "cheddar",         to: "oat-milk-cheese",  fixes: ["milk"],            note: "Use dairy-free cheese shreds." },
  { from: "milk",            to: "oat-milk",         fixes: ["milk"],            note: "Use oat milk." },
  { from: "butter",          to: "olive-oil",        fixes: ["milk"],            note: "Use olive oil instead of butter." }
];
