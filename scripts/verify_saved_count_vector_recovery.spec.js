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

const PROFILES = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

const CASES = [
  {
    label: "short-first-bouquet",
    round: 1,
    moves: 4,
    coins: 0,
    counts: [0, 4, 0],
    expectedCounts: [0, 4, 0, 0, 0, 0],
    expectedText: ["0/8", "4/6"]
  },
  {
    label: "long-moonlit-wreath",
    round: 2,
    moves: 4,
    coins: 20,
    counts: [0, 0, 7, 0, 5, 3, 999],
    expectedCounts: [0, 0, 7, 0, 5, 3],
    expectedText: ["7/10", "5/9", "3/7", "0/3"]
  },
  {
    label: "short-bloodroot-compact",
    round: 3,
    moves: 5,
    coins: 50,
    counts: [7, 0, 0, 9],
    expectedCounts: [7, 0, 0, 9, 0, 0],
    expectedText: ["9/14", "7/13"]
  },
  {
    label: "boolean-moonlit-progress",
    round: 2,
    moves: 9,
    coins: 20,
    counts: [false, true, false, false, false, false],
    clearedCursedThorns: true,
    expectedCounts: [0, 0, 0, 0, 0, 0],
    expectedClearedCursedThorns: 0,
    expectedThornCount: 3,
    expectedText: ["0/10", "0/9", "0/7", "0/3"]
  }
];

test.setTimeout(90000);

function savedState(testCase) {
  return {
    focusedEconomyVersion: 3,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: testCase.moves,
    coins: testCase.coins,
    counts: testCase.counts,
    cursedThorns: testCase.round === 2
      ? [0, 1, 2].map((x) => ({ x, y: 1, hp: 1 }))
      : [],
    clearedCursedThorns: testCase.clearedCursedThorns ?? 0,
    currentRound: testCase.round,
    roundComplete: false,
    roundOneRestored: testCase.round > 1,
    roundTwoGreenhouseUpgraded: testCase.round > 2,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

function watchErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "";
    if (failure !== "net::ERR_ABORTED") errors.push(`${request.url()} ${failure}`);
  });
  return errors;
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      serialized: localStorage.getItem(key),
      state: JSON.parse(localStorage.getItem(key) || "{}"),
      ritual: document.querySelector("#ritualLog")?.innerText || "",
      visibleText: document.body.innerText,
      tiles: tiles.length,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

for (const profile of PROFILES) {
  test(`malformed saved flower progress is preserved on ${profile.label}`, async ({ browser }) => {
    for (const testCase of CASES) {
      const context = await browser.newContext({
        viewport: profile.viewport,
        hasTouch: Boolean(profile.mobile),
        isMobile: Boolean(profile.mobile)
      });
      const page = await context.newPage();
      const errors = watchErrors(page);
      await page.addInitScript(({ key, value, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(value));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        value: savedState(testCase),
        marker: `saved-count-vector-${profile.label}-${testCase.label}`
      });
      await page.goto(`${BASE_URL}?saved-count-vector=${profile.label}-${testCase.label}`, {
        waitUntil: "networkidle"
      });

      const repaired = await report(page);
      expect(repaired.state.counts, testCase.label).toEqual(testCase.expectedCounts);
      expect(repaired.state.clearedCursedThorns, testCase.label)
        .toBe(testCase.expectedClearedCursedThorns ?? 0);
      expect(repaired.state.cursedThorns, testCase.label)
        .toHaveLength(testCase.expectedThornCount ?? (testCase.round === 2 ? 3 : 0));
      expect(repaired.ritual, testCase.label).toContain("Saved bouquet repaired");
      expect(repaired.ritual, testCase.label).toContain("Valid flower progress was kept");
      for (const text of testCase.expectedText) {
        expect(repaired.visibleText, `${testCase.label} retains ${text}`).toContain(text);
      }
      expect(repaired.state.roundComplete, testCase.label).toBe(false);
      expect(repaired.state.moves, testCase.label).toBe(testCase.moves);
      expect(repaired.state.coins, testCase.label).toBe(testCase.coins);
      expect(repaired.tiles, testCase.label).toBe(64);
      expect(repaired.enabledTiles, testCase.label).toBe(64);
      expect(repaired.rows, testCase.label).toBe(8);
      expect(repaired.boardWidth, testCase.label).toBeCloseTo(profile.mobile ? 378 : 600, 0);
      expect(repaired.boardHeight, testCase.label).toBeCloseTo(profile.mobile ? 378 : 600, 0);
      expect(repaired.overflowX, testCase.label).toBe(false);
      expect(repaired.overflowY, testCase.label).toBe(false);
      expect(repaired.brokenImages, testCase.label).toEqual([]);
      await page.screenshot({
        path: `work/saved-count-vector-${profile.label}-${testCase.label}.png`,
        fullPage: true
      });

      await page.reload({ waitUntil: "networkidle" });
      const reloaded = await report(page);
      expect(reloaded.serialized, `${testCase.label} repair is byte-stable`).toBe(repaired.serialized);
      expect(reloaded.state.counts, testCase.label).toEqual(testCase.expectedCounts);
      expect(reloaded.state.clearedCursedThorns, testCase.label)
        .toBe(testCase.expectedClearedCursedThorns ?? 0);
      expect(reloaded.state.cursedThorns, testCase.label)
        .toHaveLength(testCase.expectedThornCount ?? (testCase.round === 2 ? 3 : 0));
      expect(reloaded.ritual, testCase.label).not.toContain("Saved bouquet repaired");
      expect(reloaded.tiles, testCase.label).toBe(64);
      expect(reloaded.enabledTiles, testCase.label).toBe(64);
      expect(reloaded.rows, testCase.label).toBe(8);
      expect(reloaded.overflowX, testCase.label).toBe(false);
      expect(reloaded.overflowY, testCase.label).toBe(false);
      expect(reloaded.brokenImages, testCase.label).toEqual([]);
      expect(errors, testCase.label).toEqual([]);
      await context.close();
    }
  });
}
