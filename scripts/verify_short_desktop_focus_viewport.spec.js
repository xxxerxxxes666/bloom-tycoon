const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CONFIGS = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

const FIXTURES = [
  { label: "active-r1", round: 1, naturalOpening: true },
  { label: "active-r2", round: 2, counts: [0, 0, 3, 0, 0, 3], moves: 8 },
  { label: "active-r3", round: 3, counts: [3, 0, 0, 3, 0, 0], moves: 7 },
  { label: "owned-replay-r1", round: 1, ownedReplay: true }
];

test.setTimeout(180000);

async function openFresh(page, marker) {
  await page.goto(`${BASE_URL}?short-desktop-focus=${marker}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
}

async function openFixture(page, fixture, marker) {
  await openFresh(page, marker);
  if (fixture.naturalOpening) {
    const pair = page.locator("#board .tile.idle-hint");
    await expect(pair).toHaveCount(2, { timeout: 12000 });
    const ids = await pair.evaluateAll((tiles) => tiles.map((tile) => tile.id));
    await page.locator(`#${ids[0]}`).click();
    await page.locator(`#${ids[1]}`).click();
    await page.waitForFunction((key) => {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      return saved.moves === 5 && saved.hasMadeValidMove === true;
    }, SAVE_KEY);
    await page.waitForTimeout(700);
    return;
  }

  await page.evaluate(({ key, fixture }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(state, fixture.ownedReplay ? {
      currentRound: 3,
      roundComplete: true,
      moves: 0,
      coins: 50,
      counts: [13, 0, 0, 14, 0, 0],
      cursedThorns: [],
      clearedCursedThorns: 0,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 2,
      tutorialSkipped: true,
      tutorialActive: true,
      blackCandleLessonComplete: true
    } : {
      currentRound: fixture.round,
      roundComplete: false,
      moves: fixture.moves,
      coins: fixture.round === 2 ? 20 : 50,
      counts: fixture.counts,
      cursedThorns: [],
      clearedCursedThorns: fixture.round === 2 ? 3 : 0,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: fixture.round === 3,
      roundThreeConservatoryRaised: false,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 2,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, fixture });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);

  if (fixture.ownedReplay) {
    await expect(page.locator("#nextOrderBtn")).toBeVisible();
    await page.locator("#nextOrderBtn").click();
    await expect(page.locator("body")).toHaveClass(/owned-replay-entry/);
    await expect(page.locator("#board .tile")).toHaveCount(64);
  }
}

async function openSkippedRoundOneBlackCandleCue(page, marker) {
  await openFresh(page, marker);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(state, {
      currentRound: 1,
      roundComplete: false,
      moves: 4,
      counts: [0, 0, 0, 0, 0, 6],
      cursedThorns: [],
      clearedCursedThorns: 0,
      roundOneRestored: false,
      roundTwoGreenhouseUpgraded: false,
      roundThreeConservatoryRaised: false,
      hasMadeValidMove: true,
      restoredRoundTwoGuideMoves: 0,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("body")).toHaveClass(/round-one-black-candle-cue/);
  await expect(page.locator("#firstSwapCue")).toContainText("Make 4 Bone Stars");
  await expect(page.locator("#shuffleBtn")).toBeVisible();
  await expect(page.locator("#shuffleBtn")).toBeEnabled();
}

async function viewportReport(page) {
  return page.evaluate(() => {
    const rect = (node) => {
      const bounds = node.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height
      };
    };
    const board = document.querySelector("#board");
    const boardRect = rect(board);
    const boardFrameStyle = getComputedStyle(board, "::before");
    const frameOutset = Math.max(0, -Number.parseFloat(boardFrameStyle.left || "0"));
    const tiles = Array.from(board.querySelectorAll(".tile"));
    const visibleBrokenImages = Array.from(document.images).filter((image) => {
      const bounds = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && bounds.width > 0
        && bounds.height > 0
        && image.complete
        && image.naturalWidth === 0;
    });
    return {
      scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: { width: innerWidth, height: innerHeight },
      game: rect(document.querySelector(".game")),
      sigil: rect(document.querySelector(".sigil")),
      title: rect(document.querySelector(".title")),
      board: boardRect,
      cue: rect(document.querySelector("#firstSwapCue")),
      shuffle: rect(document.querySelector("#shuffleBtn")),
      shuffleVisible: getComputedStyle(document.querySelector("#shuffleBtn")).display !== "none",
      activeOrders: rect(document.querySelector(".active-orders-card")),
      boardFrame: {
        left: boardRect.left - frameOutset,
        right: boardRect.right + frameOutset,
        top: boardRect.top - frameOutset,
        bottom: boardRect.bottom + frameOutset
      },
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      activeId: document.activeElement?.id || "",
      activeRow: document.activeElement?.classList.contains("tile")
        ? Number(document.activeElement.dataset.y)
        : null,
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).length,
      brokenImages: visibleBrokenImages.map((image) => image.getAttribute("src"))
    };
  });
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function expectIntegrity(report, config, label) {
  expect(report.tiles, `${label} tile integrity`).toBe(64);
  expect(report.rows, `${label} complete board rows`).toBe(8);
  expect(report.rovingIds, `${label} one roving tile`).toHaveLength(1);
  expect(report.selected, `${label} no selection`).toBe(0);
  expect(report.brokenImages, `${label} images`).toEqual([]);
  expect(report.scrollWidth, `${label} no horizontal overflow`).toBeLessThanOrEqual(report.viewport.width);
  expect(report.sigil.top, `${label} sigil top`).toBeGreaterThanOrEqual(0);
  expect(report.sigil.bottom, `${label} sigil bottom`).toBeLessThanOrEqual(report.viewport.height);
  expect(report.boardFrame.left, `${label} altar frame left`).toBeGreaterThanOrEqual(0);
  expect(report.boardFrame.right, `${label} altar frame right`).toBeLessThanOrEqual(report.viewport.width);
  expect(report.boardFrame.top, `${label} altar frame top`).toBeGreaterThanOrEqual(0);
  expect(report.boardFrame.bottom, `${label} altar frame bottom`).toBeLessThanOrEqual(report.viewport.height);
  if (config.mobile) {
    expect(report.board.width, `${label} exact-mobile altar width`).toBe(378);
    expect(report.board.height, `${label} exact-mobile altar height`).toBe(378);
    expect(report.scrollHeight, `${label} no exact-mobile vertical overflow`)
      .toBeLessThanOrEqual(report.viewport.height);
  } else {
    expect(report.board.width, `${label} short-desktop altar width`).toBe(600);
    expect(report.board.height, `${label} short-desktop altar height`).toBe(600);
    expect(report.scrollHeight, `${label} no short-desktop vertical overflow`)
      .toBeLessThanOrEqual(report.viewport.height);
    expect(report.game.top, `${label} outer frame top`).toBeGreaterThanOrEqual(0);
    expect(report.game.bottom, `${label} outer frame bottom`).toBeLessThanOrEqual(report.viewport.height);
  }
}

async function exerciseDesktopKeyboardRows(page, config, label) {
  const start = await viewportReport(page);
  await page.locator(`#${start.rovingIds[0]}`).focus();
  for (let step = 0; step < 7; step += 1) {
    await page.keyboard.press("ArrowDown");
    const report = await viewportReport(page);
    expect(report.scrollY, `${label} down step ${step + 1} keeps document fixed`).toBe(0);
    expect(report.activeId, `${label} down step ${step + 1} focus/roving agreement`)
      .toBe(report.rovingIds[0]);
  }
  const bottom = await viewportReport(page);
  expect(bottom.activeRow, `${label} reaches bottom row`).toBe(7);
  expectIntegrity(bottom, config, `${label} bottom row`);

  for (let step = 0; step < 7; step += 1) {
    await page.keyboard.press("ArrowUp");
    expect((await viewportReport(page)).scrollY, `${label} up step ${step + 1} keeps document fixed`).toBe(0);
  }
  const returned = await viewportReport(page);
  expect(returned.activeRow, `${label} returns to top row`).toBe(0);
  expect(returned.activeId, `${label} returned focus/roving agreement`).toBe(returned.rovingIds[0]);
}

async function exerciseMobileTouch(page, config, label) {
  const initial = await viewportReport(page);
  const tile = page.locator(`#${initial.rovingIds[0]}`);
  await tile.tap();
  await expect(tile).toHaveClass(/sel/);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#board .tile.sel")).toHaveCount(0);
  expectIntegrity(await viewportReport(page), config, `${label} touch`);
}

for (const config of CONFIGS) {
  test(`short viewport keeps the full altar fixed on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
      reducedMotion: config.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "";
      if (errorText !== "net::ERR_ABORTED") {
        failedRequests.push(`${request.url()} ${errorText}`);
      }
    });

    try {
      for (const fixture of FIXTURES) {
        const label = `${config.label} ${fixture.label}`;
        await openFixture(page, fixture, `${config.label}-${fixture.label}`);
        const savedBefore = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
        const initial = await viewportReport(page);
        expectIntegrity(initial, config, `${label} initial`);
        if (config.mobile) {
          await exerciseMobileTouch(page, config, label);
        } else {
          await exerciseDesktopKeyboardRows(page, config, label);
        }
        expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
          `${label} navigation does not mutate the save`).toBe(savedBefore);
      }
      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const config of CONFIGS) {
  test(`skipped Round 1 commands stay inside the short viewport on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
      reducedMotion: config.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "";
      if (errorText !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${errorText}`);
    });

    try {
      await openSkippedRoundOneBlackCandleCue(page, `commands-${config.label}`);
      const label = `${config.label} skipped Round 1 commands`;
      const before = await viewportReport(page);
      expectIntegrity(before, config, label);
      expect(before.title.top, `${label} title top`).toBeGreaterThanOrEqual(0);
      expect(before.title.bottom, `${label} title bottom`).toBeLessThanOrEqual(before.viewport.height);
      expect(intersects(before.title, before.cue), `${label} cue clears title`).toBe(false);
      expect(before.shuffleVisible, `${label} Shuffle visible`).toBe(true);
      expect(before.shuffle.left, `${label} Shuffle left`).toBeGreaterThanOrEqual(0);
      expect(before.shuffle.right, `${label} Shuffle right`).toBeLessThanOrEqual(before.viewport.width);
      expect(before.shuffle.top, `${label} Shuffle top`).toBeGreaterThanOrEqual(0);
      expect(before.shuffle.bottom, `${label} Shuffle bottom`).toBeLessThanOrEqual(before.viewport.height);
      expect(intersects(before.shuffle, before.board), `${label} Shuffle clears altar`).toBe(false);
      expect(intersects(before.shuffle, before.activeOrders), `${label} Shuffle clears orders`).toBe(false);

      await page.locator("#shuffleBtn").focus();
      await page.keyboard.press(config.reduced ? "Space" : "Enter");
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").moves === 3, SAVE_KEY);
      await expect(page.locator("#board .tile")).toHaveCount(64);
      await expect(page.locator("#shuffleBtn")).toBeVisible();
      const after = await viewportReport(page);
      expectIntegrity(after, config, `${label} after keyboard Shuffle`);
      expect(after.title.top, `${label} post-Shuffle title top`).toBeGreaterThanOrEqual(0);
      expect(after.shuffle.bottom, `${label} post-Shuffle bottom`).toBeLessThanOrEqual(after.viewport.height);
      expect(after.activeId, `${label} post-Shuffle focus remains visible`).not.toBe("");
      expect(after.activeId, `${label} post-Shuffle focus avoids BODY`).not.toBe("BODY");
      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
