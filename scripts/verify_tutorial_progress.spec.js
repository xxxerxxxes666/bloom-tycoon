const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const FOCUSED_ECONOMY_VERSION = 1;
const LEGACY_ECONOMY_CASES = [
  {
    label: "active-round-one",
    state: { currentRound: 1, roundComplete: false, moves: 6, counts: [0, 0, 0, 0, 0, 0] },
    coins: 0
  },
  {
    label: "round-one-payoff",
    state: { currentRound: 1, roundComplete: true, roundOneRestored: false, moves: 2, counts: [0, 6, 0, 0, 0, 8] },
    coins: 120,
    action: "Restore Greenhouse · 100 coins",
    transaction: "Earned 120 coins. Restore costs 100.",
    spentCoins: 20,
    spentAction: "Next Order → Moonlit Wreath",
    spentTransaction: "Restored for 100. 20 coins remain."
  },
  {
    label: "round-one-restored",
    state: { currentRound: 1, roundComplete: true, roundOneRestored: true, moves: 2, counts: [0, 6, 0, 0, 0, 8] },
    coins: 20,
    action: "Next Order → Moonlit Wreath",
    transaction: "Restored for 100. 20 coins remain."
  },
  {
    label: "active-round-two",
    state: { currentRound: 2, roundComplete: false, roundOneRestored: true, moves: 9, counts: [0, 0, 0, 0, 0, 0] },
    coins: 20
  },
  {
    label: "round-two-payoff",
    state: { currentRound: 2, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: false, moves: 2, counts: [0, 0, 10, 0, 9, 7], clearedCursedThorns: 3 },
    coins: 170,
    action: "Upgrade Greenhouse · 120 coins",
    transaction: "Earned 150 coins. Upgrade costs 120.",
    spentCoins: 50,
    spentAction: "Next Order → Bloodroot Compact",
    spentTransaction: "Upgraded for 120. 50 coins remain."
  },
  {
    label: "round-two-upgraded",
    state: { currentRound: 2, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, moves: 2, counts: [0, 0, 10, 0, 9, 7], clearedCursedThorns: 3 },
    coins: 50,
    action: "Next Order → Bloodroot Compact",
    transaction: "Upgraded for 120. 50 coins remain."
  },
  {
    label: "active-round-three",
    state: { currentRound: 3, roundComplete: false, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, moves: 8, counts: [0, 0, 0, 0, 0, 0] },
    coins: 50
  },
  {
    label: "round-three-payoff",
    state: { currentRound: 3, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, roundThreeConservatoryRaised: false, moves: 2, counts: [13, 0, 0, 14, 0, 0] },
    coins: 230,
    action: "Raise Conservatory · 180 coins",
    transaction: "Earned 180 coins. Conservatory costs 180.",
    spentCoins: 50,
    spentAction: "Play Again → First Bouquet",
    spentTransaction: "Raised for 180. 50 coins remain."
  },
  {
    label: "round-three-raised",
    state: { currentRound: 3, roundComplete: true, roundOneRestored: true, roundTwoGreenhouseUpgraded: true, roundThreeConservatoryRaised: true, moves: 2, counts: [13, 0, 0, 14, 0, 0] },
    coins: 50,
    action: "Play Again → First Bouquet",
    transaction: "Raised for 180. 50 coins remain."
  }
];

test.setTimeout(90000);

async function openFresh(page, suffix) {
  await page.goto(`${BASE_URL}?tutorial-progress=${suffix}&bloomReview=1`, { waitUntil: "networkidle" });
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
      visibleNonTileButtons: Array.from(document.querySelectorAll("button"))
        .filter((node) => visible(node) && !node.closest("#board"))
        .map((node) => node.textContent.trim())
        .filter(Boolean),
      mobilePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      ritualLogText: document.querySelector("#ritualLog")?.textContent.trim() || "",
      retryVisible: visible(document.querySelector("#renewBtn.visible")),
      tutorialSpotlights: document.querySelectorAll(
        ".tile.idle-hint, .tile.thorn-teach, .tile.thorn-teach-blocker"
      ).length,
      bouquetText: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      bouquetNext: document.querySelector("#bouquetProgressNext")?.textContent.trim() || "",
      greenhouseText: document.querySelector(".restoration-dial-phase")?.textContent.trim() || "",
      payoffTransaction: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      restorationState: document.querySelector("#restorationState")?.textContent.trim() || "",
      coins: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").coins ?? 0,
      mobileGreenhousePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      visibleProgressText: document.body.innerText,
      bars: bars.map((node) => node.className),
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      round: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").currentRound || 1,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages
    };
  });
}

async function clickGuidedSwap(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  const pair = await hints.evaluateAll((tiles) => tiles.map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click({ force: true });
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click({ force: true });
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(() => {
    const payoff = document.querySelector("#roundOneRestoration");
    const payoffVisible = payoff && getComputedStyle(payoff).display !== "none";
    return payoffVisible || document.querySelectorAll(".tile.idle-hint").length === 2;
  }, null, { timeout: 7000 });
}

async function completeGuidedRoundOne(page) {
  for (let swap = 0; swap < 4; swap += 1) {
    await clickGuidedSwap(page);
    if (await page.locator("#roundOneRestoration").isVisible()) {
      break;
    }
  }
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
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
  await firstTile.focus();
  await expect(firstTile).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(firstTile).toHaveClass(/sel/);
  await expect(firstTile).toBeFocused();
  await page.keyboard.press(key);
  await expect(page.locator(".tile")).toHaveCount(64);
  await page.waitForFunction(() => !document.querySelector(".tile.sel"));
}

async function completeRoundWithReviewKey(page) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  await page.locator("body").click({ position: { x: 12, y: 12 } });
  await page.keyboard.press("n");
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function forceActiveBouquetFailure(page) {
  const marker = "bloomForcedFailureStateV1";
  await page.addInitScript(({ key, markerKey }) => {
    const forcedState = sessionStorage.getItem(markerKey);
    if (forcedState) {
      localStorage.setItem(key, forcedState);
      sessionStorage.removeItem(markerKey);
    }
  }, { key: SAVE_KEY, markerKey: marker });
  await page.evaluate(({ key, markerKey }) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.roundComplete = false;
    state.moves = 0;
    state.tutorialSkipped = false;
    sessionStorage.setItem(markerKey, JSON.stringify(state));
  }, { key: SAVE_KEY, markerKey: marker });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
}

async function economyMigrationReport(page) {
  return page.evaluate((key) => {
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
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      coins: saved.coins,
      version: saved.focusedEconomyVersion,
      tiles: document.querySelectorAll(".tile").length,
      actions: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest("#board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      transaction: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  }, SAVE_KEY);
}

for (const viewport of [
  { label: "desktop", width: 1280, height: 720 },
  { label: "mobile390", width: 390, height: 844 }
]) {
  test(`legacy focused economy migrates once on ${viewport.label}`, async ({ browser }) => {
    for (const migrationCase of LEGACY_ECONOMY_CASES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const legacyState = {
        coins: 188,
        cursedThorns: [],
        clearedCursedThorns: 0,
        roundOneRestored: false,
        roundTwoGreenhouseUpgraded: false,
        roundThreeConservatoryRaised: false,
        hasMadeValidMove: true,
        tutorialSkipped: true,
        tutorialActive: false,
        ...migrationCase.state
      };
      await page.addInitScript(({ key, state, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.setItem(key, JSON.stringify(state));
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        state: legacyState,
        marker: `legacy-economy-${viewport.label}-${migrationCase.label}`
      });
      await page.goto(`${BASE_URL}?legacy-economy=${viewport.label}-${migrationCase.label}&bloomReview=1`, { waitUntil: "networkidle" });
      await expect(page.locator(".tile")).toHaveCount(64);

      for (let reload = 0; reload < 2; reload += 1) {
        const report = await economyMigrationReport(page);
        expect(report.coins, `${migrationCase.label} balance after reload ${reload}`).toBe(migrationCase.coins);
        expect(report.version, `${migrationCase.label} migration version`).toBe(FOCUSED_ECONOMY_VERSION);
        expect(report.tiles).toBe(64);
        expect(report.brokenImages).toEqual([]);
        expect(report.overflowX).toBe(false);
        expect(report.actions.length, `${migrationCase.label} focused action cap`).toBeLessThanOrEqual(2);
        if (migrationCase.action) {
          expect(report.actions).toEqual([migrationCase.action]);
          expect(report.transaction).toBe(migrationCase.transaction);
        }
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
      }

      if (migrationCase.spentCoins !== undefined) {
        await page.getByRole("button", { name: migrationCase.action, exact: true }).click();
        for (let reload = 0; reload < 2; reload += 1) {
          const report = await economyMigrationReport(page);
          expect(report.coins, `${migrationCase.label} spent balance after reload ${reload}`).toBe(migrationCase.spentCoins);
          expect(report.version).toBe(FOCUSED_ECONOMY_VERSION);
          expect(report.actions).toEqual([migrationCase.spentAction]);
          expect(report.transaction).toBe(migrationCase.spentTransaction);
          expect(report.tiles).toBe(64);
          expect(report.brokenImages).toEqual([]);
          expect(report.overflowX).toBe(false);
          await page.reload({ waitUntil: "networkidle" });
          await expect(page.locator(".tile")).toHaveCount(64);
        }
      }
      await context.close();
    }
  });
}

test("guided Round 1 payoff keeps one dominant action", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page, "guided-payoff-mobile390");
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await completeGuidedRoundOne(page);

  await expect(page.locator("#bouquetProgressLabel")).toHaveText("Bouquet 14/14 -> +120 coins");
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  let report = await visibleReport(page);
  expect(report).toMatchObject({
    tiles: 64,
    tutorialVisible: true,
    tutorialInViewport: true,
    coins: 120,
    payoffTransaction: "Earned 120 coins. Restore costs 100.",
    overflowX: false,
    brokenImages: []
  });
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.tutorialInViewport).toBe(true);
  expect(report.coins).toBe(120);
  expect(report.payoffTransaction).toBe("Earned 120 coins. Restore costs 100.");
  expect(report.visibleProgressText).not.toContain("+120 coins -> Restore -100 coins");
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  expect(report.visibleProgressText).not.toContain("Swap the glowing flowers.");

  await page.locator("#restoreGreenhouseBtn").click();
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toHaveText("Next Order → Moonlit Wreath");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.coins).toBe(20);
  expect(report.payoffTransaction).toBe("Restored for 100. 20 coins remain.");
  expect(report.restorationState).toBe("RESTORED GREENHOUSE");
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  expect(report.tutorialInViewport).toBe(true);
  await page.waitForFunction(() => {
    const artwork = document.querySelector(".greenhouse-art-restored");
    return artwork?.complete && artwork.naturalWidth > 0;
  }, null, { timeout: 5000 });
  await page.waitForTimeout(800);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.tutorialInViewport).toBe(true);
  expect(report.coins).toBe(20);
  expect(report.payoffTransaction).toBe("Restored for 100. 20 coins remain.");
  expect(report.restorationState).toBe("RESTORED GREENHOUSE");
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  expect(report.visibleProgressText).not.toContain("Swap the glowing flowers.");

  await page.locator("#nextOrderBtn").click();
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#objective")).toContainText("Nightshade");
  await expect(page.locator("#objective")).toContainText("Amber Seed");
  await expect(page.locator("#objective")).toContainText("Thorn Rose");
  await expect(page.locator("#objective")).toContainText("Cursed Thorn");
  await expect(page.locator("#objective .moves-counter")).toHaveText("Moves 9");
  await expect(page.locator("#firstSwapCue")).toContainText("Crack the marked thorns");
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.tiles).toBe(64);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  await page.waitForTimeout(800);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

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
    mobileGreenhousePlinthVisible: false,
    ritualLogVisible: false,
    overflowX: false,
    brokenImages: []
  });
  expect(report.bars, "mobile active play keeps one bouquet bar plus one greenhouse bar").toHaveLength(2);
  expect(report.visibleButtons, "fresh tutorial button cap").toEqual(["Skip"]);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator("#tutorialPanel")).toBeHidden({ timeout: 1200 });

  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toHaveText("Swap the glowing flowers.");
  report = await visibleReport(page);
  expect(report.tutorialInViewport, "fresh replay tutorial panel stays in viewport").toBe(true);
  expect(report.visibleButtons, "fresh replay button cap").toEqual(["Skip"]);
  expect(report.visibleNonTileButtons).toEqual(["Skip"]);
  await clickGuidedSwap(page);
  await expect(page.locator("#bouquetProgressLabel")).toContainText(/Bouquet [1-9]/);
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match 4 makes/);
  report = await visibleReport(page);
  expect(report.tutorialInViewport, "post-swap tutorial panel stays in viewport").toBe(true);
  expect(report.visibleButtons, "post-swap tutorial button cap").toEqual(["Skip", "Shuffle (-1 move)"]);
  expect(report.visibleNonTileButtons).toEqual(["Skip", "Shuffle (-1 move)"]);
  await page.locator("#tutorialSkipBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
  await page.locator("#tutorialHelpBtn").click();
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialCopy")).toContainText(/Match 3 fills|Match 4 makes/);
  report = await visibleReport(page);
  expect(report.tutorialInViewport, "post-swap replay panel stays in viewport").toBe(true);
  expect(report.visibleButtons, "post-swap replay button cap").toEqual(["Skip", "Shuffle (-1 move)"]);
  expect(report.visibleNonTileButtons).toEqual(["Skip", "Shuffle (-1 move)"]);

  await completeRoundWithReviewKey(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialSkipBtn")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeHidden();
  report = await visibleReport(page);
  expect(report.visibleButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await expect(page.locator("#bouquetProgressNext")).toContainText("Coins ready -> Restore First Bouquet Glass");
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await page.locator("#restoreGreenhouseBtn").click();
  await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#tutorialPanel")).toBeVisible();
  await expect(page.locator("#tutorialSkipBtn")).toBeHidden();
  report = await visibleReport(page);
  expect(report.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  await page.locator("#nextOrderBtn").click();
  await expect(page.locator(".tile")).toHaveCount(64);
  if (await page.locator("#tutorialHelpBtn").isVisible()) {
    await page.locator("#tutorialHelpBtn").click();
  } else {
    await expect(page.locator("#tutorialPanel")).toBeVisible();
  }
  await expect(page.locator("#tutorialCopy")).toHaveText("Match beside thorns.");
  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.greenhouseText).toBe("Unlock Bloodroot Compact");
  expect(report.tutorialPrompt).toBe("Match beside thorns.");
  expect(report.mobilePlinthVisible, "Round 2 mobile active play has no greenhouse footer").toBe(false);
  expect(report.ritualLogVisible, "Round 2 mobile active play has no ritual log footer").toBe(false);
  expect(report.visibleProgressText).not.toContain("First Bouquet:");
  expect(report.tutorialSpotlights).toBeGreaterThanOrEqual(3);
  expect(report.bars, "Round 2 mobile active play keeps one bouquet bar plus one greenhouse bar").toHaveLength(2);
  expect(report.mobileGreenhousePlinthVisible).toBe(false);
  expect(report.ritualLogVisible).toBe(false);
  expect(report.visibleProgressText).not.toMatch(/\b(?:SAP|MANA|BLOOD)\b|\d[\d,]*\s*\/\s*\d[\d,]*\s*XP|Greenhouse \+\d+ XP|Apothecary \+\d+ XP/);

  await clickGuidedSwap(page);
  await expect(page.locator("#tutorialCopy")).toHaveText("Finish the Moonlit Wreath.");

  await forceActiveBouquetFailure(page);
  if (await page.locator("#tutorialHelpBtn").isVisible()) {
    await page.locator("#tutorialHelpBtn").click();
  } else {
    await expect(page.locator("#tutorialPanel")).toBeVisible();
  }
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
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  let report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialCopy")).toHaveText("Coins restore the greenhouse.");
  await expect(page.locator("#restoreGreenhouseBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Restore Greenhouse · 100 coins"]);
  await page.keyboard.press("Enter");
  await expect(page.locator("#nextOrderBtn")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 5000 });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialCopy")).toHaveText("Tap Next Order.");
  await expect(page.locator("#nextOrderBtn")).toBeFocused();
  report = await visibleReport(page);
  expect(report.visibleNonTileButtons).toEqual(["Next Order → Moonlit Wreath"]);
  await page.keyboard.press("Enter");
  await expect(page.locator(".tile")).toHaveCount(64);
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 5000 });

  report = await visibleReport(page);
  expect(report.round).toBe(2);
  expect(report.tiles).toBe(64);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
