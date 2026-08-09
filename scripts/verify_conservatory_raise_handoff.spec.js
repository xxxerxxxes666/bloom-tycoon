const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CONFIGS = [
  { label: "desktop-enter-full", viewport: { width: 1280, height: 720 }, input: "Enter" },
  { label: "desktop-space-reduced", viewport: { width: 1280, height: 720 }, input: "Space", reduced: true },
  { label: "desktop-pointer-reduced", viewport: { width: 1280, height: 720 }, input: "pointer", reduced: true },
  { label: "mobile-enter-full", viewport: { width: 390, height: 844 }, input: "Enter", mobile: true },
  { label: "mobile-space-reduced", viewport: { width: 390, height: 844 }, input: "Space", mobile: true, reduced: true },
  { label: "mobile-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

test.setTimeout(180000);

function completedRoundThreeState() {
  return {
    focusedEconomyVersion: 2,
    currentRound: 3,
    moves: 1,
    counts: [13, 0, 0, 14, 0, 0],
    coins: 230,
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: true,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

async function activate(page, config, locator, point = null) {
  if (config.input === "pointer") {
    await page.mouse.click(point.x, point.y);
  } else if (config.input === "touch") {
    await page.touchscreen.tap(point.x, point.y);
  } else {
    await locator.focus();
    await page.keyboard.press(config.input);
  }
}

async function report(page) {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    return {
      save: localStorage.getItem(key),
      round: saved.currentRound,
      moves: saved.moves,
      counts: saved.counts,
      coins: saved.coins,
      complete: saved.roundComplete,
      restored: saved.roundOneRestored,
      upgraded: saved.roundTwoGreenhouseUpgraded,
      raised: saved.roundThreeConservatoryRaised,
      fresh: saved.freshConservatorySettlement,
      activeId: document.activeElement?.id || "",
      visibleActions: ["restoreGreenhouseBtn", "nextOrderBtn"]
        .filter((id) => visible(document.getElementById(id))),
      transaction: document.querySelector("#payoffTransaction")?.textContent?.trim() || "",
      payoffMode: document.querySelector("#roundOneRestoration")?.dataset.payoffMode || "",
      transfer: document.querySelector("#roundOneRestoration")?.dataset.bouquetTransfer || "",
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: board ? { width: board.width, height: board.height, bottom: board.bottom } : null,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

function expectGeometry(state, config, label, boardVisible = false) {
  expect(state.tiles, `${label} tiles`).toBe(64);
  expect(state.rows, `${label} rows`).toBe(8);
  if (boardVisible) {
    expect(state.board.width, `${label} board width`).toBeCloseTo(config.mobile ? 378 : 600, 1);
    expect(state.board.height, `${label} board height`).toBeCloseTo(config.mobile ? 378 : 600, 1);
    expect(state.board.bottom, `${label} board bottom`).toBeLessThanOrEqual(config.viewport.height);
  }
  expect(state.scrollY, `${label} scroll`).toBe(0);
  expect(state.overflowX, `${label} x overflow`).toBe(false);
  if (config.mobile) expect(state.overflowY, `${label} y overflow`).toBe(false);
  expect(state.brokenImages, `${label} images`).toEqual([]);
}

for (const config of CONFIGS) {
  test(`Conservatory raise input cannot carry into Play Again on ${config.label}`, async ({ browser }) => {
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
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
    });

    try {
      const marker = `conservatory-raise-handoff:${config.label}`;
      await page.addInitScript(({ key, fixtureMarker, state }) => {
        if (!sessionStorage.getItem(fixtureMarker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(fixtureMarker, "seeded");
        }
      }, { key: SAVE_KEY, fixtureMarker: marker, state: completedRoundThreeState() });
      await page.goto(`${BASE_URL}?conservatory-raise-handoff=${config.label}`, { waitUntil: "networkidle" });

      const raise = page.locator("#restoreGreenhouseBtn");
      await expect(raise).toBeVisible();
      await expect(raise).toBeEnabled();
      await expect(raise).toBeFocused();
      const box = await raise.boundingBox();
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await activate(page, config, raise, point);
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 3
          && saved.roundThreeConservatoryRaised === true
          && saved.freshConservatorySettlement === true
          && saved.coins === 50;
      }, SAVE_KEY);
      const raised = await report(page);
      expect(raised).toMatchObject({
        round: 3,
        moves: 1,
        counts: [13, 0, 0, 14, 0, 0],
        coins: 50,
        complete: true,
        restored: true,
        upgraded: true,
        raised: true,
        fresh: true
      });

      await page.waitForTimeout(60);
      const successor = page.locator("#nextOrderBtn");
      await activate(page, config, successor, point);
      await page.waitForTimeout(config.reduced ? 380 : 1900);
      const settled = await report(page);
      expect(settled.round, `${config.label} repeat does not start replay`).toBe(3);
      expect(settled.coins, `${config.label} spends once`).toBe(50);
      expect(settled.complete).toBe(true);
      expect(settled.raised).toBe(true);
      expect(settled.fresh, `${config.label} keeps first-settlement authority`).toBe(true);
      expect(settled.activeId, `${config.label} Play Again owns focus`).toBe("nextOrderBtn");
      expect(settled.visibleActions).toEqual(["nextOrderBtn"]);
      expect(settled.transaction).toBe("Raised for 180. 50 coins remain.");
      expect(settled.payoffMode).toBe("restoration");
      expect(settled.selected).toEqual([]);
      expect(settled.rovingIds, `${config.label} hidden board has no roving stop`).toEqual([]);
      expectGeometry(settled, config, `${config.label} settled`);

      const settledSave = settled.save;
      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await report(page);
      expect(reloaded.save, `${config.label} reload preserves first settlement`).toBe(settledSave);
      expect(reloaded.round).toBe(3);
      expect(reloaded.coins).toBe(50);
      expect(reloaded.fresh).toBe(true);
      expect(reloaded.activeId).toBe("nextOrderBtn");
      expect(reloaded.transaction).toBe("Raised for 180. 50 coins remain.");
      expectGeometry(reloaded, config, `${config.label} reloaded`);

      await activate(page, config, page.locator("#nextOrderBtn"), point);
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 1 && saved.roundComplete === false && saved.moves === 6;
      }, SAVE_KEY);
      await page.waitForTimeout(120);
      const replay = await report(page);
      expect(replay).toMatchObject({
        round: 1,
        moves: 6,
        counts: [0, 0, 0, 0, 0, 0],
        coins: 50,
        complete: false,
        restored: true,
        upgraded: true,
        raised: true,
        fresh: false,
        selected: [],
        tiles: 64,
        rows: 8
      });
      expect(replay.rovingIds).toHaveLength(1);
      expect(replay.activeId).toBe(replay.rovingIds[0]);
      expectGeometry(replay, config, `${config.label} replay`, true);
      expect(errors, `${config.label} console`).toEqual([]);
      expect(failedRequests, `${config.label} requests`).toEqual([]);

      if (["desktop-space-reduced", "mobile-space-reduced"].includes(config.label)) {
        await page.screenshot({
          path: `work/conservatory-raise-handoff-${config.label}.png`,
          fullPage: false
        });
      }
    } finally {
      await context.close();
    }
  });
}
