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
    label: "first-bouquet-missing-payout",
    state: { currentRound: 1, moves: 2, counts: [0, 6, 0, 0, 0, 8] },
    expectedCoins: 120,
    expectedReward: 120,
    action: "Restore Greenhouse · 100 coins",
    ownershipKey: "roundOneRestored",
    spentCoins: 20,
    nextRound: 2
  },
  {
    label: "moonlit-wreath-missing-payout",
    state: {
      currentRound: 2,
      moves: 3,
      counts: [0, 0, 10, 0, 9, 7],
      clearedCursedThorns: 3,
      roundOneRestored: true
    },
    expectedCoins: 170,
    expectedReward: 150,
    action: "Upgrade Greenhouse · 120 coins",
    ownershipKey: "roundTwoGreenhouseUpgraded",
    spentCoins: 50,
    nextRound: 3
  },
  {
    label: "bloodroot-compact-missing-payout",
    state: {
      currentRound: 3,
      moves: 3,
      counts: [13, 0, 0, 14, 0, 0],
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    },
    expectedCoins: 230,
    expectedReward: 180,
    action: "Raise Conservatory · 180 coins",
    ownershipKey: "roundThreeConservatoryRaised",
    spentCoins: 50,
    nextRound: 1
  }
];

test.setTimeout(120000);

function savedState(overrides = {}) {
  return {
    focusedEconomyVersion: 3,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 2,
    coins: 0,
    counts: [0, 6, 0, 0, 0, 8],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: 1,
    roundComplete: true,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: true,
    blackCandleLessonComplete: true,
    ...overrides
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
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visibleButtons = [...document.querySelectorAll("button")]
      .filter((button) => button.offsetParent && button.innerText.trim())
      .map((button) => ({ id: button.id, text: button.innerText.trim(), disabled: button.disabled }));
    return {
      serialized: localStorage.getItem(key),
      state: JSON.parse(localStorage.getItem(key) || "{}"),
      ritual: document.querySelector("#ritualLog")?.innerText || "",
      transaction: document.querySelector("#payoffTransaction")?.innerText || "",
      visibleButtons,
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

async function activate(locator, mobile) {
  if (mobile) await locator.tap();
  else await locator.click();
}

for (const profile of PROFILES) {
  test(`completed wallet receipts restore the payoff path on ${profile.label}`, async ({ browser }) => {
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
        value: savedState(testCase.state),
        marker: `completed-wallet-${profile.label}-${testCase.label}`
      });
      await page.goto(`${BASE_URL}?completed-wallet=${profile.label}-${testCase.label}`, {
        waitUntil: "networkidle"
      });

      const repaired = await report(page);
      expect(repaired.state.roundComplete, testCase.label).toBe(true);
      expect(repaired.state.coins, testCase.label).toBe(testCase.expectedCoins);
      expect(repaired.ritual, testCase.label).toContain("Saved wallet repaired");
      expect(repaired.transaction.toLowerCase(), testCase.label)
        .toContain(`earned ${testCase.expectedReward} coins`);
      expect(repaired.visibleButtons, testCase.label).toEqual([
        { id: "restoreGreenhouseBtn", text: testCase.action, disabled: false }
      ]);
      expect(repaired.tiles, testCase.label).toBe(64);
      expect(repaired.rows, testCase.label).toBe(8);
      expect(repaired.brokenImages, testCase.label).toEqual([]);
      expect(repaired.overflowX, testCase.label).toBe(false);
      expect(repaired.overflowY, testCase.label).toBe(false);

      await page.reload({ waitUntil: "networkidle" });
      const stable = await report(page);
      expect(stable.serialized, `${testCase.label} canonical reload`).toBe(repaired.serialized);
      expect(stable.visibleButtons, testCase.label).toEqual(repaired.visibleButtons);

      await activate(page.locator("#restoreGreenhouseBtn"), profile.mobile);
      await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 12000 });
      const spent = await report(page);
      expect(spent.state.coins, testCase.label).toBe(testCase.spentCoins);
      expect(spent.state[testCase.ownershipKey], testCase.label).toBe(true);
      expect(spent.state.roundComplete, testCase.label).toBe(true);

      await activate(page.locator("#nextOrderBtn"), profile.mobile);
      await expect(page.locator("#board")).toBeVisible({ timeout: 12000 });
      const continued = await report(page);
      expect(continued.state.currentRound, testCase.label).toBe(testCase.nextRound);
      expect(continued.state.roundComplete, testCase.label).toBe(false);
      expect(continued.state.coins, testCase.label).toBe(testCase.spentCoins);
      expect(continued.tiles, testCase.label).toBe(64);
      expect(continued.rows, testCase.label).toBe(8);
      expect(continued.enabledTiles, testCase.label).toBe(64);
      expect(continued.boardWidth, testCase.label).toBeCloseTo(profile.mobile ? 378 : 600, 1);
      expect(continued.boardHeight, testCase.label).toBeCloseTo(profile.mobile ? 378 : 600, 1);
      expect(continued.brokenImages, testCase.label).toEqual([]);
      expect(continued.overflowX, testCase.label).toBe(false);
      expect(continued.overflowY, testCase.label).toBe(false);
      expect(errors, testCase.label).toEqual([]);
      await context.close();
    }
  });

  test(`spent and fully owned completion wallets stay authoritative on ${profile.label}`, async ({ browser }) => {
    const controls = [
      {
        label: "first-restoration-already-spent",
        state: {
          currentRound: 1,
          coins: 20,
          counts: [0, 6, 0, 0, 0, 8],
          roundOneRestored: true
        },
        expectedCoins: 20
      },
      {
        label: "fully-owned-replay-complete",
        state: {
          currentRound: 1,
          coins: 777,
          counts: [0, 6, 0, 0, 0, 8],
          roundOneRestored: true,
          roundTwoGreenhouseUpgraded: true,
          roundThreeConservatoryRaised: true
        },
        expectedCoins: 777
      }
    ];
    for (const control of controls) {
      const context = await browser.newContext({
        viewport: profile.viewport,
        hasTouch: Boolean(profile.mobile),
        isMobile: Boolean(profile.mobile)
      });
      const page = await context.newPage();
      const errors = watchErrors(page);
      await page.addInitScript(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      }, { key: SAVE_KEY, value: savedState(control.state) });
      await page.goto(`${BASE_URL}?completed-wallet-control=${profile.label}-${control.label}`, {
        waitUntil: "networkidle"
      });
      const first = await report(page);
      expect(first.state.coins, control.label).toBe(control.expectedCoins);
      expect(first.ritual, control.label).not.toContain("Saved wallet repaired");
      expect(first.tiles, control.label).toBe(64);
      expect(first.rows, control.label).toBe(8);
      expect(first.brokenImages, control.label).toEqual([]);
      expect(first.overflowX, control.label).toBe(false);
      expect(first.overflowY, control.label).toBe(false);
      expect(errors, control.label).toEqual([]);
      await context.close();
    }
  });
}
