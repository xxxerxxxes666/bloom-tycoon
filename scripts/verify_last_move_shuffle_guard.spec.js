const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const BOARD = [
  [3, 0, 4, 4, 0, 3, 3, 0],
  [2, 0, 0, 2, 3, 4, 0, 2],
  [4, 2, 0, 0, 2, 3, 4, 0],
  [1, 2, 1, 1, 3, 5, 4, 1],
  [0, 4, 2, 4, 0, 2, 3, 3],
  [2, 3, 4, 3, 3, 4, 0, 4],
  [3, 4, 2, 2, 0, 2, 4, 3],
  [4, 2, 2, 4, 3, 3, 0, 3]
];

const CONFIGS = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "click" },
  { label: "desktop-keyboard", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "tap", mobile: true },
  { label: "mobile-keyboard", viewport: { width: 390, height: 844 }, input: "keyboard", mobile: true, reduced: true }
];

test.setTimeout(300000);

function lastMoveRelicState() {
  return {
    focusedEconomyVersion: 2,
    currentRound: 1,
    moves: 1,
    counts: [0, 3, 0, 0, 0, 7],
    coins: 0,
    board: BOARD.map((row) => [...row]),
    armedLineRelic: { x: 3, y: 3, direction: "horizontal", flowerId: 1 },
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

function activeShuffleState() {
  return {
    focusedEconomyVersion: 2,
    currentRound: 1,
    moves: 5,
    counts: [0, 3, 0, 0, 0, 3],
    coins: 0,
    board: BOARD.map((row) => [...row]),
    armedLineRelic: null,
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

async function openState(page, marker) {
  await page.addInitScript(({ key, saved, fixtureMarker }) => {
    if (!sessionStorage.getItem(fixtureMarker)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(fixtureMarker, "1");
    }
  }, { key: SAVE_KEY, saved: lastMoveRelicState(), fixtureMarker: marker });
  await page.goto(`${BASE_URL}?last-move-shuffle=${marker}`, { waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator(".tile.black-candle-vine")).toHaveCount(1);
  await expect(page.locator(".tile.line-relic-destination")).toHaveCount(1);
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && bounds.width > 0
        && bounds.height > 0;
    };
    const board = document.querySelector("#board");
    const boardRect = board.getBoundingClientRect();
    const tiles = Array.from(board.querySelectorAll(".tile"));
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      moves: saved.moves,
      counts: saved.counts,
      coins: saved.coins,
      complete: saved.roundComplete,
      armedLineRelic: saved.armedLineRelic,
      shuffleVisible: visible(document.querySelector("#shuffleBtn")),
      shuffleDisabled: document.querySelector("#shuffleBtn").disabled,
      finalMoveClass: document.body.classList.contains("shuffle-retired-final-move"),
      activeId: document.activeElement?.id || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).length,
      sourceIds: tiles.filter((tile) => tile.classList.contains("black-candle-vine")).map((tile) => tile.id),
      destinationIds: tiles.filter((tile) => tile.classList.contains("line-relic-destination")).map((tile) => tile.id),
      tiles: tiles.length,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: boardRect.width, height: boardRect.height, bottom: boardRect.bottom },
      restoreVisible: visible(document.querySelector("#restoreGreenhouseBtn")),
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      scrollY,
      brokenImages: Array.from(document.images)
        .filter((image) => {
          const bounds = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return style.display !== "none"
            && style.visibility !== "hidden"
            && bounds.width > 0
            && bounds.height > 0
            && image.complete
            && image.naturalWidth === 0;
        })
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

function expectBoardIntegrity(state, config, label, boardVisible = true) {
  expect(state.tiles, `${label} tiles`).toBe(64);
  expect(state.rows, `${label} rows`).toBe(8);
  if (boardVisible) {
    expect(state.board.width, `${label} board width`).toBeCloseTo(config.mobile ? 378 : 600, 1);
    expect(state.board.height, `${label} board height`).toBeCloseTo(config.mobile ? 378 : 600, 1);
    expect(state.board.bottom, `${label} board remains in viewport`).toBeLessThanOrEqual(config.viewport.height);
  }
  expect(state.overflowX, `${label} no x overflow`).toBe(false);
  expect(state.overflowY, `${label} no y overflow`).toBe(false);
  expect(state.scrollY, `${label} no page scroll`).toBe(0);
  expect(state.brokenImages, `${label} images`).toEqual([]);
}

async function activateRelic(page, config) {
  const source = page.locator(".tile.black-candle-vine");
  const destination = page.locator(".tile.line-relic-destination");
  if (config.input === "tap") {
    await source.tap();
    await expect(source).toHaveClass(/\bsel\b/);
    await destination.tap();
  } else if (config.input === "keyboard") {
    await source.focus();
    await page.keyboard.press("Enter");
    await expect(source).toHaveClass(/\bsel\b/);
    await destination.focus();
    await page.keyboard.press("Space");
  } else {
    await source.click();
    await expect(source).toHaveClass(/\bsel\b/);
    await destination.click();
  }
}

test("the final First Bouquet move belongs to its armed Black Candle", async ({ browser }) => {
  for (const config of CONFIGS) {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
      reducedMotion: config.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "";
      if (errorText !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${errorText}`);
    });

    try {
      const label = `${config.label} armed last move`;
      await openState(page, config.label);
      const initialSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      const initial = await report(page);
      expectBoardIntegrity(initial, config, `${label} initial`);
      expect(initial.moves).toBe(1);
      expect(initial.counts).toEqual([0, 3, 0, 0, 0, 7]);
      expect(initial.shuffleVisible, `${label} hides destructive Shuffle`).toBe(false);
      expect(initial.shuffleDisabled, `${label} disables hidden Shuffle`).toBe(true);
      expect(initial.finalMoveClass, `${label} marks board authority`).toBe(true);
      expect(initial.enabledTiles, `${label} board stays playable`).toBe(64);
      expect(initial.sourceIds).toEqual(["tile-3-3"]);
      expect(initial.destinationIds).toHaveLength(1);
      expect(initial.activeId, `${label} source owns focus`).toBe("tile-3-3");
      expect(initial.rovingIds, `${label} source is sole roving tile`).toEqual(["tile-3-3"]);
      expect(initial.selected).toBe(0);

      for (let reload = 1; reload <= 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        const restored = await report(page);
        expectBoardIntegrity(restored, config, `${label} reload ${reload}`);
        expect(restored.moves).toBe(1);
        expect(restored.shuffleVisible).toBe(false);
        expect(restored.shuffleDisabled).toBe(true);
        expect(restored.sourceIds).toEqual(["tile-3-3"]);
        expect(restored.activeId).toBe("tile-3-3");
        expect(restored.rovingIds).toEqual(["tile-3-3"]);
        expect(restored.selected).toBe(0);
        expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY), `${label} reload save`)
          .toBe(initialSave);
      }

      await activateRelic(page, config);
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").moves === 0, SAVE_KEY);
      await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 12000 });
      const completed = await report(page);
      expectBoardIntegrity(completed, config, `${label} complete`, false);
      expect(completed.moves, `${label} activation spends final move once`).toBe(0);
      expect(completed.counts[1], `${label} Bone Star closes`).toBeGreaterThanOrEqual(6);
      expect(completed.counts[5], `${label} Thorn Rose closes`).toBeGreaterThanOrEqual(8);
      expect(completed.coins, `${label} reward paid once`).toBe(120);
      expect(completed.complete, `${label} bouquet completes`).toBe(true);
      expect(completed.armedLineRelic, `${label} relic consumed`).toBeNull();
      expect(completed.restoreVisible, `${label} restoration is sole payoff`).toBe(true);
      expect(completed.retryVisible, `${label} avoids Retry`).toBe(false);
      expect(completed.shuffleVisible, `${label} Shuffle stays retired`).toBe(false);

      const completedSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      const completedReload = await report(page);
      expect(completedReload.moves).toBe(0);
      expect(completedReload.coins).toBe(120);
      expect(completedReload.complete).toBe(true);
      expect(completedReload.restoreVisible).toBe(true);
      expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY), `${label} reward reload`)
        .toBe(completedSave);
      expect(errors, `${label} browser errors`).toEqual([]);
      expect(failedRequests, `${label} request failures`).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("exact-mobile Shuffle owns a complete 44px touch target", async ({ browser }) => {
  const touchPoints = [
    ["top-left", (box) => [box.x + 2, box.y + 2]],
    ["top", (box) => [box.x + box.width / 2, box.y + 2]],
    ["top-right", (box) => [box.x + box.width - 2, box.y + 2]],
    ["right", (box) => [box.x + box.width - 2, box.y + box.height / 2]],
    ["bottom-right", (box) => [box.x + box.width - 2, box.y + box.height - 2]],
    ["bottom", (box) => [box.x + box.width / 2, box.y + box.height - 2]],
    ["bottom-left", (box) => [box.x + 2, box.y + box.height - 2]],
    ["left", (box) => [box.x + 2, box.y + box.height / 2]]
  ];

  for (const reducedMotion of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: reducedMotion ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "";
      if (errorText !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${errorText}`);
    });

    const mode = reducedMotion ? "reduced" : "full";
    const label = `${mode} Round 1`;
    const saved = activeShuffleState();
    try {
      await page.addInitScript(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, state: saved });
      await page.goto(`${BASE_URL}?mobile-shuffle-touch=${mode}`, { waitUntil: "networkidle" });
      await expect(page.locator("#board .tile")).toHaveCount(64);
      await expect(page.locator("#shuffleBtn")).toBeVisible();
      await expect(page.locator("#shuffleBtn")).toBeEnabled();

      const geometry = await page.evaluate(() => {
        const rect = (node) => {
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
        const board = document.querySelector("#board");
        const shuffle = document.querySelector("#shuffleBtn");
        const tiles = Array.from(board.querySelectorAll(".tile"));
        return {
          board: rect(board),
          shuffle: rect(shuffle),
          tiles: tiles.length,
          rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
          scrollY,
          overflowX: document.documentElement.scrollWidth > innerWidth + 1,
          overflowY: document.documentElement.scrollHeight > innerHeight + 1,
          brokenImages: Array.from(document.images)
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.getAttribute("src"))
        };
      });
      expect(geometry.shuffle.width, `${label} Shuffle width`).toBeGreaterThanOrEqual(44);
      expect(geometry.shuffle.height, `${label} Shuffle height`).toBeGreaterThanOrEqual(44);
      expect(geometry.shuffle.left, `${label} left containment`).toBeGreaterThanOrEqual(1);
      expect(geometry.shuffle.right, `${label} right containment`).toBeLessThanOrEqual(389);
      expect(geometry.shuffle.top, `${label} clears altar`)
        .toBeGreaterThanOrEqual(geometry.board.bottom + 1);
      expect(geometry.shuffle.bottom, `${label} bottom containment`).toBeLessThanOrEqual(843);
      expect(geometry.board.width, `${label} altar width`).toBeCloseTo(378, 1);
      expect(geometry.board.height, `${label} altar height`).toBeCloseTo(378, 1);
      expect(geometry.tiles).toBe(64);
      expect(geometry.rows).toBe(8);
      expect(geometry.scrollY).toBe(0);
      expect(geometry.overflowX).toBe(false);
      expect(geometry.overflowY).toBe(false);
      expect(geometry.brokenImages).toEqual([]);

      for (const [pointLabel, pointFor] of touchPoints) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#shuffleBtn")).toBeEnabled();
        const box = await page.locator("#shuffleBtn").boundingBox();
        const [x, y] = pointFor(box);
        const owner = await page.evaluate(({ x, y }) => (
          document.elementFromPoint(x, y)?.closest("#shuffleBtn")?.id || ""
        ), { x, y });
        expect(owner, `${label} ${pointLabel} belongs to Shuffle`).toBe("shuffleBtn");
        await page.touchscreen.tap(x, y);
        await page.waitForFunction((key) => (
          JSON.parse(localStorage.getItem(key) || "{}").moves === 4
        ), SAVE_KEY);
        await page.waitForTimeout(250);
        const after = await report(page);
        expect(after.moves, `${label} ${pointLabel} spends exactly one move`).toBe(4);
        expect(after.selected, `${label} ${pointLabel} leaves no selection`).toBe(0);
        expect(after.tiles).toBe(64);
        expect(after.rows).toBe(8);
        expect(after.overflowX).toBe(false);
        expect(after.overflowY).toBe(false);
        expect(after.brokenImages).toEqual([]);
      }

      expect(errors, `${label} browser errors`).toEqual([]);
      expect(failedRequests, `${label} request failures`).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
