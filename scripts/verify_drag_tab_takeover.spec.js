const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-pointer-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-pointer-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile390-touch-full", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-touch-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

test.setTimeout(60000);

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board").getBoundingClientRect();
    return {
      save: localStorage.getItem(key),
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id),
      ready: tiles.filter((tile) => tile.classList.contains("drag-preview-ready")).map((tile) => tile.id),
      transformed: tiles.filter((tile) => tile.style.transform).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      guideVisible: visible(document.querySelector(".first-action-swap-guide")),
      skipVisible: visible(document.querySelector("#tutorialSkipBtn")),
      enabled: tiles.filter((tile) => !tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: board.width, height: board.height, bottom: board.bottom },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function beginHeldPair(page, context, mobile) {
  const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
  expect(box, "opening source has geometry").toBeTruthy();
  const start = {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2)
  };
  const end = {
    x: start.x,
    y: start.y + Math.max(18, Math.round(box.height * 0.42))
  };
  if (!mobile) {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    return { client: null };
  }
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y, id: 23, radiusX: 2, radiusY: 2, force: 1 }]
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: end.x, y: end.y, id: 23, radiusX: 2, radiusY: 2, force: 1 }]
  });
  return { client };
}

async function releaseStaleGesture(page, gesture, mobile) {
  if (mobile) {
    await gesture.client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.mouse.up();
  }
  await page.waitForTimeout(400);
}

for (const profile of PROFILES) {
  test(`${profile.label}: Tab navigation retires a held flower pair`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile),
      reducedMotion: profile.reduced ? "reduce" : "no-preference"
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
      await page.addInitScript(({ key, marker }) => {
        if (sessionStorage.getItem(marker)) return;
        localStorage.removeItem(key);
        sessionStorage.setItem(marker, "fresh");
      }, { key: SAVE_KEY, marker: `drag-tab-takeover:${profile.label}` });
      await page.goto(`${BASE_URL}?drag-tab-takeover=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
      const gesture = await beginHeldPair(page, context, profile.mobile);
      await expect.poll(async () => (await report(page)).ready).toEqual([SOURCE_ID, TARGET_ID]);

      await page.keyboard.press("Tab");
      const takeover = await report(page);
      expect(takeover.save, "Tab takeover spends no move").toBe(before.save);
      expect(takeover.moves).toBe(before.moves);
      expect(takeover.counts).toEqual(before.counts);
      expect(takeover.boardState).toBe(before.boardState);
      expect(takeover.preview).toEqual([]);
      expect(takeover.ready).toEqual([]);
      expect(takeover.transformed).toEqual([]);
      expect(takeover.selected).toEqual([]);
      expect(takeover.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(takeover.guideVisible).toBe(true);
      expect(takeover.skipVisible).toBe(true);
      expect(takeover.active).toBe("tutorialSkipBtn");
      expect(takeover.roving).toEqual([SOURCE_ID]);

      if (profile.label === "mobile390-touch-full") {
        await page.screenshot({ path: "work/drag-tab-takeover-mobile390.png", fullPage: true });
      }

      await releaseStaleGesture(page, gesture, profile.mobile);
      const staleRelease = await report(page);
      expect(staleRelease.save, "stale release cannot commit the retired drag").toBe(before.save);
      expect(staleRelease.moves).toBe(before.moves);
      expect(staleRelease.counts).toEqual(before.counts);
      expect(staleRelease.boardState).toBe(before.boardState);
      expect(staleRelease.preview).toEqual([]);
      expect(staleRelease.ready).toEqual([]);
      expect(staleRelease.transformed).toEqual([]);
      expect(staleRelease.selected).toEqual([]);
      expect(staleRelease.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(staleRelease.active).toBe("tutorialSkipBtn");
      expect(staleRelease.roving).toEqual([SOURCE_ID]);

      await page.keyboard.press("Shift+Tab");
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator(`#${SOURCE_ID}`)).toHaveClass(/\bsel\b/);
      await expect(page.locator(`#${TARGET_ID}`)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });

      const settled = await report(page);
      expect(settled.counts[5], "fresh keyboard sequence earns the taught match once").toBe(3);
      expect(settled.boardState).not.toBe(before.boardState);
      expect(settled.preview).toEqual([]);
      expect(settled.ready).toEqual([]);
      expect(settled.transformed).toEqual([]);
      expect(settled.selected).toEqual([]);
      expect(settled.roving).toHaveLength(1);
      if (settled.active) expect(settled.active).toBe(settled.roving[0]);
      expect(settled.enabled).toBe(64);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      if (profile.mobile) {
        expect(settled.board.bottom).toBeLessThanOrEqual(844);
        expect(settled.scrollY).toBe(0);
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
