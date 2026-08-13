const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-pointer", viewport: { width: 1280, height: 720 }, input: "pointer", eager: true },
  { label: "desktop-keyboard-reduced", viewport: { width: 1280, height: 720 }, input: "keyboard", reduced: true },
  { label: "mobile390-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, eager: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
].filter(({ label }) => !process.env.BLOOM_TEST_CASE || label === process.env.BLOOM_TEST_CASE);

test.setTimeout(120000);

async function activate(page, locator, input) {
  if (input === "touch") {
    await locator.tap();
    return;
  }
  if (input === "keyboard") {
    await locator.focus();
    await page.keyboard.press("Enter");
    return;
  }
  await locator.click();
}

async function hintedPair(page) {
  await expect(page.locator("#board .tile.idle-hint")).toHaveCount(2, { timeout: 9000 });
  return page.locator("#board .tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y)
  })));
}

async function activatePair(page, pair, input) {
  const tile = ({ x, y }) => page.locator(`.tile[data-x="${x}"][data-y="${y}"]`);
  await activate(page, tile(pair[0]), input);
  await expect(tile(pair[0])).toHaveClass(/\bsel\b/);
  await activate(page, tile(pair[1]), input);
}

async function completeRoundOne(page, input) {
  for (let move = 0; move < 6; move += 1) {
    const complete = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").roundComplete === true
    ), SAVE_KEY);
    if (complete) break;
    const pair = await hintedPair(page);
    const beforeMoves = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").moves
    ), SAVE_KEY);
    await activatePair(page, pair, input);
    await page.waitForFunction(({ key, beforeMoves }) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      return state.moves === beforeMoves - 1
        && (state.roundComplete || Array.from(document.querySelectorAll("#board .tile")).every((tile) => !tile.disabled));
    }, { key: SAVE_KEY, beforeMoves }, { timeout: 12000 });
  }
  await expect(page.locator("#restoreGreenhouseBtn")).toBeVisible({ timeout: 9000 });
}

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node || node.hidden) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board")?.getBoundingClientRect();
    const completeRows = new Set(tiles.filter((tile) => {
      const rect = tile.getBoundingClientRect();
      return rect.top >= -1 && rect.bottom <= innerHeight + 1;
    }).map((tile) => tile.dataset.y));
    const completeColumns = new Set(tiles.filter((tile) => {
      const rect = tile.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1;
    }).map((tile) => tile.dataset.x));
    return {
      state,
      save: localStorage.getItem(key),
      handoff: document.body.classList.contains("restored-greenhouse-handoff"),
      cue: document.querySelector("#nextOrderCue")?.textContent.trim() || "",
      cueVisible: visible(document.querySelector("#nextOrderCue")),
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      firstCueVisible: visible(document.querySelector("#firstSwapCue")),
      liveOwners: Array.from(document.querySelectorAll("[aria-live]"))
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => ({ id: node.id, live: node.getAttribute("aria-live") })),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      completeRows: completeRows.size,
      completeColumns: completeColumns.size,
      boardWidth: board?.width || 0,
      boardBottom: board?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      hintCount: document.querySelectorAll("#board .tile.idle-hint").length,
      thornTeach: document.querySelectorAll("#board .tile.thorn-teach").length,
      thornMarks: document.querySelectorAll("#board .tile.thorn-teach-blocker").length
    };
  }, SAVE_KEY);
}

function expectBoard(reportValue, testCase, phase) {
  expect(reportValue.tiles, `${phase} keeps 64 tiles`).toBe(64);
  expect(reportValue.rows, `${phase} keeps eight rows`).toBe(8);
  expect(reportValue.completeRows, `${phase} shows eight complete rows`).toBe(8);
  expect(reportValue.completeColumns, `${phase} shows eight complete columns`).toBe(8);
  expect(reportValue.boardWidth, `${phase} keeps the exact altar width`).toBe(testCase.mobile ? 378 : 600);
  expect(reportValue.boardBottom, `${phase} keeps the altar in the first viewport`).toBeLessThanOrEqual(testCase.viewport.height);
  expect(reportValue.scrollY, `${phase} remains at the top`).toBe(0);
  expect(reportValue.overflowX, `${phase} has no horizontal overflow`).toBe(false);
  expect(reportValue.brokenImages, `${phase} has no broken visible images`).toEqual([]);
}

for (const testCase of CASES) {
  test(`restoration introduces Moonlit Wreath on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      const replacedSeal = failure === "net::ERR_ABORTED"
        && /\/assets\/tiles\/altar\/cursed_thorn_seal\.svg$/.test(request.url());
      if (!replacedSeal) errors.push(`${request.url()} ${failure}`);
    });

    try {
      await page.addInitScript(({ key, label }) => {
        localStorage.removeItem(key);
        let seed = 0;
        for (const character of label) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
        Math.random = () => {
          seed = (1664525 * seed + 1013904223) >>> 0;
          return seed / 4294967296;
        };
      }, { key: SAVE_KEY, label: `moonlit-arrival-${testCase.label}` });
      await page.goto(`${BASE_URL}?moonlit-arrival=${testCase.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#board .tile")).toHaveCount(64);
      await completeRoundOne(page, testCase.input);
      await activate(page, page.locator("#restoreGreenhouseBtn"), testCase.input);
      await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 9000 });
      await activate(page, page.locator("#nextOrderBtn"), testCase.input);

      await expect(page.locator("body")).toHaveClass(/\brestored-greenhouse-handoff\b/);
      let arrival = await report(page);
      expect(arrival.cue).toBe("Restored Greenhouse · Moonlit Wreath · Match beside thorns");
      expect(arrival.cueVisible).toBe(true);
      expect(arrival.tutorialVisible).toBe(false);
      expect(arrival.firstCueVisible).toBe(false);
      expect(arrival.liveOwners).toEqual([{ id: "nextOrderCue", live: "polite" }]);
      expect(arrival.state).toMatchObject({
        currentRound: 2,
        moves: 9,
        coins: 20,
        counts: [0, 0, 0, 0, 0, 0],
        roundComplete: false,
        roundOneRestored: true,
        roundTwoGreenhouseUpgraded: false,
        hasMadeValidMove: false
      });
      expect(arrival.state.cursedThorns).toHaveLength(3);
      expectBoard(arrival, testCase, `${testCase.label} arrival`);
      await page.screenshot({ path: `work/moonlit-arrival-${testCase.label}.png` });

      if (testCase.eager) {
        const before = arrival.state;
        await page.waitForTimeout(520);
        await activatePair(page, await hintedPair(page), testCase.input);
        await expect(page.locator("body")).not.toHaveClass(/\brestored-greenhouse-handoff\b/, { timeout: 1200 });
        await page.waitForFunction(({ key, moves }) => {
          const state = JSON.parse(localStorage.getItem(key) || "{}");
          return state.moves === moves - 1 && state.cursedThorns.length === 0
            && Array.from(document.querySelectorAll("#board .tile")).every((tile) => !tile.disabled);
        }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
        const eager = await report(page);
        expect(eager.cueVisible).toBe(false);
        expect(eager.state.currentRound).toBe(2);
        expect(eager.state.moves).toBe(8);
        expect(eager.state.cursedThorns).toHaveLength(0);
        expect(eager.state.hasMadeValidMove).toBe(true);
        expectBoard(eager, testCase, `${testCase.label} eager match`);
      } else {
        const arrivalSave = arrival.save;
        await expect(page.locator("body")).not.toHaveClass(/\brestored-greenhouse-handoff\b/, { timeout: 3200 });
        await expect(page.locator("#tutorialCopy")).toHaveText("Match beside the Thorn.");
        await expect(page.locator("#board .tile.thorn-teach")).toHaveCount(2);
        const settled = await report(page);
        expect(settled.cueVisible).toBe(false);
        expect(settled.tutorialVisible).toBe(true);
        expect(settled.thornTeach).toBe(2);
        expect(settled.thornMarks).toBe(3);
        expect(settled.save, `${testCase.label} passive handoff does not mutate save`).toBe(arrivalSave);
        expect(settled.liveOwners).toEqual([{ id: "tutorialPanel", live: "polite" }]);
        expectBoard(settled, testCase, `${testCase.label} settled lesson`);
      }

      expect(errors, `${testCase.label} browser errors`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
