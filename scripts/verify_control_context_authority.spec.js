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
  return page.evaluate(({ key }) => {
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
      enabled: tiles.filter((tile) => !tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: { width: boardRect.width, height: boardRect.height, bottom: boardRect.bottom },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src")),
      controlPointerDowns: window.__controlPointerDowns || 0
    };
  }, { key: SAVE_KEY });
}

for (const profile of PROFILES) {
  test(`${profile.label}: Control-primary context input cannot command flowers`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?control-context-authority=${profile.label}`, { waitUntil: "networkidle" });
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__controlPointerDowns = 0;
        document.querySelector("#board").addEventListener("pointerdown", (event) => {
          if (event.ctrlKey && event.button === 0) window.__controlPointerDowns += 1;
        }, true);
      });

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);

      await page.dispatchEvent(`#${SOURCE_ID}`, "click", {
        button: 0,
        ctrlKey: true,
        detail: 1
      });
      const rejectedClick = await report(page);
      expect(rejectedClick.selected, "a delivered Control-click cannot select a flower").toEqual([]);
      expect(rejectedClick.moves).toBe(before.moves);
      expect(rejectedClick.counts).toEqual(before.counts);
      expect(rejectedClick.boardState).toBe(before.boardState);
      expect(rejectedClick.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(rejectedClick.guideVisible).toBe(true);
      expect(rejectedClick.active).toBe(SOURCE_ID);
      expect(rejectedClick.roving).toEqual([SOURCE_ID]);

      const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
      expect(box, "opening source has geometry").toBeTruthy();
      const start = {
        x: Math.round(box.x + box.width / 2),
        y: Math.round(box.y + box.height / 2)
      };
      await page.keyboard.down("Control");
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, start.y + 18);

      const held = await report(page);
      expect(held.controlPointerDowns, "the browser delivered a Control-primary pointer command").toBe(1);
      expect(held.preview, "Control-primary drag never previews a flower exchange").toEqual([]);
      expect(held.ready).toEqual([]);
      expect(held.transformed).toEqual([]);
      expect(held.selected).toEqual([]);
      expect(held.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.guideVisible).toBe(true);
      expect(held.moves).toBe(before.moves);
      expect(held.counts).toEqual(before.counts);
      expect(held.boardState).toBe(before.boardState);

      await page.mouse.up();
      await page.keyboard.up("Control");
      await page.waitForTimeout(400);
      const rejectedDrag = await report(page);
      expect(rejectedDrag.moves, "Control-primary release spends no move").toBe(before.moves);
      expect(rejectedDrag.counts).toEqual(before.counts);
      expect(rejectedDrag.boardState).toBe(before.boardState);
      expect(rejectedDrag.preview).toEqual([]);
      expect(rejectedDrag.ready).toEqual([]);
      expect(rejectedDrag.transformed).toEqual([]);
      expect(rejectedDrag.selected).toEqual([]);
      expect(rejectedDrag.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(rejectedDrag.guideVisible).toBe(true);
      expect(rejectedDrag.active).toBe(SOURCE_ID);
      expect(rejectedDrag.roving).toEqual([SOURCE_ID]);

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, start.y + 18);
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      await page.mouse.up();

      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "ordinary primary drag still earns the taught match once").toBe(3);
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
      if (profile.label === "mobile390-full") {
        await page.screenshot({ path: "work/control-context-authority-mobile390-settled.png", fullPage: true });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
