const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(90000);

async function openFresh(page, suffix) {
  await page.goto(`${BASE_URL}?tutorial-progress=${suffix}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function visibleReport(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const bars = Array.from(document.querySelectorAll(
      ".progress-meter, .restoration-dial-track, .vial-meter, .restored-greenhouse-meter, .greenhouse-payoff-fill, .greenhouse-upgrade-ladder"
    )).filter(visible);
    const tutorialPanel = document.querySelector("#tutorialPanel");
    const tutorialRect = tutorialPanel?.getBoundingClientRect();
    const brokenImages = Array.from(document.images)
      .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    return {
      tiles: document.querySelectorAll(".tile").length,
      idleHints: document.querySelectorAll(".tile.idle-hint").length,
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialInViewport: visible(tutorialPanel)
        && tutorialRect.top >= 0
        && tutorialRect.bottom <= innerHeight,
      visibleInstructionCues: [
        document.querySelector("#firstSwapCue"),
        tutorialPanel
      ].filter(visible).length,
      tutorialText: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialPrompt: document.body.dataset.tutorialPrompt || "",
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      tutorialSpotlights: document.querySelectorAll(
        ".tile.idle-hint, .tile.thorn-teach, .tile.thorn-teach-blocker"
      ).length,
      bouquetText: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      bouquetNext: document.querySelector("#bouquetProgressNext")?.textContent.trim() || "",
      greenhouseText: document.querySelector(".restoration-dial-phase")?.textContent.trim() || "",
      visibleProgressText: document.body.innerText,
      bars: bars.map((node) => node.className),
      round: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").currentRound || 1,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages
    };
  });
}

async function clickGuidedSwap(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  await hints.nth(0).click({ force: true });
  await hints.nth(1).click({ force: true });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function keyboardGuidedSwap(page) {
  const pair = await page.locator(".tile.idle-hint").evaluateAll((tiles) => tiles.map((tile) => ({
    x: Number(tile.dataset.x),
    y: Number(tile.dataset.y),
    focusable: tile.getAttribute("tabindex") === "0"
  })));
  expect(pair).toHaveLength(2);
  const first = pair.find((tile) => tile.focusable) || pair[0];
  const second = pair.find((tile) => tile.x !== first.x || tile.y !== first.y);
  const key = second.x > first.x
    ? "ArrowRight"
    : second.x < first.x
      ? "ArrowLeft"
      : second.y > first.y
        ? "ArrowDown"
        : "ArrowUp";
  const firstTile = page.locator(`.tile[data-x="${first.x}"][data-y="${first.y}"]`);
  await expect(firstTile).toHaveAttribute("tabindex", "0");
  await firstTile.focus();
  await page.keyboard.press("Enter");
  await expect(firstTile).toHaveClass(/sel/);
  await expect(firstTile).toBeFocused();
  await page.keyboard.press(key);
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(() => !document.querySelector(".tile.sel"));
}

async function completeRoundWithReviewKey(page) {
  await page.waitForFunction(() => !document.querySelector("#demoCompleteBtn")?.disabled, null, { timeout: 7000 });
  await page.evaluate(() => document.querySelector("#demoCompleteBtn").click());
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function forceActiveBouquetFailure(page) {
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.roundComplete = false;
    state.moves = 0;
    state.tutorialSkipped = false;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
}

test("fresh tutorial is skippable, replayable, and tied to concrete progress", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page, "mobile390");

  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  await expect(page.locator(".tile.idle-hint")).toHaveCount(2);
  let report = await visibleReport(page);
  expect(report).toMatchObject({
    tiles: 64,
    idleHints: 2,
    tutorialVisible: true,
    tutorialInViewport: true,
    visibleInstructionCues: 1,
    bouquetText: "Bouquet 0/14 -> +120 coins",
    greenhouseText: "Restore First Bouquet Glass",
    overflowX: false,
    brokenImages: []
  });
  expect(report.bars, "exactly bouquet and greenhouse bars").toHaveLength(2);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeHidden({ timeout: 1200 });

  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  await clickGuidedSwap(page);
  await expect(page.locator("#bouquetProgressLabel")).toContainText(/Bouquet [1-9]/);
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match 4 makes/);

  await completeRoundWithReviewKey(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#bouquetProgressNext")).toContainText("Coins ready -> Restore First Bouquet Glass");
  await page.locator("#restoreGreenhouseBtn").click();
  await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 5000 });
  await page.locator("#nextOrderBtn").click();
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialCopy")).toHaveText("Match beside thorns.");
  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.greenhouseText).toBe("Unlock Bloodroot Compact");
  expect(report.tutorialPrompt).toBe("Match beside thorns.");
  expect(report.tutorialSpotlights).toBeGreaterThanOrEqual(3);
  expect(report.bars, "Round 2 still has one bouquet bar and one greenhouse bar").toHaveLength(2);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await forceActiveBouquetFailure(page);
  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialCopy")).toHaveText("Moves ended. Retry the bouquet.");
  report = await visibleReport(page);
  expect(report.retryVisible).toBe(true);
  expect(report.tutorialPrompt).toBe("Moves ended. Retry the bouquet.");
  await page.locator("#renewBtn.visible").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Match beside thorns.");
  await expect(page.locator(".tile.thorn-teach")).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator(".tile.thorn-teach-blocker")).not.toHaveCount(0);
  report = await visibleReport(page);
  expect(report.tiles).toBe(64);
  expect(report.tutorialSpotlights).toBeGreaterThanOrEqual(3);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("keyboard play follows the board and payoff focus", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page, "keyboard");
  await expect(page.locator("#board")).toHaveAttribute("role", "grid");
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await keyboardGuidedSwap(page);
  await expect(page.locator("#bouquetProgressLabel")).toContainText(/Bouquet [1-9]/);
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);

  await completeRoundWithReviewKey(page);
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();

  const report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.tiles).toBe(64);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
