# Bloom Tycoon — Spooky Luxury Temporary Gameplay Effects Research

## Direction

Xerxes selected **spooky luxury**. The right translation is not horror; it is **velvet, candlelight, moonlit botanicals, old-money occult elegance, and rare nocturnal flowers**. Mechanically, this can become a tasteful temporary-effects system that makes the boutique feel enchanted while increasing retention.

## Why temporary effects help

Successful casual games use temporary boosts because they create:

1. **Session momentum** — “I have a 3-level boost active, I should keep playing.”
2. **Loss aversion without harsh punishment** — leaving wastes opportunity, but nothing is stolen.
3. **Event identity** — boosts can make seasons feel mechanically different.
4. **Offer/event hooks later** — boosts can be rewards from chests, daily streaks, events, or cosmetics.
5. **Aspirational fantasy** — the shop’s atmosphere can “bless” gameplay.

## Ethical guardrail

Temporary effects should be **generous and understandable**, not manipulative.

Avoid:
- Hidden odds.
- Paid-only power spikes.
- Boosts expiring in real time while the player is away.
- Stacking so many effects that value becomes unreadable.

Prefer:
- Effects that last for a fixed number of levels/orders.
- Clear descriptions.
- Earned from gameplay first.
- Monetization later only after free familiarity.

## Recommended effect families

### 1. Atmosphere effects

These represent the boutique’s current magical mood.

| Effect | Gameplay impact | Flavor |
|---|---|---|
| Candlelit Focus | +2 moves for next 3 levels | Warm candles sharpen the florist’s eye. |
| Midnight Velvet | +25% coin payout for next 3 orders | Luxury clients pay more under velvet midnight ambiance. |
| Moonlit Greenhouse | Passive income bonus for next 3 orders | Nocturnal blooms mature under moonlight. |
| Phantom Shears | One free line-clear special per level | Spectral scissors prepare the first cut. |
| Orchid Séance | Higher chance of rare collection drops | Rare orchids whisper from the old conservatory. |

### 2. Seasonal event effects

Useful later for liveops:

- Midnight Rose Gala: rose matches count double sometimes.
- Haunted Conservatory: clear ghost-vine blockers for event tokens.
- Black Orchid Week: orchid objectives pay bonus coins.
- Candlelight Wedding: win streak grants boutique décor points.

### 3. Cosmetic-to-gameplay soft effects

Decor can temporarily affect play without becoming a spreadsheet.

Examples:
- Equipping a “Black Marble Counter” activates Midnight Velvet for 3 orders after purchase.
- Installing “Candlelit Wall Sconces” activates Candlelit Focus for 3 levels.
- A “Moon Glass Greenhouse” activates Moonlit Greenhouse for 3 orders.

## MVP implementation choice

Implement two simple temporary effects first:

1. **Candlelit Focus**
   - +2 moves for the next 3 levels.
   - Supports puzzle satisfaction and reduces early frustration.

2. **Midnight Velvet**
   - +25% coin payout for the next 3 completed orders.
   - Supports tycoon progression and makes luxury atmosphere feel economically meaningful.

These are easy to understand, easy to test, and align with spooky luxury.

## Later optimization

Track analytics eventually:

- effect_claimed
- effect_started
- effect_level_used
- effect_order_used
- effect_expired
- level_win_with_effect
- purchase_or_ad_after_effect_expiry, only if monetization is added later

The product question is not “can we make players addicted?” but “which effects increase session depth while preserving trust?”
