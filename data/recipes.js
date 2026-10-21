/* Shelf Life mock data: seed recipes + canned import results. Owner: Eleanor.
   AI recipes are canned entries (no real AI). Every line's unit matches its ingredient's unit. */
window.SL = window.SL || {}; SL.data = SL.data || {};

SL.data.recipes = [
  /* ---------- Dinner / lunch ---------- */
  { id: "r-chicken-stir-fry", title: "Chicken and broccoli stir-fry",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["lunch", "dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Weeknights", tags: ["quick", "high-protein"],
    ingredients: [
      { ingredientId: "chicken-breast", amount: 1,   unit: "lb" },
      { ingredientId: "broccoli",       amount: 3,   unit: "cup" },
      { ingredientId: "bell-pepper",    amount: 1,   unit: "each" },
      { ingredientId: "white-rice",     amount: 1.5, unit: "cup" },
      { ingredientId: "soy-sauce",      amount: 3,   unit: "tbsp" },
      { ingredientId: "garlic",         amount: 3,   unit: "clove" },
      { ingredientId: "sesame-oil",     amount: 2,   unit: "tsp" }
    ],
    steps: [
      "Cook the rice according to the package.",
      "Cut the chicken into bite-size pieces and slice the bell pepper.",
      "Heat the sesame oil in a large skillet over medium-high heat. Cook the chicken 5 to 6 minutes until no longer pink.",
      "Add the broccoli, pepper and minced garlic. Stir-fry 4 minutes.",
      "Stir in the soy sauce and serve over rice."
    ] },

  { id: "r-burrito-bowl", title: "Chicken burrito bowls",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["lunch", "dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Weeknights", tags: ["kid-friendly", "high-protein"],
    ingredients: [
      { ingredientId: "chicken-breast", amount: 1,   unit: "lb" },
      { ingredientId: "white-rice",     amount: 1.5, unit: "cup" },
      { ingredientId: "black-beans",    amount: 1.5, unit: "cup" },
      { ingredientId: "salsa",          amount: 8,   unit: "tbsp" },
      { ingredientId: "avocado",        amount: 1,   unit: "each" },
      { ingredientId: "cheddar",        amount: 3,   unit: "oz" },
      { ingredientId: "lime",           amount: 1,   unit: "each" },
      { ingredientId: "cumin",          amount: 2,   unit: "tsp" },
      { ingredientId: "salt",           amount: 1,   unit: "tsp" }
    ],
    steps: [
      "Cook the rice and stir in the juice of half the lime.",
      "Season the chicken with cumin and salt. Cook in a skillet 6 to 7 minutes per side, then slice.",
      "Warm the black beans.",
      "Fill bowls with rice, beans and chicken. Top with salsa, sliced avocado, cheddar and a lime wedge."
    ] },

  { id: "r-chicken-rice-soup", title: "Chicken and rice soup",
    source: { type: "imported", label: "Imported from cozyskillet.example", url: "https://cozyskillet.example/chicken-rice-soup" },
    mealTypes: ["lunch", "dinner"], baseServings: 6, makesLeftovers: true,
    folder: "Soups", tags: ["comfort", "freezer-friendly"],
    ingredients: [
      { ingredientId: "chicken-breast", amount: 1,    unit: "lb" },
      { ingredientId: "chicken-broth",  amount: 8,    unit: "cup" },
      { ingredientId: "carrot",         amount: 3,    unit: "each" },
      { ingredientId: "onion",          amount: 1,    unit: "each" },
      { ingredientId: "white-rice",     amount: 0.75, unit: "cup" },
      { ingredientId: "spinach",        amount: 2,    unit: "cup" },
      { ingredientId: "garlic",         amount: 2,    unit: "clove" },
      { ingredientId: "salt",           amount: 1,    unit: "tsp" },
      { ingredientId: "black-pepper",   amount: 0.5,  unit: "tsp" }
    ],
    steps: [
      "Dice the onion and carrots and mince the garlic.",
      "Simmer the broth, vegetables and whole chicken breasts for 20 minutes.",
      "Remove the chicken, shred it and return it to the pot with the rice.",
      "Simmer 15 minutes more until the rice is tender. Stir in the spinach, then season with salt and pepper."
    ] },

  { id: "r-spinach-quesadillas", title: "Cheesy spinach quesadillas",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["lunch", "dinner"], baseServings: 4, makesLeftovers: false,
    folder: "Kid favorites", tags: ["quick", "vegetarian"],
    ingredients: [
      { ingredientId: "flour-tortillas", amount: 4, unit: "each" },
      { ingredientId: "cheddar",         amount: 4, unit: "oz" },
      { ingredientId: "spinach",         amount: 2, unit: "cup" },
      { ingredientId: "salsa",           amount: 4, unit: "tbsp" },
      { ingredientId: "olive-oil",       amount: 1, unit: "tbsp" }
    ],
    steps: [
      "Wilt the spinach in a dry skillet, then set aside.",
      "Fill half of each tortilla with cheese and spinach and fold.",
      "Brush the skillet with oil and cook each quesadilla 2 to 3 minutes per side until golden.",
      "Cut into wedges and serve with salsa."
    ] },

  { id: "r-beef-tacos", title: "Ground beef tacos",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["dinner"], baseServings: 4, makesLeftovers: false,
    folder: "Weeknights", tags: ["kid-friendly"],
    ingredients: [
      { ingredientId: "ground-beef",     amount: 1, unit: "lb" },
      { ingredientId: "flour-tortillas", amount: 8, unit: "each" },
      { ingredientId: "taco-seasoning",  amount: 2, unit: "tbsp" },
      { ingredientId: "cheddar",         amount: 2, unit: "oz" },
      { ingredientId: "romaine",         amount: 2, unit: "cup" },
      { ingredientId: "tomato",          amount: 1, unit: "each" },
      { ingredientId: "salsa",           amount: 4, unit: "tbsp" }
    ],
    steps: [
      "Brown the beef in a skillet and drain the fat.",
      "Stir in the taco seasoning and 1/3 cup water. Simmer 5 minutes.",
      "Warm the tortillas. Shred the lettuce and dice the tomato.",
      "Fill the tortillas with beef, cheese, lettuce, tomato and salsa."
    ] },

  { id: "r-pesto-pasta", title: "Pesto pasta with spinach and tomatoes",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["lunch", "dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Weeknights", tags: ["quick", "vegetarian"],
    ingredients: [
      { ingredientId: "pasta",    amount: 12, unit: "oz" },
      { ingredientId: "pesto",    amount: 6,  unit: "tbsp" },
      { ingredientId: "parmesan", amount: 1,  unit: "oz" },
      { ingredientId: "tomato",   amount: 2,  unit: "each" },
      { ingredientId: "spinach",  amount: 2,  unit: "cup" },
      { ingredientId: "salt",     amount: 1,  unit: "tsp" }
    ],
    steps: [
      "Boil the pasta in salted water until al dente. Save 1/2 cup of the water.",
      "Toss the hot pasta with the spinach until it wilts.",
      "Stir in the pesto and a splash of pasta water.",
      "Top with diced tomatoes and grated parmesan."
    ] },

  { id: "r-shrimp-scampi", title: "Lemon garlic shrimp scampi",
    source: { type: "imported", label: "Imported from coastalkitchen.example", url: "https://coastalkitchen.example/shrimp-scampi" },
    mealTypes: ["dinner"], baseServings: 4, makesLeftovers: false,
    folder: "Date night", tags: ["seafood"],
    ingredients: [
      { ingredientId: "pasta",        amount: 8,   unit: "oz" },
      { ingredientId: "shrimp",       amount: 1,   unit: "lb" },
      { ingredientId: "butter",       amount: 3,   unit: "tbsp" },
      { ingredientId: "garlic",       amount: 4,   unit: "clove" },
      { ingredientId: "lemon",        amount: 1,   unit: "each" },
      { ingredientId: "white-wine",   amount: 0.5, unit: "cup" },
      { ingredientId: "parmesan",     amount: 1,   unit: "oz" },
      { ingredientId: "black-pepper", amount: 0.5, unit: "tsp" }
    ],
    steps: [
      "Cook the pasta until al dente.",
      "Melt the butter in a skillet and cook the minced garlic 1 minute.",
      "Add the shrimp and cook 2 minutes per side. Pour in the wine and lemon juice and simmer 2 minutes.",
      "Toss with the pasta, parmesan and pepper."
    ] },

  { id: "r-almond-salmon", title: "Almond-crusted salmon with broccoli",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["dinner"], baseServings: 4, makesLeftovers: false,
    folder: "Date night", tags: ["high-protein"],
    ingredients: [
      { ingredientId: "salmon",    amount: 1, unit: "lb" },
      { ingredientId: "almonds",   amount: 2, unit: "oz" },
      { ingredientId: "lemon",     amount: 1, unit: "each" },
      { ingredientId: "broccoli",  amount: 2, unit: "cup" },
      { ingredientId: "olive-oil", amount: 1, unit: "tbsp" },
      { ingredientId: "salt",      amount: 1, unit: "tsp" }
    ],
    steps: [
      "Heat the oven to 400°F. Finely chop the almonds.",
      "Brush the salmon with oil, season with salt and press the almonds on top.",
      "Roast the salmon and broccoli on one sheet pan for 12 to 15 minutes.",
      "Squeeze lemon over everything before serving."
    ] },

  { id: "r-lemon-salmon-rice", title: "Lemon salmon with spinach rice",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["dinner"], baseServings: 4, makesLeftovers: false,
    folder: "Weeknights", tags: ["high-protein"],
    ingredients: [
      { ingredientId: "salmon",     amount: 1, unit: "lb" },
      { ingredientId: "white-rice", amount: 1, unit: "cup" },
      { ingredientId: "lemon",      amount: 1, unit: "each" },
      { ingredientId: "spinach",    amount: 3, unit: "cup" },
      { ingredientId: "olive-oil",  amount: 1, unit: "tbsp" },
      { ingredientId: "garlic",     amount: 2, unit: "clove" },
      { ingredientId: "salt",       amount: 1, unit: "tsp" }
    ],
    steps: [
      "Cook the rice. Stir in the spinach while it's hot so it wilts.",
      "Season the salmon with salt and minced garlic.",
      "Sear the salmon in oil 4 minutes per side.",
      "Finish with lemon juice and serve over the rice."
    ] },

  { id: "r-tofu-veggie-stir-fry", title: "Tofu and veggie stir-fry",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["lunch", "dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Meatless", tags: ["vegetarian", "quick"],
    ingredients: [
      { ingredientId: "tofu",        amount: 14,  unit: "oz" },
      { ingredientId: "broccoli",    amount: 2,   unit: "cup" },
      { ingredientId: "bell-pepper", amount: 1,   unit: "each" },
      { ingredientId: "zucchini",    amount: 1,   unit: "each" },
      { ingredientId: "white-rice",  amount: 1.5, unit: "cup" },
      { ingredientId: "soy-sauce",   amount: 3,   unit: "tbsp" },
      { ingredientId: "sesame-oil",  amount: 2,   unit: "tsp" },
      { ingredientId: "garlic",      amount: 2,   unit: "clove" }
    ],
    steps: [
      "Cook the rice. Press the tofu and cut it into cubes.",
      "Brown the tofu in sesame oil, about 8 minutes, then set aside.",
      "Stir-fry the broccoli, pepper, zucchini and garlic for 5 minutes.",
      "Return the tofu, add the soy sauce and serve over rice."
    ] },

  /* ---------- Breakfast ---------- */
  { id: "r-veggie-omelet", title: "Spinach and pepper omelet",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["breakfast", "dinner"], baseServings: 2, makesLeftovers: false,
    folder: "Breakfast", tags: ["quick", "vegetarian", "high-protein"],
    ingredients: [
      { ingredientId: "eggs",        amount: 4,    unit: "each" },
      { ingredientId: "spinach",     amount: 1,    unit: "cup" },
      { ingredientId: "bell-pepper", amount: 0.5,  unit: "each" },
      { ingredientId: "cheddar",     amount: 1,    unit: "oz" },
      { ingredientId: "butter",      amount: 1,    unit: "tbsp" },
      { ingredientId: "salt",        amount: 0.25, unit: "tsp" }
    ],
    steps: [
      "Whisk the eggs with the salt.",
      "Melt the butter in a nonstick pan and soften the diced pepper and spinach.",
      "Pour in the eggs and cook until almost set.",
      "Sprinkle on the cheddar, fold and serve."
    ] },

  { id: "r-sausage-hash", title: "Sausage and potato breakfast hash",
    source: { type: "imported", label: "Imported from farmhousetable.example", url: "https://farmhousetable.example/sausage-hash" },
    mealTypes: ["breakfast", "dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Breakfast", tags: ["one-pan"],
    ingredients: [
      { ingredientId: "potato",       amount: 3,   unit: "each" },
      { ingredientId: "pork-sausage", amount: 6,   unit: "each" },
      { ingredientId: "eggs",         amount: 4,   unit: "each" },
      { ingredientId: "onion",        amount: 1,   unit: "each" },
      { ingredientId: "bell-pepper",  amount: 1,   unit: "each" },
      { ingredientId: "olive-oil",    amount: 2,   unit: "tbsp" },
      { ingredientId: "salt",         amount: 1,   unit: "tsp" },
      { ingredientId: "black-pepper", amount: 0.5, unit: "tsp" }
    ],
    steps: [
      "Dice the potatoes, onion and pepper. Slice the sausage.",
      "Cook the potatoes in oil over medium heat for 12 minutes, stirring now and then.",
      "Add the sausage, onion and pepper and cook 8 minutes more.",
      "Make 4 wells, crack in the eggs, cover and cook until set. Season and serve."
    ] },

  { id: "r-overnight-oats", title: "Strawberry overnight oats",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["breakfast"], baseServings: 2, makesLeftovers: false,
    folder: "Breakfast", tags: ["make-ahead", "no-cook"],
    ingredients: [
      { ingredientId: "rolled-oats",  amount: 1,   unit: "cup" },
      { ingredientId: "milk",         amount: 1,   unit: "cup" },
      { ingredientId: "greek-yogurt", amount: 0.5, unit: "cup" },
      { ingredientId: "strawberries", amount: 1,   unit: "cup" },
      { ingredientId: "honey",        amount: 1,   unit: "tbsp" }
    ],
    steps: [
      "Stir the oats, milk, yogurt and honey together in two jars.",
      "Top with sliced strawberries.",
      "Cover and refrigerate overnight. Eat cold."
    ] },

  { id: "r-french-toast", title: "Classic French toast",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["breakfast"], baseServings: 4, makesLeftovers: false,
    folder: "Breakfast", tags: ["weekend", "kid-friendly"],
    ingredients: [
      { ingredientId: "bread",       amount: 8,    unit: "slice" },
      { ingredientId: "eggs",        amount: 3,    unit: "each" },
      { ingredientId: "milk",        amount: 0.75, unit: "cup" },
      { ingredientId: "butter",      amount: 2,    unit: "tbsp" },
      { ingredientId: "maple-syrup", amount: 4,    unit: "tbsp" },
      { ingredientId: "salt",        amount: 0.25, unit: "tsp" }
    ],
    steps: [
      "Whisk the eggs, milk and salt in a shallow dish.",
      "Dip each slice of bread for a few seconds per side.",
      "Cook in butter over medium heat, 2 to 3 minutes per side.",
      "Serve with maple syrup."
    ] },

  /* ---------- Snacks ---------- */
  { id: "r-yogurt-parfait", title: "Berry yogurt parfait",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["breakfast", "snack"], baseServings: 2, makesLeftovers: false,
    folder: "Snacks", tags: ["no-cook", "quick"],
    ingredients: [
      { ingredientId: "greek-yogurt", amount: 1.5, unit: "cup" },
      { ingredientId: "granola",      amount: 0.5, unit: "cup" },
      { ingredientId: "strawberries", amount: 1,   unit: "cup" },
      { ingredientId: "honey",        amount: 1,   unit: "tbsp" }
    ],
    steps: [
      "Layer yogurt, sliced strawberries and granola in two glasses.",
      "Drizzle with honey and serve right away so the granola stays crunchy."
    ] },

  { id: "r-pb-banana-toast", title: "Peanut butter banana toast",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["breakfast", "snack"], baseServings: 2, makesLeftovers: false,
    folder: "Kid favorites", tags: ["quick"],
    ingredients: [
      { ingredientId: "bread",         amount: 2, unit: "slice" },
      { ingredientId: "peanut-butter", amount: 2, unit: "tbsp" },
      { ingredientId: "banana",        amount: 1, unit: "each" }
    ],
    steps: [
      "Toast the bread.",
      "Spread with peanut butter and top with banana slices."
    ] },

  { id: "r-hummus-veggie-plate", title: "Hummus and crunchy veggie plate",
    source: { type: "ai", label: "AI-generated" },
    mealTypes: ["snack"], baseServings: 4, makesLeftovers: false,
    folder: "Snacks", tags: ["no-cook", "vegan"],
    ingredients: [
      { ingredientId: "hummus",      amount: 8, unit: "tbsp" },
      { ingredientId: "carrot",      amount: 2, unit: "each" },
      { ingredientId: "cucumber",    amount: 1, unit: "each" },
      { ingredientId: "bell-pepper", amount: 1, unit: "each" }
    ],
    steps: [
      "Cut the carrots, cucumber and pepper into sticks.",
      "Serve with hummus for dipping."
    ] },

  { id: "r-apple-cheddar", title: "Apple and cheddar plate",
    source: { type: "own", label: "Your recipe" },
    mealTypes: ["snack"], baseServings: 2, makesLeftovers: false,
    folder: "Snacks", tags: ["no-cook", "quick"],
    ingredients: [
      { ingredientId: "apple",   amount: 2, unit: "each" },
      { ingredientId: "cheddar", amount: 2, unit: "oz" }
    ],
    steps: [
      "Slice the apples and cheddar.",
      "Arrange on a plate and serve."
    ] },

  { id: "r-crispy-rice-treats", title: "Crispy rice treats",
    source: { type: "imported", label: "Imported from bakesale.example", url: "https://bakesale.example/crispy-rice-treats" },
    mealTypes: ["snack"], baseServings: 12, makesLeftovers: false,
    folder: "Treats", tags: ["kid-friendly", "make-ahead"],
    ingredients: [
      { ingredientId: "malt-cereal",  amount: 6, unit: "cup" },
      { ingredientId: "marshmallows", amount: 4, unit: "cup" },
      { ingredientId: "butter",       amount: 3, unit: "tbsp" }
    ],
    steps: [
      "Melt the butter in a large pot over low heat.",
      "Stir in the marshmallows until melted.",
      "Fold in the cereal, press into a greased 9x13 pan and cool before cutting."
    ] }
];

SL.data.importSamples = {
  link: {
    id: "r-import-sheet-pan-chicken", title: "Lemon garlic sheet-pan chicken",
    source: { type: "imported", label: "Imported from weeknightplates.example", url: "https://weeknightplates.example/lemon-garlic-chicken" },
    mealTypes: ["dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Imported", tags: ["one-pan", "high-protein"],
    ingredients: [
      { ingredientId: "chicken-breast", amount: 1.5, unit: "lb" },
      { ingredientId: "potato",         amount: 3,   unit: "each" },
      { ingredientId: "broccoli",       amount: 3,   unit: "cup" },
      { ingredientId: "lemon",          amount: 1,   unit: "each" },
      { ingredientId: "garlic",         amount: 4,   unit: "clove" },
      { ingredientId: "olive-oil",      amount: 3,   unit: "tbsp" },
      { ingredientId: "salt",           amount: 1,   unit: "tsp" }
    ],
    steps: [
      "Heat the oven to 425°F.",
      "Cut the potatoes into wedges and toss with half the oil, garlic and salt. Roast 15 minutes.",
      "Add the chicken and broccoli, drizzle with the rest of the oil and roast 20 minutes more.",
      "Squeeze lemon over the pan before serving."
    ] },
  photo: {
    id: "r-import-grandmas-fried-rice", title: "Grandma's fried rice",
    source: { type: "imported", label: "Imported from a cookbook photo" },
    mealTypes: ["lunch", "dinner"], baseServings: 4, makesLeftovers: true,
    folder: "Imported", tags: ["family recipe"],
    ingredients: [
      { ingredientId: "white-rice",  amount: 2, unit: "cup" },
      { ingredientId: "eggs",        amount: 3, unit: "each" },
      { ingredientId: "frozen-peas", amount: 1, unit: "cup" },
      { ingredientId: "carrot",      amount: 2, unit: "each" },
      { ingredientId: "green-onion", amount: 3, unit: "each" },
      { ingredientId: "soy-sauce",   amount: 3, unit: "tbsp" },
      { ingredientId: "sesame-oil",  amount: 2, unit: "tsp" },
      { ingredientId: null, rawText: "2 tbsp oyster sauce", amount: 2, unit: "tbsp" }
    ],
    steps: [
      "Cook the rice a day ahead and chill it.",
      "Scramble the eggs in sesame oil and set aside.",
      "Stir-fry the diced carrots and peas 3 minutes, then add the cold rice.",
      "Add the soy sauce and oyster sauce, fold in the eggs and top with green onions."
    ] }
};
