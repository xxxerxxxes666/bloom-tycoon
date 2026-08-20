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
const AUTHORED_ROUND_ONE_BOARD = [
  [5, 0, 5, 2, 0, 3, 3, 0],
  [3, 5, 4, 2, 3, 4, 0, 2],
  ...FIXTURE_BOARD.slice(2).map((row) => [...row])
];
const UNSAFE_MAGNITUDE = 1e100;
const UNSAFE_OWNED_REPLAY_SAVE = {
  focusedEconomyVersion: 3,
  board: FIXTURE_BOARD,
  armedLineRelic: null,
  moves: 6,
  coins: UNSAFE_MAGNITUDE,
  counts: [0, UNSAFE_MAGNITUDE, 0, 0, 0, UNSAFE_MAGNITUDE],
  cursedThorns: [],
  clearedCursedThorns: 0,
  currentRound: 1,
  roundComplete: false,
  roundOneRestored: true,
  roundTwoGreenhouseUpgraded: true,
  roundThreeConservatoryRaised: true,
  freshConservatorySettlement: false,
  hasMadeValidMove: false,
  restoredRoundTwoGuideMoves: 0,
  tutorialSkipped: false,
  tutorialActive: true,
  blackCandleLessonComplete: true
};

function structuredNumericSave(kind) {
  const structured = kind === "array"
    ? (value) => [value]
    : (value) => ({ value });
  return {
    focusedEconomyVersion: structured(3),
    board: AUTHORED_ROUND_ONE_BOARD.map((row) => [...row]),
    armedLineRelic: {
      x: structured(3),
      y: structured(4),
      direction: "horizontal",
      flowerId: structured(3)
    },
    moves: structured(1),
    coins: structured(999),
    counts: [
      structured(0),
      structured(6),
      structured(0),
      structured(0),
      structured(0),
      structured(8)
    ],
    cursedThorns: [{
      x: structured(0),
      y: structured(1),
      hp: structured(1)
    }],
    clearedCursedThorns: structured(3),
    currentRound: structured(1),
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: false,
    restoredRoundTwoGuideMoves: structured(2),
    tutorialSkipped: false,
    tutorialActive: true,
    blackCandleLessonComplete: false
  };
}

const NUMERIC_STRING_SAVE = {
  focusedEconomyVersion: "3",
  board: FIXTURE_BOARD.map((row) => [...row]),
  armedLineRelic: null,
  moves: "7",
  coins: "20",
  counts: ["0", "0", "3", "0", "3", "2"],
  cursedThorns: [0, 1, 2].map((x) => ({ x: String(x), y: "1", hp: "1" })),
  clearedCursedThorns: "0",
  currentRound: "2",
  roundComplete: false,
  roundOneRestored: true,
  roundTwoGreenhouseUpgraded: false,
  roundThreeConservatoryRaised: false,
  freshConservatorySettlement: false,
  hasMadeValidMove: true,
  restoredRoundTwoGuideMoves: "1",
  tutorialSkipped: true,
  tutorialActive: false,
  blackCandleLessonComplete: true
};

const CASES = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const lastRowBottom = Math.max(
      0,
      ...tiles.filter((tile) => tile.dataset.y === "7")
        .map((tile) => tile.getBoundingClientRect().bottom)
    );
    return {
      save: localStorage.getItem(key),
      state,
      bouquet: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      reward: document.querySelector("#bouquetRewardPromise")?.textContent.trim() || "",
      wallet: document.querySelector("#coins")?.textContent.trim() || "",
      ritual: document.querySelector("#ritualLog")?.textContent.trim() || "",
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      repairReceiptActive: document.body.classList.contains("saved-altar-repair-active"),
      repairReceiptOccurrences: (document.body.innerText.match(/SAVED PROGRESS REPAIRED/g) || []).length,
      payoffAction: [...document.querySelectorAll("#roundOneRestoration button")]
        .filter(visible)
        .map((button) => button.textContent.trim()),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      tiles: tiles.length,
      enabled: tiles.filter((tile) => !tile.disabled).length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      lastRowBottom,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      imageCount: document.images.length,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const testCase of CASES) {
  test(`unsafe finite replay progress returns to an honest active order on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile)
    });
    const page = await context.newPage();
    const problems = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
    });

    try {
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: UNSAFE_OWNED_REPLAY_SAVE,
        marker: `unsafe-saved-magnitude-${testCase.label}`
      });
      await page.goto(`${BASE_URL}?unsafe-saved-magnitude=${testCase.label}`, { waitUntil: "networkidle" });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });

      const repaired = await report(page);
      expect(repaired.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(repaired.state.coins).toBe(50);
      expect(repaired.state.moves).toBe(6);
      expect(repaired.state.currentRound).toBe(1);
      expect(repaired.state.roundComplete).toBe(false);
      expect(repaired.state.roundOneRestored).toBe(true);
      expect(repaired.state.roundTwoGreenhouseUpgraded).toBe(true);
      expect(repaired.state.roundThreeConservatoryRaised).toBe(true);
      expect(repaired.bouquet).toBe("Bouquet · 0/14");
      expect(repaired.reward).toBe("Bank 120 · Wallet 170");
      expect(repaired.wallet).toBe("50");
      expect(repaired.ritual).toContain("Saved bouquet repaired.");
      expect(repaired.payoffAction).toEqual([]);
      expect(repaired.hints).toHaveLength(2);
      expect(repaired.tiles).toBe(64);
      expect(repaired.enabled).toBe(64);
      expect(repaired.rows).toBe(8);
      expect(repaired.roving).toHaveLength(1);
      expect(repaired.boardWidth).toBeCloseTo(testCase.mobile ? 378 : 600, 2);
      expect(repaired.boardBottom).toBeLessThanOrEqual(testCase.viewport.height);
      expect(repaired.overflowX).toBe(false);
      if (testCase.mobile) expect(repaired.overflowY).toBe(false);
      expect(repaired.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
      expect(failedRequests).toEqual([]);
      await page.screenshot({
        path: `work/unsafe-saved-magnitude-repaired-${testCase.label}.png`,
        fullPage: false
      });

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
      const stable = await report(page);
      expect(stable.save).toBe(repaired.save);
      expect(stable.state.coins).toBe(50);
      expect(stable.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(stable.state.roundComplete).toBe(false);

      const pair = stable.hints;
      if (testCase.mobile) {
        await page.locator(`#${pair[0]}`).tap();
        await page.locator(`#${pair[1]}`).tap();
      } else {
        await page.locator(`#${pair[0]}`).click();
        await page.locator(`#${pair[1]}`).click();
      }
      await expect.poll(async () => (await report(page)).state.moves, { timeout: 10000 }).toBe(5);
      const continued = await report(page);
      expect(continued.state.counts[5]).toBe(3);
      expect(continued.state.coins).toBe(50);
      expect(continued.state.roundComplete).toBe(false);
      expect(continued.tiles).toBe(64);
      expect(continued.enabled).toBe(64);
      expect(continued.rows).toBe(8);
      expect(continued.overflowX).toBe(false);
      expect(continued.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const profile of CASES) {
  for (const kind of ["array", "object"]) {
    test(`structured ${kind} numeric authority repairs before play on ${profile.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: profile.viewport,
        hasTouch: Boolean(profile.mobile),
        isMobile: Boolean(profile.mobile)
      });
      const page = await context.newPage();
      const problems = [];
      const failedRequests = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("pageerror", (error) => problems.push(error.message));
      page.on("requestfailed", (request) => {
        const failure = request.failure()?.errorText || "";
        if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
      });
      page.on("response", (response) => {
        if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
      });

      try {
        await page.addInitScript(({ key, state, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, JSON.stringify(state));
            sessionStorage.setItem(marker, "1");
          }
        }, {
          key: SAVE_KEY,
          state: structuredNumericSave(kind),
          marker: `structured-numeric-${kind}-${profile.label}`
        });
        await page.goto(`${BASE_URL}?structured-numeric=${kind}-${profile.label}`, {
          waitUntil: "networkidle"
        });
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });

        const repaired = await report(page);
        expect(repaired.state).toMatchObject({
          focusedEconomyVersion: 3,
          armedLineRelic: null,
          moves: 6,
          coins: 0,
          counts: [0, 0, 0, 0, 0, 0],
          cursedThorns: [],
          clearedCursedThorns: 0,
          currentRound: 1,
          roundComplete: false,
          restoredRoundTwoGuideMoves: 0
        });
        expect(repaired.bouquet).toBe("Bouquet · 0/14");
        expect(repaired.reward).toBe("Complete for 120 coins");
        expect(repaired.wallet).toBe("0");
        expect(repaired.ritual).toContain("Saved bouquet repaired.");
        expect(repaired.payoffAction).toEqual([]);
        expect(repaired.hints).toHaveLength(2);
        expect(repaired.repairReceiptActive).toBe(true);
        expect(repaired.repairReceiptOccurrences).toBe(1);
        expect(repaired.cue).toBe("SAVED PROGRESS REPAIRED · INVALID VALUES CLEARED.");
        expect(repaired.tiles).toBe(64);
        expect(repaired.enabled).toBe(64);
        expect(repaired.rows).toBe(8);
        expect(repaired.roving).toHaveLength(1);
        expect(repaired.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 2);
        expect(repaired.boardBottom).toBeLessThanOrEqual(profile.viewport.height);
        expect(repaired.lastRowBottom).toBeLessThanOrEqual(profile.viewport.height);
        expect(repaired.overflowX).toBe(false);
        if (profile.mobile) expect(repaired.overflowY).toBe(false);
        expect(repaired.imageCount).toBeGreaterThan(0);
        expect(repaired.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        expect(failedRequests).toEqual([]);
        await page.screenshot({
          path: `work/structured-numeric-${kind}-repaired-${profile.label}.png`,
          fullPage: false
        });

        await expect(page.locator("body")).not.toHaveClass(/saved-altar-repair-active/, {
          timeout: 5000
        });
        const receiptRetired = await report(page);
        expect(receiptRetired.repairReceiptActive).toBe(false);
        expect(receiptRetired.repairReceiptOccurrences).toBe(0);
        const canonicalSave = receiptRetired.save;

        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
        const stable = await report(page);
        expect(stable.save).toBe(canonicalSave);
        expect(stable.repairReceiptActive).toBe(false);
        expect(stable.repairReceiptOccurrences).toBe(0);
        expect(stable.state.counts).toEqual([0, 0, 0, 0, 0, 0]);
        expect(stable.state.coins).toBe(0);
        expect(stable.state.roundComplete).toBe(false);

        const pair = stable.hints;
        if (profile.mobile) {
          await page.locator(`#${pair[0]}`).tap();
          await page.locator(`#${pair[1]}`).tap();
        } else {
          await page.locator(`#${pair[0]}`).click();
          await page.locator(`#${pair[1]}`).click();
        }
        await expect.poll(async () => (await report(page)).state.moves, { timeout: 10000 }).toBe(5);
        const continued = await report(page);
        expect(continued.state.counts).toEqual([0, 0, 0, 0, 0, 3]);
        expect(continued.state.counts.reduce((total, count) => total + count, 0)).toBe(3);
        expect(continued.state.coins).toBe(0);
        expect(continued.state.roundComplete).toBe(false);
        expect(continued.state.clearedCursedThorns).toBe(0);
        expect(continued.state.armedLineRelic).toBeNull();
        expect(continued.tiles).toBe(64);
        expect(continued.enabled).toBe(64);
        expect(continued.rows).toBe(8);
        expect(continued.overflowX).toBe(false);
        if (profile.mobile) expect(continued.overflowY).toBe(false);
        expect(continued.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
        expect(failedRequests).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }

  test(`primitive numeric-string save authority remains accepted on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
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
        state: NUMERIC_STRING_SAVE,
        marker: `numeric-string-authority-${profile.label}`
      });
      await page.goto(`${BASE_URL}?numeric-string-authority=${profile.label}`, {
        waitUntil: "networkidle"
      });
      const normalized = await report(page);
      expect(normalized.state).toMatchObject({
        focusedEconomyVersion: 3,
        moves: 7,
        coins: 20,
        counts: [0, 0, 3, 0, 3, 2],
        cursedThorns: [
          { x: 0, y: 1, hp: 1 },
          { x: 1, y: 1, hp: 1 },
          { x: 2, y: 1, hp: 1 }
        ],
        clearedCursedThorns: 0,
        currentRound: 2,
        roundComplete: false,
        restoredRoundTwoGuideMoves: 1
      });
      expect(normalized.bouquet).toBe("Bouquet · 8/29");
      expect(normalized.wallet).toBe("20");
      expect(normalized.payoffAction).toEqual([]);
      expect(normalized.tiles).toBe(64);
      expect(normalized.enabled).toBe(64);
      expect(normalized.rows).toBe(8);
      expect(normalized.overflowX).toBe(false);
      if (profile.mobile) expect(normalized.overflowY).toBe(false);
      expect(normalized.brokenImages).toEqual([]);
      const canonicalSave = normalized.save;
      await page.reload({ waitUntil: "networkidle" });
      const stable = await report(page);
      expect(stable.save).toBe(canonicalSave);
      expect(stable.state.counts).toEqual([0, 0, 3, 0, 3, 2]);
      expect(stable.state.coins).toBe(20);
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
