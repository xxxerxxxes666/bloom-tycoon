const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const HINT_TIMEOUT = 8500;

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

test.setTimeout(180000);

async function openRoundThreeAutonomy(page, label) {
  await page.goto(`${BASE_URL}?idle-hint-autonomy=${label}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = Array.from({ length: 8 }, (_, y) => (
      Array.from({ length: 8 }, (_, x) => (x + y * 2) % 6)
    ));
    board[0][0] = 3;
    board[0][1] = 1;
    board[0][2] = 3;
    board[0][3] = 4;
    board[1][1] = 3;
    board[4][4] = 0;
    board[4][5] = 1;
    board[4][6] = 0;
    board[5][5] = 0;
    Object.assign(state, {
      board,
      armedLineRelic: null,
      moves: 8,
      coins: 50,
      counts: [0, 0, 0, 0, 0, 0],
      cursedThorns: [],
      clearedCursedThorns: 0,
      currentRound: 3,
      roundComplete: false,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 2,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
}

async function autonomyReport(page) {
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
    const tiles = Array.from(document.querySelectorAll(".tile"));
    return {
      state,
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => ({
        x: Number(tile.dataset.x),
        y: Number(tile.dataset.y)
      })),
      invalidTiles: tiles.filter((tile) => tile.classList.contains("invalid-swap")).length,
      selectedTiles: tiles.filter((tile) => tile.classList.contains("sel")).length,
      disabledTiles: tiles.filter((tile) => tile.disabled).length,
      activeElementId: document.activeElement?.id || "",
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      completeRows: new Set(tiles
        .filter((tile) => {
          const rect = tile.getBoundingClientRect();
          return rect.top >= -1 && rect.bottom <= innerHeight + 1;
        })
        .map((tile) => tile.dataset.y)).size,
      instructionCount: [
        document.querySelector("#tutorialPanel"),
        document.querySelector("#firstSwapCue"),
        document.querySelector("#nextOrderCue")
      ].filter(visible).length,
      thornTeaching: document.querySelectorAll(".tile.thorn-teach, .tile.thorn-teach-blocker").length,
      relicGuidance: document.querySelectorAll(".tile.line-relic-lane-preview, .tile.line-relic-destination").length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function hintUsefulness(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const board = state.board.map((row) => row.slice());
    const pair = Array.from(document.querySelectorAll(".tile.idle-hint")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    const [a, b] = pair;
    if (!a || !b) return { pair, legal: false, useful: false };
    const previous = board[a.y][a.x];
    board[a.y][a.x] = board[b.y][b.x];
    board[b.y][b.x] = previous;
    const moved = new Set([`${a.x},${a.y}`, `${b.x},${b.y}`]);
    const runs = [];
    for (let y = 0; y < 8; y += 1) {
      for (let start = 0, x = 1; x <= 8; x += 1) {
        if (x === 8 || board[y][x] !== board[y][start]) {
          if (x - start >= 3) {
            runs.push({
              flowerId: board[y][start],
              cells: Array.from({ length: x - start }, (_, offset) => [start + offset, y])
            });
          }
          start = x;
        }
      }
    }
    for (let x = 0; x < 8; x += 1) {
      for (let start = 0, y = 1; y <= 8; y += 1) {
        if (y === 8 || board[y][x] !== board[start][x]) {
          if (y - start >= 3) {
            runs.push({
              flowerId: board[start][x],
              cells: Array.from({ length: y - start }, (_, offset) => [x, start + offset])
            });
          }
          start = y;
        }
      }
    }
    const created = runs.filter((run) => run.cells.some(([x, y]) => moved.has(`${x},${y}`)));
    const unfinished = new Set(Array.from(
      document.querySelectorAll(".objective-target[data-flower-id]:not(.complete)")
    ).map((node) => Number(node.dataset.flowerId)));
    return {
      pair,
      legal: Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 && created.length > 0,
      useful: created.some((run) => unfinished.has(run.flowerId))
    };
  }, SAVE_KEY);
}

async function waitForAutonomyHint(page, label, expectedFocus = null) {
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: HINT_TIMEOUT });
  const report = await autonomyReport(page);
  const usefulness = await hintUsefulness(page);
  expect(usefulness.legal, `${label} legal pair`).toBe(true);
  expect(usefulness.useful, `${label} objective-useful pair`).toBe(true);
  expect(report.instructionCount, `${label} no new narrator`).toBe(0);
  expect(report.thornTeaching, `${label} no Thorn lesson resurrection`).toBe(0);
  expect(report.relicGuidance, `${label} no relic competition`).toBe(0);
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} rows`).toBe(8);
  expect(report.completeRows, `${label} complete viewport rows`).toBe(8);
  expect(report.overflowX, `${label} fit`).toBe(false);
  expect(report.brokenImages, `${label} images`).toEqual([]);
  if (expectedFocus !== null) {
    expect(report.activeElementId, `${label} does not steal focus`).toBe(expectedFocus);
  }
  return { report, usefulness };
}

async function activatePair(page, pair, input) {
  const tileAt = (cell) => page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
  if (input === "touch") {
    await tileAt(pair[0]).tap();
    await tileAt(pair[1]).tap();
    return;
  }
  if (input === "keyboard") {
    await tileAt(pair[0]).focus();
    await page.keyboard.press("Enter");
    await tileAt(pair[1]).focus();
    await page.keyboard.press("Enter");
    return;
  }
  await tileAt(pair[0]).click();
  await tileAt(pair[1]).click();
}

async function cancelBoardInput(page, pair, testCase) {
  const tile = page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`);
  if (testCase.input === "keyboard") {
    await tile.focus();
    await page.keyboard.press("ArrowRight");
    return;
  }
  const box = await tile.boundingBox();
  expect(box).toBeTruthy();
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (testCase.input === "touch") {
    await page.evaluate(({ cell, point }) => {
      const tile = document.querySelector(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
      const touch = new Touch({
        identifier: 91,
        target: tile,
        clientX: point.x,
        clientY: point.y
      });
      const moved = new Touch({
        identifier: 91,
        target: tile,
        clientX: point.x + 30,
        clientY: point.y
      });
      tile.dispatchEvent(new TouchEvent("touchstart", {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true
      }));
      document.querySelector("#board").dispatchEvent(new TouchEvent("touchmove", {
        touches: [moved],
        changedTouches: [moved],
        bubbles: true,
        cancelable: true
      }));
      document.querySelector("#board").dispatchEvent(new TouchEvent("touchcancel", {
        touches: [],
        changedTouches: [moved],
        bubbles: true,
        cancelable: true
      }));
    }, { cell: pair[0], point });
    return;
  }
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y, { steps: 3 });
  await page.dispatchEvent("#board", "pointercancel", { pointerId: 1 });
  await page.mouse.up();
}

for (const testCase of CASES) {
  test(`focused autonomy hint owns quiet Round 3 recovery on ${testCase.label}`, async ({ browser }) => {
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
    page.on("requestfailed", (request) => {
      const url = request.url();
      const errorText = request.failure()?.errorText || "";
      const canceledFixtureImage = errorText === "net::ERR_ABORTED"
        && /\/assets\/greenhouse\/first_greenhouse_(?:restored|withered)\.jpg$/.test(url);
      if (!canceledFixtureImage) {
        failedRequests.push(`${url} ${errorText}`);
      }
    });

    try {
      await openRoundThreeAutonomy(page, testCase.label);
      const initialFocus = (await autonomyReport(page)).activeElementId;
      let hint = await waitForAutonomyHint(page, `${testCase.label} initial`, initialFocus);
      await page.screenshot({ path: `work/idle-hint-${testCase.label}.png` });

      await cancelBoardInput(page, hint.usefulness.pair, testCase);
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
      hint = await waitForAutonomyHint(page, `${testCase.label} after canceled input`);

      await activatePair(page, [{ x: 6, y: 7 }, { x: 7, y: 7 }], testCase.input);
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(2, { timeout: 1500 });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
      await expect(page.locator(".tile.invalid-swap")).toHaveCount(0, { timeout: 2500 });
      hint = await waitForAutonomyHint(page, `${testCase.label} after refusal`);
      expect(hint.report.state.moves, `${testCase.label} refusal spends no move`).toBe(8);

      // Use the fixture's ordinary three-match here so Black Candle's immediate
      // armed guidance cannot masquerade as a generic post-move idle hint.
      await activatePair(page, [{ x: 1, y: 0 }, { x: 1, y: 1 }], testCase.input);
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 7
          && document.querySelectorAll(".tile").length === 64
          && Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled);
      }, SAVE_KEY, { timeout: 12000 });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
      await waitForAutonomyHint(page, `${testCase.label} after valid match`);

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
        await expect(page.locator(".tile.idle-hint")).toHaveCount(0);
        const reloaded = await waitForAutonomyHint(page, `${testCase.label} reload ${reload}`);
        expect(reloaded.report.state.moves, `${testCase.label} reload ${reload} move state`).toBe(7);
      }

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
