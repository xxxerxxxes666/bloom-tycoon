const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-2-0";
const FIXTURE_BOARD = [
  [3, 0, 4, 4, 0, 3, 3, 0],
  [2, 0, 0, 2, 3, 4, 0, 2],
  [4, 2, 0, 0, 2, 3, 4, 0],
  [1, 2, 1, 1, 3, 5, 4, 1],
  [0, 4, 2, 4, 0, 2, 3, 3],
  [2, 3, 4, 3, 3, 4, 0, 4],
  [3, 4, 2, 2, 0, 2, 4, 3],
  [4, 2, 2, 4, 3, 3, 0, 3]
];

const PROFILES = [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-reduced-pointer", viewport: { width: 1280, height: 720 }, input: "pointer", reduced: true },
  { label: "mobile390-full-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile390-reduced-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

test.setTimeout(60000);

function savedState() {
  return {
    focusedEconomyVersion: 2,
    currentRound: 3,
    moves: 7,
    counts: [3, 0, 0, 3, 0, 0],
    coins: 50,
    board: FIXTURE_BOARD.map((row) => [...row]),
    armedLineRelic: null,
    cursedThorns: [],
    clearedCursedThorns: 0,
    roundComplete: false,
    roundOneRestored: true,
    roundTwoGreenhouseUpgraded: true,
    roundThreeConservatoryRaised: false,
    freshConservatorySettlement: false,
    hasMadeValidMove: true,
    restoredRoundTwoGuideMoves: 0,
    tutorialSkipped: true,
    tutorialActive: false,
    blackCandleLessonComplete: true
  };
}

async function snapshot(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board");
    const boardRect = board.getBoundingClientRect();
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabled: tiles.filter((tile) => !tile.disabled).length,
      previewTiles: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
        || tile.classList.contains("drag-preview-ready")
      )).map((tile) => tile.id),
      transformedTiles: tiles.filter((tile) => tile.style.transform).map((tile) => tile.id),
      boardPreviewClasses: ["drag-preview-active", "drag-preview-ready"]
        .filter((className) => board.classList.contains(className)),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      board: { width: boardRect.width, height: boardRect.height, bottom: boardRect.bottom },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function dragCoordinates(page) {
  const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
  expect(box, "drag source has geometry").toBeTruthy();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  return { start, end: { x: start.x + 32, y: start.y } };
}

async function beginPointerDrag(page, coordinates) {
  await page.mouse.move(coordinates.start.x, coordinates.start.y);
  await page.mouse.down();
  await page.mouse.move(coordinates.end.x, coordinates.end.y);
}

async function beginTouchDrag(client, coordinates, id) {
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...coordinates.start, id }]
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...coordinates.end, id }]
  });
}

async function endTouchDrag(client, coordinates, id) {
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
    changedTouchPoints: [{ ...coordinates.end, id }]
  });
}

for (const profile of PROFILES) {
  test(`${profile.label}: backgrounding cancels the live drag`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      hasTouch: Boolean(profile.mobile),
      isMobile: Boolean(profile.mobile)
    });
    await context.addInitScript(({ key, state }) => {
      localStorage.setItem(key, JSON.stringify(state));
    }, { key: SAVE_KEY, state: savedState() });
    const page = await context.newPage();
    const consoleProblems = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) consoleProblems.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`);
    });
    if (profile.reduced) {
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    let client = null;
    try {
      await page.goto(`${BASE_URL}?drag-visibility=${profile.label}`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        let forcedHidden = false;
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => forcedHidden
        });
        window.__setDragVisibilityHidden = (hidden) => {
          forcedHidden = hidden;
          document.dispatchEvent(new Event("visibilitychange"));
        };
      });
      await page.locator("#tile-0-0").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      expect((await snapshot(page)).roving).toEqual([SOURCE_ID]);

      const before = await snapshot(page);
      const coordinates = await dragCoordinates(page);
      if (profile.input === "touch") {
        client = await context.newCDPSession(page);
        await beginTouchDrag(client, coordinates, 41);
      } else {
        await beginPointerDrag(page, coordinates);
      }
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      const dragging = await snapshot(page);
      expect(dragging.previewTiles).toEqual([SOURCE_ID, TARGET_ID]);
      if (!profile.reduced) {
        expect(dragging.transformedTiles).toEqual([SOURCE_ID, TARGET_ID]);
      }

      await page.evaluate(() => window.__setDragVisibilityHidden(true));
      const hidden = await snapshot(page);
      expect(hidden.previewTiles, "hidden page retires tile preview classes").toEqual([]);
      expect(hidden.transformedTiles, "hidden page retires inline transforms").toEqual([]);
      expect(hidden.boardPreviewClasses, "hidden page retires board preview classes").toEqual([]);
      expect(hidden.moves, "interruption spends no move").toBe(before.moves);
      expect(hidden.counts, "interruption earns no progress").toEqual(before.counts);
      expect(hidden.boardState, "interruption does not mutate the board").toBe(before.boardState);
      expect(hidden.selected, "interruption preserves empty selection").toEqual(before.selected);
      expect(hidden.roving, "interruption anchors roving entry to the source").toEqual([SOURCE_ID]);

      await page.evaluate(() => window.__setDragVisibilityHidden(false));
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      expect((await snapshot(page)).roving).toEqual([SOURCE_ID]);

      if (profile.input === "touch") {
        await endTouchDrag(client, coordinates, 41);
      } else {
        await page.mouse.up();
      }
      await page.waitForTimeout(120);
      const afterStaleRelease = await snapshot(page);
      expect(afterStaleRelease.moves, "stale release cannot spend a move").toBe(before.moves);
      expect(afterStaleRelease.boardState, "stale release cannot swap tiles").toBe(before.boardState);

      if (profile.input === "touch") {
        await beginTouchDrag(client, coordinates, 42);
        await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
        await endTouchDrag(client, coordinates, 42);
      } else {
        await beginPointerDrag(page, coordinates);
        await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
        await page.mouse.up();
      }
      await expect.poll(async () => (await snapshot(page)).moves, { timeout: 12000 }).toBe(before.moves - 1);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await snapshot(page);
      expect(settled.boardState, "next drag starts fresh and commits").not.toBe(before.boardState);
      expect(settled.previewTiles).toEqual([]);
      expect(settled.transformedTiles).toEqual([]);
      expect(settled.selected).toEqual([]);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.enabled).toBe(64);
      expect(settled.roving).toHaveLength(1);
      expect(settled.overflowX).toBe(false);
      expect(settled.brokenImages).toEqual([]);
      expect(settled.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      expect(settled.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
      if (profile.mobile) {
        expect(settled.board.bottom).toBeLessThanOrEqual(844);
        expect(settled.scrollY).toBe(0);
      }
      if (profile.label === "mobile390-full-touch") {
        await page.screenshot({ path: "work/drag-visibility-mobile390-settled.png", fullPage: true });
      }
      expect(consoleProblems).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      if (client) await client.detach();
      await context.close();
    }
  });
}
