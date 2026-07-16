const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(120000);

async function resetPage(page, suffix) {
  await page.goto(`${BASE_URL}?${suffix}&bloomReview=1`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function clickGuidedSwap(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  await hints.nth(0).click({ force: true });
  await hints.nth(1).click({ force: true });
  await page.waitForTimeout(1400);
}

async function completeRoundWithReviewKey(page) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  await page.locator("body").click({ position: { x: 12, y: 12 } });
  await page.keyboard.press("n");
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function visibleContract(page) {
  return page.evaluate(() => {
    const isVisible = (node) => {
      if (!node) return false;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const visible = (selector) => Array.from(document.querySelectorAll(selector)).filter(isVisible);
    const visibleButtons = visible("#roundOneRestoration button").map((button) => button.textContent.trim());
    const visibleNonBoardButtons = Array.from(document.querySelectorAll("button"))
      .filter((button) => isVisible(button) && !button.closest(".board"))
      .map((button) => button.textContent.trim())
      .filter(Boolean);
    const visibleRetired = [
      ".restoration-xp-preview",
      ".greenhouse-payoff-ladder",
      ".restoration-step",
      ".reward-choice-panel",
      ".ceremony-rewards",
      ".ceremony-next-target",
      ".flowerpedia-ledger",
      ".chapter-progress",
      ".chest-access",
      ".booster-panel",
      ".sacrifice-panel",
      ".bouquet-path",
      ".path-ledger-drawer",
      ".left",
      ".active-greenhouse-stage",
      ".bouquet-bind-seal",
      "#roundCeremony",
      "#renewBtn"
    ].filter((selector) => visible(selector).length);
    const brokenImages = Array.from(document.images)
      .filter((image) => isVisible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    return {
      bodyClass: document.body.className,
      trophies: visible(".bouquet-trophy").length,
      scenes: visible(".restoration-scene").length,
      transactions: visible(".payoff-transaction").length,
      transactionText: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      trophyKicker: document.querySelector(".bouquet-trophy-kicker")?.textContent.trim() || "",
      coins: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").coins ?? 0,
      board: visible(".board").length,
      controls: visible(".controls").length,
      objective: visible(".objective").length,
      tutorialVisible: visible("#tutorialPanel").length === 1,
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      buttons: visibleButtons,
      nonBoardButtons: visibleNonBoardButtons,
      retired: visibleRetired,
      text: document.body.innerText,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      brokenImages
    };
  });
}

async function expectCeremony(page, expectedButton, screenshotPath, expectedGuide = "") {
  await page.waitForTimeout(250);
  const contract = await visibleContract(page);
  expect(contract.trophies, "one visible bouquet trophy").toBe(1);
  expect(contract.scenes, "one visible greenhouse scene").toBe(1);
  expect(contract.transactions, "one visible transaction line").toBe(1);
  expect(contract.transactionText, "no raw ledger-arrow accounting").not.toContain("->");
  if (expectedButton.includes("Restore Greenhouse")) {
    expect(contract.transactionText).toBe("Earned 120 coins. Restore costs 100.");
    expect(contract.trophyKicker).toBe("Bouquet Bound");
    expect(contract.coins).toBe(120);
  }
  if (expectedButton.includes("Next Order")) {
    expect(contract.transactionText).toMatch(/coins remain\.|spent$/);
    if (contract.text.includes("Greenhouse Restored")) {
      expect(contract.transactionText).toBe("Restored for 100. 20 coins remain.");
      expect(contract.trophyKicker).toBe("Greenhouse Relit");
      expect(contract.coins).toBe(20);
    }
  }
  expect(contract.buttons, "one visible primary action").toHaveLength(1);
  expect(contract.buttons[0]).toContain(expectedButton);
  expect(contract.nonBoardButtons, "one visible non-board action during ceremony").toHaveLength(1);
  expect(contract.nonBoardButtons[0]).toContain(expectedButton);
  if (expectedGuide) {
    expect(contract.tutorialVisible, "terse payoff guidance remains visible").toBe(true);
    expect(contract.tutorialCopy).toBe(expectedGuide);
  }
  expect(contract.board, "board hidden during ceremony").toBe(0);
  expect(contract.controls, "controls hidden during ceremony").toBe(0);
  expect(contract.objective, "objective hidden during ceremony").toBe(0);
  expect(contract.retired, "retired ceremony UI hidden").toEqual([]);
  expect(contract.text).not.toMatch(/Path \/ Ledger|Flowerpedia|Chapter|Chest|Storage|Reward Choice|Bouquet Streak|Greenhouse \+\d+ XP/);
  expect(contract.overflowX, "no horizontal overflow").toBe(false);
  expect(contract.brokenImages, "no visible broken images").toEqual([]);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

async function expectActiveBoard(page) {
  await expect(page.locator(".tile")).toHaveCount(64, { timeout: 5000 });
  const active = await page.evaluate(() => {
    const board = document.querySelector(".board");
    const rect = board?.getBoundingClientRect();
    const style = board ? getComputedStyle(board) : null;
    return {
      boardVisible: Boolean(board && style.display !== "none" && rect.width > 0 && rect.height > 0),
      tiles: document.querySelectorAll(".tile").length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
  expect(active).toMatchObject({ boardVisible: true, tiles: 64, overflowX: false });
}

async function expectCleanReplayBoard(page) {
  await expectActiveBoard(page);
  await expect(page.locator("#tutorialPanel")).toBeHidden();
  await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
  await expect(page.locator("#tutorialHelpBtn")).toHaveAttribute("aria-label", "Replay Tutorial");
  const buttons = await page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    return Array.from(document.querySelectorAll("button"))
      .filter((button) => visible(button) && !button.closest(".board"))
      .map((button) => button.textContent.trim())
      .filter(Boolean);
  });
  expect(buttons.length, "clean active board keeps the non-board action cap").toBeLessThanOrEqual(2);
  expect(buttons).toContain("?");
  const mobileFooter = await page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    return {
      isMobile: window.innerWidth <= 760,
      plinth: visible(document.querySelector("#mobileGreenhousePlinth")),
      log: visible(document.querySelector("#ritualLog"))
    };
  });
  if (mobileFooter.isMobile) {
    expect(mobileFooter.plinth, "mobile active play has no greenhouse footer").toBe(false);
    expect(mobileFooter.log, "mobile active play has no ritual log footer").toBe(false);
  }
}

async function clickPrimary(page) {
  await page.locator("#roundOneRestoration button:not([hidden])").click();
  await page.waitForTimeout(450);
}

async function assertReloadKeeps(page, expectedButton, screenshotPath, expectedGuide = "") {
  await page.reload({ waitUntil: "networkidle" });
  await expectCeremony(page, expectedButton, screenshotPath, expectedGuide);
}

async function forceRoundTwoFailure(page) {
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.currentRound = 2;
    state.roundComplete = false;
    state.roundOneRestored = true;
    state.roundTwoGreenhouseUpgraded = false;
    state.moves = 0;
    state.counts = [0, 0, 0, 0, 0, 0];
    state.clearedCursedThorns = 0;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
  await page.locator("#renewBtn.visible").click();
  await expectActiveBoard(page);
}

async function runJourney(page, label, includeRetry) {
  await resetPage(page, `pass2_${label}`);
  await clickGuidedSwap(page);
  await completeRoundWithReviewKey(page);
  await expectCeremony(page, "Restore Greenhouse", `work/pass2-${label}-round1-pending.png`, "Coins restore the greenhouse.");
  await assertReloadKeeps(page, "Restore Greenhouse", `work/pass2-${label}-round1-pending-reload.png`, "Coins restore the greenhouse.");
  await clickPrimary(page);
  await expectCeremony(page, "Next Order", `work/pass2-${label}-round1-restored.png`, "Tap Next Order.");
  await assertReloadKeeps(page, "Next Order", `work/pass2-${label}-round1-restored-reload.png`, "Tap Next Order.");
  await clickPrimary(page);
  await expectActiveBoard(page);

  if (includeRetry) {
    await forceRoundTwoFailure(page);
  }

  await completeRoundWithReviewKey(page);
  await expectCeremony(page, "Upgrade Greenhouse", `work/pass2-${label}-round2-pending.png`);
  await assertReloadKeeps(page, "Upgrade Greenhouse", `work/pass2-${label}-round2-pending-reload.png`);
  await clickPrimary(page);
  await expectCeremony(page, "Next Order", `work/pass2-${label}-round2-upgraded.png`);
  await assertReloadKeeps(page, "Next Order", `work/pass2-${label}-round2-upgraded-reload.png`);
  await clickPrimary(page);
  await expectCleanReplayBoard(page);
  await expect(page.locator(".moves-counter")).toContainText("Moves 8");
  await expect(page.locator("#firstSwapCue")).toHaveText("Match Bloodroot and Sol Rot.");
  await expect(page.locator("#firstSwapCue")).not.toContainText("Nightshade");
  await expect(page.locator("#ritualLog")).toContainText("Final Order: Match Bloodroot and Sol Rot.");
  await expect(page.locator("#ritualLog")).not.toContainText("blooms under the moonlit greenhouse upgrade");

  await completeRoundWithReviewKey(page);
  await expectCeremony(page, "Raise Conservatory", `work/pass2-${label}-round3-pending.png`, "Raise Conservatory.");
  await assertReloadKeeps(page, "Raise Conservatory", `work/pass2-${label}-round3-pending-reload.png`, "Raise Conservatory.");
  await clickPrimary(page);
  await expectCeremony(page, "Play Again", `work/pass2-${label}-round3-raised.png`, "Play again.");
  await assertReloadKeeps(page, "Play Again", `work/pass2-${label}-round3-raised-reload.png`, "Play again.");
  await clickPrimary(page);
  await expectCleanReplayBoard(page);
}

test("payoff ceremony contract desktop journey", async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  await page.setViewportSize({ width: 1280, height: 720 });
  await runJourney(page, "desktop", true);
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("payoff ceremony contract mobile 390x844 journey", async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  await page.setViewportSize({ width: 390, height: 844 });
  await runJourney(page, "mobile390", false);
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
