# Codex Build Notes

## 2026-07-15 mobile active-play greenhouse hierarchy and cascade cleanup

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: exact mobile active play no longer shows the illustrated greenhouse footer or ritual-log sentence below the board. The active mobile first viewport now keeps the compact title/objective, bouquet bar, a compact Greenhouse next-unlock bar, one cue/tutorial pill, all 64 tiles, and the contextual action. Greenhouse before/after remains in the completion ceremonies.
- Performance/game-feel result: long cascades now keep the first waves readable and resolve later waves faster; greenhouse intake flights and bouquet binding seals have shorter tails. The final runtime run measured exact `390x844` mobile guided swaps at `482ms` and `749ms` on a `12/14` second-swap path, with 64 tiles, no disabled active tiles, no overflow, no broken images, and `29` live FX nodes immediately after the second swap that cleaned within budget.
- Runtime metrics: desktop `467` nodes, `80` images, `26` filtered, `36` shadowed, `3` animated, 64 tiles, 8 visible board rows, 0 dormant preview nodes, 0 prototype scaffold nodes. Exact mobile `467` nodes, `80` images, `27` filtered, `39` shadowed, `3` animated, 64 tiles, 8 visible board rows, 0 dormant preview nodes, 0 prototype scaffold nodes, hidden `#mobileGreenhousePlinth`, hidden `#ritualLog`, and exactly two meaningful bars. Reduced motion held `25` filtered / `37` shadowed / `3` animated.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; `node --check` passed for all four Playwright specs; local Chromium chunks passed against `http://127.0.0.1:4243/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js` 4/4, `scripts/verify_tutorial_progress.spec.js` 3/3, `scripts/verify_payoff_ceremony_contract.spec.js` 2/2, and `scripts/verify_pass3_feedback.spec.js` 2/2. The combined long runner was split into chunks after local signal-143 terminations; the same 11 tests passed sequentially.
- Coverage: desktop `1280x720`, exact `390x844`, touch/click guided swaps, keyboard board play, tutorial skip/replay, full Round 1 -> 2 -> 3, Black Candle Vine, Cursed Thorn CRACK/BREAK, fail/retry, save/reload payoff states, reduced motion, local-QA Supreme Bloom review hook, 64-tile/eight-row integrity, no horizontal overflow, no visible broken images, and no console/page/request failures.
- Screenshot evidence inspected: `work/mobile-greenhouse-strip-fixed.png`, `work/pass3-mobile390-round1-hit.png`, `work/pass3-mobile390-thorn-damage.png`, `work/pass2-mobile390-round1-pending.png`, and `work/pass2-mobile390-round3-raised.png`. Visual judgment: the mobile footer/log are gone during active play; the greenhouse bar names `Restore First Bouquet Glass`; all eight rows remain visible; ceremonies still show one trophy, one greenhouse scene, and one primary action.
- Browser console/runtime status: final local Chromium chunks observed 0 console errors/warnings in the feedback contract, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow. The former greenhouse image `preload` hints were changed to `prefetch` to remove Chromium's unused-preload warning while still warming later ceremony art.
- Commit/push/live status: pending commit at note time. Public GitHub Pages/Vercel were not rechecked because the configured `origin` SSH remote still fails with `Permission denied (publickey)` in this environment; local `main` also has one remote Hermes docs commit to reconcile before a successful push.
- Known issues: public live remains stale until push credentials and branch reconciliation are available. No new player-facing issue found locally.
- How to trigger and verify L/T/cross matches without console: on a local QA URL with `bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; `SUPREME BLOOM!` appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed-line scan passed for private-key headers, provider token prefixes, JWT-like strings, credential assignments, `.env`, external URLs, tracker/analytics/payment/ad/backend/account hooks, dependency or permission changes, and copied protected-source references. This pass added no secrets, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, broad permissions, or copied Diablo expression.

## 2026-07-15 focused cascade latency and FX cleanup

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_runtime_performance.spec.js`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: active matching returns control faster on phone while preserving the approved board-first gothic screen, six-flower art, Black Candle read, Cursed Thorn feedback, bouquet ceremonies, and first-three-order flow. Swap glide, fall/refill/settle, match particles, Black Candle sweep, wild-chain lashes, and greenhouse ceremony animation tails were shortened or capped; Moonlit/Bloodroot greenhouse art is preloaded to avoid fast-progression image aborts.
- Performance metrics: exact `390x844` guided-swap regression measured `503ms` for the first guided swap and `781ms` for the second guided swap in the final full suite, with 64 tiles, no disabled active tiles, no overflow, no broken images, and `28` live FX nodes after the second swap. A prior local probe before this pass measured about `638ms` and `1105ms` on exact mobile, with up to `36+` live FX nodes after the second swap. Static runtime remains inside budget: desktop `466` nodes, `80` images, `26` filtered, `36` shadowed, `3` animated; exact mobile `466` nodes, `80` images, `27` filtered, `39` shadowed, `3` animated; reduced motion `25` filtered / `37` shadowed / `3` animated.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; `node --check` passed for all four Playwright specs; full local Chromium suite passed 11/11 against `http://127.0.0.1:4242/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Coverage: desktop `1280x720`, exact `390x844`, touch/click guided swaps, keyboard board play, tutorial skip/replay, full Round 1 -> 2 -> 3, Black Candle Vine, Cursed Thorn fail/retry, save/reload payoff ceremonies, reduced motion, local-QA Supreme Bloom review hook, 64-tile/eight-row integrity, no horizontal overflow, no visible broken images, and no console/page/request failures.
- Screenshot evidence inspected: `work/perf-pass/desktop-1280x720-fresh.png`, `work/perf-pass/desktop-1280x720-after-swap.png`, `work/perf-pass/mobile-390x844-fresh.png`, and `work/perf-pass/mobile-390x844-after-swap.png`. Visual judgment: the board remains dominant, exact mobile keeps all eight rows visible, and the faster FX still reads as a clear hit/cascade without obscuring the flowers.
- Browser console/runtime status: final local Chromium checks observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow.
- Known issues: public GitHub Pages/Vercel are expected to remain stale until this environment can push to `origin/main`; previous push attempts failed for missing GitHub credentials and this pass has not changed credentials.
- How to trigger and verify L/T/cross matches without console: on a local QA URL with `bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed-file and added-line scans passed for private-key headers, provider token prefixes, JWT-like strings, credential assignments, `.env`, tracker/analytics/payment/ad/backend/account hooks, dependency or permission changes, external third-party asset additions, and copied protected-source references. This pass added no secrets, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, broad permissions, or copied Diablo expression.

## 2026-07-15 first-three journey Round 3 handoff tuning

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: the no-review Round 1 -> Round 2 -> Round 3 journey now hands off to Bloodroot Compact with the concise visible line `Final Order: Match Bloodroot and Sol Rot.` instead of the previous long repeated sentence. The active cue state is also reset from the new round plan, so Round 3 no longer inherits stale `Nightshade next` guidance from Moonlit Wreath. After the Cursed Thorn lesson, the replayable tutorial now says `Finish the Moonlit Wreath.` instead of falling back to the fresh Round 1 `Swap the glowing flowers.` prompt.
- Playtest/tuning result: a no-review greedy browser playthrough reached active Round 3 on desktop `1280x720` and exact mobile `390x844` with 64 tiles, `Bouquet 0/27 -> +180 coins`, 14 moves, tutorial hidden, `Match Bloodroot and Sol Rot.` cue state, no overflow, no broken images, no console errors, and no failed requests. Screenshots inspected: `work/round3-handoff-final-1280x720.png` and `work/round3-handoff-final-390x844.png`.
- Runtime metrics from the final local Chromium suite stayed unchanged: desktop `464` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, 64 tiles, 8 complete board rows, 0 dormant preview nodes, 0 prototype scaffold nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `464` nodes, `80` images, `27` filtered, `39` shadowed, `3` animated, 64 tiles, 8 rows, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; targeted Playwright passed 5/5 for `scripts/verify_tutorial_progress.spec.js` and `scripts/verify_payoff_ceremony_contract.spec.js`; full Playwright Chromium passed 10/10 for `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Coverage: desktop, exact `390x844` mobile, tutorial skip/replay, touch/click guided swaps via the full journey suite, keyboard focus/swap, Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, 64-tile/eight-row integrity, no horizontal overflow, no visible broken images, and no console/page/request failures.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow in the final full suite and the no-review Round 3 handoff replay.
- Commit/push/live status: committed locally as `39cf789` (`Tune first three order handoff`). `git push origin main` failed with `Permission denied (publickey)`, and a one-off HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`; local `main` remains ahead of `origin/main` by 1 commit. Read-only GitHub Pages and Vercel checks returned `200` but still contain the old `blooms under the moonlit greenhouse upgrade` copy, so both public URLs are stale for this milestone until push credentials are available.
- Known issues: no new player-facing issue found locally. Public GitHub Pages and Vercel are stale because this environment cannot authenticate to push.
- How to trigger and verify L/T/cross matches without console: on a local QA URL with `bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; real L/T/cross resolution is still covered by the focused feedback suite.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: final changed-file and added-line scans passed for private-key headers, provider token prefixes, JWT-like strings, credential assignments, tracker/analytics/payment/ad hooks, external URLs, scheduler hooks, and copied-source risk patterns. This pass added no assets, dependencies, third-party art, copied Diablo expression, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, scheduler hooks, or broad repo access.

## 2026-07-15 local review hook source isolation

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: normal Bloom Tycoon play is unchanged: board-first Round 1 -> Round 2 -> Round 3, six original flower tiles, one bouquet bar, one Greenhouse unlock bar, tutorial Help/Skip, 64 tiles/eight rows, Cursed Thorn teaching, greenhouse ceremonies, and Play Again. The remaining local QA review shortcuts are now installed only inside `installLocalReviewHooks()` when a localhost/file URL explicitly includes `?bloomReview=1`; normal player loads no longer register the QA keydown listener or carry top-level `demo*` helper functions/state in the runtime closure.
- Source cleanup: removed top-level `shapeDemoIndex`, `demoCompleteBouquet()`, `demoSupremeBloom()`, `demoMatchShape()`, `makeShapeAuditBoard()`, and `makeShapeDemoBoard()`. Added verifier coverage for the new isolated review helper names and forbidden-regression coverage for the old `demo*` helper names.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; inline playable JavaScript parse with `new Function` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; after merging `origin/main`, the full local Chromium suite passed 10/10 against `http://127.0.0.1:4241/playable/midnight_bloom_prototype.html` using cached Playwright `1.61.1`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Browser QA metrics: desktop runtime reported `464` nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` prototype scaffold nodes, no overflow, no broken images, and QA hooks disabled. Exact `390x844` mobile reported `464` nodes, `80` images, `27` filtered, `39` shadowed, `3` animated, `64` tiles, `8` complete rows, no overflow, no broken images, and QA hooks disabled. Reduced motion reported `25` filtered / `37` shadowed / `3` animated.
- Additional QA: visually inspected `work/pass3-mobile390-thorn-damage.png`, `work/pass2-mobile390-round3-raised.png`, `work/pass3-desktop-supreme-review.png`, and `work/pass2-desktop-round1-pending.png`. The suite covered desktop, exact `390x844`, tutorial skip/replay, touch/tap, keyboard focus/swap, full Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, 64-tile integrity, and no console/page/request errors.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite.
- Vercel deployment URL/identifier checked: not redeployed in this local checkpoint.
- GitHub Pages preview status: not checked before the final push attempt; previous notes already record public live drift because push credentials have been unavailable.
- Known issues: public GitHub Pages/Vercel will remain stale until push credentials are available and deployment updates.
- How to trigger and verify L/T/cross matches without console: on a local QA URL with `bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled and do not install the QA keydown listener.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, trackers/analytics SDKs, external asset additions, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, dependency changes, and protected-source references. No findings; broad-pattern hits in changed files were the existing word `authored` in tutorial logic. No secrets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 private focused runtime and audit scaffold prune

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: normal player loads keep the same board-first first-three Bloom Tycoon route, but the old hidden shape-audit JSON node and direct global Supreme Bloom trigger are gone. The playable script now runs inside a private closure, so verifier/demo helpers no longer leak onto `window`; local QA keyboard shortcuts still work only on localhost/file URLs with `?bloomReview=1`.
- Source cleanup: removed `#shapeAuditData`, `analyzeBoardSnapshot()`, `refreshShapeAuditData()`, the unconditional `window.triggerSupremeBloom = showSupreme` export, and promoted those names into static forbidden-regression coverage. This reduces the focused runtime to `464` desktop DOM nodes and `464` exact-mobile DOM nodes while preserving `64` tiles, `8` complete rows, `80` images, `0` dormant preview nodes, and `0` prototype scaffold nodes.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Browser QA: desktop runtime reported `464` nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` rows, no overflow, no broken images, and QA hooks disabled. Exact `390x844` mobile reported `464` nodes, `80` images, `27` filtered, `39` shadowed, `3` animated, `64` tiles, `8` rows, no overflow, no broken images, and QA hooks disabled. Reduced motion reported `25` filtered / `37` shadowed / `3` animated.
- Additional QA: targeted Chromium global-surface probe confirmed normal desktop and exact `390x844` mobile have no `#shapeAuditData`, `window.triggerSupremeBloom`, `window.demoCompleteBouquet`, `window.demoMatchShape`, or `window.showSupreme`; local QA `?bloomReview=1` still enables `window.__bloomReviewHooksEnabled` for keyboard coverage without exporting those functions. Visually inspected `work/pass2-mobile390-round3-raised.png` and `work/pass2-desktop-round1-pending.png`.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and supplemental global-surface probe. The suite covered desktop, exact mobile, tutorial skip/replay, touch/tap, keyboard focus/swap, full Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, and 64-tile integrity.
- Commit/push/live status: committed locally as `Isolate focused runtime globals`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`; public GitHub Pages/Vercel remain stale until this divergent local branch can be pushed and deployed.
- How to trigger and verify L/T/cross matches without console: on a local QA URL with `bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; this pass also keeps the helper functions off `window`.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave the shortcut disabled and no longer expose `window.triggerSupremeBloom`.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, trackers/analytics SDKs, external asset additions, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, dependency changes, and protected-source references. No findings. No secrets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 retired streak/Shape Bloom scaffold prune

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: the focused first-three Bloom Tycoon route no longer carries the old `Shape Bloom`, `Bouquet Streak`, or `Next Streak Target` UI/copy path. Round 2/Round 3 plaque text stays on the current heartbeat: match goals, Cursed Thorn teaching, coins, greenhouse upgrade, Bloodroot completion, and replay.
- Source cleanup: removed dormant streak constants/state/save key, hidden badge CSS, objective badge render hooks, streak payout helpers, stale `Shape Bloom` hint/copy helpers, and old Round 4-57 required-marker baggage from the HTML verifier. The verifier now bans the retired streak/Shape Bloom strings and still bans old future-round preview/ledger scaffolding. Added a standard-library PNG alpha/socket guard so the accepted six-flower RGBA icon set cannot regress to black-square or undersized crops.
- Runtime metrics from local Chromium after the pass: desktop `465` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` prototype scaffold nodes, `0` broken images, and no overflow. Exact `390x844` mobile stayed at `465` nodes, `80` images, `27` filtered, `39` shadowed, `3` animated, `64` tiles, `8` complete rows, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: visually inspected `work/scaffold-cleanup/mobile390-round2-no-shape-streak.png`. Targeted exact `390x844` Round 2 probe confirmed no `Shape Bloom`, `Bouquet Streak`, or `Next Streak Target` text; 64 tiles; 8 rows; no overflow; no broken images; no console/page/request errors; and one visible non-board button while the tutorial prompt is open.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and targeted Round 2 probe. The suite covered desktop, exact mobile, tutorial skip/replay, touch/tap, keyboard focus/swap, full Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, and 64-tile integrity.
- Known issues: local `main` is still divergent from `origin/main`, and previous push attempts from this shell failed for missing GitHub credentials. Public GitHub Pages/Vercel are expected to remain stale until push credentials/branch divergence are resolved.
- How to trigger and verify L/T/cross matches without console: on a local QA URL with `bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; this pass removed only the obsolete Shape Bloom prompt/scaffold, not the underlying rare shape match resolution.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and additions were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, dependency changes, external asset additions, and protected-source references. No findings in code/assets; build-note hits are descriptive status text only. No secrets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 retired bottom Elements strip source prune

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: the focused first-three Bloom Tycoon route still opens as the approved board-first gothic match-3 with the six original flower tiles, one bouquet progress bar, one Greenhouse unlock bar, tutorial Help/Skip, 64 tiles, 8 rows, touch/keyboard play, Cursed Thorn teaching, bouquet coins, greenhouse restoration, Round 2, Round 3, and Play Again. The retired bottom Elements/storage strip no longer exists as dormant CSS, render code, or pulse state behind the player experience.
- Runtime/source cleanup: removed `.bottom`, `.bottom-card`, `.elements`, `.element-count`, `@keyframes element-pulse`, responsive/hide rules for the dead strip, the `#elements` render branch, `elementPulseTargets`, and `scheduleElementPulseClear()`. Static verifier coverage now forbids those retired strip selectors/state names from returning.
- Runtime metrics from local Chromium after the pass: desktop `465` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` prototype scaffold nodes, `0` bottom strip nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `465` DOM nodes, `80` images, `27` filtered elements, `39` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` bottom strip nodes, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; inline playable JavaScript parse with `new Function` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: supplemental Chromium probe captured and visually inspected `work/bottom-strip-prune/desktop-fresh.png` and `work/bottom-strip-prune/mobile390-fresh.png`. The probe reported `0` retired bottom strip nodes, `0` hidden preview nodes, `64` tiles, `8` visible rows, exactly `2` progress bars, no overflow, no broken images, no console errors, no page errors, and no failed requests on desktop and exact mobile.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and supplemental desktop/mobile screenshot probe.
- Commit/push/live status: committed locally as `Prune retired bottom elements strip`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`. Read-only GitHub Pages and Vercel checks both returned `200` with stale HTML still containing `elementPulseTargets`, `.bottom-card`, and `id="elements"`; local `main` is still ahead of and behind `origin/main`.
- Known issues: local `main` remains divergent from `origin/main`, so live deployment drift cannot be resolved from this shell without reconciling remote history and working push credentials. No player-facing regression found locally.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, dependency changes, and protected-source references. No findings. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 retired storage scaffold prune

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: the focused first-three Bloom Tycoon route no longer carries the retired bottom Elements/coin storage strip or Chest/Rune storage copy behind the board-first experience. Normal play still opens on the six-flower gothic board with one bouquet bar, one Greenhouse unlock bar, Help/Skip tutorial, 64 tiles, 8 rows, Cursed Thorn teaching, bouquet coins, greenhouse restoration, Round 2, Round 3, and Play Again. Rare five-line/Supreme Bloom feedback remains board-only and no longer implies Chest Storage or queued Rune-Tended Soil inventory.
- Runtime/source cleanup: removed the Chest access styles, bottom storage DOM, `chestState`, Chest render/add/normalize/open/close functions, chest save/load keys, Rune-Tended Soil queued move state, and old storage completion wording. Static verifier coverage now forbids those storage ids/functions/copy from returning.
- Input polish found during QA: exact mobile touch-swipe advanced the first bouquet but briefly left the stale `Selected` ritual-log line during resolve; the pass now writes `Swapping. Flowers trade places.` before cascade resolution so touch screenshots and assistive output do not claim a tile remains selected.
- Runtime metrics from the passing local Chromium suite: desktop `465` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` prototype scaffold nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `465` DOM nodes, `80` images, `27` filtered elements, `39` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; extracted playable JavaScript `node --check` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: supplemental Chromium probe captured and visually inspected `work/storage-prune/desktop-fresh.png`, `work/storage-prune/mobile390-fresh.png`, and `work/storage-prune/mobile390-after-touch-swipe.png`. The probe reported `0` storage scaffold nodes, no `Chest`/`Storage`/`Rune-Tended`/`Supreme Bloom Shard` text, `64` tiles, `8` visible rows, no overflow, no broken images, no console/page/request errors, and exact mobile touch-swipe progress to `Bouquet 3/14 -> +120 coins` with `0` selected tiles.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and supplemental desktop/mobile/touch-swipe probe.
- Commit/push/live status: local verification complete before commit. Public GitHub Pages/Vercel are expected to remain stale until the existing push credential/branch-divergence issue is resolved; local `main` is still ahead of and behind `origin/main`.
- Known issues: dead bottom-strip CSS selectors still exist as harmless inert style debt; the player DOM/JS/source state and static verifier guard the retired storage system itself. Push credentials remain unavailable in this shell, and local `main` remains divergent from `origin/main`.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, dependency changes, and protected-source references. No findings. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 retired booster/Sacrifice source isolation

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: the focused first-three Bloom Tycoon route still opens as the approved board-first gothic match-3: six original flower tiles, 64 tiles, 8 rows, one bouquet bar, one greenhouse unlock bar, tutorial Help/Skip, keyboard/touch play, the Round 1 -> Round 2 -> Round 3 greenhouse loop, and no visible retired booster/Sacrifice/Chest controls. The code path no longer carries the unreachable booster/Sacrifice state, handlers, tile classes, save keys, or Grave Soil relic branch.
- Runtime/source cleanup: removed the dead Pruning Shears, Moonwater Flask, Black Candle booster, Grave Soil, and Sacrifice implementation block plus matching dead CSS. Static verifier coverage now forbids the removed state/function/class names from returning.
- Runtime metrics from the passing local Chromium suite: desktop `472` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` prototype scaffold nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `472` DOM nodes, `80` images, `27` filtered elements, `39` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` prototype scaffold nodes, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated elements.
- Verification commands/results: `python3 scripts/verify_html_match_shapes.py` passed; `python3 scripts/verify_project.py` passed; inline playable JavaScript parse passed; `git diff --check` passed; `node --check` passed for all four Playwright specs; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: supplemental Chromium probe captured and visually inspected `work/scaffold-source-prune/desktop-fresh.png` and `work/scaffold-source-prune/mobile390-fresh.png`. The probe reported `64` tiles, `8` complete rows, `0` retired scaffold nodes/classes, no overflow, no broken images, no console errors, no page errors, and no failed requests.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and supplemental screenshot probe.
- Commit/push/live status: local verification complete before commit. Read-only GitHub Pages check returned `200` and 471,193 bytes, but it still contains `let activeBooster`, `function renderBoosterPanel`, and `id="boosterPanel"`, so public live is stale until the existing push credential/branch-divergence issue is resolved.
- Known issues: inactive Chest/Rune storage internals still exist for rare shape reward and old save tolerance; they remain non-visible in normal play. Push credentials remain unavailable in this shell, and local `main` is still ahead of and behind `origin/main`.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, and protected-source references. No findings. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 static scaffold prune and touch-swipe hardening

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: the focused first-three Bloom Tycoon route no longer ships the retired Sacrifice, booster, or Chest controls as static body markup that must be removed at startup. The board still opens first with the six-flower set, one bouquet bar, one greenhouse unlock bar, one Help action, 64 tiles, and the existing Round 1 -> 2 -> 3 ceremony/replay loop. Phone play also now supports a real touch swipe across adjacent glowing flowers; the swipe advances the bouquet without leaving a tile selected.
- Runtime/source cleanup: removed the retired scaffold body nodes, the normal-route startup scaffold remover, stale render-time button/count updates, old conditional UI bindings, and board hover/focus booster preview listeners. Static verifier coverage now forbids the retired scaffold ids/text and requires the touch-swipe path.
- Runtime metrics from the passing local Chromium suite: desktop `472` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` legacy scaffold nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `472` DOM nodes, `80` images, `27` filtered elements, `39` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` legacy scaffold nodes, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; `node --check` passed for all four Playwright specs; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: supplemental normal-route Chromium probe captured and visually inspected `work/scaffold-prune/desktop-fresh.png`, `work/scaffold-prune/mobile390-fresh.png`, and `work/scaffold-prune/mobile390-after-swipe.png`. The probe reported `0` static scaffold hits, `0` scaffold nodes, `64` tiles, `8` visible rows, no overflow, no broken images, no selected tile after settled swipe, no console errors, no page errors, and no failed requests. Save/reload preserved the Round 1 swipe progress, and forced Round 2 fail -> Retry restored the Cursed Thorn lesson with 64 tiles.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and supplemental desktop/mobile/touch-swipe probe.
- Commit/push/live status: local verification complete before commit. Public GitHub Pages/Vercel are expected to remain stale until the existing push credential/branch-divergence issue is resolved.
- Known issues: inactive support functions for retired systems still exist in source for old QA/reward internals, but the static player DOM, listener path, startup remover, and render hot path are pruned. Push credentials remain unavailable in this shell, and local `main` is still ahead of and behind `origin/main`.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, and protected-source references. No findings. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 normal-route scaffold isolation

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_runtime_performance.spec.js`, and this note.
- Player-visible result: normal player loads no longer carry the old Sacrifice, booster, or Chest support scaffold in the runtime DOM. The first-three board-first slice still opens directly on the match board with the six-flower set, one bouquet bar, one greenhouse unlock bar, tutorial Help/Skip as appropriate, 64 tiles, and the same Round 1 -> 2 -> 3 ceremony/replay flow. Local QA mode (`?bloomReview=1` on localhost/file origins) still keeps the scaffold available for existing review coverage.
- Runtime metrics from the passing local Chromium suite: desktop `472` DOM nodes, `80` images, `26` filtered elements, `36` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, `0` legacy scaffold nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `472` DOM nodes, `80` images, `27` filtered elements, `39` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` legacy scaffold nodes, no overflow, and no broken images. Reduced motion stayed at `25` filtered / `37` shadowed / `3` animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; `node --check` passed for all four Playwright specs; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: fresh desktop and exact `390x844` normal-route probes captured `work/scaffold-strip-desktop-fresh.png` and `work/scaffold-strip-mobile390-fresh.png`; both were visually inspected. The probe reported `0` scaffold nodes, `64` tiles, no overflow, no broken images, no console errors, no page errors, and no failed requests.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow across the full suite and supplemental screenshots.
- Commit/push/live status: local verification complete before commit. Public GitHub Pages/Vercel are expected to remain stale until the existing push credential/branch-divergence issue is resolved.
- Known issues: normal runtime still retains inactive support functions in source for QA-mode coverage; the player DOM and listener path are isolated. Push credentials are unavailable in this shell.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, and protected-source references. No findings. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 Bloodroot and replay tutorial conclusion polish

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: the guided tutorial now concludes when the player advances into the unguided Round 3 `Bloodroot Compact` order and stays concluded after `Play Again`. Bloodroot entry and replay return to a clean active board with only `Help` as the non-board action, while focused bouquet completion ceremonies still restore the terse payoff guide (`Raise Conservatory.`, `Play again.`) across reloads.
- Why this pass: the next unfinished milestone after the completed art/performance/tutorial/progress/first-three tuning work was ceremony/replay/accessibility polish. Browser probing showed a real replayability issue: a player who followed the guided flow carried the tutorial panel into Round 3 and saw `Skip` again after `Play Again`.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Runtime metrics from the passing suite: desktop `625` DOM nodes, `88` images, `34` filtered elements, `62` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `625` DOM nodes, `88` images, `35` filtered elements, `65` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, no overflow, and no broken images. Reduced motion stayed at `33` filtered / `63` shadowed / `3` animated elements.
- Additional QA: supplemental exact `390x844` Chromium probe captured `work/milestone6-mobile390-round3-clean.png` and `work/milestone6-mobile390-playagain-clean.png`; both were visually inspected. The probe ended on replay Round 1 with `tutorialVisible:false`, `Help` visible, one non-board button, `64` tiles, `8` complete rows, no overflow, no broken images, no console/page/request errors, and audio events recorded for complete/restore/handoff.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow in the full suite and supplemental replay probe.
- Commit/push/live status: committed locally after verification. `git push origin main` failed with `Permission denied (publickey)`, and a non-interactive HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`. GitHub Pages returned `200` on the read-only check but did not contain this checkpoint's local markers, so public live remains stale until push credentials and branch divergence are resolved.
- Known issues: public live remains stale from this environment because this checkout is ahead of and behind `origin/main` and cannot authenticate to push.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external trackers/analytics SDKs, backend/account/payment/ad hooks, dependency additions, broad permissions, scheduler/cron additions, and protected-source references. No findings in code/test additions; build-note hits are descriptive status text only. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 first-three-order Bloodroot tuning

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: Round 3 `Bloodroot Compact` now gives the first unguided mastery order 14 moves instead of 12 while preserving the 14 Bloodroot + 13 Sol Rot target, 180-coin payoff, Bloodroot conservatory ceremony, and Play Again loop. The Round 3 ceremony guidance now matches the dominant action: `Raise Conservatory.` before spending and `Play again.` after the conservatory is raised.
- Why this pass: after the completed flower, performance, tutorial, progress, and scaffold passes, the next unfinished milestone was first-three-level playtest/tuning. The prior Round 3 asked for 27 target flowers in 12 moves immediately after two guided teaching rounds, which was tighter than the intended first unguided mastery step.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Runtime metrics from the passing suite: desktop `625` DOM nodes, `88` images, `34` filtered elements, `62` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, `0` dormant preview nodes, no overflow, and no broken images. Exact `390x844` mobile stayed at `625` DOM nodes, `88` images, `35` filtered elements, `65` shadowed elements, `3` animated elements, `64` tiles, `8` complete rows, no overflow, and no broken images. Reduced motion stayed at `33` filtered / `63` shadowed / `3` animated elements.
- Additional QA: visually inspected `work/pass2-mobile390-round3-pending.png` and `work/pass2-mobile390-round3-raised.png`; the Bloodroot ceremony copy, one dominant action, greenhouse before/after, and mobile hierarchy are coherent with no visible broken art or text overlap. The suite covered desktop, exact `390x844`, tutorial skip/replay, keyboard focus/swap, touch/click Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, 64-tile integrity, no failed requests, and no console/page errors.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow in the full suite.
- Commit/push/live status: local verification complete before commit. Public GitHub Pages/Vercel are expected to remain stale until the existing push credential/branch-divergence issue is resolved.
- Known issues: automated large-sample real-swap fairness simulation was attempted but not retained because the animation-aware harness was too slow for this pass. The conservative move-count tune is covered by the journey contract and should be revisited with a dedicated fast fairness harness later.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external trackers/analytics SDKs, backend/account/payment/ad hooks, dependency additions, broad permissions, scheduler/cron additions, and protected-source references. No findings in code/test additions; build-note hits are descriptive status text only. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 focused cascade latency/compositor cleanup

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_runtime_performance.spec.js`, and this note.
- Player-visible result: active matching returns control a little faster and carries less hidden compositor baggage. Swap glide now resolves in `185ms`, cascade hit/settle waits are shorter, and hidden payoff/bottom-strip subtrees no longer keep filters, shadows, transitions, or animations alive during active board play. The board-first format, six-flower art, tutorial, first-three-order flow, ceremony, and 64-tile layout are unchanged.
- Runtime metrics: fresh desktop improved from `50` filtered / `93` shadowed elements to `34` filtered / `62` shadowed; exact `390x844` mobile improved from `51` / `96` to `35` / `65`; reduced motion improved from `49` / `94` to `33` / `63`. DOM stayed `625`, images `88`, animated elements `3`, dormant preview nodes `0`, complete board rows `8`, and normal-route QA hooks disabled. The focused performance spec now enforces lower budgets: filters `<=60`, shadows `<=95`.
- Latency probe: exact `390x844` first guided swap control-return probe improved from about `750ms` before this pass to about `701ms` after the timing/compositor cleanup, with 64 tiles, 8 complete rows, no overflow, no broken images, no console errors, and no failed requests.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; `node --check` passed for all four Playwright specs; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: visually inspected `work/performance-mobile390-before-swap.png`, `work/performance-mobile390-after-first-swap.png`, `work/pass3-mobile390-round1-hit.png`, and `work/pass3-desktop-round1-hit.png`. The passing suite covered desktop, exact `390x844`, tutorial skip/replay, keyboard swap/focus, touch/click Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, QA-only Supreme Bloom review hook, 64-tile integrity, no horizontal overflow, no visible broken images, and no console/page/request failures.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow in the full suite and targeted latency probe.
- Commit/push/live status: committed locally as `Reduce focused cascade compositor cost`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`. This checkout was already ahead of `origin/main` by 5 commits and behind by 2 before this pass; it is now ahead by 6 and behind by 2. Public GitHub Pages/Vercel are expected to remain stale until the existing push credential/branch-divergence issue is resolved.
- Known issues: public live remains stale relative to local focused-slice checkpoints until `main` can be pushed and deployed from this environment.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external trackers/analytics SDKs, backend/account/payment/ad hooks, dependency additions, broad permissions, scheduler/cron additions, and protected-source references. No findings in code/test additions; the only added-line hits were expected build-note deployment/status words. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 first bouquet payoff guidance hierarchy

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: a player who follows the tutorial into Round 1 completion now keeps the terse payoff guidance pill (`Coins restore the greenhouse.` then `Tap Next Order.`) while `Skip`, `Help`, `Shuffle`, and active-board controls stay hidden. The Round 1 payoff presents one bouquet trophy, one greenhouse before/after, concise coins, and exactly one visible action: first `Restore Greenhouse · 100 coins`, then `Next Order → Moonlit Wreath`. The same hierarchy survives ceremony reloads.
- Runtime metrics from the full local Chromium suite stayed at desktop `625` DOM nodes, `88` images, `64` tiles, `8` complete rows, `50` filtered elements, `93` shadowed elements, `3` animated elements, no dormant preview nodes, no broken images, no overflow, and QA hooks disabled on the normal route. Exact `390x844` mobile stayed at `625` DOM nodes, `88` images, `64` tiles, `8` complete rows, `51` filtered elements, `96` shadowed elements, and `3` animated elements. Reduced motion stayed at `49` filtered / `94` shadowed / `3` animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: visually inspected `work/pass2-mobile390-round1-pending.png`, `work/pass2-mobile390-round1-restored.png`, `work/pass2-desktop-round1-pending.png`, and `work/pass2-desktop-round1-restored.png`. The screenshots show the retained guidance pill, one primary action, no tutorial escape control, no broken images, and no overlapping payoff UI. The passing suite covered desktop, exact `390x844`, tutorial skip/replay, keyboard swap/focus, touch/click first-three-order journey, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, 64-tile integrity, and no console/page/request failures.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow in the full suite.
- Commit/push/live status: committed locally as `Polish first bouquet payoff guidance`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`. Local `main` is ahead of `origin/main` by 5 commits and behind by 2 previously fetched commits. Read-only GitHub Pages and Vercel both returned `200` and `470197` bytes but do not contain the new `body.focused-payoff-active .tutorial-skip` rule or persisted `tutorialActive` state, so public live remains stale until push credentials and branch divergence are resolved.
- Known issues: desktop compact bouquet progress secondary text still truncates in the top bar during ceremony, but it does not overlap or introduce another action. Public live remains stale until `main` can be pushed and deployed from this environment.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, protected-source references, and copied Diablo/Blizzard expression. No findings in added lines; changed-file hits were expected local Playwright URLs, expected `localStorage.setItem` test/state writes, and pre-existing words such as `token`/`segment`. No assets, third-party art, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied protected expression were added.

## 2026-07-15 milestone 7 QA scaffold isolation

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: the old visible `Complete Bouquet` and `Shape Bloom` prototype buttons are gone from the controls row and no longer receive render/update/event work. Keyboard review shortcuts `N`, `M`, and `B` are now isolated behind explicit local QA mode (`bloomReview=1` on localhost/file origins), while the normal player route keeps review hooks disabled and exposes no QA shortcut buttons. Historical Round 4-57 preview/render markers remain absent from the playable source; prior saves beyond Round 3 still migrate to the polished replay state.
- Runtime metrics after the pass on the normal non-QA route: desktop `1280x720` and exact mobile `390x844` both loaded 625 DOM nodes, 88 images, 64 tiles, 0 dormant preview nodes, all 8 board rows visible, no QA buttons, and `window.__bloomReviewHooksEnabled === false`. Desktop reported 50 filtered / 93 shadowed / 3 animated elements; exact mobile reported 51 filtered / 96 shadowed / 3 animated elements; reduced motion reported 49 filtered / 94 shadowed / 3 animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: normal-route screenshot probes captured and inspected `work/no-qa-active-desktop.png` and `work/no-qa-active-mobile390.png`; both had 64 tiles, all 8 rows visible, no horizontal overflow, no visible broken images, no console/page errors, no QA buttons, and review hooks disabled. The passing suite covered desktop and exact mobile, touch/click guided swaps, keyboard swap/focus, tutorial skip/replay, Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, local-QA Supreme Bloom review hook, 64-tile integrity, no failed requests, and no overflow.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 visible broken images, and no horizontal overflow in the full suite and supplemental screenshot probe.
- Commit/push/live status: committed locally as `Isolate focused slice QA scaffolding`; `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`. Public GitHub Pages and Vercel remain stale relative to the local focused-slice checkpoints until push credentials are available.
- Known issues: public live is stale because this environment cannot authenticate to GitHub. QA review functions still exist for local test coverage, but normal player loads cannot trigger them without explicit local `bloomReview=1`.
- How to trigger and verify L/T/cross matches without console: on a local QA URL such as `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?bloomReview=1`, focus the playable and press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. Normal player URLs leave this shortcut disabled; the shape rewards still exist through real L/T/cross matches.
- How to trigger and verify Supreme Bloom without console: on a local QA URL with `bloomReview=1`, focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge. Normal player URLs leave this shortcut disabled, preserving Supreme Bloom rarity.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env` material, provider token prefixes, JWT-like strings, credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler/cron additions, and protected-source references. No findings. No assets, third-party art, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, dependencies, or copied Diablo expression were added.

## 2026-07-15 desktop first-viewport board fit

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_runtime_performance.spec.js`, and this note.
- Player-visible result: desktop active Round 1 at `1280x720` now shows the complete 8x8 board plus the single `Help` action inside the first viewport. The short-height desktop focused layout tightens title/objective/progress/tutorial spacing and caps the board at `calc(100vh - 240px)`; exact `390x844` mobile sizing was unchanged.
- Browser metrics after the pass: desktop fresh active play stayed at 629 DOM nodes, 88 images, 64 tiles, 0 dormant previews, 3 animated elements, 50 filtered elements, 95 shadowed elements, no overflow, exactly two visible progress bars, and now 8 complete visible board rows. Exact `390x844` mobile stayed at 629 DOM nodes, 88 images, 64 tiles, all 8 rows visible, 0 dormant previews, 3 animated elements, 51 filtered elements, 98 shadowed elements, no overflow, and exactly two visible progress bars. Reduced motion kept 64 tiles, 8 visible rows, 49 filtered elements, 96 shadowed elements, and 3 animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: targeted Chromium probes captured and inspected `work/current-desktop-fit-final.png` and `work/current-mobile-390x844.png`. The desktop board rect improved from `top=227,bottom=761,completeRows=7` to `top=187,bottom=667,completeRows=8`, with `Help` fully visible at `bottom=711`; mobile remained `top=191,bottom=569,completeRows=8`. The passing suite covered desktop and exact mobile, tutorial skip/replay, keyboard focus/swap, touch/click first-three-order journey, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, Supreme Bloom review hook, 64-tile integrity, no broken images, no console/page/request failures, and no horizontal overflow.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite and supplemental probes.
- Commit/push/live status: local verification complete before commit. Public GitHub Pages and Vercel remain stale relative to local focused-slice checkpoints until push credentials are available.
- Known issues: no new player-facing issue found locally. Prototype review hooks remain available for QA coverage but are not active first-screen product surfaces.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env` material, provider token prefixes, JWT-like strings, suspicious credential assignments, external URLs, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, machine-local paths, protected-source copy risks, dependencies, and scheduler hooks. No findings. No assets, third-party art, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, private-key material, or copied Diablo expression were added.

## 2026-07-15 mobile tutorial replay hierarchy fix

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Player-visible result: exact 390x844 tutorial replay no longer shows `SKIP`, `HELP`, and `Shuffle (-1 move)` together after the first Round 1 swap. While the tutorial pill is open, the standalone `Help` button is hidden; fresh/replayed tutorial shows only `Skip`, and post-swap replay shows `Skip` plus the contextual `Shuffle (-1 move)`. The tutorial pill stayed fully inside the mobile viewport at `top=154`, `bottom=190`.
- Browser metrics after the pass: desktop stayed at 629 DOM nodes, 88 images, 64 tiles, 0 dormant previews, 3 animated elements, 50 filtered elements, 95 shadowed elements, no overflow, and exactly two visible bars. Exact 390x844 mobile stayed at 629 DOM nodes, 88 images, 64 tiles, all 8 rows visible, 0 dormant previews, 3 animated elements, 51 filtered elements, 98 shadowed elements, no overflow, and exactly two visible bars. Reduced motion kept 64 tiles, all 8 mobile rows, 49 filtered elements, 96 shadowed elements, and 3 animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `node --check` passed for all four Playwright specs; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: a direct exact 390x844 probe reproduced the pre-fix three-button state, then confirmed the fixed button lists: fresh auto `["Skip"]`, fresh Help replay `["Skip"]`, post-swap open `["Skip","Shuffle (-1 move)"]`, and post-swap Help replay `["Skip","Shuffle (-1 move)"]`. Visually inspected `work/mobile-tutorial-replay-fixed.png` and `work/pass3-desktop-round1-hit.png`. The passing suite covered desktop and exact mobile, tutorial skip/replay, keyboard focus/swap, touch/click first-three-order journey, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, Supreme Bloom review hook, 64-tile integrity, no broken images, no console/page/request failures, and no horizontal overflow.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite and supplemental probe.
- Commit/push/live status: committed locally as `Fix mobile tutorial replay hierarchy`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`; local `main` is ahead of `origin/main` by 2 commits. Read-only GitHub Pages returned `200` and 469,510 bytes but does not contain the new `body.tutorial-active .tutorial-help` rule. Read-only Vercel returned `200` and 508,433 bytes, does not contain the new tutorial rule, and still contains older retired markers such as `flowerpediaLedger`, `rewardChoiceState`, or `vial-meter`.
- Known issues: public live is stale relative to local focused-slice checkpoints until push credentials are restored. Prototype review hooks still exist for QA coverage but are not active first-screen product surfaces.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, provider token prefixes, JWT-shaped strings, credential assignments, external URLs, machine-local paths, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, scheduler hooks, and protected-source copy risks. No findings in added code; the only broad changed-file hit was an existing local `streakRewardToken` variable name. This pass added no assets, third-party art, copied Diablo expression, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, `.env`, credentials, private-key material, or broad repo access.

## 2026-07-15 milestone 6 ceremony action cleanup

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, and this note.
- Player-visible result: focused payoff ceremonies no longer keep the tutorial pill, `Skip`, or `Help` visible above the greenhouse restoration card. The restoration lesson now rides on the existing coin transaction plus a restrained glow on the single primary action, so mobile payoff screens show one bouquet trophy, one greenhouse before/after, concise coins, and one dominant button.
- Browser metrics after the pass: fresh desktop stayed at 629 DOM nodes, 88 images, 64 tiles, 0 dormant previews, 3 animated elements, 50 filtered elements, 95 shadowed elements, no overflow, and exactly two visible bars. Exact 390x844 mobile stayed at 629 DOM nodes, 88 images, 64 tiles, all 8 rows visible, 0 dormant previews, 3 animated elements, 51 filtered elements, 98 shadowed elements, no overflow, and exactly two visible bars. Reduced motion kept 64 tiles, all 8 mobile rows, 49 filtered elements, 96 shadowed elements, and 3 animated elements.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `node --check scripts/verify_tutorial_progress.spec.js` and `node --check scripts/verify_payoff_ceremony_contract.spec.js` passed; `git diff --check` passed; full local Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: visually inspected the updated exact 390x844 Round 1 ceremony screenshot at `work/pass2-mobile390-round1-pending.png`; the tutorial controls are gone and only `Restore Greenhouse · 100 coins` remains visible. The passing suite covered desktop and exact mobile, tutorial skip/replay, keyboard focus/swap, Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, Supreme Bloom review hook, 64-tile integrity, no broken images, no console/page/request failures, and no horizontal overflow.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite.
- Commit/push/live status: committed locally as `Polish focused payoff ceremony actions`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`; local `main` is ahead of `origin/main` by 1 commit. GitHub Pages returned `200` and 469,510 bytes but does not contain the new `focused-payoff-active` marker. Vercel returned `200` and 508,433 bytes and still contains old `greenhouse-card`, `vial-meter`, `flowerpediaLedger`, and `rewardChoiceState` markers, so Vercel is stale.
- Known issues: prototype review hooks still exist for QA coverage but are not active first-screen product surfaces. Public live remains stale for this local checkpoint until push credentials are available.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, environment-file references, provider token prefixes, suspicious token assignments, tracking/measurement SDKs, network/backend/account/payment/ad hooks, broad permissions, copied protected-game references, and external asset URLs. No findings. No assets, dependencies, third-party art, SDKs, tracking code, backend, accounts, payments, ads, permissions, credentials, or private-key material were added.
## 2026-07-15 saved payoff hierarchy continuity

- Selected weakness: reloading completed Round 1 discarded the active payoff guidance and focus, exposing Help beside Restore or Next Order. This broke the one-action first-minute hierarchy precisely when a returning player needed the saved next step.
- Player-visible result: an unskipped completed Round 1 now restores its existing tutorial payoff state from the saved completion flags. Reload before restoration shows `Coins restore the greenhouse.` with only the focused `Restore Greenhouse · 100 coins`; reload after restoration shows `Tap Next Order.` with only the focused `Next Order → Moonlit Wreath`. Next Order still opens the authored Round 2 Cursed Thorn lesson with 64 tiles, 14 moves, one roving tab stop, and the `Crack the marked thorns` cue.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Browser verification: focused tutorial/reload coverage passed 3/3, then the full local Chromium suite passed 10/10 on desktop 1280x720 and exact mobile 390x844. Coverage includes both Round 1 payoff reload boundaries, natural four-swap completion, keyboard focus, tutorial skip/replay, Round 1 -> 2 -> 3, retry, save/reload ceremonies, reduced motion, 64-tile integrity, all eight mobile rows, no broken images, no console/page/request errors, and no horizontal overflow.
- Security scope: no assets, dependencies, external services, trackers, analytics, accounts, backend hooks, credentials, broad permissions, or protected third-party expression were added. Changed-code secret, tracker, and network-call scans remain part of the commit gate.

## 2026-07-15 first bouquet dominant payoff

- Selected weakness: following the Round 1 tutorial through bouquet completion left Skip beside Restore, then beside Next Order. The taught Black Candle row could also clear only four of six required Bone Stars, making the authored fourth swap inconsistently stop at `Bouquet 12/14`.
- Player-visible result: the natural guided route now deterministically completes Thorn Rose 8/8 and Bone Star 6/6 on the fourth taught swap. At `Bouquet 14/14`, `Coins restore the greenhouse.` remains visible while `Restore Greenhouse · 100 coins` is the only non-tile action. After restoration, `Tap Next Order.` remains visible while `Next Order → Moonlit Wreath` is the only action. Focus stays on each payoff action, and Round 2 starts with its authored goals, 14 moves, 64 tiles, and one roving board tab stop.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Browser verification: the natural four-swap exact-mobile route passed three consecutive fresh runs, then the complete local Chromium suite passed 10/10 on desktop 1280x720 and mobile 390x844. Coverage includes tutorial skip/replay, the natural Black Candle lesson, payoff focus, Round 1 -> 2 -> 3, retry, save/reload ceremonies, reduced motion, 64-tile integrity, all eight mobile rows, no broken images, no console/page/request errors, and no horizontal overflow.
- Security scope: no assets, dependencies, external services, trackers, analytics, accounts, backend hooks, credentials, broad permissions, or protected third-party expression were added. Changed-code secret, tracker, and network-call scans remain part of the commit gate.

## 2026-07-15 mobile tutorial replay hierarchy

- Selected weakness: on exact 390x844 mobile, replaying Help after the first valid swap could leave the tutorial panel partly above the viewport while Skip, Help, and Shuffle were all visible. This was the highest-impact remaining first-minute issue because the teaching prompt and board compete directly for attention at the moment the player asks for guidance.
- Player-visible result: Help now scrolls a replayed tutorial panel fully into view, and Help hides while the tutorial is open. Before the opening swap the only non-tile control is Skip; after the first swap the controls are exactly Skip and Shuffle. Keyboard behavior, tutorial focus handoffs, authored opening swap, Black Candle Vine lesson, and the Round 1 -> 2 -> 3 journey are unchanged.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Verification: the focused tutorial regression passed 2/2 and the full local Chromium suite passed 9/9 across `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_runtime_performance.spec.js`. Desktop and exact 390x844 mobile retained 64 tiles, all eight mobile rows, no broken images, no console/page/request errors, and no horizontal overflow.
- Security scope: no assets, dependencies, external services, trackers, analytics, accounts, backend hooks, credentials, permissions, or protected third-party expression were added. Changed-line secret and tracker scans are part of the commit gate.

## 2026-07-15 milestone 4 meaningful progress UI cleanup

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Player-visible result: active play now has only the two meaningful progress surfaces Xerxes asked for: `Bouquet N/M -> +coins` and the Greenhouse restoration dial naming the next visible unlock. The old Greenhouse Level/XP side card, SAP vial markup/styles, hidden tycoon XP renderer, serialized greenhouse/apothecary/faction XP tracks, XP reward copy, and rune `Greenhouse +90 XP` message were removed. Round plans now expose only the reward values the player sees: coins, item, and reward flower.
- Browser metrics after the pass: desktop fresh active play is 629 DOM nodes, 88 images, 64 tiles, 0 dormant previews, 3 animated elements, 50 filtered elements, 95 shadowed elements, 0 broken images, no overflow, and exactly two visible bars. Exact 390x844 mobile is 629 DOM nodes, 88 images, 64 tiles, all 8 rows visible, 0 dormant previews, 3 animated elements, 51 filtered elements, 98 shadowed elements, 0 broken images, no overflow, and exactly two visible bars. Reduced motion kept 64 tiles, all 8 mobile rows, 49 filtered elements, 96 shadowed elements, 3 animated elements, and exactly two visible bars.
- Verification commands/results: `python3 scripts/verify_html_match_shapes.py` passed; `python3 scripts/verify_project.py` passed; `git diff --check` passed; `node --check scripts/verify_runtime_performance.spec.js` and `node --check scripts/verify_tutorial_progress.spec.js` passed; full Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: fresh desktop and exact 390x844 screenshots were captured and visually inspected at `work/progress-post-desktop.png` and `work/progress-post-mobile390.png`. Tutorial skip/replay, keyboard focus/swap, touch/click first-three-order journey, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, Supreme Bloom review hook, 64-tile integrity, no console/page/request failures, no broken images, and no horizontal overflow were covered by the passing Chromium suite and supplemental screenshot probe.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite and screenshot probe. Visible text checks now fail if SAP/MANA/BLOOD, XP fraction text, `Greenhouse +N XP`, or `Apothecary +N XP` returns to the focused runtime.
- Commit/push/live status: committed locally as `Remove duplicate focused progress UI`; `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`. Read-only GitHub Pages returned `200` and 476,827 bytes but still contains `greenhouse-card`, `vial-meter`, `data-vial="SAP"`, and `MAX_BOARD_PARTICLES = 56`; read-only Vercel returned `200` and 508,433 bytes and still contains those older SAP/Flowerpedia/reward-choice markers. Public live remains stale until push credentials are available and deployment updates.
- Known issues: public GitHub Pages and Vercel are stale for this and the recent local milestones. Prototype booster/Sacrifice/review hooks still exist for QA coverage but are not active first-screen product surfaces.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWTs, suspicious secret assignments, trackers/analytics SDKs, network calls, backend/account/payment/ad hooks, broad permissions, machine-local paths, dependencies, copied Diablo/Blizzard references, and external asset URLs. No findings in added lines; broad changed-file hits were existing `segment` identifiers and local Playwright fallback URLs. No assets, third-party art, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, or private-key material were added.

## 2026-07-15 milestone 2 compositor and cascade latency pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_runtime_performance.spec.js`, and this note.
- Player-visible result: active board play keeps the approved board-first gothic inventory look, but the 64-tile screen is lighter during swaps and cascades. Base active tiles now rely on carved gradients/borders instead of per-tile box-shadows, hidden fallback glyphs no longer carry filter work, match waves emit fewer sampled coin/resource/greenhouse flights, Supreme Bloom review effects are capped harder, and cascade wait windows are shorter.
- Browser metrics after the pass: desktop stayed at 638 DOM nodes, 89 images, 64 tiles, 0 dormant previews, 3 animated elements, 0 broken images, and no overflow while filtered elements dropped from 132 to 50 and shadowed elements from 162 to 100. Exact 390x844 mobile stayed at 638 DOM nodes, 89 images, 64 tiles, 8 complete rows, 0 dormant previews, 3 animated elements, 0 broken images, and no overflow while filtered elements dropped from 133 to 51 and shadowed elements from 165 to 103. Reduced motion reported 49 filtered elements, 101 shadowed elements, 64 tiles, and 8 complete rows.
- Latency probe on local Chromium: first guided swap control return was about 1080ms desktop and 774ms mobile; Cursed Thorn hit feedback appeared in 595ms desktop and 412ms mobile; Cursed Thorn control return was 1024ms desktop and 847ms mobile; Retry Bouquet restored the active board in 90ms desktop and 76ms mobile. Ceremony paint via the review completion path was 45ms desktop and 146ms mobile. The mobile touch probe advanced to `Bouquet 3/14 -> +120 coins`.
- Verification commands/results: `python3 scripts/verify_html_match_shapes.py` passed; `python3 scripts/verify_project.py` passed; `git diff --check` passed; full Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`. The runtime performance contract now caps the focused slice at <=80 filtered elements and <=125 shadowed elements.
- Additional QA: desktop and exact 390x844 screenshots were visually inspected after the tile-shadow simplification: `work/pass3-desktop-round1-hit.png`, `work/pass3-mobile390-round1-hit.png`, and `work/pass2-mobile390-round3-raised.png`. The board remains readable, all eight mobile rows remain visible, tutorial skip/replay, keyboard focus, touch/tap progress, Round 1 -> 2 -> 3, fail/retry, save/reload ceremonies, reduced motion, Supreme Bloom review hook, 64-tile integrity, and no horizontal overflow were covered by the passing suite and supplemental probe.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite and supplemental latency probe.
- Commit/push/live status: committed locally as `Reduce focused cascade compositor cost`, then `git push origin main` failed with `Permission denied (publickey)` and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`; local `main` is ahead of `origin/main` by 1 commit. Read-only GitHub Pages check returned `200` and 476,827 bytes but still serves `MAX_BOARD_PARTICLES = 56`, so Pages is stale for this milestone. Read-only Vercel check returned `200` and 508,433 bytes and still contains `flowerpediaLedger`, `Chapter 1: Midnight Conservatory`, `rewardChoiceState`, and `MAX_BOARD_PARTICLES = 56`, so Vercel is older than the scaffold-removal and performance milestones.
- Known issues: no new player-facing issue found locally. Prototype review hooks remain available for QA coverage but are not the active product surface.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWTs, suspicious secret assignments, trackers/analytics SDKs, network calls, backend/account/payment/ad hooks, broad permissions, machine-local paths, dependencies, copied Diablo/Blizzard references, and external asset URLs. No findings in added code; no assets, third-party art, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, or private-key material were added.

## 2026-07-15 milestone 7 scaffold isolation pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Player-visible result: the focused three-order game no longer carries the old Flowerpedia, Chapter Progress, or post-bouquet reward-choice scaffolding in the runtime source or Chest modal. Active play still opens on the approved board-first layout with one bouquet bar, one Greenhouse restoration bar, the same six-flower art, tutorial spotlight, Cursed Thorn lesson, unified greenhouse ceremonies, Chest storage, replay, and keyboard/touch controls. Old saves that contain removed collection/reward fields are tolerated by ignoring those keys while preserving board, coins, round, greenhouse, booster, and chest state.
- Runtime/source simplification: removed 981 net lines from the playable/verifier path, including dormant collection/chapter CSS, DOM, render functions, reward-choice state, reward-choice handlers, completion-copy branches, and old save serialization. The HTML verifier now treats those surfaces as forbidden regressions instead of required audit-era hooks.
- Browser metrics after the pass: desktop runtime is 638 DOM nodes, 89 images, 132 filtered elements, 162 shadowed elements, 3 animated elements, 64 tiles, 0 dormant previews, one bouquet bar plus one Greenhouse bar, 0 broken images, and no overflow. Exact 390x844 mobile is 638 DOM nodes, 89 images, 133 filtered elements, 165 shadowed elements, 3 animated elements, 64 tiles, 8 complete rows, 0 dormant previews, one bouquet bar plus one Greenhouse bar, 0 broken images, and no overflow. Reduced motion kept 64 tiles, 8 complete rows, 3 animated elements, 0 broken images, and no overflow.
- Verification commands/results: `python3 scripts/verify_html_match_shapes.py` passed; `python3 scripts/verify_project.py` passed; inline playable JavaScript parse with `new Function` passed; `node --check` passed for the changed Playwright spec; `git diff --check` passed; full Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional QA: supplemental Chromium fresh desktop and exact 390x844 mobile screenshots reported 64 tiles, no broken images, no overflow, no console errors, and no visible `Flowerpedia`, `Chapter Progress`, or `Choose Your Reward` text. Screenshot evidence inspected: `work/scaffold-cut-desktop.png`, `work/scaffold-cut-mobile390.png`, plus refreshed Pass 3 and ceremony screenshots from the passing suite. Visual judgment: board-first hierarchy and exact mobile eight-row composition are intact after the scaffold removal.
- Coverage: desktop and exact 390x844 mobile, tutorial skip/replay, keyboard guided swap/focus handoff, touch/click journey coverage from the suite, Round 1 -> 2 -> 3, Cursed Thorn fail/retry, save/reload ceremonies, reduced motion, Supreme Bloom review hook, 64-tile integrity, no console/page/request failures, no horizontal overflow, and meaningful progress bars only.
- Live status: post-commit read-only checks of GitHub Pages and Vercel both returned 508,433-byte stale HTML that still contains `flowerpediaLedger`, `Chapter 1: Midnight Conservatory`, and `rewardChoiceState`; the scaffold removal is local-only until push credentials are available.
- Known issues: prototype review hooks and hidden later-system booster/Sacrifice code still exist for QA coverage; they are not the next product surface. Push credentials are unavailable in this shell, so public live status remains stale for this milestone.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and added lines were scanned for private-key headers, `.env`, provider token prefixes, JWTs, suspicious secret assignments, trackers/analytics SDKs, network calls, backend/account/payment/ad hooks, broad permissions, machine-local paths, dependencies, copied Diablo/Blizzard references, and external asset URLs. No findings in added code; the only path-style hit was the pre-existing local Playwright fallback URL. No assets, third-party art, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, or private-key material were added.

## 2026-07-15 milestone 6 keyboard/replay focus polish

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Player-visible result: active board play now has a clear keyboard path without changing the approved board-first layout. The board is exposed as an 8x8 grid with one roving focus tile; Enter/Space selects the focused flower, arrow keys move focus, and pressing an arrow after selection swaps toward that neighbor. Bouquet payoff states now move focus to the one dominant action (`Restore Greenhouse`, `Next Order`, `Upgrade Greenhouse`, `Raise Conservatory`, or `Play Again`) and return focus to the next useful board tile on retry/next-order/replay. Touch/click/swipe behavior, saves, objectives, targets, ceremonies, assets, sound hooks, and progression are preserved.
- Browser metrics after the pass: desktop runtime stayed at 686 DOM nodes, 89 images, 132 filtered elements, 169 shadowed elements, 3 animated elements, 64 tiles, 0 dormant previews, one bouquet bar plus one greenhouse bar, 0 broken images, 0 overflow, and no console/page errors. Exact 390x844 mobile stayed at 686 DOM nodes, 89 images, 133 filtered elements, 172 shadowed elements, 3 animated elements, 64 tiles, 8 complete rows, 0 dormant previews, one bouquet bar plus one greenhouse bar, 0 broken images, 0 overflow, and no console/page errors. Reduced motion stayed at 64 tiles, 8 complete rows, 3 animated elements, 0 broken images, and no overflow.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `node --check scripts/verify_tutorial_progress.spec.js` passed; `git diff --check` passed; full Playwright Chromium suite passed 9/9 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional interaction QA: the new keyboard regression passed three consecutive isolated runs; it verifies one `tabindex=0` tile, Enter selection, arrow-key swap, focus on `Restore Greenhouse`, focus on `Next Order`, and focus returning to the Round 2 board. Supplemental Chromium probing verified desktop board `role="grid"`, one focusable tile, Supreme Bloom via focused `b` returning to 64 tiles, exact 390x844 pointer-swipe progress to `Bouquet 3/14`, 8 complete mobile rows, no broken images, no overflow, and no console/page/request failures.
- Screenshot evidence inspected: `work/milestone6-desktop-keyboard-focus.png`, `work/milestone6-mobile390-fresh.png`, and `work/milestone6-mobile390-after-swipe-settled.png`. Visual judgment: desktop and exact mobile preserve the approved dark board-first hierarchy; the focus ring is readable but restrained; exact mobile keeps all eight rows visible; the settled swipe state has 0 selected tiles, 64 tiles, and no overflow.
- Coverage: desktop and exact 390x844 mobile, first three orders, save/reload ceremonies, tutorial skip/replay, touch/click guided swaps, pointer swipe, keyboard tile selection/swap/focus handoff, failed Round 2 retry, Supreme Bloom review hook, reduced motion, 64-tile integrity, no broken images, no console/page/request failures, no horizontal overflow, and meaningful progress bars only.
- Known issues: no new player-facing issue found locally. After the first move on exact mobile, existing active-play controls can show `Skip`, `Help`, and `Shuffle (-1 move)` during tutorial; this predates the keyboard polish and remains within the accepted focused slice behavior.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the rare `SUPREME BLOOM!` review hook appears and returns to 64 tiles after the charge.
- Commit/push/live status: committed locally as `Polish focused keyboard replay flow`. `git push origin main` failed with `Permission denied (publickey)`, and HTTPS push failed with `could not read Username for 'https://github.com': No such device or address`; local `main` is ahead of `origin/main` by 1 commit. GitHub Pages read-only check returned `200` and 502,049 bytes for the milestone cache-bust URL, but it did not contain the new keyboard-flow markers, so public Pages is stale for this milestone.
- Security/IP scan status: changed files were scanned before commit; the only broad-pattern hit was this self-descriptive build-note text, and the actual code/test diff had no findings. This pass added no assets, third-party art, copied Diablo expression, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, `.env`, credentials, private-key material, or broad repo access.

## 2026-07-15 first-three-order tuning pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and this note.
- Player-visible result: the focused first-three-order journey is less throwaway and smoother. Round 1 now uses the reference-scale First Bouquet targets (`Thorn Rose 0/8`, `Bone Star 0/6`) while preserving the 12-move tutorial; Round 2 is tightened to 14 moves with 29 total bouquet/thorn progress; Round 3 is tightened to 12 moves with 27 Bloodroot/Sol Rot progress. Round 2/3 target weighting was reduced so cascades do not auto-finish the later orders as often, and fresh Round 1 boards now reject any one-move full-bouquet opening.
- Cascade/input pacing: later cascade waits were shortened from the prior 190ms + up-to-430ms settle curve to a 185ms-descending + up-to-360ms settle curve. The player-visible effect remains the same but long cascade chains return control faster.
- Real-play tuning evidence: before tuning, six optimal real-play journeys completed Round 1 in 1-2 moves, Round 2 in 3-5 moves with 12-14 moves left, and Round 3 in 1-2 moves. After tuning and the Round 1 seed guard, eight optimal Round 1 starts completed in 2-4 moves with no one-move seal; three full tuned journeys completed Round 1 in 2-3 moves, Round 2 in 4-7 moves, and Round 3 in 4-5 moves in the final target sample, preserving 64 tiles, no broken images, no overflow, and no console/page errors.
- Browser metrics after the pass: desktop runtime stayed at 686 DOM nodes, 89 images, 132 filtered elements, 169 shadowed elements, 3 animated elements, 64 tiles, 0 dormant previews, one bouquet bar plus one greenhouse bar, 0 broken images, 0 overflow, and no console/page errors. Exact 390x844 mobile stayed at 686 DOM nodes, 89 images, 133 filtered elements, 172 shadowed elements, 3 animated elements, 64 tiles, 8 complete rows, 0 dormant previews, one bouquet bar plus one greenhouse bar, 0 broken images, 0 overflow, and no console/page errors. Reduced motion stayed at 64 tiles, 8 complete rows, 3 animated elements, 0 broken images, and no overflow.
- Verification commands/results: `python3 scripts/verify_project.py` passed; inline JavaScript parse with `new Function` passed; `git diff --check` passed; full Playwright Chromium suite passed 8/8 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Additional interaction QA: exact 390x844 mobile pointer-swipe dispatch advanced the first bouquet to 3/14 with 64 tiles and 8 complete rows; touchscreen tap plus focused `B` verified the Supreme Bloom review hook returned to 64 tiles. Tutorial skip/replay, failed Round 2 retry, save/reload ceremonies, reduced motion, desktop, and exact mobile were covered by the passing suite.
- Screenshot evidence inspected: `work/pass3-desktop-round1-hit.png`, `work/pass3-mobile390-round1-hit.png`, `work/pass3-mobile390-round3-pending.png`, and `work/pass2-mobile390-round3-raised.png`. Visual judgment: desktop and exact mobile keep the board dominant; the 0/14 objective fits; only bouquet and greenhouse progress bars remain visible; Bloodroot ceremony still shows one bouquet trophy, one before/after greenhouse, concise coins, and one dominant action.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite, real-play sampler, and supplemental pointer/keyboard check.
- Commit/push/live status: committed locally, then `git push origin main` failed with `Permission denied (publickey)` and non-interactive HTTPS push failed with `could not read Username for 'https://github.com': terminal prompts disabled`. Public GitHub Pages remains stale until the local commit can be pushed.
- Known issues: Round 2/3 still intentionally leave spare moves under optimal play, but no longer collapse into one-move/near-one-move orders in the final sample. Push credentials are unavailable in this shell.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the board enters the rare `SUPREME BLOOM!` review hook and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and additions were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, suspicious credential assignments, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, network calls, machine-local paths, package/dependency additions, and scheduler/cron additions. No findings. No assets, third-party art, copied Diablo expression, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, credentials, or private-key material were added.

## 2026-07-15 tutorial spotlight and retry hardening

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: the minimal tutorial remains one compact, skippable prompt, but its replay path now visibly spotlights the currently taught interaction: glowing swap pair, Black Candle follow-up, Round 2 Cursed Thorn targets, and failed-bouquet Retry. The failed-state log was reduced from an audit-era paragraph to `Retry Bouquet resets Round N. Coins and greenhouse progress stay saved.` so moves/retry is taught by the prompt plus highlighted action instead of explanatory scaffolding.
- Tutorial coverage: fresh 390x844 mobile shows `Swap the glowing flowers.` within 3 seconds, one Skip tap hides it and persists across reload, Help replays it, the guided swap advances to `Match 3 fills the bouquet.` or `Match 4 makes Black Candle Vine.`, bouquet completion teaches `Coins restore the greenhouse.`, Round 2 Help teaches `Match beside thorns.`, a failed Round 2 replay teaches `Moves ended. Retry the bouquet.`, and Retry returns to the Cursed Thorn spotlight with 64 tiles.
- Browser metrics after the pass: desktop runtime stayed at 686 DOM nodes, 89 images, 132 filtered elements, 169 shadowed elements, 3 animated elements, 64 tiles, 0 dormant previews, 0 broken images, 0 overflow, and no console/page errors. Exact 390x844 mobile stayed at 686 DOM nodes, 89 images, 133 filtered elements, 172 shadowed elements, 3 animated elements, 64 tiles, 8 complete rows, 0 dormant previews, 0 broken images, 0 overflow, and no console/page errors. Reduced motion stayed at 64 tiles, 8 complete rows, 3 animated elements, 0 broken images, and no overflow.
- Screenshot evidence inspected: `work/codex-session-20260715/mobile-tutorial-spotlight.png` and `work/codex-session-20260715/mobile-tutorial-retry-final.png`. Visual judgment: exact mobile keeps all eight rows visible; the retry screen shows one tutorial pill, highlighted Cursed Thorn blockers, one greenhouse progress bar, one bouquet progress bar, and one dominant `Retry Bouquet` action without broken images or text overflow.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; full Playwright Chromium suite passed 8/8 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Coverage: desktop and exact 390x844 mobile, first three orders, save/reload ceremonies, tutorial skip/replay, touch/click guided swaps, Black Candle Vine cue, Cursed Thorn spotlight/retry, fail/retry, Supreme Bloom review hook, reduced motion, 64-tile integrity, no broken images, no console/page/request failures, no horizontal overflow, and meaningful progress bars only.
- Browser console/runtime status: local Chromium observed 0 console errors, 0 page errors, 0 failed requests, 0 broken images, and no horizontal overflow in the full suite and the extra tutorial screenshot pass.
- Commit/push/live status: local commit `Harden focused tutorial retry flow` contains this pass on top of the prior unpushed runtime commit. `git push origin main` failed with `Permission denied (publickey)`, and one-off HTTPS push failed with `could not read Username for 'https://github.com': terminal prompts disabled`; the branch is therefore local `main` ahead of `origin/main` by two commits.
- GitHub Pages preview status: pre-commit read-only Pages check returned `200` and 499,205 bytes for `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?codex-preflight=da5251f`; the new tutorial spotlight strings were not present because the two local commits remain unpushed.
- Known issues: push credentials are unavailable in this shell. Pages should be treated as stale until `origin/main` accepts the local commits.
- How to trigger and verify L/T/cross matches without console: after Round 1, focus the playable and use the existing `Shape Bloom` path or press `M` until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the board enters the rare `SUPREME BLOOM!` review hook and returns to 64 tiles after the charge.
- Security/IP scan status: changed files and additions are scanned before commit. This pass added no assets, third-party art, copied Diablo expression, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, `.env`, credentials, private-key material, or broad repo access.

## 2026-07-15 delegated input and first-three-level cap

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and this note.
- Player-visible result: preserved the approved board-first layout and six reference-faithful raster flower set while tightening the runtime. Tile input is now delegated from the board container instead of reattaching pointer/click handlers to all 64 tile buttons on every render, and repeated whole-document image fallback scans were moved out of the hot render path. The visible first-session composition, tutorial copy, bouquet/greenhouse bars, ceremonies, controls, assets, saves, audio hooks, and first-three-level objectives remain unchanged.
- Source/product simplification: removed the unused `Saint's Night Ledger` and `Sub Rosa Grand Bouquet` round-template data from the active planner, added `FOCUSED_LEVEL_COUNT = 3`, capped `buildRoundPlan()` and next-order flow to the authored first three orders, and migrated old Round 4+ saves into a coherent completed Bloodroot replay state (`Bouquet 17/17 -> +180 coins`, `Play Again -> First Bouquet`) instead of silently cycling unsupported rounds.
- Performance/input probe: a Playwright listener probe observed `directTileListeners: 0` and exactly six board-level input/preview listeners (`click`, `focusin`, `pointercancel`, `pointerdown`, `pointerover`, `pointerup`) with 64 tiles. Real guided tap timing from click/touch through bouquet progress change was 850ms desktop and 466ms exact 390x844 mobile; these timings include the intentional swap/resolve animation, not just event dispatch. Legacy Round 6 save migration returned saved round 3, completed raised conservatory, 64 DOM tiles, 0 visible active tiles during ceremony, and no overflow.
- Browser metrics after the pass: desktop runtime stayed at 686 DOM nodes, 89 images, 132 filtered elements, 169 shadowed elements, 3 animated elements, 64 tiles, 0 dormant previews, 0 broken images, 0 overflow, and no console/page errors. Exact 390x844 mobile stayed at 686 DOM nodes, 89 images, 133 filtered elements, 172 shadowed elements, 3 animated elements, 64 tiles, 8 complete rows, 0 dormant previews, 0 broken images, 0 overflow, and no console/page errors. Reduced-motion stayed at 64 tiles, 8 complete rows, 3 animated elements, 0 broken images, and no overflow.
- Screenshot evidence inspected: `work/codex-session-20260715/desktop-fresh.png` and `work/codex-session-20260715/mobile390-fresh.png`. Desktop visual hierarchy is unchanged; exact mobile shows all eight board rows, one cue, the Help button below the greenhouse plinth, and readable Sol Rot/Bone Star/Nightshade/Bloodroot/Amber Seed/Thorn Rose silhouettes.
- Verification commands/results: `python3 scripts/verify_project.py` passed; inline JavaScript parse with `new Function` passed; `git diff --check` passed; full Playwright Chromium suite passed 8/8 against `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html`: `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js`.
- Coverage: desktop and exact 390x844 mobile, first three orders, save/reload ceremonies, tutorial skip/replay, touch taps, Cursed Thorn, Black Candle Vine, Supreme Bloom review hook, reduced motion, 64-tile integrity, no broken images, no console/page/request failures, no horizontal overflow, and legacy Round 4+ save migration.
- Commit/push/live status: the local commit `Improve focused slice input runtime` contains this pass. GitHub Pages preflight before editing returned 200 and 499,205 bytes for `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?codex-preflight=6815a61`. Push to `origin/main` failed over SSH with `Permission denied (publickey)`; no repo-local SSH command or deploy wrapper was configured, so GitHub Pages is not current for this local commit.
- Security/IP scan status: changed-file scans are run before commit. This pass added no assets, third-party art, copied Diablo expression, dependencies, SDKs, trackers, analytics, backend, accounts, payments, ads, permissions, `.env`, credentials, or private-key material.

## 2026-07-15 reference-faithful six-flower refinement

- Files changed: `assets/tiles/96/*.png`, `assets/tiles/48/*.png`, `playable/midnight_bloom_prototype.html`, and this note.
- Concept-sheet judgment: both visual inputs were inspected. The original UI reference remains the material target; the 2x3 concept sheet is coherent, repo-local, byte-identical to `assets/tiles/generated/diablo_gothic_botanical_spritesheet.png`, and safely crop-able in row-major identity order: Sol Rot, Bone Star, Nightshade, Bloodroot, Amber Seed, Thorn Rose.
- Player-visible art pass: reprocessed all six flower faces from the existing concept sheet with larger optical scale, stronger candlelit contrast, deterministic imperfect raster grain, crushed lower-right shadows, oxidized edges, transparent matte cleanup, and no labels/gutters/black rectangles. The tile sockets were quieted only by reducing existing glow/filter intensity and increasing the raster image box from 93% to 95%; no layout, copy, tutorial logic, economy, backend, analytics, permissions, saves, or progression behavior changed.
- Asset metrics: all 12 production PNGs are transparent RGBA with `edgeAlpha=0` at exact 96x96 or 48x48. 96px sizes/alpha bounds are Sol Rot 15,633 bytes 87x90, Bone Star 10,589 bytes 89x91, Nightshade 15,650 bytes 81x92, Bloodroot 11,793 bytes 75x93, Amber Seed 18,697 bytes 83x93, Thorn Rose 16,848 bytes 91x85. 48px sizes/alpha bounds are Sol Rot 4,420 bytes 43x44, Bone Star 3,220 bytes 43x44, Nightshade 4,404 bytes 40x45, Bloodroot 3,365 bytes 38x46, Amber Seed 5,330 bytes 42x46, Thorn Rose 4,767 bytes 45x42. The foreman independently removed the final 25 nontransparent outer-edge pixels from Nightshade/Bloodroot after the strict RGBA family validator caught them, then reran the full gate.
- Screenshot evidence inspected: `work/art-pass-six-flower/six-flowers-before-after-96.png`, `work/art-pass-six-flower/six-flowers-grayscale-96.png`, `work/art-pass-six-flower/six-flowers-silhouette-96.png`, `work/art-pass-six-flower/desktop-fixed-before-after-browser.png`, `work/art-pass-six-flower/mobile390-fixed-before-after-browser.png`, `work/art-pass-six-flower/desktop-after-browser.png`, and `work/art-pass-six-flower/mobile390-after-browser.png`. Visual judgment: all six are distinguishable at exact 390x844 mobile in under one second; silhouette-only sheet remains distinguishable by sun disk/rays, star spikes, petaled bloom, vertical shard, oval seed cage, and rose bloom. Remaining art defect: Amber Seed and Thorn Rose have the closest filled-mask overlap numerically, but they remain visually distinct by outer contour, internal structure, and value pattern.
- Browser metrics: before/after fixed-board checks at 1280x720 and exact 390x844 each retained 64 tiles, 0 overflow, 0 broken images, and no console/page errors. Exact mobile board remained 378x378 with bottom at 575px and all 8 rows visible. Fresh after checks had 64 tiles, no broken images, no overflow, and no console/page/request errors.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `git diff --check` passed; `BLOOM_TEST_URL=http://127.0.0.1:4240/playable/midnight_bloom_prototype.html NODE_PATH=/tmp/bloom-codex-tools/node_modules /tmp/bloom-codex-tools/node_modules/.bin/playwright test scripts/verify_tutorial_progress.spec.js scripts/verify_payoff_ceremony_contract.spec.js scripts/verify_pass3_feedback.spec.js scripts/verify_runtime_performance.spec.js --workers=1 --reporter=line` passed 8/8. Runtime metrics stayed at 686 nodes, 89 images, 64 tiles, 0 dormant previews, no broken images, no overflow; exact mobile and reduced-motion both kept 8 complete rows.
- Acceptance coverage: full first-three-order desktop and exact 390x844 mobile journeys, save/reload ceremonies, tutorial/progress, effects, Cursed Thorn damage/retry, Black Candle Vine cue and actual row clear, unified ceremonies, Supreme Bloom review hook, prefers-reduced-motion, 64-tile integrity, image dimensions/format/size, no overflow, and no browser console/page/network errors. Explicit Black Candle smoke recorded cue `Black Candle Vine! Row cleared.`, 2 line-relic particles, 1 impact particle, 3 resource pops, 64 tiles, 0 broken images, 0 overflow, and no errors in `work/art-pass-six-flower/black-candle-effect-smoke.json`.
- Commit/push/Pages status: a local commit named `Refine six flower relic art pass` was created after the complete passing set. Push to `origin/main` failed over SSH with `Permission denied (publickey)` and HTTPS push failed with terminal prompts disabled, so the branch remains local `main` ahead by 1. Read-only HTTPS confirmed remote `main` is still `e145fd4`. GitHub Pages is reachable but not current for this local commit: the latest public Pages workflow is `29408049386` for `e145fd4`, and live 96px flower assets return the previous byte sizes/hashes rather than local hashes.
- Security/IP scan: precise changed-file and added-line scans found no credential values, protected third-party source additions, new service wiring, broad access hooks, scheduler hooks, or dependency files. The only scan hits were self-descriptive build-note text such as `no backend`, `no permissions`, and the existing generated-sheet filename. No new source art, font, frame, icon, SDK, tracker, backend, account, payment, ad, credential, permission, cron, or dependency file was added.

## 2026-07-15 six-flower acceptance and Pages currentness follow-up

- Files changed: this note only. The existing committed six-raster asset set at `497ed65` was inspected and accepted without recropping or layout churn.
- Visual judgment: both supplied inputs were reviewed. The abstract UI reference remains the material target for compact dark-fantasy inventory-icon treatment, and the supplied 2x3 concept sheet is coherent and safely crop-able in row-major order: Sol Rot, Bone Star, Nightshade, Bloodroot, Amber Seed, Thorn Rose. The repo-local source sheet is byte-identical to the attached concept sheet (`b9756dc269b39df0720c6ba57e44e433e7b9e721b75e196a0bd54405a79e2436`), so no external source art was introduced.
- Asset evidence: all twelve production PNGs are valid transparent RGBA variants at 96x96 and 48x48 with `edgeAlpha=0`. Current 96px draw boxes are Sol Rot 83x87, Bone Star 84x88, Nightshade 77x91, Bloodroot 71x90, Amber Seed 78x88, Thorn Rose 88x81. Current 48px draw boxes are Sol Rot 41x43, Bone Star 41x42, Nightshade 38x44, Bloodroot 34x44, Amber Seed 39x44, Thorn Rose 44x41.
- Screenshot evidence inspected: `work/art-pass-six-flower/six-flowers-before-after-96.png`, `work/art-pass-six-flower/six-flowers-grayscale-96.png`, `work/art-pass-six-flower/six-flowers-silhouette-96.png`, `work/art-pass-six-flower/desktop-after.png`, `work/art-pass-six-flower/mobile390-after.png`, `work/art-pass-six-flower/pages-acceptance-desktop.png`, and `work/art-pass-six-flower/pages-acceptance-mobile390.png`.
- Local verification: `python3 scripts/verify_project.py` passed; `python3 scripts/verify_html_match_shapes.py` passed; `git diff --check` passed before this note; Playwright passed 8/8 for `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, `scripts/verify_pass3_feedback.spec.js`, and `scripts/verify_payoff_ceremony_contract.spec.js` against `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`.
- Browser metrics: local desktop runtime stayed at 686 DOM nodes, 89 images, 132 filtered elements, 169 shadowed elements, 3 animated elements, 64 tiles, 0 dormant previews, 0 broken images, and no overflow. Local exact 390x844 stayed at 686 DOM nodes, 89 images, 133 filtered elements, 172 shadowed elements, 3 animated elements, 64 tiles, 8 complete rows, 0 dormant previews, 0 broken images, and no overflow. Reduced motion stayed at 64 tiles, 8 complete rows, 3 animated elements, 0 broken images, and no overflow.
- Coverage: the passing browser stack covers desktop and exact 390x844 mobile, all first three orders, save/reload, focused effects, Cursed Thorn, Black Candle Vine tutorial/progress behavior, ceremony states, Supreme Bloom review hook, reduced motion, 64-tile integrity, image health, console/page/request error checks, and performance budgets.
- GitHub Pages currentness: `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=497ed65-sixflower` returned 499,208 bytes and contained the raster tile wiring comment. Live GitHub Pages 96px asset SHA-256 values matched local exactly for all six flowers: Sol Rot `c55109c9378ac846f8bd79b7c834c6ff900e5b4ee0204299cb1996f164cdf2f8`, Bone Star `07643f8c822b81c772ce36a78d40b6468fdf9aaa9f367e37e4b44cde75cc8bc7`, Nightshade `a373b39fe8afaca46d4431fe9e1ab21d2d941627a15c6f82e2135339c08f38b6`, Bloodroot `3764a789a93caaf77e4075bb3d8454c9072a08e3d3efaa339573900a77121dbb`, Amber Seed `c765a15bbcb250d29ae9ddfa05598b3ea9dc55264ccb0a7a4cd66caa8f300bdf`, Thorn Rose `4a4879479ac9f510836ce4a02303333828e1f35c8b1fef32e9fec0009f9d2034`.
- GitHub Pages browser smoke: fresh desktop Pages load had 64 tiles, 89 images, 0 broken images, 0 dormant previews, 0 overflow, and no console/page/request failures. Fresh exact 390x844 Pages load had 64 tiles, 89 images, 8 complete rows, board bottom at 575px, 0 broken images, 0 dormant previews, 0 overflow, and no console/page/request failures.
- Remaining art defects: no seams, gutters, text, black rectangles, edge alpha, broken images, mismatched cells, or layout regressions found. Bloodroot remains the narrowest silhouette by source design, but it is distinct in color, grayscale, silhouette, desktop board context, and exact mobile board context.
- Security/IP/deployment status: no asset/code/runtime files changed in this follow-up; the final changed-file scan is limited to this note. No secrets, IP-sensitive source additions, telemetry hooks, service wiring, monetization hooks, permission changes, scheduled jobs, or new dependencies were added. Temporary local server was stopped after verification.

## 2026-07-15 six-flower raster refinement

- Files changed: `assets/tiles/96/*.png`, `assets/tiles/48/*.png`, `scripts/prepare_reference_flower_tiles.js`, and this note.
- Concept-sheet judgment: the supplied 2x3 sheet is coherent and safely crop-able in row-major order: Sol Rot, Bone Star, Nightshade, Bloodroot, Amber Seed, Thorn Rose. It is byte-identical to the repo-local generated source sheet, so no external or protected source art was added.
- Player-visible asset pass: regenerated all six original flower faces from that sheet with larger optical scale, cleaner alpha noise removal, subtle upper-left candle grading, crushed lower-right shadow, and transparent socket-shadow edging. No layout, copy, tutorial logic, economy, backend, controls, saves, or progression behavior changed.
- Asset metrics: 96px PNG sizes are Sol Rot 14,570 bytes, Bone Star 9,928, Nightshade 14,444, Bloodroot 10,584, Amber Seed 17,091, Thorn Rose 15,623. 48px PNG sizes are Sol Rot 4,197, Bone Star 3,015, Nightshade 4,239, Bloodroot 3,238, Amber Seed 4,932, Thorn Rose 4,708. Draw boxes after edge cleanup are 96px: 83x87, 84x88, 77x91, 71x90, 78x88, 88x81; 48px: 41x43, 41x42, 38x44, 34x44, 39x44, 44x41. All 12 PNGs reported valid PNG signatures and `edgeAlpha=0`.
- Evidence inspected: `work/art-pass-six-flower/six-flowers-before-after-96.png`, `work/art-pass-six-flower/six-flowers-grayscale-96.png`, `work/art-pass-six-flower/six-flowers-silhouette-96.png`, `work/art-pass-six-flower/desktop-before-after.png`, `work/art-pass-six-flower/mobile390-before-after.png`, `work/art-pass-six-flower/desktop-after.png`, `work/art-pass-six-flower/mobile390-after.png`, and `work/art-pass-six-flower/mobile390-black-candle.png`.
- Browser metrics: fresh desktop 1280x720 screenshot had 64 tiles, 89 images, 0 broken images, 0 overflow, and 0 console/page/network errors. Exact 390x844 screenshot had 64 tiles, all 8 board rows visible, board bottom 569px, 0 broken images, 0 overflow, and 0 console/page/network errors.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed; Playwright suite `scripts/verify_runtime_performance.spec.js scripts/verify_tutorial_progress.spec.js scripts/verify_pass3_feedback.spec.js scripts/verify_payoff_ceremony_contract.spec.js` passed 8/8 against local `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; custom exact-mobile Black Candle Vine check passed with `Match 4 makes Black Candle Vine.`, visible Black Candle result text, 64 tiles, 8 rows, no overflow, no broken images, and no browser errors.
- Coverage: desktop/mobile browser checks, full first-three-order journey, save/reload ceremonies, tutorial/progress, Cursed Thorn, Black Candle Vine, effects, Supreme Bloom review hook, reduced motion, 64-tile integrity, image dimensions/formats/sizes, and changed-file scans were completed. Standalone `agent-browser` was unavailable in this shell, so the project Playwright Chromium harness was used.
- Security/IP scan: precise added-line scan found no credential material, protected-source names, new service wiring, broad access hooks, or scheduled-job hooks. The broader file scan only hit existing provenance/tooling text such as the generated-sheet filename and the script's `BEFORE_REF` environment variable.
- Remaining art defects: no seams, gutters, labels, black rectangles, edge alpha, or mismatched cells found. Bloodroot remains narrower than the medallion/star/rose by source silhouette, but is taller and clear in the mobile screenshot, grayscale sheet, and silhouette sheet.
- Commit/deploy status: a local commit was created for the complete passing set. Push to `origin/main` failed over SSH with `Permission denied (publickey)` and over HTTPS with prompts disabled due to missing credentials, so GitHub Pages could not deploy this commit. Pages currentness check on `https://xxxerxxxes666.github.io/bloom-tycoon/` returned 200 but still served previous asset hashes, for example live `assets/tiles/96/withered_sun_medallion.png` was 12,747 bytes / `d225a326...`, while the local committed asset is 14,570 bytes / `c55109c9...`.

## 2026-07-15 tutorial first-viewport hierarchy follow-up

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_tutorial_progress.spec.js`, and `docs/codex_build_notes.md`.
- Player-visible fix: the fresh tutorial now replaces the existing board cue in the same above-board position instead of duplicating it below the board. Exact 390x844 mobile shows one instruction, the highlighted swap, and one-tap Skip in the first viewport while preserving all eight board rows.
- Verification: project/source checks, JavaScript syntax checks, diff/secret scans, and real-browser desktop/mobile tutorial checks cover 64 tiles, one visible instruction, Skip persistence, Help replay, the guided swap, two meaningful progress bars, no dormant previews, no broken images, no console errors, and no horizontal overflow.

## 2026-07-15 reference-faithful six-flower art pass

- Files changed: generated six-flower source sheet under `assets/tiles/generated/`, `assets/tiles/96/*.png`, `assets/tiles/48/*.png`, `playable/midnight_bloom_prototype.html`, `scripts/prepare_reference_flower_tiles.js`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: accepted the supplied original 2x3 sheet as coherent and safely crop-able in row-major order: Sol Rot, Bone Star, Nightshade, Bloodroot, Amber Seed, Thorn Rose. Replaced the old carved-square flower icons with transparent, gutter-free, normalized raster relic/floral crops while preserving the approved board-first layout, round flow, copy, economy, tutorial behavior, backend surface, and controls. Board sockets were quieted only by existing pseudo-element opacity changes.
- Asset pipeline/provenance: `scripts/prepare_reference_flower_tiles.js` crops the repo-local 1024x1536 source sheet into equal 512px cells, derives transparency from the black field, trims contamination, normalizes apparent scale, and writes 96px/48px PNG variants. The playable now uses the 96px set with generated 48/96 `srcset` values; `src/Main.gd` already points at the 48px filenames. Source/reference use was limited to material/lighting principles plus the supplied original generated sheet; no protected third-party source material was added.
- Art metrics: 96px PNG sizes are Sol Rot 12,747 bytes, Bone Star 8,012, Nightshade 11,587, Bloodroot 8,490, Amber Seed 15,267, Thorn Rose 13,306. 48px PNG sizes are Sol Rot 3,523 bytes, Bone Star 2,329, Nightshade 3,107, Bloodroot 2,236, Amber Seed 4,133, Thorn Rose 3,578. Normalized 96px draw boxes: 79x83, 79x83, 70x83, 65x83, 75x83, and 83x75.
- Evidence inspected: `work/art-pass-six-flower/six-flowers-before-after-96.png` compares previous committed icons to the new set; `work/art-pass-six-flower/six-flowers-after-96.png` shows the final six-icon set; `work/art-pass-six-flower/desktop-fresh-context.png` and `work/art-pass-six-flower/mobile390-fresh-context.png` show the new art in context. Fresh screenshot metrics: desktop 1280x720 capture retained 64 tiles, 89 images, 0 broken images, 0 overflow, and no console/page/network errors; exact 390x844 retained 64 tiles, all 8 rows visible, 0 broken images, 0 overflow, and no console/page/network errors.
- Verification commands/results: `python3 scripts/verify_project.py` passed; `BLOOM_TEST_URL=http://127.0.0.1:4173/playable/midnight_bloom_prototype.html NODE_PATH=/opt/data/home/.npm/_npx/eb7983f9b02fb67f/node_modules /opt/data/home/.npm/_npx/eb7983f9b02fb67f/node_modules/.bin/playwright test scripts/verify_runtime_performance.spec.js --reporter=line` passed 3/3 with desktop/mobile/reduced-motion budgets; the same Playwright command for `scripts/verify_pass3_feedback.spec.js` passed 2/2 for the full Round 1 -> 2 -> 3 desktop and exact mobile journey including save/reload ceremonies, Cursed Thorn, Supreme Bloom review hook, and 64-tile integrity; `git diff --check` passed; image dimension/format/size checks passed for all changed PNGs.
- Security/scope checks: precise changed-file secret scan found no matches. Added-line IP/provenance scan found no protected-source additions. Forbidden integration scan found no matches. `agent-browser` was unavailable in this shell, so browser verification used the existing Chromium Playwright harness.
- Remaining art defects: no seams, gutters, text, or mismatched cells found. Bloodroot is intentionally narrower than the medallion/star/rose because of its source silhouette, but it shares the same height target and remains readable at 48px/mobile in the verified screenshots.
- Deployment status: local verification complete before commit. Origin/main, GitHub Pages, and hosted smoke are checked after the one art-pass commit is pushed.

## 2026-07-15 performance, progress, and tutorial foundation

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_runtime_performance.spec.js`, `scripts/verify_tutorial_progress.spec.js`, and `docs/codex_build_notes.md`.
- Player-visible milestone: preserved the board-first desktop/mobile hierarchy while removing active Round 4-57 preview/runtime scaffolding, the Bouquet Path/Path Ledger/Round 3 focus preview surfaces, hidden Apothecary/Faction/Black Market card image DOM from the focused journey, duplicate greenhouse/restoration XP/payoff/ladder bar surfaces, and bottom preview rendering for the focused first-three-order route. The only visible progress bars are now the bouquet reward bar and the greenhouse restoration/level dial, and both name concrete next rewards (`+120 coins`, `Restore First Bouquet Glass`, `Unlock Bloodroot Compact`, `Raise Bloodroot Conservatory`).
- Tutorial foundation: fresh Round 1 starts a direct board spotlight tutorial within 3 seconds, with one-tap Skip persistence and centered Replay/Help. Replay restarts the terse spotlight copy without corrupting active state. Covered lessons are adjacent swap, match 3 bouquet progress, match 4 Black Candle Vine, Cursed Thorn adjacency, moves failure/retry, and coins restoring the greenhouse.
- Performance result: pre-change reproducible local baseline was 781 DOM nodes, 98 images, 219/220 filtered elements, 190/193 shadowed elements, 16 animated elements, 0 dormant preview nodes, and 728,503 bytes of playable HTML. Final focused runtime is 686 DOM nodes, 89 images, 132/133 filtered elements, 169/172 shadowed elements, 3 animated elements, 0 dormant preview nodes, and 498,456 bytes of playable HTML. The original audit target of roughly 1,031 nodes, 106 images, 227 filtered elements, 249 shadowed elements, 10 idle animations, 55 hidden preview nodes, and 738KB decoded HTML is materially reduced.
- Browser verification: local Chromium on `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html` passed desktop 1280x720 and exact 390x844 mobile journeys for fresh tutorial start, first spotlighted move, skip persistence, replay/help, match-3 progress, Black Candle Vine lesson/behavior, Cursed Thorn teaching/behavior, moves failure/retry, bouquet coins -> greenhouse restoration/upgrade/raise labels, Round 1 -> 2 -> 3, save/reload, 64 tile integrity, exact mobile eight-row fit, no overflow, zero visible broken images, zero console/page/network errors, Supreme Bloom rarity, and reduced-motion behavior. Fresh desktop and mobile screenshots `work/tutorial-desktop.png` and `work/tutorial-mobile390.png` were inspected after the final layout fix.
- Required checks run: `python3 scripts/verify_project.py`; `python3 scripts/verify_html_match_shapes.py`; `git diff --check`; `node --check` on all Playwright specs; inline playable JavaScript syntax parsing with `vm.Script`; and `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules BLOOM_TEST_URL=http://127.0.0.1:4173/playable/midnight_bloom_prototype.html /opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules/.bin/playwright test scripts/verify_runtime_performance.spec.js scripts/verify_tutorial_progress.spec.js scripts/verify_pass3_feedback.spec.js scripts/verify_payoff_ceremony_contract.spec.js --reporter=line` (8 passed).
- Deployment status: local verification complete before commit. GitHub Pages verification necessarily follows push of this commit.
- Known issues: no player-facing issue found in the verified first-three-order route. Existing hidden prototype review hooks remain available to the test harness but are not visible in the approved board-first runtime.
- Security/secret-scan status: changed-file scan found no private-key headers, `.env` material, provider token prefixes, JWT-like strings, suspicious credential assignments, trackers/analytics SDKs, backend/account/payment/ad hooks, package/dependency additions, broad permissions, or cron/scheduler additions.

## 2026-07-14 focused runtime performance milestone

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_runtime_performance.spec.js`, and `docs/codex_build_notes.md`.
- Player-visible milestone: active Round 1/2/3 no longer creates or rerenders the retired Bouquet Path, Path/Ledger, Round 3 focus card, or Round 4-57 preview nodes. Eight hidden prototype-control icons were also removed from the initial document. The approved board-first layout, original tile art, objectives, tutorial cues, greenhouse payoff, saves, and match engine remain unchanged while the first-minute screen carries less DOM, image, style, and repeated-render work.
- Measured runtime result: fresh desktop 1280x720 and exact mobile 390x844 each fell from the audited baseline of roughly 1,031 DOM nodes to 781 nodes, from 106 images to 98, and from 55 dormant preview placeholders to 0. Both retained 64 tiles, eight complete board rows, no horizontal overflow, no broken images, and no visible non-tile buttons during the fresh Round 1 sample.
- Regression guard: the source verifier now forbids dormant future-preview markup and calls from returning to the active render path. The new runtime browser contract caps the focused DOM at 850 nodes and images at 100 while requiring zero future-preview nodes, 64 tiles, the authored two-tile opening cue, mobile eight-row integrity, no overflow, no broken images, and no browser errors.
- Browser verification: local Chromium on `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html` passed six tests across desktop and exact 390x844 mobile: the runtime budget contract, complete Pass 3 Round 1 -> Round 2 -> Round 3 journeys, Cursed Thorn feedback/retry, save/reload, all three greenhouse transactions, Next Order/Play Again, and the unified ceremony contract. Final screenshots were visually inspected and preserve the approved hierarchy.
- Required checks: `python3 scripts/verify_project.py`, `python3 scripts/verify_html_match_shapes.py`, extracted inline JavaScript `node --check`, `git diff --check`, the six-test Chromium suite, and changed-file credential/tracker scans.
- Deployment status: verified locally before commit; Vercel and GitHub Pages checks follow push.
- Known issues: the document still contains historical Round 4-57 source definitions for verifier/save compatibility, but none are mounted or called by the active first-three-level runtime. No player-facing regression was found.
- Security/secret-scan status: no secrets, `.env` files, tokens, credentials, analytics, trackers, ads, payments, accounts, backend services, permissions, dependencies, or external assets were added.

## 2026-07-14 Pass 3 visual polish and feedback discipline

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_pass3_feedback.spec.js`, and `docs/codex_build_notes.md`.
- Player-visible milestone: tile sockets are darker and quieter while original repo-owned tile art is larger/brighter for clearer silhouettes; cascade waves now present one central hit sigil/ring plus one strongest-run vein with sampled resource/coin/intake motion instead of per-cell glitter; Cursed Thorn damage now stamps readable `CRACK`/`BREAK` tile events with a single shock marker and capped splinters; Round 3 active mobile now suppresses Path/Ledger and legacy chrome so all eight board rows fit at exact 390x844.
- Browser verification: local Chromium on `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html` ran the new Pass 3 regression at 1280x720 and exact 390x844. It exercised fresh active play, real guided Round 1 swap, one hit event per sampled wave, full Round 1 payoff/reload/restore/Next Order, real Round 2 Cursed Thorn lesson with non-overlapping damage labels, retry, Round 2 payoff/reload/upgrade/Next Order, Round 3 active mobile eight-row layout, Round 3 payoff/reload/raise/Play Again, and Supreme Bloom via focused lowercase `b`.
- Ceremony preservation: `scripts/verify_payoff_ceremony_contract.spec.js` still passes on desktop and exact 390x844, preserving the unified one-trophy/one-greenhouse/one-action payoff ceremonies.
- Browser status: Pass 3 and ceremony regressions captured 0 console messages, 0 page errors, 0 failed requests, 0 visible broken images, and 0 horizontal overflow.
- Required checks run: `python3 scripts/verify_project.py`, inline playable JavaScript `node --check` from `work/inline-syntax.js`, `git diff --check`, `scripts/verify_pass3_feedback.spec.js`, `scripts/verify_payoff_ceremony_contract.spec.js`, and changed-file credential/tracker scans.
- Deployment status: verified locally before commit; no Vercel redeploy checked and GitHub Pages was not checked in this pass before push.
- Known issues: no player-facing issue found in the verified first-three-order route. Browser verification uses the existing focused `n` review hook after real tile interaction to bound bouquet completion time.
- Supreme Bloom trigger: absent from normal tutorial play in the Pass 3 journey before review input; remains rare through 6+ straight-line matches or explicit sacrifice/review paths. Verify without console by focusing the playable and pressing lowercase `b`.
- Security/secret-scan status: changed files were scanned for private-key headers, provider token prefixes, JWT-like strings, suspicious credential assignments, analytics/tracker/backend/payment/ad/cron hooks, and broad service additions. No findings.

## 2026-07-14 Pass 2 audit correction

- Files changed: `playable/midnight_bloom_prototype.html` and `docs/codex_build_notes.md`.
- Player-visible correction: exact 390x844 Round 2/3 payoff trophies now reserve enough vertical space for ingredient badges below the trophy copy, removing the mobile badge/text overlap found during screenshot inspection. Round 2/3 payoff ceremonies also explicitly hide stale `.bouquet-bind-seal` effects that can survive the real guided-play path.
- Browser verification: local Chromium on `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html` reran `scripts/verify_payoff_ceremony_contract.spec.js` at 1280x720 and exact 390x844, then an independent full journey with real guided Round 1 Black Candle Vine swaps, real Round 2 Cursed Thorn swap, diagnostic retry, Round 1 -> Round 2 -> Round 3 next-order flow, Supreme Bloom via focused lowercase `b`, save/reload preservation for every pending/completed ceremony state, image/overflow/console/network checks, and final `Play Again`.
- Screenshots inspected: updated `work/pass2-mobile390-round2-pending.png`, `work/pass2-mobile390-round3-pending.png`, plus desktop Round 1/2/3 pending captures. The final mobile captures show one trophy, one greenhouse before/after, one transaction line, one dominant action, no visible board/active controls, no old ledgers, and no badge/text overlap.
- Required checks run after the correction: `python3 scripts/verify_project.py`, inline playable JavaScript `node --check` using a real `.cjs` temp file, `git diff --check`, focused Playwright ceremony contract, independent browser journey, and changed-file secret scan. No secrets, trackers, services, dependencies, rounds, currencies, costs, or third-party assets were added.
- Deployment status: verified locally before commit; GitHub Pages verification follows push.

## 2026-07-14 Pass 2 payoff ceremony unification

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `scripts/verify_payoff_ceremony_contract.spec.js`, and `docs/codex_build_notes.md`.
- Player-visible Pass 2 milestone: Round 1 restoration, Round 2 greenhouse upgrade, and Round 3 conservatory raise now use one shared ceremony renderer. Each focused payoff hides the board, objective, active greenhouse layer, controls, left rail, Path/Ledger, Chest, Flowerpedia, Chapter, XP preview, payoff ladder, reward-choice, and old reward ledger surfaces; it shows one bouquet trophy, one repo-owned before/after greenhouse scene, one compact coin transaction line, and one visible primary action.
- Browser verification: local server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; `agent-browser` was unavailable, so Chromium Playwright was used. The focused regression exercised desktop 1280x720 and exact 390x844 journeys through Round 1 -> restore -> Next Order, Round 2 retry -> completion -> upgrade -> Next Order, Round 3 completion -> raise -> Play Again, plus save/reload preservation for every pending and completed ceremony state. Both viewports retained 64 tiles during active play and had 0 visible broken images, 0 horizontal overflow, 0 console messages, 0 page errors, and 0 failed requests.
- Screenshots inspected: `work/pass2-desktop-round1-pending.png`, `work/pass2-desktop-round3-pending.png`, `work/pass2-mobile390-round1-pending.png`, `work/pass2-mobile390-round2-pending.png`, and `work/pass2-mobile390-round3-pending.png`. The first inspection caught and fixed a transient bouquet badge/title overlap and Round 1 left-rail leakage before the final passing run.
- Required checks run: `python3 scripts/verify_project.py`, inline playable JavaScript `node --check`, `git diff --check`, `BLOOM_TEST_URL=http://127.0.0.1:4173/playable/midnight_bloom_prototype.html npx --yes -p @playwright/test -c 'NODE_PATH=${PATH%%/node_modules/.bin:*}/node_modules playwright test scripts/verify_payoff_ceremony_contract.spec.js --browser=chromium --reporter=line'`, and precise changed-file secret scan for private-key headers, provider token prefixes, JWTs, and suspicious secret assignments.
- Deployment status: local-only verification before commit; no Vercel redeploy checked and GitHub Pages was not checked. Temporary HTTP server was stopped after verification.
- Known issues: no player-facing issue found in the verified first-three-order payoff route. The focused regression uses the existing keyboard review hook after real page interaction to bound bouquet completion time; visible debug/review controls remain hidden from the ceremonies.

## 2026-07-14 Pass 1 Round 2 board-first continuity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible Pass 1 milestone: completing the two authored Moonlit teaching swaps no longer drops Round 2 back into the legacy prototype page. The compact objective, altar board, greenhouse companion, hidden review controls, and restrained active-order hierarchy now persist for the full live Round 2 order; only the strong guide cue and arrow end after two moves. Retry remains free to suppress the completed guide while ordinary delayed tile hints continue.
- Regression guard: the HTML verifier now distinguishes the full active Round 2 board-first shell from the bounded `restored-next-order-guide` cue state.
- Browser verification: local Chromium exercised the real Round 1 opening, Black Candle Vine lesson, bouquet completion, 100-coin restoration, `Next Order`, both authored Round 2 teaching swaps, post-guide ordinary play, diagnostic fail -> visible `Retry Bouquet`, retry, deterministic Round 2 completion after real play, Hermes' new 120-coin Moonlit greenhouse upgrade gate, save/reload, and `Next Order -> Bloodroot Compact` at 1280x720 and exact 390x844. Before this correction, the post-guide board began at 478px desktop / 596px mobile, page height reached 2,034px / 3,664px, and nine legacy controls plus Path/Ledger returned. After correction, the board begins at 182px / 192px, page height is 738px / 844px, and active post-guide/retry play exposes zero non-tile controls, no Path/Ledger, and no strong guide state. Both viewports retained 64 tiles in eight rows, 0 broken images, 0 overflow, and 0 console/page errors.
- Synced Hermes verification: commit `7483452` correctly withholds `Next Order` until `Upgrade Greenhouse · 120 coins` is used, deducts exactly 120 coins, persists the Moonlit upgrade through reload, and opens Round 3 with 64 tiles. Pending and complete desktop/mobile ceremonies were visually inspected.
- Required checks: `python3 scripts/verify_project.py`, extracted inline JavaScript syntax check, `git diff --check`, changed-line secret scan, and changed-line integration/scope scan passed. No assets, rounds, currencies, blockers, boosters, services, trackers, permissions, credentials, or dependencies were introduced.

## 2026-07-14 Bloodroot conservatory raise gate

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 3 `Bloodroot Compact` now completes the first-three-order heartbeat with a real conservatory raise transaction. After the Bloodroot bouquet pays out, the finale shows `BLOODROOT CONSERVATORY READY`, keeps replay locked, shows the Moonlit-to-Bloodroot before/after greenhouse art, and requires `Raise Conservatory · 180 coins`; the click spends exactly 180 existing coins, persists `roundThreeConservatoryRaised`, reveals `BLOODROOT CONSERVATORY COMPLETE`, and then exposes `Play Again -> First Bouquet`.
- Live pre-edit inspection: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?codex_preflight_bloodroot` passed at 1280x720 and exact 390x844 with 64 tiles, 8 complete rows, 0 broken images, 0 horizontal overflow, 0 visible future diary sections, and 0 console/page/request failures. Screenshots `work/live-preflight-desktop.png` and `work/live-preflight-mobile390.png` were visually inspected.
- Local browser verification: temporary server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html?codex_bloodroot_local`; Chromium exercised fresh load, real guided Round 1 swap, Round 1 completion, `Restore Greenhouse`, save/reload, `Next Order`, real guided Round 2 thorn swap, failure -> visible `Retry Bouquet`, Round 2 completion, `Upgrade Greenhouse`, `Next Order`, a real Round 3 legal swap, Bloodroot completion, pending Bloodroot raise save/reload, `Raise Conservatory`, raised-state save/reload, and `Play Again -> First Bouquet`.
- Browser evidence: desktop and mobile retained 64 tiles during active play, exact mobile fresh play showed 8 complete rows, all checked states had 0 broken images and 0 horizontal overflow, and captured 0 console messages, 0 page errors, and 0 failed requests. Screenshots inspected: `work/bloodroot-pending-desktop.png`, `work/bloodroot-raised-desktop.png`, `work/bloodroot-pending-mobile390.png`, and `work/bloodroot-raised-mobile390.png`.
- Required checks run: `python3 scripts/verify_project.py`, inline playable JavaScript syntax check with `new Function`, `git diff --check`, focused Playwright desktop/mobile interaction regression, save/reload, failure -> `Retry Bouquet`, bouquet reward -> restoration/upgrade/raise transactions, next-order/replay transitions, 64-tile checks, mobile row/overflow checks, broken-image checks, and console/page/network-error checks.
- Deployment status: not redeployed in this local pass before commit/push. Vercel production was checked only as the pre-edit live baseline/current production URL. GitHub Pages was not checked.
- Known issues: no player-facing issue found. The focused completions and mobile Bloodroot state setup use deterministic diagnostic hooks after real tile interaction to keep verification bounded.
- Review-hook preservation: L/T/cross remains available through the existing `Shape Bloom` path or focused `M`; Supreme Bloom remains absent from normal tutorial play and available without console by focusing the playable and pressing `B`.
- Security/secret-scan status: changed files/additions were scanned for private-key headers, provider-token prefixes, JWTs, suspicious credential assignments, `.env`, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, machine-local paths, dependency additions, and cron/scheduler additions. No findings.

## 2026-07-14 Moonlit greenhouse upgrade gate

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 2 now completes the heartbeat with a real Moonlit Greenhouse upgrade action before Bloodroot Compact. `Moonlit Wreath` completion shows a pending moonlit before/after greenhouse ceremony, spends 120 existing coins on `Upgrade Greenhouse`, animates the upgrade with the existing restoration motif, persists `roundTwoGreenhouseUpgraded`, and only then exposes `Next Order -> Bloodroot Compact`. Active Round 1 controls, board-first layout, saves, retry, 64 tiles, and existing review hooks are preserved.
- Live pre-edit inspection: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?codex_live_preflight=375d3c0` passed at 1280x720 and exact 390x844 with 64 tiles, 8 visible rows, 0 broken images, 0 horizontal overflow, 0 visible future diary sections, and 0 console/page/request failures. Screenshots `work/live-before-desktop.png` and `work/live-before-mobile390.png` were inspected.
- Local browser verification: temporary server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html?codex_moonlit_upgrade`; Chromium exercised real guided Round 1 tile swaps, Round 1 bouquet completion, `Restore Greenhouse`, save/reload, `Next Order`, a real guided Round 2 tile swap, Round 2 completion setup, pending Moonlit upgrade gate, real `Upgrade Greenhouse` click, save/reload, `Next Order -> Bloodroot Compact`, diagnostic fail -> visible `Retry Bouquet`, exact 390x844 fresh mobile active play, mobile pending upgrade, mobile upgrade click, and mobile `Next Order`.
- Browser evidence: desktop and mobile retained 64 tiles, 0 broken images, 0 horizontal overflow, at least 6 complete mobile rows in active play, 0 console errors/warnings, 0 page errors, 0 failed requests, and 0 transient effects after cleanup. Screenshots inspected: `work/moonlit-desktop-round1-restored.png`, `work/moonlit-desktop-upgrade-pending.png`, `work/moonlit-desktop-upgrade-complete.png`, `work/moonlit-mobile-upgrade-pending.png`, and `work/moonlit-mobile-upgrade-complete.png`.
- Required checks run: `python3 scripts/verify_project.py`, inline playable JavaScript syntax check with `new Function`, `git diff --check`, focused Playwright desktop/mobile interaction regression, save/reload, fail -> `Retry Bouquet`, reward -> greenhouse restoration -> `Next Order`, Round 2 reward -> Moonlit upgrade -> `Next Order`, 64-tile checks, mobile row/overflow checks, broken-image checks, console/page/network-error checks, and transient cleanup checks.
- Deployment status: not redeployed in this local pass before commit/push. Vercel production was checked only as the pre-edit live baseline/current production URL. GitHub Pages was not checked.
- Known issues: no player-facing issue found. The focused Round 2 completion and retry exposure use diagnostic state setup after real tile interaction to keep the verification deterministic.
- Review-hook preservation: L/T/cross remains available through the existing `Shape Bloom` path or focused `M`; Supreme Bloom remains absent from normal tutorial play and available without console by focusing the playable and pressing `B`.
- Security/secret-scan status: changed files and additions were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, suspicious credential assignments, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, machine-local paths, package/dependency additions, and scheduler/cron additions. No findings.

## 2026-07-14 Guided objective consolidation

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: the authored mobile Round 2 guide now keeps its round label and move count together above one four-goal row, and no longer repeats `Match beside Cursed Thorns` immediately above the glowing `Crack the marked thorns` cue. The normal thorn reminder returns after the two-move authored guide ends if thorns remain.
- Regression guard: the HTML verifier requires both the four-column guided objective layout and the guide-aware thorn reminder suppression.
- Browser verification: local Chromium exercised the real Round 1 opening, Black Candle Vine lesson, bouquet completion, 100-coin greenhouse restoration, `Next Order`, and both authored Round 2 Cursed Thorn swaps at 1280x720 and exact 390x844. Mobile rendered the four goals on one row, reduced the objective from 97px to 82px, and moved the board from 246px to 230px while preserving all eight rows. Desktop retained its established layout. Both viewports kept 64 tiles, no more than one visible non-tile control during active play, 0 broken images, 0 overflow, and 0 console/page errors; ordinary play resumed after the two taught moves with all thorns complete.
- Required checks: `python3 scripts/verify_project.py`, extracted inline JavaScript syntax check, `git diff --check`, changed-line secret scan, and changed-line integration/scope scan all passed. No assets, mechanics, objectives, moves, rewards, saves, progression, services, trackers, permissions, credentials, or dependencies changed.

## 2026-07-14 Moonlit lesson hierarchy pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: the restored-greenhouse status strip no longer repeats beneath the objective and Cursed Thorn cue during active Moonlit matching. The restoration handoff keeps its greenhouse context, while desktop and mobile active play gain a quieter first viewport and more direct board hierarchy without changing the objective, guide, moves, saves, rewards, or progression.
- Regression guard: the HTML verifier now requires the active-play-only status suppression rule.
- Browser verification: local Chromium exercised the real instructed Round 1 swap, Black Candle Vine lesson, bouquet completion, 100-coin greenhouse restoration, `Next Order`, and guided Round 2 Cursed Thorn swap at 1280x720, 1440x900, 1440x1000, and exact 390x844. Every viewport retained 64 tiles in eight rows, 0 broken images, 0 horizontal overflow, 0 console/page errors, and no more than one visible non-tile control during active play. The active Round 2 board moved from 257px to 220px on desktop and from 280px to 246px on mobile; all rows stayed inside the first viewport, and the compact mobile greenhouse ladder remained visible.
- Required checks: `python3 scripts/verify_project.py`, extracted inline JavaScript syntax check, `git diff --check`, changed-line secret scan, and changed-line integration/scope scan all passed. No new assets, mechanics, objectives, rounds, controls, services, permissions, trackers, credentials, or dependencies were introduced.

## 2026-07-14 Board impact cascade-juice pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: real match waves now add a restrained occult impact sigil and line-shaped cascade vein at the cleared run, layered with the existing ring, board pulse, swap/match/settle audio motifs, refill timing, and objective flights. This makes accepted swaps, the taught Black Candle line, and the Moonlit Cursed Thorn match read as one timed board hit without changing rounds, economy, saves, controls, targets, or tile count.
- Regression guard: the HTML verifier now requires `impact-sigil`, `cascade-vein`, `matchRuns`, and their keyframes alongside the existing cascade/audio hooks.
- Browser verification: local Chromium on `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html` at 1280x720 and exact 390x844 used real tile clicks for the instructed Round 1 Thorn Rose swap, the instructed Black Candle Bone Star swap, Round 1 bouquet completion, `Restore Greenhouse`, save/reload of restored Round 1, `Next Order`, and the guided Round 2 Cursed Thorn swap. Impact-frame samples on desktop and exact mobile each showed 1 `impact-sigil`, 1 `cascade-vein`, 1 `cascade-ring`, 0 overflow, and 0 broken images. Stable samples preserved 64 tiles, no broken images, no console/page/request errors, and no horizontal overflow; exact mobile retained 8 complete board rows.
- Retry/save evidence: after real Round 2 play, a diagnostic withered Round 2 state exposed the visible `Retry Bouquet` button; the click restored Round 2 to 17 moves, 64 enabled tiles, no overflow, and no transient FX. Save/reload preserved the restored Round 1 completion state and 64 tiles before `Next Order`.
- Audio/no-audio evidence: AudioContext prototypes were instrumented before the first real gesture while preserving originals. Desktop counts reached 17 oscillators, 21 gains, 17 oscillator starts, and 4 buffer-source starts across handoff/swap/match/settle/retry; mobile counts reached 50 oscillators, 62 gains, 50 oscillator starts, and 12 buffer-source starts across swap/match/settle/complete/restore/handoff. A separate exact 390x844 no-`AudioContext` run completed a real match with event records but 0 voices, 64 tiles, 0 overflow, 0 broken images, 0 console/page/request errors, and complete transient cleanup.
- Screenshots inspected: `work/changed-impact-desktop.png`, `work/changed-impact-mobile390.png`, `work/changed-desktop-round2.png`, and `work/changed-mobile390-round2.png`.
- Required checks run: `python3 scripts/verify_project.py`, extracted inline playable JavaScript syntax check with `new Function`, `git diff --check`, focused Chromium desktop/mobile/no-AudioContext interaction regression, impact-frame visual inspection, save/reload, diagnostic fail -> real `Retry Bouquet`, bouquet reward -> greenhouse restoration -> `Next Order`, 64-tile checks, no-overflow checks, broken-image checks, console/page/request-error checks, and transient FX cleanup checks.
- Deployment status: not redeployed before this note. Vercel and GitHub Pages production were not checked in this local pass.
- Known issues: no player-facing issue found. The retry verification uses a diagnostic failed Round 2 state after real Round 2 play because exhausting moves naturally is nondeterministic in the focused slice.
- Review hooks preserved: L/T/cross remains verifiable after the focused opening through the existing `Shape Bloom` path or focused `M`; Supreme Bloom remains absent from normal tutorial play and verifiable without console by focusing the playable and pressing `B`.
- Security/secret-scan status: changed files and additions were scanned for private-key headers, provider token prefixes, JWT-shaped strings, suspicious credential assignments, `.env` additions, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, machine-local paths, and cron/scheduler additions. No findings.

## 2026-07-14 Desktop board-first ladder correction

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: the new three-step greenhouse ladder remains in the restoration/payoff ceremony, but no longer occupies active desktop matching space. The existing compact desktop composition now applies at every desktop height, and the focused Round 2/3 board uses a height-aware cap that keeps all eight rows in the first viewport. Mobile keeps the compact three-chip active ladder because its full board already fits.
- Regression guard: the HTML verifier requires both the active-desktop ladder suppression and the restored-order board height budget.
- Browser verification: local Chromium exercised the real Round 1 opening, authored Black Candle Vine swap, bouquet completion, 100-coin greenhouse restoration, and `Next Order` at 1280x720, 1440x900, 1440x1000, and exact 390x844. Desktop and mobile retained 64 tiles in eight rows, 0 broken images, 0 horizontal overflow, and no console/page errors; the active board remained fully inside every tested first viewport.
- Security and scope: changed additions were scanned for credential/private-key patterns and new network, analytics, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings; no mechanic, objective, move, reward, progression, save, asset, control, service, dependency, or mobile layout was changed.

## 2026-07-14 Black Candle payoff legibility

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: the compact Black Candle lesson/result strip now remains above its row-clearing relic sweep. The existing gold-red impact can no longer wash across `Black Candle Vine! Row cleared.` on desktop or mobile; the authored swap, eight-cell lane clear, timing, objectives, moves, and bouquet completion are unchanged.
- Regression guard: the HTML verifier requires the Black Candle cue to keep its explicit top-layer stacking rule.
- Browser verification: local Chromium at 1280x720 and exact 390x844 exercised the real opening swap, waited for the authored Black Candle cue, selected the first guided Bone Star to inspect the match/eight-cell lane preview, completed the second guided swap, sampled the live sweep, and waited for settlement. Both sizes retained 64 tiles in eight rows, 0 broken images, 0 horizontal overflow, and no console/page errors.
- Security and scope: changed additions were scanned for credential/private-key patterns and new network, analytics, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings; no asset, round, mechanic, control, reward, progression, save, service, or dependency was added.

## 2026-07-14 Invalid-swap guide recovery

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: a refused opening swap now keeps the correct instructed pair glowing while the two rejected tiles shake and show their red X marks. The cue `No bloom — follow the glowing pair` therefore points to a visible target throughout the 880ms refusal window instead of hiding the glow until the animation ends. The normal authored cue returns afterward.
- Regression guard: the HTML verifier requires the cue-preserving refusal path and its immediate guided-pair restoration.
- Browser verification: local Chromium at 1280x720 and exact 390x844 made an adjacent non-matching opening swap, sampled the refusal at 140ms, and sampled recovery after the animation. Both sizes showed 2 rejected tiles plus 2 correct glowing tiles during refusal, retained `Moves 12`, kept `hasMadeValidMove` false and selection clear, then restored the authored cue with 2 glowing tiles and 0 invalid tiles. A complete Round 1 -> reward -> restoration -> immediate `Next Order` -> both guided Moonlit moves -> ordinary move pass also verified Hermes' new Cursed Thorn seal art and bounded onboarding behavior with 64 enabled tiles in eight rows, board above the fold, 0 broken images, 0 horizontal overflow, 0 console/page errors, and complete transient cleanup.
- Security status: the synchronized Hermes commits and this pass's changed files/additions were scanned for credential/private-key signatures and new network, analytics, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings.
- Scope: no moves are spent, and no board, match, objective, reward, progression, save, control, or asset behavior changed.

## 2026-07-14 Greenhouse upgrade ladder pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: added a compact three-step greenhouse upgrade ladder across the focused first-three-order slice: `First Bouquet Glass`, `Moonlit Greenhouse`, and `Bloodroot Conservatory`. The ladder appears in the Round 1 payoff/restoration panel, the Round 2/3 focused handoff frame, and the Round 2/3 payoff panels so the heartbeat reads as match flowers -> bouquet -> coins -> greenhouse restoration/upgrade -> next order without adding rounds, currencies, controls, lore panels, economy, or content sprawl.
- Live preflight before editing: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?preflight=b8dec09` loaded at 1280x720 and exact 390x844 with 64 tiles, no broken images, no console/page/request errors, no horizontal overflow, no visible future diary sections, and 8 complete mobile rows. Screenshots `work/preflight-live-desktop.png` and `work/preflight-live-mobile.png` were visually inspected before editing, then removed during cleanup.
- Required checks run: `python3 scripts/verify_project.py` -> `Bloom Tycoon project verification passed.` and `HTML match-shape regression checks passed.`; `git diff --check` -> no output.
- Focused browser regression: local static server `http://127.0.0.1:4329/playable/midnight_bloom_prototype.html?verify=greenhouse-ladder-final` in Chromium. Exercised fresh load, real instructed first swap, 64 tiles, Round 1 completion through legal moves, payoff ladder states, exact `-100` greenhouse restoration transaction, visible before/after restoration opacity, save/reload, `Next Order`, Round 2 ladder state, real Round 2 guided play, Round 2 failure -> visible `Retry Bouquet`, retry restoring Round 2 with 64 tiles, continued play after retry, exact 390x844 fresh mobile, and exact 390x844 Round 2 ladder layout. Mobile kept 8 complete rows and no horizontal overflow.
- First-three-order preservation check: local Chromium used the existing review hook to complete Round 2 and Round 3 after active-state setup, verifying ladder states `complete/complete/ready`, then `complete/complete/current`, then `complete/complete/complete`, with 0 broken images and 0 console/page/request errors.
- Screenshot/visual inspection: inspected changed frames `work/final-desktop-fresh.png`, `work/final-round1-before-restore.png`, `work/final-round1-restored.png`, `work/final-round2-desktop.png`, `work/final-mobile-fresh.png`, `work/final-mobile-round2-ladder.png`, and `work/final-round3-complete-ladder.png`, then removed them during cleanup. The first compact mobile ladder attempt was rejected because it pushed the board too low; the final mobile ladder is a three-chip row with the board at 280px and 8 complete rows visible. Independent foreman review retained the milestone and replaced the ladder confirmation's animated CSS filter with compositor-safe opacity/transform/shadow choreography, with reduced-motion suppression and a focused verifier guard.
- Browser console/network status: local final regressions and live preflight observed 0 console errors, 0 page errors, 0 failed requests, and 0 broken images.
- Deployment status: no redeploy was performed before this note. Vercel production was checked only as the pre-edit live baseline/current production URL. GitHub Pages was not checked.
- Known issues: standalone `agent-browser` is still unavailable in this shell; browser verification used cached Playwright with `AGENT_BROWSER_EXECUTABLE_PATH`.
- Review-hook preservation: L/T/cross remains available through the existing `Shape Bloom` path or focused `M`; Supreme Bloom remains absent from normal tutorial play and remains verifiable without console by focusing the playable and pressing `B`.
- Security/secret-scan status: changed files and additions were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, analytics/trackers, backend/account/payment/ad hooks, broad permissions, machine-local paths, and scheduler/cron additions. No findings.

## 2026-07-14 Bounded onboarding handoff pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the restored greenhouse tutorial now ends cleanly after the two taught Moonlit Wreath moves. `restored-next-order-focus` is limited to the active authored Round 2 guidance window; once the guide counter reaches its cap, the strong cue bubble, `NEXT BLOOM` follow-up state, and swap arrow are removed, normal board controls/layout return, and only restrained tile-level idle hints can reappear after the normal delay. The guide counter persists through reloads with a backward-compatible Round 2 migration path, while Round 3 no longer opens with a fresh strong arrow/cue tutorial.
- Verification run: `python3 scripts/verify_project.py` -> `Bloom Tycoon project verification passed.` and `HTML match-shape regression checks passed.`; `git diff --check` -> no output; focused Playwright Chromium regression with temporary runner -> `3 passed (39.7s)`.
- Browser coverage: live Vercel first viewport at 1280x720 loaded with 64 tiles, no horizontal overflow, no broken images, one opening arrow/cue, and no console/page/network failures. Local 1280x720 exercised fresh load, Round 1 taught moves, win/reward/restoration/`Next Order`, both taught Round 2 moves, transition to unguided play, delayed tile hints after 7.3s, save/reload preserving unguided state, and delayed hints after reload. Local exact 390x844 exercised fresh layout, failed bouquet -> `Retry Bouquet`, retry restoring 64 tiles and 12 moves, completion, restoration, `Next Order`, 64 tiles, no overflow, no broken images, and no console/page/network failures.
- Final render status: temporary local screenshots were captured and visually inspected at 1280x720 and exact 390x844, then removed with the rest of the test artifacts; desktop remains board-first with the greenhouse companion, and mobile keeps the compact board hierarchy with no horizontal overflow.
- Deployment status: no redeploy was performed in this pass. Vercel production was checked only as the live baseline/current production URL: `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=onboarding-handoff-live`. GitHub Pages was not checked.
- Known issues: standalone `agent-browser` is still unavailable in this shell, so browser verification used temporary Playwright tooling under `.tmp/pw` and then removed it. No player-facing issue found in the verified first-session route.
- Review-hook preservation: L/T/cross can still be verified without console by focusing the playable and using the existing `Shape Bloom` path or `M`; Supreme Bloom remains absent from normal tutorial play and can still be verified without console by focusing the playable and pressing `B`.
- Security/secret-scan status: changed files were scanned for private-key headers, `.env` references, token/provider prefixes, JWT-like strings, credential assignments, suspicious long secret-like values, analytics/trackers, backend/account/payment/ad hooks, broad permissions, machine-local paths, and scheduler additions. No findings.

## 2026-07-14 Cursed Thorn seal art pass

- Files changed: `assets/tiles/altar/cursed_thorn_seal.svg`, `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Cursed Thorn blockers now use original repo-owned occult seal art instead of the flat X treatment. The seal renders on active thorn blockers, guided thorn blockers, objective chips, the greenhouse dial, active order rows, and the Round 2 bouquet assembly payoff; hit/clear states now crack and shatter the seal while keeping the same adjacent-match, Pruning Shears, save, retry, and 64-tile behavior.
- Verification: `python3 scripts/verify_project.py`; `git diff --check`; inline playable JavaScript parse; local Chromium regression at 1280x720 and exact 390x844. The browser pass exercised fresh load, real first swap, Round 1 bouquet payoff, +120 coins, before/after greenhouse restoration, save/reload, `Next Order`, Round 2 Cursed Thorn start/hit/clear with the new art, Round 2 payoff with thorn seal bouquet ingredient, `Next Order`, Round 3 Bloodroot start/final payoff, fail -> visible `Retry Bouquet`, review `M` L/T/cross hook, review `B` Supreme Bloom hook, transient cleanup samples, 64 tiles, no overflow, and mobile 8 visible rows.
- Browser console/network status: final local Chromium pass observed 0 console warnings/errors, 0 page errors, 0 failed requests, and 0 broken images. Screenshots inspected include `/tmp/bloom-final-desktop-r2-start.png`, `/tmp/bloom-final-desktop-r2-hit.png`, `/tmp/bloom-final-desktop-r2-payoff.png`, `/tmp/bloom-final-desktop-failed.png`, and `/tmp/bloom-final-mobile-r2-start.png`.
- Vercel/GitHub Pages: not redeployed or checked in this local pass. `agent-browser` remains unavailable in this shell, so verification used temporary Playwright under `/tmp/bloom-pw`.
- Review hooks: L/T/cross can still be verified after focusing the playable and pressing `M`; Supreme Bloom can still be verified without console by focusing the playable and pressing `B`.
- Security/scope scan: changed files, changed additions, and the new SVG were scanned for private keys, `.env`, provider token prefixes, JWT-like strings, credential assignments, trackers/analytics, backend/account/payment/ad hooks, broad permissions, machine-local paths, and scheduler/cron additions. No findings; no rounds, currencies, boosters, blockers, services, dependencies, accounts, ads/IAP, analytics, or cron jobs were added.

## 2026-07-14 Round-transition collection seal cleanup

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: objective flights, greenhouse intake motes, and bouquet binding seals are now removed when a bouquet transitions, retries, or shuffles. A delayed seal also verifies that it still belongs to the round that launched it before rendering. Rapidly taking `Next Order` can no longer leave Round 1's `Saint's Offering` seal floating over the compact Round 2 objective row.
- Regression guard: the HTML verifier requires both the transition cleanup selector and the round-generation guard around delayed binding seals.
- Browser verification: local Chromium at 1280x720 and exact 390x844 completed Round 1, restored the greenhouse, immediately took `Next Order`, paused inside the former stale-effect window, played both guided Round 2 swaps, and played an ordinary follow-up cascade. Before the first Round 2 move, both viewports had 0 objective flights, 0 greenhouse intake flights, and 0 binding seals; after the guided Nightshade match, both showed exactly one current `+3 MOONLIT WREATH` seal and no `Saint's Offering` copy. Both sizes retained 64 enabled tiles in eight rows, the board above the fold, 0 broken images, 0 horizontal overflow, 0 console/page errors, and full transient cleanup after payoff.
- Security status: changed files and additions were scanned for credential/private-key signatures and new network, analytics, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings.
- Scope: no match logic, objective values, economy, progression, controls, assets, services, or save fields changed.

## 2026-07-14 Focused Cursed Thorn result copy

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible improvement: the first guided Moonlit Wreath swap now resolves to one compact dynamic result line (`Thorns shattered · +flower · +coins`) followed by `<target> next. Follow the glow.` The unrelated Round 1 `First bloom` sentence no longer leaks into Round 2, and the prior repeated order/tutorial paragraph is gone. Thorn damage, objective gains, coins, guidance tiles, cascades, and control timing are unchanged.
- Regression guard: the HTML verifier requires Round 1-only first-bloom copy, dynamic focused gain tokens, and the short follow-the-glow cue.
- Browser verification: after rebasing onto Hermes' photographic Moonlit/Bloodroot greenhouse art, local Chromium at 1280x720 and exact 390x844 completed Round 1, restored the greenhouse, entered Round 2, played both guided Thorn swaps, and played an ordinary follow-up cascade. The new Moonlit JPG rendered in the active stage and board backdrop; the first result rendered as one 29px desktop line and a two-line 46px mobile message. Both guided swaps stayed at one cascade, all transient effects cleared, and both sizes retained 64 tiles in eight rows with the board above the fold, 0 broken images, 0 horizontal overflow, and 0 console/page errors.
- Security and scope: changed files and additions were scanned for private-key/token signatures and new network, analytics, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings; no new mechanic, round, control, currency, or progression surface was added.

## 2026-07-14 Moonlit/Bloodroot greenhouse art pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `assets/greenhouse/moonlit_wreath_greenhouse.jpg`, `assets/greenhouse/bloodroot_compact_greenhouse.jpg`, removed `assets/greenhouse/moonlit_wreath_greenhouse.svg`, removed `assets/greenhouse/bloodroot_compact_greenhouse.svg`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 2 Moonlit Wreath and Round 3 Bloodroot Compact now use photographic repo-local greenhouse stage art derived from the existing restored greenhouse image instead of the flatter schematic SVGs. The active left rail, board backdrop, Round 2 upgrade payoff, and Round 3 final payoff now keep the restored/upgraded greenhouse visibly present while preserving the board-first layout and all existing mechanics.
- Browser verification: local Chromium via Playwright on `http://127.0.0.1:8765/playable/midnight_bloom_prototype.html`. Desktop 1280x720 exercised fresh load, real instructed swap, Black Candle lesson, Round 1 bouquet completion, +120 coins, 100-coin greenhouse restoration, before/after greenhouse, save/reload, `Next Order`, Round 2 Cursed Thorn teaching, unguided Round 2 play against the new Moonlit art, forced shuffle-exhaustion fail after real Round 2 play, visible `Retry Bouquet`, restored active Round 2, Round 2 completion, Round 3 start with Bloodroot art, and Round 3 final payoff. The final Round 3 completion used the existing hidden `demoCompleteBouquet()` verifier hook after real Round 3 play began because deterministic swaps did not always finish inside the test budget.
- Mobile verification: exact 390x844 Chromium exercised fresh load, real first swap, Round 1 completion/restoration, `Next Order`, Round 2 Cursed Thorn teaching, and the Moonlit stage art path. Active mobile samples retained 64 tiles, 7-8 complete rows, 0 horizontal overflow, 0 broken images, and 0 console/page/request failures.
- Browser/runtime status: desktop and mobile runs reported 64 tiles in active states, 0 broken images, 0 horizontal overflow, 0 console errors, 0 page errors, 0 failed network requests, and 0 transient effects at sampled stable states. Screenshots visually inspected: `/tmp/bloom_verify_desktop_r2_start.png`, `/tmp/bloom_verify_desktop_r2_complete.png`, `/tmp/bloom_verify_desktop_r3_start.png`, `/tmp/bloom_verify_desktop_r3_final.png`, and `/tmp/bloom_verify_mobile_r2_start.png`.
- Required checks run: `python3 scripts/verify_project.py`; `git diff --check`; inline playable JavaScript parse with `vm.Script`; focused desktop/mobile Chromium verifier `/tmp/bloom_full_verify.js`; precise changed-line/file scan for secrets, credentials/tokens, analytics/trackers, backend/accounts/payments/ads, broad permissions, machine-local runtime paths, and scheduler additions.
- Local host status: temporary static server on `127.0.0.1:8765`; stopped after verification. Vercel/GitHub Pages were not redeployed or checked. Push to `origin/main` was attempted after commit but failed with GitHub SSH `Permission denied (publickey)`, so live hosts are not expected to reflect this pass yet.
- Known issues: standalone `agent-browser` and `godot`/`godot4` were unavailable in this shell, so browser verification used Playwright Chromium and the pinned Godot smoke test could not run. Playwright `page.evaluate` also hit a serialization issue after later game states, so the verifier used Chrome DevTools Protocol for read-only DOM metrics.
- Review-hook preservation: L/T/cross match review remains available through the existing `Shape Bloom` path or focused `M`; Supreme Bloom remains available without console by focusing the playable and pressing `B`, and remains absent from normal tutorial play.
- Security/secret-scan status: no findings in changed additions, new asset filenames, or changed lines; no new round, economy, resource, blocker, booster, collection, account, backend, analytics, tracker, ad/IAP, service, secret, permission, dependency, debug control, copied Diablo asset, or scheduler was added.

## 2026-07-14 Focused Round 2 handoff copy

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible improvement: the one-tap `Next Order` handoff now opens Moonlit Wreath with one short instruction, `Match beside the glowing Cursed Thorns`, instead of concatenating the round intro, all four goals, two Thorn explanations, pattern-discovery copy, and reward text beneath the mobile board. Objectives, moves, glowing tutorial tiles, match feedback, retry behavior, and progression are unchanged.
- Regression guard: the HTML verifier requires the concise focused-handoff instruction and no longer accepts the removed paragraph-style Round 2 intro marker.
- Browser verification: local Chromium at 1280x720 and exact 390x844 used real authored swaps to complete Round 1, restored the greenhouse, reloaded the saved restored state, and clicked `Next Order`. Round 2 rendered the new instruction at 29px desktop and 31px mobile, retained 64 tiles in eight rows, kept the board above the fold, and showed 0 broken images, horizontal overflow, console errors, page errors, or failed requests. Settled desktop/mobile screenshots were visually inspected; mobile kept every board row visible and removed the prior seven-line text block.
- Security and scope: changed files and additions were scanned for private-key/token signatures and new network, analytics, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings; no round, mechanic, currency, control, or progression surface was added.

## 2026-07-14 Restoration ceremony compositor guard

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible correction: Hermes' greenhouse veil, cracks, roots, glass rays, coin stream, and before/after transformation remain intact, but the reveal now uses opacity, clipping, scale, rise, and rotation instead of animating CSS filters. Real Chromium captures showed the prior filter layers leaving opaque black compositor rectangles across the completed-order header and neighboring greenhouse art after the awakening class cleared on both desktop and exact 390x844 mobile.
- Regression guard: the HTML verifier now rejects `filter` properties and filter transitions across the complete greenhouse restoration keyframe set so this cross-layer rendering defect cannot quietly return.
- Browser verification: local Chromium used real authored swaps to complete Round 1, captured before/mid/settled restoration states at 1280x720 and 390x844, reloaded the saved restored state, and entered Round 2 through `Next Order`. Both sizes retained 64 tiles in eight rows, board-first hierarchy, one visible ceremony command, 0 broken images, 0 horizontal overflow, and 0 console, page, or failed-request errors; the settled captures were visually inspected and contained no black compositor blocks.
- Security and scope: changed files and changed lines were scanned for credential/private-key signatures and new network, tracking, account, payment, ad, backend, permission, or scheduler hooks. No findings; no new round or progression surface was added.

## 2026-07-14 Greenhouse restoration ceremony pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 1 payoff now has an unmistakable bouquet-to-greenhouse restoration ceremony. The before state adds a dark veil, crack mask, and muted `Before/After` labels; spending 100 coins removes the veil, fades the cracks, reveals restored glass, opens rays and root growth, animates coin motes into the greenhouse, marks `-100 spent`, and changes the one-tap button to `Next Order -> Moonlit Wreath`. No new rounds, currencies, controls, assets, services, trackers, accounts, ads, payments, permissions, or schedulers were added.
- Live baseline inspected before final verification: Vercel desktop `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?verify=live-baseline` and GitHub Pages mobile `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=live-baseline`; screenshots showed the current board-first 64-tile fresh state with no broken first viewport.
- Local browser verification: temporary static server `http://127.0.0.1:4319/playable/midnight_bloom_prototype.html?verify=ceremony-local`. A Chromium pass used real tile clicks for the fresh instructed swap, ordinary legal target-feeding play after the opening, Round 1 bouquet completion, before-restore screenshot, restore transaction, after-restore screenshot, save/reload, `Next Order`, Round 2 start, guided Round 2 play, failure -> `Retry Bouquet`, and exact 390x844 fresh mobile. It verified 64 tiles, the `-100` coin spend, restored-state CSS, no broken images, no horizontal overflow, no console/page/request errors, and transient cleanup by route completion.
- Screenshot evidence inspected: `work/baseline-desktop.png`, `work/baseline-mobile.png`, `work/live-vercel-baseline.png`, `work/live-pages-mobile-baseline.png`, `work/ceremony-before-desktop.png`, `work/ceremony-after-desktop.png`, and `work/ceremony-mobile.png`.
- Required checks run: `python3 scripts/verify_project.py`; `git diff --check`; inline playable JavaScript syntax extraction with `vm.Script`; focused local Chromium ceremony verifier using cached npx Playwright.
- Browser console/network status: local verifier captured 0 console errors, 0 page errors, and 0 failed requests. Live baseline screenshots loaded successfully.
- Known issues: standalone `agent-browser` was unavailable, so browser verification used Playwright. The Round 2 retry state was exposed with the existing failure path after real Round 2 play; the visible Retry click itself was exercised.
- Review-hook verification guidance: L/T/cross remains available after Round 1 via the existing `Shape Bloom` review button or focused `M`; Supreme Bloom remains absent from normal tutorial play and can still be verified without console by focusing the playable and pressing `B`.
- Security/secret-scan status: changed files and changed lines were scanned for private-key headers, `.env`, provider token prefixes, JWT-like strings, credential assignments, trackers/analytics, backend/account/payment/ad hooks, machine-local paths, broad permissions, and scheduler additions. No findings.

## 2026-07-14 Mobile greenhouse intake visibility guard

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Hermes' new harvest-to-greenhouse intake motes now select the first actually rendered greenhouse target. Desktop still feeds the hero restoration dial; 390px mobile now feeds the visible restored-greenhouse status instead of silently targeting a hidden desktop dial. Mobile bouquet collection seals were reduced to objective-card width so simultaneous gains no longer mask neighboring goals.
- Mobile rendering guard: animated blur/brightness was removed from the fixed intake motes after real Chromium captures showed transient black compositor bands cutting through the title at 390px. The motes retain their color, glow, arc, and motion through opacity, transforms, and shadows; the verifier rejects the offending filter signature.
- Verification: fresh Chromium runs at 1280x720 and 390x844 completed Round 1, greenhouse restoration, Next Order, both guided Round 2 swaps, and an ordinary move. The mobile guided move showed three intake motes targeting `restoredGreenhouseStatus`; desktop targeted `heroRestorationDial`. Both guided moves stayed at one cascade. Both runs retained 64 tiles in eight rows, kept the board above the fold, showed no broken images or horizontal overflow, logged no console or JavaScript errors, and cleared every transient effect after payoff. Save/reload and retry logic were not changed; Next Order was exercised end to end.
- Security and scope: no new round, progression surface, control, asset, service, network call, tracker, account, payment, ad, permission, secret, or scheduler was added. L/T/cross remain available through `Shape Bloom` or focused `M`; Supreme Bloom remains available through focused `B` and absent from the normal tutorial path.

## 2026-07-14 Cascade/refill choreography and greenhouse intake

- Files changed: `playable/midnight_bloom_prototype.html` and `docs/codex_build_notes.md`.
- Player-visible milestone: cascades now show a stronger refill choreography and clearer cause/effect into greenhouse progress. Harvested cells launch transient greenhouse intake motes toward the active greenhouse dial/stage; refill columns show brief altar wake channels; newly spawned refill tiles glow as they fall and settle. This is procedural/local CSS and DOM only: no new rounds, economies, assets, services, trackers, accounts, ads, payments, permissions, or schedulers.
- Live pre-edit inspection: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` was checked before editing at desktop 1440x1000 and exact 390x844 mobile. Both returned 200, showed 64 tiles, 0 broken images, 0 horizontal overflow, and 0 console/page/network errors. Desktop was board-first with the occult altar and withered greenhouse companion; mobile showed all 8 board rows in the first viewport.
- Local host status: temporary static server `http://127.0.0.1:8765/playable/midnight_bloom_prototype.html`; stopped after verification.
- Browser evidence: local Playwright/Chromium used real tile clicks on desktop 1440x1000 for fresh first load, first guided swap, authored Black Candle Vine lesson, Round 1 bouquet completion, +120 coin reward, visible before-restore state, `Restore Greenhouse`, after-restore state, save/reload, `Next Order`, Round 2 start, both guided Round 2 thorn moves, and an ordinary Round 2 play/cascade. The rebased behavior was verified in actual play: the guided thorn moves stayed one cascade each, while the ordinary follow-up produced 9 greenhouse intake flights, 67 board particles, cascade wave 4 mid-animation, Wild Chain x5 settled payoff, greenhouse revival moving to 87%, and 64 tiles.
- Retry/save evidence: save/reload preserved the restored Round 1 state with `Next Order` visible. Round 2 failure showed visible `RETRY BOUQUET`, 64 tiles, and the withered objective; after the retry setup, transient cleanup returned refill columns, newborn tiles, intake flights, harvest motes, and board particles to 0. Clicking Retry restored Round 2 to 17 moves, 0/8 Nightshade, 0/7 Amber Seed, 0/5 Thorn Rose, 0/3 Cursed Thorn, and 64 tiles. The focused Round 2 layout intentionally hides Shuffle, so move exhaustion used the same runtime shuffle path after real Round 2 play, then verified and clicked the visible Retry button.
- Mobile evidence: exact 390x844 local Chromium used real guided and Black Candle tile clicks, restoration, and `Next Order`. Fresh load and Round 2 start both had 64 tiles, all 8 board rows visible, 0 horizontal overflow, 0 broken images, and 0 console/page/network errors. The guided swap on mobile showed 3 refill columns, 3 newborn refill tiles, and 3 refill channels; the Black Candle impact showed 8 refill columns, 8 newborn refill tiles, and 8 refill channels while preserving the compact first viewport.
- Required checks run: `python3 scripts/verify_project.py`; `git diff --check`; inline playable JavaScript syntax extraction with `new Function(...)`; local Playwright desktop and exact 390x844 mobile interaction/regression passes.
- Browser console/runtime status: live pre-edit and local post-edit Playwright checks observed 0 console messages, 0 page errors, and 0 failed HTTP requests.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy happened in this local pass before commit/push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: standalone `agent-browser` was unavailable in this shell, so verification used temporary Playwright tooling outside the repo. No player-facing issue found in the first-three-order route.
- How to trigger and verify L/T/cross matches without console: after Round 1, use the existing `Shape Bloom` review button or focused `M` key until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears; the source verifier still protects the match-shape grammar.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing review hook shows the `SUPREME BLOOM!` overlay and returns to a 64-tile board. Supreme Bloom remains absent from normal tutorial play.
- Security/secret-scan status: changed additions were scanned for private-key headers, `.env`, token/credential shapes, analytics/trackers, backend/account/payment/ad hooks, broad permissions, machine-local runtime paths, and scheduler additions. No findings.

## 2026-07-14 Guided Cursed Thorn cascade guard

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Altar Drift now waits until the two focused Round 2 guidance moves are finished, and both teaching moves stay deliberately single-wave. The first Cursed Thorn lesson remains one clean adjacent-match result instead of forcing a four-wave, roughly 2.3-second chain that collected most of two bouquet goals before control returned. Ordinary unguided Round 2+ play keeps one target-aware follow-up cascade instead of two forced baits, preserving chain spectacle without nearly completing the order in one move. Per-wave chain labels now update in one fixed board position rather than leaving overlapping labels across the mobile grid; the final Wild Chain reward remains the single payoff banner.
- Regression protection: the source verifier now protects the Altar Drift setup/seeding hooks and the explicit guided-lesson suppression path. Round 1's authored opening and Black Candle cap remain unchanged.
- Verification: the project verifier and whitespace check pass. Fresh Chromium runs at 1280x720 and 390x844 completed Round 1, restored the greenhouse, entered Round 2, played both guided swaps, and then played an ordinary swap. Each guided move stayed at one cascade; ordinary play produced a two-wave Wild Chain on both viewports. Both runs retained 64 enabled tiles in eight rows, kept the board above the fold, showed no broken images or horizontal overflow, logged no console or JavaScript errors, and cleared all transient particles after the payoff.
- Scope preserved: no new round, progression surface, control, blocker, booster, economy, save field, asset, service, tracker, account, payment, ad, permission, or scheduler was added.

## 2026-07-14 Altar drift cascade pass

- Files changed: `playable/midnight_bloom_prototype.html` and `docs/codex_build_notes.md`.
- Player-visible milestone: ordinary post-onboarding clears now get a capped order-aware `Altar Drift` refill assist. After a normal animated clear, refill tiles first try to complete current bouquet targets; if no natural chain appears, the altar seeds one visible current-order three-match for the next cascade wave. The authored Round 1 opening and Black Candle lesson remain capped with `maxCascades: 1`, so the tutorial path is preserved while Round 2+ unguided play reliably produces satisfying chain feedback.
- Live pre-edit inspection: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` was visually checked before editing at desktop 1365x900 and exact 390x844. Screenshots inspected: `/tmp/bloom-live-desktop.png` and `/tmp/bloom-live-mobile-390x844.png`. Both showed 64 tiles, 8 complete mobile rows, no visible future diary sections, and no broken first viewport.
- Local host status: temporary static server `http://127.0.0.1:8765/playable/midnight_bloom_prototype.html`; stopped after verification.
- Browser evidence: local Playwright/Chromium used real clicks on desktop 1365x900 for fresh load, first guided swap, taught Black Candle swap, bouquet reward, greenhouse before/after restoration, save/reload, `Next Order`, Round 2, unguided Round 2 normal play through the changed cascade path, diagnostic fail state, visible `Retry Bouquet`, 64-tile checks, transient cleanup, broken-image checks, console/page/network error capture, and screenshots. Exact 390x844 mobile verified fresh hierarchy, 64 tiles, all 8 rows visible, no horizontal overflow, no broken images, no visible `Complete Bouquet`/`Shape Bloom`, and no visible future diary sections.
- Screenshot evidence inspected: `/tmp/bloom-local-desktop-fresh.png`, `/tmp/bloom-local-mobile-390x844-fresh.png`, `/tmp/bloom-local-before-restore.png`, and `/tmp/bloom-local-after-restore.png`.
- Required checks run: `python3 scripts/verify_project.py`; `git diff --check`; focused Playwright regression from `/tmp/bloom-qa.spec.js` with 2 passing tests; changed-file scan for private-key headers, `.env`, provider token prefixes, JWTs, credential assignments, trackers/backends/accounts/payments/ads, broad permissions, machine-local paths, and scheduler additions.
- Browser console/runtime status: local Playwright regression captured 0 console errors, 0 page errors, and 0 failed HTTP requests.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy happened in this local pass before commit/push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: standalone `agent-browser` was unavailable in this shell, so browser verification used Playwright. The retry test used a diagnostic failed Round 2 state after real Round 2 play to expose the visible `Retry Bouquet` button reliably.
- Review-hook preservation: existing L/T/cross `Shape Bloom`/focused `M` and Supreme Bloom/focused `B` paths were preserved; Supreme Bloom remains absent from normal tutorial play.
- Security/secret-scan status: no secrets, environment files, trackers, analytics, backend/account/payment/ad hooks, broad permissions, machine-local paths, or scheduler additions were found in changed files.

## 2026-07-14 Procedural ritual audio arc

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the existing WebAudio layer now has a cohesive stage-aware ritual mix for swap, invalid swap, match, settle, Black Candle Vine, bouquet completion, greenhouse restoration, retry, and next-order handoff. It adds withered/moonlit/bloodroot scales, soundscape ducking, ritual pulses, arpeggiated bouquet/restoration motifs, and read-only audio telemetry for verification. No controls, assets, rounds, economies, saves, services, trackers, accounts, payments, ads, permissions, or scheduled jobs were added.
- Live pre-edit inspection: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` was checked at 1280x720 and exact 390x844 before editing. Both had 64 tiles, 8 complete visible rows, 0 horizontal overflow, 0 broken images, and no console/page/network errors. Screenshots inspected: `/tmp/bloom_audio_live_desktop_before.png` and `/tmp/bloom_audio_live_mobile390_before.png`.
- Local host status: temporary static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; cleaned up after verification.
- Browser evidence: local Chromium/Playwright real clicks on desktop 1280x720 exercised fresh load, first guided swap, taught Black Candle swap, Round 1 bouquet payoff, +120 coin reward, `Restore Greenhouse` spending 100 coins, visible before/after restored greenhouse state, save/reload preserving the restored state, `Next Order`, Round 2 guided Cursed Thorn action, ordinary unguided Round 2 play, diagnostic failed state, and real visible `Retry Bouquet`. Exact 390x844 mobile exercised fresh load, first guided swap, bouquet payoff, restore, `Next Order`, and Round 2 guided play.
- Audio evidence: desktop gesture instrumentation recorded real `AudioContext`, oscillator, gain, oscillator `start`, and buffer-source `start` activity. The audio probe recorded `complete`, `restore`, `handoff`, and `retry` motifs on the player path; mobile recorded `complete`, `restore`, `handoff`, match, and settle motifs. A no-`AudioContext` mobile probe stayed silent-safe with 64 tiles, 0 overflow, 0 broken images, 0 console/page/network errors, and zero scheduled voices.
- Active-state metrics: desktop and mobile preserved 64 tiles, zero horizontal overflow, zero broken images, and no console/page/request errors. Exact 390x844 mobile kept 8 complete active board rows in the sampled fresh, post-guided, Round 2 start, and Round 2 guided states.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted inline playable `node --check`, pinned Godot 4.2.2 smoke test, focused Chromium desktop/mobile interaction regression with audio instrumentation, and no-AudioContext silent-safe probe passed.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy happened in this local pass before commit/push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: no player-facing issues found in the verified first-three-order route. The `Retry Bouquet` surface was exposed through a diagnostic failed Round 2 state after real Round 2 play; the retry click itself was real.
- Review-hook preservation: existing L/T/cross `Shape Bloom`/focused `M`, Supreme Bloom/focused `B`, and prototype completion hook markers were preserved; Supreme Bloom remains absent from normal tutorial play.
- Security/secret-scan status: changed files were scanned for private-key headers, `.env` additions, provider token prefixes, JWTs, suspicious credential assignments, trackers/analytics SDKs, backend/account/payment/ad hooks, machine-local paths, broad permissions, and scheduler additions. No findings.

## 2026-07-14 Invalid-swap rejection clarity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: an illegal adjacent swap now places a brief crimson crossed seal over both refused tiles. This makes the existing shake, haptic, sound, and `No bloom - follow the glowing pair` cue unmistakable against the richer occult socket art without changing the board, moves, tutorial, saves, controls, or balance.
- Browser verification: local Chromium at 1280x720 and exact 390x844 performed a real illegal two-tile swap, confirmed two crossed rejection marks, waited for their cleanup, then completed the restored guided opening swap. Both viewports retained 64 tiles, all eight visible rows, zero horizontal overflow, zero broken images, and no console, page, or request errors. Reduced-motion mobile retained the static crossed seal while disabling its animation.
- Required checks: `python3 scripts/verify_project.py` and `git diff --check` passed. The source verifier now protects the rejection overlay and animation markers.
- Vercel/GitHub Pages status: not redeployed or checked after editing in this pre-commit note. Known issues: none found in the changed first-minute interaction.
- Security status: no services, trackers, analytics, accounts, backend hooks, ads, payments, secrets, permissions, assets, or progression surfaces were added; changed files receive the required credential-shaped scan before commit.

## 2026-07-14 Round 1 restoration cost clarity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the Round 1 payoff ledger now labels its `-100` coin transaction as `Restore cost` instead of the ambiguous `Greenhouse`. After restoration it reads `-100 spent / Restore cost`; later-round `Greenhouse XP` labels are unchanged. No mechanics, balance, controls, UI surfaces, saves, or progression systems changed.
- Browser verification: local Chromium used real guided swaps at 1280x720 and exact 390x844, completed the First Bouquet, verified `+120 Bouquet coins / -100 Restore cost / Next Moonlit Wreath`, clicked the visible `Restore Greenhouse · 100 coins`, inspected the withered-to-restored artwork, clicked `Next Order`, and reached the Round 2 Cursed Thorn lesson. Both viewports preserved 64 tiles, at least eight visible rows in active play, zero overflow, zero broken images, and no console, page, or request errors.
- Required checks: `python3 scripts/verify_project.py` and `git diff --check` passed. Changed files were scanned for credential-shaped strings, private-key headers, environment files, trackers, analytics, backend/account/payment/ad hooks, machine-local paths, and broad permissions with no findings.
- Vercel/GitHub Pages status: not redeployed or checked in this local pass before commit/push. Known issues: none found in the changed first-minute route.
- L/T/cross review remains available after the focused opening through the existing `Shape Bloom` path or focused `M` key hook; Supreme Bloom remains available through focused `B` and absent from the normal tutorial path.

## 2026-07-14 Black Candle impact status alignment

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the existing lower ritual status now acknowledges the taught Black Candle Vine sweep at its impact frame instead of retaining the stale tile-selection instruction. The success line lasts only until the richer bouquet summary is ready, so the active mobile viewport presents one coherent state without adding UI or changing mechanics.
- Browser verification: local Chromium used real guided tile clicks at 1280x720 and exact 390x844. A 100ms mobile timing trace verified the success banner and ritual status appear with the first line-relic particles, then hand off to the completion summary. Both viewports retained 64 tiles, all eight visible rows, tutorial `Wild Chain` at 0, zero overflow, zero broken images, and no console, page, or request errors; the bouquet payoff and visible `Restore Greenhouse` remained intact.
- Required checks: `python3 scripts/verify_project.py` and `git diff --check` passed. Changed files were scanned for credential-shaped strings, private-key headers, environment files, trackers, analytics, backend/account/payment/ad hooks, machine-local paths, and broad permissions with no findings.
- Vercel/GitHub Pages status: not redeployed or checked in this local pass before commit/push. Known issues: none found in the changed first-minute route.
- L/T/cross review remains available after the focused opening through the existing `Shape Bloom` path or focused `M` key hook; Supreme Bloom remains available through focused `B` and absent from the normal tutorial path.

## 2026-07-14 Black Candle lesson success acknowledgement

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the authored Round 1 four-match now replaces its stale instruction at impact with `Black Candle Vine! Row cleared.` or the corresponding column message. The lesson immediately acknowledges success while the existing lane sweep is visible; no new UI, control, reward, round, economy, save data, or system was added.
- Browser verification: local Chromium used real guided tile clicks at 1280x720 and exact 390x844. Both completed the Thorn Rose opening, triggered the taught Bone Star four-match, showed the new success copy during the sweep, preserved 64 tiles and all eight visible rows, kept tutorial `Wild Chain` at 0, reached the bouquet payoff and visible `Restore Greenhouse`, had no horizontal overflow or broken images, and emitted no console, page, or request errors.
- Required checks: `python3 scripts/verify_project.py` and `git diff --check` passed. Changed files were scanned for credential-shaped strings, private-key headers, environment files, trackers, analytics, backend/account/payment/ad hooks, machine-local paths, and broad permissions with no findings.
- Vercel/GitHub Pages status: not redeployed or checked in this local pass before commit/push.
- Known issues: none found in the changed first-minute route.
- L/T/cross review remains available after the focused opening through the existing `Shape Bloom` review path or focused `M` key hook; Supreme Bloom remains available through focused `B` and remains absent from the normal tutorial path.
## 2026-07-14 Occult altar socket art pass

- Files changed: `assets/board/occult_altar_socket.svg`, `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: every match board tile now sits in an original repo-local stone/brass occult altar socket, with richer board substrate lighting and stage-aware withered/moonlit/bloodroot tinting. This replaces the flatter token-bed treatment while preserving the heartbeat, saves, retry, next-order flow, 64-tile board, and all existing mechanics. No new economy, external service, monetization, scheduler, access-scope, or copied-asset surface was added.
- Live/local pre-edit status: Vercel production and local static previews were visually inspected at 1280x720 and exact 390x844 before editing. All four loads had 64 tiles, 8 visible board rows, no horizontal overflow, 0 broken images, and no console/page/network errors.
- Local host status: temporary static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; cleaned up after verification.
- Browser evidence: Chromium/Playwright real clicks on desktop 1280x720 exercised first load, invalid swap refusal, taught opening, Round 1 bouquet payoff, Restore Greenhouse, save reload, Next Order, Round 2 Cursed Thorn taught move, unguided ordinary Round 2 play, Round 2 payoff, Next Order, Bloodroot Round 3 start, and Round 3 payoff. Exact 390x844 mobile exercised first load, taught opening, Round 1 bouquet/restoration/reload/Next Order, Round 2 taught move, and unguided ordinary play. The changed socket CSS was present in active states, with moonlit and bloodroot board tint verified.
- Active-state metrics: desktop active states preserved 64 tiles, no overflow, 0 broken images, and up to 8 visible rows; Round 2 start had 7 rows at 1280x720 due to the handoff banner while unguided play returned to 8. Exact 390x844 mobile active states preserved 64 tiles, at least 8 visible rows, no overflow, 0 broken images, and the new socket asset loaded in tile CSS.
- Retry/save path: after real Round 2 play, a diagnostic withered state was rendered to expose `Retry Bouquet` without relying on hidden focused-slice controls; the visible Retry click was real on desktop and exact 390x844 mobile, restoring Round 2 to 17 moves, 64 tiles, no overflow, no broken images, and moonlit socket tint.
- Review-hook verification: focused real `M` keypress verified the L/T/cross/shape-demo path with 64 tiles, no overflow, no broken images, and no console/network errors. Focused real `B` keypress verified `SUPREME BLOOM!` with 64 tiles, no overflow, no broken images, and no console/network errors.
- Browser console/network status: final local desktop, mobile, diagnostic retry, and review-hook runs reported 0 console messages, 0 page errors, and 0 failed browser requests.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted inline playable `node --check`, pinned Godot 4.2.2 smoke test, focused Chromium regression across desktop and exact 390x844 mobile, review-hook keypress checks, and changed-line security scan passed.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy happened in this local pass before commit/push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: no player-facing issues found in the verified route. The retry test used a diagnostic withered state after real Round 2 play because focused first-three active composition intentionally hides Shuffle, making random real-move failure unreliable before accidental completion.
- Security/secret-scan status: changed lines and the new SVG asset were scanned for credential material, local machine paths, telemetry/service/auth/payment/ad surfaces, access-scope changes, and scheduler additions. No findings.
## 2026-07-14 Wild Chain cascade payoff pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: ordinary unguided shaped/line/cascade clears now earn a capped `Wild Chain` coin bonus using the existing coin heartbeat, with an in-board occult banner, chain lash particles, board glow, and ritual-log explanation. Reduced-motion mode keeps the static payoff but suppresses its board/lash motion. No new rounds, currencies, boosters, blockers, controls, economies, saves, backend, accounts, analytics, ads/IAP, trackers, SDKs, assets, cron jobs, or permissions were added.
- Live-host pre-edit status: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` was checked at 1280x720 and exact 390x844 before editing. Both had 64 tiles, 8 visible board rows, no horizontal overflow, 0 broken images, and no console/page/network errors. Desktop and mobile screenshots were inspected.
- Local host status: temporary static server `http://127.0.0.1:8010/playable/midnight_bloom_prototype.html`; cleaned up after verification.
- Browser evidence: Chromium/Playwright desktop 1280x720 used real tile clicks to complete Round 1, verified bouquet reward, clicked `Restore Greenhouse`, clicked `Next Order`, reloaded to prove save persistence, clicked an ordinary Round 2 4-match board state to trigger `Wild Chain +10`, induced visible fail state, clicked visible `Retry Bouquet`, and pressed real `B` for Supreme Bloom. Exact 390x844 mobile loaded locally, clicked the instructed first swap, preserved 64 tiles, and kept 8 visible rows.
- Wild Chain evidence: local desktop board data reported `lastWildChainBonus=10`, the in-board banner read `Wild Chain +10`, 64 tiles remained, and the screenshot was inspected. The final ritual copy distinguishes total coins from the included Wild Chain bonus to avoid double-count ambiguity.
- Required checks run: `python3 scripts/verify_project.py`; `git diff --check`; inline playable JavaScript syntax via `node --check /tmp/bloom-inline.js`; focused browser regression for desktop and exact 390x844 mobile; 64-tile checks; no horizontal overflow; zero broken images; no console/page/network errors; save/reload; visible fail -> `Retry Bouquet`; bouquet reward -> greenhouse restoration -> `Next Order`; and the changed unguided Wild Chain behavior.
- Browser console/runtime status: no console messages, page errors, or failed requests in live pre-edit checks or local desktop/mobile regression.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy happened in this local pass before commit/push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the verified route. The Wild Chain board was arranged in-browser after the normal Round 1 -> restored Round 2 handoff so the bonus was deterministic; the triggering action was still an ordinary tile swap, not a debug control.
- How to trigger and verify L/T/cross matches without console: after the focused opening, use the existing `Shape Bloom` review path where visible or focus the playable and press `M`; demos cycle through `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` while preserving 64 tiles.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` and return to a 64-tile board.
- Security/secret-scan status: changed files were scanned for private-key headers, `.env`, provider token prefixes, JWTs, suspicious credential assignments, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, and cron-like additions. No findings.

## 2026-07-14 Compact multi-goal objective pass

- Files changed: `playable/midnight_bloom_prototype.html` and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 2+ multi-goal objectives now use a compact order grid with real target counts, dense mobile labels, normalized Cursed Thorn markup, and no extra controls. This improves ordinary restored-greenhouse play by keeping the board higher while preserving the match -> bouquet -> coins -> greenhouse -> next order heartbeat.
- Live-host pre-edit status: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?codex-before=20260714` returned HTTP 200 on desktop and exact 390x844 mobile, with 64 tiles, 8 complete visible rows, no overflow, 0 broken images, and no console/page/network errors. Screenshots inspected: `/tmp/bloom-live-desktop-before.png`, `/tmp/bloom-live-mobile390-before.png`.
- Local host status: temporary static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; cleaned up after verification.
- Browser evidence: Chromium/Playwright real clicks on desktop 1440x1000 and exact 390x844 mobile exercised fresh load, invalid swap refusal, two instructed Round 1 swaps, bouquet completion, Restore Greenhouse, save/reload, Next Order, Round 2 guided thorn move, one unguided Round 2 legal swap, visible failed bouquet, and real `Retry Bouquet`.
- Active-play verification: 64 tiles throughout; exact 390x844 active states kept 8 complete board rows; zero horizontal overflow; zero broken images; zero console messages; zero page errors; zero failed browser requests. Stable payoff/restored states preserve 64 tiles while intentionally focusing the restoration surface rather than the full board.
- Screenshots inspected: `/tmp/bloom-mobile390-round2-start.png`, `/tmp/bloom-mobile390-round2-unguided.png`, `/tmp/bloom-desktop1440-round2-start.png`, `/tmp/bloom-mobile390-failed-retry-visible.png`, plus local before/after compact objective screenshots under `/tmp/bloom-*-compact-*.png`.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, inline playable JavaScript syntax check with `new Function(...)`, desktop/mobile Playwright regression described above, and precise changed-file credential/tracker/backend/account/permission/path scan passed.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy during this local pass before commit/push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the verified focused route. The retry test reached failure by making a real Round 1 match and then using real Shuffle clicks to exhaust moves; the `Retry Bouquet` click itself was real.
- How to trigger and verify L/T/cross matches without console: after the focused opening, use the existing `Shape Bloom` review path where visible or focus the playable and press `M`; demos cycle through `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` while preserving 64 tiles.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing hook should show `SUPREME BLOOM!` and return to a 64-tile board.
- Security/secret-scan status: changed files were scanned for private-key headers, known token prefixes, JWTs, credential assignments, `.env`, trackers/analytics SDKs, backend/account/payment/ad hooks, broad permissions, and machine-local paths. No findings.

## 2026-07-14 Cursed Thorn action/target clarity pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 2 now distinguishes the Cursed Thorn lesson's three roles at a glance. Blockers use red cross seals, the future three-flower lane uses a restrained shared glow, and the two actionable swap tiles keep the bright gold pulse and directional arrow. The adjacent-match rule, authored teaching swap, objectives, moves, progression, and controls are unchanged.
- Scope constraints preserved: no new rounds, currencies, blockers, boosters, controls, saves, backend, accounts, analytics, ads, trackers, SDKs, secrets, permissions, or copied assets.
- Verification: `python3 scripts/verify_project.py`, `git diff --check`, and the changed-line credential scan passed. Real-browser checks at 1280x720 and exact 390x844 exercised the Round 1 payoff/restoration/Next Order handoff and the changed Round 2 swap end to end: 3 blocker seals, 2 lane cells, 2 swap tiles, 64 tiles, 8 rows, 0 broken images, 0 overflow, 0 console errors, and Cursed Thorn progress reaching 3/3 after one move. Reduced-motion disables the new blocker pulse.

## 2026-07-14 Bouquet assembly payoff pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: completed focused bouquets now visibly assemble inside the existing payoff trophy from that order's actual target flowers, with a binding ring, target-count ingredient seals, thorn seal for Moonlit Wreath, stage-colored vine wrap, and a stable bound state after reload. This strengthens match flowers -> bouquet -> coins -> greenhouse restoration -> next order without adding controls, economies, rounds, assets, saves, or systems.
- Live-host pre-edit status: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html?baseline-check=codex-20260714` returned HTTP 200 on desktop and exact 390x844 mobile, with 64 tiles, 8 visible rows, no overflow, 0 broken images, and no console/page/network errors.
- Local host status: temporary static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; cleaned up after verification.
- Browser evidence: Chromium/Playwright real coordinate clicks on desktop 1280x720 and exact 390x844 mobile exercised fresh load, real instructed swaps, Round 1 bouquet assembly payoff, Restore Greenhouse before/after, save/reload, Next Order, Round 2 ordinary legal play, forced Round 2 failure -> real `Retry Bouquet`, Round 2 completion/payoff with Nightshade/Amber/Thorn/Cursed Thorn assembly, Round 3 continuation/final Bloodroot assembly, 64 active tiles, at least 8 visible active rows, no horizontal overflow, 0 broken images, 0 console/page/request errors, and transient cleanup back to 0 in stable payoff/final states.
- Screenshots inspected: `/tmp/bloom_desktop_full_r1_payoff.png`, `/tmp/bloom_desktop_full_r2_payoff.png`, `/tmp/bloom_desktop_full_r3_final.png`, `/tmp/bloom_mobile_full_r1_payoff.png`, `/tmp/bloom_mobile_full_r2_payoff.png`, `/tmp/bloom_mobile_full_r3_final.png`, plus live baseline screenshots under `/tmp/bloom_live_*_baseline.png`. The first mobile title layer let coin burst cross the title; final CSS raises the title layer and tightens mobile line height.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, inline playable JavaScript syntax check with `new Function(...)`, local desktop/mobile Playwright first-three-order regressions, live Vercel desktop/mobile baseline checks, and changed-file credential/tracker/path/permission/cron scan passed.
- Browser console/network status: no local or live Playwright console messages, page errors, or failed requests were observed in the checked flows.
- Known issues: Round 2 failure was forced after a real Round 2 move to expose `Retry Bouquet` quickly; the retry click and resumed completion were real. Mobile payoff panels can extend below the first viewport, but active play remains board-first with all 8 rows visible and no horizontal overflow.
- How to trigger and verify L/T/cross matches without console: after the focused opening, use the existing `Shape Bloom` review path where visible or focus the playable and press `M`; demos cycle through `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` while preserving 64 tiles.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing hook should show `SUPREME BLOOM!` and return to a 64-tile board.
- Security/secret-scan status: changed files were scanned for private-key headers, provider token prefixes, JWTs, suspicious credential assignments, trackers/analytics SDKs, machine-local paths, broad permissions, and cron additions. No findings.
- Foreman visual QA: independent desktop and 390x844 review accepted the substantial assembly, then removed duplicated target-count badges from the bouquet stems. The radial ingredient seals are now the sole count labels inside the trophy; verifier coverage prevents the duplicate labels from returning.

## 2026-07-14 Greenhouse restoration dial pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the active greenhouse now has a stage-aware restoration dial embedded in the existing greenhouse art. It shows current greenhouse stage, real bouquet/restoration percent, and compact target seals driven by existing objective/thorn progress, so the first-three-order heartbeat visibly connects matches -> bouquet progress -> greenhouse restoration/upgrades without adding controls, currencies, saves, rounds, or systems.
- Scope constraints preserved: no Round 58 work, no new rounds/economies/boosters/blockers/backend/accounts/analytics/ads/IAP/trackers/SDKs/secrets/cron/permissions, no copied Diablo assets, no save-shape changes, no ordinary visible debug controls, and active Round 1 still has 64 tiles, zero non-tile buttons on first load, compact objective/moves, retry, Next Order, and first instructed swap.
- Live-host pre-edit status: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` returned HTTP 200 with `x-vercel-id: iad1::zt4bl-1783986446213-9b5cb9665afe`; desktop and exact 390x844 live/local baselines matched, with 64 tiles, no broken images, no console/page/request errors, and no horizontal overflow. GitHub Pages was not checked.
- Browser verification: local static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; Chromium/Playwright real mouse coordinate clicks on desktop 1280x720 and exact 390x844 mobile. The guided route exercised fresh load, first instructed swap, bouquet completion, coin reward, Restore Greenhouse before/after, save/reload, Next Order, Round 2 ordinary unguided play, forced visible failure followed by real `Retry Bouquet`, Round 2 completion, Round 3 completion, and final payoff.
- Browser status: desktop and mobile guided routes reported 0 console messages, 0 page errors, 0 failed requests, 0 broken images, and 0 horizontal overflow. Active mobile states kept at least 6 complete rows; sampled fresh/mobile states kept all 8 rows.
- Visual screenshots inspected: `/tmp/bloom_desktop_guided_after_first.png`, `/tmp/bloom_desktop_guided_r2_unguided.png`, `/tmp/bloom_mobile_guided_after_first.png`, `/tmp/bloom_mobile_guided_r2_unguided.png`, `/tmp/bloom_desktop_guided_final.png`, and `/tmp/bloom_mobile_guided_final.png`. First dial draft was rejected for clutter and mobile clipping; final dial is compact and legible.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, inline playable JavaScript syntax check with `new Function(...)`, desktop/mobile guided Playwright routes, and changed-file credential/tracker/path/permission/cron scan passed.
- Known issues: none found in the focused first-three-order route. The failure state was forced after real Round 2 play to reach `Retry Bouquet` quickly; the retry click itself was real.
- How to trigger and verify L/T/cross matches without console: after the focused opening, use the existing `Shape Bloom` review path where visible or focus the playable and press `M`; demos cycle through `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` while preserving 64 tiles.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing hook should show `SUPREME BLOOM!` and return to a 64-tile board.
- Security/secret-scan status: changed files were scanned for private-key headers, `.env`, provider token prefixes, JWTs, suspicious credential assignments, trackers/analytics SDKs, broad permissions, machine-local paths, and cron-like additions. No findings.

## 2026-07-13 Swap/cascade game-feel pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: ordinary swaps now have distinct accepted-swap glow, invalid-swap refusal, quieter landing sparks, a subtle procedural settle tick, bouquet-seal pulse, and next-order readiness pulse. Cascade timing was tightened so control returns promptly while chained drops remain visibly/audibly legible. Reduced-motion keeps the new motion effects disabled, and audio-denied browsers still play silently.
- Scope constraints preserved: no Round 58/further rounds, no new currencies/boosters/blockers/accounts/backend/analytics/ads/IAP/trackers/SDKs/secrets/cron/permissions, no copied Diablo assets, no save-shape changes, no new visible debug controls, and the first-three-order heartbeat remains match flowers -> bouquet -> coins -> greenhouse restoration -> next order.
- Browser verification: local static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; Chromium/Playwright real mouse/coordinate clicks on desktop 1280x720 and exact 390x844 mobile. Fresh load, invalid swap, two authored Round 1 legal swaps, bouquet completion, Restore Greenhouse, Next Order, save/reload into Round 2, one ordinary unguided Round 2 legal swap, forced visible failure, and real `Retry Bouquet` were exercised.
- Interaction evidence: desktop observed 2 invalid-swap tiles, 2 valid-swap tiles, settle sparks capped at 3, bouquet seal pulse, next-order pulse, 64 tiles after settlement, 8 complete rows in active states, no overflow, and no broken images; settlement timings were about 962ms, 1317ms, and 988ms for the checked legal swaps. Mobile observed the same core states plus a 2-cascade unguided Round 2 chain with 6 capped settle sparks; final retry restored 17 moves, 64 tiles, 8 complete rows, no overflow, and transient board particles back to 0.
- Visual screenshots inspected: `/tmp/bloom_gamefeel2_desktop1280_complete_pulse.png`, `/tmp/bloom_gamefeel2_desktop1280_restored.png`, `/tmp/bloom_gamefeel2_mobile390_round2_unguided.png`, and `/tmp/bloom_gamefeel2_mobile390_retry_restored.png`. First mobile cascade draft was too cluttered, so landing sparks were reduced to 3-4 per wave before the final pass.
- Browser console/network status: final desktop and mobile runs reported 0 console messages, 0 page errors, and 0 failed requests.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, inline playable JavaScript syntax check with `new Function(...)`, and the two-viewport Playwright flow passed.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: desktop deterministic route did not produce a multi-cascade chain in the final run; exact 390x844 mobile did produce and verify a 2-cascade chain. The failed Round 2 state was forced after a real unguided Round 2 swap to reach `Retry Bouquet` quickly; the retry click itself was real.
- How to trigger and verify L/T/cross matches without console: after the focused opening, use the existing `Shape Bloom` review path where visible or focus the playable and press `M`; demos cycle through `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` while preserving 64 tiles.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing hook should show `SUPREME BLOOM!` and return to a 64-tile board.
- Security/secret-scan status: changed files were scanned for private-key headers, `.env` additions, known provider token prefixes, JWTs, suspicious credential assignments, trackers/analytics SDKs, broad permissions, machine-local paths, and cron-like additions. No findings.

## 2026-07-13 First-three-order bouquet payoff trophy

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: completed focused orders now get a premium sealed-bouquet trophy beside the greenhouse transformation. The trophy uses existing repo-local occult flower assets, actual order targets/counts, and stage-specific sealed/restored/moonlit/bloodroot styling. The existing transaction row remains the single source for coin, greenhouse, and next-action amounts, avoiding duplicated reward tokens in the trophy. It materially improves the heartbeat after matching: completed bouquet -> coins -> greenhouse restoration/upgrade -> next order.
- Scope constraints preserved: no Round 58 work, no new economy/currency/booster/blocker/backend/account/analytics/tracker/ads/IAP/cron/secrets/permissions, no copied Diablo assets, no save-shape changes, and no changes to deterministic first lesson, retry, 64-tile active board, curated tile identity, or existing review hooks.
- Live-host pre-edit inspection: Vercel production `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` was visually checked before editing on desktop and exact 390x844 mobile. It returned 200, rendered 64 tiles, no broken images, no horizontal overflow, and no console/page/request errors. Screenshots: `/tmp/bloom_live_desktop_before.png`, `/tmp/bloom_live_mobile390_before.png`.
- Local browser verification: temporary static server `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; Chromium via temporary Playwright under `/tmp/bloom_pw`.
- Focused regression exercised: fresh load, real instructed Round 1 swap, bouquet/coins/restoration, save/reload, `Next Order`, Round 2 handoff, real Round 2 swap, failure -> visible `Retry Bouquet` -> retry restore, Round 2 payoff, Round 3 handoff, Round 3 final payoff, and exact 390x844 mobile fresh/real swap/Round 1 payoff/restored payoff/Round 2 handoff.
- Browser status: final scripted desktop and mobile regression reported 0 console errors, 0 page errors, 0 failed requests, 0 broken images, 0 horizontal overflow, active boards at 64 tiles, and at least eight visible active rows in sampled active desktop/mobile states. Transient cleanup was 0 in stable payoff/retry/final states.
- Visual screenshots inspected: `/tmp/bloom_reg_desktop_round1_bouquet_payoff.png`, `/tmp/bloom_reg_desktop_round1_restored_payoff.png`, `/tmp/bloom_reg_desktop_round2_bouquet_payoff.png`, `/tmp/bloom_reg_desktop_round3_final_payoff.png`, `/tmp/bloom_reg_mobile390_round1_payoff.png`, and `/tmp/bloom_reg_mobile390_round2_handoff.png`.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, temporary Playwright regression `node /tmp/bloom_pw/regression_after.js`, and changed-file credential/tracker/path/permission scan passed. Godot smoke test was attempted, but no `godot` or `godot4` executable is installed in this environment.
- Vercel deployment URL/identifier checked: production baseline only before editing, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy had occurred at note time before commit/push.
- GitHub Pages preview status: not checked in this local pass before commit/push.
- Known issues: none found in the verified focused first-three-order route. The temporary security scan initially matched harmless local variable names ending in `Token`; rerun with stricter credential-assignment patterns had no findings.
- Review-hook preservation: visible/hidden review controls and existing verifier markers for Shape Bloom, Supreme Bloom, Complete Bouquet, reward choice, Cursed Thorn retry, and L/T/cross shape audit were preserved. This pass used `Complete Bouquet` only as a regression shortcut after real instructed swaps.
- How to trigger and verify L/T/cross matches without console: after the focused opening, use the existing `Shape Bloom` review path where visible or focus the playable and press `M` to cycle `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`; the verifier still checks L/T/cross definitions in `shapeAuditData`.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing hook should show `SUPREME BLOOM!` and return to a 64-tile board.
- Security/secret-scan status: changed files were scanned for private key headers, environment-file additions, provider credential prefixes, JWTs, suspicious credential assignments, trackers/analytics SDKs, broad permissions, machine-local paths, and cron-like additions. No findings after tightening false-positive patterns.
- Foreman visual QA: independent desktop and 390x844 review accepted the substantial trophy but found its first draft repeated coin, greenhouse, item, and thorn rewards already shown by the transaction row. Those duplicate trophy tokens were removed so the ceremony now reads as one bouquet visual, one transaction, one transformation, and one next action.

## 2026-07-13 Compact bouquet-goal scan

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: bouquet targets now read as a compact set of goal chips instead of a sentence broken up by repeated visible `and` connectors. The connectors remain in the DOM as visually hidden text for assistive technology, so no target or semantic relationship was removed.
- Mobile first-viewport result: at 390x844, active Round 2 objective height fell from 171px to 135px and the board moved 36px upward. All 64 tiles and eight complete rows remained visible with no horizontal overflow.
- Real-browser interaction verification: Chromium/Playwright used real mouse clicks for both authored Round 1 swaps, bouquet completion, greenhouse restoration, saved-state reload, and Next Order on 1280x720 and 390x844. Round 2 retained three accessible goal joiners, zero visibly rendered joiners, 64 altar tiles, eight complete rows, zero broken images, and no console, page, or request errors. A real `Retry Bouquet` click restored Round 2 to 17 moves.
- Verification: `python3 scripts/verify_project.py` passed, including static regression markers for the accessible joiner treatment.
- Next highest-impact audit item: assess whether the Cursed Thorn teaching highlight is immediately distinguishable from normal flower harvest previews on first contact.

## 2026-07-13 Occult altar tile-art readability pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/generate_occult_tile_art.py`, `scripts/verify_html_match_shapes.py`, `assets/tiles/altar/*.svg`, and `docs/codex_build_notes.md`.
- Player-visible milestone: replaced the normal flower tile faces with a deterministic repo-local original SVG set generated by `scripts/generate_occult_tile_art.py`: Sol Rot sun medallion, Bone Star ivory thorn, Nightshade violet bloom, Bloodroot crimson cutting, Amber Seed resin pod, and Thorn Rose sigil. The board tile treatment now lets those silhouettes fill the altar cells instead of reading as small repeated icons in dark wells, with a stronger Bloodroot silhouette and brighter Cursed Thorn blocker overlay/teaching markers.
- Visual evidence inspected: live Vercel baseline screenshots `live-desktop-baseline.png` and `live-mobile-baseline.png`; local baseline screenshots; final local desktop/mobile fresh screenshots; active Round 2 Cursed Thorn screenshot `desktop-round2-active-thorns.png`; full-flow desktop/mobile screenshots through Round 1 completion, Round 2 completion, Round 3 completion, replay, and retry.
- Browser verification: local static server `127.0.0.1:4173`; Chromium/Playwright. Real desktop 1440x1000 and exact 390x844 mobile flows exercised fresh load, invalid swap, two authored Round 1 swaps, bouquet/coin payoff, Restore Greenhouse before/after, save/reload, Next Order, Round 2 Cursed Thorn lesson plus unguided move/completion, Round 3 final payoff, replay, failed bouquet, and `Retry Bouquet`.
- Browser console/network status: final desktop and mobile runs reported 0 console errors, 0 page errors, 0 failed requests, 0 broken images, 0 horizontal overflow, and 64 active tiles. Mobile final retry reported 8 complete visible rows.
- Verification commands: `python3 scripts/verify_project.py`, `python3 scripts/verify_html_match_shapes.py`, `git diff --check`, extracted playable JavaScript `new Function(...)`, pinned Godot 4.2.2 headless smoke, and the two-viewport Playwright flow passed.
- Vercel deployment URL/identifier checked: baseline only, `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the verified first-three-order route. The new SVG style is intentionally more readable and higher-contrast than the prior bitmap set while staying repo-local and original.
- How to trigger and verify L/T/cross matches without console: focus the playable after the first focused slice or use visible `Shape Bloom` where available; press `M` to cycle the existing line/L/T/cross review hook and verify 64 tiles remain.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the existing hidden review hook should show `SUPREME BLOOM!` and return to a 64-tile board.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, `.env` additions, provider token prefixes, JWTs, suspicious credential assignments, trackers, machine-local runtime paths, broad permissions, and cron additions. No secrets, trackers, analytics, backend, accounts, ads/IAP, broad permissions, or cron jobs were added.

## 2026-07-13 Bouquet-progress greenhouse revival

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the active greenhouse companion now revives during ordinary bouquet progress before the ceremony. Existing objective counts drive durable 0/partial/full revival tiers on the desktop greenhouse, behind-board environment, and 390px mobile plinth; real target matches and Cursed Thorn progress add a restrained intake pulse, living bed fill, light, vines, and sigil energy. The state resets on Retry, Next Order, and replay, persists from saved objective counts on reload, and still culminates in the existing restoration/final payoff ceremonies.
- Visual/runtime evidence inspected: `/tmp/bloom-desktop-fresh-before.png`, `/tmp/bloom-desktop-after-first-match-intermediate.png`, `/tmp/bloom-desktop-round1-complete-before-restore.png`, `/tmp/bloom-desktop-after-restore.png`, `/tmp/bloom-desktop-round2-thorn-progress.png`, `/tmp/bloom-desktop-final-payoff-after.png`, `/tmp/bloom-mobile390-fresh-before.png`, `/tmp/bloom-mobile390-after-first-match-intermediate.png`, `/tmp/bloom-mobile390-round2-thorn-progress.png`, `/tmp/bloom-mobile390-final-payoff-after.png`, and visible failed retry screenshots for both desktop and mobile.
- Browser verification: local static server `127.0.0.1:4173`; agent-browser loaded the playable and saw 64 tile buttons. Playwright/Chromium exercised real desktop 1280x720 and 390x844 interaction: fresh load, invalid swap, first guided swap, second Black Candle swap, bouquet/coin payoff, Restore Greenhouse before/after, save/reload, Next Order, Round 2 guided thorn, follow-up, unguided completion, Round 2 payoff, Round 3 reset/completion, final payoff/reload/replay, hidden `B` Supreme Bloom, forced visible failed Round 2, and real `Retry Bouquet`.
- Greenhouse revival checks: fresh rounds reported 0%/tier 0; first Round 1 match reported 60%/tier 2 with intake; Round 2 thorn progress reported 26%/tier 1; Round 1, Round 2, and Round 3 completions reported 100%/tier 3; Next Order/replay/retry reset to 0%. Mobile kept 8 complete active rows in the sampled active states, no horizontal overflow, and the greenhouse plinth visible.
- Browser console/network status: final scripted desktop and mobile journeys reported 0 console messages, 0 page errors, 0 failed browser requests, 0 broken images, 0 horizontal overflow, and transient FX cleanup back to 0.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted playable JavaScript syntax check via `new Function(...)`, and `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the verified first-three-order route. The failed Round 2 state was forced through saved state to reach the visible retry surface quickly; the `Retry Bouquet` click itself was exercised in the browser on desktop and mobile.
- How to trigger and verify L/T/cross matches without console: after Round 3/replay or outside the focused first-three active composition, press `M` or use `Shape Bloom` where visible; this pass did not change that review path.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; this pass verified the hidden review hook shows `SUPREME BLOOM!`, then cleans up particles and preserves 64 tiles.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, `.env`, known provider token prefixes/JWTs, suspicious credential assignments, trackers, machine-local paths, and broad permissions. No secrets, trackers, telemetry, backend, accounts, ads/IAP, new dependencies, broad permissions, or cron jobs were added.

## 2026-07-13 Round 2 short-desktop board fit

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 2 now keeps all eight board rows visible at 1280x720. Only the focused restored-order layout on short desktop viewports was tightened: the title, goals, teaching cue, greenhouse status, and board scale compact together while every objective remains visible and the board stays the hero. Round 1, mobile sizing, gameplay, progression, and saves are unchanged.
- Real-browser interaction verification: Chromium/Playwright used real mouse clicks for both authored Round 1 swaps, bouquet completion, `Restore Greenhouse`, saved-state reload, and `Next Order`. Round 2 rendered 64 tiles and eight complete rows at 1280x720 and 390x844, with no broken images, horizontal overflow, console errors, or page errors. A forced failed Round 2 state exposed the existing `Retry Bouquet`; a real mouse click restored 17 moves, 64 tiles, and eight visible rows.
- Verification commands: `python3 scripts/verify_project.py` and `git diff --check` passed. The HTML regression marker now enforces the short-desktop Round 2 board constraint. A changed-line scan found no private-key headers, provider token prefixes, JWTs, credential assignments, environment files, tracking code, or machine-local paths.
- Next highest-impact audit item: evaluate whether the multi-target Round 2 objective can become faster to scan without hiding goals or adding tutorial copy.

## 2026-07-13 Living greenhouse environment pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: active play now reads more clearly as an occult greenhouse rather than a dark companion panel. The existing repo-local greenhouse art is still the source, but Withered, Moonlit, and Bloodroot active stages now add stage-specific greenhouse ribs, lamps, vines, growing beds, haze, brighter art treatment, board-surround lighting, and restrained ambient motion. Mobile gets a first-viewport greenhouse plinth immediately after the board so stage art remains visible while preserving the board as hero. Reduced-motion disables the new ambient lamp/mist animation.
- Visual evidence inspected: baseline desktop/mobile screenshots plus final desktop, final mobile fresh, desktop Moonlit, desktop Bloodroot, mobile Moonlit, mobile Bloodroot, mobile final payoff, and reduced-motion desktop screenshots.
- Browser verification: local static server `127.0.0.1:4173`; Chromium/Playwright. Fresh desktop 1280x720 had 64 tiles, 8 complete rows, 0 overflow, 0 broken images, no console/page/request errors, and the mobile plinth hidden. Fresh 390x844 had 64 tiles, 8 complete rows, 0 overflow, 0 broken images, and the Withered plinth visible from 585px to 747px.
- Interaction verification: desktop real clicks exercised invalid swap, two instructed Round 1 swaps, bouquet completion, +coin reward, Restore Greenhouse before/after, save/reload, Next Order, Round 2 Cursed Thorn teaching, follow-up, unguided play, Round 2 completion, Next Order, Round 3 active Bloodroot play, final payoff, replay, forced failed Round 2 state, real `Retry Bouquet`, and transient cleanup. Final 390x844 rerun exercised the same path after the mobile plinth change; active play kept 64 tiles, at least 8 complete rows, no overflow, and no broken images.
- Browser console/network status: final desktop and mobile browser runs reported 0 console messages, 0 page errors, and 0 failed requests.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted playable JavaScript `node --check`, and the pinned Godot 4.2.2 headless smoke test passed.
- Review hooks: focused desktop probe verified reduced-motion animation shutdown, real `B` Supreme Bloom trigger and cleanup back to 64 tiles, and real `M` Shape Bloom/L-T-cross review hook preserving 64 tiles, 0 overflow, and 0 broken images.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the focused first-three-order route. The failed Round 2 retry state was forced through existing internal state to avoid spending the full move budget; `Retry Bouquet` itself was clicked and verified in the browser.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, environment files, known provider token prefixes, JWTs, credential assignments, trackers, machine-local paths, and broad permissions. No secrets, trackers, telemetry, backend, accounts, ads/IAP, new dependencies, or broad permissions were added.

## 2026-07-13 Selected harvest preview and tactile tile wells

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: selected swaps now preview the actual harvest run before commitment. Legal selected swaps light the matched flowers with color-aware altar wells, anchor throb, and aria labels; four-match Black Candle Vine selections also preview the full relic lane. Tile wells now pick up each flower's own color for a more premium tactile board without adding controls, systems, assets, rounds, economies, saves, dependencies, backend, trackers, ads/IAP, accounts, permissions, or secrets.
- Visual evidence inspected: baseline desktop/mobile screenshots plus after screenshots for desktop selected preview, desktop Black Candle preview, mobile selected preview, mobile Black Candle preview, and visible Retry Bouquet.
- Browser verification: local static server `127.0.0.1:8765`; agent-browser verified page load, no framework overlay, meaningful content, and 64 interactive tile buttons. Playwright/Chromium verified fresh 1280x720 and 390x844 loads with 64 tiles, 8 complete rows, 0 horizontal overflow, 0 broken images, and 0 console/page/request errors.
- Interaction verification: real clicks exercised invalid swap refusal; first Round 1 selected preview showed 3 harvest tiles and 2 anchors; first guided swap completed Thorn Rose progress; Black Candle selected preview showed a full 8-tile relic lane; the second guided swap completed First Bouquet, +120 coins, Restore Greenhouse, save/reload, and Next Order. Round 2 verified Cursed Thorn selected preview, the authored thorn swap, the follow-up guide, unguided legal swaps to Moonlit Wreath completion, `Next Order -> Bloodroot Compact`, unguided Round 3 completion, and final Play Again availability.
- Retry/save/review hooks: a forced failed Round 2 state showed visible `Retry Bouquet`; clicking it restored Round 2 to 17 moves, 64 tiles, 0 overflow, and 0 broken images. Keyboard `B` verified Supreme Bloom without console and returned to 64 tiles. Keyboard `M` verified the L/T/cross/shape-demo path with 64 tiles, 0 overflow, and 0 broken images. `Play Again -> First Bouquet` returned to an enabled 64-tile Round 1 board.
- Browser console/network status: all final agent-browser and Playwright runs reported 0 console messages, 0 page errors, and 0 failed browser requests. Vercel and GitHub Pages live previews were not redeployed or checked in this local pass before push.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted playable `node --check`, and pinned Godot 4.2.2 smoke test `--headless --path . --script res://tests/godot_smoke_test.gd` passed.
- Known issues: none found in the focused changed path. Some bouquet-binding and shape-demo particles are intentionally transient immediately after their effects and clear on existing timers.
- Security/secret-scan status: precise changed-line scan passed for private-key headers, known token prefixes/JWTs, credential assignments, `.env`, trackers, and machine-local paths. A stricter whole-file scan still finds historical documentation-only local screenshot/tool paths in earlier build-note entries; no runtime/code paths, secrets, trackers, analytics, backend, accounts, ads/IAP, new dependencies, broad permissions, or cron jobs were added.

## 2026-07-13 Stage-aware occult soundscape

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the first-three-order board loop now has a gesture-gated occult audio bed and richer procedural motifs. The soundscape starts after real interaction, routes through a master/compressor, shifts from withered to moonlit to bloodroot greenhouse stages, and gives swap, invalid, match, Black Candle, bouquet completion, restore, Next Order, retry, and replay actions distinct tones. No new assets, controls, rounds, systems, dependencies, saves, backend, trackers, ads/IAP, accounts, permissions, or secrets were added.
- Visual evidence inspected: `/tmp/bloom-baseline-desktop-1440x1000.png`, `/tmp/bloom-baseline-mobile-390x844.png`, `/tmp/bloom-audio-firstmatch-desktop.png`, `/tmp/bloom-audio-final-desktop-round2-active.png`, `/tmp/bloom-audio-final-desktop-round3-active.png`, `/tmp/bloom-audio-final-mobile-round2-active.png`, and `/tmp/bloom-audio-final-mobile-round3-active.png`.
- Browser verification: local static server `127.0.0.1:8765`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/705bc6b22212b352/node_modules`. Fresh desktop 1440x1000 and mobile 390x844 had 64 tiles, 8 complete rows, 0 broken images, no horizontal overflow, and no console/page/request errors. Mobile Round 2 and Round 3 active states each kept 64 tiles, 8 complete rows, 0 overflow, and 0 broken images.
- Interaction verification: real clicks exercised invalid swap, first Round 1 match, Black Candle Vine second swap, bouquet completion, Restore Greenhouse, save/reload, Next Order, Round 2 thorn lesson plus unguided completion, Round 3 completion, and Play Again. First-match FX cleaned to 0 transient nodes; audio context reached `running`, soundscape started, and audio stage advanced `withered -> moonlit -> bloodroot -> withered` across the route.
- Retry/save path: forced saved Round 2 failure exposed visible `Retry Bouquet`; clicking it restored Round 2 to 17 moves, 64 tiles, 8 complete rows on desktop and mobile, no overflow, no broken images, and started the moonlit retry soundscape.
- Browser console/network status: final desktop journey, mobile journey, retry checks, Supreme Bloom cleanup, and shape-demo checks reported 0 console messages, 0 page errors, and 0 failed browser requests.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted playable `node --check /tmp/bloom-playable-inline.js`, and `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed.
- How to trigger and verify L/T/cross matches without console: after Round 3/replay or outside the focused first-three active composition, press `M` or use `Shape Bloom` where visible; this pass verified `M` still resolves a shape demo with 64 tiles, no broken images, no overflow, and starts the soundscape.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; this pass verified `SUPREME BLOOM!` appears with 84 particles, then cleans to 0 particles with 64 tiles, 0 broken images, and no overflow.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the focused first-three-order route. Completion/payoff transient FX can still be visible immediately after final bouquet screens, then clear on their existing timers.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, known provider token prefixes, JWTs, and suspicious credential assignments. No secrets, `.env`, trackers, analytics, backend, accounts, ads/IAP, new dependencies, broad permissions, or cron jobs were added.

## 2026-07-13 Clean first-three-order active composition

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: focused active play for First Bouquet, Moonlit Wreath, and Bloodroot Compact now presents a clean two-pane altar composition on desktop: the board remains primary while the existing stage-aware repo-local greenhouse art becomes a large legible environmental companion. Active Round 1 no longer shows the Elements economy strip, and focused active rounds hide the XP/progression dashboard cards, Active Orders card, Shape Bloom hint chips, streak chips, and XP meter copy. Mobile keeps the board-first stack.
- Visual evidence inspected: `/tmp/bloom-final-fresh-1280x720.png`, `/tmp/bloom-final-fresh-1440x1000.png`, `/tmp/bloom-final-round2-active-1280x720.png`, `/tmp/bloom-final-round3-active-1280x720.png`, `/tmp/bloom-final-fresh-390x844.png`, `/tmp/bloom-mobile-status-final.png`, `/tmp/bloom-target-failed-no-shape.png`, and `/tmp/bloom-target-replay-no-shape.png`.
- Browser verification: local static server `127.0.0.1:8765`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/705bc6b22212b352/node_modules`. Fresh 1280x720, 1440x1000, and 390x844 rendered 64 tiles, 0 broken images, 0 console/page/request errors, and no horizontal overflow. Mobile 390x844 kept 8 complete board rows for fresh Round 1, Round 2, and Round 3.
- Interaction verification: real desktop tile clicks completed Round 1 match -> bouquet -> +120 coin payoff -> Restore Greenhouse -> saved reload -> Next Order. Round 2 guided thorn handoff, second guided bloom, and one unguided legal swap were exercised with 64 tiles preserved; save/reload kept the active Round 2 state. A diagnostic forced failed Round 2 state exposed only `Retry Bouquet`, and clicking it restored the Moonlit Wreath objective to 17 moves with 64 tiles. Existing `N` review key was used only for later-state reachability to inspect Round 2 payoff, Next Order into Round 3, Bloodroot Compact payoff, and Play Again replay.
- FX cleanup: first real Round 1 match produced 14 transient board/bouquet/cascade FX nodes; after the animation window, transient FX count returned to 0.
- Browser console/network status: final desktop, tall desktop, mobile, failed/retry, and replay checks reported 0 console messages, 0 page errors, and 0 failed browser requests.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted playable `node --check`, and `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the focused changed path. The diagnostic Round 2 forced-failure path uses internal state to reach retry quickly; the player-facing retry click itself was exercised.
- How to trigger and verify L/T/cross matches without console: after Round 3/replay or outside the focused first-three active composition, press `M` or use the clearly marked prototype `Shape Bloom` control where visible; this pass verified `M` still completes a shape demo with 64 tiles while focused first-three active play suppresses that hint/control exposure.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; this pass verified `SUPREME BLOOM!` appears, cleans up after the animation window, removes its particles, preserves 64 tiles, and remains absent from normal focused active controls.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, known provider token prefixes, JWTs, and suspicious credential assignments. No secrets, `.env`, trackers, analytics, backend, accounts, ads/IAP, new dependencies, broad permissions, or cron jobs were added.

## 2026-07-13 Bouquet binding feedback

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: matching flowers now visibly binds progress into the bouquet. Objective chips and Active Orders rows fill with progress, completed objectives get a stronger sealed state, and real gained flowers launch multiple target flights into a short-lived `+N` bouquet seal near the objective. No new rounds, assets, systems, currencies, controls, dependencies, backend, trackers, ads/IAP, accounts, secrets, permissions, or cron jobs were added.
- Implementation notes: reused the existing `pulseOrderCounts()` / `launchObjectiveFlights()` path, added `queueBouquetBindingSeal()`, progress-fill markup for objective targets and active orders, and fixed the focused failed state so `Retry Bouquet` is visible/clickable while Shuffle and the bottom strip do not intercept it.
- Visual evidence inspected: `/tmp/desktop-seal-finalcheck.png`, `/tmp/mobile-postswap-finalcheck.png`, `/tmp/mobile-payoff-finalcheck.png`, `/tmp/bloom-fail-retry-fixed2.png`, `/tmp/bloom-round2-complete.png`, `/tmp/bloom-round3-complete.png`, and `/tmp/bloom-supreme-key.png`.
- Browser verification: local static server `127.0.0.1:8765`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/705bc6b22212b352/node_modules`. Fresh desktop and 390x844 mobile had 64 tiles, 8 complete rows, 0 broken images, 0 visible future sections, no horizontal overflow, and no console/page/request errors.
- Interaction verification: real tile clicks on desktop and mobile sampled the new transient bouquet seal after the first match, preserved 64 tiles, and showed filled/sealed objective targets. Mobile active play kept 8 complete rows; the visible Shuffle control now fits without text overflow. Real Round 1 clicks completed bouquet payoff, save/reload preserved the payoff, Restore Greenhouse changed to only `Next Order`, and `Next Order` reached Round 2 with 64 tiles.
- Retry/first-three-order verification: visible Shuffle exhaustion produced `Bouquet Withered`; `Retry Bouquet` was visible/clickable, preserved 64 tiles, and restored Round 1 to 12 moves. The existing `N` review key completed Round 2 and Round 3 after the real Round 1 restore/Next Order path; Moonlit Wreath and Bloodroot Compact payoff surfaces, final replay, and 64-tile state all passed.
- Supreme Bloom / L-T-cross status: real focused `B` key showed `SUPREME BLOOM!` and cleaned up with 64 tiles. L/T/cross remains triggered without console by pressing `M` or clicking `Shape Bloom` where visible; this pass did not change that path.
- Browser console/runtime status: all final Playwright runs reported 0 console messages, 0 page errors, and 0 failed browser requests.
- Verification commands: `python3 scripts/verify_project.py` passed. `git diff --check` passed. Godot smoke test was not run because no `godot` or `godot4` binary was available on PATH in this environment.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the focused changed path. The bouquet seal is transient and may overlap the objective briefly during the final match, which is intentional payoff feedback.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, provider token prefixes, JWTs, and suspicious credential assignments.

## 2026-07-13 Active greenhouse surround

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: active play now reads as happening inside the evolving greenhouse instead of a board floating over black. The focused board stays hero, but the existing repo-local greenhouse art is more legible behind the board, inside the board substrate, in the left hero, and in a clear mobile stage plinth labeled Withered/Moonlit/Bloodroot. No new assets, controls, rounds, systems, save fields, dependencies, backend, trackers, ads/IAP, accounts, permissions, or secrets were added.
- Visual evidence inspected: live Vercel baseline screenshots `/tmp/bloom-live-desktop-before.png` and `/tmp/bloom-live-mobile-before.png`; local after screenshots `/tmp/bloom-local-desktop-after-fresh.png`, `/tmp/bloom-local-mobile-after-fresh.png`, `/tmp/bloom-local-desktop-restored-after-stage.png`, `/tmp/bloom-local-desktop-round2-moonlit-stage.png`, `/tmp/bloom-local-desktop-round3-final-stage.png`, `/tmp/bloom-local-mobile-restored-stage.png`, `/tmp/bloom-local-mobile-round2-moonlit-stage.png`, `/tmp/bloom-local-mobile-round2-failed-retry.png`, `/tmp/bloom-local-mobile-round2-retry-restored.png`, `/tmp/bloom-local-mobile-round3-bloodroot-stage.png`, and `/tmp/bloom-local-mobile-round3-final-stage.png`.
- Browser verification: local static server `127.0.0.1:4180`; agent-browser/Chromium. Fresh desktop had 64 tiles, 8 rows, no non-tile controls, Withered stage, 0 broken images, and no overflow. Fresh 390x844 had 64 tiles, 8 complete rows, Withered plinth, no controls, 0 broken images, and no horizontal overflow.
- Interaction verification: desktop real clicks completed Round 1 instructed swaps, +120 bouquet reward with 148 coin balance after streak, Restore Greenhouse, save/reload, Next Order, Round 2 thorn lesson, guided follow-up, one unguided ordinary move, Round 2 completion, Next Order, Round 3 Bloodroot active play, and final Bloodroot ceremony. Mobile real clicks completed the same first-three-order route after a forced Round 2 failure/retry check; active mobile Round 2 and Round 3 each kept 64 tiles and 8 complete visible rows.
- Retry verification: a forced saved mobile Round 2 failure showed visible `Retry Bouquet`; clicking it restored Round 2 to 17 moves, 64 tiles, guide counter 0, Moonlit stage, 0 broken images, and no overflow.
- Browser console/network status: local desktop and mobile verification runs reported 0 console messages/page errors; mobile network log showed only 200 responses for the playable and image/SVG assets. Live Vercel pre-edit baseline at `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` loaded with 64 tiles, no broken images, and no mobile overflow. GitHub Pages was not checked.
- Verification commands: `python3 scripts/verify_project.py`, `git diff --check`, extracted playable `node --check`, and `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed.
- Known issues: none found in the focused first-three-order route. The mobile Round 2 retry state was forced through existing state/render functions to avoid burning turns, then recovered with a real `Retry Bouquet` click.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; `SUPREME BLOOM!` should appear and return to a 64-tile board.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, provider token prefixes, JWTs, and suspicious credential assignments.

## 2026-07-13 Restoration relight ceremony

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: the first greenhouse spend now has a clear relight ceremony at the exact `Restore Greenhouse · 100 coins` click. The existing withered/restored artwork now gets a timed before/after reveal, gold-green flare sweep, sparks, panel glow, spend pulse, and restored-state pop before settling back to the same single `Next Order` action. No new systems, controls, assets, dependencies, saves, backend, trackers, accounts, ads/IAP, or permissions were added.
- Implementation notes: added `restoration-awakening`, `restoration-flare`, and `restoration-spark-field` layers inside the existing restoration scene, with transient class lifecycle in `restoreRoundOneGreenhouse()`. The verifier now checks the relight ceremony hooks and keyframes.
- Visual browser evidence: local static server `127.0.0.1:4173`; Chromium/Playwright via temporary npx cache `NODE_PATH=/opt/data/home/.npm/_npx/705bc6b22212b352/node_modules`. Inspected `/tmp/bloom-desktop-before.png`, `/tmp/bloom-mobile-before.png`, `/tmp/bloom-desktop-restore-animating.png`, `/tmp/bloom-desktop-restored-final.png`, `/tmp/bloom-mobile-restore-animating.png`, and `/tmp/bloom-mobile-restored-final.png`.
- Desktop 1440x1000 verification: fresh load had 64 tiles, 8 visible rows, no visible non-tile controls, 0 broken images, and no overflow. Real clicks verified invalid adjacent refusal, instructed first swaps, bouquet completion, +120 payoff, restore animation class present mid-click, final restored state with only `Next Order`, save/reload preserving restored Round 1, `Next Order` into Round 2, and first Cursed Thorn move.
- Mobile 390x844 verification: fresh load had 64 tiles, 8 visible rows, no overflow, and 0 broken images. Completion and restore card stayed within the viewport; mid-animation and final restored states had only `Next Order`, 64 tiles retained in state, no overflow, and 0 broken images.
- Continuation/retry verification: Round 2 start and first real thorn move preserved 64 tiles and 0 errors. Existing `N` review hook verified Moonlit Wreath completion, `Next Order -> Bloodroot Compact`, Bloodroot final payoff, and `Play Again -> First Bouquet`; forced Round 2 failure then `Retry Bouquet` restored moves/objectives/thorns with 64 tiles.
- Browser console/runtime status: final desktop/mobile visual runs and the interaction/retry/hook regression had 0 console messages, 0 page errors, and 0 failed browser requests.
- Verification commands: `python3 scripts/verify_project.py` passed; `git diff --check` passed. Godot headless smoke test was not run because no `godot` or `godot4` binary was available on PATH in this environment.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the focused first three-order route. The continuation to Round 2/3 completion used the existing `N` review hook after the real Round 2 handoff; the player-facing Round 1 restore path was exercised with real tile clicks.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` where visible or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`. This pass verified the `M` cycle still resolves and preserves 64 tiles.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the `SUPREME BLOOM!` overlay should appear and return to 64 tiles. This pass verified `B` set `supremeOn: true`, added coins, and returned without broken images or overflow.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, AWS/GitHub/OpenAI/Slack/Stripe token prefixes, JWTs, and suspicious credential assignments. No secrets, `.env`, trackers, analytics, backend, accounts, ads/IAP, broad permissions, or cron jobs were added.

## 2026-07-13 Active greenhouse stage composition

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: active play now inhabits an evolving occult greenhouse instead of a mostly black shell. The focused board remains the altar, while the left hero and the quiet behind-board environment use the existing original repo-local greenhouse art: withered Round 1, violet Moonlit Greenhouse Round 2, and crimson Bloodroot Conservatory Round 3. Mobile keeps the board-first stack and replaces the old abstract below-board silhouette with the same stage-aware greenhouse art.
- Implementation notes: added `activeGreenhouseStages`, `activeGreenhouseStageKey()`, and `applyActiveGreenhouseStage()` to drive one saved-state-safe stage from existing round/restoration state. Failed focused Round 2/3 now keep the compact restored-greenhouse layout so `Retry Bouquet` does not drop mobile back into the legacy tall layout.
- Browser evidence: local static server `127.0.0.1:41070`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Before screenshots inspected: `/tmp/bloom-before-1280x720.png`, `/tmp/bloom-before-390x844.png`, and `/tmp/bloom-before-1440x1000.png` showed the tiny/dark top-left greenhouse and no active mobile art.
- After screenshots inspected: `/tmp/bloom-after-1280x720.png`, `/tmp/bloom-after-390x844.png`, `/tmp/bloom-short1280x720-round2-moonlit-stage.png`, `/tmp/bloom-short1280x720-round3-bloodroot-stage.png`, `/tmp/bloom-mobile390x844-round2-moonlit-stage.png`, `/tmp/bloom-mobile390x844-round3-bloodroot-stage.png`, `/tmp/bloom-mobile-retry-before.png`, and `/tmp/bloom-mobile-retry-after.png`.
- Browser verification: fresh 1280x720 had 64 tiles, 8 complete rows, withered stage, board 186px-720px, no overflow, and 0 broken images. Fresh 390x844 had 64 tiles, 8 complete rows, withered stage, board 199px-577px, no overflow, and 0 broken images. Full 1280x720 journey completed Round 1 two guided swaps, +120 payoff, Restore Greenhouse, reload, Next Order, Round 2 moonlit stage and unguided completion, Round 2 reload, Round 3 bloodroot stage, final payoff, final reload, and replay. Full 390x844 journey passed the same path with 8 mobile rows on fresh/Round 2/Round 3/replay. Forced mobile Round 2 failure showed visible `Retry Bouquet`, 64 tiles, 8 rows, moonlit stage, no overflow; retry restored Round 2 with 64 tiles and 8 rows.
- Deterministic routes used: desktop Round 2 after the two cues used `5,0->5,1`, `4,0->5,0`, `3,4->4,4`, `2,1->3,1`, `3,0->4,0`; desktop Round 3 used `1,0->1,1`, `2,4->2,5`, `4,7->5,7`, `5,0->5,1`. Mobile Round 2 after the two cues used `3,1->3,2`, `2,1->2,2`, `5,2->5,3`; mobile Round 3 used `1,0->1,1`, `6,0->7,0`, `3,2->4,2`, `2,1->2,2`.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, `git diff --check`, and `node --check /tmp/bloom-playable-inline.js` passed.
- Browser console/runtime status: final desktop journey, final mobile journey, and targeted retry check had 0 console messages, 0 page errors, and 0 failed requests.
- Live-host status: no Vercel redeploy or GitHub Pages check was performed in this local pass before push.
- Known issues: none found in the focused first three-order route. On 1280x720, Round 2 active play shows 6 complete rows during the restored status/tutorial stack, while fresh Round 1 still shows all 8 rows and mobile shows 8 rows for the checked active stages.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, provider token prefixes, JWTs, and suspicious credential assignments. No secrets, `.env`, trackers, analytics, backend, accounts, ads/IAP, broad permissions, or cron jobs were added.

## 2026-07-13 Short desktop board-first composition

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: focused desktop/laptop play now has a short-height composition for viewports above mobile and up to 820px tall. The title/objective/cue stack, Greenhouse/Active Orders rail, Elements strip, and board sizing are compacted without a transform or game logic change. Fresh 1280x720 and 1366x768 now keep the board as the altar with all 8 rows visible; the immediate restored greenhouse handoff keeps the compact objective/cue/status and 7 complete rows visible at 1280x720. Mobile 390x844 keeps the existing board-first layout.
- Local browser verification: static server `127.0.0.1:41062`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Fresh viewport checks: 1280x720 had 64 tiles, 8 complete rows, board 186px-720px, first row 196px-256.75px, last row 649.25px-710px, no horizontal overflow, 0 broken images, readable objective/cue, and no visible non-tile/debug controls. 1366x768 had 64 tiles, 8 complete rows, board 186px-768px, last row bottom 758px, no overflow, 0 broken images, and no visible legacy controls. 1440x1000 remained 64 tiles and 8 rows with the existing larger 650px board. 390x844 remained 64 tiles and 8 rows with board 199px-577px and no overflow.
- Handoff visual check: `/tmp/bloom-verified-handoff-1280x720.png` showed `Restored Greenhouse - Moonlit Wreath begins`, compact restored greenhouse status, 64 tiles, 7 complete rows, board 267.8px-777.8px, 57.75px tile art, no overflow, and no visible non-tile controls.
- Gameplay verification: real tile clicks completed deterministic Round 1 swaps, bouquet completion, coin reward, `Restore Greenhouse`, saved reload, `Next Order`, Round 2 Cursed Thorn lesson, Round 2 follow-up, unguided Round 2 completion, second restoration, saved reload, `Next Order -> Bloodroot Compact`, Round 3 completion/final restoration, final reload, replay to Round 1, forced Round 2 fail/retry, and restored Round 2 retry. Active play preserved 64 tiles and no overflow; browser console, page errors, and failed requests were all 0. Unguided moves included Round 2 `5,1->6,1`, `4,0->5,0`, `0,2->1,2`, `1,2->2,2`, `1,1->2,1`, `0,2->1,2`, `2,2->2,3`; Round 3 included `1,0->1,1`, `3,1->4,1`, `2,1->3,1`, `3,1->4,1`, `4,0->5,0`, `2,1->3,1`.
- Screenshots inspected: `/tmp/bloom-verified-fresh-1280x720.png`, `/tmp/bloom-verified-fresh-1366x768.png`, `/tmp/bloom-verified-handoff-1280x720.png`, and `/tmp/bloom-verified-fresh-390x844.png`.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, `git diff --check`, and `node --check /tmp/bloom-playable-inline.js` passed.
- Browser console/runtime status: viewport and gameplay verifier runs had 0 console messages, 0 page errors, and 0 failed requests.
- Vercel deployment URL/identifier checked: live pre-edit baseline was checked at `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy was performed in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the verified focused first three-order path. Existing L/T/cross and Supreme Bloom review hooks remain unchanged; no new controls, rounds, currencies, dependencies, backend, trackers, accounts, ads/IAP, secrets, or broad permissions were added.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, provider-token prefixes, JWTs, and suspicious credential assignments in the final changed files.

## 2026-07-13 Moonlit and Bloodroot greenhouse artwork

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`, `assets/greenhouse/moonlit_wreath_greenhouse.svg`, and `assets/greenhouse/bloodroot_compact_greenhouse.svg`.
- Player-visible milestone: the second and third greenhouse ceremonies no longer rely on CSS-only moon/vine/lantern or blood-sun/root/seal overlays. Round 2 now swaps the restored art layer to an original repo-local Moonlit Wreath greenhouse with violet panes, moon, lanterns, and nightshade wreath beds; Round 3 swaps from that stage into an original Bloodroot Compact conservatory with crimson glass, root beds, and a compact sigil. The first greenhouse PNG art remains unchanged.
- Implementation notes: `greenhouseArtwork` and `applyGreenhouseArtwork()` choose the correct before/after image sources for first restore, Moonlit Wreath, and Bloodroot Compact, including saved/reloaded ceremonies. The old overlay spans/CSS/keyframes were removed, and mobile Moonlit captions were tightened to avoid wrapping over the art.
- Focused verifier coverage: `scripts/verify_html_match_shapes.py` now checks the new asset filenames, artwork map, render hook, and `data-greenhouse-art` stage marker instead of the removed overlay class markers.
- Local browser verification: static server `127.0.0.1:41061`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Desktop 1440x1000 journey: real tile clicks completed Round 1 -> restore -> reload -> Next Order -> Round 2 guided thorn/follow-up plus unguided real completion -> Moonlit ceremony -> reload -> Next Order -> Round 3 real completion -> Bloodroot final ceremony -> reload -> `Play Again -> First Bouquet`; active play preserved 64 tiles, no horizontal overflow, no broken images, and no console/page/request errors.
- Mobile 390x844 journey: the same full path passed at 390x844 with 64 tiles during active play, no horizontal overflow, no broken images, no browser errors, reload persistence at each greenhouse payoff, and replay back to active Round 1.
- Visual inspection: screenshots captured and inspected at `/tmp/bloom-desktop-moonlit-ceremony.png`, `/tmp/bloom-mobile390-moonlit-ceremony.png`, `/tmp/bloom-desktop-bloodroot-ceremony.png`, and `/tmp/bloom-mobile390-bloodroot-ceremony.png`. Moonlit reads as a violet/moon/lantern greenhouse on desktop and mobile; Bloodroot reads as a crimson conservatory with root beds and central compact seal on desktop and mobile.
- Retry/Next Order: a focused mobile retry regression forced a saved failed Round 2 state, verified visible `Retry Bouquet`, clicked it, and confirmed Round 2 restored with 64 tiles and moves reset. `Next Order -> Bloodroot Compact` and final replay were verified in both full journeys.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, `git diff --check`, XML parse for both new SVGs, and `node --check /tmp/bloom-playable-inline.js` passed.
- Browser console/runtime status: the final desktop journey, mobile journey, and retry regression had 0 console messages, 0 page errors, and 0 failed browser requests.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass before push.
- GitHub Pages preview status: not checked in this local pass before push.
- Known issues: none found in the verified first three-order greenhouse progression. Existing L/T/cross and Supreme Bloom review hooks remain unchanged; no new controls, systems, currencies, dependencies, backend, trackers, accounts, ads/IAP, secrets, or broad permissions were added.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, AWS/GitHub/OpenAI/Slack/Stripe token prefixes, JWTs, and suspicious credential assignments in the final changed files.

## 2026-07-13 Final three-order greenhouse payoff

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 3 `Bloodroot Compact` completion now resolves into a focused final greenhouse ceremony instead of the legacy completion surface. It shows `Bloodroot Compact Sealed · +180 coin reward`, a distinct Bloodroot conservatory transformation using the existing greenhouse art plus original blood-sun/root/seal overlays, one `+210 XP Greenhouse` upgrade transaction, and one `Play Again -> First Bouquet` action that returns to the focused 64-tile board without exposing reward choice, `Complete Bouquet`, `Shape Bloom`, or Round 4 sprawl.
- Live Vercel pre-edit inspection: `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` loaded visually through agent-browser at `/opt/hermes/node_modules/agent-browser/bin/agent-browser-linux-x64`; snapshot showed the board-first Round 1 page with 64 tile buttons. No redeploy was performed during this local pass.
- Local browser verification: static server `127.0.0.1:41050`; Playwright/Chromium used `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Desktop 1440x1000 journey: fresh Round 1 had 64 tiles, 8 visible board rows, 0 overflow, 0 broken images, and no legacy focused-journey controls. Real tile clicks completed Round 1 instructed swaps, restore, reload persistence, Next Order, Round 2 thorn lesson plus unguided completion, second upgrade, reload persistence, Next Order, Round 3 real play/completion, final Bloodroot ceremony, final reload persistence, and `Play Again -> First Bouquet` back to a playable 64-tile Round 1 board. Final ceremony had 0 reward choice, 0 round ceremony, 0 `Next Bouquet`, 0 `Complete Bouquet`, and 0 `Shape Bloom`.
- Mobile 390x844 journey: same full path passed with 64 tiles during play, at least 7 complete visible board rows after handoff and 8 rows at fresh/Round 3/replay states, 0 horizontal overflow, 0 broken images, no reward-choice/round-ceremony/debug controls in the final payoff, final reload persistence, and replay back to a playable 64-tile board.
- Focused final visual checks after ledger copy fix: desktop and 390x844 final ceremony both showed `+180 Bouquet coins`, `+210 XP Greenhouse`, `Replay First Bouquet`, and `Play Again -> First Bouquet`; 0 overflow, 0 broken images, 0 console/page/request errors.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, `git diff --check`, and `node --check /tmp/bloom-playable-inline.js` passed.
- Browser console/runtime status: local smoke, desktop full journey, mobile full journey, and final targeted visual checks had 0 console warnings/errors, 0 page errors, and 0 failed browser requests.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the verified first three-order vertical slice. Existing L/T/cross and Supreme Bloom review hooks remain available after the focused path for audit; no new visible debug controls were added.
- How to trigger and verify L/T/cross matches without console: after leaving the focused first-order surface, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: precise changed-file scan passed for private-key headers, AWS/GitHub/OpenAI/Slack/Stripe token prefixes, JWTs, and suspicious credential assignments in `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`. No secrets, `.env`, trackers, analytics, backend, accounts, ads, IAP, broad permissions, or cron jobs were added.
- Foreman visual QA: independent desktop and 390x844 review accepted the substantial ceremony but found the long conservatory state label competing with the central seal on mobile. The same milestone now gives that label a high-contrast lower caption treatment and a single-line portrait rule so the original art remains legible.

## 2026-07-13 Focused three-order greenhouse payoff

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: Round 2 completion no longer drops into the legacy reward-choice ceremony. Moonlit Wreath now pays one clear `+150 coin reward`, shows a distinct second-stage greenhouse upgrade ceremony using the existing greenhouse art plus repo-local moon/vine/lantern overlays, persists through reload, and offers one `Next Order -> Bloodroot Compact` action. Round 3 opens as a focused final-order Bloodroot Compact board with an immediate glowing-pair cue, hidden reward-choice/round ceremony clutter, and the board still first.
- Live Vercel pre-edit inspection: `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html` loaded in agent-browser with 64 tiles, 0 broken images, no framework overlay, and meaningful board-first content. No redeploy was performed in this local pass.
- Local browser verification: static server `127.0.0.1:41042`; agent-browser verified page load, `HAS_CONTENT`, 64 tiles, and 0 broken images. Playwright/Chromium used `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Desktop 1440x1000: fresh load had 64 tiles, 8 visible rows, 0 overflow, 0 broken images, and no browser errors. Real clicks completed Round 1, Restore, save/reload, Next Order, Round 2 Cursed Thorn cue, Round 2 follow-up cue, then 3 unguided Round 2 swaps to completion. The new upgrade showed `Moonlit Wreath Sealed · +150 coin reward`, `GREENHOUSE UPGRADE · NIGHTSHADE HOUSE`, no reward choice, and no round ceremony. Reload preserved the upgrade; `Next Order -> Bloodroot Compact` reached focused Round 3 with 64 tiles, 8 rows, 0 overflow, no reward choice/ceremony, and a real first Bloodroot swap preserved 64 tiles.
- Mobile 390x844: fresh load had 64 tiles, 8 visible rows, 0 overflow, and 0 broken images. The same Round 1 restore/reload, Round 2 guided handoff, and 4 unguided Round 2 swaps completed the bouquet. The second greenhouse upgrade, upgrade reload, and focused Round 3 handoff passed with 64 tiles, 8 visible rows, no horizontal overflow, no broken images, no reward choice/ceremony, and no console/page/request errors.
- Retry/save path: forced failed focused Round 2 mobile save showed pinned `Retry Bouquet` in the viewport, 64 tiles, 0 broken images, and no overflow. Clicking Retry restored Round 2 to `Moves 17`, 64 tiles, no overflow, and no browser errors.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, `git diff --check`, and `node --check /tmp/bloom-playable-inline.js` passed.
- Browser console/runtime status: final desktop, mobile, retry, and agent-browser runs had 0 console messages, 0 page errors, and 0 failed browser requests.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 3 completion still exists beyond the verified first playable Bloodroot swap; this pass focused on the requested Round 2 payoff and focused Round 3 handoff. Existing review hooks for L/T/cross and Supreme Bloom remain keyboard/button-accessible after Round 1 for audit, but no new visible debug controls were added.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan passed for `docs/codex_build_notes.md`, `playable/midnight_bloom_prototype.html`, and `scripts/verify_html_match_shapes.py`; no private-key headers, known provider token prefixes, JWTs, or suspicious credential assignments found.
- Foreman visual QA: the first independent ceremony screenshot exposed legacy Bouquet Streak / Next Streak badges above the new one-reward payoff. They are now explicitly hidden during the focused Round 2 upgrade ceremony, with verifier coverage, so the screen presents one coin reward, one greenhouse transformation, and one next action.

## 2026-07-13 Cascade-juice game-feel pass

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: ordinary swaps now glide in the actual swap direction before resolving, matches get stronger wave hit timing, multi-wave cascades show board impact, expanding occult rings, compact `Chain` labels, staggered fall/refill cadence, haptics, and varied procedural swap/match audio by cascade depth, match size, shape, and Black Candle relic state. Existing objective flights, authored Round 1 Black Candle lesson, 64-tile board, saves, retry, restoration, and unguided Round 2 play are preserved.
- Browser verification: local static server `127.0.0.1:41041`; agent-browser binary at `/opt/hermes/node_modules/agent-browser/bin/agent-browser-linux-x64` loaded the page, verified `OK` for framework overlays, `HAS_CONTENT`, meaningful interactive snapshot, and saved an annotated screenshot. Playwright/Chromium used `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Desktop 1440x1000: fresh Round 1 had 64 tiles, 0 broken images, 0 overflow, 8 visible board rows, 0 non-tile buttons, and no console/page/request errors. Real clicks completed the first instructed Thorn Rose swap at hints `(1,0)->(1,1)`, then the authored Black Candle Vine swap at `(5,0)->(5,1)`. Completion showed `First Bouquet Sealed · +120 coin reward`; Restore changed to `Greenhouse Restored · 42 coins remain`; reload preserved `roundComplete`, `roundOneRestored`, 42 coins, and an 8-row saved board. Next Order reached focused Round 2, then real Cursed Thorn and follow-up guided swaps completed, followed by an unguided legal Round 2 swap `(4,0)->(5,0)` with 64 tiles and 0 overflow.
- Mobile 390x844: fresh Round 1 had 64 tiles, all 8 rows visible from 199px to 577px, 0 broken images, 0 overflow, and 0 non-tile buttons. The same real Round 1 completion/restoration/reload/Next Order flow passed; Round 2 started with 8 visible rows from 299px to 677px. After Cursed Thorn and follow-up guided swaps, an unguided legal Round 2 swap `(2,0)->(3,0)` settled with 64 tiles, all 8 rows visible from 248px to 626px, 0 overflow, and no browser errors.
- Cascade timing/FX evidence: deterministic Round 2 saved-state probe with fixed refill RNG clicked ordinary legal swap `(1,0)->(1,1)`. The board reported `data-cascade-wave` waves 1 through 20, then settled at `data-last-cascade-count="20"` with controls returned, 64 tiles, 0 broken images, and 0 overflow. Samples captured wave 1 with 1 `cascade-ring` and 3 harvest tiles, wave 2 with 2 rings, 2 chain marks, 5 harvest tiles, and 9 falling tiles, and wave 3 with 3 rings, 3 chain marks, 6 harvest tiles, and falling refill tiles.
- Retry/save path: forced failed Round 2 mobile state showed `RETRY BOUQUET`, 64 tiles, 8 visible rows from 248px to 626px, 0 broken images, and 0 overflow. Clicking Retry restored `Moves 17`, 64 tiles, 8 visible rows from 285px to 663px, no visible non-tile buttons, and no console/page/request errors.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, `git diff --check`, and `node --check` on the extracted playable script passed.
- Browser console/runtime status: agent-browser and all Playwright desktop, mobile, cascade, and retry runs had 0 console messages, 0 page errors, and 0 failed browser requests.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: the deterministic cascade probe intentionally fixes refill RNG and hits the resolver's 20-wave cap to prove multi-wave timing; ordinary player Round 2 swap verification settled after 1 cascade. Later post-Round-2 prototype surfaces remain broader than the first-60-seconds focus.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file scan passed for `docs/codex_build_notes.md`, `playable/midnight_bloom_prototype.html`, and `scripts/verify_html_match_shapes.py`; no private-key headers, known provider token prefixes, JWTs, or suspicious secret assignments found.

## 2026-07-13 Restored Round 2 unguided handoff

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible milestone: restored Round 2 now teaches exactly two swaps after onboarding: the authored Cursed Thorn clear, then one ordinary `NEXT BLOOM` follow-up. After that, the focused board-first Moonlit Wreath layout remains active but the permanent cue bubble and arrow stop; normal legal swaps, cascades, order progress, delayed subtle idle tile hints, bouquet completion, reward choice, and `Next Bouquet` continue.
- Browser verification: local static server `127.0.0.1:41031`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`. Pre-edit local and live Vercel first loads were visually inspected: 64 tiles, board-first desktop composition, 0 overflow, 0 broken images, and 0 console/page/request errors.
- Desktop 1440x1000 journey: fresh Round 1 had 64 tiles, 2 idle hints, 1 arrow, 0 visible non-tile buttons, board 525x282 to 1175x932, 0 overflow, and 0 broken images. Real tile clicks completed Round 1, restored the greenhouse, reload preserved `roundComplete`, `roundOneRestored`, 42 coins, 64 tiles, and `Next Order`. Round 2 start had 64 tiles, 2 hints, 7 thorn teaching cells, 1 arrow, 0 controls, and restored greenhouse status. After the thorn lesson: guide counter 1, 2 hints, 1 arrow, `Nightshade next`. After the follow-up: guide counter 2, 64 tiles, 0 hints, 0 arrows, no cue bubble, compact objective/moves, restored status, 0 controls, 0 overflow, and 0 broken images. After about 7.3s idle: 2 subtle tile hints, 0 arrows, no cue bubble. Unguided normal tile swaps completed Round 2 with 64 tiles, reward choice visible, `Next Bouquet` visible, and `Next Bouquet` advanced to Round 3.
- Mobile 390x844 journey: fresh Round 1 had 64 tiles, all 8 rows visible from 199px to 577px, 2 hints, 1 arrow, 0 controls, 0 overflow, and 0 broken images. Round 2 start had 64 tiles, all rows visible from 285px to 663px, restored status, 2 hints, 7 thorn teaching cells, 1 arrow, 0 controls, and no overflow. After the guided follow-up settled: 64 tiles, board 248px to 626px, guide counter 2, 0 hints, 0 arrows, no cue bubble, 0 controls, 0 overflow, and concise order progress. After about 7.3s idle: 2 tile-only hints, 0 arrows, no cue bubble, 0 overflow, and 0 broken images.
- Retry/save path: forced saved failed Round 2 reload showed visible `Retry Bouquet`, 64 tiles, no overflow, and 0 broken images on desktop and mobile. Clicking retry restored Round 2 to 17 moves, 64 tiles, guide counter 0, 2 hints, 1 arrow, and the Cursed Thorn cue on both viewports.
- Browser console/runtime status: local desktop, mobile, completion, delayed-idle, save/reload, and retry runs had 0 console messages, 0 page errors, and 0 failed browser requests.
- Verification commands: `python3 scripts/verify_project.py`, `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd`, and `git diff --check` passed.
- Vercel deployment URL/identifier checked: live first load checked before editing at `https://bloom-tycoon.vercel.app/playable/midnight_bloom_prototype.html`; no redeploy was performed in this local pass.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: after Round 2 completion the older broader prototype completion surface still returns with reward choice and review controls; active restored Round 2 play is now focused and unguided after the two-step lesson.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan passed for `docs/codex_build_notes.md`, `playable/midnight_bloom_prototype.html`, and `scripts/verify_html_match_shapes.py`. No secrets, trackers, analytics, backend, accounts, ads, IAP, `.env`, broad permissions, or cron jobs added.
## 2026-07-12 Faster greenhouse artwork delivery

- Weakness selected: Hermes's bespoke withered/restored greenhouse pair materially improved the first restoration, but the two opaque PNGs required about 5.4 MB before the player's first payoff on mobile.
- Files changed: `assets/greenhouse/first_greenhouse_withered.jpg`, `assets/greenhouse/first_greenhouse_restored.jpg`, `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: the playable now loads visually matched JPEG delivery copies totaling about 1.35 MB, roughly 75% smaller, while preserving the original PNG masters untouched. The restoration crossfade, dimensions, save state, coin payoff, and Next Order flow are unchanged.
- Verification: `python3 scripts/verify_project.py` passed, including the JPEG source hooks; `git diff --check` passed. Desktop 1440x1000 and mobile 390x844 both kept 64 tiles, 8 rows, 0 visible active-play controls, 0 broken images, 0 overflow, and 0 console/page/request errors.
- Exact browser check: both 1672x941 JPEGs loaded in each viewport; the withered state showed opacity 1/0, Restore crossfaded to 0/1, the state changed to `RESTORED · MIDNIGHT BLOOM`, and Next Order became the sole action. Mobile kept the full board at 199px-577px before completion.
- Merge follow-up: after reconciling eleven newer Hermes gameplay commits, desktop Round 2 exposed a redundant stage badge colliding with the tutorial copy below the board. Focused play now hides that duplicate badge; the stage remains labeled in the large greenhouse hero and compact status strip.
- Security: changed-file credential-shaped scan returned no findings. No dependencies, services, trackers, analytics, accounts, backend, credentials, permissions, or save-schema changes added.
## 2026-07-13 Bespoke first greenhouse artwork

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`, `assets/greenhouse/first_greenhouse_withered.png`, and `assets/greenhouse/first_greenhouse_restored.png`.
- Player-visible milestone: the Round 1 restoration ceremony now uses original repo-local greenhouse artwork instead of the previous CSS-only glasshouse. The card crossfades from a dark broken withered greenhouse to a lit restored greenhouse with living beds, while preserving the first heartbeat: two instructed swaps, bouquet complete, +120 coins, spend 100 coins, visible restoration, one `Next Order` action.
- Browser verification: local static server `127.0.0.1:41030`; Chromium/Playwright with `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Desktop 1440x1000: fresh load had 64 tiles, board 525x282 to 1175x932, 2 hints, 1 arrow, 0 visible non-tile buttons, 0 debug buttons, 0 broken images, and no overflow. Real two-swap path reached bouquet complete with only `Restore Greenhouse · 100 coins`; withered art loaded at 1672x941 and restored art opacity was 0. Restore switched to `Greenhouse Restored · 42 coins remain`, restored art opacity 1, only `Next Order →`, 64 saved board tiles, 0 broken images, 0 console messages, 0 page errors, and 0 failed requests.
- Mobile 390x844: fresh load had 64 tiles, all 8 board rows visible from 199px to 577px, 2 hints, 1 arrow, 0 visible non-tile buttons, 0 overflow, and 0 broken images. Bouquet complete showed the withered artwork card from 163px to 603px with `Restore Greenhouse` in the first viewport; restore showed the lit greenhouse card from 163px to 619px with only `Next Order`.
- Save/reload and Round 2: after restore, reload preserved `roundComplete: true`, `roundOneRestored: true`, 42 coins, 8x8 saved board, restored art, and `Next Order`. `Next Order` reached focused Round 2 on desktop and mobile with 64 tiles, 2 hints, 1 arrow, no visible debug controls, no overflow, and restored greenhouse status. The real Round 2 guided Cursed Thorn swap preserved 64 tiles and returned the `NEXT BLOOM` cue.
- Retry/save path: a forced saved failed Round 2 state showed visible `RETRY BOUQUET`, 64 tiles, 0 broken images, and no overflow. Clicking it restored focused Round 2 to 17 moves, 64 tiles, 2 hints, 1 arrow, no visible non-tile buttons, and the Cursed Thorn cue on desktop and mobile.
- Browser console/runtime status: final desktop and mobile journeys plus targeted retry check had 0 console messages, 0 page errors, and 0 failed browser requests.
- Vercel deployment URL/identifier checked: not deployed or checked in this local pass.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: image assets are PNGs totaling about 5.4 MB because no local PNG/WebP optimizer was available; no dependency was added just to compress them.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan passed for the 5 changed files. No secrets, trackers, analytics, backend, accounts, ads, IAP, `.env`, broad permissions, or cron jobs added.

## 2026-07-12 Focused restoration ceremony

- Weakness selected: the expanded Round 1 greenhouse payoff exposed streak progression and a Greenhouse XP track at the exact moment the first-minute loop should read as one bouquet, one coin reward, one transformation, and one Next Order action.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: the focused Round 1 completion ceremony now hides the Bouquet Streak badge, Next Streak Target badge, and restoration XP panel. The bouquet result, +120 coins, -100 restoration spend, greenhouse before/after transformation, remaining coin balance, and Next Order action remain visible. Underlying progression and save data are unchanged.
- Verification: `python3 scripts/verify_project.py` passed, including the focused HTML source hooks; `git diff --check` passed. Desktop 1440x1000 and mobile 390x844 both kept 64 tiles, 8 rows, 0 visible active-play controls, 0 broken images, 0 overflow, and 0 console/page/request errors.
- Exact browser flow: both completion viewports showed the restoration card and Restore action while the streak badge, next-streak badge, and XP panel were absent. Mobile Restore -> Next Order reached Round 2 with 64 tiles, 0 broken images, and 0 overflow.
- Security: changed-file credential-shaped scan returned no findings. No assets, services, trackers, analytics, accounts, backend, credentials, permissions, or save-schema changes added.

## 2026-07-12 Finished first two minutes vertical slice

- Files changed: `playable/midnight_bloom_prototype.html`, `docs/codex_build_notes.md`.
- Player-visible outcome: active desktop now presents a composed greenhouse/altar screen with a compact Greenhouse + Active Orders rail, stronger carved board/socket materiality, higher-contrast tiles, and a compact Elements strip instead of a board floating in empty black space. Mobile keeps the full 8-row board first and adds a subdued greenhouse silhouette below the log without extra controls.
- Gameplay feel: normal clears now thump the board and throw flower-colored petal particles from matched cells; the authored Black Candle Vine payoff uses a brighter double lane sweep with relic particles. The match engine, authored Round 1 swaps, objective flights, swipe/tap controls, 64-tile board, rare Supreme Bloom, and Cursed Thorn behavior are preserved.
- Tycoon payoff: Round 1 completion now replaces the board with a larger greenhouse restoration card in the first viewport. It shows withered glass, +120 bouquet coins, -100 coin spend, Greenhouse XP, an animated restored greenhouse state, and one primary `Next Order` action.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed. Local browser server used `127.0.0.1:41020`; Chromium/Playwright used `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`.
- Browser measurements: desktop 1440x1000 fresh load had 64 tiles, board 525px-1175px x 282px-932px, 2 side cards, compact Elements visible, 0 visible non-tile buttons, 0 broken images, and no overflow. Mobile 390x844 fresh load had 64 tiles, board 8px-386px x 199px-577px, 0 buttons, 0 broken images, and `scrollWidth 390`.
- Journey verification: real browser clicks completed fresh load -> first swap -> Black Candle Vine -> bouquet completion -> Restore Greenhouse -> reload persistence -> Next Order -> focused Round 2 -> Cursed Thorn teaching swap. Mobile stayed `scrollWidth 390`; Round 2 board stayed 8px-386px with 64 tiles, restored status visible, no prototype controls, and Cursed Thorn progress reached 3/3. FX probes saw 6 petal particles on normal match and 16 petal + 2 line relic particles on Black Candle.
- Browser console/runtime status: 0 console messages, 0 page errors, and 0 failed browser requests in the desktop and mobile journey runs.
- Vercel/GitHub Pages status: not deployed or checked in this local pass.
- Known issues: Cursed Thorn fail/retry was not separately forced in this pass; the focused Round 2 Cursed Thorn clear path remained intact. The greenhouse scene is CSS-built and should eventually be replaced or supplemented with bespoke final art.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan found no private keys, common cloud/API tokens, JWTs, or key/token assignment patterns. No secrets, trackers, analytics, backend, accounts, ads, IAP, `.env`, credentials, broad permissions, or cron jobs added.

## 2026-07-12 Focused Round 2 refused-swap recovery

- Weakness selected: after the restored greenhouse handoff and first Cursed Thorn lesson, a bad adjacent swap in focused Round 2 fell back to the generic refusal log and did not restore the compact glowing-pair cue. This could make the first Moonlit Wreath follow-up feel stalled.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: restored Round 2 now uses the same compact `No bloom - follow the glowing pair` refusal recovery as Round 1, then restores the `NEXT BLOOM` target cue, two highlighted flowers, and the swap arrow. No controls, rounds, systems, assets, saves, backend, ads, analytics, IAP, or permissions were added.
- Verification: `python3 scripts/verify_project.py` passed, including HTML match-shape regression checks; `git diff --check` passed.
- Mobile browser at 390x844: fresh Round 1 showed 64 tiles, 8 complete rows, board 165px-543px, 2 hint tiles, 1 arrow, 0 visible non-tile controls, 0 broken images, and 0 overflow. The real two-swap Round 1 flow completed, `Restore Greenhouse` worked, `Next Order` reached focused Round 2 with 64 tiles, 8 rows, 2 hints, 1 arrow, and 0 controls. After the real thorn swap, an intentionally refused adjacent swap showed `No bloom - follow the glowing pair`, 2 invalid tiles, then restored `Nightshade next`, 2 hints, 1 arrow, 64 tiles, 0 broken images, and 0 overflow.
- Desktop browser at 1440x1000: fresh Round 1, completion, restore, and `Next Order` reached focused Round 2 with 64 tiles, 8 rows, 2 hints, 1 arrow, 0 visible non-tile controls, 0 broken images, and 0 overflow.
- Browser console/runtime status: 0 console warnings/errors, 0 page errors, and 0 failed requests in the final mobile and desktop checks.
- Known issues / next audit target: once focused Round 2 has taught the thorn and one ordinary follow-up, decide whether later Moonlit Wreath play should stay lightly guided or hand back fully unguided matching.
- Live/deploy status: source-local before commit and push; Vercel and GitHub Pages previews not checked in this pass.
- Security/secret-scan status: changed-file credential scan distinguished harmless UI/build-note words such as `reward-token`, `flowerpediaToken`, and historical security text from actual credential formats; no credential-like secrets found. No assets, trackers, analytics, backend, accounts, ads, IAP, `.env`, credentials, broad permissions, or cron jobs added.

## 2026-07-12 Round 2 next-bloom control return

- Weakness selected: after the first Cursed Thorn clear, the game already found and highlighted the next legal target move, but the focused cue stayed hidden because Round 2 had recorded its first move. Tapping the first highlighted flower also cleared the pair. This was the highest-impact remaining issue because control appeared to stall immediately after the blocker lesson.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: focused Round 2 now returns a compact `NEXT BLOOM` cue naming the next target and direction, keeps the arrow/highlight visible through the first tap, and resolves the second tap normally. No controls, systems, rewards, saves, or mechanics were added.
- Verification: `python3 scripts/verify_project.py` passed, including HTML match-shape regression checks; `git diff --check` passed.
- Mobile browser at 390x844: after the real thorn-clearing swap, `NEXT BLOOM · Nightshade next ↔` appeared immediately with 2 hint tiles and 1 arrow. The first tap preserved the cue, pair, arrow, and selected tile; the second tap resolved the Nightshade match. The focused board remained 64 tiles at 287px–665px with 0 visible non-tile controls, 0 broken images, and 0 overflow.
- Desktop browser at 1440x1000: the same follow-up cue, selection persistence, and ordinary swap passed with 64 tiles, board top 414px, 0 visible non-tile controls, 0 broken images, and 0 overflow.
- Browser console/runtime status: 0 console warnings/errors and 0 page errors in the mobile and desktop thorn -> next-bloom flows.
- Known issues / next audit target: assess whether focused Round 2 should remain guided after this ordinary follow-up or hand back fully unguided matching; prioritize player feel over adding content.
- Live/deploy status: source-local before commit and push; live previews not yet checked for this pass.
- Security: no assets, trackers, analytics, backend, accounts, ads, IAP, secrets, `.env`, credentials, or permissions added. Changed-file credential scan required immediately before commit.

## 2026-07-12 Focused Round 2 Cursed Thorn lesson

- Weakness selected: the first Round 2 blocker interaction worked mechanically but immediately reintroduced prototype-system noise. The focused objective exposed Shape Bloom and streak badges, while the first thorn clear dumped Flowerpedia and chapter reward copy. This was the highest-impact remaining issue because it diluted the first taught blocker and pushed the board down on mobile.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: focused Round 2 now labels the cue `CURSED THORN` with `Crack the marked thorns`, hides Shape Bloom/streak badges from the objective, suppresses Shape Bloom prose during the focused handoff, and summarizes active matches as thorn damage, collected order flowers, and coins. Existing unlock/reward state is still granted silently; no mechanics or saves were removed.
- Verification: `python3 scripts/verify_project.py` passed, including HTML match-shape regression checks; `git diff --check` passed.
- Mobile browser at 390x844: restored Round 2 showed the explicit thorn cue, 7 marked teaching cells, 64 tiles, board top 321px/bottom 699px, 0 visible non-tile controls, 0 broken images, and 0 horizontal overflow. The real guided swap cleared all 3 thorns, preserved 64 tiles, and produced concise thorn/flower/coin feedback with no chapter or Flowerpedia copy.
- Desktop browser at 1440x1000: restored Round 2 showed the same explicit cue and focused objective with 64 tiles, board top 414px, 0 visible non-tile controls, 0 broken images, and 0 horizontal overflow. The guided swap cleared all 3 thorns and kept the concise result copy.
- Browser console/runtime status: 0 console warnings/errors, 0 page errors, and 0 failed requests in the final mobile and desktop checks.
- Known issues / next audit target: after the first Cursed Thorn clear, evaluate whether the next ordinary target cue returns quickly enough without exposing legacy controls; do not add another system.
- Live/deploy status: source-local before commit and push; live previews not yet checked for this pass.
- Security: no assets, trackers, analytics, backend, accounts, ads, IAP, secrets, `.env`, credentials, or permissions added. Changed-file credential scan required immediately before commit.

## 2026-07-12 First bouquet coin reward clarity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first bouquet payoff clarity. The restoration headline now names one clear `+120 coin reward` instead of mixing the bouquet reward with incidental match-coin balance, keeping `match flowers -> complete bouquet -> earn coins -> restore greenhouse -> Next Order` easier to read without adding systems, controls, assets, saves, backend, analytics, ads, IAP, or permissions.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41015`; Chromium/Playwright via `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`. Mobile 390x844 fresh Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 2 hint tiles, 1 swap arrow, 0 visible non-tile buttons, 0 broken images, and no horizontal overflow. Guided play completed Round 1 and showed `First Bouquet Sealed · +120 coin reward` with only `Restore Greenhouse`; restore switched to only `Next Order`; Next Order reached `restored-next-order-focus` Round 2 with 64 tiles, 8 complete rows, board top 351px/bottom 729px, 0 visible non-tile buttons, 0 broken images, and no horizontal overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the mobile first-order replay.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local before push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the focused first-order mobile heartbeat path.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan found no credential-format matches; harmless coin/reward copy was not treated as secret material.
- Commit/push status: Codex created the local commit; its direct push lacked SSH permission, so the foreman integrated it safely after the concurrent remote commit and pushed with the repo-scoped key.

## 2026-07-12 Desktop Next Order viewport focus

- Weakness selected: after the restored greenhouse handoff, desktop could retain the completion card's scroll position and return to Round 2 with the board partly above the viewport. This was the highest-impact remaining first-minute hierarchy issue identified by the deterministic opening pass.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: the restored Round 1 -> Round 2 Next Order transition now anchors wide desktop viewports to the top of the game on the next animation frame. Mobile is deliberately unchanged.
- Verification: `python3 scripts/verify_project.py` passed, including HTML match-shape regression checks; `git diff --check` passed.
- Real-browser desktop 1440x1000: the focused regression deliberately scrolled the restored completion surface to scrollY 533 before clicking Next Order. The handoff returned to scrollY 0 with Round 2 active, board top 451px/bottom 1101px, 64 tiles, 0 visible non-tile controls, 0 broken images, and 0 horizontal overflow.
- Real-browser mobile 390x844: Next Order remained at scrollY 0 with Round 2 active, board top 399px/bottom 777px, 64 tiles, 0 visible non-tile controls, 0 broken images, and 0 horizontal overflow.
- Browser console/runtime status: 0 console warnings/errors and 0 page errors in the final mobile and desktop handoff checks.
- Known issues / next audit target: evaluate Round 2's first Cursed Thorn teaching cue and control return as one cohesive mobile interaction; do not add another system.
- Live/deploy status: source-local before commit and push; live previews not yet checked for this pass.
- Security: no assets, trackers, analytics, backend, accounts, ads, IAP, secrets, `.env`, credentials, or permissions added. Changed-file credential scan required immediately before commit.

## 2026-07-12 Deterministic opening lesson

- Weakness selected: the authored Round 1 lesson was still probabilistic. Random neighbors/refills could extend the first Thorn Rose match into a four-line or cascade into Bone Star, completing the bouquet before the player saw the dedicated Black Candle Vine move. This was the highest-impact remaining issue because it made the first-minute special-piece teaching unreliable.
- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, and `docs/codex_build_notes.md`.
- Player-visible change: the opening three-match now has explicit non-target boundaries, the dedicated Bone Star four-match has a left boundary, and only the two authored Round 1 tutorial swaps resolve a single wave before quietly normalizing accidental refill matches. The reliable flow is now Thorn Rose bloom -> Black Candle cue -> Black Candle Vine row clear -> bouquet completion. Full cascades remain unchanged after the tutorial swaps and in later rounds.
- Verification: `python3 scripts/verify_project.py` passed, including HTML match-shape regression checks; `git diff --check` passed.
- Focused browser regression: pre-fix sampling reproduced premature first-swap completion and accidental five-line Rune outcomes. Post-fix repeated real-click runs showed 0 first-swap completions, 4/4 second-swap completions, 4/4 `Black Candle Vine swept row 1` results, 64 tiles, 0 broken images, and 0 overflow.
- Mobile browser at 390x844: fresh Round 1 showed 64 tiles, all 8 rows from 199px to 577px, 2 hint tiles, 1 swap arrow, 0 visible non-tile controls, 0 broken images, and 0 horizontal overflow. The exact two-swap lesson completed, Restore Greenhouse worked, saved restoration survived reload, and Next Order reached focused Round 2 with 64 tiles, board 387px to 765px, 0 broken images, and 0 overflow.
- Desktop browser at 1440x1000: fresh Round 1 showed 64 tiles, 2 hint tiles, 1 swap arrow, 0 visible non-tile controls, 0 broken images, and 0 overflow. The exact two-swap lesson, restoration, save/reload, and Next Order flow passed with 64 tiles and focused Round 2.
- Browser console/runtime status: 0 console warnings/errors, 0 page errors, and 0 failed requests in the final mobile and desktop passes.
- Save/reload status: restored Round 1 persisted with Next Order visible; continuing reached active Round 2 with the restored board-first focus intact.
- Live/deploy status: source-local before commit and push; Vercel and GitHub Pages not yet checked for this pass.
- Known issue / next highest-impact item: desktop Next Order can retain the restoration scroll position, leaving the Round 2 board partly above the viewport. A later surgical pass should restore board focus without changing mobile behavior.
- Security: no assets, trackers, analytics, backend, accounts, ads, IAP, secrets, `.env`, credentials, or permissions added. Changed-file credential scan required immediately before commit.

## 2026-07-12 Selected hint-pair persistence

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-minute instructed-swap clarity. On mobile, tapping the first glowing tile cleared the glowing pair before the second tap, while the cue still said to tap the glowing adjacent flower. The selected state now preserves the two highlighted tiles and arrow until the actual swap resolves, without adding rounds, controls, systems, assets, save changes, backend, analytics, ads, IAP, debug surfaces, or permissions.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41014`; Chromium/Playwright via `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`. Mobile 390x844 fresh Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 2 hint tiles, 1 swap arrow, 0 broken images, and no horizontal overflow. After the first highlighted tap, the selected state kept 64 tiles, 2 hint tiles, 1 swap arrow, 1 selected tile, 8 complete rows, no overflow, and the real cue `Selected. Tap a glowing adjacent flower to swap.` The second mobile tap completed the instructed swap, triggered the Black Candle Vine bouquet completion path, preserved 64 tiles, removed hints/arrow, and showed only `Restore Greenhouse`.
- Restoration/Next Order browser check: same mobile run restored the greenhouse, switched from `Restore Greenhouse` to `Next Order`, then reached `restored-next-order-focus` Round 2 with 64 tiles, 8 complete rows, restored Greenhouse status visible, 0 broken images, and no horizontal overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the selected-hint and restoration handoff checks.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local before push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the focused first-tap, instructed-swap, and restoration handoff path.
- Review-hook verification notes: no visible debug/review controls were added. Existing post-Round-1 review hooks remain unchanged; L/T/cross can still be verified after Round 1 by clicking `Shape Bloom` or pressing `M`, and Supreme Bloom can still be verified without console by focusing the playable after Round 1 and pressing `B`.
- Security/secret-scan status: changed-file credential scan found no credential-format matches. Harmless words such as `token` in existing UI/build-note context were not treated as secrets.

## 2026-07-12 Objective token intake pulse

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-minute match-to-order readability. The matched-flower flight now lands into an objective token that visibly glints/absorbs the flower through the existing `order-pulse` state, making `match flowers -> complete bouquet` clearer without adding controls, rounds, systems, assets, save changes, backend, analytics, ads, IAP, or debug surfaces.
- Verification: `python3 scripts/verify_project.py` passed.
- Browser checks: local static server on `127.0.0.1:41013`; Chromium/Playwright via `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`. Mobile 390x844 fresh Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 2 hint tiles, 1 swap arrow, 0 visible non-tile controls, 0 broken images, and no horizontal overflow. After the guided first swap, a timing probe caught `.objective-target.order-pulse::after` running `objective-sip` on `Thorn Rose 3/3`, with 64 tiles, 0 broken images, and no overflow. A preservation pass used the existing hidden `N` review key to reach bouquet completion, clicked real `Restore Greenhouse` and `Next Order`, and reached restored Round 2 focus with 64 tiles, 8 complete board rows, restored Greenhouse status visible, 0 broken images, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the mobile first-swap pulse and restoration handoff checks.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local before push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: normal mobile guided-click automation can lose the second tap after the first swap because the board re-renders under the test harness; manual play and the focused pulse path are clean. No new player-visible issue found.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan found no credential-format matches. Harmless words such as `token` in existing UI/build-note context were not treated as secrets.

## 2026-07-12 Objective flights from matched flowers

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-minute match-to-order feedback. The existing objective-flight animation always began at board center, so the harvested flowers did not visibly travel from the matched cells into the order targets. This pass keeps the same animation but starts it from the actual matched flower cells when source cells are known.
- Gameplay change: match resolution now records `gainedCells` alongside order counts; objective flights use those board-cell origins, and Black Candle line clears pass their burned cells through the same path. No rounds, controls, currencies, systems, assets, SDKs, backend, analytics, ads, IAP, debug surfaces, permissions, or save-shape changes were added.
- Verification: `python3 scripts/verify_project.py` passed before and after the change.
- Browser checks: local static server on `127.0.0.1:8000`; Chromium/Playwright via `NODE_PATH=/opt/data/home/.npm/_npx/420ff84f11983ee5/node_modules`. Mobile 390x844 fresh Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 0 visible controls before first move, 0 broken images, and no horizontal overflow. Guided first swap preserved 64 tiles and showed post-match order progress. Targeted timing check observed an `objective-flight` image during the post-match window with 64 tiles, 0 broken images, and no overflow. Review-key payoff check completed Round 1, restored the greenhouse, and entered restored Round 2 focus with 64 tiles, 0 broken images, no overflow, and restored Greenhouse status visible.
- Browser console status: 0 console messages and 0 page errors in the mobile first-swap, objective-flight timing, and Round 1 -> restored Round 2 payoff checks.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local before push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the focused mobile first-swap and Round 1 -> restored Round 2 checks.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan found no credential-like secrets. No secrets, trackers, backend, SDKs, broad permissions, ads, IAP, analytics, or cron jobs were added.

## 2026-07-12 Restored greenhouse status in Round 2 focus

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: after the settled Round 2 board-focus commit, active Moonlit Wreath play stayed compact but no longer carried a visible restored-greenhouse payoff near the board. This pass adds one compact, non-interactive restored Greenhouse XP status line during `restored-next-order-focus`.
- Gameplay change: the restored Round 2 board now shows `RESTORED GREENHOUSE` with the saved Greenhouse level/XP and Moonlit Wreath copy above the board. It adds no controls, rounds, currencies, resources, boosters, blockers, systems, assets, SDKs, backend, analytics, ads, IAP, debug surfaces, or cron jobs.
- Verification: `python3 scripts/verify_project.py` passed; `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41012` with Chromium/Playwright from `/tmp/bloom-pw-Gz961U`. Mobile 390x844 verified fresh Round 1 had 64 tiles, 8 complete rows, board top 199px/bottom 577px, 0 visible controls, hidden restored status, 0 broken images, and no overflow. Guided play completed Round 1, restored the greenhouse, tapped `Next Order`, waited for the handoff to settle, and made a real Round 2 guided swap. Settled Round 2 showed the restored status, 64 tiles, 8 complete rows, board top 351px/bottom 729px, 0 visible controls, 0 broken images, and no overflow; after the Round 2 swap it kept 64 tiles, 8 complete rows, board top 281px/bottom 659px, 0 visible controls, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local before push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the focused Round 1 -> restored Round 2 mobile path.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan distinguished real credential formats from harmless UI/build-note words such as `reward-token` and `flowerpediaToken`; no credential-like secrets found. No secrets, trackers, backend, SDKs, broad permissions, ads, IAP, analytics, or cron jobs were added.

## 2026-07-12 Settled Round 2 board focus

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: the known mobile Round 2 regression after the first valid Moonlit Wreath move. Recent commits already carried focus through the restored handoff and opening swap cue; this pass keeps the stripped board-first shell active for the rest of active Round 2 instead of unlocking the legacy prototype layout after the first swap.
- Gameplay change: `restored-next-order-focus` now covers active restored Round 2 until bouquet completion, while the `NEXT ORDER` cue remains limited to the pre-first-move state. Legacy rails, ledgers, factions, Chest/Flowerpedia/Chapter/Black Market/Sacrifice/booster/review controls stay hidden during the active Moonlit Wreath focus, with mechanics and later rounds preserved.
- Verification: `python3 scripts/verify_project.py` passed; `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41011` with Chromium/Playwright from `/tmp/bloom-playwright`. Mobile 390x844 verified fresh Round 1 had 64 tiles, 8 complete rows, board top 199px/bottom 577px, 0 visible non-tile buttons, 0 broken images, and no overflow. Guided play completed Round 1, restored the greenhouse, tapped `Next Order`, waited for the handoff to settle, then made the first valid Round 2 swap. Settled active Round 2 kept `restored-next-order-focus first-move-made`, 64 tiles, 8 complete rows, board top 234px/bottom 612px, 0 visible non-tile buttons, 0 broken images, and no horizontal overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local before push.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: none found in the focused Round 1 -> restored Round 2 mobile path.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential scan distinguished real key/token formats from harmless UI words such as `reward-token`/`flowerpediaToken`; no credential-like secrets found. No secrets, trackers, backend, SDKs, broad permissions, ads, IAP, analytics, or cron jobs were added.

## 2026-07-12 Restored next order board focus

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: the known post-handoff mobile regression. Recent commits already covered first swap, Black Candle teaching, audio, coin burst, greenhouse restoration, Next Order handoff, and XP payoff; this pass keeps the first Moonlit Wreath move board-first after the restored greenhouse handoff clears.
- Gameplay change: after `Next Order`, Round 2 now remains in a compact `restored-next-order-focus` state until the first valid move: side/bottom/prototype controls stay hidden, the board keeps all 8 rows visible on mobile, and the existing glowing-pair cue/arrow appears quickly for the opening Moonlit Wreath swap. No rounds, currencies, systems, debug controls, assets, backend, SDKs, or permissions were added.
- Verification: `python3 scripts/verify_project.py` passed; `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41010` with Chromium/Playwright from `/tmp/bloom-playwright`. Mobile 390x844 verified fresh Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 0 visible controls, 1 arrow, no broken images, and no overflow. Guided tile taps completed Round 1, restored the greenhouse, tapped `Next Order`, saw the handoff with 64 tiles and 8 complete rows, then after the handoff cleared verified `restored-next-order-focus` with 64 tiles, 8 complete rows, board top 304px/bottom 682px, 0 visible controls, `Swap the glowing pair`, 1 arrow, no broken images, and no overflow. The first Round 2 guided swap removed the focus state, preserved 64 tiles, and returned the broader prototype controls.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: after the first valid Round 2 move, the broader prototype layout returns and only 4 complete board rows are visible on 390x844; unchanged beyond the first restored next-order move.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan returned no hits. No secrets, trackers, backend, SDKs, or new permissions were added.

## 2026-07-12 Greenhouse XP payoff vial

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first bouquet restoration payoff. Recent commits already covered first swap clarity, Black Candle teaching, audio, coin burst, restoration, and Next Order handoff; this pass makes the hidden Greenhouse XP upgrade visible inside the existing restoration card without adding controls, rounds, currencies, or systems.
- Gameplay change: after Round 1 completion, the restoration card now shows a compact `Greenhouse +180 XP` vial using the real saved Greenhouse XP total. Before Restore it reads as banked progress; after `Restore Greenhouse` it pulses and changes to locked-in progress before `Next Order`.
- Verification: `python3 scripts/verify_project.py` passed.
- Browser checks: local static server on `127.0.0.1:41009` with Chromium/Playwright from `/tmp/bloom-playwright` because `agent-browser` was unavailable. Mobile 390x844 verified fresh Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 0 visible non-tile controls, no overflow, and 0 broken images. Guided tile clicks completed Round 1, showed the restoration card with `GREENHOUSE +180 XP`, `1,420 / 2,000 XP`, and a visible XP fill; `Restore Greenhouse` changed the copy to `Upgrade progress locked in`; `Next Order` reached Round 2 handoff with 64 tiles, 8 complete board rows, no visible controls, no overflow, and the handoff cue visible.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: after the transient handoff clears, Round 2 still returns the broader prototype layout and only 4 complete board rows are visible on 390x844; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-line credential-pattern scan only matched this security-status sentence; broader changed-file scan only flagged historical build-note wording and existing UI names like `reward-token`/`flowerpediaToken`, with no credential-like secrets found. No secrets, trackers, backend, SDKs, or new permissions were added.

## 2026-07-12 Restored greenhouse Next Order handoff

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: Round 1-to-Next-Order handoff clarity. Recent commits already covered opening objective, guided swap/arrow/recovery, authored Black Candle lesson, audio, coin burst, and restoration; this pass makes the tap from restored greenhouse into Moonlit Wreath feel like a deliberate board-first return.
- Gameplay change: tapping `Next Order` after the first greenhouse restoration now triggers a short `Restored Greenhouse - Moonlit Wreath begins` banner, green board glow, compact mobile hierarchy, no visible controls, and ritual copy that names the relit glass. It is transient, unsaved, and only applies to the restored Round 1 -> Round 2 handoff.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41008` with Chromium/Playwright from `/tmp/bloom-playwright`. Fresh mobile 390x844 Round 1 had 64 tiles, 8 complete board rows, board top 199px/bottom 577px, 0 visible non-tile controls, 0 visible future preview sections, 0 broken images, and no horizontal overflow. Normal guided tile taps completed Round 1, showed restoration, restored the greenhouse, clicked `Next Order`, and verified the handoff with 64 tiles, 8 complete board rows, board top 318px/bottom 696px, 0 visible controls, no overflow, `Restored Greenhouse` cue text, and Round 2 objective visible. The transient handoff cleared after ~2.4s with 64 tiles and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: after the transient handoff clears, Round 2 still returns the broader prototype controls and only 4 complete board rows are visible on 390x844; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-line credential-pattern scan returned no hits. Whole changed-file scan only flagged existing harmless `*Token` display variable names and historical build-note wording, with no credential-like secrets found. No secrets, trackers, backend, SDKs, or new permissions were added.
- Live/deploy status: source-only change committed locally for push; no deployment performed and no broad credentials used.

## 2026-07-12 Round 1 refused follow-up cue

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-minute recovery after a wrong swap during the Black Candle follow-up. Recent commits already covered first swap guidance, Black Candle teaching, restoration, audio, and coin payoff; this pass keeps the compact Round 1 cue visible after a refused post-first-move swap and restores the Black Candle/follow-up cue once the red tile flash clears.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41007` with Chromium/Playwright from `/tmp/bloom-playwright`. Mobile portrait 390x844 verified fresh Round 1 had 64 tiles, 2 highlighted hint tiles, 1 swap arrow, board top 199px/bottom 577px, 0 visible non-tile buttons, 0 visible future preview sections, 0 broken images, and no horizontal overflow. After the first valid swap, one Shuffle button was visible; an intentionally illegal adjacent swap showed `No bloom - follow the glowing pair.`, 2 invalid tiles, then restored `Make 4 Bone Stars - Black Candle Vine burns a row.` with 2 hint tiles and 1 arrow. Console/page/request status stayed clean.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-line credential-pattern scan only matched this security-status sentence; whole changed-file scan otherwise flagged existing harmless docs wording and local `*Token` display variable names, with no credential-like secrets found.

## 2026-07-12 Round 1 coin payoff burst

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: bouquet payoff readability. Recent commits already covered board-first hierarchy, first swap guidance, invalid recovery, Black Candle teaching, greenhouse restoration clarity, and audio; this pass makes the first bouquet coin reward visibly burst across the existing restoration card before the player spends coins on the greenhouse.
- Gameplay change: Round 1 completion now shows six animated coin motes in the existing restoration surface. They are decorative, clipped inside the card, removed visually after `Restore Greenhouse`, and add no controls, currencies, systems, assets, permissions, or Round 58 content.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41006` with Chromium/Playwright from `/tmp` because `agent-browser` was unavailable. Mobile portrait 390x844 verified fresh Round 1 had 64 tiles, 2 highlighted hint tiles, 1 swap arrow, board top 199px/bottom 577px, 0 visible non-tile buttons, no horizontal overflow, and 0 broken images. The guided Round 1 flow completed through the glowing pairs, showed the restoration card with 6 `coin-payoff` motes using `coin-payoff-flight`, restored the greenhouse, verified the coin motes were hidden, clicked `Next Order`, and reached Round 2 with 64 tiles, no broken images, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-12 First-minute ritual audio cues

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-minute sound/visual timing. Recent commits already handled opening swap guidance, invalid-swap recovery, Black Candle Vine teaching, tactile snap, reward meaning, and greenhouse restoration payoff; this pass adds low-volume synthesized audio cues to the existing refused swap, match harvest, Black Candle Vine line relic, bouquet complete, and greenhouse restore moments without adding assets, controls, permissions, or systems.
- Gameplay change: player gestures now unlock a tiny Web Audio tone stack for the core heartbeat: refused graft thud, bloom chime, deeper Black Candle undertone, bouquet-complete cadence, and greenhouse restore rise. Audio startup failures are caught silently so browsers that deny audio remain playable.
- Verification: `python3 scripts/verify_project.py` passed; `/opt/data/tools/godot/Godot_v4.2.2-stable_linux.x86_64 --headless --path . --script res://tests/godot_smoke_test.gd` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41005` with Chromium/Playwright from `/tmp`. Mobile portrait 390x844 verified fresh Round 1 had 64 tiles, 2 highlighted hint tiles, 1 swap arrow, board top 199px/bottom 577px, 0 visible future preview sections, no horizontal overflow, 0 broken images, 0 visible non-tile buttons, and AudioContext support. The flow made one invalid adjacent swap and saw two invalid tiles plus `No bloom — follow the glowing pair.`, then completed the guided Round 1 path including Black Candle Vine, saw Restore Greenhouse, restored the greenhouse, clicked `Next Order`, and reached Round 2 with 64 tiles, no arrow, no broken images, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-12 First-swap arrow clarity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-move clarity on mobile. Recent commits already recovered cue text, invalid-swap response, Black Candle Vine teaching, reward meaning, and greenhouse restoration; this pass adds an in-board arrow between the two glowing hint tiles so the instructed swap reads instantly without adding buttons, paragraphs, or systems.
- Gameplay change: Round 1 hint pairs now render one non-interactive `swap-path-arrow` overlay between adjacent `idle-hint` tiles. It disappears on bouquet completion and is not shown after leaving Round 1. Tile count and click/touch targets remain unchanged.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41004` with Chromium/Playwright installed transiently under `/tmp`. Mobile portrait 390x844 verified fresh Round 1 had 64 tiles, 2 highlighted hint tiles, 1 swap arrow, board top 199px/bottom 577px, 0 visible future preview sections, no horizontal overflow, 0 broken images, and 0 visible non-tile buttons before the first move. The guided path completed Round 1, verified the arrow was gone, saw Restore Greenhouse, restored the greenhouse, clicked `Next Order`, and reached Round 2 with 64 tiles, no arrow, no broken images, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-12 First-minute cue recovery

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first-minute control return after a refused or non-target follow-up swap. Recent commits already handled the opening cue, authored Black Candle Vine lesson, reward meaning, and greenhouse restoration payoff; this pass keeps the player oriented when a Round 1 move does not immediately hand back the target-specific cue.
- Gameplay change: invalid first swaps now briefly show `No bloom — follow the glowing pair.` and then restore the exact glowing-pair cue plus highlighted tiles. If Round 1 remains active after a valid move but no target-specific legal move is available, the board now highlights a legal fallback pair with `Keep matching - swap the glowing pair.` No new controls, rounds, systems, currencies, or debug surfaces were added.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local static server on `127.0.0.1:41003` with transient Playwright/Chromium from `/tmp`. Mobile portrait 390x844 verified fresh Round 1 had 64 tiles, board top 199px/bottom 577px, 0 broken images, 0 visible future preview sections, no horizontal overflow, 0 visible non-tile buttons before the first move, and the opening `Swap the glowing pair` cue with two highlighted tiles. Focused path clicked an invalid adjacent pair, verified two invalid-swap tiles and `No bloom — follow the glowing pair.`, then verified the cue restored to `Swap the glowing pair` with two highlighted tiles and 64 tiles. The same run completed Round 1 through the guided path, saw the Black Candle Vine cue, restored the greenhouse, clicked `Next Order`, and reached Round 2 with 64 tiles, no broken images, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile run.
- Vercel deployment URL/identifier checked: not deployed or checked; this pass is source-local only.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-12 Black Candle Vine cue clarity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: the opening Black Candle Vine lesson could be missed when the first guided swap only completed Thorn Rose and the Bone Star four-match came next. This pass keeps the same authored board and adds a compact `BLACK CANDLE` cue only when the Bone Star four-match is the active highlighted move.
- Gameplay change: Round 1 now reuses the existing first-swap cue after the first move when needed, showing `Make 4 Bone Stars - Black Candle Vine burns a row.` while the two Bone Star hint tiles glow. No new controls, rounds, systems, or debug surfaces were added.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed.
- Browser checks: local server on `127.0.0.1:41002` with transient Playwright/Chromium. Mobile 390x844 verified fresh Round 1 had 64 tiles, board top 199px/bottom 577px, 0 broken images, 0 visible future preview sections, no horizontal overflow, and 0 visible non-tile buttons before the first move. The first-move completion path verified `Black Candle Vine swept row`, restoration visible, Restore -> Restored -> Next Order, then Round 2 with 64 tiles. A repeated fresh-load cue-path check hit the non-complete first move on attempt 1 and verified the visible `BLACK CANDLE` cue, two highlighted tiles, 64 tiles, 0 broken images, and no overflow.
- Browser console status: 0 console messages, 0 page errors, and 0 failed browser requests in the focused mobile runs.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-12 Greenhouse restoration payoff clarity

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: first bouquet restoration payoff clarity. Recent commits already handled the opening swap, objective clarity, reward meaning, restoration animation, and Black Candle Vine lesson, so this pass made the existing coin spend and Next Order handoff more obvious without adding systems.
- Gameplay change: the Round 1 completion surface now shows a compact payoff ledger (`+120` bouquet coins, `-100` greenhouse spend, `Moonlit Wreath` next order), adds lit lantern/vine restoration details, changes the restored title to `Greenhouse Restored`, and names the next order directly before the one-tap `Next Order`.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed. Local static server on `127.0.0.1:41001` returned `200 OK` for the playable. `agent-browser` was unavailable in this environment, so transient Playwright/Chromium from `/tmp` was used for real browser checks.
- Browser checks: mobile Chromium 390x844 verified fresh Round 1 had 64 tiles, board top 199px/bottom 577px, all 8 rows visible, 0 visible future diary sections, no horizontal overflow, and no visible non-tile controls before first move. Mobile and desktop Chromium both completed Round 1 through the guided swaps, showed the withered greenhouse with Restore only, restored to `RESTORED · MIDNIGHT BLOOM` with `Greenhouse Restored` and `Unlocked Moonlit Wreath`, showed Next Order only, then reached Round 2 with 64 tiles and board visible.
- Browser console status: mobile and desktop Playwright runs observed 0 console warnings/errors, 0 page errors, 0 failed browser requests, and 0 broken images.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 still returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-12 Authored Black Candle Vine first-minute lesson

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Gap chosen: authored four-match Black Candle Vine teaching. This was the highest-impact remaining first-60-seconds item because recent commits already covered objective clarity, first swap cue, tactile feedback, bouquet payoff, and greenhouse restoration.
- Gameplay change: Round 1 still opens with a simple target match, then the next Bone Star target is resiliently authored into a four-line swap that triggers the existing `Black Candle Vine swept row 1` payoff before bouquet completion.
- Stability fix: target-flight particles now use the tile asset path instead of flower lore text, removing transient 404 console errors during collection feedback.
- Verification: `python3 scripts/verify_project.py` passed; `git diff --check` passed. Local Chromium via Playwright at 390x844 verified fresh Round 1 had 64 tiles, board top 199px/bottom 577px, no horizontal overflow, 0 broken images, 0 visible future diary sections, 0 non-tile controls before first move, and no console/page/request errors. First guided swap collected Thorn Rose; second guided swap produced `Black Candle Vine swept row 1`, completed the bouquet, showed `Restore Greenhouse`, then `Next Order` reached Round 2 with 64 tiles and no overflow.
- Focused interaction tested: target-first cue, first swap, authored Bone Star four-match, Black Candle Vine payoff, bouquet completion, greenhouse restore, Next Order.
- Browser console status: 0 warnings/errors after the target-flight source fix.
- Vercel deployment URL/identifier checked: not redeployed or checked in this local pass.
- GitHub Pages preview status: not checked in this local pass.
- Known issues: Round 2 returns the broader prototype controls after Next Order; unchanged by this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, click `Shape Bloom` repeatedly or press `M`; demos cycle through line5, line4, `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom`.
- How to trigger and verify Supreme Bloom without console: focus the playable after Round 1 and press `B`; the `SUPREME BLOOM!` overlay should appear and return the board to 64 tiles.
- Security/secret-scan status: changed-file credential-pattern scan passed with no credential-like secrets found.

## 2026-07-11 First 60 Seconds / Board-First vertical slice

- Files changed: `playable/midnight_bloom_prototype.html`, `scripts/verify_html_match_shapes.py`, `docs/codex_build_notes.md`.
- Round 1 now hides progression/ledger/previews/resources/storage/faction/sacrifice/boosters/review controls, presents the full 8x8 board immediately, and exposes only Shuffle during active play.
- Added an immediate glowing legal-swap cue, clearer selection instruction, preserved invalid/clear/cascade/collection effects, and kept Supreme Bloom out of the tutorial.
- Added a concise completion screen with one 100-coin greenhouse restoration, a strong withered-to-lit visual transformation, persisted restoration state, and one-tap `Next Order`.
- Verification: `python3 scripts/verify_project.py` passed; HTML regression checks passed; `git diff --check` passed. Local real-browser 390x844 iframe measured board top 175px/bottom 553px (all 8 rows), 64 tiles, one non-tile button, 0 broken images, 0 horizontal overflow, and 0 console/JS errors. Completion showed only Restore; restoration changed to `RESTORED · MIDNIGHT BLOOM` and only Next Order; Next Order reached Round 2 with 64 tiles and no overflow. Reload preserved the completed save before restoration, and restoration explicitly saves its state. Lightweight changed-file secret scan: 0 hits. No live deployment checked before push.
- Known issues: none found in the focused slice.

## 2026-07-09 Codex Round 57 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 56 and requested a narrow Round 57 `Moonlit Wreath 12` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 57 Moonlit Wreath Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(57)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftySevenPreview`, including current copy that names `Moonlit Wreath 12`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 57 encore Moonlit Wreath surface and its five `data-round-fifty-seven-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 56 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run so far:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4277/playable/midnight_bloom_prototype.html?verify=round57-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftySevenPreview`, `Round 57 Moonlit Wreath Encore`, `Moonlit Wreath 12`, `Round 57 encore Moonlit Wreath payoff`, `data-round-fifty-seven-state="current"`, `function renderRoundFiftySevenPreview`, `roundFiftySixPreview`, and `First Bouquet 12`.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 55 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Local Playwright progressed Round 1 -> Round 57 with 64 tiles preserved and verified the opened Round 57 current copy, preserved Round 56 marker copy, and Round 57 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_8WwV47yuZBBfT5cSSehnX9z7EfQp` at `https://bloom-tycoon-ptugy12ko-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round57-vercel-direct-2fc127a`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 57 markers plus preserved Round 56 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 55 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Vercel Playwright verified Round 1 -> Round 57 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `2fc127a` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round57-gh-pages-direct-2fc127a`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 57 markers plus preserved Round 56 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 57 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 57 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_8WwV47yuZBBfT5cSSehnX9z7EfQp`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `2fc127a`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-09 Codex Round 56 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 55 and requested a narrow Round 56 `First Bouquet 12` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 56 First Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(56)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftySixPreview`, including current copy that names `First Bouquet 12`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 56 encore First Bouquet surface and its five `data-round-fifty-six-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 55 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4276/playable/midnight_bloom_prototype.html?verify=round56-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftySixPreview`, `Round 56 First Bouquet Encore`, `First Bouquet 12`, `Round 56 encore First Bouquet payoff`, `data-round-fifty-six-state="current"`, `function renderRoundFiftySixPreview`, and preserved Round 55 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 53 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Local Playwright progressed Round 1 -> Round 56 with 64 tiles preserved and verified the opened Round 56 current copy, preserved Round 55 marker copy, and Round 56 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_C7du17noDm3zruxbwJ2eF2yaQWsb` at `https://bloom-tycoon-1gisp2axx-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round56-vercel-direct-180b408`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 56 markers plus preserved Round 55 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 53 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Vercel Playwright verified Round 1 -> Round 56 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `180b408` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round56-gh-pages-direct-180b408`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 56 markers plus preserved Round 55 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 56 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 56 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_C7du17noDm3zruxbwJ2eF2yaQWsb`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `180b408`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-09 Codex Round 55 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 54 and requested a narrow Round 55 `Sub Rosa Grand Bouquet 11` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 55 Sub Rosa Grand Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(55)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftyFivePreview`, including current copy that names `Sub Rosa Grand Bouquet 11`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 55 encore Sub Rosa Grand Bouquet surface and its five `data-round-fifty-five-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 54 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4275/playable/midnight_bloom_prototype.html?verify=round55-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftyFivePreview`, `Round 55 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 11`, `Round 55 encore Sub Rosa Grand Bouquet payoff`, `data-round-fifty-five-state="current"`, `function renderRoundFiftyFivePreview`, and preserved Round 54 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 52 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Local Playwright progressed Round 1 -> Round 55 with 64 tiles preserved and verified the opened Round 55 current copy, preserved Round 54 marker copy, and Round 55 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_5rBLSgd3nhmGHjyBb8QvQVT4Y9YU` at `https://bloom-tycoon-rfw4nyoxp-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round55-vercel-direct-2ba1110`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 55 markers plus preserved Round 54 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 52 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Vercel Playwright verified Round 1 -> Round 55 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `2ba1110` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round55-gh-pages-direct-2ba1110`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 55 markers plus preserved Round 54 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 55 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 55 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_5rBLSgd3nhmGHjyBb8QvQVT4Y9YU`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `2ba1110`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-09 Codex Round 54 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 53 and requested a narrow Round 54 `Saint's Night Ledger 11` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 54 Saint's Night Ledger Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(54)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftyFourPreview`, including current copy that names `Saint's Night Ledger 11`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 54 encore Saint's Night Ledger surface and its five `data-round-fifty-four-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 53 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4274/playable/midnight_bloom_prototype.html?verify=round54-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftyFourPreview`, `Round 54 Saint's Night Ledger Encore`, `Saint's Night Ledger 11`, `Round 54 encore Saint's Night Ledger payoff`, `data-round-fifty-four-state="current"`, `function renderRoundFiftyFourPreview`, and preserved Round 53 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 51 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Local Playwright progressed Round 1 -> Round 54 with 64 tiles preserved and verified the opened Round 54 current copy, preserved Round 53 marker copy, and Round 54 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_Amn82Zd7uL2UizDw7CgkkynbH7Zp` at `https://bloom-tycoon-34t6ed4q9-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round54-vercel-direct-7664bc4`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 54 markers plus preserved Round 53 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 51 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Vercel Playwright verified Round 1 -> Round 54 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `7664bc4` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round54-gh-pages-direct-7664bc4`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 54 markers plus preserved Round 53 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 54 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 54 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_Amn82Zd7uL2UizDw7CgkkynbH7Zp`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `7664bc4`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 53 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 52 and requested a narrow Round 53 `Bloodroot Compact 11` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 53 Bloodroot Compact Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(53)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftyThreePreview`, including current copy that names `Bloodroot Compact 11`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 53 encore Bloodroot Compact surface and its five `data-round-fifty-three-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 52 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4273/playable/midnight_bloom_prototype.html?verify=round53-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftyThreePreview`, `Round 53 Bloodroot Compact Encore`, `Bloodroot Compact 11`, `Round 53 encore Bloodroot Compact payoff`, `data-round-fifty-three-state="current"`, `function renderRoundFiftyThreePreview`, and preserved Round 52 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 50 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Local Playwright progressed Round 1 -> Round 53 with 64 tiles preserved and verified the opened Round 53 current copy, preserved Round 52 marker copy, and Round 53 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_CH2ja1jaCMLiw7cNq37pkS3yvHfU` at `https://bloom-tycoon-gg7v8xauv-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round53-vercel-direct-dc517ec`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 53 markers plus preserved Round 52 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 50 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, first tile top at 487px, and no horizontal overflow.
  - Vercel Playwright verified Round 1 -> Round 53 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `dc517ec` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round53-gh-pages-direct-dc517ec`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 53 markers plus preserved Round 52 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 53 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 53 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_CH2ja1jaCMLiw7cNq37pkS3yvHfU`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `dc517ec`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 52 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 51 and requested a narrow Round 52 `Moonlit Wreath 11` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 52 Moonlit Wreath Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(52)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftyTwoPreview`, including current copy that names `Moonlit Wreath 11`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 52 encore Moonlit Wreath surface and its five `data-round-fifty-two-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 51 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --rebase --autostash origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4272/playable/midnight_bloom_prototype.html?verify=round52-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftyTwoPreview`, `Round 52 Moonlit Wreath Encore`, `Moonlit Wreath 11`, `Round 52 encore Moonlit Wreath payoff`, `data-round-fifty-two-state="current"`, `function renderRoundFiftyTwoPreview`, and preserved Round 51 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 49 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 52 with 64 tiles preserved and verified the opened Round 52 current copy, preserved Round 51 marker copy, and Round 52 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_HCVuiK4VZUFPvJjtXqYMqPuvvZJd` at `https://bloom-tycoon-kdqdepc4z-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round52-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 52 markers plus preserved Round 51 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 49 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 52 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `76b87be` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round52-gh-pages-direct-76b87be`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 52 markers plus preserved Round 51 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 52 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 52 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_HCVuiK4VZUFPvJjtXqYMqPuvvZJd`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `76b87be`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 51 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 50 and requested a narrow Round 51 `First Bouquet 11` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 51 First Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(51)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftyOnePreview`, including current copy that names `First Bouquet 11`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 51 encore First Bouquet surface and its five `data-round-fifty-one-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 50 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4272/playable/midnight_bloom_prototype.html?verify=round51-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftyOnePreview`, `Round 51 First Bouquet Encore`, `First Bouquet 11`, `Round 51 encore First Bouquet payoff`, `data-round-fifty-one-state="current"`, `function renderRoundFiftyOnePreview`, and preserved Round 50 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 48 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 51 with 64 tiles preserved and verified the opened Round 51 current copy, preserved Round 50 marker copy, and Round 51 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_3uXaeynKKnEJPZaUFN9DMJLjMXyZ` at `https://bloom-tycoon-p0vh90ag9-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round51-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 51 markers plus preserved Round 50 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 48 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 51 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `87da64e` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round51-gh-pages-direct-87da64e`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 51 markers plus preserved Round 50 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 51 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 51 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_3uXaeynKKnEJPZaUFN9DMJLjMXyZ`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `87da64e`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 50 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 49 and requested a narrow Round 50 `Sub Rosa Grand Bouquet 10` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 50 Sub Rosa Grand Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(50)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFiftyPreview`, including current copy that names `Sub Rosa Grand Bouquet 10`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 50 encore Sub Rosa Grand Bouquet surface and its five `data-round-fifty-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 49 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4271/playable/midnight_bloom_prototype.html?verify=round50-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFiftyPreview`, `Round 50 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 10`, `Round 50 encore Sub Rosa Grand Bouquet payoff`, `data-round-fifty-state="current"`, `function renderRoundFiftyPreview`, and preserved Round 49 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 47 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 50 with 64 tiles preserved and verified the opened Round 50 current copy, preserved Round 49 marker copy, and Round 50 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_6FshTpa8VM1cV1f8GL7j5fojkZjx` at `https://bloom-tycoon-jr1xbezyu-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round50-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 50 markers plus preserved Round 49 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 47 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 50 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `aff139a` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round50-gh-pages-direct-aff139a`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 50 markers plus preserved Round 49 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 50 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 50 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_6FshTpa8VM1cV1f8GL7j5fojkZjx`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `aff139a`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 49 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 48 and requested a narrow Round 49 `Saint's Night Ledger 10` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 49 Saint's Night Ledger Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(49)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyNinePreview`, including current copy that names `Saint's Night Ledger 10`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 49 encore Saint's Night Ledger surface and its five `data-round-forty-nine-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 48 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4270/playable/midnight_bloom_prototype.html?verify=round49-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/amber_resin_seed.png`, and `assets/tiles/96/crimson_rose_rune.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyNinePreview`, `Round 49 Saint's Night Ledger Encore`, `Saint's Night Ledger 10`, `Round 49 encore Saint's Night Ledger payoff`, `data-round-forty-nine-state="current"`, `function renderRoundFortyNinePreview`, and preserved Round 48 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 46 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 49 with 64 tiles preserved and verified the opened Round 49 current copy, preserved Round 48 marker copy, and Round 49 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_J8vb12oeMTK2sFAuJG3FCgjm6iB3` at `https://bloom-tycoon-fr0hc65qb-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round49-vercel-direct`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/amber_resin_seed.png`, and `assets/tiles/96/crimson_rose_rune.png`; downloaded HTML contained the Round 49 markers plus preserved Round 48 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 46 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 49 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `15dc3ec` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round49-gh-pages-direct-15dc3ec`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/amber_resin_seed.png`, and `assets/tiles/96/crimson_rose_rune.png`; downloaded HTML contained the Round 49 markers plus preserved Round 48 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 49 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 49 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_J8vb12oeMTK2sFAuJG3FCgjm6iB3`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `15dc3ec`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 48 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 47 and requested a narrow Round 48 `Bloodroot Compact 10` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 48 Bloodroot Compact Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(48)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyEightPreview`, including current copy that names `Bloodroot Compact 10`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 48 encore Bloodroot Compact surface and its five `data-round-forty-eight-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 47 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4269/playable/midnight_bloom_prototype.html?verify=round48-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyEightPreview`, `Round 48 Bloodroot Compact Encore`, `Bloodroot Compact 10`, `Round 48 encore Bloodroot Compact payoff`, `data-round-forty-eight-state="current"`, `function renderRoundFortyEightPreview`, and preserved Round 47 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 45 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 48 with 64 tiles preserved and verified the opened Round 48 current copy, preserved Round 47 marker copy, and Round 48 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_Dmh8XApmN2dKMBxHpLvbF93CW4Rt` at `https://bloom-tycoon-qtfg7qk8o-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round48-vercel-direct`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 48 markers plus preserved Round 47 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 45 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 48 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `d488663` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round48-gh-pages-direct-d488663`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 48 markers plus preserved Round 47 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 48 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 48 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_Dmh8XApmN2dKMBxHpLvbF93CW4Rt`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `d488663`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed before source commit and again for the final docs-only live-status update.

## 2026-07-08 Codex Round 47 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 46 and requested a narrow Round 47 `Moonlit Wreath 10` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 47 Moonlit Wreath Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(47)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortySevenPreview`, including current copy that names `Moonlit Wreath 10`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 47 encore Moonlit Wreath surface and its five `data-round-forty-seven-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 46 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4268/playable/midnight_bloom_prototype.html?verify=round47-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortySevenPreview`, `Round 47 Moonlit Wreath Encore`, `Moonlit Wreath 10`, `Round 47 encore Moonlit Wreath payoff`, `data-round-forty-seven-state="current"`, `function renderRoundFortySevenPreview`, and preserved Round 46 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 44 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 47 with 64 tiles preserved and verified the opened Round 47 current copy, preserved Round 46 marker copy, and Round 47 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_94f6omZuZekJkgZFx4WrjjA5DzS1` at `https://bloom-tycoon-oljxr6xfl-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round47-vercel-direct`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 47 markers plus preserved Round 46 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 44 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 47 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `865e576` after 2 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round47-gh-pages-direct-865e576`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 47 markers plus preserved Round 46 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 47 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 47 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_94f6omZuZekJkgZFx4WrjjA5DzS1`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `865e576`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed for the three changed files before deploy.

## 2026-07-08 Codex Round 46 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 45 and requested a narrow Round 46 `First Bouquet 10` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 46 First Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(46)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortySixPreview`, including current copy that names `First Bouquet 10`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 46 encore First Bouquet surface and its five `data-round-forty-six-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 45 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4267/playable/midnight_bloom_prototype.html?verify=round46-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, and `assets/tiles/96/withered_sun_medallion.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortySixPreview`, `Round 46 First Bouquet Encore`, `First Bouquet 10`, `Round 46 encore First Bouquet payoff`, `data-round-forty-six-state="current"`, `function renderRoundFortySixPreview`, and preserved Round 45 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 43 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 46 with 64 tiles preserved and verified the opened Round 46 current copy, preserved Round 45 marker copy, and Round 46 complete copy plus reward choice panel.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_8Dit3Va81c6dY6C9crHKUPPtaVXY` at `https://bloom-tycoon-k1039bxio-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round46-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, and `assets/tiles/96/withered_sun_medallion.png`; downloaded HTML contained the Round 46 markers plus preserved Round 45 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 43 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 46 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `7a51c84` after 2 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round46-gh-pages-direct-7a51c84`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, and `assets/tiles/96/withered_sun_medallion.png`; downloaded HTML contained the Round 46 markers plus preserved Round 45 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 46 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 46 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_8Dit3Va81c6dY6C9crHKUPPtaVXY`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `7a51c84`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed for the three changed files before deploy.

## 2026-07-08 Codex Round 45 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 44 and requested a narrow Round 45 `Sub Rosa Grand Bouquet 9` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 45 Sub Rosa Grand Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(45)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyFivePreview`, including current copy that names `Sub Rosa Grand Bouquet 9`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 45 encore Sub Rosa Grand Bouquet surface and its five `data-round-forty-five-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 44 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4266/playable/midnight_bloom_prototype.html?verify=round45-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyFivePreview`, `Round 45 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 9`, `Round 45 encore Sub Rosa Grand Bouquet payoff`, `data-round-forty-five-state="current"`, `function renderRoundFortyFivePreview`, and preserved Round 44 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 43 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 45 with 64 tiles preserved and verified the Round 45 current copy, preserved Round 44 marker copy, and Round 45 complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_4oiNerRYhwXWcxDTjJnjJNaSWDVw` at `https://bloom-tycoon-mgsntigou-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment. A duplicate queued retry deployment `dpl_FVR4hdXtaNRtcbc1Q9GJ4fWgixP1` was removed with `vercel remove --safe --yes`; the live Ready deployment was left intact.
  - Vercel direct checks returned `200 OK` on both the alias and immutable deployment for `/`, `/playable/midnight_bloom_prototype.html?verify=round45-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 45 markers plus preserved Round 44 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 43 collapsed ledger entries, compact Bouquet Path current + next only, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 45 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel while active, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `b2b85d0` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round45-gh-pages-direct-b2b85d0`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 45 markers plus preserved Round 44 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 45 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 45 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_4oiNerRYhwXWcxDTjJnjJNaSWDVw`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `b2b85d0`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan passed for the three changed files before deploy.

## 2026-07-08 Codex Round 44 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 43 and requested a narrow Round 44 `Saint's Night Ledger 9` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 44 Saint's Night Ledger Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(44)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyFourPreview`, including current copy that names `Saint's Night Ledger 9`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 44 encore Saint's Night Ledger surface and its five `data-round-forty-four-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 43 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4265/playable/midnight_bloom_prototype.html?verify=round44-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyFourPreview`, `Round 44 Saint's Night Ledger Encore`, `Saint's Night Ledger 9`, `Round 44 encore Saint's Night Ledger payoff`, `data-round-forty-four-state="current"`, `function renderRoundFortyFourPreview`, and preserved Round 43 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 42 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 44 with 64 tiles preserved and verified the Round 44 current copy, preserved Round 43 marker copy, and Round 44 complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_2ZzzdqBougTLvHNocen3YRTtQLLQ` at `https://bloom-tycoon-p9t13v95r-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round44-vercel-direct`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the Round 44 markers plus preserved Round 43 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 42 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 44 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `bdac923` after 3 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round44-gh-pages-direct-bdac923`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the Round 44 markers plus preserved Round 43 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 44 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 44 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_2ZzzdqBougTLvHNocen3YRTtQLLQ`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `bdac923`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 43 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 42 and requested a narrow Round 43 `Bloodroot Compact 9` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 43 Bloodroot Compact Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(43)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyThreePreview`, including current copy that names `Bloodroot Compact 9`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 43 encore Bloodroot Compact surface and its five `data-round-forty-three-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 42 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4264/playable/midnight_bloom_prototype.html?verify=round43-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyThreePreview`, `Round 43 Bloodroot Compact Encore`, `Bloodroot Compact 9`, `Round 43 encore Bloodroot Compact payoff`, `data-round-forty-three-state="current"`, `function renderRoundFortyThreePreview`, and preserved Round 42 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 40 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 43 with 64 tiles preserved and verified the Round 43 current copy, preserved Round 42 marker copy, and Round 43 complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_BbTqz4C7ztgFNdcvo1Gsfy7guaCr` at `https://bloom-tycoon-pfq42h6wi-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round43-vercel-direct`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 43 markers plus preserved Round 42 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 41 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 43 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `751d8fe` after 1 poll.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round43-gh-pages-direct-751d8fe`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 43 markers plus preserved Round 42 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 43 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 43 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_BbTqz4C7ztgFNdcvo1Gsfy7guaCr`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `751d8fe`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 42 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 41 and requested a narrow Round 42 `Moonlit Wreath 9` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 42 Moonlit Wreath Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(42)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyTwoPreview`, including current copy that names `Moonlit Wreath 9`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 42 encore Moonlit Wreath surface and its five `data-round-forty-two-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 41 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4263/playable/midnight_bloom_prototype.html?verify=round42-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyTwoPreview`, `Round 42 Moonlit Wreath Encore`, `Moonlit Wreath 9`, `Round 42 encore Moonlit Wreath payoff`, `data-round-forty-two-state="current"`, `function renderRoundFortyTwoPreview`, and preserved Round 41 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 39 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 42 with 64 tiles preserved and verified the Round 42 current copy, preserved Round 41 marker copy, and Round 42 complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_J4iQeaD8By8fZLGxKHF4bhFdhRSi` at `https://bloom-tycoon-f6iz5p4jz-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round42-vercel-direct`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 42 markers plus preserved Round 41 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 39 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 42 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `4ad8e85` after 2 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round42-gh-pages-direct-4ad8e85`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 42 markers plus preserved Round 41 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 42 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 42 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_J4iQeaD8By8fZLGxKHF4bhFdhRSi`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `4ad8e85`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 41 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 40 and requested a narrow Round 41 `First Bouquet 9` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 41 First Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(41)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyOnePreview`, including current copy that names `First Bouquet 9`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 41 encore First Bouquet surface and its five `data-round-forty-one-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 40 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4262/playable/midnight_bloom_prototype.html?verify=round41-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyOnePreview`, `Round 41 First Bouquet Encore`, `First Bouquet 9`, `Round 41 encore First Bouquet payoff`, `data-round-forty-one-state="current"`, `function renderRoundFortyOnePreview`, and preserved Round 40 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 38 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 41 with 64 tiles preserved and verified the Round 41 current copy, preserved Round 40 marker copy, and Round 41 complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_5BaoVxX8E23LQVMr5uVjjiHG8Ghc` at `https://bloom-tycoon-qatpjgunj-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round41-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the Round 41 markers plus preserved Round 40 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 38 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 41 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `2d90b73` after 2 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round41-gh-pages-direct-2d90b73`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bone_white_thorn_star.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the Round 41 markers plus preserved Round 40 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 41 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 41 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_5BaoVxX8E23LQVMr5uVjjiHG8Ghc`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `2d90b73`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 40 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 39 and requested a narrow Round 40 `Sub Rosa Grand Bouquet 8` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 40 Sub Rosa Grand Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(40)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundFortyPreview`, including current copy that names `Sub Rosa Grand Bouquet 8`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 40 encore Sub Rosa Grand Bouquet surface and its five `data-round-forty-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 39 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4261/playable/midnight_bloom_prototype.html?verify=round40-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundFortyPreview`, `Round 40 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 8`, `Round 40 encore Sub Rosa Grand Bouquet payoff`, `data-round-forty-state="current"`, `function renderRoundFortyPreview`, and preserved Round 39 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 38 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 40 with 64 tiles preserved and verified the Round 40 current copy, Round 39 preserved marker copy, and Round 40 complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_J4rbFEYrmbLeLXGEzF6TmjiVosof` at `https://bloom-tycoon-37f8e63rv-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round40-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 40 markers plus preserved Round 39 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 38 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 40 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `cbc1549` after 2 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round40-gh-pages-direct-cbc1549`, `assets/tiles/96/crimson_rose_rune.png`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 40 markers plus preserved Round 39 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 40 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 40 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_J4rbFEYrmbLeLXGEzF6TmjiVosof`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `cbc1549`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 39 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 38 and requested a narrow Round 39 `Saint's Night Ledger 8` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 39 Saint's Night Ledger Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(39)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtyNinePreview`, including current copy that names `Saint's Night Ledger 8`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 39 encore Saint's Night Ledger surface and its five `data-round-thirty-nine-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 38 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4260/playable/midnight_bloom_prototype.html?verify=round39-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundThirtyNinePreview`, `Round 39 Saint's Night Ledger Encore`, `Saint's Night Ledger 8`, `Round 39 encore Saint's Night Ledger payoff`, `data-round-thirty-nine-state="current"`, `function renderRoundThirtyNinePreview`, and preserved Round 38 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 37 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright progressed Round 1 -> Round 39 with 64 tiles preserved and verified the Round 39 current copy and complete copy.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - Vercel production deploy completed as `dpl_HhWsgzqCLF2DFznS2Kz1biNqwK26` at `https://bloom-tycoon-iujg3iwsl-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round39-direct`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the Round 39 markers plus preserved Round 38 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 37 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 39 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages became marker-current for source commit `f58a036` after 2 polls.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round39-gh-pages-direct-f58a036`, `assets/tiles/96/bone_white_thorn_star.png`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/withered_sun_medallion.png`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the Round 39 markers plus preserved Round 38 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 39 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 39 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_HhWsgzqCLF2DFznS2Kz1biNqwK26`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `f58a036`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 38 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 37 and requested a narrow Round 38 `Bloodroot Compact 8` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 38 Bloodroot Compact Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(38)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtyEightPreview`, including current copy that names `Bloodroot Compact 8`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 38 encore Bloodroot Compact surface and its five `data-round-thirty-eight-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 37 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4259/playable/midnight_bloom_prototype.html?verify=round38-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundThirtyEightPreview`, `Round 38 Bloodroot Compact Encore`, `Bloodroot Compact 8`, `Round 38 encore Bloodroot Compact payoff`, `data-round-thirty-eight-state="current"`, `function renderRoundThirtyEightPreview`, and preserved Round 37 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 36 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `Shape Bloom`, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles, Cursed Thorn objective copy, and 17 moves.
  - Local Playwright progressed Round 1 -> Round 38 with 64 tiles preserved, Round 38 `Bloodroot Compact 8` current copy intact, and Round 37 marker copy still present in the drawer.
  - Local Playwright verified Round 38 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_9iNot66qe3HQsh6unhJM842J3Xxb` at `https://bloom-tycoon-hndwcrtv7-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round38-direct`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 38 markers plus preserved Round 37 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 36 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 38 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round38-gh-pages-direct`, `assets/tiles/96/bloodroot_ruby_shard.png`, `assets/tiles/96/withered_sun_medallion.png`, `assets/tiles/96/purple_nightshade_bloom.png`, and `assets/tiles/96/amber_resin_seed.png`; downloaded HTML contained the Round 38 markers plus preserved Round 37 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 38 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 38 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_9iNot66qe3HQsh6unhJM842J3Xxb`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `9ca0c98`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 37 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 36 and requested a narrow Round 37 `Moonlit Wreath 8` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 37 Moonlit Wreath Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(37)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtySevenPreview`, including current copy that names `Moonlit Wreath 8`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 37 encore Moonlit Wreath surface and its five `data-round-thirty-seven-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 36 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4258/playable/midnight_bloom_prototype.html?verify=round37-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, and `assets/tiles/96/crimson_rose_rune.png`.
  - Local marker checks found `pathLedgerDrawer`, `roundThirtySevenPreview`, `Round 37 Moonlit Wreath Encore`, `Moonlit Wreath 8`, `Round 37 encore Moonlit Wreath payoff`, `data-round-thirty-seven-state="current"`, `function renderRoundThirtySevenPreview`, and preserved Round 36 markers.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 35 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `Shape Bloom`, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles, Cursed Thorn objective copy, and 17 moves.
  - Local Playwright progressed Round 1 -> Round 37 with 64 tiles preserved, Round 37 `Moonlit Wreath 8` current copy intact, and Round 36 marker copy still present in the drawer.
  - Local Playwright verified Round 37 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_3EUed58DWavo9MgtiDiuAoJSNPS4` at `https://bloom-tycoon-r2rlfea0j-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round37-direct`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 37 markers plus preserved Round 36 markers.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 35 collapsed ledger entries, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified Round 1 -> Round 37 current/complete, Round 2 Cursed Thorn wither -> `Retry Bouquet`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `Shape Bloom`, real focused `B` Supreme Bloom, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round37-gh-pages-direct`, `assets/tiles/96/purple_nightshade_bloom.png`, `assets/tiles/96/amber_resin_seed.png`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the Round 37 markers plus preserved Round 36 markers.
  - GitHub Pages Playwright matched the Vercel checks: fresh desktop, Round 1 -> Round 37 current/complete, Round 2 retry, controls/hooks, real focused `B` Supreme Bloom, and mobile portrait passed with 64 tiles, 0 broken images, 0 visible future preview sections, and no overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, controls, key hooks, Round 2 retry, Round 37 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_3EUed58DWavo9MgtiDiuAoJSNPS4`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `72af194`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly, or click `Shape Bloom` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-08 Codex Round 36 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 35 and requested a narrow Round 36 `First Bouquet 8` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 36 First Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(36)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtySixPreview`, including current copy that names `First Bouquet 8`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 36 encore First Bouquet surface and its five `data-round-thirty-six-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 35 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4257/playable/midnight_bloom_prototype.html?verify=round36-local-*`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `roundThirtySixPreview`, `Round 36 First Bouquet Encore`, `First Bouquet 8`, `Round 36 encore First Bouquet payoff`, `data-round-thirty-six-state="current"`, `function renderRoundThirtySixPreview`, `roundThirtyFivePreview`, and `pathLedgerDrawer`.
  - Local Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 33, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright opened the `Path / Ledger` drawer, verified Round 36 tease/payoff copy, and kept the drawer closed by default in normal play.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` Shape Bloom through line5, line4, L/T/cross rewards, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles, Cursed Thorn objective copy, and 17 moves.
  - Local Playwright progressed Round 1 -> Round 36 with 64 tiles preserved, Round 36 `First Bouquet 8` current copy intact, and Round 35 marker copy still present in the drawer.
  - Local Playwright verified Round 36 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_FhM8JHVpjDwwCVoLGmPJgvoSi5L7` at `https://bloom-tycoon-7spc9x014-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=round36-vercel-direct`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained `pathLedgerDrawer`, `roundThirtySixPreview`, `Round 36 First Bouquet Encore`, `First Bouquet 8`, `Round 36 encore First Bouquet payoff`, `data-round-thirty-six-state="current"`, `function renderRoundThirtySixPreview`, and `roundThirtyFivePreview`.
  - Vercel Playwright fresh desktop loaded 64 tiles, 95 images, 0 broken images, 0 visible future preview sections out of 33, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified the closed-by-default `Path / Ledger`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `M` Shape Bloom through line5, line4, L/T/cross rewards, real focused `B` Supreme Bloom, Round 2 Cursed Thorn wither -> `Retry Bouquet`, Round 1 -> Round 36 current/complete, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=round36-gh-pages-direct-*`, `assets/tiles/96/crimson_rose_rune.png`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the same Round 36 and Round 35 markers as Vercel.
  - GitHub Pages Playwright matched the same fresh desktop, controls/hooks, Round 2 retry, Round 1 -> Round 36 current/complete, and mobile portrait checks as Vercel.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, drawer, controls, key hooks, Round 2 retry, Round 36 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_FhM8JHVpjDwwCVoLGmPJgvoSi5L7`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for source commit `013bb1b`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-07 Codex Round 35 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 34 and requested a narrow Round 35 `Sub Rosa Grand Bouquet 7` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 35 Sub Rosa Grand Bouquet Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(35)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtyFivePreview`, including current copy that names `Sub Rosa Grand Bouquet 7`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 35 encore Sub Rosa Grand Bouquet surface and its five `data-round-thirty-five-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 34 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4256/playable/midnight_bloom_prototype.html?verify=round35-local-*`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/crimson_rose_rune.png`.
  - Local marker checks found `roundThirtyFivePreview`, `Round 35 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 7`, `Round 35 encore Sub Rosa Grand Bouquet payoff`, `data-round-thirty-five-state="current"`, `function renderRoundThirtyFivePreview`, `roundThirtyFourPreview`, and `pathLedgerDrawer`.
  - Local Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 32, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright opened the `Path / Ledger` drawer, verified the Round 35 tease copy, and kept the drawer closed by default in normal play.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` Shape Bloom through L/T/cross rewards, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles and Cursed Thorn objective copy.
  - Local Playwright progressed Round 1 -> Round 35 with 64 tiles preserved, 0 visible future preview sections, 2 visible Bouquet Path nodes, Round 35 `Sub Rosa Grand Bouquet 7` current copy intact, and Round 34 marker copy still present in the drawer.
  - Local Playwright verified Round 35 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_HBFee6CxppszrksRPedrzC9buUFM` at `https://bloom-tycoon-nvna75wyl-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=ce2524a-direct-*`, and `assets/tiles/96/crimson_rose_rune.png`; downloaded HTML contained `pathLedgerDrawer`, `roundThirtyFivePreview`, `Round 35 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 7`, `Round 35 encore Sub Rosa Grand Bouquet payoff`, `data-round-thirty-five-state="current"`, `function renderRoundThirtyFivePreview`, and `roundThirtyFourPreview`.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=ce2524a-direct-*`, and `assets/tiles/96/crimson_rose_rune.png`; downloaded HTML contained the same Round 35 and Round 34 markers as Vercel.
  - Vercel Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 32, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified the closed-by-default `Path / Ledger`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `M` Shape Bloom through L/T/cross rewards, real focused `B` Supreme Bloom, Round 2 Cursed Thorn wither -> `Retry Bouquet`, Round 1 -> Round 35 current/complete, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages Playwright matched the same fresh desktop, controls/hooks, Round 2 retry, Round 1 -> Round 35 current/complete, and mobile portrait checks as Vercel.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, drawer, controls, key hooks, Round 2 retry, Round 35 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_HBFee6CxppszrksRPedrzC9buUFM`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for commit `ce2524a`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-07 Codex Round 34 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 33 and requested a narrow Round 34 `Saint's Night Ledger 7` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 34 Saint's Night Ledger Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(34)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtyFourPreview`, including current copy that names `Saint's Night Ledger 7`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 34 encore Saint's Night Ledger surface and its five `data-round-thirty-four-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 33 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4255/playable/midnight_bloom_prototype.html?verify=round34-local-*`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `roundThirtyFourPreview`, `Round 34 Saint's Night Ledger Encore`, `Saint's Night Ledger 7`, `Round 34 encore Saint's Night Ledger payoff`, `data-round-thirty-four-state="current"`, `function renderRoundThirtyFourPreview`, `roundThirtyThreePreview`, and `pathLedgerDrawer`.
  - Local Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 31, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright opened the `Path / Ledger` drawer, verified the Round 34 tease copy, and kept the drawer closed by default in normal play.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` Shape Bloom through L/T/cross rewards, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles and Cursed Thorn objective copy.
  - Local Playwright progressed Round 1 -> Round 34 with 64 tiles preserved, 0 visible future preview sections, 2 visible Bouquet Path nodes, Round 34 `Saint's Night Ledger 7` current copy intact, and Round 33 marker copy still present in the drawer.
  - Local Playwright verified Round 34 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_2qawf6uJX6Ebs7HY3szHuQLAWiYe` at `https://bloom-tycoon-462b73pp2-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=c8acd98-direct-*`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained `pathLedgerDrawer`, `roundThirtyFourPreview`, `Round 34 Saint's Night Ledger Encore`, `Saint's Night Ledger 7`, `Round 34 encore Saint's Night Ledger payoff`, `data-round-thirty-four-state="current"`, `function renderRoundThirtyFourPreview`, and `roundThirtyThreePreview`.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=c8acd98-direct-*`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the same Round 34 and Round 33 markers as Vercel.
  - Vercel Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 31, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified the closed-by-default `Path / Ledger`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `M` Shape Bloom through L/T/cross rewards, real focused `B` Supreme Bloom, Round 2 Cursed Thorn wither -> `Retry Bouquet`, Round 1 -> Round 34 current/complete, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages Playwright matched the same fresh desktop, controls/hooks, Round 2 retry, Round 1 -> Round 34 current/complete, and mobile portrait checks as Vercel.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, drawer, controls, key hooks, Round 2 retry, Round 34 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_2qawf6uJX6Ebs7HY3szHuQLAWiYe`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for commit `c8acd98`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-07 Codex Round 33 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed Round 32 and requested a narrow Round 33 `Bloodroot Compact 7` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 33 Bloodroot Compact Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(33)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtyThreePreview`, including current copy that names `Bloodroot Compact 7`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 33 encore Bloodroot Compact surface and its five `data-round-thirty-three-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 32 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4254/playable/midnight_bloom_prototype.html?verify=round33-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Local marker checks found `roundThirtyThreePreview`, `Round 33 Bloodroot Compact Encore`, `Bloodroot Compact 7`, `Round 33 encore Bloodroot Compact payoff`, `data-round-thirty-three-state="current"`, `function renderRoundThirtyThreePreview`, `roundThirtyTwoPreview`, and `pathLedgerDrawer`.
  - Local Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 31, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright opened the `Path / Ledger` drawer, verified the Round 33 tease copy, and kept the drawer closed by default in normal play.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` Shape Bloom, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles and Cursed Thorn objective copy.
  - Local Playwright progressed Round 1 -> Round 33 with 64 tiles preserved, 0 visible future preview sections, 2 visible Bouquet Path nodes, Round 33 `Bloodroot Compact 7` current copy intact, and Round 32 marker copy still present in the drawer.
  - Local Playwright verified Round 33 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_6WonyqTaRohs9yeAHdA6SsuG3t3r` at `https://bloom-tycoon-nu0h94iy8-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=c36b3cb-direct-*`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained `pathLedgerDrawer`, `roundThirtyThreePreview`, `Round 33 Bloodroot Compact Encore`, `Bloodroot Compact 7`, `Round 33 encore Bloodroot Compact payoff`, `data-round-thirty-three-state="current"`, `function renderRoundThirtyThreePreview`, and `roundThirtyTwoPreview`.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=c36b3cb-direct-*`, and `assets/tiles/96/bloodroot_ruby_shard.png`; downloaded HTML contained the same Round 33 and Round 32 markers as Vercel.
  - Vercel Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 30, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified the closed-by-default `Path / Ledger`, all four boosters arm/cancel, Chest open/close, Sacrifice open/cancel, `M` Shape Bloom through L/T/cross rewards, real focused `B` Supreme Bloom, Round 2 Cursed Thorn wither -> `Retry Bouquet`, Round 1 -> Round 33 current/complete, and mobile portrait at 390x844 with no overflow.
  - GitHub Pages Playwright matched the same fresh desktop, controls/hooks, Round 2 retry, Round 1 -> Round 33 current/complete, and mobile portrait checks as Vercel.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors, 0 page errors, and 0 failed browser requests during fresh layout, drawer, controls, key hooks, Round 2 retry, Round 33 current/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_6WonyqTaRohs9yeAHdA6SsuG3t3r`, aliased to `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: live and marker-current for commit `c36b3cb`.
- Known issues: none found locally or live.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-07 Codex Round 32 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes confirmed the board-first visual stripback and requested a narrow Round 32 `Moonlit Wreath 7` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 32 Moonlit Wreath Encore preview/payoff surface inside the collapsed `Path / Ledger` drawer using the existing `buildRoundPlan(32)` continuing-round generator.
- Added tease, next, current, withered, and complete states for `roundThirtyTwoPreview`, including current copy that names `Moonlit Wreath 7`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 32 encore Moonlit Wreath surface and its five `data-round-thirty-two-state` values.
- Preserved the board-first layout: first load still keeps future detail hidden behind `Path / Ledger`, compact Bouquet Path remains current + next only, and the board stays near the top.
- Preserved existing saves, rounds, reward choices, Round 31 markers, Cursed Thorn retry, all four boosters, Chest/Sacrifice, Shape Bloom, and Supreme Bloom; no broad progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4253/playable/midnight_bloom_prototype.html?verify=round32-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/purple_nightshade_bloom.png`.
  - Local marker checks found `roundThirtyTwoPreview`, `Round 32 Moonlit Wreath Encore`, `Moonlit Wreath 7`, `Round 32 encore Moonlit Wreath payoff`, `data-round-thirty-two-state="current"`, `function renderRoundThirtyTwoPreview`, and `pathLedgerDrawer`.
  - Local Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 30, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright opened the `Path / Ledger` drawer, verified the Round 32 tease copy, and kept the drawer closed by default in normal play.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` Shape Bloom, and a real focused `B` Supreme Bloom keypress.
  - Local Playwright progressed Round 1 -> Round 32 with 64 tiles preserved, 0 visible future preview sections, 2 visible Bouquet Path nodes, Round 32 `Moonlit Wreath 7` current copy intact, and Cursed Thorn copy present.
  - Local Playwright verified Round 32 wither -> `Retry Bouquet` restores 64 tiles and Round 32 Cursed Thorn objective copy, then verified Round 32 complete copy.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_FRdqzKpyeSUhsJbnCAa35x59FWaN` at `https://bloom-tycoon-ble8i0yen-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=b564a1c-direct`, and `assets/tiles/96/purple_nightshade_bloom.png`; downloaded HTML contained `pathLedgerDrawer`, `roundThirtyTwoPreview`, `Round 32 Moonlit Wreath Encore`, `Moonlit Wreath 7`, `Round 32 encore Moonlit Wreath payoff`, `data-round-thirty-two-state="current"`, and `function renderRoundThirtyTwoPreview`.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=b564a1c-direct`, and `assets/tiles/96/purple_nightshade_bloom.png`; downloaded HTML contained the same Round 32 markers as Vercel.
  - Vercel Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 30, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright verified all four boosters, Chest, Sacrifice, `M` Shape Bloom, focused `B` Supreme Bloom, Round 32 current/retry/complete, and mobile portrait at 390x844 with 64 tiles, 0 visible future preview sections, board top at 493px, first tile top at 502px, and no horizontal overflow.
  - GitHub Pages Playwright matched the same fresh desktop, controls/hooks, Round 32 current/retry/complete, and mobile portrait checks as Vercel.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during fresh layout, drawer, controls, key hooks, Round 32 retry/complete, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_FRdqzKpyeSUhsJbnCAa35x59FWaN`, https://bloom-tycoon-ble8i0yen-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 32 marker-matched HTML for pushed commit `b564a1c`.
- Known issues: none found locally or on live previews.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-07 Codex board-first visual stripback fix

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow visual stripback fix only after the Round 31 audit found the future-round diary still visible before the board.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Wrapped the long Round 3-31 preview diary in a compact closed `Path / Ledger` drawer so future rewards are still available but not visible before play.
- Kept first-load play focused on objective/moves, compact current+next Bouquet Path, the 64-tile board, primary controls, left rail/orders, Chest Storage, and Elements.
- Changed the compact Bouquet Path helper to show current and next rounds only.
- Added static verifier markers for the `pathLedgerDrawer`, `Path / Ledger`, and `Future rewards hidden` affordance.
- Preserved existing saves, rounds, reward choices, Cursed Thorn, all four boosters, Chest/Sacrifice, Shape Bloom, Supreme Bloom, and Round 31 markers; no Round 32 work was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4252/playable/midnight_bloom_prototype.html?verify=stripback-local-5`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `pathLedgerDrawer`, `Path / Ledger`, `Future rewards hidden`, `roundThirtyOnePreview`, `Round 31 First Bouquet Encore`, `First Bouquet 7`, and `function renderRoundThirtyOnePreview`.
  - Local Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 29, a closed drawer, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Local Playwright opened the `Path / Ledger` drawer, exposed all 29 future sections including Round 31 / `First Bouquet 7`, then closed it back to 0 visible preview sections.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` triggers Shape Bloom after its resolving phase, and a real focused `B` keypress triggers Supreme Bloom.
  - Local Playwright verified Round 2 Cursed Thorn wither -> `Retry Bouquet` restores 64 tiles and Cursed Thorn objective copy.
  - Local Playwright progressed to Round 31 with 64 tiles preserved, 0 visible future preview sections, 2 visible Bouquet Path nodes, Round 31 / `First Bouquet 7` copy intact, and Round 31 complete copy intact.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, 0 visible future preview sections, board top at 623px, first tile top at 632px, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_GYiu8cBUsmN444NidNHe5PcCs8Rv` at `https://bloom-tycoon-dc11laikq-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=19092c7-direct`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained `pathLedgerDrawer`, `Path / Ledger`, `Future rewards hidden`, `roundThirtyOnePreview`, `Round 31 First Bouquet Encore`, `First Bouquet 7`, and `function renderRoundThirtyOnePreview`.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=19092c7-direct`, and `assets/tiles/96/bone_white_thorn_star.png`; downloaded HTML contained the same visual stripback and Round 31 markers as Vercel.
  - Vercel Playwright fresh desktop loaded 64 tiles, 0 broken images, 0 visible future preview sections out of 29, 2 visible Bouquet Path nodes, board top at 475px, and first tile top at 487px.
  - Vercel Playwright opened/closed the `Path / Ledger` drawer, verified all four boosters, Chest, Sacrifice, `M` Shape Bloom, focused `B` Supreme Bloom, Round 2 retry, Round 31 current and complete copy, and mobile portrait at 390x844 with 64 tiles, 0 visible future preview sections, board top at 623px, first tile top at 632px, and no horizontal overflow.
  - GitHub Pages Playwright matched the same fresh desktop, drawer/control, Round 2 retry, Round 31, Shape/Supreme hook, and mobile portrait checks as Vercel.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during fresh layout, drawer, controls, retry, Round 31, key hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_GYiu8cBUsmN444NidNHe5PcCs8Rv`, https://bloom-tycoon-dc11laikq-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the marker-matched visual stripback HTML for pushed commit `19092c7`.
- Known issues: none found locally or on live previews.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; after the charge phase the ritual log should report `SUPREME BLOOM!` and return the board to play.
- Security/secret-scan status: lightweight changed-line credential scan ran with no findings.

## 2026-07-07 Codex Round 31 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 31 `First Bouquet 7` clarity/payoff slice after the Round 30 audit advanced.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 31 First Bouquet Encore preview/payoff surface below Round 30 using the existing continuing-round generator through `buildRoundPlan(31)`.
- Added tease, next, current, withered, and complete states for `roundThirtyOnePreview`, including current copy that names `First Bouquet 7`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 31 encore First Bouquet surface and its five `data-round-thirty-one-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4251/playable/midnight_bloom_prototype.html?verify=round31-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `roundThirtyOnePreview`, `Round 31 First Bouquet Encore`, `First Bouquet 7`, `Round 31 encore First Bouquet payoff`, `data-round-thirty-one-state="current"`, and `function renderRoundThirtyOnePreview` in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 31 tease copy.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then progressed to Round 31 with 64 tiles preserved.
  - Local Playwright verified Round 31 current copy names `First Bouquet 7`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` triggers Shape Bloom without console, a focused `B` keypress triggers Supreme Bloom without console, and Round 31 complete copy names the seventh First Bouquet and Chest Storage.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 31 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_FgfWWnYVC2F5p6AyKXRFNquHF9Ld` at `https://bloom-tycoon-14qhln79b-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=43ea22f-direct`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded Vercel HTML contained `roundThirtyOnePreview`, `Round 31 First Bouquet Encore`, `First Bouquet 7`, `Round 31 encore First Bouquet payoff`, `data-round-thirty-one-state="current"`, and `function renderRoundThirtyOnePreview`.
  - Vercel Playwright smoke loaded 64 tiles with 0 broken images, verified Round 2 wither -> retry, all four booster controls, Chest and Sacrifice open/cancel, `M` Shape Bloom, a focused `B` keypress for Supreme Bloom, Round 31 current and complete copy, and mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=43ea22f-direct`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded GitHub Pages HTML contained the same Round 31 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles with 0 broken images, verified Round 2 wither -> retry, all four booster controls, Chest and Sacrifice open/cancel, `M` Shape Bloom, a focused `B` keypress for Supreme Bloom, Round 31 current and complete copy, and mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 31, retry, hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_FgfWWnYVC2F5p6AyKXRFNquHF9Ld`, https://bloom-tycoon-14qhln79b-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 31 marker-matched HTML for pushed feature commit `43ea22f`.
- Known issues: none found locally or on live previews.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight added-lines credential scan ran with no findings.

## 2026-07-07 Codex Round 30 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 30 `Sub Rosa Grand Bouquet 6` clarity/payoff slice after the Round 29 audit advanced.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 30 Sub Rosa Grand Bouquet Encore preview/payoff surface below Round 29 using the existing continuing-round generator through `buildRoundPlan(30)`.
- Added tease, next, current, withered, and complete states for `roundThirtyPreview`, including current copy that names `Sub Rosa Grand Bouquet 6`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 30 encore Sub Rosa Grand Bouquet surface and its five `data-round-thirty-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git rebase origin/main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4250/playable/midnight_bloom_prototype.html?verify=round30-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/crimson_rose_rune.png`.
  - Local marker checks found `roundThirtyPreview`, `Round 30 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 6`, `Round 30 encore Sub Rosa Grand Bouquet payoff`, `data-round-thirty-state="current"`, and `function renderRoundThirtyPreview` in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 30 tease copy.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then progressed to Round 30 with 64 tiles preserved.
  - Local Playwright verified Round 30 current copy names `Sub Rosa Grand Bouquet 6`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` triggers Shape Bloom without console, a focused `B` keypress triggers Supreme Bloom without console, and Round 30 complete copy names the sixth Sub Rosa Grand Bouquet and Chest Storage.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 30 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_3ZyQwaPbiqJAzmxQWgyYG2kHZieZ` at `https://bloom-tycoon-ed867d0rg-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=e313c69-direct`, and `assets/tiles/96/crimson_rose_rune.png`.
  - Downloaded Vercel HTML contained `roundThirtyPreview`, `Round 30 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 6`, `Round 30 encore Sub Rosa Grand Bouquet payoff`, `data-round-thirty-state="current"`, and `function renderRoundThirtyPreview`.
  - Vercel Playwright smoke loaded 64 tiles with 0 broken images, verified Round 2 wither -> retry, all four booster controls, Chest and Sacrifice open/cancel, `M` Shape Bloom, a focused `B` keypress for Supreme Bloom, Round 30 current and complete copy, and mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=e313c69-direct`, and `assets/tiles/96/crimson_rose_rune.png`.
  - Downloaded GitHub Pages HTML contained the same Round 30 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles with 0 broken images, verified Round 2 wither -> retry, all four booster controls, Chest and Sacrifice open/cancel, `M` Shape Bloom, a focused `B` keypress for Supreme Bloom, Round 30 current and complete copy, and mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 30, retry, hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_3ZyQwaPbiqJAzmxQWgyYG2kHZieZ`, https://bloom-tycoon-ed867d0rg-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 30 marker-matched HTML for pushed feature commit `e313c69`.
- Known issues: none found locally or on live previews.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight added-lines credential scan ran with no findings.

## 2026-07-07 Codex Round 29 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 29 `Saint's Night Ledger 6` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 29 Saint's Night Ledger Encore preview/payoff surface below Round 28 using the existing continuing-round generator through `buildRoundPlan(29)`.
- Added tease, next, current, withered, and complete states for `roundTwentyNinePreview`, including current copy that names `Saint's Night Ledger 6`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 29 encore Saint's Night Ledger surface and its five `data-round-twenty-nine-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4249/playable/midnight_bloom_prototype.html?verify=round29-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `roundTwentyNinePreview`, `Round 29 Saint's Night Ledger Encore`, `Saint's Night Ledger 6`, `Round 29 encore Saint's Night Ledger payoff`, `data-round-twenty-nine-state="current"`, and `function renderRoundTwentyNinePreview` in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, visible Round 29 tease copy, all four booster labels, and `Shape Bloom`.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then progressed to Round 29 with 64 tiles preserved.
  - Local Playwright verified Round 29 current copy names `Saint's Night Ledger 6`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` triggers Shape Bloom without console, `B` triggers Supreme Bloom without console, and Round 29 complete copy names the sixth Saint's Night Ledger and Chest Storage.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 29 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_CLrYP1fxSq3qQzJQxdNSVVDBhcYg` at `https://bloom-tycoon-b0ylwdwel-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=377a4a1-direct`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded Vercel HTML contained `roundTwentyNinePreview`, `Round 29 Saint's Night Ledger Encore`, `Saint's Night Ledger 6`, `Round 29 encore Saint's Night Ledger payoff`, `data-round-twenty-nine-state="current"`, and `function renderRoundTwentyNinePreview`.
  - Vercel Playwright smoke loaded 64 tiles with 0 broken images, verified Round 2 wither -> retry, all four booster controls, Chest and Sacrifice open/cancel, `M` Shape Bloom, `B` Supreme Bloom, Round 29 current and complete copy, and mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=377a4a1-direct`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded GitHub Pages HTML contained the same Round 29 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles with 0 broken images, verified Round 2 wither -> retry, all four booster controls, Chest and Sacrifice open/cancel, `M` Shape Bloom, `B` Supreme Bloom, Round 29 current and complete copy, and mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 29, retry, hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_CLrYP1fxSq3qQzJQxdNSVVDBhcYg`, https://bloom-tycoon-b0ylwdwel-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 29 marker-matched HTML for pushed feature commit `377a4a1`.
- Known issues: none found locally or on live previews.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight added-lines credential scan ran with no findings.

## 2026-07-07 Codex Round 28 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 28 `Bloodroot Compact 6` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 28 Bloodroot Compact Encore preview/payoff surface below Round 27 using the existing continuing-round generator through `buildRoundPlan(28)`.
- Added tease, next, current, withered, and complete states for `roundTwentyEightPreview`, including current copy that names `Bloodroot Compact 6`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 28 encore Bloodroot Compact surface and its five `data-round-twenty-eight-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4248/playable/midnight_bloom_prototype.html?verify=round28-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Local marker checks found `roundTwentyEightPreview`, `Round 28 Bloodroot Compact Encore`, `Bloodroot Compact 6`, `Round 28 encore Bloodroot Compact payoff`, `data-round-twenty-eight-state="current"`, and `function renderRoundTwentyEightPreview` in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, visible Round 28 tease copy, all four booster labels, and `Shape Bloom`.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then progressed to Round 27, verified Round 27 current Cursed Thorn copy, and verified Round 27 wither -> retry restored Cursed Thorn objective copy.
  - Local Playwright verified Round 28 current copy names `Bloodroot Compact 6`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path, with no Cursed Thorn objective on Round 28.
  - Local Playwright verified all four boosters arm/cancel, Chest opens/closes, Sacrifice opens/cancels, `M` triggers Shape Bloom without console, `B` triggers Supreme Bloom without console, and Round 28 complete copy names the sixth Bloodroot Compact and Chest Storage.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 28 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_6RsBXJQncAQeT5cNX549Xa3ruApp` at `https://bloom-tycoon-9ofe9edbt-xerxes-florals.vercel.app`; the initial deploy status poll hit `read ETIMEDOUT`, then `vercel inspect` confirmed the deployment was `Ready`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=4e4e999-live`, and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Downloaded Vercel HTML contained `roundTwentyEightPreview`, `Round 28 Bloodroot Compact Encore`, `Bloodroot Compact 6`, `Round 28 encore Bloodroot Compact payoff`, `data-round-twenty-eight-state="current"`, and `function renderRoundTwentyEightPreview`.
  - Vercel Playwright smoke loaded 64 tiles with 0 broken images, advanced to Round 28, verified Round 28 current and complete copy, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=4e4e999-pages`, and `assets/tiles/96/bloodroot_ruby_shard.png`.
  - Downloaded GitHub Pages HTML contained the same Round 28 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles with 0 broken images, advanced to Round 28, verified Round 28 current and complete copy, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 28, retry, hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_6RsBXJQncAQeT5cNX549Xa3ruApp`, https://bloom-tycoon-9ofe9edbt-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 28 marker-matched HTML for pushed commit `4e4e999`.
- Known issues: none found locally or on live previews.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight added-lines credential scan ran with no findings.

## 2026-07-07 Codex Round 27 Moonlit Wreath pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 27 `Moonlit Wreath 6` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 27 Moonlit Wreath Encore preview/payoff surface below Round 26 using the existing continuing-round generator through `buildRoundPlan(27)`.
- Added tease, next, current, withered, and complete states for `roundTwentySevenPreview`, including current copy that names `Moonlit Wreath 6`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path.
- Added static verifier markers for the Round 27 encore Moonlit Wreath surface and its five `data-round-twenty-seven-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4247/playable/midnight_bloom_prototype.html?verify=round27-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/purple_nightshade_bloom.png`.
  - Local marker checks found `roundTwentySevenPreview`, `Round 27 Moonlit Wreath Encore`, `Moonlit Wreath 6`, `Round 27 encore Moonlit Wreath payoff`, `data-round-twenty-seven-state="current"`, and `function renderRoundTwentySevenPreview` in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, visible Round 27 tease copy, all four booster labels, and `Shape Bloom`.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then verified `Shape Bloom` and `B` Supreme Bloom without console.
  - Local Playwright progressed Round 1 through Round 26 with 64 tiles preserved, verified Round 27 current copy names `Moonlit Wreath 6`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the existing Moonlit Wreath Cache reward path, verified Round 27 wither -> retry restores the Cursed Thorn objective, then verified Round 27 complete copy names the sixth Moonlit Wreath.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 27 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_FVvNU3xTZEAESAZyfoXkSB9Vyx9H` at `https://bloom-tycoon-h4drwa6yi-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=ed897f1-live`, and `assets/tiles/96/purple_nightshade_bloom.png`.
  - Downloaded Vercel HTML contained `roundTwentySevenPreview`, `Round 27 Moonlit Wreath Encore`, `Moonlit Wreath 6`, `Round 27 encore Moonlit Wreath payoff`, `data-round-twenty-seven-state="current"`, and `function renderRoundTwentySevenPreview`.
  - Vercel Playwright smoke loaded 64 tiles with 0 broken images, advanced Round 1 through Round 27, verified Round 27 current and complete copy, and passed mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=ed897f1-pages`, and `assets/tiles/96/purple_nightshade_bloom.png`.
  - Downloaded GitHub Pages HTML contained the same Round 27 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles with 0 broken images, advanced Round 1 through Round 27, verified Round 27 current and complete copy, and passed mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 27, retry, hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_FVvNU3xTZEAESAZyfoXkSB9Vyx9H`, https://bloom-tycoon-h4drwa6yi-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 27 marker-matched HTML for pushed commit `ed897f1`.
- Known issues: none found locally.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight added-lines credential scan ran with no findings.

## 2026-07-07 Codex Round 26 First Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 26 `First Bouquet 6` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 26 First Bouquet Encore preview/payoff surface below Round 25 using the existing continuing-round generator through `buildRoundPlan(26)`.
- Added tease, next, current, withered, and complete states for `roundTwentySixPreview`, including current copy that names `First Bouquet 6`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path.
- Added static verifier markers for the Round 26 encore First Bouquet surface and its five `data-round-twenty-six-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4246/playable/midnight_bloom_prototype.html?verify=round26-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `roundTwentySixPreview`, `Round 26 First Bouquet Encore`, `First Bouquet 6`, `Round 26 encore First Bouquet payoff`, `data-round-twenty-six-state="current"`, and `function renderRoundTwentySixPreview` in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, visible Round 26 tease copy, all four booster labels, and `Shape Bloom`.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then verified `Shape Bloom` and `B` Supreme Bloom without console.
  - Local Playwright progressed Round 1 through Round 25 with 64 tiles preserved, verified Round 26 current copy names `First Bouquet 6`, Thorn Rose, Bone Star, higher stakes, and the existing First Bouquet Coffer reward path, then verified Round 26 complete copy names the sixth First Bouquet.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 26 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_FqV8x8ZyTaZW5ZMz28CemUSLQU3X` at `https://bloom-tycoon-h9o00buua-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=c3a5c43-live`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded Vercel HTML contained `roundTwentySixPreview`, `Round 26 First Bouquet Encore`, `First Bouquet 6`, `Round 26 encore First Bouquet payoff`, `data-round-twenty-six-state="current"`, and `function renderRoundTwentySixPreview`.
  - Vercel Playwright smoke loaded 64 tiles with 0 broken images, advanced Round 1 through Round 26, verified Round 26 current and complete copy, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=c3a5c43-pages`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded GitHub Pages HTML contained the same Round 26 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles with 0 broken images, advanced Round 1 through Round 26, verified Round 26 current and complete copy, and passed mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 26, retry, hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_FqV8x8ZyTaZW5ZMz28CemUSLQU3X`, https://bloom-tycoon-h9o00buua-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: Pages serves the Round 26 marker-matched HTML for pushed commit `c3a5c43`.
- Known issues: none found locally.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight added-lines credential scan ran with no findings; a broader whole-file scan only flagged existing historical commit hashes and display variable names such as `flowerpediaToken`/`chapterToken`, with no credential values.

## 2026-07-07 Codex Round 25 Sub Rosa Grand Bouquet pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 25 `Sub Rosa Grand Bouquet 5` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 25 Sub Rosa Grand Bouquet Encore preview/payoff surface below Round 24 using the existing continuing-round generator through `buildRoundPlan(25)`.
- Added tease, next, current, withered, and complete states for `roundTwentyFivePreview`, including current copy that names `Sub Rosa Grand Bouquet 5`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
- Added static verifier markers for the Round 25 encore Sub Rosa Grand Bouquet surface and its five `data-round-twenty-five-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4245/playable/midnight_bloom_prototype.html?verify=round25-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/crimson_rose_rune.png`.
  - Local marker checks found `roundTwentyFivePreview`, `Round 25 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 5`, `Round 25 encore Sub Rosa Grand Bouquet payoff`, and all five Round 25 state markers in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, visible Round 25 tease copy, all four booster labels, and `Shape Bloom`.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then progressed Round 3 through Round 24 with 64 tiles preserved and prior payoff surfaces complete.
  - Local Playwright verified Round 24 completion put Round 25 in `next`, then Round 25 current copy names `Sub Rosa Grand Bouquet 5`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the existing Sub Rosa Grand Cache reward path.
  - Local Playwright verified Round 25 has no Cursed Thorn blockers, Round 25 wither -> retry restores the current grand bouquet, and Round 25 completion shows `complete` copy that the fifth Sub Rosa Grand Bouquet is sealed.
  - Local Playwright verified all four boosters arm/cancel/use and preserve 64 tiles, Sacrifice opens/cancels, Chest Storage opens/closes, Shape Bloom works, `M` cycles line5/line4/cross/L/T rewards, `B` triggers Supreme Bloom, and `N` completes a bouquet.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 25 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_CQDowhinuTwjQFMpfHzDh96C8UZw` at `https://bloom-tycoon-mejzz7wvl-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=b54b8af-live`, and `assets/tiles/96/crimson_rose_rune.png`.
  - Downloaded Vercel HTML contained `roundTwentyFivePreview`, `Round 25 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 5`, `Round 25 encore Sub Rosa Grand Bouquet payoff`, `data-round-twenty-five-state="current"`, and `function renderRoundTwentyFivePreview`.
  - Vercel Playwright smoke loaded 64 tiles and 107 images with 0 broken images, advanced Round 1 through Round 25, verified Round 25 `current` and `complete` copy, verified no Cursed Thorn blockers on Round 25, cycled `M` through L/T/cross shape results, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages workflow `28842604738` deployed commit `b54b8af` successfully.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=b54b8af-pages`, and `assets/tiles/96/crimson_rose_rune.png`.
  - Downloaded GitHub Pages HTML contained the same Round 25 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles and 107 images with 0 broken images, advanced Round 1 through Round 25, verified Round 25 `current` and `complete` copy, cycled `M` through L/T/cross shape results, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 25, booster/control/hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_CQDowhinuTwjQFMpfHzDh96C8UZw`, https://bloom-tycoon-mejzz7wvl-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: workflow `28842604738` completed successfully for `b54b8af`, and Pages serves the Round 25 marker-matched HTML.
- Known issues: none found locally.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight changed-file scans ran before the gameplay commit and after the docs status update with no findings.

## 2026-07-06 Codex Round 24 Saint's Night Ledger pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 24 `Saint's Night Ledger 5` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 24 Saint's Night Ledger Encore preview/payoff surface below Round 23 using the existing continuing-round generator through `buildRoundPlan(24)`.
- Added tease, next, current, withered, and complete states for `roundTwentyFourPreview`, including current copy that names `Saint's Night Ledger 5`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
- Added static verifier markers for the Round 24 encore Saint's Night Ledger surface and its five `data-round-twenty-four-state` values.
- Preserved the existing continuing-round reward/default-choice flow; no new progression framework, account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - Local static preview at `http://127.0.0.1:4244/playable/midnight_bloom_prototype.html?verify=round24-local`
  - Local static checks returned `200 OK` for the playable and `assets/tiles/96/bone_white_thorn_star.png`.
  - Local marker checks found `roundTwentyFourPreview`, `Round 24 Saint's Night Ledger Encore`, `Saint's Night Ledger 5`, `Round 24 encore Saint's Night Ledger payoff`, and all five Round 24 state markers in the served HTML.
  - Local Playwright loaded fresh Round 1 with 64 tiles, 0 broken images, visible Round 24 tease copy, all four booster labels, and `Shape Bloom`.
  - Local Playwright verified Round 1 win -> Round 2, Round 2 wither -> `Retry Bouquet` restored Cursed Thorn objective copy and 64 tiles, then progressed Round 3 through Round 23 with 64 tiles preserved and Round 14/Round 19 payoff surfaces complete.
  - Local Playwright verified Round 23 completion put Round 24 in `next`, then Round 24 current copy names `Saint's Night Ledger 5`, Bone Star, Nightshade, Sol Rot, higher stakes, and the existing Saint's Night Ledger reward path.
  - Local Playwright verified Round 24 has no Cursed Thorn blockers, Round 24 wither -> retry restores the current ledger, and Round 24 completion shows `complete` copy that the fifth Saint's Night Ledger is filed.
  - Local Playwright verified all four boosters arm/cancel/use and preserve 64 tiles, Sacrifice opens/cancels, Chest Storage opens/closes, Shape Bloom works, `M` cycles line5/line4/cross/L/T rewards, `B` triggers Supreme Bloom, and `N` completes a bouquet.
  - Local mobile Playwright at 390x844 loaded 64 tiles, 0 broken images, visible Round 24 preview, and no horizontal overflow.
  - Vercel production deploy completed as `dpl_TsZ2643xYXH5fz6uUo7NRECAvwRA` at `https://bloom-tycoon-p0tfy8bcc-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200 OK` for `/`, `/playable/midnight_bloom_prototype.html?verify=0fe2903-live`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded Vercel HTML contained `roundTwentyFourPreview`, `Round 24 Saint's Night Ledger Encore`, `Saint's Night Ledger 5`, `Round 24 encore Saint's Night Ledger payoff`, `data-round-twenty-four-state="current"`, and `function renderRoundTwentyFourPreview`.
  - Vercel Playwright smoke loaded 64 tiles and 107 images with 0 broken images, advanced Round 1 through Round 24, verified Round 24 `current` and `complete` copy, verified no Cursed Thorn blockers on Round 24, cycled `M` through L/T/cross shape results, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages workflow `28840701730` deployed commit `0fe2903` successfully.
  - GitHub Pages direct checks returned `200 OK` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=0fe2903-pages`, and `assets/tiles/96/bone_white_thorn_star.png`.
  - Downloaded GitHub Pages HTML contained the same Round 24 markers as Vercel.
  - GitHub Pages Playwright smoke loaded 64 tiles and 107 images with 0 broken images, advanced Round 1 through Round 24, verified Round 24 `current` and `complete` copy, cycled `M` through L/T/cross shape results, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright observed 0 console warnings/errors and 0 page errors during Round 24, booster/control/hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_TsZ2643xYXH5fz6uUo7NRECAvwRA`, https://bloom-tycoon-p0tfy8bcc-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: workflow `28840701730` completed successfully for `0fe2903`, and Pages serves the Round 24 marker-matched HTML.
- Known issues: none found locally.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly; after the line5 and line4 demos, it cycles `Witch's Cross`, `Night Garden L-Bloom`, and `Twin Stem Bloom` shape rewards.
- How to trigger and verify Supreme Bloom without console: focus the playable and press `B`; the ritual log should report `SUPREME BLOOM!` after the charge phase and return the board to play.
- Security/secret-scan status: lightweight changed-file scans ran before the gameplay commit and after the docs status update with no findings.

## 2026-07-04 Codex Round 23 Bloodroot Compact pass

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 23 `Bloodroot Compact 5` clarity/payoff slice.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a Round 23 Bloodroot Compact Encore preview/payoff surface below Round 22 using the existing continuing-round generator through `buildRoundPlan(23)`.
- Added tease, next, current, withered, and complete states for `roundTwentyThreePreview`, including current copy that names `Bloodroot Compact 5`, Bloodroot, Sol Rot, higher stakes, and the existing Bloodroot Compact reward path.
- Added static verifier markers for the Round 23 encore Bloodroot Compact surface and its `data-round-twenty-three-state` values.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4243/playable/midnight_bloom_prototype.html?verify=round23-local`
  - Local static checks returned `200 OK` for the playable, `assets/tiles/96/bloodroot_ruby_shard.png`, and `assets/tiles/96/withered_sun_medallion.png`.
  - Local marker checks found `Round 23 Bloodroot Compact Encore`, `Bloodroot Compact 5`, `Round 23 encore Bloodroot Compact payoff`, and the five Round 23 state markers in the HTML/verifier.
  - Local Playwright flow loaded 64 tiles with 0 broken images, saw the fresh Round 23 tease, completed Round 1 with Flowerpedia persistence after reload, verified Round 2 Cursed Thorn retry, and verified Round 12, Round 17, and Round 22 retry restored Cursed Thorn behavior.
  - Local Playwright progressed Round 22 complete into Round 23 `next`, verified Round 23 current copy names Bloodroot/Sol Rot/higher stakes/Bloodroot Compact reward path, then verified Round 23 withered/retry/complete states.
  - All four boosters armed/canceled/used from fresh pages and preserved 64 tiles.
  - Chest Storage open/close, Sacrifice arm/cancel, Shape Bloom, `M`, `B`, `N`, and mobile portrait at 390x844 passed locally.
  - Vercel `/`, `/playable/midnight_bloom_prototype.html?verify=525697e-live`, `assets/tiles/96/bloodroot_ruby_shard.png`, and `assets/tiles/96/withered_sun_medallion.png` returned `200 OK`.
  - Downloaded Vercel HTML contained `Round 23 Bloodroot Compact Encore`, `Bloodroot Compact 5`, `Round 23 encore Bloodroot Compact payoff`, `data-round-twenty-three-state="current"`, and `function renderRoundTwentyThreePreview`.
  - Vercel Playwright check loaded 64 tiles and 105 images with 0 broken images, advanced Round 1 through Round 22 with visible `Complete Bouquet`/`Next Bouquet`, verified Round 23 `current` and `complete` states, verified no Cursed Thorn blockers on Round 23, cycled `M` through L/T/cross shape results, verified `B` Supreme Bloom, and passed mobile portrait at 390x844 with no horizontal overflow.
  - GitHub Pages workflow `28704511565` deployed commit `525697e4574fa7ced9fb22482acc074915cbdfed` successfully.
  - GitHub Pages `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=525697e-pages`, `assets/tiles/96/bloodroot_ruby_shard.png`, and `assets/tiles/96/withered_sun_medallion.png` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the same Round 23 markers as Vercel.
  - GitHub Pages Playwright check loaded 64 tiles and 105 images with 0 broken images, advanced Round 1 through Round 22, verified Round 23 `current` and `complete` states, verified no Cursed Thorn blockers on Round 23, and passed mobile portrait at 390x844 with no horizontal overflow.
- Browser console/runtime status: no local, Vercel, or GitHub Pages Playwright console errors or page errors observed during Round 23, booster/control/hook, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_8iweP5Xkth6cGfgc8cLpg2a9FHE5`, https://bloom-tycoon-bwq66eeir-xerxes-florals.vercel.app; canonical alias https://bloom-tycoon.vercel.app points to that deployment.
- GitHub Pages preview status: current and marker-matched Vercel after successful workflow `28704511565`.
- Known issues: none found locally.
- How to trigger and verify L/T/cross matches without console: open the playable and press `M` repeatedly to cycle Cross, L, and T demos; each should report the named shape and 5 cells burned bright.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit particles, then return the board to play.
- Security/secret-scan status: lightweight scan ran on changed files with no findings.

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
  - `.github/workflows/pages.yml`
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
  - Vercel production deploy completed as `dpl_BzNEQjHYRNQbAPGm5xx8jLqiFHoF` at `https://bloom-tycoon-abpzci2v8-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel direct checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html`, `/assets/tiles/96/amber_resin_seed.png`, and `/assets/tiles/48/amber_resin_seed.png`, and the playable contained `Bouquet Streak`, `bouquetStreakBadge`, `STREAK_COIN_BONUS_CAP`, `Choose Your Reward`, `rewardChoicePanel`, `Grave Soil`, `Cursed Thorn`, and `Rune-Tended Soil`.
  - Vercel Playwright desktop smoke loaded 64 tiles, 0 broken images, no overflow, no console/page errors, completed the first bouquet, verified `Bouquet Streak 1`, `+5% coins`, `+126`, exactly three reward choices, selected `Greenhouse Cuttings`, clicked `Next Bouquet`, and verified Round 2 retained `Bouquet Streak 1` with `Cursed Thorn 0/3` and 3 visible blockers.
  - Vercel Playwright mobile smoke at 390x844 loaded 64 tiles, 0 broken images, no overflow, completed the first bouquet, and verified `Bouquet Streak 1`, `+5% coins`, and exactly three reward choices.
  - Vercel Playwright second-completion smoke ignored the first reward panel, clicked `Next Bouquet` to apply the default `Greenhouse Cuttings`, completed Round 2 with the review control, and verified `Bouquet Streak 2`, `+10% coins`, `+165`, exactly three reward choices, 64 tiles, 0 broken images, and no overflow.
  - GitHub Pages workflow `28640343769` succeeded for gameplay commit `57cd19e`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html`, `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png`, and `/bloom-tycoon/assets/tiles/48/amber_resin_seed.png`, and the playable contained the same streak, reward-choice, booster, blocker, and rune markers as Vercel.
  - GitHub Pages Playwright desktop smoke loaded 64 tiles, 0 broken images, no overflow, no console/page errors, completed the first bouquet, verified `Bouquet Streak 1`, `+5% coins`, `+126`, exactly three reward choices, selected `Greenhouse Cuttings`, clicked `Next Bouquet`, and verified Round 2 retained `Bouquet Streak 1` with `Cursed Thorn 0/3` and 3 visible blockers.
  - GitHub Pages Playwright mobile smoke at 390x844 loaded 64 tiles, 0 broken images, no overflow, completed the first bouquet, and verified `Bouquet Streak 1`, `+5% coins`, and exactly three reward choices.
  - GitHub Pages Playwright second-completion smoke ignored the first reward panel, clicked `Next Bouquet` to apply the default `Greenhouse Cuttings`, completed Round 2 with the review control, and verified `Bouquet Streak 2`, `+10% coins`, `+165`, exactly three reward choices, 64 tiles, 0 broken images, and no overflow.
- Browser console/runtime status: no local, Vercel, or GitHub Pages Playwright console errors or page errors observed during streak completions, reward selection/default, Round 2 thorn flow, booster checks, Rune-Tended Soil, review hooks, Chest/Sacrifice, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_BzNEQjHYRNQbAPGm5xx8jLqiFHoF`, `https://bloom-tycoon-abpzci2v8-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28640343769` succeeded for `57cd19e`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html` returned `200` with all new streak markers.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the Bouquet Streak slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
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

## 2026-07-03 Codex normal-play teaching slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow normal-play teaching pass for Round 2 Cursed Thorn and Shape Bloom discovery.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added visible Round 2 teaching cues: `Match beside Cursed Thorns` objective chip, plaque/log copy explaining adjacent matches, short-lived `thorn-teach` highlights, and `thorn-teach-marker` badges over the thorn lane plus the starter swap.
- Added a deterministic early Round 2 adjacent-match opportunity under the first thorn row. The board still starts with no free matches; the player must swap the glowing tiles to clear the thorns.
- Added normal-play Shape Bloom discovery after the first bouquet and in Round 2 with `L/T/cross = Shape Bloom` UI and plaque/log copy.
- Made post-bouquet choices more obviously valuable with one-line value copy and claim labels, while preserving exactly three choices and the default `Greenhouse Cuttings` path on `Next Bouquet`.
- Added a visible `Next Streak Target` before `Next Bouquet` so the next bouquet has a clear bonus goal.
- Updated static verifier markers for the new teaching cue, seeded thorn move, Shape Bloom hint, reward-choice value labels, and next-streak target.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - JS parse check over executable HTML scripts with bundled Node.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4173/playable/midnight_bloom_prototype.html`; `agent-browser` was unavailable, so bundled Playwright was used.
  - Local static checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html`, and `/assets/tiles/96/amber_resin_seed.png`.
  - Local Playwright fresh load: 64 tiles, 95 images, 0 broken images, no console/page errors, and no mobile overflow at 390x844.
  - Local Playwright completed Round 1, verified `Bouquet Streak 1`, `Next Streak Target 2`, exactly three reward choices, three value lines, claim labels, and Shape Bloom plaque copy.
  - Local Playwright clicked `Next Bouquet` without choosing a reward and verified default `Greenhouse Cuttings`, Round 2 `Cursed Thorn 0/3`, `Match beside Cursed Thorns`, `L/T/cross = Shape Bloom`, 7 highlighted teaching cells, 7 teaching markers, 3 Cursed Thorn blockers, and a seeded adjacent thorn-clearing move.
  - Local Playwright clicked the seeded Round 2 swap; it cleared all three Cursed Thorns, updated to `Cursed Thorn 3/3`, preserved 64 tiles, and returned the board to 0 disabled tiles.
  - Local Playwright completed Round 2 with the review control and verified `Bouquet Streak 2`, `Next Streak Target 3`, and exactly three reward choices.
  - Local Playwright verified `Pruning Shears`, `Moonwater Flask`, `Black Candle`, and `Grave Soil` still arm/cancel/use and preserve 64 tiles.
  - Local Playwright verified Sacrifice opens/cancels, Chest opens/closes with Escape, Shape Bloom cycles into L/T/cross rewards, and Supreme Bloom can still be triggered without console.
  - Vercel production deploy completed as `dpl_B6bLL2FFruccGP6xh23ktNkv9VSh` at `https://bloom-tycoon-9vwk6bk9c-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/`, `/playable/midnight_bloom_prototype.html?verify=e34e12c`, `/assets/tiles/96/amber_resin_seed.png?verify=e34e12c`, and `/assets/tiles/48/amber_resin_seed.png?verify=e34e12c`; the playable contained all teaching, reward-choice, streak, Shape Bloom, and Cursed Thorn markers.
  - Vercel Playwright desktop smoke loaded 64 tiles, 0 broken images, no overflow, no console/page errors, completed Round 1, verified exactly three reward choices with value copy, clicked `Next Bouquet`, verified 7 Round 2 teaching highlights/markers and a seeded adjacent thorn move, then cleared all three Cursed Thorns with the visible swap.
  - Vercel Playwright mobile smoke at 390x844 loaded 64 tiles, 0 broken images, no horizontal overflow, exactly three reward choices, three value lines, and `Next Streak Target 2`.
  - GitHub Pages workflow `28671840441` succeeded for gameplay commit `e34e12c`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/`, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=e34e12c`, `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=e34e12c`, and `/bloom-tycoon/assets/tiles/48/amber_resin_seed.png?verify=e34e12c`; the playable contained all teaching, reward-choice, streak, Shape Bloom, and Cursed Thorn markers.
  - GitHub Pages Playwright desktop smoke loaded 64 tiles, 0 broken images, no overflow, no console/page errors, completed Round 1, verified exactly three reward choices with value copy, clicked `Next Bouquet`, verified 7 Round 2 teaching highlights/markers and a seeded adjacent thorn move, then cleared all three Cursed Thorns with the visible swap.
  - GitHub Pages Playwright mobile smoke at 390x844 loaded 64 tiles, 0 broken images, no horizontal overflow, exactly three reward choices, three value lines, and `Next Streak Target 2`.
- Browser console/runtime status: no local, Vercel, or GitHub Pages Playwright console warnings, console errors, or page errors observed during the main teaching flow, reward-choice/streak checks, mobile checks, booster use checks, Shape Bloom cycle, or Supreme review hook.
- Vercel deployment URL/identifier checked: `dpl_B6bLL2FFruccGP6xh23ktNkv9VSh`, `https://bloom-tycoon-9vwk6bk9c-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28671840441` succeeded for `e34e12c`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=e34e12c` returned `200` with all new markers.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the normal-play teaching slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-03 Codex failed bouquet retry slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow fast retry / failed bouquet recovery pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a failed-bouquet ceremony, `The Bouquet Withered`, when moves reach 0 before the current objectives are complete.
- Added exact remaining-objective copy for unfinished order targets and Cursed Thorn clears.
- Changed the current-round no-moves action to a visible `Retry Bouquet` button.
- Reused the existing round reset path so retry resets the current round board/objectives/moves/Cursed Thorns while preserving coins, XP, boosters, Chest Storage, Flowerpedia, Chapter 1 reward claim, and saved meta progress.
- Fixed save loading for `moves: 0` so failed bouquets persist as failed after reload instead of restoring the default move count.
- Preserved the win loop, reward choices/default, Bouquet Streak, Flowerpedia persistence, Chapter 1 one-time reward, Round 2 thorn teaching, boosters, Shape Bloom/Supreme Bloom, Chest/Sacrifice, review hooks, and mobile layout.
- Added static verifier markers for `The Bouquet Withered`, `Retry Bouquet`, `failedBouquetGoals`, `retryBouquetPrompt`, and the failed/retry helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - JS parse check over executable HTML scripts with bundled Node.
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4185/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local Playwright fresh Round 1 spent all 12 moves with `Shuffle`, verified `The Bouquet Withered`, `Retry Bouquet`, exact remaining `Velvet Funeral` and `Saint's Offering` goals, 64 disabled board tiles, saved `moves: 0`, and preserved coins/boosters.
  - Local Playwright reloaded the failed Round 1 save and verified the failed ceremony and `moves: 0` persisted.
  - Local Playwright clicked `Retry Bouquet`, verified Round 1 moves/objectives reset, the board became playable, and coins, XP, chest count, and boosters were preserved.
  - Local Playwright completed Round 1 after retry through tile swaps, verified `Bouquet Streak 1`, `Flowerpedia` unlock, and exactly three reward choices.
  - Local Playwright entered Round 2, verified 17 moves, 3 Cursed Thorns, and 7 teaching-highlight cells.
  - Local Playwright spent all Round 2 moves with `Shuffle`, verified `The Bouquet Withered`, exact Cursed Thorn remaining copy, saved `moves: 0`, and preserved Flowerpedia/boosters.
  - Local Playwright clicked `Retry Bouquet` in Round 2, verified moves/counts/thorns reset, 3 Cursed Thorns and 7 teaching cells returned, and Flowerpedia/boosters stayed intact.
  - Local Playwright clicked the seeded Round 2 thorn-teaching swap after retry, verified 3 Cursed Thorns cleared, `Cursed Thorn Field Note` unlocked, Chapter 1 reward claimed once, Black Candle increased to 2, and reload did not double-claim.
  - Local Playwright verified Chest opens with Chapter 1 progress, Sacrifice opens/cancels, and all four boosters still arm/cancel/use and preserve 64 tiles.
  - Local Playwright verified `N`, `M`, `Shape Bloom`, and `B` review hooks still work.
  - Local Playwright mobile at 390x900 verified the failed state still has 64 tiles, 0 broken images, no horizontal overflow, and visible `Retry Bouquet`.
- Browser console/runtime status: no local Playwright console errors or page errors observed during failed/retry paths, reload persistence, Round 2 thorn retry, Chapter reward persistence, boosters, Chest/Sacrifice, review hooks, or mobile checks.
- Known issues: none found locally for this failed bouquet retry slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-03 Codex Chapter 1 collection reward payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Chapter 1 / collection reward payoff after 2/2 Flowerpedia or Bouquet Streak 2.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a visible `Chapter Progress` surface under the Flowerpedia ledger and inside Chest Storage.
- Added `Chapter 1: Midnight Conservatory` with a locked next-room hint for `Glasshouse Atrium`.
- Added one local-only reward: `Black Candle x1` when the player completes Flowerpedia 2/2 or reaches Bouquet Streak 2.
- Persisted claimed Chapter rewards in `localStorage` as `chapterRewardsClaimed`, with migration support for existing local saves that already satisfy the reward condition.
- Preserved the normal-play path: Round 1 unlocks `Velvet Funeral`, Round 2 thorn clearing unlocks `Cursed Thorn Field Note`, and the Chapter reward claims without pressing demo controls.
- Added static verifier markers for the Chapter 1 reward, `chapterProgress`, `chapterOneProgress`, `chapterRewardsClaimed`, and helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - JS parse check over executable HTML scripts with bundled Node.
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4184/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local Playwright fresh load verified 64 tiles, `Chapter 1: Midnight Conservatory`, `Flowerpedia 0/2`, `Black Candle x1`, the locked `Glasshouse Atrium` tease, and 0 broken images.
  - Local Playwright completed Round 1 through tile swaps, verified `Flowerpedia 1/2`, exactly three reward choices, and no Chapter reward at 1/2.
  - Local Playwright reloaded at 1/2 and verified no accidental Black Candle claim.
  - Local Playwright clicked `Next Bouquet`, cleared the Round 2 Cursed Thorns through the seeded playable swap, verified `Cursed Thorn Field Note`, `Flowerpedia 2/2`, `Chapter 1 reward claimed`, `Black Candle x1 claimed`, 64 tiles, and persisted `chapterRewardsClaimed`.
  - Local Playwright reloaded after the claim and verified Black Candle stayed at 2 with no duplicate reward.
  - Local Playwright opened Chest Storage and verified the Chapter 1 progress module shows the claimed reward and `Glasshouse Atrium`.
  - Local Playwright simulated an old 2/2 Flowerpedia save with no Chapter claim, verified it grants exactly one Black Candle on migration, saves the claim, and does not duplicate on the next reload.
  - Local Playwright simulated a Bouquet Streak 2 save with only `Flowerpedia 1/2`, verified it grants exactly one Black Candle through the alternate trigger, saves the claim, names `Bouquet Streak 2 reached`, and does not duplicate on reload.
  - Local Playwright verified `Pruning Shears`, `Moonwater Flask`, `Black Candle`, and `Grave Soil` still arm, cancel, use once, and preserve 64 tiles.
  - Local Playwright mobile at 390x900 verified 64 tiles, 0 broken images, and no horizontal overflow.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Chapter reward path, reload/no-duplicate checks, Chest check, booster checks, or mobile check.
- Known issues: none found locally for this Chapter 1 payoff slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.

## 2026-07-03 Codex Flowerpedia unlock slice

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow local/static Flowerpedia or collection payoff after normal bouquet progress.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a persistent bottom Elements ledger named `Flowerpedia` and a matching `Flowerpedia` section inside Chest Storage.
- Added two local-only unlocks:
  - `Velvet Funeral`, unlocked when Round 1 is completed.
  - `Cursed Thorn Field Note`, unlocked when the player first clears Cursed Thorns.
- The unlock IDs persist in the existing `localStorage` save object as `flowerpediaUnlocked`; old local saves migrate forward if they already have a bouquet streak, a later round, a completed bouquet, or cleared thorns.
- Added player-facing reward copy to the ritual log and bouquet ceremony. The copy explains why the entry matters and points to the next bouquet, Cursed Thorn, or Shape Bloom goal.
- Preserved Bouquet Streak, reward choices, all four boosters, Rune-Tended Soil, Round 2 Cursed Thorn teaching, Shape Bloom/Supreme Bloom, review hooks, Chest/Sacrifice, and mobile layout.
- Added static verifier markers for `Flowerpedia`, `flowerpediaEntries`, `flowerpediaLedger`, `flowerpediaModal`, `flowerpediaUnlocked`, `flowerpediaUnlocks`, both entry names, and the new render/validation helpers.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `python3 scripts/verify_html_match_shapes.py`
  - JS parse check over executable HTML scripts with bundled Node.
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4183/playable/midnight_bloom_prototype.html`; `agent-browser` was unavailable, so bundled Playwright was used.
  - Local Playwright fresh load verified 64 tiles, nonblank content, locked `Flowerpedia 0 / 2`, no desktop horizontal overflow, and no broken images in later reload checks.
  - Local Playwright completed Round 1 through normal tile swaps after seeding legal target moves, verified `Flowerpedia unlocked: Velvet Funeral`, `Flowerpedia 1 / 2`, the ceremony token, exactly three reward choices, 64 tiles, and `localStorage.flowerpediaUnlocked`.
  - Local Playwright reloaded and verified `Velvet Funeral` persisted with three reward choices and 64 tiles.
  - Local Playwright clicked `Next Bouquet`, verified default reward behavior, Round 2 `Match beside Cursed Thorns`, `L/T/cross = Shape Bloom`, 64 tiles, and visible thorn teaching markers.
  - Local Playwright clicked the seeded Round 2 thorn-teaching swap, verified `Flowerpedia unlocked: Cursed Thorn Field Note`, `Flowerpedia 2 / 2`, 64 tiles, and persisted `localStorage.flowerpediaUnlocked`.
  - Local Playwright reloaded again and verified both entries persisted.
  - Local Playwright opened Chest Storage and verified the Flowerpedia modal section shows both unlocked entries alongside 16 chest slots.
  - Local Playwright mobile at 390x900 verified 64 tiles, locked Flowerpedia ledger, 0 broken images, and no horizontal overflow.
  - Local Playwright regression sweep verified `Pruning Shears`, `Moonwater Flask`, `Black Candle`, and `Grave Soil` each arm, cancel, use once, and preserve 64 tiles on fresh boards.
  - Local Playwright verified Sacrifice opens/cancels, `M` and `Shape Bloom` still resolve Shape Bloom review paths, `B` still triggers Supreme Bloom, `N` still completes a bouquet, exactly three reward choices appear, and selecting `Apothecary Kit` claims correctly while preserving 64 tiles.
  - Vercel production deploy completed as `dpl_2zEFMbehq65gxGfPhjbfc6SnwwwY` at `https://bloom-tycoon-lyrfct45v-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=2ab5415` and `/assets/tiles/96/amber_resin_seed.png?verify=2ab5415`, and the playable contained the Flowerpedia markers.
  - GitHub Pages workflow `28673684966` initially failed transiently in `actions/deploy-pages`, then succeeded on rerun for `2ab5415`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=2ab5415` and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=2ab5415`, and the playable contained the Flowerpedia markers.
  - Vercel and GitHub Pages Playwright smoke both loaded 64 tiles, 0 broken images, no horizontal overflow, completed Round 1 through tile swaps, verified `Velvet Funeral` persisted after reload, cleared Round 2 Cursed Thorns, verified `Cursed Thorn Field Note` persisted, opened Chest Flowerpedia entries, and passed mobile 390x900 checks with no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during Flowerpedia unlocks, reload persistence, Chest, Round 2 thorn flow, boosters, Sacrifice, reward choice, Shape Bloom, Supreme Bloom, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during Flowerpedia unlocks, reload persistence, Chest, Round 2 thorn flow, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_2zEFMbehq65gxGfPhjbfc6SnwwwY`, `https://bloom-tycoon-lyrfct45v-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28673684966` succeeded on rerun for `2ab5415`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=2ab5415` returned `200` with all new markers.
- Known issues: none found locally, on Vercel, or on GitHub Pages for the Flowerpedia slice. GitHub Pages had one transient deploy failure before the rerun succeeded. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears.
- How to trigger and verify Supreme Bloom without console: press `B`; the overlay should show `SUPREME BLOOM! +12 ✪`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-03 Codex beginner bouquet path preview

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow beginner bouquet path / next-goal preview pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a visible `Bouquet Path` panel under the first-session plaque.
- The panel uses existing round template data only and shows three beginner nodes: Round 1 `First Bouquet`, Round 2 `Moonlit Wreath`, and Round 3 `Bloodroot Compact`.
- Added node states for `complete`, `current`, `locked`, and `withered`; failed bouquets now keep the path anchored to the current withered node and the retry copy points back to the current bouquet.
- Round 2 path copy previews `Collection + Cursed Thorn` and the next reward tease without adding accounts, backend, analytics, SDKs, trackers, new assets, or broad systems.
- Added mobile styles so the path stacks in portrait without horizontal overflow.
- Added static verifier markers for `Bouquet Path`, `bouquetPath`, `bouquet-path-nodes`, `data-bouquet-state="complete"`, `current`, `locked`, and `withered`, plus the path render/helper functions.
- Verification run:
  - `git fetch origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4186/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local Playwright fresh Round 1 verified `Bouquet Path`, three nodes, Round 1/2/3 labels, `current,locked,locked` states, Round 2 Cursed Thorn preview, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright Round 1 fail verified `Retry keeps you on First Bouquet`, Round 1 `withered`, visible `Retry Bouquet`, 64 disabled tile buttons, then retry restored Round 1 current state, 12 moves, and 64 enabled tiles.
  - Local Playwright Round 1 win verified Round 1 `complete`, exactly three reward choices, `Next Bouquet`, then Round 2 path states `complete,current,locked`.
  - Local Playwright Round 2 verified the current node names Cursed Thorn, 3 Cursed Thorns, teaching-highlight cells, adjacent-match thorn clearing, Round 2 fail anchored to the withered current node, and retry restoring 17 moves plus 3 Cursed Thorns.
  - Local Playwright mobile at 390x860 verified three path nodes, visible path copy, no horizontal overflow, and no console/page errors.
  - Local preservation smoke verified all four boosters arm/cancel/use and preserve 64 tiles; `Shape Bloom` resolves an existing shape reward; L/T/cross audit definitions remain present; `B` triggers Supreme Bloom; Chest opens/closes; Sacrifice arms/cancels; Flowerpedia and Chapter 1 reward persist after reload and do not double-claim.
  - Vercel production deploy completed as `dpl_94KMSnChg5qrQ23BuN2V1ohVirSN` at `https://bloom-tycoon-pt5qggile-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=79766f0` and `/assets/tiles/96/amber_resin_seed.png?verify=79766f0`, and the playable contained the Bouquet Path and all node-state markers.
  - GitHub Pages workflow `28686387025` succeeded for `79766f0`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=79766f0` and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=79766f0`, and the playable contained the Bouquet Path and all node-state markers.
  - Vercel and GitHub Pages Playwright smoke both verified fresh Bouquet Path, Round 1 fail -> `withered` -> retry, Round 1 win -> reward choices -> Round 2 `complete,current,locked`, 3 Round 2 Cursed Thorns, mobile 390px layout, no broken images, and no console/page errors.
  - Vercel logs check for `bloom-tycoon-pt5qggile-xerxes-florals.vercel.app` found no runtime logs for this static deployment.
- Browser console/runtime status: no local Playwright console errors or page errors observed during path, retry, Round 2 thorn, mobile, booster, Shape Bloom, Supreme Bloom, Chest/Sacrifice, Flowerpedia, or Chapter persistence checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh path, fail/retry, win-to-Round-2, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_94KMSnChg5qrQ23BuN2V1ohVirSN`, `https://bloom-tycoon-pt5qggile-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28686387025` succeeded for `79766f0`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=79766f0` returned `200` with all new markers.
- Known issues: none found locally for this bouquet path slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains all three definitions.
- How to trigger and verify Supreme Bloom without console: press `B`; after the short charge phase, the overlay should show `SUPREME BLOOM! +12`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-03 Codex Round 3 Bloodroot Compact clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 3 Bloodroot Compact clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 3 Focus` strip below `Bouquet Path` using the existing Round 3 `Bloodroot Compact` template.
- The strip has local/static states for `tease`, `next`, `current`, `withered`, and `complete`.
- The copy names Bloodroot/Sol Rot objectives when Round 3 becomes current and points the payoff back to existing Chest Storage, Flowerpedia, Chapter Progress, and Round 3 reward values.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, or permission was added.
- Added static verifier markers for `roundThreeFocus`, `Round 3 Focus`, `Bloodroot Compact payoff`, all `data-round-three-state` values, and the Round 3 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4186/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local Playwright fresh Round 1 verified `Round 3 Focus` in `tease`, Bloodroot Compact/Bloodroot/Sol Rot copy, Chest Storage/Flowerpedia/Chapter Progress payoff copy, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright Round 1 review completion verified exactly three reward choices.
  - Local Playwright `Next Bouquet` into Round 2 verified Round 3 state `next` and path states `complete,current,locked`.
  - Local Playwright Round 2 fail verified path states `complete,withered,locked`; retry restored Round 2 and kept Round 3 Focus in `next`.
  - Local Playwright Round 2 review completion plus `Next Bouquet` verified Round 3 state `current`, path states `complete,complete,current`, and objective text for Bloodroot and Sol Rot.
  - Local Playwright Round 3 review completion verified Round 3 state `complete`, `Bloodroot Compact` was added to Chest Storage, ceremony copy stayed visible, and three reward choices still appeared.
  - Local Playwright mobile at 390x860 verified the Round 3 strip remains visible, has no horizontal overflow, no broken images, and no console/page errors.
  - Local preservation smoke verified Round 1 fail/retry, all four boosters arm/cancel/use and preserve 64 tiles, Shape Bloom, Supreme Bloom via `B`, Chest, and Sacrifice still work without console/page errors.
  - Vercel production deploy completed as `dpl_EYvv8PvavugQsp99Nj6owsmkJiWM` at `https://bloom-tycoon-ns09728c3-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=ad48e70` and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=ad48e70`, and the playable contained all Round 3 Focus markers.
  - GitHub Pages workflow `28686741934` succeeded for `ad48e70`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=ad48e70` and `/bloom-tycoon/assets/tiles/96/bloodroot_ruby_shard.png?verify=ad48e70`, and the playable contained all Round 3 Focus markers.
  - Vercel and GitHub Pages Playwright smoke both verified fresh Round 3 tease, Round 2 next focus, Round 3 current focus, Round 3 completion, Bloodroot Compact in Chest Storage, reward choices, mobile 390px layout, no broken images, and no console/page errors.
  - Vercel logs check for `bloom-tycoon-ns09728c3-xerxes-florals.vercel.app` found no runtime logs for this static deployment.
- Browser console/runtime status: no local Playwright console errors or page errors observed during Round 3 tease/current/complete checks, Round 1 fail/retry, Round 2 fail/retry, mobile, boosters, Shape Bloom, Supreme Bloom, Chest, or Sacrifice.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 3 tease, Round 2 next focus, Round 3 current/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_EYvv8PvavugQsp99Nj6owsmkJiWM`, `https://bloom-tycoon-ns09728c3-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28686741934` succeeded for `ad48e70`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=ad48e70` returned `200` with all new markers.
- Known issues: none found locally for this Round 3 clarity/payoff slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross!`, `Night Garden L-Bloom!`, or `Twin Stem Bloom!` appears. The hidden `shapeAuditData` verifier still contains all three definitions.
- How to trigger and verify Supreme Bloom without console: press `B`; after the short charge phase, the overlay should show `SUPREME BLOOM! +12`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-03 Codex Round 4 Saint's Night Ledger preview/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 4 Saint's Night Ledger preview/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 4 Contract` strip below `Round 3 Focus` using the existing round-template/render patterns.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for the Saint's Night Ledger objective and payoff.
- Updated Round 4's third target from Amber Seal to existing Sol Rot (`Sol Rot Seal`) so the visible objective matches Hermes' Bone Star/Nightshade/Sol Rot audit request.
- The Round 4 copy points payoff back to existing Chest Storage, Flowerpedia, Chapter Progress, and existing reward values; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundFourPreview`, `Round 4 Contract`, `Saint's Night Ledger payoff`, all `data-round-four-state` values, and the Round 4 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4197/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round4-local` and `/assets/tiles/96/withered_sun_medallion.png?verify=round4-local`; the playable contained the new Round 4 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 4 `tease`, Round 1 win -> reward -> Round 2, Round 2 Cursed Thorn objective, Round 2 fail -> retry, Round 2 win -> Round 3, Round 3 current copy, Round 3 completion/payoff, Bloodroot Compact in Chest Storage, Round 4 current Bone Star/Nightshade/Sol Rot objective, Round 4 completion/payoff, Saint's Night Ledger in Chest Storage, reward choices, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 4 preview, no horizontal overflow, no broken images, and no console/page errors.
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel deploy --prod --yes`
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel alias set bloom-tycoon-f12cdg1il-xerxes-florals.vercel.app bloom-tycoon.vercel.app`
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=bfe2d7b-live` and `/assets/tiles/96/withered_sun_medallion.png?verify=bfe2d7b-live`, and the playable contained all Round 4 markers.
  - GitHub Pages workflow `28688261865` succeeded for `bfe2d7b`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=bfe2d7b-live` and `/bloom-tycoon/assets/tiles/96/withered_sun_medallion.png?verify=bfe2d7b-live`, and the playable contained all Round 4 markers.
  - Vercel and GitHub Pages Playwright smoke both verified fresh Round 4 tease, Round 3 completion/payoff, Bloodroot Compact in Chest Storage, Round 4 current Bone Star/Nightshade/Sol Rot objective, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-4 main flow, booster checks, Shape Bloom, Supreme Bloom, Chest, Sacrifice, or mobile checks. No Vercel or GitHub Pages Playwright console errors/page errors observed during live Round 4 smoke checks.
- Vercel deployment URL/identifier checked: `dpl_Ewza9wN4XrJznpMt2g1wtj46DJVg`, `https://bloom-tycoon-f12cdg1il-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28688261865` succeeded for `bfe2d7b`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=bfe2d7b-live` returned `200` with all new markers.
- Known issues: none found locally for this Round 4 preview/payoff slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears in the ritual log. The hidden `shapeAuditData` verifier still contains all three definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the overlay should show `SUPREME BLOOM! +12`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 5 Sub Rosa Grand Bouquet preview/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 5 Sub Rosa Grand Bouquet preview/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 5 Grand Bouquet` strip below `Round 4 Contract` using the existing round-template/render patterns.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for the Sub Rosa Grand Bouquet objective and payoff.
- The existing Round 5 template already names Thorn Rose, Bloodroot, and Sol Rot, so no round-target change was needed.
- The Round 5 copy points payoff back to existing Chest Storage, Flowerpedia, Chapter Progress, reward choice, and existing Sub Rosa Favor reward values; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundFivePreview`, `Round 5 Grand Bouquet`, `Sub Rosa Grand Bouquet payoff`, all `data-round-five-state` values, and the Round 5 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4198/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round5-local` and `/assets/tiles/96/crimson_rose_rune.png?verify=round5-local`; the playable contained the new Round 5 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 5 `tease`, Round 1 win -> reward -> Round 2, Round 2 Cursed Thorn objective, Round 2 fail -> retry, Round 2 win -> Round 3, Round 3 completion/payoff, Bloodroot Compact in Chest Storage, Round 4 completion/payoff, Saint's Night Ledger in Chest Storage, Round 5 current Thorn Rose/Bloodroot/Sol Rot objective, Round 5 completion/payoff, Sub Rosa Grand Cache in Chest Storage, reward choices, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 5 preview, no horizontal overflow, no broken images, and no console/page errors.
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel deploy --prod --yes`
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel alias set bloom-tycoon-5w34nn6pf-xerxes-florals.vercel.app bloom-tycoon.vercel.app`
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=d418f77-live` and `/assets/tiles/96/crimson_rose_rune.png?verify=d418f77-live`, and the playable contained all Round 5 markers.
  - GitHub Pages workflow `28688940612` succeeded for `d418f77`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=d418f77-live` and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=d418f77-live`, and the playable contained all Round 5 markers.
  - Vercel and GitHub Pages Playwright smoke both verified fresh Round 5 tease, Round 4 completion/payoff, Saint's Night Ledger in Chest Storage, Round 5 current Thorn Rose/Bloodroot/Sol Rot objective, Round 5 completion/payoff, Sub Rosa Grand Cache in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-5 main flow, booster checks, Shape Bloom, Supreme Bloom, Chest, Sacrifice, or mobile checks. No Vercel or GitHub Pages Playwright console errors/page errors observed during live Round 5 smoke checks.
- Vercel deployment URL/identifier checked: `dpl_J8yX47HKTFXQh2g8CYUpLUNNiDZX`, `https://bloom-tycoon-5w34nn6pf-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28688940612` succeeded for `d418f77`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=d418f77-live` returned `200` with all new markers.
- Known issues: none found locally for this Round 5 preview/payoff slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` repeatedly until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears in the ritual log. The hidden `shapeAuditData` verifier still contains all three definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the overlay should show `SUPREME BLOOM! +12`, emit the review-hook particle burst, then return the board to play.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings; no secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 6 encore-loop clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 6 encore-loop clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 6 Encore Loop` strip below `Round 5 Grand Bouquet` using the existing continuing-round generator via `buildRoundPlan(6)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `First Bouquet 2` as the encore pass through the bouquet ladder with higher stakes.
- The Round 6 copy points payoff back to the existing First Bouquet reward structure, Bouquet Streak, reward choice, and Chest Storage; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundSixPreview`, `Round 6 Encore Loop`, `First Bouquet 2`, `Round 6 encore payoff`, all `data-round-six-state` values, and the Round 6 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4206/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round6-local` and `/assets/tiles/96/amber_resin_seed.png?verify=round6-local`; the playable contained the new Round 6 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 6 `tease`, Round 1 win -> reward -> Round 2, Round 2 Cursed Thorn objective, Round 2 fail -> retry, Round 2 win -> Round 3, Round 3 completion/payoff, Bloodroot Compact in Chest Storage, Round 4 completion/payoff, Saint's Night Ledger in Chest Storage, Round 5 current and completion/payoff, Sub Rosa Grand Cache in Chest Storage, Round 6 current `First Bouquet 2` higher-stakes copy, Round 6 completion/payoff, reward choices, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review hook plus hidden L/T/cross `shapeAuditData`, `M`, Supreme Bloom via `B`, `N`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 6 preview, no horizontal overflow, no broken images, and no console/page errors.
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel deploy --prod --yes`
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel alias set bloom-tycoon-njz06b1lj-xerxes-florals.vercel.app bloom-tycoon.vercel.app`
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=068aeab-live` and `/assets/tiles/96/amber_resin_seed.png?verify=068aeab-live`, and the playable contained all Round 6 markers.
  - Vercel Playwright smoke verified fresh Round 6 tease, Round 2 Cursed Thorn copy, Round 5 completion/payoff, Sub Rosa Grand Cache in Chest Storage, Round 6 current `First Bouquet 2` copy, Round 6 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28689940900` initially failed at the final `Deploy` step for code commit `068aeab` after checkout/configure/upload succeeded; public API did not expose the deploy-step log without admin scope.
  - Follow-up GitHub Pages workflow `28690131673` succeeded for docs commit `5f62dd7`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=5f62dd7-live` and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=5f62dd7-live`, and the playable contained all Round 6 markers.
  - GitHub Pages Playwright smoke verified fresh Round 6 tease, Round 1 -> Round 6 review progression, Round 6 current `First Bouquet 2` copy, Round 6 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-6 main flow, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, or mobile checks. No Vercel or GitHub Pages Playwright console errors or page errors observed during live Round 6 smoke checks.
- Vercel deployment URL/identifier checked: `dpl_HUKcsBVrNP3VwXHwPdJrFVbq6nzE`, `https://bloom-tycoon-njz06b1lj-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28690131673` succeeded for `5f62dd7`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=5f62dd7-live` returned `200` with all new Round 6 markers.
- Known issues: none found locally for this Round 6 encore-loop slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` to trigger the prototype match-shape review. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no likely secrets; the gameplay scan only flagged existing local display variable names `flowerpediaToken` and `chapterToken`, with no credential values, and the final docs diff scan was clean. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 7 encore Cursed Thorn clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 7 encore Cursed Thorn clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 7 Thorn Encore` strip below `Round 6 Encore Loop` using the existing continuing-round generator via `buildRoundPlan(7)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Moonlit Wreath 2` as the second-pass Cursed Thorn round.
- The Round 7 copy explains the same adjacent-match Cursed Thorn clearing rule, higher stakes, and the existing Moonlit Wreath reward structure; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundSevenPreview`, `Round 7 Thorn Encore`, `Moonlit Wreath 2`, `Round 7 encore Cursed Thorn payoff`, all `data-round-seven-state` values, and the Round 7 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4207/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round7-local` and `/assets/tiles/96/bone_white_thorn_star.png?verify=round7-local`; the playable contained the new Round 7 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 7 `tease`, Round 1 win -> reward -> Round 2, Round 2 Cursed Thorn objective, Round 2 fail -> retry, Round 2 win -> Round 3, Round 3 completion/payoff, Bloodroot Compact in Chest Storage, Round 4 completion/payoff, Saint's Night Ledger in Chest Storage, Round 5 completion/payoff, Sub Rosa Grand Cache in Chest Storage, Round 6 completion/payoff, Round 7 current `Moonlit Wreath 2` higher-stakes Cursed Thorn copy, Round 7 completion/payoff, Moonlit Wreath Cache in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review hook plus hidden L/T/cross `shapeAuditData`, `M`, Supreme Bloom via `B`, `N`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 7 preview, no horizontal overflow, no broken images, and no console/page errors.
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel deploy --prod --yes`
  - `PATH=/Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/Xerxes/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm dlx vercel alias set bloom-tycoon-6tp02rkj7-xerxes-florals.vercel.app bloom-tycoon.vercel.app`
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=c1b5353-live` and `/assets/tiles/96/bone_white_thorn_star.png?verify=c1b5353-live`, and the playable contained all Round 7 markers.
  - Vercel Playwright smoke verified fresh Round 7 tease, Round 1 -> Round 7 review progression, Round 7 current `Moonlit Wreath 2` Cursed Thorn copy, Round 7 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28690725149` failed at the final `Deploy` step for code commit `c1b5353` after checkout/configure/upload succeeded; the public check-run annotation reported `Deployment failed, try again later.`
  - Follow-up GitHub Pages workflow `28690770979` also failed at the final `Deploy` step for docs commit `1faec1c` with the same platform-side annotation. This docs commit will trigger another Pages deploy before final handoff.
  - Second follow-up GitHub Pages workflow `28690825020` succeeded for docs commit `d06a6bd`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=d06a6bd-live` and `/bloom-tycoon/assets/tiles/96/bone_white_thorn_star.png?verify=d06a6bd-live`, and the playable contained all Round 7 markers.
  - GitHub Pages Playwright smoke verified fresh Round 7 tease, Round 1 -> Round 7 review progression, Round 7 current `Moonlit Wreath 2` Cursed Thorn copy, Round 7 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-7 main flow, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, or mobile checks. No Vercel or GitHub Pages Playwright console errors or page errors observed during live Round 7 smoke checks.
- Vercel deployment URL/identifier checked: `dpl_7s354Sfv2GHHYZSXhiJuEwvJ5KM7`, `https://bloom-tycoon-6tp02rkj7-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28690825020` succeeded for `d06a6bd`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=d06a6bd-live` returned `200` with all new Round 7 markers.
- Known issues: none found locally for this Round 7 encore Cursed Thorn slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` to trigger the prototype match-shape review. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no likely secrets; it only flagged existing local display variable names `flowerpediaToken` and `chapterToken`, with no credential values. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 8 encore Bloodroot Compact clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 8 encore Bloodroot Compact clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 8 Bloodroot Encore` strip below `Round 7 Thorn Encore` using the existing continuing-round generator via `buildRoundPlan(8)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Bloodroot Compact 2` as the second-pass Bloodroot/Sol Rot compact.
- The Round 8 copy explains higher stakes and the existing Bloodroot Compact reward path, and points payoff back to existing Flowerpedia, Bouquet Streak, Chest Storage, and reward values; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundEightPreview`, `Round 8 Bloodroot Encore`, `Bloodroot Compact 2`, `Round 8 encore Bloodroot Compact payoff`, all `data-round-eight-state` values, and the Round 8 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4218/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round8-local` and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=round8-local`; the playable contained the new Round 8 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 8 `tease`, Round 1 win -> reward -> Round 2, Round 2 fail -> retry, Round 2 restored Cursed Thorn objective, Round 3 completion/payoff, Round 4 completion/payoff, Round 5 completion/payoff, Round 6 completion/payoff, Round 7 completion/payoff, Round 8 current `Bloodroot Compact 2` Bloodroot/Sol Rot higher-stakes copy, Round 8 completion/payoff, Bloodroot Compact in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 8 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_BqusVAJucvVpcXPJQp6GFqr79wB1` at `https://bloom-tycoon-3sfuayaxw-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=6020d77-live` and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=6020d77-live`, and the playable contained all Round 8 markers.
  - Vercel Playwright smoke verified fresh Round 8 tease, Round 1 -> Round 8 review progression, Round 8 current `Bloodroot Compact 2` Bloodroot/Sol Rot copy, Round 8 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28691646667` failed at the final `Deploy` step for code commit `6020d77` after checkout/configure/upload succeeded; the deploy action reported `Deployment failed, try again later.`
  - Follow-up GitHub Pages workflow `28691696153` succeeded for docs retry commit `314b0f5`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=314b0f5-live` and `/bloom-tycoon/assets/tiles/96/bloodroot_ruby_shard.png?verify=314b0f5-live`, and the playable contained all Round 8 markers.
  - GitHub Pages Playwright smoke verified fresh Round 8 tease, Round 1 -> Round 8 review progression, Round 8 current `Bloodroot Compact 2` Bloodroot/Sol Rot copy, Round 8 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-8 main flow, booster checks, Shape Bloom/M/B review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 8 tease, Round 1 -> Round 8 review progression, Round 8 current/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_BqusVAJucvVpcXPJQp6GFqr79wB1`, `https://bloom-tycoon-3sfuayaxw-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28691696153` succeeded for `314b0f5`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=314b0f5-live` returned `200` with all new Round 8 markers.
- Known issues: none found locally for this Round 8 encore Bloodroot Compact slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` to trigger the prototype match-shape review. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no likely secrets; it only flagged existing local display variable names `flowerpediaToken` and `chapterToken`, with no credential values. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 9 encore Saint's Night Ledger clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 9 encore Saint's Night Ledger clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 9 Ledger Encore` strip below `Round 8 Bloodroot Encore` using the existing continuing-round generator via `buildRoundPlan(9)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Saint's Night Ledger 2` as the second-pass Bone Star/Nightshade/Sol Rot ledger.
- The Round 9 copy explains higher stakes and the existing Saint's Night Ledger reward path, and points payoff back to existing Flowerpedia, Bouquet Streak, Chest Storage, and reward values; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundNinePreview`, `Round 9 Ledger Encore`, `Saint's Night Ledger 2`, `Round 9 encore Saint's Night Ledger payoff`, all `data-round-nine-state` values, and the Round 9 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4219/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round9-local` and `/assets/tiles/96/bone_white_thorn_star.png?verify=round9-local`; the playable contained the new Round 9 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 9 `tease`, Round 1 win -> reward -> Round 2, Round 2 fail -> retry, Round 2 restored Cursed Thorn objective, Round 3 completion/payoff, Round 4 completion/payoff, Round 5 completion/payoff, Round 6 completion/payoff, Round 7 completion/payoff, Round 8 completion/payoff, Round 9 current `Saint's Night Ledger 2` Bone Star/Nightshade/Sol Rot higher-stakes copy, Round 9 completion/payoff, Saint's Night Ledger in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 9 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_9EJNrEdvq9ukQmM7s6Yfs5kdBJxB` at `https://bloom-tycoon-4wwzkwero-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=4f10697-live` and `/assets/tiles/96/bone_white_thorn_star.png?verify=4f10697-live`, and the playable contained all Round 9 markers.
  - Vercel Playwright smoke verified fresh Round 9 tease, Round 1 -> Round 9 review progression, Round 9 current `Saint's Night Ledger 2` Bone Star/Nightshade/Sol Rot copy, Round 9 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28692235145` succeeded for code commit `4f10697`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=4f10697-live` and `/bloom-tycoon/assets/tiles/96/bone_white_thorn_star.png?verify=4f10697-live`, and the playable contained all Round 9 markers.
  - GitHub Pages Playwright smoke verified fresh Round 9 tease, Round 1 -> Round 9 review progression, Round 9 current `Saint's Night Ledger 2` Bone Star/Nightshade/Sol Rot copy, Round 9 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-9 main flow, booster checks, Shape Bloom/M/B review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 9 tease, Round 1 -> Round 9 review progression, Round 9 current/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_9EJNrEdvq9ukQmM7s6Yfs5kdBJxB`, `https://bloom-tycoon-4wwzkwero-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28692235145` succeeded for `4f10697`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=4f10697-live` returned `200` with all new Round 9 markers.
- Known issues: none found locally for this Round 9 encore Saint's Night Ledger slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` to trigger the prototype match-shape review. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no likely secrets; it only flagged existing local display variable names `flowerpediaToken` and `chapterToken`, with no credential values. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 10 encore Sub Rosa Grand Bouquet clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 10 encore Sub Rosa Grand Bouquet clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 10 Grand Encore` strip below `Round 9 Ledger Encore` using the existing continuing-round generator via `buildRoundPlan(10)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Sub Rosa Grand Bouquet 2` as the second-pass Thorn Rose/Bloodroot/Sol Rot grand bouquet.
- The Round 10 copy explains higher stakes and the existing Sub Rosa Grand Cache reward path, and points payoff back to existing Flowerpedia, Bouquet Streak, Chest Storage, and reward values; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundTenPreview`, `Round 10 Grand Encore`, `Sub Rosa Grand Bouquet 2`, `Round 10 encore Sub Rosa Grand Bouquet payoff`, all `data-round-ten-state` values, and the Round 10 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4220/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round10-local` and `/assets/tiles/96/crimson_rose_rune.png?verify=round10-local`; the playable contained the new Round 10 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 10 `tease`, Round 1 win -> reward -> Round 2, Round 2 fail -> retry, Round 2 restored Cursed Thorn objective, Round 3 completion/payoff, Round 4 completion/payoff, Round 5 completion/payoff, Round 6 completion/payoff, Round 7 completion/payoff, Round 8 completion/payoff, Round 9 completion/payoff, Round 10 current `Sub Rosa Grand Bouquet 2` Thorn Rose/Bloodroot/Sol Rot higher-stakes copy, Round 10 completion/payoff, Sub Rosa Grand Cache in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 10 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_DUaLTTJPF4UvWGu2PTUQSoiE2cwg` at `https://bloom-tycoon-bv87xe5w1-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=5534268-live` and `/assets/tiles/96/crimson_rose_rune.png?verify=5534268-live`, and the playable contained all Round 10 markers.
  - Vercel Playwright smoke verified fresh Round 10 tease, Round 1 -> Round 10 review progression, Round 10 current `Sub Rosa Grand Bouquet 2` Thorn Rose/Bloodroot/Sol Rot copy, Round 10 completion/payoff, Sub Rosa Grand Cache in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28692911000` succeeded for code commit `5534268`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=5534268-live` and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=5534268-live`, and the playable contained all Round 10 markers.
  - GitHub Pages Playwright smoke verified fresh Round 10 tease, Round 1 -> Round 10 review progression, Round 10 current `Sub Rosa Grand Bouquet 2` Thorn Rose/Bloodroot/Sol Rot copy, Round 10 completion/payoff, Sub Rosa Grand Cache in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-10 main flow, booster checks, Shape Bloom/M/B review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 10 tease, Round 1 -> Round 10 review progression, Round 10 current/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_DUaLTTJPF4UvWGu2PTUQSoiE2cwg`, `https://bloom-tycoon-bv87xe5w1-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28692911000` succeeded for `5534268`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=5534268-live` returned `200` with all new Round 10 markers.
- Known issues: none found locally for this Round 10 encore Sub Rosa Grand Bouquet slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` to trigger the prototype match-shape review. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no likely secrets; it only flagged existing local display variable names `flowerpediaToken` and `chapterToken`, with no credential values. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 11 encore First Bouquet clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 11 `First Bouquet 3` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 11 First Bouquet Encore` strip below `Round 10 Grand Encore` using the existing continuing-round generator via `buildRoundPlan(11)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `First Bouquet 3` as the third-pass Thorn Rose/Bone Star bouquet.
- The Round 11 copy explains higher stakes and the existing First Bouquet Coffer reward path, and points payoff back to existing Flowerpedia, Bouquet Streak, Chest Storage, and reward values; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundElevenPreview`, `Round 11 First Bouquet Encore`, `First Bouquet 3`, `Round 11 encore First Bouquet payoff`, all `data-round-eleven-state` values, and the Round 11 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4231/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round11-local` and `/assets/tiles/96/crimson_rose_rune.png?verify=round11-local`; the playable contained the new Round 11 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 11 `tease`, Round 1 win -> reward -> Round 2, Round 2 fail -> retry, Round 2 restored Cursed Thorn objective, Round 3 completion/payoff, Round 4 completion/payoff, Round 5 completion/payoff, Round 6 completion/payoff, Round 7 completion/payoff, Round 8 completion/payoff, Round 9 completion/payoff, Round 10 completion/payoff, Round 11 current `First Bouquet 3` Thorn Rose/Bone Star higher-stakes copy, Round 11 completion/payoff, First Bouquet Coffer in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 11 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_8CVijf1yUp6XyjfdYzec9fEwG3Sh` at `https://bloom-tycoon-7k0a25vlu-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=c2f6eb1-live` and `/assets/tiles/96/crimson_rose_rune.png?verify=c2f6eb1-live`, and the playable contained all Round 11 markers.
  - Vercel Playwright smoke verified fresh Round 11 tease, Round 1 -> Round 11 review progression, Round 11 current `First Bouquet 3` Thorn Rose/Bone Star copy, Round 11 completion/payoff, First Bouquet Coffer in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28694053024` succeeded for code commit `c2f6eb1`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=c2f6eb1-live` and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=c2f6eb1-live`, and the playable contained all Round 11 markers.
  - GitHub Pages Playwright smoke verified fresh Round 11 tease, Round 1 -> Round 11 review progression, Round 11 current `First Bouquet 3` Thorn Rose/Bone Star copy, Round 11 completion/payoff, First Bouquet Coffer in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-11 main flow, booster checks, Shape Bloom/M/B review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 11 tease, Round 1 -> Round 11 review progression, Round 11 current/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_8CVijf1yUp6XyjfdYzec9fEwG3Sh`, `https://bloom-tycoon-7k0a25vlu-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28694053024` succeeded for `c2f6eb1`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=c2f6eb1-live` returned `200` with all new Round 11 markers.
- Known issues: none found locally for this Round 11 encore First Bouquet slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 22 encore Moonlit Wreath clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 22 `Moonlit Wreath 5` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 22 Moonlit Wreath Encore` strip below `Round 21 First Bouquet Encore` using the existing continuing-round generator via `buildRoundPlan(22)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Moonlit Wreath 5` as the fifth-pass Nightshade + Amber Seed + Thorn Rose + Cursed Thorn wreath.
- The Round 22 copy explains higher stakes, retry restoration, adjacent-match/Pruning Shears Cursed Thorn clearing, and the existing Moonlit Wreath Cache reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundTwentyTwoPreview`, `Round 22 Moonlit Wreath Encore`, `Moonlit Wreath 5`, `Round 22 encore Moonlit Wreath payoff`, all `data-round-twenty-two-state` values, and the Round 22 render/helper functions.
- Verification run so far:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4242/playable/midnight_bloom_prototype.html?verify=round22-local` returned `200 OK`.
  - Local tile asset checks at `http://127.0.0.1:4242/assets/tiles/96/purple_nightshade_bloom.png?verify=round22-local` and `http://127.0.0.1:4242/assets/tiles/96/amber_resin_seed.png?verify=round22-local` returned `200 OK`.
  - Downloaded local HTML contained `roundTwentyTwoPreview`, `Round 22 Moonlit Wreath Encore`, `Moonlit Wreath 5`, `Round 22 encore Moonlit Wreath payoff`, and all `data-round-twenty-two-state` markers.
  - Local Playwright Chromium loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 22 tease copy.
  - Local Playwright completed Round 1, confirmed Flowerpedia unlock/persistence after reload, advanced to Round 2, failed and retried Round 2 with Cursed Thorn copy restored, then completed through Round 12 and verified Round 12 retry restored the Cursed Thorn objective.
  - Local Playwright completed Round 13 through Round 21 via the visible `Complete Bouquet`/`Next Bouquet` hooks, with reward choice/default flow preserved.
  - Local Playwright verified Round 21 current/complete surfaces, Round 22 `next`, Round 22 current copy with `Moonlit Wreath 5`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the Moonlit Wreath Cache reward path, then forced Round 22 `withered` and `complete` states.
  - Local Playwright independently armed/cancelled/used all four boosters on fresh pages, opened/cancelled Sacrifice, opened/closed Chest Storage, clicked `Shape Bloom`, pressed `M` for the match-shape review hook, pressed `B` for Supreme Bloom, pressed `N` for the complete-bouquet review hook, and checked mobile 390x844 with 0 horizontal overflow.
  - Deployed to Vercel production as `dpl_615A6o7tAx1NPE27auFN36Bf6NnM`.
  - Vercel deployment URL: https://bloom-tycoon-a064b747t-xerxes-florals.vercel.app
  - Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel root, `/playable/midnight_bloom_prototype.html?verify=70ed6f7-live`, `/assets/tiles/96/purple_nightshade_bloom.png?verify=70ed6f7-live`, and `/assets/tiles/96/amber_resin_seed.png?verify=70ed6f7-live` returned `200 OK`.
  - Downloaded Vercel HTML contained the Round 22 markers and all `data-round-twenty-two-state` hooks.
  - Vercel Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 22 current, verified the Round 22 Moonlit Wreath 5 copy, forced Round 22 retry/complete states, and checked mobile 390x844 with 0 horizontal overflow.
  - GitHub Pages workflow `28703757462` for `70ed6f7` and `28703837598` for `827c728` uploaded the static artifact but failed in `actions/deploy-pages` with `Deployment failed, try again later.`
  - Updated `.github/workflows/pages.yml` from `actions/deploy-pages@v4` to `actions/deploy-pages@v5`, the Node 24 compatible deploy action, after the runner forced Node 24 and the deploy step failed twice after valid artifact uploads.
  - GitHub Pages workflow `28703891833` completed successfully for `49a0c9c`.
  - GitHub Pages root, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=49a0c9c-pages`, `/bloom-tycoon/assets/tiles/96/purple_nightshade_bloom.png?verify=49a0c9c-pages`, and `/bloom-tycoon/assets/tiles/96/amber_resin_seed.png?verify=49a0c9c-pages` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the Round 22 markers and all `data-round-twenty-two-state` hooks.
  - GitHub Pages Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 22 current, verified the Round 22 Moonlit Wreath 5 copy, forced Round 22 retry/complete states, and checked mobile 390x844 with 0 horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright checks observed 0 console errors and 0 page errors across the Round 1-22 main flow, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, Round 22 retry/complete checks, and mobile checks.
- Vercel deployment URL/identifier checked: `dpl_615A6o7tAx1NPE27auFN36Bf6NnM`, https://bloom-tycoon-a064b747t-xerxes-florals.vercel.app, canonical alias https://bloom-tycoon.vercel.app.
- GitHub Pages preview status: workflow `28703891833` succeeded for `49a0c9c`; Pages is serving the new Round 22 HTML.
- Known issues: none found locally in this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings.

## 2026-07-04 Codex Round 21 encore First Bouquet clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 21 `First Bouquet 5` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 21 First Bouquet Encore` strip below `Round 20 Sub Rosa Grand Bouquet Encore` using the existing continuing-round generator via `buildRoundPlan(21)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `First Bouquet 5` as the fifth-pass Thorn Rose + Bone Star starter bouquet.
- The Round 21 copy explains higher stakes, retry restoration, and the existing First Bouquet Coffer reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundTwentyOnePreview`, `Round 21 First Bouquet Encore`, `First Bouquet 5`, `Round 21 encore First Bouquet payoff`, all `data-round-twenty-one-state` values, and the Round 21 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4241/playable/midnight_bloom_prototype.html?verify=round21-local` returned `200 OK`.
  - Local tile asset check at `http://127.0.0.1:4241/assets/tiles/96/bone_white_thorn_star.png?verify=round21-local` returned `200 OK`.
  - Downloaded local HTML contained `roundTwentyOnePreview`, `Round 21 First Bouquet Encore`, `First Bouquet 5`, `Round 21 encore First Bouquet payoff`, and all `data-round-twenty-one-state` markers.
  - Local Playwright Chromium loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 21 tease copy.
  - Local Playwright failed and retried Round 1, completed Round 1, advanced to Round 2, failed and retried Round 2 with Cursed Thorn copy restored, completed Round 2, reloaded, and confirmed completed Round 2 plus Chapter 1 progress persisted.
  - Local Playwright completed Round 3 through Round 20 via the visible `Complete Bouquet`/`Next Bouquet` hooks, with reward choice/default flow preserved.
  - Local Playwright forced and retried Rounds 12, 13, 14, 15, 16, 17, 18, 19, 20, and 21; each retry restored the round board/moves/objectives and kept 64 tiles.
  - Local Playwright verified Round 21 current copy contains `First Bouquet 5`, Thorn Rose, Bone Star, higher stakes, and the First Bouquet Coffer reward path; Round 21 then showed `withered` and `complete` preview states.
  - Local Playwright independently armed/cancelled/used all four boosters on fresh pages, opened/cancelled Sacrifice, opened/closed Chest Storage, clicked `Shape Bloom`, pressed `M` through Cross/L/T rewards, pressed `B` for Supreme Bloom, pressed `N` for the complete-bouquet review hook, and checked mobile 390x844 with 0 horizontal overflow.
  - Deployed to Vercel production as `dpl_amiingMka4E7h7ZnmBuUn2z96VuE`.
  - Vercel deployment URL: https://bloom-tycoon-1o24od6xk-xerxes-florals.vercel.app
  - Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel root, `/playable/midnight_bloom_prototype.html?verify=a631271-live`, and `/assets/tiles/96/bone_white_thorn_star.png?verify=a631271-live` returned `200 OK`.
  - Downloaded Vercel HTML contained the Round 21 markers and all `data-round-twenty-one-state` hooks.
  - Vercel Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 21 current, verified the Round 21 First Bouquet 5 copy, forced Round 21 retry/complete states, and checked mobile 390x844 with 0 horizontal overflow.
  - GitHub Pages workflow `28702890340` for `a631271` completed successfully.
  - GitHub Pages root, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=a631271-pages`, and `/bloom-tycoon/assets/tiles/96/bone_white_thorn_star.png?verify=a631271-pages` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the Round 21 markers and all `data-round-twenty-one-state` hooks.
  - GitHub Pages Playwright smoke loaded 64 tiles and 0 broken images, clicked through Round 21 current, verified the Round 21 First Bouquet 5 copy, completed Round 21, and checked mobile 390x844 with 0 horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright checks observed 0 console warnings/errors and 0 page errors.
- Vercel deployment URL/identifier checked: `dpl_amiingMka4E7h7ZnmBuUn2z96VuE`, https://bloom-tycoon-1o24od6xk-xerxes-florals.vercel.app, canonical alias https://bloom-tycoon.vercel.app.
- GitHub Pages preview status: workflow `28702890340` completed successfully for `a631271`; Pages is serving the new Round 21 HTML.
- Known issues: none found locally in this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings.

## 2026-07-04 Codex Round 20 encore Sub Rosa Grand Bouquet clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 20 `Sub Rosa Grand Bouquet 4` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 20 Sub Rosa Grand Bouquet Encore` strip below `Round 19 Saint's Night Ledger Encore` using the existing continuing-round generator via `buildRoundPlan(20)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Sub Rosa Grand Bouquet 4` as the fourth-pass Thorn Rose + Bloodroot + Sol Rot grand bouquet.
- The Round 20 copy explains higher stakes, retry restoration, and the existing Sub Rosa Grand Cache reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundTwentyPreview`, `Round 20 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 4`, `Round 20 encore Sub Rosa Grand Bouquet payoff`, all `data-round-twenty-state` values, and the Round 20 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4240/playable/midnight_bloom_prototype.html?verify=round20-local` returned `200 OK`.
  - Local tile asset check at `http://127.0.0.1:4240/assets/tiles/96/crimson_rose_rune.png?verify=round20-local` returned `200 OK`.
  - Downloaded local HTML contained `roundTwentyPreview`, `Round 20 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 4`, `Round 20 encore Sub Rosa Grand Bouquet payoff`, and all `data-round-twenty-state` markers.
  - Local Playwright Chromium loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 20 tease copy.
  - Local Playwright failed and retried Round 1, completed Round 1, advanced to Round 2, failed and retried Round 2 with Cursed Thorn copy restored, completed Round 2, reloaded, and confirmed completed Round 2 plus Chapter 1 progress persisted.
  - Local Playwright completed Round 3 through Round 19 via the visible `Complete Bouquet`/`Next Bouquet` hooks, with reward choice/default flow preserved.
  - Local Playwright forced and retried Rounds 12, 13, 14, 15, 16, 17, 18, 19, and 20; each retry restored the round board/moves/objectives and kept 64 tiles.
  - Local Playwright verified Round 20 current copy contains `Sub Rosa Grand Bouquet 4`, Thorn Rose, Bloodroot, Sol Rot, higher stakes, and the Sub Rosa Grand Cache reward path; Round 20 then showed `withered` and `complete` preview states.
  - Local Playwright armed/cancelled/used all four boosters, opened/cancelled Sacrifice, opened/closed Chest Storage, clicked `Shape Bloom`, pressed `M` through Cross/L/T rewards, pressed `B` for Supreme Bloom, pressed `N` for the complete-bouquet review hook, and checked mobile 390x844 with 0 horizontal overflow.
  - Deployed to Vercel production as `dpl_3SyWBWiA9DXxurCqTcrP7LtggEg9`.
  - Vercel deployment URL: https://bloom-tycoon-gtnrrfhl7-xerxes-florals.vercel.app
  - Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel root, `/playable/midnight_bloom_prototype.html?verify=b5929c9-live`, and `/assets/tiles/96/crimson_rose_rune.png?verify=b5929c9-live` returned `200 OK`.
  - Downloaded Vercel HTML contained the Round 20 markers and all `data-round-twenty-state` hooks.
  - Vercel Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 20 current, verified the Round 20 Sub Rosa Grand Bouquet 4 copy, forced Round 20 retry/complete states, and checked mobile 390x844 with 0 horizontal overflow.
  - GitHub Pages workflow `28702293433` for `b5929c9` completed successfully.
  - GitHub Pages root, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=b5929c9-pages`, and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=b5929c9-pages` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the Round 20 markers and all `data-round-twenty-state` hooks.
  - GitHub Pages Playwright smoke loaded 64 tiles and 0 broken images, clicked through Round 20 current, verified the Round 20 Sub Rosa Grand Bouquet 4 copy, completed Round 20, and checked mobile 390x844 with 0 horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright checks observed 0 console warnings/errors and 0 page errors.
- Vercel deployment URL/identifier checked: `dpl_3SyWBWiA9DXxurCqTcrP7LtggEg9`, https://bloom-tycoon-gtnrrfhl7-xerxes-florals.vercel.app, canonical alias https://bloom-tycoon.vercel.app.
- GitHub Pages preview status: workflow `28702293433` completed successfully for `b5929c9`; Pages is serving the new Round 20 HTML.
- Known issues: none found locally in this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings.

## 2026-07-04 Codex Round 19 encore Saint's Night Ledger clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 19 `Saint's Night Ledger 4` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 19 Saint's Night Ledger Encore` strip below `Round 18 Bloodroot Compact Encore` using the existing continuing-round generator via `buildRoundPlan(19)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Saint's Night Ledger 4` as the fourth-pass Bone Star + Nightshade + Sol Rot ledger.
- The Round 19 copy explains higher stakes, retry restoration, and the existing Saint's Night Ledger reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundNineteenPreview`, `Round 19 Saint's Night Ledger Encore`, `Saint's Night Ledger 4`, `Round 19 encore Saint's Night Ledger payoff`, all `data-round-nineteen-state` values, and the Round 19 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4239/playable/midnight_bloom_prototype.html?verify=round19-local` returned `200 OK`.
  - Local tile asset check at `http://127.0.0.1:4239/assets/tiles/96/bone_white_thorn_star.png?verify=round19-local` returned `200 OK`.
  - Downloaded local HTML contained `roundNineteenPreview`, `Round 19 Saint's Night Ledger Encore`, `Saint's Night Ledger 4`, `Round 19 encore Saint's Night Ledger payoff`, and all `data-round-nineteen-state` markers.
  - Local Playwright Chromium loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 19 tease copy.
  - Local Playwright completed Round 1 through Round 19 via the visible `Complete Bouquet`/`Next Bouquet` hooks, with reward choice/default flow preserved.
  - Local Playwright forced and retried Round 2 plus Rounds 12, 13, 14, 15, 16, 17, 18, and 19; each retry restored the round board/moves/objectives and kept 64 tiles.
  - Local Playwright verified Round 19 current copy contains `Saint's Night Ledger 4`, Bone Star, Nightshade, Sol Rot, higher stakes, and the Saint's Night Ledger reward path; Round 19 then showed `withered` and `complete` preview states.
  - Local Playwright armed/cancelled/used all four boosters, opened/cancelled Sacrifice, opened/closed Chest Storage, clicked `Shape Bloom` through Cross/L/T rewards, pressed `B` for Supreme Bloom, and checked mobile 390x844 with 0 horizontal overflow.
  - Deployed to Vercel production as `dpl_J717pHJv4FTqiCPPQVLff5wNJGwU`.
  - Vercel deployment URL: https://bloom-tycoon-g4wg30w2h-xerxes-florals.vercel.app
  - Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel root, `/playable/midnight_bloom_prototype.html?verify=75a4136-live`, and `/assets/tiles/96/bone_white_thorn_star.png?verify=75a4136-live` returned `200 OK`.
  - Downloaded Vercel HTML contained the Round 19 markers and all `data-round-nineteen-state` hooks.
  - Vercel Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 19 current, verified the Round 19 Saint's Night Ledger 4 copy, and checked mobile 390x844 with 0 horizontal overflow.
  - GitHub Pages workflow `28700975846` for `75a4136` completed successfully.
  - GitHub Pages root, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=75a4136-pages`, and `/bloom-tycoon/assets/tiles/96/bone_white_thorn_star.png?verify=75a4136-pages` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the Round 19 markers and all `data-round-nineteen-state` hooks.
  - GitHub Pages Playwright smoke loaded 64 tiles and 0 broken images, clicked through Round 19 current, verified the Round 19 Saint's Night Ledger 4 copy, and checked mobile 390x844 with 0 horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright checks observed 0 console warnings/errors and 0 page errors.
- Vercel deployment URL/identifier checked: `dpl_J717pHJv4FTqiCPPQVLff5wNJGwU`, https://bloom-tycoon-g4wg30w2h-xerxes-florals.vercel.app, canonical alias https://bloom-tycoon.vercel.app.
- GitHub Pages preview status: workflow `28700975846` completed successfully for `75a4136`; Pages is serving the new Round 19 HTML.
- Known issues: none found in this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings.

## 2026-07-04 Codex Round 18 encore Bloodroot Compact clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 18 `Bloodroot Compact 4` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 18 Bloodroot Compact Encore` strip below `Round 17 Moonlit Wreath Encore` using the existing continuing-round generator via `buildRoundPlan(18)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Bloodroot Compact 4` as the fourth-pass Bloodroot + Sol Rot compact.
- The Round 18 copy explains higher stakes, retry restoration, and the existing Bloodroot Compact reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundEighteenPreview`, `Round 18 Bloodroot Compact Encore`, `Bloodroot Compact 4`, `Round 18 encore Bloodroot Compact payoff`, all `data-round-eighteen-state` values, and the Round 18 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4238/playable/midnight_bloom_prototype.html?verify=round18-local` returned `200 OK`.
  - Local tile asset check at `http://127.0.0.1:4238/assets/tiles/96/bloodroot_ruby_shard.png?verify=round18-local` returned `200 OK`.
  - Downloaded local HTML contained `roundEighteenPreview`, `Round 18 Bloodroot Compact Encore`, `Bloodroot Compact 4`, `Round 18 encore Bloodroot Compact payoff`, and all `data-round-eighteen-state` markers.
  - Local Playwright Chromium loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 18 tease copy.
  - Local Playwright completed Round 1 through Round 18 via the visible `Complete Bouquet`/`Next Bouquet` hooks, with reward choice/default flow preserved.
  - Local Playwright forced and retried Round 2 plus Rounds 12, 13, 14, 15, 16, 17, and 18; each retry restored the round board/moves/objectives and kept 64 tiles.
  - Local Playwright verified Round 18 current copy contains `Bloodroot Compact 4`, Bloodroot, Sol Rot, higher stakes, and the Bloodroot Compact reward path; Round 18 then showed `withered` and `complete` preview states.
  - Local Playwright armed/cancelled/used all four boosters, opened/cancelled Sacrifice, opened/closed Chest Storage, clicked `Shape Bloom` through Cross/L/T rewards, pressed `B` for Supreme Bloom, and checked mobile 390x844 with 0 horizontal overflow.
  - Deployed to Vercel production as `dpl_E4WQzjJUBMXsVnqN9KGhih1hiMht`.
  - Vercel deployment URL: https://bloom-tycoon-58024jq4q-xerxes-florals.vercel.app
  - Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel root, `/playable/midnight_bloom_prototype.html?verify=d39e677-live`, and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=d39e677-live` returned `200 OK`.
  - Downloaded Vercel HTML contained the Round 18 markers and all `data-round-eighteen-state` hooks.
  - Vercel Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 18 current, verified the Round 18 Bloodroot Compact 4 copy, and checked mobile 390x844 with 0 horizontal overflow.
  - GitHub Pages workflow `28700272699` for `d39e677` completed successfully.
  - GitHub Pages root, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=d39e677-pages`, and `/bloom-tycoon/assets/tiles/96/bloodroot_ruby_shard.png?verify=d39e677-pages` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the Round 18 markers and all `data-round-eighteen-state` hooks.
  - GitHub Pages Playwright smoke loaded 64 tiles and 0 broken images, clicked through Round 18 current, verified the Round 18 Bloodroot Compact 4 copy, and checked mobile 390x844 with 0 horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright checks observed 0 console warnings/errors and 0 page errors.
- Vercel deployment URL/identifier checked: `dpl_E4WQzjJUBMXsVnqN9KGhih1hiMht`, https://bloom-tycoon-58024jq4q-xerxes-florals.vercel.app, canonical alias https://bloom-tycoon.vercel.app.
- GitHub Pages preview status: workflow `28700272699` completed successfully for `d39e677`; Pages is serving the new Round 18 HTML.
- Known issues: none found in this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings.

## 2026-07-04 Codex Round 17 encore Moonlit Wreath clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 17 `Moonlit Wreath 4` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 17 Moonlit Wreath Encore` strip below `Round 16 First Bouquet Encore` using the existing continuing-round generator via `buildRoundPlan(17)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Moonlit Wreath 4` as the fourth-pass Nightshade + Amber Seed + Thorn Rose + Cursed Thorn wreath.
- The Round 17 copy explains higher stakes, retry restoration, adjacent-match/Pruning Shears Cursed Thorn clearing, and the existing Moonlit Wreath Cache reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundSeventeenPreview`, `Round 17 Moonlit Wreath Encore`, `Moonlit Wreath 4`, `Round 17 encore Moonlit Wreath payoff`, all `data-round-seventeen-state` values, and the Round 17 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4237/playable/midnight_bloom_prototype.html?verify=round17-resume` returned `200 OK`.
  - Local tile asset check at `http://127.0.0.1:4237/assets/tiles/96/crimson_rose_rune.png?verify=round17-resume` returned `200 OK`.
  - Downloaded local HTML contained `roundSeventeenPreview`, `Round 17 Moonlit Wreath Encore`, `Moonlit Wreath 4`, `Round 17 encore Moonlit Wreath payoff`, and all `data-round-seventeen-state` markers.
  - Local Playwright Chromium loaded fresh Round 1 with 64 tiles, 0 broken images, and visible Round 17 tease copy.
  - Local Playwright completed Round 1 through Round 17 via the visible `Complete Bouquet`/`Next Bouquet` hooks, with reward choice/default flow preserved.
  - Local Playwright forced and retried Round 2 plus Rounds 12, 13, 14, 15, 16, and 17; each retry restored the round board/moves/objectives and kept 64 tiles.
  - Local Playwright verified Round 17 current copy contains `Moonlit Wreath 4`, Nightshade, Amber Seed, Thorn Rose, Cursed Thorn, higher stakes, and the Moonlit Wreath Cache reward path; Round 17 then showed `withered` and `complete` preview states.
  - Local Playwright armed/cancelled/used all four boosters, opened/cancelled Sacrifice, opened/closed Chest Storage, clicked `Shape Bloom` through Cross/L/T rewards, pressed `B` for Supreme Bloom, and checked mobile 390x844 with 0 horizontal overflow.
  - Deployed to Vercel production as `dpl_6zHGCCxR343KnpQLyPJ7odC4M7ao`.
  - Vercel deployment URL: https://bloom-tycoon-74gtorfyc-xerxes-florals.vercel.app
  - Re-pointed `https://bloom-tycoon.vercel.app` to the new deployment.
  - Vercel root, `/playable/midnight_bloom_prototype.html?verify=cdd6e92-live`, and `/assets/tiles/96/crimson_rose_rune.png?verify=cdd6e92-live` returned `200 OK`.
  - Downloaded Vercel HTML contained the Round 17 markers and all `data-round-seventeen-state` hooks.
  - Vercel Playwright smoke loaded 64 tiles and 0 broken images, clicked `Complete Bouquet`/`Next Bouquet` through Round 17 current, verified the Round 17 Moonlit Wreath 4 copy, and checked mobile 390x844 with 0 horizontal overflow.
  - GitHub Pages workflow `28699690462` for `cdd6e92` completed successfully.
  - GitHub Pages root, `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=cdd6e92-pages`, and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=cdd6e92-pages` returned `200 OK`.
  - Downloaded GitHub Pages HTML contained the Round 17 markers and all `data-round-seventeen-state` hooks.
  - GitHub Pages Playwright smoke loaded 64 tiles and 0 broken images, clicked through Round 17 current, verified the Round 17 Moonlit Wreath 4 copy, and checked mobile 390x844 with 0 horizontal overflow.
- Browser console/runtime status: local, Vercel, and GitHub Pages Playwright checks observed 0 console warnings/errors and 0 page errors.
- Vercel deployment URL/identifier checked: `dpl_6zHGCCxR343KnpQLyPJ7odC4M7ao`, https://bloom-tycoon-74gtorfyc-xerxes-florals.vercel.app, canonical alias https://bloom-tycoon.vercel.app.
- GitHub Pages preview status: workflow `28699690462` completed successfully for `cdd6e92`; Pages is serving the new Round 17 HTML.
- Known issues: none found in this pass.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings.

## 2026-07-04 Codex Round 16 encore First Bouquet clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 16 `First Bouquet 4` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 16 First Bouquet Encore` strip below `Round 15 Sub Rosa Grand Bouquet Encore` using the existing continuing-round generator via `buildRoundPlan(16)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `First Bouquet 4` as the fourth-pass Thorn Rose/Bone Star bouquet.
- The Round 16 copy explains higher stakes, retry restoration, and the existing First Bouquet Coffer reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundSixteenPreview`, `Round 16 First Bouquet Encore`, `First Bouquet 4`, `Round 16 encore First Bouquet payoff`, all `data-round-sixteen-state` values, and the Round 16 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4236/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round16-local` and `/assets/tiles/96/crimson_rose_rune.png?verify=round16-local`; the playable contained the new Round 16 markers.
  - Local Playwright main flow verified fresh Round 16 tease, Round 1 fail -> retry, Round 1 win -> explicit Greenhouse reward -> Round 2, Round 2 fail -> retry with Cursed Thorn objective/tiles restored, Round 2 completion -> default Greenhouse reward path, Round 3 through Round 15 completion/payoff surfaces, Round 12 fail -> retry restoration, Round 13 fail -> retry restoration, Round 14 fail -> retry restoration, Round 15 fail -> retry restoration, Round 16 current `First Bouquet 4` Thorn Rose/Bone Star higher-stakes copy, Round 16 wither -> retry restoration, Round 16 completion/payoff, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from a fresh page, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via focused `B`, `N` Complete Bouquet hook, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 16 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_5PrBCethgJJPrgMuBzBLU5wk1pBM` at `https://bloom-tycoon-25ku3mpa2-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=f5a4d27-live` and `/assets/tiles/96/crimson_rose_rune.png?verify=f5a4d27-live`, and the playable contained all Round 16 markers.
  - GitHub Pages workflow `28698481638` failed in `actions/deploy-pages` after uploading a valid artifact with GitHub's transient `Deployment failed, try again later.` message; no repo artifact error was found.
  - Pushed no-content retry commit `65f34ff` (`ci: retry pages deployment`) to rerun Pages without changing gameplay files.
  - GitHub Pages retry workflow `28698568006` succeeded for `65f34ff`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=65f34ff-live` and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=65f34ff-live`, and the playable contained all Round 16 markers.
  - Vercel and GitHub Pages Playwright smoke verified fresh Round 16 tease, Round 1 -> Round 16 review progression, Round 16 current `First Bouquet 4` Thorn Rose/Bone Star copy, Round 16 wither -> retry restoration, Round 16 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-16 main flow, Round 1/2/12/13/14/15/16 retry checks, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 16 tease, Round 1 -> Round 16 review progression, Round 16 current/withered/retry/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_5PrBCethgJJPrgMuBzBLU5wk1pBM`, `https://bloom-tycoon-25ku3mpa2-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28698568006` succeeded for `65f34ff`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=65f34ff-live` returned `200` with all new Round 16 markers.
- Known issues: none found locally or live for this Round 16 encore First Bouquet slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 15 encore Sub Rosa Grand Bouquet clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 15 `Sub Rosa Grand Bouquet 3` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 15 Sub Rosa Grand Bouquet Encore` strip below `Round 14 Saint's Night Ledger Encore` using the existing continuing-round generator via `buildRoundPlan(15)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Sub Rosa Grand Bouquet 3` as the third-pass Thorn Rose + Bloodroot + Sol Rot grand bouquet.
- The Round 15 copy explains higher stakes, retry restoration, and the existing Sub Rosa Grand Cache reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundFifteenPreview`, `Round 15 Sub Rosa Grand Bouquet Encore`, `Sub Rosa Grand Bouquet 3`, `Round 15 encore Sub Rosa Grand Bouquet payoff`, all `data-round-fifteen-state` values, and the Round 15 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4235/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round15-local` and `/assets/tiles/96/crimson_rose_rune.png?verify=round15-local`; the playable contained the new Round 15 markers.
  - Local Playwright main flow verified fresh Round 15 tease, Round 1 fail -> retry, Round 1 win -> reward -> Round 2, Round 2 fail -> retry with Cursed Thorn objective/tiles restored, Round 3 through Round 14 completion/payoff surfaces, Round 12 fail -> retry restoration, Round 13 fail -> retry restoration, Round 14 fail -> retry restoration, Round 15 current `Sub Rosa Grand Bouquet 3` Thorn Rose/Bloodroot/Sol Rot higher-stakes copy, Round 15 wither -> retry restoration, Round 15 completion/payoff, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from fresh pages, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, `N` Complete Bouquet hook, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 15 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_Gp9JsYxER27ga73KWxhvSP1SYYHS` at `https://bloom-tycoon-4y1tdi9n6-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=95af871-live` and `/assets/tiles/96/crimson_rose_rune.png?verify=95af871-live`, and the playable contained all Round 15 markers.
  - Vercel Playwright smoke verified fresh Round 15 tease, Round 1 -> Round 15 review progression, Round 15 current `Sub Rosa Grand Bouquet 3` Thorn Rose/Bloodroot/Sol Rot copy, Round 15 wither -> retry restoration, Round 15 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28696983720` succeeded for code commit `95af871`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=95af871-live` and `/bloom-tycoon/assets/tiles/96/crimson_rose_rune.png?verify=95af871-live`, and the playable contained all Round 15 markers.
  - GitHub Pages Playwright smoke verified fresh Round 15 tease, Round 1 -> Round 15 review progression, Round 15 current `Sub Rosa Grand Bouquet 3` Thorn Rose/Bloodroot/Sol Rot copy, Round 15 wither -> retry restoration, Round 15 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-15 main flow, Round 1/2/12/13/14/15 retry checks, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 15 tease, Round 1 -> Round 15 review progression, Round 15 current/withered/retry/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_Gp9JsYxER27ga73KWxhvSP1SYYHS`, `https://bloom-tycoon-4y1tdi9n6-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28696983720` succeeded for `95af871`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=95af871-live` returned `200` with all new Round 15 markers.
- Known issues: none found locally or live for this Round 15 encore Sub Rosa Grand Bouquet slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 14 encore Saint's Night Ledger clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 14 `Saint's Night Ledger 3` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 14 Saint's Night Ledger Encore` strip below `Round 13 Bloodroot Compact Encore` using the existing continuing-round generator via `buildRoundPlan(14)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Saint's Night Ledger 3` as the third-pass Bone Star + Nightshade + Sol Rot ledger.
- The Round 14 copy explains higher stakes, retry restoration, and the existing Saint's Night Ledger reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundFourteenPreview`, `Round 14 Saint's Night Ledger Encore`, `Saint's Night Ledger 3`, `Round 14 encore Saint's Night Ledger payoff`, all `data-round-fourteen-state` values, and the Round 14 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4234/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round14-local` and `/assets/tiles/96/bone_white_thorn_star.png?verify=round14-local`; the playable contained the new Round 14 markers.
  - Local Playwright main flow verified fresh Round 14 tease, Round 1 fail -> retry, Round 1 win -> reward -> Round 2, Round 2 fail -> retry with Cursed Thorn objective/tiles restored, Round 3 through Round 13 completion/payoff surfaces, Round 12 fail -> retry restoration, Round 13 fail -> retry restoration, Round 14 current `Saint's Night Ledger 3` Bone Star/Nightshade/Sol Rot higher-stakes copy, Round 14 wither -> retry restoration, Round 14 completion/payoff, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from fresh pages, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, `N` Complete Bouquet hook, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 14 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_2xmerPHJLdcnwBaQz4qMD8hv7xvu` at `https://bloom-tycoon-e6tg23k1r-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=b5d3bd7-live` and `/assets/tiles/96/bone_white_thorn_star.png?verify=b5d3bd7-live`, and the playable contained all Round 14 markers.
  - Vercel Playwright smoke verified fresh Round 14 tease, Round 1 -> Round 14 review progression, Round 14 current `Saint's Night Ledger 3` Bone Star/Nightshade/Sol Rot copy, Round 14 wither -> retry restoration, Round 14 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28696404663` succeeded for code commit `b5d3bd7`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=b5d3bd7-live` and `/bloom-tycoon/assets/tiles/96/bone_white_thorn_star.png?verify=b5d3bd7-live`, and the playable contained all Round 14 markers.
  - GitHub Pages Playwright smoke verified fresh Round 14 tease, Round 1 -> Round 14 review progression, Round 14 current `Saint's Night Ledger 3` Bone Star/Nightshade/Sol Rot copy, Round 14 wither -> retry restoration, Round 14 completion/payoff, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-14 main flow, Round 1/2/12/13/14 retry checks, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 14 tease, Round 1 -> Round 14 review progression, Round 14 current/withered/retry/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_2xmerPHJLdcnwBaQz4qMD8hv7xvu`, `https://bloom-tycoon-e6tg23k1r-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28696404663` succeeded for `b5d3bd7`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=b5d3bd7-live` returned `200` with all new Round 14 markers.
- Known issues: none found locally or live for this Round 14 encore Saint's Night Ledger slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 13 encore Bloodroot Compact clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 13 `Bloodroot Compact 3` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 13 Bloodroot Compact Encore` strip below `Round 12 Moonlit Wreath Encore` using the existing continuing-round generator via `buildRoundPlan(13)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Bloodroot Compact 3` as the third-pass Bloodroot + Sol Rot compact.
- The Round 13 copy explains higher stakes, retry restoration, and the existing Bloodroot Compact reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundThirteenPreview`, `Round 13 Bloodroot Compact Encore`, `Bloodroot Compact 3`, `Round 13 encore Bloodroot Compact payoff`, all `data-round-thirteen-state` values, and the Round 13 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4233/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round13-local` and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=round13-local`; the playable contained the new Round 13 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 13 `tease`, Round 1 win -> reward -> Round 2, Round 2 fail -> retry, Round 2 restored Cursed Thorn objective, Round 3 completion/payoff, Round 4 completion/payoff, Round 5 completion/payoff, Round 6 completion/payoff, Round 7 completion/payoff, Round 8 completion/payoff, Round 9 completion/payoff, Round 10 completion/payoff, Round 11 completion/payoff, Round 12 current and fail -> retry restoration, Round 12 completion/payoff, Round 13 current `Bloodroot Compact 3` Bloodroot/Sol Rot higher-stakes copy, Round 13 fail -> retry restoration, Round 13 completion/payoff, Bloodroot Compact in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from fresh pages, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, `N` Complete Bouquet hook, Chest modal, Sacrifice arm/cancel, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_HH5GcNAhm4X1jfDpwp2nVWvruxH7` at `https://bloom-tycoon-adn6nmq87-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=328314c-live` and `/assets/tiles/96/bloodroot_ruby_shard.png?verify=328314c-live`, and the playable contained all Round 13 markers.
  - Vercel Playwright smoke verified fresh Round 13 tease, Round 1 -> Round 13 review progression, Round 13 current `Bloodroot Compact 3` Bloodroot/Sol Rot copy, Round 13 wither -> retry restoring objective copy and 64 tiles, Round 13 completion/payoff, Bloodroot Compact in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28695640170` succeeded for code commit `328314c`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=328314c-live` and `/bloom-tycoon/assets/tiles/96/bloodroot_ruby_shard.png?verify=328314c-live`, and the playable contained all Round 13 markers.
  - GitHub Pages Playwright smoke verified fresh Round 13 tease, Round 1 -> Round 13 review progression, Round 13 current `Bloodroot Compact 3` Bloodroot/Sol Rot copy, Round 13 wither -> retry restoring objective copy and 64 tiles, Round 13 completion/payoff, Bloodroot Compact in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-13 main flow, Round 12 and Round 13 retry checks, booster checks, Shape Bloom/M/B/N review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 13 tease, Round 1 -> Round 13 review progression, Round 13 current/withered/retry/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_HH5GcNAhm4X1jfDpwp2nVWvruxH7`, `https://bloom-tycoon-adn6nmq87-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28695640170` succeeded for `328314c`, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=328314c-live` returned `200` with all new Round 13 markers.
- Known issues: none found locally for this Round 13 encore Bloodroot Compact slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings. No secrets, trackers, backend, SDKs, or new permissions were added in code.

## 2026-07-04 Codex Round 12 encore Moonlit Wreath clarity/payoff

- Read `docs/hermes_audit_next_tasks.md` before coding; Hermes requested a narrow Round 12 `Moonlit Wreath 3` clarity/payoff pass.
- Files changed:
  - `playable/midnight_bloom_prototype.html`
  - `scripts/verify_html_match_shapes.py`
  - `docs/codex_build_notes.md`
- Added a compact `Round 12 Moonlit Wreath Encore` strip below `Round 11 First Bouquet Encore` using the existing continuing-round generator via `buildRoundPlan(12)`.
- The strip has `tease`, `next`, `current`, `withered`, and `complete` states, with copy for `Moonlit Wreath 3` as the third-pass Nightshade/Amber Seed/Thorn Rose + Cursed Thorn bouquet.
- The Round 12 copy explains higher stakes, the adjacent-match Cursed Thorn rule, retry restoration, and the existing Moonlit Wreath Cache reward path; no new progression framework was added.
- No new account system, backend, analytics, monetization, SDK, tracker, asset, secret, or permission was added.
- Added static verifier markers for `roundTwelvePreview`, `Round 12 Moonlit Wreath Encore`, `Moonlit Wreath 3`, `Round 12 encore Moonlit Wreath payoff`, all `data-round-twelve-state` values, and the Round 12 render/helper functions.
- Verification run:
  - `git fetch origin main`
  - `git pull --ff-only origin main`
  - Read `docs/hermes_audit_next_tasks.md`.
  - `python3 scripts/verify_project.py`
  - `git diff --check`
  - Local static preview at `http://127.0.0.1:4232/playable/midnight_bloom_prototype.html`; standalone `agent-browser` was unavailable, so bundled Playwright was used.
  - Local direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=round12-local` and `/assets/tiles/96/purple_nightshade_bloom.png?verify=round12-local`; the playable contained the new Round 12 markers.
  - Local Playwright main flow verified fresh Round 1 path, Round 12 `tease`, Round 1 win -> reward -> Round 2, Round 2 fail -> retry, Round 2 restored Cursed Thorn objective, Round 3 completion/payoff, Round 4 completion/payoff, Round 5 completion/payoff, Round 6 completion/payoff, Round 7 completion/payoff, Round 8 completion/payoff, Round 9 completion/payoff, Round 10 completion/payoff, Round 11 completion/payoff, Round 12 current `Moonlit Wreath 3` Nightshade/Amber Seed/Thorn Rose/Cursed Thorn higher-stakes copy, Round 12 wither -> retry restoring Round 12 Cursed Thorn objective and moves, Round 12 completion/payoff, Moonlit Wreath Cache in Chest Storage, 64 tiles, no broken images, and no console/page errors.
  - Local Playwright preservation checks verified each booster (`Pruning Shears`, `Moonwater Flask`, `Black Candle`, `Grave Soil`) arms, cancels, uses from fresh pages, and preserves 64 tiles.
  - Local Playwright preservation checks verified Shape Bloom review, `M` L/T/cross review hook, Supreme Bloom via `B`, Chest modal, Sacrifice arm/cancel, mobile 390x860 Round 12 preview, no horizontal overflow, no broken images, and no console/page errors.
  - Vercel production deploy completed as `dpl_8bUEGUEtjgGFAxE7RxmhUhp9ckDv` at `https://bloom-tycoon-g5xt845s4-xerxes-florals.vercel.app`.
  - Explicitly pointed `https://bloom-tycoon.vercel.app` to that deployment.
  - Vercel direct checks returned `200` for `/playable/midnight_bloom_prototype.html?verify=22fec47-live` and `/assets/tiles/96/purple_nightshade_bloom.png?verify=22fec47-live`, and the playable contained all Round 12 markers.
  - Vercel Playwright smoke verified fresh Round 12 tease, Round 1 -> Round 12 review progression, Round 12 current `Moonlit Wreath 3` Nightshade/Amber Seed/Thorn Rose/Cursed Thorn copy, Round 12 wither -> retry restoring Cursed Thorn blockers and objective copy, Round 12 completion/payoff, Moonlit Wreath Cache in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
  - GitHub Pages workflow `28694719614` initially returned a transient Pages deployment failure, then succeeded on rerun for code commit `22fec47`.
  - GitHub Pages direct checks returned `200` for `/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=22fec47-live` and `/bloom-tycoon/assets/tiles/96/purple_nightshade_bloom.png?verify=22fec47-live`, and the playable contained all Round 12 markers.
  - GitHub Pages Playwright smoke verified fresh Round 12 tease, Round 1 -> Round 12 review progression, Round 12 current `Moonlit Wreath 3` Nightshade/Amber Seed/Thorn Rose/Cursed Thorn copy, Round 12 wither -> retry restoring Cursed Thorn blockers and objective copy, Round 12 completion/payoff, Moonlit Wreath Cache in Chest Storage, mobile 390px layout, no broken images, and no console/page errors.
- Browser console/runtime status: no local Playwright console errors or page errors observed during the Round 1-12 main flow, Round 12 retry check, booster checks, Shape Bloom/M/B review hooks, Chest, Sacrifice, or mobile checks.
- Browser console/runtime status on Vercel and GitHub Pages: no Playwright console errors or page errors observed during fresh Round 12 tease, Round 1 -> Round 12 review progression, Round 12 current/withered/retry/completed payoff, or mobile checks.
- Vercel deployment URL/identifier checked: `dpl_8bUEGUEtjgGFAxE7RxmhUhp9ckDv`, `https://bloom-tycoon-g5xt845s4-xerxes-florals.vercel.app`, production alias `https://bloom-tycoon.vercel.app`.
- GitHub Pages preview status: workflow `28694719614` succeeded for `22fec47` after rerun, and `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html?verify=22fec47-live` returned `200` with all new Round 12 markers.
- Known issues: none found locally for this Round 12 encore Moonlit Wreath slice. The shell still does not have standalone `agent-browser`, so browser verification used bundled Playwright.
- How to trigger and verify L/T/cross matches without console: after Round 1, watch for the `L/T/cross = Shape Bloom` hint in Round 2; in the review path, click `Shape Bloom` or press `M` until `Witch's Cross`, `Night Garden L-Bloom`, or `Twin Stem Bloom` appears. The hidden `shapeAuditData` verifier still contains L, T, and cross definitions.
- How to trigger and verify Supreme Bloom without console: focus the page and press `B`; the ritual log should show `SUPREME BLOOM! Review hook complete. The board is ready.` after the charge phase.
- Security/secret-scan status: lightweight credential-shaped scan ran on changed files with no findings. No secrets, trackers, backend, SDKs, or new permissions were added in code.
