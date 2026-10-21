/* Shelf Life mock data: sample fridge "photos" for the mock scan. Owner: Kate.
   unsure: true items show dashed and must be confirmed or removed.
   On scan, addedOn = today - ageDays; days left = shelfDays - ageDays. */
window.SL = window.SL || {}; SL.data = SL.data || {};

SL.data.fridges = [
  { id: "fridge-a", label: "Weeknight fridge", emoji: "🍗🥦🍚",
    items: [
      { ingredientId: "chicken-breast", ageDays: 1,  unsure: false },  // 1 day left
      { ingredientId: "broccoli",       ageDays: 2,  unsure: false },
      { ingredientId: "bell-pepper",    ageDays: 3,  unsure: false },
      { ingredientId: "white-rice",     ageDays: 30, unsure: false },
      { ingredientId: "soy-sauce",      ageDays: 40, unsure: true  },  // dashed
      { ingredientId: "chicken-broth",  ageDays: 1,  unsure: false },
      { ingredientId: "carrot",         ageDays: 5,  unsure: false },
      { ingredientId: "onion",          ageDays: 6,  unsure: false },
      { ingredientId: "spinach",        ageDays: 4,  unsure: false },  // 1 day left
      { ingredientId: "cheddar",        ageDays: 10, unsure: false },
      { ingredientId: "salsa",          ageDays: 3,  unsure: false },
      { ingredientId: "avocado",        ageDays: 2,  unsure: false },  // 2 days left
      { ingredientId: "eggs",           ageDays: 3,  unsure: false },
      { ingredientId: "rolled-oats",    ageDays: 20, unsure: true  },  // dashed
      { ingredientId: "milk",           ageDays: 2,  unsure: false },
      { ingredientId: "strawberries",   ageDays: 1,  unsure: false }
    ] },
  { id: "fridge-b", label: "Weekend brunch fridge", emoji: "🥓🍓🍞",
    items: [
      { ingredientId: "eggs",           ageDays: 6,  unsure: false },
      { ingredientId: "bread",          ageDays: 2,  unsure: true  },  // dashed
      { ingredientId: "milk",           ageDays: 4,  unsure: false },
      { ingredientId: "butter",         ageDays: 15, unsure: false },
      { ingredientId: "strawberries",   ageDays: 3,  unsure: false },  // 1 day left
      { ingredientId: "greek-yogurt",   ageDays: 5,  unsure: false },
      { ingredientId: "granola",        ageDays: 10, unsure: false },
      { ingredientId: "pork-sausage",   ageDays: 2,  unsure: false },
      { ingredientId: "potato",         ageDays: 8,  unsure: false },
      { ingredientId: "bell-pepper",    ageDays: 4,  unsure: false },
      { ingredientId: "spinach",        ageDays: 2,  unsure: false },
      { ingredientId: "cheddar",        ageDays: 12, unsure: false },
      { ingredientId: "banana",         ageDays: 3,  unsure: false },
      { ingredientId: "peanut-butter",  ageDays: 30, unsure: false },
      { ingredientId: "ground-beef",    ageDays: 1,  unsure: false },  // 1 day left
      { ingredientId: "flour-tortillas",ageDays: 6,  unsure: false },
      { ingredientId: "tomato",         ageDays: 2,  unsure: false },
      { ingredientId: "romaine",        ageDays: 2,  unsure: false }
    ] },
  { id: "fridge-c", label: "Pasta night fridge", emoji: "🍝🦐🍋",
    items: [
      { ingredientId: "pasta",          ageDays: 60, unsure: false },
      { ingredientId: "pesto",          ageDays: 3,  unsure: true  },  // dashed
      { ingredientId: "parmesan",       ageDays: 20, unsure: false },
      { ingredientId: "shrimp",         ageDays: 1,  unsure: false },  // 1 day left
      { ingredientId: "lemon",          ageDays: 5,  unsure: false },
      { ingredientId: "white-wine",     ageDays: 2,  unsure: false },
      { ingredientId: "butter",         ageDays: 10, unsure: false },
      { ingredientId: "zucchini",       ageDays: 4,  unsure: false },
      { ingredientId: "tomato",         ageDays: 3,  unsure: false },
      { ingredientId: "spinach",        ageDays: 3,  unsure: false },
      { ingredientId: "salmon",         ageDays: 1,  unsure: false },
      { ingredientId: "tofu",           ageDays: 2,  unsure: false },
      { ingredientId: "bell-pepper",    ageDays: 2,  unsure: false },
      { ingredientId: "broccoli",       ageDays: 3,  unsure: false },
      { ingredientId: "white-rice",     ageDays: 40, unsure: false }
    ] }
];
