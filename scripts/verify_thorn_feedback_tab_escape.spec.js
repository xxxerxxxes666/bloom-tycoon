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
  { label: "desktop-keyboard", viewport: { width: 1280, height: 720 } },
  { label: "mobile390-keyboard-reduced", viewport: { width: 390, height: 844 }, reduced: true }
];

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => Boolean(node)
      && !node.hidden
      && getComputedStyle(node).display !== "none"
      && getComputedStyle(node).visibility !== "hidden"
      && node.getBoundingClientRect().width > 0
      && node.getBoundingClientRect().height > 0;
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const active = document.activeElement;
    return {
      state: JSON.parse(localStorage.getItem(key) || "{}"),
      activeId: active?.id || "",
      activeTag: active?.tagName || "",
      activeText: active?.textContent.replace(/\s+/g, " ").trim() || "",
      activeVisible: visible(active),
      visibleButtons: Array.from(document.querySelectorAll("button:not(.tile)"))
        .filter(visible)
        .map((button) => ({ id: button.id, text: button.textContent.replace(/\s+/g, " ").trim() })),
      thornEvents: document.querySelectorAll(".thorn-event").length,
      thornOutcomeTiles: document.querySelectorAll(".tile.thorn-hit, .tile.thorn-cleared").length,
      boardBusy: document.querySelector("#board")?.getAttribute("aria-busy") || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const testCase of CASES) {
  test(`Tab leaves the altar during Thorn feedback on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const browserErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const error = request.failure()?.errorText || "";
      if (error !== "net::ERR_ABORTED") failedRequests.push(`${request.url()} ${error}`);
    });

    try {
      await page.addInitScript(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, state: ROUND_TWO_SAVE });
      await page.goto(`${BASE_URL}?thorn-feedback-tab=${testCase.label}`, { waitUntil: "networkidle" });
      await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 7000 });
      await expect(page.locator("#tile-1-2")).toBeFocused();
      await page.keyboard.press("Enter");
      await page.locator("#tile-1-3").press("Space");
      await expect.poll(async () => {
        const peak = await report(page);
        return peak.thornEvents > 0 && peak.thornOutcomeTiles > 0;
      }, {
        message: `${testCase.label} reaches localized CRACK/BREAK feedback`,
        timeout: 12000
      }).toBe(true);

      const beforeTab = await report(page);
      expect(["", "tile-1-3"], `${testCase.label} feedback focus remains bounded`).toContain(beforeTab.activeId);
      expect(beforeTab.boardBusy, `${testCase.label} altar owns transient feedback`).toBe("true");
      const settledState = JSON.stringify(beforeTab.state);

      if (beforeTab.activeId === "tile-1-3") {
        await page.keyboard.press("ArrowRight");
        const afterLockedCommand = await report(page);
        expect(afterLockedCommand.activeId, `${testCase.label} feedback still locks board commands`)
          .toBe(beforeTab.activeId);
        expect(JSON.stringify(afterLockedCommand.state), `${testCase.label} locked command changes no state`)
          .toBe(settledState);
      }

      await page.keyboard.press("Tab");
      const afterTab = await report(page);
      expect(afterTab.activeId, `${testCase.label} Tab escapes the busy altar`).not.toBe(beforeTab.activeId);
      expect(afterTab.activeTag, `${testCase.label} Tab reaches an ordinary command`).toBe("BUTTON");
      expect(afterTab.activeVisible, `${testCase.label} focused command is visible`).toBe(true);
      expect(JSON.stringify(afterTab.state), `${testCase.label} Tab changes no accepted state`).toBe(settledState);
      expect(afterTab.thornEvents, `${testCase.label} Tab does not skip feedback`).toBeGreaterThan(0);
      expect(afterTab.tiles, `${testCase.label} retains 64 tiles`).toBe(64);
      expect(afterTab.rows, `${testCase.label} retains eight rows`).toBe(8);
      expect(afterTab.boardWidth, `${testCase.label} keeps the exact altar width`)
        .toBe(testCase.viewport.width === 390 ? 378 : 600);
      expect(afterTab.boardBottom, `${testCase.label} keeps the altar in the viewport`)
        .toBeLessThanOrEqual(testCase.viewport.height);
      expect(afterTab.overflowX, `${testCase.label} has no horizontal overflow`).toBe(false);
      expect(afterTab.overflowY, `${testCase.label} has no vertical overflow`).toBe(false);
      expect(afterTab.brokenImages, `${testCase.label} has no broken visible images`).toEqual([]);
      expect(browserErrors, `${testCase.label} browser warning/error ledger`).toEqual([]);
      expect(failedRequests, `${testCase.label} request-failure ledger`).toEqual([]);
      await page.screenshot({
        path: `test-results/thorn-feedback-tab-${testCase.label}.png`,
        fullPage: true
      });
    } finally {
      await context.close();
    }
  });
}
