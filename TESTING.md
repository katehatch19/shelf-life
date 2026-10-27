# Shelf Life: testing checklist

Find your name below and follow only your section. It takes about 15 minutes.

You don't need GitHub skills or Claude Code for this. If anything is confusing or goes wrong, take a screenshot and send it to Kate in the team chat.


## Step 0: Everyone does this first

1. Open https://github.com/katehatch19/shelf-life in your browser (signed in to GitHub).
2. Click the green "Code" button, then "Download ZIP".
3. Open your Downloads folder and find the "shelf-life-main" folder. On a Mac, Safari unzips it for you. On Windows, right-click the zip and choose "Extract All".
4. Inside that folder, double-click "tests.html". It should say: PASS: 42 of 42 checks passed. If it doesn't, stop and tell Kate.
5. Double-click "index.html". That's the app.


## The main flow (everyone uses some or all of this)

Do these in order inside the app:

1. Click "I understand".
2. Click "Use the demo household".
3. Click "Snap fridge", then pick "Weeknight fridge".
4. Two items have a dashed border. Click "Confirm" on both, then "See meal ideas".
5. Make sure "Dinner" is selected. Open "Chicken and broccoli stir-fry". Its label says "Safe for 2 of 3 with a fix".
6. Click the button that starts with "Swap Soy sauce for...". The label should change to "Safe".
7. Click "+" next to the servings. The amounts, calories and cost should all change right away.
8. Click "Plan". Drag the stir-fry onto any day, or click "Place…" and then "Place here".
9. Click "See grocery list". Nothing that's already in your fridge should be on the list.


## Eleanor (on your Mac)

You're checking that the app works in Safari, and that the safety labels work without color.

1. Safari: open "index.html" in Safari and do "The main flow" above. Write down anything that looks broken or doesn't match.
2. Reload: press Cmd+R. Everything you did should still be there.
3. Grocery warning: go to "Meals", choose "Breakfast", open "Sausage and potato breakfast hash" and click "Plan". Put it on any day, then click "See grocery list". Pork sausage should be on the list, with a warning that names Jordan.
4. Grayscale: open System Settings, then Accessibility, then Display, then Color Filters. Turn it on and choose Grayscale. Go to "Meals" and choose "Dinner". Look at the labels on the meal cards, then open "Cheesy spinach quesadillas" and scroll to the per-person check (it has a "Not safe" row). You should still be able to tell these four labels apart from their words and symbols alone:
   - Safe
   - Safe after a label check
   - Safe for X of Y with a fix
   - Not safe

   Turn Color Filters off when you're done.


## Makissa

You're checking the weekly planner with real hands and with the keyboard.

1. Do "Step 0" on a phone, tablet or touchscreen laptop if you have one. Then do steps 1 to 4 of "The main flow" so the app has your fridge and meal ideas.
2. Touch drag: open a meal labeled "Safe" and click "Plan". With your finger, drag the recipe card onto a day. Then drag it to a different day, then back up onto the "Recipes to plan" area.
   It passes when the meal lands where you let go and the page doesn't scroll instead of dragging.
3. Keyboard only: on a computer, don't touch the mouse. Use only Tab, Shift+Tab, Enter and Space to:
   - get to "List" and then "Plan"
   - press "Place…" on a recipe
   - choose a day and a meal, then press "Place here"
   - get to the grocery list

   It passes when you can always see which button you're on (it has an outline) and you never get stuck.


## Kate

1. Firefox: install Firefox, open "index.html" in it, and do "The main flow".
2. Console: in Chrome, press F12 and click the "Console" tab. Click through every tab of the app and open a meal. There should be no red errors. Note any yellow warnings.
3. Grocery warning: do Eleanor's step 3 in Firefox.
4. Timing: ask a friend who has never seen the app to open "index.html" and get to dinner ideas on their own. Start a timer when they double-click and stop it when meal ideas appear. Don't help them. It passes at under 3 minutes. Write down where they got stuck.


## When you're done

- If everything passed, post in the team chat: your name, your device, and "all passed".
- If something failed, send Kate a screenshot plus one sentence on what you clicked and what happened. Or, if you're comfortable with GitHub, open the repo, click "Issues", then "New issue", and write the same thing.

Who fixes what:
- Kate: setup, Family, Fridge
- Makissa: Meals and the safety labels
- Eleanor: Recipes, the planner, the grocery list, Share
