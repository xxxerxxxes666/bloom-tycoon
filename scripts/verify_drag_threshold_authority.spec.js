const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";
const COMMIT_DISTANCE = 18;

const PROFILES = [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-reduced-pointer", viewport: { width: 1280, height: 720 }, input: "pointer", reduced: true },
  { label: "mobile390-full-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile390-reduced-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];
const DISTANCES = [6, 12, 17, COMMIT_DISTANCE];

test.setTimeout(60000);

async function snapshot(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board");
    const boardRect = board.getBoundingClientRect();
    const guide = document.querySelector(".first-action-swap-guide");
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
      )).map((tile) => tile.id),
      ready: tiles.filter((tile) => tile.classList.contains("drag-preview-ready")).map((tile) => tile.id),
      transformed: tiles.filter((tile) => tile.style.transform).map((tile) => tile.id),
      boardPreviewClasses: ["drag-preview-active", "drag-preview-ready"]
        .filter((className) => board.classList.contains(className)),
      guideVisible: visible(guide),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
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
  }, SAVE_KEY);
}

async function dragCoordinates(page, distance) {
  const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
  expect(box, "opening source has geometry").toBeTruthy();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  return { start, end: { x: start.x, y: start.y + distance } };
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
  for (const distance of DISTANCES) {
    test(`${profile.label}: ${distance}px has truthful drag commitment`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: profile.viewport,
        hasTouch: Boolean(profile.mobile),
        isMobile: Boolean(profile.mobile)
      });
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
        await page.goto(`${BASE_URL}?drag-threshold=${profile.label}-${distance}`, { waitUntil: "networkidle" });
        await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
        await expect(page.locator("#board .tile")).toHaveCount(64);
        await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
        const before = await snapshot(page);
        expect(before.moves).toBe(6);
        expect(before.counts).toEqual([0, 0, 0, 0, 0, 0]);
        expect(before.hints).toEqual([SOURCE_ID, TARGET_ID]);
        expect(before.guideVisible).toBe(true);
        expect(before.roving).toEqual([SOURCE_ID]);

        const coordinates = await dragCoordinates(page, distance);
        if (profile.input === "touch") {
          client = await context.newCDPSession(page);
          await beginTouchDrag(client, coordinates, 51);
        } else {
          await beginPointerDrag(page, coordinates);
        }
        const during = await snapshot(page);
        if (distance < COMMIT_DISTANCE) {
          expect(during.preview, `${distance}px does not nominate a neighbor`).toEqual([]);
          expect(during.ready, `${distance}px does not claim readiness`).toEqual([]);
          expect(during.transformed, `${distance}px keeps both flowers anchored`).toEqual([]);
          expect(during.boardPreviewClasses, `${distance}px keeps the guide owner visible`).toEqual([]);
          expect(during.guideVisible, `${distance}px remains visibly noncommittal`).toBe(true);
          expect(during.hints).toEqual([SOURCE_ID, TARGET_ID]);
        } else {
          expect(during.preview, "18px nominates the exact authored pair").toEqual([SOURCE_ID, TARGET_ID]);
          expect(during.ready, "18px marks both endpoints ready").toEqual([SOURCE_ID, TARGET_ID]);
          expect(during.boardPreviewClasses).toEqual(["drag-preview-active", "drag-preview-ready"]);
          expect(during.guideVisible, "ready flowers take over from the guide").toBe(false);
          if (profile.reduced) {
            expect(during.transformed).toEqual([]);
          } else {
            expect(during.transformed).toEqual([SOURCE_ID, TARGET_ID]);
          }
        }

        if (profile.mobile && !profile.reduced && [17, COMMIT_DISTANCE].includes(distance)) {
          await page.screenshot({
            path: `work/drag-threshold-mobile390-${distance}px.png`,
            fullPage: true
          });
        }
        if (profile.input === "touch") {
          await endTouchDrag(client, coordinates, 51);
        } else {
          await page.mouse.up();
        }

        if (distance < COMMIT_DISTANCE) {
          await page.waitForTimeout(420);
          const settled = await snapshot(page);
          expect(settled.moves, `${distance}px spends no move`).toBe(before.moves);
          expect(settled.counts, `${distance}px earns no progress`).toEqual(before.counts);
          expect(settled.boardState, `${distance}px leaves the board unchanged`).toBe(before.boardState);
          expect(settled.selected, `${distance}px does not become an accidental tap`).toEqual(before.selected);
          expect(settled.preview).toEqual([]);
          expect(settled.transformed).toEqual([]);
          expect(settled.guideVisible).toBe(true);
          expect(settled.hints).toEqual([SOURCE_ID, TARGET_ID]);
          expect(settled.active).toBe(SOURCE_ID);
          expect(settled.roving).toEqual([SOURCE_ID]);
        } else {
          await expect.poll(async () => (await snapshot(page)).moves, { timeout: 12000 }).toBe(5);
          await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
          const settled = await snapshot(page);
          expect(settled.counts[5], "18px earns the real Thorn Rose match").toBe(3);
          expect(settled.boardState, "18px commits the authored exchange").not.toBe(before.boardState);
          expect(settled.selected).toEqual([]);
          expect(settled.preview).toEqual([]);
          expect(settled.transformed).toEqual([]);
          expect(settled.roving).toHaveLength(1);
          if (settled.active) {
            expect(settled.active).toBe(settled.roving[0]);
          }
        }

        const final = await snapshot(page);
        expect(final.tiles).toBe(64);
        expect(final.rows).toBe(8);
        expect(final.enabled).toBe(64);
        expect(final.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
        expect(final.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
        expect(final.overflowX).toBe(false);
        expect(final.brokenImages).toEqual([]);
        if (profile.mobile) {
          expect(final.board.bottom).toBeLessThanOrEqual(844);
          expect(final.scrollY).toBe(0);
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
}
