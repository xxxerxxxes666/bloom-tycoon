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

function fractionalMoonlitState() {
  return {
    focusedEconomyVersion: 2,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 2,
    coins: 170,
    counts: [0, 0, 10, 0, 9, 7],
    cursedThorns: [],
    clearedCursedThorns: 3,
    currentRound: 2.5,
    roundComplete: true,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

function structuredFutureRoundState() {
  return {
    focusedEconomyVersion: 3,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    moves: 6,
    coins: 0,
    counts: [0, 0, 0, 0, 0, 0],
    cursedThorns: [],
    clearedCursedThorns: 0,
    currentRound: [99],
    roundComplete: false,
    roundOneRestored: false,
    roundTwoGreenhouseUpgraded: false,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: false,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: false,
    tutorialActive: true,
    blackCandleLessonComplete: false
  };
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = [...document.querySelectorAll(".tile")];
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
      greenhouseStage: document.body.dataset.activeGreenhouseStage || "",
      ceremonyTitle: document.querySelector("#restorationTitle")?.innerText || "",
      transaction: document.querySelector("#payoffTransaction")?.innerText || "",
      objective: document.querySelector(".objective")?.innerText.replace(/\s+/g, " ").trim() || "",
      bouquet: document.querySelector("#bouquetProgressLabel")?.innerText.trim() || "",
      cue: document.querySelector("#firstSwapCue")?.innerText.replace(/\s+/g, " ").trim() || "",
      hintedTiles: tiles.filter((tile) => tile.classList.contains("idle-hint"))
        .map((tile) => ({ id: tile.id, x: Number(tile.dataset.x), y: Number(tile.dataset.y) })),
      buttons: visibleButtons.map((button) => button.innerText.trim().toLowerCase()),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabledTiles: tiles.filter((tile) => !tile.disabled).length,
      boardWidth: document.querySelector("#board")?.getBoundingClientRect().width || 0,
      boardHeight: document.querySelector("#board")?.getBoundingClientRect().height || 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      scrollY
    };
  }, SAVE_KEY);
}

for (const profile of PROFILES) {
  test(`structured future round reopens the honest First Bouquet on ${profile.label}`, async ({ browser }) => {
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
    const marker = `structured-future-round-${profile.label}`;
    await page.addInitScript(({ key, state, markerKey }) => {
      if (!sessionStorage.getItem(markerKey)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(markerKey, "1");
      }
    }, { key: SAVE_KEY, state: structuredFutureRoundState(), markerKey: marker });

    await page.goto(`${BASE_URL}?structured-future-round=${profile.label}`, { waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const repaired = await report(page);
    expect(repaired.stored.currentRound).toBe(1);
    expect(repaired.stored.roundComplete).toBe(false);
    expect(repaired.stored.roundOneRestored).toBe(false);
    expect(repaired.stored.roundTwoGreenhouseUpgraded).toBe(false);
    expect(repaired.stored.roundThreeConservatoryRaised).toBe(false);
    expect(repaired.stored.counts).toEqual([0, 0, 0, 0, 0, 0]);
    expect(repaired.stored.coins).toBe(0);
    expect(repaired.stored.moves).toBe(6);
    expect(repaired.greenhouseStage).toBe("withered");
    expect(repaired.objective).toContain("ROUND 1 · FIRST BOUQUET");
    expect(repaired.bouquet).toBe("BOUQUET · 0/14");
    expect(repaired.cue).toContain("Swap the glowing");
    expect(repaired.hintedTiles).toHaveLength(2);
    expect(repaired.buttons).toEqual(["skip"]);
    expect(repaired.tiles).toBe(64);
    expect(repaired.rows).toBe(8);
    expect(repaired.enabledTiles).toBe(64);
    expect(repaired.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(repaired.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(repaired.overflowX).toBe(false);
    expect(repaired.brokenImages).toEqual([]);
    if (profile.mobile) expect(repaired.scrollY).toBe(0);
    const repairedBytes = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    await page.screenshot({
      path: `work/round-identity-${profile.label}-structured-future-repaired.png`,
      fullPage: true
    });

    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(repairedBytes);
    const reloaded = await report(page);
    expect(reloaded.stored.currentRound).toBe(1);
    expect(reloaded.hintedTiles).toHaveLength(2);
    const source = reloaded.hintedTiles.find(({ id }) => id === "tile-1-0") || reloaded.hintedTiles[0];
    const destination = reloaded.hintedTiles.find(({ id }) => id !== source.id);
    if (profile.mobile) {
      await page.locator(`#${source.id}`).tap();
      await page.locator(`#${destination.id}`).tap();
    } else {
      await page.locator(`#${source.id}`).click();
      await page.locator(`#${destination.id}`).click();
    }
    await expect.poll(async () => (await report(page)).stored.moves).toBe(5);
    const continued = await report(page);
    expect(continued.stored.currentRound).toBe(1);
    expect(continued.stored.counts[5]).toBe(3);
    expect(continued.stored.coins).toBe(0);
    expect(continued.bouquet).toBe("BOUQUET · 3/14");
    expect(continued.tiles).toBe(64);
    expect(continued.rows).toBe(8);
    expect(continued.enabledTiles).toBe(64);
    expect(continued.overflowX).toBe(false);
    expect(continued.brokenImages).toEqual([]);
    expect(browserErrors).toEqual([]);
    expect(requestErrors).toEqual([]);
    await context.close();
  });

  test(`fractional Moonlit round recovers one exact order on ${profile.label}`, async ({ browser }) => {
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
    const marker = `fractional-round-${profile.label}`;
    await page.addInitScript(({ key, state, markerKey }) => {
      if (!sessionStorage.getItem(markerKey)) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem(markerKey, "1");
      }
    }, { key: SAVE_KEY, state: fractionalMoonlitState(), markerKey: marker });

    await page.goto(`${BASE_URL}?fractional-round=${profile.label}`, { waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.currentRound).toBe(2);
      expect(current.stored.roundOneRestored).toBe(true);
      expect(current.stored.roundTwoGreenhouseUpgraded).toBe(false);
      expect(current.stored.coins).toBe(170);
      expect(current.greenhouseStage).toBe("restored");
      expect(current.ceremonyTitle).toBe("Moonlit Wreath Complete");
      expect(current.transaction).toBe("EARNED 150 COINS. UPGRADE COSTS 120.");
      expect(current.buttons).toEqual(["upgrade greenhouse · 120 coins"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
      if (profile.mobile) expect(current.scrollY).toBe(0);
      if (reload === 0) {
        await page.screenshot({
          path: `work/round-identity-${profile.label}-moonlit-recovered.png`,
          fullPage: true
        });
      }
    }

    await page.getByRole("button", { name: "Upgrade Greenhouse · 120 coins", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next Order → Bloodroot Compact", exact: true }))
      .toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Next Order → Bloodroot Compact", exact: true }).click();
    await expect(page.locator(".tile:not([disabled])")).toHaveCount(64);
    const active = await report(page);
    expect(active.stored.currentRound).toBe(3);
    expect(active.stored.roundOneRestored).toBe(true);
    expect(active.stored.roundTwoGreenhouseUpgraded).toBe(true);
    expect(active.stored.coins).toBe(50);
    expect(active.greenhouseStage).toBe("moonlit");
    expect(active.tiles).toBe(64);
    expect(active.rows).toBe(8);
    expect(active.enabledTiles).toBe(64);
    expect(active.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(active.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(active.overflowX).toBe(false);
    expect(active.brokenImages).toEqual([]);
    if (profile.mobile) expect(active.scrollY).toBe(0);
    await page.screenshot({
      path: `work/round-identity-${profile.label}-bloodroot-handoff.png`,
      fullPage: true
    });
    await page.waitForTimeout(2600);
    const settled = await report(page);
    expect(settled.stored.currentRound).toBe(3);
    expect(settled.greenhouseStage).toBe("moonlit");
    expect(settled.buttons).toEqual(["help"]);
    expect(settled.enabledTiles).toBe(64);
    expect(settled.boardWidth).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(settled.boardHeight).toBeCloseTo(profile.mobile ? 378 : 600, 1);
    expect(settled.overflowX).toBe(false);
    expect(settled.brokenImages).toEqual([]);
    if (profile.mobile) expect(settled.scrollY).toBe(0);
    await page.screenshot({
      path: `work/round-identity-${profile.label}-bloodroot-active.png`,
      fullPage: true
    });
    expect(browserErrors).toEqual([]);
    expect(requestErrors).toEqual([]);
    await context.close();
  });

  test(`later legacy round still migrates to completed Bloodroot on ${profile.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const state = {
      ...fractionalMoonlitState(),
      currentRound: 4.5,
      moves: 11,
      coins: 50,
      counts: [0, 0, 0, 0, 0, 0],
      clearedCursedThorns: 0,
      roundComplete: false
    };
    const marker = `later-round-${profile.label}`;
    await page.addInitScript(({ key, saved, markerKey }) => {
      if (!sessionStorage.getItem(markerKey)) {
        localStorage.setItem(key, JSON.stringify(saved));
        sessionStorage.setItem(markerKey, "1");
      }
    }, { key: SAVE_KEY, saved: state, markerKey: marker });

    await page.goto(`${BASE_URL}?later-round=${profile.label}`, { waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    for (let reload = 0; reload < 2; reload += 1) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      const current = await report(page);
      expect(current.stored.currentRound).toBe(3);
      expect(current.stored.roundComplete).toBe(true);
      expect(current.stored.roundOneRestored).toBe(true);
      expect(current.stored.roundTwoGreenhouseUpgraded).toBe(true);
      expect(current.stored.roundThreeConservatoryRaised).toBe(true);
      expect(current.stored.coins).toBe(230);
      expect(current.greenhouseStage).toBe("bloodroot");
      expect(current.ceremonyTitle).toBe("Bloodroot Compact Complete");
      expect(current.buttons).toEqual(["play again → first bouquet"]);
      expect(current.tiles).toBe(64);
      expect(current.rows).toBe(8);
      expect(current.overflowX).toBe(false);
      expect(current.brokenImages).toEqual([]);
    }
    await context.close();
  });
}
