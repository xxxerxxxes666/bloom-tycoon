const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BLOOM_TEST_URL || "http://127.0.0.1:4173/playable/midnight_bloom_prototype.html";
const SAVE_KEY = "bloomTycoonPlayableStateV1";
const ROUND_TARGETS = {
  1: [5, 1],
  2: [2, 4, 5],
  3: [3, 0]
};
const JOURNEY_SEEDS = [
  "altar-rose",
  "amber-vesper",
  "bloodroot-moon",
  "bone-star-vigil",
  "candle-vine",
  "nightshade-glass",
  "sol-rot-dawn",
  "thorn-choir"
];
const GOAL_FOLLOWING_SEEDS = [
  "vesper-thorn",
  "bloodroot-moon",
  "crypt-iris",
  "relic-garden"
];

test.setTimeout(180000);

async function openFresh(page, seedLabel, label) {
  await page.addInitScript((seedLabel) => {
    let seed = 0;
    for (let index = 0; index < seedLabel.length; index += 1) {
      seed = (seed * 31 + seedLabel.charCodeAt(index)) >>> 0;
    }
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }, seedLabel);
  await page.goto(`${BASE_URL}?first-three-journey=${label}&seed=${seedLabel}`, { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
}

async function journeyState(page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const tileRows = [...new Set(Array.from(document.querySelectorAll(".tile"))
      .map((tile) => Math.round(tile.getBoundingClientRect().top)))].length;
    const boardRect = document.querySelector(".board")?.getBoundingClientRect();
    return {
      round: state.currentRound || 1,
      moves: state.moves,
      roundComplete: Boolean(state.roundComplete),
      roundOneRestored: Boolean(state.roundOneRestored),
      roundTwoGreenhouseUpgraded: Boolean(state.roundTwoGreenhouseUpgraded),
      roundThreeConservatoryRaised: Boolean(state.roundThreeConservatoryRaised),
      bouquet: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      greenhouse: document.querySelector(".restoration-dial-phase")?.textContent.trim() || "",
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      tutorial: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
      tiles: document.querySelectorAll(".tile").length,
      tileRows,
      boardBottom: boardRect ? boardRect.bottom : 0,
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => visible(button) && !button.closest(".board"))
        .map((button) => button.textContent.trim())
        .filter(Boolean),
      mobilePlinthVisible: visible(document.querySelector("#mobileGreenhousePlinth")),
      ritualLogVisible: visible(document.querySelector("#ritualLog")),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: Array.from(document.images)
        .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    };
  }, SAVE_KEY);
}

async function clickGuidedSwap(page, strategy = "optimized") {
  const movesBefore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").moves, SAVE_KEY);
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const pairHandle = await page.waitForFunction(({ targets, strategy }) => {
    const hinted = Array.from(document.querySelectorAll(".tile.idle-hint")).slice(0, 2).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    if (hinted.length === 2) {
      return hinted;
    }

    const board = Array.from({ length: 8 }, () => Array(8).fill(-1));
    Array.from(document.querySelectorAll(".tile")).forEach((tile) => {
      board[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.dataset.flowerId);
    });
    const round = JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").currentRound || 1;
    const targetIds = targets[String(round)] || [];
    const thornCells = Array.from(document.querySelectorAll(".tile.cursed-thorn, .tile.thorn-teach-blocker")).map((tile) => ({
      x: Number(tile.dataset.x),
      y: Number(tile.dataset.y)
    }));
    const adjacentToThorn = (x, y) => thornCells.some((thorn) => Math.abs(thorn.x - x) + Math.abs(thorn.y - y) === 1);
    const swap = (a, b) => {
      const next = board.map((row) => row.slice());
      const temp = next[a.y][a.x];
      next[a.y][a.x] = next[b.y][b.x];
      next[b.y][b.x] = temp;
      return next;
    };
    const matchesFor = (next) => {
      const cells = new Map();
      const runs = [];
      for (let y = 0; y < 8; y += 1) {
        let start = 0;
        for (let x = 1; x <= 8; x += 1) {
          if (x === 8 || next[y][x] !== next[y][start]) {
            if (next[y][start] >= 0 && x - start >= 3) {
              const run = [];
              for (let i = start; i < x; i += 1) {
                cells.set(`${i},${y}`, next[y][start]);
                run.push([i, y]);
              }
              runs.push(run);
            }
            start = x;
          }
        }
      }
      for (let x = 0; x < 8; x += 1) {
        let start = 0;
        for (let y = 1; y <= 8; y += 1) {
          if (y === 8 || next[y][x] !== next[start][x]) {
            if (next[start][x] >= 0 && y - start >= 3) {
              const run = [];
              for (let i = start; i < y; i += 1) {
                cells.set(`${x},${i}`, next[start][x]);
                run.push([x, i]);
              }
              runs.push(run);
            }
            start = y;
          }
        }
      }
      return { cells, runs };
    };
    let best = null;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const a = { x, y };
          const b = { x: x + dx, y: y + dy };
          if (b.x >= 8 || b.y >= 8 || board[a.y][a.x] === board[b.y][b.x]) {
            continue;
          }
          const found = matchesFor(swap(a, b));
          if (!found.cells.size) {
            continue;
          }
          const matchedValues = Array.from(found.cells.values());
          const targetMatches = matchedValues.filter((value) => targetIds.includes(value)).length;
          const thornScore = round === 2
            ? Array.from(found.cells.keys()).filter((key) => {
              const [cellX, cellY] = key.split(",").map(Number);
              return adjacentToThorn(cellX, cellY);
            }).length
            : 0;
          const fourScore = found.runs.some((run) => run.length >= 4) ? 3 : 0;
          const optimizationScore = strategy === "optimized" ? fourScore + found.cells.size : 0;
          const score = targetMatches * 10 + thornScore * 7 + optimizationScore;
          if (!best || score > best.score) {
            best = { score, pair: [a, b] };
          }
        }
      }
    }
    return best?.pair || null;
    }, { targets: ROUND_TARGETS, strategy }, { timeout: 8500 });
    const pairValue = await pairHandle.jsonValue();
    const pair = (pairValue || []).map((tile) => ({
      x: String(tile.x),
      y: String(tile.y)
    }));
    expect(pair, "guided pair").toHaveLength(2);
    async function clickTileCenter(tile) {
      const point = await page.evaluate(({ x, y }) => {
        const node = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }, tile);
      expect(point, `tile ${tile.x},${tile.y} center`).not.toBeNull();
      await page.mouse.click(point.x, point.y);
    }
    try {
      await clickTileCenter(pair[0]);
      // The first selection re-renders the board, so resolve the second tile center again.
      await clickTileCenter(pair[1]);
      await page.waitForFunction(() => (
        document.querySelector("#roundOneRestoration")?.offsetParent
        || document.querySelector("#renewBtn")?.classList.contains("visible")
        || Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled)
      ), null, { timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      const state = await journeyState(page);
      if (state.roundComplete || state.moves < movesBefore) {
        return;
      }
      await page.waitForFunction(() => Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled), null, {
        timeout: 10000
      });
    }
  }
  throw lastError || new Error("Unable to perform a fresh guided swap");
}

async function spendPrimaryCeremonyAction(page) {
  await page.waitForSelector("#roundOneRestoration button:not([hidden])", { timeout: 5000 });
  const button = page.locator("#roundOneRestoration button:not([hidden])");
  const text = (await button.textContent()).trim();
  await button.click();
  await page.waitForTimeout(650);
  return text;
}

async function playCurrentRound(page, label, round, strategy = "optimized") {
  const start = await journeyState(page);
  const startMoves = start.moves;
  let swaps = 0;
  while (true) {
    const state = await journeyState(page);
    if (state.roundComplete) {
      const summary = {
        round,
        startMoves,
        movesLeft: state.moves,
        swaps,
        bouquet: state.bouquet,
        greenhouse: state.greenhouse,
        cue: state.cue
      };
      await page.screenshot({ path: `work/first-three-${label}-round${round}-complete.png`, fullPage: true });
      return summary;
    }
    expect(state.moves, `${label} round ${round} has moves remaining`).toBeGreaterThan(0);
    await clickGuidedSwap(page, strategy);
    swaps += 1;
    expect(swaps, `${label} round ${round} should not drag`).toBeLessThanOrEqual(10);
  }
}

async function playFirstThree(page, config, seed, strategy) {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`));

  await page.setViewportSize(config.viewport);
  const runLabel = `${config.label}-${strategy}-${seed}`;
  await openFresh(page, seed, runLabel);
  await assertActiveBoard(page, config.mobile);

  const results = [];
  for (let round = 1; round <= 3; round += 1) {
    results.push(await playCurrentRound(page, runLabel, round, strategy));
    const firstAction = await spendPrimaryCeremonyAction(page);
    const secondAction = await spendPrimaryCeremonyAction(page);
    results[results.length - 1].actions = [firstAction, secondAction];
    if (round < 3) {
      await expect(page.locator(".tile")).toHaveCount(64);
      await assertActiveBoard(page, config.mobile);
    }
  }

  const finalState = await journeyState(page);
  expect(finalState.round).toBe(1);
  expect(finalState.tiles).toBe(64);
  expect(finalState.overflowX).toBe(false);
  expect(finalState.brokenImages).toEqual([]);
  await page.screenshot({ path: `work/first-three-${runLabel}-replay.png`, fullPage: true });
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  return { runLabel, results };
}

async function assertActiveBoard(page, mobile) {
  const state = await journeyState(page);
  expect(state.tiles).toBe(64);
  expect(state.tileRows).toBe(8);
  expect(state.overflowX).toBe(false);
  expect(state.brokenImages).toEqual([]);
  expect(state.mobilePlinthVisible, "active mobile plinth hidden").toBe(false);
  if (mobile) {
    expect(state.ritualLogVisible, "active mobile ritual log hidden").toBe(false);
    expect(state.boardBottom, "exact mobile board stays in first viewport").toBeLessThanOrEqual(844);
  }
}

for (const config of [
  { label: "desktop", viewport: { width: 1280, height: 720 }, mobile: false },
  { label: "mobile390", viewport: { width: 390, height: 844 }, mobile: true }
]) {
  for (const seed of JOURNEY_SEEDS) {
    test(`real first-three journey is fair on ${config.label} with ${seed}`, async ({ page }) => {
      const { runLabel, results } = await playFirstThree(page, config, seed, "optimized");

      console.log(`${runLabel} first-three journey: ${JSON.stringify(results)}`);
      expect(results[0].movesLeft, "Round 1 remains a forgiving tutorial").toBeGreaterThanOrEqual(2);
      expect(results[0].movesLeft, "Round 1 no longer has a huge move cushion").toBeLessThanOrEqual(4);
      expect(results[1].movesLeft, "Round 2 leaves a fair cushion").toBeGreaterThanOrEqual(1);
      expect(results[1].movesLeft, "Round 2 handles cascade variance").toBeLessThanOrEqual(4);
      expect(results[2].movesLeft, "Round 3 leaves a fair cushion").toBeGreaterThanOrEqual(1);
      expect(results[2].movesLeft, "Round 3 handles cascade variance").toBeLessThanOrEqual(5);
      expect(results[0].swaps, "Round 1 can finish quickly but still requires real swaps").toBeGreaterThanOrEqual(2);
      expect(results[0].swaps, "Round 1 tutorial does not drag").toBeLessThanOrEqual(4);
      expect(results[1].swaps, "Round 2 takes several real swaps").toBeGreaterThanOrEqual(4);
      expect(results[2].swaps, "Round 3 takes real swaps").toBeGreaterThanOrEqual(2);
      expect(results[0].actions).toEqual(["Restore Greenhouse · 100 coins", "Next Order → Moonlit Wreath"]);
      expect(results[1].actions).toEqual(["Upgrade Greenhouse · 120 coins", "Next Order → Bloodroot Compact"]);
      expect(results[2].actions).toEqual(["Raise Conservatory · 180 coins", "Play Again → First Bouquet"]);

    });
  }

  for (const seed of GOAL_FOLLOWING_SEEDS) {
    test(`goal-following first-three journey completes on ${config.label} with ${seed}`, async ({ page }) => {
      const { runLabel, results } = await playFirstThree(page, config, seed, "goal-following");
      console.log(`${runLabel} first-three journey: ${JSON.stringify(results)}`);
      expect(results[0].swaps, "Round 1 goal-following tutorial does not drag").toBeLessThanOrEqual(4);
      expect(results[1].movesLeft, "Round 2 goal-following play completes").toBeGreaterThanOrEqual(0);
      expect(results[2].movesLeft, "Round 3 goal-following play completes").toBeGreaterThanOrEqual(0);
      expect(results[0].actions).toEqual(["Restore Greenhouse · 100 coins", "Next Order → Moonlit Wreath"]);
      expect(results[1].actions).toEqual(["Upgrade Greenhouse · 120 coins", "Next Order → Bloodroot Compact"]);
      expect(results[2].actions).toEqual(["Raise Conservatory · 180 coins", "Play Again → First Bouquet"]);
    });
  }
}
