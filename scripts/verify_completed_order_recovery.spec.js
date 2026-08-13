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

function interruptedState(overrides) {
  return {
    focusedEconomyVersion: 2,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 0,
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

async function openState(page, profile, label, state) {
  const marker = `completed-order-recovery:${profile.label}:${label}`;
  await page.addInitScript(({ key, value, markerKey }) => {
    if (!sessionStorage.getItem(markerKey)) {
      localStorage.setItem(key, JSON.stringify(value));
      sessionStorage.setItem(markerKey, "1");
    }
  }, { key: SAVE_KEY, value: state, markerKey: marker });
  await page.goto(`${BASE_URL}?completed-order-recovery=${profile.label}-${label}`, {
    waitUntil: "networkidle"
  });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return !node.hidden
        && style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const tiles = [...document.querySelectorAll(".tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      stored: JSON.parse(localStorage.getItem(key) || "{}"),
      ceremonyTitle: document.querySelector("#restorationTitle")?.innerText || "",
      transaction: document.querySelector("#payoffTransaction")?.innerText || "",
      buttons: [...document.querySelectorAll("button:not(.tile)")]
        .filter(visible)
        .map((button) => button.innerText.trim().toLowerCase()),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      scrollY
    };
  }, SAVE_KEY);
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

for (const profile of PROFILES) {
  test(`completed First Bouquet receipt recovers after its lesson on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await openState(page, profile, "first-bouquet", interruptedState({
      counts: [0, 6, 0, 0, 0, 8]
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.roundComplete).toBe(true);
      expect(current.stored.coins).toBe(120);
      expect(current.stored.moves).toBe(0);
      expect(current.ceremonyTitle).toBe("First Bouquet Bound");
      expect(current.transaction).toBe("EARNED 120 COINS. RESTORE COSTS 100.");
      expect(current.buttons).toEqual(["restore greenhouse · 100 coins"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.boardWidth).toBe(0);
      expect(current.boardHeight).toBe(0);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
      if (profile.mobile) expect(current.scrollY).toBe(0);
    }
    await page.screenshot({
      path: `work/completed-order-recovery-${profile.label}-first-bouquet.png`,
      fullPage: true
    });
    await page.getByRole("button", { name: "Restore Greenhouse · 100 coins", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next Order → Moonlit Wreath", exact: true }))
      .toBeVisible({ timeout: 5000 });
    const spent = await report(page);
    expect(spent.stored.coins).toBe(20);
    expect(spent.stored.roundOneRestored).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`completed Moonlit receipt recovers without Retry on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await openState(page, profile, "moonlit", interruptedState({
      currentRound: 2,
      coins: 20,
      counts: [0, 0, 10, 0, 9, 7],
      clearedCursedThorns: 3,
      roundOneRestored: true
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.roundComplete).toBe(true);
      expect(current.stored.coins).toBe(170);
      expect(current.stored.moves).toBe(0);
      expect(current.ceremonyTitle).toBe("Moonlit Wreath Complete");
      expect(current.transaction).toBe("EARNED 150 COINS. UPGRADE COSTS 120.");
      expect(current.buttons).toEqual(["upgrade greenhouse · 120 coins"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.boardWidth).toBe(0);
      expect(current.boardHeight).toBe(0);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
      if (profile.mobile) expect(current.scrollY).toBe(0);
    }
    await page.screenshot({
      path: `work/completed-order-recovery-${profile.label}-moonlit.png`,
      fullPage: true
    });
    await page.getByRole("button", { name: "Upgrade Greenhouse · 120 coins", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next Order → Bloodroot Compact", exact: true }))
      .toBeVisible({ timeout: 5000 });
    const spent = await report(page);
    expect(spent.stored.coins).toBe(50);
    expect(spent.stored.roundTwoGreenhouseUpgraded).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`completed Bloodroot receipt recovers without Retry on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await openState(page, profile, "bloodroot", interruptedState({
      currentRound: 3,
      coins: 50,
      counts: [13, 0, 0, 14, 0, 0],
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.roundComplete).toBe(true);
      expect(current.stored.coins).toBe(230);
      expect(current.stored.moves).toBe(0);
      expect(current.ceremonyTitle).toBe("Bloodroot Compact Complete");
      expect(current.transaction).toBe("EARNED 180 COINS. CONSERVATORY COSTS 180.");
      expect(current.buttons).toEqual(["raise conservatory · 180 coins"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.boardWidth).toBe(0);
      expect(current.boardHeight).toBe(0);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
      if (profile.mobile) expect(current.scrollY).toBe(0);
    }
    await page.screenshot({
      path: `work/completed-order-recovery-${profile.label}-bloodroot.png`,
      fullPage: true
    });
    await page.getByRole("button", { name: "Raise Conservatory · 180 coins", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true }))
      .toBeVisible({ timeout: 5000 });
    const spent = await report(page);
    expect(spent.stored.coins).toBe(50);
    expect(spent.stored.roundThreeConservatoryRaised).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`interrupted owned replay completion banks its reward once on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await openState(page, profile, "owned-replay", interruptedState({
      currentRound: 3,
      moves: 2,
      coins: 7820,
      counts: [13, 0, 0, 14, 0, 0],
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.roundComplete).toBe(true);
      expect(current.stored.coins).toBe(8000);
      expect(current.stored.moves).toBe(2);
      expect(current.ceremonyTitle).toBe("Bloodroot Compact Complete");
      expect(current.transaction).toBe("REPLAY REWARD · +180 COINS BANKED · 8000 COINS IN WALLET.");
      expect(current.buttons).toEqual(["play again → first bouquet"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.boardWidth).toBe(0);
      expect(current.boardHeight).toBe(0);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
      if (profile.mobile) expect(current.scrollY).toBe(0);
    }
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`completed v2 owned replay migrates one banked reward on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await openState(page, profile, "owned-replay-v2", interruptedState({
      currentRound: 3,
      moves: 2,
      coins: 50,
      counts: [13, 0, 0, 14, 0, 0],
      roundComplete: true,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true
    }));

    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.focusedEconomyVersion).toBe(3);
      expect(current.stored.roundComplete).toBe(true);
      expect(current.stored.coins).toBe(230);
      expect(current.transaction).toBe("REPLAY REWARD · +180 COINS BANKED · 230 COINS IN WALLET.");
      expect(current.buttons).toEqual(["play again → first bouquet"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.boardWidth).toBe(0);
      expect(current.boardHeight).toBe(0);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
    }
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`Round 1 lesson gate rejects counter-only completion on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await openState(page, profile, "round-one-gate", interruptedState({
      counts: [0, 6, 0, 0, 0, 8],
      tutorialSkipped: false,
      tutorialActive: false,
      blackCandleLessonComplete: false
    }));
    const current = await report(page);
    expect(current.stored.roundComplete).toBe(false);
    expect(current.stored.coins).toBe(0);
    expect(current.buttons).toEqual(["help"]);
    expect(current.buttons).not.toContain("restore greenhouse · 100 coins");
    expect(current.tiles).toBe(64);
    expect(current.rows).toBe(8);
    expect(current.enabledTiles).toBe(64);
    expect(current.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(current.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(current.overflowX).toBe(false);
    expect(current.brokenImages).toEqual([]);
    if (profile.mobile) expect(current.scrollY).toBe(0);
    expect(errors).toEqual([]);
    await context.close();
  });
}
