const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-enter-source-full", viewport: { width: 1280, height: 720 }, key: "Enter", from: SOURCE_ID },
  { label: "desktop-space-source-reduced", viewport: { width: 1280, height: 720 }, key: " ", from: SOURCE_ID, reduced: true },
  { label: "mobile390-enter-source-reduced", viewport: { width: 390, height: 844 }, key: "Enter", from: SOURCE_ID, reduced: true, mobile: true },
  { label: "mobile390-space-source-full", viewport: { width: 390, height: 844 }, key: " ", from: SOURCE_ID, mobile: true }
];

test.setTimeout(60000);

function keyDefinition(key, autoRepeat = false) {
  const space = key === " ";
  return {
    type: "keyDown",
    key,
    code: space ? "Space" : "Enter",
    windowsVirtualKeyCode: space ? 32 : 13,
    nativeVirtualKeyCode: space ? 32 : 13,
    autoRepeat
  };
}

async function releaseKey(client, key) {
  const definition = keyDefinition(key);
  await client.send("Input.dispatchKeyEvent", { ...definition, type: "keyUp" });
}

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
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id),
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

for (const profile of PROFILES) {
  test(`${profile.label}: held activation selects but cannot commit`, async ({ browser }) => {
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
      await page.goto(`${BASE_URL}?keyboard-repeat=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
      await page.locator(`#${SOURCE_ID}`).focus();
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();

      const before = await report(page);
      expect(before.moves).toBe(6);
      expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
      const client = await context.newCDPSession(page);
      await client.send("Input.dispatchKeyEvent", keyDefinition(profile.key));
      const counterpart = profile.from === SOURCE_ID ? TARGET_ID : SOURCE_ID;
      await expect.poll(async () => (await report(page)).selected).toEqual([profile.from]);
      await expect(page.locator(`#${counterpart}`)).toBeFocused();
      const selected = await report(page);
      expect(selected.save).toBe(before.save);
      expect(selected.moves).toBe(before.moves);
      expect(selected.boardState).toBe(before.boardState);
      expect(selected.active).toBe(counterpart);
      expect(selected.roving).toEqual([counterpart]);

      for (let index = 0; index < 5; index += 1) {
        await client.send("Input.dispatchKeyEvent", keyDefinition(profile.key, true));
        await page.waitForTimeout(55);
      }
      const held = await report(page);
      expect(held.save, "OS key repeat cannot spend the move").toBe(before.save);
      expect(held.moves).toBe(before.moves);
      expect(held.counts).toEqual(before.counts);
      expect(held.boardState).toBe(before.boardState);
      expect(held.selected).toEqual([profile.from]);
      expect(held.active).toBe(counterpart);
      expect(held.roving).toEqual([counterpart]);
      expect(held.preview).toEqual([]);

      await releaseKey(client, profile.key);
      await page.waitForTimeout(120);
      const released = await report(page);
      expect(released.save).toBe(before.save);
      expect(released.selected).toEqual([profile.from]);
      expect(released.active).toBe(counterpart);
      expect(released.roving).toEqual([counterpart]);

      await client.send("Input.dispatchKeyEvent", keyDefinition(profile.key));
      await releaseKey(client, profile.key);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await report(page);
      expect(settled.counts[5], "a fresh press commits exactly once").toBe(3);
      expect(settled.boardState).not.toBe(before.boardState);
      expect(settled.selected).toEqual([]);
      expect(settled.preview).toEqual([]);
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
      if (profile.label === "mobile390-space-source-full") {
        await page.screenshot({ path: "work/keyboard-repeat-mobile390-settled.png", fullPage: true });
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
