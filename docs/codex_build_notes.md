# Codex Build Notes

## 2026-07-01 repo setup for Hermes audit

- Restored the full Bloom Tycoon project into the current repo root from the local handoff source.
- Confirmed the HTML playable is present at `playable/midnight_bloom_prototype.html`.
- Confirmed required tile assets are present in `assets/tiles/48` and `assets/tiles/96`.
- Added `docs/hermes_audit_next_tasks.md` as the Hermes-maintained task queue.
- Added this build log so future Codex passes can summarize each coding pass.
- Added repo-level agent instructions requiring future Codex passes to read Hermes' task file before coding.
- Added Git ignore rules that keep local scratch output out of the repo while preserving required tile PNG assets.

## 2026-07-01 Vercel deployment

- Read `docs/hermes_audit_next_tasks.md` before making this pass.
- Deployed the static repo to Vercel.
- Renamed the Vercel project to `bloom-tycoon`.
- Live URL: https://bloom-tycoon.vercel.app/
- Disabled SSO deployment protection so Hermes can open the URL directly.
- Verified the root page, `playable/midnight_bloom_prototype.html`, and `assets/tiles/96/amber_resin_seed.png` return `200 OK`.
- GitHub repo creation was completed in the next pass below.

## 2026-07-01 GitHub repo creation

- Installed a local GitHub CLI in ignored `work/tools/` to avoid requiring a system install.
- Authenticated GitHub CLI as `xxxerxxxes666`.
- Created the public GitHub repo `xxxerxxxes666/bloom-tycoon`.
- Added `origin` and pushed `main`.
- GitHub URL: https://github.com/xxxerxxxes666/bloom-tycoon
- Enabled GitHub Pages from `main` at `/`.
- GitHub Pages URL: https://xxxerxxxes666.github.io/bloom-tycoon/
- Verified the Pages root page, playable HTML, and `assets/tiles/96/amber_resin_seed.png` return `200 OK`.

## 2026-07-01 Hermes audit polish pass

- Read `docs/hermes_audit_next_tasks.md` before coding and followed the actionable Hermes priorities surgically.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `docs/codex_build_notes.md`
- Added a compact first-session plaque, delayed legal-swap idle hint, and first-valid-match teaching copy.
- Strengthened normal match feedback with longer harvest glow, resource particles, element count pulses, and invalid swap rejection styling/message.
- Added a commented prototype `B` keyboard hook for Supreme Bloom review, plus a short board charge before Supreme Bloom impact.
- Improved Sacrifice selection/cancel affordance while preserving the existing flow and forced Supreme review path.
- Improved Chest Storage click affordance, modal purpose copy, and footer hint.
- Adjusted the mobile breakpoint so portrait layout prioritizes title/objective, board, controls, Elements/Chest, then tycoon rail.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - Local static checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html`, and `/assets/tiles/96/amber_resin_seed.png`.
  - Browser local preview showed 89 images with 0 broken images.
  - Idle hint appeared after roughly 8 seconds on a fresh load.
  - Valid first match showed the `Good. Resources feed orders, upgrades, and contraband.` message, order-specific Thorn Rose copy, coin/resource particles, and stopped idle hinting.
  - Invalid adjacent swap showed `The garden refuses that graft.` and applied the `invalid-swap` class to both attempted tiles during the rejection render.
  - Pressing `B` showed `SUPREME BLOOM! +12 ✪` with 84 particles, then returned the board to 0 disabled tiles.
  - Real Chest Storage click opened the 12-slot modal; Escape closed it and returned focus to the trigger.
  - Mobile portrait check at 390px wide had no horizontal overflow, 41px board tiles, and the requested vertical order.
- Browser console/runtime status: no runtime errors observed during the successful local interaction checks; the browser wrapper itself only exposed read-only page evaluation.
- Deployed to Vercel production as `dpl_EGk472e1UJyoeeovykqAohvWMUA4`.
- Re-pointed the canonical alias so https://bloom-tycoon.vercel.app now serves the new deployment.
- Vercel playable checked: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html returned `200 OK` and downloaded HTML contained the new plaque, invalid-swap message, Chest footer hint, and `B` review-hook comment.
- GitHub Pages playable checked: https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html returned `200 OK` and downloaded HTML contained the same new audit strings.

## 2026-07-01 Hermes match-shape fun pass

- Read the updated `docs/hermes_audit_next_tasks.md` after Hermes added the Xerxes match-shape directive.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `scripts/verify_project.py`
  - `docs/codex_build_notes.md`
- Kept the existing orthogonal run-union matcher and added shape classification for line, L, T, and cross matches.
- Changed automatic Supreme triggering so straight 5+ lines still qualify, while L/T/cross shapes become stronger stepping-stone rewards rather than frequent jackpots.
- Added stronger L/T/cross rewards: higher coin multiplier, higher resource multiplier, shape-sigil particles, burst auras, and special copy (`Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`).
- Added the `M` prototype review hook to cycle deterministic cross, L, and T shape demos without relying on random board luck.
- Added a hidden `shapeAuditData` DOM audit payload generated by the live HTML matcher for deterministic browser verification of horizontal, vertical, L, T, cross, and diagonal-negative cases.
- Added `scripts/verify_html_match_shapes.py` and wired it into `python3 scripts/verify_project.py`.
- Verification run:
  - `python3 scripts/verify_project.py`
  - Browser local preview loaded 64 board tiles with 0 broken images.
  - Browser `shapeAuditData` reported horizontal/vertical line matches, L/T/cross union clears, and no diagonal-only clear.
  - Pressing `M` produced the cross demo with shape sigils, stronger burst auras, `Witch's Cross!` copy, +33 coins, x15 resources, and no Supreme overlay.
  - Pressing `M` again cycled through `Night Garden L-Bloom!` and `Twin Stem Bloom!` demos with the board returning to 0 disabled tiles.
- Browser console/runtime status: no runtime errors observed during the successful local interaction checks.

## 2026-07-01 Vercel parity redeploy pass

- Read `docs/hermes_audit_next_tasks.md` before acting; Hermes reported Vercel stale while GitHub Pages was current.
- Files changed:
  - `docs/codex_build_notes.md`
- Deployed current `main` to Vercel production as `dpl_BU3qXwmSbd4YS6EXCeAM9c9qkVEW`.
- Re-pointed `https://bloom-tycoon.vercel.app` to `https://bloom-tycoon-r6b0fvy2m-xerxes-florals.vercel.app`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Lightweight secret scan on `docs/codex_build_notes.md`
  - Vercel `/`, `/playable/midnight_bloom_prototype.html?verify=be484e2`, and `/assets/tiles/96/amber_resin_seed.png?verify=be484e2` returned `200 OK`.
  - Downloaded Vercel HTML contained `shapeAuditData`, `Witch's Cross!`, `Prototype match-shape review hook`, `Twin Stem Bloom!`, and `Night Garden L-Bloom!`.
  - GitHub Pages `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=be484e2`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=be484e2` returned `200 OK`.
  - Vercel browser check loaded 89 images with 0 broken images, 64 board tiles, and `shapeAuditData` reporting horizontal/vertical line matches, L/T/cross union clears, and no diagonal-only clear.
  - On Vercel, pressing `M` cycled `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!` demos visibly; none triggered Supreme Bloom.
  - On Vercel, pressing `B` showed `SUPREME BLOOM! +12 ✪` with 84 particles and returned the board to 0 disabled tiles.
  - Raw pointer input on Vercel opened Shuffle, Sacrifice, sacrifice Cancel, and Chest Storage; Escape closed Chest Storage and returned focus to the trigger.
  - Vercel mobile portrait at 390x844 had no horizontal overflow, 41px tiles, and order `title`, `objective`, `board`, `controls`, `bottom`, `leftRail`.
- Browser console/runtime status: no Vercel browser warnings or errors observed via `tab.dev.logs` during baseline, hook, pointer, or mobile checks.
- Known issue: the `M` L-shape demo can cascade after the intended 5-cell shape clear, matching Hermes' accepted prototype note; normal gameplay cascades remain preserved.
- How to verify L/T/cross without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos.
- How to verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪` and then return the board to play.
- Security/secret-scan status: changed files were limited to this docs file; lightweight secret scan ran on changed files with no findings.

## 2026-07-02 Hermes deterministic demo hook pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes' remaining actionable item was optional polish for clean deterministic `M` demos.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added an optional `maxCascades` limit to `resolveAnimated()` and used `{ maxCascades: 1 }` only in the prototype `M` review hook.
- Preserved normal gameplay and Sacrifice cascade behavior by leaving regular `resolveAnimated()` calls at the default 20-cascade cap.
- Extended the HTML match-shape regression source checks to require the new cascade-limit hook.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static checks returned `200 OK` for `/playable/midnight_bloom_prototype.html` and `/assets/tiles/96/amber_resin_seed.png`.
  - Local Playwright Chromium check loaded 64 board tiles, 89 images, 0 broken images, `shapeAuditData`, `const maxCascades`, and `resolveAnimated({ maxCascades: 1 })`.
  - Pressing `M` three times reported clean 5-tile demos in order: `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!`.
  - The same `M` demo pass had 0 disabled tiles after each demo, no Supreme overlay, and no `cascade` text in the ritual messages.
- Browser console/runtime status: no local Playwright console warnings, console errors, or page errors observed during the `M` demo verification.
- Vercel deployment URL/identifier checked: pending production redeploy for this pass.
- GitHub Pages preview status: pending after push.
- Known issues: none for deterministic demo cascades; normal player-initiated matches can still cascade by design.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report 5 tiles harvested with its named shape copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪` and then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.
