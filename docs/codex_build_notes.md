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
- Live URL: https://i-want-you-to-prepare-bloom.vercel.app/
- Verified the root page, `playable/midnight_bloom_prototype.html`, and `assets/tiles/96/amber_resin_seed.png` return `200 OK`.
- GitHub repo creation is still waiting on browser login or a GitHub token/CLI auth path.
