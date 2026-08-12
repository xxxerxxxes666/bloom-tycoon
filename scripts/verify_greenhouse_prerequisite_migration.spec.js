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

test.setTimeout(120000);

function legacyState(overrides) {
  return {
    focusedEconomyVersion: 2,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 4,
    coins: 0,
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: 1,
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true,
    ...overrides
  };
}

async function openLegacy(page, profile, label, state) {
  const marker = `greenhouse-prerequisite-${profile.label}-${label}`;
  await page.addInitScript(({ key, saved, markerKey }) => {
    if (!sessionStorage.getItem(markerKey)) {
      localStorage.setItem(key, JSON.stringify(saved));
      sessionStorage.setItem(markerKey, "1");
    }
  }, { key: SAVE_KEY, saved: state, markerKey: marker });
  await page.goto(`${BASE_URL}?greenhouse-prerequisite=${profile.label}-${label}`, {
    waitUntil: "networkidle"
  });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll(".tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const visibleButtons = [...document.querySelectorAll("button:not(.tile)")].filter((button) => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return !button.hidden
        && style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    });
    return {
      stored: JSON.parse(localStorage.getItem(key) || "{}"),
      bodyClasses: [...document.body.classList],
      greenhouseStage: document.body.dataset.activeGreenhouseStage || "",
      objective: document.querySelector("#objective")?.innerText || "",
      activeOrder: document.querySelector("#activeOrders")?.innerText || "",
      ceremonyTitle: document.querySelector("#restorationTitle")?.innerText || "",
      ceremonyTransaction: document.querySelector("#payoffTransaction")?.innerText || "",
      visibleButtons: visibleButtons.map((button) => button.innerText.trim().toLowerCase()),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      brokenImages: [...document.images]
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      scrollY
    };
  }, SAVE_KEY);
}

function expectGeometry(current, profile, activeBoard = true) {
  expect(current.tiles).toBe(64);
  expect(current.rows).toBe(8);
  if (activeBoard) {
    expect(current.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(current.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
  } else {
    expect(current.boardWidth).toBe(0);
    expect(current.boardHeight).toBe(0);
  }
  expect(current.overflowX).toBe(false);
  expect(current.brokenImages).toEqual([]);
  if (profile.mobile) expect(current.scrollY).toBe(0);
}

for (const profile of PROFILES) {
  test(`legacy Moonlit payoff restores its prerequisite on ${profile.label}`, async ({ browser }) => {
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

    await openLegacy(page, profile, "moonlit-payoff", legacyState({
      currentRound: 2,
      roundComplete: true,
      moves: 2,
      coins: 170,
      counts: [0, 0, 10, 0, 9, 7],
      clearedCursedThorns: 3
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.roundOneRestored).toBe(true);
      expect(current.stored.roundTwoGreenhouseUpgraded).toBe(false);
      expect(current.stored.coins).toBe(170);
      expect(current.greenhouseStage).toBe("restored");
      expect(current.ceremonyTitle).toBe("Moonlit Wreath Complete");
      expect(current.ceremonyTransaction).toBe("EARNED 150 COINS. UPGRADE COSTS 120.");
      expect(current.visibleButtons).toEqual(["upgrade greenhouse · 120 coins"]);
      expectGeometry(current, profile, false);
      if (reload === 0) {
        await page.screenshot({
          path: `work/greenhouse-prerequisite-${profile.label}-moonlit-payoff.png`,
          fullPage: true
        });
      }
    }

    await page.getByRole("button", { name: "Upgrade Greenhouse · 120 coins", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next Order → Bloodroot Compact", exact: true }))
      .toBeVisible({ timeout: 5000 });
    const upgraded = await report(page);
    expect(upgraded.stored.roundOneRestored).toBe(true);
    expect(upgraded.stored.roundTwoGreenhouseUpgraded).toBe(true);
    expect(upgraded.stored.coins).toBe(50);
    expect(upgraded.greenhouseStage).toBe("moonlit");
    expectGeometry(upgraded, profile, false);
    expect(browserErrors).toEqual([]);
    await context.close();
  });

  test(`legacy Bloodroot play restores its prerequisite hierarchy on ${profile.label}`, async ({ browser }) => {
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

    await openLegacy(page, profile, "bloodroot-active", legacyState({
      currentRound: 3,
      moves: 8,
      coins: 50
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.roundOneRestored).toBe(true);
      expect(current.stored.roundTwoGreenhouseUpgraded).toBe(true);
      expect(current.stored.roundThreeConservatoryRaised).toBe(false);
      expect(current.stored.coins).toBe(50);
      expect(current.greenhouseStage).toBe("moonlit");
      expect(current.bodyClasses).toContain("round-three-focus-active");
      expect(current.objective.toLowerCase()).toContain("round 3");
      expect(`${current.objective} ${current.activeOrder}`).toContain("Bloodroot");
      expect(`${current.objective} ${current.activeOrder}`).toContain("Sol Rot");
      expect(current.enabledTiles).toBe(64);
      expect(current.visibleButtons).toEqual(["help"]);
      expectGeometry(current, profile);
      if (reload === 0) {
        await page.screenshot({
          path: `work/greenhouse-prerequisite-${profile.label}-bloodroot-active.png`,
          fullPage: true
        });
      }
    }

    expect(browserErrors).toEqual([]);
    await context.close();
  });
}
