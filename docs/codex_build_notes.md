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
- Vercel preview URL to check after deploy: https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html
- GitHub Pages URL to check after push: https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html
