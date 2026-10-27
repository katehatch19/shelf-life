# Shelf Life: testing checklist

Find your name below and follow only your section. It takes about 15 minutes.

You don't need GitHub skills or Claude Code for this. If anything is confusing or goes wrong, take a screenshot and send it to Kate in the team chat.


## Step 0: Everyone does this first

1. Open https://github.com/katehatch19/shelf-life in your browser (signed in to GitHub).
2. Click the green "Code" button, then "Download ZIP".
3. Open your Downloads folder. On a Mac, if you see "shelf-life-main.zip", double-click it to unzip it (Safari sometimes does this for you). On Windows, right-click the zip and choose "Extract All". You now have a "shelf-life-main" folder.
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


## Eleanor (Mac, Google Chrome)

You're checking the safety labels without color, dragging with touch, and the grocery warning.

1. Open "index.html" in Chrome: right-click it, choose "Open With", then "Google Chrome". Do steps 1 to 4 of "The main flow".
2. Grocery warning: go to "Meals", choose "Breakfast", open "Sausage and potato breakfast hash" and click "Plan". Put it on any day, then click "See grocery list". Pork sausage should be on the list, with a warning that names Jordan.
3. Touch drag (phone mode): press Cmd+Option+I to open Chrome's developer tools, then press Cmd+Shift+M to switch to phone mode. Pick "iPhone 12 Pro" from the menu at the top of the page. Go to "Meals", open a meal labeled "Safe" and click "Plan". Drag its card from "Recipes to plan" onto a day, then to a different day, then back up onto the "Recipes to plan" area.
   It passes when the meal lands where you let go and the page doesn't scroll instead of dragging. Press Cmd+Shift+M again to leave phone mode.
4. Console: with the developer tools still open, click the "Console" tab. Click through every tab of the app and open a meal. There should be no red errors. Note any yellow warnings.
5. Grayscale: open System Settings, then Accessibility, then Display, then Color Filters. Turn it on and choose Grayscale. Go to "Meals" and choose "Dinner". Look at the labels on the meal cards, then open "Cheesy spinach quesadillas" and scroll to the per-person check (it has a "Not safe" row). You should still be able to tell these four labels apart from their words and symbols alone:
   - Safe
   - Safe after a label check
   - Safe for X of Y with a fix
   - Not safe

   Turn Color Filters off when you're done.


## Makissa (Safari)

You're checking that the app works in Safari, and that you can use it with only the keyboard.

1. Open "index.html" in Safari: right-click it, choose "Open With", then "Safari". Do all of "The main flow". Write down anything that looks broken or doesn't match.
2. Reload: press Cmd+R. Everything you did should still be there.
3. Turn on full keyboard use in Safari first. Otherwise Tab skips buttons in every website, not just ours. Open the Safari menu, choose "Settings" (or "Preferences"), click "Advanced", and tick "Press Tab to highlight each item on a webpage".
4. Keyboard only: don't touch the mouse or trackpad. Use only Tab, Shift+Tab, Return and Space to:
   - get to "Meals", open a meal labeled "Safe" and press "Plan"
   - press "Place…" on that recipe
   - choose a day and a meal, then press "Place here"
   - get to the grocery list

   It passes when you can always see which button you're on (it has an outline) and you never get stuck.


## Kate (Windows)

1. Firefox: install Firefox, open "index.html" in it, and do "The main flow".
2. Grocery warning: do Eleanor's step 2 in Firefox.
3. Timing: ask a friend who has never seen the app to open "index.html" and get to dinner ideas on their own. Start a timer when they double-click and stop it when meal ideas appear. Don't help them. It passes at under 3 minutes. Write down where they got stuck.


## When you're done

- If everything passed, post in the team chat: your name, your device, and "all passed".
- If something failed, send Kate a screenshot plus one sentence on what you clicked and what happened. Or, if you're comfortable with GitHub, open the repo, click "Issues", then "New issue", and write the same thing.

Who fixes what:
- Kate: setup, Family, Fridge
- Makissa: Meals and the safety labels
- Eleanor: Recipes, the planner, the grocery list, Share
