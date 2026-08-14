const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const DAMAGED_ROUND_TWO_SAVE = {
  focusedEconomyVersion: 3,
  board: [
    [2, 3, 2, 1, 4, 5, 4, 4],
    [3, 4, 5, 0, 0, 4, 1, 0],
    [2, 3, 2, 4, 5, 2, 1, 3],
    [5, 2, 0, 5, 4, 0, 2, 5],
    [4, 5, 3, 5, 2, 4, 5, 2],
    [5, 2, 2, 0, 4, 5, 3, 3],
    [2, 4, 3, 2, 2, 1, 2, 2],
    [0, 3, 0, 4, 4, 0, 5, 1]
  ],
  armedLineRelic: null,
  moves: 9,
  coins: 20,
  counts: [0, 0, 10, 0, 9, 7],
  cursedThorns: [{ x: 0, y: 1, hp: 1 }],
  clearedCursedThorns: 0,
  currentRound: 2,
  roundComplete: false,
  roundOneRestored: true,
  roundTwoGreenhouseUpgraded: false,
  roundThreeConservatoryRaised: false,
  freshConservatorySettlement: false,
  hasMadeValidMove: true,
  restoredRoundTwoGuideMoves: 0,
  tutorialSkipped: false,
  tutorialActive: true,
  blackCandleLessonComplete: true
};

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

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
      bouquetProgress: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      commands: [...document.querySelectorAll("button:not(.tile)")]
        .filter(visible)
        .map((button) => button.textContent.trim()),
      thornCells: tiles.filter((tile) => tile.classList.contains("cursed-thorn"))
        .map((tile) => [Number(tile.dataset.x), Number(tile.dataset.y)]),
      guideCells: tiles.filter((tile) => tile.classList.contains("thorn-teach"))
        .map((tile) => [Number(tile.dataset.x), Number(tile.dataset.y)]),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabledTiles: tiles.filter((tile) => tile.disabled).length,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const viewportCase of VIEWPORTS) {
  test(`partial Thorn inventory repairs and remains finishable on ${viewportCase.label}`, async ({ browser }) => {
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
        state: DAMAGED_ROUND_TWO_SAVE,
        marker: `partial-thorn-repair-${viewportCase.label}`
      });
      await page.goto(`${BASE_URL}?partial-thorn-repair=${viewportCase.label}`, {
        waitUntil: "networkidle"
      });
      await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });

      const repaired = await report(page);
      expect(repaired.state.cursedThorns).toEqual([
        { x: 0, y: 1, hp: 1 },
        { x: 1, y: 1, hp: 1 },
        { x: 2, y: 1, hp: 1 }
      ]);
      expect(repaired.state.clearedCursedThorns).toBe(0);
      expect(repaired.thornCells).toEqual([[0, 1], [1, 1], [2, 1]]);
      expect(repaired.guideCells).toEqual([[1, 2], [1, 3]]);
      expect(repaired.message).toContain("Saved order repaired.");
      expect(repaired.bouquetProgress).toBe("Bouquet · 26/29");
      expect(repaired.commands.some((command) => command.includes("Upgrade Greenhouse"))).toBe(false);
      expect(repaired.tiles).toBe(64);
      expect(repaired.rows).toBe(8);
      expect(repaired.disabledTiles).toBe(0);
      expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 2);
      expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
      expect(repaired.overflowX).toBe(false);
      if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
      expect(repaired.brokenImages).toEqual([]);
      expect(problems).toEqual([]);

      const canonicalSave = repaired.save;
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
      expect((await report(page)).save).toBe(canonicalSave);

      const source = page.locator("#tile-1-2");
      const target = page.locator("#tile-1-3");
      if (viewportCase.mobile) {
        await source.tap();
        await target.tap();
      } else {
        await source.click();
        await target.click();
      }
      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 8
          && state.clearedCursedThorns === 3
          && state.cursedThorns.length === 0
          && state.roundComplete === true
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      await expect(page.locator("#restoreGreenhouseBtn")).toContainText("Upgrade Greenhouse", {
        timeout: 7000
      });
      await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible();

      const completed = await report(page);
      expect(completed.state.clearedCursedThorns).toBe(3);
      expect(completed.state.cursedThorns).toEqual([]);
      expect(completed.state.roundComplete).toBe(true);
      expect(completed.commands.some((command) => command.includes("Upgrade Greenhouse"))).toBe(true);
      expect(completed.tiles).toBe(64);
      expect(completed.rows).toBe(8);
      expect(completed.overflowX).toBe(false);
      expect(completed.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
