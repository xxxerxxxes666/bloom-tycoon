const { test, expect } = require("@playwright/test");
const fs = require("fs");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const FOCUSED_ECONOMY_VERSION = 2;
const LEGACY_ECONOMY_CASES = [
  {
    label: "active-round-one",
    state: { currentRound: 1, roundComplete: false, moves: 6, counts: [0, 0, 0, 0, 0, 0] },
    coins: 0
  },
  {
    label: "round-one-payoff",
    state: { currentRound: 1, roundComplete: true, roundOneRestored: false, moves: 2, counts: [0, 6, 0, 0, 0, 8] },
    coins: 120,
    action: "Restore Greenhouse · 100 coins",
    transaction: "Earned 120 coins. Restore costs 100.",
    spentCoins: 20,
    spentAction: "Next Order → Moonlit Wreath",
    spentTransaction: "Restored for 100. 20 coins remain."
  },
  {
    label: "round-one-restored",
    state: { currentRound: 1, roundComplete: true, roundOneRestored: true, moves: 2, counts: [0, 6, 0, 0, 0, 8] },
    coins: 20,
    action: "Next Order → Moonlit Wreath",
    transaction: "Restored for 100. 20 coins remain.",
    enteredRound: 2,
    enteredCoins: 20
  },
  {
    label: "active-round-two",
    state: { currentRound: 2, roundComplete: false, roundOneRestored: true, moves: 9, counts: [0, 0, 0, 0, 0, 0] },
    coins: 20
  },
  {
    label: "round-two-payoff",
    state: { currentRound: 2, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: false, moves: 2, counts: [0, 0, 10, 0, 9, 7], clearedCursedThorns: 3 },
    coins: 170,
    action: "Upgrade Greenhouse · 120 coins",
    transaction: "Earned 150 coins. Upgrade costs 120.",
    spentCoins: 50,
    spentAction: "Next Order → Bloodroot Compact",
    spentTransaction: "Upgraded for 120. 50 coins remain."
  },
  {
    label: "round-two-upgraded",
    state: { currentRound: 2, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, moves: 2, counts: [0, 0, 10, 0, 9, 7], clearedCursedThorns: 3 },
    coins: 50,
    action: "Next Order → Bloodroot Compact",
    transaction: "Upgraded for 120. 50 coins remain.",
    enteredRound: 3,
    enteredCoins: 50
  },
  {
    label: "active-round-three",
    state: { currentRound: 3, roundComplete: false, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, moves: 8, counts: [0, 0, 0, 0, 0, 0] },
    coins: 50
  },
  {
    label: "round-three-payoff",
    state: { currentRound: 3, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, roundThreeConservatoryRaised: false, moves: 2, counts: [13, 0, 0, 14, 0, 0] },
    coins: 230,
    action: "Raise Conservatory · 180 coins",
    transaction: "Earned 180 coins. Conservatory costs 180.",
    spentCoins: 50,
    spentAction: "Play Again → First Bouquet",
    spentTransaction: "Raised for 180. 50 coins remain."
  },
  {
    label: "round-three-raised",
    state: { currentRound: 3, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, roundThreeConservatoryRaised: true, moves: 2, counts: [13, 0, 0, 14, 0, 0] },
    coins: 50,
    action: "Play Again → First Bouquet",
    transaction: "Raised for 180. 50 coins remain.",
    enteredRound: 1,
    enteredCoins: 50
  }
];

test.setTimeout(180000);

async function seedDeterministicMath(page, seedLabel) {
  await page.addInitScript((label) => {
    let seed = 0;
    for (let index = 0; index < label.length; index += 1) {
      seed = (seed * 31 + label.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, seedLabel);
}

async function openFresh(page, suffix) {
  await page.goto(`${BASE_URL}?tutorial-progress=${suffix}&bloomReview=1`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function openFreshNoReview(page, suffix) {
  await page.goto(`${BASE_URL}?tutorial-progress=${suffix}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function visibleReport(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const bars = Array.from(document.querySelectorAll(
      ".progress-meter, .restoration-dial-track, .vial-meter, .restored-greenhouse-meter, .greenhouse-payoff-fill, .greenhouse-upgrade-ladder"
    )).filter(visible);
    const tutorialPanel = document.querySelector("#tutorialPanel");
    const tutorialRect = tutorialPanel?.getBoundingClientRect();
    const brokenImages = Array.from(document.images)
      .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    const saved = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}");
    return {
      tiles: document.querySelectorAll(".tile").length,
      idleHints: document.querySelectorAll(".tile.idle-hint").length,
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialInViewport: visible(tutorialPanel)
        && tutorialRect.top >= 0
        && tutorialRect.bottom <= innerHeight,
      visibleInstructionCues: [
        document.querySelector("#firstSwapCue"),
        tutorialPanel
      ].filter(visible).length,
      tutorialText: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialPrompt: document.body.dataset.tutorialPrompt || "",
      visibleNonTileButtons: Array.from(document.querySelectorAll("button"))
        .filter((node) => visible(node) && !node.closest("#board"))
        .map((node) => node.textContent.trim())
        .filter(Boolean),
      mobilePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      ritualLogText: document.querySelector("#ritualLog")?.textContent.trim() || "",
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      tutorialSpotlights: document.querySelectorAll(
        ".tile.idle-hint, .tile.thorn-teach, .tile.thorn-teach-blocker"
      ).length,
      bouquetText: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      bouquetNext: document.querySelector("#bouquetProgressNext")?.textContent.trim() || "",
      greenhouseText: document.querySelector(".restoration-owned-note")?.textContent.trim() || "",
      payoffTransaction: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      restorationState: document.querySelector("#restorationState")?.textContent.trim() || "",
      coins: saved.coins ?? 0,
      greenhouseOwnedStage: document.querySelector("#heroRestorationDial")?.dataset.ownedStage || "",
      greenhousePct: document.querySelector("#heroRestorationDial")?.dataset.restorationDialPct || "",
      greenhouseBodyStage: document.body.dataset.activeGreenhouseStage || "",
      greenhouseArt: document.querySelector("#activeGreenhouseStageArt")?.getAttribute("src") || "",
      savedOwnership: {
        roundOneRestored: Boolean(saved.roundOneRestored),
        roundTwoGreenhouseUpgraded: Boolean(saved.roundTwoGreenhouseUpgraded),
        roundThreeConservatoryRaised: Boolean(saved.roundThreeConservatoryRaised)
      },
      mobileGreenhousePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      visibleProgressText: document.body.innerText,
      bars: bars.map((node) => node.className),
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      round: saved.currentRound || 1,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages
    };
  });
}

async function clickGuidedSwap(page, options = {}) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  const pair = await hints.evaluateAll((tiles) => tiles.map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).dispatchEvent("click");
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).dispatchEvent("click");
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(({ retireGuide }) => {
    const payoff = document.querySelector("#roundOneRestoration");
    const payoffVisible = payoff && getComputedStyle(payoff).display !== "none";
    if (retireGuide) {
      const tiles = Array.from(document.querySelectorAll(".tile"));
      return tiles.length === 64
        && tiles.every((tile) => !tile.disabled)
        && document.querySelectorAll(
          ".tile.idle-hint, .tile.thorn-teach, .tile.thorn-teach-lane, .tile.thorn-teach-blocker, .swap-path-arrow, .first-action-swap-guide"
        ).length === 0;
    }
    return payoffVisible || document.querySelectorAll(".tile.idle-hint").length === 2;
  }, { retireGuide: Boolean(options.retireGuide) }, { timeout: 9500 });
}

async function dispatchGuidedSwap(page) {
  const pair = await hintedPair(page);
  for (const cell of pair) {
    await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
  }
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(() => (
    document.querySelectorAll('.tile[data-line-relic="black-candle-vine"]').length === 1
    || document.querySelectorAll(".tile.idle-hint").length === 2
    || getComputedStyle(document.querySelector("#roundOneRestoration")).display !== "none"
  ), null, { timeout: 9500 });
}

async function completeGuidedRoundOne(page) {
  for (let swap = 0; swap < 6; swap += 1) {
    await clickGuidedSwap(page);
    if (await page.locator("#roundOneRestoration").isVisible()) {
      break;
    }
  }
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function expectReadyPrimaryAction(page, text) {
  const primary = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(primary).toBeVisible({ timeout: 1800 });
  await expect(primary).toBeEnabled({ timeout: 1800 });
  await expect(primary).toHaveText(text);
}

async function keyboardGuidedSwap(page) {
  const pair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y),
    focusable: tile.getAttribute("tabindex") === "0"
  })));
  expect(pair).toHaveLength(2);
  const first = pair.find((tile) => tile.focusable) || pair[0];
  const second = pair.find((tile) => tile.x !== first.x || tile.y !== first.y);
  const key = second.x > first.x
    ? "ArrowRight"
    : second.x < first.x
      ? "ArrowLeft"
      : second.y > first.y
        ? "ArrowDown"
        : "ArrowUp";
  const firstTile = page.locator(`.tile[data-x="${first.x}"][data-y="${first.y}"]`);
  await firstTile.focus();
  await expect(firstTile).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(firstTile).toHaveClass(/sel/);
  const secondTile = page.locator(`.tile[data-x="${second.x}"][data-y="${second.y}"]`);
  if (await secondTile.evaluate((tile) => document.activeElement === tile)) {
    await page.keyboard.press("Enter");
  } else {
    await expect(firstTile).toBeFocused();
    await page.keyboard.press(key);
  }
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(() => !document.querySelector(".tile.sel"));
}

async function activeState(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      moves: state.moves,
      counts: state.counts || [],
      clearedCursedThorns: state.clearedCursedThorns || 0,
      cursedThorns: state.cursedThorns || [],
      armedLineRelic: state.armedLineRelic || null,
      board: (state.board || []).map((row) => row.join(",")).join("|"),
      roundComplete: Boolean(state.roundComplete),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      tiles: document.querySelectorAll(".tile").length,
      rows: [...new Set(Array.from(document.querySelectorAll(".tile"))
        .map((tile) => Math.round(tile.getBoundingClientRect().top)))].length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  }, SAVE_KEY);
}

async function interruptGuidedSwapWithReload(page, requestedPair = null) {
  await waitForSettledBoard(page);
  const before = await activeState(page);
  const pair = requestedPair || await hintedPair(page);
  const navigation = page.waitForNavigation({ waitUntil: "networkidle" });
  await page.evaluate((pair) => {
    const click = ({ x, y }) => {
      document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).click();
    };
    click(pair[0]);
    click(pair[1]);
    window.setTimeout(() => window.location.reload(), 0);
  }, pair);
  await navigation;
  await waitForSettledBoard(page);
  return {
    before,
    after: await activeState(page),
    pair
  };
}

async function settleGuidedSwap(page, requestedPair = null) {
  await waitForSettledBoard(page);
  const movesBefore = (await activeState(page)).moves;
  const pair = requestedPair || await hintedPair(page);
  await page.evaluate((pair) => {
    pair.forEach(({ x, y }) => {
      document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).click();
    });
  }, pair);
  await page.waitForFunction(({ key, movesBefore }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    if (Number(saved.moves) >= Number(movesBefore)) {
      return false;
    }
    const tiles = Array.from(document.querySelectorAll(".tile"));
    if (saved.roundComplete) {
      const action = document.querySelector("#restoreGreenhouseBtn");
      return action && !action.hidden && !action.disabled;
    }
    return tiles.length === 64
      && tiles.every((tile) => !tile.disabled)
      && new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top))).size === 8
      && document.querySelectorAll(".tile.idle-hint").length === 2;
  }, { key: SAVE_KEY, movesBefore }, { timeout: 10000 });
}

async function settleThornLessonSwap(page) {
  await waitForSettledBoard(page);
  const movesBefore = (await activeState(page)).moves;
  const pair = await hintedPair(page);
  await page.evaluate((pair) => {
    pair.forEach(({ x, y }) => {
      document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).click();
    });
  }, pair);
  await page.waitForFunction(({ key, movesBefore }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll(".tile"));
    return Number(saved.moves) === Number(movesBefore) - 1
      && Number(saved.clearedCursedThorns) > 0
      && tiles.length === 64
      && tiles.every((tile) => !tile.disabled)
      && document.querySelectorAll(
        ".tile.idle-hint, .tile.thorn-teach, .tile.thorn-teach-lane, .tile.thorn-teach-blocker, .swap-path-arrow, .first-action-swap-guide"
      ).length === 0;
  }, { key: SAVE_KEY, movesBefore }, { timeout: 10000 });
}

async function waitForSettledBoard(page) {
  await page.waitForFunction(() => {
    const tiles = Array.from(document.querySelectorAll(".tile"));
    if (tiles.length !== 64 || tiles.some((tile) => tile.disabled)) {
      return false;
    }
    const rowTops = new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top)));
    return rowTops.size === 8;
  }, null, { timeout: 5000 });
  await page.evaluate(() => new Promise((resolve) => {
    let previousGeometry = "";
    let stableFrames = 0;
    const sample = () => {
      const tiles = Array.from(document.querySelectorAll(".tile"));
      const geometry = tiles.map((tile) => {
        const rect = tile.getBoundingClientRect();
        return `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
      }).join("|");
      const rows = new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top))).size;
      const settled = tiles.length === 64
        && tiles.every((tile) => !tile.disabled)
        && rows === 8;
      stableFrames = settled && geometry === previousGeometry ? stableFrames + 1 : 0;
      previousGeometry = geometry;
      if (stableFrames >= 6) {
        resolve();
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

async function guidedRoundOneState(page, tag) {
  return page.evaluate(({ key, tag }) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tileRects = Array.from(document.querySelectorAll(".tile")).map((tile) => tile.getBoundingClientRect());
    const board = document.querySelector(".board");
    const firstSwapCue = document.querySelector("#firstSwapCue");
    const tutorialPanel = document.querySelector("#tutorialPanel");
    const tutorialIcon = tutorialPanel?.querySelector(".tutorial-icon");
    const tutorialPanelRect = tutorialPanel?.getBoundingClientRect();
    const tutorialCopyRect = document.querySelector("#tutorialCopy")?.getBoundingClientRect();
    const hints = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      flowerId: Number(tile.dataset.flowerId),
      label: tile.getAttribute("aria-label") || ""
    }));
    const literacyTiles = Array.from(document.querySelectorAll(".tile.target-literacy")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      flowerId: Number(tile.dataset.flowerId),
      outline: getComputedStyle(tile).outlineStyle,
      animationDuration: getComputedStyle(tile, "::after").animationDuration
    }));
    return {
      tag,
      round: saved.currentRound || 1,
      moves: saved.moves,
      counts: saved.counts || [],
      roundComplete: Boolean(saved.roundComplete),
      coins: saved.coins,
      bouquet: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      bouquetOrder: document.querySelector("#bouquetProgressNext")?.textContent.trim() || "",
      bouquetBarWidth: document.querySelector("#bar")?.style.width || "",
      liveBouquetProgress: document.querySelector("#liveBouquetAssembly")?.dataset.progress || "",
      greenhouseAuthority: {
        roundOneRestored: Boolean(saved.roundOneRestored),
        roundTwoGreenhouseUpgraded: Boolean(saved.roundTwoGreenhouseUpgraded),
        roundThreeConservatoryRaised: Boolean(saved.roundThreeConservatoryRaised),
        stage: document.querySelector("#heroRestorationDial")?.dataset.restorationDialStage || "",
        ownedStage: document.querySelector("#heroRestorationDial")?.dataset.ownedStage || "",
        pct: document.querySelector("#heroRestorationDial")?.dataset.restorationDialPct || "",
        bodyStage: document.body.dataset.activeGreenhouseStage || "",
        bodyPct: document.body.dataset.greenhouseRevivalPct || "",
        art: document.querySelector("#activeGreenhouseStageArt")?.getAttribute("src") || ""
      },
      cue: firstSwapCue?.textContent.trim() || "",
      tutorial: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialPanelText: tutorialPanel?.innerText.trim() || "",
      tutorialIconText: tutorialIcon?.textContent.trim() || "",
      tutorialIconAriaHidden: tutorialIcon?.getAttribute("aria-hidden") || "",
      namedBlackCandleTutorial: tutorialPanel?.classList.contains("black-candle-tutorial") || false,
      firstSwapCueVisible: visible(firstSwapCue),
      visibleInstructionSurfaces: [firstSwapCue, tutorialPanel].filter(visible).length,
      tutorialPanelInViewport: visible(tutorialPanel)
        && tutorialPanelRect.top >= 0
        && tutorialPanelRect.bottom <= innerHeight,
      tutorialPanelClipped: Boolean(
        tutorialPanel
        && (
          tutorialPanel.scrollWidth > tutorialPanel.clientWidth + 1
          || tutorialCopyRect?.left < tutorialPanelRect.left - 1
          || tutorialCopyRect?.right > tutorialPanelRect.right + 1
        )
      ),
      tutorialPanelGeometry: tutorialPanelRect ? {
        left: Math.round(tutorialPanelRect.left),
        right: Math.round(tutorialPanelRect.right),
        clientWidth: tutorialPanel.clientWidth,
        scrollWidth: tutorialPanel.scrollWidth,
        copyLeft: Math.round(tutorialCopyRect?.left || 0),
        copyRight: Math.round(tutorialCopyRect?.right || 0)
      } : null,
      hints,
      targetLiteracy: document.body.dataset.targetLiteracy || "",
      literacyTiles,
      targetFamilyTiles: document.querySelectorAll('.tile[data-flower-id="5"]').length,
      nonTargetLiteracyTiles: document.querySelectorAll('.tile.target-literacy:not([data-flower-id="5"])').length,
      objectiveLiteracyTargets: document.querySelectorAll('.objective-target.target-literacy[data-flower-id="5"]').length,
      tiles: document.querySelectorAll(".tile").length,
      rows: [...new Set(tileRects.map((rect) => Math.round(rect.top)))].length,
      completeRows: [...new Set(tileRects
        .filter((rect) => rect.top >= -1 && rect.bottom <= innerHeight + 1)
        .map((rect) => Math.round(rect.top)))].length,
      boardVisible: visible(board),
      boardBottom: board?.getBoundingClientRect().bottom || 0,
      payoffVisible: visible(document.querySelector("#roundOneRestoration")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      ritualLogText: document.querySelector("#ritualLog")?.textContent.trim() || "",
      lineRelicHit: Boolean(board?.classList.contains("line-relic-hit")),
      lineRelicParticles: document.querySelectorAll(".board-particle.line-relic").length,
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      payoffTokens: Array.from(document.querySelectorAll(".bouquet-payoff-token")).map((node) => node.textContent.trim()),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, { key: SAVE_KEY, tag });
}

function assertNaturalBlackCandleTutorial(state, mobile, label) {
  expect(state.tutorial, `${label} keeps exact directional action`).toBe("Swap right to burn this row.");
  expect(state.tutorialIconText, `${label} visible semantic category`).toBe("BLACK CANDLE");
  expect(state.tutorialIconAriaHidden, `${label} category reaches accessibility tree`).toBe("false");
  expect(state.namedBlackCandleTutorial, `${label} named tutorial state`).toBe(true);
  expect(state.tutorialPanelText, `${label} visible pixels include category and action`).toContain("BLACK CANDLE");
  expect(state.tutorialPanelText, `${label} visible pixels include exact action`).toContain("Swap right to burn this row.");
  expect(state.firstSwapCueVisible, `${label} hidden persistent cue does not duplicate tutorial`).toBe(false);
  expect(state.visibleInstructionSurfaces, `${label} one instruction surface`).toBe(1);
  expect(state.visibleButtons, `${label} Skip is the sole active non-tile action`).toEqual(["Skip"]);
  expect(state.tutorialPanelInViewport, `${label} tutorial remains in viewport`).toBe(true);
  expect(
    state.tutorialPanelClipped,
    `${label} tutorial text is not clipped: ${JSON.stringify(state.tutorialPanelGeometry)}`
  ).toBe(false);
  if (mobile) {
    expect(state.completeRows, `${label} all mobile rows remain visible`).toBe(8);
    expect(state.boardBottom, `${label} board remains in first viewport`).toBeLessThanOrEqual(844);
  }
  expect(state.overflowX, `${label} no horizontal overflow`).toBe(false);
}

async function assertActiveGuidedState(state, mobile, label) {
  expect(state.round, `${label} active round`).toBe(1);
  expect(state.roundComplete, `${label} not complete before Black Candle`).toBe(false);
  expect(state.payoffVisible, `${label} payoff hidden before Black Candle`).toBe(false);
  expect(state.bouquet, `${label} no early 14/14`).not.toContain("14/14");
  expect(state.moves, `${label} moves remain nonnegative`).toBeGreaterThanOrEqual(0);
  expect(state.tiles, `${label} tile count`).toBe(64);
  expect(state.rows, `${label} board rows`).toBe(8);
  expect(state.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(state.brokenImages, `${label} no broken images`).toEqual([]);
  if (mobile) {
    expect(state.completeRows, `${label} all mobile rows visible`).toBe(8);
    expect(state.boardBottom, `${label} mobile board in viewport`).toBeLessThanOrEqual(844);
  }
}

async function clickHighlightedPair(page) {
  await waitForSettledBoard(page);
  const movesBefore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").moves, SAVE_KEY);
  const pair = await hintedPair(page);
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click({ force: true });
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click({ force: true });
  await page.waitForFunction(({ key, movesBefore }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const boardSettled = Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
    return (Boolean(saved.roundComplete) && !document.body.dataset.blackCandleActivationPhase)
      || (Number(saved.moves) < Number(movesBefore) && boardSettled);
  }, { key: SAVE_KEY, movesBefore }, { timeout: 10000 });
  await page.waitForTimeout(350);
}

async function legalFourBoneStarPreview(page) {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const board = (saved.board || []).map((row) => row.slice());
    const hints = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    if (hints.length !== 2) {
      return { ok: false, reason: "missing hints", hints };
    }
    const [a, b] = hints;
    const adjacent = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
    const previous = board[a.y][a.x];
    board[a.y][a.x] = board[b.y][b.x];
    board[b.y][b.x] = previous;
    const runs = [];
    for (let y = 0; y < 8; y += 1) {
      let start = 0;
      for (let x = 1; x <= 8; x += 1) {
        if (x === 8 || board[y][x] !== board[y][start]) {
          if (board[y][start] === 1 && x - start === 4) {
            runs.push({ direction: "horizontal", cells: Array.from({ length: 4 }, (_, index) => [start + index, y]) });
          }
          start = x;
        }
      }
    }
    for (let x = 0; x < 8; x += 1) {
      let start = 0;
      for (let y = 1; y <= 8; y += 1) {
        if (y === 8 || board[y][x] !== board[start][x]) {
          if (board[start][x] === 1 && y - start === 4) {
            runs.push({ direction: "vertical", cells: Array.from({ length: 4 }, (_, index) => [x, start + index]) });
          }
          start = y;
        }
      }
    }
    return { ok: adjacent && runs.length > 0, adjacent, hints, runs };
  }, SAVE_KEY);
}

async function hintedPair(page) {
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 6500 });
  const pair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
  expect(Math.abs(pair[0].x - pair[1].x) + Math.abs(pair[0].y - pair[1].y)).toBe(1);
  return pair;
}

async function objectiveUsefulPairs(page) {
  return page.evaluate(() => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    Array.from(document.querySelectorAll(".tile")).forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const unfinished = new Set(Array.from(
      document.querySelectorAll(".objective-target[data-flower-id]:not(.complete)")
    ).map((node) => Number(node.dataset.flowerId)));
    const createdRuns = (next, a, b) => {
      const moved = new Set([`${a.x},${a.y}`, `${b.x},${b.y}`]);
      const runs = [];
      for (let y = 0; y < 8; y += 1) {
        for (let start = 0, x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (x - start >= 3) {
              runs.push({
                flowerId: next[y][start],
                cells: Array.from({ length: x - start }, (_, offset) => [start + offset, y])
              });
            }
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        for (let start = 0, y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (y - start >= 3) {
              runs.push({
                flowerId: next[start][x],
                cells: Array.from({ length: y - start }, (_, offset) => [x, start + offset])
              });
            }
            start = y;
          }
        }
      }
      return runs.filter((run) => run.cells.some(([x, y]) => moved.has(`${x},${y}`)));
    };
    const pairs = [];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8 || board[a.y][a.x] === board[b.y][b.x]) continue;
          const next = board.map((row) => row.slice());
          [next[a.y][a.x], next[b.y][b.x]] = [next[b.y][b.x], next[a.y][a.x]];
          const usefulRuns = createdRuns(next, a, b).filter((run) => unfinished.has(run.flowerId));
          if (usefulRuns.length) {
            pairs.push({ pair: [a, b], flowerIds: [...new Set(usefulRuns.map((run) => run.flowerId))] });
          }
        }
      }
    }
    return pairs;
  });
}

function unorderedPairKey(pair) {
  return pair
    .map(({ x, y }) => `${x},${y}`)
    .sort()
    .join(" <-> ");
}

function guideDirection(pair) {
  const [source, destination] = pair;
  if (destination.x > source.x) return "right";
  if (destination.x < source.x) return "left";
  if (destination.y > source.y) return "down";
  return "up";
}

function activationPairFromForecast(forecast) {
  return [forecast.source, forecast.destination].map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
}

async function firstActionGuideReport(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const rect = (node) => {
      if (!node) return null;
      const bounds = node.getBoundingClientRect();
      return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
        centerX: bounds.left + bounds.width / 2,
        centerY: bounds.top + bounds.height / 2
      };
    };
    const guide = document.querySelector(".first-action-swap-guide");
    const token = guide?.querySelector(".first-action-drag-token") || null;
    const track = guide?.querySelector(".first-action-track") || null;
    const sourceHalo = guide?.querySelector(".first-action-source-halo") || null;
    const destinationHalo = guide?.querySelector(".first-action-destination-halo") || null;
    const tokenStyle = token ? getComputedStyle(token) : null;
    const sourceStyle = sourceHalo ? getComputedStyle(sourceHalo) : null;
    const destinationStyle = destinationHalo ? getComputedStyle(destinationHalo) : null;
    const tutorialPanel = document.querySelector("#tutorialPanel");
    const hints = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      rect: rect(tile)
    }));
    const tileRects = Array.from(document.querySelectorAll(".tile")).map((tile) => tile.getBoundingClientRect());
    return {
      count: document.querySelectorAll(".first-action-swap-guide").length,
      visible: visible(guide),
      pointerEvents: guide ? getComputedStyle(guide).pointerEvents : "",
      ariaHidden: guide?.getAttribute("aria-hidden") || "",
      focusableInside: guide?.querySelectorAll("button, [href], input, select, textarea, [tabindex]").length || 0,
      data: guide ? {
        mode: guide.dataset.mode || "",
        sourceX: Number(guide.dataset.sourceX),
        sourceY: Number(guide.dataset.sourceY),
        destinationX: Number(guide.dataset.destinationX),
        destinationY: Number(guide.dataset.destinationY),
        direction: guide.dataset.direction,
        stage: guide.dataset.stage
      } : null,
      hints,
      sourceHalo: rect(sourceHalo),
      destinationHalo: rect(destinationHalo),
      track: rect(track),
      token: rect(token),
      tokenDisplay: tokenStyle?.display || "",
      tokenAnimation: tokenStyle?.animationName || "",
      sourceDisplay: sourceStyle?.display || "",
      destinationDisplay: destinationStyle?.display || "",
      destinationAnimation: destinationStyle?.animationName || "",
      oldArrows: document.querySelectorAll(".swap-path-arrow").length,
      dragPreviewTiles: document.querySelectorAll(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready").length,
      selectedTiles: document.querySelectorAll(".tile.sel").length,
      selectedCell: (() => {
        const tile = document.querySelector(".tile.sel");
        return tile ? { x: Number(tile.dataset.x), y: Number(tile.dataset.y) } : null;
      })(),
      focusedCell: (() => {
        const tile = document.activeElement?.closest?.(".tile");
        return tile ? { x: Number(tile.dataset.x), y: Number(tile.dataset.y) } : null;
      })(),
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      instructionSurfaces: [tutorialPanel, document.querySelector("#firstSwapCue")].filter(visible).length,
      visibleNonTileButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest("#board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      boardBottom: document.querySelector("#board")?.getBoundingClientRect().bottom || 0,
      tiles: tileRects.length,
      rows: [...new Set(Array.from(document.querySelectorAll(".tile"))
        .map((tile) => Number(tile.dataset.y)))].length,
      completeRows: [...new Set(tileRects
        .filter((tile) => tile.top >= -1 && tile.bottom <= innerHeight + 1)
        .map((tile) => Math.round(tile.top)))].length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

async function stableTileGeometryReport(page, sampleCount = 10, intervalMs = 90) {
  return page.evaluate(async ({ sampleCount, intervalMs }) => {
    const samples = [];
    const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    for (let index = 0; index < sampleCount; index += 1) {
      const tiles = Array.from(document.querySelectorAll(".tile")).map((tile) => {
        const bounds = tile.getBoundingClientRect();
        const style = getComputedStyle(tile);
        return {
          key: `${tile.dataset.x},${tile.dataset.y}`,
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          animationName: style.animationName,
          transform: style.transform,
          transformIsIdentity: style.transform === "none"
            || new DOMMatrixReadOnly(style.transform).isIdentity
        };
      });
      const anchor = document.querySelector(".tile.match-preview-anchor");
      const anchorAfter = anchor ? getComputedStyle(anchor, "::after") : null;
      samples.push({
        tiles,
        completeRows: [...new Set(tiles.map((tile) => Math.round(tile.top)))].length,
        boardBottom: document.querySelector("#board")?.getBoundingClientRect().bottom || 0,
        anchorAfterAnimation: anchorAfter?.animationName || ""
      });
      if (index < sampleCount - 1) await sleep(intervalMs);
    }
    const baseline = new Map(samples[0].tiles.map((tile) => [tile.key, tile]));
    const deltas = samples.flatMap((sample) => sample.tiles.map((tile) => {
      const first = baseline.get(tile.key);
      return Math.max(
        Math.abs(tile.left - first.left),
        Math.abs(tile.top - first.top),
        Math.abs(tile.width - first.width),
        Math.abs(tile.height - first.height)
      );
    }));
    return {
      sampleCount: samples.length,
      tileCounts: samples.map((sample) => sample.tiles.length),
      completeRows: samples.map((sample) => sample.completeRows),
      boardBottoms: samples.map((sample) => sample.boardBottom),
      maxTileDelta: Math.max(...deltas),
      movingTransforms: samples.flatMap((sample) => sample.tiles
        .filter((tile) => !tile.transformIsIdentity)
        .map((tile) => ({
          key: tile.key,
          animationName: tile.animationName,
          transform: tile.transform
        }))),
      tileAnimationNames: [...new Set(samples.flatMap((sample) => sample.tiles
        .map((tile) => tile.animationName)
        .filter(Boolean)))],
      anchorAfterAnimations: [...new Set(samples
        .map((sample) => sample.anchorAfterAnimation)
        .filter(Boolean))]
    };
  }, { sampleCount, intervalMs });
}

function assertFirstActionGuide(report, pair, label, options = {}) {
  const [source, destination] = pair;
  expect(report.count, `${label} guide count`).toBe(1);
  expect(report.visible, `${label} guide visible`).toBe(true);
  expect(report.pointerEvents, `${label} pointer inert`).toBe("none");
  expect(report.ariaHidden, `${label} aria hidden`).toBe("true");
  expect(report.focusableInside, `${label} no focusable overlay controls`).toBe(0);
  expect(report.oldArrows, `${label} no competing legacy arrow`).toBe(0);
  expect(report.data, `${label} guide data`).toMatchObject({
    mode: "full",
    sourceX: source.x,
    sourceY: source.y,
    destinationX: destination.x,
    destinationY: destination.y,
    direction: guideDirection(pair)
  });
  if (options.stage) {
    expect(report.data.stage, `${label} guide stage`).toBe(options.stage);
  } else {
    expect(report.data.stage, `${label} guide stage marker`).toBeTruthy();
  }
  expect(report.tiles, `${label} tile count`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  expect(Math.abs(report.sourceHalo.centerX - report.hints[0].rect.centerX), `${label} source halo x`).toBeLessThan(3);
  expect(Math.abs(report.sourceHalo.centerY - report.hints[0].rect.centerY), `${label} source halo y`).toBeLessThan(3);
  expect(Math.abs(report.destinationHalo.centerX - report.hints[1].rect.centerX), `${label} destination halo x`).toBeLessThan(3);
  expect(Math.abs(report.destinationHalo.centerY - report.hints[1].rect.centerY), `${label} destination halo y`).toBeLessThan(3);
  if (options.mobile) {
    expect(report.completeRows, `${label} exact mobile rows`).toBe(8);
  }
  if (options.reducedMotion) {
    expect(report.tokenDisplay, `${label} reduced motion hides traveling token`).toBe("none");
    expect(report.tokenAnimation, `${label} reduced motion has no token animation`).toBe("none");
    expect(report.track, `${label} reduced motion static track remains`).toBeTruthy();
  } else {
    expect(report.tokenDisplay, `${label} animated token visible`).not.toBe("none");
    expect(report.tokenAnimation, `${label} token animates`).toBe("first-action-token-travel");
  }
}

function assertSelectedFirstActionGuide(report, pair, selectedCell, label, options = {}) {
  const destination = pair.find((cell) => cell.x !== selectedCell.x || cell.y !== selectedCell.y);
  expect(report.count, `${label} guide count`).toBe(1);
  expect(report.visible, `${label} guide visible`).toBe(true);
  expect(report.pointerEvents, `${label} pointer inert`).toBe("none");
  expect(report.ariaHidden, `${label} aria hidden`).toBe("true");
  expect(report.focusableInside, `${label} no focusable controls`).toBe(0);
  expect(report.oldArrows, `${label} no competing arrow`).toBe(0);
  expect(report.data, `${label} destination-only data`).toMatchObject({
    mode: "destination",
    sourceX: selectedCell.x,
    sourceY: selectedCell.y,
    destinationX: destination.x,
    destinationY: destination.y,
    direction: guideDirection([selectedCell, destination])
  });
  expect(report.selectedTiles, `${label} one selected tile`).toBe(1);
  expect(report.selectedCell, `${label} selected source`).toEqual(selectedCell);
  if (options.focusDestination !== false) {
    expect(report.focusedCell, `${label} keyboard focus continues at destination`).toEqual(destination);
  }
  expect(report.tutorialCopy, `${label} visible action copy`).toBe("Tap the other glowing flower.");
  expect(report.instructionSurfaces, `${label} one instruction surface`).toBe(1);
  expect(report.visibleNonTileButtons, `${label} Skip remains sole action`).toEqual(["Skip"]);
  expect(report.sourceDisplay, `${label} source choreography retires`).toBe("none");
  expect(report.tokenDisplay, `${label} no competing moving token`).toBe("none");
  expect(report.destinationDisplay, `${label} destination halo visible`).not.toBe("none");
  const destinationHint = report.hints.find((hint) => (
    hint.x === destination.x && hint.y === destination.y
  ));
  expect(destinationHint, `${label} destination remains hinted`).toBeTruthy();
  expect(
    Math.abs(report.destinationHalo.centerX - destinationHint.rect.centerX),
    `${label} destination halo x`
  ).toBeLessThan(3);
  expect(
    Math.abs(report.destinationHalo.centerY - destinationHint.rect.centerY),
    `${label} destination halo y`
  ).toBeLessThan(3);
  expect(report.tiles, `${label} tile count`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  if (options.mobile) {
    expect(report.completeRows, `${label} exact mobile rows`).toBe(8);
    expect(report.boardBottom, `${label} mobile board in viewport`).toBeLessThanOrEqual(844);
  }
  if (options.reducedMotion) {
    expect(report.destinationAnimation, `${label} static reduced-motion destination`).toBe("none");
  } else {
    expect(report.destinationAnimation, `${label} restrained destination pulse`).toBe("first-action-destination-pulse");
  }
}

function assertStableSelectedTileGeometry(report, label, options = {}) {
  expect(report.sampleCount, `${label} geometry sample count`).toBe(10);
  expect(report.tileCounts, `${label} every sample retains 64 tiles`).toEqual(Array(10).fill(64));
  expect(report.completeRows, `${label} every geometry sample retains eight rows`).toEqual(Array(10).fill(8));
  expect(report.maxTileDelta, `${label} real tile hit boxes remain fixed`).toBeLessThan(0.05);
  expect(report.movingTransforms, `${label} no real tile transform moves a hit target`).toEqual([]);
  expect(report.tileAnimationNames, `${label} button animation excludes moving preview throb`).not.toContain("harvest-ready-throb");
  if (options.reducedMotion) {
    expect(
      report.anchorAfterAnimations,
      `${label} reduced-motion preview overlay is effectively static`
    ).not.toContain("harvest-ready-glow");
  } else {
    expect(
      report.anchorAfterAnimations,
      `${label} preview overlay keeps the visual pulse`
    ).toContain("harvest-ready-glow");
  }
  if (options.mobile) {
    expect(
      Math.max(...report.boardBottoms),
      `${label} complete mobile board remains in the first viewport`
    ).toBeLessThanOrEqual(844);
  }
}

async function armedRelicGuidance(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const relic = state.armedLineRelic || null;
    const cueNode = document.querySelector("#firstSwapCue");
    const cueStyle = cueNode ? getComputedStyle(cueNode) : null;
    const cueBeforeStyle = cueNode ? getComputedStyle(cueNode, "::before") : null;
    const cuePrefix = (cueBeforeStyle?.content || "")
      .replace(/^['"]|['"]$/g, "");
    const hints = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      relic: tile.classList.contains("black-candle-vine"),
      destination: tile.classList.contains("line-relic-destination"),
      cue: tile.getAttribute("aria-label") || ""
    }));
    const laneTiles = Array.from(document.querySelectorAll(".tile.line-relic-lane-preview")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      armed: tile.classList.contains("black-candle-vine"),
      destination: tile.classList.contains("line-relic-destination"),
      forecastRole: tile.dataset.lineRelicForecast || "",
      laneIndex: Number(tile.dataset.lineRelicLaneIndex),
      markerDirection: tile.querySelector(".line-relic-lane-mark")?.classList.contains("vertical")
        ? "vertical"
        : tile.querySelector(".line-relic-lane-mark")?.classList.contains("horizontal") ? "horizontal" : "",
      outlineWidth: getComputedStyle(tile).outlineWidth,
      outlineColor: getComputedStyle(tile).outlineColor,
      thornTeach: tile.classList.contains("thorn-teach")
        || tile.classList.contains("thorn-teach-lane")
        || tile.classList.contains("thorn-teach-blocker")
    }));
    const board = document.querySelector("#board");
    const boardRect = board?.getBoundingClientRect();
    const source = board?.dataset.armedRelicSource || "";
    const destination = board?.dataset.armedRelicDestination || "";
    const directionText = (() => {
      const [sx, sy] = source.split(",").map(Number);
      const [dx, dy] = destination.split(",").map(Number);
      if (dx > sx) return "right";
      if (dx < sx) return "left";
      if (dy > sy) return "down";
      return "up";
    })();
    return {
      relic,
      hints,
      laneTiles,
      source,
      destination,
      directionText,
      laneCoordinates: (board?.dataset.armedRelicLane || "").split(" ").filter(Boolean),
      laneMarkers: document.querySelectorAll(".line-relic-lane-mark").length,
      cue: cueNode?.textContent.trim() || "",
      cuePrefix,
      cuePresentation: cueStyle ? {
        borderColor: cueStyle.borderColor,
        color: cueStyle.color,
        backgroundImage: cueStyle.backgroundImage,
        boxShadow: cueStyle.boxShadow,
        prefixBorderColor: cueBeforeStyle.borderRightColor,
        prefixColor: cueBeforeStyle.color
      } : null,
      bodyClasses: document.body.className,
      tutorial: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      boardActive: document.querySelector("#board")?.classList.contains("line-relic-guidance") || false,
      arrows: document.querySelectorAll(".swap-path-arrow").length,
      destinationCount: document.querySelectorAll(".tile.line-relic-destination").length,
      relicCount: document.querySelectorAll('.tile[data-line-relic="black-candle-vine"]').length,
      thornTeachCount: document.querySelectorAll(".tile.thorn-teach, .tile.thorn-teach-lane, .tile.thorn-teach-blocker").length,
      laneDirection: document.querySelector("#board")?.dataset.armedRelicDirection || "",
      boardBottom: boardRect ? boardRect.bottom : 0,
      tiles: document.querySelectorAll(".tile").length,
      rows: [...new Set(Array.from(document.querySelectorAll(".tile"))
        .map((tile) => Number(tile.dataset.y)))].length,
      completeRows: [...new Set(Array.from(document.querySelectorAll(".tile"))
        .map((tile) => tile.getBoundingClientRect())
        .filter((rect) => rect.top >= -1 && rect.bottom <= innerHeight + 1)
        .map((rect) => Math.round(rect.top)))].length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function cueSemanticPresentation(page) {
  return page.evaluate(() => {
    const cue = document.querySelector("#firstSwapCue");
    const style = cue ? getComputedStyle(cue) : null;
    const before = cue ? getComputedStyle(cue, "::before") : null;
    return {
      text: cue?.textContent.trim() || "",
      prefix: (before?.content || "").replace(/^['"]|['"]$/g, ""),
      visible: Boolean(cue && style.display !== "none" && cue.getBoundingClientRect().width > 0),
      bodyClasses: document.body.className,
      borderColor: style?.borderColor || "",
      color: style?.color || "",
      backgroundImage: style?.backgroundImage || "",
      prefixBorderColor: before?.borderRightColor || "",
      prefixColor: before?.color || ""
    };
  });
}

async function startBlackCandleThornFeedbackRecorder(page, options = {}) {
  await page.evaluate(({ maxFrames, settleFrames }) => {
    const frameLimit = Number(maxFrames) || 160;
    const settleAfterBothSeen = Number(settleFrames) || 8;
    window.__blackCandleThornFeedbackFrames = [];
    window.__blackCandleThornFeedbackSeen = {
      armed: false,
      break: false,
      frame: null
    };
    window.__blackCandleThornFeedbackDone = new Promise((resolve) => {
      let frame = 0;
      let bothSeenAt = null;
      let completed = false;
      const visible = (node) => {
        if (!node) return false;
        const style = getComputedStyle(node);
        const bounds = node.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && bounds.width > 0
          && bounds.height > 0;
      };
      const rect = (node) => {
        const bounds = node.getBoundingClientRect();
        return {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom
        };
      };
      const overlaps = (a, b) => (
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
      );
      const tick = () => {
        const impacts = Array.from(document.querySelectorAll(".board-particle.impact-sigil"))
          .filter(visible)
          .map((node) => ({ text: node.textContent.trim(), rect: rect(node) }));
        const thornEvents = Array.from(document.querySelectorAll(".thorn-event"))
          .filter(visible)
          .map((node) => ({ text: node.textContent.trim(), rect: rect(node) }));
        const snapshot = {
          frame,
          impacts,
          thornEvents,
          overlap: impacts.some((impact) => (
            thornEvents.some((thorn) => overlaps(impact.rect, thorn.rect))
          ))
        };
        window.__blackCandleThornFeedbackFrames.push(snapshot);
        window.__blackCandleThornFeedbackSeen.armed ||= impacts.some((impact) => impact.text === "ARMED");
        window.__blackCandleThornFeedbackSeen.break ||= thornEvents.some((event) => event.text === "BREAK");
        if (
          bothSeenAt === null
          && window.__blackCandleThornFeedbackSeen.armed
          && window.__blackCandleThornFeedbackSeen.break
        ) {
          bothSeenAt = frame;
          window.__blackCandleThornFeedbackSeen.frame = frame;
        }
        frame += 1;
        if (frame >= frameLimit || (bothSeenAt !== null && frame - bothSeenAt >= settleAfterBothSeen)) {
          completed = true;
          clearInterval(interval);
          resolve(window.__blackCandleThornFeedbackFrames);
          return;
        }
      };
      const interval = setInterval(() => {
        if (!completed) {
          tick();
        }
      }, 16);
      tick();
    });
  }, {
    maxFrames: options.maxFrames || 160,
    settleFrames: options.settleFrames || 8
  });
}

async function blackCandleThornFeedbackFrames(page) {
  await page.waitForTimeout(1000);
  return page.evaluate(() => window.__blackCandleThornFeedbackFrames || []);
}

async function startBlackCandleActivationRecorder(page) {
  await page.evaluate((key) => {
    window.__blackCandleActivationFrames = [];
    window.__blackCandleActivationDone = new Promise((resolve) => {
      let sawActivation = false;
      let settledFrames = 0;
      const visible = (node) => {
        if (!node) return false;
        const bounds = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity || 1) !== 0
          && bounds.width > 0
          && bounds.height > 0;
      };
      const rect = (node) => {
        if (!node) return null;
        const bounds = node.getBoundingClientRect();
        return {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height
        };
      };
      const tick = () => {
        const phase = document.body.dataset.blackCandleActivationPhase || "";
        const laneTiles = Array.from(document.querySelectorAll(".tile.black-candle-burn-cell"));
        const sourceTiles = laneTiles.filter((tile) => tile.classList.contains("black-candle-burn-source"));
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        const visibleInstructionText = [
          document.querySelector("#tutorialPanel"),
          document.querySelector("#firstSwapCue")
        ].filter(visible).map((node) => node.textContent.replace(/\s+/g, " ").trim());
        const visibleActions = Array.from(document.querySelectorAll("button:not(.tile)"))
          .filter(visible)
          .map((button) => button.textContent.replace(/\s+/g, " ").trim());
        const visibleHudText = [
          document.querySelector("#objective"),
          document.querySelector("#bouquetProgressLabel"),
          document.querySelector("#coinBalance"),
          document.querySelector("#bouquetProgressNext")
        ].filter(visible).map((node) => node.textContent.replace(/\s+/g, " ").trim());
        const frame = {
          phase,
          reduced: document.body.dataset.blackCandleActivationMotion || "",
          direction: document.body.dataset.blackCandleActivationDirection || "",
          lane: document.body.dataset.blackCandleActivationLane || "",
          savedMoves: Number(saved.moves),
          savedCounts: saved.counts || [],
          laneTiles: laneTiles.map((tile) => ({
            x: Number(tile.dataset.x),
            y: Number(tile.dataset.y),
            rect: rect(tile)
          })),
          activationOrigin: document.querySelector("#board")?.dataset.blackCandleActivationOrigin || "",
          activationDestination: document.querySelector("#board")?.dataset.blackCandleActivationDestination || "",
          activationCells: (document.querySelector("#board")?.dataset.blackCandleActivationCells || "")
            .split(" ")
            .filter(Boolean),
          activationSource: document.querySelector("#board")?.dataset.blackCandleActivationSource || "",
          sourceCount: sourceTiles.length,
          sourceRect: rect(sourceTiles[0]),
          boardRect: rect(document.querySelector("#board")),
          boardVisible: visible(document.querySelector("#board")),
          payoffVisible: visible(document.querySelector("#roundOneRestoration")),
          restoreOrNextVisible: visible(document.querySelector("#restoreGreenhouseBtn"))
            || visible(document.querySelector("#nextOrderBtn")),
          tiles: document.querySelectorAll("#board .tile").length,
          rows: new Set(Array.from(document.querySelectorAll("#board .tile"))
            .map((tile) => Math.round(tile.getBoundingClientRect().top))).size,
          armedPreview: document.querySelectorAll(
            ".tile.line-relic-lane-preview, .tile.line-relic-destination, .tile[data-line-relic='black-candle-vine']"
          ).length,
          sweepCount: document.querySelectorAll(".black-candle-burn-sweep").length,
          extinguished: document.querySelectorAll(".tile.black-candle-burn-extinguished").length,
          refill: document.querySelectorAll(".tile.black-candle-burn-refill").length,
          visibleInstructionText,
          visibleHudText,
          visibleActions,
          overflowX: document.documentElement.scrollWidth > innerWidth + 1
        };
        window.__blackCandleActivationFrames.push(frame);
        if (phase) {
          sawActivation = true;
          settledFrames = 0;
        } else if (sawActivation) {
          settledFrames += 1;
        }
        if ((sawActivation && settledFrames >= 4) || window.__blackCandleActivationFrames.length >= 240) {
          clearInterval(interval);
          resolve(window.__blackCandleActivationFrames);
        }
      };
      const interval = setInterval(tick, 16);
      tick();
    });
  }, SAVE_KEY);
}

async function blackCandleActivationFrames(page) {
  return page.evaluate(() => window.__blackCandleActivationDone);
}

async function runAtFrozenBlackCandlePhase(page, phase, trigger, { path = "", reload = false } = {}) {
  const client = await page.context().newCDPSession(page);
  await client.send("Debugger.enable");
  const paused = new Promise((resolve) => client.once("Debugger.paused", resolve));
  await page.evaluate((targetPhase) => {
    window.__blackCandlePeakObserver?.disconnect();
    window.clearTimeout(window.__blackCandlePeakPauseTimer);
    const pauseAtPeak = () => {
      if (document.body.dataset.blackCandleActivationPhase !== targetPhase) return;
      window.__blackCandlePeakObserver?.disconnect();
      window.__blackCandlePeakObserver = null;
      window.__blackCandlePeakPauseTimer = window.setTimeout(() => {
        if (document.body.dataset.blackCandleActivationPhase === targetPhase) debugger;
      }, targetPhase === "sweep" ? 120 : 35);
    };
    window.__blackCandlePeakObserver = new MutationObserver(pauseAtPeak);
    window.__blackCandlePeakObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-black-candle-activation-phase"]
    });
    pauseAtPeak();
  }, phase);
  const triggerPromise = trigger();
  await Promise.race([
    paused,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Black Candle ${phase} phase was not observed`)), 3000))
  ]);
  if (path) {
    const capture = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    fs.writeFileSync(path, Buffer.from(capture.data, "base64"));
  }
  await client.send("Debugger.resume");
  if (reload) {
    const reloadPromise = page.reload({ waitUntil: "networkidle" });
    await Promise.allSettled([triggerPromise]);
    await reloadPromise;
  } else {
    await triggerPromise;
  }
  await client.send("Debugger.disable").catch(() => {});
  await client.detach().catch(() => {});
}

async function activateBlackCandleInput(page, testCase, pair) {
  if (testCase.input === "touch") {
    await dragTouchViaCdp(page, pair, 0.62, { waitForSettlement: false });
  } else {
    const [source, destination] = pair;
    const sourceTile = page.locator(`.tile[data-x="${source.x}"][data-y="${source.y}"]`);
    await sourceTile.focus();
    await page.keyboard.press("Enter");
    const directionKey = destination.x > source.x
      ? "ArrowRight"
      : destination.x < source.x
        ? "ArrowLeft"
        : destination.y > source.y ? "ArrowDown" : "ArrowUp";
    const destinationTile = page.locator(`.tile[data-x="${destination.x}"][data-y="${destination.y}"]`);
    if (await destinationTile.evaluate((tile) => document.activeElement === tile)) {
      await page.keyboard.press("Enter");
    } else {
      await page.keyboard.press(directionKey);
    }
  }
}

function assertBlackCandleActivationFrames(frames, testCase, persisted, forecast) {
  const active = frames.filter((frame) => frame.phase);
  const forecastCells = forecast.laneCoordinates.slice().sort();
  expect(active.length, `${testCase.label} explicit activation was sampled`).toBeGreaterThan(5);
  const phaseNames = [...new Set(active.map((frame) => frame.phase))];
  expect(phaseNames, `${testCase.label} activation reaches refill`).toContain("refill");
  if (testCase.mobile) {
    expect(phaseNames, `${testCase.label} reduced motion uses one static burn hold`).toContain("hold");
    expect(phaseNames, `${testCase.label} reduced motion has no spatial sweep phase`).not.toContain("sweep");
    expect(active.every((frame) => frame.reduced === "reduced"), `${testCase.label} reduced marker`).toBe(true);
  } else {
    expect(phaseNames, `${testCase.label} full motion ignition`).toContain("ignition");
    expect(phaseNames, `${testCase.label} full motion sweep`).toContain("sweep");
    expect(phaseNames, `${testCase.label} full motion extinguish`).toContain("extinguish");
    expect(active.every((frame) => frame.reduced === "full"), `${testCase.label} full-motion marker`).toBe(true);
  }
  for (const frame of active) {
    expect(frame.direction, `${testCase.label} authored burn direction`).toBe(forecast.directionText);
    expect(frame.lane, `${testCase.label} affected lane kind`).toBe(
      forecast.laneDirection === "vertical" ? "column" : "row"
    );
    expect(frame.activationOrigin, `${testCase.label} commit retains the forecast origin`).toBe(forecast.source);
    expect(frame.activationDestination, `${testCase.label} commit retains the forecast destination`).toBe(forecast.destination);
    expect(frame.activationSource, `${testCase.label} relic ignites after reaching the forecast destination`).toBe(forecast.destination);
    expect(frame.activationCells.slice().sort(), `${testCase.label} commit authority equals the armed forecast`).toEqual(forecastCells);
    expect(frame.savedMoves, `${testCase.label} saved Moves decremented exactly once`).toBe(persisted.moves - 1);
    expect(frame.laneTiles, `${testCase.label} full eight-cell lane treatment`).toHaveLength(8);
    expect(
      frame.laneTiles.map((tile) => `${tile.x},${tile.y}`).sort(),
      `${testCase.label} every rendered activation cell equals the armed forecast`
    ).toEqual(forecastCells);
    expect(
      new Set(frame.laneTiles.map((tile) => tile[forecast.laneDirection === "vertical" ? "x" : "y"])).size,
      `${testCase.label} one authored lane`
    ).toBe(1);
    expect(frame.sourceCount, `${testCase.label} one visible ignition source`).toBe(1);
    expect(frame.armedPreview, `${testCase.label} armed preview is retired`).toBe(0);
    expect(frame.tiles, `${testCase.label} 64 settled tile controls remain`).toBe(64);
    expect(frame.rows, `${testCase.label} eight complete rows remain`).toBe(8);
    expect(frame.boardVisible, `${testCase.label} board remains visible`).toBe(true);
    expect(frame.payoffVisible, `${testCase.label} ceremony waits`).toBe(false);
    expect(frame.restoreOrNextVisible, `${testCase.label} no reward action starts early`).toBe(false);
    expect(frame.overflowX, `${testCase.label} no horizontal overflow`).toBe(false);
    expect(
      frame.visibleInstructionText.join(" "),
      `${testCase.label} present-tense event acknowledgment`
    ).toMatch(new RegExp(`Burning the full ${forecast.laneDirection === "vertical" ? "column" : "row"}`, "i"));
    expect(
      frame.visibleInstructionText.join(" "),
      `${testCase.label} no stale/future action language`
    ).not.toMatch(/\bSwap\b|\bTap\b|glowing pair|destination/i);
    expect(
      frame.visibleHudText.join(" "),
      `${testCase.label} HUD has no future reward action`
    ).not.toMatch(/\bSwap\b|\bTap\b|\bRestore\b|\bNext\b/i);
    expect(frame.sourceRect.top, `${testCase.label} source on screen`).toBeGreaterThanOrEqual(0);
    expect(frame.sourceRect.bottom, `${testCase.label} source on screen`).toBeLessThanOrEqual(testCase.viewport.height);
    expect(frame.sourceRect.left, `${testCase.label} source inside board`).toBeGreaterThanOrEqual(frame.boardRect.left - 1);
    expect(frame.sourceRect.right, `${testCase.label} source inside board`).toBeLessThanOrEqual(frame.boardRect.right + 1);
    for (const laneTile of frame.laneTiles) {
      expect(laneTile.rect.left, `${testCase.label} lane cell left on screen`).toBeGreaterThanOrEqual(0);
      expect(laneTile.rect.right, `${testCase.label} lane cell right on screen`).toBeLessThanOrEqual(testCase.viewport.width);
      expect(laneTile.rect.top, `${testCase.label} lane cell top on screen`).toBeGreaterThanOrEqual(0);
      expect(laneTile.rect.bottom, `${testCase.label} lane cell bottom on screen`).toBeLessThanOrEqual(testCase.viewport.height);
    }
    const orderedLane = frame.laneTiles.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    for (let index = 1; index < orderedLane.length; index += 1) {
      expect(
        orderedLane[index].rect.left >= orderedLane[index - 1].rect.right - 1
          || orderedLane[index].rect.top >= orderedLane[index - 1].rect.bottom - 1,
        `${testCase.label} lane cells do not overlap`
      ).toBe(true);
    }
  }
  expect(
    active.some((frame) => frame.phase === (testCase.mobile ? "hold" : "extinguish") && frame.extinguished === 8),
    `${testCase.label} real eight-cell extinguish peak`
  ).toBe(true);
  expect(
    active.some((frame) => frame.phase === "refill" && frame.refill === 8),
    `${testCase.label} settled refill reveal`
  ).toBe(true);
}

function assertArmedRelicGuidance(report, expectedDirection, label, mobile = false, options = {}) {
  const expectedArrows = options.expectedArrows ?? (report.bodyClasses.includes("round-one-active") ? 0 : 1);
  expect(report.relic, `${label} saved relic`).toMatchObject({ direction: expectedDirection });
  expect(report.relicCount, `${label} one rendered relic`).toBe(1);
  expect(report.hints, `${label} exactly one activation pair`).toHaveLength(2);
  expect(report.hints.filter((tile) => tile.relic), `${label} hinted pair includes relic`).toHaveLength(1);
  expect(report.hints.filter((tile) => tile.destination), `${label} hinted pair includes destination`).toHaveLength(1);
  expect(report.destinationCount, `${label} one destination marker`).toBe(1);
  expect(report.boardActive, `${label} board has armed guidance state`).toBe(true);
  expect(report.arrows, `${label} direct swap arrow count`).toBe(expectedArrows);
  expect(report.cue, `${label} cue names derived lane`).toContain(expectedDirection === "vertical" ? "column" : "row");
  expect(report.cuePrefix, `${label} cue category`).toBe("BLACK CANDLE");
  expect(report.cuePresentation, `${label} cue presentation exists`).toMatchObject({
    borderColor: "rgb(142, 107, 53)",
    color: "rgb(255, 240, 180)",
    prefixBorderColor: "rgb(118, 88, 46)",
    prefixColor: "rgb(185, 150, 95)"
  });
  expect(report.cuePresentation.backgroundImage, `${label} dark special background`).toContain("rgb(23, 16, 12)");
  expect(report.cuePresentation.backgroundImage, `${label} aged-gold center`).toContain("rgb(43, 29, 13)");
  expect(report.bodyClasses, `${label} armed semantic state`).toContain("armed-line-relic-cue");
  expect(report.laneDirection, `${label} board lane direction`).toBe(expectedDirection);
  expect(report.laneTiles, `${label} complete lane preview`).toHaveLength(8);
  expect(report.laneMarkers, `${label} eight visible lane rail segments`).toBe(8);
  expect(report.laneCoordinates.slice().sort(), `${label} board authority names the rendered lane`).toEqual(
    report.laneTiles.map((tile) => `${tile.x},${tile.y}`).sort()
  );
  expect(report.source, `${label} board names the relic origin`).toBe(`${report.relic.x},${report.relic.y}`);
  expect(report.laneTiles.filter((tile) => tile.forecastRole === "source"), `${label} one strongest source role`).toHaveLength(1);
  expect(report.laneTiles.filter((tile) => tile.forecastRole === "destination"), `${label} one obvious destination role`).toHaveLength(1);
  expect(report.laneTiles.filter((tile) => tile.forecastRole === "affected"), `${label} six quieter affected roles`).toHaveLength(6);
  expect(report.laneTiles.map((tile) => tile.laneIndex).sort((a, b) => a - b), `${label} exact edge-to-edge indices`).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(report.laneTiles.every((tile) => tile.markerDirection === expectedDirection), `${label} rail orientation`).toBe(true);
  expect(report.laneTiles.filter((tile) => tile.armed), `${label} lane contains relic`).toHaveLength(1);
  expect(report.laneTiles.filter((tile) => tile.destination), `${label} lane contains destination`).toHaveLength(1);
  expect(
    report.laneTiles.filter((tile) => tile.forecastRole === "source")[0],
    `${label} source uses the strongest bright frame`
  ).toMatchObject({ armed: true, outlineWidth: "2px" });
  expect(
    report.laneTiles.filter((tile) => tile.forecastRole === "destination")[0].outlineWidth,
    `${label} destination uses a stronger frame than affected cells`
  ).toBe("2px");
  expect(
    report.laneTiles.filter((tile) => tile.forecastRole === "affected").every((tile) => (
      tile.outlineColor === "rgb(185, 135, 77)" && tile.outlineWidth === "1px"
    )),
    `${label} remaining lane stays quieter aged gold`
  ).toBe(true);
  expect(report.laneTiles.some((tile) => tile.thornTeach), `${label} thorn accents subordinate`).toBe(false);
  expect(report.tiles, `${label} tile count`).toBe(64);
  expect(report.rows, `${label} board rows`).toBe(8);
  expect(report.overflowX, `${label} no overflow`).toBe(false);
  expect(report.brokenImages, `${label} no broken images`).toEqual([]);
  const fixed = expectedDirection === "vertical" ? "x" : "y";
  expect(new Set(report.laneTiles.map((tile) => tile[fixed])).size, `${label} lane fixed axis`).toBe(1);
  if (mobile) {
    expect(report.completeRows, `${label} exact mobile rows`).toBe(8);
    expect(report.boardBottom, `${label} mobile board in viewport`).toBeLessThanOrEqual(844);
  }
}

async function tileGeometry(page, pair) {
  return page.evaluate((pair) => {
    const pick = ({ x, y }) => {
      const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
      const rect = tile.getBoundingClientRect();
      return {
        x,
        y,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        transform: getComputedStyle(tile).transform,
        classes: tile.className
      };
    };
    return pair.map(pick);
  }, pair);
}

function dragVector(pair, geometry, scale = 0.62) {
  const [a, b] = pair;
  const [source, neighbor] = geometry;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  const distance = Math.max(
    34,
    Math.abs(dx ? neighbor.centerX - source.centerX : neighbor.centerY - source.centerY) * scale
  );
  return {
    startX: source.centerX,
    startY: source.centerY,
    endX: source.centerX + dx * distance,
    endY: source.centerY + dy * distance,
    dx,
    dy
  };
}

async function moveMouseToReadyPreview(page, pair, scale = 0.62) {
  const beforeGeometry = await tileGeometry(page, pair);
  const vector = dragVector(pair, beforeGeometry, scale);
  await page.mouse.move(vector.startX, vector.startY);
  await page.mouse.down();
  await page.mouse.move(vector.endX, vector.endY, { steps: 8 });
  await page.waitForFunction(() => document.querySelectorAll(".tile.drag-preview-ready").length === 2);
  const afterGeometry = await tileGeometry(page, pair);
  return { beforeGeometry, afterGeometry, vector };
}

async function previewDelta(page, pair, scale = 0.62) {
  const preview = await moveMouseToReadyPreview(page, pair, scale);
  const sourceDeltaX = preview.afterGeometry[0].left - preview.beforeGeometry[0].left;
  const sourceDeltaY = preview.afterGeometry[0].top - preview.beforeGeometry[0].top;
  const neighborDeltaX = preview.afterGeometry[1].left - preview.beforeGeometry[1].left;
  const neighborDeltaY = preview.afterGeometry[1].top - preview.beforeGeometry[1].top;
  return {
    ...preview,
    sourceAxis: preview.vector.dx ? sourceDeltaX : sourceDeltaY,
    neighborAxis: preview.vector.dx ? neighborDeltaX : neighborDeltaY
  };
}

async function releaseMouseAndWaitIdle(page) {
  await page.mouse.up();
  await page.waitForFunction(() => (
    !document.querySelector(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready")
    && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
  ), null, { timeout: 10000 });
}

async function findInvalidAdjacentPair(page, excludedCells = []) {
  return page.evaluate((excludedCells) => {
    const excluded = new Set(excludedCells.map(({ x, y }) => `${x},${y}`));
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    Array.from(document.querySelectorAll(".tile")).forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const swap = (a, b) => {
      const next = board.map((row) => row.slice());
      const temp = next[a.y][a.x];
      next[a.y][a.x] = next[b.y][b.x];
      next[b.y][b.x] = temp;
      return next;
    };
    const hasMatch = (next) => {
      for (let y = 0; y < 8; y += 1) {
        let start = 0;
        for (let x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (next[y][start] >= 0 && x - start >= 3) return true;
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        let start = 0;
        for (let y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (next[start][x] >= 0 && y - start >= 3) return true;
            start = y;
          }
        }
      }
      return false;
    };
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8 || board[a.y][a.x] === board[b.y][b.x]) continue;
          if (excluded.has(`${a.x},${a.y}`) || excluded.has(`${b.x},${b.y}`)) continue;
          if (!hasMatch(swap(a, b))) return [a, b];
        }
      }
    }
    return null;
  }, excludedCells);
}

async function findInvalidNeighborForCell(page, cell, excluded = null) {
  return page.evaluate(({ cell, excluded }) => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    Array.from(document.querySelectorAll(".tile")).forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const hasMatch = (next) => {
      for (let y = 0; y < 8; y += 1) {
        let start = 0;
        for (let x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (next[y][start] >= 0 && x - start >= 3) return true;
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        let start = 0;
        for (let y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (next[start][x] >= 0 && y - start >= 3) return true;
            start = y;
          }
        }
      }
      return false;
    };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neighbor = { x: cell.x + dx, y: cell.y + dy };
      if (
        neighbor.x < 0 || neighbor.x >= 8 || neighbor.y < 0 || neighbor.y >= 8
        || (excluded && neighbor.x === excluded.x && neighbor.y === excluded.y)
        || board[cell.y][cell.x] === board[neighbor.y][neighbor.x]
      ) {
        continue;
      }
      const next = board.map((row) => row.slice());
      [next[cell.y][cell.x], next[neighbor.y][neighbor.x]] = [
        next[neighbor.y][neighbor.x],
        next[cell.y][cell.x]
      ];
      if (!hasMatch(next)) {
        return neighbor;
      }
    }
    return null;
  }, { cell, excluded });
}

async function invalidFeedbackState(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tutorialPanel = document.querySelector("#tutorialPanel");
    const tutorialIcon = tutorialPanel?.querySelector(".tutorial-icon");
    const tutorialRect = tutorialPanel?.getBoundingClientRect();
    const tileRects = Array.from(document.querySelectorAll(".tile")).map((tile) => tile.getBoundingClientRect());
    const positiveFeedbackNodes = Array.from(document.querySelectorAll([
      ".board-particle.impact-sigil",
      ".board-particle.cascade-ring",
      ".board-particle.cascade-vein",
      ".board-particle.settle-spark",
      ".board-particle.resource-pop",
      ".board-particle.petal-pop",
      ".board-particle.coin-pop",
      ".harvest-mote",
      ".objective-flight",
      ".bouquet-bind-seal",
      ".greenhouse-intake-flight",
      ".order-pulse",
      ".tile.fall-in",
      ".tile.refill-born",
      ".tile.settle-pop"
    ].join(","))).filter(visible);
    const invalidNodes = Array.from(document.querySelectorAll(".tile.invalid-swap")).filter(visible);
    const intersects = (a, b) => (
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    );
    return {
      moves: saved.moves,
      counts: saved.counts || [],
      board: (saved.board || []).map((row) => row.join(",")).join("|"),
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialIcon: tutorialIcon?.textContent.trim() || "",
      tutorialIconAriaHidden: tutorialIcon?.getAttribute("aria-hidden") || "",
      tutorialText: tutorialPanel?.innerText.trim() || "",
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      hints: Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y),
        flowerId: Number(tile.dataset.flowerId)
      })),
      refusedTutorial: tutorialPanel?.classList.contains("refused-tutorial") || false,
      tutorialVisible: visible(tutorialPanel),
      tutorialClipped: Boolean(
        tutorialPanel
        && (
          tutorialPanel.scrollWidth > tutorialPanel.clientWidth + 1
          || tutorialRect.left < -1
          || tutorialRect.right > innerWidth + 1
        )
      ),
      firstSwapCueVisible: visible(document.querySelector("#firstSwapCue")),
      instructionSurfaces: [tutorialPanel, document.querySelector("#firstSwapCue")].filter(visible).length,
      guideCount: document.querySelectorAll(".first-action-swap-guide").length,
      arrowCount: document.querySelectorAll(".swap-path-arrow").length,
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      invalidTiles: Array.from(document.querySelectorAll(".tile.invalid-swap")).map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y),
        transform: getComputedStyle(tile).transform,
        invalidX: tile.style.getPropertyValue("--invalid-x"),
        invalidY: tile.style.getPropertyValue("--invalid-y")
      })),
      positiveFeedback: positiveFeedbackNodes.map((node) => ({
        className: node.className,
        text: node.textContent.trim()
      })),
      impactTexts: positiveFeedbackNodes
        .filter((node) => node.matches(".impact-sigil"))
        .map((node) => node.textContent.trim()),
      impactDomTexts: Array.from(document.querySelectorAll(".board-particle.impact-sigil"))
        .map((node) => node.textContent.trim()),
      orderPulseCount: positiveFeedbackNodes.filter((node) => node.matches(".order-pulse")).length,
      positiveFeedbackIntersections: positiveFeedbackNodes.reduce((count, node) => {
        const rect = node.getBoundingClientRect();
        return count + invalidNodes.filter((invalid) => intersects(rect, invalid.getBoundingClientRect())).length;
      }, 0),
      focusedCell: document.activeElement?.classList.contains("tile")
        ? { x: Number(document.activeElement.dataset.x), y: Number(document.activeElement.dataset.y) }
        : null,
      tiles: tileRects.length,
      rows: new Set(tileRects.map((rect) => Math.round(rect.top))).size,
      dataRows: new Set(Array.from(document.querySelectorAll(".tile")).map((tile) => tile.dataset.y)).size,
      boardBottom: Math.round(document.querySelector("#board")?.getBoundingClientRect().bottom || 0),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function commitGuidedSwapAtControlReturn(page, { keyboard = false, sampleImpact = false } = {}) {
  const before = await activeState(page);
  if (keyboard) {
    await keyboardGuidedSwap(page);
  } else {
    const pair = await hintedPair(page);
    await page.evaluate((cells) => {
      cells.forEach(({ x, y }) => {
        document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).click();
      });
    }, pair);
  }
  let feedbackPeak = null;
  if (sampleImpact) {
    await expect(page.locator(".board-particle.impact-sigil")).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator(".board-particle.impact-sigil")).toHaveText("HIT");
    feedbackPeak = await invalidFeedbackState(page);
  }
  await page.waitForFunction(({ key, movesBefore }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll(".tile"));
    return Number(saved.moves) === Number(movesBefore) - 1
      && tiles.length === 64
      && tiles.every((tile) => !tile.disabled);
  }, { key: SAVE_KEY, movesBefore: before.moves }, { timeout: 7000 });
  return {
    before,
    feedbackPeak,
    after: await invalidFeedbackState(page)
  };
}

function assertPassiveInputPreservesFeedback(before, after, label) {
  expect(before.orderPulseCount, `${label} starts with order feedback`).toBe(4);
  expect(after.orderPulseCount, `${label} preserves order feedback`).toBe(before.orderPulseCount);
  const orderPulses = (state) => state.positiveFeedback
    .filter((node) => node.className.includes("order-pulse"))
    .map((node) => ({
      ...node,
      className: node.className.replace(/\btarget-literacy\b/g, "").replace(/\s+/g, " ").trim()
    }));
  expect(orderPulses(after), `${label} preserves the completed order feedback`).toEqual(orderPulses(before));
  expect(after.moves, `${label} spends no move`).toBe(before.moves);
  expect(after.counts, `${label} preserves objective counts`).toEqual(before.counts);
  expect(after.board, `${label} preserves board`).toBe(before.board);
  expect(after.invalidTiles, `${label} has no refusal`).toEqual([]);
  expect(after.tiles, `${label} tile count`).toBe(64);
  expect(after.dataRows, `${label} board rows`).toBe(8);
  expect(after.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(after.brokenImages, `${label} no broken images`).toEqual([]);
}

function assertRefusalOwnsFeedback(state, label, { agency = false } = {}) {
  expect(state.tutorialIcon, `${label} refusal category`).toBe("NO BLOOM");
  expect(state.tutorialCopy, `${label} refusal copy`).toBe(
    agency ? "Try another adjacent swap." : "Use the glowing pair."
  );
  expect(state.invalidTiles, `${label} two refusal marks`).toHaveLength(2);
  expect(state.positiveFeedback, `${label} no prior positive feedback`).toEqual([]);
  expect(state.positiveFeedbackIntersections, `${label} no positive/refusal intersections`).toBe(0);
  expect(state.instructionSurfaces, `${label} one visible instruction`).toBe(1);
  expect(state.tiles, `${label} tile count`).toBe(64);
  expect(state.dataRows, `${label} data rows`).toBe(8);
  expect(state.overflowX, `${label} no horizontal overflow`).toBe(false);
  expect(state.brokenImages, `${label} no broken images`).toEqual([]);
}

async function refuseInvalidPair(page, { touch = false, repeat = false } = {}) {
  const pair = await findInvalidAdjacentPair(page);
  expect(pair, "invalid adjacent pair").toHaveLength(2);
  const before = await invalidFeedbackState(page);
  for (const cell of pair) {
    const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    if (touch) {
      await tile.tap();
    } else {
      await tile.click();
    }
  }
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
  await page.waitForTimeout(140);
  const peak = await invalidFeedbackState(page);
  let repeatedPeak = null;
  if (repeat) {
    for (const cell of pair) {
      const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
      if (touch) {
        await tile.tap();
      } else {
        await tile.click();
      }
    }
    await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
    await page.waitForTimeout(140);
    repeatedPeak = await invalidFeedbackState(page);
  }
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1600 });
  return {
    pair,
    before,
    peak,
    repeatedPeak,
    recovered: await invalidFeedbackState(page)
  };
}

async function assertRepeatedTutorialRefusal(page, { label, touch = false } = {}) {
  const refusal = await refuseInvalidPair(page, { touch, repeat: true });
  for (const [peakLabel, peak] of [
    ["first peak", refusal.peak],
    ["repeated peak", refusal.repeatedPeak]
  ]) {
    expect(peak.moves, `${label} ${peakLabel} preserves moves`).toBe(refusal.before.moves);
    expect(peak.board, `${label} ${peakLabel} preserves board`).toBe(refusal.before.board);
    expect(peak.tutorialIcon, `${label} ${peakLabel} category`).toBe("NO BLOOM");
    expect(peak.tutorialCopy, `${label} ${peakLabel} copy`).toBe("Use the glowing pair.");
    expect(peak.invalidTiles, `${label} ${peakLabel} keeps both marks`).toHaveLength(2);
    expect(peak.guideCount, `${label} ${peakLabel} hides board movement guide`).toBe(0);
    expect(peak.arrowCount, `${label} ${peakLabel} hides fallback arrow`).toBe(0);
  }
  expect(refusal.recovered.tutorialCopy, `${label} restores stage copy`).toBe(refusal.before.tutorialCopy);
  expect(refusal.recovered.tutorialIcon, `${label} restores stage category`).toBe(refusal.before.tutorialIcon);
  expect(refusal.recovered.cue, `${label} restores hidden cue`).toBe(refusal.before.cue);
  expect(refusal.recovered.hints, `${label} restores exact hint pair`).toEqual(refusal.before.hints);
  expect(refusal.recovered.guideCount, `${label} restores settled movement guide`).toBe(refusal.before.guideCount);
  expect(refusal.recovered.arrowCount, `${label} restores settled arrow count`).toBe(refusal.before.arrowCount);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(refusal.before.hints.length);
  const reloaded = await invalidFeedbackState(page);
  expect(reloaded.tutorialCopy, `${label} reload stage copy`).toBe(refusal.before.tutorialCopy);
  expect(reloaded.tutorialIcon, `${label} reload stage category`).toBe(refusal.before.tutorialIcon);
  expect(reloaded.cue, `${label} reload hidden cue`).toBe(refusal.before.cue);
  expect(reloaded.hints, `${label} reload exact hint pair`).toEqual(refusal.before.hints);
  expect(reloaded.guideCount, `${label} reload restores settled movement guide`).toBe(refusal.before.guideCount);
  expect(reloaded.arrowCount, `${label} reload restores settled arrow count`).toBe(refusal.before.arrowCount);
  expect(reloaded.invalidTiles, `${label} reload clears transient refusal`).toEqual([]);
  return refusal;
}

let cdpTouchSequence = 7;

async function dragTouchViaCdp(
  page,
  pair,
  scale = 0.62,
  { expectInvalid = false, waitForSettlement = true } = {}
) {
  const beforeGeometry = await tileGeometry(page, pair);
  const movesBefore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").moves, SAVE_KEY);
  const vector = dragVector(pair, beforeGeometry, scale);
  const client = await page.context().newCDPSession(page);
  const touchId = cdpTouchSequence++;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: vector.startX, y: vector.startY, id: touchId }]
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: vector.endX, y: vector.endY, id: touchId }]
  });
  await page.waitForFunction(
    () => document.querySelectorAll(".tile.drag-preview-ready").length === 2,
    null,
    { timeout: 3000 }
  );
  const afterGeometry = await tileGeometry(page, pair);
  await page.screenshot({ path: "work/drag-preview-mobile-ready.png", fullPage: true });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
    changedTouchPoints: [{ x: vector.endX, y: vector.endY, id: touchId }]
  });
  if (waitForSettlement) {
    await page.waitForFunction(({ key, movesBefore, expectInvalid }) => {
      if (expectInvalid) {
        return document.querySelectorAll(".tile.invalid-swap").length === 2;
      }
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      const boardSettled = Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      const payoffVisible = getComputedStyle(document.querySelector("#roundOneRestoration")).display !== "none";
      return Number(saved.moves) === Number(movesBefore) - 1 && (boardSettled || payoffVisible);
    }, { key: SAVE_KEY, movesBefore, expectInvalid }, { timeout: 10000 });
  }
  await client.detach();
  return { beforeGeometry, afterGeometry, vector };
}

async function completeRoundWithReviewKey(page) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  await page.locator("body").click({ position: { x: 12, y: 12 } });
  await page.keyboard.press("n");
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function forceActiveBouquetFailure(page) {
  const marker = "bloomForcedFailureStateV1";
  await page.addInitScript(({ key, markerKey }) => {
    const forcedState = sessionStorage.getItem(markerKey);
    if (forcedState) {
      localStorage.setItem(key, forcedState);
      sessionStorage.removeItem(markerKey);
    }
  }, { key: SAVE_KEY, markerKey: marker });
  await page.evaluate(({ key, markerKey }) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.roundComplete = false;
    state.moves = 0;
    state.tutorialSkipped = false;
    sessionStorage.setItem(markerKey, JSON.stringify(state));
  }, { key: SAVE_KEY, markerKey: marker });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
}

async function economyMigrationReport(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      coins: saved.coins,
      version: saved.focusedEconomyVersion,
      coinBalanceText: document.querySelector("#coinBalance")?.textContent.replace(/\s+/g, " ").trim() || "",
      coinBalanceValue: document.querySelector("#coinBalance")?.dataset.balance || "",
      coinBalanceVisible: visible(document.querySelector("#coinBalance")),
      coinBalancePulsing: document.querySelector("#coinBalance")?.classList.contains("balance-pulse") || false,
      coinBalanceOccurrences: (document.body.innerText.match(/COINS\s+\d+/gi) || []).length,
      tiles: document.querySelectorAll(".tile").length,
      actions: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest("#board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      transaction: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  }, SAVE_KEY);
}

const LEGACY_ECONOMY_SOURCES = [
  { label: "unversioned", version: undefined, surplus: 188 },
  { label: "version-one-inflated", version: 1, surplus: 100 }
];

for (const viewport of [
  { label: "desktop", width: 1280, height: 720 },
  { label: "mobile390", width: 390, height: 844 }
]) {
  test(`legacy focused economy migrates once on ${viewport.label}`, async ({ browser }) => {
    for (const source of LEGACY_ECONOMY_SOURCES) {
      for (const migrationCase of LEGACY_ECONOMY_CASES) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height }
        });
        const page = await context.newPage();
        const legacyState = {
          coins: source.version === undefined ? source.surplus : migrationCase.coins + source.surplus,
          cursedThorns: [],
          clearedCursedThorns: 0,
          roundOneRestored: false,
          roundTwoGreenhouseUpgraded: false,
          roundThreeConservatoryRaised: false,
          hasMadeValidMove: true,
          tutorialSkipped: true,
          tutorialActive: false,
          ...(source.version === undefined ? {} : { focusedEconomyVersion: source.version }),
          ...migrationCase.state
        };
        await page.addInitScript(({ key, state, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, JSON.stringify(state));
            sessionStorage.setItem(marker, "1");
          }
        }, {
          key: SAVE_KEY,
          state: legacyState,
          marker: `legacy-economy-${viewport.label}-${source.label}-${migrationCase.label}`
        });
        await page.goto(`${BASE_URL}?legacy-economy=${viewport.label}-${migrationCase.label}&bloomReview=1`, { waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);

        for (let reload = 0; reload < 2; reload += 1) {
          const report = await economyMigrationReport(page);
          expect(report.coins, `${source.label} ${migrationCase.label} balance after reload ${reload}`).toBe(migrationCase.coins);
          expect(report.version, `${migrationCase.label} migration version`).toBe(FOCUSED_ECONOMY_VERSION);
          expect(report.coinBalanceText).toBe(`✪ Coins ${migrationCase.coins}`);
          expect(report.coinBalanceValue).toBe(String(migrationCase.coins));
          expect(report.coinBalanceVisible).toBe(true);
          expect(report.coinBalancePulsing).toBe(false);
          expect(report.coinBalanceOccurrences).toBe(1);
          expect(report.tiles).toBe(64);
          expect(report.brokenImages).toEqual([]);
          expect(report.overflowX).toBe(false);
          expect(report.actions.length, `${migrationCase.label} focused action cap`).toBeLessThanOrEqual(2);
          if (migrationCase.action) {
            expect(report.actions).toEqual([migrationCase.action]);
            expect(report.transaction).toBe(migrationCase.transaction);
            await expect(page.getByRole("button", { name: migrationCase.action, exact: true })).toBeFocused();
          }
          await page.reload({ waitUntil: "networkidle" });
          await expect(page.locator(".tile")).toHaveCount(64);
        }

        if (migrationCase.spentCoins !== undefined) {
          await expect(page.getByRole("button", { name: migrationCase.action, exact: true })).toBeFocused();
          await page.keyboard.press("Enter");
          const changedReport = await economyMigrationReport(page);
          expect(changedReport.coinBalancePulsing, `${migrationCase.label} spend confirms balance change`).toBe(true);
          for (let reload = 0; reload < 2; reload += 1) {
            await page.reload({ waitUntil: "networkidle" });
            await expect(page.locator(".tile")).toHaveCount(64);
            const report = await economyMigrationReport(page);
            expect(report.coins, `${migrationCase.label} spent balance after reload ${reload}`).toBe(migrationCase.spentCoins);
            expect(report.coinBalanceText).toBe(`✪ Coins ${migrationCase.spentCoins}`);
            expect(report.coinBalanceValue).toBe(String(migrationCase.spentCoins));
            expect(report.coinBalanceVisible).toBe(true);
            expect(report.coinBalancePulsing, `reload ${reload} does not replay balance pulse`).toBe(false);
            expect(report.coinBalanceOccurrences).toBe(1);
            expect(report.version).toBe(FOCUSED_ECONOMY_VERSION);
            expect(report.actions).toEqual([migrationCase.spentAction]);
            expect(report.transaction).toBe(migrationCase.spentTransaction);
            expect(report.tiles).toBe(64);
            expect(report.brokenImages).toEqual([]);
            expect(report.overflowX).toBe(false);
          }
        } else if (migrationCase.enteredRound) {
          await expect(page.getByRole("button", { name: migrationCase.action, exact: true })).toBeFocused();
          await page.keyboard.press("Enter");
          await expect(page.locator(".tile")).toHaveCount(64);
          const activeState = await economyMigrationReport(page);
          expect(activeState.coins).toBe(migrationCase.enteredCoins);
          expect(activeState.coinBalanceText).toBe(`✪ Coins ${migrationCase.enteredCoins}`);
          expect(activeState.coinBalanceValue).toBe(String(migrationCase.enteredCoins));
          expect(activeState.coinBalanceVisible).toBe(true);
          expect(activeState.coinBalanceOccurrences).toBe(1);
          expect(activeState.version).toBe(FOCUSED_ECONOMY_VERSION);
          expect(activeState.actions.length).toBeLessThanOrEqual(2);
          expect(activeState.brokenImages).toEqual([]);
          expect(activeState.overflowX).toBe(false);
          await expect(page.locator(`.tile[tabindex="0"]`)).toHaveCount(1);
          await expect(page.locator(`.tile[tabindex="0"]`)).toBeFocused();
          const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), SAVE_KEY);
          expect(saved.currentRound).toBe(migrationCase.enteredRound);
        }
        await context.close();
      }
    }
  });
}

for (const viewport of [
  { label: "desktop", width: 1280, height: 720, mobile: false },
  { label: "mobile390", width: 390, height: 844, mobile: true }
]) {
  test(`fresh no-review guided Round 1 teaches Black Candle before payoff on ${viewport.label}`, async ({ page }) => {
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

    await seedDeterministicMath(page, `fresh-black-candle-${viewport.label}`);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openFreshNoReview(page, `black-candle-${viewport.label}`);
    await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(false);
    await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });

    const trace = [await guidedRoundOneState(page, "initial")];
    const guidedPairs = [trace[0].hints];
    assertActiveGuidedState(trace[0], viewport.mobile, `${viewport.label} initial`);
    expect(unorderedPairKey(guidedPairs[0]), `${viewport.label} exact authored opening pair`)
      .toBe("1,0 <-> 1,1");
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} opening guide`,
      { mobile: viewport.mobile, stage: "thorn-opening" }
    );
    await assertRepeatedTutorialRefusal(page, {
      label: `${viewport.label} opening refusal`
    });

    for (let index = 1; index <= 2; index += 1) {
      await clickHighlightedPair(page);
      if (index === 1) {
        const discoveryStartedAt = Date.now();
        const discovery = await guidedRoundOneState(page, "post-opening discovery");
        trace.push(discovery);
        assertActiveGuidedState(discovery, viewport.mobile, `${viewport.label} post-opening discovery`);
        expect(discovery.moves, `${viewport.label} opening spends once`).toBe(5);
        expect(discovery.counts, `${viewport.label} opening fills Thorn Rose`).toEqual([0, 0, 0, 0, 0, 3]);
        expect(discovery.tutorial, `${viewport.label} literal target discovery cue`).toBe("Find 3 Thorn Roses.");
        expect(discovery.cue, `${viewport.label} hidden cue shares target language`).toBe("Find 3 Thorn Roses.");
        expect(discovery.hints, `${viewport.label} no immediate prescribed pair`).toEqual([]);
        expect(discovery.targetLiteracy, `${viewport.label} family identity state`).toBe("Thorn Rose");
        expect(discovery.literacyTiles, `${viewport.label} every visible Thorn Rose echoes`).toHaveLength(discovery.targetFamilyTiles);
        expect(discovery.literacyTiles.every((tile) => tile.flowerId === 5), `${viewport.label} treatment stays on target family`).toBe(true);
        expect(discovery.nonTargetLiteracyTiles, `${viewport.label} no non-target treatment`).toBe(0);
        expect(discovery.objectiveLiteracyTargets, `${viewport.label} objective icon echoes once`).toBe(1);
        await expect(page.locator(
          ".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide, .tile.sel, .tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready"
        )).toHaveCount(0);
        await page.screenshot({
          path: `work/round-one-agency-${viewport.label}-discovery.png`,
          fullPage: true
        });

        await page.waitForTimeout(1300);
        await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
        await expect(page.locator(".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);
        await page.waitForTimeout(4500);
        await expect(page.locator(".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
        const rescueElapsed = Date.now() - discoveryStartedAt;
        expect(rescueElapsed, `${viewport.label} rescue waits about seven seconds`).toBeGreaterThanOrEqual(6200);
        expect(rescueElapsed, `${viewport.label} rescue remains bounded`).toBeLessThan(9500);
        await expect(page.locator(".first-action-swap-guide")).toHaveCount(1);
        const delayed = await guidedRoundOneState(page, "post-opening delayed rescue");
        expect(delayed.moves, `${viewport.label} delayed hint spends no move`).toBe(discovery.moves);
        expect(delayed.counts, `${viewport.label} delayed hint changes no objective`).toEqual(discovery.counts);
        expect(delayed.tutorial, `${viewport.label} delayed copy is literal`).toBe("Match Thorn Rose.");
        expect(delayed.cue, `${viewport.label} delayed hidden cue names target`).toBe("Match Thorn Rose with the glowing pair.");
        expect(delayed.literacyTiles, `${viewport.label} family echo retires before exact rescue`).toEqual([]);
        const followupPair = delayed.hints;
        const usefulPairs = await objectiveUsefulPairs(page);
        expect(
          usefulPairs.some((candidate) => unorderedPairKey(candidate.pair) === unorderedPairKey(followupPair)),
          `${viewport.label} delayed pair is a legal objective-useful swap`
        ).toBe(true);
        guidedPairs.push(followupPair);
        assertFirstActionGuide(
          await firstActionGuideReport(page),
          followupPair,
          `${viewport.label} delayed agency rescue`,
          { mobile: viewport.mobile, stage: "thorn-followup" }
        );
        expect(unorderedPairKey(followupPair), `${viewport.label} post-opening guide moves across the altar`)
          .not.toBe(unorderedPairKey(guidedPairs[0]));
        expect(
          followupPair.every((cell) => !guidedPairs[0].some((openingCell) => (
            openingCell.x === cell.x && openingCell.y === cell.y
          ))),
          `${viewport.label} post-opening guide has no opening endpoint overlap`
        ).toBe(true);
        await page.screenshot({
          path: `work/round-one-agency-${viewport.label}-delayed-hint.png`,
          fullPage: true
        });
      } else {
        await expect(page.locator(".first-action-swap-guide")).toHaveCount(1, { timeout: 2500 });
        trace.push(await guidedRoundOneState(page, `after swap ${index}`));
        assertActiveGuidedState(trace[trace.length - 1], viewport.mobile, `${viewport.label} after swap ${index}`);
        const followupPair = await hintedPair(page);
        guidedPairs.push(followupPair);
        assertFirstActionGuide(
          await firstActionGuideReport(page),
          followupPair,
          `${viewport.label} after swap ${index} guide`,
          { mobile: viewport.mobile, stage: "black-candle" }
        );
      }
    }

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const reloaded = await guidedRoundOneState(page, "after reload");
    assertActiveGuidedState(reloaded, viewport.mobile, `${viewport.label} reload`);
    expect(reloaded.moves).toBe(trace[2].moves);
    expect(reloaded.counts).toEqual(trace[2].counts);
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} reload guide`,
      { mobile: viewport.mobile, stage: "black-candle" }
    );

    const blackCandleCue = reloaded;
    assertActiveGuidedState(blackCandleCue, viewport.mobile, `${viewport.label} before Black Candle`);
    expect(blackCandleCue.tutorial).toBe("Match 4 arms Black Candle Vine.");
    expect(blackCandleCue.cue).toBe("Make 4 Bone Stars - arm Black Candle Vine.");
    expect(blackCandleCue.hints).toHaveLength(2);
    expect(Math.abs(blackCandleCue.hints[0].x - blackCandleCue.hints[1].x) + Math.abs(blackCandleCue.hints[0].y - blackCandleCue.hints[1].y)).toBe(1);
    const preview = await legalFourBoneStarPreview(page);
    expect(preview.ok, JSON.stringify(preview)).toBe(true);
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} strict-four guide`,
      { mobile: viewport.mobile, stage: "black-candle" }
    );
    await page.screenshot({ path: `work/tutorial-guide-${viewport.label}-strict-four.png`, fullPage: true });

    await expect(page.locator("#tutorialPanel")).toBeVisible();
    const preFormationRefusal = await assertRepeatedTutorialRefusal(page, {
      label: `${viewport.label} Match 4 refusal`
    });
    const restoredFormationCue = await guidedRoundOneState(page, "Black Candle formation after refusal");
    expect(restoredFormationCue.cue).toBe("Make 4 Bone Stars - arm Black Candle Vine.");
    expect(restoredFormationCue.hints).toEqual(blackCandleCue.hints);

    await clickHighlightedPair(page);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
    await waitForSettledBoard(page);
    await expect(page.locator(".first-action-swap-guide")).toHaveCount(1, { timeout: 2500 });
    const formed = await guidedRoundOneState(page, "Black Candle armed");
    trace.push(formed);
    guidedPairs.push(formed.hints);
    expect(formed.roundComplete).toBe(false);
    expect(formed.payoffVisible).toBe(false);
    expect(formed.tiles).toBe(64);
    expect(formed.rows).toBe(8);
    expect(formed.overflowX).toBe(false);
    expect(formed.brokenImages).toEqual([]);
    if (viewport.mobile) {
      expect(formed.completeRows).toBe(8);
      expect(formed.boardBottom).toBeLessThanOrEqual(844);
    }
    expect(formed.moves).toBe(blackCandleCue.moves - 1);
    expect(formed.counts[1] - blackCandleCue.counts[1]).toBe(4);
    expect(formed.cue).toContain("Swap Black Candle Vine");
    expect(formed.hints).toHaveLength(2);
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} armed activation guide`,
      { mobile: viewport.mobile, stage: "black-candle-activation" }
    );
    assertNaturalBlackCandleTutorial(
      formed,
      viewport.mobile,
      `${viewport.label} formed Round 1 Black Candle`
    );
    assertArmedRelicGuidance(
      await armedRelicGuidance(page),
      "horizontal",
      `${viewport.label} formed Round 1 Black Candle`,
      viewport.mobile,
      { expectedArrows: 0 }
    );
    await page.screenshot({ path: "work/tutorial-guide-" + viewport.label + "-armed-activation.png", fullPage: true });

    for (let index = 1; index < guidedPairs.length; index += 1) {
      expect(
        unorderedPairKey(guidedPairs[index]),
        `${viewport.label} consecutive guided pairs ${index} and ${index + 1}`
      ).not.toBe(unorderedPairKey(guidedPairs[index - 1]));
    }

    for (let reloadIndex = 0; reloadIndex < 2; reloadIndex += 1) {
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      const reloadedArmed = await guidedRoundOneState(page, `Black Candle armed reload ${reloadIndex + 1}`);
      expect(reloadedArmed.moves).toBe(formed.moves);
      expect(reloadedArmed.counts).toEqual(formed.counts);
      assertNaturalBlackCandleTutorial(
        reloadedArmed,
        viewport.mobile,
        `${viewport.label} armed reload ${reloadIndex + 1}`
      );
      assertFirstActionGuide(
        await firstActionGuideReport(page),
        await hintedPair(page),
        `${viewport.label} armed reload ${reloadIndex + 1} guide`,
        { mobile: viewport.mobile, stage: "black-candle-activation" }
      );
    }

    const interruptedActivation = await interruptGuidedSwapWithReload(page);
    expect(interruptedActivation.after, `${viewport.label} activation interruption restores armed state`).toMatchObject({
      moves: interruptedActivation.before.moves,
      counts: interruptedActivation.before.counts,
      board: interruptedActivation.before.board,
      armedLineRelic: interruptedActivation.before.armedLineRelic,
      tiles: 64,
      rows: 8,
      overflowX: false
    });
    assertNaturalBlackCandleTutorial(
      await guidedRoundOneState(page, "Black Candle armed after interrupted activation"),
      viewport.mobile,
      `${viewport.label} interrupted activation`
    );
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} interrupted activation guide restore`,
      { mobile: viewport.mobile, stage: "black-candle-activation" }
    );

    const armedRefusal = await assertRepeatedTutorialRefusal(page, {
      label: `${viewport.label} armed Black Candle refusal`
    });
    expect(armedRefusal.recovered.tutorialIcon).toBe("BLACK CANDLE");
    expect(armedRefusal.recovered.tutorialCopy).toBe("Swap right to burn this row.");
    assertNaturalBlackCandleTutorial(
      await guidedRoundOneState(page, "Black Candle armed after refusal"),
      viewport.mobile,
      `${viewport.label} armed refusal cleanup`
    );
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} armed refusal guide restore`,
      { mobile: viewport.mobile, stage: "black-candle-activation" }
    );

    await page.locator("#tutorialSkipBtn").click();
    await expect(page.locator("#tutorialPanel")).toBeHidden();
    await expect(page.locator("#firstSwapCue")).toBeVisible();
    await expect(page.locator("#shuffleBtn")).toBeVisible();
    await expect(page.locator("#shuffleBtn")).toBeEnabled();
    await expect(page.locator(".first-action-swap-guide")).toHaveCount(0);
    await expect(page.locator(".swap-path-arrow")).toHaveCount(0);
    assertArmedRelicGuidance(
      await armedRelicGuidance(page),
      "horizontal",
      `${viewport.label} Skip restores persistent Black Candle cue`,
      viewport.mobile,
      { expectedArrows: 0 }
    );
    await page.locator("#tutorialHelpBtn").click();
    await expect(page.locator("#tutorialPanel")).toBeVisible();
    await expect(page.locator("#firstSwapCue")).toBeHidden();
    await expect(page.locator("#shuffleBtn")).toBeHidden();
    await expect(page.locator("#shuffleBtn")).toBeDisabled();
    assertFirstActionGuide(
      await firstActionGuideReport(page),
      await hintedPair(page),
      `${viewport.label} Help replay guide`,
      { mobile: viewport.mobile, stage: "black-candle-activation" }
    );
    assertNaturalBlackCandleTutorial(
      await guidedRoundOneState(page, "Black Candle armed after Help replay"),
      viewport.mobile,
      `${viewport.label} Help replay`
    );

    await clickHighlightedPair(page);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(0);
    const activated = await guidedRoundOneState(page, "Black Candle activated");
    trace.push(activated);
    expect(activated.roundComplete).toBe(true);
    expect(activated.bouquet).toBe("Bouquet 14/14 -> Reward 120 coins");
    expect(activated.moves).toBe(formed.moves - 1);
    expect(activated.tiles).toBe(64);
    expect(activated.overflowX).toBe(false);
    expect(activated.brokenImages).toEqual([]);
    expect(activated.namedBlackCandleTutorial).toBe(false);
    expect(activated.tutorialIconText).toBe("✦");
    expect(activated.tutorialIconAriaHidden).toBe("true");
    expect(activated.tutorialPanelText).not.toContain("BLACK CANDLE");
    expect(activated.visibleInstructionSurfaces).toBe(1);
    await page.screenshot({ path: "work/black-candle-" + viewport.label + "-activated.png", fullPage: true });

    await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 3000 });
    const ceremony = await guidedRoundOneState(page, "ceremony");
    trace.push(ceremony);
    expect(ceremony.boardVisible).toBe(false);
    expect(ceremony.payoffVisible).toBe(true);
    expect(ceremony.coins).toBe(120);
    expect(ceremony.bouquet).toBe("Bouquet 14/14 -> Reward 120 coins");
    expect(ceremony.tutorial).toBe("Coins restore the greenhouse.");
    expect(ceremony.visibleButtons).toEqual(["Restore Greenhouse · 100 coins"]);
    expect(ceremony.visibleButtons.filter((label) => label.startsWith("Restore"))).toHaveLength(1);
    expect(ceremony.payoffTokens).toEqual(expect.arrayContaining(["x8 Thorn Rose", "x6 Bone Star"]));
    expect(ceremony.overflowX).toBe(false);
    expect(ceremony.brokenImages).toEqual([]);
    await page.screenshot({ path: `work/black-candle-${viewport.label}-ceremony.png`, fullPage: true });

    await page.locator("#restoreGreenhouseBtn").click();
    await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 3000 });
    const restored = await guidedRoundOneState(page, "restored");
    expect(restored.coins).toBe(20);
    expect(restored.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);

    console.log(`${viewport.label} fresh guided Black Candle trace: ${JSON.stringify(trace.map((state) => ({
      tag: state.tag,
      moves: state.moves,
      counts: state.counts,
      bouquet: state.bouquet,
      cue: state.cue,
      tutorial: state.tutorial,
      hints: state.hints,
      roundComplete: state.roundComplete,
      lineRelicHit: state.lineRelicHit,
      lineRelicParticles: state.lineRelicParticles,
      payoffVisible: state.payoffVisible
    })))}`);
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}

test("Round 1 agency retires and restores guidance across real input boundaries", async ({ browser }) => {
  const cases = [
    { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
    { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
    { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
    { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
  ];

  const activatePair = async (page, pair, input) => {
    const tile = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    if (input === "touch") {
      await tile(pair[0]).tap();
      await tile(pair[1]).tap();
      return;
    }
    if (input === "keyboard") {
      await tile(pair[0]).focus();
      await page.keyboard.press("Enter");
      await tile(pair[1]).focus();
      await page.keyboard.press("Enter");
      return;
    }
    await tile(pair[0]).click();
    await tile(pair[1]).click();
  };

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(
      `${request.url()} ${request.failure()?.errorText || ""}`
    ));

    try {
      await openFreshNoReview(page, `round-one-agency-${testCase.label}`);
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      const opening = await hintedPair(page);
      if (testCase.input === "pointer") {
        await previewDelta(page, opening);
        await releaseMouseAndWaitIdle(page);
      } else if (testCase.input === "touch") {
        await dragTouchViaCdp(page, opening);
      } else {
        await keyboardGuidedSwap(page);
      }
      await waitForSettledBoard(page);
      const discovery = await guidedRoundOneState(page, `${testCase.label} discovery`);
      expect(discovery.moves, `${testCase.label} opening spends once`).toBe(5);
      expect(discovery.counts, `${testCase.label} opening objective`).toEqual([0, 0, 0, 0, 0, 3]);
      expect(discovery.hints, `${testCase.label} discovery has no hint`).toEqual([]);
      expect(discovery.tutorial, `${testCase.label} target-literal discovery`).toBe("Find 3 Thorn Roses.");
      expect(discovery.targetLiteracy, `${testCase.label} target family is named`).toBe("Thorn Rose");
      expect(discovery.literacyTiles, `${testCase.label} uniform family echo`).toHaveLength(discovery.targetFamilyTiles);
      expect(discovery.literacyTiles.every((tile) => tile.flowerId === 5), `${testCase.label} family-only echo`).toBe(true);
      expect(discovery.nonTargetLiteracyTiles, `${testCase.label} non-target tiles stay quiet`).toBe(0);
      expect(discovery.objectiveLiteracyTargets, `${testCase.label} objective identity echoes`).toBe(1);
      if (testCase.reduced) {
        expect(discovery.literacyTiles.every((tile) => tile.outline === "solid"), `${testCase.label} static family outline`).toBe(true);
        expect(
          discovery.literacyTiles.every((tile) => Number.parseFloat(tile.animationDuration) <= 0.001),
          `${testCase.label} family echo suppresses motion`
        ).toBe(true);
      }
      await expect(page.locator(
        ".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide, .tile.sel, .tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready"
      )).toHaveCount(0);

      if (testCase.input === "keyboard") {
        await page.locator(".tile[tabindex='0']").focus();
        await page.keyboard.press("ArrowRight");
      } else {
        const cancelCell = page.locator('.tile[data-x="0"][data-y="0"]');
        const box = await cancelCell.boundingBox();
        expect(box).toBeTruthy();
        const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        if (testCase.input === "touch") {
          const client = await context.newCDPSession(page);
          await client.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: start.x, y: start.y, id: 71 }]
          });
          await client.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: start.x + 32, y: start.y, id: 71 }]
          });
          await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
        } else {
          await page.mouse.move(start.x, start.y);
          await page.mouse.down();
          await page.mouse.move(start.x + 32, start.y, { steps: 4 });
          await page.dispatchEvent("#board", "pointercancel", {
            pointerId: 1,
            bubbles: true,
            cancelable: true,
            isPrimary: true,
            clientX: start.x + 32,
            clientY: start.y
          });
          await page.mouse.up();
        }
      }
      await expect(page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready")).toHaveCount(0);
      await page.waitForTimeout(900);
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);

      const invalidPair = await findInvalidAdjacentPair(page);
      expect(invalidPair, `${testCase.label} invalid pair`).toHaveLength(2);
      await activatePair(page, invalidPair, testCase.input);
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(2, { timeout: 1600 });
      await expect(page.locator(".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);
      await expect(page.locator("#tutorialCopy")).toHaveText("Try another adjacent swap.");
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 2200 });
      await page.waitForTimeout(900);
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);

      const focusBeforeHint = await page.evaluate(() => document.activeElement?.id || "");
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
      const delayedPair = await hintedPair(page);
      const usefulPairs = await objectiveUsefulPairs(page);
      expect(
        usefulPairs.some((candidate) => unorderedPairKey(candidate.pair) === unorderedPairKey(delayedPair)),
        `${testCase.label} rescue is objective-useful`
      ).toBe(true);
      expect(await page.evaluate(() => document.activeElement?.id || ""), `${testCase.label} hint does not steal focus`)
        .toBe(focusBeforeHint);
      expect((await activeState(page)).moves, `${testCase.label} hint spends no move`).toBe(5);
      if (testCase.reduced) {
        const reducedCue = await page.locator(".tile.idle-hint").first().evaluate((tile) => ({
          outline: getComputedStyle(tile).outlineStyle,
          animationDuration: getComputedStyle(tile).animationDuration
        }));
        expect(reducedCue.outline, `${testCase.label} keeps a static outline`).toBe("solid");
        expect(Number.parseFloat(reducedCue.animationDuration), `${testCase.label} suppresses pulsing motion`).toBeLessThanOrEqual(0.001);
      }

      if (testCase.label === "desktop-pointer") {
        await page.locator("#tutorialSkipBtn").click();
        await page.locator("#tutorialHelpBtn").click();
        await expect(page.locator(".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);
        await expect(page.locator('.tile.target-literacy[data-flower-id="5"]')).toHaveCount(3);
        await expect(page.locator('.objective-target.target-literacy[data-flower-id="5"]')).toHaveCount(1);
        await expect(page.locator("#tutorialCopy")).toHaveText("Find 3 Thorn Roses.");
      } else {
        const rescueSource = page.locator(`.tile[data-x="${delayedPair[0].x}"][data-y="${delayedPair[0].y}"]`);
        if (testCase.input === "keyboard") {
          await rescueSource.focus();
          await page.keyboard.press("Enter");
        } else {
          await rescueSource.tap();
        }
        await expect(page.locator(".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);
        await expect(page.locator(".tile.sel")).toHaveCount(1);
        await expect(page.locator(".tile.target-literacy, .objective-target.target-literacy")).toHaveCount(0);
        expect((await activeState(page)).moves, `${testCase.label} rescue selection spends no move`).toBe(5);
      }

      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      const reloadedDiscovery = await guidedRoundOneState(page, `${testCase.label} agency reload`);
      expect(reloadedDiscovery.moves).toBe(5);
      expect(reloadedDiscovery.counts).toEqual([0, 0, 0, 0, 0, 3]);
      expect(reloadedDiscovery.hints).toEqual([]);
      expect(reloadedDiscovery.tutorial).toBe("Find 3 Thorn Roses.");
      expect(reloadedDiscovery.targetLiteracy).toBe("Thorn Rose");
      const ordinaryMove = (await objectiveUsefulPairs(page))[0]?.pair;
      expect(ordinaryMove, `${testCase.label} discoverable useful move`).toHaveLength(2);
      await activatePair(page, ordinaryMove, testCase.input);
      await waitForSettledBoard(page);
      const afterOrdinaryMove = await guidedRoundOneState(page, `${testCase.label} post-agency boundary`);
      expect(afterOrdinaryMove.moves, `${testCase.label} ordinary move spends once`).toBe(4);
      expect(afterOrdinaryMove.counts[5], `${testCase.label} ordinary move advances Thorn Rose`).toBeGreaterThan(3);
      const reachedBoneDiscovery = afterOrdinaryMove.counts[5] >= 8
        && afterOrdinaryMove.counts[1] < 6;
      if (reachedBoneDiscovery) {
        expect(afterOrdinaryMove.cue).toBe("Find Bone Stars.");
        expect(afterOrdinaryMove.hints).toEqual([]);
      } else {
        expect(afterOrdinaryMove.cue).toContain("Black Candle Vine");
        expect(afterOrdinaryMove.hints).toHaveLength(2);
      }

      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      let reloadedLesson = await guidedRoundOneState(page, `${testCase.label} post-agency reload`);
      if (reachedBoneDiscovery) {
        expect(reloadedLesson.cue).toBe("Find Bone Stars.");
        expect(reloadedLesson.hints).toEqual([]);
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9500 });
        reloadedLesson = await guidedRoundOneState(page, `${testCase.label} Bone Star fallback`);
        expect(reloadedLesson.cue).toContain("Bone Star");
        expect(reloadedLesson.tutorial).toBe("Match Bone Star.");
      } else {
        expect(reloadedLesson.cue).toContain("Black Candle Vine");
      }
      expect(reloadedLesson.moves).toBe(afterOrdinaryMove.moves);
      expect(reloadedLesson.counts).toEqual(afterOrdinaryMove.counts);
      expect(reloadedLesson.hints).toHaveLength(2);
      expect(unorderedPairKey(reloadedLesson.hints), `${testCase.label} stale Thorn rescue does not return`)
        .not.toBe(unorderedPairKey(delayedPair));
      expect(reloadedLesson.tiles).toBe(64);
      expect(reloadedLesson.rows).toBe(8);
      expect(reloadedLesson.overflowX).toBe(false);
      expect(reloadedLesson.brokenImages).toEqual([]);
      if (testCase.mobile) {
        expect(reloadedLesson.completeRows).toBe(8);
        expect(reloadedLesson.boardBottom).toBeLessThanOrEqual(844);
      }
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("off-order opening success redirects the player to real bouquet progress", async ({ browser }) => {
  test.setTimeout(420000);
  const cases = [
    { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
    { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
    { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
    { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
  ];
  const offOrderPair = [{ x: 3, y: 2 }, { x: 4, y: 2 }];

  const activatePair = async (page, pair, input) => {
    const tile = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    if (input === "touch") {
      await tile(pair[0]).tap();
      await tile(pair[1]).tap();
      return;
    }
    if (input === "keyboard") {
      await tile(pair[0]).focus();
      await page.keyboard.press("Enter");
      await tile(pair[1]).focus();
      await page.keyboard.press("Enter");
      return;
    }
    await tile(pair[0]).click();
    await tile(pair[1]).click();
  };

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(
      `${request.url()} ${request.failure()?.errorText || ""}`
    ));

    try {
      await openFreshNoReview(page, `round-one-off-order-${testCase.label}`);
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
      expect(unorderedPairKey(await hintedPair(page)), `${testCase.label} authored opening remains available`)
        .toBe("1,0 <-> 1,1");

      await activatePair(page, offOrderPair, testCase.input);
      await waitForSettledBoard(page);
      const correction = await guidedRoundOneState(page, `${testCase.label} off-order correction`);
      expect(correction.moves, `${testCase.label} legal off-order match spends once`).toBe(5);
      expect(correction.counts, `${testCase.label} only Nightshade is harvested`).toEqual([0, 0, 3, 0, 0, 0]);
      expect(correction.bouquet, `${testCase.label} off-order flowers do not fill the bouquet`)
        .toContain("Bouquet 0/14");
      expect(correction.bouquetOrder).toBe("Order Progress · 0/14");
      expect(correction.liveBouquetProgress).toBe("0/14");
      expect(correction.bouquetBarWidth).toBe("0%");
      expect(correction.greenhouseAuthority).toEqual({
        roundOneRestored: false,
        roundTwoGreenhouseUpgraded: false,
        roundThreeConservatoryRaised: false,
        stage: "withered",
        ownedStage: "0",
        pct: "0",
        bodyStage: "withered",
        bodyPct: "0",
        art: "../assets/greenhouse/first_greenhouse_withered.jpg"
      });
      expect(correction.tutorial, `${testCase.label} names the missing order rule`)
        .toBe("Match the order flowers.");
      expect(correction.hints, `${testCase.label} correction first acknowledges the result`).toEqual([]);
      expect(correction.visibleInstructionSurfaces, `${testCase.label} keeps one narrator`).toBe(1);
      expect(correction.visibleButtons, `${testCase.label} Skip remains the sole non-tile action`).toEqual(["Skip"]);
      expect(correction.tutorialPanelClipped, `${testCase.label} correction copy fits`).toBe(false);
      expect(correction.tiles).toBe(64);
      expect(correction.rows).toBe(8);
      expect(correction.overflowX).toBe(false);
      expect(correction.brokenImages).toEqual([]);
      if (testCase.mobile) {
        expect(correction.completeRows, `${testCase.label} keeps all mobile rows visible`).toBe(8);
        expect(correction.boardBottom, `${testCase.label} keeps the altar in the first viewport`).toBeLessThanOrEqual(844);
      }
      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/round-one-off-order-${testCase.label}-correction.png`,
          fullPage: true
        });
      }

      const focusBeforeGuide = await page.evaluate(() => document.activeElement?.id || "");
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 4000 });
      await expect(page.locator(".first-action-swap-guide")).toHaveCount(1);
      const recovered = await guidedRoundOneState(page, `${testCase.label} recovered order guide`);
      expect(recovered.tutorial, `${testCase.label} recovered guide names its target`).toBe("Match Thorn Rose.");
      expect(recovered.moves).toBe(5);
      expect(recovered.counts).toEqual(correction.counts);
      expect(await page.evaluate(() => document.activeElement?.id || ""), `${testCase.label} guide does not steal focus`)
        .toBe(focusBeforeGuide);
      const recoveredPair = recovered.hints;
      const usefulPairs = await objectiveUsefulPairs(page);
      expect(
        usefulPairs.some((candidate) => unorderedPairKey(candidate.pair) === unorderedPairKey(recoveredPair)),
        `${testCase.label} recovered pair is legal and objective-useful`
      ).toBe(true);
      assertFirstActionGuide(
        await firstActionGuideReport(page),
        recoveredPair,
        `${testCase.label} recovered order guide`,
        { mobile: testCase.mobile, reducedMotion: testCase.reduced, stage: "thorn-followup" }
      );
      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/round-one-off-order-${testCase.label}-guide.png`,
          fullPage: true
        });
      }

      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await waitForSettledBoard(page);
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 4000 });
        const persisted = await guidedRoundOneState(page, `${testCase.label} correction reload ${reload + 1}`);
        expect(persisted.moves).toBe(5);
        expect(persisted.counts).toEqual(correction.counts);
        expect(persisted.bouquet).toContain("Bouquet 0/14");
        expect(persisted.bouquetOrder).toBe("Order Progress · 0/14");
        expect(persisted.greenhouseAuthority).toEqual(correction.greenhouseAuthority);
        expect(persisted.tutorial).toBe("Match Thorn Rose.");
        expect(unorderedPairKey(persisted.hints)).toBe(unorderedPairKey(recoveredPair));
        await expect(page.locator(".impact-sigil, .objective-flight, .order-pulse")).toHaveCount(0);
      }

      await activatePair(page, recoveredPair, testCase.input);
      await waitForSettledBoard(page);
      const targetProgress = await guidedRoundOneState(page, `${testCase.label} target progress`);
      expect(targetProgress.moves, `${testCase.label} recovered pair spends once`).toBe(4);
      expect(targetProgress.counts[5], `${testCase.label} recovered pair fills Thorn Rose`).toBeGreaterThan(0);
      expect(targetProgress.bouquet, `${testCase.label} bouquet now advances`).not.toContain("Bouquet 0/14");
      expect(targetProgress.liveBouquetProgress).not.toBe("0/14");
      expect(targetProgress.greenhouseAuthority).toEqual(correction.greenhouseAuthority);
      expect(
        ["Find 3 Thorn Roses.", "Match 3 fills the bouquet.", "Match 4 arms Black Candle Vine."],
        `${testCase.label} truthful target-progressing lesson resumes`
      ).toContain(targetProgress.tutorial);

      for (let remaining = 0; remaining < 4 && !(await activeState(page)).roundComplete; remaining += 1) {
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 8500 });
        await activatePair(page, await hintedPair(page), testCase.input);
        await page.waitForFunction((key) => {
          const saved = JSON.parse(localStorage.getItem(key) || "{}");
          const tiles = Array.from(document.querySelectorAll(".tile"));
          return Boolean(saved.roundComplete)
            || (
              tiles.length === 64
              && tiles.every((tile) => !tile.disabled)
              && new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top))).size === 8
            );
        }, SAVE_KEY, { timeout: 7000 });
        if (!(await activeState(page)).roundComplete) {
          await waitForSettledBoard(page);
        }
      }
      const completed = await activeState(page);
      expect(completed.roundComplete, `${testCase.label} off-order exploration still completes the authored order`).toBe(true);
      expect(completed.moves, `${testCase.label} completion stays inside the six-move budget`).toBeGreaterThanOrEqual(0);
      await expect(page.locator("#roundOneRestoration")).toBeVisible();
      await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible();
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("later off-order success uses the settled swap outcome instead of cumulative progress", async ({ browser }) => {
  test.setTimeout(420000);
  const cases = [
    { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
    { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
    { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
    { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
  ];
  const openingOffOrderPair = [{ x: 3, y: 2 }, { x: 4, y: 2 }];
  const laterOffOrderPair = [{ x: 6, y: 1 }, { x: 6, y: 2 }];

  const activatePair = async (page, pair, input) => {
    const tile = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    if (input === "touch") {
      await tile(pair[0]).tap();
      await tile(pair[1]).tap();
      return;
    }
    if (input === "keyboard") {
      await tile(pair[0]).focus();
      await page.keyboard.press("Enter");
      await tile(pair[1]).focus();
      await page.keyboard.press("Enter");
      return;
    }
    await tile(pair[0]).click();
    await tile(pair[1]).click();
  };

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(
      `${request.url()} ${request.failure()?.errorText || ""}`
    ));

    try {
      await seedDeterministicMath(page, "later-off-order-seed-5");
      await openFreshNoReview(page, "later-off-order-seed-5");
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
      await activatePair(page, openingOffOrderPair, testCase.input);
      await waitForSettledBoard(page);
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 4000 });
      const openingRecoveryPair = await hintedPair(page);

      await activatePair(page, openingRecoveryPair, testCase.input);
      await waitForSettledBoard(page);
      const targetProgress = await guidedRoundOneState(page, `${testCase.label} established order progress`);
      expect(targetProgress.moves).toBe(4);
      expect(targetProgress.bouquet).toContain("Bouquet 3/14");
      expect(targetProgress.bouquetOrder).toBe("Order Progress · 3/14");
      expect(targetProgress.liveBouquetProgress).toBe("3/14");
      expect(targetProgress.counts[5]).toBe(3);
      expect(targetProgress.tutorial).toBe("Find 3 Thorn Roses.");

      await activatePair(page, laterOffOrderPair, testCase.input);
      await waitForSettledBoard(page);
      const correction = await guidedRoundOneState(page, `${testCase.label} later off-order correction`);
      expect(correction.moves, `${testCase.label} later off-order match spends once`).toBe(3);
      expect(correction.counts[5], `${testCase.label} later off-order match keeps Thorn Rose progress`).toBe(3);
      expect(correction.counts[1], `${testCase.label} later off-order match keeps Bone Star progress`).toBe(0);
      expect(correction.counts[4], `${testCase.label} Amber Seed harvest remains authoritative`)
        .toBeGreaterThan(targetProgress.counts[4]);
      expect(correction.bouquet, `${testCase.label} later off-order match adds no order progress`)
        .toContain("Bouquet 3/14");
      expect(correction.bouquetOrder).toBe(targetProgress.bouquetOrder);
      expect(correction.bouquetBarWidth).toBe(targetProgress.bouquetBarWidth);
      expect(correction.liveBouquetProgress).toBe(targetProgress.liveBouquetProgress);
      expect(correction.greenhouseAuthority).toEqual(targetProgress.greenhouseAuthority);
      expect(correction.tutorial, `${testCase.label} narrator reflects this swap's zero order gain`)
        .toBe("Match the order flowers.");
      expect(correction.hints, `${testCase.label} correction frame precedes the guide`).toEqual([]);
      expect(correction.visibleInstructionSurfaces, `${testCase.label} keeps one narrator`).toBe(1);
      expect(correction.visibleButtons, `${testCase.label} Skip remains the sole non-tile action`).toEqual(["Skip"]);
      expect(correction.tiles).toBe(64);
      expect(correction.rows).toBe(8);
      expect(correction.overflowX).toBe(false);
      expect(correction.brokenImages).toEqual([]);
      if (testCase.mobile) {
        expect(correction.completeRows).toBe(8);
        expect(correction.boardBottom).toBeLessThanOrEqual(844);
      }
      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/round-one-later-off-order-${testCase.label}-correction.png`,
          fullPage: true
        });
      }

      if (testCase.label === "desktop-pointer") {
        await page.reload({ waitUntil: "networkidle" });
        await waitForSettledBoard(page);
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 1500 });
        const transientReload = await guidedRoundOneState(page, `${testCase.label} transient correction reload`);
        expect(transientReload.moves).toBe(3);
        expect(transientReload.counts).toEqual(correction.counts);
        expect(transientReload.bouquet).toContain("Bouquet 3/14");
        expect(transientReload.tutorial).toBe("Match Thorn Rose.");
        await expect(page.locator(".impact-sigil, .objective-flight, .order-pulse")).toHaveCount(0);
      }

      const focusBeforeGuide = await page.evaluate(() => document.activeElement?.id || "");
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 4000 });
      await expect(page.locator(".first-action-swap-guide")).toHaveCount(1);
      const recovered = await guidedRoundOneState(page, `${testCase.label} later recovered order guide`);
      expect(recovered.tutorial).toBe("Match Thorn Rose.");
      expect(recovered.moves).toBe(3);
      expect(recovered.counts).toEqual(correction.counts);
      expect(await page.evaluate(() => document.activeElement?.id || ""), `${testCase.label} later guide does not steal focus`)
        .toBe(focusBeforeGuide);
      const recoveredPair = recovered.hints;
      const usefulPairs = await objectiveUsefulPairs(page);
      expect(
        usefulPairs.some((candidate) => unorderedPairKey(candidate.pair) === unorderedPairKey(recoveredPair)),
        `${testCase.label} later recovered pair is legal and objective-useful`
      ).toBe(true);
      assertFirstActionGuide(
        await firstActionGuideReport(page),
        recoveredPair,
        `${testCase.label} later recovered order guide`,
        { mobile: testCase.mobile, reducedMotion: testCase.reduced, stage: "thorn-followup" }
      );
      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/round-one-later-off-order-${testCase.label}-guide.png`,
          fullPage: true
        });
      }

      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await waitForSettledBoard(page);
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 5000 });
        const persisted = await guidedRoundOneState(page, `${testCase.label} later correction reload ${reload + 1}`);
        expect(persisted.moves).toBe(3);
        expect(persisted.counts).toEqual(correction.counts);
        expect(persisted.bouquet).toContain("Bouquet 3/14");
        expect(persisted.bouquetOrder).toBe("Order Progress · 3/14");
        expect(persisted.bouquetBarWidth).toBe(correction.bouquetBarWidth);
        expect(persisted.liveBouquetProgress).toBe("3/14");
        expect(persisted.greenhouseAuthority).toEqual(correction.greenhouseAuthority);
        expect(persisted.tutorial).toBe("Match Thorn Rose.");
        expect(unorderedPairKey(persisted.hints)).toBe(unorderedPairKey(recoveredPair));
        await expect(page.locator(".impact-sigil, .objective-flight, .order-pulse")).toHaveCount(0);
      }

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("later off-order primary match stays truthful when its cascade advances the order", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await seedDeterministicMath(page, "later-off-order-seed-0");
  await openFreshNoReview(page, "later-off-order-target-cascade");

  const activatePair = async (pair) => {
    for (const cell of pair) {
      await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
    }
    await waitForSettledBoard(page);
  };

  await activatePair([{ x: 3, y: 2 }, { x: 4, y: 2 }]);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 4000 });
  await activatePair(await hintedPair(page));
  const beforeCascade = await guidedRoundOneState(page, "later off-order target cascade before");
  expect(beforeCascade.bouquet).toContain("Bouquet 3/14");

  await activatePair([{ x: 6, y: 1 }, { x: 6, y: 2 }]);
  const afterCascade = await guidedRoundOneState(page, "later off-order target cascade after");
  expect(afterCascade.moves).toBe(3);
  expect(afterCascade.counts[4]).toBeGreaterThan(beforeCascade.counts[4]);
  expect(afterCascade.counts[5]).toBeGreaterThan(beforeCascade.counts[5]);
  expect(afterCascade.bouquet).not.toBe(beforeCascade.bouquet);
  expect(afterCascade.tutorial).toBe("Match 3 fills the bouquet.");
  expect(afterCascade.visibleInstructionSurfaces).toBe(1);
  expect(afterCascade.tiles).toBe(64);
  expect(afterCascade.rows).toBe(8);
  expect(afterCascade.overflowX).toBe(false);
  expect(afterCascade.brokenImages).toEqual([]);
});

test("guided Round 1 payoff keeps one dominant action", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 390, height: 844 });
  await seedDeterministicMath(page, "fresh-black-candle-mobile390");
  await openFresh(page, "guided-payoff-mobile390");
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await completeGuidedRoundOne(page);

  await expect(page.locator("#bouquetProgressLabel")).toHaveText("Bouquet 14/14 -> Reward 120 coins");
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expectReadyPrimaryAction(page, "Restore Greenhouse · 100 coins");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  let report = await visibleReport(page);
  expect(report).toMatchObject({
    tiles: 64,
    tutorialVisible: true,
    tutorialInViewport: true,
    coins: 120,
    payoffTransaction: "Earned 120 coins. Restore costs 100.",
    overflowX: false,
    brokenImages: []
  });
  expect(report.savedOwnership).toEqual({
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false
  });
  expect(report.greenhouseOwnedStage).toBe("0");
  expect(report.greenhousePct).toBe("0");
  expect(report.greenhouseBodyStage).toBe("withered");
  expect(report.greenhouseArt).toContain("first_greenhouse_withered.jpg");
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.tutorialInViewport).toBe(true);
  expect(report.coins).toBe(120);
  expect(report.payoffTransaction).toBe("Earned 120 coins. Restore costs 100.");
  expect(report.visibleProgressText).not.toContain("+120 coins -> Restore -100 coins");
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  expect(report.visibleProgressText).not.toContain("Swap the glowing flowers.");
  expect(report.savedOwnership.roundOneRestored).toBe(false);
  expect(report.greenhouseOwnedStage).toBe("0");
  expect(report.greenhousePct).toBe("0");
  expect(report.greenhouseBodyStage).toBe("withered");
  expect(report.greenhouseArt).toContain("first_greenhouse_withered.jpg");

  await page.locator("#restoreGreenhouseBtn").click();
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toHaveText("Next Order → Moonlit Wreath");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.coins).toBe(20);
  expect(report.payoffTransaction).toBe("Restored for 100. 20 coins remain.");
  expect(report.restorationState).toBe("RESTORED GREENHOUSE");
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  expect(report.tutorialInViewport).toBe(true);
  expect(report.savedOwnership.roundOneRestored).toBe(true);
  expect(report.greenhouseOwnedStage).toBe("1");
  expect(report.greenhousePct).toBe("33");
  expect(report.greenhouseBodyStage).toBe("restored");
  expect(report.greenhouseArt).toContain("first_greenhouse_restored.jpg");
  await page.waitForFunction(() => {
    const artwork = document.querySelector(".greenhouse-art-restored");
    return artwork?.complete && artwork.naturalWidth > 0;
  }, null, { timeout: 5000 });
  await page.waitForTimeout(800);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.tutorialInViewport).toBe(true);
  expect(report.coins).toBe(20);
  expect(report.payoffTransaction).toBe("Restored for 100. 20 coins remain.");
  expect(report.restorationState).toBe("RESTORED GREENHOUSE");
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  expect(report.visibleProgressText).not.toContain("Swap the glowing flowers.");
  expect(report.savedOwnership.roundOneRestored).toBe(true);
  expect(report.greenhouseOwnedStage).toBe("1");
  expect(report.greenhousePct).toBe("33");
  expect(report.greenhouseBodyStage).toBe("restored");
  expect(report.greenhouseArt).toContain("first_greenhouse_restored.jpg");

  await page.locator("#nextOrderBtn").click();
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#objective")).toContainText("Nightshade");
  await expect(page.locator("#objective")).toContainText("Amber Seed");
  await expect(page.locator("#objective")).toContainText("Thorn Rose");
  await expect(page.locator("#objective")).toContainText("Cursed Thorn");
  await expect(page.locator("#objective .moves-counter")).toHaveText("Moves 9");
  await expect(page.locator("#firstSwapCue")).toContainText("Crack the marked thorns");
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.bouquetText).toContain("Bouquet 0/29");
  expect(report.bouquetNext).toBe("Order Progress · 0/29");
  expect(report.savedOwnership.roundOneRestored).toBe(true);
  expect(report.greenhouseOwnedStage).toBe("1");
  expect(report.greenhousePct).toBe("33");
  expect(report.greenhouseBodyStage).toBe("restored");
  expect(report.greenhouseArt).toContain("first_greenhouse_restored.jpg");
  expect(report.tiles).toBe(64);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  await page.waitForTimeout(800);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("Black Candle Vine forms, persists, and activates as a deliberate lane special", async ({ browser }) => {
  const cases = [
    { label: "desktop", viewport: { width: 1280, height: 720 }, input: "keyboard" },
    { label: "mobile390", viewport: { width: 390, height: 844 }, input: "touch", mobile: true }
  ];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.mobile ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(
      `${request.url()} ${request.failure()?.errorText || ""}`
    ));

    try {
      await seedDeterministicMath(page, `persistent-black-candle-${testCase.label}`);
      await openFresh(page, `black-candle-${testCase.label}`);
      for (let step = 0; step < 5; step += 1) {
        const cue = await page.locator("#firstSwapCue").textContent();
        if (cue.includes("Make 4 Bone Stars")) break;
        await dispatchGuidedSwap(page);
      }
      await expect(page.locator("#firstSwapCue")).toContainText("Make 4 Bone Stars");
      const beforeFormation = await activeState(page);
      await dispatchGuidedSwap(page);

      const relic = page.locator('.tile[data-line-relic="black-candle-vine"]');
      await expect(relic).toHaveCount(1);
      await waitForSettledBoard(page);
      await expect(relic).toHaveAttribute("data-line-relic-direction", "horizontal");
      await expect(page.locator("#tutorialCopy")).toHaveText("Swap right to burn this row.");
      const formed = await activeState(page);
      expect(formed.moves, "formation spends one move").toBe(beforeFormation.moves - 1);
      expect(formed.counts[1] - beforeFormation.counts[1], "formation collects only the strict four").toBe(4);
      expect(formed.armedLineRelic).toMatchObject({ direction: "horizontal", flowerId: 1 });
      expect(formed.tiles).toBe(64);
      expect(formed.rows).toBe(8);
      expect(formed.overflowX).toBe(false);
      await page.waitForTimeout(850);
      const formedForecast = await armedRelicGuidance(page);
      assertArmedRelicGuidance(
        formedForecast,
        "horizontal",
        `${testCase.label} horizontal formed special`,
        Boolean(testCase.mobile),
        { expectedArrows: 0 }
      );
      await page.screenshot({ path: `work/black-candle-formed-${testCase.label}.png`, fullPage: true });

      await page.reload({ waitUntil: "networkidle" });
      await page.reload({ waitUntil: "networkidle" });
      await expect(relic).toHaveCount(1);
      const persisted = await activeState(page);
      const persistedSnapshot = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) || "{}"),
        SAVE_KEY
      );
      expect(persisted.armedLineRelic).toEqual(formed.armedLineRelic);
      expect(persisted.moves).toBe(formed.moves);
      expect(persisted.counts).toEqual(formed.counts);
      const activationForecast = await armedRelicGuidance(page);
      assertArmedRelicGuidance(
        activationForecast,
        "horizontal",
        `${testCase.label} horizontal persisted special`,
        Boolean(testCase.mobile),
        { expectedArrows: 0 }
      );
      expect(activationForecast.laneCoordinates, `${testCase.label} reload lane coordinates`).toEqual(
        formedForecast.laneCoordinates
      );
      expect(activationForecast.source, `${testCase.label} reload source`).toBe(formedForecast.source);
      expect(activationForecast.destination, `${testCase.label} reload destination`).toBe(formedForecast.destination);
      const armedGeometry = await stableTileGeometryReport(page);
      expect(armedGeometry.tileCounts, `${testCase.label} armed forecast keeps 64 hit targets`).toEqual(Array(10).fill(64));
      expect(armedGeometry.completeRows, `${testCase.label} armed forecast keeps eight rows`).toEqual(Array(10).fill(8));
      expect(armedGeometry.maxTileDelta, `${testCase.label} armed forecast keeps tile bounds stable`).toBeLessThan(0.05);
      expect(armedGeometry.movingTransforms, `${testCase.label} armed forecast never transforms tile buttons`).toEqual([]);
      if (testCase.mobile) {
        expect(Math.max(...armedGeometry.boardBottoms), `${testCase.label} armed board stays in the exact viewport`).toBeLessThanOrEqual(844);
      }

      const forecastSnapshot = {
        laneCoordinates: activationForecast.laneCoordinates,
        source: activationForecast.source,
        destination: activationForecast.destination,
        moves: persisted.moves,
        counts: persisted.counts
      };
      const assertForecastStable = async (context, { fullPresentation = true } = {}) => {
        const report = await armedRelicGuidance(page);
        expect(report.laneCoordinates, `${testCase.label} ${context} lane`).toEqual(forecastSnapshot.laneCoordinates);
        expect(report.source, `${testCase.label} ${context} source`).toBe(forecastSnapshot.source);
        expect(report.destination, `${testCase.label} ${context} destination`).toBe(forecastSnapshot.destination);
        expect(report.laneTiles, `${testCase.label} ${context} eight affected cells`).toHaveLength(8);
        expect(report.laneMarkers, `${testCase.label} ${context} eight rail segments`).toBe(8);
        expect(report.destinationCount, `${testCase.label} ${context} one destination`).toBe(1);
        expect(report.relicCount, `${testCase.label} ${context} one source relic`).toBe(1);
        expect((await activeState(page)).moves, `${testCase.label} ${context} spends no move`).toBe(forecastSnapshot.moves);
        expect((await activeState(page)).counts, `${testCase.label} ${context} changes no counts`).toEqual(forecastSnapshot.counts);
        if (fullPresentation) {
          assertArmedRelicGuidance(report, "horizontal", `${testCase.label} ${context}`, Boolean(testCase.mobile), { expectedArrows: 0 });
        }
      };

      const passiveCells = await page.evaluate(({ source, destination }) => {
        const excluded = new Set([source, destination]);
        const cells = Array.from(document.querySelectorAll(".tile"))
          .map((tile) => ({ x: Number(tile.dataset.x), y: Number(tile.dataset.y) }))
          .filter((cell) => !excluded.has(`${cell.x},${cell.y}`));
        const first = cells[0];
        const second = cells.find((cell) => Math.abs(cell.x - first.x) + Math.abs(cell.y - first.y) > 1);
        return [first, second];
      }, { source: activationForecast.source, destination: activationForecast.destination });
      for (const cell of passiveCells) {
        const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
        if (testCase.mobile) await tile.tap();
        else await tile.click();
      }
      await assertForecastStable("wrong and nonadjacent selection");

      const invalidPair = await findInvalidAdjacentPair(page, [
        persisted.armedLineRelic,
        ...activationPairFromForecast(activationForecast)
      ]);
      expect(invalidPair, `${testCase.label} unrelated invalid adjacent pair`).toHaveLength(2);
      for (const cell of invalidPair) {
        const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
        if (testCase.mobile) await tile.tap();
        else await tile.click();
      }
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
      await assertForecastStable("invalid adjacent refusal", { fullPresentation: false });
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 2200 });
      await assertForecastStable("invalid adjacent cleanup");

      const cancelSource = activationPairFromForecast(activationForecast)[0];
      const cancelBox = await page.locator(`.tile[data-x="${cancelSource.x}"][data-y="${cancelSource.y}"]`).boundingBox();
      expect(cancelBox, `${testCase.label} cancel source geometry`).toBeTruthy();
      const cancelPoint = { x: cancelBox.x + cancelBox.width / 2, y: cancelBox.y + cancelBox.height / 2 };
      if (testCase.mobile) {
        const client = await context.newCDPSession(page);
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: cancelPoint.x, y: cancelPoint.y, id: 91 }]
        });
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: cancelPoint.x + 22, y: cancelPoint.y, id: 91 }]
        });
        await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
        await client.detach();
      } else {
        await page.mouse.move(cancelPoint.x, cancelPoint.y);
        await page.mouse.down();
        await page.mouse.move(cancelPoint.x + 22, cancelPoint.y, { steps: 3 });
        await page.dispatchEvent("#board", "pointercancel", {
          pointerId: 1,
          bubbles: true,
          cancelable: true,
          isPrimary: true,
          clientX: cancelPoint.x + 22,
          clientY: cancelPoint.y
        });
        await page.mouse.up();
      }
      await expect(page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready")).toHaveCount(0);
      await assertForecastStable("canceled drag or touch", { fullPresentation: false });

      if (!testCase.mobile) {
        await page.locator("#tutorialSkipBtn").click();
        await assertForecastStable("Skip", { fullPresentation: false });
        await page.locator("#tutorialHelpBtn").click();
        await assertForecastStable("Help replay", { fullPresentation: false });
      }

      const activationPair = activationPairFromForecast(activationForecast);
      const activationIncludesRelic = activationPair.some((cell) => (
        cell.x === persisted.armedLineRelic.x && cell.y === persisted.armedLineRelic.y
      ));
      expect(activationIncludesRelic, "guided activation includes the armed relic").toBe(true);
      const laneValues = await page.evaluate(({ key, pair }) => {
        const state = JSON.parse(localStorage.getItem(key));
        const board = state.board.map((row) => row.slice());
        const [a, b] = pair;
        const temp = board[a.y][a.x];
        board[a.y][a.x] = board[b.y][b.x];
        board[b.y][b.x] = temp;
        return board[state.armedLineRelic.y].slice();
      }, { key: SAVE_KEY, pair: activationPair });
      const expectedLaneGain = Array(6).fill(0);
      laneValues.forEach((flowerId) => { expectedLaneGain[flowerId] += 1; });

      await startBlackCandleActivationRecorder(page);

      const peakPhase = testCase.mobile ? "hold" : "sweep";
      const peakPath = `work/black-candle-${testCase.label}-${testCase.mobile ? "reduced-static" : "full-peak"}.png`;
      await runAtFrozenBlackCandlePhase(
        page,
        peakPhase,
        () => activateBlackCandleInput(page, testCase, activationPair),
        { path: peakPath }
      );
      const activationFrames = await blackCandleActivationFrames(page);
      assertBlackCandleActivationFrames(activationFrames, testCase, persisted, activationForecast);
      await expect(page.locator("body")).not.toHaveAttribute("data-black-candle-activation-phase", /.+/);
      await expect(relic).toHaveCount(0);
      const activated = await activeState(page);
      expect(activated.moves, "activation spends exactly one move").toBe(persisted.moves - 1);
      expect(activated.armedLineRelic).toBeNull();
      await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
      expectedLaneGain.forEach((gain, flowerId) => {
        expect(
          activated.counts[flowerId] - persisted.counts[flowerId],
          `activation collects actual lane flower ${flowerId}`
        ).toBe(gain);
      });
      expect(activated.tiles).toBe(64);
      expect(activated.overflowX).toBe(false);
      await page.screenshot({ path: `work/black-candle-activated-${testCase.label}.png`, fullPage: true });

      let completed = activated;
      while (!completed.roundComplete && completed.moves > 0) {
        await dispatchGuidedSwap(page);
        completed = await activeState(page);
      }
      expect(completed.roundComplete, "authored route completes within the six-move budget").toBe(true);
      expect(completed.moves).toBeGreaterThanOrEqual(0);
      await expect(page.locator("#restoreGreenhouseBtn")).toHaveText("Restore Greenhouse · 100 coins");
      expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).coins, SAVE_KEY)).toBe(120);

      await page.evaluate(({ key, snapshot }) => {
        localStorage.setItem(key, JSON.stringify(snapshot));
      }, { key: SAVE_KEY, snapshot: persistedSnapshot });
      await page.reload({ waitUntil: "networkidle" });
      await expect(relic).toHaveCount(1);
      const reloadPair = await hintedPair(page);
      await runAtFrozenBlackCandlePhase(
        page,
        testCase.mobile ? "hold" : "sweep",
        () => activateBlackCandleInput(page, testCase, reloadPair),
        { reload: true }
      );
      await expect(page.locator("body")).not.toHaveAttribute("data-black-candle-activation-phase", /.+/);
      await expect(page.locator(
        ".black-candle-burn-cell, .black-candle-burn-sweep, .line-relic-lane-preview, .line-relic-lane-mark, .line-relic-destination"
      )).toHaveCount(0);
      await expect(page.locator("#board")).not.toHaveAttribute("data-black-candle-activation-cells", /.+/);
      await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 3000 });
      const reloadedActivation = await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return {
          moves: state.moves,
          counts: state.counts,
          coins: state.coins,
          roundComplete: state.roundComplete,
          armedLineRelic: state.armedLineRelic,
          tiles: document.querySelectorAll("#board .tile").length,
          bodyPhase: document.body.dataset.blackCandleActivationPhase || ""
        };
      }, SAVE_KEY);
      expect(reloadedActivation).toMatchObject({
        moves: persisted.moves - 1,
        coins: 120,
        roundComplete: true,
        armedLineRelic: null,
        tiles: 64,
        bodyPhase: ""
      });
      expectedLaneGain.forEach((gain, flowerId) => {
        expect(reloadedActivation.counts[flowerId] - persisted.counts[flowerId]).toBe(gain);
      });
      await page.reload({ waitUntil: "networkidle" });
      const secondReload = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) || "{}"),
        SAVE_KEY
      );
      expect(secondReload.coins, `${testCase.label} reload does not duplicate reward`).toBe(120);
      expect(secondReload.moves, `${testCase.label} reload does not spend another move`).toBe(persisted.moves - 1);
      expect(secondReload.counts, `${testCase.label} reload preserves authoritative counts`).toEqual(reloadedActivation.counts);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("accepted swaps reload from one authoritative settled state", async ({ browser }) => {
  const cases = [
    { label: "desktop", viewport: { width: 1280, height: 720 } },
    { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
  ];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile)
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await openFresh(page, `atomic-swap-${testCase.label}`);

      const opening = await interruptGuidedSwapWithReload(page);
      expect(opening.before.moves).toBe(6);
      expect(opening.after, "opening reload restores the complete pre-swap snapshot").toMatchObject({
        moves: 6,
        counts: [0, 0, 0, 0, 0, 0],
        board: opening.before.board,
        armedLineRelic: null,
        roundComplete: false,
        tiles: 64,
        rows: 8,
        overflowX: false
      });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2);

      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key));
        state.currentRound = 2;
        state.moves = 9;
        state.coins = 20;
        state.counts = [0, 0, 0, 0, 0, 0];
        state.roundComplete = false;
        state.roundOneRestored = true;
        state.roundTwoGreenhouseUpgraded = false;
        state.roundThreeConservatoryRaised = false;
        state.tutorialSkipped = true;
        state.tutorialActive = false;
        state.blackCandleLessonComplete = true;
        state.hasMadeValidMove = true;
        state.restoredRoundTwoGuideMoves = 0;
        state.armedLineRelic = null;
        state.cursedThorns = [];
        state.clearedCursedThorns = 0;
        state.board = Array.from({ length: 8 }, (_, y) => (
          Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
        ));
        state.board[0][3] = 1;
        state.board[1][3] = 1;
        state.board[2][3] = 2;
        state.board[3][3] = 1;
        state.board[2][4] = 1;
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      const formationPair = [{ x: 3, y: 2 }, { x: 4, y: 2 }];
      const formation = await interruptGuidedSwapWithReload(page, formationPair);
      expect(formation.after, "formation reload restores the settled unarmed board").toMatchObject({
        moves: 9,
        counts: formation.before.counts,
        board: formation.before.board,
        armedLineRelic: null,
        roundComplete: false,
        tiles: 64,
        rows: 8,
        overflowX: false
      });

      await settleGuidedSwap(page, formationPair);
      await waitForSettledBoard(page);
      const armed = await activeState(page);
      expect(armed.moves).toBe(8);
      expect(armed.counts[1] - formation.before.counts[1]).toBe(4);
      expect(armed.armedLineRelic).toMatchObject({ direction: "vertical", flowerId: 1 });
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      expect(await activeState(page)).toMatchObject({
        moves: armed.moves,
        counts: armed.counts,
        armedLineRelic: armed.armedLineRelic
      });

      await openFresh(page, `atomic-thorn-${testCase.label}`);
      if (await page.evaluate(() => window.__bloomReviewHooksEnabled)) {
        await page.keyboard.press("n");
      } else {
        await completeGuidedRoundOne(page);
      }
      await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible();
      await page.locator("#restoreGreenhouseBtn").click();
      await expect(page.locator("#nextOrderBtn")).toBeVisible();
      await page.locator("#nextOrderBtn").click();
      await waitForSettledBoard(page);
      await expect(page.locator("#firstSwapCue")).toContainText("Crack the marked thorns");

      const thornLesson = await interruptGuidedSwapWithReload(page);
      expect(thornLesson.before).toMatchObject({
        moves: 9,
        clearedCursedThorns: 0,
        roundComplete: false
      });
      expect(thornLesson.after, "thorn reload restores all blockers and the unspent move").toMatchObject({
        moves: 9,
        counts: thornLesson.before.counts,
        clearedCursedThorns: 0,
        cursedThorns: thornLesson.before.cursedThorns,
        board: thornLesson.before.board,
        roundComplete: false,
        tiles: 64,
        rows: 8,
        overflowX: false
      });

      await settleThornLessonSwap(page);
      await waitForSettledBoard(page);
      const thornSettled = await activeState(page);
      expect(thornSettled.moves).toBe(8);
      expect(thornSettled.clearedCursedThorns).toBe(3);
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      expect(await activeState(page)).toMatchObject({
        moves: 8,
        counts: thornSettled.counts,
        clearedCursedThorns: 3,
        cursedThorns: thornSettled.cursedThorns,
        board: thornSettled.board
      });

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("vertical Black Candle Vine follows its anchor flower through gravity", async ({ browser }) => {
  const cases = [
    { label: "desktop", viewport: { width: 1280, height: 720 }, input: "pointer" },
    { label: "mobile390", viewport: { width: 390, height: 844 }, input: "touch", mobile: true }
  ];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.mobile ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(
      `${request.url()} ${request.failure()?.errorText || ""}`
    ));

    try {
      await seedDeterministicMath(page, `vertical-black-candle-${testCase.label}`);
      await openFresh(page, `black-candle-vertical-gravity-${testCase.label}`);
      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key));
        state.currentRound = 2;
        state.moves = 9;
        state.coins = 20;
        state.counts = [0, 0, 0, 0, 0, 0];
        state.roundComplete = false;
        state.roundOneRestored = true;
        state.roundTwoGreenhouseUpgraded = false;
        state.roundThreeConservatoryRaised = false;
        state.tutorialSkipped = true;
        state.tutorialActive = false;
        state.blackCandleLessonComplete = true;
        state.hasMadeValidMove = true;
        state.restoredRoundTwoGuideMoves = 0;
        state.armedLineRelic = null;
        state.cursedThorns = [];
        state.clearedCursedThorns = 0;
        state.board = Array.from({ length: 8 }, (_, y) => (
          Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
        ));
        state.board[0][3] = 1;
        state.board[1][3] = 1;
        state.board[2][3] = 2;
        state.board[3][3] = 1;
        state.board[2][4] = 1;
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);

      const formationPair = [{ x: 3, y: 2 }, { x: 4, y: 2 }];
      const beforeFormation = await activeState(page);
      if (testCase.mobile) {
        for (const cell of formationPair) {
          await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).tap();
        }
      } else {
        for (const cell of formationPair) {
          await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
        }
      }

      const relic = page.locator('.tile[data-line-relic="black-candle-vine"]');
      await expect(relic, `${testCase.label} vertical formation creates one armed relic`).toHaveCount(1);
      await expect.poll(async () => (await activeState(page)).moves).toBe(beforeFormation.moves - 1);
      await waitForSettledBoard(page);
      await page.waitForTimeout(120);
      await waitForSettledBoard(page);
      const formed = await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key));
        const relicTile = document.querySelector('.tile[data-line-relic="black-candle-vine"]');
        return {
          armedLineRelic: state.armedLineRelic,
          relicFlowerId: state.board[state.armedLineRelic.y][state.armedLineRelic.x],
          dom: relicTile ? {
            x: Number(relicTile.dataset.x),
            y: Number(relicTile.dataset.y),
            flowerId: Number(relicTile.dataset.flowerId),
            direction: relicTile.dataset.lineRelicDirection,
            label: relicTile.getAttribute("aria-label")
          } : null,
          tiles: document.querySelectorAll(".tile").length,
          rows: new Set(Array.from(document.querySelectorAll(".tile"))
            .map((tile) => Number(tile.dataset.y))).size,
          overflowX: document.documentElement.scrollWidth > innerWidth + 1,
          brokenImages: Array.from(document.images)
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.getAttribute("src"))
        };
      }, SAVE_KEY);
      expect(formed.armedLineRelic).toEqual({ x: 3, y: 3, direction: "vertical", flowerId: 1 });
      expect(formed.relicFlowerId).toBe(1);
      expect(formed.dom).toMatchObject({ x: 3, y: 3, flowerId: 1, direction: "vertical" });
      expect(formed.dom.label).toContain("Bone Star tile armed Black Candle Vine");
      expect(formed.tiles).toBe(64);
      expect(formed.rows).toBe(8);
      expect(formed.overflowX).toBe(false);
      expect(formed.brokenImages).toEqual([]);
      expect((await activeState(page)).moves).toBe(beforeFormation.moves - 1);
      expect((await activeState(page)).counts[1] - beforeFormation.counts[1]).toBe(4);
      await page.waitForTimeout(850);
      const formedForecast = await armedRelicGuidance(page);
      assertArmedRelicGuidance(
        formedForecast,
        "vertical",
        `${testCase.label} vertical formed special`,
        Boolean(testCase.mobile)
      );
      await page.screenshot({ path: `work/black-candle-vertical-formed-${testCase.label}.png`, fullPage: true });

      await page.reload({ waitUntil: "networkidle" });
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      const persisted = await activeState(page);
      expect(persisted.armedLineRelic).toEqual(formed.armedLineRelic);
      await expect(relic).toHaveAttribute("data-x", "3");
      await expect(relic).toHaveAttribute("data-y", "3");
      await expect(relic).toHaveAttribute("data-line-relic-direction", "vertical");
      const activationForecast = await armedRelicGuidance(page);
      assertArmedRelicGuidance(
        activationForecast,
        "vertical",
        `${testCase.label} vertical persisted special`,
        Boolean(testCase.mobile)
      );
      expect(activationForecast.laneCoordinates, `${testCase.label} gravity/reload recomputes the same column`).toEqual(
        formedForecast.laneCoordinates
      );
      expect(activationForecast.source, `${testCase.label} gravity/reload source`).toBe(formedForecast.source);
      expect(activationForecast.destination, `${testCase.label} gravity/reload destination`).toBe(formedForecast.destination);

      const activationPair = await hintedPair(page);
      const expectedLaneGain = await page.evaluate(({ key, pair }) => {
        const state = JSON.parse(localStorage.getItem(key));
        const board = state.board.map((row) => row.slice());
        const [a, b] = pair;
        const relicBeforeSwap = state.armedLineRelic;
        const relicDestination = a.x === relicBeforeSwap.x && a.y === relicBeforeSwap.y ? b : a;
        const temp = board[a.y][a.x];
        board[a.y][a.x] = board[b.y][b.x];
        board[b.y][b.x] = temp;
        const gained = Array(6).fill(0);
        board.forEach((row) => { gained[row[relicDestination.x]] += 1; });
        return gained;
      }, { key: SAVE_KEY, pair: activationPair });
      const beforeActivation = await activeState(page);
      await startBlackCandleActivationRecorder(page);
      const triggerActivation = async () => {
        for (const cell of activationPair) {
          const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
          if (testCase.mobile) await tile.tap();
          else await tile.click();
        }
      };
      await runAtFrozenBlackCandlePhase(
        page,
        testCase.mobile ? "hold" : "sweep",
        triggerActivation,
        {
          path: `work/black-candle-vertical-${testCase.label}-${testCase.mobile ? "reduced-static" : "full-peak"}.png`
        }
      );
      const activationFrames = await blackCandleActivationFrames(page);
      assertBlackCandleActivationFrames(activationFrames, testCase, beforeActivation, activationForecast);
      await expect.poll(async () => (await activeState(page)).moves).toBe(beforeActivation.moves - 1);
      await waitForSettledBoard(page);
      await expect(relic).toHaveCount(0);
      const activated = await activeState(page);
      expect(activated.moves).toBe(beforeActivation.moves - 1);
      expect(activated.armedLineRelic).toBeNull();
      expectedLaneGain.forEach((gain, flowerId) => {
        expect(
          activated.counts[flowerId] - beforeActivation.counts[flowerId],
          `activation credits every flower ${flowerId} cleared from its settled column`
        ).toBeGreaterThanOrEqual(gain);
      });
      expect(activated.tiles).toBe(64);
      expect(activated.rows).toBe(8);
      expect(activated.overflowX).toBe(false);
      await expect(page.locator(
        ".line-relic-lane-mark, .line-relic-lane-preview, .line-relic-destination, .black-candle-burn-cell, .black-candle-burn-sweep"
      )).toHaveCount(0);
      await expect(page.locator("#board")).not.toHaveAttribute("data-black-candle-activation-cells", /.+/);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("Black Candle cue semantics outrank every focused-round category", async ({ browser }) => {
  const viewports = [
    { label: "desktop", viewport: { width: 1280, height: 720 } },
    { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
  ];
  const scenarios = [
    { round: 1, direction: "vertical", preArmed: true },
    { round: 2, direction: "horizontal", baselinePrefix: "CURSED THORN" },
    { round: 2, direction: "vertical", baselinePrefix: "CURSED THORN", interruptActivation: true },
    { round: 3, direction: "horizontal" },
    { round: 3, direction: "vertical" }
  ];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: viewport.viewport,
      hasTouch: Boolean(viewport.mobile),
      isMobile: Boolean(viewport.mobile)
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      for (const scenario of scenarios) {
        const label = `${viewport.label}-round${scenario.round}-${scenario.direction}`;
        await seedDeterministicMath(page, `cue-precedence-${label}`);
        await openFresh(page, `cue-precedence-${label}`);
        const formationPair = await page.evaluate(({ key, round, direction, preArmed }) => {
          const state = JSON.parse(localStorage.getItem(key));
          state.currentRound = round;
          state.moves = round === 1 ? 6 : (round === 2 ? 9 : 8);
          state.coins = round === 1 ? 0 : (round === 2 ? 20 : 50);
          state.counts = [0, 0, 0, 0, 0, 0];
          state.roundComplete = false;
          state.roundOneRestored = round >= 2;
          state.roundTwoGreenhouseUpgraded = round >= 3;
          state.roundThreeConservatoryRaised = false;
          state.tutorialSkipped = true;
          state.tutorialActive = false;
          state.blackCandleLessonComplete = true;
          state.hasMadeValidMove = true;
          state.restoredRoundTwoGuideMoves = 0;
          state.armedLineRelic = null;
          state.cursedThorns = round === 2 ? [{ x: 7, y: 7, hp: 1 }] : [];
          state.clearedCursedThorns = 0;
          state.board = Array.from({ length: 8 }, (_, y) => (
            Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
          ));
          if (preArmed) {
            state.counts[1] = 3;
            state.counts[5] = 6;
            state.board[3][3] = 1;
            state.armedLineRelic = { x: 3, y: 3, direction, flowerId: 1 };
          } else if (direction === "vertical") {
            state.board[0][3] = 1;
            state.board[1][3] = 1;
            state.board[2][3] = 2;
            state.board[3][3] = 1;
            state.board[2][4] = 1;
          } else {
            state.board[3][0] = 1;
            state.board[3][1] = 1;
            state.board[3][2] = 2;
            state.board[3][3] = 1;
            state.board[2][2] = 1;
          }
          localStorage.setItem(key, JSON.stringify(state));
          return direction === "vertical"
            ? [{ x: 3, y: 2 }, { x: 4, y: 2 }]
            : [{ x: 2, y: 3 }, { x: 2, y: 2 }];
        }, {
          key: SAVE_KEY,
          round: scenario.round,
          direction: scenario.direction,
          preArmed: Boolean(scenario.preArmed)
        });
        await page.reload({ waitUntil: "networkidle" });
        await waitForSettledBoard(page);
        if (!scenario.preArmed) {
          const formationCells = await page.evaluate((pair) => pair.map(({ x, y }) => ({
            x,
            y,
            flowerId: Number(document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`)?.dataset.flowerId)
          })), formationPair);
          expect(formationCells, `${label} authored strict-four setup`).toEqual(
            scenario.direction === "vertical"
              ? [{ x: 3, y: 2, flowerId: 2 }, { x: 4, y: 2, flowerId: 1 }]
              : [{ x: 2, y: 3, flowerId: 2 }, { x: 2, y: 2, flowerId: 1 }]
          );
        }

        if (scenario.baselinePrefix) {
          const baseline = await cueSemanticPresentation(page);
          expect(baseline.prefix, `${label} baseline category`).toBe(scenario.baselinePrefix);
        }

        if (!scenario.preArmed) {
          if (viewport.mobile) {
            for (const cell of formationPair) {
              await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).tap();
            }
          } else {
            for (const cell of formationPair) {
              await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
            }
          }
        }
        await expect(
          page.locator('.tile[data-line-relic="black-candle-vine"]'),
          `${label} forms one Black Candle`
        ).toHaveCount(1);
        await waitForSettledBoard(page);
        const formedGuidance = await armedRelicGuidance(page);
        assertArmedRelicGuidance(
          formedGuidance,
          scenario.direction,
          `${label} formed special`,
          Boolean(viewport.mobile)
        );
        expect(formedGuidance.cue, `${label} exact directional action`).toMatch(
          /^Swap Black Candle Vine (left|right|up|down) - burn this (row|column)\.$/
        );

        for (let reload = 0; reload < 2; reload += 1) {
          await page.reload({ waitUntil: "networkidle" });
          await waitForSettledBoard(page);
          assertArmedRelicGuidance(
            await armedRelicGuidance(page),
            scenario.direction,
            `${label} reload ${reload + 1}`,
            Boolean(viewport.mobile)
          );
        }

        if (
          (scenario.round === 2 && scenario.direction === "vertical")
          || (scenario.round === 3 && scenario.direction === "horizontal")
        ) {
          await page.screenshot({
            path: `work/black-candle-cue-precedence-${label}.png`,
            fullPage: true
          });
        }

        if (scenario.interruptActivation) {
          const interrupted = await interruptGuidedSwapWithReload(page);
          expect(interrupted.after, `${label} interrupted activation restores armed state`).toMatchObject({
            moves: interrupted.before.moves,
            counts: interrupted.before.counts,
            board: interrupted.before.board,
            armedLineRelic: interrupted.before.armedLineRelic,
            tiles: 64,
            rows: 8,
            overflowX: false
          });
          assertArmedRelicGuidance(
            await armedRelicGuidance(page),
            scenario.direction,
            `${label} interrupted activation`,
            Boolean(viewport.mobile)
          );
        }

        const activationPair = await hintedPair(page);
        if (viewport.mobile) {
          for (const cell of activationPair) {
            await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).tap();
          }
        } else {
          for (const cell of activationPair) {
            await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
          }
        }
        await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(0);
        await expect.poll(
          async () => (await activeState(page)).armedLineRelic,
          { message: `${label} relic consumed` }
        ).toBeNull();
        const activatedState = await activeState(page);
        if (!activatedState.roundComplete) {
          await waitForSettledBoard(page);
        }
        expect(activatedState.tiles, `${label} activation keeps tile integrity`).toBe(64);

        if (scenario.baselinePrefix) {
          const resumed = await cueSemanticPresentation(page);
          expect(resumed.prefix, `${label} ordinary category after activation`).toBe(scenario.baselinePrefix);
          expect(resumed.bodyClasses, `${label} armed category removed`).not.toContain("armed-line-relic-cue");
        }

      }
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("Black Candle creation and Cursed Thorn break read as one disciplined wave", async ({ browser }) => {
  const cases = [
    { label: "desktop", viewport: { width: 1280, height: 720 } },
    { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
  ];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile)
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await openFresh(page, `black-candle-thorn-feedback-${testCase.label}`);
      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key));
        state.currentRound = 2;
        state.moves = 9;
        state.coins = 20;
        state.counts = [0, 0, 0, 0, 0, 0];
        state.roundComplete = false;
        state.roundOneRestored = true;
        state.roundTwoGreenhouseUpgraded = false;
        state.roundThreeConservatoryRaised = false;
        state.tutorialSkipped = true;
        state.tutorialActive = false;
        state.blackCandleLessonComplete = true;
        state.hasMadeValidMove = true;
        state.restoredRoundTwoGuideMoves = 0;
        state.armedLineRelic = null;
        state.cursedThorns = [{ x: 2, y: 1, hp: 1 }];
        state.clearedCursedThorns = 2;
        state.board = Array.from({ length: 8 }, (_, y) => (
          Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
        ));
        state.board[0][3] = 1;
        state.board[1][3] = 1;
        state.board[2][3] = 2;
        state.board[3][3] = 1;
        state.board[2][4] = 1;
        localStorage.setItem(key, JSON.stringify(state));
      }, SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);

      const before = await activeState(page);
      const formationPair = [{ x: 3, y: 2 }, { x: 4, y: 2 }];
      if (testCase.mobile) {
        const beforeGeometry = await tileGeometry(page, formationPair);
        const vector = dragVector(formationPair, beforeGeometry, 0.62);
        const client = await page.context().newCDPSession(page);
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: vector.startX, y: vector.startY, id: 7 }]
        });
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: vector.endX, y: vector.endY, id: 7 }]
        });
        await page.waitForFunction(() => document.querySelectorAll(".tile.drag-preview-ready").length === 2);
        await startBlackCandleThornFeedbackRecorder(page);
        await client.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
          changedTouchPoints: [{ x: vector.endX, y: vector.endY, id: 7 }]
        });
        await page.waitForFunction(() => (
          Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
          || getComputedStyle(document.querySelector("#roundOneRestoration")).display !== "none"
        ), null, { timeout: 10000 });
      } else {
        await startBlackCandleThornFeedbackRecorder(page);
        for (const cell of formationPair) {
          await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
        }
      }

      const sampledFrames = await blackCandleThornFeedbackFrames(page);
      await page.screenshot({
        path: `work/black-candle-thorn-feedback-${testCase.label}.png`,
        fullPage: true
      });

      expect(
        sampledFrames.some((frame) => frame.impacts.some((impact) => impact.text === "ARMED")),
        "Black Candle formation presents ARMED"
      ).toBe(true);
      expect(
        sampledFrames.some((frame) => frame.thornEvents.some((event) => event.text === "BREAK")),
        "the adjacent Cursed Thorn still presents BREAK"
      ).toBe(true);
      sampledFrames.forEach((frame, index) => {
        expect(
          frame.impacts.some((impact) => impact.text === "HIT"),
          `frame ${index} omits generic HIT during Black Candle creation`
        ).toBe(false);
        expect(
          frame.impacts.length,
          `frame ${index} has at most one central text narrator`
        ).toBeLessThanOrEqual(1);
        expect(frame.overlap, `frame ${index} keeps thorn text clear of ARMED`).toBe(false);
      });

      await waitForSettledBoard(page);
      const formed = await activeState(page);
      expect(formed.moves).toBe(before.moves - 1);
      expect(formed.counts[1] - before.counts[1]).toBe(4);
      expect(formed.armedLineRelic).toMatchObject({ direction: "vertical", flowerId: 1 });
      expect(formed.tiles).toBe(64);
      expect(formed.rows).toBe(8);
      expect(formed.overflowX).toBe(false);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("armed Black Candle Vine stays real in later rounds and Retry clears stale state", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "black-candle-later-rounds");

  for (const specialCase of [
    { round: 2, moves: 9, direction: "horizontal" },
    { round: 3, moves: 8, direction: "vertical" }
  ]) {
    await page.evaluate(({ key, specialCase }) => {
      const state = JSON.parse(localStorage.getItem(key));
      state.currentRound = specialCase.round;
      state.moves = specialCase.moves;
      state.counts = [0, 0, 0, 0, 0, 0];
      state.roundComplete = false;
      state.roundOneRestored = true;
      state.roundTwoGreenhouseUpgraded = specialCase.round === 3;
      state.roundThreeConservatoryRaised = false;
      state.tutorialSkipped = true;
      state.tutorialActive = false;
      state.blackCandleLessonComplete = true;
      state.armedLineRelic = {
        x: 3,
        y: 3,
        direction: specialCase.direction,
        flowerId: state.board[3][3]
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, { key: SAVE_KEY, specialCase });
    await page.reload({ waitUntil: "networkidle" });
    const before = await activeState(page);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
    const pair = await hintedPair(page);
    for (const cell of pair) {
      await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
    }
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(0);
    await waitForSettledBoard(page);
    const after = await activeState(page);
    expect(after.moves).toBe(before.moves - 1);
    expect(after.tiles).toBe(64);
    expect(after.rows).toBe(8);
  }

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.currentRound = 1;
    state.moves = 0;
    state.counts = [0, 0, 0, 0, 0, 0];
    state.roundComplete = false;
    state.roundOneRestored = false;
    state.roundTwoGreenhouseUpgraded = false;
    state.tutorialSkipped = false;
    state.tutorialActive = true;
    state.blackCandleLessonComplete = false;
    state.armedLineRelic = { x: 3, y: 3, direction: "horizontal", flowerId: state.board[3][3] };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
  await page.locator("#renewBtn").click();
  await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(0);
  const retried = await activeState(page);
  expect(retried.moves).toBe(6);
  expect(retried.armedLineRelic).toBeNull();
  expect(retried.tiles).toBe(64);
});

test("Round 1 tutorial protects moves until Skip restores Shuffle", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "tutorial-shuffle-desktop");
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await clickGuidedSwap(page);

  const movesDuringLesson = Number((await page.locator(".moves-counter").textContent()).match(/\d+/)?.[0]);
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match Thorn Rose|Match 4 arms/);
  await expect(page.locator("#shuffleBtn")).toBeHidden();
  await expect(page.locator("#shuffleBtn")).toBeDisabled();
  await expect(page.locator("#tutorialSkipBtn")).toBeVisible();
  expect((await visibleReport(page)).visibleNonTileButtons).toEqual(["Skip"]);

  await page.locator("#shuffleBtn").evaluate((button) => button.click());
  await expect(page.locator(".moves-counter")).toHaveText(`Moves ${movesDuringLesson}`);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#shuffleBtn")).toBeHidden();
  await expect(page.locator("#shuffleBtn")).toBeDisabled();
  await expect(page.locator(".moves-counter")).toHaveText(`Moves ${movesDuringLesson}`);

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#shuffleBtn")).toBeVisible();
  await expect(page.locator("#shuffleBtn")).toBeEnabled();
  await page.locator("#shuffleBtn").click();
  await expect(page.locator(".moves-counter")).toHaveText(`Moves ${movesDuringLesson - 1}`);
  await expect(page.locator(".tile")).toHaveCount(64);
  expect(new Set(await page.locator(".tile").evaluateAll((tiles) => tiles.map((tile) => tile.dataset.y))).size).toBe(8);
});

test("fresh tutorial is skippable, replayable, and tied to concrete progress", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page, "mobile390");

  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2);
  let report = await visibleReport(page);
  expect(report).toMatchObject({
    tiles: 64,
    idleHints: 2,
    tutorialVisible: true,
    tutorialInViewport: true,
    visibleInstructionCues: 1,
    bouquetText: "Bouquet 0/14 -> Reward 120 coins",
    greenhouseText: "Owned 0/3 · Next: Restore Greenhouse",
    mobileGreenhousePlinthVisible: false,
    ritualLogVisible: false,
    overflowX: false,
    brokenImages: []
  });
  expect(report.bars, "mobile active play keeps one bouquet bar plus one greenhouse bar").toHaveLength(2);
  expect(report.visibleButtons, "fresh tutorial button cap").toEqual(["Skip"]);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeHidden({ timeout: 1200 });

  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  report = await visibleReport(page);
  expect(report.tutorialInViewport, "fresh replay tutorial panel stays in viewport").toBe(true);
  expect(report.visibleButtons, "fresh replay button cap").toEqual(["Skip"]);
  expect(report.visibleNonTileButtons).toEqual(["Skip"]);
  await clickGuidedSwap(page);
  await expect(page.locator("#bouquetProgressLabel")).toContainText(/Bouquet [1-9]/);
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match Thorn Rose|Match 4 makes/);
  report = await visibleReport(page);
  expect(report.tutorialInViewport, "post-swap tutorial panel stays in viewport").toBe(true);
  expect(report.visibleButtons, "post-swap tutorial button cap").toEqual(["Skip"]);
  expect(report.visibleNonTileButtons).toEqual(["Skip"]);
  await expect(page.locator("#shuffleBtn")).toBeHidden();
  await expect(page.locator("#shuffleBtn")).toBeDisabled();
  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toContainText(/Find 3 Thorn Roses|Match 4 makes/);
  report = await visibleReport(page);
  expect(report.tutorialInViewport, "post-swap replay panel stays in viewport").toBe(true);
  expect(report.visibleButtons, "post-swap replay button cap").toEqual(["Skip"]);
  expect(report.visibleNonTileButtons).toEqual(["Skip"]);
  await expect(page.locator("#shuffleBtn")).toBeHidden();
  await expect(page.locator("#shuffleBtn")).toBeDisabled();

  const movesBeforeSkip = Number((await page.locator(".moves-counter").textContent()).match(/\d+/)?.[0]);
  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#shuffleBtn")).toBeVisible();
  await expect(page.locator("#shuffleBtn")).toBeEnabled();
  await page.locator("#shuffleBtn").click();
  await expect(page.locator(".moves-counter")).toHaveText(`Moves ${movesBeforeSkip - 1}`);
  await expect(page.locator(".tile")).toHaveCount(64);
  expect(new Set(await page.locator(".tile").evaluateAll((tiles) => tiles.map((tile) => tile.dataset.y))).size).toBe(8);

  await completeRoundWithReviewKey(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialSkipBtn")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeHidden();
  await expectReadyPrimaryAction(page, "Restore Greenhouse · 100 coins");
  report = await visibleReport(page);
  expect(report.visibleButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await expect(page.locator("#bouquetProgressNext")).toHaveText("Order Complete · 14/14");
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await page.locator("#restoreGreenhouseBtn").click();
  await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialSkipBtn")).toBeHidden();
  report = await visibleReport(page);
  expect(report.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  await page.locator("#nextOrderBtn").click();
  await expect(page.locator(".tile")).toHaveCount(64);
  if (await page.locator("#tutorialHelpBtn").isVisible()) {
    await page.locator("#tutorialHelpBtn").click();
  } else {
    await expect(page.locator("#tutorialPanel")).toBeVisible();
  }
  await expect(page.locator("#tutorialCopy")).toHaveText("Match beside the Thorn.");
  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.greenhouseText).toBe("Owned 1/3 · Next: Upgrade Greenhouse");
  expect(report.tutorialPrompt).toBe("Match beside the Thorn.");
  expect(report.mobilePlinthVisible, "Round 2 mobile active play has no greenhouse footer").toBe(false);
  expect(report.ritualLogVisible, "Round 2 mobile active play has no ritual log footer").toBe(false);
  expect(report.visibleProgressText).not.toContain("First Bouquet:");
  expect(report.tutorialSpotlights).toBeGreaterThanOrEqual(3);
  expect(report.bars, "Round 2 mobile active play keeps one bouquet bar plus one greenhouse bar").toHaveLength(2);
  expect(report.mobileGreenhousePlinthVisible).toBe(false);
  expect(report.ritualLogVisible).toBe(false);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await clickGuidedSwap(page, { retireGuide: true });
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator(".tile.thorn-teach, .tile.thorn-teach-lane, .tile.thorn-teach-blocker")).toHaveCount(0);
  await expect(page.locator(".tile.idle-hint, .swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);

  await forceActiveBouquetFailure(page);
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  report = await visibleReport(page);
  expect(report.retryVisible).toBe(true);
  await page.locator("#renewBtn.visible").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator(".tile.thorn-teach, .tile.thorn-teach-lane, .tile.thorn-teach-blocker")).toHaveCount(0);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2);
  await expect(page.locator(".swap-path-arrow, .first-action-swap-guide")).toHaveCount(0);
  await expect(page.locator("#firstSwapCue")).toContainText("Nightshade next");
  report = await visibleReport(page);
  expect(report.tiles).toBe(64);
  expect(report.tutorialSpotlights, "Retry uses one useful target pair without replaying the Thorn lesson").toBe(2);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

for (const viewport of [
  { label: "desktop", width: 1280, height: 720, mobile: false },
  { label: "mobile390", width: 390, height: 844, mobile: true }
]) {
  test(`invalid tutorial swaps visibly recoil without spending a move on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openFreshNoReview(page, `invalid-feedback-${viewport.label}`);
    const pair = await findInvalidAdjacentPair(page);
    expect(pair, `${viewport.label} invalid adjacent pair`).toHaveLength(2);
    const before = await activeState(page);
    for (const cell of pair) {
      const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
      await tile.click();
    }
    await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
    await page.waitForTimeout(140);
    const peak = await invalidFeedbackState(page);
    expect(peak.moves, `${viewport.label} refusal spends no move`).toBe(before.moves);
    expect(peak.board, `${viewport.label} refusal preserves board`).toBe(before.board);
    expect(peak.tutorialIcon, `${viewport.label} visible refusal category`).toBe("NO BLOOM");
    expect(peak.tutorialIconAriaHidden, `${viewport.label} refusal reaches accessibility tree`).toBe("false");
    expect(peak.tutorialCopy, `${viewport.label} terse corrective action`).toBe("Use the glowing pair.");
    expect(peak.tutorialText, `${viewport.label} visible pixels include refusal`).toContain("NO BLOOM");
    expect(peak.refusedTutorial, `${viewport.label} refused tutorial state`).toBe(true);
    expect(peak.tutorialVisible, `${viewport.label} tutorial remains visible`).toBe(true);
    expect(peak.tutorialClipped, `${viewport.label} refusal is not clipped`).toBe(false);
    expect(peak.firstSwapCueVisible, `${viewport.label} hidden cue does not duplicate refusal`).toBe(false);
    expect(peak.instructionSurfaces, `${viewport.label} one instruction surface`).toBe(1);
    expect(peak.visibleButtons, `${viewport.label} Skip remains sole non-tile action`).toEqual(["Skip"]);
    expect(peak.invalidTiles, `${viewport.label} both attempted tiles recoil`).toHaveLength(2);
    expect(peak.invalidTiles.every((tile) => tile.transform !== "none"), `${viewport.label} directional recoil is visible`).toBe(true);
    const horizontal = pair[0].y === pair[1].y;
    expect(
      peak.invalidTiles.every((tile) => horizontal ? tile.invalidX !== "0%" && tile.invalidY === "0%" : tile.invalidY !== "0%" && tile.invalidX === "0%"),
      `${viewport.label} recoil follows attempted swap axis`
    ).toBe(true);
    expect(peak.focusedCell, `${viewport.label} focus returns to attempted source`).toEqual(pair[0]);
    expect(peak.tiles).toBe(64);
    expect(peak.dataRows).toBe(8);
    expect(peak.overflowX).toBe(false);
    expect(peak.brokenImages).toEqual([]);
    if (viewport.mobile) {
      expect(peak.boardBottom, `${viewport.label} board remains in first viewport`).toBeLessThanOrEqual(844);
    }
    await page.screenshot({ path: `work/invalid-feedback-${viewport.label}.png`, fullPage: true });

    await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1600 });
    const recovered = await invalidFeedbackState(page);
    expect(recovered.moves).toBe(before.moves);
    expect(recovered.board).toBe(before.board);
    expect(recovered.refusedTutorial).toBe(false);
    expect(recovered.tutorialIcon).toBe("✦");
    expect(recovered.tutorialIconAriaHidden).toBe("true");
    expect(recovered.tutorialCopy).toBe("Swap the glowing flowers.");
    expect(recovered.rows).toBe(8);

    if (!viewport.mobile) {
      await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).focus();
      await page.keyboard.press("Enter");
      await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#tutorialPanel")).toContainText("NO BLOOM");
      const keyboardPeak = await invalidFeedbackState(page);
      expect(keyboardPeak.moves, "keyboard refusal spends no move").toBe(before.moves);
      expect(keyboardPeak.board, "keyboard refusal preserves board").toBe(before.board);
      await page.reload({ waitUntil: "networkidle" });
      await waitForSettledBoard(page);
      const reloaded = await invalidFeedbackState(page);
      expect(reloaded.moves, "refusal reload preserves settled move count").toBe(before.moves);
      expect(reloaded.board, "refusal reload preserves settled board").toBe(before.board);
      expect(reloaded.invalidTiles).toHaveLength(0);
      expect(reloaded.refusedTutorial).toBe(false);
      expect(reloaded.tutorialIcon).toBe("✦");
      expect(reloaded.tutorialCopy).toBe("Swap the glowing flowers.");
      await expect(page.locator('.tile[tabindex="0"]')).toHaveCount(1);
    }
  });
}
test("Round 1 tutorial board choreography derives from the authoritative hinted pair", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  for (const config of [
    { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false },
    { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
  ]) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(config.viewport);
    await openFresh(page, `first-action-guide-${config.label}`);
    await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
    const pair = await hintedPair(page);
    let guide = await firstActionGuideReport(page);
    assertFirstActionGuide(guide, pair, `fresh ${config.label}`, { mobile: config.mobile });
    await page.screenshot({ path: `work/first-action-guide-${config.label}.png`, fullPage: true });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
    const reloadedPair = await hintedPair(page);
    expect(reloadedPair).toEqual(pair);
    guide = await firstActionGuideReport(page);
    assertFirstActionGuide(guide, reloadedPair, `pre-move reload ${config.label}`, { mobile: config.mobile });

    await page.locator("#tutorialSkipBtn").click();
    await expect(page.locator("#tutorialPanel")).toBeHidden();
    await expect(page.locator(".first-action-swap-guide")).toHaveCount(0);
    await expect(page.locator(".swap-path-arrow")).toHaveCount(0);

    await page.locator("#tutorialHelpBtn").click();
    await expect(page.locator("#tutorialPanel")).toBeVisible();
    guide = await firstActionGuideReport(page);
    assertFirstActionGuide(guide, pair, `replay ${config.label}`, { mobile: config.mobile });

    for (const order of [0, 1]) {
      if (order > 0) {
        await openFresh(page, `first-action-guide-${config.label}-reverse`);
        await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      }
      const orderedPair = await hintedPair(page);
      const source = orderedPair[order];
      const destination = orderedPair[order === 0 ? 1 : 0];
      const before = await activeState(page);
      const sourceTile = page.locator(`.tile[data-x="${source.x}"][data-y="${source.y}"]`);
      await sourceTile.click();
      guide = await firstActionGuideReport(page);
      assertSelectedFirstActionGuide(
        guide,
        orderedPair,
        source,
        `${config.label} selected order ${order + 1}`,
        { mobile: config.mobile }
      );
      const selectedState = await activeState(page);
      expect(selectedState.moves, `${config.label} selection spends no move`).toBe(before.moves);
      expect(selectedState.counts, `${config.label} selection changes no objective`).toEqual(before.counts);
      expect(selectedState.board, `${config.label} selection preserves board`).toBe(before.board);
      if (order === 0) {
        await page.screenshot({ path: `work/first-action-selected-${config.label}.png`, fullPage: true });
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
        assertFirstActionGuide(
          await firstActionGuideReport(page),
          orderedPair,
          `${config.label} half-selection reload restores full guide`,
          { mobile: config.mobile }
        );
        const restoredSource = page.locator(`.tile[data-x="${source.x}"][data-y="${source.y}"]`);
        await restoredSource.click();
        assertSelectedFirstActionGuide(
          await firstActionGuideReport(page),
          orderedPair,
          source,
          `${config.label} selected again after reload`,
          { mobile: config.mobile }
        );
      }
      assertStableSelectedTileGeometry(
        await stableTileGeometryReport(page),
        `${config.label} selected order ${order + 1}`,
        { mobile: config.mobile }
      );
      const destinationTile = page.locator(`.tile[data-x="${destination.x}"][data-y="${destination.y}"]`);
      await destinationTile.click();
      await waitForSettledBoard(page);
      const after = await activeState(page);
      expect(after.moves, `${config.label} authored pair spends one move`).toBe(before.moves - 1);
      expect(
        after.counts.reduce((sum, value) => sum + value, 0),
        `${config.label} authored pair advances bouquet`
      ).toBeGreaterThan(before.counts.reduce((sum, value) => sum + value, 0));
    }

    if (!config.mobile) {
      await openFresh(page, "first-action-guide-keyboard");
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      const keyboardPair = await hintedPair(page);
      const sourceTile = page.locator(`.tile[data-x="${keyboardPair[0].x}"][data-y="${keyboardPair[0].y}"]`);
      const destinationTile = page.locator(`.tile[data-x="${keyboardPair[1].x}"][data-y="${keyboardPair[1].y}"]`);
      await sourceTile.focus();
      await page.keyboard.press("Enter");
      assertSelectedFirstActionGuide(
        await firstActionGuideReport(page),
        keyboardPair,
        keyboardPair[0],
        "keyboard first Enter"
      );
      await expect(destinationTile).toBeFocused();
      await page.keyboard.press("Enter");
      await waitForSettledBoard(page);
      expect((await activeState(page)).moves, "keyboard second Enter completes pair").toBe(5);
    }
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page, "first-action-guide-reduced-mobile390");
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  const reducedPair = await hintedPair(page);
  let reducedGuide = await firstActionGuideReport(page);
  assertFirstActionGuide(reducedGuide, reducedPair, "reduced mobile390", { mobile: true, reducedMotion: true });
  await page.locator(`.tile[data-x="${reducedPair[0].x}"][data-y="${reducedPair[0].y}"]`).click();
  reducedGuide = await firstActionGuideReport(page);
  assertSelectedFirstActionGuide(
    reducedGuide,
    reducedPair,
    reducedPair[0],
    "reduced selected mobile390",
    { mobile: true, reducedMotion: true }
  );
  assertStableSelectedTileGeometry(
    await stableTileGeometryReport(page),
    "reduced selected mobile390",
    { mobile: true, reducedMotion: true }
  );
  await page.screenshot({ path: "work/first-action-guide-mobile390-reduced.png", fullPage: true });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("exact mobile touch taps keep the first-action destination explicit", async ({ browser }) => {
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  try {
    for (const order of [0, 1]) {
      await openFresh(mobile, `first-action-touch-tap-mobile390-${order + 1}`);
      await expect(mobile.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      const pair = await hintedPair(mobile);
      const source = pair[order];
      const destination = pair[order === 0 ? 1 : 0];
      const before = await activeState(mobile);
      await mobile.locator(`.tile[data-x="${source.x}"][data-y="${source.y}"]`).tap();
      assertSelectedFirstActionGuide(
        await firstActionGuideReport(mobile),
        pair,
        source,
        `exact mobile touch first tap order ${order + 1}`,
        { mobile: true }
      );
      expect((await activeState(mobile)).moves, "touch selection spends no move").toBe(before.moves);
      assertStableSelectedTileGeometry(
        await stableTileGeometryReport(mobile),
        `exact mobile touch order ${order + 1}`,
        { mobile: true }
      );
      await mobile.locator(`.tile[data-x="${destination.x}"][data-y="${destination.y}"]`).tap();
      await waitForSettledBoard(mobile);
      const after = await activeState(mobile);
      expect(after.moves, "touch destination tap commits authored swap").toBe(before.moves - 1);
      expect(after.counts.reduce((sum, value) => sum + value, 0), "touch swap advances bouquet").toBeGreaterThan(0);
      expect(after.tiles).toBe(64);
      expect(after.rows).toBe(8);
      expect(after.overflowX).toBe(false);
    }
  } finally {
    await mobile.close();
  }
});

test("passive selection and canceled input preserve completed order feedback", async ({ page, browser }) => {
  const prepareFeedback = async (targetPage, label, viewport) => {
    await targetPage.setViewportSize(viewport);
    await openFreshNoReview(targetPage, `feedback-passive-${label}`);
    const opening = await commitGuidedSwapAtControlReturn(targetPage);
    expect(opening.after.moves, `${label} opening move`).toBe(5);
    expect(opening.after.counts, `${label} opening objective`).toEqual([0, 0, 0, 0, 0, 3]);
    expect(opening.after.orderPulseCount, `${label} opening pulses`).toBe(4);
    return opening.after;
  };

  for (const config of [
    { label: "desktop", viewport: { width: 1280, height: 720 }, touch: false },
    { label: "mobile390", viewport: { width: 390, height: 844 }, touch: true }
  ]) {
    const targetPage = config.touch
      ? await browser.newPage({ viewport: config.viewport, hasTouch: true, isMobile: true })
      : page;
    try {
      const before = await prepareFeedback(targetPage, `${config.label}-selection`, config.viewport);
      const select = targetPage.locator('.tile[data-x="0"][data-y="0"]');
      if (config.touch) {
        await select.tap();
      } else {
        await select.click();
      }
      await expect(targetPage.locator(".tile.sel")).toHaveCount(1);
      const selected = await invalidFeedbackState(targetPage);
      assertPassiveInputPreservesFeedback(before, selected, `${config.label} first selection`);

      const replacement = targetPage.locator('.tile[data-x="2"][data-y="0"]');
      if (config.touch) {
        await replacement.tap();
      } else {
        await replacement.click();
      }
      await expect(targetPage.locator('.tile.sel[data-x="2"][data-y="0"]')).toHaveCount(1);
      const reselected = await invalidFeedbackState(targetPage);
      assertPassiveInputPreservesFeedback(before, reselected, `${config.label} nonadjacent reselection`);

      await expect.poll(
        async () => (await invalidFeedbackState(targetPage)).orderPulseCount,
        { timeout: 1800 }
      ).toBe(0);
      const naturallyCleared = await invalidFeedbackState(targetPage);
      expect(naturallyCleared.moves, `${config.label} natural clear preserves moves`).toBe(before.moves);
      expect(naturallyCleared.counts, `${config.label} natural clear preserves objective`).toEqual(before.counts);
      expect(naturallyCleared.board, `${config.label} natural clear preserves board`).toBe(before.board);
    } finally {
      if (config.touch) {
        await targetPage.close();
      }
    }
  }

  const keyboardBefore = await prepareFeedback(page, "keyboard", { width: 1280, height: 720 });
  const keyboardTile = page.locator('.tile[data-x="0"][data-y="0"]');
  await keyboardTile.focus();
  await page.keyboard.press("ArrowRight");
  const movedFocus = await invalidFeedbackState(page);
  assertPassiveInputPreservesFeedback(keyboardBefore, movedFocus, "keyboard focus movement");
  await page.keyboard.press("Enter");
  await expect(page.locator(".tile.sel")).toHaveCount(1);
  const keyboardSelected = await invalidFeedbackState(page);
  assertPassiveInputPreservesFeedback(keyboardBefore, keyboardSelected, "keyboard first Enter");

  const pointerCancelBefore = await prepareFeedback(page, "pointer-cancel", { width: 1280, height: 720 });
  const pointerCell = [{ x: 0, y: 0 }];
  const [pointerGeometry] = await tileGeometry(page, pointerCell);
  await page.mouse.move(pointerGeometry.centerX, pointerGeometry.centerY);
  await page.mouse.down();
  await page.mouse.move(pointerGeometry.centerX + 38, pointerGeometry.centerY, { steps: 5 });
  await page.dispatchEvent("#board", "pointercancel", {
    pointerId: 1,
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    clientX: pointerGeometry.centerX + 38,
    clientY: pointerGeometry.centerY
  });
  await page.mouse.up();
  await expect(page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready")).toHaveCount(0);
  const pointerCanceled = await invalidFeedbackState(page);
  assertPassiveInputPreservesFeedback(pointerCancelBefore, pointerCanceled, "desktop pointer cancel");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  try {
    const touchCancelBefore = await prepareFeedback(mobile, "touch-cancel", { width: 390, height: 844 });
    const [touchGeometry] = await tileGeometry(mobile, [{ x: 0, y: 0 }]);
    const client = await mobile.context().newCDPSession(mobile);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: touchGeometry.centerX, y: touchGeometry.centerY, id: 9 }]
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: touchGeometry.centerX + 38, y: touchGeometry.centerY, id: 9 }]
    });
    await mobile.waitForFunction(() => document.querySelectorAll(".tile.drag-preview-source").length === 1);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: []
    });
    await expect(mobile.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready")).toHaveCount(0);
    const touchCanceled = await invalidFeedbackState(mobile);
    assertPassiveInputPreservesFeedback(touchCancelBefore, touchCanceled, "mobile touch cancel");
    expect(touchCanceled.boardBottom, "mobile touch cancel keeps board in viewport").toBeLessThanOrEqual(844);
  } finally {
    await mobile.close();
  }
});

for (const viewport of [
  { label: "desktop", width: 1280, height: 720, mobile: false },
  { label: "mobile390", width: 390, height: 844, mobile: true }
]) {
  test(`rapid new interaction owns feedback on ${viewport.label}`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openFreshNoReview(page, `feedback-owner-invalid-${viewport.label}`);
    const firstValid = await commitGuidedSwapAtControlReturn(page);
    expect(firstValid.after.moves, `${viewport.label} valid opening move`).toBe(5);
    expect(firstValid.after.counts.reduce((sum, value) => sum + value, 0), `${viewport.label} opening harvest`).toBe(3);
    expect(firstValid.after.positiveFeedback.length, `${viewport.label} success feedback exists at control return`).toBeGreaterThan(0);
    const settledStage = firstValid.after;
    const invalidPair = await findInvalidAdjacentPair(page);
    expect(invalidPair, `${viewport.label} rapid invalid pair`).toHaveLength(2);
    const refusalStartedAt = Date.now();
    await page.evaluate((cells) => {
      cells.forEach(({ x, y }) => {
        document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`).click();
      });
    }, invalidPair);
    await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
    const waitForRefusalAge = async (age) => {
      await page.waitForTimeout(Math.max(0, age - (Date.now() - refusalStartedAt)));
    };

    await waitForRefusalAge(140);
    const peak140 = await invalidFeedbackState(page);
    assertRefusalOwnsFeedback(peak140, `${viewport.label} 140ms`, { agency: true });
    expect(peak140.moves).toBe(settledStage.moves);
    expect(peak140.counts).toEqual(settledStage.counts);
    expect(peak140.board).toBe(settledStage.board);
    await page.screenshot({ path: `work/rapid-feedback-owner-${viewport.label}.png`, fullPage: true });

    await waitForRefusalAge(500);
    const peak500 = await invalidFeedbackState(page);
    assertRefusalOwnsFeedback(peak500, `${viewport.label} 500ms`, { agency: true });
    expect(peak500.moves).toBe(settledStage.moves);
    expect(peak500.counts).toEqual(settledStage.counts);
    expect(peak500.board).toBe(settledStage.board);

    await waitForRefusalAge(800);
    const peak800 = await invalidFeedbackState(page);
    assertRefusalOwnsFeedback(peak800, `${viewport.label} 800ms`, { agency: true });
    expect(peak800.moves).toBe(settledStage.moves);
    expect(peak800.counts).toEqual(settledStage.counts);
    expect(peak800.board).toBe(settledStage.board);

    await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 800 });
    const recovered = await invalidFeedbackState(page);
    expect(recovered.tutorialCopy, `${viewport.label} exact stage copy restores`).toBe(settledStage.tutorialCopy);
    expect(recovered.tutorialIcon, `${viewport.label} exact stage category restores`).toBe(settledStage.tutorialIcon);
    expect(recovered.cue, `${viewport.label} exact hidden cue restores`).toBe(settledStage.cue);
    expect(recovered.hints, `${viewport.label} exact hint pair restores`).toEqual(settledStage.hints);

    await openFreshNoReview(page, `feedback-owner-valid-${viewport.label}`);
    const first = await commitGuidedSwapAtControlReturn(page);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
    const second = await commitGuidedSwapAtControlReturn(page, { sampleImpact: true });
    expect(second.after.moves, `${viewport.label} rapid second valid move`).toBe(first.after.moves - 1);
    expect(
      second.after.counts.reduce((sum, value) => sum + value, 0),
      `${viewport.label} rapid second valid harvest`
    ).toBeGreaterThan(first.after.counts.reduce((sum, value) => sum + value, 0));
    expect(second.feedbackPeak.impactDomTexts, `${viewport.label} one current HIT`).toEqual(["HIT"]);
    expect(second.after.orderPulseCount, `${viewport.label} current order pulse`).toBeGreaterThan(0);
    await page.waitForTimeout(650);
    const afterOldTimerBoundary = await invalidFeedbackState(page);
    expect(afterOldTimerBoundary.orderPulseCount, `${viewport.label} old timer cannot clear current pulse`).toBeGreaterThan(0);
    expect(afterOldTimerBoundary.moves).toBe(second.after.moves);
    expect(afterOldTimerBoundary.counts).toEqual(second.after.counts);
    expect(afterOldTimerBoundary.tiles).toBe(64);
    expect(afterOldTimerBoundary.dataRows).toBe(8);
    expect(afterOldTimerBoundary.overflowX).toBe(false);
    expect(afterOldTimerBoundary.brokenImages).toEqual([]);
    if (viewport.mobile) {
      expect(afterOldTimerBoundary.boardBottom).toBeLessThanOrEqual(844);
    }
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}

test("rapid keyboard refusal retires the prior success generation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFreshNoReview(page, "feedback-owner-keyboard");
  const firstValid = await commitGuidedSwapAtControlReturn(page, { keyboard: true });
  expect(firstValid.after.positiveFeedback.length, "keyboard success feedback exists").toBeGreaterThan(0);
  const invalidPair = await findInvalidAdjacentPair(page);
  for (const cell of invalidPair) {
    const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    await tile.focus();
    await page.keyboard.press("Enter");
  }
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
  await page.waitForTimeout(140);
  const peak = await invalidFeedbackState(page);
  assertRefusalOwnsFeedback(peak, "keyboard 140ms", { agency: true });
  expect(peak.moves).toBe(firstValid.after.moves);
  expect(peak.counts).toEqual(firstValid.after.counts);
  expect(peak.board).toBe(firstValid.after.board);
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1600 });
});

test("drag preview moves the hinted pair before one authoritative release", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "drag-preview-desktop");
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  const pair = await hintedPair(page);
  assertFirstActionGuide(await firstActionGuideReport(page), pair, "pre-drag desktop");
  const before = await activeState(page);
  const preview = await previewDelta(page, pair);
  await page.screenshot({ path: "work/drag-preview-desktop-ready.png", fullPage: true });
  const during = await activeState(page);
  const guideDuringDrag = await firstActionGuideReport(page);
  expect(guideDuringDrag.visible, "drag handoff hides first-action guide").toBe(false);
  expect(guideDuringDrag.dragPreviewTiles, "existing drag preview owns the pair").toBe(2);
  expect(Math.abs(preview.sourceAxis), "source pre-release translation").toBeGreaterThan(18);
  expect(Math.abs(preview.neighborAxis), "neighbor pre-release translation").toBeGreaterThan(5);
  expect(Math.sign(preview.sourceAxis), "source tracks toward neighbor").toBe(preview.vector.dx || preview.vector.dy);
  expect(Math.sign(preview.neighborAxis), "neighbor yields opposite source").toBe(-(preview.vector.dx || preview.vector.dy));
  expect(during.moves).toBe(before.moves);
  expect(during.counts).toEqual(before.counts);
  expect(during.board).toBe(before.board);
  expect(during.roundComplete).toBe(before.roundComplete);
  expect(during.tiles).toBe(before.tiles);
  expect(during.overflowX).toBe(before.overflowX);

  await releaseMouseAndWaitIdle(page);
  const after = await activeState(page);
  expect(after.moves, "valid drag spends exactly one move").toBe(before.moves - 1);
  expect(after.counts.reduce((sum, value) => sum + value, 0), "valid drag advances objective counts").toBeGreaterThan(before.counts.reduce((sum, value) => sum + value, 0));
  expect(await page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready").count()).toBe(0);
  await expect(page.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow")).toHaveCount(0);
  await expect(page.locator("#tutorialCopy")).toHaveText("Find 3 Thorn Roses.");
  await expect(page.locator(".first-action-swap-guide")).toHaveCount(1, { timeout: 9000 });
  assertFirstActionGuide(
    await firstActionGuideReport(page),
    await hintedPair(page),
    "post-drag delayed agency rescue",
    { stage: "thorn-followup" }
  );
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("invalid, cancel, mobile touch, and reduced motion drag paths stay clean", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "drag-invalid");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  const startingPair = await hintedPair(page);
  assertFirstActionGuide(await firstActionGuideReport(page), startingPair, "invalid-start desktop");
  const invalidPair = await findInvalidAdjacentPair(page);
  expect(invalidPair, "invalid adjacent pair").toHaveLength(2);
  const invalidBefore = await activeState(page);
  const invalidPreview = await previewDelta(page, invalidPair);
  expect(Math.abs(invalidPreview.sourceAxis), "invalid source previews").toBeGreaterThan(18);
  expect(Math.abs(invalidPreview.neighborAxis), "invalid neighbor previews").toBeGreaterThan(5);
  await releaseMouseAndWaitIdle(page);
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
  const invalidPeak = await invalidFeedbackState(page);
  expect(invalidPeak.moves, "invalid drag peak spends no move").toBe(invalidBefore.moves);
  expect(invalidPeak.board, "invalid drag peak leaves board authoritative").toBe(invalidBefore.board);
  expect(invalidPeak.tutorialIcon).toBe("NO BLOOM");
  expect(invalidPeak.tutorialCopy).toBe("Use the glowing pair.");
  expect(invalidPeak.invalidTiles).toHaveLength(2);
  expect(invalidPeak.instructionSurfaces).toBe(1);
  expect(invalidPeak.positiveFeedback).toEqual([]);
  expect(invalidPeak.positiveFeedbackIntersections).toBe(0);
  await page.screenshot({ path: "work/invalid-feedback-desktop-drag.png", fullPage: true });
  await page.waitForTimeout(1250);
  const invalidAfter = await activeState(page);
  expect(invalidAfter.moves, "invalid drag spends no move").toBe(invalidBefore.moves);
  expect(invalidAfter.board, "invalid drag leaves board authoritative").toBe(invalidBefore.board);
  expect(await page.locator(".tile.invalid-swap").count()).toBe(0);
  assertFirstActionGuide(await firstActionGuideReport(page), startingPair, "invalid restore desktop");

  const cancelGeometry = await tileGeometry(page, [startingPair[0]]);
  const boardRect = await page.locator("#board").boundingBox();
  const cancelEnd = {
    x: Math.max(1, (boardRect?.x || 0) - 30),
    y: cancelGeometry[0].centerY
  };
  await page.mouse.move(cancelGeometry[0].centerX, cancelGeometry[0].centerY);
  await page.mouse.down();
  await page.mouse.move(cancelEnd.x, cancelEnd.y, { steps: 5 });
  await page.dispatchEvent("#board", "pointercancel", {
    pointerId: 1,
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    clientX: cancelEnd.x,
    clientY: cancelEnd.y
  });
  await page.mouse.up();
  const cancelAfter = await activeState(page);
  expect(cancelAfter.moves, "cancel spends no move").toBe(invalidAfter.moves);
  expect(await page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready").count()).toBe(0);
  await expect.poll(async () => page.evaluate(() => Array.from(document.querySelectorAll(".tile")).every((tile) => {
    const transform = getComputedStyle(tile).transform;
    return transform === "none" || new DOMMatrixReadOnly(transform).isIdentity;
  }))).toBe(true);
  assertFirstActionGuide(await firstActionGuideReport(page), startingPair, "pointer cancel restore desktop");

  await openFresh(page, "first-action-selected-refusal");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  const selectedPair = await hintedPair(page);
  const selectedSource = selectedPair[0];
  const selectedDestination = selectedPair[1];
  await page.locator(`.tile[data-x="${selectedSource.x}"][data-y="${selectedSource.y}"]`).click();
  assertSelectedFirstActionGuide(
    await firstActionGuideReport(page),
    selectedPair,
    selectedSource,
    "selected-state pre-cancel desktop"
  );
  const selectedGeometry = await tileGeometry(page, [selectedSource]);
  const selectedBoardRect = await page.locator("#board").boundingBox();
  const selectedCancelEnd = {
    x: Math.max(1, (selectedBoardRect?.x || 0) - 30),
    y: selectedGeometry[0].centerY
  };
  await page.mouse.move(selectedGeometry[0].centerX, selectedGeometry[0].centerY);
  await page.mouse.down();
  await page.mouse.move(selectedCancelEnd.x, selectedCancelEnd.y, { steps: 5 });
  await page.dispatchEvent("#board", "pointercancel", {
    pointerId: 1,
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    clientX: selectedCancelEnd.x,
    clientY: selectedCancelEnd.y
  });
  await page.mouse.up();
  assertSelectedFirstActionGuide(
    await firstActionGuideReport(page),
    selectedPair,
    selectedSource,
    "selected-state pointer cancel desktop",
    { focusDestination: false }
  );

  const invalidNeighbor = await findInvalidNeighborForCell(page, selectedSource, selectedDestination);
  expect(invalidNeighbor, "selected source has an invalid adjacent alternative").toBeTruthy();
  const selectedBeforeRefusal = await activeState(page);
  await page.waitForTimeout(375);
  await page.locator(`.tile[data-x="${invalidNeighbor.x}"][data-y="${invalidNeighbor.y}"]`).click();
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(2);
  expect((await firstActionGuideReport(page)).visible, "NO BLOOM owns the directional layer").toBe(false);
  const selectedRefusalPeak = await invalidFeedbackState(page);
  expect(selectedRefusalPeak.tutorialIcon).toBe("NO BLOOM");
  expect(selectedRefusalPeak.tutorialCopy).toBe("Use the glowing pair.");
  expect(selectedRefusalPeak.moves).toBe(selectedBeforeRefusal.moves);
  expect(selectedRefusalPeak.board).toBe(selectedBeforeRefusal.board);
  await page.waitForTimeout(1250);
  assertSelectedFirstActionGuide(
    await firstActionGuideReport(page),
    selectedPair,
    selectedSource,
    "selected-state refusal restores destination desktop"
  );

  const nonadjacent = await page.evaluate(({ source, pair }) => {
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        if (
          Math.abs(source.x - x) + Math.abs(source.y - y) > 1
          && !pair.some((cell) => cell.x === x && cell.y === y)
        ) {
          return { x, y };
        }
      }
    }
    return null;
  }, { source: selectedSource, pair: selectedPair });
  await page.locator(`.tile[data-x="${nonadjacent.x}"][data-y="${nonadjacent.y}"]`).click();
  const reselectedGuide = await firstActionGuideReport(page);
  assertFirstActionGuide(reselectedGuide, selectedPair, "nonadjacent reselection restores full guide");
  expect(reselectedGuide.selectedTiles, "nonadjacent replacement remains selected").toBe(1);
  expect(reselectedGuide.selectedCell, "replacement selection is coherent").toEqual(nonadjacent);
  expect(reselectedGuide.tutorialCopy, "replacement selection restores opening copy").toBe("Swap the glowing flowers.");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    await openFresh(mobile, "drag-mobile390");
    await expect(mobile.locator("#tutorialPanel")).toBeVisible();
    const mobilePair = await hintedPair(mobile);
    assertFirstActionGuide(await firstActionGuideReport(mobile), mobilePair, "touch-start mobile390", { mobile: true });
    const mobileBefore = await activeState(mobile);
    const touchPreview = await dragTouchViaCdp(mobile, mobilePair);
    const mobileGuideDuringDrag = await firstActionGuideReport(mobile);
    expect(mobileGuideDuringDrag.visible, "touch handoff hides first-action guide").toBe(false);
    const mobileAfter = await activeState(mobile);
    const sourceAxis = mobilePair[0].x !== mobilePair[1].x
      ? touchPreview.afterGeometry[0].left - touchPreview.beforeGeometry[0].left
      : touchPreview.afterGeometry[0].top - touchPreview.beforeGeometry[0].top;
    const neighborAxis = mobilePair[0].x !== mobilePair[1].x
      ? touchPreview.afterGeometry[1].left - touchPreview.beforeGeometry[1].left
      : touchPreview.afterGeometry[1].top - touchPreview.beforeGeometry[1].top;
    expect(Math.abs(sourceAxis), "mobile source previews").toBeGreaterThan(18);
    expect(Math.abs(neighborAxis), "mobile neighbor previews").toBeGreaterThan(5);
    expect(mobileAfter.moves, "mobile drag has one commit").toBe(mobileBefore.moves - 1);
    expect(mobileAfter.tiles).toBe(64);
    expect(mobileAfter.rows).toBe(8);
    expect(mobileAfter.overflowX).toBe(false);

    await mobile.reload({ waitUntil: "networkidle" });
    await waitForSettledBoard(mobile);
    await expect(mobile.locator(".tile.idle-hint, .first-action-swap-guide, .swap-path-arrow")).toHaveCount(0);
    const mobileInvalidPair = await findInvalidAdjacentPair(mobile);
    const mobileInvalidBefore = await activeState(mobile);
    await dragTouchViaCdp(mobile, mobileInvalidPair, 0.62, { expectInvalid: true });
    await expect(mobile.locator(".tile.invalid-swap")).toHaveCount(2);
    const mobileInvalidPeak = await invalidFeedbackState(mobile);
    expect(mobileInvalidPeak.moves, "mobile invalid drag spends no move").toBe(mobileInvalidBefore.moves);
    expect(mobileInvalidPeak.board, "mobile invalid drag preserves board").toBe(mobileInvalidBefore.board);
    expect(mobileInvalidPeak.tutorialIcon).toBe("NO BLOOM");
    expect(mobileInvalidPeak.tutorialCopy).toBe("Try another adjacent swap.");
    expect(mobileInvalidPeak.invalidTiles).toHaveLength(2);
    expect(mobileInvalidPeak.positiveFeedback).toEqual([]);
    expect(mobileInvalidPeak.positiveFeedbackIntersections).toBe(0);
    expect(mobileInvalidPeak.tiles).toBe(64);
    expect(mobileInvalidPeak.dataRows).toBe(8);
    expect(mobileInvalidPeak.boardBottom).toBeLessThanOrEqual(844);
    expect(mobileInvalidPeak.overflowX).toBe(false);
    await mobile.screenshot({ path: "work/invalid-feedback-mobile390-drag.png", fullPage: true });
    await expect(mobile.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1600 });
  } finally {
    await mobile.close();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page, "drag-reduced-motion");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  const reducedPair = await hintedPair(page);
  assertFirstActionGuide(await firstActionGuideReport(page), reducedPair, "drag reduced-motion mobile390", { mobile: true, reducedMotion: true });
  const reducedBefore = await activeState(page);
  const reducedGeometry = await tileGeometry(page, reducedPair);
  const reducedVector = dragVector(reducedPair, reducedGeometry);
  await page.mouse.move(reducedVector.startX, reducedVector.startY);
  await page.mouse.down();
  await page.mouse.move(reducedVector.endX, reducedVector.endY, { steps: 4 });
  await page.waitForFunction(() => document.querySelectorAll(".tile.drag-preview-ready").length === 2);
  const reducedPreview = await tileGeometry(page, reducedPair);
  expect(reducedPreview[0].transform, "reduced motion source does not continuously translate").toBe("none");
  expect(reducedPreview[1].transform, "reduced motion neighbor does not continuously translate").toBe("none");
  await releaseMouseAndWaitIdle(page);
  const reducedAfter = await activeState(page);
  expect(reducedAfter.moves, "reduced motion release commits").toBe(reducedBefore.moves - 1);

  const reducedInvalidPair = await findInvalidAdjacentPair(page);
  for (const cell of reducedInvalidPair) {
    await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
  }
  await expect(page.locator("#tutorialPanel")).toContainText("NO BLOOM");
  const reducedInvalidPeak = await invalidFeedbackState(page);
  expect(reducedInvalidPeak.moves, "reduced motion invalid swap spends no move").toBe(reducedAfter.moves);
  expect(reducedInvalidPeak.board, "reduced motion invalid swap preserves board").toBe(reducedAfter.board);
  expect(reducedInvalidPeak.tutorialCopy).toBe("Try another adjacent swap.");
  expect(reducedInvalidPeak.positiveFeedback).toEqual([]);
  expect(reducedInvalidPeak.positiveFeedbackIntersections).toBe(0);
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1600 });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.currentRound = 2;
    state.moves = 9;
    state.coins = 20;
    state.counts = [0, 0, 0, 0, 0, 0];
    state.roundComplete = false;
    state.roundOneRestored = true;
    state.roundTwoGreenhouseUpgraded = false;
    state.tutorialSkipped = true;
    state.tutorialActive = false;
    state.hasMadeValidMove = false;
    state.restoredRoundTwoGuideMoves = 0;
    state.armedLineRelic = null;
    state.cursedThorns = [];
    state.clearedCursedThorns = 0;
    state.board = Array.from({ length: 8 }, (_, y) => (
      Array.from({ length: 8 }, (_, x) => (x + 2 * y) % 6)
    ));
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await waitForSettledBoard(page);
  const laterPair = await findInvalidAdjacentPair(page);
  const laterBefore = await activeState(page);
  for (const cell of laterPair) {
    await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).click();
  }
  await expect(page.locator("#firstSwapCue")).toContainText("No bloom");
  await expect(page.locator("#firstSwapCue")).toBeVisible();
  const laterPeak = await activeState(page);
  expect(laterPeak.moves, "later-round invalid swap spends no move").toBe(laterBefore.moves);
  expect(laterPeak.board, "later-round invalid swap preserves board").toBe(laterBefore.board);
  await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 1600 });
  await expect(page.locator("#firstSwapCue")).not.toContainText("No bloom");
});

test("keyboard play follows the board and payoff focus", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "keyboard");
  await expect(page.locator("#board")).toHaveAttribute("role", "grid");
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await keyboardGuidedSwap(page);
  await expect(page.locator("#bouquetProgressLabel")).toContainText(/Bouquet [1-9]/);
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);

  await completeRoundWithReviewKey(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expectReadyPrimaryAction(page, "Restore Greenhouse · 100 coins");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  let report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await page.keyboard.press("Enter");
  await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 5000 });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  await page.keyboard.press("Enter");
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 5000 });

  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.tiles).toBe(64);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
