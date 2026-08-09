const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CONFIGS = [
  { label: "desktop-enter", viewport: { width: 1280, height: 720 }, input: "Enter" },
  { label: "desktop-space-reduced", viewport: { width: 1280, height: 720 }, input: "Space", reduced: true },
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "mobile-enter", viewport: { width: 390, height: 844 }, input: "Enter", mobile: true },
  { label: "mobile-space-reduced", viewport: { width: 390, height: 844 }, input: "Space", mobile: true, reduced: true },
  { label: "mobile-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true }
];

test.setTimeout(180000);

async function activate(page, config, locator) {
  if (config.input === "pointer") {
    await locator.click();
  } else if (config.input === "touch") {
    await locator.tap();
  } else {
    await locator.focus();
    await page.keyboard.press(config.input);
  }
}

async function report(page) {
  return page.evaluate((key) => {
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board").getBoundingClientRect();
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    return {
      save: localStorage.getItem(key),
      moves: JSON.parse(localStorage.getItem(key) || "{}").moves,
      activeId: document.activeElement?.id || "",
      rovingIds: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: board.width, height: board.height, bottom: board.bottom },
      cue: document.querySelector("#firstSwapCue")?.textContent?.trim() || "",
      settledOwner: document.body.classList.contains("settled-board-outcome-cue"),
      visiblePoliteOwners: Array.from(document.querySelectorAll('[aria-live="polite"]'))
        .filter(visible)
        .map((node) => node.id),
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

function expectBoard(state, config, label) {
  expect(state.tiles, `${label} tiles`).toBe(64);
  expect(state.rows, `${label} rows`).toBe(8);
  expect(state.board.width, `${label} board width`).toBeCloseTo(config.mobile ? 378 : 600, 1);
  expect(state.board.height, `${label} board height`).toBeCloseTo(config.mobile ? 378 : 600, 1);
  expect(state.board.bottom, `${label} board in viewport`).toBeLessThanOrEqual(config.viewport.height);
  expect(state.scrollY, `${label} scroll`).toBe(0);
  expect(state.overflowX, `${label} x overflow`).toBe(false);
  expect(state.overflowY, `${label} y overflow`).toBe(false);
  expect(state.brokenImages, `${label} images`).toEqual([]);
}

async function openNaturalShuffle(page, config) {
  await page.addInitScript((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.goto(`${BASE_URL}?shuffle-command-authority=${config.label}`, { waitUntil: "networkidle" });
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await page.locator("#tutorialSkipBtn").click();
  await page.waitForTimeout(140);
  await page.locator("#tile-1-0").click();
  await page.locator("#tile-1-1").click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").moves === 5, SAVE_KEY);
  await expect(page.locator("#shuffleBtn")).toBeVisible();
  await expect(page.locator("#shuffleBtn")).toBeEnabled();
}

for (const config of CONFIGS) {
  test(`paid Shuffle owns its rebuild before another command on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: Boolean(config.mobile),
      isMobile: Boolean(config.mobile),
      reducedMotion: config.reduced ? "reduce" : "no-preference"
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

    try {
      await openNaturalShuffle(page, config);
      await page.evaluate(() => {
        window.__shuffleReceiptMutations = [];
        const cue = document.querySelector("#firstSwapCue");
        new MutationObserver(() => {
          const text = cue.textContent.trim();
          if (text.startsWith("Board shuffled.")) window.__shuffleReceiptMutations.push(text);
        }).observe(cue, { childList: true, characterData: true, subtree: true });
      });

      const shuffle = page.locator("#shuffleBtn");
      await activate(page, config, shuffle);
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").moves === 4, SAVE_KEY);
      const pending = await report(page);
      expect(pending.settledOwner, `${config.label} owner is not exposed early`).toBe(false);
      expect(pending.cue, `${config.label} result is not populated early`).toBe("");

      await activate(page, config, shuffle);
      await page.waitForTimeout(700);
      const settled = await report(page);
      expect(settled.moves, `${config.label} repeat spends no second move`).toBe(4);
      expect(settled.save, `${config.label} repeat preserves the rebuilt board`).toBe(pending.save);
      expect(settled.activeId, `${config.label} Shuffle retains focus`).toBe("shuffleBtn");
      expect(settled.rovingIds, `${config.label} retains one board entry`).toHaveLength(1);
      expect(settled.selected, `${config.label} carries no selection`).toEqual([]);
      expect(settled.cue).toBe("Board shuffled. 4 moves left.");
      expect(settled.visiblePoliteOwners).toEqual(["firstSwapCue"]);
      expect(await page.evaluate(() => window.__shuffleReceiptMutations)).toEqual(["Board shuffled. 4 moves left."]);
      expectBoard(settled, config, `${config.label} settled`);

      await activate(page, config, shuffle);
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").moves === 3, SAVE_KEY);
      await page.waitForTimeout(700);
      const deliberate = await report(page);
      expect(deliberate.moves, `${config.label} later command spends one move`).toBe(3);
      expect(deliberate.cue).toBe("Board shuffled. 3 moves left.");
      expect(deliberate.visiblePoliteOwners).toEqual(["firstSwapCue"]);
      expect(await page.evaluate(() => window.__shuffleReceiptMutations)).toEqual([
        "Board shuffled. 4 moves left.",
        "Board shuffled. 3 moves left."
      ]);
      expectBoard(deliberate, config, `${config.label} deliberate`);
      expect(errors, `${config.label} console`).toEqual([]);
      expect(failedRequests, `${config.label} requests`).toEqual([]);

      if (["desktop-enter", "mobile-enter"].includes(config.label)) {
        await page.screenshot({
          path: `work/shuffle-command-authority-${config.label}.png`,
          fullPage: false
        });
      }
    } finally {
      await context.close();
    }
  });
}
