const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const SOURCE_ID = "tile-1-0";
const TARGET_ID = "tile-1-1";

const CASES = [
  { label: "desktop-pointer-full", viewport: { width: 1280, height: 720 } },
  { label: "desktop-pointer-reduced", viewport: { width: 1280, height: 720 }, reduced: true },
  { label: "desktop-pointer-interposed", viewport: { width: 1280, height: 720 }, interpose: true },
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
      return !node.hidden
        && style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const tiles = [...document.querySelectorAll("#board .tile")];
    const board = document.querySelector("#board")?.getBoundingClientRect();
    return {
      save: localStorage.getItem(key),
      state,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      tutorialCopy: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tutorialVisible: visible(document.querySelector("#tutorialPanel")),
      tutorialActive: document.body.classList.contains("tutorial-active"),
      receiptActive: document.body.classList.contains("settled-board-outcome-cue"),
      boardBusy: document.querySelector("#board")?.getAttribute("aria-busy") || "",
      active: document.activeElement?.id || "",
      roving: tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      disabled: tiles.filter((tile) => tile.disabled).length,
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      board: {
        width: board?.width || 0,
        height: board?.height || 0,
        bottom: board?.bottom || 0
      },
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src")),
      liveOwners: [...document.querySelectorAll("[aria-live]")]
        .filter(visible)
        .filter((node) => ["polite", "assertive"].includes(node.getAttribute("aria-live")))
        .map((node) => node.id)
    };
  }, SAVE_KEY);
}

async function activateFastPair(page, context, { mobile, interpose }) {
  const client = mobile ? await context.newCDPSession(page) : null;
  const tilePoint = (id) => page.evaluate((tileId) => {
    const box = document.getElementById(tileId)?.getBoundingClientRect();
    return box && box.width > 0 && box.height > 0
      ? { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      : null;
  }, id);
  const opening = await page.evaluate((sourceId) => {
    const box = document.getElementById(sourceId)?.getBoundingClientRect();
    return {
      source: box && box.width > 0 && box.height > 0
        ? { x: box.x + box.width / 2, y: box.y + box.height / 2 }
        : null,
      tutorialHidden: document.getElementById("tutorialPanel")?.hidden === true,
      hints: document.querySelectorAll("#board .tile.idle-hint").length
    };
  }, SOURCE_ID);
  expect(opening.source, "the taught source has input geometry").toBeTruthy();
  expect(opening.tutorialHidden, "input begins before the delayed tutorial").toBe(true);
  expect(opening.hints, "the taught pair is already glowing").toBe(2);

  let identifier = 201;
  const dispatch = async (point) => {
    if (client) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...point, id: identifier, radiusX: 2, radiusY: 2, force: 1 }]
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: []
      });
      identifier += 1;
    } else {
      await page.mouse.click(point.x, point.y, { delay: 8 });
    }
  };

  await dispatch(opening.source);
  await expect(page.locator(`#${SOURCE_ID}`)).toHaveClass(/\bsel\b/);
  if (interpose) {
    await page.locator("#tutorialPanel").waitFor({ state: "visible" });
  }
  const target = await tilePoint(TARGET_ID);
  expect(target, "the taught target keeps input geometry").toBeTruthy();
  await dispatch(target);
}

for (const testCase of CASES) {
  test(`fast opening keeps its result ahead of the delayed tutorial on ${testCase.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      hasTouch: Boolean(testCase.mobile),
      isMobile: Boolean(testCase.mobile),
      reducedMotion: testCase.reduced ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "";
      if (failure !== "net::ERR_ABORTED") {
        problems.push(`${request.url()} ${failure}`);
      }
    });

    try {
      const sessionMarker = `fast-opening-tutorial:${testCase.label}`;
      await page.addInitScript(({ key, marker }) => {
        if (!sessionStorage.getItem(marker)) {
          localStorage.removeItem(key);
          sessionStorage.setItem(marker, "1");
        }
      }, {
        key: SAVE_KEY,
        marker: sessionMarker
      });
      await page.goto(`${BASE_URL}?fast-opening-warm=${testCase.label}`, {
        waitUntil: "networkidle"
      });
      await page.evaluate(({ key, marker }) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(marker);
      }, { key: SAVE_KEY, marker: sessionMarker });
      await page.goto(`${BASE_URL}?fast-opening-tutorial=${testCase.label}`, {
        waitUntil: "domcontentloaded"
      });
      await page.locator(`#${SOURCE_ID}`).waitFor({ state: "visible" });
      await expect(page.locator("#tutorialPanel")).toBeHidden();

      await activateFastPair(page, context, testCase);

      await page.waitForFunction((key) => {
        const state = JSON.parse(localStorage.getItem(key) || "{}");
        return state.moves === 5
          && document.querySelector("#board")?.getAttribute("aria-busy") === "false";
      }, SAVE_KEY, { timeout: 12000 });
      await page.waitForTimeout(900);

      const settled = await report(page);
      expect(settled.state.moves, "the fast exchange spends exactly once").toBe(5);
      expect(settled.state.counts, "the taught exchange earns Thorn Rose").toEqual([0, 0, 0, 0, 0, 3]);
      expect(settled.state.hasMadeValidMove).toBe(true);
      expect(settled.state.tutorialActive, "the stale timer is not saved as active").toBe(false);
      expect(settled.boardBusy).toBe("false");
      expect(settled.tutorialVisible, "the late tutorial panel stays retired").toBe(false);
      expect(settled.tutorialActive).toBe(false);
      expect(settled.tutorialCopy).toBe("");
      expect(settled.receiptActive, "the earned result owns the command lane").toBe(true);
      expect(settled.cue).toBe("Thorn Rose +3, 3 of 8. 5 moves left.");
      expect(settled.liveOwners).toEqual(["firstSwapCue"]);
      expect(settled.selected).toEqual([]);
      expect(settled.active).toMatch(/^tile-/);
      expect(settled.roving).toEqual([settled.active]);
      expect(settled.disabled).toBe(0);
      expect(settled.tiles).toBe(64);
      expect(settled.rows).toBe(8);
      expect(settled.board.width).toBeCloseTo(testCase.mobile ? 378 : 600, 2);
      expect(settled.board.height).toBeCloseTo(testCase.mobile ? 378 : 600, 2);
      expect(settled.board.bottom).toBeLessThanOrEqual(testCase.viewport.height);
      expect(settled.scrollY).toBe(0);
      expect(settled.overflowX).toBe(false);
      if (testCase.mobile) expect(settled.overflowY).toBe(false);
      expect(settled.brokenImages).toEqual([]);

      if (["desktop-pointer-full", "mobile390-touch-full"].includes(testCase.label)) {
        await page.screenshot({
          path: `work/fast-opening-${testCase.mobile ? "mobile390" : "desktop"}-receipt.png`,
          fullPage: false
        });
      }

      const settledSave = settled.save;
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      const restored = await report(page);
      expect(restored.save, "reload preserves the exact settled save").toBe(settledSave);
      expect(restored.state.moves).toBe(5);
      expect(restored.state.counts).toEqual([0, 0, 0, 0, 0, 3]);
      expect(restored.tutorialVisible, "reload cannot revive the stale tutorial").toBe(false);
      expect(restored.tutorialActive).toBe(false);
      expect(restored.receiptActive, "reload cannot replay the transient receipt").toBe(false);
      expect(restored.cue).not.toContain("moves left.");
      expect(restored.tiles).toBe(64);
      expect(restored.rows).toBe(8);
      expect(restored.disabled).toBe(0);
      expect(restored.board.width).toBeCloseTo(testCase.mobile ? 378 : 600, 2);
      expect(restored.board.bottom).toBeLessThanOrEqual(testCase.viewport.height);
      expect(restored.scrollY).toBe(0);
      expect(restored.overflowX).toBe(false);
      if (testCase.mobile) expect(restored.overflowY).toBe(false);
      expect(restored.brokenImages).toEqual([]);
      expect(problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
