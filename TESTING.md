# Shelf Life: hand check

This takes about 15 minutes. Each person takes the parts that match the device or browser they have, so nobody repeats work.

Most of [CLAUDE.md §6](CLAUDE.md#6-how-we-check-it-works) is already checked automatically in Chrome and Edge. This list covers what a script can't: other browsers, real hands, real keyboards, real eyes and real timing.

## Before you start

1. Get the latest version. Either pull the repo, or on GitHub click **Code → Download ZIP** and unzip it.
2. Double-click `tests.html`. It should say **all checks passed**. If it doesn't, stop and report it.
3. Double-click `index.html`. If you've used the app before, go to **Family → Reset demo data** first.

## Checks

| # | Who | What to do | It passes when |
|---|---|---|---|
| 1 | **Mac, in Safari** | Follow "The main flow" below. Then reload the page. | Every step works, `tests.html` passes, and your data is still there after the reload. |
| 2 | **Firefox** | The same as check 1. | The same as check 1. |
| 3 | **Someone who has never seen the app** | Start a timer when they double-click `index.html`. Stop it when dinner ideas appear. Don't help them. | Under **3:00**. Write down where they hesitated. |
| 4 | **Phone or touchscreen** | Go to **List → Plan** and drag a recipe from the tray onto a day with your finger. Then drag it to another day, then back onto the tray. | The meal lands where you dropped it. The page doesn't scroll instead of dragging. |
| 5 | **Keyboard only** | Without the mouse, use only Tab, Shift+Tab, Enter and Space to plan a meal with **Place…**, then open the grocery list. | You can always see which button is focused, and you never get stuck. |
| 6 | **Grayscale** | Windows: Settings → Accessibility → Color filters → Grayscale. Mac: System Settings → Accessibility → Display → Color filters. Look at Meals, a meal's detail and Recipes. | You can tell **Safe**, **Safe after a label check**, **Safe for X of Y with a fix** and **Not safe** apart by their words and icons alone. |
| 7 | **Anyone, on a computer** | Press F12 (Mac: ⌥⌘I) → **Console**. Click through every tab and open a meal. | There are no red errors. Write down any yellow warnings. |
| 8 | **Anyone** | After the main flow, with everyone eating, go to **Meals → Breakfast** → **Sausage hash** → **Plan**, and put it on a day. Open **List → Grocery**. | Pork sausage is on the list, with a label warning that names Jordan. |

### The main flow (for checks 1 and 2)

1. Click **I understand**, then **Use the demo household**.
2. **Snap fridge** → **Weeknight fridge**.
3. Confirm the two dashed items, then **Continue**.
4. In **Meals → Dinner**, open the **Chicken stir-fry** ("Safe for 2 of 3 with a fix") and tap the tamari swap. It should now say **Safe**.
5. Tap **+** on the servings. The amounts, calories and cost should change right away.
6. Tap **Plan**, then put the stir-fry on a day.
7. Open **List → Grocery**. Nothing that's in your fridge should be on the list.
8. Use **Share → Print** on a recipe. Only the recipe should print.

## Reporting a problem

Open an issue on GitHub in the `shelf-life` repo (**Issues → New issue**) with:

- **Check #** and **browser / device** (e.g. "Check 4, iPhone 15, Safari")
- **What you did** (the clicks, in order)
- **What you expected**
- **What happened** (a screenshot or short video helps)

The owner of the screen picks it up (see [CLAUDE.md §5](CLAUDE.md#5-file-layout-and-owners)):
- **Kate:** Family, Fridge and setup
- **Makissa:** Meals and safety
- **Eleanor:** Recipes, List and Share

If everything passes, say so in the team chat with your check numbers and device.
