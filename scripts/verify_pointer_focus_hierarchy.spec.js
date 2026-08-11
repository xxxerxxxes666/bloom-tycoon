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
    const outline = (node) => {
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth) || 0,
        color: style.outlineColor
      };
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board").getBoundingClientRect();
    const active = document.activeElement;
    return {
      save: localStorage.getItem(key),
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      bodyClasses: document.body.className,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      outlined: tiles.filter((tile) => {
        const style = getComputedStyle(tile);
        return style.outlineStyle !== "none" && (Number.parseFloat(style.outlineWidth) || 0) > 0;
      }).map((tile) => tile.id),
      active: active?.id || "",
      activeOutline: active ? outline(active) : null,
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id),
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

async function touchTap(page, client, selector, identifier) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} has geometry`).toBeTruthy();
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: identifier, radiusX: 2, radiusY: 2, force: 1 }]
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function commitOpeningPair(page, context, mobile) {
  if (!mobile) {
    await page.locator(`#${SOURCE_ID}`).click();
    await expect(page.locator(`#${SOURCE_ID}`)).toHaveClass(/\bsel\b/);
    await page.locator(`#${TARGET_ID}`).click();
    return;
  }
  const client = await context.newCDPSession(page);
  await touchTap(page, client, `#${SOURCE_ID}`, 31);
  await expect(page.locator(`#${SOURCE_ID}`)).toHaveClass(/\bsel\b/);
  await touchTap(page, client, `#${TARGET_ID}`, 32);
}

for (const profile of PROFILES) {
  test(`${profile.label}: pointer play leaves only gameplay-owned board outlines`, async ({ browser }) => {
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
      }, { key: SAVE_KEY, marker: `pointer-focus-hierarchy:${profile.label}` });
      await page.goto(`${BASE_URL}?pointer-focus-hierarchy=${profile.label}`, { waitUntil: "networkidle" });
      await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });

      await commitOpeningPair(page, context, profile.mobile);
      await expect.poll(async () => (await report(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      await expect.poll(async () => (await report(page)).hints, { timeout: 15000 }).toHaveLength(2);
      await expect.poll(async () => (await report(page)).outlined, { timeout: 1000 }).toHaveLength(2);

      const hinted = await report(page);
      expect(hinted.counts[5]).toBe(3);
      expect(hinted.bodyClasses).toContain("pointer-board-input");
      expect(hinted.cue).toBe("Match Thorn Rose with the glowing pair.");
      expect(hinted.active).toBe(TARGET_ID);
      expect(hinted.activeOutline.style).toBe("none");
      expect(hinted.hints).toHaveLength(2);
      expect(hinted.hints).not.toContain(TARGET_ID);
      expect(hinted.outlined.sort()).toEqual([...hinted.hints].sort());
      expect(hinted.roving).toEqual([TARGET_ID]);
      expect(hinted.selected).toEqual([]);
      expect(hinted.preview).toEqual([]);

      if (profile.label === "mobile390-touch-full") {
        await page.screenshot({ path: "work/pointer-focus-hierarchy-mobile390.png", fullPage: true });
      }

      await page.keyboard.press("ArrowRight");
      const keyboard = await report(page);
      expect(keyboard.save, "focus navigation does not mutate the settled game").toBe(hinted.save);
      expect(keyboard.moves).toBe(hinted.moves);
      expect(keyboard.counts).toEqual(hinted.counts);
      expect(keyboard.boardState).toBe(hinted.boardState);
      expect(keyboard.bodyClasses).toContain("keyboard-board-navigation");
      expect(keyboard.active).toBe("tile-2-1");
      expect(keyboard.activeOutline.style).toBe("solid");
      expect(keyboard.activeOutline.width).toBe(3);
      expect(keyboard.activeOutline.color).toBe("rgb(188, 232, 235)");
      expect(keyboard.roving).toEqual(["tile-2-1"]);
      expect(keyboard.outlined).toEqual(["tile-2-1"]);

      await page.keyboard.press("Tab");
      await expect.poll(async () => {
        const state = await report(page);
        return state.active === "tutorialHelpBtn" ? state.activeOutline.width : -1;
      }, { timeout: 1000 }).toBe(2);
      const command = await report(page);
      expect(command.save).toBe(hinted.save);
      expect(command.active).toBe("tutorialHelpBtn");
      expect(command.activeOutline.style).toBe("solid");
      expect(command.activeOutline.width).toBe(2);
      expect(command.activeOutline.color).toBe("rgb(215, 177, 109)");
      expect(command.enabled).toBe(64);
      expect(command.tiles).toBe(64);
      expect(command.rows).toBe(8);
      expect(command.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(command.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(command.overflowX).toBe(false);
      expect(command.brokenImages).toEqual([]);
      if (profile.mobile) {
        expect(command.board.bottom).toBeLessThanOrEqual(844);
        expect(command.scrollY).toBe(0);
      }
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
