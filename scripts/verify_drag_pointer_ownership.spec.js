const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  {
    label: "desktop-full-secondary-pen",
    viewport: { width: 1280, height: 720 },
    secondaryPointerType: "pen"
  },
  {
    label: "desktop-reduced-secondary-touch",
    viewport: { width: 1280, height: 720 },
    secondaryPointerType: "touch",
    reduced: true
  },
  {
    label: "mobile390-full-secondary-touch",
    viewport: { width: 390, height: 844 },
    secondaryPointerType: "touch",
    mobile: true
  },
  {
    label: "mobile390-reduced-secondary-pen",
    viewport: { width: 390, height: 844 },
    secondaryPointerType: "pen",
    mobile: true,
    reduced: true
  }
];

test.setTimeout(60000);

async function snapshot(page) {
  return page.evaluate(({ key, sourceId }) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board");
    const boardRect = board.getBoundingClientRect();
    const source = document.querySelector(`#${sourceId}`);
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const primaryPointerId = window.__primaryBoardPointerId;
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
      transformed: tiles
        .filter((tile) => tile.style.transform)
        .map((tile) => ({ id: tile.id, transform: tile.style.transform })),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      primaryPointerId,
      primaryMoveCount: window.__primaryBoardMoves || 0,
      sourceHasCapture: Number.isInteger(primaryPointerId)
        ? source.hasPointerCapture(primaryPointerId)
        : false,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabled: tiles.filter((tile) => !tile.disabled).length,
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
  for (const secondaryTermination of ["pointerup", "pointercancel"]) {
  test(`${profile.label}: secondary ${secondaryTermination} cannot steal the primary drag`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?drag-pointer-ownership=${profile.label}-${secondaryTermination}`, {
        waitUntil: "networkidle"
      });
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__primaryBoardPointerId = null;
        window.__primaryBoardMoves = 0;
        const board = document.querySelector("#board");
        board.addEventListener("pointerdown", (event) => {
          if (event.isPrimary) window.__primaryBoardPointerId = event.pointerId;
        }, true);
        board.addEventListener("pointermove", (event) => {
          if (event.isPrimary) window.__primaryBoardMoves += 1;
        }, true);
      });

      const before = await snapshot(page);
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
      const held = await snapshot(page);
      expect(held.preview).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.ready).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.sourceHasCapture, "primary source owns pointer capture").toBe(true);
      expect(Number.isInteger(held.primaryPointerId)).toBe(true);

      const secondaryPointerId = held.primaryPointerId + 700;
      const secondaryInit = {
        pointerId: secondaryPointerId,
        pointerType: profile.secondaryPointerType,
        isPrimary: false,
        clientX: start.x + 4,
        clientY: start.y + 4,
        button: 0,
        buttons: 1
      };
      await page.dispatchEvent(`#${SOURCE_ID}`, "pointerdown", secondaryInit);
      await page.dispatchEvent(`#${SOURCE_ID}`, secondaryTermination, {
        ...secondaryInit,
        button: 0,
        buttons: 0
      });

      const afterSecondary = await snapshot(page);
      expect(afterSecondary.moves, "secondary termination spends no move").toBe(before.moves);
      expect(afterSecondary.counts).toEqual(before.counts);
      expect(afterSecondary.boardState).toBe(before.boardState);
      expect(afterSecondary.preview, "primary preview remains authoritative").toEqual([SOURCE_ID, TARGET_ID]);
      expect(afterSecondary.ready).toEqual([SOURCE_ID, TARGET_ID]);
      expect(afterSecondary.sourceHasCapture, "secondary termination preserves primary capture").toBe(true);
      expect(afterSecondary.primaryPointerId).toBe(held.primaryPointerId);

      await page.mouse.move(start.x, start.y + 26);
      const continued = await snapshot(page);
      expect(continued.preview, "continued primary movement still tracks").toEqual([SOURCE_ID, TARGET_ID]);
      expect(continued.ready).toEqual([SOURCE_ID, TARGET_ID]);
      expect(continued.primaryMoveCount).toBeGreaterThan(afterSecondary.primaryMoveCount);
      expect(continued.sourceHasCapture).toBe(true);
      if (profile.reduced) {
        expect(continued.transformed).toEqual([]);
      } else {
        expect(continued.transformed.map((entry) => entry.id)).toEqual([SOURCE_ID, TARGET_ID]);
        expect(continued.transformed).not.toEqual(held.transformed);
      }

      await page.mouse.up();
      await expect.poll(async () => (await snapshot(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await snapshot(page);
      expect(settled.moves).toBe(before.moves - 1);
      expect(settled.counts[5], "primary release earns the taught Thorn Rose match once").toBe(3);
      expect(settled.boardState).not.toBe(before.boardState);
      expect(settled.preview).toEqual([]);
      expect(settled.ready).toEqual([]);
      expect(settled.transformed).toEqual([]);
      expect(settled.selected).toEqual([]);
      expect(settled.sourceHasCapture).toBe(false);
      expect(settled.roving).toHaveLength(1);
      if (settled.active) expect(settled.active).toBe(settled.roving[0]);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.enabled).toBe(64);
      expect(settled.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      if (profile.mobile) {
        expect(settled.board.bottom).toBeLessThanOrEqual(844);
        expect(settled.scrollY).toBe(0);
      }
      if (profile.label === "mobile390-full-secondary-touch") {
        await page.screenshot({
          path: "work/drag-pointer-ownership-mobile390-settled.png",
          fullPage: true
        });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
  }

  test(`${profile.label}: genuine primary cancellation retires cleanly`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?drag-pointer-ownership=${profile.label}-primary-cancel`, {
        waitUntil: "networkidle"
      });
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__primaryBoardPointerId = null;
        window.__primaryBoardMoves = 0;
        const board = document.querySelector("#board");
        board.addEventListener("pointerdown", (event) => {
          if (event.isPrimary) window.__primaryBoardPointerId = event.pointerId;
        }, true);
      });

      const before = await snapshot(page);
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
      const held = await snapshot(page);
      expect(held.sourceHasCapture).toBe(true);

      await page.dispatchEvent(`#${SOURCE_ID}`, "pointercancel", {
        pointerId: held.primaryPointerId,
        pointerType: "mouse",
        isPrimary: true,
        clientX: start.x,
        clientY: start.y + 18,
        button: 0,
        buttons: 0
      });
      const canceled = await snapshot(page);
      expect(canceled.moves, "primary cancellation spends no move").toBe(before.moves);
      expect(canceled.counts).toEqual(before.counts);
      expect(canceled.boardState).toBe(before.boardState);
      expect(canceled.preview).toEqual([]);
      expect(canceled.ready).toEqual([]);
      expect(canceled.transformed).toEqual([]);
      expect(canceled.selected).toEqual([]);
      expect(canceled.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(canceled.guideVisible).toBe(true);
      expect(canceled.roving).toEqual([SOURCE_ID]);

      await page.mouse.up();
      await page.waitForTimeout(500);
      const settled = await snapshot(page);
      expect(settled.moves).toBe(before.moves);
      expect(settled.counts).toEqual(before.counts);
      expect(settled.boardState).toBe(before.boardState);
      expect(settled.preview).toEqual([]);
      expect(settled.ready).toEqual([]);
      expect(settled.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(settled.guideVisible).toBe(true);
      expect(settled.sourceHasCapture).toBe(false);
      expect(settled.active).toBe(SOURCE_ID);
      expect(settled.roving).toEqual([SOURCE_ID]);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.enabled).toBe(64);
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
