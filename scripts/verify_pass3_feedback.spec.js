const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

test.setTimeout(140000);

function wireRuntimeGuards(page) {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  return { consoleMessages, pageErrors, failedRequests };
}

async function resetPage(page, suffix) {
  await page.goto(`${BASE_URL}?${suffix}&bloomReview=1`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function assertNoPageBreakage(page, requireActiveBoard = true) {
  const report = await page.evaluate((requireActive) => {
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
    const objectiveItems = Array.from(document.querySelectorAll(".objective > span"))
      .filter((node) => visible(node) && !node.classList.contains("objective-goal-joiner"))
      .map((node) => ({ text: node.textContent.trim(), rect: node.getBoundingClientRect() }));
    const overlaps = [];
    for (let i = 0; i < objectiveItems.length; i += 1) {
      for (let j = i + 1; j < objectiveItems.length; j += 1) {
        const a = objectiveItems[i].rect;
        const b = objectiveItems[j].rect;
        const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (xOverlap > 1 && yOverlap > 1) {
          overlaps.push(`${objectiveItems[i].text} / ${objectiveItems[j].text}`);
        }
      }
    }
    const brokenImages = Array.from(document.images)
      .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    const board = document.querySelector(".board");
    const boardRect = board?.getBoundingClientRect();
    const tileRects = Array.from(document.querySelectorAll(".tile")).map((tile) => tile.getBoundingClientRect());
    const completeRows = [...new Set(tileRects
      .filter((rect) => rect.top >= -1 && rect.bottom <= window.innerHeight + 1)
      .map((rect) => Math.round(rect.top)))].length;
    const greenhouseIntakeTarget = [
      document.querySelector("#heroRestorationDial"),
      document.querySelector("#mobileRestorationDial"),
      document.querySelector("#mobileGreenhousePlinth"),
      document.querySelector("#activeGreenhouseStage")
    ].find(visible);
    return {
      tiles: document.querySelectorAll(".tile").length,
      activeBoard: Boolean(board && visible(board)),
      boardBottom: boardRect ? boardRect.bottom : 0,
      completeRows,
      mobileGreenhousePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      greenhouseIntakeTargetId: greenhouseIntakeTarget?.id || "",
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      brokenImages,
      overlaps,
      supremeOn: Boolean(document.querySelector("#supreme.on")),
      requireActive
    };
  }, requireActiveBoard);
  if (requireActiveBoard) {
    expect(report.activeBoard, "active board visible").toBe(true);
    expect(report.tiles, "active tile count").toBe(64);
  }
  expect(report.overflowX, "no horizontal overflow").toBe(false);
  expect(report.brokenImages, "no visible broken images").toEqual([]);
  expect(report.overlaps, "no overlapping objective labels").toEqual([]);
  return report;
}

async function assertMobileBoardRows(page) {
  const report = await assertNoPageBreakage(page, true);
  expect(report.completeRows, "exact mobile complete board rows").toBe(8);
  expect(report.boardBottom, "mobile board remains in first viewport").toBeLessThanOrEqual(844);
  expect(report.mobileGreenhousePlinthVisible, "mobile greenhouse plinth is absent during active play").toBe(false);
  expect(report.ritualLogVisible, "ritual log is absent during active play").toBe(false);
  expect(report.greenhouseIntakeTargetId, "greenhouse intake targets the visible mobile greenhouse bar").toBe("mobileRestorationDial");
}

async function clickGuidedSwap(page) {
  const hints = page.locator(".tile.idle-hint");
  await expect(hints).toHaveCount(2, { timeout: 5000 });
  await hints.nth(0).click({ force: true });
  await hints.nth(1).click({ force: true });
}

async function assertSingleWaveHit(page) {
  await page.waitForFunction(() => document.querySelectorAll(".board-particle.impact-sigil").length > 0, null, { timeout: 2000 });
  const fx = await page.evaluate(() => {
    const count = (selector) => document.querySelectorAll(selector).length;
    return {
      impact: count(".board-particle.impact-sigil"),
      ring: count(".board-particle.cascade-ring"),
      vein: count(".board-particle.cascade-vein"),
      label: count(".cascade-wave-label"),
      resourcePops: count(".board-particle.resource-pop"),
      coinPops: count(".board-particle.coin-pop"),
      intakeFlights: count(".greenhouse-intake-flight")
    };
  });
  expect(fx.impact, "one readable hit sigil per sampled wave").toBe(1);
  expect(fx.ring, "one hit ring per sampled wave").toBeLessThanOrEqual(1);
  expect(fx.vein, "one spatial vein per sampled wave").toBeLessThanOrEqual(1);
  expect(fx.label, "no overlapping chain labels on first sampled wave").toBeLessThanOrEqual(1);
  expect(fx.resourcePops, "resource pops sampled").toBeLessThanOrEqual(5);
  expect(fx.coinPops, "coin pops sampled").toBeLessThanOrEqual(5);
  expect(fx.intakeFlights, "greenhouse intake flights sampled").toBeLessThanOrEqual(3);
}

async function completeRoundWithReviewKey(page) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  await page.locator("body").click({ position: { x: 12, y: 12 } });
  await page.keyboard.press("n");
  await expect(page.locator("#roundOneRestoration")).toBeVisible({ timeout: 5000 });
}

async function assertCeremony(page, expectedButton, screenshotPath) {
  await page.waitForTimeout(250);
  await expect(page.locator(".bouquet-trophy:visible")).toHaveCount(1);
  await expect(page.locator(".restoration-scene:visible")).toHaveCount(1);
  await expect(page.locator(".payoff-transaction:visible")).toHaveCount(1);
  const buttons = await page.locator("#roundOneRestoration button:not([hidden])").allTextContents();
  expect(buttons).toHaveLength(1);
  expect(buttons[0]).toContain(expectedButton);
  await assertNoPageBreakage(page, false);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

async function reloadAndAssertCeremony(page, expectedButton, screenshotPath) {
  await page.reload({ waitUntil: "networkidle" });
  await assertCeremony(page, expectedButton, screenshotPath);
}

async function clickPrimaryCeremonyAction(page) {
  await page.locator("#roundOneRestoration button:not([hidden])").click();
  await page.waitForTimeout(520);
}

async function playThornLesson(page, screenshotPath) {
  const thornSwap = page.locator(".tile.thorn-teach");
  await expect(thornSwap).toHaveCount(2, { timeout: 5000 });
  await page.locator('.tile[data-x="1"][data-y="2"]').click({ force: true });
  await page.locator('.tile[data-x="1"][data-y="3"]').click({ force: true });
  await page.waitForFunction(() => document.querySelectorAll(".thorn-event").length > 0, null, { timeout: 2000 });
  await assertSingleWaveHit(page);
  const thornState = await page.evaluate(() => ({
    events: Array.from(document.querySelectorAll(".thorn-event")).map((node) => node.textContent.trim()),
    eventOverlaps: (() => {
      const rects = Array.from(document.querySelectorAll(".thorn-event")).map((node) => node.getBoundingClientRect());
      const overlaps = [];
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) {
          const xOverlap = Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].left, rects[j].left);
          const yOverlap = Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top);
          if (xOverlap > 1 && yOverlap > 1) {
            overlaps.push(`${i}-${j}`);
          }
        }
      }
      return overlaps;
    })(),
    shocks: document.querySelectorAll(".board-particle.thorn-shock").length,
    splinters: document.querySelectorAll(".board-particle.thorn-splinter").length,
    thorns: document.querySelectorAll(".tile.cursed-thorn").length
  }));
  expect(thornState.events.join(" ")).toMatch(/BREAK|CRACK/);
  expect(thornState.eventOverlaps, "thorn damage labels do not overlap").toEqual([]);
  expect(thornState.shocks, "thorn shock marker visible").toBeGreaterThan(0);
  expect(thornState.splinters, "thorn splinters capped").toBeLessThanOrEqual(15);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.waitForTimeout(1400);
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function forceRoundTwoFailureAndRetry(page) {
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.currentRound = 2;
    state.roundComplete = false;
    state.roundOneRestored = true;
    state.roundTwoGreenhouseUpgraded = false;
    state.moves = 0;
    state.counts = [0, 0, 0, 0, 0, 0];
    state.clearedCursedThorns = 0;
    state.cursedThorns = [
      { x: 0, y: 1, hp: 1 },
      { x: 1, y: 1, hp: 1 },
      { x: 2, y: 1, hp: 1 }
    ];
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#renewBtn.visible")).toHaveText("Retry Bouquet");
  await page.locator("#renewBtn.visible").click();
  await expect(page.locator(".tile")).toHaveCount(64);
  await assertNoPageBreakage(page, true);
}

async function verifySupremeReviewHookRare(page, screenshotPath) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  const before = await page.evaluate(() => ({
    supremeOn: Boolean(document.querySelector("#supreme.on")),
    text: document.body.innerText
  }));
  expect(before.supremeOn).toBe(false);
  expect(before.text).not.toMatch(/SUPREME BLOOM!/);
  await page.locator("body").click({ position: { x: 14, y: 14 } });
  await page.keyboard.press("b");
  await page.waitForSelector("#supreme.on", { timeout: 2000 });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.waitForTimeout(2500);
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function runFullJourney(page, label, mobile = false) {
  await resetPage(page, `pass3_${label}`);
  if (mobile) {
    await assertMobileBoardRows(page);
  } else {
    await assertNoPageBreakage(page, true);
  }

  await clickGuidedSwap(page);
  await assertSingleWaveHit(page);
  await page.screenshot({ path: `work/pass3-${label}-round1-hit.png`, fullPage: true });
  await page.waitForTimeout(1500);
  await completeRoundWithReviewKey(page);
  await assertCeremony(page, "Restore Greenhouse", `work/pass3-${label}-round1-pending.png`);
  await reloadAndAssertCeremony(page, "Restore Greenhouse", `work/pass3-${label}-round1-pending-reload.png`);
  await clickPrimaryCeremonyAction(page);
  await assertCeremony(page, "Next Order", `work/pass3-${label}-round1-restored.png`);
  await reloadAndAssertCeremony(page, "Next Order", `work/pass3-${label}-round1-restored-reload.png`);
  await clickPrimaryCeremonyAction(page);
  await expect(page.locator(".tile")).toHaveCount(64);
  if (mobile) {
    await assertMobileBoardRows(page);
  } else {
    await assertNoPageBreakage(page, true);
  }

  await playThornLesson(page, `work/pass3-${label}-thorn-damage.png`);
  if (!mobile) {
    await forceRoundTwoFailureAndRetry(page);
  }
  await completeRoundWithReviewKey(page);
  await assertCeremony(page, "Upgrade Greenhouse", `work/pass3-${label}-round2-pending.png`);
  await reloadAndAssertCeremony(page, "Upgrade Greenhouse", `work/pass3-${label}-round2-pending-reload.png`);
  await clickPrimaryCeremonyAction(page);
  await assertCeremony(page, "Next Order", `work/pass3-${label}-round2-upgraded.png`);
  await reloadAndAssertCeremony(page, "Next Order", `work/pass3-${label}-round2-upgraded-reload.png`);
  await clickPrimaryCeremonyAction(page);
  await expect(page.locator(".tile")).toHaveCount(64);
  if (mobile) {
    await assertMobileBoardRows(page);
  } else {
    await assertNoPageBreakage(page, true);
  }
  await page.screenshot({ path: `work/pass3-${label}-round3-active.png`, fullPage: true });

  await completeRoundWithReviewKey(page);
  await assertCeremony(page, "Raise Conservatory", `work/pass3-${label}-round3-pending.png`);
  await reloadAndAssertCeremony(page, "Raise Conservatory", `work/pass3-${label}-round3-pending-reload.png`);
  await clickPrimaryCeremonyAction(page);
  await assertCeremony(page, "Play Again", `work/pass3-${label}-round3-raised.png`);
  await reloadAndAssertCeremony(page, "Play Again", `work/pass3-${label}-round3-raised-reload.png`);
  await clickPrimaryCeremonyAction(page);
  await expect(page.locator(".tile")).toHaveCount(64);
  await verifySupremeReviewHookRare(page, `work/pass3-${label}-supreme-review.png`);
}

test("pass 3 desktop active feedback and round 1-3 journey", async ({ page }) => {
  const guards = wireRuntimeGuards(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await runFullJourney(page, "desktop", false);
  expect(guards.consoleMessages).toEqual([]);
  expect(guards.pageErrors).toEqual([]);
  expect(guards.failedRequests).toEqual([]);
});

test("pass 3 exact 390x844 mobile active feedback and round 1-3 journey", async ({ page }) => {
  const guards = wireRuntimeGuards(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await runFullJourney(page, "mobile390", true);
  expect(guards.consoleMessages).toEqual([]);
  expect(guards.pageErrors).toEqual([]);
  expect(guards.failedRequests).toEqual([]);
});
