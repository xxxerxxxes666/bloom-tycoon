# Bloom Tycoon — Hermes to Codex Engineering Handoff

## 0. Purpose of this handoff

This document is the final handoff from Hermes/GPT to Codex. It merges Xerxes’s GPT brief with the current repo state and the actual project files/commits. Codex should use this as the controlling implementation brief.

**Codex’s role:** engineering builder and careful refactorer.  
**Not Codex’s role:** creative director, full product reimaginer, or broad architecture replacer.

---

## 1. Current project overview

### App

- **Name:** Bloom Tycoon
- **Genre:** gothic botanical match-3 / light tycoon game
- **Style target:** Diablo 2 inventory UI meets cursed greenhouse / apothecary / gothic casino
- **Core fantasy:** match occult botanical elements, fulfill orders, collect resources, upgrade a dark greenhouse/apothecary empire, and occasionally trigger rare casino-like jackpot effects.

### Current tech stack

- **Primary game engine:** Godot 4.2.2
- **Primary code:** GDScript in `src/Main.gd`
- **Scene:** `src/Main.tscn`
- **Smoke test:** `tests/godot_smoke_test.gd`
- **Verifier:** `scripts/verify_project.py`
- **Fast visual prototype:** standalone HTML/CSS/JS at `playable/midnight_bloom_prototype.html`
- **Generated/curated tile art:** PNG assets under `assets/tiles/`

### Project path

```bash
/opt/data/bloom-empire-prototype
```

The folder name still says `bloom-empire-prototype`, but the app is now **Bloom Tycoon**.

### Key files

```text
README.md
project.godot
src/Main.gd
src/Main.tscn
tests/godot_smoke_test.gd
scripts/verify_project.py
playable/midnight_bloom_prototype.html
assets/tiles/48/*.png
assets/tiles/96/*.png
assets/tiles/generated/diablo_gothic_botanical_spritesheet.png
docs/reference_ui_direction.md
docs/gothic_botanical_tile_art.md
docs/occult_gothic_boutique_visual_direction.md
docs/research/name_research.md
docs/research/feature_roadmap.md
docs/references/user_diablo2_garden_reference.jpg
```

### How to run locally

#### Godot

Open the folder as a Godot 4 project and run:

```text
res://src/Main.tscn
```

Pinned Godot binary used by Hermes:

```bash
/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64
```

#### Godot smoke test

From project root:

```bash
/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd
```

Expected output:

```text
Godot smoke test passed: match board and shop upgrade loop initialize correctly.
```

#### Project verifier

```bash
python3 scripts/verify_project.py
```

Expected output:

```text
Bloom Tycoon project verification passed.
```

#### Browser / HTML visual prototype

Open:

```text
playable/midnight_bloom_prototype.html
```

This HTML file currently reflects the most recent reference-image layout more closely than the Godot UI. It is a useful visual target/prototype, but the long-term playable game should be Godot.

### Current working state

Current latest known commit at handoff time:

```text
8452bef feat: add reference layout and supreme bloom effect
```

Recent important commits:

```text
8452bef feat: add reference layout and supreme bloom effect
1d0ce8c fix: replace tile art with darker gothic reference pass
c7cf4ca feat: add gothic botanical tile artwork
09c58ba feat: rename to Bloom Tycoon and add garden tycoon screen
a488a90 docs: refine occult boutique positioning and playable html
```

Current Godot features include:

- 8x8 board
- tile swapping
- match detection / clearing / gravity / cascade
- special tiles: line, color, area
- special swap activation
- Golden + Golden full-board combo logic
- line + area Shears Burst combo logic
- reward/result modal foundations
- separate tycoon/shop screen foundation
- Flowerpedia foundation
- Daily Bloom reward foundation
- temporary effects: Candlelit Focus and Midnight Velvet
- generated gothic botanical tile icons integrated via PNG loading
- Supreme Bloom helper functions for rare full-board-style clears

Current HTML visual prototype includes:

- left tycoon panels
- central board
- bottom elements strip
- lower-right chest storage panel
- Sacrifice placeholder button
- Supreme Bloom overlay effect

### Known bugs / broken or rough parts

1. **HTML prototype may have a browser console “exception” noise** from local-file/image/runtime timing. The UI renders and functions, but Codex should audit and eliminate any JS errors.
2. **HTML and Godot are not visually equivalent.** HTML currently better matches the reference; Godot has more gameplay logic but older/simple layout.
3. **Godot UI is still too simple.** It needs to be brought closer to `docs/reference_ui_direction.md` and the HTML reference layout.
4. **The HTML file is currently compressed into long CSS/JS lines.** Codex should format it if editing, but avoid a total rewrite unless necessary.
5. **Generated tile art is better than the first pass but still needs curation.** The first bad pass is archived at `assets/tiles/rejected/first_rejected_too_mobile_spritesheet.png`.
6. **Chest storage is only conceptual/visual.** It does not yet have a real inventory data model.
7. **Sacrifice is a placeholder.** It exists to test the large-match/Supreme Bloom feel, not final gameplay balance.
8. **No real deployment link yet.** HTML is local; Godot web export is not set up.

---

## 2. Current UI state

### Title area

Current desired title area:

- Keep `SOLVE ET COAGULA` above the title.
- Main title is `Bloom Tycoon`.
- Remove the subtitle beneath the title in the main screen. Specifically remove text such as:
  - `Garden match`
  - `Boutique tycoon`
  - `Sub Rosa` as a subtitle under the title

The HTML prototype still currently has subtitle text. Removing it is a priority.

### Board layout

- 8x8 grid.
- Center of the screen.
- Should feel like a Diablo-style inventory/ritual board.
- Current HTML board is closer to target than Godot.
- Board should have breathing room — avoid crowding it with too many bars/panels.

### Tile system

Current collectible botanical resources:

1. Sol Rot
2. Bone Star
3. Nightshade
4. Bloodroot
5. Amber Seed
6. Thorn Rose

These are **collectible botanical resources**, not merely labels.

Godot names currently map to more descriptive internal names:

- Withered Sun / Sol Rot direction
- Bone Thorn Star / Bone Star direction
- Nightshade Bloom / Nightshade direction
- Bloodroot Shard / Bloodroot direction
- Amber Resin Seed / Amber Seed direction
- Crimson Rose Rune / Thorn Rose direction

Codex can normalize display names, but do not change the six-resource concept without asking.

### Left panels

Current/desired left panels:

- Greenhouse
- Apothecary
- Faction/Reputation
- Active Orders
- Black Market

### Greenhouse

- Keep Greenhouse on the left.
- Include level bar.
- Later becomes visitable/upgradable.

### Apothecary

- Keep/Add Apothecary under Greenhouse.
- Include level bar.
- Later becomes visitable/upgradable and may support crafting/combining.

### Faction/Reputation

- Keep faction reputation.
- Current faction text: `Faction: Sub Rosa`.
- Factions should later represent RPG-style client tribes/factions.

### Active Orders

- Keep Active Orders.
- Active Orders are the main short-term goals.
- Matching tiles/resources should progress these orders.

### Black Market

- Keep Black Market.
- Later sells rare bulbs, contraband, boosts, keys, cursed upgrades.

### Elements

- Bottom Elements strip shows the six resource types.
- Elements should show icon, name, lore/meaning, and count.

### Chest / inventory

- Remove small chest icon from left panel if present.
- Move chest access to lower-right where `Chest Storage` currently is.
- Main screen should show only a **compact clickable chest icon/panel**, not a full inventory grid.
- Clicking chest opens a separate storage/inventory modal or screen.
- Chest has limited space and stores items from matches, orders, drops, or Black Market.
- Chest items can later combine or create/upgrade elements.

### Coins/resources

- Put coins/resources near the bottom so the board can breathe.
- Remove any extra horizontal chest/coins bar if it exists.

### Buttons

Keep bottom buttons:

- `Shuffle (-1 move)`
- `Sacrifice (-3 moves)`

Sacrifice is currently placeholder. It should remain but can be improved as a deliberate risk/reward mechanic later.

---

## 3. Visual direction

UI should feel like **Diablo 2 as a gothic gardening game**:

- dark carved stone
- blackened wood
- antique gold typography
- blood red accents
- deep purple accents
- jewel-toned botanical icons
- occult greenhouse/apothecary mood
- ornate but readable
- grimy, ancient, high-contrast

Avoid:

- cute/candy-like mobile style
- flat emoji-style symbols
- generic mobile puzzle UI
- clean corporate iconography
- pastel colors
- over-bright cheerful flowers
- AI slop / mushy unreadable generated assets

Reference image saved at:

```text
docs/references/user_diablo2_garden_reference.jpg
```

Use this reference before making UI decisions.

---

## 4. Final design decisions

These are explicit design decisions from Xerxes. Follow exactly unless he changes them.

- Keep `SOLVE ET COAGULA` above the title.
- Remove the subtitle under `Bloom Tycoon`, including `Garden match`, `Boutique tycoon`, and `Sub Rosa`.
- Keep title: `Bloom Tycoon`.
- Keep bottom buttons: `Shuffle (-1 move)` and `Sacrifice (-3 moves)`.
- Keep Greenhouse on the left with level bar.
- Keep/Add Apothecary under Greenhouse with level bar.
- Keep faction reputation, currently `Faction: Sub Rosa`.
- Keep Active Orders.
- Keep Black Market.
- Remove small chest icon from left panel.
- Move chest access to lower-right where `Chest Storage` currently is.
- Main screen should show only a compact clickable chest icon/panel, not a full inventory grid.
- Clicking chest opens a separate storage/inventory modal or screen.
- Remove any extra horizontal chest/coins bar if it exists.
- Put coins/resources near the bottom so the board can breathe.
- Do not heavily redesign the rest.

---

## 5. Planned gameplay

- Matching tiles collects botanical ingredients/elements.
- Elements are used for orders, upgrades, crafting, factions, and room progression.
- Greenhouse and Apothecary become visitable/upgradable later.
- Chest has limited space and stores items from matches, orders, drops, or Black Market.
- Chest items can later combine or create/upgrade elements.
- Black Market later sells rare bulbs, contraband, boosts, keys, and cursed upgrades.
- Faction reputation should create RPG-style client tribes/factions.
- Active Orders are the main short-term goals.

### Resource loop

Short-term:

```text
Match resources → collect elements → progress Active Orders → earn coins/items → upgrade tycoon panels
```

Mid-term:

```text
Collect rare drops → store in chest → craft/combine via Apothecary → unlock Greenhouse/Black Market upgrades
```

Long-term:

```text
Advance factions → unlock client tribes/orders → gain rare botanical lines → improve retention and replay
```

---

## 6. Tile elements

Current elements:

- Sol Rot
- Bone Star
- Nightshade
- Bloodroot
- Amber Seed
- Thorn Rose

Clarification: these are **collectible botanical resources**. They should be used in orders, upgrades, faction requests, crafting, and later chest/Black Market systems.

Current art assets:

```text
assets/tiles/48/withered_sun_medallion.png
assets/tiles/48/bone_white_thorn_star.png
assets/tiles/48/purple_nightshade_bloom.png
assets/tiles/48/bloodroot_ruby_shard.png
assets/tiles/48/amber_resin_seed.png
assets/tiles/48/crimson_rose_rune.png

assets/tiles/96/withered_sun_medallion.png
assets/tiles/96/bone_white_thorn_star.png
assets/tiles/96/purple_nightshade_bloom.png
assets/tiles/96/bloodroot_ruby_shard.png
assets/tiles/96/amber_resin_seed.png
assets/tiles/96/crimson_rose_rune.png
```

The names in code/docs can be harmonized later, but do it carefully and update tests.

---

## 7. Match effects

For supreme/great matches, show a gothic casino / Diablo reward effect:

- blood splatter burst
- red glowing slash or bloom explosion
- `SUPREME BLOOM!` or similar text
- coin reward like `+12`
- petals, sparks, or shards
- dark, rich, dramatic, satisfying
- not goofy/cartoonish
- fades cleanly and does not permanently obscure board

### Supreme Bloom trigger policy

Supreme Bloom should be rare.

Trigger on:

- huge rare matches, e.g. 5+ in HTML prototype
- full-board or very high-value special combos in Godot, such as Golden + Golden

Do **not** trigger on:

- normal 3-matches
- routine small clears
- ordinary line clears
- every special tile

Godot currently has:

```gdscript
func is_supreme_bloom_clear(cleared_count: int) -> bool
func supreme_bloom_reward_bonus(cleared_count: int) -> int
```

HTML currently has a Supreme Bloom overlay and a `Sacrifice (-3 moves)` placeholder to force/test the effect.

---

## 8. Codex next tasks

### A. Audit files and identify main HTML/CSS/JS

- Start with:
  - `playable/midnight_bloom_prototype.html`
  - `src/Main.gd`
  - `tests/godot_smoke_test.gd`
  - `scripts/verify_project.py`
  - `README.md`
  - `docs/reference_ui_direction.md`
- Confirm current git status before editing.

### B. Preserve current layout/style

- Do not start from scratch.
- Keep the current reference-style layout and improve surgically.
- The HTML prototype is the closest visual target.

### C. Remove subtitle under title

- Remove the subtitle line under `Bloom Tycoon` in the main HTML screen.
- Specifically remove text such as:
  - `Garden match + boutique tycoon · Sub Rosa`
- Keep `SOLVE ET COAGULA` above the title.

### D. Keep `SOLVE ET COAGULA`

- It should remain above the title.
- Keep it subtle, antique, ritualistic.

### E. Remove chest from left panel

- If any chest icon or chest access appears in left panel, remove it.
- Left panel should be Greenhouse, Apothecary, Faction, Active Orders, Black Market.

### F. Convert lower-right chest area into compact clickable panel

- Lower-right `Chest Storage` should be a compact clickable panel.
- It should not show a full inventory grid on the main screen.

### G. Create chest storage modal/screen

- Clicking the lower-right chest opens a modal or separate screen.
- Modal/screen should show limited chest slots.
- Add placeholder items if needed.
- Include close/back control.
- Keep gothic Diablo style.

### H. Keep coins/resources near bottom without crowding board

- Coin/resource readout should live near bottom.
- Avoid extra horizontal bars that make the board feel cramped.

### I. Add/improve `Sacrifice (-3 moves)` placeholder

- Keep the button text exactly:

```text
Sacrifice (-3 moves)
```

- It can remain a placeholder but should feel intentional.
- It may trigger a risky/costly board effect for testing Supreme Bloom.
- Do not overbalance now.

### J. Add/improve supreme match blood/casino effect

- Improve the current Supreme Bloom overlay.
- Should feel like a rare jackpot:
  - blood/red crystal burst
  - slash/light explosion
  - `SUPREME BLOOM!`
  - `+12` reward
  - petals/sparks/shards
- Should fade and leave the board usable.
- Should not trigger constantly.

### K. Keep code organized; avoid large rewrites

- HTML is currently compact; format it if helpful.
- Prefer small, reviewable changes.
- Do not replace the architecture unless asked.

### L. Add comments explaining game systems

Add concise comments for:

- match collection loop
- chest system placeholder
- Supreme Bloom trigger policy
- Sacrifice placeholder
- left panel progression placeholders

---

## 9. Recommended first Codex task prompt

Use this exact first prompt if handing the repo to Codex:

```text
You are taking over Bloom Tycoon, a gothic botanical match-3 / tycoon prototype.

Read docs/codex_handoff.md, docs/reference_ui_direction.md, README.md, playable/midnight_bloom_prototype.html, src/Main.gd, tests/godot_smoke_test.gd, and scripts/verify_project.py.

Do a surgical cleanup of the current HTML playable first, without redesigning everything:
1. Remove the subtitle under “Bloom Tycoon” but keep “SOLVE ET COAGULA” above the title.
2. Keep the left panels: Greenhouse, Apothecary, Faction: Sub Rosa, Active Orders, Black Market.
3. Ensure there is no chest icon/panel in the left panel.
4. Convert lower-right “Chest Storage” into a compact clickable panel.
5. Clicking that chest panel should open a gothic storage modal/screen with limited slot placeholders and a close button.
6. Keep coins/resources near the bottom and avoid crowding the board.
7. Keep buttons “Shuffle (-1 move)” and “Sacrifice (-3 moves)”.
8. Improve the Supreme Bloom overlay so it feels like a rare gothic casino jackpot: blood/red bloom burst, slash/glow, “SUPREME BLOOM!”, “+12”, sparks/petals/shards. It must fade cleanly and not permanently obscure the board.
9. Keep the app functional after every change. Test by opening playable/midnight_bloom_prototype.html in a browser and checking the console.
10. Run Godot smoke test and verifier after changes:
   /opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd
   python3 scripts/verify_project.py

Do not redesign everything. Make surgical changes. Preserve the gothic Diablo botanical style. Explain changed files and how to verify. Ask before replacing the architecture.
```

---

## 10. Verification requirements for Codex

Before reporting done, Codex should run:

```bash
git status --short
/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd
python3 scripts/verify_project.py
```

Also browser-test:

```text
Open playable/midnight_bloom_prototype.html
Open dev console
Confirm no JS errors
Click Shuffle
Click Sacrifice
Confirm Supreme Bloom appears only for big/forced rare event and fades cleanly
Click Chest Storage
Confirm modal/screen opens and closes
```

If Codex cannot open a browser, it should at least document what it could not verify and why.

---

## 11. Message to Codex

Codex, do not redesign everything. Make surgical changes. Preserve the gothic Diablo botanical style. Keep the app functional after every change. Test in browser. Explain changed files and how to verify. Ask before replacing the architecture.

Priority: preserve the strong visual direction while making the app cleaner, more playable, and easier to expand.
