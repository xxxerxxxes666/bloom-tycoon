from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "playable" / "midnight_bloom_prototype.html"
BOARD_SIZE = 8
SHAPE_VALUE = 2
BASE_VALUES = [0, 1, 3, 4, 5]


def make_board(shape_cells):
    board = [
        [BASE_VALUES[(x + y * 2) % len(BASE_VALUES)] for x in range(BOARD_SIZE)]
        for y in range(BOARD_SIZE)
    ]
    for x, y in shape_cells:
        board[y][x] = SHAPE_VALUE
    return board


def find_run_segments(board):
    segments = []
    for y in range(BOARD_SIZE):
        start = 0
        for x in range(1, BOARD_SIZE + 1):
            if x == BOARD_SIZE or board[y][x] != board[y][start]:
                if board[y][start] is not None and x - start >= 3:
                    segments.append({
                        "val": board[y][start],
                        "direction": "horizontal",
                        "cells": [(mx, y) for mx in range(start, x)],
                    })
                start = x

    for x in range(BOARD_SIZE):
        start = 0
        for y in range(1, BOARD_SIZE + 1):
            if y == BOARD_SIZE or board[y][x] != board[start][x]:
                if board[start][x] is not None and y - start >= 3:
                    segments.append({
                        "val": board[start][x],
                        "direction": "vertical",
                        "cells": [(x, my) for my in range(start, y)],
                    })
                start = y
    return segments


def matches(board):
    segments = find_run_segments(board)
    parents = list(range(len(segments)))

    def find(index):
        if parents[index] != index:
            parents[index] = find(parents[index])
        return parents[index]

    def union(a, b):
        root_a = find(a)
        root_b = find(b)
        if root_a != root_b:
            parents[root_b] = root_a

    owners_by_cell = {}
    for index, segment in enumerate(segments):
        for cell in segment["cells"]:
            owners = owners_by_cell.setdefault(cell, [])
            for owner in owners:
                union(index, owner)
            owners.append(index)

    groups = {}
    for index, segment in enumerate(segments):
        root = find(index)
        group = groups.setdefault(root, {
            "val": segment["val"],
            "cells": set(),
            "runs": [],
        })
        group["cells"].update(segment["cells"])
        group["runs"].append(segment)

    found = []
    for group in groups.values():
        cells = sorted(group["cells"], key=lambda cell: (cell[1], cell[0]))
        found.append({
            "val": group["val"],
            "cells": cells,
            "len": len(cells),
            "runs": group["runs"],
            "shape": classify_shape(cells, group["runs"]),
        })
    return sorted(found, key=lambda match: match["len"], reverse=True)


def classify_shape(cells, runs):
    horizontal = [run for run in runs if run["direction"] == "horizontal"]
    vertical = [run for run in runs if run["direction"] == "vertical"]
    if not horizontal or not vertical:
        return "line"

    cell_set = set(cells)
    intersections = []
    for h_run in horizontal:
        h_cells = set(h_run["cells"])
        for v_run in vertical:
            intersections.extend(cell for cell in v_run["cells"] if cell in h_cells)

    best_arms = 0
    for x, y in intersections:
        arms = sum((
            (x - 1, y) in cell_set,
            (x + 1, y) in cell_set,
            (x, y - 1) in cell_set,
            (x, y + 1) in cell_set,
        ))
        best_arms = max(best_arms, arms)

    if best_arms >= 4:
        return "cross"
    if best_arms == 3:
        return "t"
    return "l"


def assert_single_shape(name, cells, expected_kind):
    found = matches(make_board(cells))
    if len(found) != 1:
        raise SystemExit(f"{name}: expected 1 match, found {len(found)}: {found}")
    match = found[0]
    expected_cells = sorted(cells, key=lambda cell: (cell[1], cell[0]))
    if match["cells"] != expected_cells:
        raise SystemExit(f"{name}: cleared {match['cells']} instead of {expected_cells}")
    if match["shape"] != expected_kind:
        raise SystemExit(f"{name}: classified as {match['shape']} instead of {expected_kind}")


def assert_no_match(name, cells):
    found = matches(make_board(cells))
    if found:
        raise SystemExit(f"{name}: expected no match, found {found}")


def verify_source_hooks():
    html = HTML.read_text()
    required = [
        "function analyzeMatchShape",
        "shapeAuditData",
        "function analyzeBoardSnapshot",
        "Prototype match-shape review hook",
        "Witch's Cross!",
        "Night Garden L-Bloom!",
        "Twin Stem Bloom!",
        "function demoMatchShape",
        "const maxCascades",
        "resolveAnimated({ maxCascades: 1 })",
        "const roundTemplates",
        "function maybeCompleteRound",
        "function demoCompleteBouquet",
        "demoCompleteBtn",
        "Complete Bouquet",
        "shapeBloomBtn",
        "Shape Bloom",
        "vial-meter",
        "data-vial=\"SAP\"",
        "let moves = roundTemplates[0].moves",
        "event.key.toLowerCase() === \"n\"",
        "function seedCurrentTargetMoves",
        "writeTargetLegalMovePatch",
        "function findTargetLegalMove",
        "function nextTargetMoveHint",
        "Next Bouquet",
        "roundCeremony",
        "factionXpFill",
        "apothecary-fill",
    ]
    missing = [needle for needle in required if needle not in html]
    if missing:
        raise SystemExit(f"Missing HTML match-shape hooks: {missing}")


verify_source_hooks()
assert_single_shape("horizontal line", [(1, 1), (2, 1), (3, 1)], "line")
assert_single_shape("vertical line", [(4, 1), (4, 2), (4, 3)], "line")
assert_single_shape("l shape", [(2, 2), (3, 2), (4, 2), (2, 3), (2, 4)], "l")
assert_single_shape("t shape", [(2, 3), (3, 3), (4, 3), (3, 4), (3, 5)], "t")
assert_single_shape("cross shape", [(3, 3), (2, 3), (4, 3), (3, 2), (3, 4)], "cross")
assert_no_match("diagonal-only cluster", [(2, 2), (3, 3), (4, 4)])

print("HTML match-shape regression checks passed.")
