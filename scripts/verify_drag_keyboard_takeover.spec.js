const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-enter-release-first", viewport: { width: 1280, height: 720 }, key: "Enter", releaseFirst: true },
  { label: "desktop-space-commit-first", viewport: { width: 1280, height: 720 }, key: "Space", reduced: true },
  { label: "mobile390-space-release-first", viewport: { width: 390, height: 844 }, key: "Space", mobile: true, releaseFirst: true },
  { label: "mobile390-enter-commit-first", viewport: { width: 390, height: 844 }, key: "Enter", mobile: true, reduced: true }
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
      activationEvents: window.__dragKeyboardActivationEvents || [],
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

async function holdOpeningPair(page) {
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

async function releaseStalePointer(page) {
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await page.waitForTimeout(400);
}

for (const profile of PROFILES) {
  test(`${profile.label}: keyboard activation takes over a live pointer drag`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?drag-keyboard-takeover=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      await page.evaluate(() => {
        window.__dragKeyboardActivationEvents = [];
        document.querySelector("#board").addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            window.__dragKeyboardActivationEvents.push({
              key: event.key,
              trusted: event.isTrusted,
              prevented: event.defaultPrevented
            });
          }
        });
      });

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
      await holdOpeningPair(page);
      const held = await report(page);
      expect(held.ready).toEqual([SOURCE_ID, TARGET_ID]);

      await page.keyboard.press(profile.key);
      await expect.poll(async () => (await report(page)).selected).toEqual([SOURCE_ID]);
      const takeover = await report(page);
      expect(takeover.activationEvents).toEqual([{
        key: profile.key === "Space" ? " " : "Enter",
        trusted: true,
        prevented: true
      }]);
      expect(takeover.save).toBe(before.save);
      expect(takeover.moves).toBe(before.moves);
      expect(takeover.counts).toEqual(before.counts);
      expect(takeover.boardState).toBe(before.boardState);
      expect(takeover.preview).toEqual([]);
      expect(takeover.ready).toEqual([]);
      expect(takeover.transformed).toEqual([]);
      expect(takeover.hints).toEqual([SOURCE_ID, TARGET_ID]);
      expect(takeover.guideVisible).toBe(true);
      expect(takeover.active).toBe(TARGET_ID);
      expect(takeover.roving).toEqual([TARGET_ID]);

      if (profile.releaseFirst) {
        await releaseStalePointer(page);
        const staleLift = await report(page);
        expect(staleLift.save, "the stale pointer tail cannot erase keyboard ownership").toBe(before.save);
        expect(staleLift.moves).toBe(before.moves);
        expect(staleLift.counts).toEqual(before.counts);
        expect(staleLift.boardState).toBe(before.boardState);
        expect(staleLift.preview).toEqual([]);
        expect(staleLift.transformed).toEqual([]);
        expect(staleLift.selected).toEqual([SOURCE_ID]);
        expect(staleLift.active).toBe(TARGET_ID);
        expect(staleLift.roving).toEqual([TARGET_ID]);
      }

      await page.keyboard.press(profile.key);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });

      if (!profile.releaseFirst) await releaseStalePointer(page);
      const settled = await report(page);
      expect(settled.counts[5], "keyboard takeover earns the taught match once").toBe(3);
      expect(settled.boardState).not.toBe(before.boardState);
      expect(settled.preview).toEqual([]);
      expect(settled.ready).toEqual([]);
      expect(settled.transformed).toEqual([]);
      expect(settled.selected, "the stale pointer tail cannot select the rebuilt board").toEqual([]);
      expect(settled.roving).toHaveLength(1);
      if (settled.active) expect(settled.active).toBe(settled.roving[0]);
      expect(settled.activationEvents).toHaveLength(2);
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
      if (profile.label === "mobile390-space-release-first") {
        await page.screenshot({ path: "work/drag-keyboard-takeover-mobile390-settled.png", fullPage: true });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
