from pathlib import Path
import re
import runpy

root = Path(__file__).resolve().parents[1]
required = [
    ".nojekyll",
    ".github/workflows/pages.yml",
    "project.godot",
    "src/Main.tscn",
    "src/Main.gd",
    "README.md",
    "docs/game_design_brief.md",
    "docs/style_prompt_for_gpt.md",
]
missing = [p for p in required if not (root / p).exists()]
if missing:
    raise SystemExit(f"Missing required files: {missing}")

main = (root / "src/Main.gd").read_text()
checks = {
    "BOARD_SIZE := 8": "8x8 board",
    "FLOWERS :=": "flower definitions",
    "UPGRADES :=": "shop upgrades",
    "func find_matches": "match detection",
    "func resolve_matches": "match clearing",
    "func show_tycoon": "separate tycoon screen",
    "func tile_soil_color": "garden-bed board styling",
    "func buy_upgrade": "upgrade purchase",
    "func next_upgrade_progress": "next upgrade progress helper",
    "func show_upgrade_modal": "upgrade reveal ceremony foundation",
    "func show_result_modal": "win/loss result modal foundation",
    "So close": "near-win copy",
    "func special_tile_name": "named/readable special tiles",
    "func special_swap_clear_cells": "special swap activation helper",
    "Golden bouquet combo": "Golden + Golden full-board combo feedback",
    "func add_full_board_clear": "full-board special combo helper",
    "Shears Burst combo": "line + area advanced combo feedback",
    "func add_shears_burst_cells": "line + area three-row/column combo helper",
    "SPECIAL_AREA": "Orchid Burst area special",
    "func add_area_burst_cells": "3x3 area burst special clear helper",
    "Velvet Bloom Chest": "reward chest ceremony foundation",
    "FLOWERPEDIA_ENTRIES": "Flowerpedia collection entries",
    "func show_flowerpedia": "Flowerpedia screen skeleton",
}
failed = [desc for needle, desc in checks.items() if needle not in main]
if failed:
    raise SystemExit(f"Missing expected implementation areas: {failed}")

# Basic bracket sanity for the largest script.
pairs = [("(", ")"), ("[", "]"), ("{", "}")]
for left, right in pairs:
    if main.count(left) != main.count(right):
        raise SystemExit(f"Unbalanced {left}{right}: {main.count(left)} vs {main.count(right)}")

print("Bloom Tycoon project verification passed.")
print(f"Project root: {root}")
print(f"GDScript lines: {len(main.splitlines())}")
runpy.run_path(str(root / "scripts" / "verify_html_match_shapes.py"), run_name="__main__")

html = (root / "playable" / "midnight_bloom_prototype.html").read_text()
html_checks = {
    'id="liveBouquetAssembly"': "single live bouquet assembly hook",
    'data-assembly-hook="authoritative-target-progress"': "authoritative target progress assembly marker",
    "function renderLiveBouquetAssembly": "live bouquet progress renderer",
    "function liveBouquetAssemblyMarkup": "live bouquet markup derives from targets",
    "function craftedBouquetEntries": "shared count-truthful bouquet target composition",
    'class="live-bouquet-ingredient live-bouquet-bloom': "one-unit live bouquet bloom renderer",
    "data-slot-progress": "authoritative per-slot live bouquet fullness hook",
    "visibleLiveBouquetTargetRect": "target harvest feedback links to live bouquet",
    "function craftedBouquetMarkup": "crafted bouquet ceremony renderer",
    "function bouquetCompositionLayout(index, total)": "tiered one-unit bouquet layout",
    'data-unit-index="${unitIndex}"': "one-earned-unit bouquet identity hook",
    'data-crafted-bouquet="true"': "crafted bouquet object marker",
    'data-crafted-bloom-count="${entries.length}"': "crafted bouquet count hook",
    "dataset.assemblyReady": "payoff action readiness gate"
}
missing_html = [desc for needle, desc in html_checks.items() if needle not in html]
if missing_html:
    raise SystemExit(f"Missing bouquet assembly implementation areas: {missing_html}")

unique_ids = [
    'id="bouquetProgress"',
    'id="liveBouquetAssembly"',
    'id="bouquetTrophy"',
    'id="roundOneRestoration"'
]
duplicates = [needle for needle in unique_ids if html.count(needle) != 1]
if duplicates:
    raise SystemExit(f"Unexpected duplicate bouquet/payoff scaffold ids: {duplicates}")

if "bouquet-assembly-panel" in html or "live-bouquet-panel" in html:
    raise SystemExit("Unexpected duplicate bouquet assembly panel scaffold found.")

print("Bouquet assembly static hooks verified.")
