# Hermes Audit Next Tasks

Last audited by Hermes: **2026-07-01 19:41 UTC**  
Audit targets:
- Vercel playable: https://bloom-tycoon.vercel.app/
- Direct Vercel playable: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html
- GitHub Pages: https://xxxerxxxes666.github.io/bloom-tycoon/
- Repo: https://github.com/xxxerxxxes666/bloom-tycoon
- Baseline commit audited: `c02f7cc` on `main`

## Hermes audit verdict

The direct audit loop is now viable. The repo, Vercel preview, GitHub Pages preview, and core tile assets are reachable. The playable has a strong dark-gothic botanical identity and should **not** be broadly redesigned.

The next Codex pass should focus on **first-session playability and reviewable interaction polish**: the game looks good, but a fresh player still needs clearer guidance, more visible normal-match reward feedback, and a reliable way to see the Supreme Bloom jackpot without using the console.

## Verified by Hermes

- `git clone https://github.com/xxxerxxxes666/bloom-tycoon.git` succeeds.
- Repo latest audited commit: `c02f7cc`.
- `python3 scripts/verify_project.py` passes.
- Vercel endpoints return `200`:
  - `/`
  - `/playable/midnight_bloom_prototype.html`
  - `/assets/tiles/96/amber_resin_seed.png`
- GitHub Pages endpoints return `200`:
  - `/bloom-tycoon/`
  - `/bloom-tycoon/playable/midnight_bloom_prototype.html`
  - `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png`
- Browser inspection on Vercel found **0 broken images** out of **89 images**.
- Main screen preserves the required design decisions:
  - `SOLVE ET COAGULA` remains above title.
  - Title is `Bloom Tycoon`.
  - No subtitle under title.
  - Left panels remain: Greenhouse, Apothecary, Faction: Sub Rosa, Active Orders, Black Market.
  - Bottom Elements strip remains.
  - Lower-right Chest Storage remains compact.
  - Buttons remain `Shuffle (-1 move)` and `Sacrifice (-3 moves)`.
- `showSupreme()` exists and creates `84` particles when called from console.
- `Sacrifice (-3 moves)` logic exists and has better explanatory copy than the previous bundle.

## Strong points to preserve

- The current visual identity is finally coherent: **gothic greenhouse + Diablo inventory + botanical casino**.
- The board tiles now look like dark fantasy botanical loot icons rather than candy/emoji.
- The composition is handsome and premium on desktop.
- The left rail communicates future tycoon/RPG depth.
- Elements + Chest Storage give the match loop a collecting/inventory promise.
- The current screen is worth polishing; do not restart it.

## Current blockers / concrete issues

1. **First 30 seconds are still not obvious enough.** The board looks beautiful, but a new player is not strongly guided toward the first move or told why matching matters.
2. **Normal match feedback is still too quiet.** The player needs obvious but tasteful confirmation: matched tiles, collected resources, objective progress, and coins should visibly react.
3. **Supreme Bloom is not reviewable from normal UI.** Pressing `B` currently does nothing. The effect exists via `showSupreme()`, but Hermes had to trigger it from console. Reviewers need a reliable prototype path.
4. **Chest Storage user-click needs verification.** Programmatic `document.getElementById('chestTrigger').click()` opens the modal and shows 12 slots. Browser accessibility click did not clearly open it during Hermes audit, so Codex should verify real mouse/tap behavior and fix hit area/z-index/pointer issues if needed.
5. **Desktop is strong; mobile portrait still needs a real pass.** CSS has a `max-width: 760px` breakpoint, but the approved art direction is mobile portrait. The narrow layout needs explicit verification at ~390px width.
6. **Repo handoff file is still the starter note.** This file now replaces the starter note with actionable tasks. Codex should read this file before coding and update `docs/codex_build_notes.md` after the pass.

---

# Priority 1 — Make the first 30 seconds playable

Goal: a fresh player should know what to do, why it matters, and what changed after one move.

## Tasks

1. Add a compact instruction plaque near the objective/board:
   - Initial copy: `Match Thorn Rose and Bone Star to complete the First Bouquet.`
   - Keep it gothic and small; no bright mobile-game tutorial box.
2. Add an idle hint after ~6–8 seconds of no interaction:
   - subtly pulse one legal swap pair;
   - stop hinting after the first valid player move;
   - do not block interaction.
3. After the first successful match, update the ritual message to something educational:
   - `Good. Resources feed orders, upgrades, and contraband.`
4. When a match collects an order resource, show a specific message:
   - `+3 Thorn Rose added to Velvet Funeral.`
   - `+3 Bone Star added to Saint's Offering.`

## Acceptance checks

- Open the page fresh and wait 8 seconds: one legal move is subtly suggested.
- Make any valid match: the message changes and the hint stops.
- Make a Thorn Rose/Bone Star match: corresponding objective/order count visibly reacts.

---

# Priority 2 — Normal match reward feedback

Goal: ordinary matches should feel satisfying even when they are not Supreme Bloom jackpots.

## Tasks

1. On valid match:
   - matched tiles briefly glow with gold/red/purple edge light;
   - tile clear waits long enough to perceive the match, but does not slow the game.
2. Add lightweight resource collection feedback:
   - small resource/coin particles move from matched cells toward the objective strip or Elements strip;
   - objective/Elements count pulses when updated.
3. Add invalid swap feedback:
   - selected/attempted tiles wobble or red-flash briefly;
   - message: `The garden refuses that graft.`
4. Keep cascades brisk and prevent double-counting.

## Acceptance checks

- Valid 3-match has visible feedback.
- Invalid adjacent swap has visible rejection feedback.
- Cascades still complete without stuck resolving state.
- Browser console remains clean.

---

# Priority 3 — Supreme Bloom review path and jackpot polish

Goal: Supreme Bloom should be rare in gameplay but easy to review in the prototype.

## Tasks

1. Keep Supreme Bloom hidden by default.
2. Add a clearly commented prototype/debug keyboard hook:
   - pressing `B` triggers a Supreme Bloom demo;
   - comment: `Prototype review hook; remove or gate before production.`
3. Ensure profitable Sacrifice can also demonstrate Supreme Bloom reliably for review.
4. Add a short anticipation beat before impact:
   - 250–400ms board darkening or red charge;
   - then centered `SUPREME BLOOM!` and `+12 ✪`.
5. Make the effect readable at desktop and mobile sizes:
   - text must not vanish before a reviewer sees it;
   - keep duration about 2–2.5s;
   - board should be playable again afterward.
6. Normal 3-matches must **not** trigger Supreme Bloom.

## Acceptance checks

- Press `B`: Supreme Bloom visibly appears without console commands.
- Effect text and reward are readable.
- Effect fades cleanly and board remains usable.
- Normal 3-match does not trigger Supreme Bloom.

---

# Priority 4 — Sacrifice clarity and completion flow

Goal: Sacrifice should become a signature ritual mechanic, not a confusing debug button.

## Tasks

1. Keep current explanatory copy, but make the flow more obvious:
   - `Choose an offering element, then replace one glowing tile. Costs 3 moves. Strong offerings may trigger Supreme Bloom.`
2. After choosing an element:
   - profitable target tiles should glow more clearly than all other tiles;
   - non-profitable tiles should either be disabled or produce a clear weak-result warning.
3. On profitable Sacrifice:
   - spend 3 moves;
   - resolve the created match;
   - return to normal board mode;
   - remove all sacrifice highlights;
   - trigger the reviewable Supreme Bloom path when appropriate.
4. Make `Cancel` visually obvious and keyboard accessible.

## Acceptance checks

- Click `Sacrifice (-3 moves)` → choose element → glowing targets are obvious.
- Click profitable target → board resolves, moves decrease by 3, sacrifice mode exits.
- Click Cancel → mode exits and highlights clear.
- No stuck state if player clicks during cascade/resolution.

---

# Priority 5 — Chest Storage click reliability and purpose

Goal: Chest should feel like a real inventory destination without dominating the main screen.

## Tasks

1. Verify normal mouse click/tap on the lower-right Chest Storage panel opens the modal.
2. If unreliable, fix hit area/z-index/pointer-event/scroll issues so actual user click works, not just programmatic `.click()`.
3. Add hover/focus styling that makes Chest Storage obviously clickable.
4. Inside modal, preserve 12-slot Diablo inventory style and add purpose copy:
   - `Stores rare bulbs, order rewards, contraband, and upgrade reagents.`
5. Add footer hint:
   - `Future: combine stored relics into stronger botanical elements.`
6. Ensure Escape closes the modal.

## Acceptance checks

- Manual/browser click opens modal.
- Close button closes modal.
- Escape closes modal.
- No full inventory grid appears on main screen.

---

# Priority 6 — Mobile portrait verification pass

Goal: the approved target reads like a portrait mobile game; desktop can remain ornate, but mobile must be playable.

## Tasks

1. Verify at approximately 390px width.
2. Prevent horizontal overflow.
3. Keep board tiles tappable and readable.
4. Preserve priority order on mobile:
   1. title/objective/moves;
   2. board;
   3. Shuffle/Sacrifice;
   4. Elements/Chest;
   5. tycoon rail.
5. If the left tycoon rail stacks below the board, ensure Greenhouse/Apothecary are still reachable but not above the core first move.
6. Reduce tiny copy on mobile rather than shrinking everything into illegibility.

## Acceptance checks

- At ~390px width, page has no horizontal scrolling.
- Objective and moves are readable.
- Board is tappable.
- Chest remains findable.

---

# Do not change yet

- Do not rename the game.
- Do not restore any subtitle under `Bloom Tycoon`.
- Do not remove `SOLVE ET COAGULA`.
- Do not redesign the full UI from scratch.
- Do not add login/accounts/backend/ads/monetization.
- Do not replace current tile art unless Xerxes explicitly asks.
- Do not deeply implement all tycoon systems yet; first make the first session understandable and satisfying.

## Required Codex report after next pass

Update `docs/codex_build_notes.md` with:

1. files changed;
2. exact verification steps;
3. browser console status;
4. Vercel preview URL checked;
5. GitHub Pages preview status if checked;
6. known issues;
7. how to trigger and verify Supreme Bloom without console.

Then commit and push to `main` so Hermes can audit the live preview again.
