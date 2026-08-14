const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-source-full", viewport: { width: 1280, height: 720 }, from: SOURCE_ID, dy: 18 },
  { label: "desktop-target-reduced-cancel", viewport: { width: 1280, height: 720 }, from: TARGET_ID, dy: -18, reduced: true, cancel: true },
  { label: "mobile390-source-full-cancel", viewport: { width: 390, height: 844 }, from: SOURCE_ID, dy: 18, mobile: true, cancel: true },
  { label: "mobile390-target-reduced", viewport: { width: 390, height: 844 }, from: TARGET_ID, dy: -18, mobile: true, reduced: true }
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
      guideMode: document.querySelector(".first-action-swap-guide")?.dataset.mode || "",
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id).sort(),
      ready: [sourceId, targetId].filter((id) => document.querySelector(`#${id}`)?.classList.contains("drag-preview-ready")),
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
  }, { key: SAVE_KEY, sourceId: SOURCE_ID, targetId: TARGET_ID });
}

async function holdPair(page, context, profile, pointerId = 71) {
  const box = await page.locator(`#${profile.from}`).boundingBox();
  expect(box, "drag source has geometry").toBeTruthy();
  const start = {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2)
  };
  const end = { x: start.x, y: start.y + profile.dy };
  if (profile.mobile) {
    const client = await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: pointerId }]
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...end, id: pointerId }]
    });
    await page.waitForTimeout(40);
    await expect.poll(async () => (await report(page)).preview).toEqual([SOURCE_ID, TARGET_ID]);
    return { client, end, pointerId };
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await expect.poll(async () => (await report(page)).preview).toEqual([SOURCE_ID, TARGET_ID]);
  return { client: null, end, pointerId: 1 };
}

async function releasePair(page, profile, drag) {
  if (profile.mobile) {
    await drag.client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
      changedTouchPoints: [{ ...drag.end, id: drag.pointerId }]
    });
    return;
  }
  await page.mouse.up();
}

for (const profile of PROFILES) {
  test(`${profile.label}: drag ownership restores interrupted selection only on cancel`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?selected-drag-takeover=${profile.label}`, { waitUntil: "networkidle" });
      const selectedCopy = "Tap Thorn Rose below.";
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await report(page)).selected).toEqual([SOURCE_ID]);
      const selected = await report(page);
      expect(selected.save).toBe(before.save);
      expect(selected.active).toBe(TARGET_ID);
      expect(selected.roving).toEqual([TARGET_ID]);

      let drag = await holdPair(page, context, profile);
      const held = await report(page);
      expect(held.save, "drag takeover is presentation-only").toBe(before.save);
      expect(held.moves).toBe(before.moves);
      expect(held.counts).toEqual(before.counts);
      expect(held.boardState).toBe(before.boardState);
      expect(held.selected, "the old keyboard owner retires at drag intent").toEqual([]);
      expect(held.ready).toEqual([SOURCE_ID, TARGET_ID]);
      expect(held.active).toBe(profile.from);
      expect(held.roving).toEqual([profile.from]);

      if (profile.cancel) {
        await page.keyboard.press("Escape");
        await expect.poll(async () => (await report(page)).preview).toEqual([]);
        const canceled = await report(page);
        expect(canceled.save).toBe(before.save);
        expect(canceled.moves).toBe(before.moves);
        expect(canceled.counts).toEqual(before.counts);
        expect(canceled.boardState).toBe(before.boardState);
        expect(canceled.selected).toEqual([SOURCE_ID]);
        expect(canceled.transformed).toEqual([]);
        expect(canceled.hints).toEqual([SOURCE_ID, TARGET_ID]);
        expect(canceled.guideVisible).toBe(true);
        expect(canceled.guideMode).toBe("destination");
        expect(canceled.tutorialCopy).toBe(selectedCopy);
        expect(canceled.active).toBe(profile.from);
        expect(canceled.roving).toEqual([profile.from]);
        if (!profile.mobile) await page.mouse.move(1, 1);
        await releasePair(page, profile, drag);
        await page.waitForTimeout(350);
        const staleLift = await report(page);
        expect(staleLift.save).toBe(before.save);
        expect(staleLift.selected).toEqual([SOURCE_ID]);
        expect(staleLift.guideMode).toBe("destination");
        expect(staleLift.active).toBe(profile.from);
        expect(staleLift.roving).toEqual([profile.from]);
        drag = await holdPair(page, context, profile, 72);
      }

      await releasePair(page, profile, drag);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "drag takeover earns the taught match once").toBe(3);
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
      if (profile.label === "mobile390-source-full-cancel") {
        await page.screenshot({ path: "work/selected-drag-takeover-mobile390-settled.png", fullPage: true });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
