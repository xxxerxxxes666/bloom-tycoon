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
    const progressRect = document.querySelector("#bouquetProgress")?.getBoundingClientRect();
    const coinRect = document.querySelector("#coinBalance")?.getBoundingClientRect();
    return {
      round: state.currentRound || 1,
      moves: state.moves,
      roundComplete: Boolean(state.roundComplete),
      roundOneRestored: Boolean(state.roundOneRestored),
      roundTwoGreenhouseUpgraded: Boolean(state.roundTwoGreenhouseUpgraded),
      roundThreeConservatoryRaised: Boolean(state.roundThreeConservatoryRaised),
      coins: state.coins,
      counts: state.counts || [],
      focusedEconomyVersion: state.focusedEconomyVersion,
      coinBalanceText: document.querySelector("#coinBalance")?.textContent.replace(/\s+/g, " ").trim() || "",
      coinBalanceValue: document.querySelector("#coinBalance")?.dataset.balance || "",
      coinBalanceVisible: visible(document.querySelector("#coinBalance")),
      coinBalancePulsing: document.querySelector("#coinBalance")?.classList.contains("balance-pulse") || false,
      coinBalanceOccurrences: (document.body.innerText.match(/COINS\s+\d+/gi) || []).length,
      coinBalanceInsideProgress: Boolean(progressRect && coinRect
        && coinRect.left >= progressRect.left - 1
        && coinRect.right <= progressRect.right + 1
        && coinRect.top >= progressRect.top - 1
        && coinRect.bottom <= progressRect.bottom + 1),
      bouquet: document.querySelector("#bouquetProgressLabel")?.textContent.trim() || "",
      bouquetNext: document.querySelector("#bouquetProgressNext")?.textContent.trim() || "",
      greenhouse: document.querySelector(".restoration-dial-phase")?.textContent.trim() || "",
      greenhouseStage: document.querySelector("#heroRestorationDial")?.dataset.restorationDialStage || "",
      greenhouseOwnedStage: document.querySelector("#heroRestorationDial")?.dataset.ownedStage || "",
      greenhousePct: document.querySelector("#heroRestorationDial")?.dataset.restorationDialPct || "",
      greenhouseText: document.querySelector("#heroRestorationDial")?.textContent.replace(/\s+/g, " ").trim() || "",
      greenhouseGoalCounts: document.querySelectorAll(".greenhouse-restoration-dial .restoration-goal-count").length,
      activeStageKey: document.querySelector("#activeGreenhouseStage")?.dataset.stageKey || "",
      activeStageArt: document.querySelector("#activeGreenhouseStageArt")?.getAttribute("src") || "",
      bodyStage: document.body.dataset.activeGreenhouseStage || "",
      bodyRevivalPct: document.body.dataset.greenhouseRevivalPct || "",
      payoffTransaction: document.querySelector("#payoffTransaction")?.textContent.trim() || "",
      payoffCopy: document.querySelector("#restorationCopy")?.textContent.trim() || "",
      payoffMode: document.querySelector("#roundOneRestoration")?.dataset.payoffMode || "",
      ownedRenewalPhase: document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase || "",
      ownedRenewalHidden: document.querySelector("#ownedReplayRenewal")?.hidden ?? true,
      ownedRenewalTransientNodes: document.querySelector("#ownedReplayRenewal")?.querySelectorAll("*").length || 0,
      restorationTitle: document.querySelector("#restorationTitle")?.textContent.trim() || "",
      restorationState: document.querySelector("#restorationState")?.textContent.trim() || "",
      trophyKicker: document.querySelector(".bouquet-trophy-kicker")?.textContent.trim() || "",
      trophyName: document.querySelector(".bouquet-trophy-name")?.textContent.trim() || "",
      trophyCopy: document.querySelector(".bouquet-trophy-copy")?.textContent.trim() || "",
      craftedComposition: Array.from(document.querySelectorAll(".crafted-flower-bloom"))
        .map((node) => Number(node.dataset.craftedFlower)),
      craftedTargetCounts: document.querySelector(".crafted-bouquet")?.dataset.craftedTargetCounts || "",
      restorationSceneLabel: document.querySelector(".restoration-scene")?.getAttribute("aria-label") || "",
      restorationSceneArt: document.querySelector(".restoration-scene")?.dataset.greenhouseArt || "",
      restoredSceneArt: document.querySelector(".greenhouse-art-restored")?.getAttribute("src") || "",
      witheredSceneArtVisible: visible(document.querySelector(".greenhouse-art-withered")),
      restoredSceneArtVisible: visible(document.querySelector(".greenhouse-art-restored")),
      visibleTransformationLabels: Array.from(document.querySelectorAll(".restoration-before-label, .restoration-after-label"))
        .filter(visible)
        .map((label) => label.textContent.trim()),
      ceremonyText: document.querySelector("#roundOneRestoration")?.innerText.replace(/\s+/g, " ").trim() || "",
      ceremonyBottom: document.querySelector("#roundOneRestoration")?.getBoundingClientRect().bottom || 0,
      transactionBottom: document.querySelector("#payoffTransaction")?.getBoundingClientRect().bottom || 0,
      actionBottom: Array.from(document.querySelectorAll("#roundOneRestoration button"))
        .find(visible)?.getBoundingClientRect().bottom || 0,
      cue: document.querySelector("#firstSwapCue")?.textContent.trim() || "",
      handoffCue: document.querySelector("#nextOrderCue")?.textContent.trim() || "",
      handoffCueVisible: visible(document.querySelector("#nextOrderCue")),
      handoffCueBottom: document.querySelector("#nextOrderCue")?.getBoundingClientRect().bottom || 0,
      hintedTiles: document.querySelectorAll(".tile.idle-hint").length,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
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

const GREENHOUSE_EXPECTATIONS = [
  {
    stage: 0,
    pct: "0",
    key: "withered",
    phase: "Withered",
    art: "first_greenhouse_withered.jpg",
    note: "Owned 0/3 · Next: Restore Greenhouse"
  },
  {
    stage: 1,
    pct: "33",
    key: "restored",
    phase: "First panes restored",
    art: "first_greenhouse_restored.jpg",
    note: "Owned 1/3 · Next: Upgrade Greenhouse"
  },
  {
    stage: 2,
    pct: "67",
    key: "moonlit",
    phase: "Moonlit upgrade owned",
    art: "moonlit_wreath_greenhouse.jpg",
    note: "Owned 2/3 · Next: Raise Conservatory"
  },
  {
    stage: 3,
    pct: "100",
    key: "bloodroot",
    phase: "Conservatory raised",
    art: "bloodroot_compact_greenhouse.jpg",
    note: "Owned 3/3"
  }
];

async function expectGreenhouseOwned(page, expectedStage, context) {
  const expected = GREENHOUSE_EXPECTATIONS[expectedStage];
  const state = await journeyState(page);
  expect(state.greenhouseOwnedStage, `${context} owned stage`).toBe(String(expected.stage));
  expect(state.greenhousePct, `${context} owned pct`).toBe(expected.pct);
  expect(state.bodyRevivalPct, `${context} body revival pct`).toBe(expected.pct);
  expect(state.greenhouseStage, `${context} dial stage`).toBe(expected.key);
  expect(state.activeStageKey, `${context} active stage key`).toBe(expected.key);
  expect(state.bodyStage, `${context} body stage`).toBe(expected.key);
  expect(state.activeStageArt, `${context} active greenhouse art`).toContain(expected.art);
  expect(state.greenhouse, `${context} greenhouse phase`).toBe(expected.phase);
  expect(state.greenhouseText, `${context} greenhouse note`).toContain(expected.note);
  expect(state.greenhouseGoalCounts, `${context} greenhouse target counts removed`).toBe(0);
  return state;
}

async function expectPermanentRaisedGreenhouse(page, context) {
  const state = await expectGreenhouseOwned(page, 3, context);
  expect([
    state.roundOneRestored,
    state.roundTwoGreenhouseUpgraded,
    state.roundThreeConservatoryRaised
  ], `${context} persisted ownership flags`).toEqual([true, true, true]);
  expect(state.greenhouseText, `${context} permanent replay progress`).toContain("Permanent through replay");
  if (!state.roundComplete && !state.visibleButtons.includes("Retry Bouquet")) {
    expect(state.bouquetNext, `${context} compact ownership consequence`).toBe("Owned: Conservatory Raised");
  }
  return state;
}

async function expectVisibleCoinBalance(page, expectedCoins, options = {}) {
  const state = await journeyState(page);
  expect(state.coinBalanceVisible).toBe(true);
  expect(state.coinBalanceText).toBe(`✪ Coins ${expectedCoins}`);
  expect(state.coinBalanceValue).toBe(String(expectedCoins));
  expect(state.coinBalanceOccurrences).toBe(1);
  expect(state.coinBalanceInsideProgress).toBe(true);
  if (options.pulsing !== undefined) {
    expect(state.coinBalancePulsing).toBe(options.pulsing);
  }
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
    try {
      await page.locator(`.tile[data-x="${pair[0].x}"][data-y="${pair[0].y}"]`).click({ force: true });
      // The first selection re-renders the board. Resolve the second tile again
      // so a detached pre-render node cannot make the fairness audit flaky.
      await page.locator(`.tile[data-x="${pair[1].x}"][data-y="${pair[1].y}"]`).click({ force: true });
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

async function spendPrimaryCeremonyAction(page, activation = "pointer") {
  await page.waitForSelector("#roundOneRestoration button:not([hidden])", { timeout: 5000 });
  const button = page.locator("#roundOneRestoration button:not([hidden])");
  await expect(button).toBeEnabled({ timeout: 2000 });
  const text = (await button.textContent()).trim();
  if (activation === "keyboard") {
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
  } else if (activation === "touch") {
    await button.tap();
  } else {
    await button.click();
  }
  await page.waitForTimeout(650);
  return text;
}

async function installOwnedRenewalRecorder(page) {
  await page.evaluate(() => {
    const previous = window.__ownedRenewalRecorder;
    previous?.observer?.disconnect();
    if (previous?.interval) clearInterval(previous.interval);
    const samples = [];
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return !node.hidden
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const sample = () => {
      const panel = document.querySelector("#roundOneRestoration");
      const renewal = document.querySelector("#ownedReplayRenewal");
      const scene = document.querySelector(".restoration-scene");
      const ingredients = Array.from(renewal?.querySelectorAll(".owned-renewal-ingredient") || []);
      samples.push({
        at: performance.now(),
        roundComplete: Boolean(JSON.parse(localStorage.getItem("bloomTycoonPlayableStateV1") || "{}").roundComplete),
        phase: panel?.dataset.ownedRenewalPhase || "",
        renewalPhase: renewal?.dataset.renewalPhase || "",
        topCue: document.querySelector("#tutorialCopy")?.textContent.trim() || "",
        actionCount: Array.from(panel?.querySelectorAll("button") || []).filter(visible).length,
        transactionVisible: visible(document.querySelector("#payoffTransaction")),
        state: document.querySelector("#restorationState")?.textContent.trim() || "",
        ingredientIds: ingredients.map((node) => Number(node.dataset.flowerId)),
        targetCounts: ingredients.map((node) => Number(node.dataset.requiredCount)),
        ingredientImagesLoaded: ingredients.every((node) => {
          const image = node.querySelector("img");
          return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
        }),
        responseVisible: visible(renewal?.querySelector(".owned-renewal-response")),
        raisedArtVisible: visible(scene?.querySelector(".greenhouse-art-restored")),
        lowerArtVisible: visible(scene?.querySelector(".greenhouse-art-withered")),
        transientNodes: renewal?.querySelectorAll(".owned-renewal-ingredient, .owned-renewal-response, .owned-renewal-window").length || 0,
        renewalHidden: renewal?.hidden ?? true
      });
    };
    const panel = document.querySelector("#roundOneRestoration");
    const observer = new MutationObserver(sample);
    observer.observe(panel, { attributes: true, childList: true, subtree: true });
    const interval = setInterval(sample, 16);
    window.__ownedRenewalRecorder = { observer, interval, samples, sample };
    sample();
  });
}

async function collectOwnedRenewalRecorder(page) {
  return page.evaluate(() => {
    const recorder = window.__ownedRenewalRecorder;
    if (!recorder) return [];
    recorder.sample();
    recorder.observer.disconnect();
    clearInterval(recorder.interval);
    delete window.__ownedRenewalRecorder;
    return recorder.samples;
  });
}

async function playCurrentRound(page, label, round, strategy = "optimized", expectedOwnedStage = 0, options = {}) {
  const start = await journeyState(page);
  const startMoves = start.moves;
  let swaps = 0;
  let attempts = 0;
  await expectGreenhouseOwned(page, expectedOwnedStage, `${label} round ${round} before swaps`);
  while (true) {
    const state = await journeyState(page);
    if (state.roundComplete) {
      if (options.captureOwnedRenewal) {
        const firstPhase = options.reducedMotion ? "acknowledgment" : "transfer";
        await page.waitForFunction((phase) => (
          document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === phase
        ), firstPhase, { timeout: 3500 });
        await page.waitForTimeout(options.reducedMotion ? 80 : 460);
        await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        if (!options.reducedMotion && [1, 3].includes(round)) {
          await page.screenshot({ path: `${options.evidencePrefix}-round${round}-transfer.png`, fullPage: true });
        }
        if (!options.reducedMotion) {
          await page.waitForFunction(() => (
            document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === "renewal"
          ), null, { timeout: 2200 });
          await page.waitForTimeout(420);
          await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        }
        if ([1, 3].includes(round)) {
          await page.screenshot({
            path: `${options.evidencePrefix}-round${round}-${options.reducedMotion ? "acknowledgment" : "peak"}.png`,
            fullPage: true
          });
        }
        await page.waitForFunction(() => (
          document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === "settled"
        ), null, { timeout: 2500 });
      }
      // Round 1 now requires a deliberate Black Candle activation before the
      // normal coin ceremony. Sample completion economy where the player can
      // act on it rather than during the activation resolution.
      if (round === 1) {
        await page.locator("#roundOneRestoration").waitFor({ state: "visible", timeout: 3000 });
      }
      const settledState = await journeyState(page);
      const summary = {
        round,
        startMoves,
        movesLeft: settledState.moves,
        swaps: startMoves - settledState.moves,
        bouquet: settledState.bouquet,
        greenhouse: settledState.greenhouse,
        cue: settledState.cue
      };
      await page.screenshot({ path: `work/first-three-${label}-round${round}-complete.png`, fullPage: true });
      return summary;
    }
    expect(state.moves, `${label} round ${round} has moves remaining`).toBeGreaterThan(0);
    await clickGuidedSwap(page, strategy);
    await expectGreenhouseOwned(page, expectedOwnedStage, `${label} round ${round} after swap ${swaps + 1}`);
    attempts += 1;
    swaps = startMoves - (await journeyState(page)).moves;
    expect(attempts, `${label} round ${round} should not drag`).toBeLessThanOrEqual(10);
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

  const results = await playFocusedCycle(page, config, runLabel, strategy);

  const finalState = await journeyState(page);
  expect(finalState.round).toBe(1);
  expect(finalState.coins).toBe(50);
  expect(finalState.focusedEconomyVersion).toBe(2);
  expect(finalState.tiles).toBe(64);
  expect(finalState.overflowX).toBe(false);
  expect(finalState.brokenImages).toEqual([]);
  await expectPermanentRaisedGreenhouse(page, `${runLabel} replay handoff ownership`);
  await page.screenshot({ path: `work/first-three-${runLabel}-replay.png`, fullPage: true });
  expect(consoleMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  return { runLabel, results };
}

async function playFocusedCycle(page, config, runLabel, strategy, options = {}) {
  const results = [];
  for (let round = 1; round <= 3; round += 1) {
    const expectedOwnedBeforeSpend = round - 1;
    const startCoins = (await journeyState(page)).coins;
    await expectVisibleCoinBalance(page, startCoins);
    await expectGreenhouseOwned(page, expectedOwnedBeforeSpend, `${runLabel} round ${round} active start`);
    const result = await playCurrentRound(page, runLabel, round, strategy, expectedOwnedBeforeSpend);
    await expectGreenhouseOwned(page, expectedOwnedBeforeSpend, `${runLabel} round ${round} pending reward`);
    const earnedCoins = (await journeyState(page)).coins;
    await expectVisibleCoinBalance(page, earnedCoins, { pulsing: true });
    const firstAction = await spendPrimaryCeremonyAction(page);
    const spentState = await journeyState(page);
    await expectGreenhouseOwned(page, round, `${runLabel} round ${round} immediately after spend`);
    await expectVisibleCoinBalance(page, spentState.coins, { pulsing: true });
    result.balances = [startCoins, earnedCoins, spentState.coins];

    if (round === 3 && options.evidencePrefix) {
      expect(spentState.payoffTransaction).toBe(`Raised for 180. ${spentState.coins} coins remain.`);
      expect(spentState.payoffCopy).toBe("Begin a new growing cycle with your balance intact.");
      expect(spentState.visibleButtons).toEqual(["Play Again → First Bouquet"]);
      await expect(page.getByRole("button", { name: "Play Again → First Bouquet", exact: true })).toBeFocused();
      const transactionBox = await page.locator("#payoffTransaction").boundingBox();
      expect((transactionBox?.y || 0) + (transactionBox?.height || 0)).toBeLessThanOrEqual(config.viewport.height);
      await page.screenshot({ path: `${options.evidencePrefix}-owned-balance.png`, fullPage: true });
    }
    if (round === 1 && options.verifyRestoredRoundOne) {
      const expectedRestoredCoins = startCoins + 20;
      expect(spentState.coins).toBe(expectedRestoredCoins);
      await page.screenshot({ path: `${options.evidencePrefix}-round1-restored-${expectedRestoredCoins}.png`, fullPage: true });
      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.locator(".tile")).toHaveCount(64);
        const reloaded = await journeyState(page);
        expect(reloaded.coins, `replayed Round 1 reload ${reload + 1}`).toBe(expectedRestoredCoins);
        expect(reloaded.focusedEconomyVersion).toBe(2);
        expect(reloaded.payoffTransaction).toBe(`Restored for 100. ${expectedRestoredCoins} coins remain.`);
        expect(reloaded.visibleButtons).toEqual(["Next Order → Moonlit Wreath"]);
        await expectGreenhouseOwned(page, 1, `${runLabel} round 1 restored reload ${reload + 1}`);
      }
    }

    if (round === 3 && options.stopBeforeReplay) {
      result.actions = [firstAction];
      results.push(result);
      break;
    }
    const secondAction = await spendPrimaryCeremonyAction(
      page,
      round === 3 ? options.replayActivation : "pointer"
    );
    const advancedCoins = (await journeyState(page)).coins;
    await expectGreenhouseOwned(page, round === 3 ? 3 : round, `${runLabel} round ${round} after primary next action`);
    if (round === 3) {
      await page.waitForFunction(() => !document.querySelector("#coinBalance")?.classList.contains("balance-pulse"));
    }
    await expectVisibleCoinBalance(page, advancedCoins, { pulsing: round === 3 ? false : undefined });
    result.balances.push(advancedCoins);
    result.actions = [firstAction, secondAction];
    results.push(result);
    if (round < 3) {
      await expect(page.locator(".tile")).toHaveCount(64);
      await assertActiveBoard(page, config.mobile);
      await expectGreenhouseOwned(page, round, `${runLabel} round ${round + 1} active handoff`);
    }
  }
  return results;
}

async function reloadAndExpectActiveReplayBalance(page, config, expectedCoins) {
  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const state = await journeyState(page);
    expect(state.round).toBe(1);
    expect(state.roundComplete).toBe(false);
    expect(state.coins).toBe(expectedCoins);
    expect(state.focusedEconomyVersion).toBe(2);
    expect(state.handoffCueVisible, `replay reload ${reload + 1} does not resurrect renewal cue`).toBe(false);
    expect(state.hintedTiles, `replay reload ${reload + 1} keeps one guided pair`).toBe(2);
    expect(state.cue, `replay reload ${reload + 1} has one clear instruction`).toMatch(/Thorn Rose next|Swap the glowing pair/);
    await expectVisibleCoinBalance(page, expectedCoins, { pulsing: false });
    await expectPermanentRaisedGreenhouse(page, `replay reload ${reload + 1}`);
    await assertActiveBoard(page, config.mobile);
  }
}

async function failAndRetryOwnedReplayRoundOne(page, config, expectedCoins, runLabel) {
  await page.evaluate(({ key, coins }) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(state, {
      currentRound: 1,
      roundComplete: false,
      moves: 0,
      counts: [0, 6, 0, 0, 0, 5],
      coins,
      roundOneRestored: true,
      roundTwoGreenhouseUpgraded: true,
      roundThreeConservatoryRaised: true,
      tutorialSkipped: true,
      tutorialActive: false,
      blackCandleLessonComplete: true
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, coins: expectedCoins });

  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".tile")).toHaveCount(64);
    const failed = await journeyState(page);
    expect(failed.round).toBe(1);
    expect(failed.roundComplete).toBe(false);
    expect(failed.moves).toBe(0);
    expect(failed.coins).toBe(expectedCoins);
    expect(failed.visibleButtons).toEqual(["Retry Bouquet"]);
    expect(failed.ownedRenewalHidden, "failure has no owned-renewal overlay").toBe(true);
    expect(failed.ownedRenewalTransientNodes, "failure has no owned-renewal debris").toBe(0);
    await expectPermanentRaisedGreenhouse(page, `${runLabel} failed replay reload ${reload + 1}`);
    await expectVisibleCoinBalance(page, expectedCoins, { pulsing: false });
    await assertActiveBoard(page, config.mobile);
  }

  const retryButton = page.getByRole("button", { name: "Retry Bouquet", exact: true });
  if (config.mobile) {
    await retryButton.tap();
  } else {
    await retryButton.click();
  }
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".tile")).every((tile) => !tile.disabled), null, {
    timeout: 5000
  });
  const retried = await journeyState(page);
  expect(retried.round).toBe(1);
  expect(retried.roundComplete).toBe(false);
  expect(retried.moves).toBe(6);
  expect(retried.counts).toEqual([0, 0, 0, 0, 0, 0]);
  expect(retried.coins).toBe(expectedCoins);
  expect(retried.hintedTiles).toBe(2);
  expect(retried.visibleButtons).not.toContain("Retry Bouquet");
  expect(retried.ownedRenewalHidden, "Retry clears owned-renewal overlay").toBe(true);
  expect(retried.ownedRenewalTransientNodes, "Retry clears owned-renewal debris").toBe(0);
  await expectPermanentRaisedGreenhouse(page, `${runLabel} retried replay`);
  await assertActiveBoard(page, config.mobile);
}

async function playOwnedReplayCycle(page, config, runLabel, strategy) {
  const expectedStarts = [50, 170, 320];
  const expectedRewards = [120, 150, 180];
  const expectedActions = [
    "Next Order → Moonlit Wreath",
    "Next Order → Bloodroot Compact",
    "Play Again → First Bouquet"
  ];
  const expectedSettledCues = ["Tap Next Order.", "Tap Next Order.", "Play again."];
  const expectedTitles = [
    "First Bouquet Complete",
    "Moonlit Wreath Complete",
    "Bloodroot Compact Complete"
  ];
  const expectedNames = ["First Bouquet", "Moonlit Wreath", "Bloodroot Compact"];
  const expectedCompositions = [
    [5, 1, 5, 1, 5, 1],
    [2, 4, 5, 2, 4, 5],
    [3, 0, 3, 0, 3, 0]
  ];
  const expectedTargetCounts = ["5:8,1:6", "2:10,4:9,5:7", "3:14,0:13"];
  const expectedCopies = [
    "Bouquet complete. The raised conservatory remains yours.",
    "Bouquet complete. The raised conservatory remains yours.",
    "Bouquet complete. The raised conservatory remains yours."
  ];
  const results = [];

  for (let round = 1; round <= 3; round += 1) {
    const startCoins = (await journeyState(page)).coins;
    expect(startCoins, `${runLabel} round ${round} starting wallet`).toBe(expectedStarts[round - 1]);
    await expectVisibleCoinBalance(page, startCoins);
    await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} active start`);
    await installOwnedRenewalRecorder(page);
    let result;
    let renewalSamples;
    try {
      result = await playCurrentRound(page, runLabel, round, strategy, 3, {
        captureOwnedRenewal: true,
        reducedMotion: config.reducedMotion,
        evidencePrefix: `work/replay-renewal-${config.label}`
      });
    } finally {
      renewalSamples = await collectOwnedRenewalRecorder(page);
    }
    const bindingSampleIndex = renewalSamples.findIndex((sample) => sample.phase === "binding");
    expect(bindingSampleIndex, `${runLabel} round ${round} recorder started before authoritative completion`).toBeGreaterThanOrEqual(0);
    const phaseSamples = renewalSamples.slice(bindingSampleIndex).filter((sample) => sample.phase);
    const phases = [...new Set(phaseSamples.map((sample) => sample.phase))];
    expect(phases, `${runLabel} round ${round} bounded renewal phases`).toEqual(config.reducedMotion
      ? ["binding", "acknowledgment", "settled"]
      : ["binding", "transfer", "renewal", "settled"]);
    const transientSamples = phaseSamples.filter((sample) => sample.phase !== "settled");
    expect(transientSamples.length, `${runLabel} round ${round} sampled transient ceremony`).toBeGreaterThan(0);
    expect(
      transientSamples.every((sample) => !/Next Order|Play again/i.test(sample.topCue)),
      `${runLabel} round ${round} transient cue never offers the settled action`
    ).toBe(true);
    expect(
      phaseSamples.filter((sample) => sample.phase === "binding")
        .every((sample) => sample.topCue === "Bouquet bound."),
      `${runLabel} round ${round} binding cue follows the bouquet`
    ).toBe(true);
    expect(
      phaseSamples.filter((sample) => ["transfer", "renewal", "acknowledgment"].includes(sample.phase))
        .every((sample) => sample.topCue === "Nourishing conservatory."),
      `${runLabel} round ${round} tending cue follows the greenhouse`
    ).toBe(true);
    expect(transientSamples.every((sample) => sample.actionCount === 0), "no action during binding/renewal").toBe(true);
    expect(transientSamples.every((sample) => !sample.transactionVisible), "reward display waits for renewal").toBe(true);
    expect(transientSamples.every((sample) => sample.raisedArtVisible && !sample.lowerArtVisible), "raised art remains truthful").toBe(true);
    const ingredientSamples = phaseSamples.filter((sample) => ["transfer", "renewal", "acknowledgment"].includes(sample.phase));
    expect(ingredientSamples.length, `${runLabel} round ${round} sampled authoritative ingredient transfer`).toBeGreaterThan(0);
    expect(ingredientSamples.every((sample) => JSON.stringify(sample.ingredientIds) === JSON.stringify(expectedCompositions[round - 1])), "transfer follows trophy composition").toBe(true);
    expect(ingredientSamples.every((sample) => sample.ingredientImagesLoaded), "transfer images load local pixels").toBe(true);
    expect(ingredientSamples.every((sample) => sample.transientNodes === 10), "renewal node count stays fixed and bounded").toBe(true);
    expect(ingredientSamples.some((sample) => sample.responseVisible), "owned greenhouse gives one visible renewal response").toBe(true);
    const firstTransientAt = transientSamples[0].at;
    const settledSample = phaseSamples.find((sample) => sample.phase === "settled");
    const completionSample = renewalSamples.find((sample) => sample.roundComplete);
    expect(completionSample, `${runLabel} round ${round} records authoritative completion`).toBeTruthy();
    const completionToAction = settledSample.at - completionSample.at;
    expect(
      completionToAction,
      `${runLabel} round ${round} completion-to-action stays inside the focused pacing contract`
    ).toBeLessThanOrEqual(config.reducedMotion ? 700 : 2400);
    if (!config.reducedMotion) {
      const transferSample = phaseSamples.find((sample) => sample.phase === "transfer");
      const intakeDuration = settledSample.at - transferSample.at;
      expect(
        intakeDuration,
        `${runLabel} round ${round} ingredient transfer and greenhouse response remain readable`
      ).toBeGreaterThanOrEqual(900);
      expect(
        intakeDuration,
        `${runLabel} round ${round} ingredient transfer and greenhouse response stay concise`
      ).toBeLessThanOrEqual(1300);
      result.ownedRenewalTiming = {
        completionToAction: Math.round(completionToAction),
        intakeDuration: Math.round(intakeDuration)
      };
    } else {
      result.ownedRenewalTiming = {
        completionToAction: Math.round(completionToAction)
      };
    }
    expect(settledSample.topCue, `${runLabel} round ${round} settled action cue returns`).toBe(expectedSettledCues[round - 1]);
    expect(settledSample.transientNodes, "settled ceremony removes all transient descendants").toBe(0);
    expect(settledSample.renewalHidden, "settled ceremony hides transient host").toBe(true);
    const rewardBalance = startCoins + expectedRewards[round - 1];
    const ceremony = await journeyState(page);
    expect(ceremony.coins, `${runLabel} round ${round} reward credited once`).toBe(rewardBalance);
    expect(ceremony.payoffTransaction).toBe(`Reward added · +${expectedRewards[round - 1]} coins · ${rewardBalance} coins balance.`);
    expect(ceremony.payoffCopy).toBe(expectedCopies[round - 1]);
    expect(ceremony.payoffMode).toBe("owned-replay");
    expect(ceremony.tutorial).toBe(expectedSettledCues[round - 1]);
    expect(ceremony.ownedRenewalPhase).toBe("settled");
    expect(ceremony.ownedRenewalHidden).toBe(true);
    expect(ceremony.ownedRenewalTransientNodes).toBe(0);
    expect(ceremony.restorationTitle).toBe(expectedTitles[round - 1]);
    expect(ceremony.trophyKicker).toBe("Bouquet Complete");
    expect(ceremony.trophyName).toBe(expectedNames[round - 1]);
    expect(ceremony.trophyCopy).toBe("Order complete. The Bloodroot Conservatory remains fully raised.");
    expect(ceremony.craftedComposition).toEqual(expectedCompositions[round - 1]);
    expect(ceremony.craftedTargetCounts).toBe(expectedTargetCounts[round - 1]);
    expect(ceremony.restorationState).toBe("BLOODROOT CONSERVATORY · OWNED · 100% RAISED");
    expect(ceremony.restorationSceneLabel).toBe("Owned Bloodroot Conservatory remains fully raised");
    expect(ceremony.restorationSceneArt).toBe("bloodroot");
    expect(ceremony.restoredSceneArt).toContain("bloodroot_compact_greenhouse.jpg");
    expect(ceremony.witheredSceneArtVisible, "owned replay suppresses lower-stage art").toBe(false);
    expect(ceremony.restoredSceneArtVisible, "owned replay shows raised art").toBe(true);
    expect(ceremony.visibleTransformationLabels, "owned replay has no before/after treatment").toEqual([]);
    expect(ceremony.ceremonyText).not.toMatch(/Greenhouse Restored|Greenhouse Relit|\bBefore\b|\bAfter\b|Restore Greenhouse|Upgrade Greenhouse|Raise Conservatory/i);
    expect(ceremony.visibleButtons).toEqual([expectedActions[round - 1]]);
    expect(ceremony.ceremonyBottom, "owned ceremony fits the first viewport").toBeLessThanOrEqual(config.viewport.height);
    expect(ceremony.transactionBottom, "owned transaction fits the first viewport").toBeLessThanOrEqual(config.viewport.height);
    expect(ceremony.actionBottom, "owned action fits the first viewport").toBeLessThanOrEqual(config.viewport.height);
    await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} owned ceremony`);
    await expectVisibleCoinBalance(page, rewardBalance, { pulsing: !config.reducedMotion });
    await page.screenshot({ path: `work/economy-${config.label}-cycle2-round${round}-owned.png`, fullPage: true });

    for (let reload = 0; reload < 2; reload += 1) {
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".tile")).toHaveCount(64);
      const reloaded = await journeyState(page);
      expect(reloaded.coins, `${runLabel} round ${round} reward reload ${reload + 1}`).toBe(rewardBalance);
      expect(reloaded.payoffTransaction).toBe(`Reward added · +${expectedRewards[round - 1]} coins · ${rewardBalance} coins balance.`);
      expect(reloaded.payoffCopy).toBe(expectedCopies[round - 1]);
      expect(reloaded.payoffMode).toBe("owned-replay");
      expect(reloaded.tutorial).toBe(expectedSettledCues[round - 1]);
      expect(reloaded.ownedRenewalPhase).toBe("settled");
      expect(reloaded.ownedRenewalHidden).toBe(true);
      expect(reloaded.ownedRenewalTransientNodes).toBe(0);
      expect(reloaded.restorationTitle).toBe(expectedTitles[round - 1]);
      expect(reloaded.trophyKicker).toBe("Bouquet Complete");
      expect(reloaded.trophyName).toBe(expectedNames[round - 1]);
      expect(reloaded.trophyCopy).toBe("Order complete. The Bloodroot Conservatory remains fully raised.");
      expect(reloaded.craftedComposition).toEqual(expectedCompositions[round - 1]);
      expect(reloaded.craftedTargetCounts).toBe(expectedTargetCounts[round - 1]);
      expect(reloaded.restorationState).toBe("BLOODROOT CONSERVATORY · OWNED · 100% RAISED");
      expect(reloaded.restorationSceneArt).toBe("bloodroot");
      expect(reloaded.restoredSceneArt).toContain("bloodroot_compact_greenhouse.jpg");
      expect(reloaded.witheredSceneArtVisible).toBe(false);
      expect(reloaded.restoredSceneArtVisible).toBe(true);
      expect(reloaded.visibleTransformationLabels).toEqual([]);
      expect(reloaded.ceremonyText).not.toMatch(/Greenhouse Restored|Greenhouse Relit|\bBefore\b|\bAfter\b|Restore Greenhouse|Upgrade Greenhouse|Raise Conservatory/i);
      expect(reloaded.visibleButtons).toEqual([expectedActions[round - 1]]);
      expect(reloaded.ceremonyBottom).toBeLessThanOrEqual(config.viewport.height);
      expect(reloaded.transactionBottom).toBeLessThanOrEqual(config.viewport.height);
      expect(reloaded.actionBottom).toBeLessThanOrEqual(config.viewport.height);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} ceremony reload ${reload + 1}`);
      await expectVisibleCoinBalance(page, rewardBalance, { pulsing: false });
    }

    result.balances = [startCoins, rewardBalance, rewardBalance];
    result.actions = [expectedActions[round - 1]];
    results.push(result);
    if (round < 3) {
      const action = await spendPrimaryCeremonyAction(
        page,
        config.mobile ? "touch" : round === 2 ? "keyboard" : "pointer"
      );
      expect(action).toBe(expectedActions[round - 1]);
      const advanced = await journeyState(page);
      expect(advanced.coins).toBe(rewardBalance);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round + 1} active handoff`);
      await assertActiveBoard(page, config.mobile);
    }
  }
  return results;
}

async function completeOwnedRoundAndReloadDuringPhase(page, config, runLabel, round, phase, strategy) {
  const start = await journeyState(page);
  const startMoves = start.moves;
  let attempts = 0;
  while (!(await journeyState(page)).roundComplete) {
    expect((await journeyState(page)).moves, `${runLabel} round ${round} has moves remaining`).toBeGreaterThan(0);
    await clickGuidedSwap(page, strategy);
    attempts += 1;
    expect(attempts, `${runLabel} round ${round} interruption path should not drag`).toBeLessThanOrEqual(10);
  }

  await page.waitForFunction((expectedPhase) => (
    document.querySelector("#roundOneRestoration")?.dataset.ownedRenewalPhase === expectedPhase
  ), phase, { timeout: 2500 });
  await page.waitForTimeout(32);
  const interrupted = await journeyState(page);
  expect(interrupted.roundComplete).toBe(true);
  expect(interrupted.ownedRenewalPhase).toBe(phase);
  expect(interrupted.visibleButtons, `${runLabel} round ${round} ${phase} withholds action`).toEqual([]);
  expect(interrupted.payoffTransaction).toBe(`Reward added · +${[120, 150, 180][round - 1]} coins · ${interrupted.coins} coins balance.`);
  await page.screenshot({
    path: `work/replay-renewal-${config.label}-round${round}-${phase}-interrupted.png`,
    fullPage: true
  });

  const interruptedCoins = interrupted.coins;
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".tile")).toHaveCount(64);
  const reloaded = await journeyState(page);
  expect(reloaded.round).toBe(round);
  expect(reloaded.roundComplete).toBe(true);
  expect(reloaded.coins, `${runLabel} round ${round} ${phase} reload does not duplicate reward`).toBe(interruptedCoins);
  expect(reloaded.ownedRenewalPhase).toBe("settled");
  expect(reloaded.ownedRenewalHidden).toBe(true);
  expect(reloaded.ownedRenewalTransientNodes).toBe(0);
  expect(reloaded.visibleButtons).toEqual([
    round === 1
      ? "Next Order → Moonlit Wreath"
      : round === 2
        ? "Next Order → Bloodroot Compact"
        : "Play Again → First Bouquet"
  ]);
  expect(reloaded.brokenImages).toEqual([]);
  expect(reloaded.overflowX).toBe(false);
  await expect(page.locator("#roundOneRestoration button:not([hidden])")).toBeFocused();
  await expectPermanentRaisedGreenhouse(page, `${runLabel} round ${round} ${phase} settled reload`);
  return {
    round,
    phase,
    startMoves,
    movesLeft: reloaded.moves,
    coins: interruptedCoins
  };
}

async function assertActiveBoard(page, mobile) {
  const state = await journeyState(page);
  expect(state.tiles).toBe(64);
  expect(state.tileRows).toBe(8);
  expect(state.overflowX).toBe(false);
  expect(state.brokenImages).toEqual([]);
  expect(state.mobilePlinthVisible, "active mobile plinth hidden").toBe(false);
  expect(state.coinBalanceVisible).toBe(true);
  expect(state.coinBalanceInsideProgress).toBe(true);
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
      expect(results[0].movesLeft, "Round 1 preserves one move after the taught activation").toBeGreaterThanOrEqual(1);
      expect(results[0].movesLeft, "Round 1 no longer has a huge move cushion").toBeLessThanOrEqual(4);
      expect(results[1].movesLeft, "Round 2 leaves a fair cushion").toBeGreaterThanOrEqual(1);
      expect(results[1].movesLeft, "Round 2 handles cascade variance").toBeLessThanOrEqual(5);
      expect(results[2].movesLeft, "Round 3 leaves a fair cushion").toBeGreaterThanOrEqual(1);
      expect(results[2].movesLeft, "Round 3 handles cascade variance").toBeLessThanOrEqual(5);
      expect(results[0].swaps, "Round 1 can finish quickly but still requires real swaps").toBeGreaterThanOrEqual(2);
      expect(results[0].swaps, "Round 1 tutorial does not drag").toBeLessThanOrEqual(5);
      expect(results[1].swaps, "Round 2 takes several real swaps").toBeGreaterThanOrEqual(4);
      expect(results[1].swaps, "Round 2 closes before the Moonlit Wreath path drags").toBeLessThanOrEqual(7);
      expect(results[2].swaps, "Round 3 takes real swaps").toBeGreaterThanOrEqual(2);
      expect(results[2].swaps, "Round 3 stays inside the focused fairness envelope").toBeLessThanOrEqual(6);
      expect(results[0].actions).toEqual(["Restore Greenhouse · 100 coins", "Next Order → Moonlit Wreath"]);
      expect(results[1].actions).toEqual(["Upgrade Greenhouse · 120 coins", "Next Order → Bloodroot Compact"]);
      expect(results[2].actions).toEqual(["Raise Conservatory · 180 coins", "Play Again → First Bouquet"]);

    });
  }

  for (const seed of GOAL_FOLLOWING_SEEDS) {
    test(`goal-following first-three journey completes on ${config.label} with ${seed}`, async ({ page }) => {
      const { runLabel, results } = await playFirstThree(page, config, seed, "goal-following");
      console.log(`${runLabel} first-three journey: ${JSON.stringify(results)}`);
      expect(results[0].swaps, "Round 1 goal-following tutorial does not drag").toBeLessThanOrEqual(5);
      expect(results[1].movesLeft, "Round 2 goal-following play completes").toBeGreaterThanOrEqual(0);
      expect(results[2].movesLeft, "Round 3 goal-following play completes").toBeGreaterThanOrEqual(0);
      expect(results[0].actions).toEqual(["Restore Greenhouse · 100 coins", "Next Order → Moonlit Wreath"]);
      expect(results[1].actions).toEqual(["Upgrade Greenhouse · 120 coins", "Next Order → Bloodroot Compact"]);
      expect(results[2].actions).toEqual(["Raise Conservatory · 180 coins", "Play Again → First Bouquet"]);
    });
  }

  test(`focused economy closes across two full cycles on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();
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

    try {
      const runLabel = `${config.label}-two-cycle-vesper-thorn`;
      await openFresh(page, "vesper-thorn", runLabel);
      expect((await journeyState(page)).coins).toBe(0);

      const firstCycle = await playFocusedCycle(page, config, `${runLabel}-cycle1`, "goal-following", {
        evidencePrefix: `work/economy-${config.label}-cycle1`,
        replayActivation: config.mobile ? "touch" : "pointer"
      });
      expect(firstCycle.map((round) => round.balances)).toEqual([
        [0, 120, 20, 20],
        [20, 170, 50, 50],
        [50, 230, 50, 50]
      ]);
      const replayHandoff = await journeyState(page);
      expect(replayHandoff.coins).toBe(50);
      expect(replayHandoff.handoffCueVisible).toBe(true);
      expect(replayHandoff.handoffCue).toBe("Greenhouse Renewal · First Bouquet · 50 coins carried forward");
      expect(replayHandoff.hintedTiles).toBe(2);
      expect(replayHandoff.reducedMotion).toBe(false);
      expect(replayHandoff.tiles).toBe(64);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} first replay handoff`);
      if (config.mobile) {
        expect(replayHandoff.boardBottom).toBeLessThanOrEqual(config.viewport.height);
        expect(replayHandoff.handoffCueBottom).toBeLessThanOrEqual(config.viewport.height);
      }
      await expect(page.locator(".tile[tabindex='0']")).toHaveCount(1);
      await expect(page.locator(".tile[tabindex='0']")).toBeFocused();
      await page.screenshot({ path: `work/replay-handoff-${config.label}.png`, fullPage: true });

      await reloadAndExpectActiveReplayBalance(page, config, 50);
      await page.screenshot({ path: `work/replay-active-reload-${config.label}.png`, fullPage: true });
      await failAndRetryOwnedReplayRoundOne(page, config, 50, runLabel);
      const retryReady = await journeyState(page);
      const replayTargetProgress = retryReady.counts[5] + retryReady.counts[1];
      await clickGuidedSwap(page, "goal-following");
      const afterReplaySwap = await journeyState(page);
      expect(afterReplaySwap.moves).toBe(retryReady.moves - 1);
      expect(afterReplaySwap.counts[5] + afterReplaySwap.counts[1], "replay guide harvests a First Bouquet target")
        .toBeGreaterThan(replayTargetProgress);
      expect(afterReplaySwap.coins).toBe(50);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} replay after first swap`);
      expect(afterReplaySwap.handoffCueVisible).toBe(false);
      await expect(page.locator("#nextOrderCue")).toBeHidden();

      const secondCycle = await playOwnedReplayCycle(page, config, `${runLabel}-cycle2`, "goal-following");
      expect(secondCycle.map((round) => round.balances)).toEqual([
        [50, 170, 170],
        [170, 320, 320],
        [320, 500, 500]
      ]);
      const finalState = await journeyState(page);
      expect(finalState.coins).toBe(500);
      expect(finalState.payoffTransaction).toBe("Reward added · +180 coins · 500 coins balance.");
      expect(finalState.payoffCopy).toBe("Bouquet complete. The raised conservatory remains yours.");
      expect(finalState.visibleButtons).toEqual(["Play Again → First Bouquet"]);
      await expectPermanentRaisedGreenhouse(page, `${runLabel} second-cycle final ceremony`);
      expect(finalState.overflowX).toBe(false);
      expect(finalState.brokenImages).toEqual([]);

      const secondReplayAction = await spendPrimaryCeremonyAction(page, config.mobile ? "touch" : "pointer");
      expect(secondReplayAction).toBe("Play Again → First Bouquet");
      const secondReplayHandoff = await journeyState(page);
      expect(secondReplayHandoff.coins).toBe(500);
      expect(secondReplayHandoff.handoffCueVisible).toBe(true);
      expect(secondReplayHandoff.handoffCue).toBe("Greenhouse Renewal · First Bouquet · 500 coins carried forward");
      await expectPermanentRaisedGreenhouse(page, `${runLabel} second replay handoff`);
      await page.screenshot({ path: `work/replay-second-handoff-${config.label}.png`, fullPage: true });
      await reloadAndExpectActiveReplayBalance(page, config, 500);
      const secondReplayReady = await journeyState(page);
      expect(secondReplayReady.coins).toBe(500);
      await page.screenshot({ path: `work/replay-second-active-reload-${config.label}.png`, fullPage: true });
      console.log(`${runLabel} balance and renewal traces: ${JSON.stringify({
        firstCycle: firstCycle.map((round) => round.balances),
        secondCycle: secondCycle.map((round) => round.balances),
        renewalTiming: secondCycle.map((round) => round.ownedRenewalTiming)
      })}`);
      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test(`owned replay transient reloads settle atomically on ${config.label}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: config.viewport,
      hasTouch: config.mobile,
      isMobile: config.mobile,
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      const runLabel = `${config.label}-owned-replay-transient-reload`;
      await openFresh(page, "vesper-thorn", runLabel);
      const firstCycle = await playFocusedCycle(page, config, `${runLabel}-cycle1`, "goal-following", {
        replayActivation: config.mobile ? "touch" : "pointer"
      });
      expect(firstCycle.map((round) => round.balances)).toEqual([
        [0, 120, 20, 20],
        [20, 170, 50, 50],
        [50, 230, 50, 50]
      ]);

      const phases = ["binding", "transfer", "renewal"];
      const expectedBalances = [170, 320, 500];
      const interruptions = [];
      for (let round = 1; round <= 3; round += 1) {
        const interrupted = await completeOwnedRoundAndReloadDuringPhase(
          page,
          config,
          runLabel,
          round,
          phases[round - 1],
          "goal-following"
        );
        expect(interrupted.coins).toBe(expectedBalances[round - 1]);
        interruptions.push(interrupted);
        if (round < 3) {
          await spendPrimaryCeremonyAction(page, config.mobile ? "touch" : "pointer");
          await assertActiveBoard(page, config.mobile);
        }
      }
      console.log(`${runLabel} interruption trace: ${JSON.stringify(interruptions)}`);
      expect(consoleMessages).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("reduced-motion exact-mobile replay boundary preserves the owned wallet", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
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

  try {
    const config = { label: "mobile390-reduced", viewport: { width: 390, height: 844 }, mobile: true, reducedMotion: true };
    await openFresh(page, "vesper-thorn", "reduced-motion-replay-boundary");
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      Object.assign(state, {
        currentRound: 3,
        roundComplete: true,
        roundOneRestored: true,
        roundTwoGreenhouseUpgraded: true,
        roundThreeConservatoryRaised: true,
        moves: 2,
        coins: 50,
        counts: [13, 0, 0, 14, 0, 0],
        cursedThorns: [],
        clearedCursedThorns: 0,
        tutorialSkipped: true,
        tutorialActive: false,
        blackCandleLessonComplete: true
      });
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload({ waitUntil: "networkidle" });
    const finalCeremony = await journeyState(page);
    expect(finalCeremony.coins).toBe(50);
    expect(finalCeremony.payoffTransaction).toBe("Raised for 180. 50 coins remain.");
    expect(finalCeremony.visibleButtons).toEqual(["Play Again → First Bouquet"]);
    await expectGreenhouseOwned(page, 3, "reduced-motion first-cycle final ceremony");
    await page.screenshot({ path: "work/replay-final-mobile390-reduced.png", fullPage: true });

    await spendPrimaryCeremonyAction(page, "touch");
    const handoff = await journeyState(page);
    expect(handoff.reducedMotion).toBe(true);
    expect(handoff.coins).toBe(50);
    expect(handoff.handoffCueVisible).toBe(true);
    expect(handoff.handoffCue).toBe("Greenhouse Renewal · First Bouquet · 50 coins carried forward");
    expect(handoff.tiles).toBe(64);
    expect(handoff.tileRows).toBe(8);
    expect(handoff.boardBottom).toBeLessThanOrEqual(844);
    expect(handoff.handoffCueBottom).toBeLessThanOrEqual(844);
    expect(handoff.overflowX).toBe(false);
    expect(handoff.brokenImages).toEqual([]);
    await expectPermanentRaisedGreenhouse(page, "reduced-motion first replay handoff");
    await page.screenshot({ path: "work/replay-handoff-mobile390-reduced.png", fullPage: true });

    await reloadAndExpectActiveReplayBalance(page, config, 50);
    await page.screenshot({ path: "work/replay-active-reload-mobile390-reduced.png", fullPage: true });

    const reducedReplay = await playOwnedReplayCycle(
      page,
      config,
      "mobile390-reduced-natural-cycle2",
      "goal-following"
    );
    expect(reducedReplay.map((round) => round.balances)).toEqual([
      [50, 170, 170],
      [170, 320, 320],
      [320, 500, 500]
    ]);
    console.log(`mobile390-reduced renewal timing: ${JSON.stringify(reducedReplay.map((round) => round.ownedRenewalTiming))}`);
    const secondFinal = await journeyState(page);
    expect(secondFinal.coins).toBe(500);
    expect(secondFinal.payoffTransaction).toBe("Reward added · +180 coins · 500 coins balance.");
    expect(secondFinal.payoffMode).toBe("owned-replay");
    expect(secondFinal.restorationTitle).toBe("Bloodroot Compact Complete");
    expect(secondFinal.trophyKicker).toBe("Bouquet Complete");
    expect(secondFinal.trophyCopy).toBe("Order complete. The Bloodroot Conservatory remains fully raised.");
    expect(secondFinal.restorationState).toBe("BLOODROOT CONSERVATORY · OWNED · 100% RAISED");
    expect(secondFinal.restorationSceneArt).toBe("bloodroot");
    expect(secondFinal.restoredSceneArt).toContain("bloodroot_compact_greenhouse.jpg");
    expect(secondFinal.witheredSceneArtVisible).toBe(false);
    expect(secondFinal.restoredSceneArtVisible).toBe(true);
    expect(secondFinal.visibleTransformationLabels).toEqual([]);
    expect(secondFinal.ceremonyText).not.toMatch(/Greenhouse Restored|Greenhouse Relit|\bBefore\b|\bAfter\b|Restore Greenhouse|Upgrade Greenhouse|Raise Conservatory/i);
    expect(secondFinal.visibleButtons).toEqual(["Play Again → First Bouquet"]);
    expect(secondFinal.ceremonyBottom).toBeLessThanOrEqual(844);
    expect(secondFinal.transactionBottom).toBeLessThanOrEqual(844);
    expect(secondFinal.actionBottom).toBeLessThanOrEqual(844);
    await expectPermanentRaisedGreenhouse(page, "reduced-motion second-cycle final ceremony");
    await page.screenshot({ path: "work/economy-mobile390-reduced-cycle2-round3-owned.png", fullPage: true });

    await spendPrimaryCeremonyAction(page, "touch");
    const secondHandoff = await journeyState(page);
    expect(secondHandoff.coins).toBe(500);
    expect(secondHandoff.handoffCue).toBe("Greenhouse Renewal · First Bouquet · 500 coins carried forward");
    await expectPermanentRaisedGreenhouse(page, "reduced-motion second replay handoff");
    await page.screenshot({ path: "work/replay-second-handoff-mobile390-reduced.png", fullPage: true });
    await reloadAndExpectActiveReplayBalance(page, config, 500);
    expect(consoleMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  } finally {
    await context.close();
  }
});
