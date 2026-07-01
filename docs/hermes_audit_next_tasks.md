# Hermes Audit Next Tasks

Last audited by Hermes: **2026-07-01 22:17 UTC**
Audit targets:
- Vercel playable: https://bloom-tycoon.vercel.app/
- Direct Vercel playable: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html
- GitHub Pages: https://xxxerxxxes666.github.io/bloom-tycoon/
- Repo: https://github.com/xxxerxxxes666/bloom-tycoon
- Baseline commit audited: `be484e2` on `main`

## Hermes audit verdict

No new Codex gameplay commit was detected after the prior Hermes task-file update, but the live-preview blocker has been resolved: **Vercel production now matches GitHub Pages/main for the match-shape build**. Both hosted playables return `200` and include the shape-audit payload plus the `M` prototype match-shape review hook.

Do not broadly redesign the game. The current gothic greenhouse + Diablo inventory + botanical casino direction remains the right north star.

## Verified by Hermes this audit

- Latest audited commit: `be484e23b8377edde1c22d03b566726019576dd8` (`docs: update Hermes audit tasks`).
- Latest audited gameplay feature remains `a1d10e489360c13cf04e7b6ed60bbd5ac8182b47` (`Add rewarding match shape demos`).
- `python3 scripts/verify_project.py` passes.
- Repo status was clean before this Hermes task-file update.
- HTTP checks returned `200` for:
  - Vercel `/`, `/playable/midnight_bloom_prototype.html`, and `/assets/tiles/96/amber_resin_seed.png`;
  - GitHub Pages `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png`.
- Vercel and GitHub Pages playable HTML both contain:
  - `shapeAuditData`;
  - `Witch's Cross!`;
  - `Prototype match-shape review hook`;
  - `Twin Stem Bloom!`;
  - `Night Garden L-Bloom!`.
- Vercel browser checks:
  - 89 images, 0 broken images;
  - `shapeAuditData` script exists and contains horizontal/vertical line, L, T, cross, and diagonal-negative fixtures;
  - `M` review hook cycles visible shape demos:
    - `Witch's Cross!` showed a 5-cell shape demo and +33 coins;
    - `Night Garden L-Bloom!` showed a 5-cell shape demo and +22 coins in this random-state run;
    - `Twin Stem Bloom!` showed a 5-cell shape demo and +26 coins;
  - `B` review hook reports `SUPREME BLOOM! Review hook complete. The board is ready.`;
  - direct browser wrapper click on Chest Storage opens the 12-slot modal;
  - modal close button and Escape both return the modal to `aria-hidden="true"` in the tested session;
  - Sacrifice enters offering mode and Cancel exits the visible sacrifice prompt.
- GitHub Pages browser checks:
  - 89 images, 0 broken images;
  - browser console clean: no console messages or JS errors observed;
  - `shapeAuditData` contains the same deterministic fixture keys: horizontal, vertical, l, t, cross, diagonal.
- Visual inspection: dark gothic botanical board, controls, Elements strip, and Chest Storage are present with no obvious broken image icons or layout collapse.

## New findings / blockers

No hard blockers found in this audit. Vercel parity is restored.

Remaining caution: the browser-wrapper checks exercise pointer/click semantics well enough for regression auditing, but Codex should still do one normal-browser/mobile-width verification pass before calling the controls fully polished.

---

# Priority 1 — Real pointer/tap and mobile control verification

Goal: controls should be reliable with ordinary mouse/tap on desktop and mobile-width layouts, not only programmatic/browser-wrapper events.

## Tasks

1. In a normal browser session, manually verify real pointer/tap for:
   - `Shuffle (-1 move)`;
   - `Sacrifice (-3 moves)`;
   - sacrifice cancel;
   - `Chest Storage` open/close;
   - Escape closes the chest modal.
2. If Chest Storage or other controls are unreliable, make a surgical fix only:
   - increase clickable/hit area;
   - correct z-index/overlays;
   - remove accidental `pointer-events` interference;
   - preserve current visuals.
3. At ~390px width, verify no horizontal overflow and the priority order remains:
   1. title/objective/moves;
   2. board;
   3. Shuffle/Sacrifice;
   4. Elements/Chest;
   5. tycoon rail.
4. Document exact browser/device or viewport used in `docs/codex_build_notes.md`.

## Acceptance checks

- Real mouse/tap opens Chest Storage.
- Close button and Escape close Chest Storage.
- Sacrifice can enter, choose/cancel, and exit without stuck state.
- Mobile portrait has no horizontal scrolling and board tiles remain tappable.

---

# Priority 2 — Optional polish: make demo hooks deterministic-clean

Goal: the debug/demo hooks should showcase the intended shape reward without confusing follow-on cascades, while normal play can remain juicy.

## Tasks

1. If the demo messages feel muddy, prevent extra cascades during the prototype `M` review hook only.
2. Preserve normal gameplay cascades and rewards outside the review hook.
3. Keep the hook clearly commented as prototype/debug-only.

## Acceptance checks

- `M` demo for cross, L, and T each reports the named shape and intended 5-cell union cleanly.
- Normal player-initiated matches can still cascade as designed.

---

# Strong points to preserve

- Keep `SOLVE ET COAGULA` above `Bloom Tycoon`.
- Keep the game name `Bloom Tycoon`; do not restore a subtitle.
- Keep the current dark-gothic botanical tile art.
- Keep the left tycoon rail: Greenhouse, Apothecary, Faction: Sub Rosa, Active Orders, Black Market.
- Keep the bottom Elements strip and compact Chest Storage concept.
- Keep the buttons named `Shuffle (-1 move)` and `Sacrifice (-3 moves)`.
- Keep Supreme Bloom rare in normal play, with review hooks clearly marked as prototype/debug-only.
- Keep L/T/cross reward copy and higher rewards:
  - `Night Garden L-Bloom!`;
  - `Twin Stem Bloom!`;
  - `Witch's Cross!`.

---

# Security & Safety — mandatory for every Codex pass

- Do **not** add analytics, ads, SDKs, login, backend services, tracking pixels, or monetization hooks.
- Do **not** add or commit secrets, `.env` files, private keys, tokens, credentials, machine-local paths, or broad permissions.
- Keep access repo-scoped only.
- Touch only files required for the current surgical deploy/gameplay/docs pass.
- Before committing, run a lightweight secret scan on changed files.
- Do not broadly redesign the UI or replace the current tile art unless Xerxes explicitly asks.

## Required Codex report after next pass

Update `docs/codex_build_notes.md` with:

1. files changed;
2. exact verification steps;
3. browser console status;
4. Vercel deployment URL/identifier checked if redeployed;
5. GitHub Pages preview status if checked;
6. known issues;
7. how to trigger and verify L/T/cross matches;
8. how to trigger and verify Supreme Bloom without console;
9. security/secret-scan status.

Then commit and push to `main` so Hermes can audit the live preview again.
