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
- Browser console/runtime status: no local or Vercel Playwright console warnings, console errors, or page errors observed during the `M` demo verification.
- Deployed to Vercel production as `dpl_GKw5ff7ZFaFc2N1dyc7J3YEZajWr`.
- Vercel deployment URL: https://bloom-tycoon-de2tc81tr-xerxes-florals.vercel.app
- Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
- Vercel `/`, `/playable/midnight_bloom_prototype.html?verify=de8b48d`, and `/assets/tiles/96/amber_resin_seed.png?verify=de8b48d` returned `200 OK`.
- Downloaded Vercel HTML contained `const maxCascades`, `resolveAnimated({ maxCascades: 1 })`, and `shapeAuditData`.
- Vercel Playwright check loaded 64 board tiles, 89 images, 0 broken images, and clean `M` demos for Cross, L, and T with no cascade text or Supreme overlay.
- GitHub Pages preview status: `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=de8b48d`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=de8b48d` returned `200 OK`; Pages was still serving the previous HTML without the new `const maxCascades` marker during this pass and should be rechecked after its publish cache catches up.
- Known issues: none for deterministic demo cascades; normal player-initiated matches can still cascade by design.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report 5 tiles harvested with its named shape copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪` and then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Hermes repeatable bouquet loop pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes added the repeatable bouquet loop, research-informed depth, and Diablo-style vial directives.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added five data-driven bouquet rounds with different active orders, move counts, rewards, and a continuing round generator after round 5.
- Added a round completion ceremony, `Next Bouquet` continuation button, fresh board/objective reset, chest reward item, and Greenhouse/Apothecary/Sub Rosa progress rewards.
- Replaced the flat left-rail XP bars with carved gothic glass reservoirs: green-gold sap for Greenhouse, violet-blue alchemy for Apothecary, and blood-red favor for Sub Rosa.
- Weighted board refills slightly toward the current bouquet targets so repeat rounds surface relevant matches more often without scripting the board.
- Extended static HTML checks so `python3 scripts/verify_project.py` requires the round loop and vial hooks.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local Playwright check loaded 64 board tiles, 89 images, 0 broken images, and three 34px rounded vial meters.
  - Accelerated local browser audit completed rounds 1 through 5, saw `Next Bouquet` after each completion, clicked through to fresh boards for rounds 2 through 5, and confirmed updated objectives/moves/orders.
  - Local pointer checks: Shuffle spent one move; Sacrifice opened and Cancel closed it; Chest Storage opened with 16 slots; close button and Escape both closed the modal and returned focus.
  - Mobile portrait check at 390x844 had no horizontal overflow, 41px board tiles, and order `main`, `bottom`, `left`.
  - Pressing `M` still cycled clean Cross, L, and T 5-tile demos; pressing `B` still showed 84 Supreme particles and returned the board to 0 disabled tiles.
- Browser console/runtime status: no local or Vercel Playwright console warnings, console errors, or page errors observed during loop, pointer, mobile, `M`, or `B` checks.
- Deployed to Vercel production as `dpl_64fXTjeTd7QHX8n1HRenNr5p27sH`.
- Vercel deployment URL: https://bloom-tycoon-d539uxypt-xerxes-florals.vercel.app
- Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
- Vercel `/`, `/playable/midnight_bloom_prototype.html?verify=b443f28`, and `/assets/tiles/96/amber_resin_seed.png?verify=b443f28` returned `200 OK`.
- Downloaded Vercel HTML contained `const roundTemplates`, `Next Bouquet`, `roundCeremony`, `factionXpFill`, `apothecary-fill`, and `const maxCascades`.
- Vercel Playwright check completed rounds 1 through 5, clicked `Next Bouquet` through rounds 2 through 5, confirmed fresh boards/objectives/moves, 64 tiles, 89 images, 0 broken images, 34px vial meters, no console/page errors, and mobile 390x844 with no horizontal overflow.
- GitHub Pages preview status: `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=b443f28`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=b443f28` returned `200 OK`; Pages was still serving an older HTML snapshot without the new round-loop markers during this pass and should be rechecked after its publish cache catches up.
- Known issues: the accelerated 5-round verification uses page-level audit state to avoid playing dozens of manual matches; the visible player flow still requires completing the displayed bouquet goals before `Next Bouquet` appears.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report 5 tiles harvested with its named shape copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit 84 particles, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Hermes emergency visible-gameplay patch

- Hermes patched directly because Xerxes reported the live game still felt like it was doing nothing.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Made Round 1 much faster: Thorn Rose 3 and Bone Star 2, with 12 moves.
- Added prototype review key `N` to instantly fulfill the current bouquet and show the win/Next Bouquet state.
- Kept `M` for L/T/cross demos and `B` for Supreme Bloom.
- Verification required by Hermes: open live playable, press `N`, confirm reward ceremony and `Next Bouquet`; click it and confirm Round 2 starts with fresh objectives.
- Security: no secrets, no trackers, no backend, no new permissions.

## 2026-07-02 Codex visible one-click bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; the urgent task was to make the live game visibly react within one click/key press.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a visible prototype `Complete Bouquet` button beside Shuffle/Sacrifice, wired to the same review-only completion path as the `N` key.
- Aligned first-load Round 1 moves to 12 by initializing `moves` from the first round template.
- Extended static HTML checks to require the visible button and first-round move initialization.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts
  - `python3 scripts/verify_project.py`
  - Local static checks returned `200 OK` for `/playable/midnight_bloom_prototype.html` and `/assets/tiles/96/amber_resin_seed.png`.
  - Local Playwright one-click check loaded 64 board tiles, 90 images, 0 broken images, Round 1 objective `0/3` Thorn Rose and `0/2` Bone Star with 12 moves, and enabled `Complete Bouquet`.
  - Clicking `Complete Bouquet` showed the First Bouquet ceremony, disabled the demo button, showed `Next Bouquet`, added a chest reward, and appended `Press Next Bouquet to keep playing.`
  - Clicking `Next Bouquet` started Round 2 with fresh board, 17 moves, new objectives, hidden ceremony, enabled demo button, and 0 disabled tiles.
  - Pressing `N` on Round 2 still completed the bouquet and showed `Next Bouquet`.
  - Mobile portrait check at 390x844 had no horizontal overflow, 41px board tiles, and the `Complete Bouquet` button fit inside the controls.
- Browser console/runtime status: no local or Vercel Playwright console warnings, console errors, or page errors observed during one-click, `N`, or mobile checks.
- Deployed to Vercel production as `dpl_59L7gVsWQcgmyetrGWbz5R9VHo5s`.
- Vercel deployment URL: https://bloom-tycoon-lr3wqwezd-xerxes-florals.vercel.app
- Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
- Vercel `/`, `/playable/midnight_bloom_prototype.html?verify=01ab656`, and `/assets/tiles/96/amber_resin_seed.png?verify=01ab656` returned `200 OK`.
- Downloaded Vercel HTML contained `demoCompleteBtn`, `Complete Bouquet`, `let moves = roundTemplates[0].moves`, the `N` review hook, and `Next Bouquet`.
- Vercel Playwright check confirmed the one-click `Complete Bouquet` flow, `Next Bouquet` Round 2 transition, 64 tiles, 90 images, 0 broken images, no console/page errors, and mobile 390x844 with no horizontal overflow.
- GitHub Pages preview status: `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=01ab656`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=01ab656` returned `200 OK`; Pages was still serving older HTML without the new visible completion-control markers during this pass and should be rechecked after its publish cache catches up.
- Known issues: `Complete Bouquet` is intentionally a visible prototype review control so Xerxes/Hermes can confirm progress immediately; remove or gate before production.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report 5 tiles harvested with its named shape copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit 84 particles, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 GitHub Pages parity refresh check

- Read `docs/hermes_audit_next_tasks.md` before acting; Hermes' blocker was GitHub Pages serving stale HTML while Vercel was current.
- Files changed:
  - `docs/codex_build_notes.md`
- Gameplay files were not changed in this pass.
- Authenticated GitHub Pages API reported `status: built`, `source.branch: main`, `source.path: /`, and `html_url: https://xxxerxxxes666.github.io/bloom-tycoon/`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Vercel and GitHub Pages direct playable URLs returned `200 OK`.
  - Vercel and GitHub Pages `assets/tiles/96/amber_resin_seed.png` returned `200 OK`.
  - Downloaded Vercel and GitHub Pages playable HTML both contained `demoCompleteBtn`, `Complete Bouquet`, `let moves = roundTemplates[0].moves`, `Next Bouquet`, and `shapeAuditData`.
  - GitHub Pages Playwright check loaded 64 board tiles, 90 images, 0 broken images, and no console/page errors.
  - GitHub Pages first load showed Round 1 Thorn Rose `0/3`, Bone Star `0/2`, and 12 moves.
  - GitHub Pages `Complete Bouquet` opened the First Bouquet ceremony; `Next Bouquet` started Round 2 with a fresh 64-tile board and 17 moves.
  - GitHub Pages `M` cycled `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!` demos with 5 cells burned bright and no cascade text.
  - GitHub Pages `B` showed `SUPREME BLOOM! Review hook complete. The board is ready.` with 84 particles and then cleared back to play.
  - GitHub Pages Chest Storage opened and Escape closed it; Sacrifice opened and Cancel closed it.
  - GitHub Pages mobile portrait check at 390x844 had no horizontal overflow, 41px board tiles, and the visible completion button fit in the controls.
- Browser console/runtime status: no GitHub Pages Playwright console warnings, console errors, or page errors observed during parity checks.
- Vercel deployment URL/identifier checked: no redeploy this pass; existing Vercel production remained current and marker-matched Pages.
- GitHub Pages preview status: current and marker-matched with Vercel during this pass.
- Known issues: none for Pages parity at the time of verification.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report the named shape and 5 cells burned bright.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit 84 particles, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Hermes obvious-first-move patch

- Hermes patched directly to make the game visibly playable immediately, not just testable.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Round 1 remains short, and new boards now seed obvious legal moves for current bouquet target elements.
- This should make the first real player move more likely to progress the displayed bouquet instead of feeling random/dead.
- `Complete Bouquet`, `N`, `M`, and `B` review hooks remain available.
- Security: no secrets, no trackers, no backend, no new permissions.

## 2026-07-02 Codex first-move verification and Pages guard pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes' current priority was real-player first-move verification and only surgical polish if the seeded opening move failed.
- Files changed:
  - `.nojekyll`
  - `scripts/verify_project.py`
  - `docs/codex_build_notes.md`
- Gameplay HTML was not changed in this Codex pass; Hermes' `ac0e676` seeded-opening helper already produced target-element moves.
- Added root `.nojekyll` so GitHub Pages serves the repo as static files without Jekyll processing, and made `python3 scripts/verify_project.py` require it.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local Playwright check loaded 64 board tiles, 90 images, 0 broken images, and three 34px gothic vial meters.
  - Local Round 1 opening board showed seeded target moves: Sol Rot/Thorn Rose at the top-left swap and Nightshade/Bone Star near the top-right swap.
  - A real mouse swap of the top-left seeded move advanced Thorn Rose to `3/3`, reduced moves to 11, and returned the board/buttons to enabled state.
  - `Complete Bouquet` opened the First Bouquet reward ceremony and added the chest reward; `Next Bouquet` advanced through fresh boards/objectives for rounds 2 through 5, then Round 6.
  - Real pointer checks: `Shuffle (-1 move)` spent one move; `Sacrifice (-3 moves)` opened, an offering could be selected, and Cancel exited cleanly; Chest Storage opened, close button closed it, and Escape closed it with focus restored.
  - Mobile Playwright at 390x844 had no horizontal overflow, 41px board tiles, and the priority order title/objective/board/controls/bottom Elements+Chest/left tycoon rail.
  - `M` still cycled the named L/T/cross demo path, and `B` still rendered Supreme Bloom with 84 particles.
- Browser console/runtime status: no local Playwright console warnings, console errors, or page errors observed during first-move, loop, pointer, mobile, `M`, or `B` checks.
- Deployed current playable to Vercel production as `dpl_6HtyRUHLE3BxMhCB2dWz6sSGbdGX`.
- Vercel deployment URL: https://bloom-tycoon-ah4g9im6w-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- Vercel `/playable/midnight_bloom_prototype.html?verify=ac0e676b` and `/assets/tiles/96/amber_resin_seed.png?verify=ac0e676b` returned `200 OK`; downloaded HTML contained `demoCompleteBtn`, `Complete Bouquet`, `let moves = roundTemplates[0].moves`, `Next Bouquet`, `shapeAuditData`, `seedCurrentTargetMoves`, and `writeTargetLegalMovePatch`.
- GitHub Pages preview status: after Hermes' `e2ccd47` docs update, the Pages build endpoint reported `Page build failed`; after pushing `.nojekyll` in `568c399` and requesting a manual rebuild, the latest Pages build for `568c3995d6c32d9855e4e487e22f5b1172209acd` remained `building` at `2026-07-02T16:38:47Z`.
- GitHub Pages hosted playable still returned `200 OK` during this pass, but remained the older 128,983-byte HTML without `seedCurrentTargetMoves` or `writeTargetLegalMovePatch`; the key tile asset still returned `200 OK`.
- Known issues: Vercel is current and first-move verified; GitHub Pages publishing is still an external blocker until the `568c399` Pages build finishes or GitHub clears the stuck build.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report the named shape reward copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit 84 particles, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Codex post-first-move Bone Star hint pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes' current priority was post-first-move clarity after the seeded Thorn Rose swap.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a tiny next-target hint path that prefers the seeded target move before falling back to any legal target-element move.
- After the first Thorn Rose move completes, the ritual log now says `Bone Star remains. Swap the glowing tiles to feed Saint's Offering.` and the top-right seeded Bone Star swap tiles use the existing idle-hint glow.
- Preserved Round 1 counts, `Complete Bouquet`, `N`, `M`, `B`, the repeatable round loop, and the current UI layout.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local Playwright check loaded 64 board tiles, 90 images, 0 broken images, and fresh Round 1 objectives Thorn Rose `0/3`, Bone Star `0/2`, 12 moves.
  - Local real mouse Thorn Rose swap advanced Thorn Rose to `3/3`, left Bone Star at `0/2`, set moves to 11, displayed the Bone Star/Saint's Offering hint copy, and highlighted the top-right seeded Bone Star swap.
  - Local real mouse Bone Star swap completed Bone Star to `2/2`, opened the First Bouquet reward ceremony, and showed `Next Bouquet`.
  - Local `Next Bouquet` started Round 2 with Nightshade/Amber Seed/Thorn Rose objectives and 17 moves.
  - Local `M` and `B` hooks still worked; `B` emitted 84 Supreme particles.
  - Local Sacrifice opened and Cancel exited; Chest Storage opened and Escape closed it.
  - Local mobile portrait at 390x844 had no horizontal overflow and 41px board tiles.
- Browser console/runtime status: no local or Vercel Playwright console warnings, console errors, or page errors observed during post-first-move, hook, pointer, or mobile checks.
- Deployed to Vercel production as `dpl_GouvYotKrFxfQuqau3R7ojRmCkKC`.
- Vercel deployment URL: https://bloom-tycoon-lo50ma2qm-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- Vercel Playwright check confirmed the hint markers, Bone Star/Saint's Offering copy, top-right Bone Star glow after the Thorn Rose swap, real Bone Star completion, `M`, `B`, 90 images, 0 broken images, and 390x844 mobile with no horizontal overflow.
- GitHub Pages preview status before push: current for the previous build and marker-matched through `a79fb0d`; this pass must be rechecked after the new commit publishes.
- Known issues: none found locally or on Vercel for the post-first-move clarity path.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report the named shape reward copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit 84 particles, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 GitHub Pages Actions deployment repair

- Legacy GitHub Pages branch builds failed for the gameplay commit `9782e07` while continuing to serve the previous `a79fb0d` artifact, so Pages did not receive the new Bone Star hint HTML.
- Files changed:
  - `.github/workflows/pages.yml`
  - `scripts/verify_project.py`
  - `docs/codex_build_notes.md`
- Added a GitHub Actions workflow using official Pages actions: checkout, configure Pages, upload the static repo artifact, and deploy Pages.
- Switched the repo Pages config from `build_type: legacy` to `build_type: workflow` through the GitHub API.
- `python3 scripts/verify_project.py` now requires `.github/workflows/pages.yml`.
- Verification run:
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Lightweight secret scan on changed files.
  - Confirmed GitHub Pages config reads `build_type: workflow`.
  - Confirmed the workflow is active as `Deploy GitHub Pages`.
- Pages workflow status:
  - Push run `28608011646` started before the Pages config switch fully settled, uploaded the artifact, then remained stuck in Deploy; it was cancelled manually.
  - Manual workflow dispatch `28608326445` uploaded the artifact successfully, then GitHub returned `Deployment cancelled` from `actions/deploy-pages@v4`.
- Known issue: Vercel is current for the Bone Star hint build, but GitHub Pages still serves the previous 130,222-byte HTML until a workflow Pages deployment completes successfully.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Hermes fun/clarity patch

- Hermes patched directly after Xerxes reported the game still did not feel changed or fun.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Made left progress meters much more obvious as Diablo-inspired glass liquid vials: SAP, MANA, BLOOD.
- Added visible `Shape Bloom` button so L/T/cross match demos are discoverable without knowing the hidden `M` key.
- Kept `Complete Bouquet`, `N`, `M`, and `B` review hooks.
- Security: no secrets, no trackers, no backend, no new permissions.

## 2026-07-02 Codex Cursed Thorn blocker slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested the first strategic gameplay slice: a simple Cursed Thorn blocker objective, adjacent-match clearing, visible feedback, and preserved review hooks.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added Round 2 Cursed Thorn objective: clear 3 blockers in addition to Moonlit Wreath resource goals.
- Added Cursed Thorn blocker state, save/load support, objective/progress rendering, Active Orders rendering, temporary cracked-vine overlay, red/gold pulse, splinter particles, and ritual-log feedback.
- Adjacent matches damage thorns; L/T/cross shape matches do heavier thorn damage through the existing shape reward path.
- Preserved `Shape Bloom`, `Complete Bouquet`, `B`, `M`, and `N` prototype review hooks.
- Verification run:
  - `git fetch origin main`
  - `git pull --rebase --autostash origin main`
  - JS parse check over executable HTML scripts.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local Playwright flow: fresh Round 1 loaded 64 tiles and 0 Cursed Thorns; seeded Thorn Rose swap advanced Thorn Rose to `3/3` and preserved the Bone Star hint; `Complete Bouquet` plus `Next Bouquet` started Round 2.
  - Local Playwright Round 2: objective showed `Cursed Thorn 0/3`; board rendered 3 Cursed Thorn blockers; seeded Nightshade adjacent swap cleared all 3 thorns, changed objective to `Cursed Thorn 3/3`, and logged Cursed Thorn feedback.
  - Local Playwright continued through `Complete Bouquet`, `Next Bouquet` into Round 3, `Shape Bloom`, `B` Supreme Bloom hook, and mobile 390x844 with no horizontal overflow and 40.5px tiles.
  - Vercel marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=cursed-thorn` returned `200` with `Cursed Thorn`, `thornGoal`, `cursed-thorn-overlay`, `damageAdjacentThorns`, and `Shape Bloom`.
- Browser console/runtime status: no local Playwright console warnings, console errors, or page errors observed in the Round 1/Round 2 blocker flow, hook checks, or mobile check.
- Deployed to Vercel production as `dpl_BrAJzYwvVa4kGzG64eBHmVKYXJy4`.
- Vercel deployment URL: https://bloom-tycoon-j5zubei8e-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status before this commit: GitHub Status reported Pages operational; latest Pages workflow for `f10c5e9` succeeded and restored Pages parity for the prior build. This Cursed Thorn pass still needs the post-push Pages workflow to publish and be marker-checked.
- Known issues: none found locally or on Vercel for the Cursed Thorn slice; GitHub Pages needs post-push confirmation after this commit publishes.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M`, or click `Shape Bloom`, repeatedly to cycle Cross, L, and T demos; each should report the named shape reward copy.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Codex 4-line Black Candle Vine slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested the next small strategic slice: make 4-in-a-line matches trigger a gothic line-clearing relic while preserving Cursed Thorn, L/T/cross, and review hooks.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added `Black Candle Vine`: a pure 4-in-a-line match immediately sweeps its row or column, grants resource/order progress for the cleared line, and reports the swept lane in the ritual log.
- Added line-relic particles and static audit markers: `lineRelicForMatch`, `queueLineRelicBurst`, `lineRelicMessage`, and `line4`.
- Updated `Shape Bloom` / `M` review cycling so the first demo proves the 4-line relic, then Cross, L, and T remain available on repeated triggers.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local Playwright check: `Shape Bloom` triggered `Black Candle Vine swept row 4`; repeated `M` triggered `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`; `B` triggered Supreme Bloom.
  - Local Playwright first-bouquet flow: seeded Thorn Rose swap advanced Thorn Rose to `3/3`, hinted Bone Star swap completed Round 1, and `Next Bouquet` started Round 2.
  - Local Playwright Round 2: `Cursed Thorn 0/3` appeared with 3 blockers; adjacent Nightshade swap cleared them to `Cursed Thorn 3/3` with Cursed Thorn feedback.
  - Local Playwright Chest Storage opened/closed, Sacrifice opened/cancelled, and mobile 390x844 had no horizontal overflow with 40.5px tiles.
  - Vercel marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=line-relic` returned `200` with `Black Candle Vine`, `lineRelicForMatch`, `queueLineRelicBurst`, `lineRelicMessage`, `line4`, `Cursed Thorn`, and `Shape Bloom`.
- Browser console/runtime status: no local Playwright console warnings, console errors, or page errors observed during line relic, shape hooks, first-bouquet, Cursed Thorn, Chest/Sacrifice, or mobile checks.
- Deployed to Vercel production as `dpl_DbyVT1VRkVJuK9kqRkXNCahgJHPz`.
- Vercel deployment URL: https://bloom-tycoon-m5512izue-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status before this commit: Pages was current for the previous Cursed Thorn build at `d889ba6`. This Black Candle Vine pass still needs the post-push Pages workflow to publish and be marker-checked.
- Known issues: none found locally or on Vercel for the 4-line relic slice; GitHub Pages needs post-push confirmation after this commit publishes.
- How to trigger and verify L/T/cross matches without console: click `Shape Bloom` once for Black Candle Vine, then press `M` or click `Shape Bloom` repeatedly to cycle `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

## 2026-07-02 Codex 5-line Eclipse Seed Rune slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a rare 5-line seed/rune reward without making Supreme Bloom common.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added `Eclipse Seed Rune`: an exact 5-in-a-line match now gives visible rune particles, +25 coins on the deterministic five-tile demo, stores a rare `Eclipse Seed Rune` in Chest Storage, and logs the lane/reward.
- Kept Supreme Bloom rare by moving automatic line-match Supreme triggering from 5+ straight lines to 6+ straight lines; `B` and Sacrifice review paths still trigger Supreme intentionally.
- Preserved 4-line `Black Candle Vine`, L/T/cross shape rewards, Cursed Thorn behavior, repeatable bouquet flow, and `Shape Bloom`, `Complete Bouquet`, `N`, `M`, and `B` review hooks.
- Added static audit markers and fixture coverage for `Eclipse Seed Rune`, `rareSeedRuneForMatch`, `queueRareSeedRuneBurst`, `rareSeedRuneMessage`, `line5`, and `seed-rune`.
- Verification run:
  - `git fetch origin main`
  - JS parse check over executable HTML scripts.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local static checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html`, and `/assets/tiles/96/amber_resin_seed.png`.
  - Local Playwright installed/used bundled Chromium, then loaded 64 board tiles, 91 images, 0 broken images, and `shapeAuditData` keys including `line5`.
  - Local Playwright `Shape Bloom` triggered `Eclipse Seed Rune awakened from a five-line row 4 and sealed in Chest Storage`, showed 5 seed-rune particles, updated Chest Storage to `9 / 16 Slots`, and did not show Supreme.
  - Local Playwright Chest Storage opened with `Eclipse Seed Rune` present.
  - Local Playwright repeated `M` proved `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!`; `B` still showed Supreme with 84 particles.
  - Local Playwright first-bouquet flow: seeded Thorn Rose swap advanced Thorn Rose to `3/3`, seeded Bone Star swap completed Round 1, and `Next Bouquet` started Round 2.
  - Local Playwright Round 2: `Cursed Thorn 0/3` appeared with 3 blockers; adjacent Nightshade swap cleared them to `Cursed Thorn 3/3` with Cursed Thorn feedback.
  - Local Playwright Chest Storage opened/closed, Sacrifice opened/cancelled, and mobile 390x844 had no horizontal overflow with 41px tiles.
  - Vercel marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=eclipse-seed-rune` returned `200` with `Eclipse Seed Rune`, `rareSeedRuneForMatch`, `queueRareSeedRuneBurst`, `rareSeedRuneMessage`, `line5`, `Black Candle Vine`, and `Cursed Thorn`.
  - Vercel Playwright loaded 64 board tiles, 91 images, 0 broken images, proved `Eclipse Seed Rune`, `Black Candle Vine`, L/T/cross rewards, `B`, Round 1 completion, Round 2 Cursed Thorn clearing, and mobile 390x844 with no horizontal overflow.
- Browser console/runtime status: no local or Vercel Playwright console warnings, console errors, or page errors observed during seed-rune, line relic, shape hook, first-bouquet, Cursed Thorn, Chest/Sacrifice, Supreme, or mobile checks.
- Deployed to Vercel production as `dpl_68DWxMPjXUB8kFMTgGXoTjJs4yXT`.
- Vercel deployment URL: https://bloom-tycoon-ifht2gorv-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status after gameplay push: workflow `28619190654` succeeded; `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=eclipse-seed-rune-6bf9ed9`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=eclipse-seed-rune-6bf9ed9` returned `200`, and the playable contained `Eclipse Seed Rune`, `rareSeedRuneForMatch`, `queueRareSeedRuneBurst`, `rareSeedRuneMessage`, `line5`, `Black Candle Vine`, and `Cursed Thorn`.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the 5-line seed/rune slice. GitHub Pages deploy emitted a non-blocking Node.js 20 deprecation warning from the Pages action runtime.
- How to trigger and verify the 5-line reward without console: click `Shape Bloom` once, or press `M` once on a fresh load; the ritual log should mention `Eclipse Seed Rune` and Chest Storage should gain the rune.
- How to trigger and verify L/T/cross matches without console: after the first 5-line demo, press `M` repeatedly; the cycle is `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, or new permissions were added.

## 2026-07-02 Codex Rune-Tended Soil payoff slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a small local Chest-to-upgrade payoff for earned `Eclipse Seed Rune`.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a `Plant Rune` action to the Chest slot for `Eclipse Seed Rune`.
- Planting one rune consumes it, grants `Greenhouse +90 XP`, queues `Rune-Tended Soil`, and updates ritual-log/objective/plaque copy.
- `Rune-Tended Soil` applies to the next bouquet as a one-round `+1` starting move boon; Round 2 starts with 18 moves instead of 17 when the queued boon is used.
- Preserved reward hierarchy: exact 5-line = `Eclipse Seed Rune`, 4-line = `Black Candle Vine`, L/T/cross = shape rewards, 6+ straight line or `B`/Sacrifice = Supreme Bloom.
- Added static audit markers for `Rune-Tended Soil`, `plantEclipseSeedRune`, `data-action="plant-eclipse-seed-rune"`, `pendingRuneTendedSoil`, and `activeRuneTendedSoil`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local static checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html`, and `/assets/tiles/96/amber_resin_seed.png`.
  - Local Playwright loaded 64 board tiles, 91 images, 0 broken images, and `shapeAuditData` keys including `line5`.
  - Local Playwright `Shape Bloom` earned `Eclipse Seed Rune`, Chest showed a `Plant Rune` action, planting consumed the rune, Greenhouse moved from `1,240 / 2,000 XP` to `1,330 / 2,000 XP`, Chest returned to `8 / 16 Slots`, and the objective showed `RUNE-TENDED SOIL QUEUED`.
  - Local Playwright `Complete Bouquet` plus `Next Bouquet` started Round 2 with `RUNE-TENDED SOIL +1 MOVE`, 18 moves, and 3 Cursed Thorns.
  - Local Playwright repeated `M` still proved `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`; `B` still showed Supreme with 84 particles.
  - Local Playwright first-bouquet flow: seeded Thorn Rose swap advanced Thorn Rose to `3/3`, seeded Bone Star swap completed Round 1, and `Next Bouquet` started Round 2.
  - Local Playwright Round 2: `Cursed Thorn 0/3` appeared with 3 blockers; adjacent target swap cleared them to `Cursed Thorn 3/3` with Cursed Thorn feedback.
  - Local Playwright Chest Storage opened/closed, Sacrifice opened/cancelled, and mobile 390x844 had no horizontal overflow with 41px tiles.
  - Vercel marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=rune-tended-soil` returned `200` with `Rune-Tended Soil`, `plantEclipseSeedRune`, `data-action="plant-eclipse-seed-rune"`, `pendingRuneTendedSoil`, `activeRuneTendedSoil`, `Eclipse Seed Rune`, `Black Candle Vine`, and `Cursed Thorn`.
  - Vercel Playwright proved the hosted rune payoff path, `M` Black Candle Vine hook, `B` Supreme hook, and mobile 390x844 with no horizontal overflow.
- Browser console/runtime status: no local or Vercel Playwright console warnings, console errors, or page errors observed during rune payoff, review hook, first-bouquet, Cursed Thorn, Chest/Sacrifice, Supreme, or mobile checks.
- Deployed to Vercel production as `dpl_25wBqXmTN11z7Y6edRCKLc6y94ps`.
- Vercel deployment URL: https://bloom-tycoon-3ldg66oap-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status after gameplay push: workflow `28620655267` succeeded; `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=rune-tended-soil-791e4f7`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=rune-tended-soil-791e4f7` returned `200`, and the playable contained `Rune-Tended Soil`, `plantEclipseSeedRune`, `data-action="plant-eclipse-seed-rune"`, `pendingRuneTendedSoil`, `activeRuneTendedSoil`, `Eclipse Seed Rune`, `Black Candle Vine`, and `Cursed Thorn`.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the rune payoff slice. GitHub Pages deploy emitted a non-blocking Node.js 20 deprecation warning from the Pages action runtime.
- How to trigger and verify the rune payoff without console: click `Shape Bloom`, open Chest Storage, click `Plant Rune`, then use `Complete Bouquet` and `Next Bouquet`; Round 2 should show `Rune-Tended Soil +1 Move` and 18 moves.
- How to trigger and verify L/T/cross matches without console: after the rune payoff flow, press `M` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, or new permissions were added.

## 2026-07-02 Codex Pruning Shears booster slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested the first local/static booster so Apothecary progress begins to matter.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added visible `Pruning Shears (x1)` controls, granted as an Apothecary Level 2 local prototype booster.
- Added a reversible targeting mode: click `Pruning Shears`, all eligible board tiles/blockers glow, `Cancel` exits without spending, and a successful cut spends one Shears.
- Normal tile use removes the selected tile, refills the column, and re-seeds a legal board if needed.
- Cursed Thorn use removes the selected thorn, updates `Cursed Thorn` objective progress, and keeps the existing thorn feedback styling/particles.
- Preserved reward hierarchy: exact 5-line = `Eclipse Seed Rune`, 4-line = `Black Candle Vine`, L/T/cross = shape rewards, 6+ straight line or `B`/Sacrifice = Supreme Bloom.
- Added static audit markers for `Pruning Shears`, `pruningShearsBtn`, `pruningShearsCount`, `boosterPanel`, `togglePruningShears`, `usePruningShears`, `queuePruningShearBurst`, `shears-target`, `boosters.pruningShears`, and `activeBooster`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`
  - Local Playwright loaded 64 board tiles and 0 broken images.
  - Local Playwright proved `Pruning Shears` arms targeting, highlights 64 tiles, cancels without spending, cuts a normal tile, spends the count to `x0`, and leaves 64 board tiles.
  - Local Playwright started Round 2 with `Complete Bouquet` + `Next Bouquet`, cut a Cursed Thorn with Shears, moved objective progress to `Cursed Thorn 1/3`, left 2 visible thorn blockers, and spent the count to `x0`.
  - Local Playwright verified the Round 2 adjacent target swap still clears thorns normally to `Cursed Thorn 3/3`.
  - Local Playwright verified Rune-Tended Soil still works: `Shape Bloom` earns `Eclipse Seed Rune`, Chest `Plant Rune` queues the boon, `Complete Bouquet` + `Next Bouquet` starts Round 2 with `Rune-Tended Soil +1 move` and 18 moves.
  - Local Playwright verified `M` still proves `Black Candle Vine`, `B` still proves Supreme Bloom, Chest opens/closes, Sacrifice opens/cancels, and mobile 390x844 has no horizontal overflow.
  - Vercel marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=pruning-shears` returned `200` with `Pruning Shears`, `pruningShearsBtn`, `boosterPanel`, `togglePruningShears`, `usePruningShears`, `queuePruningShearBurst`, `shears-target`, `Rune-Tended Soil`, `Black Candle Vine`, and `Cursed Thorn`.
  - Vercel direct checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html?verify=pruning-shears`, and `/assets/tiles/96/bone_white_thorn_star.png?verify=pruning-shears`.
  - Vercel Playwright smoke loaded 64 board tiles, 0 broken images, no console/page errors, and proved Shears arm/cancel/normal-use.
- Browser console/runtime status: no local or Vercel Playwright console errors or page errors observed during booster, Round 2 thorn, rune payoff, review hook, Chest/Sacrifice, or mobile checks.
- Deployed to Vercel production as `dpl_5DudqXfApsJYccoZGDBtf488N5Mv`.
- Vercel deployment URL: https://bloom-tycoon-5rg6qh4md-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status after gameplay push: workflow `28622699539` succeeded for `726b6b2`; `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=pruning-shears-726b6b2`, and `/bloom-tycoon/assets/tiles/96/bone_white_thorn_star.png?verify=pruning-shears-726b6b2` returned `200`, and the playable contained `Pruning Shears`, `pruningShearsBtn`, `pruningShearsCount`, `boosterPanel`, `togglePruningShears`, `usePruningShears`, `queuePruningShearBurst`, `shears-target`, `boosters.pruningShears`, `activeBooster`, `Rune-Tended Soil`, `Black Candle Vine`, and `Cursed Thorn`. A fresh workflow_dispatch Pages run `28622817383` also succeeded after a failed-job-only rerun created duplicate artifacts, and `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=pruning-shears-3735955` still returned `200` with no missing booster markers.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the Pruning Shears slice. GitHub Pages deploy emitted the same non-blocking Node.js 20 deprecation warning from the Pages action runtime seen in prior passes.
- How to trigger and verify `Pruning Shears`: on a fresh load, click `Pruning Shears (x1)`, confirm board targets glow, click `Cancel` to keep `x1`, then arm again and click a normal tile or a Round 2 Cursed Thorn.
- How to trigger and verify L/T/cross matches without console: press `M` or click `Shape Bloom` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-02 Codex Moonwater Flask booster slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a second local/static booster so boosters become a real choice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added visible `Moonwater Flask (x1)` controls next to `Pruning Shears`, granted through the local Apothecary field kit.
- Added reversible targeting: click `Moonwater Flask`, inner 6x6 centers glow, a 3x3 patch preview appears, and Cancel exits without spending.
- Moonwater reshuffles only non-thorn tiles inside the selected 3x3 patch, spends exactly one Flask on success, preserves 64 tiles, and retries local shuffles until the board has no free matches and at least one legal move.
- Cursed Thorn cells remain anchored and do not advance the Cursed Thorn objective when included in a Moonwater patch.
- Preserved reward hierarchy: exact 5-line = `Eclipse Seed Rune`, 4-line = `Black Candle Vine`, L/T/cross = shape rewards, 6+ straight line or `B`/Sacrifice = Supreme Bloom.
- Added static audit markers for `Moonwater Flask`, `moonwaterFlaskBtn`, `moonwaterFlaskCount`, `toggleMoonwaterFlask`, `useMoonwaterFlask`, `moonwaterPatchCells`, `shuffleMoonwaterPatch`, `queueMoonwaterBurst`, `moonwater-target`, `moonwater-area`, and `boosters.moonwaterFlask`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts.
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; `agent-browser` was unavailable in this environment, so bundled Playwright was used for browser verification.
  - Local Playwright loaded 64 board tiles and 0 broken images.
  - Local Playwright proved `Moonwater Flask` displays `x1`, opens targeting mode, highlights 36 valid centers, previews 9 cells, cancels without spending, reshuffles only the selected 3x3 patch, shows Moonwater particles, spends to `x0`, and preserves 64 tiles.
  - Local Playwright started Round 2 and proved Moonwater on a patch containing Cursed Thorns leaves thorns anchored at `0,1`, `1,1`, and `2,1`, does not advance `Cursed Thorn 0/3`, spends to `x0`, and preserves 64 tiles.
  - Local Playwright verified `Pruning Shears` still cuts a normal tile and a Cursed Thorn.
  - Local Playwright verified Round 1 first-move/Bone Star completion and Round 2 adjacent thorn clearing to `Cursed Thorn 3/3`.
  - Local Playwright verified Rune-Tended Soil still works: `Shape Bloom` earns `Eclipse Seed Rune`, Chest `Plant Rune` queues the boon, `Complete Bouquet` + `Next Bouquet` starts Round 2 with `Rune-Tended Soil +1 move` and 18 moves.
  - Local Playwright verified `M` still proves `Black Candle Vine`, `B` still proves Supreme Bloom, Chest opens/closes, Sacrifice opens/cancels, and mobile 390x844 has no horizontal overflow.
  - Vercel marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=moonwater-flask` returned `200` with `Moonwater Flask`, `moonwaterFlaskBtn`, `moonwaterFlaskCount`, `toggleMoonwaterFlask`, `useMoonwaterFlask`, `moonwaterPatchCells`, `shuffleMoonwaterPatch`, `queueMoonwaterBurst`, `moonwater-target`, `moonwater-area`, `boosters.moonwaterFlask`, `Pruning Shears`, `Rune-Tended Soil`, `Black Candle Vine`, and `Cursed Thorn`.
  - Vercel direct checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html?verify=moonwater-flask`, and `/assets/tiles/96/purple_nightshade_bloom.png?verify=moonwater-flask`.
  - Vercel Playwright smoke loaded 64 board tiles, 0 broken images, no console/page errors, and proved Moonwater arm/cancel/normal-use.
- Browser console/runtime status: no local or Vercel Playwright console errors or page errors observed during Moonwater, Pruning Shears, Round 2 thorn, rune payoff, review hook, Chest/Sacrifice, or mobile checks.
- Deployed to Vercel production as `dpl_AGHtcPnnvKKGrW89YqFKKR7pE6hR`.
- Vercel deployment URL: https://bloom-tycoon-qbtmj8pb4-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status after gameplay push: workflow `28624405611` succeeded for `79d10c0`; `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=moonwater-flask-79d10c0`, and `/bloom-tycoon/assets/tiles/96/purple_nightshade_bloom.png?verify=moonwater-flask-79d10c0` returned `200`, and the playable contained `Moonwater Flask`, `moonwaterFlaskBtn`, `moonwaterFlaskCount`, `toggleMoonwaterFlask`, `useMoonwaterFlask`, `moonwaterPatchCells`, `shuffleMoonwaterPatch`, `queueMoonwaterBurst`, `moonwater-target`, `moonwater-area`, `boosters.moonwaterFlask`, `Pruning Shears`, `Rune-Tended Soil`, `Black Candle Vine`, and `Cursed Thorn`.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the Moonwater Flask slice. GitHub Pages deploy emitted the same non-blocking Node.js 20 deprecation warning from the Pages action runtime seen in prior passes.
- How to trigger and verify `Moonwater Flask`: on a fresh load, click `Moonwater Flask (x1)`, confirm the inner centers and 3x3 preview glow, click `Cancel` to keep `x1`, then arm again and click an inner tile such as row 4/column 4; only that 3x3 patch should reshuffle and the count should become `x0`.
- How to trigger and verify L/T/cross matches without console: press `M` or click `Shape Bloom` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-03 Codex Black Candle booster slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a row/column burn booster as the next surgical gameplay slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Gameplay commit: `c1a38d1 feat: add Black Candle booster`.
- Added visible `Black Candle (x1)` beside `Pruning Shears` and `Moonwater Flask`; the left Black Market rail now shows `Black Candle x1 stocked` as the deterministic local grant.
- Added reversible Black Candle targeting: click the booster, choose `Row` or `Column`, preview the line, use `Cancel` without spending, or click a tile to burn the selected line without spending moves.
- Black Candle collects/coins the non-thorn tiles in the selected line, spends exactly one count, preserves 64 board tiles, retries local refills until the board has no free matches and at least one legal move, and falls back to reseeding only if needed.
- Cursed Thorns stay rooted during Black Candle burns, thorn objective progress does not silently change, and the ritual log explicitly says rooted thorns stayed rooted.
- Preserved reward hierarchy: exact 5-line = `Eclipse Seed Rune`, 4-line = `Black Candle Vine`, L/T/cross = shape rewards, 6+ straight line or `B`/Sacrifice = Supreme Bloom.
- Added static audit markers for `Black Candle`, `blackCandleBtn`, `blackCandleCount`, `blackCandleModes`, `blackCandleAxis`, `toggleBlackCandle`, `useBlackCandle`, `blackCandleLineCells`, `refillBlackCandleLine`, `queueBlackCandleBurst`, `black-candle-line`, and `boosters.blackCandle`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts with bundled Node.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Lightweight secret scan on changed files.
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; `agent-browser` was unavailable, so bundled Playwright was used.
  - Local static checks returned `200` for the playable and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Local Playwright loaded 64 board tiles, 94 images, 0 broken images, and no error overlay.
  - Local Playwright proved Black Candle arm/cancel, row/column mode switching, column preview, column burn, `x1` to `x0`, no moves spent, 64 tiles preserved, and a legal no-free-match board after burn.
  - Local Playwright started Round 2 and burned a thorn row: 3 Cursed Thorns stayed rooted, `Cursed Thorn 0/3` stayed unchanged, explicit rooted-thorn copy appeared, 64 tiles remained, and the board stayed playable.
  - Local Playwright verified `Pruning Shears` still cancels, cuts a normal tile, and cuts a Cursed Thorn to `Cursed Thorn 1/3`.
  - Local Playwright verified `Moonwater Flask` still cancels, previews 36 valid centers and a 3x3 area, reshuffles without spending moves, preserves 64 tiles, and leaves a playable board.
  - Local Playwright verified Rune-Tended Soil still works: `Shape Bloom` earns `Eclipse Seed Rune`, Chest `Plant Rune` queues it, `Complete Bouquet` + `Next Bouquet` starts Round 2 with `Rune-Tended Soil +1 move` and 18 moves.
  - Local Playwright verified `Shape Bloom` still cycles `Eclipse Seed Rune`, `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!`; `B` still shows Supreme Bloom.
  - Local Playwright verified seeded Round 1 completion and Round 2 adjacent Cursed Thorn clearing.
  - Local Playwright verified Chest opens/closes with Escape, Sacrifice opens/cancels, and mobile 390x844 has no horizontal overflow with 64 tiles and Black Candle visible.
  - Vercel static marker check for `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=black-candle-c1a38d1` returned `200` with all Black Candle and preserved gameplay markers.
  - Vercel direct checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html?verify=black-candle-c1a38d1`, and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=black-candle-c1a38d1`.
  - Vercel Playwright smoke loaded 64 board tiles, 0 broken images, no console/page errors, and proved Black Candle arm/cancel/use.
  - GitHub Pages workflow `28635710950` succeeded for `c1a38d1`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=black-candle-c1a38d1`, and `/bloom-tycoon/assets/tiles/96/bloodroot_ruby_shard.png?verify=black-candle-c1a38d1`, with all Black Candle and preserved gameplay markers.
  - GitHub Pages Playwright smoke loaded 64 board tiles, 0 broken images, no console/page errors, and proved Black Candle arm/cancel/use.
- Browser console/runtime status: no local, Vercel, or GitHub Pages Playwright console errors or page errors observed during Black Candle, existing boosters, rune payoff, review hooks, Round 1/Round 2 flow, Chest/Sacrifice, or mobile checks.
- Deployed to Vercel production as `dpl_BU8L2VNUXdn4fChy2mAX3HTBDMGP`.
- Vercel deployment URL: https://bloom-tycoon-61w9a9cdl-xerxes-florals.vercel.app
- Explicitly re-pointed `https://bloom-tycoon.vercel.app` to that deployment.
- GitHub Pages preview status after gameplay push: workflow `28635710950` succeeded for `c1a38d1`.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the Black Candle slice. The shell did not have `gh` or `agent-browser`; GitHub Actions status was checked via the public GitHub API and browser verification used bundled Playwright.
- How to trigger and verify `Black Candle`: on a fresh load, click `Black Candle (x1)`, confirm the panel opens with `Row` and `Column`; click `Cancel` to keep `x1`, then arm again, choose `Column`, hover a tile to preview the column, and click to burn it. The count should become `x0`, moves should stay unchanged, and only the selected line should flash.
- How to trigger and verify Black Candle with Cursed Thorns: use `Complete Bouquet`, click `Next Bouquet`, arm `Black Candle`, keep `Row` selected, and click row 2; the log should say the Cursed Thorns stayed rooted and the objective should remain `Cursed Thorn 0/3`.
- How to trigger and verify L/T/cross matches without console: press `M` or click `Shape Bloom` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added.

## 2026-07-03 Codex Bouquet Streak slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a visible local/static `Bouquet Streak` system for repeat bouquet completions.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added persisted `bouquetStreak` state and a visible `Bouquet Streak` objective badge after the first bouquet completion.
- Added a capped bouquet coin bonus: `+5% coins per streak`, capped at `25%`.
- Completion now increments the streak once, pays base coins plus the streak bonus, and shows the exact base/bonus/percent in ritual-log and ceremony copy.
- First bouquet example: `Bouquet Streak 1`, `+5% coins`, `+126 coins` from `120 base + 6 streak bonus`.
- Second bouquet example: `Bouquet Streak 2`, `+10% coins`, `+165 coins` from `150 base + 15 streak bonus`.
- Preserved `Choose Your Reward`: three choices still appear, selected rewards still update XP/boosters, and ignored choices still safely default to `Greenhouse Cuttings` on `Next Bouquet`.
- Preserved the repeatable bouquet loop, Round 2 Cursed Thorn setup, Rune-Tended Soil, board size, all four boosters, Chest/Sacrifice, and review hooks `Shape Bloom`, `Complete Bouquet`, `N`, `M`, and `B`.
- Preserved reward hierarchy: exact 5-line = `Eclipse Seed Rune`, 4-line = `Black Candle Vine`, L/T/cross = shape rewards, Grave Soil exact 3-line = `Grave Soil Relic`, and 6+ straight line or `B`/Sacrifice only = Supreme Bloom.
- Added static audit markers for `Bouquet Streak`, `bouquetStreak`, `bouquetStreakBadge`, `STREAK_COIN_BONUS_STEP`, `STREAK_COIN_BONUS_CAP`, `bouquetStreakBonusPercent`, `bouquetStreakPayout`, and `validBouquetStreak`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - JS parse check over executable HTML scripts with bundled Node.
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`.
  - Local static checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html`, `assets/tiles/96/amber_resin_seed.png`, and `assets/tiles/48/amber_resin_seed.png`.
  - Local Playwright fresh load: 64 board tiles, 95 images, 0 broken images, no error overlay, no horizontal overflow.
  - Local Playwright completed the first bouquet and verified `Bouquet Streak 1`, `+5% coins`, `+126 coins`, `120 base + 6 streak bonus at 5%`, and exactly three reward choices.
  - Local Playwright selected `Greenhouse Cuttings`, saw `Grave Soil` increase from `x1` to `x2`, clicked `Next Bouquet`, and verified Round 2 retained `Bouquet Streak 1` with `Cursed Thorn 0/3` and 3 visible blockers.
  - Local Playwright completed a second bouquet with review controls and verified `Bouquet Streak 2`, `+10% coins`, `+165 coins`, and `150 base + 15 streak bonus at 10%`.
  - Local Playwright ignored the second reward choice, clicked `Next Bouquet`, and verified default `Greenhouse Cuttings`, Round 3 start, `Bouquet Streak 2`, 64 board tiles, and no broken images.
  - Local Playwright separately verified the real Round 2 Cursed Thorn flow via a seeded adjacent match; thorns cleared to `Cursed Thorn 3/3` with 0 visible blockers.
  - Local Playwright verified `Pruning Shears`, `Moonwater Flask`, `Black Candle`, and `Grave Soil` each arm, cancel without spending, use once, spend to `x0`, and preserve 64 tiles.
  - Local Playwright verified Rune-Tended Soil still works: `Shape Bloom` earns `Eclipse Seed Rune`, Chest `Plant Rune` queues it, `Complete Bouquet` + `Next Bouquet` starts Round 2 with `Rune-Tended Soil +1 move`, `Bouquet Streak 1`, and 18 moves.
  - Local Playwright verified `M`/`Shape Bloom` still cycles `Eclipse Seed Rune`, `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!`.
  - Local Playwright verified `B` still emits `SUPREME BLOOM!` with 84 particles.
  - Local Playwright verified Chest opens/closes with Escape, Sacrifice opens/cancels, and mobile 390x844 shows `Bouquet Streak 1`, three reward choices, 64 tiles, 0 broken images, and no horizontal overflow.
- Browser console/runtime status: no local Playwright console errors or page errors observed during streak completions, reward selection/default, Round 2 thorn flow, booster checks, Rune-Tended Soil, review hooks, Chest/Sacrifice, or mobile checks.
- Vercel deployment URL/identifier checked: pending until this pass is committed and deployed.
- GitHub Pages preview status: pending until this pass is pushed and the Pages workflow completes.
- Known issues: none found locally for the Bouquet Streak slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: press `M` or click `Shape Bloom` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added.

## 2026-07-03 Codex Grave Soil booster slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested the final local/static booster, `Grave Soil`.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added visible `Grave Soil (x1)` beside the other boosters and updated the Black Market rail to show it stocked.
- Added reversible targeting: click `Grave Soil`, eligible normal loose tiles glow, Cancel exits without spending, and Cursed Thorn tiles reject the soil with explicit copy.
- Successful Grave Soil use spends exactly one count, spends no moves, marks one selected normal tile as `grave-soil-ready`, persists that marker, and lets the marker follow tile collapse/refill instead of drifting to the wrong coordinate.
- Grave Soil payoff: an exact normal 3-line containing a prepared tile awakens `Grave Soil Relic` and sweeps that row/column. Exact 4-line still wins as `Black Candle Vine`, exact 5-line still wins as `Eclipse Seed Rune`, L/T/cross shape rewards still win shape rewards, and 6+ or `B`/Sacrifice remains the Supreme Bloom path.
- Added Greenhouse/bouquet progress replenishment: completing a bouquet grants `Grave Soil x1`, while the starter `x1` remains visible from Black Market stock.
- Completion feedback now preserves the triggering match/booster summary when a powerful effect finishes the bouquet, so line relic copy is not hidden by the ceremony message.
- Added static audit markers for `Grave Soil`, `graveSoilBtn`, `graveSoilCount`, `graveSoilCells`, `toggleGraveSoil`, `useGraveSoil`, `queueGraveSoilBurst`, `graveSoilRelicForMatch`, `isGraveSoilEligible`, `grave-soil-target`, `grave-soil-ready`, and `boosters.graveSoil`.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - JS parse check over executable HTML scripts with bundled Node.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; `agent-browser` was unavailable, so bundled Playwright was used.
  - Local Playwright loaded 64 board tiles, 0 broken images, and no error overlay.
  - Local Playwright proved Grave Soil displays `x1`, opens targeting mode, highlights eligible normal tiles, cancels without spending, uses on one normal tile, spends to `x0`, preserves 64 tiles, and does not spend moves.
  - Local Playwright proved `Complete Bouquet` grants Grave Soil through Greenhouse progress and Round 2 starts with Cursed Thorn blockers.
  - Local Playwright proved Grave Soil rejects a Round 2 Cursed Thorn without spending, without changing `Cursed Thorn 0/3`, and with explicit rooted-blocker copy.
  - Local Playwright verified deterministic Grave Soil payoff with a prepared exact 3-line: `Grave Soil Relic` swept a row, consumed the prepared marker, and preserved 64 tiles.
  - Local Playwright verified the seeded UI path preserves the existing reward hierarchy when a prepared tile extends into a 4-line by resolving as `Black Candle Vine`.
  - Local Playwright verified `Pruning Shears`, `Moonwater Flask`, and `Black Candle` still arm/cancel/use, spend exactly one count on success, preserve 64 tiles, and do not spend moves.
  - Local Playwright verified Round 1 first-move flow, Round 2 Cursed Thorn goal/rejection flow, Rune-Tended Soil payoff, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, `N`, `M`, `B`, and mobile 390x844 with no horizontal overflow.
  - Vercel production deploy completed as `dpl_CY2vJrpN4r7kTexRyASfs6ffmkGR` at `https://bloom-tycoon-55y5edmsr-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel direct checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html?verify=grave-soil-ddd097c`, and `/assets/tiles/96/amber_resin_seed.png?verify=grave-soil-ddd097c`, and the playable contained all Grave Soil and preserved gameplay markers.
  - Vercel Playwright smoke loaded 64 board tiles, 0 broken images, no console/page errors, and proved Grave Soil arm/cancel/use.
  - GitHub Pages workflow `28637279782` succeeded for `ddd097c`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=grave-soil-ddd097c`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=grave-soil-ddd097c`, and the playable contained all Grave Soil and preserved gameplay markers.
  - GitHub Pages Playwright mobile smoke loaded 64 board tiles, 0 broken images, no console/page errors, no horizontal overflow at 390x844, and proved Grave Soil arm/cancel.
- Browser console/runtime status: no local Playwright console errors or page errors observed during Grave Soil, existing boosters, rune payoff, review hooks, Round 1/Round 2 flow, Chest/Sacrifice, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_CY2vJrpN4r7kTexRyASfs6ffmkGR`, `https://bloom-tycoon-55y5edmsr-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28637279782` succeeded for `ddd097c`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=grave-soil-ddd097c` returned `200` with all new markers.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the Grave Soil slice. The shell still does not have `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify `Grave Soil`: on a fresh load, click `Grave Soil (x1)`, confirm normal tiles glow, click `Cancel` to keep the count, then arm again and click a normal tile. The count should become `x0`, moves should stay unchanged, and the tile should gain a small gold/green soil sigil.
- How to trigger and verify Grave Soil Cursed Thorn rejection: use `Complete Bouquet`, click `Next Bouquet`, arm `Grave Soil`, and click a Cursed Thorn in row 2. The count should not change and the log should say Cursed Thorns are rooted blockers.
- How to trigger and verify Grave Soil payoff: prepare a normal tile that will be part of an exact 3-line, then make that match. The log should mention `Grave Soil Relic` sweeping the row/column. If the prepared match extends to an exact 4-line, `Black Candle Vine` should win instead.
- How to trigger and verify L/T/cross matches without console: press `M` or click `Shape Bloom` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added.

## 2026-07-03 Codex post-bouquet reward choice slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow local/static `Choose Your Reward` panel after bouquet completion.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a post-bouquet `Choose Your Reward` ceremony panel with exactly three one-click choices: `Greenhouse Cuttings`, `Apothecary Kit`, and `Black Market Favor`.
- Reward effects:
  - `Greenhouse Cuttings`: `Greenhouse +120 XP` and `Grave Soil x1`.
  - `Apothecary Kit`: `Apothecary +100 XP` and the lower-stock kit booster, currently `Pruning Shears x1` on a tie.
  - `Black Market Favor`: `Sub Rosa +80 Favor` and `Black Candle x1`.
- If the player ignores the panel, `Next Bouquet` safely auto-selects `Greenhouse Cuttings` before starting the next round.
- Base bouquet rewards still grant coins, order XP/Favor, and the order Chest item immediately; the extra `Grave Soil x1` now comes from the reward choice/default instead of unconditional completion.
- Preserved the repeatable bouquet loop, Round 2 Cursed Thorn setup, Rune-Tended Soil, board size, all four boosters, Chest/Sacrifice, and review hooks `Shape Bloom`, `N`, `M`, and `B`.
- Preserved reward hierarchy: exact 5-line = `Eclipse Seed Rune`, 4-line = `Black Candle Vine`, L/T/cross = shape rewards, Grave Soil exact 3-line = `Grave Soil Relic`, and 6+ straight line or `B`/Sacrifice only = Supreme Bloom.
- Added static audit markers for `Choose Your Reward`, `rewardChoicePanel`, `rewardChoiceState`, `Greenhouse Cuttings`, `Apothecary Kit`, `Black Market Favor`, `choosePostBouquetReward`, `applyDefaultRewardChoice`, `validRewardChoiceState`, and all three `data-reward-choice` values.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - JS parse check over executable HTML scripts with bundled Node.
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`.
  - Local static checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html`, `assets/tiles/96/amber_resin_seed.png`, and `assets/tiles/48/amber_resin_seed.png`.
  - Local Playwright fresh load: 64 board tiles, 95 images, 0 broken images, no error overlay, no horizontal overflow.
  - Local Playwright completed a bouquet and verified the panel shows exactly three choices.
  - Local Playwright chose `Greenhouse Cuttings` and saw `Grave Soil` increase from `x1` to `x2` with ritual-log feedback.
  - Local Playwright chose `Apothecary Kit` and saw `Pruning Shears` increase from `x1` to `x2` with Apothecary XP feedback.
  - Local Playwright chose `Black Market Favor` and saw `Black Candle` increase from `x1` to `x2` with Sub Rosa Favor feedback.
  - Local Playwright ignored the choice, pressed `Next Bouquet`, and verified default `Greenhouse Cuttings`, `Grave Soil x2`, Round 2 `Cursed Thorn 0/3`, 3 visible blockers, and 64 board tiles.
  - Local Playwright seeded and clicked the visible Round 2 target swap; adjacent Cursed Thorns cleared to `Cursed Thorn 3/3` with 0 visible thorn blockers.
  - Local Playwright verified `Pruning Shears`, `Moonwater Flask`, `Black Candle`, and `Grave Soil` each arm, cancel without spending, use once, spend to `x0`, and preserve 64 tiles.
  - Local Playwright verified `M`/`Shape Bloom` still cycles `Eclipse Seed Rune`, `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, and `Twin Stem Bloom!`.
  - Local Playwright verified `B` still emits `SUPREME BLOOM!` with 84 particles.
  - Local Playwright verified Chest opens/closes with Escape, Sacrifice opens/cancels, and mobile 390x844 shows the reward panel with 64 tiles, 0 broken images, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_3YEjdUqocPHDmXfJ427DgY3RE58C` at `https://bloom-tycoon-ajbo8g4h6-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=reward-choice-25db114` and `/assets/tiles/96/amber_resin_seed.png?verify=reward-choice-25db114`, and the playable contained the reward-choice markers.
  - Vercel Playwright smoke loaded 64 board tiles, 96 images, 0 broken images, no horizontal overflow, and proved `Greenhouse Cuttings` raises `Grave Soil` from `x1` to `x2`.
  - Vercel mobile Playwright smoke at 390x844 loaded 64 board tiles, 3 reward choices, 0 broken images, and no horizontal overflow.
  - GitHub Pages workflow `28639176278` succeeded for docs/status commit `e988ad6` after the first Pages deploy attempt for gameplay commit `25db114` failed transiently in `actions/deploy-pages`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=reward-choice-e988ad6` and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=reward-choice-e988ad6`, and the playable contained all reward-choice markers.
  - GitHub Pages Playwright desktop and mobile smoke loaded 64 board tiles, 96 images, 0 broken images, no horizontal overflow, 3 reward choices, and proved `Greenhouse Cuttings` raises `Grave Soil` from `x1` to `x2`.
- Browser console/runtime status: no local Playwright console errors or page errors observed during reward choices, default next-bouquet path, Round 2 thorn flow, booster checks, review hooks, Chest/Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during desktop or mobile reward-choice smoke.
- Vercel deployment URL/identifier checked: `dpl_3YEjdUqocPHDmXfJ427DgY3RE58C`, `https://bloom-tycoon-ajbo8g4h6-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28639176278` succeeded for `e988ad6`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=reward-choice-e988ad6` returned `200` with all reward-choice markers.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the reward-choice slice. The first Pages deploy attempt for `25db114` failed transiently after artifact upload, but the follow-up docs/status push succeeded and updated the public Pages playable. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright after installing the matching app-bundled Chromium revision.
- How to trigger and verify L/T/cross matches without console: press `M` or click `Shape Bloom` repeatedly; the cycle still includes `Black Candle Vine`, `Witch's Cross!`, `Night Garden L-Bloom!`, `Twin Stem Bloom!`, and `Eclipse Seed Rune`.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added.
