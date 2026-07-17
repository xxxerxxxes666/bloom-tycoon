const { test, expect } = require("@playwright/test");

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
    spentTransaction: "Raised for 180. Play Again reinvests the remaining 50 coins."
  },
  {
    label: "round-three-raised",
    state: { currentRound: 3, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, roundThreeConservatoryRaised: true, moves: 2, counts: [13, 0, 0, 14, 0, 0] },
    coins: 50,
    action: "Play Again → First Bouquet",
    transaction: "Raised for 180. Play Again reinvests the remaining 50 coins.",
    enteredRound: 1,
    enteredCoins: 0
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
      coins: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").coins ?? 0,
      mobileGreenhousePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      visibleProgressText: document.body.innerText,
      bars: bars.map((node) => node.className),
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      round: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").currentRound || 1,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages
    };
  });
}

async function clickGuidedSwap(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  const pair = await hints.evaluateAll((tiles) => tiles.map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).dispatchEvent("click");
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).dispatchEvent("click");
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(() => {
    const payoff = document.querySelector("#roundOneRestoration");
    const payoffVisible = payoff && getComputedStyle(payoff).display !== "none";
    return payoffVisible || document.querySelectorAll(".tile.idle-hint").length === 2;
  }, null, { timeout: 7000 });
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
  ), null, { timeout: 7000 });
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
  await expect(firstTile).toBeFocused();
  await page.keyboard.press(key);
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

async function waitForSettledBoard(page) {
  await page.waitForFunction(() => {
    const tiles = Array.from(document.querySelectorAll(".tile"));
    if (tiles.length !== 64 || tiles.some((tile) => tile.disabled)) {
      return false;
    }
    const rowTops = new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().top)));
    return rowTops.size === 8;
  }, null, { timeout: 5000 });
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
    const hints = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y),
      flowerId: Number(tile.dataset.flowerId),
      label: tile.getAttribute("aria-label") || ""
    }));
    return {
      tag,
      round: saved.currentRound || 1,
      moves: saved.moves,
      counts: saved.counts || [],
      roundComplete: Boolean(saved.roundComplete),
      coins: saved.coins,
      bouquet: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      tutorial: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      hints,
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
    return Boolean(saved.roundComplete)
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
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 5000 });
  const pair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
  expect(Math.abs(pair[0].x - pair[1].x) + Math.abs(pair[0].y - pair[1].y)).toBe(1);
  return pair;
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
      thornTeach: tile.classList.contains("thorn-teach")
        || tile.classList.contains("thorn-teach-lane")
        || tile.classList.contains("thorn-teach-blocker")
    }));
    const boardRect = document.querySelector("#board")?.getBoundingClientRect();
    return {
      relic,
      hints,
      laneTiles,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
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
        .map((tile) => Math.round(tile.getBoundingClientRect().top)))].length,
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

function assertArmedRelicGuidance(report, expectedDirection, label, mobile = false) {
  expect(report.relic, `${label} saved relic`).toMatchObject({ direction: expectedDirection });
  expect(report.relicCount, `${label} one rendered relic`).toBe(1);
  expect(report.hints, `${label} exactly one activation pair`).toHaveLength(2);
  expect(report.hints.filter((tile) => tile.relic), `${label} hinted pair includes relic`).toHaveLength(1);
  expect(report.hints.filter((tile) => tile.destination), `${label} hinted pair includes destination`).toHaveLength(1);
  expect(report.destinationCount, `${label} one destination marker`).toBe(1);
  expect(report.boardActive, `${label} board has armed guidance state`).toBe(true);
  expect(report.arrows, `${label} one direct swap arrow`).toBe(1);
  expect(report.cue, `${label} cue names derived lane`).toContain(expectedDirection === "vertical" ? "column" : "row");
  expect(report.laneDirection, `${label} board lane direction`).toBe(expectedDirection);
  expect(report.laneTiles, `${label} complete lane preview`).toHaveLength(8);
  expect(report.laneTiles.filter((tile) => tile.armed), `${label} lane contains relic`).toHaveLength(1);
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

async function findInvalidAdjacentPair(page) {
  return page.evaluate(() => {
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
          if (!hasMatch(swap(a, b))) return [a, b];
        }
      }
    }
    return null;
  });
}

async function dragTouchViaCdp(page, pair, scale = 0.62) {
  const beforeGeometry = await tileGeometry(page, pair);
  const vector = dragVector(pair, beforeGeometry, scale);
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
  const afterGeometry = await tileGeometry(page, pair);
  await page.screenshot({ path: "work/drag-preview-mobile-ready.png", fullPage: true });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
    changedTouchPoints: [{ x: vector.endX, y: vector.endY, id: 7 }]
  });
  await page.waitForFunction(() => (
    Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
    || getComputedStyle(document.querySelector("#roundOneRestoration")).display !== "none"
  ), null, { timeout: 10000 });
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
    assertActiveGuidedState(trace[0], viewport.mobile, `${viewport.label} initial`);

    for (let index = 1; index <= 2; index += 1) {
      await clickHighlightedPair(page);
      trace.push(await guidedRoundOneState(page, `after swap ${index}`));
      assertActiveGuidedState(trace[trace.length - 1], viewport.mobile, `${viewport.label} after swap ${index}`);
    }

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const reloaded = await guidedRoundOneState(page, "after reload");
    assertActiveGuidedState(reloaded, viewport.mobile, `${viewport.label} reload`);
    expect(reloaded.moves).toBe(trace[2].moves);
    expect(reloaded.counts).toEqual(trace[2].counts);

    await clickHighlightedPair(page);
    const blackCandleCue = await guidedRoundOneState(page, "before Black Candle swap");
    trace.push(blackCandleCue);
    assertActiveGuidedState(blackCandleCue, viewport.mobile, `${viewport.label} before Black Candle`);
    expect(blackCandleCue.tutorial).toBe("Match 4 arms Black Candle Vine.");
    expect(blackCandleCue.cue).toBe("Make 4 Bone Stars - arm Black Candle Vine.");
    expect(blackCandleCue.hints).toHaveLength(2);
    expect(Math.abs(blackCandleCue.hints[0].x - blackCandleCue.hints[1].x) + Math.abs(blackCandleCue.hints[0].y - blackCandleCue.hints[1].y)).toBe(1);
    const preview = await legalFourBoneStarPreview(page);
    expect(preview.ok, JSON.stringify(preview)).toBe(true);
    await page.screenshot({ path: `work/black-candle-${viewport.label}-cue.png`, fullPage: true });

    await clickHighlightedPair(page);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
    await waitForSettledBoard(page);
    const formed = await guidedRoundOneState(page, "Black Candle armed");
    trace.push(formed);
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
    expect(formed.tutorial).toBe("Swap right to burn this row.");
    expect(formed.cue).toContain("Swap Black Candle Vine");
    expect(formed.hints).toHaveLength(2);
    expect(formed.visibleButtons).toEqual(["Skip"]);
    assertArmedRelicGuidance(
      await armedRelicGuidance(page),
      "horizontal",
      `${viewport.label} formed Round 1 Black Candle`,
      viewport.mobile
    );
    await page.screenshot({ path: "work/black-candle-" + viewport.label + "-formed.png", fullPage: true });

    await clickHighlightedPair(page);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(0);
    const activated = await guidedRoundOneState(page, "Black Candle activated");
    trace.push(activated);
    expect(activated.roundComplete).toBe(true);
    expect(activated.bouquet).toBe("Bouquet 14/14 -> +120 coins");
    expect(activated.moves).toBe(formed.moves - 1);
    expect(activated.tiles).toBe(64);
    expect(activated.overflowX).toBe(false);
    expect(activated.brokenImages).toEqual([]);
    await page.screenshot({ path: "work/black-candle-" + viewport.label + "-activated.png", fullPage: true });

    await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 3000 });
    const ceremony = await guidedRoundOneState(page, "ceremony");
    trace.push(ceremony);
    expect(ceremony.boardVisible).toBe(false);
    expect(ceremony.payoffVisible).toBe(true);
    expect(ceremony.coins).toBe(120);
    expect(ceremony.bouquet).toBe("Bouquet 14/14 -> +120 coins");
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
  await openFresh(page, "guided-payoff-mobile390");
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await completeGuidedRoundOne(page);

  await expect(page.locator("#bouquetProgressLabel")).toHaveText("Bouquet 14/14 -> +120 coins");
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
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

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
      assertArmedRelicGuidance(
        await armedRelicGuidance(page),
        "horizontal",
        `${testCase.label} horizontal formed special`,
        Boolean(testCase.mobile)
      );
      await page.waitForTimeout(850);
      await page.screenshot({ path: `work/black-candle-formed-${testCase.label}.png`, fullPage: true });

      await page.reload({ waitUntil: "networkidle" });
      await page.reload({ waitUntil: "networkidle" });
      await expect(relic).toHaveCount(1);
      const persisted = await activeState(page);
      expect(persisted.armedLineRelic).toEqual(formed.armedLineRelic);
      expect(persisted.moves).toBe(formed.moves);
      expect(persisted.counts).toEqual(formed.counts);
      assertArmedRelicGuidance(
        await armedRelicGuidance(page),
        "horizontal",
        `${testCase.label} horizontal persisted special`,
        Boolean(testCase.mobile)
      );

      const activationPair = await hintedPair(page);
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

      if (testCase.input === "touch") {
        await dragTouchViaCdp(page, activationPair);
      } else {
        await keyboardGuidedSwap(page);
      }
      await expect(relic).toHaveCount(0);
      await page.waitForTimeout(700);
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
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
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

      await settleGuidedSwap(page);
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
        await dragTouchViaCdp(page, formationPair);
      } else {
        for (const cell of formationPair) {
          await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
        }
      }

      const relic = page.locator('.tile[data-line-relic="black-candle-vine"]');
      await expect(relic).toHaveCount(1);
      await expect.poll(async () => (await activeState(page)).moves).toBe(beforeFormation.moves - 1);
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
            .map((tile) => Math.round(tile.getBoundingClientRect().top))).size,
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
      assertArmedRelicGuidance(
        await armedRelicGuidance(page),
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
      assertArmedRelicGuidance(
        await armedRelicGuidance(page),
        "vertical",
        `${testCase.label} vertical persisted special`,
        Boolean(testCase.mobile)
      );

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
      if (testCase.mobile) {
        await dragTouchViaCdp(page, activationPair);
      } else {
        for (const cell of activationPair) {
          await page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`).dispatchEvent("click");
        }
      }
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
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match 4 arms/);
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
    bouquetText: "Bouquet 0/14 -> +120 coins",
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
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match 4 makes/);
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
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match 4 makes/);
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
  await expect(page.locator("#bouquetProgressNext")).toContainText("Coins ready -> Restore First Bouquet Glass");
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
  await expect(page.locator("#tutorialCopy")).toHaveText("Match beside thorns.");
  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.greenhouseText).toBe("Owned 1/3 · Next: Upgrade Greenhouse");
  expect(report.tutorialPrompt).toBe("Match beside thorns.");
  expect(report.mobilePlinthVisible, "Round 2 mobile active play has no greenhouse footer").toBe(false);
  expect(report.ritualLogVisible, "Round 2 mobile active play has no ritual log footer").toBe(false);
  expect(report.visibleProgressText).not.toContain("First Bouquet:");
  expect(report.tutorialSpotlights).toBeGreaterThanOrEqual(3);
  expect(report.bars, "Round 2 mobile active play keeps one bouquet bar plus one greenhouse bar").toHaveLength(2);
  expect(report.mobileGreenhousePlinthVisible).toBe(false);
  expect(report.ritualLogVisible).toBe(false);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await clickGuidedSwap(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Finish the Moonlit Wreath.");

  await forceActiveBouquetFailure(page);
  if (await page.locator("#tutorialHelpBtn").isVisible()) {
    await page.locator("#tutorialHelpBtn").click();
  } else {
    await expect(page.locator("#tutorialPanel")).toBeVisible();
  }
  await expect(page.locator("#tutorialCopy")).toHaveText("Moves ended. Retry the bouquet.");
  report = await visibleReport(page);
  expect(report.retryVisible).toBe(true);
  expect(report.tutorialPrompt).toBe("Moves ended. Retry the bouquet.");
  await page.locator("#renewBtn.visible").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Match beside thorns.");
  await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator(".tile.thorn-teach-blocker")).not.toHaveCount(0);
  report = await visibleReport(page);
  expect(report.tiles).toBe(64);
  expect(report.tutorialSpotlights).toBeGreaterThanOrEqual(3);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
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
  const pair = await hintedPair(page);
  const before = await activeState(page);
  const preview = await previewDelta(page, pair);
  await page.screenshot({ path: "work/drag-preview-desktop-ready.png", fullPage: true });
  const during = await activeState(page);
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
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("invalid, cancel, mobile touch, and reduced motion drag paths stay clean", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "drag-invalid");
  const invalidPair = await findInvalidAdjacentPair(page);
  expect(invalidPair, "invalid adjacent pair").toHaveLength(2);
  const invalidBefore = await activeState(page);
  const invalidPreview = await previewDelta(page, invalidPair);
  expect(Math.abs(invalidPreview.sourceAxis), "invalid source previews").toBeGreaterThan(18);
  expect(Math.abs(invalidPreview.neighborAxis), "invalid neighbor previews").toBeGreaterThan(5);
  await releaseMouseAndWaitIdle(page);
  await page.waitForTimeout(900);
  const invalidAfter = await activeState(page);
  expect(invalidAfter.moves, "invalid drag spends no move").toBe(invalidBefore.moves);
  expect(invalidAfter.board, "invalid drag leaves board authoritative").toBe(invalidBefore.board);
  expect(await page.locator(".tile.invalid-swap").count()).toBe(0);

  const edge = [{ x: 0, y: 0 }, { x: -1, y: 0 }];
  const edgeGeometry = await tileGeometry(page, [edge[0]]);
  await page.mouse.move(edgeGeometry[0].centerX, edgeGeometry[0].centerY);
  await page.mouse.down();
  await page.mouse.move(edgeGeometry[0].centerX - 46, edgeGeometry[0].centerY, { steps: 5 });
  await page.dispatchEvent("#board", "pointercancel", {
    pointerId: 1,
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    clientX: edgeGeometry[0].centerX - 46,
    clientY: edgeGeometry[0].centerY
  });
  await page.mouse.up();
  const cancelAfter = await activeState(page);
  expect(cancelAfter.moves, "cancel spends no move").toBe(invalidAfter.moves);
  expect(await page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor, .tile.drag-preview-ready").count()).toBe(0);
  await expect.poll(async () => page.evaluate(() => Array.from(document.querySelectorAll(".tile")).every((tile) => getComputedStyle(tile).transform === "none"))).toBe(true);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    await openFresh(mobile, "drag-mobile390");
    const mobilePair = await hintedPair(mobile);
    const mobileBefore = await activeState(mobile);
    const touchPreview = await dragTouchViaCdp(mobile, mobilePair);
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
  } finally {
    await mobile.close();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await openFresh(page, "drag-reduced-motion");
  const reducedPair = await hintedPair(page);
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
