# Farm Empire

A client-side pixel-art farming game made with HTML, CSS and vanilla JavaScript. Open `farm-empire/index.html` in a browser to play. No build step or dependencies are required. For a local HTTP preview, serve the repository root with any static HTTP server and visit `/farm-empire/`. Run the regression suite from the repository root with `node tests/farm-empire.cjs`.

Move with WASD or arrow keys; use E or Space to interact. Touch controls and click-to-walk are also available. Walk into building doors to enter, and through the bottom doorway to leave. Approach the ten farm plots and press E or click a plot to plant or harvest. New crops wait for water before their growth timer starts. Press E beside the lake to fill your watering can (two plants per refill). Press E near a dry plant or walk across it to water it. Walk across plots to automatically harvest fully grown crops; walking never plants seeds. Select seeds in the satchel. Inside the shop or market, press E to trade.

Carrot seeds cost £0.50, crops sell for £1 and grow in 10 seconds. Potatoes cost £5, sell for £6 and grow in 15 seconds. Tomatoes cost £10, sell for £12 and grow in 20 seconds. New farmers start with £0.50 and no seeds—enough to buy their first carrot seed.

Day and night each last ten minutes of active game time. Shops close at night; only home can be entered. The Pause/Resume button above Your farms freezes time, growth and workers. Closing or hiding the tab also freezes the game; reopening resumes the saved game clock without offline progress. Crops accumulate only daylight growth. Growth pauses at night, and sleeping skips the night without adding growth. Saves use localStorage on the current browser/origin. Four named save slots are available under Your farms. Switching automatically saves the current slot. New farm selects an empty slot, preserving existing games; when all four are used it does not overwrite them. Existing single-game saves are copied to slot 1, with the original retained as a backup. Inactive save slots stay frozen until selected again.

Crop definitions live in `CROPS` at the top of `farm-empire/game.js`. All art is drawn with canvas primitives. Optional Google Fonts fall back to installed sans-serif fonts offline.




Mouse controls: click the lake to walk to the shore and refill, or a plot to walk within reach and plant, water, or harvest. Click a building to walk around obstacles to its door. Routes use grid-based breadth-first pathfinding; unreachable destinations display a message without moving. Keyboard movement cancels a mouse route.


The yellow-roofed Item Shop is to the right of the seed shop. Upgrades must be bought in order: medium watering can (£10, 5 uses), large watering can (£20, 10 uses), then sprinkler (£50, automatically waters all existing dry crops and future plantings). Can upgrades keep current water; refill at the lake for the larger capacity. Purchases persist in your save.


After the sprinkler, hire the Harvester (£100), then Seller (£125). These independent characters work while the game is running, even when your farmer is indoors. The harvester carries ripe crops to the pile below the farm. The seller collects the pile and sells at the market during daylight, pausing at night. Pile contents and carried cargo are saved. Click the pile or press E nearby to collect its crops yourself.


After the Seller, hire the Planter (£150), then Buyer (£175). The planter walks to empty plots and uses the highest-priced seed currently in your inventory, with automatic sprinkler watering. The buyer defaults to None. Choose a seed under Farm helpers. The buyer purchases only when there are empty plots and no seeds of any type in inventory, buying enough for the empty plots as funds allow; choose None to stop. The buyer walks to the seed shop and replenishes inventory from there during daylight. Choice and helper progress persist across reloads.


Pumpkins: seeds cost £20, harvested pumpkins sell for £25, and grow in 30 seconds after watering. Available to all automated helpers and the buyer seed selector.


Apples: seeds cost £30, harvested apples sell for £40, and grow in 45 seconds after watering. Supported by all helpers and the buyer selector.



Buy farm expansions independently in the Item Shop: £1,000 per pair, up to five purchases (20 total plots). Each pair adds a column to the left; all crops, watering and helpers support expanded plots. Expansion ownership is saved.



The harvester carries up to five crops per trip, visiting the nearest ripe plots before returning. If fewer than five are ready, the partial load is deposited without waiting for more crops to grow.


Pears: seeds cost £100, harvested pears sell for £115, and require 60 seconds of daylight growth after watering. Supported by all helpers and the buyer selector.


Buy a compost heap for £500 independently in the Item Shop. It sits above the sprinkler and supplies unlimited compost, carried one portion at a time. Press E beside it or click it to collect; press E near a watered growing plant or click that plant to apply. Compost makes subsequent daylight growth 5× faster, does not stack, and lasts until harvest. Nighttime growth still pauses.


All hired workers stop at nightfall, deposit any carried crops at the farm pile, and walk east along the extended road off-screen. At dawn they return along that road before resuming work. Departure/return progress is saved, including when sleep advances to morning.


Melons: seeds cost £1,000, harvested melons sell for £1,200, and require 90 seconds of daylight growth after watering. Supported by all helpers, compost, and the buyer selector.



Compost capacity upgrades must be bought in order after the base heap: Medium (£1,000, 5 portions), Big (£2,500, 10 portions), Giant (£5,000, 20 portions). Collecting from the heap refills your carried compost to its capacity; applying compost uses exactly one portion. Upgrades preserve current carried portions until you refill.



Bronze progression: selling a melon (manually or through the seller) summons a wizard above the lake. Speak with E or click him. Accept his £10,000 offer to open the portal, then walk through it to reset only the current farm to £0.50, ten empty plots and no inventory/upgrades/helpers. The farmer name and other save slots remain. Bronze unlocks pineapple seeds (£1,500), selling for £2,000 after 120 seconds of watered daylight growth. Silver and Gold are not implemented. Existing saves must sell a melon after this update to trigger the wizard, since older versions did not record melon sales.
