const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const ROUND_TWO_SAVE = {
  focusedEconomyVersion: 2,
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
  counts: [0, 0, 0, 0, 0, 0],
  cursedThorns: [0, 1, 2].map((x) => ({ x, y: 1, hp: 1 })),
  clearedCursedThorns: 0,
  currentRound: 2,
  roundComplete: false,
  roundOneRestored: true,
  roundTwoGreenhouseUpgraded: false,
  roundThreeConservatoryRaised: false,
  hasMadeValidMove: false,
  restoredRoundTwoGuideMoves: 0,
  tutorialSkipped: false,
  tutorialActive: true,
  blackCandleLessonComplete: true
};

const CASES = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, touch: true }
];

async function activate(page, selector) {
  const tile = page.locator(selector);
  await tile.click({ force: true });
}

for (const testCase of CASES) {
  test(`Cursed Thorn receipt hands back an objective pair on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.touch),
      isMobile: Boolean(testCase.touch)
    });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${failure}`);
    });

    await page.goto(`${BASE_URL}?thorn-handoff-seed=${testCase.label}`, { waitUntil: "networkidle" });
    await page.evaluate(({ key, state }) => {
      localStorage.setItem(key, JSON.stringify(state));
    }, { key: SAVE_KEY, state: ROUND_TWO_SAVE });
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
    await activate(page, '#tile-1-2');
    await activate(page, '#tile-1-3');

    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 7000 });

    const handoff = await page.evaluate(({ key }) => {
      const isVisible = (node) => {
        if (!node) return false;
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity || 1) > 0
          && rect.width > 0
          && rect.height > 0;
      };
      const board = document.querySelector("#board")?.getBoundingClientRect();
      const tiles = Array.from(document.querySelectorAll("#board .tile"));
      return {
        state: JSON.parse(localStorage.getItem(key) || "{}"),
        cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
        cueVisible: isVisible(document.querySelector("#firstSwapCue")),
        handoffActive: document.body.classList.contains("round-two-followup-cue"),
        visibleActions: Array.from(document.querySelectorAll("button:not(.tile)"))
          .filter(isVisible)
          .map((button) => button.id),
        hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
        tiles: tiles.length,
        rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
        boardBottom: board?.bottom || 0,
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        brokenImages: Array.from(document.images)
          .filter((image) => isVisible(image) && image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src"))
      };
    }, { key: SAVE_KEY });
    expect(handoff.handoffActive).toBe(true);
    expect(handoff.cueVisible).toBe(true);
    expect(handoff.cue).toMatch(/^(Nightshade|Amber Seed) next (↑↓|↔)$/);
    expect(handoff.hints).toHaveLength(2);
    expect(handoff.visibleActions).toEqual(["tutorialHelpBtn"]);
    expect(handoff.state.moves).toBe(8);
    expect(handoff.state.clearedCursedThorns).toBe(3);
    expect(handoff.tiles).toBe(64);
    expect(handoff.rows).toBe(8);
    expect(handoff.boardBottom).toBeLessThanOrEqual(testCase.viewport.height);
    expect(handoff.overflowX).toBe(false);
    expect(handoff.brokenImages).toEqual([]);
    await page.screenshot({ path: `work/round-two-thorn-handoff-${testCase.label}.png`, fullPage: true });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
    await expect(page.locator("#firstSwapCue")).toBeVisible();
    await expect(page.locator("#firstSwapCue")).toHaveText(/^(Nightshade|Amber Seed) next (↑↓|↔)$/);
    const replayCue = (await page.locator("#firstSwapCue").textContent()) || "";
    const targetIndex = replayCue.startsWith("Nightshade") ? 2 : 4;
    const beforeFollowup = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key));
      return { moves: state.moves, counts: state.counts };
    }, SAVE_KEY);
    const pair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => tile.id));
    await page.locator(`#${pair[0]}`).click({ force: true });
    await page.locator(`#${pair[1]}`).click({ force: true });
    await expect.poll(async () => page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key));
      return state.moves;
    }, SAVE_KEY), { timeout: 5000 }).toBe(beforeFollowup.moves - 1);
    const afterFollowup = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    expect(afterFollowup.counts[targetIndex]).toBeGreaterThan(beforeFollowup.counts[targetIndex]);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 7000 });
    await expect(page.locator("#firstSwapCue")).toHaveText(
      /^(?:(?:Nightshade|Amber Seed) next (?:↑↓|↔)|Swap Black Candle Vine (?:left|right|up|down) - burn this (?:row|column)\.)$/
    );
    const chainedHandoff = await page.evaluate((key) => ({
      save: localStorage.getItem(key),
      moves: JSON.parse(localStorage.getItem(key)).moves,
      active: document.activeElement?.id || "",
      hints: Array.from(document.querySelectorAll("#board .tile.idle-hint")).map((tile) => tile.id),
      handoffActive: document.body.classList.contains("focused-harvest-handoff-cue"),
      relicActive: document.body.classList.contains("armed-line-relic-cue")
    }), SAVE_KEY);
    expect(chainedHandoff.handoffActive || chainedHandoff.relicActive).toBe(true);
    expect(chainedHandoff.moves).toBe(7);
    expect(chainedHandoff.active).toBe(chainedHandoff.hints[0]);
    expect(await page.locator(".tile").count()).toBe(64);
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
    await context.close();
  });
}
