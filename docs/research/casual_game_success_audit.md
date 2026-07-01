# Bloom Empire — Casual Mobile Game Success Audit

Captured: 2026-06-29T21:36:56.520754Z  
Project: `bloom-empire-prototype`  
Selected style: **Dark Elegant Floral**

## Executive thesis

We should **not** reinvent the casual mobile formula. The greats win by combining a dead-simple core action with an emotionally sticky meta layer, lavish reward feedback, friction-calibrated difficulty, live events, and carefully-timed monetization. Bloom Empire should borrow the proven skeleton and differentiate chiefly through **premium floral fantasy, boutique tycoon aspiration, and tasteful dark-luxury art direction**.

The winning formula for us:

> **Match-3 clarity + Royal Match pacing + Gardenscapes-style restoration + Lily’s Garden floral romance warmth + Township/tycoon growth fantasy + restrained premium monetization.**

## Reference evidence snapshot

Apple App Store public data captured via the iTunes Search API. Ratings are not a full business metric, but they are useful evidence of scale and user acceptance.

| Game | Publisher | Avg rating | US rating count | Source |
|---|---|---:|---:|---|
| Candy Crush Saga | King.com Limited | 4.71 | 3,948,303 | [App Store](https://apps.apple.com/us/app/candy-crush-saga/id553834731?uo=4) |
| Royal Match | Dream Games Dijital Teknolojiler A.S. | 4.69 | 3,708,054 | [App Store](https://apps.apple.com/us/app/royal-match/id1482155847?uo=4) |
| Gardenscapes | PLR Worldwide Sales Limited | 4.69 | 1,682,287 | [App Store](https://apps.apple.com/us/app/gardenscapes/id1105855019?uo=4) |
| Homescapes: Match 3 Games | PLR Worldwide Sales Limited | 4.65 | 2,162,826 | [App Store](https://apps.apple.com/us/app/homescapes-match-3-games/id1195621598?uo=4) |
| Lily’s Garden: Match & Design | Tactile Games ApS | 4.77 | 271,901 | [App Store](https://apps.apple.com/us/app/lilys-garden-match-design/id1437783446?uo=4) |
| Project Makeover | Magic Tavern, Inc. | 4.48 | 794,810 | [App Store](https://apps.apple.com/us/app/project-makeover/id1483058899?uo=4) |
| Merge Mansion: Puzzles & Story | Metacore Games Oy | 4.56 | 196,993 | [App Store](https://apps.apple.com/us/app/merge-mansion-puzzles-story/id1484442152?uo=4) |
| Township | PLR Worldwide Sales Limited | 4.75 | 2,147,094 | [App Store](https://apps.apple.com/us/app/township/id638689075?uo=4) |
| MONOPOLY GO! | Scopely, Inc. | 4.80 | 3,734,905 | [App Store](https://apps.apple.com/us/app/monopoly-go/id1621328561?uo=4) |
| Coin Master | Moon Active LTD | 4.78 | 1,314,745 | [App Store](https://apps.apple.com/us/app/coin-master/id406889139?uo=4) |

Raw snapshot: `docs/research/app_store_reference_snapshot.json`

## Games audited and what to steal

### 1. Candy Crush Saga — the enduring core-loop master

**What it proves:** A simple board can sustain years of play if level variety, obstacles, power-ups, friction, and events keep refreshing the same action.

**Steal:**
- Instantly legible objective panel: collect X, clear Y, drop Z.
- Strong special-piece grammar: line clear, bomb, color clear, combo interactions.
- Fast retry and “one more try” psychology.
- Level map / saga progression with social proof and visible next gates.
- Daily rewards, timed boosters, streaks, and recurring events.

**Avoid:**
- Overly artificial fail states too early.
- Generic candy brightness; not our brand.

**Bloom Empire adaptation:**
- Flower specials: Rose Shears = row/column clear; Orchid Burst = area clear; Golden Lily = color clear; Bouquet Combo = multi-clear.
- Orders should be bouquet-oriented, not abstract candy goals.

### 2. Royal Match — modern match-3 speed and generosity

**What it proves:** A polished pure puzzle experience with no ads can dominate when level pacing, power-ups, rescue fantasy, and rewards feel premium.

**Steal:**
- Extremely fast onboarding; player is matching within seconds.
- Huge tactile rewards: coins, chests, boosters, visual explosions.
- Clear obstacle language and power-up combinations.
- “Save the King” / mini-rescue sequences for emotional urgency.
- Short sessions with low cognitive friction.

**Avoid:**
- Copying royal/castle identity.
- Becoming too expensive to content-produce.

**Bloom Empire adaptation:**
- “Save the bouquet/order” moments: a wedding bouquet is due, a VIP client arrives, flowers are wilting.
- Use rose-gold completion fanfare and floral unfurl animations.

### 3. Gardenscapes / Homescapes — match-3 with restoration meta

**What it proves:** A strong meta-progression layer makes puzzle wins emotionally meaningful. Players are not just beating levels; they are restoring a world.

**Steal:**
- Stars/coins earned from match levels become renovation currency.
- Narrative tasks grouped by area/chapter.
- Decoration choices give ownership and identity.
- Characters create continuity between sessions.
- New areas tease future play.

**Avoid:**
- Too much dialogue before the core loop is proven.
- High art-content burden too early.

**Bloom Empire adaptation:**
- Replace mansion/garden restoration with floral boutique expansion.
- Area chapters: Cart → Counter → Studio → Greenhouse → Wedding Atelier → Luxury Flagship.
- Optional design choices later: vase style, counter material, wall color, signage.

### 4. Lily’s Garden — floral theme + romance/narrative tone

**What it proves:** Floral/garden aesthetics can support long-term casual play when paired with character drama, renovation, and clear puzzles.

**Steal:**
- Floral tile language and garden renovation fantasy.
- Gentle emotional stakes and character-driven story.
- Feminine/cozy appeal without needing hard strategy.

**Avoid:**
- Soap-opera overdependence if we do not want huge writing load.
- Looking too similar; Bloom Empire should be more luxury boutique than sunny garden.

**Bloom Empire adaptation:**
- Use customer vignettes rather than heavy drama: bride, gallery owner, hotel concierge, gala planner, eccentric collector.
- The “magic sauce” is a darker, more elegant Xerxes Florals-coded boutique.

### 5. Project Makeover — transformation fantasy

**What it proves:** Players pay attention when puzzle wins visibly transform people/spaces and unlock styling choices.

**Steal:**
- Before/after satisfaction.
- Clear makeover steps, each a small task.
- Fashion/style identity as collection and monetization layer.

**Avoid:**
- Snarky makeover tropes; can feel mean or tacky.

**Bloom Empire adaptation:**
- Transform plain arrangements into signature luxury bouquets.
- Premium cosmetics: vase skins, ribbon styles, tile skins, boutique decor.

### 6. Merge Mansion — mystery, generators, long arcs

**What it proves:** A cozy meta-game with mystery and long-term object chains can keep players invested beyond the puzzle board.

**Steal:**
- Long-term curiosity hooks.
- Generators and collection chains as a possible later layer.
- Task board with visible requirements.

**Avoid for MVP:**
- Full merge economy; too complex now.

**Bloom Empire adaptation:**
- Later: greenhouse generators create rare stems; arrange them into collections.
- For now: keep task-board style objectives for shop upgrades.

### 7. Township — city/tycoon aspiration with casual minigames

**What it proves:** Building a personal place over time is highly sticky, especially when production, decoration, events, and social competition layer together.

**Steal:**
- Expansion map / town growth fantasy.
- Factories/production as soft timers.
- Event races/regattas as team/social loops.

**Avoid for MVP:**
- Too many resources and timers.

**Bloom Empire adaptation:**
- Passive income and delivery queue later.
- Greenhouse, design studio, delivery counter, wedding atelier as stations.

### 8. Coin Master / MONOPOLY GO — social casino-adjacent retention loops

**What it proves:** Dice/spin randomness, collections, raids, social competition, and frequent events can monetize aggressively.

**Steal carefully:**
- Album/collection completion.
- Time-limited events layered over core loop.
- Streaks and milestone ladders.
- Social gifting/trading later.

**Avoid:**
- Casino-like pressure and predatory feel.
- Raiding/attacking does not match Xerxes Florals unless heavily softened.

**Bloom Empire adaptation:**
- “Floral album” collections: rare stems, vases, ribbon sets, seasonal arrangements.
- Friendly gifting: send bouquet ingredients, not attack.

## The proven pattern stack

### A. First-session design

**Target:** User understands the game in under 30 seconds and gets a shop upgrade in under 3 minutes.

Borrowed pattern:
1. Show a beautiful but incomplete boutique.
2. Give one obvious order: collect 6 roses.
3. Let player make 2–3 easy matches.
4. Trigger a satisfying completion.
5. Award coins/stars.
6. Immediately buy first upgrade.
7. Reveal next locked area.

Bloom rule:
> The first upgrade must happen before any monetization, account, settings, or complex economy.

### B. Core gameplay design

Minimum viable match-3 grammar:
- 5 base tile types.
- Match 4 creates line-clear special.
- Match 5 creates color-clear special.
- T/L shape creates area bomb.
- Special + special combos produce exaggerated outcomes.
- Objectives: collect flowers, clear leaves/weeds, drop bouquet boxes, open gift crates.

Important: do not add all obstacles at once. Introduce one mechanic every 5–10 levels.

### C. Meta progression

The meta must answer: “Why do I care that I won?”

Recommended Bloom Empire meta:
- Currency 1: Coins — basic upgrades.
- Currency 2: Prestige petals — rare/event currency, later.
- Chapter tasks — grouped upgrades.
- Visual boutique transformation.
- Customer/order book that unlocks new client types.
- Floral collection album.

MVP should use only coins and linear upgrades. Add petals after retention is proven.

### D. Reward design

Successful casual games exaggerate feedback.

Needed reward moments:
- Match feedback: pop, sparkle, petal burst.
- Cascade feedback: increasing multiplier callouts.
- Level win: bouquet wraps itself / shop bell rings.
- Upgrade: before/after animation and warm lighting.
- Chest: rose-gold clasp opens with particles.

Do this tastefully: *luxury ceremony*, not arcade chaos.

### E. Difficulty curve

Use a three-beat rhythm:
- Easy win: confidence.
- Moderate puzzle: engagement.
- Tight puzzle: monetization opportunity.
- Then relief: easier level or reward level.

Early difficulty rules:
- Levels 1–3: impossible to lose unless inactive.
- Levels 4–10: introduce objectives and specials.
- Levels 11–20: first real fail chance.
- No hard monetization before player feels competence.

### F. Monetization design

MVP monetization later, not now. But the game architecture should prepare for:

| Offer | Borrowed from | Bloom version | Notes |
|---|---|---|---|
| Extra moves | Candy/Royal | “Add 5 moves to finish VIP bouquet” | High conversion, must not appear too early |
| Boosters | All match-3 | Shears, Orchid Burst, Golden Lily | Earnable + purchasable |
| Starter pack | All top casual | “Founder Florist Pack” | $1.99–$4.99 later |
| Event pass | Royal/Monopoly | “Midnight Rose Gala Pass” | Only after events exist |
| Cosmetics | Project Makeover | Vases, ribbons, tile skins, boutique decor | Brand-safe monetization |
| Remove ads | Hybrid casual | “Patron Pass” | If ads introduced |

Taste rule:
> Monetize impatience, expression, and event ambition — not basic dignity.

### G. Live ops / event system

Do not build full live ops yet, but design toward it.

Reusable event templates:
- Weekend Wedding Rush: complete levels to fill bouquet milestones.
- Midnight Rose Gala: collect dark rose tokens from matches.
- Greenhouse Bloom: passive rewards grow over time.
- VIP Client Sprint: limited order chain with reward chest.
- Seasonal Shop Decor: Valentine’s, Mother’s Day, Halloween-but-elegant, Winter Orchid.

### H. UX / UI hierarchy

Main screen hierarchy should be:
1. Current objective/moves.
2. Board.
3. Coins/progress.
4. Booster bar.
5. Shop/meta button.

Shop screen hierarchy:
1. Current boutique visual.
2. Next upgrade card.
3. Cost/progress.
4. Reward/benefit.
5. Play button to earn more.

Avoid dense menus early. Top games hide complexity until trust is earned.

## Bloom Empire’s magic sauce

The differentiator is not “match-3.” The differentiator is:

1. **Luxury floral business fantasy** — player grows a boutique empire.
2. **Dark elegant floral identity** — premium enough to stand apart from candy/garden clones.
3. **Arrangement craft** — orders feel like building beautiful objects, not clearing arbitrary tiles.
4. **Xerxes Florals adjacency** — possible long-term brand halo, real-world bouquet inspiration, seasonal tie-ins.
5. **Tasteful monetization** — high-margin cosmetics and event passes without cheap casino energy.

## Feature priority for prototype

### Build next, before more art

1. **Special tiles** — match-4/match-5 power pieces. This is core to match-3 fun.
2. **Win/loss modal** — clean retry/continue loop.
3. **Save/load progress** — coins, level, upgrades.
4. **Upgrade reveal ceremony** — visual before/after moment.
5. **Level data file** — move levels out of hardcoded script.
6. **Booster bar placeholder** — locked initially, unlock after early levels.

### Build after prototype feels fun

1. Chapter/task system.
2. 20–50 levels.
3. Handcrafted obstacles.
4. Daily reward.
5. Chest rewards.
6. Event framework.
7. Basic analytics hooks.

### Do not build yet

- IAP.
- Ads.
- Accounts.
- Social features.
- Complex idle production chains.
- AI-generated live content.

## Anti-clone rules

We can steal structure, not surface.

- Do not clone Royal Match’s king/castle/rescue scenes.
- Do not clone Playrix’s Austin/renovation dialogue style.
- Do not use candy-game rainbow UI.
- Do not over-index on social casino mechanics.
- Do not build a content machine before proving the loop.

## Immediate implementation brief

Next code milestone:

> Add match-4/match-5 special tile creation and activation, then add save/load and win/loss modal.

Acceptance criteria:
- Match 4 creates a line-clear special tile.
- Match 5 creates a color-clear special tile.
- Activating a special feels materially different from a normal match.
- Smoke test covers theme, board, shop, and special tile definitions.
- Game state persists after restart.

