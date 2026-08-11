const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-source-inside-full", viewport: { width: 1280, height: 720 }, from: SOURCE_ID, dy: 18 },
  { label: "desktop-target-outside-reduced", viewport: { width: 1280, height: 720 }, from: TARGET_ID, dy: -18, reduced: true, outside: true },
  { label: "mobile390-source-inside-reduced", viewport: { width: 390, height: 844 }, from: SOURCE_ID, dy: 18, reduced: true, mobile: true },
  { label: "mobile390-target-outside-full", viewport: { width: 390, height: 844 }, from: TARGET_ID, dy: -18, outside: true, mobile: true }
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
    const boardRect = document.querySelector("#board").getBoundingClientRect();
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
      )).map((tile) => tile.id).sort(),
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
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function pointFor(page, id, pointerId) {
  const box = await page.locator(`#${id}`).boundingBox();
  expect(box, `${id} has geometry`).toBeTruthy();
  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2),
    id: pointerId
  };
}

async function ordinaryDrag(page, client, profile, pointerId) {
  const start = await pointFor(page, profile.from, pointerId);
  const end = { ...start, y: start.y + profile.dy };
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [end] });
  await expect.poll(async () => (await report(page)).preview).toEqual([SOURCE_ID, TARGET_ID]);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

for (const profile of PROFILES) {
  test(`${profile.label}: a second finger cancels the held flower pair`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: true,
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
      await page.goto(`${BASE_URL}?multitouch-cancel=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);

      const client = await context.newCDPSession(page);
      const first = await pointFor(page, profile.from, 31);
      const firstMoved = { ...first, y: first.y + profile.dy };
      const second = profile.outside
        ? { x: 8, y: 8, id: 42 }
        : await pointFor(page, "tile-5-5", 42);
      const secondMoved = { ...second, x: second.x + 1 };

      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first] });
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [firstMoved] });
      await expect.poll(async () => (await report(page)).preview).toEqual([SOURCE_ID, TARGET_ID]);

      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [firstMoved, second]
      });
      if (profile.outside) {
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [firstMoved, secondMoved]
        });
      }
      await expect.poll(async () => (await report(page)).preview).toEqual([]);
      const canceled = await report(page);
      expect(canceled.save, "multi-touch cancellation is presentation-only").toBe(before.save);
      expect(canceled.moves).toBe(before.moves);
      expect(canceled.counts).toEqual(before.counts);
      expect(canceled.boardState).toBe(before.boardState);
      expect(canceled.transformed).toEqual([]);
      expect(canceled.selected).toEqual([]);
      expect(canceled.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(canceled.guideVisible).toBe(true);
      expect(canceled.active).toBe(profile.from);
      expect(canceled.roving).toEqual([profile.from]);

      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [firstMoved]
      });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(450);
      const staleTails = await report(page);
      expect(staleTails.save).toBe(before.save);
      expect(staleTails.moves).toBe(before.moves);
      expect(staleTails.counts).toEqual(before.counts);
      expect(staleTails.boardState).toBe(before.boardState);
      expect(staleTails.preview).toEqual([]);
      expect(staleTails.transformed).toEqual([]);
      expect(staleTails.selected).toEqual([]);
      expect(staleTails.active).toBe(profile.from);
      expect(staleTails.roving).toEqual([profile.from]);

      await ordinaryDrag(page, client, profile, 51);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "the fresh one-finger drag commits once").toBe(3);
      expect(settled.boardState).not.toBe(before.boardState);
      expect(settled.preview).toEqual([]);
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
      if (profile.label === "mobile390-target-outside-full") {
        await page.screenshot({ path: "work/multitouch-cancel-mobile390-settled.png", fullPage: true });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
