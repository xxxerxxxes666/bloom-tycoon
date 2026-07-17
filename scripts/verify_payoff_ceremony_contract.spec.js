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
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  expect(pair).toHaveLength(2);
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click({ force: true });
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click({ force: true });
  await page.waitForTimeout(1400);
}

async function clickGuidedSwapAndSampleFlight(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  expect(pair).toHaveLength(2);
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click({ force: true });
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click({ force: true });
  await page.waitForFunction(() => document.querySelector(".objective-flight"), null, { timeout: 2500 });
  const landing = await page.evaluate(() => {
    const flight = document.querySelector(".objective-flight");
    const animation = flight?.getAnimations?.()[0];
    const finalFrame = animation?.effect?.getKeyframes?.().at(-1);
    const transform = finalFrame?.transform || "";
    const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
    const startLeft = Number.parseFloat(flight?.style.left || "0");
    const startTop = Number.parseFloat(flight?.style.top || "0");
    const landingX = startLeft + 13 + (match ? Number(match[1]) : 0);
    const landingY = startTop + 13 + (match ? Number(match[2]) : 0);
    const assembly = document.querySelector("#liveBouquetAssembly")?.getBoundingClientRect();
    const bloomRects = Array.from(document.querySelectorAll("#liveBouquetAssembly .live-bouquet-ingredient"))
      .map((node) => node.getBoundingClientRect());
    const inside = (rect, pad = 0) => Boolean(rect
      && landingX >= rect.left - pad
      && landingX <= rect.right + pad
      && landingY >= rect.top - pad
      && landingY <= rect.bottom + pad);
    return {
      landingX,
      landingY,
      inAssembly: inside(assembly, 2),
      inBloom: bloomRects.some((rect) => inside(rect, 8)),
      assemblyWidth: assembly?.width || 0,
      assemblyHeight: assembly?.height || 0
    };
  });
  await page.waitForFunction(() => (
    document.querySelectorAll(".objective-flight, .bouquet-bind-seal").length === 0
  ), null, { timeout: 2500 });
  await page.waitForTimeout(450);
  return landing;
}

async function activeBouquetAssemblyState(page) {
  return page.evaluate(() => {
    const assembly = document.querySelector("#liveBouquetAssembly");
    const rect = assembly?.getBoundingClientRect();
    const ingredients = Array.from(document.querySelectorAll("#liveBouquetAssembly .live-bouquet-ingredient"))
      .map((ingredient) => {
        const style = getComputedStyle(ingredient);
        return {
          flowerId: Number(ingredient.dataset.flowerId),
          progress: ingredient.dataset.progress,
          slotProgress: Number(ingredient.dataset.slotProgress || 0),
          receiver: ingredient.dataset.receiver === "true",
          opacity: Number(style.opacity),
          transform: style.transform
        };
      });
    const board = document.querySelector(".board")?.getBoundingClientRect();
    return {
      progress: assembly?.dataset.progress || "",
      complete: assembly?.dataset.assemblyComplete || "",
      state: assembly?.dataset.assemblyState || "",
      round: assembly?.dataset.round || "",
      width: rect?.width || 0,
      height: rect?.height || 0,
      ingredients,
      stems: document.querySelectorAll("#liveBouquetAssembly .live-bouquet-stem").length,
      leaves: document.querySelectorAll("#liveBouquetAssembly .live-bouquet-leaf").length,
      boardBottom: board?.bottom || 0,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
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
      assemblyReady: document.querySelector("#roundOneRestoration")?.dataset.assemblyReady || "",
      trophies: visible(".bouquet-trophy").length,
      craftedBouquets: visible(".crafted-bouquet").length,
      craftedBlooms: visible(".crafted-flower-bloom").length,
      craftedStems: visible(".crafted-stem").length,
      craftedBloomCount: document.querySelector(".crafted-bouquet")?.dataset.craftedBloomCount || "",
      craftedComposition: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedFlower)),
      trophyState: document.querySelector("#bouquetTrophy")?.dataset.assemblyState || "",
      liveAssemblies: visible("#liveBouquetAssembly").length,
      scenes: visible(".restoration-scene").length,
      transactions: visible(".payoff-transaction").length,
      transactionText: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      trophyKicker: document.querySelector(".bouquet-trophy-kicker")?.textContent.trim() || "",
      trophyName: document.querySelector(".bouquet-trophy-name")?.textContent.trim() || "",
      coins: JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").coins ?? 0,
      board: visible(".board").length,
      controls: visible(".controls").length,
      objective: visible(".objective").length,
      tutorialVisible: visible("#tutorialPanel").length === 1,
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      buttons: visibleButtons,
      nonBoardButtons: visibleNonBoardButtons,
      retired: visibleRetired,
      transientFlights: visible(".objective-flight, .bouquet-bind-seal, .greenhouse-intake-flight").length,
      text: document.body.innerText,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      brokenImages
    };
  });
}

async function expectCeremony(page, expectedButton, screenshotPath, expectedGuide = "") {
  await page.waitForTimeout(250);
  const waitingForBouquet = await visibleContract(page);
  if (waitingForBouquet.assemblyReady === "false") {
    expect(waitingForBouquet.buttons, "payoff action waits for the bouquet object").toEqual([]);
    expect(waitingForBouquet.trophyState).toBe("forming");
  }
  const primaryButton = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(primaryButton).toBeVisible({ timeout: 1800 });
  await expect(primaryButton).toBeEnabled({ timeout: 1800 });
  const contract = await visibleContract(page);
  expect(contract.trophies, "one visible bouquet trophy").toBe(1);
  expect(contract.craftedBouquets, "one crafted bouquet object").toBe(1);
  expect(contract.craftedBlooms, "six overlapping bouquet bloom heads").toBe(6);
  expect(contract.craftedStems, "six bouquet stems").toBe(6);
  expect(contract.craftedBloomCount).toBe("6");
  const expectedComposition = contract.trophyName.includes("Moonlit Wreath")
    ? [2, 4, 5, 2, 4, 5]
    : contract.trophyName.includes("Bloodroot Compact")
      ? [3, 0, 3, 0, 3, 0]
      : [5, 1, 5, 1, 5, 1];
  expect(contract.craftedComposition, "ceremony uses the exact six-slot target ingredient sequence").toEqual(expectedComposition);
  expect(contract.trophyState, "bouquet presentation is ready").toBe("assembled");
  expect(contract.scenes, "one visible greenhouse scene").toBe(1);
  expect(contract.transactions, "one visible transaction line").toBe(1);
  expect(contract.transactionText, "no raw ledger-arrow accounting").not.toContain("->");
  if (expectedButton.includes("Restore Greenhouse")) {
    expect(contract.transactionText).toBe("Earned 120 coins. Restore costs 100.");
    expect(contract.trophyKicker).toBe("Bouquet Bound");
    expect(contract.coins).toBe(120);
  }
  if (expectedButton.includes("Next Order")) {
    expect(contract.transactionText).toMatch(/coins remain\.|Play Again reinvests the remaining \d+ coins\.|spent$/);
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
  expect(contract.transientFlights, "target-flight feedback cleans up").toBe(0);
  expect(contract.text).not.toMatch(/Path \/ Ledger|Flowerpedia|Chapter|Chest|Storage|Reward Choice|Bouquet Streak|Greenhouse \+\d+ XP/);
  expect(contract.overflowX, "no horizontal overflow").toBe(false);
  expect(contract.brokenImages, "no visible broken images").toEqual([]);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

async function expectActiveBoard(page) {
  await expect(page.locator(".tile")).toHaveCount(64, { timeout: 5000 });
  await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
  await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
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

async function expectGreenhouseOwned(page, expected) {
  const state = await page.evaluate(() => ({
    stage: document.querySelector("#heroRestorationDial")?.dataset.restorationDialStage || "",
    ownedStage: document.querySelector("#heroRestorationDial")?.dataset.ownedStage || "",
    pct: document.querySelector("#heroRestorationDial")?.dataset.restorationDialPct || "",
    text: document.querySelector("#heroRestorationDial")?.textContent.replace(/\s+/g, " ").trim() || "",
    activeStageKey: document.querySelector("#activeGreenhouseStage")?.dataset.stageKey || "",
    activeStageArt: document.querySelector("#activeGreenhouseStageArt")?.getAttribute("src") || "",
    goalCounts: document.querySelectorAll(".greenhouse-restoration-dial .restoration-goal-count").length
  }));
  expect(state.stage).toBe(expected.stage);
  expect(state.ownedStage).toBe(String(expected.ownedStage));
  expect(state.pct).toBe(String(expected.pct));
  expect(state.activeStageKey).toBe(expected.stage);
  expect(state.activeStageArt).toContain(expected.art);
  expect(state.text).toContain(expected.note);
  expect(state.goalCounts).toBe(0);
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
  await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
}

async function assertReloadKeeps(page, expectedButton, screenshotPath, expectedGuide = "") {
  await page.reload({ waitUntil: "networkidle" });
  await expectCeremony(page, expectedButton, screenshotPath, expectedGuide);
  await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
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
  await expectGreenhouseOwned(page, {
    stage: "restored",
    ownedStage: 1,
    pct: 33,
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  });
  await page.locator("#renewBtn.visible").click();
  await expectActiveBoard(page);
  await expectGreenhouseOwned(page, {
    stage: "restored",
    ownedStage: 1,
    pct: 33,
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  });
}

async function runJourney(page, label, includeRetry) {
  await resetPage(page, `pass2_${label}`);
  const initialAssembly = await activeBouquetAssemblyState(page);
  expect(initialAssembly.progress).toBe("0/14");
  expect(initialAssembly.state).toBe("fresh");
  expect(initialAssembly.width, "fresh live bouquet is readable in the progress strip").toBeGreaterThanOrEqual(label.includes("mobile390") ? 100 : 116);
  expect(initialAssembly.height, "fresh live bouquet has bouquet silhouette height").toBeGreaterThanOrEqual(label.includes("mobile390") ? 42 : 52);
  expect(initialAssembly.ingredients).toHaveLength(6);
  expect(initialAssembly.stems).toBe(6);
  expect(initialAssembly.leaves).toBe(6);
  expect(initialAssembly.ingredients.map((ingredient) => ingredient.flowerId)).toEqual([5, 1, 5, 1, 5, 1]);
  expect(initialAssembly.overflowX).toBe(false);
  if (label.includes("mobile390")) {
    expect(initialAssembly.boardBottom, "mobile active board stays in viewport with live bouquet").toBeLessThanOrEqual(844);
  }
  const landing = await clickGuidedSwapAndSampleFlight(page);
  expect(landing.inAssembly, "positive target flight lands inside the live bouquet assembly").toBe(true);
  expect(landing.inBloom, "positive target flight lands on a visible bouquet bloom target").toBe(true);
  const firstAssembly = await activeBouquetAssemblyState(page);
  expect(firstAssembly.progress).not.toBe(initialAssembly.progress);
  expect(["mid", "nearly", "complete"]).toContain(firstAssembly.state);
  expect(firstAssembly.ingredients.some((ingredient) => ingredient.slotProgress > 0)).toBe(true);
  expect(firstAssembly.ingredients.filter((ingredient) => ingredient.receiver)).toHaveLength(2);
  expect(firstAssembly.ingredients.map((ingredient) => ingredient.flowerId)).toEqual([5, 1, 5, 1, 5, 1]);
  expect(firstAssembly.width).toBeGreaterThanOrEqual(initialAssembly.width - 1);
  expect(firstAssembly.height).toBeGreaterThanOrEqual(initialAssembly.height - 1);
  await clickGuidedSwap(page);
  const secondAssembly = await activeBouquetAssemblyState(page);
  expect(secondAssembly.progress).not.toBe(firstAssembly.progress);
  expect(Math.max(...secondAssembly.ingredients.map((ingredient) => ingredient.slotProgress)))
    .toBeGreaterThanOrEqual(Math.max(...firstAssembly.ingredients.map((ingredient) => ingredient.slotProgress)));
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

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 }, minWidth: 116, minHeight: 52 },
  { label: "mobile390", viewport: { width: 390, height: 844 }, minWidth: 100, minHeight: 42 }
]) {
  test(`reduced motion presents assembled bouquet and ready restore promptly on ${config.label}`, async ({ page }) => {
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(config.viewport);
    await resetPage(page, `pass2_reduced_motion_${config.label}`);
    await expectGreenhouseOwned(page, {
      stage: "withered",
      ownedStage: 0,
      pct: 0,
      art: "first_greenhouse_withered.jpg",
      note: "Owned 0/3 · Next: Restore Greenhouse"
    });
    await clickGuidedSwap(page);
    await expectGreenhouseOwned(page, {
      stage: "withered",
      ownedStage: 0,
      pct: 0,
      art: "first_greenhouse_withered.jpg",
      note: "Owned 0/3 · Next: Restore Greenhouse"
    });
    await clickGuidedSwap(page);
    const active = await activeBouquetAssemblyState(page);
    expect(active.ingredients).toHaveLength(6);
    expect(active.width).toBeGreaterThanOrEqual(config.minWidth);
    expect(active.height).toBeGreaterThanOrEqual(config.minHeight);
    await completeRoundWithReviewKey(page);
    await expectGreenhouseOwned(page, {
      stage: "withered",
      ownedStage: 0,
      pct: 0,
      art: "first_greenhouse_withered.jpg",
      note: "Owned 0/3 · Next: Restore Greenhouse"
    });
    await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeEnabled({ timeout: 700 });
    const contract = await visibleContract(page);
    expect(contract.trophyState).toBe("assembled");
    expect(contract.craftedBouquets).toBe(1);
    expect(contract.craftedBlooms).toBe(6);
    expect(contract.craftedStems).toBe(6);
    expect(contract.buttons).toEqual(["Restore Greenhouse · 100 coins"]);
    expect(contract.coins).toBe(120);
    expect(contract.overflowX).toBe(false);
    expect(contract.brokenImages).toEqual([]);
    await page.screenshot({ path: `work/pass2-reduced-motion-${config.label}-round1-pending.png`, fullPage: true });
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
