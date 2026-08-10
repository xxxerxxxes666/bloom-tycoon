const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  {
    label: "desktop-full-right-mouse",
    viewport: { width: 1280, height: 720 },
    nativeButton: "right",
    button: 2
  },
  {
    label: "desktop-reduced-middle-mouse",
    viewport: { width: 1280, height: 720 },
    nativeButton: "middle",
    button: 1,
    reduced: true
  },
  {
    label: "mobile390-full-pen-barrel",
    viewport: { width: 390, height: 844 },
    pointerType: "pen",
    button: 2,
    mobile: true
  },
  {
    label: "mobile390-reduced-pen-middle",
    viewport: { width: 390, height: 844 },
    pointerType: "pen",
    button: 1,
    mobile: true,
    reduced: true
  }
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
      sourceCaptures: source?.hasPointerCapture(window.__ordinaryPointerId || -1) || false,
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

async function nonPrimaryDrag(page, profile, start) {
  if (profile.nativeButton) {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down({ button: profile.nativeButton });
    await page.mouse.move(start.x, start.y + 18);
    return async () => page.mouse.up({ button: profile.nativeButton });
  }
  const pointerId = 740 + profile.button;
  const base = {
    pointerId,
    pointerType: profile.pointerType,
    isPrimary: true,
    clientX: start.x,
    clientY: start.y,
    button: profile.button,
    buttons: 1 << profile.button
  };
  await page.dispatchEvent(`#${SOURCE_ID}`, "pointerdown", base);
  await page.dispatchEvent(`#${SOURCE_ID}`, "pointermove", {
    ...base,
    clientY: start.y + 18
  });
  return async () => page.dispatchEvent(`#${SOURCE_ID}`, "pointerup", {
    ...base,
    clientY: start.y + 18,
    buttons: 0
  });
}

for (const profile of PROFILES) {
  test(`${profile.label}: only the ordinary primary button can drag flowers`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?drag-button-authority=${profile.label}`, { waitUntil: "networkidle" });
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__ordinaryPointerId = null;
        document.querySelector("#board").addEventListener("pointerdown", (event) => {
          if (event.button === 0 && window.__ordinaryPointerId === null) {
            window.__ordinaryPointerId = event.pointerId;
          }
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

      const releaseNonPrimary = await nonPrimaryDrag(page, profile, start);
      const held = await report(page);
      expect(held.preview, "context button never previews a flower exchange").toEqual([]);
      expect(held.ready).toEqual([]);
      expect(held.transformed).toEqual([]);
      expect(held.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.guideVisible).toBe(true);
      expect(held.moves).toBe(before.moves);
      expect(held.counts).toEqual(before.counts);
      expect(held.boardState).toBe(before.boardState);

      await releaseNonPrimary();
      await page.waitForTimeout(400);
      const rejected = await report(page);
      expect(rejected.moves, "context button release spends no move").toBe(before.moves);
      expect(rejected.counts).toEqual(before.counts);
      expect(rejected.boardState).toBe(before.boardState);
      expect(rejected.preview).toEqual([]);
      expect(rejected.ready).toEqual([]);
      expect(rejected.transformed).toEqual([]);
      expect(rejected.selected).toEqual([]);
      expect(rejected.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(rejected.guideVisible).toBe(true);
      expect(rejected.roving).toEqual([SOURCE_ID]);

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, start.y + 18);
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      const ordinaryHeld = await report(page);
      expect(ordinaryHeld.preview).toEqual([SOURCE_ID, TARGET_ID]);
      expect(ordinaryHeld.ready).toEqual([SOURCE_ID, TARGET_ID]);
      expect(ordinaryHeld.sourceCaptures).toBe(true);
      await page.mouse.up();

      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "ordinary button still earns the taught match once").toBe(3);
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
      if (profile.label === "mobile390-full-pen-barrel") {
        await page.screenshot({ path: "work/drag-button-authority-mobile390-settled.png", fullPage: true });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
