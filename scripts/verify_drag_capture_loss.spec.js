const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "mobile390-full", viewport: { width: 390, height: 844 }, mobile: true },
  { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reduced: true }
];

test.setTimeout(60000);

async function report(page) {
  return page.evaluate(({ key, sourceId }) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board");
    const boardRect = board.getBoundingClientRect();
    const source = document.querySelector(`#${sourceId}`);
    return {
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      guideVisible: visible(document.querySelector(".first-action-swap-guide")),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id),
      ready: tiles.filter((tile) => tile.classList.contains("drag-preview-ready")).map((tile) => tile.id),
      transformed: tiles.filter((tile) => tile.style.transform).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      sourceCapture: source?.hasPointerCapture(window.__captureLossPointerId || -1) || false,
      lostCaptureEvents: window.__lostCaptureEvents || 0,
      primaryDowns: window.__primaryDowns || 0,
      enabled: tiles.filter((tile) => !tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: boardRect.width, height: boardRect.height, bottom: boardRect.bottom },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, { key: SAVE_KEY, sourceId: SOURCE_ID });
}

for (const profile of PROFILES) {
  test(`${profile.label}: native pointer capture loss restores the board immediately`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("requestfailed", (request) => {
      problems.push(`${request.url()} ${request.failure()?.errorText || ""}`);
    });
    if (profile.reduced) {
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    try {
      await page.addInitScript((key) => {
        localStorage.removeItem(key);
        sessionStorage.clear();
      }, SAVE_KEY);
      await page.goto(`${BASE_URL}?drag-capture-loss=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__captureLossPointerId = null;
        window.__lostCaptureEvents = 0;
        window.__primaryDowns = 0;
        document.querySelector("#board").addEventListener("pointerdown", (event) => {
          if (event.button === 0) {
            window.__captureLossPointerId = event.pointerId;
            window.__primaryDowns += 1;
          }
        }, true);
        document.addEventListener("lostpointercapture", () => {
          window.__lostCaptureEvents += 1;
        }, true);
      });

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
      const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
      expect(box, "opening source has geometry").toBeTruthy();
      const start = {
        x: Math.round(box.x + box.width / 2),
        y: Math.round(box.y + box.height / 2)
      };

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, start.y + 18);
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      const held = await report(page);
      expect(held.preview).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.ready).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.sourceCapture, "the opening source owns native pointer capture").toBe(true);
      expect(held.primaryDowns).toBe(1);

      await page.evaluate((sourceId) => {
        const source = document.querySelector(`#${sourceId}`);
        source.releasePointerCapture(window.__captureLossPointerId);
      }, SOURCE_ID);
      await page.mouse.move(1, 1);
      await expect.poll(async () => (await report(page)).lostCaptureEvents).toBe(1);

      const restored = await report(page);
      expect(restored.sourceCapture).toBe(false);
      expect(restored.preview, "capture loss retires the displaced pair").toEqual([]);
      expect(restored.ready).toEqual([]);
      expect(restored.transformed).toEqual([]);
      expect(restored.selected).toEqual([]);
      expect(restored.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(restored.guideVisible).toBe(true);
      expect(restored.moves).toBe(before.moves);
      expect(restored.counts).toEqual(before.counts);
      expect(restored.boardState).toBe(before.boardState);
      expect(restored.active).toBe(SOURCE_ID);
      expect(restored.roving).toEqual([SOURCE_ID]);

      await page.mouse.up();
      await page.waitForTimeout(300);
      const staleLift = await report(page);
      expect(staleLift.moves, "the stale outside lift spends no move").toBe(before.moves);
      expect(staleLift.counts).toEqual(before.counts);
      expect(staleLift.boardState).toBe(before.boardState);
      expect(staleLift.preview).toEqual([]);
      expect(staleLift.ready).toEqual([]);
      expect(staleLift.transformed).toEqual([]);
      expect(staleLift.selected).toEqual([]);
      expect(staleLift.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(staleLift.guideVisible).toBe(true);
      expect(staleLift.active).toBe(SOURCE_ID);
      expect(staleLift.roving).toEqual([SOURCE_ID]);

      if (profile.label === "mobile390-full") {
        await page.screenshot({ path: "work/drag-capture-loss-mobile390-restored.png", fullPage: true });
      }

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, start.y + 18);
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      const resumed = await report(page);
      expect(resumed.primaryDowns).toBe(2);
      expect(resumed.sourceCapture).toBe(true);
      await page.mouse.up();

      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "the next ordinary drag earns the taught match once").toBe(3);
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
