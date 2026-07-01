# Bloom Tycoon — Reference UI Direction

## User-approved target

The attached reference image `img_a144334e0d58.jpg` is the strongest current north star. The game should feel like:

> Diablo 2 dark fantasy inventory UI + gothic greenhouse management + casino-style rare-match celebration.

## Layout requirements

- **Left vertical tycoon panel** with framed greenhouse image and stacked progression cards:
  - Greenhouse level / XP
  - Apothecary level / XP
  - Faction: Sub Rosa reputation
  - Active Orders
  - Black Market
- **Main center board** as the altar: 8x8 carved dark inventory slots.
- **Top title stack**:
  - `SOLVE ET COAGULA`
  - large aged serif `Bloom Tycoon`
  - objective strip with level, moves, and active order counts
  - purple/gold progress bar
- **Bottom strip**:
  - Elements inventory with icon, name, lore, and count.
  - Chest Storage panel.
  - Coin/bonus readout.

## Supreme Bloom rule

The **SUPREME BLOOM** pop-up and casino-style burst should be rare.

Trigger only when:

- a huge rare match is made, e.g. 5+ in the HTML prototype, or
- a full-board / very high-value special combo is made in Godot, such as Golden + Golden.

Do **not** show it on normal 3-matches or small special clears. Normal matches should feel good, but Supreme Bloom should feel like a jackpot.

## Visual effect requirements

- Red crystal/rose eruption from the center of the board.
- Cross-shaped light slash.
- Screen-centered `SUPREME BLOOM!` text.
- Bonus readout such as `+12 ✪`.
- Brief casino-style anticipation and payoff, but not too frequent.

## Current implementation

- Godot has helper logic:
  - `is_supreme_bloom_clear()`
  - `supreme_bloom_reward_bonus()`
  - special combo summary returns `SUPREME BLOOM!` for full-board clears.
- HTML playable has the reference layout and a Supreme Bloom overlay that triggers on rare 5+ matches.
