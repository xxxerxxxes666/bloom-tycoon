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
  const pair = await hints.evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => ({
    x: tile.dataset.x,
    y: tile.dataset.y
  })));
  await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click({ force: true });
  await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click({ force: true });
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
  const primary = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(primary).toBeVisible({ timeout: 1800 });
  await expect(primary).toBeEnabled({ timeout: 1800 });
  const buttons = await primary.allTextContents();
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
  const primary = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(primary).toBeEnabled({ timeout: 1800 });
  await primary.click();
  await page.waitForTimeout(520);
}

async function startThornFeedbackRecorder(page) {
  await page.evaluate(() => {
    window.__thornFeedbackFrames = [];
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const bounds = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 0) > 0.02
        && bounds.width > 0
        && bounds.height > 0;
    };
    const rect = (node) => {
      const bounds = node.getBoundingClientRect();
      return { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
    };
    const overlaps = (a, b) => (
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
      && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
    );
    let frame = 0;
    const sample = () => {
      const impacts = Array.from(document.querySelectorAll(".board-particle.impact-sigil"))
        .filter(visible)
        .map((node) => ({ text: node.textContent.trim(), rect: rect(node) }));
      const thornEvents = Array.from(document.querySelectorAll(".thorn-event"))
        .filter(visible)
        .map((node) => ({ text: node.textContent.trim(), rect: rect(node) }));
      const thornOverlaps = [];
      for (let i = 0; i < thornEvents.length; i += 1) {
        for (let j = i + 1; j < thornEvents.length; j += 1) {
          if (overlaps(thornEvents[i].rect, thornEvents[j].rect)) thornOverlaps.push(`${i}-${j}`);
        }
      }
      window.__thornFeedbackFrames.push({
        frame,
        impacts,
        thornEvents,
        thornOverlaps,
        crossLayerOverlap: impacts.some((impact) => thornEvents.some((thorn) => overlaps(impact.rect, thorn.rect))),
        shocks: document.querySelectorAll(".board-particle.thorn-shock").length,
        splinters: document.querySelectorAll(".board-particle.thorn-splinter").length
      });
      frame += 1;
    };
    window.__thornFeedbackObserver = new MutationObserver(() => sample());
    window.__thornFeedbackObserver.observe(document.querySelector("#board"), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });
    window.__thornFeedbackRecorder = setInterval(() => {
      sample();
      if (frame >= 100) clearInterval(window.__thornFeedbackRecorder);
    }, 16);
  });
}

async function playThornLesson(page, screenshotPath) {
  const before = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    return {
      moves: state.moves,
      clearedCursedThorns: state.clearedCursedThorns
    };
  }, SAVE_KEY);
  const thornSwap = page.locator(".tile.thorn-teach");
  await expect(thornSwap).toHaveCount(2, { timeout: 5000 });
  await page.locator('.tile[data-x="1"][data-y="2"]').click({ force: true });
  await startThornFeedbackRecorder(page);
  await page.locator('.tile[data-x="1"][data-y="3"]').click({ force: true });
  await page.waitForTimeout(240);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.waitForTimeout(760);
  const sampledFrames = await page.evaluate(() => {
    clearInterval(window.__thornFeedbackRecorder);
    window.__thornFeedbackObserver?.disconnect();
    return window.__thornFeedbackFrames || [];
  });

  const breakPositions = new Set(sampledFrames.flatMap((frame) => (
    frame.thornEvents
      .filter((event) => event.text === "BREAK")
      .map((event) => {
        const centerX = Math.round((event.rect.left + event.rect.right) / 2);
        const centerY = Math.round((event.rect.top + event.rect.bottom) / 2);
        return `${centerX},${centerY}`;
      })
  )));
  expect(
    breakPositions.size,
    "the authored lesson presents all three localized Cursed Thorn breaks"
  ).toBeGreaterThanOrEqual(3);
  sampledFrames.forEach((frame, index) => {
    expect(
      frame.impacts.some((impact) => impact.text === "HIT"),
      `frame ${index} omits generic HIT when three thorn outcomes own the event`
    ).toBe(false);
    expect(
      frame.impacts.length,
      `frame ${index} has at most one central text narrator`
    ).toBeLessThanOrEqual(1);
    expect(frame.thornOverlaps, `frame ${index} keeps thorn labels separate`).toEqual([]);
    expect(frame.crossLayerOverlap, `frame ${index} keeps thorn labels clear of central narration`).toBe(false);
  });
  expect(
    sampledFrames.some((frame) => frame.shocks >= 3),
    "each authored thorn gets a localized shock marker"
  ).toBe(true);
  expect(
    Math.max(...sampledFrames.map((frame) => frame.splinters)),
    "thorn splinters remain capped"
  ).toBeLessThanOrEqual(15);

  await page.waitForTimeout(1400);
  await expect(page.locator(".tile")).toHaveCount(64);
  const after = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    const rows = new Set(
      Array.from(document.querySelectorAll(".tile")).map((tile) => tile.dataset.y)
    ).size;
    return {
      moves: state.moves,
      clearedCursedThorns: state.clearedCursedThorns,
      thorns: state.cursedThorns.length,
      tiles: document.querySelectorAll(".tile").length,
      rows
    };
  }, SAVE_KEY);
  expect(after.moves, "the authored thorn lesson spends one move").toBe(before.moves - 1);
  expect(
    after.clearedCursedThorns - before.clearedCursedThorns,
    "the authored thorn lesson clears all three blockers"
  ).toBe(3);
  expect(after.thorns).toBe(0);
  expect(after.tiles).toBe(64);
  expect(after.rows).toBe(8);
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

async function triggerSupremeReviewHook(page) {
  await expect.poll(async () => page.evaluate(() => window.__bloomReviewHooksEnabled === true)).toBe(true);
  await page.locator("body").click({ position: { x: 14, y: 14 } });
  await page.keyboard.press("b");
  await page.waitForSelector("#supreme.on", { timeout: 2000 });
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

test("reduced motion keeps Supreme Bloom lightweight", async ({ page }) => {
  const guards = wireRuntimeGuards(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await resetPage(page, "pass3_reduced_supreme");
  await triggerSupremeReviewHook(page);
  const report = await page.evaluate(() => ({
    motion: document.querySelector("#supreme")?.dataset.motion || "",
    visible: (() => {
      const supreme = document.querySelector("#supreme");
      if (!supreme) return false;
      const rect = supreme.getBoundingClientRect();
      const style = getComputedStyle(supreme);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) > 0.8
        && rect.width > 0
        && rect.height > 0;
    })(),
    particles: document.querySelectorAll("#supremeParticles .particle").length,
    tiles: document.querySelectorAll(".tile").length,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    brokenImages: Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"))
  }));
  expect(report.motion).toBe("reduced");
  expect(report.visible, "Supreme Bloom remains readable in reduced motion").toBe(true);
  expect(report.particles, "Supreme Bloom particle count respects reduced motion").toBeLessThanOrEqual(16);
  expect(report.tiles).toBe(64);
  expect(report.overflowX).toBe(false);
  expect(report.brokenImages).toEqual([]);
  await page.screenshot({ path: "work/pass3-mobile390-reduced-supreme.png", fullPage: true });
  await page.waitForTimeout(800);
  await expect(page.locator("#supreme.on")).toHaveCount(0);
  await expect(page.locator(".tile")).toHaveCount(64);
  expect(guards.consoleMessages).toEqual([]);
  expect(guards.pageErrors).toEqual([]);
  expect(guards.failedRequests).toEqual([]);
});
