# Bloom Empire — Delegated Research Appendix

This appendix captures additional subagent research completed on 2026-06-29 for competitive pattern mining. It should be used alongside `casual_game_success_audit.md` and `feature_roadmap.md`.

## Match-3 / renovation patterns to borrow

### Core level structure

- Clear goals visible before and during play.
- Limited moves, not timers, for broad casual appeal.
- Objectives should be immediately legible in a stable HUD zone.
- Remaining moves should convert into bonus rewards or post-win flourish.

**Bloom adaptation:**
- Goals: collect flowers, clear weeds, water dry soil, break pots/crates, spread sunlight, drop bouquet boxes.
- HUD: objectives top-left, moves top-right, boosters bottom.

### Power-up vocabulary

Reusable power-up archetypes:

| Archetype | Bloom version |
|---|---|
| Line clear | Watering Can / Garden Shears |
| Area bomb | Sunburst / Orchid Burst |
| Random target | Bee |
| Color clear | Rainbow Pollen / Golden Lily |
| Single tile | Garden Shears |
| Shuffle / extra moves | Bouquet Rewrap / Extra Time |

Power-ups must be readable, juicy, and thematically consistent.

### Meta progression

The proven loop:

1. Beat match-3 level.
2. Earn stars/coins/petals.
3. Spend resources on task.
4. Task restores/decorates/upgrades an area.
5. Area/chapter completion opens a reward chest.
6. New area teases the next session.

**Bloom adaptation:**
- Stars = story/task progress.
- Coins = upgrades/boosters.
- Petals/seeds = flower production identity.
- Premium currency = convenience/cosmetics.

### Decoration choice

Use fixed-slot, 3-option cosmetic choices early. This gives agency without building a freeform editor.

Examples:
- Vase style.
- Greenhouse skin.
- Bouquet display.
- Shop sign.
- Flower bed design.

Let players redesign later.

### Onboarding

Best first session:

1. Start gameplay immediately.
2. Teach one mechanic.
3. Give first win.
4. Spend reward on first visible upgrade.
5. Reveal next locked area.
6. Delay teams/events/collections.

## Tycoon / merge / liveops patterns to borrow

### Controlled resource scarcity

Top casual tycoon/social games use attempt currency:

- Coin Master: spins.
- Monopoly GO: dice.
- Merge games: energy / generator cooldowns.

**Bloom adaptation options:**
- Water.
- Sunlight.
- Gardener actions.
- Pollination tokens.

Use scarcity carefully; it should create return loops, not suffocate early play.

### Collections

Long-term retention systems:

- Flowerpedia.
- Butterfly Album.
- Seed Vault.
- Garden Decor Collection.
- Customer Memories / Postcards.

Monetization-safe collection offers:
- Seed packs.
- Wildcard seeds.
- Guaranteed missing rare.
- Duplicate conversion currency.

### Event stack

Mature event cadence:

- Daily: login reward / free chest.
- 2–3 days: order sprint / leaderboard.
- Weekly: co-op garden project.
- Monthly: Bloom Pass.
- Seasonal: limited album + decor.

Events should progress through normal play, not separate unrelated grinds.

### Targeted offers

Best triggers:

- Near order completion.
- Out of water/energy during high intent.
- 80–90% event milestone completion.
- One missing rare collection item.
- Return after absence.

## UX / visual patterns to borrow

### Board readability

- Board readability beats beauty.
- Use large pieces, clear silhouettes, strong contrast.
- Use color + shape + icon, never color alone.
- Background should never compete with board.
- Special pieces must be recognizable in peripheral vision.

### Reward animation sequence

1. Trigger.
2. Anticipation: shake/glow/progress fill.
3. Reveal: burst/fan-out/coin shower.
4. Count-up into wallet.
5. Reinforcement text.
6. Next hook.

Keep small rewards under ~1.2s and major rewards skippable after the first beat.

### Win flow

1. Final objective completes.
2. Board cascade/power-up detonation.
3. Big win banner.
4. Currency/stars count-up.
5. Event progress.
6. Meta progress.
7. CTA: Continue / Next order.

### Loss flow

1. Show “So close.”
2. Show remaining objective.
3. Highlight problem area.
4. Offer extra moves / booster / ad.
5. Provide small secondary exit.

### Offer UX

- Contextual offers beat generic shop tabs.
- One primary CTA.
- Large item icons.
- Clear value anchor.
- Timer only when meaningful.
- Avoid chains of monetization modals.

## Source URLs from delegated research

- Royal Match Help: https://dreamgames.helpshift.com/hc/en/3-royal-match/
- Royal Match gameplay: https://dreamgames.helpshift.com/hc/en/3-royal-match/faq/3-how-do-i-play-royal-match/
- Royal Match tasks: https://dreamgames.helpshift.com/hc/en/3-royal-match/faq/15-what-are-tasks-and-how-do-i-complete-them/
- Gardenscapes Help: https://playrix.helpshift.com/hc/en/5-gardenscapes/
- Gardenscapes stars: https://playrix.helpshift.com/hc/en/5-gardenscapes/faq/61-what-are-stars/
- Homescapes Help: https://playrix.helpshift.com/hc/en/14-homescapes/
- Homescapes areas/tasks: https://playrix.helpshift.com/hc/en/14-homescapes/faq/1101-unlocking-new-areas-in-the-mansion/
- Candy Crush App Store: https://apps.apple.com/us/app/candy-crush-saga/id553834731
- Lily’s Garden App Store: https://apps.apple.com/us/app/lilys-garden-match-design/id1437783446
- Project Makeover App Store: https://apps.apple.com/us/app/project-makeover/id1483058899
- Matchington Mansion App Store: https://apps.apple.com/us/app/matchington-mansion/id1216575026
- Merge Mansion liveops: https://www.gamerefinery.com/how-metacore-scaled-merge-mansion-with-a-stellar-live-event-strategy/
- Merge genre: https://www.gamerefinery.com/why-merge-could-be-the-new-match3/
- Monopoly GO analysis: https://www.blog.udonis.co/mobile-marketing/mobile-games/monopoly-go
- Coin Master monetization: https://www.blog.udonis.co/mobile-marketing/mobile-games/coin-master-monetization
- Township deconstruction: https://www.deconstructoroffun.com/blog/2020/10/13/how-playrix-township-became-a-billion-dollar-game
- Idle mechanics: https://mobilefreetoplay.com/tag/idle-mechanics/
- Game accessibility guidelines: https://gameaccessibilityguidelines.com/basic/
- Apple accessibility HIG: https://developer.apple.com/design/human-interface-guidelines/accessibility
- AdMob rewarded ads playbook: https://admob.google.com/home/resources/rewarded-ads-playbook/
