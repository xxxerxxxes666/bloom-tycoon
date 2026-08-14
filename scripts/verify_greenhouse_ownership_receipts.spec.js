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
    label: "premature-round-one-restoration",
    state: {
      currentRound: 1,
      moves: 6,
      roundOneRestored: true
    },
    expected: {
      coins: 0,
      flags: [false, false, false],
      stage: "withered",
      orderCopy: ["Exact reward", "Then restore", "Restore Greenhouse"],
      rejectedCopy: ["Replay reward", "Conservatory stays owned"]
    }
  },
  {
    label: "premature-round-two-upgrade",
    state: {
      currentRound: 2,
      moves: 9,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      cursedThorns: [0, 1, 2].map((x) => ({ x, y: 1, hp: 1 }))
    },
    expected: {
      coins: 20,
      flags: [true, false, false],
      stage: "restored",
      orderCopy: ["Exact reward", "Then upgrade", "Upgrade Greenhouse"],
      rejectedCopy: ["Replay reward", "Conservatory stays owned"]
    }
  },
  {
    label: "fully-owned-round-one-replay",
    state: {
      currentRound: 1,
      moves: 6,
      coins: 777,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true
    },
    expected: {
      coins: 777,
      flags: [true, true, true],
      stage: "bloodroot",
      orderCopy: ["Replay reward", "Conservatory stays owned"],
      rejectedCopy: ["Then restore", "Restore Greenhouse"]
    }
  }
];

test.setTimeout(120000);

function savedState(overrides = {}) {
  return {
    focusedEconomyVersion: 3,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 6,
    coins: 999,
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: 1,
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: false,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true,
    ...overrides
  };
}

async function readPage(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      serialized: localStorage.getItem(key),
      state,
      stage: document.body.dataset.activeGreenhouseStage || "",
      order: document.querySelector("#activeOrders")?.innerText || "",
      ritual: document.querySelector("#ritualLog")?.innerText || "",
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      brokenImages: [...document.images]
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src)
    };
  }, SAVE_KEY);
}

for (const profile of PROFILES) {
  test(`greenhouse ownership requires earned receipts on ${profile.label}`, async ({ browser }) => {
    for (const testCase of CASES) {
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
      const state = savedState(testCase.state);
      await page.addInitScript(({ key, value, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(value));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        value: state,
        marker: `ownership-receipt-${profile.label}-${testCase.label}`
      });
      await page.goto(`${BASE_URL}?ownership-receipt=${profile.label}-${testCase.label}`, {
        waitUntil: "networkidle"
      });
      await expect(page.locator("#board .tile")).toHaveCount(64);

      const first = await readPage(page);
      expect(first.state.coins, testCase.label).toBe(testCase.expected.coins);
      expect([
        first.state.roundOneRestored,
        first.state.roundTwoGreenhouseUpgraded,
        first.state.roundThreeConservatoryRaised
      ], testCase.label).toEqual(testCase.expected.flags);
      expect(first.stage, testCase.label).toBe(testCase.expected.stage);
      for (const copy of testCase.expected.orderCopy) {
        expect(first.order.toLowerCase(), `${testCase.label} shows ${copy}`).toContain(copy.toLowerCase());
      }
      for (const copy of testCase.expected.rejectedCopy) {
        expect(first.order.toLowerCase(), `${testCase.label} hides ${copy}`).not.toContain(copy.toLowerCase());
      }
      if (!testCase.expected.flags.every(Boolean)) {
        expect(first.ritual, testCase.label).toContain("Saved greenhouse repaired");
      }
      expect(first.tiles, testCase.label).toBe(64);
      expect(first.rows, testCase.label).toBe(8);
      expect(first.enabledTiles, testCase.label).toBe(64);
      expect(first.boardWidth, testCase.label).toBeCloseTo(profile.mobile ? 378 : 600, 1);
      expect(first.boardHeight, testCase.label).toBeCloseTo(profile.mobile ? 378 : 600, 1);
      expect(first.overflowX, testCase.label).toBe(false);
      expect(first.overflowY, testCase.label).toBe(false);
      expect(first.brokenImages, testCase.label).toEqual([]);

      await page.reload({ waitUntil: "networkidle" });
      const second = await readPage(page);
      expect(second.serialized, `${testCase.label} canonical reload`).toBe(first.serialized);
      expect(second.stage, testCase.label).toBe(first.stage);
      expect(second.order, testCase.label).toBe(first.order);
      expect(second.tiles, testCase.label).toBe(64);
      expect(second.rows, testCase.label).toBe(8);
      expect(second.enabledTiles, testCase.label).toBe(64);
      expect(second.overflowX, testCase.label).toBe(false);
      expect(second.overflowY, testCase.label).toBe(false);
      expect(second.brokenImages, testCase.label).toEqual([]);
      expect(browserErrors, testCase.label).toEqual([]);
      expect(requestErrors, testCase.label).toEqual([]);
      await context.close();
    }
  });
}
