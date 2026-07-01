# Bloom Tycoon — Gothic Botanical Tile Art Pass

## Reference target

Xerxes provided a strong target image: **Diablo 2 if it were a gothic gardening / floral tycoon game**.

The direction is now:

- dark fantasy inventory icons,
- occult botanical loot,
- jewel-toned but grimy,
- luxurious and ancient,
- carved black stone / blackened wood tile bases,
- moss, scratches, gold filigree, faint vine engraving,
- readable at 48–96px.

## Generated tile set

Source sprite sheet:

`assets/tiles/generated/diablo_gothic_botanical_spritesheet.png`

Cropped 96px icons:

- `assets/tiles/96/withered_sun_medallion.png`
- `assets/tiles/96/bone_white_thorn_star.png`
- `assets/tiles/96/purple_nightshade_bloom.png`
- `assets/tiles/96/bloodroot_ruby_shard.png`
- `assets/tiles/96/amber_resin_seed.png`
- `assets/tiles/96/crimson_rose_rune.png`

Cropped 48px gameplay icons:

- `assets/tiles/48/withered_sun_medallion.png`
- `assets/tiles/48/bone_white_thorn_star.png`
- `assets/tiles/48/purple_nightshade_bloom.png`
- `assets/tiles/48/bloodroot_ruby_shard.png`
- `assets/tiles/48/amber_resin_seed.png`
- `assets/tiles/48/crimson_rose_rune.png`

## Tile mapping

| ID | Current element | Art asset direction | Gameplay/readability role |
|---:|---|---|---|
| 0 | Sol Rot | withered sun medallion | gold circular medallion; warm focal tile |
| 1 | Bone Star | bone thorn star | ivory sharp star; high-contrast pale tile |
| 2 | Nightshade | purple nightshade bloom | violet poisonous flower; dark botanical tile |
| 3 | Bloodroot | bloodroot ruby shard | red thorn/crystal; aggressive vertical shape |
| 4 | Amber Seed | amber resin seed | warm organic oval gemstone seed |
| 5 | Thorn Rose | crimson rose rune | red/magenta rose sigil; romantic occult tile |

## Quality notes

The first generated set was rejected because it looked too wrong/mobile and not enough like the reference. It was archived at `assets/tiles/rejected/first_rejected_too_mobile_spritesheet.png`. The replacement set is much closer to the reference:

- six distinct silhouettes,
- heavy black carved inventory-slot bases,
- grimy tarnished-gold corners and old-stone frames,
- high contrast at 96px,
- still readable at 48px,
- no flat emoji/candy style,
- much closer to classic dark fantasy inventory art.

Potential future polish:

- create true transparent-background icon-only variants separate from the tile base,
- add hover/selected glow variants,
- hand-curate one final pass for consistency of bevel thickness and glow intensity,
- export lossless originals at 256px for App Store marketing/compositing.


## User reference

Reference image saved at `docs/references/user_diablo2_garden_reference.jpg`. Future art passes should compare against it and reject anything that feels cute, flat, candy-like, or modern-mobile.
