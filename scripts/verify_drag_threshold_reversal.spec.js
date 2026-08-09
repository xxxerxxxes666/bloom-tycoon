const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const PROFILES = [
  { label: "desktop-full-pointer", viewport: { width: 1280, height: 720 }, input: "pointer" },
  { label: "desktop-reduced-pointer", viewport: { width: 1280, height: 720 }, input: "pointer", reduced: true },
  { label: "mobile390-full-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true },
  { label: "mobile390-reduced-touch", viewport: { width: 390, height: 844 }, input: "touch", mobile: true, reduced: true }
];

test.setTimeout(90000);

async function openFresh(browser, profile, scenario) {
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
  await page.goto(`${BASE_URL}?drag-threshold-reversal=${profile.label}-${scenario}`, {
    waitUntil: "networkidle"
  });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#tutorialPanel")).toBeVisible({ timeout: 3000 });
  await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
  return { context, page, problems };
}

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
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      moves: state.moves,
      counts: state.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      hints: tiles.filter((tile) => tile.classList.contains("idle-hint")).map((tile) => tile.id),
      guideVisible: visible(document.querySelector(".first-action-swap-guide")),
      preview: tiles.filter((tile) => (
        tile.classList.contains("drag-preview-source")
        || tile.classList.contains("drag-preview-neighbor")
        || tile.classList.contains("drag-preview-ready")
      )).map((tile) => tile.id),
      transformed: tiles.filter((tile) => tile.style.transform).map((tile) => tile.id),
      boardPreviewClasses: ["drag-preview-active", "drag-preview-ready"]
        .filter((className) => board.classList.contains(className)),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
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

async function dragPoint(page, distance) {
  const box = await page.locator(`#${SOURCE_ID}`).boundingBox();
  expect(box, "opening source has geometry").toBeTruthy();
  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2) + distance
  };
}

async function beginDrag(page, context, profile) {
  const start = await dragPoint(page, 0);
  if (profile.input === "touch") {
    const client = await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 61 }]
    });
    return { start, client, pointerId: 61 };
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  return { start, client: null, pointerId: 1 };
}

async function moveDrag(page, drag, profile, distance) {
  const point = { x: drag.start.x, y: drag.start.y + distance };
  if (profile.input === "touch") {
    await drag.client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...point, id: drag.pointerId }]
    });
    await page.waitForTimeout(40);
  } else {
    await page.mouse.move(point.x, point.y);
  }
  return point;
}

async function endDrag(page, drag, profile, point) {
  if (profile.input === "touch") {
    await drag.client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
      changedTouchPoints: [{ ...point, id: drag.pointerId }]
    });
  } else {
    await page.mouse.up();
  }
}

async function cancelDrag(page, drag, profile) {
  if (profile.input === "touch") {
    await drag.client.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: []
    });
  } else {
    await page.dispatchEvent("#board", "pointercancel", {
      pointerId: drag.pointerId,
      isPrimary: true
    });
    await page.mouse.up();
  }
}

async function expectRestoredOpening(page, before, message) {
  const current = await snapshot(page);
  expect(current.moves, `${message}: no move spent`).toBe(before.moves);
  expect(current.counts, `${message}: no progress earned`).toEqual(before.counts);
  expect(current.boardState, `${message}: board remains unchanged`).toBe(before.boardState);
  expect(current.hints, `${message}: exact guide pair restored`).toEqual([SOURCE_ID, TARGET_ID]);
  expect(current.guideVisible, `${message}: guide is immediately visible`).toBe(true);
  expect(current.preview).toEqual([]);
  expect(current.transformed).toEqual([]);
  expect(current.boardPreviewClasses).toEqual([]);
  expect(current.selected).toEqual([]);
  return current;
}

function expectStableFrame(frame, profile, problems) {
  expect(frame.tiles).toBe(64);
  expect(frame.rows).toBe(8);
  expect(frame.enabled).toBe(64);
  expect(frame.board.width).toBeCloseTo(profile.mobile ? 378 : 600, 3);
  expect(frame.board.height).toBeCloseTo(profile.mobile ? 378 : 600, 3);
  expect(frame.overflowX).toBe(false);
  expect(frame.brokenImages).toEqual([]);
  if (profile.mobile) {
    expect(frame.board.bottom).toBeLessThanOrEqual(844);
    expect(frame.scrollY).toBe(0);
  }
  expect(problems).toEqual([]);
}

for (const profile of PROFILES) {
  test(`${profile.label}: ready drag retreat restores the guide before release`, async ({ browser }) => {
    const { context, page, problems } = await openFresh(browser, profile, "retreat-release");
    let drag;
    try {
      const before = await snapshot(page);
      drag = await beginDrag(page, context, profile);
      await moveDrag(page, drag, profile, 17);
      await moveDrag(page, drag, profile, 18);
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      const retreat = await moveDrag(page, drag, profile, 17);
      await expectRestoredOpening(page, before, "held retreat");
      if (["desktop-full-pointer", "mobile390-full-touch"].includes(profile.label)) {
        await page.screenshot({
          path: `work/drag-threshold-reversal-${profile.mobile ? "mobile390" : "desktop"}.png`,
          fullPage: true
        });
      }
      await endDrag(page, drag, profile, retreat);
      const released = await expectRestoredOpening(page, before, "released retreat");
      expect(released.active).toBe(SOURCE_ID);
      expect(released.roving).toEqual([SOURCE_ID]);
      await page.waitForTimeout(500);
      const delayed = await expectRestoredOpening(page, before, "settled retreat");
      expectStableFrame(delayed, profile, problems);
    } finally {
      if (drag?.client) await drag.client.detach();
      await context.close();
    }
  });

  test(`${profile.label}: ready retreat can return and commit once`, async ({ browser }) => {
    const { context, page, problems } = await openFresh(browser, profile, "retreat-recommit");
    let drag;
    try {
      const before = await snapshot(page);
      drag = await beginDrag(page, context, profile);
      await moveDrag(page, drag, profile, 17);
      await moveDrag(page, drag, profile, 18);
      await moveDrag(page, drag, profile, 17);
      const ready = await moveDrag(page, drag, profile, 18);
      await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
      await endDrag(page, drag, profile, ready);
      await expect.poll(async () => (await snapshot(page)).moves, { timeout: 12000 }).toBe(5);
      await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
      const settled = await snapshot(page);
      expect(settled.moves).toBe(before.moves - 1);
      expect(settled.counts[5]).toBe(3);
      expect(settled.boardState).not.toBe(before.boardState);
      expect(settled.preview).toEqual([]);
      expect(settled.selected).toEqual([]);
      expect(settled.roving).toHaveLength(1);
      expectStableFrame(settled, profile, problems);
    } finally {
      if (drag?.client) await drag.client.detach();
      await context.close();
    }
  });

  test(`${profile.label}: cancel after retreat restores source authority`, async ({ browser }) => {
    const { context, page, problems } = await openFresh(browser, profile, "retreat-cancel");
    let drag;
    try {
      const before = await snapshot(page);
      drag = await beginDrag(page, context, profile);
      await moveDrag(page, drag, profile, 18);
      await moveDrag(page, drag, profile, 17);
      await cancelDrag(page, drag, profile);
      const canceled = await expectRestoredOpening(page, before, "canceled retreat");
      expect(canceled.active).toBe(SOURCE_ID);
      expect(canceled.roving).toEqual([SOURCE_ID]);
      await page.waitForTimeout(500);
      const delayed = await expectRestoredOpening(page, before, "settled cancellation");
      expectStableFrame(delayed, profile, problems);
    } finally {
      if (drag?.client) await drag.client.detach();
      await context.close();
    }
  });

  test(`${profile.label}: background after retreat restores source authority`, async ({ browser }) => {
    const { context, page, problems } = await openFresh(browser, profile, "retreat-background");
    let drag;
    try {
      await page.evaluate(() => {
        let forcedHidden = false;
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => forcedHidden
        });
        window.__setThresholdReversalHidden = (hidden) => {
          forcedHidden = hidden;
          document.dispatchEvent(new Event("visibilitychange"));
        };
      });
      const before = await snapshot(page);
      drag = await beginDrag(page, context, profile);
      await moveDrag(page, drag, profile, 18);
      await moveDrag(page, drag, profile, 17);
      await page.evaluate(() => window.__setThresholdReversalHidden(true));
      await expectRestoredOpening(page, before, "hidden retreat");
      await page.evaluate(() => window.__setThresholdReversalHidden(false));
      await expect(page.locator(`#${SOURCE_ID}`)).toBeFocused();
      const restored = await expectRestoredOpening(page, before, "visible retreat");
      expect(restored.active).toBe(SOURCE_ID);
      expect(restored.roving).toEqual([SOURCE_ID]);
      await page.waitForTimeout(500);
      const delayed = await expectRestoredOpening(page, before, "settled background return");
      expectStableFrame(delayed, profile, problems);
    } finally {
      if (drag?.client) await drag.client.detach();
      await context.close();
    }
  });
}
