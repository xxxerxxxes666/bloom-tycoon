const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const PROMPT = "Match 4 Bone Stars to arm Black Candle Vine.";
const CUE = "Make 4 Bone Stars - arm Black Candle Vine.";

test.setTimeout(90000);

async function seedDeterministicMath(page, seedLabel) {
  await page.addInitScript((label) => {
    let seed = 0;
    for (let index = 0; index < label.length; index += 1) {
      seed = (seed * 31 + label.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, seedLabel);
}

async function openFresh(page, suffix) {
  await page.goto(`${BASE_URL}?black-candle-prompt=${suffix}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
}

async function savedState(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), SAVE_KEY);
}

async function hintedPair(page) {
  return page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y),
    id: tile.id
  })));
}

async function commitPair(page, pair, input) {
  const before = await savedState(page);
  const source = page.locator(`#tile-${pair[0].x}-${pair[0].y}`);
  const destination = page.locator(`#tile-${pair[1].x}-${pair[1].y}`);
  if (input === "keyboard") {
    await source.focus();
    await page.keyboard.press("Enter");
    await expect(destination).toBeFocused();
    await page.keyboard.press("Space");
  } else {
    await source.click();
    await destination.click();
  }
  await page.waitForFunction(({ key, moves }) => {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return saved.moves === moves - 1
      && document.querySelectorAll("#board .tile").length === 64
      && Array.from(document.querySelectorAll("#board .tile")).every((tile) => !tile.disabled);
  }, { key: SAVE_KEY, moves: before.moves }, { timeout: 12000 });
  return before;
}

async function lessonReport(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("#tutorialPanel");
    const copy = document.querySelector("#tutorialCopy");
    const skip = document.querySelector("#tutorialSkipBtn");
    const board = document.querySelector("#board");
    const panelRect = panel.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    const skipRect = skip.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden"
        && rect.width > 0 && rect.height > 0;
    };
    return {
      prompt: copy.textContent.trim(),
      cue: document.querySelector("#firstSwapCue").textContent.trim(),
      panelVisible: visible(panel),
      copySkipOverlap: !(
        copyRect.right <= skipRect.left
        || skipRect.right <= copyRect.left
        || copyRect.bottom <= skipRect.top
        || skipRect.bottom <= copyRect.top
      ),
      panelBottom: Math.round(panelRect.bottom),
      boardTop: Math.round(boardRect.top),
      boardWidth: Math.round(boardRect.width),
      boardHeight: Math.round(boardRect.height),
      tiles: document.querySelectorAll("#board .tile").length,
      rows: new Set(Array.from(document.querySelectorAll("#board .tile"), (tile) => tile.dataset.y)).size,
      hints: Array.from(document.querySelectorAll(".tile.idle-hint"), (tile) => tile.id),
      roving: Array.from(document.querySelectorAll("#board .tile[tabindex='0']"), (tile) => tile.id),
      focused: document.activeElement?.id || "",
      selected: document.querySelectorAll("#board .tile.sel").length,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      liveOwners: Array.from(document.querySelectorAll('[aria-live="polite"]'))
        .filter(visible)
        .map((node) => ({ id: node.id, text: node.innerText.trim() }))
    };
  });
}

for (const config of [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, reduced: false, input: "pointer" },
  { label: "desktop-reduced-keyboard", viewport: { width: 1280, height: 720 }, reduced: true, input: "keyboard" },
  { label: "mobile390-full-pointer", viewport: { width: 390, height: 844 }, reduced: false, input: "pointer" },
  { label: "mobile390-reduced-keyboard", viewport: { width: 390, height: 844 }, reduced: true, input: "keyboard" }
]) {
  test(`Black Candle formation names its flower and result on ${config.label}`, async ({ page }) => {
    const warnings = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) warnings.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") {
        failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`);
      }
    });

    await page.setViewportSize(config.viewport);
    await page.emulateMedia({ reducedMotion: config.reduced ? "reduce" : "no-preference" });
    await seedDeterministicMath(
      page,
      config.viewport.width === 390 ? "fresh-black-candle-mobile390" : "fresh-black-candle-desktop"
    );
    await openFresh(page, config.label);

    await expect(page.locator(".tile.idle-hint")).toHaveCount(2);
    await commitPair(page, await hintedPair(page), config.input);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 9500 });
    await commitPair(page, await hintedPair(page), config.input);
    await expect(page.locator("#tutorialCopy")).toHaveText(PROMPT);
    await expect(page.locator("#firstSwapCue")).toHaveText(CUE);

    const expectedPair = await hintedPair(page);
    expect(expectedPair).toHaveLength(2);
    const beforeFormation = await savedState(page);
    expect(beforeFormation.moves).toBe(4);

    let authoritativeSave = "";
    for (let reload = 0; reload < 2; reload += 1) {
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#tutorialCopy")).toHaveText(PROMPT);
      await expect(page.locator("#firstSwapCue")).toHaveText(CUE);
      expect(await hintedPair(page)).toEqual(expectedPair);
      const currentSave = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      if (reload === 0) authoritativeSave = currentSave;
      else expect(currentSave).toBe(authoritativeSave);
    }

    const report = await lessonReport(page);
    expect(report.prompt).toBe(PROMPT);
    expect(report.cue).toBe(CUE);
    expect(report.panelVisible).toBe(true);
    expect(report.copySkipOverlap).toBe(false);
    expect(report.panelBottom).toBeLessThanOrEqual(report.boardTop);
    expect(report.boardWidth).toBe(config.viewport.width === 390 ? 378 : 600);
    expect(report.boardHeight).toBe(report.boardWidth);
    expect(report.tiles).toBe(64);
    expect(report.rows).toBe(8);
    expect(report.hints).toEqual(expectedPair.map((cell) => cell.id));
    expect(report.roving).toEqual([expectedPair[0].id]);
    expect([expectedPair[0].id, "tutorialSkipBtn"]).toContain(report.focused);
    expect(report.selected).toBe(0);
    expect(report.scrollY).toBe(0);
    expect(report.overflowX).toBe(false);
    expect(report.brokenImages).toEqual([]);
    expect(report.liveOwners).toEqual([{ id: "tutorialPanel", text: `✦\n${PROMPT}\nSKIP` }]);

    await page.locator("#tutorialSkipBtn").click();
    await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
    await page.locator("#tutorialHelpBtn").click();
    await expect(page.locator("#tutorialCopy")).toHaveText(PROMPT);
    await expect(page.locator("#firstSwapCue")).toHaveText(CUE);
    await expect(page.locator(".tile.idle-hint")).toHaveCount(2, { timeout: 3000 });
    expect(await hintedPair(page)).toEqual(expectedPair);

    await commitPair(page, expectedPair, config.input);
    await expect(page.locator('.tile[data-line-relic="black-candle-vine"]')).toHaveCount(1);
    const formed = await savedState(page);
    expect(formed.moves).toBe(3);
    expect(formed.counts[1] - beforeFormation.counts[1]).toBe(4);
    await expect(page.locator("#tutorialCopy")).toHaveText("Swap right to burn this row.");
    await expect(page.locator("#board .tile")).toHaveCount(64);
    expect(warnings).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
