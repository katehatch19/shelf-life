/* Shelf Life mock data: ingredient catalog + diet rules. Owner: Makissa.
   Tags come only from the TAG LIST in CLAUDE.md 4.1.
   Every wheat ingredient also lists gluten; every pork ingredient also lists meat.
   unit must match recipe lines, macrosPerUnit and prices. */
window.SL = window.SL || {}; SL.data = SL.data || {};

SL.data.ingredients = {
  /* ---------- Meat & Seafood ---------- */
  "chicken-breast": {
    id: "chicken-breast", name: "Chicken breast", aisle: "Meat & Seafood",
    contains: ["meat"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 2, unit: "lb",
    macrosPerUnit: { kcal: 544, proteinG: 102, carbsG: 0, fatG: 12 }
  },
  "ground-beef": {
    id: "ground-beef", name: "Ground beef", aisle: "Meat & Seafood",
    contains: ["meat"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 2, unit: "lb",
    macrosPerUnit: { kcal: 1152, proteinG: 78, carbsG: 0, fatG: 91 }
  },
  "pork-sausage": {
    id: "pork-sausage", name: "Pork breakfast sausage", aisle: "Meat & Seafood",
    contains: ["pork", "meat"], mayContain: [], variesByBrand: true, variesTags: ["wheat", "gluten"],
    hiddenSourceNote: "Some sausages use breadcrumbs or wheat fillers.",
    staple: false, shelfDays: 7, unit: "each",
    macrosPerUnit: { kcal: 88, proteinG: 4.7, carbsG: 0.4, fatG: 7.5 }
  },
  "salmon": {
    id: "salmon", name: "Salmon fillet", aisle: "Meat & Seafood",
    contains: ["fish"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 2, unit: "lb",
    macrosPerUnit: { kcal: 943, proteinG: 91, carbsG: 0, fatG: 61 }
  },
  "shrimp": {
    id: "shrimp", name: "Shrimp", aisle: "Meat & Seafood",
    contains: ["shellfish"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 2, unit: "lb",
    macrosPerUnit: { kcal: 386, proteinG: 91, carbsG: 0, fatG: 2.3 }
  },
  "tofu": {
    id: "tofu", name: "Firm tofu", aisle: "Produce",
    contains: ["soy"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "oz",
    macrosPerUnit: { kcal: 22, proteinG: 2.5, carbsG: 0.5, fatG: 1.3 }
  },

  /* ---------- Dairy & Eggs ---------- */
  "eggs": {
    id: "eggs", name: "Eggs", aisle: "Dairy & Eggs",
    contains: ["eggs"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 28, unit: "each",
    macrosPerUnit: { kcal: 72, proteinG: 6.3, carbsG: 0.4, fatG: 4.8 }
  },
  "milk": {
    id: "milk", name: "Milk", aisle: "Dairy & Eggs",
    contains: ["milk"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "cup",
    macrosPerUnit: { kcal: 149, proteinG: 7.7, carbsG: 11.7, fatG: 7.9 }
  },
  "oat-milk": {
    id: "oat-milk", name: "Oat milk", aisle: "Dairy & Eggs",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 10, unit: "cup",
    macrosPerUnit: { kcal: 120, proteinG: 3, carbsG: 16, fatG: 5 }
  },
  "cheddar": {
    id: "cheddar", name: "Cheddar cheese", aisle: "Dairy & Eggs",
    contains: ["milk"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 28, unit: "oz",
    macrosPerUnit: { kcal: 114, proteinG: 7, carbsG: 0.4, fatG: 9.4 }
  },
  "oat-milk-cheese": {
    id: "oat-milk-cheese", name: "Dairy-free cheese shreds", aisle: "Dairy & Eggs",
    contains: [], mayContain: [], variesByBrand: true, variesTags: ["tree-nuts", "soy"],
    hiddenSourceNote: "Some dairy-free cheeses are made from cashews or soy.",
    staple: false, shelfDays: 21, unit: "oz",
    macrosPerUnit: { kcal: 80, proteinG: 0.3, carbsG: 7, fatG: 6 }
  },
  "parmesan": {
    id: "parmesan", name: "Parmesan", aisle: "Dairy & Eggs",
    contains: ["milk"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 60, unit: "oz",
    macrosPerUnit: { kcal: 111, proteinG: 10, carbsG: 0.9, fatG: 7.3 }
  },
  "greek-yogurt": {
    id: "greek-yogurt", name: "Plain Greek yogurt", aisle: "Dairy & Eggs",
    contains: ["milk"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 14, unit: "cup",
    macrosPerUnit: { kcal: 146, proteinG: 25, carbsG: 9, fatG: 0.9 }
  },
  "butter": {
    id: "butter", name: "Butter", aisle: "Dairy & Eggs",
    contains: ["milk"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 60, unit: "tbsp",
    macrosPerUnit: { kcal: 102, proteinG: 0.1, carbsG: 0, fatG: 11.5 }
  },

  /* ---------- Produce ---------- */
  "spinach": {
    id: "spinach", name: "Baby spinach", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 5, unit: "cup",
    macrosPerUnit: { kcal: 7, proteinG: 0.9, carbsG: 1.1, fatG: 0.1 }
  },
  "broccoli": {
    id: "broccoli", name: "Broccoli", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "cup",
    macrosPerUnit: { kcal: 31, proteinG: 2.5, carbsG: 6, fatG: 0.3 }
  },
  "bell-pepper": {
    id: "bell-pepper", name: "Bell pepper", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 10, unit: "each",
    macrosPerUnit: { kcal: 37, proteinG: 1.2, carbsG: 7, fatG: 0.4 }
  },
  "onion": {
    id: "onion", name: "Yellow onion", aisle: "Produce",
    contains: ["high-fodmap"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 30, unit: "each",
    macrosPerUnit: { kcal: 44, proteinG: 1.2, carbsG: 10, fatG: 0.1 }
  },
  "carrot": {
    id: "carrot", name: "Carrots", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 21, unit: "each",
    macrosPerUnit: { kcal: 25, proteinG: 0.6, carbsG: 6, fatG: 0.1 }
  },
  "tomato": {
    id: "tomato", name: "Tomato", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "each",
    macrosPerUnit: { kcal: 22, proteinG: 1.1, carbsG: 4.8, fatG: 0.2 }
  },
  "avocado": {
    id: "avocado", name: "Avocado", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 4, unit: "each",
    macrosPerUnit: { kcal: 240, proteinG: 3, carbsG: 12.8, fatG: 22 }
  },
  "banana": {
    id: "banana", name: "Banana", aisle: "Produce",
    contains: ["high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 5, unit: "each",
    macrosPerUnit: { kcal: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 }
  },
  "strawberries": {
    id: "strawberries", name: "Strawberries", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 4, unit: "cup",
    macrosPerUnit: { kcal: 53, proteinG: 1.1, carbsG: 12.7, fatG: 0.5 }
  },
  "romaine": {
    id: "romaine", name: "Romaine lettuce", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "cup",
    macrosPerUnit: { kcal: 8, proteinG: 0.6, carbsG: 1.5, fatG: 0.1 }
  },
  "cucumber": {
    id: "cucumber", name: "Cucumber", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "each",
    macrosPerUnit: { kcal: 45, proteinG: 2, carbsG: 11, fatG: 0.3 }
  },
  "zucchini": {
    id: "zucchini", name: "Zucchini", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "each",
    macrosPerUnit: { kcal: 33, proteinG: 2.4, carbsG: 6.1, fatG: 0.6 }
  },
  "lemon": {
    id: "lemon", name: "Lemon", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 21, unit: "each",
    macrosPerUnit: { kcal: 17, proteinG: 0.6, carbsG: 5.4, fatG: 0.2 }
  },
  "lime": {
    id: "lime", name: "Lime", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 21, unit: "each",
    macrosPerUnit: { kcal: 20, proteinG: 0.5, carbsG: 7, fatG: 0.1 }
  },
  "green-onion": {
    id: "green-onion", name: "Green onions", aisle: "Produce",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "each",
    macrosPerUnit: { kcal: 5, proteinG: 0.3, carbsG: 1.1, fatG: 0 }
  },
  "potato": {
    id: "potato", name: "Russet potato", aisle: "Produce",
    contains: ["high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 30, unit: "each",
    macrosPerUnit: { kcal: 164, proteinG: 4.3, carbsG: 37, fatG: 0.2 }
  },
  "apple": {
    id: "apple", name: "Apple", aisle: "Produce",
    contains: ["high-fodmap", "high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 30, unit: "each",
    macrosPerUnit: { kcal: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3 }
  },
  "garlic": {
    id: "garlic", name: "Garlic", aisle: "Produce",
    contains: ["high-fodmap"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 90, unit: "clove",
    macrosPerUnit: { kcal: 4.5, proteinG: 0.2, carbsG: 1, fatG: 0 }
  },

  /* ---------- Bakery, grains and pasta ---------- */
  "bread": {
    id: "bread", name: "Sandwich bread", aisle: "Bakery",
    contains: ["wheat", "gluten"], mayContain: ["sesame"], variesByBrand: true, variesTags: ["milk"],
    hiddenSourceNote: "Some breads are made with milk, whey or butter.",
    staple: false, shelfDays: 7, unit: "slice",
    macrosPerUnit: { kcal: 80, proteinG: 3.6, carbsG: 14, fatG: 1 }
  },
  "gf-bread": {
    id: "gf-bread", name: "Gluten-free bread", aisle: "Bakery",
    contains: ["eggs"], mayContain: [], variesByBrand: true, variesTags: ["milk"],
    hiddenSourceNote: "Some gluten-free breads contain milk powder.",
    staple: false, shelfDays: 7, unit: "slice",
    macrosPerUnit: { kcal: 75, proteinG: 1.5, carbsG: 14, fatG: 1.5 }
  },
  "flour-tortillas": {
    id: "flour-tortillas", name: "Flour tortillas", aisle: "Bakery",
    contains: ["wheat", "gluten"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 30, unit: "each",
    macrosPerUnit: { kcal: 140, proteinG: 3.7, carbsG: 24, fatG: 3.5 }
  },
  "corn-tortillas": {
    id: "corn-tortillas", name: "Corn tortillas", aisle: "Bakery",
    contains: [], mayContain: ["wheat", "gluten"], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 30, unit: "each",
    macrosPerUnit: { kcal: 52, proteinG: 1.4, carbsG: 11, fatG: 0.7 }
  },
  "white-rice": {
    id: "white-rice", name: "White rice", aisle: "Pantry",
    contains: ["high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 365, unit: "cup",
    macrosPerUnit: { kcal: 675, proteinG: 13, carbsG: 148, fatG: 1.2 }
  },
  "pasta": {
    id: "pasta", name: "Spaghetti", aisle: "Pantry",
    contains: ["wheat", "gluten", "high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 365, unit: "oz",
    macrosPerUnit: { kcal: 105, proteinG: 3.7, carbsG: 21, fatG: 0.4 }
  },
  "gf-pasta": {
    id: "gf-pasta", name: "Gluten-free spaghetti", aisle: "Pantry",
    contains: ["high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 365, unit: "oz",
    macrosPerUnit: { kcal: 101, proteinG: 2, carbsG: 22, fatG: 0.6 }
  },
  "rolled-oats": {
    id: "rolled-oats", name: "Rolled oats", aisle: "Pantry",
    contains: ["high-carb"], mayContain: ["wheat", "gluten"], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "Oats are often grown and processed alongside wheat.",
    staple: false, shelfDays: 365, unit: "cup",
    macrosPerUnit: { kcal: 307, proteinG: 10.7, carbsG: 55, fatG: 5.3 }
  },
  "malt-cereal": {
    id: "malt-cereal", name: "Crisp rice cereal", aisle: "Pantry",
    contains: ["gluten", "high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "Usually flavored with barley malt, which has gluten.",
    staple: false, shelfDays: 180, unit: "cup",
    macrosPerUnit: { kcal: 110, proteinG: 2, carbsG: 25, fatG: 0.5 }
  },
  "granola": {
    id: "granola", name: "Granola", aisle: "Pantry",
    contains: ["high-carb"], mayContain: ["peanuts", "tree-nuts"], variesByBrand: true, variesTags: ["gluten", "wheat"],
    hiddenSourceNote: "Some granolas use oats processed with wheat.",
    staple: false, shelfDays: 90, unit: "cup",
    macrosPerUnit: { kcal: 500, proteinG: 12, carbsG: 64, fatG: 22 }
  },
  "black-beans": {
    id: "black-beans", name: "Black beans (canned)", aisle: "Pantry",
    contains: ["high-fodmap", "high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 365, unit: "cup",
    macrosPerUnit: { kcal: 218, proteinG: 14.5, carbsG: 40, fatG: 0.9 }
  },
  "frozen-peas": {
    id: "frozen-peas", name: "Frozen peas", aisle: "Frozen",
    contains: ["high-fodmap"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 240, unit: "cup",
    macrosPerUnit: { kcal: 117, proteinG: 7.9, carbsG: 21, fatG: 0.6 }
  },
  "marshmallows": {
    id: "marshmallows", name: "Mini marshmallows", aisle: "Pantry",
    contains: ["high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 180, unit: "cup",
    macrosPerUnit: { kcal: 159, proteinG: 0.9, carbsG: 41, fatG: 0.1 }
  },

  /* ---------- Condiments, spreads and sauces ---------- */
  "soy-sauce": {
    id: "soy-sauce", name: "Soy sauce", aisle: "Condiments",
    contains: ["soy", "wheat", "gluten"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "Usually brewed with wheat.",
    staple: false, shelfDays: 365, unit: "tbsp",
    macrosPerUnit: { kcal: 9, proteinG: 1.3, carbsG: 0.8, fatG: 0 }
  },
  "gf-tamari": {
    id: "gf-tamari", name: "Gluten-free tamari", aisle: "Condiments",
    contains: ["soy"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 365, unit: "tbsp",
    macrosPerUnit: { kcal: 11, proteinG: 1.9, carbsG: 1, fatG: 0 }
  },
  "pesto": {
    id: "pesto", name: "Basil pesto", aisle: "Condiments",
    contains: ["milk", "tree-nuts"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "Made with pine nuts; some brands use cashews or walnuts.",
    staple: false, shelfDays: 7, unit: "tbsp",
    macrosPerUnit: { kcal: 80, proteinG: 1.4, carbsG: 1, fatG: 8 }
  },
  "nut-free-pesto": {
    id: "nut-free-pesto", name: "Nut-free basil pesto", aisle: "Condiments",
    contains: ["milk"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 7, unit: "tbsp",
    macrosPerUnit: { kcal: 70, proteinG: 1, carbsG: 1, fatG: 7 }
  },
  "chicken-broth": {
    id: "chicken-broth", name: "Chicken broth", aisle: "Pantry",
    contains: ["meat"], mayContain: [], variesByBrand: true, variesTags: ["wheat", "gluten"],
    hiddenSourceNote: "Some broths add wheat or barley flavorings.",
    staple: false, shelfDays: 5, unit: "cup",
    macrosPerUnit: { kcal: 15, proteinG: 1.6, carbsG: 1, fatG: 0.5 }
  },
  "peanut-butter": {
    id: "peanut-butter", name: "Peanut butter", aisle: "Condiments",
    contains: ["peanuts"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 180, unit: "tbsp",
    macrosPerUnit: { kcal: 94, proteinG: 4, carbsG: 3, fatG: 8 }
  },
  "sunflower-butter": {
    id: "sunflower-butter", name: "Sunflower seed butter", aisle: "Condiments",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 180, unit: "tbsp",
    macrosPerUnit: { kcal: 99, proteinG: 2.8, carbsG: 3.7, fatG: 8.8 }
  },
  "salsa": {
    id: "salsa", name: "Salsa", aisle: "Condiments",
    contains: ["high-fodmap"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 14, unit: "tbsp",
    macrosPerUnit: { kcal: 5, proteinG: 0.2, carbsG: 1, fatG: 0 }
  },
  "hummus": {
    id: "hummus", name: "Hummus", aisle: "Condiments",
    contains: ["sesame", "high-fodmap"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "Made with tahini (sesame paste).",
    staple: false, shelfDays: 7, unit: "tbsp",
    macrosPerUnit: { kcal: 25, proteinG: 1.2, carbsG: 2.1, fatG: 1.4 }
  },
  "maple-syrup": {
    id: "maple-syrup", name: "Maple syrup", aisle: "Pantry",
    contains: ["high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 365, unit: "tbsp",
    macrosPerUnit: { kcal: 52, proteinG: 0, carbsG: 13.4, fatG: 0 }
  },
  "almonds": {
    id: "almonds", name: "Almonds", aisle: "Snacks",
    contains: ["tree-nuts"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 180, unit: "oz",
    macrosPerUnit: { kcal: 164, proteinG: 6, carbsG: 6.1, fatG: 14.2 }
  },
  "white-wine": {
    id: "white-wine", name: "Dry white wine", aisle: "Beverages",
    contains: ["alcohol"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: false, shelfDays: 5, unit: "cup",
    macrosPerUnit: { kcal: 194, proteinG: 0.2, carbsG: 6.3, fatG: 0 }
  },

  /* ---------- Pantry staples (assumed on hand, left out of cost and list) ---------- */
  "olive-oil": {
    id: "olive-oil", name: "Olive oil", aisle: "Pantry",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 365, unit: "tbsp",
    macrosPerUnit: { kcal: 119, proteinG: 0, carbsG: 0, fatG: 13.5 }
  },
  "sesame-oil": {
    id: "sesame-oil", name: "Toasted sesame oil", aisle: "Pantry",
    contains: ["sesame"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 365, unit: "tsp",
    macrosPerUnit: { kcal: 40, proteinG: 0, carbsG: 0, fatG: 4.5 }
  },
  "salt": {
    id: "salt", name: "Salt", aisle: "Spices",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 3650, unit: "tsp",
    macrosPerUnit: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  },
  "black-pepper": {
    id: "black-pepper", name: "Black pepper", aisle: "Spices",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 1095, unit: "tsp",
    macrosPerUnit: { kcal: 6, proteinG: 0.2, carbsG: 1.5, fatG: 0.1 }
  },
  "cumin": {
    id: "cumin", name: "Ground cumin", aisle: "Spices",
    contains: [], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 1095, unit: "tsp",
    macrosPerUnit: { kcal: 8, proteinG: 0.4, carbsG: 0.9, fatG: 0.5 }
  },
  "taco-seasoning": {
    id: "taco-seasoning", name: "Taco seasoning", aisle: "Spices",
    contains: [], mayContain: [], variesByBrand: true, variesTags: ["wheat", "gluten"],
    hiddenSourceNote: "Some seasoning mixes use wheat flour as a thickener.",
    staple: true, shelfDays: 730, unit: "tbsp",
    macrosPerUnit: { kcal: 18, proteinG: 0.3, carbsG: 3.5, fatG: 0.3 }
  },
  "honey": {
    id: "honey", name: "Honey", aisle: "Pantry",
    contains: ["honey", "high-carb"], mayContain: [], variesByBrand: false, variesTags: [],
    hiddenSourceNote: "", staple: true, shelfDays: 3650, unit: "tbsp",
    macrosPerUnit: { kcal: 64, proteinG: 0.1, carbsG: 17, fatG: 0 }
  }
};

SL.data.dietRules = {
  vegan:           { exclude: ["milk", "eggs", "fish", "shellfish", "meat", "honey"], labelCheck: [] },
  vegetarian:      { exclude: ["meat", "fish", "shellfish"], labelCheck: [] },
  halal:           { exclude: ["pork", "alcohol"], labelCheck: ["meat"] },
  keto:            { exclude: ["high-carb"], labelCheck: [] },
  "low-fodmap":    { exclude: ["high-fodmap"], labelCheck: [] },
  "high-protein":  { exclude: [], labelCheck: [] },
  "macro-focused": { exclude: [], labelCheck: [] }
};
