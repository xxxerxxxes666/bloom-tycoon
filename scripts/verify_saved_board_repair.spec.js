const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL
  || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";

const MATCHED_BOARD = Array.from({ length: 8 }, () => Array(8).fill(0));
const ROUND_TWO_STATE = {
  focusedEconomyVersion: 3,
  currentRound: 2,
  roundComplete: false,
  moves: 8,
  coins: 20,
  counts: [0, 0, 3, 0, 3, 2],
  cursedThorns: [
    { x: 1, y: 1, hp: 1 },
    { x: 2, y: 1, hp: 1 }
  ],
  clearedCursedThorns: 1,
  roundOneRestored: true,
  roundTwoGreenhouseUpgraded: false,
  roundThreeConservatoryRaised: false,
  hasMadeValidMove: true,
  restoredRoundTwoGuideMoves: 1,
  tutorialSkipped: true,
  tutorialActive: false,
  blackCandleLessonComplete: true
};

const CASES = [
  {
    label: "invalid-shape",
    raw: JSON.stringify({ ...ROUND_TWO_STATE, board: [[0]] }),
    expectedRound: 2,
    expectedMoves: 8,
    expectedCoins: 20,
    expectedCounts: ROUND_TWO_STATE.counts,
    expectedProgress: "Bouquet · 9/29"
  },
  {
    label: "pre-matched",
    raw: JSON.stringify({ ...ROUND_TWO_STATE, board: MATCHED_BOARD }),
    expectedRound: 2,
    expectedMoves: 8,
    expectedCoins: 20,
    expectedCounts: ROUND_TWO_STATE.counts,
    expectedProgress: "Bouquet · 9/29"
  },
  {
    label: "unreadable-json",
    raw: "{not-json",
    expectedRound: 1,
    expectedMoves: 6,
    expectedCoins: 0,
    expectedCounts: [0, 0, 0, 0, 0, 0],
    expectedProgress: "Bouquet · 0/14"
  }
];

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1280, height: 720 } },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
];

test.setTimeout(60000);

async function report(page) {
  return page.evaluate((key) => {
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden"
        && rect.width > 0 && rect.height > 0;
    };
    const raw = localStorage.getItem(key) || "";
    let state = null;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      state = null;
    }
    const board = state?.board;
    const hasMatch = (candidate) => {
      if (!Array.isArray(candidate) || candidate.length !== 8) return true;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          if (x <= 5 && candidate[y][x] === candidate[y][x + 1] && candidate[y][x] === candidate[y][x + 2]) return true;
          if (y <= 5 && candidate[y][x] === candidate[y + 1][x] && candidate[y][x] === candidate[y + 2][x]) return true;
        }
      }
      return false;
    };
    const createsMatch = (candidate, ax, ay, bx, by) => {
      const copy = candidate.map((row) => row.slice());
      [copy[ay][ax], copy[by][bx]] = [copy[by][bx], copy[ay][ax]];
      return hasMatch(copy);
    };
    const hasLegalMove = (candidate) => {
      if (!Array.isArray(candidate) || candidate.length !== 8 || hasMatch(candidate)) return false;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          if (x < 7 && createsMatch(candidate, x, y, x + 1, y)) return true;
          if (y < 7 && createsMatch(candidate, x, y, x, y + 1)) return true;
        }
      }
      return false;
    };
    const tiles = [...document.querySelectorAll("#board .tile")];
    const altar = document.querySelector("#board")?.getBoundingClientRect();
    return {
      raw,
      state,
      boardValid: Array.isArray(board) && board.length === 8
        && board.every((row) => Array.isArray(row) && row.length === 8
          && row.every((tile) => Number.isInteger(tile) && tile >= 0 && tile < 6)),
      hasMatch: hasMatch(board),
      hasLegalMove: hasLegalMove(board),
      message: document.querySelector("#ritualLog")?.textContent.trim() || "",
      progress: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      tiles: tiles.length,
      rows: new Set(tiles.map((tile) => tile.dataset.y)).size,
      disabled: tiles.filter((tile) => tile.disabled).length,
      boardWidth: altar?.width || 0,
      boardBottom: altar?.bottom || 0,
      scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      brokenImages: [...document.images]
        .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

for (const viewportCase of VIEWPORTS) {
  for (const repairCase of CASES) {
    test(`${repairCase.label} altar repair persists on ${viewportCase.label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: viewportCase.viewport,
        hasTouch: Boolean(viewportCase.mobile),
        isMobile: Boolean(viewportCase.mobile)
      });
      const page = await context.newPage();
      const problems = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) problems.push(message.text());
      });
      page.on("pageerror", (error) => problems.push(error.message));
      try {
        await page.addInitScript(({ key, raw, marker }) => {
          if (!sessionStorage.getItem(marker)) {
            localStorage.setItem(key, raw);
            sessionStorage.setItem(marker, "1");
          }
        }, {
          key: SAVE_KEY,
          raw: repairCase.raw,
          marker: `saved-board-repair-${repairCase.label}-${viewportCase.label}`
        });
        await page.goto(`${BASE_URL}?saved-board-repair=${repairCase.label}-${viewportCase.label}`, {
          waitUntil: "networkidle"
        });

        const repaired = await report(page);
        expect(repaired.state).not.toBeNull();
        expect(repaired.state.currentRound).toBe(repairCase.expectedRound);
        expect(repaired.state.moves).toBe(repairCase.expectedMoves);
        expect(repaired.state.coins).toBe(repairCase.expectedCoins);
        expect(repaired.state.counts).toEqual(repairCase.expectedCounts);
        expect(repaired.progress).toBe(repairCase.expectedProgress);
        expect(repaired.message).toContain("Saved altar repaired.");
        expect(repaired.boardValid).toBe(true);
        expect(repaired.hasMatch).toBe(false);
        expect(repaired.hasLegalMove).toBe(true);
        expect(repaired.tiles).toBe(64);
        expect(repaired.rows).toBe(8);
        expect(repaired.disabled).toBe(0);
        expect(repaired.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 1);
        expect(repaired.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(repaired.scrollY).toBe(0);
        expect(repaired.overflowX).toBe(false);
        if (viewportCase.mobile) expect(repaired.overflowY).toBe(false);
        expect(repaired.brokenImages).toEqual([]);
        expect(problems).toEqual([]);

        if (repairCase.label === "invalid-shape") {
          await page.screenshot({
            path: `/tmp/bloom-saved-altar-repair-${viewportCase.label}.png`,
            fullPage: false
          });
        }

        await page.reload({ waitUntil: "networkidle" });
        const stable = await report(page);
        expect(stable.raw).toBe(repaired.raw);
        expect(stable.state.board).toEqual(repaired.state.board);
        expect(stable.state.currentRound).toBe(repairCase.expectedRound);
        expect(stable.state.moves).toBe(repairCase.expectedMoves);
        expect(stable.state.coins).toBe(repairCase.expectedCoins);
        expect(stable.state.counts).toEqual(repairCase.expectedCounts);
        expect(stable.progress).toBe(repairCase.expectedProgress);
        expect(stable.boardValid).toBe(true);
        expect(stable.hasMatch).toBe(false);
        expect(stable.hasLegalMove).toBe(true);
        expect(stable.tiles).toBe(64);
        expect(stable.rows).toBe(8);
        expect(stable.boardWidth).toBeCloseTo(viewportCase.mobile ? 378 : 600, 1);
        expect(stable.boardBottom).toBeLessThanOrEqual(viewportCase.viewport.height);
        expect(stable.scrollY).toBe(0);
        expect(stable.overflowX).toBe(false);
        if (viewportCase.mobile) expect(stable.overflowY).toBe(false);
        expect(stable.brokenImages).toEqual([]);
        expect(problems).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
