const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
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

const GESTURES = [
  {
    label: "equal diagonal keeps the horizontal preview",
    source: { x: 1, y: 0 },
    target: { x: 2, y: 0 },
    dx: 32,
    dy: 32
  },
  {
    label: "vertical intent stays vertical near the tie",
    source: { x: 4, y: 0 },
    target: { x: 4, y: 1 },
    dx: 31,
    dy: 32
  }
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

async function runtimeState(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const tiles = Array.from(document.querySelectorAll("#board .tile"));
    const board = document.querySelector("#board").getBoundingClientRect();
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const active = document.activeElement;
    const roving = tiles.filter((tile) => tile.tabIndex === 0).map((tile) => tile.id);
    return {
      moves: saved.moves,
      counts: saved.counts,
      boardState: tiles.map((tile) => tile.dataset.flowerId).join(","),
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      enabled: tiles.filter((tile) => !tile.disabled).length,
      board: { width: board.width, height: board.height, bottom: board.bottom },
      invalid: tiles.filter((tile) => tile.classList.contains("invalid-swap")).map((tile) => tile.id),
      selected: tiles.filter((tile) => tile.classList.contains("sel")).map((tile) => tile.id),
      roving,
      active: active?.id || "",
      activeIsTile: Boolean(active?.classList?.contains("tile")),
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function dispatchTouchDrag(page, start, end) {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: start.x, y: start.y, id: 41 }]
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: end.x, y: end.y, id: 41 }]
    });
    await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
    const preview = await page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor").evaluateAll(
      (tiles) => tiles.map((tile) => tile.id)
    );
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
      changedTouchPoints: [{ x: end.x, y: end.y, id: 41 }]
    });
    return preview;
  } finally {
    await client.detach();
  }
}

async function performDrag(page, profile, gesture) {
  const source = page.locator(`#tile-${gesture.source.x}-${gesture.source.y}`);
  const box = await source.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const end = { x: start.x + gesture.dx, y: start.y + gesture.dy };
  if (profile.input === "touch") {
    return dispatchTouchDrag(page, start, end);
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await expect(page.locator(".tile.drag-preview-ready")).toHaveCount(2);
  const preview = await page.locator(".tile.drag-preview-source, .tile.drag-preview-neighbor").evaluateAll(
    (tiles) => tiles.map((tile) => tile.id)
  );
  await page.mouse.up();
  return preview;
}

for (const profile of PROFILES) {
  for (const gesture of GESTURES) {
    test(`${profile.label}: ${gesture.label}`, async ({ browser }) => {
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
      await context.addInitScript(({ key, state }) => {
        localStorage.setItem(key, JSON.stringify(state));
      }, { key: SAVE_KEY, state: savedState() });
      try {
        await page.goto(`${BASE_URL}?drag-release=${profile.label}-${gesture.source.x}`, {
          waitUntil: "networkidle"
        });
        await expect(page.locator("#board .tile")).toHaveCount(64);
        const before = await runtimeState(page);
        const preview = await performDrag(page, profile, gesture);
        expect(preview, `${profile.label} preview owns the intended pair`).toEqual([
          `tile-${gesture.source.x}-${gesture.source.y}`,
          `tile-${gesture.target.x}-${gesture.target.y}`
        ]);

        await expect.poll(async () => (await runtimeState(page)).moves, {
          timeout: 12000
        }).toBe(before.moves - 1);
        await expect(page.locator("#board .tile:disabled")).toHaveCount(0, { timeout: 12000 });
        const after = await runtimeState(page);
        expect(after.boardState, `${profile.label} commits the previewed exchange`).not.toBe(before.boardState);
        expect(after.invalid, `${profile.label} has no contradictory refusal`).toEqual([]);
        expect(after.selected, `${profile.label} clears transient selection`).toEqual([]);
        expect(after.tiles, `${profile.label} keeps 64 tiles`).toBe(64);
        expect(after.rows, `${profile.label} keeps eight rows`).toBe(8);
        expect(after.enabled, `${profile.label} returns control`).toBe(64);
        expect(after.roving, `${profile.label} keeps one roving tile`).toHaveLength(1);
        if (after.activeIsTile) {
          expect(after.active, `${profile.label} focused tile agrees with roving`).toBe(after.roving[0]);
        }
        expect(after.cue, `${profile.label} publishes the real settled result`).not.toContain("No bloom");
        expect(after.overflowX, `${profile.label} has no horizontal overflow`).toBe(false);
        expect(after.brokenImages, `${profile.label} has no broken visible images`).toEqual([]);
        expect(after.board.width, `${profile.label} altar width`).toBeCloseTo(profile.mobile ? 378 : 600, 3);
        expect(after.board.height, `${profile.label} altar height`).toBeCloseTo(profile.mobile ? 378 : 600, 3);
        if (profile.mobile) {
          expect(after.board.bottom, `${profile.label} altar stays in the first viewport`).toBeLessThanOrEqual(844);
        }
        if (profile.label === "mobile390-full-touch" && gesture.dx === gesture.dy) {
          await page.screenshot({ path: "work/drag-release-mobile390-tie.png", fullPage: true });
        }
        expect(consoleProblems).toEqual([]);
        expect(pageErrors).toEqual([]);
        expect(failedRequests).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
