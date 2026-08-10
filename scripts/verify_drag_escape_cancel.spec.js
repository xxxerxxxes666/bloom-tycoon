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
  return page.evaluate(({ key, sourceId, targetId }) => {
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
    return {
      save: localStorage.getItem(key),
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      guideVisible: visible(document.querySelector(".first-action-swap-guide")),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id),
      ready: [sourceId, targetId].filter((id) => document.querySelector(`#${id}`)?.classList.contains("drag-preview-ready")),
      transformed: tiles.filter((tile) => tile.style.transform).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      escapeEvents: window.__dragEscapeEvents || [],
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
  }, { key: SAVE_KEY, sourceId: SOURCE_ID, targetId: TARGET_ID });
}

async function dragOpeningPair(page) {
  const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
  expect(box, "opening source has geometry").toBeTruthy();
  const start = {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2)
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y + 18);
  await expect.poll(async () => (await report(page)).preview).toEqual([SOURCE_ID, TARGET_ID]);
  return start;
}

for (const profile of PROFILES) {
  test(`${profile.label}: Escape cancels a ready drag before release`, async ({ browser }) => {
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
    if (profile.reduced) await page.emulateMedia({ reducedMotion: "reduce" });

    try {
      await page.addInitScript((key) => {
        localStorage.removeItem(key);
        sessionStorage.clear();
      }, SAVE_KEY);
      await page.goto(`${BASE_URL}?drag-escape-cancel=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__dragEscapeEvents = [];
        document.querySelector("#board").addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            window.__dragEscapeEvents.push({ trusted: event.isTrusted, prevented: event.defaultPrevented });
          }
        });
      });

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
      const start = await dragOpeningPair(page);
      const held = await report(page);
      expect(held.ready).toEqual([SOURCE_ID, TARGET_ID]);

      await page.keyboard.press("Escape");
      await expect.poll(async () => (await report(page)).preview).toEqual([]);
      const canceled = await report(page);
      expect(canceled.escapeEvents).toEqual([{ trusted: true, prevented: true }]);
      expect(canceled.save).toBe(before.save);
      expect(canceled.moves).toBe(before.moves);
      expect(canceled.counts).toEqual(before.counts);
      expect(canceled.boardState).toBe(before.boardState);
      expect(canceled.ready).toEqual([]);
      expect(canceled.transformed).toEqual([]);
      expect(canceled.selected).toEqual([]);
      expect(canceled.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(canceled.guideVisible).toBe(true);
      expect(canceled.active).toBe(SOURCE_ID);
      expect(canceled.roving).toEqual([SOURCE_ID]);

      await page.mouse.move(1, 1);
      await page.mouse.up();
      await page.waitForTimeout(300);
      const staleLift = await report(page);
      expect(staleLift.save, "the stale outside lift does not rewrite progress").toBe(before.save);
      expect(staleLift.moves).toBe(before.moves);
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
        await page.screenshot({ path: "work/drag-escape-cancel-mobile390-restored.png", fullPage: true });
      }

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, start.y + 18);
      await expect.poll(async () => (await report(page)).preview).toEqual([SOURCE_ID, TARGET_ID]);
      await page.mouse.up();

      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "the resumed drag earns the taught match once").toBe(3);
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
