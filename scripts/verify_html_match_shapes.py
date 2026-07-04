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
        "Bouquet Streak",
        "bouquetStreak",
        "bouquetStreakBadge",
        "nextStreakTargetBadge",
        "Next Streak Target",
        "function nextStreakTargetMarkup",
        "STREAK_COIN_BONUS_STEP",
        "STREAK_COIN_BONUS_CAP",
        "function bouquetStreakBonusPercent",
        "function bouquetStreakPayout",
        "function validBouquetStreak",
        "Choose Your Reward",
        "rewardChoicePanel",
        "rewardChoiceState",
        "reward-choice-value",
        "reward-choice-claim",
        "Greenhouse Cuttings",
        "Apothecary Kit",
        "Black Market Favor",
        "function choosePostBouquetReward",
        "function applyDefaultRewardChoice",
        "function validRewardChoiceState",
        "data-reward-choice=\"greenhouse\"",
        "data-reward-choice=\"apothecary\"",
        "data-reward-choice=\"blackMarket\"",
        "Flowerpedia",
        "Flowerpedia unlocked",
        "flowerpediaEntries",
        "flowerpediaLedger",
        "flowerpediaModal",
        "flowerpediaUnlocked",
        "flowerpediaUnlocks",
        "Velvet Funeral",
        "Cursed Thorn Field Note",
        "function unlockFlowerpediaEntry",
        "function renderFlowerpediaLedger",
        "function renderFlowerpediaEntries",
        "function validFlowerpediaUnlocks",
        "FLOWERPEDIA_FIRST_BOUQUET_ID",
        "FLOWERPEDIA_THORN_NOTE_ID",
        "Chapter 1: Midnight Conservatory",
        "Glasshouse Atrium",
        "chapterProgress",
        "chapterOneProgress",
        "chapterRewardsClaimed",
        "chapterRewards",
        "Chapter 1 reward claimed",
        "function maybeClaimChapterOneReward",
        "function renderChapterOneProgress",
        "function chapterOneModalMarkup",
        "function validChapterRewardsClaimed",
        "CHAPTER_ONE_REWARD_ID",
        "The Bouquet Withered",
        "Retry Bouquet",
        "failedBouquetGoals",
        "retryBouquetPrompt",
        "function isBouquetFailed",
        "function failedBouquetCopy",
        "function failedBouquetRitualMessage",
        "function markBouquetFailed",
        "function remainingObjectiveRows",
        "function roundObjectivesComplete",
        "Bouquet Path",
        "bouquetPath",
        "bouquet-path-nodes",
        "data-bouquet-state=\"complete\"",
        "data-bouquet-state=\"current\"",
        "data-bouquet-state=\"locked\"",
        "data-bouquet-state=\"withered\"",
        "function renderBouquetPath",
        "function bouquetPathRoundNumbers",
        "function bouquetPathNodeMarkup",
        "function bouquetPathState",
        "Round 3 Focus",
        "roundThreeFocus",
        "Bloodroot Compact payoff",
        "data-round-three-state=\"tease\"",
        "data-round-three-state=\"next\"",
        "data-round-three-state=\"current\"",
        "data-round-three-state=\"withered\"",
        "data-round-three-state=\"complete\"",
        "function renderRoundThreeFocus",
        "function roundThreeFocusState",
        "function roundThreeFocusCopy",
        "function roundThreePayoffCopy",
        "Round 4 Contract",
        "roundFourPreview",
        "Saint's Night Ledger payoff",
        "Sol Rot Seal",
        "data-round-four-state=\"tease\"",
        "data-round-four-state=\"next\"",
        "data-round-four-state=\"current\"",
        "data-round-four-state=\"withered\"",
        "data-round-four-state=\"complete\"",
        "function renderRoundFourPreview",
        "function roundFourPreviewState",
        "function roundFourPreviewCopy",
        "function roundFourPayoffCopy",
        "Round 5 Grand Bouquet",
        "roundFivePreview",
        "Sub Rosa Grand Bouquet payoff",
        "Sub Rosa Grand Cache",
        "data-round-five-state=\"tease\"",
        "data-round-five-state=\"next\"",
        "data-round-five-state=\"current\"",
        "data-round-five-state=\"withered\"",
        "data-round-five-state=\"complete\"",
        "function renderRoundFivePreview",
        "function roundFivePreviewState",
        "function roundFivePreviewCopy",
        "function roundFivePayoffCopy",
        "Round 6 Encore Loop",
        "roundSixPreview",
        "First Bouquet 2",
        "Round 6 encore payoff",
        "data-round-six-state=\"tease\"",
        "data-round-six-state=\"next\"",
        "data-round-six-state=\"current\"",
        "data-round-six-state=\"withered\"",
        "data-round-six-state=\"complete\"",
        "function renderRoundSixPreview",
        "function roundSixPreviewState",
        "function roundSixPreviewCopy",
        "function roundSixPayoffCopy",
        "Round 7 Thorn Encore",
        "roundSevenPreview",
        "Moonlit Wreath 2",
        "Round 7 encore Cursed Thorn payoff",
        "data-round-seven-state=\"tease\"",
        "data-round-seven-state=\"next\"",
        "data-round-seven-state=\"current\"",
        "data-round-seven-state=\"withered\"",
        "data-round-seven-state=\"complete\"",
        "function renderRoundSevenPreview",
        "function roundSevenPreviewState",
        "function roundSevenPreviewCopy",
        "function roundSevenPayoffCopy",
        "Round 8 Bloodroot Encore",
        "roundEightPreview",
        "Bloodroot Compact 2",
        "Round 8 encore Bloodroot Compact payoff",
        "data-round-eight-state=\"tease\"",
        "data-round-eight-state=\"next\"",
        "data-round-eight-state=\"current\"",
        "data-round-eight-state=\"withered\"",
        "data-round-eight-state=\"complete\"",
        "function renderRoundEightPreview",
        "function roundEightPreviewState",
        "function roundEightPreviewCopy",
        "function roundEightPayoffCopy",
        "Round 9 Ledger Encore",
        "roundNinePreview",
        "Saint's Night Ledger 2",
        "Round 9 encore Saint's Night Ledger payoff",
        "data-round-nine-state=\"tease\"",
        "data-round-nine-state=\"next\"",
        "data-round-nine-state=\"current\"",
        "data-round-nine-state=\"withered\"",
        "data-round-nine-state=\"complete\"",
        "function renderRoundNinePreview",
        "function roundNinePreviewState",
        "function roundNinePreviewCopy",
        "function roundNinePayoffCopy",
        "Round 10 Grand Encore",
        "roundTenPreview",
        "Sub Rosa Grand Bouquet 2",
        "Round 10 encore Sub Rosa Grand Bouquet payoff",
        "data-round-ten-state=\"tease\"",
        "data-round-ten-state=\"next\"",
        "data-round-ten-state=\"current\"",
        "data-round-ten-state=\"withered\"",
        "data-round-ten-state=\"complete\"",
        "function renderRoundTenPreview",
        "function roundTenPreviewState",
        "function roundTenPreviewCopy",
        "function roundTenPayoffCopy",
        "Round 11 First Bouquet Encore",
        "roundElevenPreview",
        "First Bouquet 3",
        "Round 11 encore First Bouquet payoff",
        "data-round-eleven-state=\"tease\"",
        "data-round-eleven-state=\"next\"",
        "data-round-eleven-state=\"current\"",
        "data-round-eleven-state=\"withered\"",
        "data-round-eleven-state=\"complete\"",
        "function renderRoundElevenPreview",
        "function roundElevenPreviewState",
        "function roundElevenPreviewCopy",
        "function roundElevenPayoffCopy",
        "Round 12 Moonlit Wreath Encore",
        "roundTwelvePreview",
        "Moonlit Wreath 3",
        "Round 12 encore Moonlit Wreath payoff",
        "data-round-twelve-state=\"tease\"",
        "data-round-twelve-state=\"next\"",
        "data-round-twelve-state=\"current\"",
        "data-round-twelve-state=\"withered\"",
        "data-round-twelve-state=\"complete\"",
        "function renderRoundTwelvePreview",
        "function roundTwelvePreviewState",
        "function roundTwelvePreviewCopy",
        "function roundTwelvePayoffCopy",
        "Round 13 Bloodroot Compact Encore",
        "roundThirteenPreview",
        "Bloodroot Compact 3",
        "Round 13 encore Bloodroot Compact payoff",
        "data-round-thirteen-state=\"tease\"",
        "data-round-thirteen-state=\"next\"",
        "data-round-thirteen-state=\"current\"",
        "data-round-thirteen-state=\"withered\"",
        "data-round-thirteen-state=\"complete\"",
        "function renderRoundThirteenPreview",
        "function roundThirteenPreviewState",
        "function roundThirteenPreviewCopy",
        "function roundThirteenPayoffCopy",
        "Round 14 Saint's Night Ledger Encore",
        "roundFourteenPreview",
        "Saint's Night Ledger 3",
        "Round 14 encore Saint's Night Ledger payoff",
        "data-round-fourteen-state=\"tease\"",
        "data-round-fourteen-state=\"next\"",
        "data-round-fourteen-state=\"current\"",
        "data-round-fourteen-state=\"withered\"",
        "data-round-fourteen-state=\"complete\"",
        "function renderRoundFourteenPreview",
        "function roundFourteenPreviewState",
        "function roundFourteenPreviewCopy",
        "function roundFourteenPayoffCopy",
        "Round 15 Sub Rosa Grand Bouquet Encore",
        "roundFifteenPreview",
        "Sub Rosa Grand Bouquet 3",
        "Round 15 encore Sub Rosa Grand Bouquet payoff",
        "data-round-fifteen-state=\"tease\"",
        "data-round-fifteen-state=\"next\"",
        "data-round-fifteen-state=\"current\"",
        "data-round-fifteen-state=\"withered\"",
        "data-round-fifteen-state=\"complete\"",
        "function renderRoundFifteenPreview",
        "function roundFifteenPreviewState",
        "function roundFifteenPreviewCopy",
        "function roundFifteenPayoffCopy",
        "shapeBloomBtn",
        "Shape Bloom",
        "Black Candle Vine",
        "function lineRelicForMatch",
        "function queueLineRelicBurst",
        "function lineRelicMessage",
        "line4",
        "Eclipse Seed Rune",
        "function rareSeedRuneForMatch",
        "function queueRareSeedRuneBurst",
        "function rareSeedRuneMessage",
        "line5",
        "seed-rune",
        "Rune-Tended Soil",
        "function plantEclipseSeedRune",
        "data-action=\"plant-eclipse-seed-rune\"",
        "pendingRuneTendedSoil",
        "activeRuneTendedSoil",
        "Pruning Shears",
        "pruningShearsBtn",
        "pruningShearsCount",
        "boosterPanel",
        "function togglePruningShears",
        "function usePruningShears",
        "function queuePruningShearBurst",
        "shears-target",
        "boosters.pruningShears",
        "Moonwater Flask",
        "moonwaterFlaskBtn",
        "moonwaterFlaskCount",
        "function toggleMoonwaterFlask",
        "function useMoonwaterFlask",
        "function moonwaterPatchCells",
        "function shuffleMoonwaterPatch",
        "function queueMoonwaterBurst",
        "moonwater-target",
        "moonwater-area",
        "boosters.moonwaterFlask",
        "Black Candle",
        "blackCandleBtn",
        "blackCandleCount",
        "blackCandleModes",
        "blackCandleAxis",
        "function toggleBlackCandle",
        "function useBlackCandle",
        "function blackCandleLineCells",
        "function refillBlackCandleLine",
        "function queueBlackCandleBurst",
        "black-candle-line",
        "boosters.blackCandle",
        "Grave Soil",
        "graveSoilBtn",
        "graveSoilCount",
        "graveSoilCells",
        "function toggleGraveSoil",
        "function useGraveSoil",
        "function queueGraveSoilBurst",
        "function graveSoilRelicForMatch",
        "function isGraveSoilEligible",
        "grave-soil-target",
        "grave-soil-ready",
        "boosters.graveSoil",
        "activeBooster",
        "Cursed Thorn",
        "thornGoal",
        "cursed-thorn-overlay",
        "thorn-teach",
        "thorn-teach-marker",
        "thornObjectiveHint",
        "Match beside Cursed Thorns",
        "Cursed Thorn lesson",
        "function seedRoundTwoThornTeachingMove",
        "function roundTwoThornTeachingSwap",
        "function hasRoundTwoThornTeachingMove",
        "function cellsTouchCursedThorn",
        "function damageAdjacentThorns",
        "function thornDamageMessage",
        "shapeDiscoveryHint",
        "L/T/cross = Shape Bloom",
        "function shapeDiscoveryHintMarkup",
        "function patternDiscoveryCopy",
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
assert_single_shape("four line relic", [(2, 3), (3, 3), (4, 3), (5, 3)], "line")
assert_single_shape("five line seed rune", [(1, 3), (2, 3), (3, 3), (4, 3), (5, 3)], "line")
assert_single_shape("l shape", [(2, 2), (3, 2), (4, 2), (2, 3), (2, 4)], "l")
assert_single_shape("t shape", [(2, 3), (3, 3), (4, 3), (3, 4), (3, 5)], "t")
assert_single_shape("cross shape", [(3, 3), (2, 3), (4, 3), (3, 2), (3, 4)], "cross")
assert_no_match("diagonal-only cluster", [(2, 2), (3, 3), (4, 4)])

print("HTML match-shape regression checks passed.")
