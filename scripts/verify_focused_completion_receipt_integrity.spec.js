const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const pageUrl = (query) => `${BASE_URL}${BASE_URL.includes("?") ? "&" : "?"}${query}`;
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

const CASES = [
  {
    label: "round-one-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 1,
      roundComplete: true,
      moves: 3,
      coins: 120,
      counts: [0, 6, 0, 0, 0, 6],
      blackCandleLessonComplete: false
    },
    expectedCoins: 0,
    forbiddenAction: "Restore Greenhouse"
  },
  {
    label: "round-one-lesson-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 1,
      roundComplete: true,
      moves: 3,
      coins: 120,
      counts: [0, 6, 0, 0, 0, 8],
      blackCandleLessonComplete: false
    },
    expectedCoins: 0,
    forbiddenAction: "Restore Greenhouse"
  },
  {
    label: "round-two-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 2,
      roundComplete: true,
      roundOneRestored: true,
      moves: 5,
      coins: 170,
      counts: [0, 0, 10, 0, 9, 7],
      clearedCursedThorns: 2
    },
    expectedCoins: 20,
    forbiddenAction: "Upgrade Greenhouse"
  },
  {
    label: "round-three-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 3,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      moves: 4,
      coins: 230,
      counts: [11, 0, 0, 14, 0, 0]
    },
    expectedCoins: 50,
    forbiddenAction: "Raise Conservatory"
  },
  {
    label: "owned-replay-phantom",
    state: {
      focusedEconomyVersion: 2,
      currentRound: 3,
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      moves: 4,
      coins: 7820,
      counts: [11, 0, 0, 14, 0, 0]
    },
    expectedCoins: 7820,
    forbiddenAction: "Play Again"
  }
];

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

const DAMAGED_NUMERIC_CASES = [
  {
    label: "non-finite-round-identity",
    state: {
      focusedEconomyVersion: 3,
      board: FIXTURE_BOARD,
      currentRound: "Infinity",
      roundComplete: false,
      moves: 6,
      coins: 0,
      counts: [0, 0, 0, 0, 0, 0],
      clearedCursedThorns: 0,
      tutorialSkipped: true,
      blackCandleLessonComplete: true
    },
    expectedRound: 1,
    expectedMoves: 6,
    expectedCoins: 0,
    expectedCounts: [0, 0, 0, 0, 0, 0],
    expectedClearedThorns: 0,
    expectedBouquetProgress: "Bouquet · 0/14",
    forbiddenAction: "Play Again",
    expectedOwnership: [false, false, false]
  },
  {
    label: "round-one-non-finite",
    state: {
      focusedEconomyVersion: 3,
      board: FIXTURE_BOARD,
      currentRound: 1,
      roundComplete: false,
      moves: "5.8",
      coins: "Infinity",
      counts: ["Infinity", "Infinity", "Infinity", "Infinity", "Infinity", "Infinity"],
      clearedCursedThorns: "Infinity",
      tutorialSkipped: true,
      blackCandleLessonComplete: true
    },
    expectedMoves: 5,
    expectedRound: 1,
    expectedCoins: 0,
    expectedCounts: [0, 0, 0, 0, 0, 0],
    expectedClearedThorns: 0,
    expectedBouquetProgress: "Bouquet · 0/14",
    forbiddenAction: "Restore Greenhouse"
  },
  {
    label: "round-two-non-finite-thorns",
    state: {
      focusedEconomyVersion: 3,
      board: FIXTURE_BOARD,
      currentRound: 2,
      roundComplete: false,
      roundOneRestored: true,
      moves: "8.9",
      coins: "Infinity",
      counts: [0, 0, 10, 0, 9, 7],
      clearedCursedThorns: "Infinity",
      cursedThorns: [
        { x: 0, y: 1, hp: "Infinity" },
        { x: 1, y: 1, hp: "Infinity" },
        { x: 2, y: 1, hp: "Infinity" }
      ]
    },
    expectedMoves: 8,
    expectedRound: 2,
    expectedCoins: 20,
    expectedCounts: [0, 0, 10, 0, 9, 7],
    expectedClearedThorns: 0,
    expectedThornHp: [1, 1, 1],
    expectedBouquetProgress: "Bouquet · 26/29",
    forbiddenAction: "Upgrade Greenhouse"
  }
];

const DAMAGED_BOOLEAN_STATE = {
  focusedEconomyVersion: 3,
  board: FIXTURE_BOARD,
  currentRound: 1,
  roundComplete: "false",
  moves: 6,
  coins: 0,
  counts: [0, 0, 0, 0, 0, 0],
  cursedThorns: [],
  clearedCursedThorns: 0,
  roundOneRestored: "false",
  roundTwoGreenhouseUpgraded: "false",
  roundThreeConservatoryRaised: "false",
  freshConservatorySettlement: "false",
  hasMadeValidMove: "false",
  restoredRoundTwoGuideMoves: 0,
  tutorialSkipped: "false",
  tutorialActive: "true",
  blackCandleLessonComplete: "false"
};

test.setTimeout(60000);

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden"
        && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      save: localStorage.getItem(key),
      state,
      message: document.querySelector("#ritualLog")?.textContent.trim() || "",
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      hints: [...document.querySelectorAll("#board .tile.idle-hint")].map((tile) => tile.id),
      bouquetProgress: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      commands: [...document.querySelectorAll("button:not(.tile)")]
        .filter(visible)
        .map((button) => button.textContent.trim()),
      contractRound: document.querySelector("#activeOrders .order-contract")?.dataset.contractRound || "",
      disabledTiles: tiles.filter((tile) => tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const viewportCase of VIEWPORTS) {
  for (const receiptCase of CASES) {
    test(`${receiptCase.label} reopens from an unsupported receipt on ${viewportCase.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: viewportCase.viewport,
        hasTouch: Boolean(viewportCase.mobile),
        isMobile: Boolean(viewportCase.mobile)
      });
      const page = await context.newPage();
      const problems = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("pageerror", (error) => problems.push(error.message));
      try {
        await page.addInitScript(({ key, state, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, JSON.stringify(state));
            sessionStorage.setItem(marker, "1");
          }
        }, {
          key: SAVE_KEY,
          state: receiptCase.state,
          marker: `receipt-${receiptCase.label}-${viewportCase.label}`
        });
        await page.goto(pageUrl(`receipt=${receiptCase.label}-${viewportCase.label}`), {
          waitUntil: "networkidle"
        });

        const repaired = await report(page);
        expect(repaired.state.roundComplete).toBe(false);
        expect(repaired.state.coins).toBe(receiptCase.expectedCoins);
        expect(repaired.state.freshConservatorySettlement).toBe(false);
        expect(repaired.message).toContain("Saved order reopened.");
        expect(repaired.commands.some((command) => command.includes(receiptCase.forbiddenAction))).toBe(false);
        expect(repaired.contractRound).toBe(String(receiptCase.state.currentRound));
        expect(repaired.tiles).toBe(64);
        expect(repaired.rows).toBe(8);
        expect(repaired.disabledTiles).toBe(0);
        expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
        expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(repaired.scrollY).toBe(0);
        expect(repaired.overflowX).toBe(false);
        if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
        expect(repaired.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        if (receiptCase.label === "round-one-phantom") {
          await page.screenshot({
            path: `work/focused-receipt-repair-${viewportCase.label}.png`,
            fullPage: false
          });
        }

        const repairedSave = repaired.save;
        await page.reload({ waitUntil: "networkidle" });
        const stable = await report(page);
        expect(stable.save).toBe(repairedSave);
        expect(stable.state.roundComplete).toBe(false);
        expect(stable.state.coins).toBe(receiptCase.expectedCoins);
        expect(stable.tiles).toBe(64);
        expect(stable.rows).toBe(8);
        expect(stable.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
        expect(stable.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(stable.scrollY).toBe(0);
        expect(stable.overflowX).toBe(false);
        if (viewportCase.mobile) expect(stable.overflowY).toBe(false);
        expect(stable.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }

  for (const damagedCase of DAMAGED_NUMERIC_CASES) {
    test(`${damagedCase.label} repairs to a stable active order on ${viewportCase.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: viewportCase.viewport,
        hasTouch: Boolean(viewportCase.mobile),
        isMobile: Boolean(viewportCase.mobile)
      });
      const page = await context.newPage();
      const problems = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("pageerror", (error) => problems.push(error.message));
      try {
        await page.addInitScript(({ key, state, seedKey }) => {
          if (!sessionStorage.getItem(seedKey)) {
            localStorage.setItem(key, JSON.stringify(state));
            sessionStorage.setItem(seedKey, "1");
          }
        }, {
          key: SAVE_KEY,
          state: damagedCase.state,
          seedKey: `bloomNumericRepairSeed-${damagedCase.label}`
        });
        await page.goto(pageUrl(`damaged=${damagedCase.label}-${viewportCase.label}`), {
          waitUntil: "networkidle"
        });

        const repaired = await report(page);
        expect(repaired.state.roundComplete).toBe(false);
        expect(repaired.state.currentRound).toBe(damagedCase.expectedRound);
        expect(repaired.state.moves).toBe(damagedCase.expectedMoves);
        expect(repaired.state.coins).toBe(damagedCase.expectedCoins);
        expect(repaired.state.counts).toEqual(damagedCase.expectedCounts);
        expect(repaired.state.clearedCursedThorns).toBe(damagedCase.expectedClearedThorns);
        expect(repaired.bouquetProgress).toBe(damagedCase.expectedBouquetProgress);
        if (damagedCase.expectedThornHp) {
          expect(repaired.state.cursedThorns.map((thorn) => thorn.hp)).toEqual(damagedCase.expectedThornHp);
        }
        expect(repaired.message).toContain("Saved order repaired.");
        expect(repaired.commands.some((command) => command.includes(damagedCase.forbiddenAction))).toBe(false);
        expect(repaired.contractRound).toBe(String(damagedCase.expectedRound));
        if (damagedCase.expectedOwnership) {
          expect([
            repaired.state.roundOneRestored,
            repaired.state.roundTwoGreenhouseUpgraded,
            repaired.state.roundThreeConservatoryRaised
          ]).toEqual(damagedCase.expectedOwnership);
        }
        expect(repaired.tiles).toBe(64);
        expect(repaired.rows).toBe(8);
        expect(repaired.disabledTiles).toBe(0);
        expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
        expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(repaired.scrollY).toBe(0);
        expect(repaired.overflowX).toBe(false);
        if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
        expect(repaired.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        if (damagedCase.label === "non-finite-round-identity") {
          await page.screenshot({
            path: `/tmp/bloom-non-finite-round-repair-${viewportCase.label}.png`,
            fullPage: false
          });
        }

        const repairedSave = repaired.save;
        await page.reload({ waitUntil: "networkidle" });
        const stable = await report(page);
        expect(stable.save).toBe(repairedSave);
        expect(stable.state.roundComplete).toBe(false);
        expect(stable.state.currentRound).toBe(damagedCase.expectedRound);
        expect(stable.state.moves).toBe(damagedCase.expectedMoves);
        expect(stable.state.coins).toBe(damagedCase.expectedCoins);
        expect(stable.state.counts).toEqual(damagedCase.expectedCounts);
        expect(stable.state.clearedCursedThorns).toBe(damagedCase.expectedClearedThorns);
        expect(stable.bouquetProgress).toBe(damagedCase.expectedBouquetProgress);
        expect(stable.tiles).toBe(64);
        expect(stable.rows).toBe(8);
        expect(stable.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
        expect(stable.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(stable.scrollY).toBe(0);
        expect(stable.overflowX).toBe(false);
        if (viewportCase.mobile) expect(stable.overflowY).toBe(false);
        expect(stable.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}

for (const viewportCase of VIEWPORTS) {
  test(`text boolean values cannot fabricate progression on ${viewportCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: viewportCase.viewport,
      hasTouch: Boolean(viewportCase.mobile),
      isMobile: Boolean(viewportCase.mobile)
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    try {
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: DAMAGED_BOOLEAN_STATE,
        marker: `boolean-repair-${viewportCase.label}`
      });
      await page.goto(pageUrl(`boolean-repair=${viewportCase.label}`), { waitUntil: "networkidle" });

      const repaired = await report(page);
      expect(repaired.state).toMatchObject({
        focusedEconomyVersion: 3,
        currentRound: 1,
        roundComplete: false,
        moves: 6,
        coins: 0,
        counts: [0, 0, 0, 0, 0, 0],
        roundOneRestored: false,
        roundTwoGreenhouseUpgraded: false,
        roundThreeConservatoryRaised: false,
        freshConservatorySettlement: false,
        hasMadeValidMove: false,
        tutorialSkipped: false,
        tutorialActive: true,
        blackCandleLessonComplete: false
      });
      expect(repaired.message).toContain("Saved order repaired.");
      expect(repaired.bouquetProgress).toBe("Bouquet · 0/14");
      expect(repaired.cue).toBe("Swap the glowing pair ↑↓");
      expect(repaired.hints).toHaveLength(2);
      expect(repaired.commands).toEqual(["Skip"]);
      expect(repaired.tiles).toBe(64);
      expect(repaired.rows).toBe(8);
      expect(repaired.disabledTiles).toBe(0);
      expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
      expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
      expect(repaired.scrollY).toBe(0);
      expect(repaired.overflowX).toBe(false);
      if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
      expect(repaired.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
      await page.screenshot({
        path: `/tmp/bloom-boolean-repair-${viewportCase.label}.png`,
        fullPage: false
      });

      const repairedSave = repaired.save;
      await page.reload({ waitUntil: "networkidle" });
      const stable = await report(page);
      expect(stable.save).toBe(repairedSave);
      expect(stable.state).toMatchObject({
        roundComplete: false,
        roundOneRestored: false,
        roundTwoGreenhouseUpgraded: false,
        roundThreeConservatoryRaised: false,
        freshConservatorySettlement: false,
        hasMadeValidMove: false,
        tutorialSkipped: false,
        tutorialActive: true,
        blackCandleLessonComplete: false
      });
      expect(stable.tiles).toBe(64);
      expect(stable.rows).toBe(8);
      expect(stable.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
      expect(stable.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
      expect(stable.scrollY).toBe(0);
      expect(stable.overflowX).toBe(false);
      if (viewportCase.mobile) expect(stable.overflowY).toBe(false);
      expect(stable.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("a current earned receipt remains complete", async ({ page }) => {
  const state = {
    focusedEconomyVersion: 2,
    currentRound: 1,
    roundComplete: true,
    moves: 2,
    coins: 120,
    counts: [0, 6, 0, 0, 0, 8],
    blackCandleLessonComplete: true
  };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: state
  });
  await page.goto(pageUrl("receipt-valid=1"), { waitUntil: "networkidle" });
  const valid = await report(page);
  expect(valid.state.roundComplete).toBe(true);
  expect(valid.state.coins).toBe(120);
  expect(valid.commands.some((command) => command.includes("Restore Greenhouse"))).toBe(true);
});
