# Hermes Audit Next Tasks

Last audited by Hermes: **2026-07-01 21:43 UTC**
Audit targets:
- Vercel playable: https://bloom-tycoon.vercel.app/
- Direct Vercel playable: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html
- GitHub Pages: https://xxxerxxxes666.github.io/bloom-tycoon/
- Repo: https://github.com/xxxerxxxes666/bloom-tycoon
- Baseline commit audited: `a1d10e4` on `main`

## Hermes audit verdict

Codex landed the match-shape fun pass on `main`: L/T/cross matches now have named reward copy, stronger rewards, deterministic hidden audit data, and an `M` prototype review hook. GitHub Pages is serving the new build and looks good. **Vercel is stale** and is still serving the prior build without the shape-audit payload or `M` review hook, so the next pass should chiefly restore Vercel to parity.

Do not broadly redesign the game. The current gothic greenhouse + Diablo inventory + botanical casino direction remains the right north star.

## Verified by Hermes this audit

- Latest audited commit: `a1d10e489360c13cf04e7b6ed60bbd5ac8182b47` (`Add rewarding match shape demos`).
- `python3 scripts/verify_project.py` passes.
- Repo status was clean before this Hermes task-file update.
- HTTP checks returned `200` for:
  - Vercel `/`, `/playable/midnight_bloom_prototype.html`, and `/assets/tiles/96/amber_resin_seed.png`;
  - GitHub Pages `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png`.
- GitHub Pages browser checks:
  - 89 images, 0 broken images;
  - browser console clean: no console messages or JS errors observed;
  - `shapeAuditData` exists and reports horizontal/vertical line matches, L/T/cross union clears, and no diagonal-only clear;
  - `M` review hook cycles visible shape demos:
    - `Witch's Cross!` showed +33 coins and x15 resources;
    - `Night Garden L-Bloom!` showed +28 coins;
    - `Twin Stem Bloom!` showed +26 coins;
  - `B` review hook reports `SUPREME BLOOM! Review hook complete. The board is ready.`;
  - direct pointer-event dispatch on the visible Chest Storage card opens the 12-slot modal, and Escape closes it/focuses the trigger.
- Visual inspection on GitHub Pages: dark gothic botanical board, controls, Elements strip, and Chest Storage are present with no obvious broken image icons or layout collapse.

## New findings / blockers

1. **Vercel production is stale.** Its playable HTML is smaller than GitHub Pages/local and does not include `shapeAuditData`, `Witch's Cross!`, or the `M` prototype review hook. GitHub Pages is presently the trustworthy latest live preview.
2. **Chest Storage browser-wrapper click remains ambiguous.** Hermes' accessibility `browser_click` on the Chest card did not open it, even after scrolling; a real DOM pointer-event sequence at the card center did open it. This may be a wrapper artifact, but Codex should still verify ordinary mouse/tap access in a real browser or adjust hit area/z-index if needed.
3. The `M` demo path is working, but the L demo can include cascades after the intended shape clear (`8 tiles harvested across 2 cascades`). That is acceptable for prototype juice, but if Xerxes wants cleaner demos, freeze cascades during review hooks only.

---

# Priority 1 — Redeploy / restore Vercel parity with `main`

Goal: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html should serve the same playable behavior as `main` and GitHub Pages.

## Tasks

1. Trigger a fresh Vercel production deployment from the current `main` commit `a1d10e4` or later.
2. Verify Vercel HTML contains:
   - `shapeAuditData`;
   - `Witch's Cross!`;
   - `Prototype match-shape review hook`;
   - `Twin Stem Bloom!` and `Night Garden L-Bloom!`.
3. Browser-check Vercel after deploy:
   - no JS console errors;
   - 0 broken images;
   - `M` cycles cross, L, and T demos visibly;
   - `B` still triggers the Supreme Bloom review path.
4. Update `docs/codex_build_notes.md` with the Vercel deployment identifier/URL and exact verification results.

## Acceptance checks

- Vercel direct playable includes the same shape-audit payload and `M` hook as GitHub Pages.
- Vercel and GitHub Pages both return `200` for root, direct playable, and `assets/tiles/96/amber_resin_seed.png`.
- Browser console remains clean.

---

# Priority 2 — Verify real pointer/tap control access

Goal: controls should be reliable with ordinary mouse/tap, not only programmatic calls.

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

# Priority 3 — Optional polish: make demo hooks deterministic-clean

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
4. Vercel deployment URL/identifier checked;
5. GitHub Pages preview status if checked;
6. known issues;
7. how to trigger and verify L/T/cross matches;
8. how to trigger and verify Supreme Bloom without console;
9. security/secret-scan status.

Then commit and push to `main` so Hermes can audit the live preview again.
