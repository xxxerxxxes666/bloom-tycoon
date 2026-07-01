# Hermes Audit Next Tasks

Last audited by Hermes: **2026-07-01 21:08 UTC**
Audit targets:
- Vercel playable: https://bloom-tycoon.vercel.app/
- Direct Vercel playable: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html
- GitHub Pages: https://xxxerxxxes666.github.io/bloom-tycoon/
- Repo: https://github.com/xxxerxxxes666/bloom-tycoon
- Baseline commit audited: `edf8e79` on `main`

## Hermes audit verdict

Codex has landed the important first-session polish and the match grammar now supports intersecting straight-line shapes. The current screen remains handsome and on-concept: **gothic greenhouse + Diablo inventory + botanical casino**. Do not broadly redesign it.

The next pass should convert the new L/T/cross matching into **visible fun**. Hermes verified the underlying browser helper clears horizontal, vertical, L, T, and cross unions correctly and rejects diagonal-only clusters, but the player-facing reward language is still generic. Larger/intersecting shapes need named copy, obvious bonus feedback, and a deterministic review/demo path so Xerxes and Hermes can see the fun without relying on random boards.

## Verified by Hermes this audit

- Latest audited commit: `edf8e79dcbdf030623e938a6988de7f1d3831c5d` (`docs: add Xerxes match-shape directive`).
- `python3 scripts/verify_project.py` passes.
- Repo status was clean before this Hermes task-file update.
- Vercel endpoints returned `200`:
  - `/`
  - `/playable/midnight_bloom_prototype.html`
  - `/assets/tiles/96/amber_resin_seed.png`
- GitHub Pages endpoints returned `200`:
  - `/bloom-tycoon/`
  - `/bloom-tycoon/playable/midnight_bloom_prototype.html`
  - `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png`
- Browser console on Vercel and GitHub Pages was clean: no console messages or JS errors observed.
- Browser image check: **89 images, 0 broken** on both Vercel and GitHub Pages.
- Deterministic browser checks against the live helper logic passed:
  - horizontal 3-match clears 3 cells;
  - vertical 3-match clears 3 cells;
  - L-shape clears the 5-cell union of both legs;
  - T-shape clears the 5-cell union;
  - cross-shape clears all 5 cells;
  - diagonal-only same-element clusters do **not** clear.
- `B` keyboard hook exists and shows the Supreme Bloom text/reward path.
- Programmatic Chest Storage click opens the 12-slot modal and Escape closes it.

## Strong points to preserve

- Keep `SOLVE ET COAGULA` above `Bloom Tycoon`.
- Keep the game name `Bloom Tycoon`; do not restore a subtitle.
- Keep the current dark-gothic botanical tile art.
- Keep the left tycoon rail: Greenhouse, Apothecary, Faction: Sub Rosa, Active Orders, Black Market.
- Keep the bottom Elements strip and compact Chest Storage concept.
- Keep the buttons named `Shuffle (-1 move)` and `Sacrifice (-3 moves)`.
- Keep Supreme Bloom rare in normal play, with review hooks clearly marked as prototype/debug-only.

---

# Priority 1 — Make L/T/cross matches feel fun and legible

Goal: the mechanical shape support should be obvious to a player and more rewarding than ordinary 3-matches.

## Tasks

1. Add player-facing shape classification for intersecting straight-line matches:
   - L-shape: show copy like `Night Garden L-Bloom!`;
   - T-shape: show copy like `Twin Stem Bloom!`;
   - cross-shape: show copy like `Witch's Cross!`;
   - keep normal 3-match copy more restrained.
2. Make larger/intersecting shapes visibly more rewarding:
   - stronger burst from all cells in the union;
   - visibly higher coin/resource reward than a plain 3-match;
   - no double-counting overlapping center cells.
3. Ensure the match result summary reports the special shape before/with the harvest total, not just generic `5 tiles harvested` text.
4. Keep Supreme Bloom as a rare follow-on; L/T/cross may build toward it, but should **not** trigger Supreme Bloom too often.
5. Do not introduce diagonal matching.

## Acceptance checks

- A horizontal + vertical intersection clears the union of both lines.
- An L shape clears both legs and shows special L-shape copy.
- A T shape clears both arms/stem and shows special T-shape copy.
- A cross shape clears all four arms and shows special cross copy.
- Diagonal-only same-element clusters do not clear.
- Larger shapes pay more than ordinary 3-matches and visibly feel stronger.
- Browser console remains clean.

---

# Priority 2 — Add a deterministic shape review/demo path

Goal: Hermes and Xerxes should be able to review L/T/cross behavior without waiting for luck.

## Tasks

1. Add a clearly commented prototype/debug review path for shape tests. Choose one surgical option:
   - keyboard cycle such as `L`, `T`, `C` to seed/demo L, T, and cross boards; or
   - a tiny hidden/dev-only demo control; or
   - an in-browser self-test function documented in `docs/codex_build_notes.md`.
2. The path should visibly demonstrate the clear/reward behavior in the actual board, not only return arrays in the console.
3. Add/keep regression coverage where practical so the shape grammar cannot silently revert to single-line-only matching.
4. Document exact trigger steps in `docs/codex_build_notes.md`.

## Acceptance checks

- Hermes can trigger and visually observe each of L, T, and cross on the live playable.
- Demo/review hooks are plainly commented as prototype-only.
- Normal players are not confronted with debug UI by default.

---

# Priority 3 — Verify real pointer access to core controls

Goal: controls should be reachable and reliable with ordinary mouse/tap, not only programmatic `.click()`.

## Findings this audit

- Programmatic Chest Storage click opens the modal and Escape closes it.
- The browser accessibility click did not clearly open Chest Storage until Hermes used `.click()` from the page context. This may be a browser-wrapper/scroll issue, but Codex should verify real pointer/tap behavior anyway.
- The page is visually rich and tall; make sure Shuffle, Sacrifice, Elements, and Chest remain easy to reach on common laptop and portrait-mobile viewports.

## Tasks

1. Manually verify real mouse/tap for:
   - `Shuffle (-1 move)`;
   - `Sacrifice (-3 moves)`;
   - sacrifice cancel;
   - `Chest Storage` open/close;
   - Escape closes the chest modal.
2. If any are unreliable, fix hit area, z-index, pointer-events, or scroll positioning.
3. Preserve the 12-slot Diablo-style chest modal and purpose copy:
   - `Stores rare bulbs, order rewards, contraband, and upgrade reagents.`
4. At ~390px width, ensure no horizontal overflow and the priority order remains:
   1. title/objective/moves;
   2. board;
   3. Shuffle/Sacrifice;
   4. Elements/Chest;
   5. tycoon rail.

## Acceptance checks

- Real mouse/tap opens Chest Storage.
- Close button and Escape close Chest Storage.
- Sacrifice can enter, choose/cancel, and exit without stuck state.
- Mobile portrait has no horizontal scrolling and board tiles remain tappable.

---

# Priority 4 — Preserve first-session polish while adding shape fun

The earlier first-session tasks appear landed and should not regress:

- compact instruction plaque near the objective/board;
- delayed legal-swap idle hint;
- first valid match teaches that resources feed orders/upgrades/contraband;
- order-specific Thorn Rose/Bone Star messages;
- visible match glow/resource particles/count pulses;
- invalid swap rejection message: `The garden refuses that graft.`;
- Supreme Bloom review hook on `B` with readable text/reward;
- sacrifice copy and cancel affordance.

## Regression checks

- Fresh page still explains the First Bouquet.
- Waiting 6–8 seconds suggests a legal move, then stops after first valid match.
- Valid 3-match has visible feedback but does not trigger Supreme Bloom.
- Invalid adjacent swap gives visible rejection feedback.
- Pressing `B` shows Supreme Bloom and returns the board to a usable state.
- Browser console remains clean.

---

# Security & Safety — mandatory for every Codex pass

- Do **not** add analytics, ads, SDKs, login, backend services, tracking pixels, or monetization hooks.
- Do **not** add or commit secrets, `.env` files, private keys, tokens, credentials, machine-local paths, or broad permissions.
- Keep access repo-scoped only.
- Touch only files required for the current surgical gameplay/docs pass.
- Before committing, run a lightweight secret scan on changed files.
- Do not broadly redesign the UI or replace the current tile art unless Xerxes explicitly asks.

## Required Codex report after next pass

Update `docs/codex_build_notes.md` with:

1. files changed;
2. exact verification steps;
3. browser console status;
4. Vercel preview URL checked;
5. GitHub Pages preview status if checked;
6. known issues;
7. how to trigger and verify L/T/cross matches;
8. how to trigger and verify Supreme Bloom without console.

Then commit and push to `main` so Hermes can audit the live preview again.
