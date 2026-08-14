const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4180/playable/midnight_bloom_prototype.html";
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
const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 } }
];

test.setTimeout(60000);

async function seedDamagedRelicSave(page, label) {
  await page.goto(`${BASE_URL}?armed-relic-recovery=${label}`, { waitUntil: "networkidle" });
  await page.evaluate(({ key, board }) => {
    localStorage.setItem(key, JSON.stringify({
      focusedEconomyVersion: 3,
      board,
      armedLineRelic: {
        x: "3",
        y: "4",
        direction: "diagonal",
        flowerId: 999
      },
      moves: 3,
      coins: 0,
      counts: [0, 4, 0, 0, 0, 8],
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
      tutorialSkipped: false,
      tutorialActive: true,
      blackCandleLessonComplete: false
    }));
  }, { key: SAVE_KEY, board: FIXTURE_BOARD });
  await page.reload({ waitUntil: "networkidle" });
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const brokenImages = Array.from(document.images)
      .filter((image) => {
        const style = getComputedStyle(image);
        return style.display !== "none" && style.visibility !== "hidden"
          && (!image.complete || image.naturalWidth === 0);
      })
      .map((image) => image.currentSrc || image.src);
    const hinted = Array.from(document.querySelectorAll("#board .tile.idle-hint"));
    return {
      raw: localStorage.getItem(key),
      state: JSON.parse(localStorage.getItem(key) || "{}"),
      tileCount: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      relics: document.querySelectorAll('.tile[data-line-relic="black-candle-vine"]').length,
      relicDirection: document.querySelector('.tile[data-line-relic="black-candle-vine"]')?.dataset.lineRelicDirection,
      laneCells: document.querySelectorAll(".tile.line-relic-lane-preview").length,
      hinted: hinted.map((tile) => ({ x: Number(tile.dataset.x), y: Number(tile.dataset.y) })),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim(),
      ritual: document.querySelector("#ritualLog")?.textContent.trim(),
      activeId: document.activeElement?.id,
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      },
      brokenImages
    };
  }, SAVE_KEY);
}

async function commitHintedPair(page, pair) {
  await page.locator(`#tile-${pair[0].x}-${pair[0].y}`).click();
  await page.locator(`#tile-${pair[1].x}-${pair[1].y}`).click();
  await page.waitForFunction((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return state.moves === 2
      && state.armedLineRelic === null
      && document.querySelectorAll("#board .tile").length === 64
      && Array.from(document.querySelectorAll("#board .tile")).every((tile) => !tile.disabled);
  }, SAVE_KEY, { timeout: 15000 });
}

for (const profile of VIEWPORTS) {
  test(`${profile.label} repairs, persists, and activates a damaged saved Black Candle exactly once`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: profile.viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await seedDamagedRelicSave(page, profile.label);
    await expect(page.locator("#board .tile")).toHaveCount(64);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
    await expect(page.locator(".tile.line-relic-lane-preview")).toHaveCount(8);
    await expect(page.locator("#ritualLog")).toContainText("Saved order repaired.");

    const repaired = await report(page);
    expect(repaired.tileCount).toBe(64);
    expect(repaired.rows).toBe(8);
    expect(repaired.disabled).toBe(0);
    expect(repaired.relics).toBe(1);
    expect(repaired.relicDirection).toBe("horizontal");
    expect(repaired.laneCells).toBe(8);
    expect(repaired.hinted).toHaveLength(2);
    expect(repaired.cue).toContain("Black Candle Vine");
    expect(repaired.state.armedLineRelic).toEqual({
      x: 3,
      y: 4,
      direction: "horizontal",
      flowerId: FIXTURE_BOARD[4][3]
    });
    expect(repaired.state.moves).toBe(3);
    expect(repaired.state.counts).toEqual([0, 4, 0, 0, 0, 8]);
    expect(repaired.roving).toEqual(["tile-3-4"]);
    expect(repaired.activeId).toBe("tile-3-4");
    expect(repaired.viewport.scrollWidth).toBe(repaired.viewport.width);
    if (profile.label === "mobile390") {
      expect(repaired.viewport.width).toBe(390);
      expect(repaired.viewport.height).toBe(844);
      expect(repaired.viewport.scrollHeight).toBeLessThanOrEqual(844);
    }
    expect(repaired.brokenImages).toEqual([]);

    await page.screenshot({ path: `work/armed-relic-repaired-${profile.label}.png`, fullPage: false });
    await page.reload({ waitUntil: "networkidle" });
    const stable = await report(page);
    expect(stable.raw).toBe(repaired.raw);
    expect(stable.ritual).not.toContain("Saved order repaired.");
    expect(stable.relics).toBe(1);
    expect(stable.laneCells).toBe(8);

    await commitHintedPair(page, stable.hinted);
    const activated = await report(page);
    expect(activated.state.moves).toBe(2);
    expect(activated.state.armedLineRelic).toBeNull();
    expect(activated.state.counts.reduce((total, count) => total + count, 0)).toBe(20);
    expect(activated.state.coins).toBe(0);
    expect(activated.relics).toBe(0);
    expect(activated.tileCount).toBe(64);
    expect(activated.rows).toBe(8);
    expect(activated.disabled).toBe(0);
    expect(activated.brokenImages).toEqual([]);
    expect(activated.viewport.scrollWidth).toBe(activated.viewport.width);
    if (profile.label === "mobile390") {
      expect(activated.viewport.scrollHeight).toBeLessThanOrEqual(844);
    }
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    await page.screenshot({ path: `work/armed-relic-activated-${profile.label}.png`, fullPage: false });
    await page.reload({ waitUntil: "networkidle" });
    const activatedReload = await report(page);
    expect(activatedReload.raw).toBe(activated.raw);
    expect(activatedReload.state.moves).toBe(2);
    expect(activatedReload.state.armedLineRelic).toBeNull();
    expect(activatedReload.state.counts.reduce((total, count) => total + count, 0)).toBe(20);
    expect(activatedReload.state.coins).toBe(0);
    expect(activatedReload.hinted).toEqual(activated.hinted);
    expect(activatedReload.cue).toBe(activated.cue);
    expect(activatedReload.activeId).toBe(activated.activeId);
    expect(activatedReload.roving).toEqual(activated.roving);
    expect(activatedReload.tileCount).toBe(64);
    expect(activatedReload.rows).toBe(8);
    expect(activatedReload.disabled).toBe(0);
    expect(activatedReload.brokenImages).toEqual([]);
    expect(activatedReload.viewport.scrollWidth).toBe(activatedReload.viewport.width);
    if (profile.label === "mobile390") {
      expect(activatedReload.viewport.scrollHeight).toBeLessThanOrEqual(844);
    }
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    await page.screenshot({ path: `work/armed-relic-reloaded-${profile.label}.png`, fullPage: false });
    await context.close();
  });
}
