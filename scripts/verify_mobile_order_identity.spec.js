const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const FIXTURE_BOARD = [
  [3, 0, 5, 0, 5, 2, 3, 0],
  [2, 0, 3, 5, 4, 4, 0, 2],
  [4, 2, 0, 0, 2, 3, 4, 0],
  [0, 2, 0, 3, 3, 0, 4, 2],
  [0, 4, 2, 4, 0, 2, 3, 3],
  [2, 3, 4, 3, 3, 4, 0, 4],
  [3, 4, 2, 2, 0, 2, 4, 3],
  [4, 2, 2, 4, 3, 3, 0, 3]
];

const ORDERS = [
  { round: 1, name: "First Bouquet", moves: 6 },
  { round: 2, name: "Moonlit Wreath", moves: 9 },
  { round: 3, name: "Bloodroot Compact", moves: 8 }
];

const PROFILES = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

function activeState(order) {
  return {
    focusedEconomyVersion: 3,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: order.moves,
    coins: order.round === 1 ? 0 : order.round === 2 ? 20 : 50,
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: order.round,
    roundComplete: false,
    roundOneRestored: order.round > 1,
    roundTwoGreenhouseUpgraded: order.round > 2,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: order.round === 2 ? 1 : 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

for (const profile of PROFILES) {
  test(`active orders keep their bouquet identity on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const browserErrors = [];
    const requestErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") requestErrors.push(`${request.url()} ${failure}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) requestErrors.push(`${response.status()} ${response.url()}`);
    });

    try {
      for (const order of ORDERS) {
        await page.goto(`${BASE_URL}?mobile-order-identity=${profile.label}-r${order.round}`, {
          waitUntil: "networkidle"
        });
        await page.evaluate(({ key, state }) => {
          localStorage.setItem(key, JSON.stringify(state));
        }, { key: SAVE_KEY, state: activeState(order) });
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile:not([disabled])")).toHaveCount(64);

        const report = await page.evaluate(() => {
          const objectiveText = document.querySelector("#objective .objective-text");
          const moves = document.querySelector("#objective .moves-counter");
          const objective = document.querySelector("#objective");
          const board = document.querySelector("#board");
          const tiles = [...document.querySelectorAll(".tile")];
          const textRect = objectiveText.getBoundingClientRect();
          const movesRect = moves.getBoundingClientRect();
          const objectiveRect = objective.getBoundingClientRect();
          const boardRect = board.getBoundingClientRect();
          return {
            heading: objectiveText.innerText.trim(),
            textFits: objectiveText.scrollWidth <= objectiveText.clientWidth + 0.5,
            headingMovesOverlap: textRect.right > movesRect.left && textRect.left < movesRect.right
              && textRect.bottom > movesRect.top && textRect.top < movesRect.bottom,
            objectiveInsideViewport: objectiveRect.left >= 0
              && objectiveRect.right <= innerWidth
              && objectiveRect.top >= 0
              && objectiveRect.bottom <= innerHeight,
            boardWidth: boardRect.width,
            boardHeight: boardRect.height,
            boardBottom: boardRect.bottom,
            tiles: tiles.length,
            rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
            overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            brokenImages: [...document.images]
              .filter((image) => image.offsetParent && (!image.complete || image.naturalWidth === 0))
              .map((image) => image.currentSrc || image.src)
          };
        });

        expect(report.heading).toBe(`Round ${order.round} · ${order.name}`.toUpperCase());
        expect(report.heading).not.toMatch(/Goals|Collect/i);
        expect(report.textFits).toBe(true);
        expect(report.headingMovesOverlap).toBe(false);
        expect(report.objectiveInsideViewport).toBe(true);
        expect(report.tiles).toBe(64);
        expect(report.rows).toBe(8);
        expect(report.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
        expect(report.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
        expect(report.boardBottom).toBeLessThanOrEqual(profile.viewport.height);
        expect(report.overflowX).toBe(false);
        expect(report.brokenImages).toEqual([]);
      }
      expect(browserErrors).toEqual([]);
      expect(requestErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
