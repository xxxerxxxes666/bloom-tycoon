# Questions / Decisions for Xerxes

This file collects product, design, and business decisions that should wait for Xerxes rather than interrupt autonomous build work.

## Current open questions

1. **Final game title**
   - Working default: `Bloom Tycoon`.
   - Alternatives to consider later: `Bloom Tycoon`, `Bouquet Tycoon`, `Garden Match Tycoon`, `Midnight Bloom`.

2. **Tone of story/customer writing**
   - Working default: elegant, warm, slightly mysterious luxury boutique customers.
   - Need later: decide whether to lean cozy-romantic, witty/dramatic, or premium/business-aspirational.

3. **Monetization aggressiveness**
   - Working default: tasteful freemium with boosters, cosmetics, event pass later; no predatory loot boxes or forced ads.
   - Need later: decide desired balance between brand-safe and revenue-maximizing.

4. **Real Xerxes Florals brand connection**
   - Working default: keep game fictional for now, but compatible with later brand tie-ins.
   - Need later: decide whether this should visibly promote Xerxes Florals or remain a standalone game.

5. **Final visual asset generation path**
   - Working default: continue with coded placeholders and dark elegant floral style guide.
   - Need later: decide whether final assets come from GPT/image generation, a human artist, or a hybrid.

6. **Reward chest naming and ceremony intensity**
   - Working default: `Velvet Bloom Chest` with tasteful win-modal copy, no randomized paid loot mechanics.
   - Need later: decide whether chests should feel understated/luxury, more sparkly/casual, or tied directly to boutique décor rewards.

7. **Spooky-luxury effect intensity**
   - Working default: spooky-luxury is elegant and mechanical, not horror: `Candlelit Focus` gives +2 moves for 3 levels; `Midnight Velvet` gives +25% coins for 3 orders.
   - Need later: decide whether to lean more occult/gothic, more luxury-boutique, or more casual-friendly magical.

8. **Flowerpedia purpose and tone**
   - Working default: Flowerpedia is a non-monetized collection/lore album that reinforces tile readability and boutique identity.
   - Need later: decide whether entries should become unlockable collectibles, design notes, customer-request lore, or direct Xerxes Florals education.

9. **Advanced combo power curve**
   - Working default: line + area creates a `Shears Burst` that clears three rows and three columns, giving a legible mid-tier spectacle below Golden + Golden full-board clears.
   - Need later: decide whether combo strength should stay generous/casual-friendly or become more restrained for puzzle difficulty.

## Resolved / working defaults

- Style direction: **Dark Elegant Floral**.
- Engine: **Godot 4**.
- Core loop: **match flowers → complete bouquet orders → earn coins → upgrade boutique**.
- Development policy while Xerxes is away: continue making reasonable default choices, record questions here, verify with tests, and commit working increments.
