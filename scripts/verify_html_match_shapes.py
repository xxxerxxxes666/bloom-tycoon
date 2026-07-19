from pathlib import Path
import re
import zlib


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "playable" / "midnight_bloom_prototype.html"
BOARD_SIZE = 8
SHAPE_VALUE = 2
BASE_VALUES = [0, 1, 3, 4, 5]
ALTAR_TILE_ASSETS = [
    "assets/tiles/96/withered_sun_medallion.png",
    "assets/tiles/96/bone_white_thorn_star.png",
    "assets/tiles/96/purple_nightshade_bloom.png",
    "assets/tiles/96/bloodroot_ruby_shard.png",
    "assets/tiles/96/amber_resin_seed.png",
    "assets/tiles/96/crimson_rose_rune.png",
    "assets/tiles/48/withered_sun_medallion.png",
    "assets/tiles/48/bone_white_thorn_star.png",
    "assets/tiles/48/purple_nightshade_bloom.png",
    "assets/tiles/48/bloodroot_ruby_shard.png",
    "assets/tiles/48/amber_resin_seed.png",
    "assets/tiles/48/crimson_rose_rune.png",
    "assets/tiles/altar/cursed_thorn_seal.svg",
]
FLOWER_TILE_PNGS = [asset for asset in ALTAR_TILE_ASSETS if asset.endswith(".png")]


def make_board(shape_cells):
    board = [
        [BASE_VALUES[(x + y * 2) % len(BASE_VALUES)] for x in range(BOARD_SIZE)]
        for y in range(BOARD_SIZE)
    ]
    for x, y in shape_cells:
        board[y][x] = SHAPE_VALUE
    return board


def png_dimensions(path):
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"Tile asset is not a PNG: {path}")
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def png_alpha_stats(path):
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"Tile asset is not a PNG: {path}")

    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    bit_depth = data[24]
    color_type = data[25]
    if bit_depth != 8 or color_type != 6:
        raise SystemExit(
            f"Tile asset must be 8-bit RGBA PNG: {path} "
            f"(bit depth {bit_depth}, color type {color_type})"
        )

    offset = 8
    idat = bytearray()
    while offset < len(data):
        length = int.from_bytes(data[offset:offset + 4], "big")
        chunk_type = data[offset + 4:offset + 8]
        chunk_data = data[offset + 8:offset + 8 + length]
        if chunk_type == b"IDAT":
            idat.extend(chunk_data)
        elif chunk_type == b"IEND":
            break
        offset += 12 + length

    raw = zlib.decompress(bytes(idat))
    stride = width * 4
    rows = []
    previous = [0] * stride
    cursor = 0
    for _ in range(height):
        filter_type = raw[cursor]
        cursor += 1
        scanline = list(raw[cursor:cursor + stride])
        cursor += stride
        reconstructed = [0] * stride
        for i, value in enumerate(scanline):
            left = reconstructed[i - 4] if i >= 4 else 0
            up = previous[i]
            up_left = previous[i - 4] if i >= 4 else 0
            if filter_type == 0:
                prediction = 0
            elif filter_type == 1:
                prediction = left
            elif filter_type == 2:
                prediction = up
            elif filter_type == 3:
                prediction = (left + up) // 2
            elif filter_type == 4:
                pa = abs(up - up_left)
                pb = abs(left - up_left)
                pc = abs(left + up - (2 * up_left))
                prediction = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
            else:
                raise SystemExit(f"Unsupported PNG filter {filter_type}: {path}")
            reconstructed[i] = (value + prediction) & 0xFF
        rows.append(reconstructed)
        previous = reconstructed

    alpha_values = [rows[y][(x * 4) + 3] for y in range(height) for x in range(width)]
    corners = [
        rows[0][3],
        rows[0][((width - 1) * 4) + 3],
        rows[height - 1][3],
        rows[height - 1][((width - 1) * 4) + 3],
    ]
    return {
        "visible": sum(1 for alpha in alpha_values if alpha > 32),
        "solid": sum(1 for alpha in alpha_values if alpha > 220),
        "corners": corners,
    }


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
        "QA match-shape review",
        "Witch's Cross!",
        "Night Garden L-Bloom!",
        "Twin Stem Bloom!",
        "function installLocalReviewHooks",
        "window.__bloomDeadBoardRecoveryFixture = (options = {}) => {",
        "function matchShapeForReview",
        "const maxCascades",
        "resolveAnimated({ maxCascades: 1 })",
        "const roundTemplates",
        "const FOCUSED_LEVEL_COUNT = 3",
        "Math.min(FOCUSED_LEVEL_COUNT, Math.max(1, Number(roundNumber) || 1))",
        "function maybeCompleteRound",
        "function resolvingMoveWillFail(plan = activeRoundPlan())",
        "function completeBouquetForReview",
        "function supremeBloomForReview",
        "const QA_REVIEW_HOOKS_ENABLED",
        "new URLSearchParams(window.location.search).get(\"bloomReview\") === \"1\"",
        "window.__bloomReviewHooksEnabled = QA_REVIEW_HOOKS_ENABLED",
        "(() => {",
        "})();",
        "round-one-active",
        "body.round-one-active:not(.first-move-made) #shuffleBtn",
        "firstSwapCue",
        "Swap the glowing pair",
        "swap-path-arrow",
        "function renderFirstSwapArrow(boardEl)",
        "renderFirstSwapArrow(boardEl);",
        "swap-arrow-pulse",
        "function boardGuideTransientStateActive()",
        "function currentTutorialBoardGuidePair()",
        "black-candle-activation",
        "guideEl.dataset.stage",
        "currentRound === 1 && !roundComplete && (tutorialActive || tutorialSkipped)",
        "round-one-black-candle-cue",
        "Make 4 Bone Stars - arm Black Candle Vine.",
        "Black Candle Vine armed.",
        "function lineRelicGuidance(relic = armedLineRelic)",
        "Swap Black Candle Vine ${direction} - burn this ${lane}.",
        "line-relic-guidance",
        "line-relic-lane-preview",
        "line-relic-destination",
        "round-one-followup-cue",
        "Keep matching - swap the glowing pair.",
        "round-one-refused",
        "Swap the glowing pair to open the next harvest.",
        "const continuingRefusal = Boolean(invalidSwapTimer)",
        "invalidSwapReturnCue",
        "invalidSwapReturnHintCells",
        "function retireCompletedInteractionFeedback()",
        "const target = { x, y };\n      retireCompletedInteractionFeedback();",
        "interactionFeedbackGeneration",
        "harvestFlashClearTimer",
        "orderPulseTimer",
        '".objective-flight, .bouquet-bind-seal, .greenhouse-intake-flight"',
        "first-swap-cue::before",
        "GLYPH GUIDE",
        "BLACK CANDLE",
        'icon.textContent = refusedTutorial ? "NO BLOOM" : namedBlackCandle ? "BLACK CANDLE" : "✦"',
        'panel.classList.toggle("black-candle-tutorial", namedBlackCandle)',
        "const namedBlackCandle = tutorialActive && Boolean(armedLineRelic) && !refusedTutorial;",
        "allowPartialProgress: Boolean(activatingRelic)",
        "queuePostRenderFocus(`tile-${boardFocusCell.x}-${boardFocusCell.y}`);",
        ".tutorial-panel.black-candle-tutorial .tutorial-icon,",
        'content:"BLACK CANDLE"!important',
        "body.focused-active-play.armed-line-relic-cue .first-swap-cue {",
        "body.round-one-active.round-one-black-candle-cue .first-swap-cue { position:relative; z-index:12; }",
        "moves-counter",
        ".moves-counter.moves-low",
        ".moves-counter.moves-last",
        "move-decrement-pulse",
        "last-move-decrement-pulse",
        "LAST MOVE · 1",
        "function clearMoveUrgencyPulse()",
        "function pulseMoveUrgency()",
        'aria-live="${moveUrgencyPulseActive && lowMoves ? "polite" : "off"}"',
        "body.round-one-active .objective-target",
        "function firstSwapCueText(a, b)",
        "function primeFocusedFirstMoveHint",
        "Crack the marked thorns",
        "cursed_thorn_seal.svg",
        "function thornSealMarkup",
        "cursed-thorn-art",
        "thorn-root",
        "thorn-art-shatter",
        "thorn-lesson-active",
        "function focusedRoundTwoHarvestSummary(result)",
        "isFirstValidMove && currentRound === 1",
        ".map((target) => `+${result.gained[target.flowerId]} ${flowers[target.flowerId][0]}`)",
        "Follow the glow.",
        "isRestoredNextOrderFocus()",
        "isPostOnboardingIdleHintActive()",
        "postRecoveryGuideActive",
        "RESTORED_ROUND_TWO_GUIDE_LIMIT",
        "let restoredRoundTwoGuideMoves = 0",
        "function isRestoredRoundTwoWindow()",
        "function isRestoredRoundTwoGuideActive()",
        "function isRestoredRoundTwoOpeningBudgetActive()",
        "function isPostOnboardingIdleHintActive(plan = activeRoundPlan())",
        "round-two-followup-cue",
        "NEXT BLOOM",
        "${flowers[remainingTarget.flowerId][0]} next ${direction}",
        "const postOnboardingIdleHint = isPostOnboardingIdleHintActive();",
        "restoredRoundTwoGuideMoves >= RESTORED_ROUND_TWO_GUIDE_LIMIT",
        "const reachedRestoredGuideLimit = roundTwoOpeningBudgetActive",
        "isRestoredRoundTwoGuideActive()",
        "body.focused-active-play:not(.round-one-active) .tile.idle-hint",
        "? 650",
        "swap-snap",
        "activeSwapCells",
        "valid-swap",
        "let validSwapCells = new Set()",
        "function clearTransientGameFeel()",
        '".objective-flight, .bouquet-bind-seal, .greenhouse-intake-flight"',
        "const launchRound = currentRound;",
        "if (currentRound !== launchRound || interactionFeedbackGeneration !== launchGeneration)",
        "<strong>First bloom!</strong> Your bouquet is already taking shape.",
        "Keep the authored opening three-match from randomly extending",
        "board[originY][originX + 3] = fillerB;",
        "board[originY + 2][originX + 1] = fillerD;",
        "board[originY][originX - 1] = fillerC;",
        "const authoredRoundOneLesson = currentRound === 1",
        "maxCascades: 1, quietReseed: true, playerSwap",
        "const ALTAR_DRIFT_FOCUSED_BAITS = 1",
        "function prepareAltarDriftRefill(options = {})",
        "function seedAltarDriftCascade()",
        "const guidedRoundTwoLesson = isAuthoritativeRoundTwoThornLesson()",
        "&& previewSwapMatches(source, target).some((match) => cellsTouchCursedThorn(match.cells));",
        "restoredRoundTwoGuideMoves + 1",
        "clearThornTeachingCue(false);",
        "concludeTutorial();",
        "maxCascades: 1, quietReseed: true, suppressAltarDrift: true, playerSwap",
        "options.suppressAltarDrift",
        "function finishResolve(result, options = {})",
        "const ALTAR_REWEAVE_MS = 720",
        "const ALTAR_REWEAVE_REDUCED_MS = 520",
        "function ensurePlayableBoardAfterCascade()",
        "function objectiveUsefulRecoveryMove(plan = activeRoundPlan())",
        "function primePostRecoveryGuide()",
        "async function presentAltarReweave()",
        "result.deadBoardRecovered = recovery.deadBoard",
        "saveProgress({ allowDuringResolve: true })",
        "No moves — altar reweaving.",
        "Path restored — crack a Cursed Thorn",
        "altar-reweave-veil",
        "body.altar-reweave-active .board .tile",
        "body.post-recovery-guide.armed-line-relic-cue",
        'document.body.dataset.altarReweavePhase = altarReweaveActive',
        'boardEl.dataset.reweaveSequence = String(altarReweaveSequence)',
        "function launchObjectiveFlights(gained, gainedCells = [])",
        "function visibleGreenhouseIntakeTarget()",
        "$(\"restoredGreenhouseStatus\")",
        "$(\"mobileRestorationDial\")",
        "const targetEl = visibleGreenhouseIntakeTarget();",
        "will-change: transform, opacity;",
        "function queueBouquetBindingSeal",
        "bouquet-bind-seal",
        ".bouquet-bind-seal { width:44px; min-height:28px;",
        "objective-target-fill",
        "function liveBouquetAssemblyMarkup",
        "function craftedBouquetEntries",
        "function liveBouquetAssemblyState",
        "data-slot-progress",
        "--ingredient-visual-progress",
        "slot.slotProgress > 0 && slot.slotProgress < 1",
        "live-bouquet-stem",
        "live-bouquet-bloom",
        "function craftedBouquetMarkup",
        "const CRAFTED_BOUQUET_BLOOM_COUNT = 6;",
        'data-crafted-bloom-count="${entries.length}"',
        "id=\"liveBouquetAssembly\"",
        "bouquet-assembly-ring",
        "crafted-bloom-bind",
        "trophy.dataset.assemblyState = bouquetSealPulseActive ? \"forming\" : \"assembled\";",
        "crafted-vine",
        "dataset.assemblyReady",
        "objective-target-seal",
        'const completeClass = thornGoalComplete(plan) ? "complete" : "";',
        "Cursed Thorn goal sealed, ${progress} of ${needed} cleared",
        'data-thorn-objective="true" aria-label="${stateLabel}"',
        "body.focused-active-play.post-recovery-guide .first-swap-cue",
        "body.focused-active-play .objective:not(.compact-objective) .objective-target",
        "restoration-veil",
        "restoration-cracks",
        "restoration-root-web",
        "restoration-glass-rays",
        "restoration-coin-stream",
        "restoration-before-label",
        "restoration-after-label",
        "restoration-coin-into-glass",
        "Thorn Rose and Bone Star are bound; spend 100 to relight the greenhouse.",
        "Earned ${roundOnePlan.reward.coins} coins. Restore costs ${FIRST_GREENHOUSE_RESTORE_COST}.",
        "Restored for ${FIRST_GREENHOUSE_RESTORE_COST}. ${coins} coins remain.",
        "const FOCUSED_ECONOMY_SAVE_VERSION = 2;",
        "function focusedEconomyBalanceForProgress()",
        "focusedEconomyVersion: FOCUSED_ECONOMY_SAVE_VERSION",
        "savedFocusedEconomyVersion < FOCUSED_ECONOMY_SAVE_VERSION",
        "Accepted swaps render several animated frames; only settled states are authoritative.",
        'if (typeof localStorage === "undefined" || (isResolving && !options.allowDuringResolve))',
        "if (roundComplete && focusedSliceRound())",
        "queuePostRenderFocus(focusedPayoffPrimaryButtonId());",
        "Raised for ${BLOODROOT_CONSERVATORY_COST}. ${coins} coins remain.",
        "Begin a new growing cycle with your balance intact.",
        "Greenhouse Renewal · First Bouquet · ${coins} coins carried forward",
        "function firstFocusedCycleClosingBalance()",
        "function isOwnedRestorationReplay()",
        "Reward added · +${plan.reward.coins} coins · ${coins} coins balance.",
        "function isPostOnboardingIdleHintActive(plan = activeRoundPlan())",
        "plan.round >= 2",
        "const usefulMove = postOnboardingIdleHintAfterDelay",
        "objectiveUsefulIdleMove(plan)",
        "restartPostOnboardingHint",
        "Permanent through replay",
        "Owned: Conservatory Raised",
        "BLOODROOT CONSERVATORY · OWNED · 100% RAISED",
        'panel.dataset.payoffMode = ceremony.ownedReplay ? "owned-replay" : "restoration";',
        'panel.classList.toggle("owned-replay", ceremony.ownedReplay);',
        "Owned Bloodroot Conservatory remains fully raised",
        "Order complete. The Bloodroot Conservatory remains fully raised.",
        ".round-one-restoration.owned-replay .greenhouse-art-withered",
        ".round-one-restoration.owned-replay .greenhouse-art-restored",
        "id=\"ownedReplayRenewal\"",
        "function ownedReplayPresentationPhase",
        "function ownedReplayRenewalMarkup",
        "craftedBouquetEntries(plan).map((target, index) =>",
        "function startOwnedReplayRenewal",
        "function settleOwnedReplayRenewal",
        "window.setTimeout(settleOwnedReplayRenewal, 520)",
        "}, 660);",
        "prefersReducedMotion() ? 40 : 820",
        'panel.dataset.ownedRenewalPhase = ceremony.ownedReplay ? ownedRenewalPhase || "settled" : "";',
        '"CONSERVATORY NOURISHED · REMAINS 100% RAISED"',
        ".owned-replay-renewal[data-renewal-phase=\"transfer\"] .owned-renewal-ingredient",
        ".owned-replay-renewal[data-renewal-phase=\"renewal\"] .owned-renewal-response",
        "${ownedStage} already owned.",
        "Next Order → Moonlit Wreath",
        "greenhouse-upgrade-ladder",
        "function renderGreenhouseUpgradeLadders()",
        "Bloodroot Conservatory",
        "body.restored-next-order-focus .greenhouse-order-ladder { display:none; }",
        "body.restored-next-order-focus:not(.restored-greenhouse-handoff) .restored-greenhouse-status { display:none; }",
        "document.body.classList.toggle(\"restored-next-order-focus\", isRestoredRoundTwoWindow() || failedFocusedRestoredOrder);",
        "document.body.classList.toggle(\"restored-next-order-guide\", isRestoredNextOrderFocus());",
        "const preserveCompletedRoundTwoGuide = retryingFailedBouquet",
        "if (!preserveCompletedRoundTwoGuide)",
        "display: grid;\n        grid-template-columns: repeat(4, minmax(0, 1fr));",
        "thornGoalComplete(plan) || isAuthoritativeRoundTwoThornLesson()",
        "calc(100vh - 262px)",
        "objective-goal-joiner",
        "clip-path: inset(50%);",
        "order-fill",
        "style=\"--target-pct:${pct}%\"",
        "style=\"--order-pct:${pct}%\"",
        "gainedCells: flowers.map(() => [])",
        "pulseOrderCounts(result.gained, result.gainedCells)",
        "const originX = boardRect.left + ((origin[0] + 0.5) / BOARD_SIZE) * boardRect.width;",
        "objective-flight",
        "objective-target.order-pulse::after",
        "objective-sip",
        "flight.src = flowers[target.flowerId][1]",
        "No bloom — follow the glowing pair.",
        'return "Use the glowing pair.";',
        'icon.textContent = refusedTutorial ? "NO BLOOM" : namedBlackCandle ? "BLACK CANDLE" : "✦"',
        'panel.classList.toggle("refused-tutorial", refusedTutorial)',
        ".tutorial-panel.refused-tutorial {",
        "function isAuthoritativeRoundTwoThornLesson",
        "function restoreAuthoritativeRoundTwoThornLesson",
        "if (isRoundTwoThornLessonEligible({ allowPartialProgress: true }))",
        "allowPartialProgress: true",
        "if (replay) {\n        restoreAuthoritativeRoundTwoThornLesson();\n        queuePostRenderFocus(\"tutorialSkipBtn\");",
        "const focusedCueActive = (currentRound === 1 || isRestoredNextOrderFocus() || authoritativeThornLesson || postRecoveryGuideActive)",
        "if (!authoritativeLesson && window.setTimeout)",
        "swap-refused",
        "cue.textContent = returnCue",
        "idleHintCells = new Set(returnHintCells)",
        "invalidSwapReturnHintCells.clear()",
        "function shouldPreserveSelectedHintPair",
        "(currentRound === 1 && tutorialActive)",
        "const selectedHintPair = new Set(idleHintCells);",
        "idleHintCells = selectedHintPair;",
        "body.focused-slice-failed #shuffleBtn",
        "body.focused-slice-failed #renewBtn.visible",
        "function finishTileSwipe(start, event, x, y)",
        "SWIPE_THRESHOLD",
        "touchSwipeStart",
        "suppressNextBoardClick",
        "function boardTileFromEvent(event)",
        "function boardTileFromPoint(clientX, clientY)",
        "function handleBoardPointerDown(event)",
        "$(\"board\").addEventListener(\"pointerdown\", handleBoardPointerDown)",
        "function handleBoardTouchStart(event)",
        "function handleBoardTouchEnd(event)",
        "$(\"board\").addEventListener(\"touchstart\", handleBoardTouchStart, { passive: true })",
        "$(\"board\").addEventListener(\"touchend\", handleBoardTouchEnd, { passive: false })",
        "$(\"board\").addEventListener(\"click\", handleBoardClick)",
        "if (suppressNextBoardClick)",
        "tile.setPointerCapture(event.pointerId)",
        "function pulseHaptic(pattern)",
        "pulseHaptic(18)",
        "pulseHaptic([10, 35, 18])",
        "let bloomAudioContext = null",
        "let bloomAudioMaster = null",
        "let bloomSoundscape = null",
        "let bloomAudioVoiceCount = 0",
        "let bloomAudioEvents = []",
        "function recordBloomAudioEvent(kind, detail = {})",
        "function bloomStageScale(stageKey = activeGreenhouseStageKey())",
        "function bloomScaleTone(index, octave = 1, stageKey = activeGreenhouseStageKey())",
        "function duckBloomSoundscape(depth = 0.45, duration = 0.75)",
        "function playBloomChord(frequencies, startOffset, duration",
        "function playBloomRitualPulse(startOffset, strength = 1",
        "window.__bloomAudioProbe = () => ({",
        "function bloomAudioCtx()",
        "function setupBloomAudioGraph(ctx)",
        "function soundscapeSettings(stageKey = bloomAudioStageKey)",
        "function ensureBloomSoundscape()",
        "function updateBloomSoundscapeStage(stageKey",
        "playBloomNoise(0, 0.085 + cascade * 0.02",
        "bloomAudioVoiceCount += 1",
        "recordBloomAudioEvent(kind, detail)",
        "updateBloomSoundscapeStage(activeGreenhouseStageKey())",
        "function playBloomTone(frequency, startOffset, duration, gain = 0.028, type = \"sine\", options = {})",
        "function playBloomSound(kind, detail = {})",
        "playBloomSound(\"swap\")",
        "playBloomSound(\"invalid\")",
        ".tile.invalid-swap::after",
        "const INVALID_SWAP_FEEDBACK_MS = 1120",
        "const invalidFeedback = invalidSwapCells.get",
        "resetPostOnboardingHintAfterRefusal",
        "invalidSwapTimer = window.setTimeout",
        'tile.style.setProperty("--invalid-x"',
        "@keyframes invalid-swap-mark",
        "playBloomSound(\"match\", {",
        "cleared: wave.clearCells.length",
        "shape: Boolean(wave.strongestShape)",
        "flowerId: board[wave.clearCells[0]?.[1]]?.[wave.clearCells[0]?.[0]]",
        "playBloomSound(\"complete\")",
        "playBloomSound(retryingFailedBouquet ? \"retry\" : \"handoff\")",
        "playBloomSound(\"handoff\")",
        "playBloomSound(\"restore\")",
        "let swapGlideCells = new Map()",
        "function markSwapGlide(a, b)",
        "function clearSwapGlide()",
        "swap-glide",
        "@keyframes swap-glide",
        "function previewSwapMatches",
        "function selectedHarvestPreviewFor",
        "const harvestPreview = selectedHarvestPreviewFor(selected)",
        "match-preview",
        "match-preview-anchor",
        "relic-preview",
        "in selected harvest preview",
        "Black Candle Vine lane preview",
        "--tile-color",
        ".tile.match-preview-anchor::after",
        "harvest-ready-glow",
        "let currentCascadeWave = 0",
        "let lastSettledCascadeCount = 0",
        "function queueCascadeImpact(wave, cascadeIndex = 0)",
        "wave.thornFeedbackCount = adjacentThornKeys.size",
        "const thornOutcomesOwnNarration = (wave.thornFeedbackCount || 0) > 1",
        "if (!wave.createdLineRelic && !thornOutcomesOwnNarration)",
        "const preservedLineRelic = normalizeArmedLineRelic(armedLineRelic)",
        "board[preservedLineRelic.y][preservedLineRelic.x] = preservedLineRelic.flowerId",
        "function queueSettleSparks(cascadeIndex = 0)",
        "const visibleResourceCells = new Set(dedupeCells(rewardCells)",
        "visibleResourceCells.has(`${x},${y}`)",
        "cascade-ring",
        "impact-sigil",
        'text: cascadeIndex > 0 ? `x${cascadeIndex + 1}` : "HIT"',
        "cascade-vein",
        ".sort((a, b) => (b.cells.length - a.cells.length))[0]",
        "delay: 42",
        "matchRuns",
        "settle-spark",
        "playBloomSound(\"settle\"",
        "cascade-wave-label",
        "boardEl.dataset.cascadeWave",
        "boardEl.dataset.lastCascadeCount",
        "scheduleBoardParticleClear(result.cascades)",
        "const WILD_CHAIN_CASCADE_BONUS",
        "function applyWildChainBonus",
        "function queueWildChainPayoff",
        "function wildChainMessage",
        "wild-chain-banner",
        "boardEl.dataset.lastWildChainBonus",
        "chain-payoff",
        "Wild Chain x${result.wildChain.cascades}",
        "@keyframes cascade-ring",
        "@keyframes impact-sigil-bloom",
        "@keyframes cascade-vein-strike",
        "thorn-event",
        "thorn-event-stamp",
        "line-relic-arming",
        "thorn-event.offset-left-up",
        "thorn-shock",
        "@keyframes thorn-shock",
        "${thornHitClass ? `<span class=\"thorn-event ${thornEventOffsetClass}\">${thornClearedClass ? \"BREAK\" : \"CRACK\"}</span>` : \"\"}",
        "@keyframes wild-chain-banner",
        ".board.chain-payoff",
        ".board-particle.chain-lash",
        "coins total",
        "bonus coins included",
        "data-flower-id",
        "occult_altar_socket.svg",
        "--board-stage-glow",
        "body[data-active-greenhouse-stage=\"moonlit\"] .board",
        "body[data-active-greenhouse-stage=\"bloodroot\"] .board",
        "roundOneRestoration",
        "coin-payoff",
        "coin-payoff-flight",
        "id=\"coinPayoff\"",
        "id=\"bouquetTrophy\"",
        "data-bouquet-payoff-state=\"sealed\"",
        "function renderBouquetTrophy",
        "function pulseBouquetSealFeedback()",
        "function pulseNextOrderReady()",
        "bouquet-sealed",
        "next-order-ready",
        "bouquet-trophy",
        "grid-template-columns:repeat(2,minmax(0,1fr))",
        "white-space:nowrap",
        "Bouquet Bound",
        "Greenhouse Relit",
        "Bloodroot and Sol Rot seal the conservatory run.",
        "restoration-awakening",
        "restoration-flare",
        "restoration-spark-field",
        "restored-glass-reveal",
        "withered-glass-fall",
        "panel.classList.add(\"restoration-awakening\")",
        "greenhouse-awakening",
        "first_greenhouse_withered.jpg",
        "first_greenhouse_restored.jpg",
        "moonlit_wreath_greenhouse.jpg",
        "bloodroot_compact_greenhouse.jpg",
        "greenhouse-art-withered",
        "greenhouse-art-restored",
        "const greenhouseArtwork = {",
        "function applyGreenhouseArtwork(stageKey)",
        "scene.dataset.greenhouseArt = stageKey",
        "const BLOODROOT_CONSERVATORY_COST = 180",
        "let roundThreeConservatoryRaised = false",
        "roundThreeConservatoryRaised,",
        "roundThreeConservatoryRaised = Boolean(state.roundThreeConservatoryRaised || currentRound > 3)",
        "const roundThreeFinalPending = currentRound === 3 && roundComplete && !roundThreeConservatoryRaised;",
        "const roundThreeFinalPayoff = roundThreeFinalPending || roundThreeFinalComplete;",
        "applyGreenhouseArtwork(payoffCeremony.artKey)",
        "round-three-final-pending",
        "BLOODROOT CONSERVATORY READY",
        "Raise Conservatory · ${BLOODROOT_CONSERVATORY_COST} coins",
        "function raiseRoundThreeConservatory()",
        "roundThreeConservatoryRaised = true;",
        "Spend the Bloodroot payout to raise the conservatory.",
        "active-greenhouse-stage",
        "id=\"activeGreenhouseStage\"",
        "const activeGreenhouseStages = {",
        "restored: {",
        "function activeGreenhouseStageKey()",
        "function applyActiveGreenhouseStage(stageKey)",
        "document.body.dataset.activeGreenhouseStage = stageKey",
        "main.dataset.stageLabel = stage.shortLabel",
        "--active-greenhouse-image",
        "content:attr(data-stage-label)",
        "var(--active-greenhouse-image, url(\"../assets/greenhouse/first_greenhouse_withered.jpg\")) center / cover no-repeat",
        "var(--active-greenhouse-image, url(\"../assets/greenhouse/first_greenhouse_withered.jpg\")) center bottom / cover no-repeat",
        "applyActiveGreenhouseStage(activeGreenhouseStageKey())",
        "body.round-one-active .active-greenhouse-stage",
        "body.restored-next-order-focus .active-greenhouse-stage",
        "body.restored-next-order-focus .active-greenhouse-badge",
        "body.round-one-active .hero::before",
        "hero-greenhouse-depth",
        "active-greenhouse-depth",
        "greenhouse-rib",
        "greenhouse-lamp",
        "greenhouse-vine",
        "greenhouse-bed",
        "greenhouse-mist",
        "greenhouse-revival-light",
        "greenhouse-revival-vines",
        "greenhouse-revival-sigil",
        "function greenhouseOwnedStage()",
        "function greenhouseOwnedProgress()",
        "function applyActiveGreenhouseRevival()",
        "document.body.dataset.greenhouseRevivalTier = String(tier)",
        "data-greenhouse-revival-tier",
        "--greenhouse-revival-pct",
        "--greenhouse-revival-alpha",
        "greenhouse-restoration-dial",
        "id=\"heroRestorationDial\"",
        "id=\"mobileRestorationDial\"",
        "function renderGreenhouseRestorationDial",
        "function greenhouseDialPhase",
        "dial.dataset.ownedStage",
        "restoration-owned-note",
        "--dial-pct",
        "function pulseActiveGreenhouseIntake()",
        "body.greenhouse-intake .greenhouse-revival-light",
        "body.greenhouse-intake .greenhouse-restoration-dial",
        "pulseActiveGreenhouseIntake();",
        "mobile-greenhouse-plinth",
        "mobilePlinth.dataset.stageLabel = stage.shortLabel",
        "body[data-active-greenhouse-stage=\"restored\"]",
        "body[data-active-greenhouse-stage=\"moonlit\"]",
        "body[data-active-greenhouse-stage=\"bloodroot\"]",
        "@keyframes greenhouse-mist-drift",
        "@media (prefers-reduced-motion: reduce)",
        "body.round-one-active.round-one-complete .objective",
        "body.round-one-active.round-one-complete .active-greenhouse-stage",
        "body.round-one-active.round-one-complete .left",
        "body.round-one-active.round-one-complete .bouquet-bind-seal",
        "body.round-one-active.round-one-complete .ritual-log { display:none; }",
        "let coins = 0",
        'id="coinBalance"',
        'id="coins"',
        "function pulseCoinBalance()",
        'coinBalanceEl.dataset.balance = String(coins)',
        "function completionCoinPayout",
        "function focusedSliceCompletionMessage",
        "function focusedPayoffCeremony()",
        "function renderFocusedPayoffCeremony(ceremony)",
        "payoff-transaction",
        "id=\"payoffTransaction\"",
        "First Bouquet Complete",
        "Greenhouse Restored",
        "Moonlit Wreath Complete",
        "Bloodroot Compact Complete",
        "Earned ${roundOnePlan.reward.coins} coins. Restore costs ${FIRST_GREENHOUSE_RESTORE_COST}.",
        "Earned ${roundTwoPlan.reward.coins} coins. Upgrade costs ${MOONLIT_GREENHOUSE_UPGRADE_COST}.",
        "Earned ${roundThreePlan.reward.coins} coins. Conservatory costs ${BLOODROOT_CONSERVATORY_COST}.",
        "coins} coins remain.",
        "panel.dataset.payoffPrimary = ceremony.primary",
        "$(\"restoreGreenhouseBtn\").hidden = ceremony.primary !== \"spend\"",
        "$(\"nextOrderBtn\").hidden = ceremony.primary !== \"next\"",
        "roundComplete && focusedSliceRound(plan)",
        "MOONLIT_GREENHOUSE_UPGRADE_COST",
        "let roundTwoGreenhouseUpgraded = false",
        "round-two-upgrade-pending",
        "function upgradeRoundTwoGreenhouse()",
        "function advanceGreenhouseUpgrade()",
        "Upgrade Greenhouse · ${MOONLIT_GREENHOUSE_UPGRADE_COST} coins",
        "Upgrade the greenhouse.",
        "currentRound === 2 && roundComplete && roundOneRestored && !roundTwoGreenhouseUpgraded",
        "roundTwoGreenhouseUpgraded = Boolean(state.roundTwoGreenhouseUpgraded || currentRound > 2)",
        "body.round-two-upgrade-pending .round-one-restoration",
        "round-two-upgrade-complete",
        "focused-slice-failed",
        "body.focused-slice-failed #renewBtn.visible",
        "body.focused-slice-failed #tutorialHelpBtn",
        "second-greenhouse-upgrade",
        "MOONLIT GREENHOUSE UPGRADED",
        "Next Order → Bloodroot Compact",
        "FINAL ORDER",
        "round-three-final-pending",
        "round-three-final-complete",
        "third-greenhouse-finale",
        "BLOODROOT CONSERVATORY RAISED",
        "Play Again → First Bouquet",
        "function replayFocusedSlice",
        "currentRound === 3 && roundComplete",
        "restoration-xp-preview",
        "body.round-one-active.round-one-complete .greenhouse-payoff-ladder",
        "body.round-two-upgrade-pending .restoration-xp-preview",
        "body.round-two-upgrade-pending .greenhouse-payoff-ladder",
        "function restorationGreenhouseXpPreview",
        "Greenhouse +180 XP",
        "greenhouse-payoff-fill",
        "Restore Greenhouse · 100 coins",
        "function restoreRoundOneGreenhouse",
        "nextOrderBtn",
        "Next Order →",
        "roundOneRestored",
        "next-order-cue",
        "Restored Greenhouse · Moonlit Wreath · Match beside thorns",
        "restored-greenhouse-handoff",
        "body.restored-greenhouse-handoff .tutorial-panel { display:none!important; }",
        "function finishRestoredGreenhouseHandoff()",
        "restored-next-order-focus",
        "restored-next-order-guide",
        "restored-greenhouse-status",
        "function renderRestoredGreenhouseStatus",
        "Moonlit Greenhouse",
        "Bloodroot Conservatory",
        "Moonlit order under glass.",
        "Bloodroot under crimson glass.",
        "const failedFocusedRestoredOrder = roundOneRestored",
        "isRestoredRoundTwoWindow() || failedFocusedRestoredOrder",
        "function isRestoredNextOrderFocus",
        "return isRestoredRoundTwoWindow()",
        "if (!(roundOneRestored && currentRound === 2 && !roundComplete))",
        "body.restored-next-order-focus .controls",
        "body.restored-next-order-focus.restored-next-order-guide:not(.restored-greenhouse-handoff):not(.first-move-made) .first-swap-cue",
        "isRestoredRoundTwoGuideActive()",
        "@media (min-width: 761px) and (max-height: 820px)",
        "grid-template-columns: 330px minmax(0, 1fr);",
        "width: min(650px, calc(100vh - 186px), calc(100vw - 470px));",
        "width: min(620px, calc(100vh - 262px), calc(100vw - 470px));",
        "height: calc(100vh - 26px);",
        "body.restored-next-order-focus .restored-greenhouse-meter { display:none; }",
        "font-size: 50px;",
        "font-size: 18px;",
        "width: 38px;",
        "function focusRestoredNextOrderViewport",
        "window.scrollTo({ top: 0, behavior: \"auto\" })",
        "<strong>Moonlit Wreath:</strong> Match beside the glowing Cursed Thorns.",
        "The Bouquet Withered",
        "Retry Bouquet",
        "failedBouquetGoals",
        "retryBouquetPrompt",
        "function isBouquetFailed",
        "function failedBouquetCopy",
        "function failedBouquetRitualMessage",
        "function markBouquetFailed",
        'queuePostRenderFocus("renewBtn");',
        "function remainingObjectiveRows",
        "function roundObjectivesComplete",
        "function focusedOpeningGuideMove",
        "function primeFailedRetryOpeningGuide",
        "Black Candle Vine",
        "function lineRelicForMatch",
        "carriesArmedLineRelic: lineRelicAt({ x, y })",
        "flowerId: tile.value",
        "function queueLineRelicBurst",
        "function lineRelicMessage",
        "line4",
        "Eclipse Seed Rune",
        "function rareSeedRuneForMatch",
        "function queueRareSeedRuneBurst",
        "function rareSeedRuneMessage",
        "function recordRareSeedRunes",
        "line5",
        "seed-rune",
        "Cursed Thorn",
        "thornGoal",
        "cursed-thorn-overlay",
        "thorn-teach",
        "thorn-teach-lane",
        "thorn-teach-blocker",
        "thorn-teach-marker",
        "guided Cursed Thorn swap tile",
        "marked Cursed Thorn target",
        "Cursed Thorn match lane",
        "thornObjectiveHint",
        "Match beside Cursed Thorns",
        "Cursed Thorn lesson",
        "function seedRoundTwoThornTeachingMove",
        "function roundTwoThornTeachingSwap",
        "function roundTwoThornTeachingMoveDetails",
        "function authoritativeRoundTwoThornTeachingMove",
        "function hasRoundTwoThornTeachingMove",
        "function cellsTouchCursedThorn",
        "function damageAdjacentThorns",
        "function thornDamageMessage",
        "vial-meter",
        "data-vial=\"SAP\"",
        "let moves = roundTemplates[0].moves",
        "const key = event.key.toLowerCase()",
        "key === \"n\"",
        "function seedCurrentTargetMoves",
        "writeTargetLegalMovePatch(4, 0, targetIds[1], 4)",
        "function writeTargetLegalMovePatch(originX, originY, flowerId, lineLength = 3)",
        "function seedRoundOneBlackCandleVineLesson",
        "function findTargetLegalMove",
        "function seedFocusedGuideMove",
        "function nextTargetMoveHint",
        "findTargetLegalMove(target.flowerId, targetIndex)",
        "Next Bouquet",
        "roundCeremony",
        "factionXpFill",
        "apothecary-fill",
        "assets/tiles/96/withered_sun_medallion.png",
        "assets/tiles/96/bone_white_thorn_star.png",
        "assets/tiles/96/purple_nightshade_bloom.png",
        "assets/tiles/96/bloodroot_ruby_shard.png",
        "assets/tiles/96/amber_resin_seed.png",
        "assets/tiles/96/crimson_rose_rune.png",
        "const flowerIcon48",
        "const flowerIconSrcset",
        "prepare_reference_flower_tiles.js",
    ]
    retired_required_patterns = [
        r'restoredGreenhouseStatus',
        r'restored-greenhouse',
        r'restoration-xp-preview',
        r'restorationGreenhouseXpPreview',
        r'greenhouse-payoff',
        r'greenhouse-upgrade-ladder',
        r'greenhouse-order-ladder',
        r'renderGreenhouseUpgradeLadders',
        r'renderRestoredGreenhouseStatus',
        r'Greenhouse \+\d+ XP',
        r'vial-meter',
        r'data-vial=',
        r'factionXpFill',
        r'apothecary-fill',
        r'Moonlit order under glass',
        r'Bloodroot under crimson glass',
        r'data-reward-choice=',
        r'Bouquet Path',
        r'BouquetPath',
        r'bouquetPath',
        r'bouquet-path-',
        r'data-bouquet-state=',
        r'renderBouquetPath',
        r'roundThreeFocus',
        r'Round 3 Focus',
        r'Bloodroot Compact payoff',
        r'round[A-Z][A-Za-z]+Preview',
        r'Round (?:[4-9]|[1-5][0-9])\b',
        r'data-round-(?:three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)',
        r'function renderRound[A-Z][A-Za-z]+',
        r'function round[A-Z][A-Za-z]+(?:Preview|Payoff|Focus)',
        r'Moonlit Wreath (?:[2-9]|1[0-2])',
        r'First Bouquet (?:[2-9]|1[0-2])',
        r'Bloodroot Compact (?:[2-9]|1[0-1])',
        r"Saint's Night Ledger",
        r'Sub Rosa Grand Bouquet',
        r'Bouquet Streak',
        r'Next Streak Target',
        r'validBouquetStreak',
        r'Shape Bloom',
        r'shapeDiscoveryHint',
    ]
    required = [
        needle for needle in required
        if not any(re.search(pattern, needle) for pattern in retired_required_patterns)
    ]
    required.extend([
        "id=\"bouquetProgress\"",
        "id=\"bouquetProgressLabel\"",
        "id=\"bouquetProgressNext\"",
        "function updateBouquetProgress",
        "Bouquet ${progress.earned}/${progress.needed} -> +${plan.reward.coins} coins",
        "function compactBouquetConsequenceLabel",
        "Short desktop keeps the full 480px altar",
        "Later-round Help replay keeps its existing tutorial pill",
        "body.round-three-focus-active.tutorial-active .tutorial-panel",
        'queuePostRenderFocus("tutorialSkipBtn")',
        'queuePostRenderFocus("tutorialHelpBtn")',
        "Ready: Restore Glass",
        "Next: Bloodroot Compact",
        "Ready: Raise Conservatory",
        "text-overflow: clip",
        "white-space: normal",
        "id=\"tutorialPanel\"",
        "id=\"tutorialHelpBtn\"",
        "id=\"tutorialSkipBtn\"",
        "let tutorialSkipped = false",
        "function startTutorial({ replay = false } = {})",
        "function skipTutorial",
        "function scheduleFreshTutorial",
        "Swap the glowing flowers.",
        "Tap the other glowing flower.",
        "selected-continuation",
        "invalidSwapReturnSelection",
        "Match 3 fills the bouquet.",
        "Match 4 arms Black Candle Vine.",
        "Match beside the Thorn.",
        "Moves ended. Retry the bouquet.",
        "Coins restore the greenhouse.",
        "body.tutorial-active.focused-slice-failed #renewBtn.visible",
        "document.body.dataset.tutorialPrompt = tutorialActive ? tutorialCopy() : \"\"",
        "const MAX_BOARD_PARTICLES = 16",
        "@media (prefers-reduced-motion: reduce)",
    ])
    missing = [needle for needle in required if needle not in html]
    if missing:
        raise SystemExit(f"Missing HTML match-shape hooks: {missing}")
    moving_match_preview = re.search(
        r"\.tile\.match-preview-anchor\s*\{[^}]*\banimation\s*:",
        html,
        re.DOTALL,
    )
    if moving_match_preview or "@keyframes harvest-ready-throb" in html:
        raise SystemExit("Match-preview animation returned to the real tile hit target")
    stable_preview_start = html.index("@keyframes harvest-ready-glow")
    stable_preview_end = html.index("@keyframes thorn-splinter", stable_preview_start)
    if "transform:" in html[stable_preview_start:stable_preview_end]:
        raise SystemExit("Match-preview overlay pulse must not transform the tile geometry")
    dormant_runtime_patterns = [
        r'id="bouquetPath"',
        r'id="pathLedgerDrawer"',
        r'id="roundThreeFocus"',
        r'id="round[A-Z][A-Za-z]+Preview"',
        r'^\s+renderBouquetPath\(\);$',
        r'^\s+renderRoundThreeFocus\(\);$',
        r'^\s+renderRound[A-Z][A-Za-z]+Preview\(\);$',
        r'function\s+renderBouquetPath\b',
        r'function\s+renderRoundThreeFocus\b',
        r'function\s+renderRound[A-Z][A-Za-z]+Preview\b',
        r'roundFourAuditMarkers',
        r'roundFiftySevenAuditMarkers',
        r'roundFiftySevenPreview',
        r'Moonlit Wreath 12',
        r'bouquetStreak',
        r'nextStreakTarget',
        r'STREAK_COIN_BONUS',
        r'Shape Bloom',
        r'shapeDiscoveryHint',
        r'patternDiscoveryCopy',
    ]
    dormant_runtime_hits = [
        pattern
        for pattern in dormant_runtime_patterns
        if re.search(pattern, html, re.MULTILINE)
    ]
    if dormant_runtime_hits:
        raise SystemExit(
            "Dormant future UI returned to the active runtime: "
            f"{dormant_runtime_hits}"
        )
    forbidden = [
        "Restored Greenhouse - Moonlit Wreath begins",
        'class="bouquet-stem-count"',
        'filter: "blur(2px) brightness(1.35)"',
        'class="restoration-ledger"',
        'id="restorationEarned"',
        'id="restorationSpent"',
        'id="restorationNext"',
        "First Bouquet Sealed · +120 coin reward",
        "Greenhouse Restored ·",
        "Moonlit Wreath Sealed · +${roundTwoPlan.reward.coins} coin reward",
        "Bloodroot Compact Sealed · +${roundThreePlan.reward.coins} coin reward",
        "Retry Bouquet preserves coins, XP, Flowerpedia, Chapter rewards, Chest Storage, and boosters.",
        'id="restoredGreenhouseStatus"',
        'id="greenhouseOrderLadder"',
        'id="greenhousePayoffLadder"',
        'id="restorationXpPreview"',
        'id="greenhouseLevel"',
        'id="greenhouseXpText"',
        'id="greenhouseXpFill"',
        'vial-meter',
        'xp-fill',
        'data-vial="SAP"',
        'data-vial="MANA"',
        'data-vial="BLOOD"',
        "function renderTycoonPanels",
        "Greenhouse +180 XP",
        "Choose Your Reward",
        'id="sacrificeBtn"',
        'id="pruningShearsBtn"',
        'id="moonwaterFlaskBtn"',
        'id="blackCandleBtn"',
        'id="graveSoilBtn"',
        'id="sacrificePanel"',
        'id="boosterPanel"',
        'id="chestTrigger"',
        'id="chestModal"',
        'aria-label="Resources and storage"',
        'id="elements"',
        ".bottom-card",
        ".elements-heading",
        ".elements {",
        ".element-count",
        "elementPulseTargets",
        "function scheduleElementPulseClear",
        "const elementsEl",
        'id="shapeAuditData"',
        "function analyzeBoardSnapshot",
        "function refreshShapeAuditData",
        "window.triggerSupremeBloom",
        "chestState",
        "Chest Storage",
        "Resources and storage",
        "Supreme Bloom Shard",
        "function renderChest",
        "function updateChestSummary",
        "function addChestItem",
        "function normalizeChestItem",
        "function openChest",
        "function closeChest",
        "function plantEclipseSeedRune",
        "data-action=\"plant-eclipse-seed-rune\"",
        "pendingRuneTendedSoil",
        "activeRuneTendedSoil",
        "Rune-Tended Soil",
        "let sacrificeState",
        "let boosters",
        "let activeBooster",
        "let moonwaterPreviewCenter",
        "let blackCandleAxis",
        "let blackCandlePreview",
        "let graveSoilCells",
        "function renderBoosterPanel",
        "function cancelActiveBooster",
        "function togglePruningShears",
        "function toggleMoonwaterFlask",
        "function toggleBlackCandle",
        "function toggleGraveSoil",
        "function sacrifice",
        "function renderSacrificeOptions",
        "function performSacrifice",
        "function wouldSacrificeHarvest",
        "function validBoosterState",
        "function validGraveSoilCells",
        ".tile.shears-target",
        ".tile.moonwater-target",
        ".tile.black-candle-line",
        ".tile.grave-soil-target",
        ".tile.sacrifice-target",
        ".booster-panel",
        ".sacrifice-panel",
        "Sacrifice (-3 moves)",
        "Pruning Shears (x",
        "Moonwater Flask (x",
        "Black Candle (x",
        "Grave Soil (x",
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
        "function demoCompleteBouquet",
        "function demoSupremeBloom",
        "function demoMatchShape",
        "function makeShapeAuditBoard",
        "function makeShapeDemoBoard",
        'id="demoCompleteBtn"',
        'id="shapeBloomBtn"',
        'class="btn demo"',
        "Prototype review hook",
        "Prototype match-shape review",
        "Flowerpedia",
        "Flowerpedia unlocked",
        "flowerpediaEntries",
        "flowerpediaLedger",
        "flowerpediaModal",
        "flowerpediaUnlocked",
        "flowerpediaUnlocks",
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
        "Future: combine stored relics",
    ]
    present_forbidden = [needle for needle in forbidden if needle in html]
    if present_forbidden:
        raise SystemExit(
            f"Forbidden HTML match-shape hooks returned: {present_forbidden}"
        )
    compositor_safe_restoration_keyframes = (
        "bouquet-trophy-awaken",
        "withered-glass-fall",
        "restored-glass-reveal",
        "restoration-light-bloom",
        "restoration-root-rise",
        "restoration-rays-open",
        "restoration-state-pop",
        "greenhouse-xp-confirm",
        "greenhouse-ladder-confirm",
    )
    restoration_keyframes = re.findall(
        r"@keyframes ([a-z-]+) \{(.*?)\n    \}",
        html,
        re.DOTALL,
    )
    unsafe_restoration_filters = [
        name
        for name, body in restoration_keyframes
        if name in compositor_safe_restoration_keyframes and "filter:" in body
    ]
    if unsafe_restoration_filters:
        raise SystemExit(
            "Restoration keyframes must remain compositor-safe: "
            f"{unsafe_restoration_filters}"
        )
    unsafe_restoration_transitions = [
        "transition:opacity 760ms ease,filter 760ms ease",
        "transition:opacity 760ms ease,filter 760ms ease,transform",
    ]
    present_unsafe_transitions = [
        needle for needle in unsafe_restoration_transitions if needle in html
    ]
    if present_unsafe_transitions:
        raise SystemExit(
            "Restoration reveal must not animate CSS filters: "
            f"{present_unsafe_transitions}"
        )
    missing_assets = [asset for asset in ALTAR_TILE_ASSETS if not (ROOT / asset).exists()]
    if missing_assets:
        raise SystemExit(f"Missing altar tile assets: {missing_assets}")
    board_socket = ROOT / "assets/board/occult_altar_socket.svg"
    if not board_socket.exists():
        raise SystemExit("Missing board socket art asset")
    socket_text = board_socket.read_text(encoding="utf-8")
    if "<svg" not in socket_text or "<title" not in socket_text or "Occult altar tile socket" not in socket_text:
        raise SystemExit("Board socket art asset lacks expected SVG/title markup")
    for asset in ALTAR_TILE_ASSETS:
        path = ROOT / asset
        if asset.endswith(".svg"):
            text = path.read_text(encoding="utf-8")
            if "<svg" not in text or "<title" not in text:
                raise SystemExit(f"Tile asset lacks SVG/title markup: {asset}")
            continue
        expected_size = 48 if "/48/" in asset else 96
        width, height = png_dimensions(path)
        if (width, height) != (expected_size, expected_size):
            raise SystemExit(f"Tile asset has wrong dimensions: {asset} is {width}x{height}")
        if asset in FLOWER_TILE_PNGS:
            alpha = png_alpha_stats(path)
            min_visible = 700 if expected_size == 48 else 3000
            if alpha["visible"] < min_visible:
                raise SystemExit(
                    f"Tile asset silhouette is too small/transparent: "
                    f"{asset} has {alpha['visible']} visible pixels"
                )
            if alpha["solid"] < min_visible * 0.35:
                raise SystemExit(
                    f"Tile asset lacks enough solid painted form: "
                    f"{asset} has {alpha['solid']} solid pixels"
                )
            if any(corner > 8 for corner in alpha["corners"]):
                raise SystemExit(
                    f"Tile asset must have transparent corners for socket integration: {asset}"
                )


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
