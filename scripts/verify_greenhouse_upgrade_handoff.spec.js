const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CONFIGS = [
  { label: "desktop-enter", viewport: { width: 1280, height: 720 }, input: "Enter" },
  { label: "desktop-space-reduced", viewport: { width: 1280, height: 720 }, input: "Space", reduced: true },
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile-enter", viewport: { width: 390, height: 844 }, input: "Enter", mobile: true },
  { label: "mobile-space-reduced", viewport: { width: 390, height: 844 }, input: "Space", mobile: true, reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true }
];

test.setTimeout(180000);

function completedRoundTwoState() {
  return {
    focusedEconomyVersion: 2,
    currentRound: 2,
    moves: 1,
    counts: [0, 0, 10, 0, 9, 7],
    coins: 170,
    cursedThorns: [],
    clearedCursedThorns: 3,
    roundComplete: true,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
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
      activeId: document.activeElement?.id || "",
      visibleActions: ["restoreGreenhouseBtn", "nextOrderBtn"]
        .filter((id) => visible(document.getElementById(id))),
      awakening: document.querySelector("#roundOneRestoration")?.classList.contains("restoration-awakening"),
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
  test(`Moonlit upgrade input cannot carry into Next Order on ${config.label}`, async ({ browser }) => {
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
      const marker = `greenhouse-upgrade-handoff:${config.label}`;
      await page.addInitScript(({ key, fixtureMarker, state }) => {
        if (!sessionStorage.getItem(fixtureMarker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(fixtureMarker, "seeded");
        }
      }, { key: SAVE_KEY, fixtureMarker: marker, state: completedRoundTwoState() });
      await page.goto(`${BASE_URL}?greenhouse-upgrade-handoff=${config.label}`, { waitUntil: "networkidle" });

      const upgrade = page.locator("#restoreGreenhouseBtn");
      await expect(upgrade).toBeVisible();
      await expect(upgrade).toBeEnabled();
      await expect(upgrade).toBeFocused();
      const box = await upgrade.boundingBox();
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await activate(page, config, upgrade, point);
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 2 && saved.roundTwoGreenhouseUpgraded === true && saved.coins === 50;
      }, SAVE_KEY);
      const upgraded = await report(page);
      expect(upgraded).toMatchObject({
        round: 2,
        moves: 1,
        counts: [0, 0, 10, 0, 9, 7],
        coins: 50,
        complete: true,
        restored: true,
        upgraded: true,
        raised: false,
        activeId: "nextOrderBtn",
        visibleActions: ["nextOrderBtn"]
      });
      expect(upgraded.awakening, `${config.label} awakening starts`).toBe(true);

      await page.waitForTimeout(60);
      await activate(page, config, page.locator("#nextOrderBtn"), point);
      await page.waitForTimeout(380);
      const guarded = await report(page);
      expect(guarded.round, `${config.label} repeat does not enter Round 3`).toBe(2);
      expect(guarded.save, `${config.label} repeat preserves settled spend`).toBe(upgraded.save);
      expect(guarded.coins, `${config.label} spends once`).toBe(50);
      expect(guarded.upgraded).toBe(true);
      expect(guarded.complete).toBe(true);
      expect(guarded.activeId, `${config.label} Next Order retains focus`).toBe("nextOrderBtn");
      expect(guarded.visibleActions).toEqual(["nextOrderBtn"]);
      expect(guarded.selected).toEqual([]);
      expect(guarded.rovingIds, `${config.label} hidden board has no roving stop`).toEqual([]);
      expectGeometry(guarded, config, `${config.label} guarded`);

      await page.waitForTimeout(100);
      await activate(page, config, page.locator("#nextOrderBtn"), point);
      await page.waitForFunction((key) => {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return saved.currentRound === 3 && saved.roundComplete === false && saved.moves === 8;
      }, SAVE_KEY);
      await page.waitForTimeout(120);
      const entered = await report(page);
      expect(entered).toMatchObject({
        round: 3,
        moves: 8,
        counts: [0, 0, 0, 0, 0, 0],
        coins: 50,
        complete: false,
        restored: true,
        upgraded: true,
        raised: false,
        selected: [],
        tiles: 64,
        rows: 8
      });
      expect(entered.rovingIds).toHaveLength(1);
      expect(entered.activeId).toBe(entered.rovingIds[0]);
      expectGeometry(entered, config, `${config.label} entered`, true);
      expect(errors, `${config.label} console`).toEqual([]);
      expect(failedRequests, `${config.label} requests`).toEqual([]);

      if (["desktop-enter", "mobile-enter"].includes(config.label)) {
        await page.screenshot({
          path: `work/greenhouse-upgrade-handoff-${config.label}.png`,
          fullPage: false
        });
      }
    } finally {
      await context.close();
    }
  });
}
