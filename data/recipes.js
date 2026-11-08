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
      "Rinse the rice in a strainer until the water runs clear. Cook it according to the package, then keep it covered off the heat.",
      "While the rice cooks, pat the chicken dry and cut it into 1-inch pieces. Cut the broccoli into small florets, slice the bell pepper into thin strips and mince the garlic.",
      "Heat the sesame oil in a large skillet or wok over medium-high heat until it shimmers, about 1 minute.",
      "Add the chicken in a single layer. Let it brown without stirring for 2 minutes, then stir and cook 3 to 4 minutes more, until no pink shows when you cut the thickest piece (165°F inside).",
      "Add the broccoli and pepper. Stir-fry 3 minutes, until the broccoli is bright green and just tender. Splash in 2 tablespoons of water if the pan looks dry.",
      "Add the garlic and stir for 30 seconds, just until it smells fragrant. Don't let it brown.",
      "Pour in the soy sauce and toss for 1 minute so everything is coated. Taste and serve over the rice."
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
      "Rinse the rice and cook it according to the package. When it's done, fluff it with a fork and stir in the juice of half the lime. Cut the other half into wedges.",
      "Pat the chicken dry. Mix the cumin and salt and rub it on both sides of the chicken.",
      "Heat a skillet over medium heat. Cook the chicken 6 to 7 minutes per side without moving it, until golden and 165°F in the thickest part.",
      "Move the chicken to a cutting board and let it rest 5 minutes so it stays juicy, then slice it thinly.",
      "While the chicken rests, drain and rinse the black beans. Warm them in a small pot over medium-low heat for 3 to 4 minutes, stirring now and then.",
      "Halve the avocado, remove the pit and slice it. Shred the cheddar.",
      "Build the bowls: rice first, then beans and chicken. Top with salsa, avocado and cheddar, with a lime wedge on the side."
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
      "Peel and dice the onion and carrots into small, even pieces. Mince the garlic.",
      "Pour the broth into a large pot and add the onion, carrots, garlic and whole chicken breasts. Bring it to a boil over high heat.",
      "Turn the heat down to low so it bubbles gently. Cover and simmer 20 minutes, until the chicken is cooked through (165°F inside).",
      "Lift the chicken onto a cutting board and shred it with two forks.",
      "Rinse the rice and add it to the pot. Simmer uncovered 15 minutes, stirring now and then, until the rice is tender.",
      "Return the shredded chicken to the pot and stir in the spinach. Cook 1 to 2 minutes, until the spinach wilts.",
      "Season with salt and pepper, taste and adjust. Leftovers keep 4 days in the fridge or 3 months in the freezer."
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
      "Shred the cheddar. Roughly chop the spinach.",
      "Heat a large dry skillet over medium heat. Add the spinach and stir for 1 to 2 minutes, until it wilts. Move it to a plate and wipe the pan dry.",
      "Lay the tortillas flat. Sprinkle cheese over half of each one, add the spinach, then a little more cheese on top so it holds together. Fold each tortilla closed.",
      "Brush the skillet lightly with oil and set it over medium heat.",
      "Cook one or two quesadillas at a time, 2 to 3 minutes per side, pressing gently with a spatula, until golden and the cheese has melted. Add a little oil between batches.",
      "Let them rest 1 minute so the cheese sets, then cut into wedges. Serve with salsa."
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
      "Heat a large skillet over medium-high heat. Add the beef and break it into small crumbles with a spoon.",
      "Cook 6 to 8 minutes, stirring now and then, until no pink remains. Tip the pan and spoon off the extra fat.",
      "Stir in the taco seasoning and 1/3 cup water. Turn the heat to low and simmer 5 minutes, until the sauce thickens and coats the meat.",
      "While it simmers, shred the lettuce, dice the tomato and shred the cheddar.",
      "Warm the tortillas in a dry skillet for 20 to 30 seconds per side, or wrap them in a damp paper towel and microwave 30 seconds.",
      "Fill each tortilla with beef, then top with cheese, lettuce, tomato and salsa."
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
      "Bring a large pot of water to a boil and add the salt.",
      "While the water heats, dice the tomatoes and grate the parmesan.",
      "Add the pasta and cook according to the package until al dente (tender with a little bite). Stir in the first minute so it doesn't stick.",
      "Before draining, scoop out 1/2 cup of the pasta water and set it aside. Drain the pasta.",
      "Return the hot pasta to the pot off the heat. Add the spinach and toss for 1 minute, until it wilts.",
      "Stir in the pesto and a splash of the saved pasta water. Add more water a little at a time until the sauce is glossy and coats the pasta.",
      "Serve topped with the tomatoes and parmesan."
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
      "Bring a large pot of salted water to a boil and cook the pasta until al dente. Save 1/2 cup of the pasta water, then drain.",
      "While the pasta cooks, peel and devein the shrimp if needed and pat them dry. Mince the garlic, juice the lemon and grate the parmesan.",
      "Melt the butter in a large skillet over medium heat. Add the garlic and stir for 1 minute, until fragrant but not brown.",
      "Add the shrimp in a single layer. Cook 2 minutes per side, until pink and curled into a loose C shape. A tight O means overcooked.",
      "Pour in the wine and lemon juice. Simmer 2 minutes, scraping up the browned bits from the pan.",
      "Add the drained pasta and toss to coat. Add a splash of the pasta water if it looks dry.",
      "Sprinkle with parmesan and pepper and serve right away."
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
      "Heat the oven to 400°F. Line a sheet pan with foil or parchment.",
      "Finely chop the almonds until they look like coarse crumbs. Cut the broccoli into florets and slice the lemon into wedges.",
      "Pat the salmon dry and place it skin-side down on one side of the pan. Brush the top with half the oil and sprinkle with salt.",
      "Press the chopped almonds firmly onto the top of the salmon so they stick.",
      "Toss the broccoli with the rest of the oil and a pinch of salt and spread it on the other side of the pan.",
      "Roast 12 to 15 minutes, until the almonds are golden and the salmon flakes easily with a fork (145°F inside).",
      "Squeeze lemon over the salmon and broccoli and serve."
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
      "Rinse the rice and cook it according to the package.",
      "When the rice is done, stir in the spinach while it's hot. Cover for 2 minutes so the spinach wilts, then fluff with a fork.",
      "While the rice cooks, mince the garlic. Pat the salmon dry and season it with salt and the garlic.",
      "Heat the oil in a skillet over medium-high heat until it shimmers.",
      "Place the salmon skin-side up and sear 4 minutes without moving it, until golden. Flip and cook 3 to 4 minutes more, until it flakes easily (145°F inside).",
      "Squeeze lemon juice over the salmon and serve it on the spinach rice."
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
      "Rinse the rice and cook it according to the package.",
      "Drain the tofu. Wrap it in a clean towel and set something heavy on top for 10 minutes to press out the water. Cut it into 1-inch cubes.",
      "While the tofu presses, cut the broccoli into florets, slice the pepper and zucchini, and mince the garlic.",
      "Heat half the sesame oil in a large nonstick skillet over medium-high heat. Add the tofu in a single layer and cook about 8 minutes, turning every 2 minutes, until golden on most sides. Move it to a plate.",
      "Add the rest of the oil and the broccoli, pepper and zucchini. Stir-fry 4 minutes, until crisp-tender.",
      "Add the garlic and stir 30 seconds, until fragrant.",
      "Return the tofu, pour in the soy sauce and toss gently for 1 minute. Serve over the rice."
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
      "Dice the bell pepper, roughly chop the spinach and shred the cheddar.",
      "Crack the eggs into a bowl, add the salt and whisk until no streaks of white remain.",
      "Melt half the butter in a nonstick pan over medium heat. Cook the pepper 2 minutes, add the spinach and stir 1 minute until it wilts. Move the vegetables to a plate.",
      "Melt the rest of the butter in the pan. Pour in half the eggs and tilt the pan so they cover the bottom.",
      "As the edges set, gently push them toward the center with a spatula and tilt the pan so the runny egg fills the gaps. Cook until the top is almost set, about 2 minutes.",
      "Spoon half the vegetables and cheese onto one side. Fold the omelet over and slide it onto a plate.",
      "Repeat with the rest of the eggs, vegetables and cheese for the second omelet."
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
      "Scrub the potatoes and cut them into 1/2-inch cubes. Dice the onion and pepper. Slice the sausage into rounds.",
      "Heat the oil in a large skillet over medium heat. Add the potatoes in an even layer.",
      "Cook 12 minutes, stirring every 3 to 4 minutes, until golden and a fork slides in easily.",
      "Add the sausage, onion and pepper. Cook 8 minutes more, stirring now and then, until the sausage is browned and cooked through (160°F inside).",
      "Season with salt and pepper. Use a spoon to make 4 wells in the hash.",
      "Crack an egg into each well. Cover the pan and cook on low 4 to 6 minutes, until the whites are set and the yolks are as firm as you like.",
      "Serve right from the pan."
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
      "Set out two jars or containers with lids.",
      "In a bowl, stir together the oats, milk, yogurt and honey until smooth.",
      "Divide the mixture between the jars.",
      "Rinse the strawberries, remove the green tops and slice them. Spoon them over the oats.",
      "Close the jars and refrigerate at least 6 hours or overnight, so the oats soften.",
      "In the morning, stir and eat cold. Add a splash of milk if it's too thick. They keep up to 3 days in the fridge."
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
      "In a shallow dish, whisk the eggs, milk and salt until smooth.",
      "Heat a large skillet or griddle over medium heat and melt a little of the butter.",
      "Dip a slice of bread in the egg mixture for 3 to 5 seconds per side. It should be soaked but not falling apart. Let the extra drip off.",
      "Cook 2 to 3 minutes per side, until golden brown and no wet egg shows when you press the center.",
      "Repeat with the rest of the bread, adding butter to the pan between batches. Keep finished slices warm on a plate in a 200°F oven.",
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
      "Rinse the strawberries, remove the green tops and slice them.",
      "Spoon a layer of yogurt into the bottom of two glasses or bowls.",
      "Add a layer of strawberries, then a layer of granola.",
      "Repeat the layers until everything is used, ending with granola on top.",
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
      "Toast the bread until golden.",
      "While it's still warm, spread the peanut butter evenly to the edges. Warm toast helps it spread.",
      "Peel the banana and cut it into thin rounds.",
      "Lay the banana slices over the peanut butter and serve."
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
      "Rinse all the vegetables and pat them dry.",
      "Peel the carrots and cut them into sticks about 3 inches long.",
      "Cut the cucumber in half lengthwise, then into sticks.",
      "Remove the stem and seeds from the pepper and slice it into strips.",
      "Spoon the hummus into a bowl in the middle of a plate and arrange the vegetables around it for dipping."
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
      "Rinse the apples. Cut them into quarters, remove the cores and slice each quarter into thin wedges.",
      "Cut the cheddar into thin slices or small cubes.",
      "Arrange the apples and cheese on a plate and serve. Sliced apples brown after about 30 minutes, so cut them just before eating."
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
      "Grease a 9x13-inch pan with a little butter.",
      "Melt the butter in a large pot over low heat.",
      "Add the marshmallows and stir constantly until they're completely melted and smooth, about 3 minutes. Keep the heat low so they don't burn.",
      "Take the pot off the heat. Add the cereal and fold gently with a spatula until every piece is coated.",
      "Spread the mixture into the pan. Lightly butter your hands or the spatula and press it into an even layer without packing it too hard.",
      "Let it cool at least 30 minutes, then cut into 12 squares."
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
      "Heat the oven to 425°F. Line a large sheet pan with foil or parchment.",
      "Cut the potatoes into wedges and mince the garlic. Cut the broccoli into florets and slice the lemon.",
      "Toss the potatoes with half the oil, half the garlic and half the salt. Spread them on the pan and roast 15 minutes.",
      "While they roast, pat the chicken dry and rub it with the rest of the oil, garlic and salt.",
      "Push the potatoes to the sides. Add the chicken to the middle and the broccoli around it.",
      "Roast 20 minutes more, until the potatoes are crisp and the chicken reaches 165°F in the thickest part.",
      "Squeeze lemon over the pan and let the chicken rest 5 minutes before slicing."
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
      "Cook the rice a day ahead, spread it on a plate and chill it overnight. Cold rice fries without getting mushy.",
      "Dice the carrots and slice the green onions. Keep the white and green parts separate.",
      "Whisk the eggs. Heat half the sesame oil in a large skillet or wok over medium heat, scramble the eggs until just set and move them to a plate.",
      "Turn the heat to medium-high and add the rest of the oil. Stir-fry the carrots, peas and white parts of the green onions for 3 minutes.",
      "Add the cold rice. Break up any clumps and spread it out. Let it sit 1 minute to crisp, then stir. Repeat for about 4 minutes.",
      "Pour in the soy sauce and oyster sauce and toss until the rice is evenly colored.",
      "Fold in the eggs, top with the green onion tops and serve."
    ] }
};
