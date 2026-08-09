const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-full", viewport: { width: 1280, height: 720 }, reducedMotion: "no-preference" },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" },
  { label: "mobile-full", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", mobile: true },
  { label: "mobile-reduced", viewport: { width: 390, height: 844 }, reducedMotion: "reduce", mobile: true }
];

test.setTimeout(120000);

function activeRoundThreeState(ownedReplay) {
  return {
    focusedEconomyVersion: 2,
    currentRound: 3,
    moves: 7,
    counts: [0, 0, 0, 0, 0, 0],
    coins: 50,
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: ownedReplay,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

async function openState(page, label, ownedReplay) {
  await page.addInitScript(({ key, state, marker }) => {
    if (!sessionStorage.getItem(marker)) {
      localStorage.setItem(key, JSON.stringify(state));
      sessionStorage.setItem(marker, "1");
    }
  }, {
    key: SAVE_KEY,
    state: activeRoundThreeState(ownedReplay),
    marker: `owned-match-intake-${label}-${ownedReplay}`
  });
  await page.goto(`${BASE_URL}?owned-match-intake=${label}-${ownedReplay}`, {
    waitUntil: "networkidle"
  });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 10000 });
}

async function commitHintedPair(page, mobile) {
  const hinted = page.locator(".tile.idle-hint");
  await expect(hinted).toHaveCount(2);
  const coordinates = await hinted.evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
  for (const cell of coordinates) {
    const tile = page.locator(`.tile[data-x="${cell.x}"][data-y="${cell.y}"]`);
    if (mobile) await tile.tap();
    else await tile.click();
  }
}

async function boardReport(page) {
  return page.evaluate(() => {
    const board = document.querySelector("#board");
    const bounds = board.getBoundingClientRect();
    const state = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}");
    const dial = [
      document.querySelector("#heroRestorationDial"),
      document.querySelector("#mobileRestorationDial")
    ].find((node) => {
      const rect = node?.getBoundingClientRect();
      const style = node ? getComputedStyle(node) : null;
      return rect?.width > 0 && rect?.height > 0 && style?.display !== "none";
    });
    return {
      moves: state.moves,
      counts: state.counts,
      classes: document.body.className,
      flights: document.querySelectorAll(".greenhouse-intake-flight").length,
      dialBorder: dial ? getComputedStyle(dial).borderColor : "",
      dialTransitionDuration: dial ? getComputedStyle(dial).transitionDuration : "",
      tiles: document.querySelectorAll(".tile").length,
      rows: new Set(Array.from(document.querySelectorAll(".tile"), (tile) => tile.dataset.y)).size,
      roving: document.querySelectorAll('.tile[tabindex="0"]').length,
      focused: document.activeElement?.id || "",
      boardWidth: bounds.width,
      boardHeight: bounds.height,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  });
}

for (const config of CASES) {
  test(`owned replay target matches visibly feed the conservatory on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      reducedMotion: config.reducedMotion,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile)
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await openState(page, config.label, true);
    const before = await boardReport(page);
    await commitHintedPair(page, config.mobile);
    await expect(page.locator("body")).toHaveClass(/owned-replay-match-intake/, { timeout: 10000 });
    const response = await boardReport(page);
    expect(response.moves).toBe(before.moves - 1);
    expect(response.counts.reduce((sum, count) => sum + count, 0))
      .toBeGreaterThan(before.counts.reduce((sum, count) => sum + count, 0));
    expect(response.classes).toContain("greenhouse-intake");
    expect(response.dialBorder).toBe("rgb(215, 177, 109)");
    if (config.reducedMotion === "reduce") {
      expect(response.flights).toBe(0);
      expect(response.dialTransitionDuration).toBe("0s");
    } else {
      expect(response.flights).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: `work/owned-replay-match-intake-${config.label}-response.png`,
      fullPage: true
    });

    await expect(page.locator("body")).not.toHaveClass(/owned-replay-match-intake/, { timeout: 3000 });
    await expect(page.locator(".greenhouse-intake-flight")).toHaveCount(0);
    const settled = await boardReport(page);
    expect(settled.tiles).toBe(64);
    expect(settled.rows).toBe(8);
    expect(settled.roving).toBe(1);
    expect(settled.focused).toMatch(/^tile-\d-\d$/);
    expect(settled.boardWidth).toBeCloseTo(config.mobile ? 378 : 600, 0);
    expect(settled.boardHeight).toBeCloseTo(config.mobile ? 378 : 600, 0);
    expect(settled.overflowX).toBe(false);
    expect(settled.overflowY).toBe(false);
    expect(settled.brokenImages).toEqual([]);
    await page.screenshot({
      path: `work/owned-replay-match-intake-${config.label}-settled.png`,
      fullPage: true
    });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toHaveClass(/owned-replay-match-intake/);
    await expect(page.locator(".greenhouse-intake-flight")).toHaveCount(0);
    expect((await boardReport(page)).moves).toBe(response.moves);
    expect(runtimeErrors).toEqual([]);
    await context.close();
  });
}

for (const config of CASES.filter((candidate) => !candidate.reducedMotion.includes("reduce"))) {
  test(`first ownership target matches keep greenhouse intake reserved for spend on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile)
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await openState(page, `${config.label}-first-cycle`, false);
    const before = await boardReport(page);
    await commitHintedPair(page, config.mobile);
    await expect(page.locator(".tile:not(:disabled)")).toHaveCount(64, { timeout: 10000 });
    await page.waitForTimeout(700);
    const after = await boardReport(page);
    expect(after.moves).toBe(before.moves - 1);
    expect(after.classes).not.toContain("owned-replay-match-intake");
    expect(after.flights).toBe(0);
    expect(runtimeErrors).toEqual([]);
    await context.close();
  });
}
