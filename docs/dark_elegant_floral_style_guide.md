# Bloom Tycoon — Dark Elegant Floral Style Guide

## Direction selected

**B: Dark elegant floral** — black plum, rose gold, ivory, emerald, and candlelit boutique warmth.

The game should feel premium and mysterious without becoming cold or gothic to the point of narrowing casual appeal. Think: a luxury floral boutique at dusk, velvet plum walls, rose-gold signage, ivory lilies, polished brass, emerald leaves, and soft candle glows.

## Design principles

1. **Premium first, playful second** — casual readability remains mandatory, but the game should not look childish.
2. **One-screen clarity** — players should instantly understand coins, objective, moves, board, and shop upgrade path.
3. **Soft luxury surfaces** — rounded panels, gentle shadows, warm borders, and restrained highlights.
4. **Flowers as jewels** — tiles should read like polished floral tokens, not flat clipart.
5. **Gold means progress** — use rose-gold/brass for rewards, buttons, completion, and premium moments.
6. **Emerald means growth** — use emerald for owned upgrades, passive income, greenhouse, and success.

## Palette

| Token | Hex | Use |
|---|---:|---|
| Background plum | `#120814` | Main background |
| Surface plum | `#211024` | Cards / panels |
| Raised plum | `#321837` | Buttons / elevated components |
| Border mauve | `#5a334f` | Panel outlines |
| Ivory ink | `#fff7ea` | Primary text |
| Muted orchid | `#cdb8cf` | Secondary text |
| Rose gold | `#d8a657` | Primary accent, rewards |
| Blush highlight | `#e8b6c9` | Objective text, hover accents |
| Emerald leaf | `#4f9f79` | Success, owned upgrades, growth |
| Deep rose | `#9f2348` | Rose tile |
| Copper tulip | `#c25f3f` | Tulip tile |
| Ivory lily | `#f3ead7` | Lily tile |
| Velvet orchid | `#6f3aa5` | Orchid tile |

## Tile direction

Prototype symbols are intentionally abstract until final art exists:

| Flower | Prototype symbol | Final tile guidance |
|---|---|---|
| Rose | `✦` | Deep rose token with petal spiral silhouette |
| Tulip | `◆` | Copper/blush tulip cup shape |
| Lily | `✧` | Ivory lily with gold center, high contrast outline |
| Orchid | `✹` | Velvet purple orchid starburst |
| Sunflower | `✺` | Rose-gold/brass bloom, reward-like |

Final tiles should be readable at small mobile size. Avoid thin botanical detail that collapses on phone screens.

## UI components

### Buttons

- Fill: raised plum `#321837`
- Hover/focus: brighter plum `#45204b`
- Pressed/reward: rose gold `#d8a657`
- Text: ivory
- Radius: 14–18px equivalent
- Feel: plush, tactile, boutique-card rather than arcade plastic

### Panels

- Fill: `#211024`
- Border: `#5a334f`
- Shadow: black at low opacity
- Corners: generous but not bubble-like

### Progress / rewards

- Coins, payout, and level completion should use rose gold.
- Owned upgrades and passive income use emerald.
- Locked upgrades stay muted plum/mauve.

## Shop upgrade art direction

1. **Flower Cart** — dark wood cart, brass wheels, one lantern, first rose bucket.
2. **Bouquet Table** — velvet runner, shears, ribbon spools, arranged ivory lilies.
3. **Display Shelf** — arched brass shelf, premium vases, rose-gold price tags.
4. **Greenhouse Corner** — emerald glass, condensation, climbing leaves, warm grow light.
5. **Luxury Counter** — black marble counter, brass trim, glowing sign, dramatic floral centerpiece.

## App icon concept

A dark plum rounded-square icon with a rose-gold floral monogram/token. The mark should read clearly at App Store size: one central stylized bloom, not a whole bouquet.

## What to avoid

- Halloween/gothic clichés: skulls, thorns everywhere, spooky fog.
- Generic candy-game rainbow overload.
- Thin line art that becomes unreadable on mobile.
- Excessive glassmorphism.
- Too many gradients; use light sparingly like candle glow.
- Monetization UI that feels casino-like or cheap.

## Current implementation status

The Godot prototype now includes the selected dark elegant floral palette in code via the `THEME` constant in `src/Main.gd`. Placeholder flower tiles were updated from emoji flowers to jewel-like symbols and luxury colors.
