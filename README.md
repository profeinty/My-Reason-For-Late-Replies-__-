# FF Tech

Hosts the FF MonsoonSIM game reader so the **FF live** bookmark can load the newest version on every click.

- `reader.js` is the reader (v12). It opens a draggable FF panel on the game tab with Live, Today, Stores, Stock, Checks, Deals and Bot tabs; Alt+F hides it. The Bot tab plays the day from the calculator's plan (see below). Edit it and push to `main` to update everyone's bookmark.
- `index.html` is the install page with the bookmarks for Mode 12i and Mode 14.
- `ff-live.user.js` is the same loader as a Tampermonkey userscript: the FF panel opens by itself on every game tab, with no bookmark to click.
- `calc/index.html` is the FF calculator as a web page (v33): https://profeinty.github.io/My-Reason-For-Late-Replies-__-/calc. Same team passcode; numbers stay on each device (team sharing is only in the other version). Its Go live, FF live bookmark and Copy game reader all use `reader.js` from this site.
- `docs/plan-format.md` is the message the calculator sends the bot each day, and the reports the bot sends back. `docs/plan-sample.json` is an example.
- `test/` is a stand-in game for testing the bot without a real game. See [test/README.md](test/README.md).
- `.nojekyll` makes GitHub Pages serve the files as they are.

## Setup (once)

1. Push these files to the repo (here: `profeinty/Secret-FF-Doomsday-Project`).
2. In the repo: Settings > Pages > Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://profeinty.github.io/Secret-FF-Doomsday-Project/` and drag the bookmark for your mode to the bookmarks bar.

The repo was renamed from Monsoonsim-Project-V1 on 2026-10-18. A bookmark made from the old page still points at the old address and stops loading: delete it and drag it again from the page above.

## How the bookmark works

It sets `window.__FF_MODE` to the calculator mode, then adds a `<script>` tag for `reader.js` with a time stamp on the address so the browser never runs an old cached copy. If the game page blocks outside scripts, it shows a message and you fall back to pasting the reader in the Console.

## B2B deals (Deals tab preview)

The Deals tab checks B2B > B2B Offers and shows which open deals it would grab. Smart mode: enough stock in the warehouses and price at least cost x margin (default 1.15); bids go in 3% under the max price. Grab all mode skips those checks. One deal per product per day (the game's limit). The Deals tab only previews; the Bot tab accepts and bids on the deals the calculator's plan picks. (The Auto tab and its auto-click were removed in v11.)

## Bot (reader v12)

The Bot tab follows the calculator's plan: every quantity, price and budget comes from the calculator, nothing is a fixed number in the bot.

1. Open the game and click your FF live bookmark, then open the **Bot** tab.
2. **Check the screens** reads every screen the bot uses and sends nothing. **Practice** does everything except send, so you can see what it would do.
3. **Start** opens the web calculator at the bottom left of the game tab (if it isn't linked yet), takes its plan for the day and runs it in order: B2B deals and bids, machines, warehouse space, shop space, store stock, raw materials, stock for B2B, Web Market, marketing. Each section stays within its budget and cash stays above the plan's reserve. It reports each step back to the calculator and takes the next day's plan when the day changes.
4. After the plan's steps it ships won B2B orders (and Web Market orders) from the warehouse stock, earliest due first, so they aren't late.
5. It approves its own requests. In the game each order, rental and expense waits as "Requested" on its Transactions screen until someone presses ✓. While the next sections send, the bot reads those screens and approves only its own new requests from today (by the same player as its other requests). It never approves a teammate's request, an older one, or a price change, and never presses Cancel. If the game refuses an approval it tries once more, then says which requests still wait.
6. From 4/10 of the game on (day 24 of 60, day 32 of 80) it takes fixed-price B2B deals the moment a day starts, without waiting for the calculator: only deals the Deals tab would grab (in stock in the warehouses after what won orders still need, price at least cost x margin and the plan's floor), one per product a day. Bids still come from the plan. Untick **Take fixed-price B2B deals the moment a day starts** in the Bot tab to leave every deal to the plan.
7. **Warehouse space** in the Bot tab: pick a warehouse, type its size in m² (steps of 500) and press **Set**. The bot then keeps that warehouse at that size every day (it rents more or gives space back, never all of it) in place of the calculator's warehouse steps for it, within the cash reserve. **Let the calculator decide** hands it back.
8. Heads-up: when the calculator sees a daily cost going up (the market report fee, salaries, rents) or a game news line saying one will, its warning shows on top of every tab of the FF panel, so the team can cancel it in the game before it's charged. The bot never cancels anything. **Hide** hides a warning.
9. Stop it with its own button, the Stop bar or Esc.
10. To skip the clicking: install `ff-live.user.js` with Tampermonkey and tick **Run by itself** in the Bot tab once. Then opening the game is enough: the bot starts, opens the calculator and plays each day.
11. If it doesn't play, press **Copy report** in the Bot tab and paste it in the project chat: it has what the bot and the calculator link were doing, and the bot's log.

The calculator inside the game tab needs no pop-up and no tab to switch to, and it stays awake because the game tab is in front. It keeps its own copy of your numbers on the game's site, so the first time it asks for the team passcode: type it there with **Remember this device** ticked, and it opens by itself after that. **Hide** and **Show** fold it away; **Own tab** moves it to its own tab (Use it inside this tab, in the Live tab, brings it back). A calculator that doesn't answer inside the game tab (an older one, or a game page that can't hold it) opens in its own tab instead, as before; then Chrome may ask to allow pop-ups when the bot starts by itself.

Speed: the moment the day counter changes it reads the B2B offers (ahead of any other list screen, which it keeps free in the last second of a day) and takes the fixed-price deals at once (about 20 ms after it sees the new day, from 4/10 of the game), then the plan's other deals as soon as the calculator answers (about 1 s into the day), before the rest of the day is read. The rest of the plan goes out once the day's sales are in, usually within 1 to 5 s. The game refuses list screens (Transactions, B2B offers, B2B sales orders) read less than about 1 s apart, so the bot keeps those 1.1 s apart, slows down by itself if the game still says "Slow down", and does the approvals and checks in the background, about 1 s per screen. Other screens and the orders themselves have no limit.

What it reads for the calculator each day: the market report fee next to its buy link on the Media screen (it never opens that link), the game's news and info lines, every B2B bid we took part in with every team's price and who won (from B2B Sales Orders), our orders still to ship, units produced per product and day, each machine's status (making, short of a raw material, idle), the machines for sale, and the Web Market listings.

Machines: it buys as many as the plan asks, one at a time, only while they fit on the warehouse floor and in the machine budget, and sets the production order. Choosing what one machine makes isn't mapped yet: do that in the game.

Web Market: it buys a listing only if its number, product, amount and price match the plan (never over the plan's price), and posts our own sell listing at the shop price.

Safety: it never changes a selling price (the reader refuses the game's price commands), never opens a cancel-rental link, never shrinks a shop or warehouse unless the plan says release (and leaves giving up a whole location to you), checks a B2B offer's number before accepting or bidding, and counts an order whose answer got lost as bought so it is never sent twice.

## 📄 License
MIT © Profeinty
