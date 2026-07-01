# Bloom Tycoon Prototype

A Godot 4 prototype plus a fast HTML playable for a gothic botanical match/tycoon game with a separate light tycoon/boutique progression screen.

## HTML playable

Open `playable/midnight_bloom_prototype.html` directly in a browser, or serve the repo root and open `/`.

For a local static preview:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## Core loop

**Match occult botanical elements → complete bouquet orders → earn coins/items → enter the tycoon screen → upgrade the cursed greenhouse and occult floral boutique.**

Current collectible elements:

- Sol Rot
- Bone Star
- Nightshade
- Bloodroot
- Amber Seed
- Thorn Rose

## Current prototype includes

- 8x8 botanical element match board
- Garden-bed board presentation with soil/moss plots instead of flat color tiles
- Generated Diablo-2-inspired gothic botanical tile icon set in 48px and 96px variants
- Standalone HTML playable with the reference-style gothic layout, bottom element strip, clickable Chest Storage, Sacrifice transmutation, and rare Supreme Bloom effect
- HTML icon rendering includes gothic glyph/color fallbacks so missing tile images do not show broken-image placeholders
- Adjacent tile swapping
- Candy-style legal-only swaps: normal tile swaps are accepted only when they create a match
- Match clearing, falling tiles, and cascade resolution
- Wave-by-wave falling tile cascade animation
- Orthogonal run-union matching: straight runs of 3+ merge into T/L/cross shapes when they overlap; diagonals do not count
- Random playable board generation that avoids starting matches, guarantees at least one legal move, and has a deterministic emergency fallback
- Readable named special tiles: Rose Shears-style line clears, Golden Lily-style color clears, and Orchid Burst 3x3 area clears
- Special swap activation: swapping a special tile now spends a move and releases its row/column or flower-color clear even without a normal match
- Advanced combo foundation: Golden + Golden special swaps now clear the entire board with clearer “Golden bouquet combo” feedback
- Shears Burst combo: line + area special swaps now clear three rows and three columns for stronger board-sweeping tactility
- T/L overlapping matches now create Orchid Burst area specials for stronger puzzle tactility
- Three rotating bouquet-order levels
- Coin rewards
- Sacrifice requires choosing an offering element and a glowing profitable target; successful sacrifice forces the Supreme Bloom demo payoff
- Clear objective copy and pulsing order counts when Thorn Rose or Bone Star are collected
- Always-visible next-upgrade progress meter and helper copy
- Boutique upgrade reveal modal showing the newly installed upgrade and updated next-upgrade helper
- Win/loss result modal foundation with near-win “So close” objective reminders
- Reward chest ceremony foundation on wins via the Velvet Bloom Chest
- Flowerpedia skeleton: flower lore/readability cards and a title-screen entry point
- Separate Garden Tycoon screen with five boutique upgrades
- Passive income bonus from upgrades
- Save/load progress for coins, current level, shop tier, and passive income
- Daily Bloom reward streak foundation
- Spooky-luxury temporary gameplay effects: Candlelit Focus and Midnight Velvet
- Dark elegant floral placeholder UI/art direction
- Tile art direction documented in `docs/gothic_botanical_tile_art.md`
- Research-backed product roadmap based on successful casual mobile games

## Run

1. Install Godot 4.x.
2. Open this folder as a Godot project.
3. Press **Run**.

Main scene: `res://src/Main.tscn`

## Verify

From this repo, with a Godot 4 binary available:

```bash
/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd
```

Expected output:

```text
Godot smoke test passed: match board and shop upgrade loop initialize correctly.
```

## Deploy

### GitHub Pages

1. Push this repo to GitHub as `bloom-tycoon`.
2. In GitHub, open **Settings > Pages**.
3. Set **Build and deployment** to deploy from the `main` branch at `/`.
4. Open the published Pages URL. The root `index.html` redirects to the playable, and the direct path is `/playable/midnight_bloom_prototype.html`.

### Vercel

1. Import the GitHub repo in Vercel.
2. Use the static/default project settings. No build command is required.
3. Leave the output directory as the repo root.
4. Open the Vercel deployment URL. The root `index.html` redirects to the playable.

## Hermes/Codex workflow

- Hermes maintains `docs/hermes_audit_next_tasks.md`.
- Future Codex passes must read `docs/hermes_audit_next_tasks.md` before coding.
- Codex should summarize each coding pass in `docs/codex_build_notes.md`.
- Follow Hermes' tasks unless they would break the app. Keep changes surgical and avoid redesigning everything.

## Next build milestone

Turn this into a polished vertical slice:

- Better tile art and shop background
- Fast retry and beginner tutorial polish
- Sound effects and match animations
- Touch-friendly mobile UI polish
- 20 handcrafted levels
- Basic tutorial
- Persisted Flowerpedia unlocks and collection rewards
