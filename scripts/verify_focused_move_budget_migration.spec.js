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

const ROUND_CASES = [
  {
    round: 1,
    budget: 6,
    surplus: 13,
    coins: 0,
    counts: [0, 3, 0, 0, 0, 3]
  },
  {
    round: 2,
    budget: 9,
    surplus: 17,
    coins: 20,
    counts: [0, 0, 4, 0, 3, 2],
    clearedCursedThorns: 1,
    roundOneRestored: true,
    restoredRoundTwoGuideMoves: 1
  },
  {
    round: 3,
    budget: 8,
    surplus: 22,
    coins: 50,
    counts: [3, 0, 0, 4, 0, 0],
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true
  }
];

const PROFILES = [
  { label: "desktop-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile390-full", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

test.setTimeout(120000);

function savedState(fixture, moves = fixture.surplus) {
  return {
    focusedEconomyVersion: 2,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves,
    coins: fixture.coins,
    counts: [...fixture.counts],
    cursedThorns: [],
    clearedCursedThorns: fixture.clearedCursedThorns || 0,
    currentRound: fixture.round,
    roundComplete: false,
    roundOneRestored: Boolean(fixture.roundOneRestored),
    roundTwoGreenhouseUpgraded: Boolean(fixture.roundTwoGreenhouseUpgraded),
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: fixture.restoredRoundTwoGuideMoves || 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll(".tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      stored,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      brokenImages: [...document.images]
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      scrollY
    };
  }, SAVE_KEY);
}

function expectPreservedState(stored, expected, label) {
  expect(stored.board, `${label} board`).toEqual(expected.board);
  expect(stored.counts, `${label} counts`).toEqual(expected.counts);
  expect(stored.coins, `${label} coins`).toBe(expected.coins);
  expect(stored.currentRound, `${label} round`).toBe(expected.currentRound);
  expect(stored.roundComplete, `${label} completion`).toBe(false);
  expect(stored.roundOneRestored, `${label} first ownership`).toBe(expected.roundOneRestored);
  expect(stored.roundTwoGreenhouseUpgraded, `${label} second ownership`)
    .toBe(expected.roundTwoGreenhouseUpgraded);
  expect(stored.roundThreeConservatoryRaised, `${label} third ownership`).toBe(false);
  expect(stored.tutorialSkipped, `${label} tutorial state`).toBe(true);
  expect(stored.blackCandleLessonComplete, `${label} lesson state`).toBe(true);
  expect(stored.armedLineRelic, `${label} relic state`).toBeNull();
}

for (const profile of PROFILES) {
  test(`focused move budgets normalize surplus saves on ${profile.label}`, async ({ browser }) => {
    for (const fixture of ROUND_CASES) {
      const context = await browser.newContext({
        viewport: profile.viewport,
        hasTouch: Boolean(profile.mobile),
        isMobile: Boolean(profile.mobile)
      });
      const page = await context.newPage();
      const browserErrors = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));
      if (profile.reduced) {
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      const expected = savedState(fixture);
      const marker = `focused-moves-${profile.label}-r${fixture.round}`;
      await page.addInitScript(({ key, state, markerKey }) => {
        if (!sessionStorage.getItem(markerKey)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(markerKey, "1");
        }
      }, { key: SAVE_KEY, state: expected, markerKey: marker });

      await page.goto(`${BASE_URL}?focused-moves=${profile.label}-r${fixture.round}`, {
        waitUntil: "networkidle"
      });
      for (let reload = 0; reload < 3; reload += 1) {
        if (reload) await page.reload({ waitUntil: "networkidle" });
        const current = await report(page);
        expect(current.stored.moves, `${profile.label} R${fixture.round} reload ${reload} budget`)
          .toBe(fixture.budget);
        expectPreservedState(current.stored, expected, `${profile.label} R${fixture.round} reload ${reload}`);
        expect(current.tiles).toBe(64);
        expect(current.rows).toBe(8);
        expect(current.enabledTiles).toBe(64);
        expect(current.roving).toHaveLength(1);
        if (current.active.startsWith("tile-")) {
          expect(current.roving).toEqual([current.active]);
        }
        expect(current.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
        expect(current.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
        expect(current.overflowX).toBe(false);
        expect(current.overflowY).toBe(false);
        expect(current.brokenImages).toEqual([]);
        if (profile.mobile) expect(current.scrollY).toBe(0);
      }

      const validMoves = fixture.budget - 1;
      await page.evaluate(({ key, moves }) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        state.moves = moves;
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, moves: validMoves });
      await page.reload({ waitUntil: "networkidle" });
      expect((await report(page)).stored.moves, `${profile.label} R${fixture.round} valid moves`)
        .toBe(validMoves);
      expect(browserErrors).toEqual([]);
      await context.close();
    }
  });
}
