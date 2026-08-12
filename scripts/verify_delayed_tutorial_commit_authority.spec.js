const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const CASES = [
  { label: "desktop-pointer-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-pointer-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile390-cdp-touch-full", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-cdp-touch-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

test.setTimeout(60000);

async function openFresh(page, label) {
  await page.addInitScript(({ key, marker }) => {
    if (!sessionStorage.getItem(marker)) {
      localStorage.removeItem(key);
      sessionStorage.setItem(marker, "1");
    }
  }, { key: SAVE_KEY, marker: `delayed-tutorial-commit:${label}` });
  await page.goto(`${BASE_URL}?delayed-tutorial-commit=${label}`, {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("#board .tile")).toHaveCount(64);
  await expect(page.locator('#board .tile[aria-label*="guided exchange source"]')).toBeVisible();
}

async function visibleReport(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node || node.hidden) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      state,
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialText: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      receiptActive: document.body.classList.contains("settled-board-outcome-cue"),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      helpVisible: visible(document.querySelector("#tutorialHelpBtn")),
      helpDisabled: Boolean(document.querySelector("#tutorialHelpBtn")?.disabled),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      disabled: tiles.filter((tile) => tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      boardWidth: board?.width || 0,
      boardHeight: board?.height || 0,
      boardBottom: board?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src")),
      liveOwners: [...document.querySelectorAll("[aria-live]")]
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => node.id)
    };
  }, SAVE_KEY);
}

async function centerOf(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
}

async function dispatchEndpoint(page, client, point, identifier) {
  if (!client) {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.up();
    return;
  }
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...point, id: identifier, radiusX: 2, radiusY: 2, force: 1 }]
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: []
  });
}

async function activateReResolvedOpeningPair(page, context, mobile, trace) {
  const client = mobile ? await context.newCDPSession(page) : null;
  const sourceSelector = '#board .tile[aria-label*="guided exchange source"]';
  const source = await centerOf(page, sourceSelector);
  trace.push(await page.evaluate(() => ({
    phase: "before-source",
    time: performance.now(),
    tutorialActive: document.body.classList.contains("tutorial-active"),
    selected: document.querySelectorAll("#board .tile.sel").length,
    busy: document.querySelector("#board")?.getAttribute("aria-busy")
  })));
  await dispatchEndpoint(page, client, source, 501);
  await expect(page.locator(sourceSelector)).toHaveClass(/\bsel\b/);
  trace.push(await page.evaluate(() => ({
    phase: "after-source",
    time: performance.now(),
    tutorialActive: document.body.classList.contains("tutorial-active"),
    selected: document.querySelectorAll("#board .tile.sel").length,
    busy: document.querySelector("#board")?.getAttribute("aria-busy")
  })));

  const targetSelector = "#board .tile.idle-hint:not(.sel)";
  await expect(page.locator(targetSelector)).toHaveCount(1);
  const target = await centerOf(page, targetSelector);
  trace.push(await page.evaluate(() => ({
    phase: "target-re-resolved",
    time: performance.now(),
    target: document.querySelector("#board .tile.idle-hint:not(.sel)")?.id || "",
    tutorialActive: document.body.classList.contains("tutorial-active"),
    selected: document.querySelectorAll("#board .tile.sel").length,
    busy: document.querySelector("#board")?.getAttribute("aria-busy")
  })));
  await dispatchEndpoint(page, client, target, 502);
}

for (const testCase of CASES) {
  test(`committed opening retires the delayed tutorial on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") problems.push(`${request.url()} ${failure}`);
    });

    try {
      await openFresh(page, testCase.label);
      const freshEvidence = `work/delayed-tutorial-commit-${testCase.label}-fresh.png`;
      await page.screenshot({ path: freshEvidence, fullPage: false });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 2000 });
      const untouched = await visibleReport(page);
      expect(untouched.state.tutorialActive, "the untouched delayed tutorial is saved").toBe(true);
      expect(untouched.tutorialText).toBe("Swap the glowing flowers.");

      const trace = [await page.evaluate(() => ({
        phase: "tutorial-visible-after-fresh-evidence",
        time: performance.now(),
        tutorialActive: document.body.classList.contains("tutorial-active"),
        selected: document.querySelectorAll("#board .tile.sel").length,
        busy: document.querySelector("#board")?.getAttribute("aria-busy")
      }))];
      await activateReResolvedOpeningPair(page, context, testCase.mobile, trace);

      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5
          && state.counts?.[5] === 3
          && document.body.classList.contains("settled-board-outcome-cue");
      }, SAVE_KEY, { timeout: 12000 });
      trace.push(await page.evaluate(() => ({
        phase: "receipt-authoritative",
        time: performance.now(),
        tutorialActive: document.body.classList.contains("tutorial-active"),
        selected: document.querySelectorAll("#board .tile.sel").length,
        busy: document.querySelector("#board")?.getAttribute("aria-busy")
      })));

      const settled = await visibleReport(page);
      expect(settled.state.moves, "the opening spends exactly once").toBe(5);
      expect(settled.state.counts, "the opening credits only its Thorn Rose match")
        .toEqual([0, 0, 0, 0, 0, 3]);
      expect(settled.state.hasMadeValidMove).toBe(true);
      expect(settled.state.tutorialActive, "the committed opening cannot save stale tutorial authority").toBe(false);
      expect(settled.tutorialVisible, "the stale tutorial panel remains absent").toBe(false);
      expect(settled.tutorialText).toBe("");
      expect(settled.receiptActive).toBe(true);
      expect(settled.cue).toBe(
        "Thorn Rose +3, 3 of 8. Next: find 3 more."
      );
      expect(settled.liveOwners, "the exact earned receipt is the sole command narrator")
        .toEqual(["firstSwapCue"]);
      expect(settled.selected).toEqual([]);
      expect(settled.active).toMatch(/^tile-/);
      expect(settled.roving).toEqual([settled.active]);
      expect(settled.disabled).toBe(0);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.boardWidth).toBeCloseTo(testCase.mobile ? 378 : 600, 2);
      expect(settled.boardHeight).toBeCloseTo(testCase.mobile ? 378 : 600, 2);
      expect(settled.boardBottom).toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.scrollY).toBe(0);
      expect(settled.overflowX).toBe(false);
      if (testCase.mobile) expect(settled.overflowY).toBe(false);
      expect(settled.brokenImages).toEqual([]);

      if (!testCase.reduced) {
        await page.screenshot({
          path: `work/delayed-tutorial-commit-${testCase.mobile ? "mobile390" : "desktop"}-receipt.png`,
          fullPage: false
        });
      }

      console.log(`${testCase.label} timing ${JSON.stringify(trace)}`);
      await page.reload({ waitUntil: "networkidle" });
      const restored = await visibleReport(page);
      expect(restored.state.moves).toBe(5);
      expect(restored.state.counts).toEqual([0, 0, 0, 0, 0, 3]);
      expect(restored.state.tutorialActive).toBe(false);
      expect(restored.tutorialVisible).toBe(false);
      expect(restored.receiptActive, "reload cannot replay a transient receipt").toBe(false);
      expect(restored.helpVisible, "Help remains available after settlement").toBe(true);
      expect(restored.helpDisabled).toBe(false);
      expect(restored.roving).toHaveLength(1);

      await page.locator("#tutorialHelpBtn").click();
      await expect(page.locator("#tutorialPanel")).toBeVisible();
      await expect(page.locator("#tutorialSkipBtn")).toBeFocused();
      await page.locator("#tutorialSkipBtn").click();
      await expect(page.locator("#tutorialPanel")).toBeHidden();
      await expect(page.locator("#tutorialHelpBtn")).toBeVisible();
      const afterReplay = await visibleReport(page);
      expect(afterReplay.roving).toHaveLength(1);
      expect(afterReplay.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
