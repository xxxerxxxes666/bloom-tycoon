from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "tiles" / "altar"


def svg(symbol_id, title, accent, glow, body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-labelledby="{symbol_id}-title">
  <title id="{symbol_id}-title">{title}</title>
  <defs>
    <radialGradient id="{symbol_id}-halo" cx="50%" cy="43%" r="52%">
      <stop offset="0" stop-color="{glow}" stop-opacity=".82"/>
      <stop offset=".42" stop-color="{accent}" stop-opacity=".24"/>
      <stop offset="1" stop-color="#050202" stop-opacity="0"/>
    </radialGradient>
    <filter id="{symbol_id}-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity=".86"/>
      <feDropShadow dx="0" dy="0" stdDeviation="3.4" flood-color="{accent}" flood-opacity=".48"/>
    </filter>
    <linearGradient id="{symbol_id}-metal" x1="14" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff3b0"/>
      <stop offset=".28" stop-color="{glow}"/>
      <stop offset=".62" stop-color="{accent}"/>
      <stop offset="1" stop-color="#210806"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" fill="none"/>
  <circle cx="48" cy="48" r="42" fill="url(#{symbol_id}-halo)"/>
  <g filter="url(#{symbol_id}-shadow)" stroke-linecap="round" stroke-linejoin="round">
{body}
  </g>
</svg>
'''


TILES = {
    "sol_rot_altar.svg": svg(
        "sol-rot",
        "Sol Rot occult sun medallion",
        "#d49a2f",
        "#f6d27a",
        '''    <circle cx="48" cy="48" r="26" fill="#21140a" stroke="#d8a657" stroke-width="3"/>
    <circle cx="48" cy="48" r="18" fill="url(#sol-rot-metal)" stroke="#4c2c12" stroke-width="2"/>
    <path d="M48 9v16M48 71v16M9 48h16M71 48h16M20 20l12 12M64 64l12 12M76 20 64 32M32 64 20 76" stroke="#e8c36d" stroke-width="4"/>
    <path d="M39 37c8-7 22 0 21 12-.8 12-16 18-25 8 11 2 19-5 18-13-.6-6-6-10-14-7Z" fill="#5d300b" stroke="#f1c46d" stroke-width="2"/>
    <circle cx="48" cy="48" r="6" fill="#fff1aa" opacity=".84"/>'''
    ),
    "bone_star_altar.svg": svg(
        "bone-star",
        "Bone Star thorn flower",
        "#d8c9a9",
        "#fff0c8",
        '''    <path d="M48 8 56 37 84 22 63 48 86 73 56 60 48 89 40 60 10 73 33 48 12 22 40 37Z" fill="#e9ddc1" stroke="#4a3722" stroke-width="3"/>
    <path d="M48 15 53 40 78 28 58 48 79 68 53 56 48 82 43 56 17 68 38 48 18 28 43 40Z" fill="none" stroke="#fff6d8" stroke-width="2"/>
    <path d="M39 38c8 5 11 14 9 24M57 37c-7 7-9 15-6 24M32 51h32" stroke="#6f5a3c" stroke-width="2"/>
    <circle cx="48" cy="48" r="5" fill="#24160c" stroke="#f3e6c3" stroke-width="2"/>'''
    ),
    "nightshade_altar.svg": svg(
        "nightshade",
        "Nightshade violet bloom",
        "#8247c6",
        "#d59cff",
        '''    <path d="M48 45C38 23 48 14 48 14s10 9 0 31Z" fill="#7c3bc0" stroke="#17091f" stroke-width="2.5"/>
    <path d="M43 49C20 38 22 25 22 25s13-2 26 18Z" fill="#59229c" stroke="#17091f" stroke-width="2.5"/>
    <path d="M53 49c23-11 21-24 21-24s-13-2-26 18Z" fill="#9b55df" stroke="#17091f" stroke-width="2.5"/>
    <path d="M43 52C19 59 21 73 21 73s13 3 27-16Z" fill="#6a2bb0" stroke="#17091f" stroke-width="2.5"/>
    <path d="M53 52c24 7 22 21 22 21s-13 3-27-16Z" fill="#b26cff" stroke="#17091f" stroke-width="2.5"/>
    <circle cx="48" cy="50" r="10" fill="#180719" stroke="#d9a5ff" stroke-width="2"/>
    <circle cx="44" cy="47" r="2.8" fill="#efe0ff"/><circle cx="52" cy="47" r="2.8" fill="#efe0ff"/><circle cx="48" cy="55" r="3.2" fill="#f0c75f"/>
    <path d="M31 68c7-2 12-6 17-14M64 69c-7-3-12-7-16-15" stroke="#4f8d57" stroke-width="3"/>'''
    ),
    "bloodroot_altar.svg": svg(
        "bloodroot",
        "Bloodroot crimson cutting",
        "#e32a35",
        "#ff8a5a",
        '''    <path d="M50 10C30 29 25 55 45 80c23-16 28-46 5-70Z" fill="#b50e1d" stroke="#2c0206" stroke-width="3"/>
    <path d="M52 16C42 35 40 55 47 76" stroke="#ffb071" stroke-width="4"/>
    <path d="M47 29c-9 5-15 13-18 25M50 43c8-5 15-8 24-9M48 58c-7 3-12 8-16 16" stroke="#5b050a" stroke-width="3"/>
    <path d="M44 78c-6 6-9 9-18 11M49 79c2 7 5 10 11 13M53 75c8 1 13 5 18 11" stroke="#89121a" stroke-width="3"/>
    <path d="M34 38c-4 9-3 20 6 31M61 25c7 13 8 26 2 39" fill="none" stroke="#ff3947" stroke-opacity=".74" stroke-width="2"/>'''
    ),
    "amber_seed_altar.svg": svg(
        "amber-seed",
        "Amber Seed resin pod",
        "#ca7428",
        "#ffd26c",
        '''    <path d="M49 10c21 16 28 42 7 76-26-9-34-41-7-76Z" fill="#8b3d11" stroke="#220c04" stroke-width="3"/>
    <path d="M50 16c15 16 19 36 5 62-18-7-24-31-5-62Z" fill="url(#amber-seed-metal)" stroke="#f2a23b" stroke-width="2"/>
    <path d="M38 41c9-5 20-8 31-7M35 55c9 3 20 5 31 4M44 20c2 20 6 39 13 59" stroke="#5f2508" stroke-width="3"/>
    <ellipse cx="46" cy="34" rx="5" ry="11" fill="#fff0a4" opacity=".52" transform="rotate(18 46 34)"/>
    <path d="M35 76c8 4 17 6 27 3" stroke="#f8bf5c" stroke-width="2"/>'''
    ),
    "thorn_rose_altar.svg": svg(
        "thorn-rose",
        "Thorn Rose crimson sigil",
        "#c0185e",
        "#ff86bd",
        '''    <path d="M48 14c9 8 11 18 2 30 12-4 21 2 25 13-9 9-20 11-31 3 3 12-3 21-15 25-8-9-9-20-1-30-12 2-21-4-25-16 9-8 20-9 31-1-4-12 1-20 14-24Z" fill="#9f1046" stroke="#260411" stroke-width="3"/>
    <path d="M48 31c15 3 18 22 3 29-10 5-23-4-18-16 4-10 20-10 23 0 2 7-6 13-13 10" fill="none" stroke="#ff79ad" stroke-width="4"/>
    <path d="M31 33c9 4 14 9 15 15M63 35c-8 4-13 9-15 16M33 66c6-5 11-8 18-10" stroke="#4b071b" stroke-width="3"/>
    <path d="M21 23c8 2 14 6 19 13M75 72c-8-3-14-7-19-15" stroke="#6a8f42" stroke-width="4"/>
    <path d="M23 23l8-7M73 72l-8 7" stroke="#d7b16d" stroke-width="2"/>'''
    ),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, content in TILES.items():
        (OUT / name).write_text(content, encoding="utf-8")
    print(f"Wrote {len(TILES)} occult tile SVGs to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
