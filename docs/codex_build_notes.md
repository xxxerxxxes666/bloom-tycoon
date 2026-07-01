# Codex Build Notes

## 2026-07-01 repo setup for Hermes audit

- Restored the full Bloom Tycoon project into the current repo root from the local handoff source.
- Confirmed the HTML playable is present at `playable/midnight_bloom_prototype.html`.
- Confirmed required tile assets are present in `assets/tiles/48` and `assets/tiles/96`.
- Added `docs/hermes_audit_next_tasks.md` as the Hermes-maintained task queue.
- Added this build log so future Codex passes can summarize each coding pass.
- Added repo-level agent instructions requiring future Codex passes to read Hermes' task file before coding.
- Added Git ignore rules that keep local scratch output out of the repo while preserving required tile PNG assets.
